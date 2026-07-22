import{readFile,writeFile}from'node:fs/promises';
const path='src/ClearDetailModal.jsx';let source=await readFile(path,'utf8'),changed=false;
const old='<label>Bag size<input value={d.bagSize';
const next='<label>Grow bag size<input value={d.bagSize';
if(!source.includes(next)){if(!source.includes(old))throw new Error('Potato Grow Bag create-field label not found.');source=source.replace(old,next);changed=true}
if(changed)await writeFile(path,source);console.log(JSON.stringify({ok:true,changed}));
