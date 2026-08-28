import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('static build copies every browser asset referenced by index',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const build=pkg.scripts.build;
  for(const asset of ['app.js','cloud-diagrams.js','styles.css','learn-mode.css','definition-quiz.css','quiz-page.css','atlas-viewer.js','atlas-viewer.css','region-selector.js','region-selector.css','openapi.json']){
    assert.match(build,new RegExp(asset.replaceAll('.','\\.')),asset);
  }
  for(const legacy of ['quiz-page.js','definition-quiz.js','learn-mode.js','performance.js']){
    assert.doesNotMatch(index,new RegExp(legacy.replaceAll('.','\\.')),legacy);
  }
});

test('OpenAPI exposes the semantic AI operations documented for agents',async()=>{
  const api=JSON.parse(await readFile(new URL('../openapi.json',import.meta.url),'utf8'));
  for(const path of ['/ai-tools','/ai-tools/import-cloud-photos','/ai-tools/correct-detection','/ai-tools/add-detection','/ai-tools/get-missing-clouds','/ai-tools/get-collection-progress']){
    assert.ok(api.paths[path],path);
  }
});
