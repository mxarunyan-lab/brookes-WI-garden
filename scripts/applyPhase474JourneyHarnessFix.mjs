import{readFile,writeFile}from'node:fs/promises';

const journeyPath='scripts/verifyPhase474CriticalJourneys.mjs';
let source=await readFile(journeyPath,'utf8'),changed=false;
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
 ["dialog.getByLabel('Grow bag size').fill('10 gallon')","dialog.getByLabel('Grow bag size',{exact:true}).fill('10 gallon')"],
 ["dialog.getByLabel('Hilling stage').fill('First hill')","dialog.getByLabel('Hilling stage').selectOption({label:'First hill'})"],
 ["plantDialog.getByLabel('Crop').fill('Tomato')","plantDialog.getByLabel('Crop',{exact:true}).fill('Tomato')"],
 ["plantDialog.getByLabel('Planting or batch name').fill('QA Tomato Batch')","plantDialog.getByLabel(/Planting or batch name/).fill('QA Tomato Batch')"],
 ["plantDialog.getByLabel('Growing Space').selectOption({label:'QA Container Renamed'})","plantDialog.getByRole('combobox',{name:/^Growing Space/}).selectOption({label:'QA Container Renamed'})"],
 ["await page.addInitScript(data=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('runyan-garden-active-profile','archie');localStorage.setItem('brookes-garden-state-v2',JSON.stringify(data))},emptyGarden);","await page.addInitScript(data=>{if(sessionStorage.getItem('phase474-journey-initialized'))return;localStorage.clear();sessionStorage.clear();localStorage.setItem('runyan-garden-active-profile','archie');localStorage.setItem('brookes-garden-state-v2',JSON.stringify(data));sessionStorage.setItem('phase474-journey-initialized','1')},emptyGarden);"]
];
for(const[old,next]of replacements){if(source.includes(next))continue;if(!source.includes(old))throw new Error(`Expected lifecycle locator or initializer not found: ${old}`);source=source.replaceAll(old,next);changed=true}
if(changed)await writeFile(journeyPath,source);

const modalPath='src/ClearDetailModal.jsx';
let modalSource=await readFile(modalPath,'utf8'),modalChanged=false;
if(modalSource.includes('<label>Bag size<input')){
 modalSource=modalSource.replace('<label>Bag size<input','<label>Grow bag size<input');
 modalChanged=true;
 await writeFile(modalPath,modalSource);
}
if(!modalSource.includes('<label>Grow bag size<input'))throw new Error('Expected potato grow-bag size label was not found.');

console.log(JSON.stringify({ok:true,journeyChanged:changed,modalChanged}));
