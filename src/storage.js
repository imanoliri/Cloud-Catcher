import {emptyLibrary,validateLibrary} from './domain.js';
const KEY='cloud-catcher-library-v1';
export class BrowserStorageProvider{
  async loadLibrary(){const raw=localStorage.getItem(KEY);return raw?validateLibrary(JSON.parse(raw)):emptyLibrary()}
  async saveLibrary(library){localStorage.setItem(KEY,JSON.stringify({...library,updatedAt:new Date().toISOString()}))}
  async exportArchive(library){return new Blob([JSON.stringify(library,null,2)],{type:'application/json'})}
  async importArchive(file){return validateLibrary(JSON.parse(await file.text()))}
}
export class GoogleDriveStorageProvider{
  constructor({accessToken,folderId=null}){this.accessToken=accessToken;this.folderId=folderId;this.filename='cloud-catcher-library.json'}
  headers(extra={}){return{Authorization:`Bearer ${this.accessToken}`,...extra}}
  async findLibraryFile(){const q=[`name='${this.filename}'`,`trashed=false`,this.folderId?`'${this.folderId}' in parents`:null].filter(Boolean).join(' and ');const r=await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)`,{headers:this.headers()});if(!r.ok)throw new Error(`Drive lookup failed: ${r.status}`);return(await r.json()).files?.[0]??null}
  async loadLibrary(){const f=await this.findLibraryFile();if(!f)return emptyLibrary();const r=await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`,{headers:this.headers()});if(!r.ok)throw new Error(`Drive download failed: ${r.status}`);return validateLibrary(await r.json())}
  async saveLibrary(library){const existing=await this.findLibraryFile();const metadata={name:this.filename,mimeType:'application/json',...(this.folderId&&!existing?{parents:[this.folderId]}:{})};const boundary='cloud-catcher-boundary';const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(library)}\r\n--${boundary}--`;const url=existing?`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';const r=await fetch(url,{method:existing?'PATCH':'POST',headers:this.headers({'Content-Type':`multipart/related; boundary=${boundary}`}),body});if(!r.ok)throw new Error(`Drive save failed: ${r.status}`);return r.json()}
}
export function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
