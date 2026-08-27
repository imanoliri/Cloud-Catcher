import {LEVEL_ONE,getCloudType} from './src/taxonomy.js';
import {addDetection,addPhoto,levelProgress,locationCollections,makeDetection,makePhoto,updateDetection} from './src/domain.js';
import {BrowserStorageProvider,downloadBlob} from './src/storage.js';

const storage=new BrowserStorageProvider();
const views={learn:document.querySelector('#learn-view'),catch:document.querySelector('#catch-view'),atlas:document.querySelector('#atlas-view'),data:document.querySelector('#data-view')};
let activeView='learn';
let library=null;
let pendingImage=null;
let learnCurrent=null;
let learnAnswered=false;

const escapeHtml=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const fileDataUrl=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
const imageSize=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=reject;img.src=src});

function chooseLearnQuestion(){learnCurrent=LEVEL_ONE[Math.floor(Math.random()*LEVEL_ONE.length)];learnAnswered=false}
function renderLearn(){
  if(!learnCurrent)chooseLearnQuestion();
  const choices=shuffle([learnCurrent,...shuffle(LEVEL_ONE.filter(c=>c.id!==learnCurrent.id)).slice(0,3)]);
  views.learn.innerHTML=`<div class="hero learn-hero"><div><p class="eyebrow">Learn · Level 1</p><h2>Learn the cloud genera</h2><p>Practice identifying the ten principal cloud genera. Quiz answers never create catches or change Atlas progress.</p><div class="choices">${choices.map(c=>`<button data-learn-choice="${c.id}">${c.name}</button>`).join('')}</div><div id="learn-feedback"></div></div><div class="learn-photo-wrap"><img class="learn-photo" src="${learnCurrent.referenceImage}" alt="Cloud identification practice" decoding="async"><span class="reference-badge">Practice</span></div></div>`;
  views.learn.querySelectorAll('[data-learn-choice]').forEach(b=>b.addEventListener('click',()=>answerLearn(b.dataset.learnChoice)));
}
function answerLearn(id){
  if(learnAnswered)return;learnAnswered=true;
  const correct=id===learnCurrent.id;
  const feedback=views.learn.querySelector('#learn-feedback');
  feedback.innerHTML=`<div class="feedback"><strong>${correct?'Correct!':'Not quite.'}</strong> This is <b>${learnCurrent.name}</b>. ${learnCurrent.clue}<div class="toolbar"><button id="learn-next" class="primary">Next cloud</button></div></div>`;
  views.learn.querySelector('#learn-next').addEventListener('click',()=>{chooseLearnQuestion();renderLearn()});
}

renderLearn();

async function mergeHostedLibrary(local){
  try{
    const responses=await Promise.all(['sessions','photos','detections','albums'].map(resource=>fetch(`/api/${resource}`)));
    if(responses.some(r=>!r.ok))return local;
    const [sessions,photos,detections,albums]=await Promise.all(responses.map(r=>r.json()));
    const merge=(a,b)=>[...new Map([...a,...b].map(item=>[item.id,item])).values()];
    return{...local,sessions:merge(local.sessions,sessions),photos:merge(local.photos,photos),detections:merge(local.detections,detections.map(d=>({...d,snippetRef:d.snippetRef||`/api/snippets/${d.id}`}))),albums:merge(local.albums,albums),updatedAt:new Date().toISOString()};
  }catch{return local}
}

library=await storage.loadLibrary();

function showView(name){
  activeView=name;
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  Object.entries(views).forEach(([key,view])=>view.classList.toggle('active',key===name));
  renderActive();
}
document.querySelectorAll('nav button').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));

function renderActive(){
  if(activeView==='learn')return;
  if(activeView==='catch')renderCatch();
  if(activeView==='atlas')renderAtlas();
  if(activeView==='data')renderData();
}

