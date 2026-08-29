import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAgentRelay} from '../src/local-agent-relay.js';

const api={
  getLibrary:()=>({photos:[{id:'p1',imageRef:'data:image/png;base64,abc',location:'San Sebastián'}],detections:[{id:'d1',photoId:'p1',cloudTypeId:'cumulus'}]}),
  getCloudTypes:()=>[{id:'cumulus'}],getProgress:location=>({location}),
  addPhoto:async photo=>photo,addDetection:async detection=>detection,updateDetection:async(id,patch)=>({id,...patch}),importCloudPhotos:async batch=>batch
};

test('local agent relay exposes atlas metadata without bulk photo bytes',async()=>{
  const relay=new LocalAgentRelay({api});
  assert.deepEqual(await relay.execute('getAtlas',{}),{photos:[{id:'p1',location:'San Sebastián',hasImage:true}],detections:[{id:'d1',photoId:'p1',cloudTypeId:'cumulus'}]});
  assert.deepEqual(await relay.execute('getPhoto',{photoId:'p1'}),{id:'p1',imageRef:'data:image/png;base64,abc',location:'San Sebastián'});
});

test('local agent relay dispatches corrections and refuses unknown methods',async()=>{
  const relay=new LocalAgentRelay({api});
  assert.deepEqual(await relay.execute('updateDetection',{detectionId:'d1',patch:{cloudTypeId:'cirrus'}}),{id:'d1',cloudTypeId:'cirrus'});
  await assert.rejects(()=>relay.execute('deleteAtlas',{}),/Unsupported relay operation/);
});
