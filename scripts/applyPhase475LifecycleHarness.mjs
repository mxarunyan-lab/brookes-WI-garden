import{readFile,writeFile}from'node:fs/promises';
const path='scripts/verifyPhase474CriticalJourneys.mjs';
let source=await readFile(path,'utf8'),changed=false;
const old="await dialog.getByLabel('Hilling stage').fill('First hill')";
const next="await dialog.getByLabel('Hilling stage').selectOption('First hill')";
if(!source.includes(next)){
 if(!source.includes(old))throw new Error('Phase 4.7.4 grow-bag Hilling stage harness call not found.');
 source=source.replace(old,next);changed=true;
}
if(changed)await writeFile(path,source);
console.log(JSON.stringify({ok:true,changed},null,2));
