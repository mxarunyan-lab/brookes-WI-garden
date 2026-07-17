import{normalizeLifecycleStage,normalizeSpaceIntelligence,normalizeStageHistory}from'./gardenIntelligence.js';
import{normalizeHardeningPlan,normalizePlantSeedToHarvest}from'./seedToHarvest.js';

const nowIso=()=>new Date().toISOString();
const stampRecord=(record,actor='System')=>{const createdAt=record.createdAt||record.addedAt||record.at||record.plantedAt||nowIso();return{...record,createdAt,updatedAt:record.updatedAt||createdAt,createdBy:record.createdBy||record.actor||actor,updatedBy:record.updatedBy||record.actor||actor,deletedAt:record.deletedAt||null,revision:Number(record.revision)||1}};

export function prepareGardenForSync(garden){
 const actor=garden.profile?.gardenerName||'System',collections=['spaces','plants','activity','seeds','seedPackets','seedUsage','harvests','problems','succession','trays','growLights','hardeningPlans','hydroPods','greenhouseReadings','reminders','taskHistory','plantingDecisions'];
 const prepared={...garden,schemaVersion:9,updatedAt:garden.updatedAt||nowIso()};
 collections.forEach(key=>{prepared[key]=(garden[key]||[]).map(record=>stampRecord(record,actor))});
 prepared.spaces=prepared.spaces.map(space=>normalizeSpaceIntelligence(space));
 prepared.seedPackets=prepared.seedPackets.map(packet=>({...packet,quantity:Math.max(0,Number(packet.quantity)||0),reservedQuantity:Math.max(0,Number(packet.reservedQuantity)||0),countType:packet.countType||'estimated'}));
 prepared.seeds=prepared.seeds.map(packet=>({...packet,quantity:Math.max(0,Number(packet.quantity??packet.seedsRemaining)||0),reservedQuantity:Math.max(0,Number(packet.reservedQuantity)||0),countType:packet.countType||'estimated'}));
 prepared.plants=prepared.plants.map(plant=>normalizePlantSeedToHarvest({...plant,stage:normalizeLifecycleStage(plant.stage),stageHistory:normalizeStageHistory(plant,actor),spaceId:plant.spaceId||''},prepared));
 prepared.hardeningPlans=prepared.hardeningPlans.map(plan=>normalizeHardeningPlan(plan,prepared.plants.find(plant=>plant.id===plan.plantId)));
 return prepared;
}
export function touchRecord(record,actor){return{...record,updatedAt:nowIso(),updatedBy:actor,revision:(Number(record.revision)||1)+1}}
export function softDelete(record,actor){return touchRecord({...record,deletedAt:nowIso()},actor)}
export function exportGardenBackup(garden){const payload=JSON.stringify({exportedAt:nowIso(),app:'The Runyan Garden',garden:prepareGardenForSync(garden)},null,2),blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`runyan-garden-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url)}
