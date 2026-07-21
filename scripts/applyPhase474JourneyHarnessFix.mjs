import{readFile,writeFile}from'node:fs/promises';
const path='scripts/verifyPhase474CriticalJourneys.mjs';
let source=await readFile(path,'utf8');
const old="const waitGarden=async(page,predicate,label)=>{try{await page.waitForFunction(source=>{const row=JSON.parse(localStorage.getItem('brookes-garden-state-v2')||'{}');const fn=new Function('garden',`return (${source})(garden)`);return Boolean(fn(row))},predicate.toString(),{timeout:10000})}catch(error){const snapshot=await garden(page).catch(()=>({}));throw new Error(`${label}. Current stored state: ${JSON.stringify(snapshot).slice(0,2000)}`,{cause:error})}};";
const next="const waitGarden=async(page,predicate,label)=>{let snapshot={};for(let attempt=0;attempt<100;attempt+=1){snapshot=await garden(page).catch(()=>({}));if(predicate(snapshot))return snapshot;await page.waitForTimeout(100)}throw new Error(`${label}. Current stored state: ${JSON.stringify(snapshot).slice(0,2000)}`)};";
if(source.includes(next)){console.log(JSON.stringify({ok:true,changed:false}));process.exit(0)}
if(!source.includes(old))throw new Error('Expected lifecycle polling helper not found.');
source=source.replace(old,next);await writeFile(path,source);console.log(JSON.stringify({ok:true,changed:true}));
