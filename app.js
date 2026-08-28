import {LEVEL_ONE,getCloudType} from './src/taxonomy.js';
import {addDetection,addPhoto,addSession,levelProgress,locationCollections,makeDetection,makePhoto,makeSession,updateDetection} from './src/domain.js';
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
    <details class="guide-section guide-sight">
      <summary>Know them by sight</summary>
      <div class="guide-cloud-grid">${LEVEL_ONE.map(c=>`<article class="guide-cloud-card"><img src="${thumbnailUrl(c.referenceImage,360)}" alt="Reference example of ${escapeHtml(c.name)}" loading="lazy" decoding="async"><div><p class="cloud-code">${c.code} · ${c.family}</p><h4>${c.name}</h4><p>${c.summary}</p><p class="guide-clue"><strong>Look for:</strong> ${c.clue}</p></div></article>`).join('')}</div>
    </details>
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
let quizTooltipEl=null;
let pinnedQuizHelp=null;

function getQuizTooltip(){
  if(quizTooltipEl)return quizTooltipEl;
  quizTooltipEl=document.createElement('div');
  quizTooltipEl.className='quiz-tooltip-floating';
  quizTooltipEl.setAttribute('role','tooltip');
  quizTooltipEl.hidden=true;
  Object.assign(quizTooltipEl.style,{
    position:'fixed',zIndex:'1000',maxWidth:'calc(100vw - 24px)',width:'270px',
    padding:'.7rem .8rem',border:'1px solid #cfe4f4',borderRadius:'12px',
    background:'#fff',boxShadow:'0 10px 30px rgba(40,90,120,.16)',
    fontSize:'.84rem',lineHeight:'1.4',fontWeight:'500',color:'#48677e',
    textAlign:'left',whiteSpace:'normal'
  });
  document.body.append(quizTooltipEl);
  return quizTooltipEl;
}

function positionQuizTooltip(help){
  const tip=getQuizTooltip();
  const rect=help.getBoundingClientRect();
  const width=tip.offsetWidth;
  const height=tip.offsetHeight;
  let left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12));
  let top=rect.bottom+8;
  if(top+height>window.innerHeight-12&&rect.top-height-8>=12)top=rect.top-height-8;
  tip.style.left=`${left}px`;
  tip.style.top=`${Math.max(12,top)}px`;
}

function showQuizTooltip(help){
  const tip=getQuizTooltip();
  tip.textContent=help.dataset.tooltip||'';
  tip.hidden=false;
  help.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>positionQuizTooltip(help));
}

function hideQuizTooltip(){
  if(quizTooltipEl)quizTooltipEl.hidden=true;
  views.quiz?.querySelectorAll('.quiz-help[aria-expanded="true"]').forEach(help=>help.setAttribute('aria-expanded','false'));
}

function wireQuizHelp(section){
  section.querySelectorAll('.quiz-help').forEach(help=>{
    help.addEventListener('mouseenter',()=>{if(!pinnedQuizHelp)showQuizTooltip(help)});
    help.addEventListener('mouseleave',()=>{if(!pinnedQuizHelp)hideQuizTooltip()});
    help.addEventListener('focus',()=>{if(!pinnedQuizHelp)showQuizTooltip(help)});
    help.addEventListener('blur',()=>{if(!pinnedQuizHelp)hideQuizTooltip()});
    const toggle=event=>{
      event.stopPropagation();
      if(pinnedQuizHelp===help){
        pinnedQuizHelp=null;
        hideQuizTooltip();
      }else{
        pinnedQuizHelp=help;
        hideQuizTooltip();
        showQuizTooltip(help);
      }
    };
    help.addEventListener('click',toggle);
    help.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(event)}
      if(event.key==='Escape'){pinnedQuizHelp=null;hideQuizTooltip()}
    });
  });
}
document.addEventListener('click',()=>{pinnedQuizHelp=null;hideQuizTooltip()});
window.addEventListener('resize',()=>{if(pinnedQuizHelp)positionQuizTooltip(pinnedQuizHelp);else hideQuizTooltip()});
window.addEventListener('scroll',()=>{if(pinnedQuizHelp)positionQuizTooltip(pinnedQuizHelp);else hideQuizTooltip()},{passive:true});

