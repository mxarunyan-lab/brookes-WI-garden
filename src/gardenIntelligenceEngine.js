import{formatGardenDate,formatGardenDateRange}from'./dateFormat.js';
import{plantingDateKey,plantingReadinessForPacket,seedInventory}from'./plantingDesk.js';
import{availablePacketQuantity,inferCropId}from'./seedToHarvest.js';

const DAY=86400000;
const todayKey=date=>plantingDateKey(date||new Date());
const diffDays=(from,to)=>Math.round((new Date(`${plantingDateKey(to)}T12:00:00`)-new Date(`${todayKey(from)}T12:00:00`))/DAY);
const addDays=(value,days)=>{const date=new Date(`${todayKey(value)}T12:00:00`);date.setDate(date.getDate()+Number(days||0));return date.toISOString().slice(0,10)};
const packetName=packet=>[packet.brand,packet.variety||packet.name].filter(Boolean).join(' ')||packet.name||'Saved seed packet';
const isIndoorMethod=method=>/indoor|start seeds|start indoors|tray|greenhouse/i.test(method||'');
const actionStatus=readiness=>readiness.statusKey==='ready-now'?'READY TODAY':readiness.statusKey==='outdoor-approaching'?'THIS WEEK':readiness.statusKey==='missed-window'?'WAIT':'SCHEDULE FUTURE';
const unique=values=>[...new Set(values.filter(Boolean))];
const hasPacketIntelligence=packet=>Boolean(packet?.packetIntelligence||packet?.fieldMeta||packet?.frontPhoto||packet?.backPhoto||packet?.barcode||packet?.packetWeight);
const weatherFresh=weather=>Boolean(weather&&!weather.isStale&&weather.freshness!=='Stale'&&(weather.currentObservation||weather.forecasts?.length||weather.temperature!==null&&weather.temperature!==undefined));
const monthLabel=value=>{const date=new Date(`${todayKey(value)}T12:00:00`);return Number.isNaN(date.getTime())?'Garden Calendar':new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(date)};

function confidenceForRecommendation({packet,readiness,weather}={}){
 const reasons=[],missing=[];let score=0;
 if(packet?.id){score+=1;reasons.push('Saved seed packet is connected')}else missing.push('No exact packet');
 if(hasPacketIntelligence(packet)){score+=1;reasons.push('Packet details or packet intelligence are saved')}else missing.push('Packet details are incomplete');
 if(readiness?.cropId){score+=1;reasons.push('Known crop rules are available')}else missing.push('Crop could not be matched confidently');
 if(readiness?.recommendedDate&&readiness?.windowStart&&readiness?.windowEnd){score+=1;reasons.push('Green Bay frost and seasonal timing are available')}else missing.push('Planting window is incomplete');
 if(weatherFresh(weather)){score+=1;reasons.push('Current weather or forecast was considered')}else missing.push('Weather is stale or unavailable');
 const level=score>=4?'High':score>=3?'Medium':'Low';
 return{level,score,scoreLabel:`${score}/5`,reasons,missing,note:level==='High'?'Recommendation is based on packet, crop, location, and usable weather.':level==='Medium'?'Useful guidance, but one or more inputs are incomplete.':'Review the missing information before treating this as a firm planting date.'};
}

function explanationForRecommendation({packet,readiness,weather}={}){
 const bullets=[];
 bullets.push(readiness?.cropId?`${readiness.cropId.replace(/-/g,' ')} crop rules matched`:'Crop rules are incomplete');
 if(packet?.daysToMaturity)bullets.push(`Packet maturity: ${packet.daysToMaturity} days`);
 if(readiness?.fallPlantingDate&&readiness.statusKey!=='missed-window')bullets.push('Green Bay fall planting window supports this timing');
 else if(readiness?.method)bullets.push(`Green Bay timing supports ${readiness.method.toLowerCase()}`);
 if(readiness?.weatherNote)bullets.push(readiness.weatherNote);
 else bullets.push(weatherFresh(weather)?'Current weather has no major short-term conflict':'Weather should be rechecked before acting');
 if(readiness?.suggestedSpace?.name)bullets.push(`Suggested space: ${readiness.suggestedSpace.name}`);
 return unique(bullets);
}

function informationUsed({packet,readiness,weather}={}){
 return unique([packet?.id?'seed packet':null,hasPacketIntelligence(packet)?'packet intelligence':null,readiness?.cropId?'crop rules':null,'location',weatherFresh(weather)?'weather':'weather status']);
}

export function packetSeedUseDefaults(packet={}){
 const available=availablePacketQuantity(packet),uncounted=packet.countType==='weight-only'||Boolean(packet.packetWeight&&available<=0);
 return{quantity:1,seedsUsed:uncounted?0:Math.max(1,Math.min(available||1,1)),seedCountType:uncounted?'weight-only':packet.countType||'estimated',quantityAvailable:uncounted?null:available,uncounted};
}

