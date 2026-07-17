const localDateKey=value=>{const d=value?new Date(`${String(value).slice(0,10)}T12:00:00`):new Date();return Number.isNaN(d.getTime())?new Date().toISOString().slice(0,10):d.toISOString().slice(0,10)};

const INDOOR_TYPES=new Set(['indoor','basement','hydro','seed-tray']);
const GREENHOUSE_TYPES=new Set(['greenhouse']);

export function taskArea(task){
 const type=task.space?.type||task.plant?.spaceType||'';
 if(task.kind==='greenhouse'||GREENHOUSE_TYPES.has(type))return'Greenhouse';
 if(INDOOR_TYPES.has(type)||task.target==='indoor')return'Indoor';
 return'Outdoor';
}

export function completionFor(completions,id){return(completions||[]).find(item=>(typeof item==='string'?item:item.id)===id)||null}

export function uniqueTasks(tasks=[]){
 const map=new Map();
 tasks.forEach(task=>{
  if(!task?.id||task.informational)return;
  const current=map.get(task.id);
  if(!current||Number(task.priority||0)>Number(current.priority||0))map.set(task.id,task);
 });
 return [...map.values()];
}

export function buildTaskBoard({tasks=[],completions=[],filter='All',today=new Date()}={}){
 const todayKey=localDateKey(today);
 const completed=[],active=[];
 uniqueTasks(tasks).forEach(task=>{
  const completion=completionFor(completions,task.id);
  if(completion)completed.push({...task,completion});else active.push(task);
 });
 const matches=task=>filter==='All'||taskArea(task)===filter;
 const visible=active.filter(matches);
 const dueToday=visible.filter(task=>!task.dueDate||task.dueDate===todayKey);
 const overdue=visible.filter(task=>task.dueDate&&task.dueDate<todayKey);
 const upcoming=visible.filter(task=>task.dueDate&&task.dueDate>todayKey);
 const urgent=visible.filter(task=>(Number(task.priority||0)>=90||task.priorityLabel==='Urgent')&&(!task.dueDate||task.dueDate<=todayKey));
 const weather=visible.filter(task=>task.weatherDriven&&(!task.dueDate||task.dueDate<=todayKey));
 const needsAttention=uniqueTasks([...dueToday,...overdue]);
 return{
  todayKey,filter,active:visible,completed:completed.filter(matches),needsAttention,
  counts:{needsAttention:needsAttention.length,urgent:urgent.length,dueToday:dueToday.length,overdue:overdue.length,weather:weather.length,upcoming:upcoming.length},
  sections:{urgent,dueToday,overdue,weather,upcoming},
 };
}

export function filterEmptyMessage(filter){
 if(filter==='Outdoor')return'No outdoor chores need attention right now.';
 if(filter==='Indoor')return'No indoor chores need attention right now.';
 if(filter==='Greenhouse')return'No greenhouse chores need attention right now.';
 return'All caught up for today.';
}
