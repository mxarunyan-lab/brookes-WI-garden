import test from'node:test';
import assert from'node:assert/strict';
import{activeSeedPacketInventory,buildGardenIntelligenceEngine,choreFromPacketRecommendation,connectedPlantingPrefillFromRecommendation,packetPlanningDestination,packetSeedUseDefaults}from'../src/gardenIntelligenceEngine.js';

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

test('lettuce recommendation shows explanation confidence and garden calendar range',()=>{
 const packet={id:'packet-iceberg',brand:'Burpee',name:'Lettuce',variety:'Iceberg A',cropId:'lettuce',quantity:0,countType:'weight-only',packetWeight:'1 g',daysToMaturity:65,packetIntelligence:{analysisVersion:'seed-packet-vision-v1'}};
 const engine=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packet]},weather,date:new Date('2026-07-21T12:00:00-05:00')});
 const row=engine.rows[0];
 assert.ok(row.whyBullets.some(item=>/Packet maturity: 65 days/.test(item)));
 assert.equal(row.confidence.level,'High');
 assert.ok(row.informationUsed.includes('seed packet'));
 assert.ok(row.informationUsed.includes('weather'));
 assert.match(row.dateWindow,/^\d+\/\d+\/\d{2} - \d+\/\d+\/\d{2}$/);
 assert.equal(engine.calendar.monthLabel,'July 2026');
 assert.ok([...engine.calendar.now,...engine.calendar.comingSoon,...engine.calendar.future].some(item=>item.packetId==='packet-iceberg'));
});

test('recommendation chore is approval based and keeps exact packet source',()=>{
 const packet={id:'packet-bean',brand:'Burpee',name:'Green Beans',cropId:'green-bean',quantity:30,daysToMaturity:55,packetIntelligence:{analysisVersion:'seed-packet-vision-v1'}};
 const row=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packet]},weather,date:new Date('2026-06-01T12:00:00-05:00')}).rows[0];
 const chore=choreFromPacketRecommendation(row);
 assert.equal(chore.sourcePacketId,'packet-bean');
 assert.equal(chore.source,'garden-intelligence');
 assert.equal(chore.taskType,'Direct Sow');
 assert.match(chore.note,/High confidence|Medium confidence/);
});

test('tomato pepper and bean planting behavior stays crop specific',()=>{
 const packets=[
  {id:'tomato-packet',cropId:'tomato',name:'Tomato',variety:'Early Girl',quantity:20,daysToMaturity:70,packetIntelligence:{}},
  {id:'pepper-packet',cropId:'bell-pepper',name:'Bell Pepper',quantity:20,daysToMaturity:75,packetIntelligence:{}},
  {id:'bean-packet',cropId:'green-bean',name:'Green Beans',quantity:20,daysToMaturity:55,packetIntelligence:{}}
 ];
 const tomato=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packets[0]]},weather,date:new Date('2026-03-20T12:00:00-05:00')}).rows[0];
 const pepper=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packets[1]]},weather,date:new Date('2026-07-21T12:00:00-05:00')}).rows[0];
 const bean=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packets[2]]},weather,date:new Date('2026-06-01T12:00:00-05:00')}).rows[0];
 assert.equal(tomato.method,'Start Indoors');
 assert.equal(tomato.status,'READY TODAY');
 assert.equal(pepper.status,'WAIT');
 assert.equal(bean.method,'Direct Sow');
 assert.equal(bean.status,'READY TODAY');
});

test('lifecycle intelligence changes guidance by plant stage',()=>{
 const packet={id:'packet-tomato',cropId:'tomato',name:'Tomato',variety:'Early Girl',quantity:10};
 const plants=[{id:'tomato-seedling',name:'Tomato Seedling',cropId:'tomato',spaceId:'inside',stage:'Seedling',sourcePacketId:'packet-tomato'},{id:'tomato-established',name:'Porch Tomato',cropId:'tomato',spaceId:'bed',stage:'Established'}];
 const engine=buildGardenIntelligenceEngine({garden:{...garden,seedPackets:[packet],plants},weather,date:new Date('2026-07-21T12:00:00-05:00')});
 const seedling=engine.lifecycle.rows.find(row=>row.plantId==='tomato-seedling');
 const established=engine.lifecycle.rows.find(row=>row.plantId==='tomato-established');
 assert.match(seedling.action,/potting up|hardening off/i);
 assert.equal(seedling.confidence.level,'High');
 assert.match(established.action,/watering|support/i);
});