export function activeSeedPacketInventory(garden={}){
 return seedInventory(garden).filter(packet=>!packet.deletedAt&&!packet.archived&&!packet.discarded);
}

export function buildPacketRecommendation({packet,garden={},weather=null,date=new Date()}={}){
 const readiness=plantingReadinessForPacket({packet,garden,weather,date}),days=diffDays(date,readiness.recommendedDate),indoor=isIndoorMethod(readiness.method),defaults=packetSeedUseDefaults(packet),sourcePacket={id:packet.id,name:packetName(packet),brand:packet.brand||'',crop:packet.name||'',variety:packet.variety||'',countType:packet.countType||defaults.seedCountType};
 const confidence=confidenceForRecommendation({packet,readiness,weather}),whyBullets=explanationForRecommendation({packet,readiness,weather}),infoUsed=informationUsed({packet,readiness,weather});
 return{id:`packet-intelligence-${packet.id}`,packetId:packet.id,cropId:readiness.cropId||packet.cropId||inferCropId(packet),crop:packet.name||readiness.title,variety:packet.variety||'',sourcePacket,packet,readiness,status:actionStatus(readiness),statusKey:readiness.statusKey,action:readiness.action,whyNow:[readiness.reason,readiness.weatherNote].filter(Boolean).join(' '),whyBullets,informationUsed:infoUsed,confidence,confidenceLevel:confidence.level,confidenceScore:confidence.score,dateWindow:formatGardenDateRange(readiness.windowStart,readiness.windowEnd),recommendedDate:readiness.recommendedDate,recommendedDateLabel:formatGardenDate(readiness.recommendedDate),dateWindowStart:readiness.windowStart,dateWindowEnd:readiness.windowEnd,daysUntil:days,method:readiness.method,indoorOutdoor:indoor?'Indoor':'Outdoor',suggestedGrowingSpace:readiness.suggestedSpace?.name||'Choose a Growing Space',suggestedSpaceId:readiness.suggestedSpace?.id||'',nextAvailableAction:readiness.statusKey==='ready-now'?readiness.action:`Next action starts ${formatGardenDate(readiness.recommendedDate)}.`,seedUseDefaults:defaults,packetFacts:readiness.packetFacts||[]};
}

export function connectedPlantingPrefillFromRecommendation(row={}){
 const packet=row.packet||{},defaults=row.seedUseDefaults||packetSeedUseDefaults(packet);
 return{cropId:row.cropId||packet.cropId||'',name:packet.name||row.crop||'Planting',cropName:packet.name||row.crop||'Planting',variety:packet.variety||row.variety||'',sourcePacketId:row.packetId||packet.id||'',seedId:row.packetId||packet.id||'',source:'seed-packet',stage:row.method==='Start Indoors'?'Seed Started':'Planned',quantity:defaults.quantity||1,seedsUsed:defaults.seedsUsed||0,seedCountType:defaults.seedCountType||packet.countType||'estimated',summary:[row.action,row.dateWindow&&`Recommended window ${row.dateWindow}`,row.nextAvailableAction].filter(Boolean).join(' | ')};
}

export function choreFromPacketRecommendation(row={}){
 const direct=/direct sow|seed potato/i.test(row.method||row.action),taskType=direct?'Direct Sow':/transplant/i.test(row.method||row.action)?'Transplant':'Start Seeds';
 return{title:`${row.method||'Review planting'}: ${row.sourcePacket?.name||row.crop||'Saved packet'}`,taskType,plantId:'',spaceId:row.suggestedSpaceId||'',sourcePacketId:row.packetId||'',source:'garden-intelligence',priority:row.statusKey==='ready-now'?86:row.daysUntil<=7?72:58,dueDate:row.recommendedDate||todayKey(),reason:row.action||'Garden Intelligence recommendation.',note:[`Source packet: ${row.sourcePacket?.name||row.packetId}`,row.dateWindow&&`Recommended window: ${row.dateWindow}`,row.confidence?.level&&`${row.confidence.level} confidence`,row.whyNow].filter(Boolean).join(' | ')};
}

export function packetPlanningDestination(packet={}){
 return{route:'plan-plant',destination:'grow',prefill:{sourcePacketId:packet.id||'',cropId:packet.cropId||inferCropId(packet),source:'seed-packet'}};
}

