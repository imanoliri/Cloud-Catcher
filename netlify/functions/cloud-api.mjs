import {getStore} from '@netlify/blobs';

const cloudTypes=[['cirrus','Cirrus','Ci','high'],['cirrocumulus','Cirrocumulus','Cc','high'],['cirrostratus','Cirrostratus','Cs','high'],['altocumulus','Altocumulus','Ac','middle'],['altostratus','Altostratus','As','middle'],['nimbostratus','Nimbostratus','Ns','middle'],['stratocumulus','Stratocumulus','Sc','low'],['stratus','Stratus','St','low'],['cumulus','Cumulus','Cu','vertical'],['cumulonimbus','Cumulonimbus','Cb','vertical']].map(([id,name,code,family])=>({id,name,code,family,level:1}));
const empty=()=>({format:'cloud-catcher',formatVersion:1,taxonomyVersion:'1.0',observations:[],albums:[],updatedAt:new Date().toISOString()});
async function load(){return await getStore('cloud-catcher').get('library',{type:'json'})||empty()}
async function save(lib){lib.updatedAt=new Date().toISOString();await getStore('cloud-catcher').setJSON('library',lib);return lib}
function authorized(request){const token=process.env.CLOUD_CATCHER_API_TOKEN;return Boolean(token)&&request.headers.get('authorization')===`Bearer ${token}`}
function progress(lib,location=null){const obs=location?lib.observations.filter(o=>(o.location||'').toLowerCase()===location.toLowerCase()):lib.observations;const caught=new Set(obs.map(o=>o.cloudTypeId));return{level:1,location,caught:cloudTypes.filter(c=>caught.has(c.id)).length,required:cloudTypes.length,complete:cloudTypes.every(c=>caught.has(c.id)),missingIds:cloudTypes.filter(c=>!caught.has(c.id)).map(c=>c.id)}}
const cors={'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'};

export default async request=>{
  if(request.method==='OPTIONS')return new Response('',{status:204,headers:cors});
  const url=new URL(request.url);const path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean);const resource=path[0]||'status';const id=path[1];const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
  if(resource==='status')return respond({name:'Cloud Catcher API',version:'1',mutationsEnabled:Boolean(process.env.CLOUD_CATCHER_API_TOKEN)});
  if(resource==='cloud-types'){const item=id?cloudTypes.find(c=>c.id===id):cloudTypes;return item?respond(item):respond({error:'not found'},404)}
  const lib=await load();
  if(resource==='progress'&&request.method==='GET')return respond(progress(lib,url.searchParams.get('location')));
  if(resource==='observations'){
    if(request.method==='GET'){const item=id?lib.observations.find(o=>o.id===id):lib.observations;return item?respond(item):respond({error:'not found'},404)}
    if(!authorized(request))return respond({error:'Mutation API disabled or invalid bearer token'},401);
    if(request.method==='POST'){const b=await request.json();if(!cloudTypes.some(c=>c.id===b.cloudTypeId))return respond({error:'invalid cloudTypeId'},400);const o={id:crypto.randomUUID(),cloudTypeId:b.cloudTypeId,location:b.location||'Unknown',observedAt:b.observedAt||new Date().toISOString(),imageRef:b.imageRef||null,notes:b.notes||'',confidence:b.confidence??null,source:b.source||'api',createdAt:new Date().toISOString()};lib.observations.push(o);await save(lib);return respond(o,201)}
    if(request.method==='DELETE'&&id){lib.observations=lib.observations.filter(o=>o.id!==id);lib.albums.forEach(a=>a.observationIds=a.observationIds.filter(x=>x!==id));await save(lib);return respond({deleted:id})}
  }
  if(resource==='albums'){
    if(request.method==='GET'){const item=id?lib.albums.find(a=>a.id===id):lib.albums;return item?respond(item):respond({error:'not found'},404)}
    if(!authorized(request))return respond({error:'Mutation API disabled or invalid bearer token'},401);
    if(request.method==='POST'){const b=await request.json();const a={id:crypto.randomUUID(),name:b.name||'Untitled album',location:b.location||null,level:b.level||1,observationIds:[],createdAt:new Date().toISOString()};lib.albums.push(a);await save(lib);return respond(a,201)}
    if(request.method==='PATCH'&&id){const b=await request.json();const a=lib.albums.find(x=>x.id===id);if(!a)return respond({error:'not found'},404);if(Array.isArray(b.observationIds))a.observationIds=[...new Set(b.observationIds.filter(oid=>lib.observations.some(o=>o.id===oid)))];if(typeof b.name==='string')a.name=b.name;await save(lib);return respond(a)}
  }
  return respond({error:'not found'},404)
};
