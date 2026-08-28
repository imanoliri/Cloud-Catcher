const atlas=document.querySelector('#atlas-view');

const dialog=document.createElement('dialog');
dialog.className='atlas-lightbox';
dialog.innerHTML=`
  <div class="atlas-lightbox-shell">
    <button class="atlas-lightbox-close" type="button" aria-label="Close image viewer">×</button>
    <div class="atlas-lightbox-media">
      <img alt="" />
      <span class="atlas-lightbox-badge"></span>
    </div>
    <div class="atlas-lightbox-copy">
      <p class="atlas-lightbox-code"></p>
      <h2></h2>
      <p class="atlas-lightbox-summary"></p>
      <p class="atlas-lightbox-status"></p>
    </div>
  </div>`;
document.body.append(dialog);

const close=()=>dialog.close();
dialog.querySelector('.atlas-lightbox-close').addEventListener('click',close);
dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
dialog.addEventListener('cancel',event=>{event.preventDefault();close()});

async function openCard(card){
  const media=card.querySelector('.card-photo');
  if(!media)return;
  const name=card.querySelector('h3')?.textContent?.trim()||'Cloud';
  const code=card.querySelector('.cloud-code')?.textContent?.trim()||'';
  const summary=card.querySelector('.cloud-summary')?.textContent?.trim()||'';
  const reference=card.classList.contains('reference-card');
  const proposed=card.classList.contains('proposed-card');
  const statusText=reference?'Reference example — not your catch':proposed?'Your detection — awaiting confirmation':'Your confirmed catch';
  const img=dialog.querySelector('img');
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
  if(!levelGrid)return;
  levelGrid.classList.add('atlas-level-grid');
  levelGrid.querySelectorAll('.cloud-card').forEach(card=>{
    if(card.dataset.viewerReady)return;
    card.dataset.viewerReady='true';
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label',`Open ${card.querySelector('h3')?.textContent?.trim()||'cloud'} image`);
    card.addEventListener('click',event=>{
      if(event.target.closest('a'))return;
      openCard(card);
    });
    card.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();openCard(card)}
    });
  });
}

new MutationObserver(enhanceAtlas).observe(atlas,{childList:true,subtree:true});
enhanceAtlas();
