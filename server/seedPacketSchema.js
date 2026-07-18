import {z} from 'zod';

const nullableString=z.string().trim().max(1200).nullable();
const nullableShort=z.string().trim().max(240).nullable();
const nullableNumber=z.number().finite().nullable();
const confidence=z.enum(['high','medium','low']);
const sourceImage=z.enum(['front','back','both','barcode','official-source','inferred']);
const evidence=z.object({
 value:z.union([z.string(),z.number(),z.boolean(),z.array(z.string()),z.null()]),
 sourceImage,
 visibleEvidence:z.string().trim().max(600),
 confidence,
 printed:z.boolean(),
 normalized:z.boolean()
}).strict();

export const SeedPacketVisionSchema=z.object({
 analysisVersion:z.literal('seed-packet-vision-v1'),
 packetIdentity:z.object({
  brand:nullableShort,crop:nullableShort,variety:nullableShort,productName:nullableShort,category:nullableShort,
  designations:z.array(z.string().trim().max(80)).max(20),notableClaims:z.array(z.string().trim().max(180)).max(20),colorDescription:nullableShort
 }).strict(),
 inventory:z.object({
  packetWeightValue:nullableNumber,packetWeightUnit:z.enum(['g','mg','oz','lb']).nullable(),printedSeedCount:nullableNumber,
  inventoryBasis:z.enum(['exact-count','approximate-count','weight','unknown']),estimatedSeedCount:nullableNumber,
  estimatedSeedCountSource:nullableShort,estimatedSeedCountConfidence:confidence.nullable(),packetYear:z.number().int().nullable(),
  packedForYear:z.number().int().nullable(),sellByDate:nullableShort,purchasePrice:nullableNumber
 }).strict(),
 machineIdentifiers:z.object({barcode:nullableShort,barcodeFormat:z.enum(['UPC-A','UPC-E','EAN-8','EAN-13','CODE-128','unknown']).nullable(),sku:nullableShort,catalogNumber:nullableShort,lotNumber:nullableShort,productCode:nullableShort}).strict(),
 growing:z.object({
  sunlight:nullableShort,daysToHarvest:nullableNumber,daysToMaturity:nullableNumber,maturityBasis:z.enum(['sowing','transplant','unknown']).nullable(),
  emergenceMinimumDays:nullableNumber,emergenceMaximumDays:nullableNumber,germinationTemperatureMinimum:nullableNumber,germinationTemperatureMaximum:nullableNumber,
  plantingDepthValue:nullableNumber,plantingDepthUnit:z.enum(['inch','cm','mm']).nullable(),thinningSpacingValue:nullableNumber,thinningSpacingUnit:z.enum(['inch','cm','mm']).nullable(),
  finalSpacingValue:nullableNumber,finalSpacingUnit:z.enum(['inch','cm','mm']).nullable(),rowSpacingValue:nullableNumber,rowSpacingUnit:z.enum(['inch','cm','mm']).nullable(),
  containerMinimumDiameterValue:nullableNumber,containerMinimumDiameterUnit:z.enum(['inch','cm']).nullable(),plantsPerContainer:nullableNumber,
  plantHeight:nullableShort,plantSpread:nullableShort,growthHabit:nullableShort,containerFriendly:z.boolean().nullable()
 }).strict(),
 instructions:z.object({
  sowingMethod:nullableShort,directSowGuidance:nullableString,indoorStartGuidance:nullableString,transplantGuidance:nullableString,
  seasonalWindow:nullableString,frostTiming:nullableString,moistureGuidance:nullableString,soilGuidance:nullableString,fertilizingGuidance:nullableString,
  successionGuidance:nullableString,harvestGuidance:nullableString,regionalGuidance:nullableString,warnings:z.array(z.string().trim().max(500)).max(20),
  treatmentInformation:nullableString,seedSavingRestrictions:nullableString,specialCare:nullableString
 }).strict(),
 automation:z.object({successionRecommended:z.boolean(),successionIntervalDays:nullableNumber,successionReminderText:nullableString,successionReason:nullableString,otherSuggestedReminders:z.array(z.string().trim().max(300)).max(20)}).strict(),
 quality:z.object({frontUsable:z.boolean(),backUsable:z.boolean(),packetIdentityConfidence:confidence,overallConfidence:confidence,exactIdentitySupportedByImages:z.boolean(),manualReviewFields:z.array(z.string().trim().max(100)).max(60),unreadableFields:z.array(z.string().trim().max(100)).max(60),contradictoryFields:z.array(z.string().trim().max(100)).max(60),analysisNotes:nullableString}).strict(),
 fieldEvidence:z.record(z.string(),evidence),
 rawVisibleText:z.object({front:z.string().max(12000),back:z.string().max(12000)}).strict(),
 warnings:z.array(z.string().trim().max(500)).max(30)
}).strict();

const forbiddenIdentity=/\b(full\s*sun|vegetable|heirloom|organic|container|days?\s+to|depth|spacing|harvest|outdoor\s+sown)\b/i;
const malformedGuidance=/^(?:\d{2,}|[$©®�]|[a-z]{0,2}\s+)?(?:outdoor\s+sown|to\s+harvest)\b|\b(?:full\s*f|go\s+fe|seedlings?\s+\d+\s+container)\b/i;
const validYear=value=>value===null||(value>=2000&&value<=new Date().getFullYear()+3);
const evidenceFor=(analysis,path)=>analysis.fieldEvidence?.[path];

