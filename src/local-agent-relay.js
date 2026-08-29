const POLL_INTERVAL=2500;
const MAX_PHOTO_CHARS=4_000_000;

async function request(url,{method='GET',token,body,keepalive=false}={}){
  const response=await fetch(url,{method,keepalive,headers:{...(token?{Authorization:`Bearer ${token}`}:{}) ,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||`Relay request failed (${response.status})`);
  return data;
}

export class LocalAgentRelay{
  constructor({api,onState=()=>{}}){this.api=api;this.onState=onState;this.session=null;this.timer=null;this.running=false}
  getState(){return this.session?{ready:true,sessionId:this.session.sessionId,expiresAt:this.session.expiresAt,connection:JSON.stringify({relay:location.origin,sessionId:this.session.sessionId,token:this.session.agentToken,expiresAt:this.session.expiresAt})}:{ready:false}}
  async start(){
    const created=await request('/api/relay/sessions',{method:'POST'});
    this.session=created;this.onState(this.getState());this.poll();return this.getState();
  }
  stop(){clearTimeout(this.timer);this.timer=null;this.session=null;this.onState(this.getState())}
  async poll(){
    if(!this.session||this.running)return;
    this.running=true;const session=this.session;
    try{
      const command=await request(`/api/relay/browser/${session.sessionId}`,{token:session.browserToken});
      if(command.commandId){
        let body;
        try{body={ok:true,result:await this.execute(command.method,command.params||{})}}
        catch(error){body={ok:false,error:error instanceof Error?error.message:'Local command failed'}}
        await request(`/api/relay/results/${session.sessionId}/${command.commandId}`,{method:'POST',token:session.browserToken,body});
        this.onState({...this.getState(),lastCommand:command.method});
      }
    }catch(error){this.onState({...this.getState(),error:error instanceof Error?error.message:'Relay unavailable'})}
    finally{this.running=false;if(this.session===session)this.timer=setTimeout(()=>this.poll(),POLL_INTERVAL)}
  }
  async execute(method,params){
    const library=()=>this.api.getLibrary();
    const operations={
      getAtlas:()=>stripPhotos(library()),
      getCloudTypes:()=>this.api.getCloudTypes(),
      getProgress:()=>this.api.getProgress(params.location??null),
      listPhotos:()=>library().photos.map(({imageRef,...photo})=>({...photo,hasImage:Boolean(imageRef)})),
      listDetections:()=>library().detections.filter(detection=>!params.photoId||detection.photoId===params.photoId),
      getPhoto:()=>{const photo=library().photos.find(item=>item.id===params.photoId);if(!photo)throw new Error('Photo not found');if((photo.imageRef||'').length>MAX_PHOTO_CHARS)throw new Error('Photo is too large for the relay. Export it for review instead.');return photo},
      addPhoto:()=>this.api.addPhoto(params.photo),
      addDetection:()=>this.api.addDetection(params.detection),
      updateDetection:()=>this.api.updateDetection(params.detectionId,params.patch),
      importCloudPhotos:()=>this.api.importCloudPhotos(params.batch)
    };
    if(!operations[method])throw new Error(`Unsupported relay operation: ${method}`);
    return operations[method]();
  }
}

function stripPhotos(library){return{...library,photos:library.photos.map(({imageRef,...photo})=>({...photo,hasImage:Boolean(imageRef)}))}}
