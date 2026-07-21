import{formatGardenDate,formatGardenDateRange}from'./dateFormat.js';
import{plantingDateKey,plantingReadinessForPacket,seedInventory}from'./plantingDesk.js';
import{availablePacketQuantity,inferCropId}from'./seedToHarvest.js';

const DAY=86400000;
const todayKey=date=>plantingDateKey(date||new Date());
const diffDays=(from,to)=>Math.round((new Date(`${plantingDateKey(to)}T12:00:00`)-new Date(`${todayKey(from)}T12:00:00`))/DAY);
const packetName=packet=>[packet.brand,packet.variety||packet.name].filter(Boolean).join(' ')||packet.name||'Saved seed packet';
const isIndoorMethod=method=>/indoor|start seeds|start indoors|tray|greenhouse/i.test(method||'');
const actionStatus=readiness=>readiness.statusKey==='ready-now'?'READY TODAY':readiness.statusKey==='outdoor-approaching'?'THIS WEEK':readiness.statusKey==='missed-window'?'WAIT':'SCHEDULE FUTURE';

export function packetSeedUseDefaults(packet={}){
 const available=availablePacketQuantity(packet),uncounted=packet.countType==='weight-only'||Boolean(packet.packetWeight&&available<=0);
 return{quantity:1,seedsUsed:uncounted?0:Math.max(1,Math.min(available||1,1)),seedCountType:uncounted?'weight-only':packet.countType||'estimated',quantityAvailable:uncounted?null:available,uncounted};
}

export function activeSeedPacketInventory(garden={}){
 return seedInventory(garden).filter(packet=>!packet.deletedAt&&!packet.archived&&!packet.discarded);
}

export function buildPacketRecommendation({packet,garden={},weather=null,date=new Date()}={}){
 const readiness=plantingReadinessForPacket({packet,garden,weather,date}),days=diffDays(date,readiness.recommendedDate),indoor=isIndoorMethod(readiness.method),defaults=packetSeedUseDefaults(packet),sourcePacket={id:packet.id,name:packetName(packet),brand:packet.brand||'',crop:packet.name||'',variety:packet.variety||'',countType:packet.countType||defaults.seedCountType};
 const row={id:`packet-intelligence-${packet.id}`,packetId:packet.id,cropId:readiness.cropId||packet.cropId||inferCropId(packet),crop:packet.name||readiness.title,variety:packet.variety||'',sourcePacket,packet,readiness,status:actionStatus(readiness),statusKey:readiness.statusKey,action:readiness.action,whyNow:[readiness.reason,readiness.weatherNote].filter(Boolean).join(' '),dateWindow:formatGardenDateRange(readiness.windowStart,readiness.windowEnd),recommendedDate:readiness.recommendedDate,recommendedDateLabel:formatGardenDate(readiness.recommendedDate),dateWindowStart:readiness.windowStart,dateWindowEnd:readiness.windowEnd,daysUntil:days,method:readiness.method,indoorOutdoor:indoor?'Indoor':'Outdoor',suggestedGrowingSpace:readiness.suggestedSpace?.name||'Choose a Growing Space',suggestedSpaceId:readiness.suggestedSpace?.id||'',nextAvailableAction:readiness.statusKey==='ready-now'?readiness.action:`Next action starts ${formatGardenDate(readiness.recommendedDate)}.`,seedUseDefaults:defaults,packetFacts:readiness.packetFacts||[]};
 return row;
}

export function connectedPlantingPrefillFromRecommendation(row={}){
 const packet=row.packet||{},defaults=row.seedUseDefaults||packetSeedUseDefaults(packet);
 return{cropId:row.cropId||packet.cropId||'',name:packet.name||row.crop||'Planting',cropName:packet.name||row.crop||'Planting',variety:packet.variety||row.variety||'',sourcePacketId:row.packetId||packet.id||'',seedId:row.packetId||packet.id||'',source:'seed-packet',stage:row.method==='Start Indoors'?'Seed Started':'Planned',quantity:defaults.quantity||1,seedsUsed:defaults.seedsUsed||0,seedCountType:defaults.seedCountType||packet.countType||'estimated',summary:[row.action,row.dateWindow&&`Recommended window ${row.dateWindow}`,row.nextAvailableAction].filter(Boolean).join(' · ')};
}

export function packetPlanningDestination(packet={}){
 return{route:'plan-plant',destination:'grow',prefill:{sourcePacketId:packet.id||'',cropId:packet.cropId||inferCropId(packet),source:'seed-packet'}};
}

export function buildGardenIntelligenceEngine({garden={},weather=null,date=new Date()}={}){
 const rows=activeSeedPacketInventory(garden).map(packet=>buildPacketRecommendation({packet,garden,weather,date})).sort((a,b)=>a.daysUntil-b.daysUntil||a.sourcePacket.name.localeCompare(b.sourcePacket.name));
 const queues={today:[],week:[],planAhead:[],wait:[]};
 for(const row of rows){
  if(row.statusKey==='ready-now'||row.daysUntil<=0)queues.today.push(row);
  else if(row.daysUntil<=7)queues.week.push(row);
  else if(row.statusKey==='missed-window'||row.statusKey==='wait-schedule')queues.wait.push(row);
  else queues.planAhead.push(row);
 }
 return{schemaVersion:1,generatedAt:new Date().toISOString(),date:todayKey(date),rows,queues,nextAction:queues.today[0]||queues.week[0]||queues.planAhead[0]||queues.wait[0]||null,summary:{ownedPackets:rows.length,today:queues.today.length,week:queues.week.length,planAhead:queues.planAhead.length,wait:queues.wait.length}};
}