export function validateVisionAnalysis(input){
 const parsed=SeedPacketVisionSchema.safeParse(input);
 if(!parsed.success)return{ok:false,errors:parsed.error.issues.map(issue=>`${issue.path.join('.')}: ${issue.message}`)};
 const value=parsed.data,errors=[];
 const {packetIdentity,inventory,growing,instructions,machineIdentifiers,quality}=value;
 if(packetIdentity.variety&&forbiddenIdentity.test(packetIdentity.variety))errors.push('packetIdentity.variety contains a label or instruction that is not part of the variety.');
 if(packetIdentity.productName&&/\b(full\s*sun|vegetable|heirloom)\b/i.test(packetIdentity.productName))errors.push('packetIdentity.productName contains unrelated labels.');
 for(const key of ['directSowGuidance','moistureGuidance','soilGuidance','successionGuidance','harvestGuidance']){
  const text=instructions[key];if(text&&(text.length<10||malformedGuidance.test(text)||/\$\s*\d|©|�/.test(text)))errors.push(`instructions.${key} is malformed or incomplete.`);
 }
 if(!validYear(inventory.packetYear))errors.push('inventory.packetYear is outside the supported range.');
 if(!validYear(inventory.packedForYear))errors.push('inventory.packedForYear is outside the supported range.');
 if(inventory.inventoryBasis==='weight'&&inventory.printedSeedCount!==null)errors.push('Weight-only inventory cannot claim a printed seed count.');
 if(inventory.estimatedSeedCount!==null&&!inventory.estimatedSeedCountSource)errors.push('Estimated seed count requires a source.');
 if(machineIdentifiers.barcode&&machineIdentifiers.barcode.length<8)errors.push('machineIdentifiers.barcode is incomplete.');
 if(quality.exactIdentitySupportedByImages&&(!packetIdentity.brand||!packetIdentity.crop||!packetIdentity.variety))errors.push('Exact image-supported identity requires brand, crop, and variety.');
 const populated=[];
 const collect=(prefix,obj)=>Object.entries(obj).forEach(([key,val])=>{if(val!==null&&val!==''&&!(Array.isArray(val)&&val.length===0))populated.push(`${prefix}.${key}`)});
 collect('packetIdentity',packetIdentity);collect('inventory',inventory);collect('machineIdentifiers',machineIdentifiers);collect('growing',growing);collect('instructions',instructions);collect('automation',value.automation);
 for(const path of populated){if(['inventory.inventoryBasis','automation.successionRecommended','quality.frontUsable','quality.backUsable'].includes(path))continue;const ev=evidenceFor(value,path);if(!ev||!ev.visibleEvidence)errors.push(`${path} is populated without field evidence.`)}
 return errors.length?{ok:false,errors}:{ok:true,value};
}

export function emptyVisionAnalysis(){return SeedPacketVisionSchema.parse({
 analysisVersion:'seed-packet-vision-v1',packetIdentity:{brand:null,crop:null,variety:null,productName:null,category:null,designations:[],notableClaims:[],colorDescription:null},
 inventory:{packetWeightValue:null,packetWeightUnit:null,printedSeedCount:null,inventoryBasis:'unknown',estimatedSeedCount:null,estimatedSeedCountSource:null,estimatedSeedCountConfidence:null,packetYear:null,packedForYear:null,sellByDate:null,purchasePrice:null},
 machineIdentifiers:{barcode:null,barcodeFormat:null,sku:null,catalogNumber:null,lotNumber:null,productCode:null},
 growing:{sunlight:null,daysToHarvest:null,daysToMaturity:null,maturityBasis:null,emergenceMinimumDays:null,emergenceMaximumDays:null,germinationTemperatureMinimum:null,germinationTemperatureMaximum:null,plantingDepthValue:null,plantingDepthUnit:null,thinningSpacingValue:null,thinningSpacingUnit:null,finalSpacingValue:null,finalSpacingUnit:null,rowSpacingValue:null,rowSpacingUnit:null,containerMinimumDiameterValue:null,containerMinimumDiameterUnit:null,plantsPerContainer:null,plantHeight:null,plantSpread:null,growthHabit:null,containerFriendly:null},
 instructions:{sowingMethod:null,directSowGuidance:null,indoorStartGuidance:null,transplantGuidance:null,seasonalWindow:null,frostTiming:null,moistureGuidance:null,soilGuidance:null,fertilizingGuidance:null,successionGuidance:null,harvestGuidance:null,regionalGuidance:null,warnings:[],treatmentInformation:null,seedSavingRestrictions:null,specialCare:null},
 automation:{successionRecommended:false,successionIntervalDays:null,successionReminderText:null,successionReason:null,otherSuggestedReminders:[]},
 quality:{frontUsable:false,backUsable:false,packetIdentityConfidence:'low',overallConfidence:'low',exactIdentitySupportedByImages:false,manualReviewFields:[],unreadableFields:[],contradictoryFields:[],analysisNotes:null},fieldEvidence:{},rawVisibleText:{front:'',back:''},warnings:[]
})}
