const atlas=document.querySelector('#atlas-view');

const dialog=document.createElement('dialog');
dialog.className='atlas-lightbox';
dialog.innerHTML=`
  <div class="atlas-lightbox-shell">
    <button class="atlas-lightbox-close" type="button" aria-label="Close image viewer">×</button>
    <div class="atlas-lightbox-media">
      <div class="atlas-lightbox-stage">
        <img alt="" />
        <div class="atlas-lightbox-boxes"></div>
      </div>
      <span class="atlas-lightbox-badge"></span>
    </div>
    <div class="atlas-lightbox-copy">
      <p class="atlas-lightbox-code"></p>
      <h2></h2>
      <p class="atlas-lightbox-summary"></p>
      <p class="atlas-lightbox-status"></p>
      <div class="atlas-lightbox-detail"></div>
    </div>
  </div>`;
document.body.append(dialog);

const close=()=>dialog.close();
dialog.querySelector('.atlas-lightbox-close').addEventListener('click',close);
dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
dialog.addEventListener('cancel',event=>{event.preventDefault();close()});

let activeMode='crop';

function boundsOf(region){
  if(region?.type==='polygon'&&Array.isArray(region.points)&&region.points.length){
    const xs=region.points.map(p=>p[0]),ys=region.points.map(p=>p[1]);
    return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  }
  return region||{x:0,y:0,width:1,height:1};
}

async function renderDetectionModal(detId){
  const lib=window.cloudCatcher?.getLibrary?.();
  const types=window.cloudCatcher?.getCloudTypes?.()||[];
  const det=lib?.detections?.find(d=>d.id===detId);
  const photo=det?lib?.photos?.find(p=>p.id===det.photoId):null;
  if(!det||!photo)return false;

  const type=types.find(c=>c.id===det.cloudTypeId);
  const siblings=lib.detections.filter(d=>d.photoId===photo.id&&d.status!=='rejected');
  const stage=dialog.querySelector('.atlas-lightbox-stage');
  const img=stage.querySelector('img');
  const boxesLayer=stage.querySelector('.atlas-lightbox-boxes');
  boxesLayer.innerHTML='';

  if(activeMode==='original'&&photo.imageRef){
    img.src=photo.imageRef;
    siblings.forEach(s=>{
      const b=boundsOf(s.region);
      const box=document.createElement('span');
      box.className=`atlas-overlay-box ${s.id===det.id?'is-focus':''}`;
      box.style.left=`${b.x*100}%`;
      box.style.top=`${b.y*100}%`;
      box.style.width=`${b.width*100}%`;
      box.style.height=`${b.height*100}%`;
      const sType=types.find(c=>c.id===s.cloudTypeId);
      box.dataset.label=sType?.name||s.cloudTypeId;
      boxesLayer.appendChild(box);
    });
  }else if(photo.imageRef){
    const source=document.createElement('img');
    await new Promise(resolve=>{
      source.onload=resolve;
      source.onerror=resolve;
      source.src=photo.imageRef;
      if(source.complete)resolve();
    });
    const b=boundsOf(det.region);
    if(source.naturalWidth>0&&source.naturalHeight>0){
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.ceil(b.width*source.naturalWidth));
      canvas.height=Math.max(1,Math.ceil(b.height*source.naturalHeight));
      canvas.getContext('2d').drawImage(source,b.x*source.naturalWidth,b.y*source.naturalHeight,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
      img.src=canvas.toDataURL('image/jpeg',.84);
    }else{
      img.src=photo.imageRef;
    }
  }

  const name=type?.name||det.cloudTypeId;
  img.alt=`${name} cloud observation`;
  dialog.querySelector('h2').textContent=name;
  const confText=det.confidence==null?'':` · ${Math.round(det.confidence*100)}%`;
  dialog.querySelector('.atlas-lightbox-code').textContent=`${type?.code||''} · ${type?.family||''} · ${photo.location||'Unknown'}${confText}`;
  dialog.querySelector('.atlas-lightbox-summary').textContent=det.explanation||type?.summary||'';
  dialog.querySelector('.atlas-lightbox-status').textContent=det.status==='proposed'
    ?`Proposed observation · ${photo.observedAt?.slice(0,10)||''} · ${det.source||'ai'}`
    :`Confirmed catch · ${photo.observedAt?.slice(0,10)||''} · ${det.source||'manual'}`;

  const badge=dialog.querySelector('.atlas-lightbox-badge');
  badge.textContent=det.status==='proposed'?'Proposed':'Caught';
  badge.dataset.kind=det.status==='proposed'?'proposed':'caught';

  const detail=dialog.querySelector('.atlas-lightbox-detail');
  detail.innerHTML='';

  const modeRow=document.createElement('div');
  modeRow.className='toolbar';
  const cropBtn=document.createElement('button');
  cropBtn.type='button';
  cropBtn.textContent='Crop';
  cropBtn.className=activeMode==='crop'?'primary':'';
  cropBtn.addEventListener('click',()=>{activeMode='crop';renderDetectionModal(det.id)});
  const origBtn=document.createElement('button');
  origBtn.type='button';
  origBtn.textContent='Full photo & regions';
  origBtn.className=activeMode==='original'?'primary':'';
  origBtn.addEventListener('click',()=>{activeMode='original';renderDetectionModal(det.id)});
  modeRow.append(cropBtn,origBtn);
  detail.appendChild(modeRow);

  if(siblings.length>1){
    const sibRow=document.createElement('div');
    sibRow.className='atlas-siblings';
    const label=document.createElement('span');
    label.textContent='In same photo: ';
    sibRow.appendChild(label);
    siblings.forEach(s=>{
      const sType=types.find(c=>c.id===s.cloudTypeId);
      const b=document.createElement('button');
      b.type='button';
      b.className=`pill-btn ${s.id===det.id?'active':''}`;
      b.textContent=`${sType?.name||s.cloudTypeId}${s.status==='proposed'?' (proposed)':''}`;
      b.addEventListener('click',()=>renderDetectionModal(s.id));
      sibRow.appendChild(b);
    });
    detail.appendChild(sibRow);
  }

  const editRow=document.createElement('div');
  editRow.className='atlas-detail-edit';
  const typeSelect=document.createElement('select');
  types.forEach(c=>{
    const opt=document.createElement('option');
    opt.value=c.id;
    opt.textContent=c.name;
    if(c.id===det.cloudTypeId)opt.selected=true;
    typeSelect.appendChild(opt);
  });
  const notesInput=document.createElement('input');
  notesInput.type='text';
  notesInput.value=det.notes||'';
  notesInput.placeholder='Observation notes';
  editRow.append(typeSelect,notesInput);
  detail.appendChild(editRow);

  const actionsRow=document.createElement('div');
  actionsRow.className='toolbar';
  const confirmBtn=document.createElement('button');
  confirmBtn.type='button';
  confirmBtn.className='primary';
  confirmBtn.textContent=det.status==='proposed'?'Confirm':'Save changes';
  confirmBtn.addEventListener('click',async()=>{
    await window.cloudCatcher.updateDetection(det.id,{cloudTypeId:typeSelect.value,notes:notesInput.value,status:'confirmed'});
    await renderDetectionModal(det.id);
  });
  const redrawBtn=document.createElement('button');
  redrawBtn.type='button';
  redrawBtn.textContent='Redraw region';
  redrawBtn.addEventListener('click',async()=>{
    close();
    await window.cloudCatcher.openInCatchForEdit(photo.id,det.id);
  });
  const rejectBtn=document.createElement('button');
  rejectBtn.type='button';
  rejectBtn.textContent='Reject';
  rejectBtn.addEventListener('click',async()=>{
    await window.cloudCatcher.updateDetection(det.id,{notes:notesInput.value,status:'rejected'});
    close();
  });
  actionsRow.append(confirmBtn,redrawBtn,rejectBtn);
  detail.appendChild(actionsRow);

  if(!dialog.open)dialog.showModal();
  return true;
}