export function buildGardenCalendar(rows=[],date=new Date()){
 const now=[],comingSoon=[],future=[];
 for(const row of rows){
  const entry={id:`calendar-${row.packetId}`,packetId:row.packetId,crop:row.crop,variety:row.variety,sourcePacket:row.sourcePacket?.name||'',action:row.method,dateWindow:row.dateWindow,status:row.status,recommendedDate:row.recommendedDate,confidence:row.confidence};
  if(row.statusKey==='ready-now'||row.daysUntil<=0)now.push(entry);
  else if(row.daysUntil<=14)comingSoon.push(entry);
  else future.push(entry);
 }
 return{monthLabel:monthLabel(date),now,comingSoon,future};
}

export function buildLifecycleRecommendations({garden={},weather=null,date=new Date()}={}){
 const rows=(garden.plants||[]).filter(plant=>!plant.deletedAt&&!plant.archived).map(plant=>{
  const space=(garden.spaces||[]).find(row=>row.id===plant.spaceId&&!row.deletedAt),stage=plant.stage||'Established',sourcePacket=(garden.seedPackets||[]).find(packet=>packet.id===(plant.sourcePacketId||plant.seedId));
  let action='Review plant care',reason='This uses the saved lifecycle stage and garden record.',nextAction='Open Plant Journey when you update the stage.',priority=35;
  if(['Seed Started','Germinating'].includes(stage)){action='Check germination and tray moisture';reason='Seeds that have started need even moisture, warmth, and light checks before they become seedlings.';nextAction='Mark as Seedling when true leaves are visible.';priority=72}
  else if(stage==='Seedling'){action='Prepare for potting up or hardening off';reason='Seedlings need stage-specific care before transplanting; outdoor weather should not be treated as watering.';nextAction='Pot up, begin hardening off, or schedule transplant when ready.';priority=76}
  else if(stage==='Potted Up'){action='Plan hardening off';reason='Potted-up starts usually need a gradual transition before outdoor transplanting.';nextAction='Begin hardening off during a calm window.';priority=68}
  else if(stage==='Hardening Off'){action='Continue hardening-off steps';reason='Hardening off is a time-sensitive transition between indoor protection and outdoor conditions.';nextAction='Complete the next hardening step or transplant when finished.';priority=80}
  else if(stage==='Transplanted'){action='Monitor transplant establishment';reason='Recent transplants are more sensitive to wind, heat, and uneven moisture than established plants.';nextAction='Mark as Established once new growth resumes.';priority=70}
  else if(['Established','Flowering','Fruiting'].includes(stage)){action=stage==='Established'?'Monitor watering and support':stage==='Flowering'?'Protect flowers and keep moisture steady':'Watch harvest timing and support';reason='Lifecycle stage changes what matters most: roots, flowers, fruit, support, and moisture.';nextAction=stage==='Fruiting'?'Record harvests when ready.':'Update the stage when the plant changes.';priority=55}
  else if(stage==='Harvesting'){action='Harvest and record yields';reason='Harvesting records help the garden learn what worked this season.';nextAction='Mark Complete when the plant is finished.';priority=64}
  const confidence=sourcePacket?{level:'High',scoreLabel:'4/5',reasons:['Plant stage is saved','Exact packet is connected',space?'Growing Space is known':null].filter(Boolean),missing:space?[]:['Growing Space is missing']}:{level:space?'Medium':'Low',scoreLabel:space?'3/5':'2/5',reasons:['Plant stage is saved',space?'Growing Space is known':null].filter(Boolean),missing:['No exact packet is connected',space?null:'Growing Space is missing'].filter(Boolean)};
  return{id:`lifecycle-${plant.id}`,plantId:plant.id,plantName:plant.name||plant.cropName||'Plant',cropId:plant.cropId||'',stage,spaceId:space?.id||'',spaceName:space?.name||'No Growing Space selected',sourcePacketId:sourcePacket?.id||'',sourcePacketName:sourcePacket?packetName(sourcePacket):'',action,reason,nextAction,dateWindow:formatGardenDateRange(todayKey(date),addDays(date,7)),recommendedDate:todayKey(date),priority,confidence,informationUsed:unique(['plant lifecycle stage',space?'growing space':null,sourcePacket?'seed packet':null,weatherFresh(weather)?'weather':'weather status'])};
 }).sort((a,b)=>b.priority-a.priority||a.plantName.localeCompare(b.plantName));
 return{rows,brief:rows.slice(0,3)};
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
 return{schemaVersion:2,generatedAt:new Date().toISOString(),date:todayKey(date),rows,queues,calendar:buildGardenCalendar(rows,date),lifecycle:buildLifecycleRecommendations({garden,weather,date}),nextAction:queues.today[0]||queues.week[0]||queues.planAhead[0]||queues.wait[0]||null,summary:{ownedPackets:rows.length,today:queues.today.length,week:queues.week.length,planAhead:queues.planAhead.length,wait:queues.wait.length}};
}
