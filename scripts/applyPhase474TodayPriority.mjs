import{readFile,writeFile}from'node:fs/promises';
const path='src/WorkspaceScreens.jsx';let source=await readFile(path,'utf8'),changed=false;
const old="seedAction=seedIntelligence.queues.today[0]||seedIntelligence.queues.week[0],visibleTasks=activeTasks.filter(task=>task!==announcement).slice(0,2),rows=visibleTasks.map";
const next="seedAction=seedIntelligence.queues.today[0]||seedIntelligence.queues.week[0],priorityTasks=activeTasks.filter(task=>task!==announcement),manualDue=priorityTasks.find(task=>task.manual),visibleTasks=manualDue?[manualDue,...priorityTasks.filter(task=>task!==manualDue)].slice(0,2):priorityTasks.slice(0,2),rows=visibleTasks.map";
if(!source.includes(next)){if(!source.includes(old))throw new Error('Today task-priority selection was not found.');source=source.replace(old,next);changed=true;await writeFile(path,source)}
console.log(JSON.stringify({ok:true,changed}));
