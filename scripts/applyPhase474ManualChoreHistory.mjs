import{readFile,writeFile}from'node:fs/promises';

async function replaceOnce(path,old,next,label){
 let source=await readFile(path,'utf8');
 if(source.includes(next))return false;
 if(!source.includes(old))throw new Error(`${path}: expected source not found for ${label}`);
 source=source.replace(old,next);
 await writeFile(path,source);
 return true;
}

const appResolutionChanged=await replaceOnce(
 'src/App.jsx',
 "reminders:task.manual?(current.reminders||[]).map(reminder=>reminder.taskId===task.id?touchRecord({...reminder,enabled:false,status:status==='done'?'completed':normalizedStatus,completedAt:status==='done'?at:null},actor):reminder):current.reminders||[]",
 "reminders:task.manual?(current.reminders||[]).map(reminder=>reminder.taskId===task.id?touchRecord({...reminder,enabled:false,status:status==='done'?'completed':normalizedStatus,completedAt:at},actor):reminder):current.reminders||[]",
 'manual reminder resolution timestamp',
);

const appUndoChanged=await replaceOnce(
 'src/App.jsx',
 "const undoDaily=id=>{setDaily(current=>({...current,done:(current.done||[]).filter(item=>item.id!==id)}));showToast('Task status undone for today.')}",
 "const undoDaily=id=>{setDaily(current=>({...current,done:(current.done||[]).filter(item=>item.id!==id)}));setGarden(current=>({...current,reminders:(current.reminders||[]).map(reminder=>reminder.taskId===id?touchRecord({...reminder,enabled:true,status:'scheduled',completedAt:null},actor):reminder),taskHistory:(current.taskHistory||[]).map(entry=>entry.taskId===id&&entry.dueDate===dayKey()&&!entry.deletedAt?softDelete(entry,actor):entry)}));showToast('Task status undone for today.')}",
 'undo manual reminder resolution',
);

const yearRoundChanged=await replaceOnce(
 'src/yearRoundEngine.js',
 "function manualTasks(garden,date){return(garden.reminders||[]).filter(item=>!item.deletedAt&&item.enabled!==false).map(item=>task({id:item.taskId||`manual-${item.id}`,kind:'manual'",
 "function manualTasks(garden,date){const today=dateKey(date);return(garden.reminders||[]).filter(item=>!item.deletedAt&&(item.enabled!==false||Boolean(item.completedAt&&dateKey(item.completedAt)===today))).map(item=>task({id:item.taskId||`manual-${item.id}`,kind:'manual'",
 'same-day resolved manual chore history',
);

console.log(JSON.stringify({ok:true,appResolutionChanged,appUndoChanged,yearRoundChanged},null,2));
