import { cropCatalog, newId } from './data.js';

const DAY=86400000;
const DIRECT_SOW_IDS=new Set(['lettuce','spinach','kale','radish','peas','carrot','corn','green-bean','cucumber','zucchini','winter-squash','pumpkin','green-onion','cilantro','dill','parsley']);
const LARGE_CROP_IDS=new Set(['corn','cucumber','zucchini','winter-squash','pumpkin']);
const COOL_FALL_IDS=new Set(['lettuce','spinach','kale','radish','carrot','peas','cabbage','broccoli','cauliflower']);
const FALL_INDOOR_IDS=new Set(['cabbage','broccoli','cauliflower']);
const WARM_START_IDS=new Set(['bell-pepper','hot-pepper','tomato','onion','marigold','basil']);
const PLANTING_TASK_TYPES=new Set(['Start Seeds','Direct Sow','Transplant','Pot Up','Harden Off','Prepare Space','Install Support','Plan Succession','Thin Seedlings','Reserve Space']);
const INDOOR_TYPES=new Set(['indoor','basement','seed-tray','greenhouse','hydro']);
const OUTDOOR_TYPES=new Set(['bed','black-square-bed','white-oval-bed','in-ground','container','potato-grow-bag']);

const todayKey=()=>new Date().toISOString().slice(0,10);
const dateKey=value=>String(value||todayKey()).slice(0,10);
const addDays=(value,days)=>{const date=new Date(`${dateKey(value)}T12:00:00`);date.setDate(date.getDate()+days);return date.toISOString().slice(0,10)};
const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const packetKey=packet=>`${packet.exactPacket?'packet':'seed'}-${packet.id}`;
const decisionMap=garden=>new Map((garden.plantingDecisions||[]).filter(item=>!item.deletedAt).map(item=>[item.subjectKey,item]));
const firstNumber=value=>{const values=String(value||'').match(/\d+/g)?.map(Number)||[];return values.length?Math.max(...values):null};
const firstFrost=()=>{const now=new Date(`${todayKey()}T12:00:00`),frost=new Date(`${now.getFullYear()}-10-10T12:00:00`);if(frost<now)frost.setFullYear(frost.getFullYear()+1);return frost};

function inferCropId(record={}){
 if(record.cropId&&cropCatalog.some(crop=>crop.id===record.cropId))return record.cropId;
 const text=normalize(`${record.name||''} ${record.variety||''}`);
 if(/california wonder|bell pepper|sweet pepper/.test(text))return'bell-pepper';
 if(/jalapeno|serrano|cayenne|hot pepper|chili|chile/.test(text))return'hot-pepper';
 const match=cropCatalog.find(crop=>{const name=normalize(crop.name);return text===name||text.includes(name)||name.includes(text)});
 return match?.id||'';
}

function stockFor(record={}){
 const status=normalize(`${record.status||''} ${record.availability||''}`),blocked=Boolean(record.deletedAt||record.discarded||record.available===false||/discarded|unavailable|used up|empty/.test(status)),raw=record.quantity??record.seedsRemaining??record.amount,quantity=raw===''||raw===null||raw===undefined?null:Number(raw),reserved=Number(record.reservedQuantity??record.reserved??0)||0,available=quantity===null?null:Math.max(0,quantity-reserved);
 return{blocked,quantity,reserved,available};
}

export function seedInventory(garden={}){
 const exact=(garden.seedPackets||[]).map(packet=>({...packet,exactPacket:true})),legacy=(garden.seeds||[]).map(seed=>({...seed,exactPacket:false})),rows=[...exact,...legacy].map(record=>{const stock=stockFor(record);return{...record,cropId:inferCropId(record),quantityAvailable:stock.available,blocked:stock.blocked||stock.available===0}}).filter(record=>!record.blocked),exactKeys=new Set(rows.filter(record=>record.exactPacket).map(record=>`${record.cropId||normalize(record.name)}|${normalize(record.variety)}`));
 return rows.filter(record=>record.exactPacket||!exactKeys.has(`${record.cropId||normalize(record.name)}|${normalize(record.variety)}`));
}