async function openCard(card){
  const detId=card.dataset.detectionId;
  if(detId&&(await renderDetectionModal(detId)))return;
  const media=card.querySelector('.card-photo');
  if(!media)return;
  const name=card.querySelector('h3')?.textContent?.trim()||'Cloud';
  const code=card.querySelector('.cloud-code')?.textContent?.trim()||'';
  const summary=card.querySelector('.cloud-summary')?.textContent?.trim()||'';
  const reference=card.classList.contains('reference-card');
  const proposed=card.classList.contains('proposed-card');
  const statusText=reference?'Reference example — not your catch':proposed?'Your detection — awaiting confirmation':'Your confirmed catch';
  const img=dialog.querySelector('.atlas-lightbox-stage img');
  dialog.querySelector('.atlas-lightbox-boxes').innerHTML='';
  dialog.querySelector('.atlas-lightbox-detail').innerHTML='';
  if(media.classList.contains('crop-frame')){
    const source=media.querySelector('img'),bounds=JSON.parse(media.dataset.crop);
    await source.decode().catch(()=>{});
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil(bounds.width*source.naturalWidth));
    canvas.height=Math.max(1,Math.ceil(bounds.height*source.naturalHeight));
    canvas.getContext('2d').drawImage(source,bounds.x*source.naturalWidth,bounds.y*source.naturalHeight,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
    img.src=canvas.toDataURL('image/jpeg',.84);
  }else img.src=media.currentSrc||media.src;
  img.alt=reference?`Reference example of ${name}`:`Your ${name} cloud catch`;
  dialog.querySelector('h2').textContent=name;
  dialog.querySelector('.atlas-lightbox-code').textContent=code;
  dialog.querySelector('.atlas-lightbox-summary').textContent=summary;
  dialog.querySelector('.atlas-lightbox-status').textContent=statusText;
  const badge=dialog.querySelector('.atlas-lightbox-badge');
  badge.textContent=reference?'Reference':proposed?'Proposed':'Caught';
  badge.dataset.kind=reference?'reference':proposed?'proposed':'caught';
  dialog.showModal();
}

function enhanceAtlas(){
  const grids=atlas.querySelectorAll(':scope .panel > .grid');
  const levelGrid=grids[0];
  if(levelGrid){
    levelGrid.classList.add('atlas-level-grid');
    levelGrid.querySelectorAll('.cloud-card').forEach(card=>{
      if(card.dataset.viewerReady)return;
      card.dataset.viewerReady='true';
      card.tabIndex=0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label',`Open ${card.querySelector('h3')?.textContent?.trim()||'cloud'} image`);
      card.addEventListener('click',event=>{
        if(event.target.closest('a'))return;
        activeMode='crop';
        openCard(card);
      });
      card.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();activeMode='crop';openCard(card)}
      });
    });
  }
  atlas.querySelectorAll('[data-detection-id]').forEach(el=>{
    if(el.classList.contains('cloud-card')||el.dataset.detailReady)return;
    el.dataset.detailReady='true';
    el.addEventListener('click',()=>{activeMode='crop';renderDetectionModal(el.dataset.detectionId)});
    el.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();activeMode='crop';renderDetectionModal(el.dataset.detectionId)}
    });
  });
}

new MutationObserver(enhanceAtlas).observe(atlas,{childList:true,subtree:true});
enhanceAtlas();
