import test from'node:test';
import assert from'node:assert/strict';
import{activeSeedPacketInventory,buildGardenIntelligenceEngine,connectedPlantingPrefillFromRecommendation,packetPlanningDestination,packetSeedUseDefaults}from'../src/gardenIntelligenceEngine.js';

const spaces=[{id:'bed',name:'Raised Bed',type:'black-square-bed',capacity:12,sunExposure:'Full sun'},{id:'inside',name:'Basement Shelf',type:'indoor',capacity:24},{id:'bag',name:'Potato Bag',type:'potato-grow-bag',capacity:4}];
const garden={profile:{gardenerName:'Brooke',lastFrost:'May 15',firstFrost:'October 10'},spaces,plants:[],seedPackets:[],plantingDecisions:[]};
const weather={signals:{poorPlantingWindow:{status:false,reason:'No major conflict.'}},freshness:'Current',high:78,low:58,wind:5,windGust:8,forecasts:[],currentObservation:{source_name:'NWS Green Bay',observed_at:'2026-07-21T12:00:00-05:00'}};

test('Burpee Iceberg packet opens Grow Now successfully with a valid action',()=>{
 const packet={id:'packet-iceberg',brand:'Burpee',name:'Lettuce',variety:'Iceberg A',cropId:'lettuce',packetYear:2026,quantity:0,countType:'weight-only',packetWeight:'1.5 g',daysToMaturity:85};
 const engine=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packet]},weather,date:new Date('2026-07-21T12:00:00-05:00')});
 const row=engine.rows.find(item=>item.packetId==='packet-iceberg');
 assert.ok(row);
 assert.ok(engine.queues.planAhead.includes(row)||engine.queues.wait.includes(row)||engine.queues.today.includes(row)||engine.queues.week.includes(row));
 assert.match(row.action,/packet|ready|save|space|sow|start/i);
 assert.equal(row.sourcePacket.id,'packet-iceberg');
 assert.equal(row.variety,'Iceberg A');
});

test('Create Connected Planting receives the same exact packet ID',()=>{
 const packet={id:'packet-iceberg',brand:'Burpee',name:'Lettuce',variety:'Iceberg A',cropId:'lettuce',quantity:0,countType:'weight-only',packetWeight:'1.5 g'};
 const row=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packet]},weather,date:new Date('2026-07-21T12:00:00-05:00')}).rows[0];
 const prefill=connectedPlantingPrefillFromRecommendation(row);
 assert.equal(prefill.sourcePacketId,'packet-iceberg');
 assert.equal(prefill.seedId,'packet-iceberg');
 assert.equal(prefill.seedCountType,'weight-only');
 assert.equal(prefill.seedsUsed,0);
});

test('weight-only saved packets remain selectable without fake availability',()=>{
 const packet={id:'packet-weight',name:'Lettuce',cropId:'lettuce',quantity:0,countType:'weight-only',packetWeight:'1.5 g'};
 const inventory=activeSeedPacketInventory({...garden,seedPackets:[packet]});
 assert.equal(inventory.length,1);
 assert.equal(packetSeedUseDefaults(packet).quantityAvailable,null);
});

test('packet planning destination has no dead navigation route',()=>{
 const destination=packetPlanningDestination({id:'packet-iceberg',name:'Lettuce',variety:'Iceberg A',cropId:'lettuce'});
 assert.equal(destination.route,'plan-plant');
 assert.equal(destination.destination,'grow');
 assert.equal(destination.prefill.sourcePacketId,'packet-iceberg');
 assert.equal(destination.prefill.source,'seed-packet');
});