function renderImageQuiz(){
  if(!imageQuizCurrent)chooseImageQuizQuestion();
  const examples=learnExamples(imageQuizCurrent);
  const example=examples[imageQuizExampleIndex];
  const choices=shuffle([imageQuizCurrent,...shuffle(LEVEL_ONE.filter(c=>c.id!==imageQuizCurrent.id)).slice(0,3)]);
  const section=document.createElement('section');
  section.id='image-quiz';
  section.className='image-quiz panel';
  section.innerHTML=`<div class="image-quiz-copy"><p class="eyebrow">Quiz · Identification</p><h2 class="quiz-question">Which cloud is this? <span class="quiz-help" role="button" tabindex="0" aria-label="Identification quiz instructions" aria-expanded="false" data-tooltip="Choose the cloud genus that best matches the picture.">ℹ️</span></h2><div class="quiz-answer-area"><div class="choices">${choices.map(c=>`<button type="button" data-image-choice="${c.id}">${c.name}</button>`).join('')}</div><div id="image-feedback" class="quiz-result-overlay" aria-live="polite"></div></div></div><div class="learn-photo-wrap"><img class="learn-photo" src="${thumbnailUrl(example.image,220)}" alt="Cloud identification quiz example ${imageQuizExampleIndex+1} of ${examples.length}" decoding="async"><span class="reference-badge">Example ${imageQuizExampleIndex+1} of ${examples.length}</span></div>`;
  const old=views.quiz.querySelector('#image-quiz');
  old?old.replaceWith(section):views.quiz.prepend(section);
  wireQuizHelp(section);
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
  section.innerHTML=`<p class="eyebrow">Quiz · Definitions</p><h2 class="quiz-question">What does "${definitionQuizCurrent.name}" mean? <span class="quiz-help" role="button" tabindex="0" aria-label="Definition quiz instructions" aria-expanded="false" data-tooltip="Choose the definition that best matches this cloud genus.">ℹ️</span></h2><div class="quiz-answer-area"><div class="definition-choices">${choices.map(c=>`<button type="button" data-definition-choice="${c.id}">${c.summary}</button>`).join('')}</div><div id="definition-feedback" class="quiz-result-overlay" aria-live="polite"></div></div>`;
  const old=views.quiz.querySelector('#definition-quiz');
  old?old.replaceWith(section):views.quiz.append(section);
  wireQuizHelp(section);
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
  views.catch.innerHTML=`<div class="panel"><p class="eyebrow">Real sky</p><h2>Catch clouds from a photo</h2><p>Choose a photo, drag over one cloud region, classify it, and save it. Repeat on the same photo for every cloud you want to catch.</p><div class="upload-grid"><div><label class="button file-label">Choose photo<input id="photo-file" type="file" accept="image/*"></label><div id="photo-preview">${pendingImage?`<img class="photo-preview" src="${pendingImage.dataUrl}" alt="Uploaded cloud photo" decoding="async">`:'<p class="muted">No photo selected.</p>'}</div></div><div>${pendingImage?detectionForm():''}</div></div><div id="upload-feedback" role="status" aria-live="polite"></div></div>`;
  views.catch.querySelector('#photo-file').addEventListener('change',loadPhoto);
  views.catch.querySelector('#save-detection')?.addEventListener('click',saveRealDetection);
}
function detectionForm(){return`<label>Location<br><input id="photo-location" value="San Sebastián"></label><label>Cloud type<br><select id="det-type"><option value="" selected>Choose cloud type</option>${LEVEL_ONE.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><label>Confidence (0–100%)<br><input id="det-confidence" type="number" min="0" max="100" value="90"></label><fieldset><legend>Crop region (% of photo)</legend><div class="region-grid"><label>Left<input id="det-x" type="number" min="0" max="100" value="0"></label><label>Top<input id="det-y" type="number" min="0" max="100" value="0"></label><label>Width<input id="det-w" type="number" min="0" max="100" value="0"></label><label>Height<input id="det-h" type="number" min="0" max="100" value="0"></label></div></fieldset><div class="toolbar"><button id="save-detection" class="primary">Select a cloud region first</button></div><p class="muted">After saving, drag another region on this same image to add another cloud.</p>`}
async function loadPhoto(e){const file=e.target.files?.[0];if(!file)return;const dataUrl=await fileDataUrl(file);const size=await imageSize(dataUrl);pendingImage={file,dataUrl,...size,photoId:null};renderCatch()}
function regionBounds(region){return region.type==='polygon'?{x:Math.min(...region.points.map(p=>p[0])),y:Math.min(...region.points.map(p=>p[1])),width:Math.max(...region.points.map(p=>p[0]))-Math.min(...region.points.map(p=>p[0])),height:Math.max(...region.points.map(p=>p[1]))-Math.min(...region.points.map(p=>p[1]))}:region}
function detectionCrop(d,className=''){
  const photo=library.photos.find(value=>value.id===d.photoId);
  if(!photo?.imageRef)return d.snippetRef?`<img class="${className}" src="${escapeHtml(d.snippetRef)}" alt="Cloud crop" loading="lazy" decoding="async">`:'';
  const raw=regionBounds(d.region),b={...raw,width:Math.max(raw.width,.0001),height:Math.max(raw.height,.0001)},ratio=photo.width&&photo.height?(photo.width*b.width)/(photo.height*b.height):4/3;
  return `<div class="crop-frame ${className}" style="position:relative;display:block;width:100%;overflow:hidden;background:#edf5fa;aspect-ratio:${ratio}" data-crop="${escapeHtml(JSON.stringify(b))}"><img src="${escapeHtml(photo.imageRef)}" alt="Cloud crop" loading="lazy" decoding="async" style="position:absolute;max-width:none;object-fit:fill;width:${100/b.width}%;height:${100/b.height}%;left:${-100*b.x/b.width}%;top:${-100*b.y/b.height}%"></div>`;
}
async function saveRealDetection(){
  const save=views.catch.querySelector('#save-detection');
  const feedback=views.catch.querySelector('#upload-feedback');
  const location=views.catch.querySelector('#photo-location')?.value||'Unknown';
  const pct=id=>Math.max(0,Math.min(100,Number(views.catch.querySelector(id)?.value||0)))/100;
  const region={type:'rect',x:pct('#det-x'),y:pct('#det-y'),width:pct('#det-w'),height:pct('#det-h')};
  if(region.width<=0||region.height<=0)return;
  const cloudTypeId=views.catch.querySelector('#det-type').value;
  if(!cloudTypeId)return;
  save.disabled=true;save.textContent='Saving cloud…';
  feedback.innerHTML='<div class="feedback"><strong>Saving cloud…</strong> Keeping the photo in your private atlas.</div>';
  const previousLibrary=library,previousPhotoId=pendingImage.photoId;
  try{
    if(!pendingImage?.photoId){const photo=makePhoto({location,imageRef:pendingImage.dataUrl,originalName:pendingImage.file.name,width:pendingImage.width,height:pendingImage.height,source:'upload'});library=addPhoto(library,photo);pendingImage.photoId=photo.id}
    const detection=makeDetection({photoId:pendingImage.photoId,cloudTypeId,confidence:Number(views.catch.querySelector('#det-confidence').value)/100,region,status:'confirmed',source:'manual-upload'});
    library=addDetection(library,detection);
    feedback.innerHTML=`<div class="feedback"><strong>Caught!</strong> ${getCloudType(detection.cloudTypeId).name} added. Drag another region on this photo to add another cloud.</div>`;
    await storage.saveLibrary(library);
  }catch(error){
    library=previousLibrary;pendingImage.photoId=previousPhotoId;
    save.disabled=false;save.textContent='Try saving again';
    feedback.innerHTML=`<div class="feedback error"><strong>Could not save.</strong> ${escapeHtml(error instanceof Error?error.message:'Please try again.')}</div>`;
  }
}

