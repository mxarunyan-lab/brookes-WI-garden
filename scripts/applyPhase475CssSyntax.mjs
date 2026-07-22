import{readFile,writeFile}from'node:fs/promises';
const path='src/styles/phase-4-7-5-navigation-lock.css';
let source=await readFile(path,'utf8');
const opens=(source.match(/\{/g)||[]).length,closes=(source.match(/\}/g)||[]).length,missing=opens-closes;
if(missing<0)throw new Error(`${path} contains ${Math.abs(missing)} extra closing brace(s).`);
if(missing>0){source=`${source.trimEnd()}\n${'}\n'.repeat(missing)}`;await writeFile(path,source)}
const balanced=(source.match(/\{/g)||[]).length===(source.match(/\}/g)||[]).length;
if(!balanced)throw new Error(`${path} remains unbalanced after correction.`);
console.log(JSON.stringify({ok:true,missingClosingBraces:missing,changed:missing>0},null,2));
