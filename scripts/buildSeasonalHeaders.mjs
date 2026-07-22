import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, stat} from 'node:fs/promises';
import sharp from 'sharp';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'public','images','garden-headers');
const seasons=['spring','summer','fall','winter'];

await mkdir(directory,{recursive:true});

for(const season of seasons){
 const source=path.join(directory,`garden-header-${season}.avif`);
 const output=path.join(directory,`garden-header-${season}.webp`);
 const metadata=await sharp(source,{failOn:'none'}).metadata();
 if(!metadata.width||!metadata.height)throw new Error(`Could not read ${season} seasonal header.`);
 const ratio=metadata.width/metadata.height;
 if(Math.abs(ratio-2)>.01)throw new Error(`${season} seasonal header is not 2:1 (${metadata.width}x${metadata.height}).`);
 await sharp(source,{failOn:'none'})
  .rotate()
  .webp({quality:95,effort:6,smartSubsample:true})
  .toFile(output);
 const built=await stat(output);
 if(built.size<10000)throw new Error(`${season} WebP output is unexpectedly small.`);
 console.log(`Built ${path.basename(output)} (${built.size} bytes)`);
}
