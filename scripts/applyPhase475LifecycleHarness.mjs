import{readFile,writeFile}from'node:fs/promises';
const path='scripts/verifyPhase474CriticalJourneys.mjs';
let source=await readFile(path,'utf8'),changed=false;
const hillingFill="await dialog.getByLabel('Hilling stage').fill('First hill')";
const hillingString="await dialog.getByLabel('Hilling stage').selectOption('First hill')";
const hillingNext="await dialog.getByLabel('Hilling stage').selectOption({label:'First hill'})";
if(!source.includes(hillingNext)){
 if(source.includes(hillingString))source=source.replace(hillingString,hillingNext);
 else if(source.includes(hillingFill))source=source.replace(hillingFill,hillingNext);
 else throw new Error('Phase 4.7.4 grow-bag Hilling stage harness call not found.');
 changed=true;
}
const initOld="await page.addInitScript(data=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('runyan-garden-active-profile','archie');localStorage.setItem('brookes-garden-state-v2',JSON.stringify(data))},emptyGarden);";
const initNext="await page.addInitScript(data=>{if(sessionStorage.getItem('phase474-journey-initialized'))return;localStorage.clear();sessionStorage.clear();localStorage.setItem('runyan-garden-active-profile','archie');localStorage.setItem('brookes-garden-state-v2',JSON.stringify(data));sessionStorage.setItem('phase474-journey-initialized','1')},emptyGarden);";
if(!source.includes(initNext)){
 if(!source.includes(initOld))throw new Error('Phase 4.7.4 one-time journey initializer not found.');
 source=source.replace(initOld,initNext);changed=true;
}
if(changed)await writeFile(path,source);
console.log(JSON.stringify({ok:true,changed},null,2));
