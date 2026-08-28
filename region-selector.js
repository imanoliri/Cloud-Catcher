const catchView=document.querySelector('#catch-view');

let active=null;

function clamp(v){return Math.max(0,Math.min(1,v))}
function setField(id,value){const input=document.querySelector(id);if(input)input.value=String(Math.round(value*1000)/10)}
function syncRegion(region){setField('#det-x',region.x);setField('#det-y',region.y);setField('#det-w',region.width);setField('#det-h',region.height)}
function showStep(step){window.dispatchEvent(new CustomEvent('cloud-catcher-step',{detail:step}))}
function updateSaveState(){
  if(!active)return;
  const classified=Boolean(active.type.value);
  active.save.disabled=!active.valid||!classified;
  active.save.textContent=!active.valid?'Select a cloud region first':classified?'Save cloud':'Choose its cloud type';
  showStep(!active.valid?2:classified?4:3);
}

function clearSelection(message='Drag over a cloud to select the next region.'){
  if(!active)return;
  active.selection.hidden=true;
  active.selection.style.cssText='';
  active.valid=false;
  syncRegion({x:0,y:0,width:0,height:0});
  updateSaveState();
  active.help.textContent=message;
}

function drawSelection(region){
  if(!active)return;
  const {selection}=active;
  selection.hidden=false;
  selection.style.left=`${region.x*100}%`;
  selection.style.top=`${region.y*100}%`;
  selection.style.width=`${region.width*100}%`;
  selection.style.height=`${region.height*100}%`;
}

function point(event,box){
  return{x:clamp((event.clientX-box.left)/box.width),y:clamp((event.clientY-box.top)/box.height)};
}

function setupSelector(){
  const image=catchView.querySelector('#photo-preview img.photo-preview');
  const fieldset=catchView.querySelector('fieldset');
  const save=catchView.querySelector('#save-detection');
  const type=catchView.querySelector('#det-type');
  if(!image||!fieldset||!save||!type||image.dataset.regionSelector==='true')return;
  image.dataset.regionSelector='true';
  fieldset.classList.add('region-numeric-fallback');
  fieldset.setAttribute('aria-hidden','true');

  const shell=document.createElement('div');
  shell.className='region-selector';
  image.parentNode.insertBefore(shell,image);
  shell.appendChild(image);

  const shade=document.createElement('div');
  shade.className='region-selector-shade';
  const selection=document.createElement('div');
  selection.className='region-selection';
  selection.hidden=true;
  shell.append(shade,selection);

  const help=document.createElement('p');
  help.className='region-help';
  help.textContent='Drag over a cloud to select the region you want to classify.';
  shell.insertAdjacentElement('afterend',help);

  active={shell,selection,help,save,type,valid:false,start:null,pointerId:null};
  updateSaveState();
  type.addEventListener('change',updateSaveState);
  syncRegion({x:0,y:0,width:0,height:0});

  shell.addEventListener('pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;
    const box=shell.getBoundingClientRect();
    const start=point(event,box);
    active.start=start;
    active.pointerId=event.pointerId;
    active.valid=false;
    shell.setPointerCapture?.(event.pointerId);
    drawSelection({x:start.x,y:start.y,width:0,height:0});
    event.preventDefault();
  });

  shell.addEventListener('pointermove',event=>{
    if(active?.pointerId!==event.pointerId||!active.start)return;
    const box=shell.getBoundingClientRect();
    const end=point(event,box);
    const region={x:Math.min(active.start.x,end.x),y:Math.min(active.start.y,end.y),width:Math.abs(end.x-active.start.x),height:Math.abs(end.y-active.start.y)};
    drawSelection(region);
    syncRegion(region);
    event.preventDefault();
  });

  function finish(event){
    if(active?.pointerId!==event.pointerId||!active.start)return;
    const box=shell.getBoundingClientRect();
    const end=point(event,box);
    const region={x:Math.min(active.start.x,end.x),y:Math.min(active.start.y,end.y),width:Math.abs(end.x-active.start.x),height:Math.abs(end.y-active.start.y)};
    active.start=null;active.pointerId=null;
    if(region.width<.025||region.height<.025){clearSelection('That selection was too small. Drag a box around the cloud you want to classify.');return}
    active.valid=true;
    drawSelection(region);syncRegion(region);
    updateSaveState();
    active.help.textContent='Selected region ready. Choose its cloud type, then add it. Drag again to replace the selection.';
    event.preventDefault();
  }
  shell.addEventListener('pointerup',finish);
  shell.addEventListener('pointercancel',()=>clearSelection());
}

new MutationObserver(()=>setupSelector()).observe(catchView,{childList:true,subtree:true});
new MutationObserver(()=>{
  const feedback=catchView.querySelector('#upload-feedback');
  if(feedback?.textContent?.includes('Caught!'))clearSelection('Caught. Drag over another cloud in this same photo to add another region.');
}).observe(catchView,{childList:true,subtree:true,characterData:true});

setupSelector();
