import test from'node:test';
import assert from'node:assert/strict';
import{cleanGrowingSpaceForType}from'../src/spaceRecord.js';

test('Container Planter retains container details and clears Potato Grow Bag details',()=>{
 const row=cleanGrowingSpaceForType({type:'container',capacity:'6',soilType:'potting mix',size:'5 gallon',material:'plastic',drainageHoles:true,selfWateringReservoir:true,bagSize:'10 gallon',seedPotatoesPlanted:4,hillingStage:'first hill',lastHilledDate:'2026-07-21'});
 assert.equal(row.capacity,6);
 assert.equal(row.size,'5 gallon');
 assert.equal(row.material,'plastic');
 assert.equal(row.drainageHoles,true);
 assert.equal(row.selfWateringReservoir,true);
 assert.equal(row.bagSize,'');
 assert.equal(row.seedPotatoesPlanted,'');
 assert.equal(row.hillingStage,'');
 assert.equal(row.lastHilledDate,'');
});

test('Potato Grow Bag retains bag details and clears container-only details',()=>{
 const row=cleanGrowingSpaceForType({type:'potato-grow-bag',capacity:4,soilType:'compost blend',size:'5 gallon',material:'plastic',drainageHoles:true,selfWateringReservoir:true,bagSize:'10 gallon',seedPotatoesPlanted:'4',hillingStage:'second hill',lastHilledDate:'2026-07-21'});
 assert.equal(row.bagSize,'10 gallon');
 assert.equal(row.seedPotatoesPlanted,4);
 assert.equal(row.hillingStage,'second hill');
 assert.equal(row.lastHilledDate,'2026-07-21');
 assert.equal(row.size,'');
 assert.equal(row.material,'');
 assert.equal(row.drainageHoles,false);
 assert.equal(row.selfWateringReservoir,false);
});

test('non-soil indoor space clears soil, container, and grow-bag-only values',()=>{
 const row=cleanGrowingSpaceForType({type:'indoor',capacity:0,soilType:'old soil',drainageQuality:'slow',mulchStatus:'straw',irrigationMethod:'hose',sunExposure:'full sun',size:'old',material:'old',drainageHoles:true,selfWateringReservoir:true,bagSize:'old',seedPotatoesPlanted:3,hillingStage:'old',lastHilledDate:'2026-07-21'});
 assert.equal(row.capacity,1);
 for(const field of ['soilType','drainageQuality','mulchStatus','irrigationMethod','sunExposure','size','material','bagSize','seedPotatoesPlanted','hillingStage','lastHilledDate'])assert.equal(row[field],'');
 assert.equal(row.drainageHoles,false);
 assert.equal(row.selfWateringReservoir,false);
});
