import {getDeployStore,getStore} from '@netlify/blobs';
import sharp from 'sharp';

function cloudTypes(){return[['cirrus','Cirrus','Ci','high'],['cirrocumulus','Cirrocumulus','Cc','high'],['cirrostratus','Cirrostratus','Cs','high'],['altocumulus','Altocumulus','Ac','middle'],['altostratus','Altostratus','As','middle'],['nimbostratus','Nimbostratus','Ns','middle'],['stratocumulus','Stratocumulus','Sc','low'],['stratus','Stratus','St','low'],['cumulus','Cumulus','Cu','vertical'],['cumulonimbus','Cumulonimbus','Cb','vertical']].map(([id,name,code,family])=>({id,name,code,family,level:1}))}
function store(){const production=globalThis.Netlify?.context?.deploy?.context==='production';return production?getStore('cloud-catcher'):getDeployStore('cloud-catcher')}
function empty(){return{format:'cloud-catcher',photos:[],detections:[],albums:[],updatedAt:new Date().toISOString()}}
async function load(){return await store().get('library',{type:'json'})||empty()}
async function save(lib){lib.updatedAt=new Date().toISOString();await store().setJSON('library',lib);return lib}
function authorized(request){const token=globalThis.Netlify?.env?.get?.('CLOUD_CATCHER_API_TOKEN');return Boolean(token)&&request.headers.get('authorization')===`Bearer ${token}`}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const validStatus=s=>['proposed','confirmed','rejected'].includes(s);
const clamp=v=>Math.max(0,Math.min(1,Number(v)));
function normalizeRegion(region){if(!region)return{type:'rect',x:0,y:0,width:1,height:1};if(region.type==='rect'){const x=clamp(region.x),y=clamp(region.y),width=clamp(region.width),height=clamp(region.height);return{type:'rect',x,y,width:Math.min(width,1-x),height:Math.min(height,1-y)}}if(region.type==='polygon'&&Array.isArray(region.points)&&region.points.length>=3)return{type:'polygon',points:region.points.map(([x,y])=>[clamp(x),clamp(y)])};throw new Error('invalid region')}
function bounds(region){if(region.type==='rect')return region;const xs=region.points.map(p=>p[0]),ys=region.points.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys);return{x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y}}
function progress(lib,location=null){const types=cloudTypes();const photos=new Map(lib.photos.map(p=>[p.id,p]));const caught=new Set(lib.detections.filter(d=>d.status==='confirmed').filter(d=>{const p=photos.get(d.photoId);return p&&(!location||p.location.toLowerCase()===location.toLowerCase())}).map(d=>d.cloudTypeId));return{level:1,location,caught:types.filter(c=>caught.has(c.id)).length,required:types.length,complete:types.every(c=>caught.has(c.id)),missingIds:types.filter(c=>!caught.has(c.id)).map(c=>c.id)}}
function parseDataUrl(dataUrl){const m=/^data:([^;]+);base64,(.+)$/.exec(dataUrl||'');if(!m)throw new Error('imageDataUrl must be a base64 data URL');return{mime:m[1],buffer:Buffer.from(m[2],'base64')}}

