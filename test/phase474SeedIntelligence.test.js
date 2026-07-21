import test from'node:test';
import assert from'node:assert/strict';
import{mergeVisionPacketResult}from'../src/seedVisionMerge.js';

const blankAnalysis=()=>({
 analysisVersion:'phase-4-7-4-certification',
 packetIdentity:{brand:'Burpee',crop:'Lettuce',variety:'Iceberg A',productName:'Burpee Iceberg A Lettuce',category:'Vegetable',designations:['Heirloom'],notableClaims:[],colorDescription:''},
 inventory:{packetYear:'2026',packedForYear:'2026',sellByDate:'',packetWeightValue:null,packetWeightUnit:'',printedSeedCount:100,estimatedSeedCount:null,inventoryBasis:'exact-count'},
 machineIdentifiers:{barcode:'041530000001',lotNumber:'LOT-QA',checkDigitValid:true,barcodeMethod:'visible-text'},
 growing:{sunlight:'Full sun',maturityBasis:'sowing',emergenceMinimumDays:7,emergenceMaximumDays:14,plantingDepthValue:.25,plantingDepthUnit:'inch',thinningSpacingValue:12,thinningSpacingUnit:'inch',finalSpacingValue:12,finalSpacingUnit:'inch',rowSpacingValue:18,rowSpacingUnit:'inch',containerFriendly:true,containerMinimumDiameterValue:12,containerMinimumDiameterUnit:'inch',plantsPerContainer:1,daysToHarvest:70,daysToMaturity:70},
 instructions:{sowingMethod:'Direct sow',directSowGuidance:'Sow after soil can be worked.',indoorStartGuidance:'Optional indoor start.',transplantGuidance:'Harden before transplanting.',seasonalWindow:'Spring and fall',frostTiming:'Tolerates light frost',moistureGuidance:'Keep evenly moist',soilGuidance:'Loose fertile soil',fertilizingGuidance:'Light feeding',successionGuidance:'Sow every 14 days',harvestGuidance:'Harvest firm heads',regionalGuidance:'Suitable for Zone 5b',treatmentInformation:'',seedSavingRestrictions:'',specialCare:''},
 quality:{overallConfidence:'high',packetIdentityConfidence:'high',unreadableFields:[],contradictoryFields:[],exactIdentitySupportedByImages:true},
 fieldEvidence:{brand:{confidence:'high',sourceImage:'front'},crop:{confidence:'high',sourceImage:'front'},variety:{confidence:'high',sourceImage:'front'},barcode:{confidence:'high',sourceImage:'back'},printedSeedCount:{confidence:'medium',sourceImage:'back'},emergenceMinimumDays:{confidence:'high',sourceImage:'back'},plantingDepthValue:{confidence:'high',sourceImage:'back'},daysToHarvest:{confidence:'high',sourceImage:'back'},successionGuidance:{confidence:'medium',sourceImage:'back'}},
 rawVisibleText:{front:'BURPEE LETTUCE ICEBERG A',back:'100 SEEDS 7-14 DAYS 1/4 INCH'},
 automation:{successionRecommended:true}
});
const result=()=>({analysis:blankAnalysis(),model:'certification-mock',analyzedAt:'2026-07-21T12:00:00.000Z',requestId:'cert-request',imageHashes:{front:'front-hash',back:'back-hash'},imageMetadata:{front:{width:1200,height:1600},back:{width:1200,height:1600}},analysisPassCount:1,analysisPasses:[{name:'combined'}],usage:[]});

test('clear front and back analysis prefills a mostly completed packet record',()=>{
 const merged=mergeVisionPacketResult({brand:'',name:'',variety:'',quantity:'',fieldMeta:{},packetIntelligence:{}},result());
 assert.equal(merged.draft.brand,'Burpee');
 assert.equal(merged.draft.name,'Lettuce');
 assert.equal(merged.draft.variety,'Iceberg A');
 assert.equal(merged.draft.productName,'Burpee Iceberg A Lettuce');
 assert.equal(merged.draft.barcode,'041530000001');
 assert.equal(merged.draft.quantity,100);
 assert.equal(merged.draft.germinationEstimate,'7–14 days');
 assert.equal(merged.draft.depth,'0.25 inches');
 assert.equal(merged.draft.daysToMaturity,70);
 assert.equal(merged.draft.draftStatus,'Ready to save');
 assert.equal(merged.draft.packetIntelligence.vision.exactIdentitySupportedByImages,true);
 assert.ok(merged.applied.length>=10);
});

test('manual user corrections remain authoritative over packet analysis',()=>{
 const draft={brand:'My corrected brand',name:'Lettuce',variety:'Corrected Variety',quantity:88,fieldMeta:{brand:{source:'manual',manuallyCorrected:true},variety:{source:'manual',manuallyCorrected:true},quantity:{source:'manual',manuallyCorrected:true}},packetIntelligence:{}};
 const merged=mergeVisionPacketResult(draft,result());
 assert.equal(merged.draft.brand,'My corrected brand');
 assert.equal(merged.draft.variety,'Corrected Variety');
 assert.equal(merged.draft.quantity,88);
 assert.ok(merged.preserved.includes('brand'));
 assert.ok(merged.preserved.includes('variety'));
 assert.equal(merged.draft.name,'Lettuce');
 assert.equal(merged.draft.barcode,'041530000001');
});

test('analysis never invents unreadable optional values',()=>{
 const analysis=blankAnalysis();analysis.instructions.specialCare='';analysis.quality.unreadableFields=['specialCare'];
 const merged=mergeVisionPacketResult({fieldMeta:{},packetIntelligence:{}},{...result(),analysis});
 assert.equal(merged.draft.specialCare,undefined);
 assert.deepEqual(merged.optionalMissing,['specialCare']);
});