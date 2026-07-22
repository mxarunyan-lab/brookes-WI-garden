import test from'node:test';
import assert from'node:assert/strict';
import{once}from'node:events';
import{createApp}from'../server/index.js';
import{createIcebergPacketFixture,icebergAnalysisFixture}from'./fixtures/icebergPacketFixture.js';

const withServer=async(app,run)=>{
 const server=app.listen(0,'127.0.0.1');
 await once(server,'listening');
 const address=server.address(),base=`http://127.0.0.1:${address.port}`;
 try{return await run(base)}finally{server.close();await once(server,'close')}
};

test('backend rejects missing packet photos before analysis',async()=>{
 const app=createApp({analyze:async()=>{throw new Error('analysis should not run')}});
 await withServer(app,async base=>{
  const response=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'missing-photos'},body:'{}'});
  assert.equal(response.status,400);
  const body=await response.json();
  assert.equal(body.code,'BOTH_IMAGES_REQUIRED');
  assert.match(body.message,/both packet photos/i);
 });
});

test('backend rate limits repeated packet analysis',async()=>{
 const fixture=await createIcebergPacketFixture(),app=createApp({analyze:async()=>icebergAnalysisFixture});
 await withServer(app,async base=>{
  const statuses=[];
  for(let index=0;index<5;index+=1){
   const response=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'rate-limit-test'},body:JSON.stringify({frontImage:fixture.frontImage,backImage:fixture.backImage})});
   statuses.push(response.status);
  }
  assert.deepEqual(statuses.slice(0,4),[200,200,200,200]);
  assert.equal(statuses[4],429);
 });
});

test('backend returns structured analysis errors without leaking details',async()=>{
 const fixture=await createIcebergPacketFixture(),app=createApp({analyze:async()=>{const error=new Error('secret upstream detail');error.code='UPSTREAM_TIMEOUT';error.status=504;throw error}});
 await withServer(app,async base=>{
  const response=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'timeout-test'},body:JSON.stringify({frontImage:fixture.frontImage,backImage:fixture.backImage})});
  assert.equal(response.status,504);
  const body=await response.json();
  assert.equal(body.code,'UPSTREAM_TIMEOUT');
  assert.match(body.message,/did not finish/i);
  assert.doesNotMatch(body.message,/secret upstream/i);
 });
});

test('backend validates exact-product research identity',async()=>{
 const app=createApp({research:async()=>({ok:true})});
 await withServer(app,async base=>{
  const response=await fetch(`${base}/api/seed-products/lookup`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'lookup-test'},body:JSON.stringify({identity:{brand:'Burpee',crop:'Lettuce'}})});
  assert.equal(response.status,400);
  const body=await response.json();
  assert.equal(body.code,'IDENTITY_REQUIRED');
 });
});

test('backend researches a complete exact-product identity',async()=>{
 let received=null;
 const app=createApp({research:async identity=>{received=identity;return{status:'matched',candidates:[{id:'qa'}]}}});
 await withServer(app,async base=>{
  const response=await fetch(`${base}/api/seed-products/lookup`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'lookup-complete'},body:JSON.stringify({identity:{brand:'Burpee',crop:'Lettuce',variety:'Iceberg A',rawVisibleText:'Burpee Lettuce Iceberg A'}})});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,'matched');
  assert.equal(received.brand,'Burpee');
  assert.equal(received.crop,'Lettuce');
  assert.equal(received.variety,'Iceberg A');
 });
});

test('backend can return an analyzed Iceberg packet fixture',async()=>{
 const fixture=await createIcebergPacketFixture(),app=createApp({analyze:async(_payload,{requestId})=>({requestId,model:'fixture',analyzedAt:new Date().toISOString(),analysisPassCount:1,analysisPasses:[],imageHashes:{front:'a',back:'b'},imageMetadata:{},fingerprint:'fixture',analysis:icebergAnalysisFixture,barcode:{value:null},officialProduct:{exact:false},usage:[]})});
 await withServer(app,async base=>{
  const response=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'iceberg-fixture'},body:JSON.stringify({frontImage:fixture.frontImage,backImage:fixture.backImage})});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.analysis.packetIdentity.crop,'Lettuce');
  assert.equal(result.analysis.packetIdentity.variety,'Iceberg A');
  assert.equal(result.analysis.packetIdentity.productName,null);
  assert.ok(result.analysis.quality.unreadableFields.includes('productName'));
 });
});

test('health and analysis routes are served by the Node web service',async()=>{
 const fixture=await createIcebergPacketFixture();
 const app=createApp({analyze:async(_payload,{requestId})=>({requestId,model:'fixture',analyzedAt:new Date().toISOString(),analysisPassCount:1,analysisPasses:[],imageHashes:{front:'a',back:'b'},imageMetadata:{},fingerprint:'fixture',analysis:icebergAnalysisFixture,barcode:{value:null},officialProduct:{exact:false},usage:[]})});
 await withServer(app,async base=>{
  const health=await fetch(`${base}/api/health`).then(res=>res.json());
  assert.equal(health.ok,true);
  assert.equal(health.version,'0.20.4');
  const missing=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'test-missing'},body:'{}'});
  assert.equal(missing.status,400);
  const analyzed=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'test-complete'},body:JSON.stringify({frontImage:fixture.frontImage,backImage:fixture.backImage})});
  assert.equal(analyzed.status,200);
  const body=await analyzed.json();
  assert.equal(body.analysis.packetIdentity.variety,'Iceberg A');
 });
});
