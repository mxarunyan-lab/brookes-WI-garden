import{readFile,writeFile}from'node:fs/promises';
const path='scripts/verifyPhase475NavigationLock.mjs';
let source=await readFile(path,'utf8'),changed=false;
const oldFunction=`const assertCards=async(page,selector,label)=>{
 const cards=page.locator(selector),count=await cards.count();
 for(let index=0;index<count;index+=1){
  const rect=await cards.nth(index).boundingBox();
  assert.ok(rect,\\`${'${label}'} card ${'${index}'} missing geometry\\`);
  assert.ok(rect.x>=-1&&rect.x+rect.width<=page.viewportSize().width+1,\\`${'${label}'} card ${'${index}'} leaves viewport\\`);
  const copy=cards.nth(index).locator('strong').first(),arrow=cards.nth(index).locator('svg').last();
  const[copyRect,arrowRect]=await Promise.all([copy.boundingBox(),arrow.boundingBox()]);
  assert.ok(copyRect&&arrowRect,\\`${'${label}'} card ${'${index}'} missing copy or arrow\\`);
  assert.ok(copyRect.x+copyRect.width<=arrowRect.x+2,\\`${'${label}'} card ${'${index}'} text collides with arrow\\`);
 }
};`;
const nextFunction=`const assertCards=async(page,selector,label)=>{
 const cards=page.locator(selector),count=await cards.count();
 for(let index=0;index<count;index+=1){
  const card=cards.nth(index),geometry=await card.evaluate(node=>{const cardRect=node.getBoundingClientRect(),title=node.querySelector('strong'),copy=node.querySelector('.garden-center-tile-copy,.secondary-card-copy'),arrow=node.querySelector('.garden-center-tile-arrow,.secondary-card-chevron')||[...node.querySelectorAll('svg')].at(-1);if(!title||!arrow)return{cardRect:null,titleRect:null,arrowRect:null,copyOverflow:true};const range=document.createRange();range.selectNodeContents(title);const titleRect=range.getBoundingClientRect(),arrowRect=arrow.getBoundingClientRect();return{cardRect:{x:cardRect.x,width:cardRect.width,right:cardRect.right},titleRect:{left:titleRect.left,right:titleRect.right,top:titleRect.top,bottom:titleRect.bottom},arrowRect:{left:arrowRect.left,right:arrowRect.right,top:arrowRect.top,bottom:arrowRect.bottom},copyOverflow:Boolean(copy&&copy.scrollWidth>copy.clientWidth+1)}});
  assert.ok(geometry.cardRect&&geometry.titleRect&&geometry.arrowRect,\\`${'${label}'} card ${'${index}'} missing title or arrow geometry\\`);
  assert.ok(geometry.cardRect.x>=-1&&geometry.cardRect.right<=page.viewportSize().width+1,\\`${'${label}'} card ${'${index}'} leaves viewport: ${'${JSON.stringify(geometry)}'}\\`);
  assert.equal(geometry.copyOverflow,false,\\`${'${label}'} card ${'${index}'} copy overflows its grid column: ${'${JSON.stringify(geometry)}'}\\`);
  assert.ok(geometry.titleRect.right<=geometry.arrowRect.left+2,\\`${'${label}'} card ${'${index}'} visible title collides with arrow: ${'${JSON.stringify(geometry)}'}\\`);
 }
};`;
if(!source.includes(nextFunction)){
 if(!source.includes(oldFunction))throw new Error('Phase 4.7.5 card geometry helper not found.');
 source=source.replace(oldFunction,nextFunction);changed=true;
}
const centerOld="  await noOverflow(page,`Garden Center ${width}`);\n  await assertCards(page,'.garden-center-tile',`Garden Center ${width}`);\n  if([320,390,768].includes(width))await page.screenshot({path:`phase475-audit/garden-center/garden-center-${width}.png`,fullPage:true});";
const centerNext="  await noOverflow(page,`Garden Center ${width}`);\n  if([320,390,768].includes(width))await page.screenshot({path:`phase475-audit/garden-center/garden-center-${width}.png`,fullPage:true});\n  await assertCards(page,'.garden-center-tile',`Garden Center ${width}`);";
if(!source.includes(centerNext)){if(!source.includes(centerOld))throw new Error('Garden Center screenshot/assertion order not found.');source=source.replace(centerOld,centerNext);changed=true}
const toolOld="  await noOverflow(page,`Tool Shed ${width}`);\n  await assertCards(page,'.tool-shed-directory-card',`Tool Shed ${width}`);";
const toolNext="  await noOverflow(page,`Tool Shed ${width}`);\n  if([320,390,768].includes(width))await page.screenshot({path:`phase475-audit/tool-shed/tool-shed-${width}.png`,fullPage:true});\n  await assertCards(page,'.tool-shed-directory-card',`Tool Shed ${width}`);";
if(!source.includes(toolNext)){if(!source.includes(toolOld))throw new Error('Tool Shed screenshot/assertion order not found.');source=source.replace(toolOld,toolNext);source=source.replace("  if([320,390,768].includes(width))await page.screenshot({path:`phase475-audit/tool-shed/tool-shed-${width}.png`,fullPage:true});\n  results.push",'  results.push');changed=true}
if(changed)await writeFile(path,source);
console.log(JSON.stringify({ok:true,changed},null,2));