function modeFrom(packet,recommendation){
 const notes=normalize(packet.seedStartingGuidance||packet.startGuidance||packet.notes);
 if(/direct sow|sow outdoors|plant outdoors/.test(notes))return'Direct sow';
 if(/start indoors|sow indoors|indoor start|transplant/.test(notes))return'Start indoors';
 const status=normalize(recommendation?.status);
 if(status.includes('start seeds indoors'))return'Start indoors';
 if(status.includes('grow indoors'))return'Grow indoors';
 if(status.includes('plant or care for outdoors')&&DIRECT_SOW_IDS.has(packet.cropId))return'Direct sow';
 if(status.includes('plant or care for outdoors')&&!DIRECT_SOW_IDS.has(packet.cropId))return'Transplant';
 return'';
}

function isStrongNow(mode,recommendation){
 const status=normalize(recommendation?.status);
 if(mode==='Start indoors')return status.includes('start seeds indoors');
 if(mode==='Grow indoors')return status.includes('grow indoors');
 if(mode==='Direct sow'||mode==='Transplant')return status.includes('plant or care for outdoors');
 return false;
}

function maturityFit(packet,crop,mode){
 if(['Start indoors','Grow indoors'].includes(mode))return{fits:true,reason:''};
 const maturity=firstNumber(packet?.daysToMaturity)||firstNumber(crop?.harvest);
 if(!maturity)return{fits:true,reason:''};
 const remaining=Math.floor((firstFrost().getTime()-new Date(`${todayKey()}T12:00:00`).getTime())/DAY),buffer=mode==='Transplant'?7:14;
 if(maturity>remaining-buffer)return{fits:false,reason:`About ${maturity} days are needed, but only about ${remaining} days remain before the working first-frost date.`};
 return{fits:true,reason:''};
}

function activeCount(space,garden){return(garden.plants||[]).filter(plant=>!plant.deletedAt&&!plant.archived&&plant.spaceId===space.id).reduce((sum,plant)=>sum+(Number(plant.quantity)||1),0)}

