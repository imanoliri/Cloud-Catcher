import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLibrary,addObservation,levelProgress,validateLibrary} from '../src/domain.js';

function obs(type,location='San Sebastián'){return{id:`${type}-${location}`,cloudTypeId:type,location,observedAt:'2026-08-27T00:00:00Z',imageRef:null,notes:'',confidence:null,source:'test',createdAt:'2026-08-27T00:00:00Z'}}

test('level progress counts unique cloud types',()=>{let lib=emptyLibrary();lib=addObservation(lib,obs('cumulus'));lib=addObservation(lib,obs('cumulus','Berlin'));lib=addObservation(lib,obs('cirrus'));assert.equal(levelProgress(lib).caught,2)});

test('location progress filters observations',()=>{let lib=emptyLibrary();lib=addObservation(lib,obs('cumulus'));lib=addObservation(lib,obs('cirrus','Berlin'));assert.equal(levelProgress(lib,1,'San Sebastián').caught,1)});

test('archive validation rejects unrelated JSON',()=>{assert.throws(()=>validateLibrary({foo:'bar'}))});
