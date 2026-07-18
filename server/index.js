import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import helmet from 'helmet';
import rateLimit,{ipKeyGenerator} from 'express-rate-limit';
import {parseDataImage,normalizeAnalysisImage,requestFingerprint} from './imageInput.js';
import {analyzeSeedPacket} from './seedPacketVision.js';
import {APP_VERSION,BUILD_ID} from '../src/version.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const dist=path.resolve(__dirname,'../dist');
const maxBytes=Number(process.env.SEED_PACKET_VISION_MAX_IMAGE_BYTES)||10*1024*1024;
const cacheTtl=Number(process.env.SEED_PACKET_VISION_CACHE_TTL_MS)||6*60*60*1000;
const cache=new Map();
const inflight=new Map();

export const app=express();
app.disable('x-powered-by');
app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(express.json({limit:process.env.SEED_PACKET_VISION_REQUEST_LIMIT||'32mb',strict:true}));

const limiter=rateLimit({
 windowMs:15*60*1000,
 limit:Number(process.env.SEED_PACKET_VISION_RATE_LIMIT)||12,
 standardHeaders:true,
 legacyHeaders:false,
 keyGenerator:req=>{const device=String(req.get('x-device-id')||'').slice(0,80);return device?`device:${device}`:`ip:${ipKeyGenerator(req.ip)}`},
 message:{error:{code:'rate_limited',message:'Packet analysis is busy for this device. Try again shortly.'}}
});

app.get('/api/health',(req,res)=>res.json({
 ok:true,
 apiService:true,
 packetVisionConfigured:Boolean(process.env.OPENAI_API_KEY),
 version:APP_VERSION,
 buildId:BUILD_ID
}));

app.post('/api/seed-packets/analyze',limiter,async(req,res)=>{
 const requestId=crypto.randomUUID();
 let fingerprint='';
 res.set('x-request-id',requestId);
 try{
  const frontInput=parseDataImage(req.body?.frontImage,{maxBytes,label:'Front image'});
  const backInput=parseDataImage(req.body?.backImage,{maxBytes,label:'Back image'});
  fingerprint=requestFingerprint(frontInput,backInput,req.body?.draftContext||{});
  const cached=cache.get(fingerprint);
  if(cached&&Date.now()-cached.at<cacheTtl)return res.json({...cached.value,cacheHit:true,requestId});
  if(inflight.has(fingerprint))return res.status(409).json({error:{code:'duplicate_analysis',message:'This packet is already being analyzed.',requestId}});
  const promise=(async()=>{
   const[front,back]=await Promise.all([normalizeAnalysisImage(frontInput),normalizeAnalysisImage(backInput)]);
   return analyzeSeedPacket({front,back,currentDraft:req.body?.draftContext||{},requestId});
  })();
  inflight.set(fingerprint,promise);
  const result=await promise;
  cache.set(fingerprint,{at:Date.now(),value:result});
  return res.json({...result,cacheHit:false});
 }catch(error){
  const status=Number(error?.status)||500;
  const allowed=new Set(['invalid_image','unsupported_image','image_too_large','vision_not_configured','rate_limited','upstream_failure','invalid_model_response','duplicate_analysis']);
  const code=allowed.has(error?.code)?error.code:'analysis_failed';
  return res.status(status).json({error:{code,message:error?.message||'Packet analysis could not finish.',requestId}});
 }finally{
  if(fingerprint)inflight.delete(fingerprint);
 }
});

app.use(express.static(dist,{index:false,maxAge:'1h'}));
app.use((req,res,next)=>{
 if(req.path.startsWith('/api/'))return next();
 return res.sendFile(path.join(dist,'index.html'));
});
app.use((req,res)=>res.status(404).json({error:{code:'not_found',message:'Not found.'}}));

export function startServer(port=Number(process.env.PORT)||3000){
 return app.listen(port,()=>console.log(`[Runyan Garden] web service listening on ${port}`));
}
if(process.env.NODE_ENV!=='test')startServer();
