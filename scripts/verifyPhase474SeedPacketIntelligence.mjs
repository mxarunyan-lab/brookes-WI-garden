import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{extractionReview,emptyPacketDraft}from'../src/seedPacketIntelligence.js';
import{lookupSeedProducts,scoreSeedProduct,OFFICIAL_SEED_PRODUCTS}from'../src/seedProductLookup.js';
import{createApp}from'../server/index.js';

// Release-blocking regression for the committed all-brand smart packet workflow.
const medium=(sourcePhoto='back')=>({source:'packet-vision',sourceLabel:'Read from packet photos',confidence:'Medium',sourcePhoto,evidence:{printed:true,confidence:'medium'}});
const draft=emptyPacketDraft({
 brand:'Sow Right Seeds',name:'Onion',variety:'Ailsa Craig',category:'vegetable',designations:['Heirloom','Non-GMO'],seasonalWindow:'Long-day onion; start indoors 10–12 weeks before the last frost and transplant early.',fertilizingGuidance:'Nitrogen encourages larger bulb growth.',depth:'1/2 inch',spacing:'6–8 inches',germinationEstimate:'7–15 days',sunlight:'Full sun',
 fieldMeta:{brand:medium('front'),name:medium('front'),variety:medium('front'),category:medium('front'),designations:medium('front'),seasonalWindow:medium(),fertilizingGuidance:medium(),depth:medium(),spacing:medium(),germinationEstimate:medium(),sunlight:medium()}
});
const review=extractionReview(draft);
assert.equal(review.check.length,0,`Visible medium-confidence packet text should not be forced into manual review. Still flagged: ${review.check.map(row=>`${row.key}=${Array.isArray(row.value)?row.value.join(', '):row.value} (${row.reason||row.confidence})`).join(' | ')}`);
assert.equal(review.missing.length,0,'Manufacturer-unstated seed count and days to maturity must not block readiness.');
assert.ok(review.ready.some(row=>row.key==='seasonalWindow'),'Seasonal guidance should be accepted as ready.');
assert.ok(review.ready.some(row=>row.key==='fertilizingGuidance'),'Fertilizing guidance should be accepted as ready.');

const identity={brand:'Sow Right Seeds',crop:'Onion',variety:'Ailsa Craig',productName:'Ailsa Craig Onion',barcode:'5060873516058',rawText:'SOW RIGHT SEEDS ONION Ailsa Craig'};
const official=OFFICIAL_SEED_PRODUCTS.find(row=>row.id==='sow-right-ailsa-craig-onion');
assert.ok(official,'A verified Ailsa Craig official fallback must exist.');
const score=scoreSeedProduct(identity,official);
assert.equal(score.exact,true,'Ailsa Craig must score as an exact product.');
const lookup=await lookupSeedProducts(identity,{serverResearch:false,ignoreCache:true,verifyOnline:false});
assert.equal(lookup.exactCandidate?.id,'sow-right-ailsa-craig-onion','Local fallback should resolve Ailsa Craig exactly.');
assert.equal(lookup.exactCandidate?.productFields?.quantity,130,'Official packet quantity should be available.');
assert.equal(lookup.exactCandidate?.guideFields?.fertilizingGuidance,'Nitrogen encourages larger bulb growth.');

const app=createApp({research:async input=>({exact:true,candidate:{...official,match:scoreSeedProduct(input,official)},provider:'test-official-provider',checkedAt:new Date().toISOString(),sources:[]})});
const server=await new Promise(resolve=>{const listener=app.listen(0,()=>resolve(listener))});
try{
 const address=server.address();
 const response=await fetch(`http://127.0.0.1:${address.port}/api/seed-products/lookup`,{method:'POST',headers:{'Content-Type':'application/json','X-Device-Id':'phase474-seed-test'},body:JSON.stringify({identity})});
 assert.equal(response.status,200,'Server-backed product lookup should be available.');
 const body=await response.json();
 assert.equal(body.exact,true);
 assert.equal(body.candidate.variety,'Ailsa Craig');
}finally{await new Promise(resolve=>server.close(resolve))}

const visionSource=await readFile('server/seedPacketVision.js','utf8');
assert.match(visionSource,/DEFAULT_REPAIR_PASSES = !\/\^\(0\|false\|no\|off\)\$\/i/,'Second-pass packet analysis must default on.');
assert.match(visionSource,/missing\.length \? missing\.slice\(0, 18\)/,'Missing supported fields should trigger the targeted second pass.');
assert.match(visionSource,/rawVisibleText: analysis\.rawVisibleText/,'Official research should receive visible packet context.');

const toolsSource=await readFile('src/SeedTools.jsx','utf8');
assert.match(toolsSource,/LONG_PACKET_FIELDS/,'Long packet fields must be recognized.');
assert.match(toolsSource,/<textarea id=\{id\}/,'Long review values must use multiline controls.');
assert.match(toolsSource,/applySeedProductCandidate\(current,exact\)/,'Exact server matches must apply automatically.');
assert.doesNotMatch(toolsSource,/attention\.slice\(0,6\)/,'All genuine review fields must remain reachable.');

const css=await readFile('src/styles/phase-4-7-4-certification.css','utf8');
assert.match(css,/Seed Packet Intelligence keeps complete instructions readable/);
assert.match(css,/min-height:92px/);

console.log(JSON.stringify({ok:true,readyFields:review.ready.length,exactProduct:lookup.exactCandidate.productName,serverLookup:true},null,2));
