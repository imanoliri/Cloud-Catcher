import {LEVEL_ONE,getCloudType} from './src/taxonomy.js';
import {addDetection,addPhoto,addSession,levelProgress,locationCollections,makeDetection,makePhoto,makeSession,pendingProposals,updateDetection,updatePhoto} from './src/domain.js';
import {parseExifMetadata} from './src/exif.js';
import {canonicalizeLibraryMedia,createDefaultStorageProvider,downloadBlob} from './src/storage.js';

const storage=createDefaultStorageProvider();
const storageMode=storage.mode==='lifeos'?'lifeos':'browser';
const views={learn:document.querySelector('#learn-view'),quiz:document.querySelector('#quiz-view'),catch:document.querySelector('#catch-view'),atlas:document.querySelector('#atlas-view'),data:document.querySelector('#data-view')};
let activeView='learn';
let library=null;
let pendingImage=null;
let editingDetectionId=null;
let atlasFilters={status:'all',genus:'',location:''};
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
const formatBytes=bytes=>bytes<1024?`${bytes} B`:bytes<1024*1024?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/(1024*1024)).toFixed(2)} MB`;

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
  const left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12));
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
      if(pinnedQuizHelp===help){pinnedQuizHelp=null;hideQuizTooltip()}
      else{pinnedQuizHelp=help;hideQuizTooltip();showQuizTooltip(help)}
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

function existingDetectionsPayload(photoId){
  if(!photoId||!library)return[];
  return library.detections
    .filter(d=>d.photoId===photoId&&d.status!=='rejected')
    .map(d=>({id:d.id,cloudTypeId:d.cloudTypeId,name:getCloudType(d.cloudTypeId)?.name||d.cloudTypeId,status:d.status,confidence:d.confidence,notes:d.notes||'',region:d.region}));
}

function syncPreviewDetections(){
  const img=views.catch.querySelector('#photo-preview img.photo-preview');
  if(!img)return;
  img.dataset.existingDetections=JSON.stringify(existingDetectionsPayload(pendingImage?.photoId));
  img.dataset.editingId=editingDetectionId||'';
  window.dispatchEvent(new CustomEvent('cloud-catcher-regions-updated',{detail:{editingId:editingDetectionId||''}}));
}

function renderCatch(){
  const existingJson=escapeHtml(JSON.stringify(existingDetectionsPayload(pendingImage?.photoId)));
  const editingDet=editingDetectionId?library.detections.find(d=>d.id===editingDetectionId):null;
  const editNotice=editingDet?`<div class="feedback"><strong>Editing region:</strong> ${escapeHtml(getCloudType(editingDet.cloudTypeId)?.name||editingDet.cloudTypeId)} (${escapeHtml(editingDet.status)}). Drag a new box on the photo or adjust fields, then save. <button id="cancel-edit-region" type="button">Cancel edit</button></div>`:'';
  const exifNote=pendingImage?.exifSummary?`<p class="muted exif-hint">${escapeHtml(pendingImage.exifSummary)}</p>`:'';
  views.catch.innerHTML=`<div class="panel"><p class="eyebrow">Real sky</p><h2>Catch clouds from a photo</h2><p>Take a photo with your camera or choose an existing photo, drag over one cloud region, classify it, and save it. Tap an existing overlay box on the photo to refine its region.</p><div class="toolbar catch-upload-bar"><label class="button primary file-label">Take photo<input id="photo-camera" type="file" accept="image/*" capture="environment"></label><label class="button file-label">Choose photo<input id="photo-file" type="file" accept="image/*"></label></div>${editNotice}<div class="upload-grid"><div>${exifNote}<div id="photo-preview">${pendingImage?`<img class="photo-preview" src="${escapeHtml(pendingImage.dataUrl)}" alt="Uploaded cloud photo" decoding="async" data-existing-detections="${existingJson}" data-editing-id="${escapeHtml(editingDetectionId||'')}">`:'<p class="muted">No photo selected.</p>'}</div></div><div>${pendingImage?detectionForm(editingDet):''}</div></div><div id="upload-feedback" role="status" aria-live="polite"></div></div>`;
  views.catch.querySelector('#photo-camera')?.addEventListener('change',loadPhoto);
  views.catch.querySelector('#photo-file')?.addEventListener('change',loadPhoto);
  views.catch.querySelector('#save-detection')?.addEventListener('click',saveRealDetection);
  views.catch.querySelector('#cancel-edit-region')?.addEventListener('click',()=>{editingDetectionId=null;renderCatch()});
}

function detectionForm(editingDet=null){
  const activePhoto=pendingImage?.photoId?library.photos.find(p=>p.id===pendingImage.photoId):null;
  const loc=activePhoto?.location||pendingImage?.gpsHint||'San Sebastián';
  const selectedType=editingDet?.cloudTypeId||'';
  const conf=editingDet?.confidence!=null?Math.round(editingDet.confidence*100):90;
  const r=editingDet?regionBounds(editingDet.region):{x:0,y:0,width:0,height:0};
  const pctVal=n=>Math.round((Number(n)||0)*1000)/10;
  const btnText=editingDet?'Update region':'Select a cloud region first';
  return `<label>Location<br><input id="photo-location" type="text" value="${escapeHtml(loc)}"></label><label>Cloud type<br><select id="det-type"><option value="" ${selectedType?'':'selected'}>Choose cloud type</option>${LEVEL_ONE.map(c=>`<option value="${c.id}" ${selectedType===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label><label>Confidence (0–100%)<br><input id="det-confidence" type="number" min="0" max="100" value="${conf}"></label><label>Notes<br><input id="det-notes" type="text" value="${escapeHtml(editingDet?.notes||'')}" placeholder="Sky context or altitude notes"></label><fieldset><legend>Crop region (% of photo)</legend><div class="region-grid"><label>Left<input id="det-x" type="number" min="0" max="100" value="${pctVal(r.x)}"></label><label>Top<input id="det-y" type="number" min="0" max="100" value="${pctVal(r.y)}"></label><label>Width<input id="det-w" type="number" min="0" max="100" value="${pctVal(r.width)}"></label><label>Height<input id="det-h" type="number" min="0" max="100" value="${pctVal(r.height)}"></label></div></fieldset><div class="toolbar"><button id="save-detection" class="primary">${btnText}</button></div><p class="muted">After saving, drag another region on this same image to add another cloud.</p>`;
}

async function loadPhoto(e){
  const file=e.target.files?.[0];
  if(!file)return;
  const [dataUrl,buf]=await Promise.all([fileDataUrl(file),file.arrayBuffer().catch(()=>null)]);
  const [size,exif]=[await imageSize(dataUrl),buf?parseExifMetadata(buf):{}];
  const exifParts=[];
  if(exif.observedAt)exifParts.push(`Captured ${exif.observedAt.slice(0,16).replace('T',' ')} UTC`);
  if(exif.gps)exifParts.push(`GPS ${exif.gps.lat}, ${exif.gps.lon}`);
  editingDetectionId=null;
  pendingImage={file,name:file.name||'cloud.jpg',dataUrl,...size,photoId:null,observedAt:exif.observedAt||new Date().toISOString(),gpsHint:exif.gps?`${exif.gps.lat}, ${exif.gps.lon}`:'',exifSummary:exifParts.join(' · ')};
  renderCatch();
}

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
  const notes=views.catch.querySelector('#det-notes')?.value||'';
  const pct=id=>Math.max(0,Math.min(100,Number(views.catch.querySelector(id)?.value||0)))/100;
  const region={type:'rect',x:pct('#det-x'),y:pct('#det-y'),width:pct('#det-w'),height:pct('#det-h')};
  if(region.width<=0||region.height<=0)return;
  const cloudTypeId=views.catch.querySelector('#det-type').value;
  if(!cloudTypeId)return;
  const confidence=Number(views.catch.querySelector('#det-confidence').value)/100;
  save.disabled=true;save.textContent='Saving cloud…';
  feedback.innerHTML='<div class="feedback"><strong>Saving cloud…</strong> Keeping the photo in your private atlas.</div>';
  const previousLibrary=library,previousPhotoId=pendingImage.photoId,wasEditingId=editingDetectionId;
  try{
    if(!pendingImage?.photoId){
      const photo=makePhoto({location,observedAt:pendingImage.observedAt||new Date().toISOString(),imageRef:pendingImage.dataUrl,originalName:pendingImage.file?.name||pendingImage.name||'cloud.jpg',width:pendingImage.width,height:pendingImage.height,source:'upload'});
      library=addPhoto(library,photo);pendingImage.photoId=photo.id;
    }else if(location.trim()){
      library=updatePhoto(library,pendingImage.photoId,{location});
    }
    if(wasEditingId){
      library=updateDetection(library,wasEditingId,{cloudTypeId,confidence,region,notes,status:'confirmed'});
      editingDetectionId=null;
      feedback.innerHTML=`<div class="feedback"><strong>Updated!</strong> ${getCloudType(cloudTypeId).name} region updated and confirmed.</div>`;
    }else{
      const detection=makeDetection({photoId:pendingImage.photoId,cloudTypeId,confidence,region,notes,status:'confirmed',source:'manual-upload'});
      library=addDetection(library,detection);
      feedback.innerHTML=`<div class="feedback"><strong>Caught!</strong> ${getCloudType(detection.cloudTypeId).name} added. Drag another region on this photo to add another cloud.</div>`;
    }
    window.dispatchEvent(new CustomEvent('cloud-catcher-saved'));
    syncPreviewDetections();
    await storage.saveLibrary(library);
  }catch(error){
    library=previousLibrary;pendingImage.photoId=previousPhotoId;editingDetectionId=wasEditingId;
    save.disabled=false;save.textContent='Try saving again';
    feedback.innerHTML=`<div class="feedback error"><strong>Could not save.</strong> ${escapeHtml(error instanceof Error?error.message:'Please try again.')}</div>`;
  }
}

