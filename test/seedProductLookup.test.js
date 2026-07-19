import test from'node:test';
import assert from'node:assert/strict';
import{OFFICIAL_SEED_PRODUCTS,applySeedProductCandidate,lookupSeedProducts,resolveSeedConflict,scoreSeedProduct,seedLookupIdentity}from'../src/seedProductLookup.js';

const iceberg=OFFICIAL_SEED_PRODUCTS.find(row=>row.variety==='Iceberg A');

test('clear Burpee Iceberg A identity produces an exact official product match',async()=>{
 const result=await lookupSeedProducts({brand:'Burpee',crop:'Lettuce',variety:'Iceberg A',productName:'Iceberg A Lettuce Seeds'},{verifyOnline:false,ignoreCache:true});
 assert.equal(result.exactCandidate?.id,'burpee-prod000747');
 assert.ok(result.exactCandidate.match.score>=70);
});

test('packet OCR wording can identify exact product without a barcode',()=>{
 const score=scoreSeedProduct({brand:'Burpee',crop:'Lettuce',rawText:'BURPEE LETTUCE ICEBERG A HEIRLOOM FULL SUN'},iceberg);
 assert.equal(score.exact,true);
 assert.ok(score.reasons.includes('packet text'));
});

test('loose Burpee lettuce identity does not silently choose an exact variety',()=>{
 const ranked=OFFICIAL_SEED_PRODUCTS.map(row=>({row,match:scoreSeedProduct({brand:'Burpee',crop:'Lettuce'},row)}));
 assert.equal(ranked.some(({match})=>match.exact),false);
});

test('low-confidence generic lettuce lookup does not present weak varieties as likely matches',async()=>{
 const result=await lookupSeedProducts({brand:'Burpee',crop:'Lettuce'},{verifyOnline:false,ignoreCache:true});
 assert.equal(result.candidates.length,0);
 assert.equal(result.primaryCandidate,null);
 assert.equal(result.exactCandidate,null);
});

test('official exact match fills packet and growing fields with source labels',()=>{
 const next=applySeedProductCandidate({name:'Lettuce',variety:'Iceberg A',fieldMeta:{}},{...iceberg,match:{exact:true,score:120}});
 assert.equal(next.daysToMaturity,85);
 assert.equal(next.depth,'1/4 inch');
 assert.equal(next.germinationEstimate,'7–10 days');
 assert.equal(next.fieldMeta.depth.sourceDetail,'official-guide');
 assert.equal(next.fieldMeta.daysToMaturity.sourceDetail,'official-product');
 assert.equal(next.exactProductId,'prod000747');
});

test('clear packet value wins over conflicting online value until confirmation',()=>{
 const draft={name:'Lettuce',variety:'Iceberg A',depth:'1/8 inch',fieldMeta:{depth:{source:'packet',confidence:'High'}},packetIntelligence:{conflicts:[]}};
 const next=applySeedProductCandidate(draft,iceberg);
 assert.equal(next.depth,'1/8 inch');
 assert.equal(next.packetIntelligence.conflicts.length,0);
 assert.equal(next.packetIntelligence.onlineLookup.supplemental.depth.value,'1/4 inch');
});

test('manual correction always wins over online lookup',()=>{
 const draft={name:'Lettuce',variety:'Iceberg A',depth:'3/8 inch',fieldMeta:{depth:{source:'corrected',manuallyCorrected:true,confidence:'High'}},packetIntelligence:{conflicts:[]}};
 const next=applySeedProductCandidate(draft,iceberg);
 assert.equal(next.depth,'3/8 inch');
 assert.equal(next.packetIntelligence.conflicts.length,0);
});

test('user can explicitly accept online side of a conflict',()=>{
 const conflict={field:'depth',activeValue:'1/8 inch',activeSource:'Read from packet',onlineValue:'1/4 inch',onlineSource:'Found online · official growing guide',sourceUrl:iceberg.guideUrl,status:'needs-review'};
 const next=resolveSeedConflict({depth:'1/8 inch',fieldMeta:{depth:{source:'packet'}},packetIntelligence:{conflicts:[conflict]}},'depth','online');
 assert.equal(next.depth,'1/4 inch');
 assert.equal(next.packetIntelligence.conflicts[0].status,'resolved');
 assert.equal(next.packetIntelligence.conflicts[0].resolution,'online');
});

test('lookup identity preserves exact packet identifiers and OCR text',()=>{
 const identity=seedLookupIdentity({brand:'Burpee',name:'Lettuce',variety:'Iceberg A',barcode:'123',packetIntelligence:{front:{rawText:'front'},back:{rawText:'back'}}});
 assert.equal(identity.barcode,'123');
 assert.match(identity.rawText,/front\nback/);
});

test('packet-specific harvest timing stays active while current official maturity is retained separately',()=>{const draft={name:'Lettuce',variety:'Iceberg A',daysToMaturity:65,fieldMeta:{daysToMaturity:{source:'packet-vision',confidence:'High',evidence:{visibleEvidence:'65 days to harvest'}}},packetIntelligence:{conflicts:[]}};const next=applySeedProductCandidate(draft,iceberg);assert.equal(next.daysToMaturity,65);assert.equal(next.packetIntelligence.conflicts.length,0);assert.equal(next.packetIntelligence.onlineLookup.supplemental.daysToMaturity.value,85)});
