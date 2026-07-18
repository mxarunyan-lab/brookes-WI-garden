import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import {analyzeSeedPacket} from './seedPacketVision.js';
const app=express(),port=Number(process.env.PORT||3000),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));app.use(compression());app.use(express.json({limit:process.env.SEED_PACKET_REQUEST_LIMIT||'22mb'}));
const buckets=new Map(),cache=new Map();
function rateLimit(req,res,next){const key=req.get('x-device-id')||req.ip||'unknown',now=Date.now(),rows=(buckets.get(key)||[]).filter(t=>now-t<60_000);if(rows.length>=4)return res.status(429).json({code:'RATE_LIMITED',message:'Packet analysis is busy. Try again shortly.',requestId:crypto.randomUUID()});rows.push(now);buckets.set(key,rows);next()}
app.get('/api/health',(req,res)=>res.json({ok:true,packetVisionConfigured:Boolean(process.env.OPENAI_API_KEY),version:process.env.APP_VERSION||'0.20.3'}));
app.post('/api/seed-packets/analyze',rateLimit,async(req,res)=>{const requestId=crypto.randomUUID();try{const {frontImage,backImage,draftContext,photoFingerprint}=req.body||{};if(!frontImage||!backImage)return res.status(400).json({code:'BOTH_IMAGES_REQUIRED',message:'Add both packet photos before analysis.',requestId});if(photoFingerprint&&cache.has(photoFingerprint))return res.json({...cache.get(photoFingerprint),cacheHit:true});const result=await analyzeSeedPacket({frontImage,backImage,draftContext},{requestId});if(photoFingerprint){cache.set(photoFingerprint,result);setTimeout(()=>cache.delete(photoFingerprint),30*60_000).unref?.()}res.json({...result,cacheHit:false})}catch(error){const status=Number(error.status)||(['VISION_NOT_CONFIGURED'].includes(error.code)?503:502);console.error('[seed-packet-vision]',{requestId,code:error.code||'ANALYSIS_FAILED',message:error.message});res.status(status).json({code:error.code||'ANALYSIS_FAILED',message:status===503?'Online packet analysis is temporarily unavailable. Your photos and draft remain saved.':'Packet analysis could not finish. Your photos and draft remain saved.',requestId})}});
app.use(express.static(root,{index:false,maxAge:'1h'}));app.use((req,res)=>res.sendFile(path.join(root,'index.html')));app.listen(port,()=>console.log(`Runyan Garden web service listening on ${port}`));
