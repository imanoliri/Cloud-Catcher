const diagrams=[
  {
    image:'https://d2vlcm61l7u1fs.cloudfront.net/media/3e5/3e5e6690-258a-46fb-b108-d8e8549be217/phpBTP5se.png',
    source:'https://www.chegg.com/homework-help/questions-and-answers/rank-following-clouds-highest-elevation-lowest-elevation-using-figure-cirrus-cirrostratus--q18926072',
    alt:'Cloud classification diagram showing the ten principal cloud genera by altitude and form',
    caption:'Altitude + form overview — the diagram you picked.'
  },
  {
    image:'https://planete-terre.tripod.com/images/nuages.jpg',
    source:'https://planete-terre.tripod.com/nuage.htm',
    alt:'Cloud types arranged vertically by typical altitude',
    caption:'Another altitude view, useful for comparing cloud bases and vertical growth.'
  },
  {
    image:'https://www.scedu.com.au/cdn/shop/products/WG4378_1209x.jpg?v=1584260976',
    source:'https://www.scedu.com.au/products/wg4378',
    alt:'Cloud identification poster grouping cloud types by altitude',
    caption:'Photographic height guide with cloud-name clues.'
  }
];

function diagramGallery(){
  const section=document.createElement('section');
  section.className='guide-section altitude-guide';
  section.dataset.altitudeGuide='true';
  section.innerHTML=`<p class="eyebrow">Big picture</p><h3>Clouds by altitude</h3><p>Start here: where a cloud sits in the atmosphere is one of the fastest ways to narrow down its type. Cumulonimbus is the exception that can tower through several layers.</p><div class="diagram-gallery">${diagrams.map((d,i)=>`<figure class="diagram-card"><a href="${d.source}" target="_blank" rel="noopener noreferrer"><img src="${d.image}" alt="${d.alt}" ${i?'loading="lazy"':'fetchpriority="high"'} decoding="async"></a><figcaption>${d.caption}</figcaption></figure>`).join('')}</div>`;
  return section;
}

function installGallery(){
  const guide=document.querySelector('#learn-view .cloud-guide');
  if(!guide||guide.querySelector('[data-altitude-guide]'))return;
  const intro=guide.querySelector('.guide-intro');
  intro?.insertAdjacentElement('afterend',diagramGallery());
}

const learn=document.querySelector('#learn-view');
new MutationObserver(installGallery).observe(learn,{childList:true,subtree:true});
installGallery();
