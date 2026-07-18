import crypto from 'node:crypto';
import sharp from 'sharp';
const SUPPORTED=new Set(['image/jpeg','image/png','image/webp']);
export function parseDataImage(value,{maxBytes=10*1024*1024,label='image'}={}){
 if(typeof value!=='string')throw Object.assign(new Error(`${label} is required.`),{code:'invalid_image',status:400});
 const match=value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);if(!match)throw Object.assign(new Error(`${label} must be a JPEG, PNG, or WebP image.`),{code:'unsupported_image',status:415});
 const mime=match[1].toLowerCase(),buffer=Buffer.from(match[2].replace(/\s/g,''),'base64');if(!SUPPORTED.has(mime)||!buffer.length)throw Object.assign(new Error(`${label} could not be decoded.`),{code:'invalid_image',status:400});if(buffer.length>maxBytes)throw Object.assign(new Error(`${label} is too large for packet analysis.`),{code:'image_too_large',status:413});return{mime,buffer,bytes:buffer.length,hash:crypto.createHash('sha256').update(buffer).digest('hex')};
}
export async function normalizeAnalysisImage(image,{maxDimension=3200}={}){
 const normalized=await sharp(image.buffer,{failOn:'error'}).rotate().resize({width:maxDimension,height:maxDimension,fit:'inside',withoutEnlargement:true}).jpeg({quality:92,mozjpeg:true}).toBuffer();
 return{...image,buffer:normalized,mime:'image/jpeg',bytes:normalized.length,dataUrl:`data:image/jpeg;base64,${normalized.toString('base64')}`};
}
export function requestFingerprint(front,back,context={}){return crypto.createHash('sha256').update(`${front.hash}|${back.hash}|${String(context?.draftId||'')}`).digest('hex')}
