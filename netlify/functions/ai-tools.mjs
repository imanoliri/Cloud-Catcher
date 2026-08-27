const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

const tools=[
  {
    name:'import_cloud_photos',
    description:'Import one or more cloud photos, group them into an optional session, and create all cloud detections in one call.',
    method:'POST',
    path:'/ai-tools/import-cloud-photos',
    contentType:'multipart/form-data',
    input:{metadata:'JSON metadata field',files:'photo0..photoN image file fields'}
  },
  {
    name:'correct_detection',
    description:'Correct the cloud type, confidence, region, status, or notes of an existing detection.',
    method:'POST',
    path:'/ai-tools/correct-detection',
    contentType:'application/json',
    input:{detectionId:'string',cloudTypeId:'string?',confidence:'number?',region:'object?',status:'proposed|confirmed|rejected?',notes:'string?'}
  },
  {
    name:'add_detection',
    description:'Add another cloud detection to an existing photo.',
    method:'POST',
    path:'/ai-tools/add-detection',
    contentType:'application/json',
    input:{photoId:'string',cloudTypeId:'string',confidence:'number?',region:'object?',status:'proposed|confirmed|rejected?',notes:'string?'}
  },
  {
    name:'get_missing_clouds',
    description:'Return the Level 1 cloud genera that have not yet been confirmed, optionally for one location.',
    method:'GET',
    path:'/ai-tools/get-missing-clouds?location=San%20Sebasti%C3%A1n'
  },
  {
    name:'get_collection_progress',
    description:'Return Level 1 collection progress, optionally for one location.',
    method:'GET',
    path:'/ai-tools/get-collection-progress?location=San%20Sebasti%C3%A1n'
  }
];

function apiUrl(request,path){return new URL(path,new URL(request.url).origin).toString()}
async function forward(request,path,{method=request.method,body=null,headers=null}={}){
  let payload=body;
  const outgoingHeaders=headers?new Headers(headers):new Headers(request.headers);
  if(payload===null&&method!=='GET'&&method!=='HEAD')payload=await request.arrayBuffer();
  const response=await fetch(apiUrl(request,path),{method,headers:outgoingHeaders,body:method==='GET'||method==='HEAD'?undefined:payload});
  return new Response(response.body,{status:response.status,headers:response.headers});
}

export default async request=>{
  const url=new URL(request.url);
  const op=url.pathname.replace(/^\/ai-tools\/?/,'').split('/').filter(Boolean)[0]||'';

  if(request.method==='GET'&&!op)return json({name:'Cloud Catcher AI Tools',description:'Semantic tool layer over the Cloud Catcher REST API.',openapi:'/openapi.json',tools});

  if(op==='import-cloud-photos'&&request.method==='POST')return forward(request,'/api/catches/batch');

  if(op==='correct-detection'&&request.method==='POST'){
    try{
      const body=await request.json();
      if(!body.detectionId)return json({error:'detectionId is required'},400);
      const {detectionId,...patch}=body;
      return forward(request,`/api/detections/${encodeURIComponent(detectionId)}`,{method:'PATCH',body:JSON.stringify(patch),headers:{'content-type':'application/json'}});
    }catch(e){return json({error:e.message},400)}
  }

  if(op==='add-detection'&&request.method==='POST')return forward(request,'/api/detections',{method:'POST'});

  if((op==='get-missing-clouds'||op==='get-collection-progress')&&request.method==='GET'){
    const location=url.searchParams.get('location');
    const target=`/api/progress${location?`?location=${encodeURIComponent(location)}`:''}`;
    const response=await fetch(apiUrl(request,target));
    const body=await response.json();
    if(!response.ok)return json(body,response.status);
    if(op==='get-missing-clouds')return json({level:body.level,location:body.location,missingIds:body.missingIds,missing:body.missingIds.length});
    return json(body);
  }

  return json({error:'unknown AI tool',availableTools:tools.map(t=>t.name)},404);
};

export const config={path:'/ai-tools/*'};
