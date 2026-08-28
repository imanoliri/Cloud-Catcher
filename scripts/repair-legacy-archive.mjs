import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

export const LEGACY_REFERENCE=/^\/api\/(images|snippets)\/[0-9a-f-]+$/i;

export async function repairLegacyArchive(archive,{origin,fetchMedia=fetch}={}){
  if(!origin)throw new Error('A legacy deployment origin is required.');
  const embedded=new Map();
  const embed=async reference=>{
    if(embedded.has(reference))return embedded.get(reference);
    const response=await fetchMedia(new URL(reference,origin));
    if(!response.ok)throw new Error(`Could not recover ${reference}: HTTP ${response.status}`);
    const type=response.headers.get('content-type')?.split(';')[0]||'image/jpeg';
    if(!type.startsWith('image/'))throw new Error(`Could not recover ${reference}: expected an image, received ${type}`);
    embedded.set(reference,`data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`);
    return embedded.get(reference);
  };
  const photos=[];
  for(const photo of archive.photos)photos.push({...photo,imageRef:LEGACY_REFERENCE.test(photo.imageRef)?await embed(photo.imageRef):photo.imageRef});
  const photoById=new Map(photos.map(photo=>[photo.id,photo]));
  const detections=[];
  for(const detection of archive.detections){
    if(photoById.get(detection.photoId)?.imageRef){const {snippetRef,...canonical}=detection;detections.push(canonical)}
    else detections.push({...detection,snippetRef:LEGACY_REFERENCE.test(detection.snippetRef)?await embed(detection.snippetRef):detection.snippetRef});
  }
  return {
    ...archive,
    photos,
    detections,
  };
}

async function main(){
  const [input,output,...options]=process.argv.slice(2);
  const originIndex=options.indexOf('--legacy-origin');
  const origin=originIndex>=0?options[originIndex+1]:null;
  if(!input||!output||!origin)throw new Error('Usage: node scripts/repair-legacy-archive.mjs INPUT OUTPUT --legacy-origin URL');
  const archive=JSON.parse(await readFile(resolve(input),'utf8'));
  const repaired=await repairLegacyArchive(archive,{origin});
  await writeFile(resolve(output),`${JSON.stringify(repaired,null,2)}\n`);
  const remaining=[...repaired.photos.map(photo=>photo.imageRef),...repaired.detections.map(detection=>detection.snippetRef)].filter(reference=>typeof reference==='string'&&LEGACY_REFERENCE.test(reference));
  if(remaining.length)throw new Error(`${remaining.length} legacy media references remain.`);
  console.log(`Embedded legacy media in ${resolve(output)}`);
}

if(import.meta.url===new URL(`file://${process.argv[1]}`).href)main().catch(error=>{console.error(error.message);process.exitCode=1});
