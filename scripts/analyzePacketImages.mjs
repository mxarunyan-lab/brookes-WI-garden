import {loadPacketImages} from './seedPacketFixture.mjs';

const base=(process.env.SEED_PACKET_API_URL||process.env.APP_URL||'http://localhost:3000').replace(/\/$/,'');
const images=await loadPacketImages();
const response=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':`packet-cli-${Date.now()}`},body:JSON.stringify({frontImage:images.frontImage,backImage:images.backImage,draftContext:{fixtureType:images.fixtureType}})});
const body=await response.json().catch(()=>({}));
if(!response.ok){console.error(JSON.stringify({status:response.status,...body},null,2));process.exit(1)}
console.log(JSON.stringify(body,null,2));
