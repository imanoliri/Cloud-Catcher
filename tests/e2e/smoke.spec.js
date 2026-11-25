import {test,expect} from '@playwright/test';

const tinySvg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="#dcecf7"/></svg>';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const values=[0.05,0.15,0.25,0.35,0.45,0.55,0.65,0.75,0.85,0.95];
    let index=0;
    Math.random=()=>values[index++%values.length];
  });
  await page.route('https://**/*',route=>{
    if(route.request().resourceType()==='image'){
      return route.fulfill({status:200,contentType:'image/svg+xml',body:tinySvg});
    }
    return route.abort();
  });
  await page.goto('/');
});

test('mobile learn and quiz flows are stable',async({page})=>{
  await expect(page.locator('nav button')).toHaveText(['Learn','Quiz','Catch','Atlas','Data']);
  await expect(page.getByRole('heading',{name:'How clouds form & how their names work'})).toBeVisible();

  const sight=page.locator('details.guide-sight');
  await expect(sight).not.toHaveAttribute('open','');
  const summary=page.locator('.guide-sight>summary');
  const combinations=page.getByRole('heading',{name:'The main combinations'});
  const sizes=await Promise.all([
    summary.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),
    combinations.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))
  ]);
  expect(Math.abs(sizes[0]-sizes[1])).toBeLessThan(0.6);
  await summary.click();
  await expect(sight).toHaveAttribute('open','');

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByRole('button',{name:'Quiz'}).click();
  await expect(page.getByRole('heading',{name:'Which cloud is this?'})).toBeVisible();
  await expect(page.locator('#image-quiz [data-image-choice]')).toHaveCount(4);

  const help=page.locator('#image-quiz .quiz-help');
  await help.click();
  const tooltip=page.locator('.quiz-tooltip-floating');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Choose the cloud genus');
  await page.locator('#image-quiz .quiz-question').click({position:{x:4,y:4}});
  await expect(tooltip).toBeHidden();

  const image=page.locator('#image-quiz .learn-photo');
  const before=await image.boundingBox();
  await page.locator('#image-quiz [data-image-choice]').first().click();
  await expect(page.locator('#image-feedback .feedback')).toBeVisible();
  await expect(page.locator('#image-next')).toBeVisible();
  const after=await image.boundingBox();
  expect(Math.abs((after?.y??0)-(before?.y??0))).toBeLessThan(1);

  const definitionQuestion=page.locator('#definition-quiz .quiz-question');
  await expect(definitionQuestion).toHaveText(/^What does ".+" mean\? ℹ️$/);
  const choices=page.locator('#definition-quiz [data-definition-choice]');
  await expect(choices).toHaveCount(4);
  const first=await choices.nth(0).boundingBox();
  const second=await choices.nth(1).boundingBox();
  const answerGap=(second?.y??0)-((first?.y??0)+(first?.height??0));
  expect(answerGap).toBeGreaterThan(8);

  await choices.first().click();
  await expect(page.locator('#definition-feedback .feedback')).toBeVisible();
  await expect(page.locator('#definition-next')).toBeVisible();
});

