import{mkdir,readFile,rm,writeFile}from'node:fs/promises';
import path from'node:path';
import summer0 from'../src/seasonal-assets/summer-0.js';
import summer1 from'../src/seasonal-assets/summer-1.js';
import summer2 from'../src/seasonal-assets/summer-2.js';
import summer3 from'../src/seasonal-assets/summer-3.js';
import winter0 from'../src/seasonal-assets/winter-0.js';
import winter1 from'../src/seasonal-assets/winter-1.js';
import winter2 from'../src/seasonal-assets/winter-2.js';
import winter3 from'../src/seasonal-assets/winter-3.js';

const root=process.cwd();
const target=path.join(root,'public/images/garden-headers');
const fromCss=async file=>{
 const css=await readFile(path.join(root,file),'utf8');
 const match=css.match(/data:image\/avif;base64,([A-Za-z0-9+/=]+)/);
 if(!match)throw new Error(`No AVIF data found in ${file}`);
 return match[1];
};
const sources={
 spring:await fromCss('src/styles/seasonal-header-spring.css'),
 summer:[summer0,summer1,summer2,summer3].join(''),
 fall:await fromCss('src/styles/seasonal-header-fall.css'),
 winter:[winter0,winter1,winter2,winter3].join('')
};

await mkdir(target,{recursive:true});
for(const[season,base64]of Object.entries(sources)){
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length<10000)throw new Error(`${season} asset is unexpectedly small: ${bytes.length}`);
 if(bytes.subarray(4,12).toString('ascii')!=='ftypavif')throw new Error(`${season} asset is not AVIF`);
 await writeFile(path.join(target,`garden-header-${season}.avif`),bytes);
 console.log(`${season}: ${bytes.length} bytes`);
}

await rm(path.join(root,'src/seasonal-assets'),{recursive:true,force:true});
await rm(path.join(root,'src/styles/seasonal-header-spring.css'),{force:true});
await rm(path.join(root,'src/styles/seasonal-header-fall.css'),{force:true});
await rm(path.join(root,'.github/workflows/finalize-seasonal-header-assets.yml'),{force:true});
await rm(path.join(root,'scripts/finalizeSeasonalHeaderAssets.mjs'),{force:true});