function renderDetectionThumb(d){const type=getCloudType(d.cloudTypeId);return`<figure class="detection-thumb ${d.status==='proposed'?'proposed':''}">${detectionCrop(d)}<figcaption><strong>${escapeHtml(type?.name||d.cloudTypeId)}</strong>${d.confidence==null?'':` · ${Math.round(d.confidence*100)}%`}${d.status==='proposed'?' · proposed':''}</figcaption></figure>`}
function renderPhotoJournal(){if(!library.photos.length)return'<p>No photos stored yet.</p>';return`<div class="photo-grid">${library.photos.map(photo=>{const detections=library.detections.filter(d=>d.photoId===photo.id&&d.status!=='rejected');const name=photo.originalName||`Photo ${photo.id.slice(0,8)}`;return`<article class="photo-tile">${photo.imageRef?`<img class="photo-thumb" src="${photo.imageRef}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">`:'<div class="photo-thumb photo-placeholder">☁</div>'}<div class="photo-meta"><strong class="photo-filename">${escapeHtml(name)}</strong><span>${escapeHtml(photo.location||'Unknown')}</span>${detections.length?`<div class="detection-thumbs">${detections.map(renderDetectionThumb).join('')}</div>`:'<p class="unclassified-note">No cloud regions identified yet.</p>'}</div></article>`}).join('')}</div>`}
function referenceArt(c){return`<div class="reference-photo-wrap"><img class="card-photo reference-photo" src="${c.referenceImage}" alt="Reference example of ${escapeHtml(c.name)}" loading="lazy" decoding="async"><span class="reference-badge">Example</span></div>`}
function renderAtlas(){
  const progress=levelProgress(library),locations=locationCollections(library),confirmed=library.detections.filter(d=>d.status==='confirmed'),visible=library.detections.filter(d=>d.status!=='rejected');
  views.atlas.innerHTML=`<div class="panel"><p class="eyebrow">Cloud Atlas</p><h2>Level 1 collection</h2><div class="stats"><div class="stat"><strong>${progress.caught}/${progress.required}</strong>types caught</div><div class="stat"><strong>${progress.complete?'Complete':'In progress'}</strong>level status</div><div class="stat"><strong>${library.photos.length}</strong>photos</div><div class="stat"><strong>${confirmed.length}</strong>confirmed clouds</div></div><div class="grid">${LEVEL_ONE.map(c=>{const d=confirmed.find(x=>x.cloudTypeId===c.id)||visible.find(x=>x.cloudTypeId===c.id);return`<article class="cloud-card ${d?'':'reference-card'} ${d&&d.status!=='confirmed'?'proposed-card':''}">${d?detectionCrop(d,'card-photo'):referenceArt(c)}<div class="cloud-copy"><p class="cloud-code">${c.code} · ${c.family}</p><h3>${c.name}</h3><p class="cloud-summary">${d?c.summary:c.clue}</p>${!d?'<p class="not-caught">Reference example — not your catch</p>':''}</div></article>`}).join('')}</div><h2>Photo journal</h2>${renderPhotoJournal()}<h2>Location cards</h2><div class="grid">${locations.map(p=>`<article class="cloud-card ${p.complete?'':'locked'}"><div class="cloud-copy"><p class="cloud-code">Level ${p.level}</p><h3>${escapeHtml(p.location)}</h3><p>${p.caught}/${p.required} cloud genera caught here</p></div></article>`).join('')}</div></div>`;
}
async function shareOrDownloadArchive(){
  const filename=`cloud-catcher-${new Date().toISOString().slice(0,10)}.json`,blob=await storage.exportArchive(library);
  const file=new File([blob],filename,{type:'application/json'});
  if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title:'Cloud Catcher atlas',text:'Save or share your private Cloud Catcher backup.'});return}
    catch(error){if(error instanceof DOMException&&error.name==='AbortError')return}
  }
  downloadBlob(blob,filename);
}
function renderData(){const proposed=library.detections.filter(d=>d.status==='proposed').length;views.data.innerHTML=`<div class="panel"><p class="eyebrow">Your data</p><h2>Stored privately in this browser</h2><p>Your atlas and photos stay on this device. Export opens your system share/save dialog, where you can choose Google Drive. Import opens the system file picker, where you can browse Drive and select a backup.</p><div class="toolbar"><button id="export" class="primary">Export / save backup</button><label class="button file-label">Import from files / Drive<input id="import" type="file" accept="application/json,.json"></label></div><p id="import-status" role="status"></p><p><b>${library.photos.length}</b> photos · <b>${library.detections.length}</b> detections · <b>${proposed}</b> awaiting confirmation</p></div>`;views.data.querySelector('#export').addEventListener('click',shareOrDownloadArchive);views.data.querySelector('#import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const status=views.data.querySelector('#import-status');try{library=await storage.importArchive(file);await storage.saveLibrary(library);renderData()}catch(error){status.textContent=error instanceof Error?error.message:'The archive could not be imported.';e.target.value=''}})}

async function importCloudPhotos({session=null,defaults={},catches=[]}){
  let sessionRecord=null;
  if(session){sessionRecord=makeSession({...defaults,...session,source:session.source||defaults.source||'ai'});library=addSession(library,sessionRecord)}
  const results=[];
  for(const item of catches){
    const imageRef=item.imageDataUrl||(item.file?await fileDataUrl(item.file):item.imageRef||null);
    const size=imageRef?await imageSize(imageRef):{width:item.width??null,height:item.height??null};
    const photo=makePhoto({...defaults,...item,sessionId:sessionRecord?.id||item.sessionId||null,imageRef,originalName:item.originalName||item.file?.name||null,width:size.width,height:size.height,source:item.source||defaults.source||'ai'});
    library=addPhoto(library,photo);
    const detections=[];
    for(const value of item.detections||[]){
      const detection=makeDetection({...value,photoId:photo.id,source:value.source||item.source||defaults.source||'ai'});
      library=addDetection(library,detection);
      detections.push(detection);
    }
    results.push({photo,detections});
  }
  await storage.saveLibrary(library);
  if(activeView==='atlas')renderAtlas();
  if(activeView==='data')renderData();
  return structuredClone({session:sessionRecord,results,summary:{photos:results.length,detections:results.reduce((sum,result)=>sum+result.detections.length,0)}});
}

window.cloudCatcher={getLibrary:()=>structuredClone(library),getCloudTypes:()=>structuredClone(LEVEL_ONE),getProgress:(location=null)=>levelProgress(library,1,location),importCloudPhotos,addPhoto:async data=>{const p=makePhoto(data);library=addPhoto(library,p);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(p)},addDetection:async data=>{const d=makeDetection(data);library=addDetection(library,d);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(d)},updateDetection:async(id,patch)=>{library=updateDetection(library,id,patch);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(library.detections.find(d=>d.id===id))}};
