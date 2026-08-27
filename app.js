import {LEVEL_ONE,getCloudType} from './src/taxonomy.js';
import {addObservation,levelProgress,locationCollections,makeObservation} from './src/domain.js';
import {BrowserStorageProvider,downloadBlob} from './src/storage.js';

const storage=new BrowserStorageProvider();
let library=await storage.loadLibrary();
let current=LEVEL_ONE[Math.floor(Math.random()*LEVEL_ONE.length)];
let answered=false;
const views={catch:document.querySelector('#catch-view'),atlas:document.querySelector('#atlas-view'),data:document.querySelector('#data-view')};

document.querySelectorAll('nav button').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
function showView(name){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));Object.entries(views).forEach(([k,v])=>v.classList.toggle('active',k===name));render()}
function shuffle(a){return[...a].sort(()=>Math.random()-.5)}
function escapeHtml(v=''){return v.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function render(){renderCatch();renderAtlas();renderData()}
function renderCatch(){
  const choices=shuffle([current,...shuffle(LEVEL_ONE.filter(c=>c.id!==current.id)).slice(0,3)]);
  views.catch.innerHTML=`<div class="hero"><div><p class="eyebrow">Level 1 · 10 genera</p><h2>What cloud did you catch?</h2><p>Learn the ten principal cloud genera by identifying them and building your personal atlas.</p><label>Location<br><input id="location" type="text" value="San Sebastián" aria-label="Observation location"></label><div class="choices">${choices.map(c=>`<button data-choice="${c.id}">${c.name}</button>`).join('')}</div><div id="feedback"></div></div><div class="sky-stage" aria-label="Stylized cloud challenge"></div></div>`;
  views.catch.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.choice)));
}
async function answer(id){
  if(answered)return;answered=true;const correct=id===current.id;const type=getCloudType(current.id);const feedback=document.querySelector('#feedback');
  if(correct){const location=document.querySelector('#location').value||'Unknown';library=addObservation(library,makeObservation({cloudTypeId:current.id,location,source:'quiz'}));await storage.saveLibrary(library)}
  feedback.innerHTML=`<div class="feedback"><strong>${correct?'Caught!':'Not quite.'}</strong> This is <b>${type.name}</b>. ${type.clue}<div class="toolbar"><button id="next" class="primary">Next cloud</button></div></div>`;
  document.querySelector('#next').addEventListener('click',()=>{current=LEVEL_ONE[Math.floor(Math.random()*LEVEL_ONE.length)];answered=false;render()})
}
function renderAtlas(){
  const progress=levelProgress(library);const caught=new Set(progress.caughtIds);const locations=locationCollections(library);
  views.atlas.innerHTML=`<div class="panel"><p class="eyebrow">Cloud Atlas</p><h2>Level 1 collection</h2><div class="stats"><div class="stat"><strong>${progress.caught}/${progress.required}</strong>types caught</div><div class="stat"><strong>${progress.complete?'Complete':'In progress'}</strong>level status</div></div><div class="grid">${LEVEL_ONE.map(c=>`<article class="cloud-card ${caught.has(c.id)?'':'locked'}"><div class="cloud-art"></div><div class="cloud-copy"><p class="cloud-code">${c.code} · ${c.family}</p><h3>${caught.has(c.id)?c.name:'Unknown cloud'}</h3><p class="cloud-summary">${caught.has(c.id)?c.summary:'Catch this genus to reveal its card.'}</p></div></article>`).join('')}</div><h2>Location cards</h2><div class="grid">${locations.length?locations.map(p=>`<article class="cloud-card ${p.complete?'':'locked'}"><div class="cloud-art"></div><div class="cloud-copy"><p class="cloud-code">Level ${p.level}</p><h3>${escapeHtml(p.location)}</h3><p>${p.caught}/${p.required} cloud genera caught here${p.complete?' · Location card unlocked!':''}</p></div></article>`).join(''):'<p>No locations caught yet.</p>'}</div></div>`
}
function renderData(){
  views.data.innerHTML=`<div class="panel"><p class="eyebrow">Your data</p><h2>Portable by design</h2><p>Your browser copy is offline-first. Export it whenever you want; the file is a versioned Cloud Catcher library that can be imported on another device or stored anywhere.</p><div class="toolbar"><button id="export" class="primary">Export library</button><label class="button file-label">Import library<input id="import" type="file" accept="application/json,.json"></label></div><p><b>${library.observations.length}</b> observations · <b>${library.albums.length}</b> manual albums</p><hr><h3>AI API</h3><p>On Netlify, AI clients can use <code>/api/cloud-types</code>, <code>/api/observations</code>, <code>/api/albums</code> and <code>/api/progress</code>. Mutations require <code>CLOUD_CATCHER_API_TOKEN</code>.</p><h3>Google Drive</h3><p>The repository includes a Google Drive storage provider. It reads and writes the same portable library format through the Drive API, so Drive is replaceable storage rather than a lock-in.</p></div>`;
  document.querySelector('#export').addEventListener('click',async()=>downloadBlob(await storage.exportArchive(library),`cloud-catcher-${new Date().toISOString().slice(0,10)}.json`));
  document.querySelector('#import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;library=await storage.importArchive(file);await storage.saveLibrary(library);render()})
}

window.cloudCatcher={getLibrary:()=>structuredClone(library),getCloudTypes:()=>structuredClone(LEVEL_ONE),getProgress:(location=null)=>levelProgress(library,1,location),addObservation:async data=>{library=addObservation(library,makeObservation(data));await storage.saveLibrary(library);render();return structuredClone(library.observations.at(-1))}};
render();
