import test from'node:test';
import assert from'node:assert/strict';
import{
 applySeedTransaction,
 buildGardenBackup,
 COLLECTION_DEFINITIONS,
 enqueueOperation,
 integrityHash,
 migrateGardenDataset,
 reconcileSeedQuantity,
 rehearseMigration,
 restoreGardenBackupToIsolated,
 validateGardenBackup,
 validateGardenData
}from'../src/dataReadiness.js';
import{prepareGardenForSync}from'../src/syncModel.js';

const at='2026-07-21T12:00:00.000Z';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
const fixture=()=>({
 schemaVersion:10,
 profile:{gardenerName:'Archie',gardenName:'The Runyan Garden',location:'Green Bay, Wisconsin 54302'},
 spaces:[{id:'space-cert',name:'Certification Bed',type:'black-square-bed',capacity:12,createdAt:at,updatedAt:at,createdBy:'Archie',updatedBy:'Archie',revision:1}],
 plants:[{id:'plant-cert',name:'Certification Tomato',cropId:'tomato',spaceId:'space-cert',sourcePacketId:'packet-cert',stage:'Growing',createdAt:at,updatedAt:at,createdBy:'Archie',updatedBy:'Archie',revision:1}],
 seedPackets:[{id:'packet-cert',brand:'Burpee',name:'Tomato',variety:'Certification Variety',quantity:25,originalQuantity:25,reservedQuantity:0,frontPhoto:photo,backPhoto:photo,createdAt:at,updatedAt:at,createdBy:'Archie',updatedBy:'Archie',revision:1}],
 reminders:[{id:'reminder-cert',taskId:'reminder-cert',title:'Check moisture',taskType:'Check Moisture',plantId:'plant-cert',spaceId:'space-cert',dueDate:'2026-07-21',enabled:true,createdAt:at,updatedAt:at,createdBy:'Archie',updatedBy:'Archie',revision:1}],
 taskHistory:[],seedTransactions:[],seedUsage:[],activity:[],harvests:[],problems:[],succession:[],trays:[],growLights:[],hardeningPlans:[],hydroPods:[],greenhouseReadings:[],plantingDecisions:[],shoppingItems:[],weatherRecommendationHistory:[],vacationPlans:[],calculatorResults:[],environmentalRecords:[],environmentalCorrections:[],wateringEvents:[],soilCheckEvents:[],photos:[],attachments:[],qrLabels:[{id:'qr-cert',targetType:'space',targetId:'space-cert',createdAt:at,updatedAt:at,createdBy:'Archie',updatedBy:'Archie',revision:1}],offlineOperations:[]
});

test('every persisted collection is documented for Phase 5 migration',()=>{
 for(const name of ['spaces','plants','seedPackets','seedTransactions','trays','reminders','taskHistory','wateringEvents','soilCheckEvents','photos','qrLabels','activity']){
  assert.ok(COLLECTION_DEFINITIONS[name],`${name} is missing from the storage inventory`);
  assert.ok(COLLECTION_DEFINITIONS[name].source);
  assert.ok(COLLECTION_DEFINITIONS[name].ownership);
 }
});

test('migration assigns stable metadata without changing existing relationship IDs',()=>{
 const migrated=migrateGardenDataset(fixture(),{now:at});
 assert.equal(migrated.spaces[0].id,'space-cert');
 assert.equal(migrated.plants[0].spaceId,'space-cert');
 assert.equal(migrated.plants[0].sourcePacketId,'packet-cert');
 assert.equal(migrated.reminders[0].plantId,'plant-cert');
 assert.equal(migrated.reminders[0].spaceId,'space-cert');
 for(const collection of ['spaces','plants','seedPackets','reminders'])for(const row of migrated[collection]){
  assert.ok(row.id);
  assert.ok(row.createdAt);
  assert.ok(row.updatedAt);
  assert.ok(row.createdBy);
  assert.ok(row.updatedBy);
  assert.ok(row.revision>=1);
 }
 const again=migrateGardenDataset(migrated,{now:at});
 assert.deepEqual(again.spaces.map(row=>row.id),migrated.spaces.map(row=>row.id));
 assert.deepEqual(again.plants.map(row=>row.id),migrated.plants.map(row=>row.id));
 assert.equal(again.migrationHistory.length,migrated.migrationHistory.length,'migration retry must not duplicate migration records');
});

