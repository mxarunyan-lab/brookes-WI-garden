import { normalizeLifecycleStage, normalizeSpaceIntelligence, normalizeStageHistory } from './gardenIntelligence.js';

const nowIso=()=>new Date().toISOString();
const stampRecord=(record,actor='System')=>{const createdAt=record.createdAt||record.addedAt||record.at||record.plantedAt||nowIso();return{...record,createdAt,updatedAt:record.updatedAt||createdAt,createdBy:record.createdBy||record.actor||actor,updatedBy:record.updatedBy||record.actor||actor,deletedAt:record.deletedAt||null,revision:Number(record.revision)||1}};

export function prepareGardenForSync(garden){
 const actor=garden.profile?.gardenerName||'System';
 const collections=['spaces','plants','activity','seeds','seedPackets','harvests','problems','succession','trays','growLights','hardeningPlans','hydroPods','greenhouseReadings'];
 const prepared={...garden,schemaVersion:6,updatedAt:garden.updatedAt||nowIso()};
 collections.forEach(key=>{prepared[key]=(garden[key]||[]).map(record=>stampRecord(record,actor))});
 prepared.spaces=prepared.spaces.map(space=>normalizeSpaceIntelligence(space));
 prepared.plants=prepared.plants.map(plant=>({...plant,stage:normalizeLifecycleStage(plant.stage),stageHistory:normalizeStageHistory(plant,actor),spaceId:plant.spaceId||''}));
 return prepared;
}
export function touchRecord(record,actor){return{...record,updatedAt:nowIso(),updatedBy:actor,revision:(Number(record.revision)||1)+1}}
export function softDelete(record,actor){return touchRecord({...record,deletedAt:nowIso()},actor)}
export function exportGardenBackup(garden){const payload=JSON.stringify({exportedAt:nowIso(),app:'The Runyan Garden',garden:prepareGardenForSync(garden)},null,2);const blob=new Blob([payload],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`runyan-garden-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url)}