views.catch.addEventListener('cloud-catcher-select-detection',event=>{
  const detId=event.detail?.detectionId||'';
  if(!detId||!pendingImage)return;
  editingDetectionId=detId;
  renderCatch();
});

function renderReviewQueue(){
  const proposals=pendingProposals(library);
  if(!proposals.length)return '';
  const photos=new Map(library.photos.map(p=>[p.id,p]));
  const cards=proposals.map(d=>{
    const photo=photos.get(d.photoId);
    const confPct=d.confidence==null?'':Math.round(d.confidence*100);
    const alts=Array.isArray(d.alternatives)?d.alternatives:[];
    return `<article class="review-card" data-review-id="${escapeHtml(d.id)}">
      <div class="review-thumb" data-detection-id="${escapeHtml(d.id)}" role="button" tabindex="0">${detectionCrop(d)}</div>
      <div class="review-body">
        <p class="cloud-code">${escapeHtml(photo?.location||'Unknown')} · ${escapeHtml((photo?.observedAt||'').slice(0,10))} · ${escapeHtml(d.source||'ai')}</p>
        ${d.explanation?`<p class="review-explanation">${escapeHtml(d.explanation)}</p>`:''}
        ${alts.length?`<div class="review-alts"><span>Also check:</span> ${alts.map(a=>`<button type="button" class="pill-btn" data-alt-genus="${escapeHtml(a)}">${escapeHtml(getCloudType(a)?.name||a)}</button>`).join('')}</div>`:''}
        <div class="review-fields">
          <label>Genus <select class="review-type">${LEVEL_ONE.map(c=>`<option value="${c.id}" ${c.id===d.cloudTypeId?'selected':''}>${c.name}</option>`).join('')}</select></label>
          <label>Confidence % <input class="review-conf" type="number" min="0" max="100" value="${confPct}"></label>
          <label>Notes <input class="review-notes" type="text" value="${escapeHtml(d.notes||'')}" placeholder="Optional field notes"></label>
        </div>
        <div class="toolbar review-actions">
          <button type="button" class="primary" data-review-action="confirm">Confirm</button>
          <button type="button" data-review-action="redraw">Redraw</button>
          <button type="button" data-review-action="reject">Reject</button>
        </div>
      </div>
    </article>`;
  }).join('');
  return `<section class="review-queue" aria-labelledby="review-queue-title"><h3 id="review-queue-title">Needs Review (${proposals.length})</h3><div class="review-list">${cards}</div></section>`;
}

