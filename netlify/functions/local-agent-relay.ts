import type {Config,Context} from '@netlify/functions';
import {getStore} from '@netlify/blobs';

type Session={browserHash:string;agentHash:string;expiresAt:string;lastSeenAt:string};
const methods=new Set(['getAtlas','getCloudTypes','getProgress','listPhotos','listDetections','getPhoto','addPhoto','addDetection','updateDetection','importCloudPhotos']);
const store=()=>getStore({name:'cloud-catcher-relay',consistency:'strong'});
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}});
const token=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const tokenHash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');
const bearer=(request:Request)=>(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
const sessionKey=(id:string)=>`sessions/${id}`;
const commandKey=(id:string,commandId:string)=>`commands/${id}/${commandId}`;
const resultKey=(id:string,commandId:string)=>`results/${id}/${commandId}`;
async function loadSession(id:string){return store().get(sessionKey(id),{type:'json'}) as Promise<Session|null>}
async function authorize(request:Request,id:string,kind:'browser'|'agent'){
  const session=await loadSession(id);if(!session||Date.parse(session.expiresAt)<=Date.now())return null;
  const expected=kind==='browser'?session.browserHash:session.agentHash;
  return await tokenHash(bearer(request))===expected?session:null;
}

export default async(request:Request,context:Context)=>{
  if(request.method==='OPTIONS')return response({ok:true});
  const path=new URL(request.url).pathname.split('/').filter(Boolean),id=String(context.params.sessionId||path[3]||''),commandId=String(context.params.commandId||path[4]||''),db=store();
  if(path.join('/')==='api/relay/sessions'&&request.method==='POST'){
    const sessionId=crypto.randomUUID(),browserToken=token(),agentToken=token(),expiresAt=new Date(Date.now()+12*60*60*1000).toISOString();
    await db.setJSON(sessionKey(sessionId),{browserHash:await tokenHash(browserToken),agentHash:await tokenHash(agentToken),expiresAt,lastSeenAt:new Date().toISOString()} satisfies Session);
    return response({sessionId,browserToken,agentToken,expiresAt});
  }
  if(path[2]==='browser'&&id&&request.method==='GET'){
    const session=await authorize(request,id,'browser');if(!session)return response({error:'Unauthorized or expired relay'},401);
    await db.setJSON(sessionKey(id),{...session,lastSeenAt:new Date().toISOString()});
    const {blobs}=await db.list({prefix:`commands/${id}/`});if(!blobs.length)return response({commandId:null});
    const key=blobs.sort((a,b)=>a.key.localeCompare(b.key))[0].key,command=await db.get(key,{type:'json'});await db.delete(key);return response(command);
  }
  if(path[2]==='commands'&&id&&request.method==='POST'){
    const session=await authorize(request,id,'agent');if(!session)return response({error:'Unauthorized or expired relay'},401);
    if(Date.now()-Date.parse(session.lastSeenAt)>90_000)return response({error:'Cloud Catcher is not currently open'},409);
    const body=await request.json() as {method?:string;params?:unknown};if(!body.method||!methods.has(body.method))return response({error:'Unsupported relay operation'},400);
    const nextId=crypto.randomUUID();await db.setJSON(commandKey(id,nextId),{commandId:nextId,method:body.method,params:body.params||{}});return response({commandId:nextId},202);
  }
  if(path[2]==='results'&&id&&commandId&&request.method==='POST'){
    if(!await authorize(request,id,'browser'))return response({error:'Unauthorized or expired relay'},401);
    await db.setJSON(resultKey(id,commandId),await request.json());return response({ok:true});
  }
  if(path[2]==='results'&&id&&commandId&&request.method==='GET'){
    if(!await authorize(request,id,'agent'))return response({error:'Unauthorized or expired relay'},401);
    const key=resultKey(id,commandId),result=await db.get(key,{type:'json'});if(!result)return response({pending:true},202);await db.delete(key);return response(result);
  }
  return response({error:'Not found'},404);
};

export const config:Config={path:['/api/relay/sessions','/api/relay/browser/:sessionId','/api/relay/commands/:sessionId','/api/relay/results/:sessionId/:commandId']};
