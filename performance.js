const views={
  catch:document.querySelector('#catch-view'),
  learn:document.querySelector('#learn-view'),
  atlas:document.querySelector('#atlas-view'),
  data:document.querySelector('#data-view')
};

function activate(name){
  document.querySelectorAll('nav button').forEach(button=>button.classList.toggle('active',button.dataset.view===name));
  Object.entries(views).forEach(([key,view])=>view?.classList.toggle('active',key===name));
}

// app.js historically re-rendered every view on every tab click. The views are
// already rendered and kept up to date by mutations, so navigation itself only
// needs to toggle visibility. Capture phase prevents the older expensive handler.
document.querySelectorAll('nav button').forEach(button=>{
  button.addEventListener('click',event=>{
    event.stopImmediatePropagation();
    activate(button.dataset.view);
  },true);
});

// Images in non-visible collections should not compete with the active mobile UI.
function lazyImages(root=document){
  root.querySelectorAll?.('img:not([loading])').forEach(image=>{
    if(!image.closest('.view.active'))image.loading='lazy';
  });
}

new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===1){
        if(node.matches?.('img:not([loading])')&&!node.closest('.view.active'))node.loading='lazy';
        lazyImages(node);
      }
    }
  }
}).observe(document.querySelector('main'),{childList:true,subtree:true});

lazyImages();
