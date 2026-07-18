import OpenAI from 'openai';
import {zodTextFormat} from 'openai/helpers/zod';
import {SeedPacketVisionSchema,validateVisionAnalysis} from './seedPacketSchema.js';
import {decodePacketBarcode} from './barcode.js';
import {researchExactProduct} from './productResearch.js';
import {mergePacketAnalysis} from './mergePacketAnalysis.js';

export const SEED_PACKET_VISION_PROMPT=`You are a careful seed-packet document analyst. Inspect the FRONT and BACK photographs together as two views of one physical packet. Use text, layout, icons, spatial label/value relationships, and cross-image context. Distinguish brand, crop, variety, category, designations, claims, measurements, instructions, dates, weight, count, barcode, lot, and product codes. FULL SUN is sunlight, VEGETABLE is category, HEIRLOOM is a designation, and none belong in variety or productName. Read fractions and numeric ranges accurately. Never concatenate unrelated labels. Never invent uncertain text, barcode digits, counts, dates, or guidance. Use null for unreadable fields. Every populated field must have fieldEvidence with exact visible evidence, source image, confidence, printed status, and normalization status. Weight is not seed count. Separate packetYear, packedForYear, sellByDate, lotNumber, price, and barcode. Capture succession instructions as automation intelligence. Return only the strict structured packet response.`;
const transient=error=>[408,409,429,500,502,503,504].includes(Number(error?.status));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function buildVisionRequest({front,back,model,repairErrors=[]}){
 const repair=repairErrors.length?`\nThe prior response failed validation. Correct only these issues without inventing data:\n- ${repairErrors.join('\n- ')}`:'';
 return{
  model,
  store:false,
  max_output_tokens:9000,
  input:[
   {role:'developer',content:[{type:'input_text',text:SEED_PACKET_VISION_PROMPT+repair}]},
   {role:'user',content:[
    {type:'input_text',text:'FRONT PHOTO — analyze as the front of the same seed packet.'},
    {type:'input_image',image_url:front.dataUrl,detail:'high'},
    {type:'input_text',text:'BACK PHOTO — analyze as the back of that same seed packet.'},
    {type:'input_image',image_url:back.dataUrl,detail:'high'}
   ]}
  ],
  text:{format:zodTextFormat(SeedPacketVisionSchema,'seed_packet_analysis')}
 };
}

async function callOpenAI({front,back,model,requestId,repairErrors=[]}){
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:Number(process.env.SEED_PACKET_VISION_UPSTREAM_TIMEOUT_MS)||90000,maxRetries:0});
 return client.responses.parse(buildVisionRequest({front,back,model,repairErrors}),{headers:{'x-client-request-id':requestId}});
}

export async function analyzeSeedPacket({front,back,currentDraft={},requestId},{modelCaller=callOpenAI,barcodeDecoder=decodePacketBarcode,productResearcher=researchExactProduct}={}){
 if(!process.env.OPENAI_API_KEY&&modelCaller===callOpenAI)throw Object.assign(new Error('Packet analysis is not configured.'),{status:503,code:'vision_not_configured'});
 const model=process.env.SEED_PACKET_VISION_MODEL||'gpt-5';
 const maxPasses=Math.max(1,Math.min(2,Number(process.env.SEED_PACKET_VISION_MAX_PASSES)||2));
 let response,analysis,errors=[],pass=0,transientRetryUsed=false;
 while(pass<maxPasses){
  pass++;
  try{response=await modelCaller({front,back,model,requestId,repairErrors:errors})}
  catch(error){
   if(!transientRetryUsed&&transient(error)){transientRetryUsed=true;pass--;await sleep(25);continue}
   throw Object.assign(new Error(error?.status===429?'Packet analysis is busy. Try again shortly.':'Packet analysis could not finish.'),{status:error?.status||502,code:error?.status===429?'rate_limited':'upstream_failure'});
  }
  analysis=response?.output_parsed;
  const checked=validateVisionAnalysis(analysis);
  if(checked.ok){analysis=checked.value;break}
  errors=checked.errors;analysis=null;
 }
 if(!analysis)throw Object.assign(new Error('The packet analysis response could not be validated.'),{status:502,code:'invalid_model_response',details:errors.slice(0,12)});
 const barcodeResult=await barcodeDecoder(back.buffer);
 const visibleBarcode=analysis.machineIdentifiers.barcode;
 if(barcodeResult.value&&visibleBarcode&&barcodeResult.value!==visibleBarcode)analysis.warnings.push('Machine-decoded barcode and visually read digits did not match. The machine-decoded value was retained when its check digit was valid.');
 const identity={brand:analysis.packetIdentity.brand,crop:analysis.packetIdentity.crop,variety:analysis.packetIdentity.variety,productName:analysis.packetIdentity.productName,barcode:barcodeResult.checkDigitValid!==false?barcodeResult.value:visibleBarcode,sku:analysis.machineIdentifiers.sku||analysis.machineIdentifiers.catalogNumber};
 const productResearch=await productResearcher(identity);
 const enriched={...analysis,visionModel:model,visionRequestId:requestId,imageHashes:{front:front.hash,back:back.hash},analysisPassCount:pass,usage:response?.usage?{inputTokens:response.usage.input_tokens||0,outputTokens:response.usage.output_tokens||0,totalTokens:response.usage.total_tokens||0}:null};
 const merged=mergePacketAnalysis({currentDraft,analysis:enriched,barcodeResult,productResearch});
 return{requestId,analysis:enriched,barcode:barcodeResult,productResearch,packetDraft:merged.draft,review:merged.summary};
}
