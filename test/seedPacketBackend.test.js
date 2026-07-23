import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeBarcode} from '../server/barcode.js';
import {createApp} from '../server/index.js';
import {analyzeSeedPacket} from '../server/seedPacketVision.js';
import {createIcebergPacketFixture} from '../scripts/seedPacketFixture.mjs';
import {icebergAnalysisFixture} from '../fixtures/icebergAnalysisFixture.js';

const clone=value=>structuredClone(value);
const response=(analysis,id='resp_fixture')=>({id,status:'completed',output_text:JSON.stringify(analysis),usage:{input_tokens:100,output_tokens:50}});

async function withServer(app,run){
 const server=app.listen(0,'127.0.0.1');
 await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject)});
 const address=server.address(),base=`http://127.0.0.1:${address.port}`;
 try{return await run(base)}finally{await new Promise(resolve=>server.close(resolve))}
}

test('machine barcode decoder reads a generated UPC-A packet barcode',async()=>{
 const {back}=await createIcebergPacketFixture();
 const decoded=await decodeBarcode(back);
 assert.equal(decoded.value,'012345678905');
 assert.equal(decoded.format,'UPC-A');
 assert.equal(decoded.checkDigitValid,true);
});

test('multimodal analysis sends front and back together with strict output and store false',async()=>{
 const {frontImage,backImage}=await createIcebergPacketFixture(),calls=[];
 const openaiClient={responses:{create:async(body,options)=>{calls.push({body,options});return response(icebergAnalysisFixture)}}};
 const result=await analyzeSeedPacket({frontImage,backImage,draftContext:{brand:'Burpee'}},{openaiClient,requestId:'req_multimodal',repairPasses:false,barcodeDecoder:async()=>({value:'012345678905',format:'UPC-A',checkDigitValid:true,confidence:'high',method:'machine-decoder',visibleDigits:'012345678905'}),productResearch:async()=>({exact:true,candidate:{brand:'Burpee',crop:'Lettuce',variety:'Iceberg A'},sources:[]})});
 assert.equal(calls.length,1);
 assert.equal(calls[0].body.store,false);
 assert.equal(calls[0].body.reasoning.effort,'minimal');
 assert.equal(calls[0].body.text.format.type,'json_schema');
 assert.equal(calls[0].body.input[0].content.filter(item=>item.type==='input_image').length,2);
 assert.ok(calls[0].body.input[0].content.filter(item=>item.type==='input_image').every(item=>item.detail==='auto'));
 assert.equal(calls[0].options.headers['X-Client-Request-Id'],'req_multimodal');
 assert.equal(result.analysis.packetIdentity.variety,'Iceberg A');
 assert.equal(result.analysis.machineIdentifiers.barcode,'012345678905');
 assert.equal(result.officialProduct.exact,true);
 assert.equal(result.analysisPassCount,1);
});

test('one targeted second pass fills missing high-value fields without replacing trusted values',async()=>{
 const incomplete=clone(icebergAnalysisFixture);
 incomplete.packetIdentity.brand=null;
 incomplete.packetIdentity.crop=null;
 incomplete.packetIdentity.variety=null;
 incomplete.packetIdentity.productName=null;
 incomplete.quality.exactIdentitySupportedByImages=false;
 incomplete.quality.packetIdentityConfidence='low';
 for(const key of ['brand','crop','variety','productName'])incomplete.fieldEvidence[key]=null;
 const {frontImage,backImage}=await createIcebergPacketFixture(),answers=[response(incomplete,'resp_1'),response(icebergAnalysisFixture,'resp_2')],calls=[];
 const openaiClient={responses:{create:async(body)=>{calls.push(body);return answers.shift()}}};
 const result=await analyzeSeedPacket({frontImage,backImage},{openaiClient,requestId:'req_targeted',repairPasses:true,barcodeDecoder:async()=>({value:null,format:null,checkDigitValid:null,confidence:null,method:'unavailable',visibleDigits:null}),productResearch:async()=>({exact:false,candidate:null,sources:[]})});
 assert.equal(calls.length,2);
 assert.equal(result.analysis.packetIdentity.brand,'Burpee');
 assert.equal(result.analysis.packetIdentity.variety,'Iceberg A');
 assert.equal(result.analysisPasses[1].reason,'targeted-missing-fields');
 assert.ok(result.analysisPasses[1].fieldsAdded.includes('packetIdentity.variety'));
});

