import fs from'node:fs/promises';
import path from'node:path';
const endpoint=process.env.SEED_PACKET_API_URL||'http://127.0.0.1:3000/api/seed-packets/analyze';
const frontPath=process.env.FRONT_PACKET_IMAGE,backPath=process.env.BACK_PACKET_IMAGE;
if(!frontPath||!backPath){console.error('Set FRONT_PACKET_IMAGE and BACK_PACKET_IMAGE to private local image paths. Images are not committed.');process.exit(2)}
const asData=async file=>{const ext=path.extname(file).toLowerCase(),mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg',bytes=await fs.readFile(file);return`data:${mime};base64,${bytes.toString('base64')}`};
const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','x-device-id':'phase46x3-private-fixture'},body:JSON.stringify({frontImage:await asData(frontPath),backImage:await asData(backPath),draftContext:{draftId:'private-iceberg-a-acceptance'}})}),json=await response.json();
if(!response.ok){console.error(JSON.stringify(json,null,2));process.exit(1)}
console.log(JSON.stringify({requestId:json.requestId,identity:json.analysis?.packetIdentity,quality:json.analysis?.quality,review:json.review,barcode:json.barcode,productResearch:json.productResearch?.primary},null,2));
