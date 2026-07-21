import test from'node:test';
import assert from'node:assert/strict';
import{buildGrowNowRecommendations,groupPlantingRecommendations,plantingDateKey,plantingReadinessForPacket,seedInventory}from'../src/plantingDesk.js';

const baseGarden={profile:{gardenerName:'Brooke'},spaces:[{id:'bed',name:'Raised Bed',type:'black-square-bed',capacity:12,sunExposure:'Full sun'},{id:'greenhouse',name:'Greenhouse',type:'greenhouse',capacity:8},{id:'inside',name:'Basement Shelf',type:'indoor',capacity:12}],plants:[],seedPackets:[],seeds:[],plantingDecisions:[],yearPlan:{crops:[]}};
const calmWeather={signals:{poorPlantingWindow:{status:false,reason:'No major conflict.'}},high:78,low:58};

test('Date objects keep a sortable local YYYY-MM-DD planting key',()=>{assert.equal(plantingDateKey(new Date('2026-07-17T12:00:00-05:00')),'2026-07-17')});

test('exact owned packet remains first-class when suitable',()=>{const garden={...baseGarden,seedPackets:[{id:'packet-1',cropId:'lettuce',name:'Lettuce',variety:'Amish Deer Tongue',brand:'Saved Brand',quantity:30,packetYear:2026,daysToMaturity:45}]};const result=buildGrowNowRecommendations({garden,recommendations:[],weather:calmWeather});const card=result.cards.find(row=>row.packet?.id==='packet-1');assert.ok(card);assert.equal(card.owned,true);assert.equal(card.statusLabel,'Owned Seed');assert.match(card.title,/Amish Deer Tongue/)});

test('no owned packet still creates useful discovery guidance',()=>{const result=buildGrowNowRecommendations({garden:baseGarden,recommendations:[],weather:calmWeather});const discovery=result.cards.find(row=>row.source==='discovery');assert.ok(discovery);assert.equal(discovery.owned,false);assert.ok(discovery.traits.length);assert.ok(discovery.actionNow);assert.ok(discovery.harvestTime);assert.ok(discovery.commonUse)});

test('eggplant is never offered as late direct sowing',()=>{const result=buildGrowNowRecommendations({garden:baseGarden,recommendations:[],weather:calmWeather});const card=result.cards.find(row=>row.cropId==='eggplant');assert.ok(card);assert.notEqual(card.method,'Direct Sow');assert.ok(['Buy Transplants','Not This Season'].includes(card.method))});

test('recommendation groups follow actual present action',()=>{const result=buildGrowNowRecommendations({garden:baseGarden,recommendations:[],weather:calmWeather});const groups=groupPlantingRecommendations(result.cards);for(const group of groups)for(const card of group.items)assert.equal(card.group,group.name);assert.equal(groups.some(group=>group.items.length===0),false)});

test('group descriptions and counts remain compact and meaningful',()=>{const result=buildGrowNowRecommendations({garden:baseGarden,recommendations:[],weather:calmWeather});for(const group of result.groups){assert.ok(group.name);assert.ok(group.description);assert.ok(group.items.length>0)}});

test('weather risk changes present action wording rather than pretending conditions are suitable',()=>{const weather={signals:{poorPlantingWindow:{status:true,reason:'High heat and wind make planting risky.'}}};const result=buildGrowNowRecommendations({garden:baseGarden,recommendations:[],weather});const actionable=result.cards.find(card=>card.strongNow&&card.group!=='Not This Season');assert.ok(actionable);assert.match(actionable.actionNow,/wait|window/i);assert.match(actionable.weatherNote,/risk|heat|wind|weather/i)});

test('owned seed inventory deduplicates legacy duplicate behind exact packet',()=>{const garden={...baseGarden,seedPackets:[{id:'exact',cropId:'lettuce',name:'Lettuce',variety:'Amish Deer Tongue',quantity:10}],seeds:[{id:'legacy',cropId:'lettuce',name:'Lettuce',variety:'Amish Deer Tongue',quantity:10}]};const inventory=seedInventory(garden);assert.equal(inventory.filter(row=>row.cropId==='lettuce').length,1);assert.equal(inventory[0].exactPacket,true)});

test('tomato packet readiness schedules indoor starting from frost dates',()=>{const readiness=plantingReadinessForPacket({garden:baseGarden,packet:{id:'tomato-packet',cropId:'tomato',name:'Tomato',daysToMaturity:70,quantity:20},weather:calmWeather,date:new Date('2026-03-20T12:00:00-05:00')});assert.equal(readiness.statusKey,'ready-now');assert.equal(readiness.method,'Start Indoors');assert.equal(readiness.packetId,'tomato-packet');assert.match(readiness.action,/saved packet/i)});

test('lettuce packet readiness waits for the fall window after midsummer heat',()=>{const readiness=plantingReadinessForPacket({garden:baseGarden,packet:{id:'lettuce-packet',cropId:'lettuce',name:'Lettuce',variety:'Iceberg A',daysToMaturity:85,quantity:40},weather:calmWeather,date:new Date('2026-07-21T12:00:00-05:00')});assert.equal(readiness.statusKey,'outdoor-approaching');assert.equal(readiness.method,'Direct Sow');assert.ok(readiness.fallPlantingDate);assert.match(readiness.reason,/fall planting window/i)});

test('bean packet readiness can direct sow inside the warm-season window',()=>{const readiness=plantingReadinessForPacket({garden:baseGarden,packet:{id:'bean-packet',cropId:'green-bean',name:'Green Beans',daysToMaturity:55,quantity:30},weather:calmWeather,date:new Date('2026-06-01T12:00:00-05:00')});assert.equal(readiness.statusKey,'ready-now');assert.equal(readiness.method,'Direct Sow');assert.match(readiness.expectedHarvestWindow,/2026/)});

test('pepper packet readiness does not pretend late seed starting is useful',()=>{const readiness=plantingReadinessForPacket({garden:baseGarden,packet:{id:'pepper-packet',cropId:'bell-pepper',name:'Bell Pepper',daysToMaturity:75,quantity:20},weather:calmWeather,date:new Date('2026-07-21T12:00:00-05:00')});assert.equal(readiness.statusKey,'missed-window');assert.equal(readiness.method,'Start Indoors');assert.match(readiness.action,/Do not start/i)});

test('potato packet readiness supports seed-potato planting in spring',()=>{const readiness=plantingReadinessForPacket({garden:baseGarden,packet:{id:'potato-packet',cropId:'potato',name:'Potatoes',daysToMaturity:90,quantity:12},weather:calmWeather,date:new Date('2026-04-20T12:00:00-05:00')});assert.equal(readiness.statusKey,'ready-now');assert.equal(readiness.method,'Plant Seed Potatoes');assert.match(readiness.action,/saved packet/i)});
