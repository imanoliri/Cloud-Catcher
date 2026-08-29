import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('static build copies every browser asset referenced by index',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const build=pkg.scripts.build;
  assert.match(build,/rm -rf dist/,'build must remove stale deployment artifacts');
  assert.doesNotMatch(build,/openapi\.json/);
  for(const asset of ['app.js','cloud-diagrams.js','styles.css','learn-mode.css','definition-quiz.css','quiz-page.css','atlas-viewer.js','atlas-viewer.css','region-selector.js','region-selector.css']){
    assert.match(build,new RegExp(asset.replaceAll('.','\\.')),asset);
  }
  for(const legacy of ['quiz-page.js','definition-quiz.js','learn-mode.js','performance.js']){
    assert.doesNotMatch(index,new RegExp(legacy.replaceAll('.','\\.')),legacy);
  }
});

test('relay is temporary and does not become hosted atlas persistence',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  const netlify=await readFile(new URL('../netlify.toml',import.meta.url),'utf8');
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const relay=await readFile(new URL('../netlify/functions/local-agent-relay.ts',import.meta.url),'utf8');
  assert.deepEqual(Object.keys(pkg.dependencies).sort(),['@netlify/blobs','@netlify/functions']);
  assert.match(netlify,/\[functions\]/);
  assert.match(relay,/SHA-256/);
  assert.match(relay,/lastSeenAt/);
  assert.doesNotMatch(relay,/photos\//,'photos must not be persisted in relay storage');
  assert.match(app,/LocalAgentRelay/);
  assert.match(app,/importCloudPhotos/);
});