test('mobile catch to atlas and data loop works',async({page})=>{
  await page.getByRole('button',{name:'Catch'}).click();
  await expect(page.getByRole('heading',{name:'Catch clouds from a photo'})).toBeVisible();

  await page.locator('#photo-file').setInputFiles({name:'cloud.svg',mimeType:'image/svg+xml',buffer:Buffer.from(tinySvg)});
  const selector=page.locator('.region-selector');
  await expect(selector).toBeVisible();
  await expect(page.locator('#save-detection')).toBeDisabled();

  const box=await selector.boundingBox();
  if(!box)throw new Error('Region selector did not get layout bounds');
  await page.mouse.move(box.x+box.width*0.2,box.y+box.height*0.2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*0.75,box.y+box.height*0.7,{steps:5});
  await page.mouse.up();

  await expect(page.locator('#save-detection')).toBeDisabled();
  await expect(page.locator('#save-detection')).toHaveText('Choose its cloud type');
  await page.locator('#det-type').selectOption('cumulus');
  await expect(page.locator('#save-detection')).toBeEnabled();
  await expect(page.locator('#save-detection')).toHaveText('Save cloud');

  const immediateFeedback=await page.evaluate(()=>{
    document.querySelector('#save-detection').click();
    return {button:document.querySelector('#save-detection').textContent,status:document.querySelector('#upload-feedback').textContent};
  });
  expect(immediateFeedback).toEqual({button:'Select a cloud region first',status:'Caught! Cumulus added. Drag another region on this photo to add another cloud.'});
  await expect(page.locator('#upload-feedback')).toContainText('Caught!');
  await expect.poll(()=>page.evaluate(()=>window.cloudCatcher.getLibrary().detections.length)).toBe(1);

  await page.mouse.move(box.x+box.width*0.05,box.y+box.height*0.1);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*0.4,box.y+box.height*0.45,{steps:5});
  await page.mouse.up();
  await expect(page.locator('#save-detection')).toBeEnabled();
  await page.locator('#det-type').selectOption('cirrus');
  await page.locator('#save-detection').click();
  await expect(page.locator('#upload-feedback')).toContainText('Caught! Cirrus added');
  await expect.poll(()=>page.evaluate(()=>window.cloudCatcher.getLibrary().detections.length)).toBe(2);

  await page.getByRole('button',{name:'Atlas'}).click();
  await expect(page.getByRole('heading',{name:'Level 1 collection'})).toBeVisible();
  await expect(page.locator('.stats .stat strong').first()).toHaveText('2/10');
  await expect(page.getByRole('heading',{name:'Photo journal'})).toBeVisible();
  await expect(page.locator('.cloud-card:not(.reference-card) .crop-frame')).toHaveCount(2);
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().detections[0].snippetRef)).toBeUndefined();

  await page.getByRole('button',{name:'Data'}).click();
  await expect(page.getByRole('heading',{name:'Stored privately in this browser'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Export / save backup'})).toBeVisible();
  await expect(page.getByText(/1 photos · 2 detections/)).toBeVisible();

  await page.reload();
  await page.getByRole('button',{name:'Atlas'}).click();
  await expect(page.locator('.stats .stat strong').first()).toHaveText('2/10');
  await expect(page.getByText('cloud.svg',{exact:true})).toBeVisible();
});

test('local batch ingestion uses the same persistent atlas',async({page})=>{
  const summary=await page.evaluate(async imageDataUrl=>{
    const result=await window.cloudCatcher.importCloudPhotos({
      session:{name:'Test outing',location:'San Sebastián'},
      defaults:{location:'San Sebastián',source:'playwright'},
      catches:[{originalName:'batch-cloud.svg',imageDataUrl,detections:[{cloudTypeId:'altocumulus',confidence:.88,status:'confirmed',region:{type:'rect',x:.1,y:.1,width:.7,height:.5}}]}]
    });
    return result.summary;
  },`data:image/svg+xml,${encodeURIComponent(tinySvg)}`);
  expect(summary).toEqual({photos:1,detections:1});

  await page.getByRole('button',{name:'Atlas'}).click();
  await expect(page.locator('.stats .stat strong').first()).toHaveText('1/10');
  await expect(page.getByText('batch-cloud.svg',{exact:true})).toBeVisible();
  await expect(page.locator('.cloud-card:not(.reference-card) .crop-frame')).toBeVisible();
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().detections[0].snippetRef)).toBeUndefined();
  await page.reload();
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().sessions.length)).toBe(1);
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().photos.length)).toBe(1);
});

test('legacy localStorage atlas migrates to IndexedDB',async({page})=>{
  await page.evaluate(()=>{
    localStorage.setItem('cloud-catcher-library',JSON.stringify({
      format:'cloud-catcher',sessions:[],photos:[{id:'legacy-photo',sessionId:null,location:'Legacy',observedAt:'2026-08-01T00:00:00.000Z',imageRef:null,originalName:'legacy.jpg',notes:'',source:'legacy',width:null,height:null,createdAt:'2026-08-01T00:00:00.000Z'}],detections:[],albums:[],createdAt:'2026-08-01T00:00:00.000Z',updatedAt:'2026-08-01T00:00:00.000Z'
    }));
  });
  await page.reload();
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().photos[0].originalName)).toBe('legacy.jpg');
  expect(await page.evaluate(()=>localStorage.getItem('cloud-catcher-library'))).toBeNull();
  await page.reload();
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().photos[0].originalName)).toBe('legacy.jpg');
});

test('legacy hosted-image archive is rejected with recovery guidance',async({page})=>{
  const now='2026-08-28T00:00:00.000Z';
  const archive={
    format:'cloud-catcher',sessions:[],albums:[],createdAt:now,updatedAt:now,
    photos:[{id:'legacy-photo',sessionId:null,location:'San Sebastián',observedAt:now,imageRef:'/api/images/00000000-0000-4000-8000-000000000001',originalName:'legacy.jpg',notes:'',source:'legacy',width:100,height:100,createdAt:now}],
    detections:[],
  };
  await page.getByRole('button',{name:'Data'}).click();
  await page.locator('#import').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))});
  await expect(page.locator('#import-status')).toContainText('Repair the archive first');
  expect(await page.evaluate(()=>window.cloudCatcher.getLibrary().photos.length)).toBe(0);
});

test('export uses native file sharing with download fallback',async({page})=>{
  await page.getByRole('button',{name:'Data'}).click();
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__sharedBackup={name:data.files[0].name,type:data.files[0].type,title:data.title}}});
  });
  await page.getByRole('button',{name:'Export / save backup'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__sharedBackup)).toEqual({name:'cloud-catcher-2026-08-28.json',type:'application/json',title:'Cloud Catcher atlas'});

  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export / save backup'}).click();
  expect((await downloadPromise).suggestedFilename()).toBe('cloud-catcher-2026-08-28.json');
});
