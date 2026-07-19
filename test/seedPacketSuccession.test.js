import test from 'node:test';
import assert from 'node:assert/strict';
import {createSuccession} from '../src/planning.js';
import {createManualReminder} from '../src/yearRoundEngine.js';
import {findTaskDuplicate} from '../src/connectedIntelligence.js';

test('packet succession schedule is linked to planting, packet, space, and actual planting date',()=>{
 const plant={id:'plant-iceberg',cropId:'lettuce',name:'Iceberg A tray 1',spaceId:'tray-2',sourcePacketId:'packet-iceberg',plantedAt:'2026-07-18'};
 const succession=createSuccession(plant,14,12,{reason:'Printed packet says sow every two weeks.'});
 assert.equal(succession.dueDate,'2026-08-01');
 assert.equal(succession.plantId,plant.id);
 assert.equal(succession.spaceId,plant.spaceId);
 assert.equal(succession.sourcePacketId,plant.sourcePacketId);
 assert.equal(succession.operationId,'succession:plant-iceberg:2026-08-01:14');
});

test('connected Chore Board reminder deduplicates the same packet succession need',()=>{
 const duplicateKey='succession:plant-iceberg:2026-08-01:14';
 const reminder=createManualReminder({duplicateKey,operationId:`reminder:${duplicateKey}`,title:'Start the next Iceberg A tray 1 batch',taskType:'Start Seeds',plantId:'plant-iceberg',spaceId:'tray-2',sourcePacketId:'packet-iceberg',sourceSuccessionId:'succession-1',source:'seed-packet',dueDate:'2026-08-01',reason:'Printed packet guidance.'},'Archie');
 assert.equal(reminder.source,'seed-packet');
 assert.equal(reminder.sourcePacketId,'packet-iceberg');
 assert.equal(reminder.sourceSuccessionId,'succession-1');
 assert.equal(findTaskDuplicate({reminders:[reminder]},createManualReminder({...reminder},'Archie'))?.duplicateKey,duplicateKey);
});
