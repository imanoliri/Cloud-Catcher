import {emptyLibrary,validateLibrary} from './domain.js';
const KEY='cloud-catcher-library';
const DB_NAME='cloud-catcher';
const STORE_NAME='libraries';

export function legacyMediaReferences(library){
  return [...library.photos.map(photo=>photo.imageRef),...library.detections.map(detection=>detection.snippetRef)]
    .filter(reference=>typeof reference==='string'&&/^\/api\/(images|snippets)\//.test(reference));
}

export function canonicalizeLibraryMedia(library){
  const next=structuredClone(library);
  const photos=new Map(next.photos.map(photo=>[photo.id,photo]));
  next.detections=next.detections.map(detection=>{
    if(!photos.get(detection.photoId)?.imageRef)return detection;
    const {snippetRef,...canonical}=detection;
    return canonical;
  });
  return next;
}

function openDatabase(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE_NAME);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function databaseOperation(mode,operation){
  const database=await openDatabase();
  try{return await new Promise((resolve,reject)=>{
    const transaction=database.transaction(STORE_NAME,mode);
    const request=operation(transaction.objectStore(STORE_NAME));
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    transaction.onerror=()=>reject(transaction.error);
  })}finally{database.close()}
}
export class BrowserStorageProvider{
  async loadLibrary(){const stored=await databaseOperation('readonly',store=>store.get(KEY));if(stored)return validateLibrary(stored);const legacy=localStorage.getItem(KEY);if(!legacy)return emptyLibrary();const library=validateLibrary(JSON.parse(legacy));await this.saveLibrary(library);localStorage.removeItem(KEY);return library}
  async saveLibrary(library){const saved={...canonicalizeLibraryMedia(validateLibrary(library)),updatedAt:new Date().toISOString()};await databaseOperation('readwrite',store=>store.put(saved,KEY));return saved}
  async exportArchive(library){return new Blob([JSON.stringify(canonicalizeLibraryMedia(validateLibrary(library)),null,2)],{type:'application/json'})}
  async importArchive(file){
    const library=canonicalizeLibraryMedia(validateLibrary(JSON.parse(await file.text())));
    const legacyReferences=legacyMediaReferences(library);
    if(legacyReferences.length)throw new Error(`This is a legacy Cloud Catcher export with ${legacyReferences.length} hosted image references. Repair the archive first so its images are embedded, then import the repaired JSON.`);
    return library;
  }
}
export class GoogleDriveStorageProvider{
  constructor({accessToken,folderId=null}){this.accessToken=accessToken;this.folderId=folderId;this.filename='cloud-catcher-library.json'}
  headers(extra={}){return{Authorization:`Bearer ${this.accessToken}`,...extra}}
  async findLibraryFile(){const q=[`name='${this.filename}'`,`trashed=false`,this.folderId?`'${this.folderId}' in parents`:null].filter(Boolean).join(' and ');const r=await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)`,{headers:this.headers()});if(!r.ok)throw new Error(`Drive lookup failed: ${r.status}`);return(await r.json()).files?.[0]??null}
  async loadLibrary(){const f=await this.findLibraryFile();if(!f)return emptyLibrary();const r=await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`,{headers:this.headers()});if(!r.ok)throw new Error(`Drive download failed: ${r.status}`);return validateLibrary(await r.json())}
  async saveLibrary(library){const existing=await this.findLibraryFile();const metadata={name:this.filename,mimeType:'application/json',...(this.folderId&&!existing?{parents:[this.folderId]}:{})};const boundary='cloud-catcher-boundary';const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(library)}\r\n--${boundary}--`;const url=existing?`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';const r=await fetch(url,{method:existing?'PATCH':'POST',headers:this.headers({'Content-Type':`multipart/related; boundary=${boundary}`}),body});if(!r.ok)throw new Error(`Drive save failed: ${r.status}`);return r.json()}
}
export function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
