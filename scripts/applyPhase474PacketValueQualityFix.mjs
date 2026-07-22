import{readFile,writeFile}from'node:fs/promises';
const path='src/seedPacketIntelligence.js';
let source=await readFile(path,'utf8'),changed=false;
const replace=(oldValue,newValue,label)=>{
 if(source.includes(newValue))return;
 if(!source.includes(oldValue))throw new Error(`Expected ${label} source was not found.`);
 source=source.replace(oldValue,newValue);changed=true;
};
replace(
 "const hasOcrArtifacts=value=>/[©®\\uFFFD]|(?:^|\\s)[a-z]?\\d[a-z](?:\\s|$)|[^a-z0-9.,:/()'’\"%+°·–—-]{2,}/i.test(asText(value));",
 "const hasOcrArtifacts=value=>/[©®\\uFFFD]|(?:^|\\s)[a-z]?\\d[a-z](?:\\s|$)|[^a-z0-9\\s.,;:/()'’\"%+°·–—-]{2,}/i.test(asText(value));",
 'normal printed punctuation');
replace(
 "seasonalWindow:value=>sentenceLooksComplete(value)&&/(spring|summer|fall|autumn|frost|soil)/i.test(value)",
 "seasonalWindow:value=>sentenceLooksComplete(value)&&/(spring|summer|fall|autumn|frost|soil|long[- ]day|short[- ]day)/i.test(value)",
 'long-day seasonal wording');
replace(
 "/^((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s+(?:inch(?:es)?|in\\.?|cm|feet|foot|ft\\.?)$/i.test(asText(value))",
 "/^((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)(?:\\s*[–-]\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?))?\\s+(?:inch(?:es)?|in\\.?|cm|feet|foot|ft\\.?)$/i.test(asText(value))",
 'printed measurement ranges');
if(changed)await writeFile(path,source);
console.log(JSON.stringify({ok:true,changed}));