function renderCatch(){
  views.catch.innerHTML=`<div class="panel"><p class="eyebrow">Real sky</p><h2>Catch clouds from a photo</h2><p>Choose a photo, drag over one cloud region, classify it, and save it. Repeat on the same photo for every cloud you want to catch.</p><div class="upload-grid"><div><label class="button file-label">Choose photo<input id="photo-file" type="file" accept="image/*"></label><div id="photo-preview">${pendingImage?`<img class="photo-preview" src="${pendingImage.dataUrl}" alt="Uploaded cloud photo" decoding="async">`:'<p class="muted">No photo selected.</p>'}</div></div><div>${pendingImage?detectionForm():''}</div></div><div id="upload-feedback"></div></div>`;
  views.catch.querySelector('#photo-file').addEventListener('change',loadPhoto);
  views.catch.querySelector('#save-detection')?.addEventListener('click',saveRealDetection);
}
function detectionForm(){return`<label>Location<br><input id="photo-location" value="San Sebastián"></label><label>Cloud type<br><select id="det-type">${LEVEL_ONE.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><label>Confidence (0–100%)<br><input id="det-confidence" type="number" min="0" max="100" value="90"></label><fieldset><legend>Crop region (% of photo)</legend><div class="region-grid"><label>Left<input id="det-x" type="number" min="0" max="100" value="0"></label><label>Top<input id="det-y" type="number" min="0" max="100" value="0"></label><label>Width<input id="det-w" type="number" min="0" max="100" value="0"></label><label>Height<input id="det-h" type="number" min="0" max="100" value="0"></label></div></fieldset><div class="toolbar"><button id="save-detection" class="primary">Select a cloud region first</button></div><p class="muted">After saving, drag another region on this same image to add another cloud.</p>`}
async function loadPhoto(e){const file=e.target.files?.[0];if(!file)return;const dataUrl=await fileDataUrl(file);const size=await imageSize(dataUrl);pendingImage={file,dataUrl,...size,photoId:null};renderCatch()}
async function cropDataUrl(src,region){const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src});const sx=Math.floor(region.x*img.naturalWidth),sy=Math.floor(region.y*img.naturalHeight),sw=Math.max(1,Math.ceil(region.width*img.naturalWidth)),sh=Math.max(1,Math.ceil(region.height*img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;canvas.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);return canvas.toDataURL('image/jpeg',.84)}
async function saveRealDetection(){
  const location=views.catch.querySelector('#photo-location')?.value||'Unknown';
  if(!pendingImage?.photoId){const photo=makePhoto({location,imageRef:pendingImage.dataUrl,originalName:pendingImage.file.name,width:pendingImage.width,height:pendingImage.height,source:'upload'});library=addPhoto(library,photo);pendingImage.photoId=photo.id}
  const pct=id=>Math.max(0,Math.min(100,Number(views.catch.querySelector(id)?.value||0)))/100;
  const region={type:'rect',x:pct('#det-x'),y:pct('#det-y'),width:pct('#det-w'),height:pct('#det-h')};
  if(region.width<=0||region.height<=0)return;
  const detection=makeDetection({photoId:pendingImage.photoId,cloudTypeId:views.catch.querySelector('#det-type').value,confidence:Number(views.catch.querySelector('#det-confidence').value)/100,region,status:'confirmed',source:'manual-upload'});
  detection.snippetRef=await cropDataUrl(pendingImage.dataUrl,detection.region);
  library=addDetection(library,detection);await storage.saveLibrary(library);
  views.catch.querySelector('#upload-feedback').innerHTML=`<div class="feedback"><strong>Caught!</strong> ${getCloudType(detection.cloudTypeId).name} added. Drag another region on this photo to add another cloud.</div>`;
}

