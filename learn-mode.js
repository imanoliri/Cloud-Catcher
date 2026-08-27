import {LEVEL_ONE,getCloudType} from './src/taxonomy.js';

const learnView=document.querySelector('#learn-view');
const catchView=document.querySelector('#catch-view');
let current=null;
let answered=false;

function shuffle(items){return[...items].sort(()=>Math.random()-.5)}
function chooseQuestion(){
  current=LEVEL_ONE[Math.floor(Math.random()*LEVEL_ONE.length)];
  answered=false;
}
function renderLearn(){
  if(!current)chooseQuestion();
  const choices=shuffle([current,...shuffle(LEVEL_ONE.filter(c=>c.id!==current.id)).slice(0,3)]);
  learnView.innerHTML=`<div class="hero learn-hero"><div><p class="eyebrow">Learn · Level 1</p><h2>Learn the cloud genera</h2><p>This quiz is for practice only. Answers never create catches or change your Atlas progress.</p><div class="choices">${choices.map(c=>`<button data-learn-choice="${c.id}">${c.name}</button>`).join('')}</div><div id="learn-feedback"></div></div><div class="sky-stage" aria-label="Stylized cloud learning challenge"></div></div>`;
  learnView.querySelectorAll('[data-learn-choice]').forEach(button=>button.addEventListener('click',()=>answer(button.dataset.learnChoice)));
}
function answer(id){
  if(answered)return;
  answered=true;
  const correct=id===current.id;
  const type=getCloudType(current.id);
  const feedback=learnView.querySelector('#learn-feedback');
  feedback.innerHTML=`<div class="feedback"><strong>${correct?'Correct!':'Not quite.'}</strong> This is <b>${type.name}</b>. ${type.clue}<div class="toolbar"><button id="learn-next" class="primary">Next cloud</button></div></div>`;
  learnView.querySelector('#learn-next').addEventListener('click',()=>{chooseQuestion();renderLearn()});
}

function simplifyCatch(){
  const hero=catchView.querySelector(':scope > .hero');
  if(hero)hero.remove();
  const panel=catchView.querySelector(':scope > .panel');
  if(panel){
    const eyebrow=panel.querySelector('.eyebrow');
    const title=panel.querySelector('h2');
    const intro=panel.querySelector('h2 + p');
    if(eyebrow)eyebrow.textContent='Real sky';
    if(title)title.textContent='Catch clouds from a photo';
    if(intro)intro.textContent='Choose a photo, drag over one cloud region, classify it, and save it. Repeat on the same photo for every cloud you want to catch.';
  }
}

new MutationObserver(simplifyCatch).observe(catchView,{childList:true,subtree:true});
simplifyCatch();
renderLearn();

const navButtons=[...document.querySelectorAll('nav button')];
navButtons.forEach(button=>button.addEventListener('click',()=>{
  const isLearn=button.dataset.view==='learn';
  learnView.classList.toggle('active',isLearn);
  if(!isLearn)learnView.classList.remove('active');
}));
