import crypto from 'node:crypto';
import OpenAI from 'openai';
import sharp from 'sharp';
import {decodeBarcode,validateBarcode} from './barcode.js';
import {researchExactSeedProduct} from './productResearch.js';
import {seedPacketJsonSchema,validateSeedPacketAnalysis} from './seedPacketSchema.js';

const MAX=Number(process.env.SEED_PACKET_VISION_MAX_IMAGE_BYTES||9*1024*1024);
const MODEL=process.env.SEED_PACKET_VISION_MODEL||'gpt-5-mini';
const TIMEOUT=Number(process.env.SEED_PACKET_VISION_TIMEOUT_MS||90000);
const allowed=new Set(['image/jpeg','image/png','image/webp']);
const prompt=`Act as a careful seed-packet document analyst. Inspect the FRONT and BACK images together as one physical packet. Use text, layout, icons, nearby labels, and front/back context. Never concatenate unrelated labels. FULL SUN is sunlight, VEGETABLE is category, HEIRLOOM is designation. Read fractions, ranges, barcode digits, lot, weight, packed-for year and sell-by separately. Return null rather than inventing. Every populated field requires fieldEvidence with exact visible evidence, source image, confidence, printed and normalized flags. Distinguish printed counts from weight-only inventory. Capture succession instructions as automation intelligence. Return only the strict schema.`;
function parseDataUrl(value){const match=String(value||'').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);if(!match)throw Object.assign(new Error('Unsupported or malformed packet image.'),{status:400,code:'INVALID_IMAGE'});const buffer=Buffer.from(match[2],'base64');if(!allowed.has(match[1])||!buffer.length)throw Object.assign(new Error('Unsupported packet image.'),{status:415,code:'UNSUPPORTED_IMAGE'});if(buffer.length>MAX)throw Object.assign(new Error('Packet image is too large.'),{status:413,code:'IMAGE_TOO_LARGE'});return{mime:match[1],buffer}}
async function normalizeImage(data){return sharp(data.buffer,{failOn:'warning'}).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).jpeg({quality:88,mozjpeg:true}).toBuffer()}
const dataUrl=buffer=>`data:image/jpeg;base64,${buffer.toString('base64')}`;
const fingerprint=(a,b)=>crypto.createHash('sha256').update(a).update(b).digest('hex');
export async function analyzeSeedPacket({frontImage,backImage,draftContext},{openaiClient,requestId=crypto.randomUUID()}={}){
 if(!process.env.OPENAI_API_KEY&&!openaiClient)throw Object.assign(new Error('Packet analysis is temporarily unavailable.'),{status:503,code:'VISION_NOT_CONFIGURED'});
 const front=await normalizeImage(parseDataUrl(frontImage)),back=await normalizeImage(parseDataUrl(backImage)),imageHashes={front:crypto.createHash('sha256').update(front).digest('hex'),back:crypto.createHash('sha256').update(back).digest('hex')};
 const client=openaiClient||new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:TIMEOUT,maxRetries:1});
 const barcode=await decodeBarcode(back).catch(()=>({method:'unavailable'}));
 const input=[{role:'user',content:[{type:'input_text',text:`${prompt}\nExisting trusted draft context: ${JSON.stringify(draftContext||{}).slice(0,4000)}\nImage 1 is FRONT.`},{type:'input_image',image_url:dataUrl(front),detail:'high'},{type:'input_text',text:'Image 2 is BACK.'},{type:'input_image',image_url:dataUrl(back),detail:'high'}]}];
 let response=await client.responses.create({model:MODEL,input,store:false,text:{format:{type:'json_schema',...seedPacketJsonSchema}}});
 let raw=JSON.parse(response.output_text),analysis;
 try{analysis=validateSeedPacketAnalysis(raw)}catch(error){response=await client.responses.create({model:MODEL,input:[...input,{role:'user',content:[{type:'input_text',text:`Repair the structured response. Validation errors: ${(error.validationErrors||[]).join('; ')}. Reinspect the original images and return the full corrected schema only.`}]}],store:false,text:{format:{type:'json_schema',...seedPacketJsonSchema}}});analysis=validateSeedPacketAnalysis(JSON.parse(response.output_text))}
 if(barcode?.value){const checked=validateBarcode(barcode.value);analysis.machineIdentifiers={...analysis.machineIdentifiers,barcode:checked.value,barcodeFormat:checked.format,barcodeMethod:'machine-decoder',barcodeConfidence:'high',checkDigitValid:checked.checkDigitValid}}
 const official=await researchExactSeedProduct({...analysis.packetIdentity,...analysis.machineIdentifiers}).catch(()=>({exact:false,candidate:null,sources:[]}));
 return{requestId,model:MODEL,analyzedAt:new Date().toISOString(),analysisPassCount:2,imageHashes,fingerprint:fingerprint(front,back),analysis,barcode,officialProduct:official,usage:response.usage||null};
}
