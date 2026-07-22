import test from'node:test';
import assert from'node:assert/strict';
import{buildTaskBoard}from'../src/taskBoard.js';
import{buildYearRoundTasks}from'../src/yearRoundEngine.js';

const date=new Date('2026-07-22T12:00:00-05:00');
const baseGarden={
 spaces:[],plants:[],seedPackets:[],vacationPlans:[],hardeningPlans:[],
 reminders:[
  {id:'reminder-active',taskId:'manual-active',title:'Active manual chore',taskType:'Fertilize',priority:60,dueDate:'2026-07-22',enabled:true,status:'scheduled',deletedAt:null},
  {id:'reminder-today',taskId:'manual-today',title:'Completed today',taskType:'Fertilize',priority:60,dueDate:'2026-07-22',enabled:false,status:'completed',completedAt:'2026-07-22T14:00:00.000Z',deletedAt:null},
  {id:'reminder-old',taskId:'manual-old',title:'Completed yesterday',taskType:'Fertilize',priority:60,dueDate:'2026-07-21',enabled:false,status:'completed',completedAt:'2026-07-21T14:00:00.000Z',deletedAt:null},
 ],
};

test('same-day resolved manual chores remain available to task history',()=>{
 const tasks=buildYearRoundTasks({garden:baseGarden,weather:null,date});
 assert.ok(tasks.some(task=>task.id==='manual-active'));
 assert.ok(tasks.some(task=>task.id==='manual-today'));
 assert.equal(tasks.some(task=>task.id==='manual-old'),false);

 const board=buildTaskBoard({
  tasks,
  completions:[{id:'manual-today',status:'done',actor:'Archie',at:'2026-07-22T14:00:00.000Z'}],
  today:date,
 });
 assert.ok(board.completed.some(task=>task.id==='manual-today'));
 assert.equal(board.active.some(task=>task.id==='manual-today'),false);
 assert.ok(board.active.some(task=>task.id==='manual-active'));
});