test('renaming a Growing Space preserves all ID relationships',()=>{
 const migrated=prepareGardenForSync(fixture());
 const renamed={...migrated,spaces:migrated.spaces.map(space=>space.id==='space-cert'?{...space,name:'Renamed Certification Bed',updatedAt:'2026-07-21T13:00:00.000Z',revision:space.revision+1}:space)};
 const validation=validateGardenData(renamed);
 assert.equal(validation.ok,true);
 assert.equal(validation.garden.plants[0].spaceId,'space-cert');
 assert.equal(validation.garden.reminders[0].spaceId,'space-cert');
 assert.equal(validation.garden.qrLabels[0].targetId,'space-cert');
 assert.equal(validation.issues.some(issue=>issue.type==='orphan-link'||issue.type==='dangling-qr'),false);
});

test('validated backup and isolated restore preserve IDs, relationships, and packet photos',()=>{
 const source=prepareGardenForSync(fixture()),backup=buildGardenBackup(source),validation=validateGardenBackup(backup);
 assert.equal(validation.ok,true);
 assert.ok(backup.checksum);
 assert.equal(backup.manifest.photoHandling.mode,'embedded-and-manifested');
 assert.ok(backup.manifest.photoHandling.count>=2);
 const isolated=restoreGardenBackupToIsolated(backup);
 assert.equal(isolated.ok,true);
 assert.equal(isolated.equivalent,true);
 assert.equal(isolated.sourceUntouched,true);
 assert.equal(isolated.garden.spaces[0].id,'space-cert');
 assert.equal(isolated.garden.plants[0].spaceId,'space-cert');
 assert.equal(isolated.garden.seedPackets[0].frontPhoto,photo);
 assert.equal(isolated.garden.seedPackets[0].backPhoto,photo);
 const malformed={...backup,checksum:'changed'};
 assert.equal(validateGardenBackup(malformed).ok,false);
 const unsupported={...backup,manifest:{...backup.manifest,exportVersion:999}};
 unsupported.checksum=integrityHash({manifest:unsupported.manifest,garden:unsupported.garden});
 assert.equal(validateGardenBackup(unsupported).ok,false);
});

test('Safe Restore Rehearsal is idempotent, retryable, and rollback-protected',()=>{
 const result=rehearseMigration(fixture());
 assert.equal(result.ok,true);
 assert.equal(result.idempotent,true);
 assert.equal(result.interrupted.detected,true);
 assert.equal(result.interrupted.retryOk,true);
 assert.equal(result.rollback.ok,true);
 assert.equal(result.rollback.sourcePreserved,true);
});

test('duplicate operation IDs cannot double-apply seed use or queued sync work',()=>{
 const garden=prepareGardenForSync(fixture()),tx={operationId:'seed-use-cert-once',packetId:'packet-cert',plantId:'plant-cert',type:'planted',quantity:-3,actor:'Archie',occurredAt:at};
 const first=applySeedTransaction(garden,tx);
 assert.equal(first.applied,true);
 assert.equal(first.garden.seedPackets.find(row=>row.id==='packet-cert').quantity,22);
 const second=applySeedTransaction(first.garden,tx);
 assert.equal(second.applied,false);
 assert.equal(second.reason,'duplicate-operation');
 assert.equal(second.garden.seedPackets.find(row=>row.id==='packet-cert').quantity,22);
 const reconciliation=reconcileSeedQuantity(second.garden.seedPackets[0],second.garden.seedTransactions);
 assert.equal(reconciliation.available,22);
 assert.equal(reconciliation.duplicates.length,0);
 const operation={operationId:'operation-cert',recordType:'plants',recordId:'plant-cert',action:'update'};
 const queue=enqueueOperation(enqueueOperation([],operation),operation);
 assert.equal(queue.length,1);
});