function suitableSpaces(garden,crop,mode){
 return(garden.spaces||[]).filter(space=>!space.hidden&&!space.deletedAt).map(space=>{
  const count=activeCount(space,garden),capacity=Number(space.capacity)||0;if(capacity&&count>=capacity)return null;
  const indoor=['Start indoors','Grow indoors'].includes(mode);if(indoor&&!INDOOR_TYPES.has(space.type))return null;if(!indoor&&!OUTDOOR_TYPES.has(space.type))return null;
  let score=100-count*4;const warnings=[],sun=normalize(space.sunExposure);
  if(crop?.sun?.includes('8+')&&/shade|part shade/.test(sun)){score-=35;warnings.push('Sun exposure may be too low.')}
  if(space.type==='container'&&LARGE_CROP_IDS.has(crop?.id)){score-=30;warnings.push('This crop may outgrow a typical container.')}
  if(space.type==='container'&&!space.size)warnings.push('Container size is not recorded.');
  if(/poor/.test(normalize(space.drainageQuality)))warnings.push('Drainage is recorded as poor.');
  if(space.expectedAvailableDate&&space.expectedAvailableDate>todayKey()){score-=20;warnings.push(`Expected available ${space.expectedAvailableDate}.`)}
  return{...space,score,warnings,activeCount:count};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}

function packetAlreadyStarted(garden,packet){return(garden.plants||[]).some(plant=>!plant.deletedAt&&!plant.archived&&(plant.seedId===packet.id||plant.sourcePacketId===packet.id||(packet.cropId&&plant.cropId===packet.cropId&&normalize(plant.variety)===normalize(packet.variety))))}
function cropAlreadyPlanned(garden,cropId){return(garden.plants||[]).some(plant=>!plant.deletedAt&&!plant.archived&&plant.cropId===cropId)||(garden.yearPlan?.crops||[]).some(item=>item.cropId===cropId&&['definitely','maybe'].includes(item.status))}

function recommendationCard(packet,recommendation,garden,weather){
 const crop=cropCatalog.find(item=>item.id===packet.cropId)||recommendation||null,mode=modeFrom(packet,recommendation),spaces=suitableSpaces(garden,crop,mode),age=packet.packetYear?new Date().getFullYear()-Number(packet.packetYear):null,oldPacket=age!==null&&age>=4,subjectKey=packetKey(packet),decision=decisionMap(garden).get(subjectKey),uncertainty=[],fit=maturityFit(packet,crop,mode);
 if(!packet.notes&&!packet.seedStartingGuidance)uncertainty.push('Exact packet starting directions are not recorded; general crop timing is being used.');
 if(!packet.daysToMaturity)uncertainty.push('Days to maturity are not recorded.');
 if(!spaces.length)uncertainty.push('No clearly suitable open Growing Space is recorded.');
 if(!fit.fits)uncertainty.push(fit.reason);
 if(weather?.isStormingNow)uncertainty.push('Current storms may delay outdoor work.');else if(Number(weather?.high)>=92)uncertainty.push('Current heat may make transplanting risky.');else if(Number(weather?.low)<=36)uncertainty.push('Cold conditions may delay outdoor planting.');
 const statusLabel=decision?.decision==='later'?'Saved Idea':packet.exactPacket?'In Seed Inventory':'Another Owned Variety Available';
 return{id:subjectKey,subjectKey,source:packet.exactPacket?'owned-packet':'owned-seed-record',owned:true,packet,crop,cropId:packet.cropId,cropName:packet.name||crop?.name||'Saved seed',variety:packet.variety||crop?.variety||'',brand:packet.brand||'',title:[packet.brand,packet.variety||packet.name].filter(Boolean).join(' ')||packet.name||'Saved seed',quantity:packet.quantityAvailable,mode,timing:packet.plantingWindow||packet.startingWindow||recommendation?.timing||recommendation?.status||'Timing needs confirmation',reason:packet.notes||recommendation?.note||crop?.summary||'This seed is already owned.',uncertainty:uncertainty.join(' ')||'Exact packet and saved garden information were used.',spaces,spaceWarning:spaces.length?'':'No clearly suitable saved Growing Space is available.',oldPacket,germinationTest:oldPacket,decision,statusLabel,strongNow:Boolean(mode)&&isStrongNow(mode,recommendation)&&!oldPacket&&fit.fits};
}

function purchaseCard(item,garden,weather,date='',windowLabel='Current window'){
 const crop=cropCatalog.find(c=>c.id===item.id)||item,mode=modeFrom({cropId:item.id},item)||nextWindow(item.id).mode,subjectKey=`catalog-${item.id}`,decision=decisionMap(garden).get(subjectKey),spaces=suitableSpaces(garden,crop,mode),fit=maturityFit({},crop,mode),uncertainty=['General crop guidance is being used because no exact owned packet is recorded.'];
 if(!spaces.length)uncertainty.push('No clearly suitable open Growing Space is recorded.');
 if(!fit.fits)uncertainty.push(fit.reason);
 if(weather?.isStormingNow)uncertainty.push('Current storms may delay outdoor work.');
 return{id:subjectKey,subjectKey,source:'purchase',owned:false,crop,cropId:item.id,cropName:item.name,variety:'',brand:'',title:item.name,quantity:null,mode,timing:date?`${date}${windowLabel?` · ${windowLabel}`:''}`:item.timing||item.status,reason:item.note||crop.summary,uncertainty:uncertainty.join(' '),spaces,spaceWarning:spaces.length?'':'No clearly suitable saved Growing Space is available.',decision,statusLabel:decision?.decision==='later'?'Saved Idea':cropAlreadyPlanned(garden,item.id)?'Already Planned':'Seeds Needed',strongNow:Boolean(mode)&&isStrongNow(mode,item)&&fit.fits};
}

export function buildGrowNowRecommendations({garden,recommendations=[],weather=null}){
 const byId=new Map(recommendations.map(item=>[item.id,item])),decisions=decisionMap(garden),inventory=seedInventory(garden),owned=inventory.map(packet=>recommendationCard(packet,byId.get(packet.cropId),garden,weather)).filter(card=>card.strongNow&&!packetAlreadyStarted(garden,card.packet)&&decisions.get(card.subjectKey)?.decision!=='not-this-season'&&!(decisions.get(card.subjectKey)?.decision==='later'&&decisions.get(card.subjectKey)?.dueDate>todayKey())).sort((a,b)=>Number(b.packet.exactPacket)-Number(a.packet.exactPacket)||Number(b.quantity||0)-Number(a.quantity||0)),ownedIds=new Set(inventory.map(packet=>packet.cropId).filter(Boolean)),purchases=recommendations.filter(item=>!ownedIds.has(item.id)&&!cropAlreadyPlanned(garden,item.id)).map(item=>purchaseCard(item,garden,weather)).filter(card=>card.strongNow&&card.decision?.decision!=='not-this-season'&&!(card.decision?.decision==='later'&&card.decision.dueDate>todayKey())).sort((a,b)=>(firstNumber(a.crop?.harvest)||999)-(firstNumber(b.crop?.harvest)||999));
 const exact=owned.find(card=>card.packet.exactPacket),sameCrop=exact&&owned.find(card=>card.id!==exact.id&&card.cropId===exact.cropId),another=owned.find(card=>card.id!==exact?.id&&card.id!==sameCrop?.id),purchase=purchases[0],next=buildPlanAheadRecommendations({garden,recommendations,weather}).find(card=>card.date>todayKey()),cards=[];
 [exact,sameCrop,another,purchase,next].filter(Boolean).forEach(card=>{if(cards.length<4&&!cards.some(item=>item.subjectKey===card.subjectKey))cards.push(card)});
 [...owned,...purchases].forEach(card=>{if(cards.length<4&&!cards.some(item=>item.subjectKey===card.subjectKey))cards.push(card)});
 return{cards:cards.slice(0,4),owned,purchases,next:next||null};
}

function nextWindow(cropId){
 const year=new Date().getFullYear(),today=todayKey(),range=(sm,sd,em,ed,label,reason,mode)=>{let y=year,start=`${y}-${String(sm).padStart(2,'0')}-${String(sd).padStart(2,'0')}`,end=`${y}-${String(em).padStart(2,'0')}-${String(ed).padStart(2,'0')}`;if(end<today){y+=1;start=`${y}-${String(sm).padStart(2,'0')}-${String(sd).padStart(2,'0')}`;end=`${y}-${String(em).padStart(2,'0')}-${String(ed).padStart(2,'0')}`}return{start,end,label,reason,mode}};
 if(COOL_FALL_IDS.has(cropId))return range(8,1,9,15,'Estimated fall planting window','This cool-season crop may fit Green Bay’s late-summer or early-fall window.',FALL_INDOOR_IDS.has(cropId)?'Start indoors':'Direct sow');
 if(cropId==='garlic')return range(9,20,10,25,'Estimated fall planting window','Hardneck garlic is generally planted before the ground freezes.','Direct sow');
 if(WARM_START_IDS.has(cropId))return range(2,15,4,1,'Estimated indoor-start window','This long-season crop usually needs an indoor head start before Green Bay’s outdoor season.','Start indoors');
 return range(5,15,6,15,'Estimated outdoor planting window','General Green Bay seasonal guidance is being used because an exact packet window is not recorded.',DIRECT_SOW_IDS.has(cropId)?'Direct sow':'Transplant');
}

export function buildPlanAheadRecommendations({garden,recommendations=[],weather=null}){
 const byId=new Map(recommendations.map(item=>[item.id,item])),decisions=decisionMap(garden),items=[],inventory=seedInventory(garden),ownedIds=new Set(inventory.map(packet=>packet.cropId).filter(Boolean));
 inventory.forEach(packet=>{
  const card=recommendationCard(packet,byId.get(packet.cropId),garden,weather),decision=decisions.get(card.subjectKey);if(decision?.decision==='not-this-season'||packetAlreadyStarted(garden,packet))return;
  if(decision?.decision==='later'&&decision.dueDate){items.push({...card,statusLabel:'Saved Idea',date:decision.dueDate,windowLabel:'Saved Idea',timing:`Scheduled for ${decision.dueDate}`,reason:decision.note||card.reason});return}
  if(card.strongNow)return;
  if(card.oldPacket&&(garden.reminders||[]).some(reminder=>!reminder.deletedAt&&reminder.enabled!==false&&reminder.title===`Test germination: ${card.title}`))return;
  if(card.oldPacket){items.push({...card,date:addDays(todayKey(),7),mode:'Germination Test',windowLabel:'Suggested',timing:'Within the next week',reason:'This owned packet is old enough that a germination test is recommended before relying on it.'});return}
  const window=nextWindow(packet.cropId);items.push({...card,date:window.start,windowEnd:window.end,windowLabel:'Estimated',mode:window.mode,timing:`${window.start}–${window.end}`,reason:window.reason});
 });
 recommendations.filter(item=>!ownedIds.has(item.id)&&!cropAlreadyPlanned(garden,item.id)).forEach(item=>{
  const subjectKey=`catalog-${item.id}`,decision=decisions.get(subjectKey);if(decision?.decision==='not-this-season')return;
  const window=nextWindow(item.id),date=decision?.decision==='later'&&decision.dueDate?decision.dueDate:window.start,card=purchaseCard(item,garden,weather,date,window.label);
  items.push({...card,date,windowEnd:window.end,windowLabel:decision?.decision==='later'?'Saved Idea':'Estimated',statusLabel:decision?.decision==='later'?'Saved Idea':'Seeds Needed',mode:window.mode,timing:decision?.decision==='later'?`Scheduled for ${date}`:`${window.start}–${window.end}`,reason:decision?.note||window.reason});
 });
 return items.sort((a,b)=>a.date.localeCompare(b.date)||Number(b.owned)-Number(a.owned)).slice(0,10);
}

export function plantingActionLabel(item,plant){
 const stage=String(plant?.stage||'');
 if(item.task?.taskType==='Harden Off'||/hardening/i.test(`${item.type||''} ${item.title||''}`))return'Complete Today’s Step';
 if(item.type==='succession')return'Start Next Batch';
 if(item.type==='transplant')return'Mark as Transplanted';
 if(item.type==='pot-up')return'Mark as Potted Up';
 if(item.type==='space-prep')return'Prepare Space';
 if(item.type==='support')return'Install Support';
 if(item.type==='stage'){
  if(stage==='Planned')return'Mark Seed Purchased';if(stage==='Seed Purchased')return'Start Seeds';if(stage==='Seed Started')return'Mark Germinating';if(stage==='Germinating')return'Mark Seedling';if(stage==='Seedling')return'Mark as Potted Up';if(stage==='Potted Up')return'Begin Hardening Off';if(stage==='Hardening Off')return'Complete Today’s Step';
 }
 return'Open Plant';
}

export function plantingItems(timeline=[],{tasks=[],garden={},completions=[]}={}){
 const decisions=decisionMap(garden),completedIds=new Set((completions||[]).map(item=>typeof item==='string'?item:item.id)),items=[];
 timeline.filter(item=>!item.historical&&!item.informational&&['stage','succession','planting','transplant','hardening','pot-up','space-prep','support'].includes(item.type)).forEach(item=>{const decision=decisions.get(item.id);if(decision?.decision==='not-this-season')return;items.push({...item,date:decision?.decision==='later'&&decision.dueDate?decision.dueDate:item.date,decision,confirmed:Boolean(decision?.decision==='later')})});
 tasks.filter(task=>!completedIds.has(task.id)&&!task.weatherDriven&&(PLANTING_TASK_TYPES.has(task.taskType)||task.kind==='seasonalGuide'||task.kind==='setupPlant')).forEach(task=>{const subjectKey=`task-${task.id}`,decision=decisions.get(subjectKey);if(decision?.decision==='not-this-season')return;items.push({id:subjectKey,subjectKey,type:'task',task,plantId:task.plant?.id||'',date:decision?.decision==='later'&&decision.dueDate?decision.dueDate:task.dueDate,title:task.title,detail:task.subtitle||task.reason||'',reason:task.reason||'',priority:task.priority||50,confirmed:Boolean(task.manual||decision?.decision==='later'),estimated:!task.manual,decision})});
 const unique=new Map();items.forEach(item=>{const plant=(garden.plants||[]).find(entry=>entry.id===item.plantId),kind=item.type==='task'?item.task?.taskType:item.type==='stage'&&plant?.stage==='Hardening Off'?'Harden Off':item.type,key=`${item.plantId||item.id}|${normalize(kind)}|${dateKey(item.date)}`,current=unique.get(key);if(!current||item.type==='task'||Number(item.priority)>Number(current.priority))unique.set(key,item)});
 return[...unique.values()].sort((a,b)=>dateKey(a.date).localeCompare(dateKey(b.date))||Number(b.priority||0)-Number(a.priority||0));
}

export function recentPlantUpdates(timeline=[]){return timeline.filter(item=>item.type==='lifecycle'||item.historical||item.informational).sort((a,b)=>String(b.date).localeCompare(String(a.date)))}
export function createPlantingDecision({subjectKey,decision,dueDate='',note=''},actor='System'){const now=new Date().toISOString();return{id:newId('planting-decision'),subjectKey,decision,dueDate:dueDate||todayKey(),note,actor,at:now,createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null}}
