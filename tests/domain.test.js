import test from 'node:test';
import assert from 'node:assert/strict';
import {addDetection,addPhoto,emptyLibrary,levelProgress,makeDetection,makePhoto,validateLibrary} from '../src/domain.js';

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

test('location progress follows the parent photo location',()=>{
  let lib=emptyLibrary();
  lib=addConfirmed(lib,'cumulus','San Sebastián');
  lib=addConfirmed(lib,'cirrus','Berlin');
  assert.equal(levelProgress(lib,1,'San Sebastián').caught,1);
});

test('one photo can contain multiple cloud detections',()=>{
  let lib=emptyLibrary();
  const photo=makePhoto({location:'San Sebastián'});
  lib=addPhoto(lib,photo);
  lib=addDetection(lib,makeDetection({photoId:photo.id,cloudTypeId:'stratocumulus',status:'confirmed'}));
  lib=addDetection(lib,makeDetection({photoId:photo.id,cloudTypeId:'altocumulus',status:'confirmed'}));
  assert.equal(lib.photos.length,1);
  assert.equal(lib.detections.length,2);
  assert.equal(levelProgress(lib).caught,2);
});

test('archive validation accepts only current photo/detection schema',()=>{
  assert.throws(()=>validateLibrary({foo:'bar'}));
  assert.throws(()=>validateLibrary({format:'cloud-catcher',observations:[],albums:[]}));
  assert.doesNotThrow(()=>validateLibrary(emptyLibrary()));
});