test('unsupported vision barcode does not discard otherwise valid packet analysis',async()=>{
 const invalidBarcode=clone(icebergAnalysisFixture);
 invalidBarcode.machineIdentifiers.barcode='6285';
 invalidBarcode.machineIdentifiers.barcodeFormat='unknown';
 invalidBarcode.machineIdentifiers.barcodeConfidence='low';
 invalidBarcode.machineIdentifiers.barcodeMethod='vision-read';
 invalidBarcode.machineIdentifiers.visibleDigits='6285';
 invalidBarcode.fieldEvidence.barcode={value:'6285',sourceImage:'back',visibleEvidence:'6285',confidence:'low',printed:true,normalized:false};
 invalidBarcode.fieldEvidence.barcodeFormat={value:'unknown',sourceImage:'back',visibleEvidence:'6285',confidence:'low',printed:false,normalized:true};
 invalidBarcode.fieldEvidence.barcodeConfidence={value:'low',sourceImage:'back',visibleEvidence:'6285',confidence:'low',printed:false,normalized:true};
 invalidBarcode.fieldEvidence.barcodeMethod={value:'vision-read',sourceImage:'back',visibleEvidence:'6285',confidence:'low',printed:false,normalized:true};
 invalidBarcode.fieldEvidence.visibleDigits={value:'6285',sourceImage:'back',visibleEvidence:'6285',confidence:'low',printed:true,normalized:false};
 const {frontImage,backImage}=await createIcebergPacketFixture(),openaiClient={responses:{create:async()=>response(invalidBarcode,'resp_bad_barcode')}};
 const result=await analyzeSeedPacket({frontImage,backImage},{openaiClient,requestId:'req_bad_barcode',repairPasses:false,barcodeDecoder:async()=>({value:null,format:null,checkDigitValid:null,confidence:null,method:'unavailable',visibleDigits:null}),productResearch:async()=>({exact:false,candidate:null,sources:[]})});
 assert.equal(result.analysis.packetIdentity.variety,'Iceberg A');
 assert.equal(result.analysis.machineIdentifiers.barcode,null);
 assert.ok(result.analysis.quality.unreadableFields.includes('barcode'));
});

test('malformed optional guidance does not discard packet identity and planting basics',async()=>{
 const badGuidance=clone(icebergAnalysisFixture);
 badGuidance.instructions.directSowGuidance='EARLY SPRING OR LATE SUMMER';
 badGuidance.fieldEvidence.directSowGuidance={value:'EARLY SPRING OR LATE SUMMER',sourceImage:'back',visibleEvidence:'EARLY SPRING OR LATE SUMMER',confidence:'medium',printed:true,normalized:false};
 const {frontImage,backImage}=await createIcebergPacketFixture(),openaiClient={responses:{create:async()=>response(badGuidance,'resp_bad_guidance')}};
 const result=await analyzeSeedPacket({frontImage,backImage},{openaiClient,requestId:'req_bad_guidance',repairPasses:false,barcodeDecoder:async()=>({value:null,format:null,checkDigitValid:null,confidence:null,method:'unavailable',visibleDigits:null}),productResearch:async()=>({exact:false,candidate:null,sources:[]})});
 assert.equal(result.analysis.packetIdentity.variety,'Iceberg A');
 assert.equal(result.analysis.growing.daysToHarvest,65);
 assert.equal(result.analysis.instructions.directSowGuidance,null);
 assert.ok(result.analysis.quality.unreadableFields.includes('directSowGuidance'));
});

test('malformed product identity is blanked instead of failing the full packet',async()=>{
 const badIdentity=clone(icebergAnalysisFixture);
 badIdentity.packetIdentity.productName='FULL SUN VEGETABLE Lettuce Seeds';
 badIdentity.fieldEvidence.productName={value:'FULL SUN VEGETABLE Lettuce Seeds',sourceImage:'front',visibleEvidence:'FULL SUN VEGETABLE Lettuce Seeds',confidence:'medium',printed:true,normalized:false};
 const {frontImage,backImage}=await createIcebergPacketFixture(),openaiClient={responses:{create:async()=>response(badIdentity,'resp_bad_identity')}};
 const result=await analyzeSeedPacket({frontImage,backImage},{openaiClient,requestId:'req_bad_identity',repairPasses:false,barcodeDecoder:async()=>({value:null,format:null,checkDigitValid:null,confidence:null,method:'unavailable',visibleDigits:null}),productResearch:async()=>({exact:false,candidate:null,sources:[]})});
 assert.equal(result.analysis.packetIdentity.crop,'Lettuce');
 assert.equal(result.analysis.packetIdentity.variety,'Iceberg A');
 assert.equal(result.analysis.packetIdentity.productName,null);
 assert.ok(result.analysis.quality.unreadableFields.includes('productName'));
});

test('health and analysis routes are served by the Node web service',async()=>{
 const fixture=await createIcebergPacketFixture();
 const app=createApp({analyze:async(_payload,{requestId})=>({requestId,model:'fixture',analyzedAt:new Date().toISOString(),analysisPassCount:1,analysisPasses:[],imageHashes:{front:'a',back:'b'},imageMetadata:{},fingerprint:'fixture',analysis:icebergAnalysisFixture,barcode:{value:null},officialProduct:{exact:false},usage:[]})});
 await withServer(app,async base=>{
  const health=await fetch(`${base}/api/health`).then(res=>res.json());
  assert.equal(health.ok,true);
  assert.equal(health.version,'0.21.1');
  const missing=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'test-missing'},body:'{}'});
  assert.equal(missing.status,400);
  const analyzed=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':'test-complete'},body:JSON.stringify({frontImage:fixture.frontImage,backImage:fixture.backImage})});
  assert.equal(analyzed.status,200);
  const body=await analyzed.json();
  assert.equal(body.analysis.packetIdentity.variety,'Iceberg A');
 });
});
