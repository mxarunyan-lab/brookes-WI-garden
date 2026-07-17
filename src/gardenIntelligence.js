import{newId}from'./data.js';

export const PLANT_LIFECYCLE_STAGES=['Planned','Seed Purchased','Seed Started','Germinating','Seedling','Potted Up','Hardening Off','Transplanted','Established','Flowering','Fruiting','Harvesting','Dormant','Finished','Failed','Removed'];

export const GROWING_SPACE_TYPES=[
 {value:'black-square-bed',label:'Black Square Raised Bed'},{value:'white-oval-bed',label:'White Rounded Raised Bed'},{value:'bed',label:'Other Raised Bed'},{value:'in-ground',label:'In Ground Bed'},{value:'container',label:'Container Planter'},{value:'potato-grow-bag',label:'Potato Grow Bag'},{value:'seed-tray',label:'Seed Tray'},{value:'indoor',label:'Indoor Plant Area'},{value:'basement',label:'Basement Growing Area'},{value:'greenhouse',label:'Greenhouse Space'},{value:'hydro',label:'Hydroponics'},
];

const LEGACY_STAGE_MAP={Seed:'Seed Started',Growing:'Established',Producing:'Fruiting','Ready to harvest':'Harvesting',Overwintering:'Dormant',Failed:'Failed'};

export function normalizeLifecycleStage(stage){if(PLANT_LIFECYCLE_STAGES.includes(stage))return stage;return LEGACY_STAGE_MAP[stage]||'Established'}

export function createStageHistoryEntry({stage,enteredAt,completedAt='',notes='',note='',photos=[],actor='System',source='User update',classification='Confirmed',importedHistory=false,estimated=false,confirmed=true}){
 return{id:newId('stage'),stage:normalizeLifecycleStage(stage),enteredAt:enteredAt||new Date().toISOString(),completedAt:completedAt||'',notes:String(notes||note||'').trim(),photos:Array.isArray(photos)?photos:[],actor,source,classification:importedHistory?'Imported History':classification,importedHistory:Boolean(importedHistory),estimated:Boolean(estimated),confirmed:confirmed!==false};
}

export function normalizeStageHistory(plant,actor='System'){
 const existing=Array.isArray(plant.stageHistory)?plant.stageHistory:[];
 if(existing.length)return existing.map(entry=>{const imported=Boolean(entry.importedHistory||/imported/i.test(entry.notes||entry.note||''));return{...entry,id:entry.id||newId('stage'),stage:normalizeLifecycleStage(entry.stage),enteredAt:entry.enteredAt||entry.dateEntered||entry.at||plant.stageUpdatedAt||plant.plantedAt||new Date().toISOString(),completedAt:entry.completedAt||'',notes:entry.notes||entry.note||'',photos:Array.isArray(entry.photos)?entry.photos:[],actor:entry.actor||actor,source:entry.source||(imported?'Existing plant record':'User update'),classification:entry.classification||(imported?'Imported History':entry.estimated?'Estimated':'Confirmed'),importedHistory:imported,estimated:Boolean(entry.estimated),confirmed:entry.confirmed!==false&&!entry.estimated}}).sort((a,b)=>String(a.enteredAt).localeCompare(String(b.enteredAt)));
 return[createStageHistoryEntry({stage:plant.stage,enteredAt:plant.stageUpdatedAt||plant.plantedAt||plant.createdAt,notes:'Imported from the existing plant record.',actor,source:'Existing plant record',importedHistory:true,confirmed:true})];
}

export function normalizeSpaceIntelligence(space){return{soilType:'',drainageQuality:'',mulchStatus:'',irrigationMethod:'',sunExposure:'',size:'',material:'',drainageHoles:false,selfWateringReservoir:false,bagSize:'',seedPotatoesPlanted:'',hillingStage:'',lastHilledDate:'',expectedAvailableDate:'',...space}}

export function buildPlantJourneyEvents({plant,activity=[],harvests=[],problems=[]}){
 const stageEvents=normalizeStageHistory(plant).map(entry=>({id:entry.id,type:'stage',at:entry.enteredAt,title:entry.stage,detail:entry.notes||'Lifecycle stage entered.',photos:entry.photos||[],classification:entry.classification,source:entry.source,completedAt:entry.completedAt,completed:true}));
 const linkedActivity=activity.filter(entry=>entry.plantId===plant.id).map(entry=>({id:entry.id,type:entry.type||'task',at:entry.at,title:entry.title,detail:entry.detail||'',completed:true,classification:'Confirmed',source:'Garden activity'}));
 const harvestEvents=harvests.filter(entry=>entry.plantId===plant.id).map(entry=>({id:entry.id,type:'harvest',at:entry.at,title:'Harvest recorded',detail:`${entry.amount||''} ${entry.unit||''}${entry.note?` • ${entry.note}`:''}`.trim(),completed:true,classification:'Confirmed',source:'Harvest log'}));
 const problemEvents=problems.filter(entry=>entry.plantId===plant.id).map(entry=>({id:entry.id,type:'problem',at:entry.at,title:entry.type||'Plant issue recorded',detail:entry.note||'',completed:entry.status==='resolved',classification:'Confirmed',source:'Problem record'}));
 return[...stageEvents,...linkedActivity,...harvestEvents,...problemEvents].filter(entry=>entry.at).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
}
