import test from'node:test';
import assert from'node:assert/strict';
import{connectedDuplicateKey,dedupeConnectedRows,findRecordDuplicate,findTaskDuplicate,photoCapabilityLabel,prefillHarvest,prefillIssue,recordDuplicateKey,shoppingDuplicateKey,taskDuplicateKey}from'../src/connectedIntelligence.js';

const garden={profile:{gardenerName:'Brooke'},spaces:[{id:'space-1',name:'Porch Pots'}],seedPackets:[{id:'packet-1',brand:'Burpee',name:'Tomato',variety:'Early Girl'}],plants:[{id:'plant-1',name:'Tomato #1',cropName:'Tomato',cropId:'tomato',variety:'Early Girl',spaceId:'space-1',sourcePacketId:'packet-1',stage:'Fruiting'}],harvests:[],problems:[],reminders:[],taskHistory:[]};

test('harvest prefill uses the selected Plant Journey context',()=>{
 const value=prefillHarvest(garden,'plant-1',new Date('2026-07-18T12:00:00Z'));
 assert.equal(value.name,'Tomato #1');
 assert.equal(value.variety,'Early Girl');
 assert.equal(value.spaceName,'Porch Pots');
 assert.equal(value.sourcePacketName,'Burpee Early Girl');
 assert.equal(value.stage,'Fruiting');
});

test('issue prefill uses plant, variety, space and date',()=>{
 const value=prefillIssue(garden,'plant-1',new Date('2026-07-18T12:00:00Z'));
 assert.equal(value.plantName,'Tomato #1');
 assert.equal(value.variety,'Early Girl');
 assert.equal(value.spaceName,'Porch Pots');
 assert.match(value.observedAt,/2026-07-18/);
});

test('stored photo is not mislabeled as analyzed',()=>assert.equal(photoCapabilityLabel({photo:'data:image/jpeg;base64,x'}),'Photo saved · no image diagnosis performed'));
test('completed analysis is labeled honestly',()=>assert.equal(photoCapabilityLabel({photoAnalysisStatus:'analyzed'}),'Photo analyzed'));

test('task duplicate key ignores which screen generated the same action',()=>{
 const a=taskDuplicateKey({taskType:'Check Moisture',title:'Check soil',spaceId:'space-1',dueDate:'2026-07-18',kind:'weather'}),b=taskDuplicateKey({taskType:'Check Moisture',title:'Vacation soil check',spaceId:'space-1',dueDate:'2026-07-18',kind:'vacation'});
 assert.equal(a,b);
});

test('matching reminder is found across connected workflow origins',()=>{
 const reminder={id:'r1',taskType:'Check Moisture',title:'Check porch soil',spaceId:'space-1',dueDate:'2026-07-18',enabled:true};
 const duplicate=findTaskDuplicate({...garden,reminders:[reminder]},{taskType:'Check Moisture',title:'Vacation container check',spaceId:'space-1',dueDate:'2026-07-18'});
 assert.equal(duplicate?.id,'r1');
});

test('repeatable harvest records are not globally blocked',()=>{
 const first=recordDuplicateKey('harvest',{repeatable:true,id:'plant-1|2026-07-18T10:00|3|count'}),second=recordDuplicateKey('harvest',{repeatable:true,id:'plant-1|2026-07-19T10:00|3|count'});
 assert.notEqual(first,second);
});

test('matching open issue is detected without blocking a different day',()=>{
 const existing={id:'i1',plantId:'plant-1',type:'Pest spotted',at:'2026-07-18T12:00:00Z',status:'open'};existing.duplicateKey=recordDuplicateKey('issue',{...existing,action:existing.type,targetId:existing.plantId,date:existing.at,sourceCategory:'garden-record'});
 assert.equal(findRecordDuplicate({...garden,problems:[existing]},'issue',{...existing})?.id,'i1');
 const next={...existing,id:'i2',at:'2026-07-19T12:00:00Z',duplicateKey:''};next.duplicateKey=recordDuplicateKey('issue',{...next,action:next.type,targetId:next.plantId,date:next.at,sourceCategory:'garden-record'});
 assert.equal(findRecordDuplicate({...garden,problems:[existing]},'issue',next),null);
});

test('shopping duplicate key retains variety and intended space',()=>{
 const a=shoppingDuplicateKey({name:'Lettuce Seeds',category:'Seeds',cropId:'lettuce',variety:'Iceberg A',intendedSpaceId:'bed-1'}),b=shoppingDuplicateKey({name:'Lettuce Seeds',category:'Seeds',cropId:'lettuce',variety:'Green Ice',intendedSpaceId:'bed-1'});
 assert.notEqual(a,b);
});

test('dedupe keeps the higher priority connected row',()=>{
 const rows=dedupeConnectedRows([{id:'a',priority:20},{id:'a',priority:80}],row=>row.id);
 assert.equal(rows[0].priority,80);
});
