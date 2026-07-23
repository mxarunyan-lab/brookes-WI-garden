import assert from'node:assert/strict';
import{chromium}from'playwright';

const base=(process.env.GARDEN_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const width of[320,375,390,430]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('requestfailed',request=>errors.push(`${request.url()} ${request.failure()?.errorText||'failed'}`));
  await page.goto(`${base}/?verify=${Date.now()}`,{waitUntil:'networkidle'});
  await page.evaluate(()=>{const key='brookes-garden-state-v2',garden=JSON.parse(localStorage.getItem(key)||'{}');garden.profile={...(garden.profile||{})};delete garden.profile.setupDetailsConfirmedAt;delete garden.profile.setupGardenConfirmedAt;delete garden.profile.setupCompletedAt;delete garden.profile.setupGardenStartedAt;delete garden.profile.setupGardenNeedsExplicitReview;delete garden.profile.setupComplete;localStorage.setItem(key,JSON.stringify(garden));localStorage.setItem('brookes-garden-page-v2','today')});
  await page.reload({waitUntil:'networkidle'});
  const row=page.locator('.garden-setup-steps li>button').first();
  await row.waitFor({state:'visible',timeout:15000});
  const result=await row.evaluate(button=>{const li=button.parentElement,content=button.querySelector('span:nth-child(2)'),title=button.querySelector('strong'),card=button.closest('.setup-progress-card');const bs=getComputedStyle(button),ls=getComputedStyle(li),rect=button.getBoundingClientRect(),cardRect=card.getBoundingClientRect(),titleRect=title.getBoundingClientRect();return{liDisplay:ls.display,liColumns:ls.gridTemplateColumns,buttonWidth:rect.width,cardWidth:cardRect.width,contentWidth:content.getBoundingClientRect().width,titleWidth:titleRect.width,titleHeight:titleRect.height,buttonHeight:rect.height,scrollWidth:button.scrollWidth,clientWidth:button.clientWidth,whiteSpace:bs.whiteSpace,wordBreak:bs.wordBreak}});
  assert.notEqual(result.liColumns,'34px 1fr',`${width}px list item retained obsolete grid`);
  assert.equal(result.liDisplay,'block',`${width}px list item must be block`);
  assert.ok(result.buttonWidth>200,`${width}px button width was ${result.buttonWidth}`);
  assert.ok(result.buttonWidth>=result.cardWidth-64,`${width}px button did not fill card`);
  assert.ok(result.contentWidth>110,`${width}px content column was too narrow`);
  assert.ok(result.titleWidth>80,`${width}px title collapsed horizontally`);
  assert.ok(result.titleHeight<80,`${width}px title appears character-wrapped`);
  assert.ok(result.buttonHeight>=44,`${width}px tap target too short`);
  assert.ok(result.scrollWidth<=result.clientWidth+1,`${width}px horizontal overflow`);
  assert.equal(result.whiteSpace,'normal');assert.notEqual(result.wordBreak,'break-all');
  results.push({width,...result,consoleOrRequestErrors:errors});
  await context.close();
 }
 console.log(JSON.stringify({ok:true,widths:[320,375,390,430],realTodayChecklist:true,results},null,2));
}finally{await browser.close()}