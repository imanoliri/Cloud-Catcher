import test from 'node:test';
import assert from 'node:assert/strict';
import {addCatch,addDetection,addPhoto,addSession,emptyLibrary,levelProgress,makeDetection,makePhoto,makeSession,validateLibrary} from '../src/domain.js';
import {LEVEL_ONE} from '../src/taxonomy.js';

function addConfirmed(lib,cloudTypeId,location='San Sebastián'){
  const photo=makePhoto({location,source:'test'});
  lib=addPhoto(lib,photo);
  return addDetection(lib,makeDetection({photoId:photo.id,cloudTypeId,status:'confirmed',source:'test'}));
}

test('level progress counts unique confirmed cloud types',()=>{
  let lib=emptyLibrary();
  lib=addConfirmed(lib,'cumulus');
  lib=addConfirmed(lib,'cumulus','Berlin');
  lib=addConfirmed(lib,'cirrus');
  assert.equal(levelProgress(lib).caught,2);
});

test('proposed detections do not count toward progress',()=>{
  let lib=emptyLibrary();
  const photo=makePhoto({location:'San Sebastián'});
  lib=addPhoto(lib,photo);
  lib=addDetection(lib,makeDetection({photoId:photo.id,cloudTypeId:'cumulus',status:'proposed'}));
  assert.equal(levelProgress(lib).caught,0);
});

test('one photo can contain multiple cloud detections',()=>{
  let lib=emptyLibrary();
  const photo=makePhoto({location:'San Sebastián'});
  const detections=[makeDetection({photoId:photo.id,cloudTypeId:'stratocumulus',status:'confirmed'}),makeDetection({photoId:photo.id,cloudTypeId:'altocumulus',status:'confirmed'})];
  lib=addCatch(lib,{photo,detections});
  assert.equal(lib.photos.length,1);
  assert.equal(lib.detections.length,2);
  assert.equal(levelProgress(lib).caught,2);
});

test('session groups photos from the same sky outing',()=>{
  let lib=emptyLibrary();
  const session=makeSession({name:'San Sebastián sky',location:'San Sebastián'});
  lib=addSession(lib,session);
  const a=makePhoto({sessionId:session.id,location:'San Sebastián'});
  const b=makePhoto({sessionId:session.id,location:'San Sebastián'});
  lib=addPhoto(lib,a);lib=addPhoto(lib,b);
  assert.deepEqual(lib.sessions[0].photoIds,[a.id,b.id]);
});

test('archive validation requires current session/photo/detection schema',()=>{
  assert.throws(()=>validateLibrary({foo:'bar'}));
  assert.throws(()=>validateLibrary({format:'cloud-catcher',photos:[],detections:[],albums:[]}));
  assert.doesNotThrow(()=>validateLibrary(emptyLibrary()));
});


test('each Level 1 cloud genus has three distinct learning examples',()=>{
  for(const type of LEVEL_ONE){
    assert.equal(type.referenceImages.length,3,type.id);
    assert.equal(new Set(type.referenceImages.map(example=>example.image)).size,3,type.id);
  }
});
