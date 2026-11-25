import test from 'node:test';
import assert from 'node:assert/strict';
import {BrowserStorageProvider,LifeOsStorageProvider,canonicalizeLibraryMedia,createDefaultStorageProvider,detectLifeOsMode,legacyMediaReferences} from '../src/storage.js';
import {emptyLibrary} from '../src/domain.js';
import {repairLegacyArchive} from '../scripts/repair-legacy-archive.mjs';

const archive={photos:[{id:'photo-1',imageRef:'/api/images/00000000-0000-4000-8000-000000000001'}],detections:[{photoId:'photo-1',snippetRef:'/api/snippets/00000000-0000-4000-8000-000000000002'}]};

test('legacy hosted media references are detected before import',()=>{
  assert.deepEqual(legacyMediaReferences(archive),['/api/images/00000000-0000-4000-8000-000000000001','/api/snippets/00000000-0000-4000-8000-000000000002']);
});

test('legacy repair embeds originals and removes redundant snippets',async()=>{
  const requested=[];
  const repaired=await repairLegacyArchive(archive,{
    origin:'https://legacy.example',
    fetchMedia:async url=>{
      requested.push(url.pathname);
      assert.match(url.href,/^https:\/\/legacy\.example\/api\/(images|snippets)\//);
      return new Response(Uint8Array.from([1,2,3]),{headers:{'content-type':'image/jpeg'}});
    },
  });
  assert.equal(repaired.photos[0].imageRef,'data:image/jpeg;base64,AQID');
  assert.equal(repaired.detections[0].snippetRef,undefined);
  assert.deepEqual(requested,['/api/images/00000000-0000-4000-8000-000000000001']);
  assert.deepEqual(legacyMediaReferences(repaired),[]);
});

test('snippet remains as a fallback when its original is unavailable',async()=>{
  const fallback={photos:[{id:'photo-1',imageRef:null}],detections:[{photoId:'photo-1',snippetRef:'/api/snippets/00000000-0000-4000-8000-000000000002'}]};
  const repaired=await repairLegacyArchive(fallback,{origin:'https://legacy.example',fetchMedia:async()=>new Response(Uint8Array.from([1,2,3]),{headers:{'content-type':'image/jpeg'}})});
  assert.equal(repaired.detections[0].snippetRef,'data:image/jpeg;base64,AQID');
});

test('canonical archives discard derived snippets when originals exist',()=>{
  const canonical=canonicalizeLibraryMedia({photos:[{id:'photo-1',imageRef:'data:image/jpeg;base64,AQID'}],detections:[{photoId:'photo-1',snippetRef:'data:image/jpeg;base64,BAUG'}]});
  assert.equal(canonical.detections[0].snippetRef,undefined);
});

test('legacy repair fails instead of producing another broken archive',async()=>{
  await assert.rejects(()=>repairLegacyArchive(archive,{origin:'https://legacy.example',fetchMedia:async()=>new Response('gone',{status:404})}),/HTTP 404/);
});

test('detectLifeOsMode selects LifeOsStorageProvider under /cloud-catcher/ or ?storage=lifeos',()=>{
  assert.equal(detectLifeOsMode({pathname:'/',search:''}),false);
  assert.equal(detectLifeOsMode({pathname:'/cloud-catcher/',search:''}),true);
  assert.equal(detectLifeOsMode({pathname:'/',search:'?storage=lifeos'}),true);
  assert.ok(createDefaultStorageProvider({pathname:'/cloud-catcher/'}) instanceof LifeOsStorageProvider);
  assert.ok(createDefaultStorageProvider({pathname:'/'}) instanceof BrowserStorageProvider);
});

test('LifeOsStorageProvider round-trips canonical cloud-catcher library over fetch',async()=>{
  const origFetch=globalThis.fetch;
  const calls=[];
  const lib=emptyLibrary();
  globalThis.fetch=async(url,opts={})=>{
    calls.push([String(url),opts.method||'GET']);
    return new Response(JSON.stringify({library:lib}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try{
    const provider=new LifeOsStorageProvider({baseUrl:'/api/clouds'});
    const loaded=await provider.loadLibrary();
    assert.equal(loaded.format,'cloud-catcher');
    await provider.saveLibrary(loaded);
    const blob=await provider.exportArchive(loaded);
    assert.equal(JSON.parse(await blob.text()).format,'cloud-catcher');
    assert.deepEqual(calls,[
      ['/api/clouds/library','GET'],
      ['/api/clouds/library','PUT'],
      ['/api/clouds/library?embed_images=1','GET'],
    ]);
  }finally{
    globalThis.fetch=origFetch;
  }
});
