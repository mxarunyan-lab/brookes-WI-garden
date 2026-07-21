import{readFile,writeFile}from'node:fs/promises';
const path='scripts/verifyPhase474CriticalJourneys.mjs';
let source=await readFile(path,'utf8'),changed=false;
if(source.includes('page.waitForFunction(source=>')){
 source=source.replace(/const waitGarden=async\(page,predicate,label\)=>\{try\{await page\.waitForFunction[\s\S]*?\}\};/,"const waitGarden=async(page,predicate,label)=>{const deadline=Date.now()+10000;let snapshot={};while(Date.now()<deadline){snapshot=await garden(page).catch(()=>({}));if(predicate(snapshot))return snapshot;await page.waitForTimeout(75)}throw new Error(`${label}. Current stored state: ${JSON.stringify(snapshot).slice(0,2000)}`)};");
 changed=true;
}
const replacements=[
 ["dialog.getByLabel('Container size').isVisible()","dialog.getByLabel('Container size',{exact:true}).isVisible()"],
 ["dialog.getByLabel('Grow bag size').count()","dialog.getByLabel('Grow bag size',{exact:true}).count()"],
 ["dialog.getByLabel('Container size').fill('5 gallon')","dialog.getByLabel('Container size',{exact:true}).fill('5 gallon')"],
 ["dialog.getByLabel('Grow bag size').isVisible()","dialog.getByLabel('Grow bag size',{exact:true}).isVisible()"],
 ["dialog.getByLabel('Container size').count()","dialog.getByLabel('Container size',{exact:true}).count()"],
 ["dialog.getByLabel('Grow bag size').fill('10 gallon')","dialog.getByLabel('Grow bag size',{exact:true}).fill('10 gallon')"]
];
for(const[old,next]of replacements){if(source.includes(next))continue;if(!source.includes(old))throw new Error(`Expected lifecycle locator not found: ${old}`);source=source.replaceAll(old,next);changed=true}
if(changed)await writeFile(path,source);console.log(JSON.stringify({ok:true,changed}));
