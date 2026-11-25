const catchView=document.querySelector('#catch-view');

let active=null;

function clamp(v){return Math.max(0,Math.min(1,v))}
function setField(id,value){const input=document.querySelector(id);if(input)input.value=String(Math.round(value*1000)/10)}
function syncRegion(region){setField('#det-x',region.x);setField('#det-y',region.y);setField('#det-w',region.width);setField('#det-h',region.height)}
function updateSaveState(){
  if(!active)return;
  const classified=Boolean(active.type.value);
  const editing=Boolean(active.image?.dataset.editingId);
  active.save.disabled=!active.valid||!classified;
  active.save.textContent=!active.valid?'Select a cloud region first':classified?(editing?'Update region':'Save cloud'):'Choose its cloud type';
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

function renderSavedOverlays(){
  if(!active)return;
  const {image,overlaysLayer}=active;
  overlaysLayer.innerHTML='';
  let list=[];
  try{list=JSON.parse(image.dataset.existingDetections||'[]')}catch(_){list=[]}
  const editingId=image.dataset.editingId||'';
  if(!Array.isArray(list))return;
  for(const item of list){
    const r=item?.region?.type==='rect'?item.region:null;
    if(!r||r.width<=0||r.height<=0)continue;
    const box=document.createElement('button');
    box.type='button';
    box.className=`existing-region ${item.status==='proposed'?'is-proposed':'is-confirmed'} ${item.id===editingId?'is-editing':''}`.trim();
    box.style.left=`${r.x*100}%`;
    box.style.top=`${r.y*100}%`;
    box.style.width=`${r.width*100}%`;
    box.style.height=`${r.height*100}%`;
    box.title=`Edit ${item.name||'cloud'} region`;
    const tag=document.createElement('span');
    tag.className='existing-region-label';
    tag.textContent=item.name||item.cloudTypeId||'Cloud';
    box.appendChild(tag);
    box.addEventListener('pointerdown',ev=>ev.stopPropagation());
    box.addEventListener('click',ev=>{
      ev.stopPropagation();
      catchView.dispatchEvent(new CustomEvent('cloud-catcher-select-detection',{detail:{detectionId:item.id}}));
    });
    overlaysLayer.appendChild(box);
    if(item.id===editingId){
      active.valid=true;
      drawSelection(r);
      syncRegion(r);
      updateSaveState();
      active.help.textContent=`Editing ${item.name||'selected cloud'}. Drag on the photo to redraw its box or update fields.`;
    }
  }
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
  const overlaysLayer=document.createElement('div');
  overlaysLayer.className='region-overlays';
  const selection=document.createElement('div');
  selection.className='region-selection';
  selection.hidden=true;
  shell.append(shade,overlaysLayer,selection);

  const help=document.createElement('p');
  help.className='region-help';
  help.textContent='Drag over a cloud to select the region you want to classify.';
  shell.insertAdjacentElement('afterend',help);

  active={shell,image,overlaysLayer,selection,help,save,type,valid:false,start:null,pointerId:null};
  if(!image.dataset.editingId)syncRegion({x:0,y:0,width:0,height:0});
  updateSaveState();
  renderSavedOverlays();
  type.addEventListener('change',updateSaveState);

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
window.addEventListener('cloud-catcher-saved',()=>clearSelection('Caught. Drag over another cloud in this same photo to add another region.'));
window.addEventListener('cloud-catcher-regions-updated',()=>renderSavedOverlays());

setupSelector();
