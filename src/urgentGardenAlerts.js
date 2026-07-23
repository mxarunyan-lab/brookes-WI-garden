const NON_URGENT_KINDS=new Set(['setup','setupPlant','seasonalGuide','navigate']);
const NON_URGENT_IDS=/^(setup-|fall-planting-review|garlic-fall-window|winter-plan-review|early-seed-start-review)/i;
const NON_URGENT_TEXT=/(add what is actually growing|add (your|a) first plant|match .+ to a crop|choose fall planting|fall planting opportunities|review the next garden season|check early indoor seed-starting|explore|complete (your )?setup|garden profile)/i;
const WEATHER_DANGER=/(frost|freeze|heat|storm|tornado|wind|hail|flood|heavy rain|drainage|overheat|severe weather)/i;
const PLANT_DANGER=/(disease|pest|damage|protect|emergency|wilting|water now|drying|transplant stress|hardening delay)/i;

const localDateKey=value=>{
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}/.test(value))return value.slice(0,10);
 const date=value instanceof Date?value:new Date(value||Date.now());
 if(Number.isNaN(date.getTime()))return new Date().toISOString().slice(0,10);
 return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

export function isUrgentGardenItem(item,{today=new Date()}={}){
 if(!item||item.informational)return false;
 const kind=String(item.kind||''),id=String(item.id||''),text=[item.title,item.subtitle,item.reason,item.taskType,item.action].filter(Boolean).join(' ');
 if(NON_URGENT_KINDS.has(kind)||NON_URGENT_IDS.test(id)||NON_URGENT_TEXT.test(text))return false;
 if(item.dueDate&&localDateKey(item.dueDate)>localDateKey(today))return false;
 const priority=Number(item.priority||0),label=String(item.priorityLabel||item.severity||'').toLowerCase();
 const explicit=item.urgent===true||item.requiresImmediateAction===true||label==='urgent';
 if(kind==='weather')return explicit||priority>=90||WEATHER_DANGER.test(text)&&priority>=85;
 if(kind==='greenhouse')return explicit||priority>=90;
 if(kind==='soil')return explicit||priority>=90&&/(water|moisture|dry)/i.test(text);
 if(kind==='manual')return explicit||priority>=90;
 if(['problem','issue','plantProblem','plant-health'].includes(kind))return explicit||priority>=85;
 if(kind==='plantDetail'&&priority>=90&&(item.weatherAdjusted||WEATHER_DANGER.test(text)||PLANT_DANGER.test(text)))return true;
 return explicit&&priority>=80;
}

export function getUrgentGardenAlerts(items=[],options={}){
 const unique=new Map();
 for(const item of items||[]){
  if(!isUrgentGardenItem(item,options))continue;
  const key=item.id||`${item.kind||'alert'}:${item.title||''}`;
  const current=unique.get(key);
  if(!current||Number(item.priority||0)>Number(current.priority||0))unique.set(key,item);
 }
 return[...unique.values()].sort((a,b)=>Number(b.priority||0)-Number(a.priority||0)||String(a.dueDate||'').localeCompare(String(b.dueDate||''))||String(a.title||'').localeCompare(String(b.title||'')));
}

export function formatUrgentBadge(count){const value=Math.max(0,Number(count)||0);return value===0?null:value>9?'9+':String(value)}
export function isGardenSetupIncomplete(garden){return!(garden?.plants||[]).some(plant=>!plant?.deletedAt&&!plant?.archived&&!['finished','removed','failed'].includes(String(plant?.stage||'').toLowerCase()))}
export function getSetupTask(items=[]){return(items||[]).find(item=>['setup','setupPlant'].includes(item?.kind)||/^setup-/i.test(String(item?.id||'')))||null}
export function getSeasonalIdea(items=[]){return(items||[]).find(item=>item?.kind==='seasonalGuide'||item?.kind==='navigate'&&/(season|plant|seed|garlic|fall|winter)/i.test([item.title,item.subtitle,item.reason].filter(Boolean).join(' ')))||null}
