import{normalizeLifecycleStage,normalizeSpaceIntelligence,normalizeStageHistory}from'./gardenIntelligence.js';
import{inferCropId,normalizeHardeningPlan,normalizePlantSeedToHarvest}from'./seedToHarvest.js';
import{buildGardenBackup,downloadGardenBackup,migrateGardenDataset,restoreGardenBackupToIsolated,validateGardenBackup,validateGardenData}from'./dataReadiness.js';

const nowIso=()=>new Date().toISOString();
const stampRecord=(record,actor='System')=>{const createdAt=record.createdAt||record.addedAt||record.at||record.plantedAt||nowIso();return{...record,createdAt,updatedAt:record.updatedAt||createdAt,createdBy:record.createdBy||record.actor||actor,updatedBy:record.updatedBy||record.actor||actor,deletedAt:record.deletedAt||null,revision:Number(record.revision)||1}};

export function prepareGardenForSync(garden){
 const actor=garden.profile?.gardenerName||'System',collections=['spaces','plants','activity','seeds','seedPackets','seedUsage','seedTransactions','harvests','problems','succession','trays','growLights','hardeningPlans','hydroPods','greenhouseReadings','reminders','taskHistory','plantingDecisions','shoppingItems','weatherRecommendationHistory','vacationPlans','calculatorResults','environmentalRecords','environmentalCorrections','wateringEvents','soilCheckEvents','photos','attachments','qrLabels','offlineOperations'];
 const prepared={...garden,updatedAt:garden.updatedAt||nowIso()};
 collections.forEach(key=>{prepared[key]=(garden[key]||[]).map(record=>stampRecord(record,actor))});
 prepared.spaces=prepared.spaces.map(space=>normalizeSpaceIntelligence(space));
 prepared.seedPackets=prepared.seedPackets.map(packet=>({...packet,cropId:packet.cropId||inferCropId(packet),quantity:Math.max(0,Number(packet.quantity)||0),reservedQuantity:Math.max(0,Number(packet.reservedQuantity)||0),countType:packet.countType||'estimated',inventoryBasis:packet.inventoryBasis||(packet.countType==='weight-only'?'weight':packet.countType==='exact'?'exact-count':packet.countType==='estimated'?'approximate-count':'unknown'),fieldEvidence:packet.fieldEvidence||{},imageHashes:packet.imageHashes||{},unreadableFields:packet.unreadableFields||[],contradictoryFields:packet.contradictoryFields||[]}));
 prepared.seeds=prepared.seeds.map(packet=>({...packet,cropId:packet.cropId||inferCropId(packet),quantity:Math.max(0,Number(packet.quantity??packet.seedsRemaining)||0),reservedQuantity:Math.max(0,Number(packet.reservedQuantity)||0),countType:packet.countType||'estimated'}));
 prepared.plants=prepared.plants.map(plant=>normalizePlantSeedToHarvest({...plant,stage:normalizeLifecycleStage(plant.stage),stageHistory:normalizeStageHistory(plant,actor),spaceId:plant.spaceId||''},prepared));
 prepared.hardeningPlans=prepared.hardeningPlans.map(plan=>normalizeHardeningPlan(plan,prepared.plants.find(plant=>plant.id===plan.plantId)));
 return migrateGardenDataset(prepared,{actor});
}
export function touchRecord(record,actor){return{...record,updatedAt:nowIso(),updatedBy:actor,revision:(Number(record.revision)||1)+1}}
export function softDelete(record,actor){return touchRecord({...record,status:'deleted',deletedAt:nowIso()},actor)}
export function exportGardenBackup(garden){return downloadGardenBackup(prepareGardenForSync(garden))}
export{buildGardenBackup,restoreGardenBackupToIsolated,validateGardenBackup,validateGardenData};
