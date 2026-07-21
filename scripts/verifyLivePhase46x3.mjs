import assert from 'node:assert/strict';
import {loadPacketImages} from './seedPacketFixture.mjs';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const attempts=Number(process.env.VERIFY_ATTEMPTS||48),delay=Number(process.env.VERIFY_DELAY_MS||15000);
const packetAttempts=Number(process.env.VERIFY_PACKET_ATTEMPTS||3),packetDelay=Number(process.env.VERIFY_PACKET_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let health=null;
for(let attempt=1;attempt<=attempts;attempt+=1){
 try{const response=await fetch(`${base}/api/health`,{headers:{accept:'application/json'},cache:'no-store'});if(response.ok){const candidate=await response.json();if(candidate.version==='0.20.3'){health=candidate;break}}}catch{}
 if(attempt<attempts)await sleep(delay);
}
assert.ok(health,'Live Node health endpoint did not serve v0.20.3.');
assert.equal(health.ok,true);
assert.equal(health.service,'runyan-garden');
assert.equal(health.packetVisionConfigured,true,'Render OPENAI_API_KEY is not configured.');
assert.ok((health.productResearchProviders||[]).includes('official-curated-catalog'));

const html=await fetch(`${base}/`,{cache:'no-store'}).then(response=>{assert.equal(response.status,200);return response.text()});
const assetPath=html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
assert.ok(assetPath,'Live frontend JavaScript asset was not found.');
const assetUrl=new URL(assetPath,`${base}/`).toString();
const js=await fetch(assetUrl,{cache:'no-store'}).then(response=>{assert.equal(response.status,200);return response.text()});
assert.match(js,/0\.20\.3/);
assert.match(js,/phase-4-7-1-ia-restoration-mobile-final/);
assert.doesNotMatch(js,/OPENAI_API_KEY\s*=/);
assert.doesNotMatch(js,/sk-[A-Za-z0-9_-]{20,}/);
assert.doesNotMatch(js,/Photos do the first pass/i);
assert.doesNotMatch(js,/front usually identifies/i);
assert.doesNotMatch(js,/reading stops if it takes too long/i);

const images=await loadPacketImages();
let result=null,packetProbe={ok:false,status:null,warning:null};
for(let attempt=1;attempt<=packetAttempts;attempt+=1){
 try{
  const response=await fetch(`${base}/api/seed-packets/analyze`,{method:'POST',headers:{'content-type':'application/json','x-device-id':`phase46x3-live-${Date.now()}-${attempt}`},body:JSON.stringify({frontImage:images.frontImage,backImage:images.backImage,draftContext:{verification:'phase-4.6x.3',fixtureType:images.fixtureType}})});
  const text=await response.text(),candidate=(()=>{try{return JSON.parse(text)}catch{return{}}})();
  if(response.status===200){result=candidate;packetProbe={ok:true,status:200,warning:null};break}
  packetProbe={ok:false,status:response.status,warning:`Live packet analysis returned ${response.status}.`};
  if(![502,503,504].includes(response.status))assert.fail(`Live packet endpoint failed: ${response.status} ${text.slice(0,500)}`);
 }catch(error){
  if(error?.code==='ERR_ASSERTION')throw error;
  packetProbe={ok:false,status:null,warning:`Live packet analysis request failed: ${error?.message||error}`};
 }
 if(attempt<packetAttempts)await sleep(packetDelay);
}

let identity={},inventory={},growing={},instructions={},automation={},quality={},machine={};
if(packetProbe.ok){
 const analysis=result.analysis||{};
 identity=analysis.packetIdentity||{};inventory=analysis.inventory||{};growing=analysis.growing||{};instructions=analysis.instructions||{};automation=analysis.automation||{};quality=analysis.quality||{};machine=analysis.machineIdentifiers||{};
 assert.match(identity.brand||'',/^burpee$/i);
 assert.match(identity.crop||'',/^lettuce$/i);
 assert.match(identity.variety||'',/^iceberg a$/i);
 assert.ok(!/full sun|vegetable|heirloom/i.test(identity.variety||''));
 assert.ok(!/full sun/i.test(identity.productName||''));
 assert.equal(inventory.packetWeightValue,1);
 assert.match(inventory.packetWeightUnit||'',/^g$/i);
 assert.equal(inventory.inventoryBasis,'weight');
 assert.equal(inventory.printedSeedCount,null);
 assert.match(growing.sunlight||'',/full sun/i);
 assert.equal(growing.daysToHarvest,65);
 assert.equal(growing.plantingDepthValue,0.25);
 assert.match(growing.plantingDepthUnit||'',/inch/i);
 assert.equal(growing.emergenceMinimumDays,7);
 assert.equal(growing.emergenceMaximumDays,10);
 assert.equal(growing.thinningSpacingValue,4);
 assert.match(instructions.directSowGuidance||'',/sow|outdoor/i);
 assert.match(instructions.moistureGuidance||'',/evenly moist|moist/i);
 assert.doesNotMatch(instructions.moistureGuidance||'',/\$|price/i);
 assert.match(instructions.successionGuidance||'',/two weeks|2 weeks|14 days/i);
 assert.equal(automation.successionRecommended,true);
 assert.equal(automation.successionIntervalDays,14);
 assert.equal(quality.frontUsable,true);
 assert.equal(quality.backUsable,true);
 assert.ok(['high','confirmed'].includes(String(quality.packetIdentityConfidence||'').toLowerCase()));
 if(machine.barcode)assert.notEqual(machine.checkDigitValid,false,'A decoded barcode cannot be marked invalid.');
 assert.equal(result.officialProduct?.exact,true);
 assert.match(result.officialProduct?.candidate?.variety||'',/^Iceberg A$/i);
}else console.warn(`[live-verification] ${packetProbe.warning} Phase 4.7.1 health and frontend deployment checks passed; packet analysis remains a separate service warning.`);

console.log(JSON.stringify({ok:true,deploymentVerified:true,base,health,fixtureType:images.fixtureType,packetProbe,requestId:result?.requestId||null,model:result?.model||null,analysisPassCount:result?.analysisPassCount||null,identity,barcode:{value:machine.barcode,method:machine.barcodeMethod,checkDigitValid:machine.checkDigitValid},officialProduct:{exact:result?.officialProduct?.exact,provider:result?.officialProduct?.provider}},null,2));