function filteredJournalPhotos(){
  return library.photos.filter(photo=>{
    if(atlasFilters.location&&photo.location!==atlasFilters.location)return false;
    const activeDets=library.detections.filter(d=>d.photoId===photo.id&&d.status!=='rejected');
    if(atlasFilters.status==='confirmed'&&!activeDets.some(d=>d.status==='confirmed'))return false;
    if(atlasFilters.status==='proposed'&&!activeDets.some(d=>d.status==='proposed'))return false;
    if(atlasFilters.genus&&!activeDets.some(d=>d.cloudTypeId===atlasFilters.genus&&(atlasFilters.status==='all'||d.status===atlasFilters.status)))return false;
    return true;
  });
}

function renderDetectionThumb(d){const type=getCloudType(d.cloudTypeId);return`<figure class="detection-thumb ${d.status==='proposed'?'proposed':''}" data-detection-id="${escapeHtml(d.id)}" role="button" tabindex="0" aria-label="Inspect ${escapeHtml(type?.name||d.cloudTypeId)} detection">${detectionCrop(d)}<figcaption><strong>${escapeHtml(type?.name||d.cloudTypeId)}</strong>${d.confidence==null?'':` · ${Math.round(d.confidence*100)}%`}${d.status==='proposed'?' · proposed':''}</figcaption></figure>`}
function renderPhotoJournal(){
  const photos=filteredJournalPhotos();
  if(!library.photos.length)return'<p>No photos stored yet.</p>';
  if(!photos.length)return'<p class="muted">No observations match the active filter.</p>';
  return`<div class="photo-grid">${photos.map(photo=>{const detections=library.detections.filter(d=>d.photoId===photo.id&&d.status!=='rejected');const name=photo.originalName||`Photo ${photo.id.slice(0,8)}`;return`<article class="photo-tile">${photo.imageRef?`<img class="photo-thumb" src="${photo.imageRef}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">`:'<div class="photo-thumb photo-placeholder">☁</div>'}<div class="photo-meta"><strong class="photo-filename">${escapeHtml(name)}</strong><span>${escapeHtml(photo.location||'Unknown')}</span>${detections.length?`<div class="detection-thumbs">${detections.map(renderDetectionThumb).join('')}</div>`:'<p class="unclassified-note">No cloud regions identified yet.</p>'}</div></article>`}).join('')}</div>`;
}
function referenceArt(c){return`<div class="reference-photo-wrap"><img class="card-photo reference-photo" src="${c.referenceImage}" alt="Reference example of ${escapeHtml(c.name)}" loading="lazy" decoding="async"><span class="reference-badge">Example</span></div>`}

