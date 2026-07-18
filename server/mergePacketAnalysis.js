const has=value=>value!==null&&value!==undefined&&value!==''&&!(Array.isArray(value)&&!value.length);
const normal=value=>String(Array.isArray(value)?value.join(' '):value??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const equivalent=(a,b)=>{const left=normal(a),right=normal(b);return Boolean(left&&right&&(left===right||left.includes(right)||right.includes(left)))};
const prettyNumber=value=>Number(value)===.25?'1/4':Number(value)===.5?'1/2':Number(value)===.75?'3/4':String(value);
const unit=(value,u)=>value===null||value===undefined||!u?'':`${prettyNumber(value)} ${u}${u==='inch'&&Number(value)!==1&&Number(value)>=1?'es':''}`;
const range=(min,max,label='days')=>min===null||min===undefined?'':max!==null&&max!==undefined&&max!==min?`${min}–${max} ${label}`:`${min} ${label}`;
const manual=meta=>meta?.source==='manual'||meta?.source==='corrected'||meta?.manuallyCorrected;
const highPrinted=ev=>ev?.printed&&ev?.confidence==='high'&&['front','back','both'].includes(ev?.sourceImage);
const metaFor=(path,ev,analysis,source='vision')=>({source,sourceLabel:source==='vision'?'Read from packet':'Found on official product page',confidence:ev?.confidence==='high'?'High':ev?.confidence==='medium'?'Medium':'Low',sourcePhoto:ev?.sourceImage||'',originalText:ev?.visibleEvidence||'',printed:Boolean(ev?.printed),normalized:Boolean(ev?.normalized),visionRequestId:analysis.visionRequestId||'',visionAnalysisVersion:analysis.analysisVersion,extractedAt:analysis.visionAnalyzedAt||new Date().toISOString(),manuallyCorrected:false,correctedAt:null,path});

const VISION_MAP={
 'packetIdentity.brand':['brand',v=>v],'packetIdentity.crop':['name',v=>v],'packetIdentity.variety':['variety',v=>v],'packetIdentity.productName':['productName',v=>v],'packetIdentity.category':['category',v=>v],'packetIdentity.designations':['designations',v=>v],'packetIdentity.notableClaims':['notableClaims',v=>v.join(' · ')],'packetIdentity.colorDescription':['colorDescription',v=>v],
 'inventory.packetYear':['packetYear',v=>v],'inventory.packedForYear':['packedForYear',v=>v],'inventory.sellByDate':['sellByDate',v=>v],'inventory.purchasePrice':['purchasePrice',v=>v],'inventory.printedSeedCount':['printedSeedCount',v=>v],'inventory.estimatedSeedCount':['estimatedSeedCount',v=>v],
 'machineIdentifiers.barcode':['barcode',v=>v],'machineIdentifiers.sku':['sku',v=>v],'machineIdentifiers.catalogNumber':['catalogNumber',v=>v],'machineIdentifiers.lotNumber':['lotNumber',v=>v],'machineIdentifiers.productCode':['productCode',v=>v],
 'growing.sunlight':['sunlight',v=>v],'growing.daysToHarvest':['daysToMaturity',v=>v],'growing.daysToMaturity':['daysToMaturity',v=>v],'growing.maturityBasis':['maturityBasis',v=>v==='unknown'?'':v],
 'growing.plantingDepthValue':['depth',(v,a)=>unit(v,a.growing.plantingDepthUnit)],'growing.thinningSpacingValue':['thinningSpacing',(v,a)=>unit(v,a.growing.thinningSpacingUnit)],'growing.finalSpacingValue':['spacing',(v,a)=>unit(v,a.growing.finalSpacingUnit)],'growing.rowSpacingValue':['rowSpacing',(v,a)=>unit(v,a.growing.rowSpacingUnit)],
 'growing.emergenceMinimumDays':['germinationEstimate',(v,a)=>range(v,a.growing.emergenceMaximumDays)],'growing.germinationTemperatureMinimum':['germinationTemperature',(v,a)=>range(v,a.growing.germinationTemperatureMaximum,'°')],
 'growing.plantHeight':['plantHeight',v=>v],'growing.plantSpread':['plantSpread',v=>v],'growing.growthHabit':['growthHabit',v=>v],'growing.containerFriendly':['containerSuitability',(v,a)=>v?containerText(a):'Not marked container friendly'],
 'instructions.sowingMethod':['sowingMethod',v=>v],'instructions.directSowGuidance':['directSowGuidance',v=>v],'instructions.indoorStartGuidance':['seedStartingGuidance',v=>v],'instructions.transplantGuidance':['transplantGuidance',v=>v],'instructions.seasonalWindow':['seasonalWindow',v=>v],'instructions.frostTiming':['frostTiming',v=>v],'instructions.moistureGuidance':['waterGuidance',v=>v],'instructions.soilGuidance':['soilGuidance',v=>v],'instructions.fertilizingGuidance':['fertilizingGuidance',v=>v],'instructions.successionGuidance':['successionGuidance',v=>v],'instructions.harvestGuidance':['harvestGuidance',v=>v],'instructions.regionalGuidance':['regionalGuidance',v=>v],'instructions.treatmentInformation':['treatmentInformation',v=>v],'instructions.seedSavingRestrictions':['seedSavingRestrictions',v=>v],'instructions.specialCare':['specialCare',v=>v]
};
function containerText(a){const count=a.growing.plantsPerContainer,diam=a.growing.containerMinimumDiameterValue,u=a.growing.containerMinimumDiameterUnit,container=diam&&u?`per ${prettyNumber(diam)}-${u} container`:'';return[count&&`${count} plant${count===1?'':'s'}`,container].filter(Boolean).join(' ')||'Container friendly'}
function getPath(object,path){return path.split('.').reduce((value,key)=>value?.[key],object)}
function officialMap(product){if(!product)return{};const f=product.fields||{};return{brand:product.brand,name:product.crop,variety:product.variety,productName:product.productName,category:f.category,designations:f.designations,sunlight:f.sunlight,daysToMaturity:f.daysToHarvest,depth:f.plantingDepthValue!==undefined?unit(f.plantingDepthValue,f.plantingDepthUnit):undefined,thinningSpacing:f.thinningSpacingValue!==undefined?unit(f.thinningSpacingValue,f.thinningSpacingUnit):undefined,germinationEstimate:f.emergenceMinimumDays!==undefined?range(f.emergenceMinimumDays,f.emergenceMaximumDays):undefined,containerSuitability:f.containerFriendly?'Container friendly':undefined,directSowGuidance:f.directSowGuidance,waterGuidance:f.moistureGuidance,soilGuidance:f.soilGuidance,successionGuidance:f.successionGuidance,harvestGuidance:f.harvestGuidance}}

export function mergePacketAnalysis({currentDraft={},analysis,barcodeResult={},productResearch={}}){
 const final={...currentDraft,fieldMeta:{...(currentDraft.fieldMeta||{})}};
 const conflicts=[];
 const applied=[];
 const official=officialMap(productResearch.primary);
 const conflictEligible=new Set(['brand','name','variety','productName','daysToMaturity','depth','thinningSpacing','germinationEstimate','sunlight']);
 const analysisAt=new Date().toISOString();
 const analysisMeta={...analysis,visionAnalyzedAt:analysisAt};

 for(const[path,[field,format]]of Object.entries(VISION_MAP)){
  const raw=getPath(analysis,path);
  if(!has(raw))continue;
  const value=format(raw,analysis),ev=analysis.fieldEvidence?.[path];
  if(!has(value)||!ev||manual(final.fieldMeta[field]))continue;
  final[field]=value;
  final.fieldMeta[field]=metaFor(path,ev,analysisMeta);
  applied.push(field);
 }

 if(analysis.inventory.packetWeightValue!==null&&analysis.inventory.packetWeightUnit&&analysis.fieldEvidence['inventory.packetWeightValue']&&!manual(final.fieldMeta.packetWeight)){
  final.packetWeight=`${analysis.inventory.packetWeightValue} ${analysis.inventory.packetWeightUnit}`;
  final.fieldMeta.packetWeight=metaFor('inventory.packetWeightValue',analysis.fieldEvidence['inventory.packetWeightValue'],analysisMeta);
 }
 final.inventoryBasis=analysis.inventory.inventoryBasis;
 final.printedSeedCount=analysis.inventory.printedSeedCount;
 final.estimatedSeedCount=analysis.inventory.estimatedSeedCount;
 final.estimatedSeedCountSource=analysis.inventory.estimatedSeedCountSource;
 final.estimatedSeedCountConfidence=analysis.inventory.estimatedSeedCountConfidence;
 if(!manual(final.fieldMeta.quantity)){
  if(analysis.inventory.printedSeedCount!==null){
   final.quantity=analysis.inventory.printedSeedCount;
   final.originalQuantity=analysis.inventory.printedSeedCount;
   final.countType=analysis.inventory.inventoryBasis==='approximate-count'?'estimated':'exact';
  }else if(analysis.inventory.estimatedSeedCount!==null&&analysis.inventory.estimatedSeedCountSource){
   final.quantity=analysis.inventory.estimatedSeedCount;
   final.originalQuantity=analysis.inventory.estimatedSeedCount;
   final.countType='estimated';
  }else{
   final.quantity=Number(final.quantity)||0;
   final.originalQuantity=final.originalQuantity??final.quantity;
   final.countType=analysis.inventory.inventoryBasis==='weight'?'weight-only':final.countType||'unknown';
  }
 }
 final.reservedQuantity=0;

 if(barcodeResult.value&&barcodeResult.checkDigitValid!==false&&!manual(final.fieldMeta.barcode)){
  final.barcode=barcodeResult.value;
  final.barcodeFormat=barcodeResult.format;
  final.barcodeStatus='verified';
  final.barcodeMethod=barcodeResult.method;
  final.fieldMeta.barcode={source:'barcode',sourceLabel:'Verified barcode',confidence:'High',printed:true,originalText:barcodeResult.value,extractedAt:analysisAt,manuallyCorrected:false};
 }else{
  final.barcodeStatus=analysis.machineIdentifiers.barcode?'unverified':'not-found';
  final.barcodeMethod=barcodeResult.method||'vision-only';
 }

 for(const[field,value]of Object.entries(official)){
  if(!has(value)||manual(final.fieldMeta[field]))continue;
  const packetPath=Object.entries(VISION_MAP).find(([,mapped])=>mapped[0]===field)?.[0];
  const ev=packetPath&&analysis.fieldEvidence?.[packetPath];
  const current=final[field];
  if(has(current)&&highPrinted(ev)&&conflictEligible.has(field)&&!equivalent(current,value)){
   conflicts.push({field,packetValue:current,officialValue:value,packetEvidence:ev.visibleEvidence,officialSource:productResearch.primary.sourceTitle,sourceUrl:productResearch.primary.sourceUrl,status:'needs-review'});
   continue;
  }
  if(!has(current)||!highPrinted(ev)){
   final[field]=value;
   final.fieldMeta[field]={source:'online',sourceLabel:'Found on official product page',confidence:'High',sourceUrl:productResearch.primary.sourceUrl,sourceName:productResearch.primary.sourceTitle,exactProductId:productResearch.primary.productId||'',extractedAt:analysisAt,manuallyCorrected:false};
  }
 }

 Object.assign(final,{
  visionAnalysisVersion:analysis.analysisVersion,visionModel:analysis.visionModel||'',visionAnalyzedAt:analysisAt,visionRequestId:analysis.visionRequestId||'',imageHashes:analysis.imageHashes||{},analysisPassCount:analysis.analysisPassCount||1,packetIdentityConfidence:analysis.quality.packetIdentityConfidence,overallAnalysisConfidence:analysis.quality.overallConfidence,fieldEvidence:analysis.fieldEvidence,unreadableFields:analysis.quality.unreadableFields,contradictoryFields:analysis.quality.contradictoryFields,exactIdentitySupportedByImages:analysis.quality.exactIdentitySupportedByImages,packedForYear:analysis.inventory.packedForYear,sellByDate:analysis.inventory.sellByDate,successionRecommended:analysis.automation.successionRecommended,successionIntervalDays:analysis.automation.successionIntervalDays,successionReminderText:analysis.automation.successionReminderText,successionReason:analysis.automation.successionReason,analysisSourceSummary:productResearch.primary?'Packet photos analyzed together and verified against an exact official product source.':'Packet photos analyzed together; exact official product was not verified.'
 });
 final.packetIntelligence={...(currentDraft.packetIntelligence||{}),vision:{analysisVersion:analysis.analysisVersion,requestId:final.visionRequestId,model:final.visionModel,analyzedAt:analysisAt,imageHashes:final.imageHashes,passCount:final.analysisPassCount,quality:analysis.quality,rawVisibleText:analysis.rawVisibleText,warnings:analysis.warnings,usage:analysis.usage||null},barcode:barcodeResult,productResearch:{primary:productResearch.primary||null,candidates:productResearch.candidates||[],cacheHit:Boolean(productResearch.cacheHit)},conflicts,sourceSummary:{identity:final.analysisSourceSummary,growing:'Growing details use validated printed evidence first and exact official data only to fill or verify gaps.'}};
 const optional=['packetYear','lotNumber'].filter(field=>!has(final[field]));
 const required=['name','variety','brand'].filter(field=>!has(final[field]));
 const manualReview=[...new Set([...analysis.quality.manualReviewFields,...required,...conflicts.map(c=>c.field)])];
 final.draftStatus=required.length?'Needs review':'Ready to save';
 return{draft:final,summary:{ready:required.length===0,optionalMissing:optional,manualReviewFields:manualReview,conflicts,appliedFields:[...new Set(applied)],sourceSummary:final.packetIntelligence.sourceSummary}};
}
