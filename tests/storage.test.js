import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalizeLibraryMedia,legacyMediaReferences} from '../src/storage.js';
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