function renderDetectionThumb(d){const type=getCloudType(d.cloudTypeId);const snippet=d.snippetRef||`/api/snippets/${d.id}`;return`<figure class="detection-thumb ${d.status==='proposed'?'proposed':''}"><img src="${snippet}" alt="${escapeHtml(type?.name||d.cloudTypeId)} crop" loading="lazy" decoding="async"><figcaption><strong>${escapeHtml(type?.name||d.cloudTypeId)}</strong>${d.confidence==null?'':` · ${Math.round(d.confidence*100)}%`}${d.status==='proposed'?' · proposed':''}</figcaption></figure>`}
function renderPhotoJournal(){if(!library.photos.length)return'<p>No photos stored yet.</p>';return`<div class="photo-grid">${library.photos.map(photo=>{const detections=library.detections.filter(d=>d.photoId===photo.id&&d.status!=='rejected');const name=photo.originalName||`Photo ${photo.id.slice(0,8)}`;return`<article class="photo-tile">${photo.imageRef?`<img class="photo-thumb" src="${photo.imageRef}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">`:'<div class="photo-thumb photo-placeholder">☁</div>'}<div class="photo-meta"><strong class="photo-filename">${escapeHtml(name)}</strong><span>${escapeHtml(photo.location||'Unknown')}</span>${detections.length?`<div class="detection-thumbs">${detections.map(renderDetectionThumb).join('')}</div>`:'<p class="unclassified-note">No cloud regions identified yet.</p>'}</div></article>`}).join('')}</div>`}
function referenceArt(c){return`<div class="reference-photo-wrap"><img class="card-photo reference-photo" src="${c.referenceImage}" alt="Reference example of ${escapeHtml(c.name)}" loading="lazy" decoding="async"><span class="reference-badge">Example</span></div>`}
function renderAtlas(){
  const progress=levelProgress(library),locations=locationCollections(library),confirmed=library.detections.filter(d=>d.status==='confirmed'),visible=library.detections.filter(d=>d.status!=='rejected');
  views.atlas.innerHTML=`<div class="panel"><p class="eyebrow">Cloud Atlas</p><h2>Level 1 collection</h2><div class="stats"><div class="stat"><strong>${progress.caught}/${progress.required}</strong>types caught</div><div class="stat"><strong>${progress.complete?'Complete':'In progress'}</strong>level status</div><div class="stat"><strong>${library.photos.length}</strong>photos</div><div class="stat"><strong>${confirmed.length}</strong>confirmed clouds</div></div><div class="grid">${LEVEL_ONE.map(c=>{const d=confirmed.find(x=>x.cloudTypeId===c.id)||visible.find(x=>x.cloudTypeId===c.id);const snippet=d?.snippetRef||(d?`/api/snippets/${d.id}`:null);return`<article class="cloud-card ${d?'':'reference-card'} ${d&&d.status!=='confirmed'?'proposed-card':''}">${snippet?`<img class="card-photo" src="${snippet}" alt="${c.name} crop" loading="lazy" decoding="async">`:referenceArt(c)}<div class="cloud-copy"><p class="cloud-code">${c.code} · ${c.family}</p><h3>${c.name}</h3><p class="cloud-summary">${d?c.summary:c.clue}</p>${!d?'<p class="not-caught">Reference example — not your catch</p>':''}</div></article>`}).join('')}</div><h2>Photo journal</h2>${renderPhotoJournal()}<h2>Location cards</h2><div class="grid">${locations.map(p=>`<article class="cloud-card ${p.complete?'':'locked'}"><div class="cloud-copy"><p class="cloud-code">Level ${p.level}</p><h3>${escapeHtml(p.location)}</h3><p>${p.caught}/${p.required} cloud genera caught here</p></div></article>`).join('')}</div></div>`;
}
function renderData(){const proposed=library.detections.filter(d=>d.status==='proposed').length;views.data.innerHTML=`<div class="panel"><p class="eyebrow">Your data</p><h2>Portable by design</h2><div class="toolbar"><button id="export" class="primary">Export library</button><label class="button file-label">Import library<input id="import" type="file" accept="application/json,.json"></label></div><p><b>${library.photos.length}</b> photos · <b>${library.detections.length}</b> detections · <b>${proposed}</b> awaiting confirmation</p></div>`;views.data.querySelector('#export').addEventListener('click',async()=>downloadBlob(await storage.exportArchive(library),`cloud-catcher-${new Date().toISOString().slice(0,10)}.json`));views.data.querySelector('#import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;library=await storage.importArchive(file);await storage.saveLibrary(library);renderData()})}

window.cloudCatcher={getLibrary:()=>structuredClone(library),getCloudTypes:()=>structuredClone(LEVEL_ONE),getProgress:(location=null)=>levelProgress(library,1,location),addPhoto:async data=>{const p=makePhoto(data);library=addPhoto(library,p);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(p)},addDetection:async data=>{const d=makeDetection(data);library=addDetection(library,d);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(d)},updateDetection:async(id,patch)=>{library=updateDetection(library,id,patch);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(library.detections.find(d=>d.id===id))}};

const syncHosted=async()=>{const merged=await mergeHostedLibrary(library);library=merged;if(activeView==='atlas')renderAtlas();if(activeView==='data')renderData()};
if('requestIdleCallback'in window)requestIdleCallback(()=>syncHosted(),{timeout:2500});else setTimeout(syncHosted,300);