function renderAtlasFilters(){
  const locations=[...new Set(library.photos.map(p=>p.location).filter(Boolean))].sort();
  return `<div class="atlas-filters">
    <label>Status <select id="atlas-filter-status"><option value="all" ${atlasFilters.status==='all'?'selected':''}>All</option><option value="confirmed" ${atlasFilters.status==='confirmed'?'selected':''}>Confirmed</option><option value="proposed" ${atlasFilters.status==='proposed'?'selected':''}>Needs Review</option></select></label>
    <label>Genus <select id="atlas-filter-genus"><option value="">All genera</option>${LEVEL_ONE.map(c=>`<option value="${c.id}" ${atlasFilters.genus===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label>
    <label>Location <select id="atlas-filter-location"><option value="">All locations</option>${locations.map(l=>`<option value="${escapeHtml(l)}" ${atlasFilters.location===l?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select></label>
  </div>`;
}

function wireReviewQueueHandlers(){
  views.atlas.querySelectorAll('.review-card').forEach(card=>{
    const id=card.dataset.reviewId;
    const select=card.querySelector('.review-type');
    card.querySelectorAll('[data-alt-genus]').forEach(btn=>btn.addEventListener('click',()=>{if(select)select.value=btn.dataset.altGenus}));
    card.querySelector('[data-review-action="confirm"]')?.addEventListener('click',async()=>{
      const confVal=card.querySelector('.review-conf')?.value;
      const confidence=confVal===''||confVal==null?undefined:Number(confVal)/100;
      const notes=card.querySelector('.review-notes')?.value??'';
      library=updateDetection(library,id,{cloudTypeId:select?.value,notes,status:'confirmed',...(confidence!==undefined?{confidence}:{})});
      await storage.saveLibrary(library);
      renderAtlas();
    });
    card.querySelector('[data-review-action="reject"]')?.addEventListener('click',async()=>{
      const notes=card.querySelector('.review-notes')?.value??'';
      library=updateDetection(library,id,{notes,status:'rejected'});
      await storage.saveLibrary(library);
      renderAtlas();
    });
    card.querySelector('[data-review-action="redraw"]')?.addEventListener('click',()=>{
      const det=library.detections.find(d=>d.id===id);
      if(det)openInCatchForEdit(det.photoId,det.id);
    });
  });
}

function renderAtlas(){
  const progress=levelProgress(library),locations=locationCollections(library),confirmed=library.detections.filter(d=>d.status==='confirmed'),visible=library.detections.filter(d=>d.status!=='rejected');
  views.atlas.innerHTML=`<div class="panel"><p class="eyebrow">Cloud Atlas</p><h2>Level 1 collection</h2><div class="stats"><div class="stat"><strong>${progress.caught}/${progress.required}</strong>types caught</div><div class="stat"><strong>${progress.complete?'Complete':'In progress'}</strong>level status</div><div class="stat"><strong>${library.photos.length}</strong>photos</div><div class="stat"><strong>${confirmed.length}</strong>confirmed clouds</div></div>${renderReviewQueue()}<div class="grid">${LEVEL_ONE.map(c=>{const d=confirmed.find(x=>x.cloudTypeId===c.id)||visible.find(x=>x.cloudTypeId===c.id);return`<article class="cloud-card ${d?'':'reference-card'} ${d&&d.status!=='confirmed'?'proposed-card':''}" ${d?`data-detection-id="${escapeHtml(d.id)}"`:''}>${d?detectionCrop(d,'card-photo'):referenceArt(c)}<div class="cloud-copy"><p class="cloud-code">${c.code} · ${c.family}</p><h3>${c.name}</h3><p class="cloud-summary">${d?c.summary:c.clue}</p>${!d?'<p class="not-caught">Reference example — not your catch</p>':''}</div></article>`}).join('')}</div><h2>Photo journal</h2>${renderAtlasFilters()}${renderPhotoJournal()}<h2>Location cards</h2><div class="grid">${locations.map(p=>`<article class="cloud-card ${p.complete?'':'locked'}"><div class="cloud-copy"><p class="cloud-code">Level ${p.level}</p><h3>${escapeHtml(p.location)}</h3><p>${p.caught}/${p.required} cloud genera caught here</p></div></article>`).join('')}</div></div>`;
  wireReviewQueueHandlers();
  views.atlas.querySelector('#atlas-filter-status')?.addEventListener('change',e=>{atlasFilters.status=e.target.value;renderAtlas()});
  views.atlas.querySelector('#atlas-filter-genus')?.addEventListener('change',e=>{atlasFilters.genus=e.target.value;renderAtlas()});
  views.atlas.querySelector('#atlas-filter-location')?.addEventListener('change',e=>{atlasFilters.location=e.target.value;renderAtlas()});
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
function renderData(){
  const proposed=library.detections.filter(d=>d.status==='proposed').length;
  const approxBytes=new Blob([JSON.stringify(canonicalizeLibraryMedia(library))]).size;
  const heading=storageMode==='lifeos'?'Connected to private LifeOS tailnet atlas':'Stored privately in this browser';
  const desc=storageMode==='lifeos'?'Photos and observations sync to your private LifeOS server over your tailnet. You can still export a self-contained JSON backup or return to LifeOS anytime.':'Your atlas and photos stay on this device. Export opens your system share/save dialog, where you can choose Google Drive. Import opens the system file picker, where you can browse Drive and select a backup.';
  const backBtn=storageMode==='lifeos'?'<a class="button" href="/">Back to LifeOS</a>':'';
  views.data.innerHTML=`<div class="panel"><p class="eyebrow">Your data</p><h2>${heading}</h2><p>${desc}</p><div class="toolbar"><button id="export" class="primary">Export / save backup</button><label class="button file-label">Import from files / Drive<input id="import" type="file" accept="application/json,.json"></label>${backBtn}</div><p id="import-status" role="status"></p><p><b>${library.photos.length}</b> photos · <b>${library.detections.length}</b> detections · <b>${proposed}</b> awaiting confirmation</p><p class="muted" id="storage-quota-note">Atlas footprint: ${formatBytes(approxBytes)}</p></div>`;
  if(navigator.storage?.estimate){
    navigator.storage.estimate().then(est=>{
      const note=views.data.querySelector('#storage-quota-note');
      if(note&&est?.quota)note.textContent=`Atlas footprint: ${formatBytes(approxBytes)} · Browser storage: ${formatBytes(est.usage||0)} / ${formatBytes(est.quota)}`;
    }).catch(()=>{});
  }
  views.data.querySelector('#export').addEventListener('click',shareOrDownloadArchive);
  views.data.querySelector('#import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const status=views.data.querySelector('#import-status');try{library=await storage.importArchive(file);library=await storage.saveLibrary(library);renderData()}catch(error){status.textContent=error instanceof Error?error.message:'The archive could not be imported.';e.target.value=''}});
}

async function openInCatchForEdit(photoId,detectionId=null){
  const photo=library.photos.find(p=>p.id===photoId);
  if(!photo?.imageRef)return false;
  let size={width:photo.width??null,height:photo.height??null};
  if(!size.width||!size.height){size=await imageSize(photo.imageRef).catch(()=>({width:null,height:null}))}
  editingDetectionId=detectionId;
  pendingImage={file:{name:photo.originalName||'cloud.jpg'},name:photo.originalName||'cloud.jpg',dataUrl:photo.imageRef,width:size.width,height:size.height,photoId:photo.id,observedAt:photo.observedAt||new Date().toISOString(),gpsHint:photo.location||'',exifSummary:''};
  showView('catch');
  return true;
}

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

window.cloudCatcher={
  getLibrary:()=>structuredClone(library),
  getCloudTypes:()=>structuredClone(LEVEL_ONE),
  getProgress:(location=null)=>levelProgress(library,1,location),
  getStorageMode:()=>storageMode,
  openInCatchForEdit,
  importCloudPhotos,
  addPhoto:async data=>{const p=makePhoto(data);library=addPhoto(library,p);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(p)},
  updatePhoto:async(id,patch)=>{library=updatePhoto(library,id,patch);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(library.photos.find(p=>p.id===id))},
  addDetection:async data=>{const d=makeDetection(data);library=addDetection(library,d);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(d)},
  updateDetection:async(id,patch)=>{library=updateDetection(library,id,patch);await storage.saveLibrary(library);if(activeView==='atlas')renderAtlas();return structuredClone(library.detections.find(d=>d.id===id))},
};
