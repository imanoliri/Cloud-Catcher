import {createMcpHandler,McpServer} from '@modelcontextprotocol/server';
import {z} from 'zod/v4';

const Detection=z.object({
  cloudTypeId:z.string(),
  confidence:z.number().min(0).max(1).nullable().optional(),
  status:z.enum(['proposed','confirmed','rejected']).optional(),
  notes:z.string().optional(),
  region:z.union([
    z.object({type:z.literal('rect'),x:z.number(),y:z.number(),width:z.number(),height:z.number()}),
    z.object({type:z.literal('polygon'),points:z.array(z.tuple([z.number(),z.number()])).min(3)})
  ]).optional()
});

const PhotoInput=z.object({
  originalName:z.string().optional(),
  imageDataUrl:z.string().optional(),
  imageUrl:z.string().url().optional(),
  observedAt:z.string().optional(),
  notes:z.string().optional(),
  detections:z.array(Detection).default([])
}).refine(v=>Boolean(v.imageDataUrl||v.imageUrl),{message:'Each photo requires imageDataUrl or imageUrl'});

const SessionInput=z.object({
  name:z.string().optional(),
  location:z.string().optional(),
  observedAt:z.string().optional(),
  notes:z.string().optional(),
  source:z.string().optional()
}).optional();

function textResult(value){return{content:[{type:'text',text:JSON.stringify(value,null,2)}],structuredContent:value}}
async function api(origin,path,init){const response=await fetch(new URL(path,origin),init);const body=await response.json().catch(()=>({error:`HTTP ${response.status}`}));if(!response.ok)throw new Error(body?.error||`HTTP ${response.status}`);return body}
async function imageUrlToDataUrl(url){const response=await fetch(url);if(!response.ok)throw new Error(`Could not fetch image: ${url}`);const mime=response.headers.get('content-type')||'image/jpeg';const bytes=Buffer.from(await response.arrayBuffer());return`data:${mime};base64,${bytes.toString('base64')}`}

const handler=createMcpHandler(({requestInfo})=>{
  const origin=new URL(requestInfo.url).origin;
  const server=new McpServer({name:'Cloud Catcher',version:'0.1.0'});

  server.registerTool('import_cloud_photos',{
    description:'Import one or more cloud photos, their detected cloud types and regions, and optionally group them into one observation session. Prefer one call for a whole outing.',
    inputSchema:z.object({
      session:SessionInput,
      location:z.string().optional(),
      observedAt:z.string().optional(),
      source:z.string().default('ai'),
      photos:z.array(PhotoInput).min(1)
    })
  },async({session,location,observedAt,source,photos})=>{
    const catches=[];
    for(const photo of photos){
      const imageDataUrl=photo.imageDataUrl||await imageUrlToDataUrl(photo.imageUrl);
      catches.push({originalName:photo.originalName,imageDataUrl,observedAt:photo.observedAt,notes:photo.notes,detections:photo.detections});
    }
    const result=await api(origin,'/api/catches/batch',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session,defaults:{location,observedAt,source},catches})});
    return textResult(result);
  });

  server.registerTool('correct_detection',{
    description:'Correct the cloud type, confidence, region, notes, or review status of an existing cloud detection.',
    inputSchema:z.object({
      detectionId:z.string(),
      cloudTypeId:z.string().optional(),
      confidence:z.number().min(0).max(1).nullable().optional(),
      status:z.enum(['proposed','confirmed','rejected']).optional(),
      notes:z.string().optional(),
      region:Detection.shape.region.optional()
    })
  },async({detectionId,...patch})=>textResult(await api(origin,`/api/detections/${encodeURIComponent(detectionId)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(patch)})));

  server.registerTool('add_detection',{
    description:'Add another cloud detection to an already stored photo.',
    inputSchema:z.object({photoId:z.string(),detection:Detection})
  },async({photoId,detection})=>textResult(await api(origin,'/api/detections',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({photoId,...detection})})));

  server.registerTool('get_collection_progress',{
    description:'Get Level 1 collection progress, optionally for one location.',
    inputSchema:z.object({location:z.string().optional()})
  },async({location})=>textResult(await api(origin,`/api/progress${location?`?location=${encodeURIComponent(location)}`:''}`)));

  server.registerTool('get_missing_clouds',{
    description:'List the Level 1 cloud genera that have not yet been confirmed, optionally for one location.',
    inputSchema:z.object({location:z.string().optional()})
  },async({location})=>{
    const progress=await api(origin,`/api/progress${location?`?location=${encodeURIComponent(location)}`:''}`);
    const types=await api(origin,'/api/cloud-types');
    const missing=new Set(progress.missingIds||[]);
    return textResult({level:progress.level,location:progress.location,missing:types.filter(t=>missing.has(t.id))});
  });

  return server;
});

export default request=>handler.fetch(request);
export const config={path:'/mcp'};
