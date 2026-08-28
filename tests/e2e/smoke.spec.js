import {test,expect} from '@playwright/test';

const tinySvg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="#dcecf7"/></svg>';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    const values=[0.05,0.15,0.25,0.35,0.45,0.55,0.65,0.75,0.85,0.95];
    let index=0;
    Math.random=()=>values[index++%values.length];
  });
  await page.route('**/api/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
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

  await expect(page.locator('#save-detection')).toBeEnabled();
  await expect(page.locator('#save-detection')).toHaveText('Add selected cloud');

  await page.evaluate(async()=>{
    const photo=await window.cloudCatcher.addPhoto({
      location:'Smoke Test',
      imageRef:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"></svg>',
      originalName:'cloud.svg',
      source:'playwright'
    });
    await window.cloudCatcher.addDetection({
      photoId:photo.id,
      cloudTypeId:'cumulus',
      confidence:1,
      status:'confirmed',
      region:{type:'rect',x:.2,y:.2,width:.55,height:.5},
      source:'playwright'
    });
  });

  await page.getByRole('button',{name:'Atlas'}).click();
  await expect(page.getByRole('heading',{name:'Level 1 collection'})).toBeVisible();
  await expect(page.locator('.stats .stat strong').first()).toHaveText('1/10');
  await expect(page.getByRole('heading',{name:'Photo journal'})).toBeVisible();

  await page.getByRole('button',{name:'Data'}).click();
  await expect(page.getByRole('heading',{name:'Portable by design'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Export library'})).toBeVisible();
  await expect(page.getByText(/1 photos · 1 detections/)).toBeVisible();
});
