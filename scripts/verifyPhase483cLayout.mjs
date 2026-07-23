import assert from'node:assert/strict';
import{chromium}from'playwright';

const base=(process.env.GARDEN_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const results=[];
const markup=`<main style="padding:12px"><section class="what-matters-today today-summary-card is-onboarding setup-progress-card" style="max-width:560px;margin:0 auto"><div class="today-summary-copy"><small>TODAY</small><h2>Let’s set up your garden</h2><p>Complete these basics so Garden Compass knows what belongs in your garden.</p></div><ul class="garden-setup-steps"><li class="is-next"><button type="button"><span class="setup-step-marker" aria-label="Not complete">✓</span><span><strong>Confirm Garden Details</strong><p>Review the garden name, gardener, Green Bay location, and frost dates.</p><em>Review Details</em></span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></li><li><button type="button"><span class="setup-step-marker" aria-label="Not complete">✓</span><span><strong>Add a Growing Space &amp; Plants</strong><p>Set up a bed, container, grow bag, greenhouse area, tray, or indoor setup, then add what is growing there.</p><em>Open Garden</em></span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></li></ul></section></main>`;
try{
 for(const width of[320,375,390,430]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  await page.goto(`${base}/?verify=${Date.now()}`,{waitUntil:'domcontentloaded'});
  await page.evaluate(html=>{const root=document.getElementById('root')||document.body;root.innerHTML=html},markup);
  const rows=page.locator('.garden-setup-steps li>button');
  assert.equal(await rows.count(),2);
  for(let index=0;index<2;index++){
   const row=rows.nth(index);
   const result=await row.evaluate(button=>{const li=button.parentElement,content=button.querySelector('span:nth-child(2)'),title=button.querySelector('strong');button.focus();const bs=getComputedStyle(button),ls=getComputedStyle(li),rect=button.getBoundingClientRect(),contentRect=content.getBoundingClientRect(),titleRect=title.getBoundingClientRect();return{liDisplay:ls.display,liColumns:ls.gridTemplateColumns,buttonWidth:rect.width,contentWidth:contentRect.width,titleWidth:titleRect.width,titleHeight:titleRect.height,buttonHeight:rect.height,scrollWidth:button.scrollWidth,clientWidth:button.clientWidth,whiteSpace:bs.whiteSpace,wordBreak:bs.wordBreak,outlineStyle:bs.outlineStyle}});
   results.push({width,index,...result});
   assert.equal(result.liDisplay,'block',`${width}px list item must be block`);
   assert.notEqual(result.liColumns,'34px 1fr',`${width}px list item retained obsolete grid`);
   assert.ok(result.buttonWidth>200,`${width}px button remained too narrow: ${result.buttonWidth}`);
   assert.ok(result.contentWidth>100,`${width}px content column was unusable`);
   assert.ok(result.titleWidth>80,`${width}px title rendered character-by-character`);
   assert.ok(result.titleHeight<100,`${width}px title was excessively tall`);
   assert.ok(result.buttonHeight>=44,`${width}px tap target too short`);
   assert.ok(result.scrollWidth<=result.clientWidth+1,`${width}px horizontal overflow`);
   assert.equal(result.whiteSpace,'normal');assert.notEqual(result.wordBreak,'break-all');
  }
  await context.close();
 }
 console.log(JSON.stringify({ok:true,widths:[320,375,390,430],computedProductionCascade:true,rows:['Confirm Garden Details','Add a Growing Space & Plants'],results},null,2));
}finally{await browser.close()}