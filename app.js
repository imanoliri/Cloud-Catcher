import {LEVEL_ONE,getCloudType} from './src/taxonomy.js';
import {addDetection,addPhoto,levelProgress,locationCollections,makeDetection,makePhoto,updateDetection} from './src/domain.js';
import {BrowserStorageProvider,downloadBlob} from './src/storage.js';

const storage=new BrowserStorageProvider();
const views={learn:document.querySelector('#learn-view'),quiz:document.querySelector('#quiz-view'),catch:document.querySelector('#catch-view'),atlas:document.querySelector('#atlas-view'),data:document.querySelector('#data-view')};
let activeView='learn';
let library=null;
let pendingImage=null;
let imageQuizCurrent=null;
let imageQuizExampleIndex=0;
let imageQuizAnswered=false;
let definitionQuizCurrent=null;
let definitionQuizAnswered=false;

const escapeHtml=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const learnExamples=type=>type.referenceImages?.length?type.referenceImages:[{image:type.referenceImage,page:type.referencePage}];
const fileDataUrl=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
const imageSize=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=reject;img.src=src});
const thumbnailUrl=(src,width=220)=>src.replace(/([?&])width=\d+/i,`$1width=${width}`);

function cloudGuide(){
  const meanings=[
    ['cirro-','High','High, thin clouds, usually made mostly of ice crystals.'],
    ['alto-','Middle','Mid-level clouds. Despite the name, alto means the middle cloud étage.'],
    ['stratus','Layer','A flat sheet, veil, or blanket of cloud.'],
    ['cumulus','Heap','Puffy, piled-up cloud with rounded or cauliflower shapes.'],
    ['nimbo- / -nimbus','Rain','A cloud associated with precipitation.']
  ];
  const rows=[
    ['High','Cirrostratus','Cirrocumulus','Cirrus'],
    ['Middle','Altostratus','Altocumulus','—'],
    ['Low','Stratus','Stratocumulus','Nimbostratus'],
    ['Vertical','—','Cumulus','Cumulonimbus']
  ];
  return `<section class="cloud-guide" aria-labelledby="cloud-guide-title">
    <div class="guide-intro">
      <p class="eyebrow">Learn · Level 1</p>
      <h2 id="cloud-guide-title">How clouds form & how their names work</h2>
      <p>Clouds form when moist air rises and cools to its dew point. Water vapour then condenses onto tiny particles such as dust or sea salt, making droplets or ice crystals visible as a cloud.</p>
    </div>
    <div class="guide-section">
      <h3>Decode the name</h3>
      <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Name part</th><th>Think</th><th>Meaning</th></tr></thead><tbody>${meanings.map(([part,think,meaning])=>`<tr><td><strong>${part}</strong></td><td>${think}</td><td>${meaning}</td></tr>`).join('')}</tbody></table></div>
      <p class="guide-example"><strong>Example:</strong> <em>Altocumulus</em> = middle-level + heaps, so look for patches or rows of medium-height puffy clouds.</p>
    </div>
    <div class="guide-section">
      <h3>The main combinations</h3>
      <div class="guide-table-wrap"><table class="guide-table combination-table"><thead><tr><th>Height / growth</th><th>Layered</th><th>Puffy / heaped</th><th>Special</th></tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>`<${i?'td':'th'}>${cell}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>
    </div>
    <div class="guide-section">
      <h3>Know them by sight</h3>
      <div class="guide-cloud-grid">${LEVEL_ONE.map(c=>`<article class="guide-cloud-card"><img src="${thumbnailUrl(c.referenceImage,360)}" alt="Reference example of ${escapeHtml(c.name)}" loading="lazy" decoding="async"><div><p class="cloud-code">${c.code} · ${c.family}</p><h4>${c.name}</h4><p>${c.summary}</p><p class="guide-clue"><strong>Look for:</strong> ${c.clue}</p></div></article>`).join('')}</div>
    </div>
  </section>`;
}
function renderLearn(){views.learn.innerHTML=cloudGuide()}

function chooseImageQuizQuestion(){
  imageQuizCurrent=LEVEL_ONE[Math.floor(Math.random()*LEVEL_ONE.length)];
  const examples=learnExamples(imageQuizCurrent);
  imageQuizExampleIndex=Math.floor(Math.random()*examples.length);
  imageQuizAnswered=false;
}
function chooseDefinitionQuizQuestion(){
  definitionQuizCurrent=LEVEL_ONE[Math.floor(Math.random()*LEVEL_ONE.length)];
  definitionQuizAnswered=false;
}
function renderImageQuiz(){
  if(!imageQuizCurrent)chooseImageQuizQuestion();
  const examples=learnExamples(imageQuizCurrent);
  const example=examples[imageQuizExampleIndex];
  const choices=shuffle([imageQuizCurrent,...shuffle(LEVEL_ONE.filter(c=>c.id!==imageQuizCurrent.id)).slice(0,3)]);
  const section=document.createElement('section');
  section.id='image-quiz';
  section.className='image-quiz panel';
  section.innerHTML=`<div class="image-quiz-copy"><p class="eyebrow">Quiz · Identification</p><h2>Which cloud is this?</h2><p>Choose the cloud genus that best matches the picture.</p><div class="choices">${choices.map(c=>`<button type="button" data-image-choice="${c.id}">${c.name}</button>`).join('')}</div><div id="image-feedback" aria-live="polite"></div></div><div class="learn-photo-wrap"><img class="learn-photo" src="${thumbnailUrl(example.image,220)}" alt="Cloud identification quiz example ${imageQuizExampleIndex+1} of ${examples.length}" decoding="async"><span class="reference-badge">Example ${imageQuizExampleIndex+1} of ${examples.length}</span></div>`;
  const old=views.quiz.querySelector('#image-quiz');
  old?old.replaceWith(section):views.quiz.prepend(section);
  section.querySelectorAll('[data-image-choice]').forEach(b=>b.addEventListener('click',()=>answerImageQuiz(b.dataset.imageChoice)));
}
function answerImageQuiz(id){
  if(imageQuizAnswered)return;
  imageQuizAnswered=true;
  const correct=id===imageQuizCurrent.id;
  const feedback=views.quiz.querySelector('#image-feedback');
  if(!feedback)return;
  feedback.innerHTML=`<div class="feedback"><strong>${correct?'Correct!':'Not quite.'}</strong> This is <b>${imageQuizCurrent.name}</b>. ${imageQuizCurrent.clue}<div class="toolbar"><button id="image-next" class="primary" type="button">Next cloud</button></div></div>`;
  views.quiz.querySelectorAll('[data-image-choice]').forEach(b=>b.disabled=true);
  views.quiz.querySelector('#image-next')?.addEventListener('click',()=>{chooseImageQuizQuestion();renderImageQuiz()});
}
function renderDefinitionQuiz(){
  if(!definitionQuizCurrent)chooseDefinitionQuizQuestion();
  const choices=shuffle([definitionQuizCurrent,...shuffle(LEVEL_ONE.filter(c=>c.id!==definitionQuizCurrent.id)).slice(0,3)]);
  const section=document.createElement('section');
  section.id='definition-quiz';
  section.className='definition-quiz panel';
  section.innerHTML=`<p class="eyebrow">Quiz · Definitions</p><h2>What does ${definitionQuizCurrent.name} mean?</h2><p>Choose the definition that best matches this cloud genus.</p><div class="definition-choices">${choices.map(c=>`<button type="button" data-definition-choice="${c.id}">${c.summary}</button>`).join('')}</div><div id="definition-feedback" aria-live="polite"></div>`;
  const old=views.quiz.querySelector('#definition-quiz');
  old?old.replaceWith(section):views.quiz.append(section);
  section.querySelectorAll('[data-definition-choice]').forEach(b=>b.addEventListener('click',()=>answerDefinitionQuiz(b.dataset.definitionChoice)));
}
function answerDefinitionQuiz(id){
  if(definitionQuizAnswered)return;
  definitionQuizAnswered=true;
  const correct=id===definitionQuizCurrent.id;
  const feedback=views.quiz.querySelector('#definition-feedback');
  if(!feedback)return;
  feedback.innerHTML=`<div class="feedback"><strong>${correct?'Correct!':'Not quite.'}</strong> <b>${definitionQuizCurrent.name}</b>: ${definitionQuizCurrent.summary}<div class="toolbar"><button id="definition-next" class="primary" type="button">Next definition</button></div></div>`;
  views.quiz.querySelectorAll('[data-definition-choice]').forEach(b=>{b.disabled=true;if(b.dataset.definitionChoice===definitionQuizCurrent.id)b.classList.add('correct-choice');else if(b.dataset.definitionChoice===id)b.classList.add('wrong-choice')});
  views.quiz.querySelector('#definition-next')?.addEventListener('click',()=>{chooseDefinitionQuizQuestion();renderDefinitionQuiz()});
}
function renderQuiz(){renderImageQuiz();renderDefinitionQuiz()}

renderLearn();
renderQuiz();

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
  if(activeView==='learn')renderLearn();
  if(activeView==='quiz')renderQuiz();
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