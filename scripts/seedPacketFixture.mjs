import fs from 'node:fs/promises';
import path from 'node:path';
import bwipjs from 'bwip-js';
import sharp from 'sharp';

const mimeFor=(filename)=>{const ext=path.extname(filename).toLowerCase();return ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg'};
const dataUrl=(buffer,mime)=>`data:${mime};base64,${buffer.toString('base64')}`;
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));

async function packetSide({side,lines,barcode=false}){
 const width=1400,height=2000;
 const text=lines.map((line,index)=>`<text x="90" y="${190+index*125}" font-family="Arial, Helvetica, sans-serif" font-size="${index<3?82:54}" font-weight="${index<3?800:600}" fill="#173d2a">${escape(line)}</text>`).join('');
 const svg=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="48" fill="#fffaf0"/><rect x="28" y="28" width="1344" height="1944" rx="38" fill="none" stroke="#1b5c3f" stroke-width="18"/><text x="90" y="92" font-family="Arial" font-size="36" font-weight="700" fill="#b2482d">${side}</text>${text}</svg>`);
 const composites=[];
 if(barcode){const code=await bwipjs.toBuffer({bcid:'upca',text:'012345678905',scale:4,height:30,includetext:true,textxalign:'center',backgroundcolor:'FFFFFF',padding:20});composites.push({input:code,left:395,top:1400})}
 return sharp(svg).composite(composites).png().toBuffer();
}

export async function createIcebergPacketFixture(){
 const front=await packetSide({side:'FRONT',lines:['BURPEE','LETTUCE','Iceberg A','VEGETABLE · HEIRLOOM','NET WT 1 g','$3.95','FULL SUN']});
 const back=await packetSide({side:'BACK',barcode:true,lines:['65 DAYS TO HARVEST','PLANT 1/4 INCH DEEP','THIN TO 4 INCHES','EMERGES IN 7–10 DAYS','DIRECT SOW OUTDOORS','EARLY SPRING OR LATE SUMMER','KEEP EVENLY MOIST','AVERAGE WELL-DRAINED SOIL','SOW EVERY 2 WEEKS','4 PLANTS PER 12-INCH CONTAINER','HARVEST FIRM, FULL-SIZED HEADS','LOT A24 · PRODUCT prod000747']});
 return{front,back,frontImage:dataUrl(front,'image/png'),backImage:dataUrl(back,'image/png')};
}

export async function loadPacketImages(){
 const frontPath=process.env.SEED_PACKET_FRONT_PATH,backPath=process.env.SEED_PACKET_BACK_PATH;
 if(Boolean(frontPath)!==Boolean(backPath))throw new Error('Set both SEED_PACKET_FRONT_PATH and SEED_PACKET_BACK_PATH, or neither.');
 if(frontPath&&backPath){const[front,back]=await Promise.all([fs.readFile(frontPath),fs.readFile(backPath)]);return{front,back,frontImage:dataUrl(front,mimeFor(frontPath)),backImage:dataUrl(back,mimeFor(backPath)),fixtureType:'user-supplied'}}
 return{...await createIcebergPacketFixture(),fixtureType:'development-generated'};
}