export default async request=>{
  const url=new URL(request.url);const path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean);const resource=path[0]||'status';const id=path[1];
  if(resource==='status')return json({name:'Cloud Catcher API',mutationsEnabled:Boolean(globalThis.Netlify?.env?.get?.('CLOUD_CATCHER_API_TOKEN'))});
  const types=cloudTypes();
  if(resource==='cloud-types'){const item=id?types.find(c=>c.id===id):types;return item?json(item):json({error:'not found'},404)}
  const lib=await load();
  if(resource==='progress'&&request.method==='GET')return json(progress(lib,url.searchParams.get('location')));
  if(resource==='photos'){
    if(request.method==='GET'){const item=id?lib.photos.find(p=>p.id===id):lib.photos;return item?json(item):json({error:'not found'},404)}
    if(!authorized(request))return json({error:'Mutation API disabled or invalid bearer token'},401);
    if(request.method==='POST'){try{const b=await request.json();const photoId=crypto.randomUUID();let imageRef=b.imageRef||null,width=b.width??null,height=b.height??null;if(b.imageDataUrl){const parsed=parseDataUrl(b.imageDataUrl);const meta=await sharp(parsed.buffer).metadata();width=meta.width??width;height=meta.height??height;await store().set(`images/${photoId}`,parsed.buffer);await store().setJSON(`images/${photoId}.meta`,{mime:parsed.mime});imageRef=`/api/images/${photoId}`}const p={id:photoId,location:b.location||'Unknown',observedAt:b.observedAt||new Date().toISOString(),imageRef,originalName:b.originalName||null,notes:b.notes||'',source:b.source||'api',width,height,createdAt:new Date().toISOString()};lib.photos.push(p);await save(lib);return json(p,201)}catch(e){return json({error:e.message},400)}}
    if(request.method==='DELETE'&&id){lib.photos=lib.photos.filter(p=>p.id!==id);const removed=new Set(lib.detections.filter(d=>d.photoId===id).map(d=>d.id));lib.detections=lib.detections.filter(d=>d.photoId!==id);lib.albums.forEach(a=>a.detectionIds=(a.detectionIds||[]).filter(x=>!removed.has(x)));await store().delete(`images/${id}`);await store().delete(`images/${id}.meta`);await save(lib);return json({deleted:id})}
  }
  if(resource==='detections'){
    if(request.method==='GET'){const items=id?lib.detections.find(d=>d.id===id):lib.detections;return items?json(items):json({error:'not found'},404)}
    if(!authorized(request))return json({error:'Mutation API disabled or invalid bearer token'},401);
    if(request.method==='POST'){try{const b=await request.json();if(!lib.photos.some(p=>p.id===b.photoId))return json({error:'invalid photoId'},400);if(!types.some(c=>c.id===b.cloudTypeId))return json({error:'invalid cloudTypeId'},400);const status=b.status||'proposed';if(!validStatus(status))return json({error:'invalid status'},400);const d={id:crypto.randomUUID(),photoId:b.photoId,cloudTypeId:b.cloudTypeId,confidence:b.confidence==null?null:clamp(b.confidence),region:normalizeRegion(b.region),status,notes:b.notes||'',source:b.source||'api',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};lib.detections.push(d);await save(lib);return json({...d,snippetRef:`/api/snippets/${d.id}`},201)}catch(e){return json({error:e.message},400)}}
    if(request.method==='PATCH'&&id){const b=await request.json();const d=lib.detections.find(x=>x.id===id);if(!d)return json({error:'not found'},404);if(b.cloudTypeId!==undefined){if(!types.some(c=>c.id===b.cloudTypeId))return json({error:'invalid cloudTypeId'},400);d.cloudTypeId=b.cloudTypeId}if(b.status!==undefined){if(!validStatus(b.status))return json({error:'invalid status'},400);d.status=b.status}if(b.confidence!==undefined)d.confidence=b.confidence==null?null:clamp(b.confidence);if(b.region!==undefined)d.region=normalizeRegion(b.region);if(b.notes!==undefined)d.notes=b.notes;d.updatedAt=new Date().toISOString();await save(lib);return json({...d,snippetRef:`/api/snippets/${d.id}`})}
    if(request.method==='DELETE'&&id){lib.detections=lib.detections.filter(d=>d.id!==id);lib.albums.forEach(a=>a.detectionIds=(a.detectionIds||[]).filter(x=>x!==id));await save(lib);return json({deleted:id})}
  }
  if(resource==='images'&&request.method==='GET'&&id){const image=await store().get(`images/${id}`,{type:'arrayBuffer'});if(!image)return json({error:'not found'},404);const meta=await store().get(`images/${id}.meta`,{type:'json'});return new Response(image,{headers:{'content-type':meta?.mime||'image/jpeg','cache-control':'public, max-age=31536000, immutable'}})}
  if(resource==='snippets'&&request.method==='GET'&&id){const d=lib.detections.find(x=>x.id===id);if(!d)return json({error:'not found'},404);const p=lib.photos.find(x=>x.id===d.photoId);if(!p)return json({error:'photo not found'},404);const image=await store().get(`images/${p.id}`,{type:'arrayBuffer'});if(!image)return json({error:'source image unavailable'},404);const input=Buffer.from(image);const meta=await sharp(input).metadata();const b=bounds(d.region);const left=Math.max(0,Math.floor(b.x*meta.width)),top=Math.max(0,Math.floor(b.y*meta.height));const width=Math.max(1,Math.min(meta.width-left,Math.ceil(b.width*meta.width))),height=Math.max(1,Math.min(meta.height-top,Math.ceil(b.height*meta.height)));const cropped=await sharp(input).extract({left,top,width,height}).jpeg({quality:88}).toBuffer();return new Response(cropped,{headers:{'content-type':'image/jpeg','cache-control':'public, max-age=86400'}})}
  if(resource==='albums'){
    if(request.method==='GET'){const item=id?lib.albums.find(a=>a.id===id):lib.albums;return item?json(item):json({error:'not found'},404)}
    if(!authorized(request))return json({error:'Mutation API disabled or invalid bearer token'},401);
    if(request.method==='POST'){const b=await request.json();const a={id:crypto.randomUUID(),name:b.name||'Untitled album',location:b.location||null,level:b.level||1,detectionIds:[],createdAt:new Date().toISOString()};lib.albums.push(a);await save(lib);return json(a,201)}
    if(request.method==='PATCH'&&id){const b=await request.json();const a=lib.albums.find(x=>x.id===id);if(!a)return json({error:'not found'},404);if(Array.isArray(b.detectionIds))a.detectionIds=[...new Set(b.detectionIds.filter(did=>lib.detections.some(d=>d.id===did)))];if(typeof b.name==='string')a.name=b.name;await save(lib);return json(a)}
  }
  return json({error:'not found'},404)
};

export const config={path:'/api/*'};
