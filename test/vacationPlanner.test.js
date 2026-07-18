import test from'node:test';
import assert from'node:assert/strict';
import{buildVacationPlan,dedupeVacationTasks,linkExistingGardenTasks,refreshVacationPlan,vacationPlanNeedsReview,vacationTasksForBoard}from'../src/vacationPlanner.js';

const baseGarden=()=>({profile:{gardenerName:'Brooke'},spaces:[{id:'pot',name:'Porch Tomato Containers',type:'container',capacity:3},{id:'bed',name:'Raised Bed',type:'bed',capacity:12},{id:'greenhouse',name:'Greenhouse',type:'greenhouse',capacity:20}],plants:[{id:'tomato',name:'Porch Tomato',cropId:'tomato',spaceId:'pot',stage:'Fruiting',lastWatered:null},{id:'pepper',name:'Pepper Seedling',cropId:'bell-pepper',spaceId:'greenhouse',stage:'Seedling'}],reminders:[],taskHistory:[],vacationPlans:[]});
const weather=overrides=>({fetchedAt:'2026-07-18T10:00:00Z',recentRain24h:0,high:82,low:62,wind:8,rainChance:20,forecasts:[],...overrides});

test('weekend trip creates specific before and after actions',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-22',caretakerAvailable:false});
 assert.ok(plan.tasks.some(row=>row.section==='before'&&row.targetId==='pot'));
 assert.ok(plan.tasks.some(row=>row.section==='after'&&row.action==='Post-trip garden inspection'));
 assert.equal(plan.duration,3);
});

test('two-week trip with caretaker creates dated during-trip instructions',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather(),departureDate:'2026-07-20',returnDate:'2026-08-03',caretakerAvailable:true,caretakerName:'Kelli'});
 const during=plan.tasks.filter(row=>row.section==='during');
 assert.ok(during.length>=4);
 assert.ok(during.every(row=>row.whatToCheck&&row.whatNotToDo&&row.weatherException));
});

test('no caretaker does not create caretaker-only work',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather(),departureDate:'2026-07-20',returnDate:'2026-08-03',caretakerAvailable:false});
 assert.equal(plan.tasks.some(row=>/caretaker/i.test(row.action)),false);
});

test('recent observed rain changes exposed-bed instruction but not protected greenhouse care',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather({recentRain24h:.6}),departureDate:'2026-07-20',returnDate:'2026-07-25',caretakerAvailable:true});
 assert.match(plan.tasks.find(row=>row.targetId==='bed'&&row.section==='before').instruction,/Recent observed rain/);
 assert.match(plan.tasks.find(row=>row.targetId==='greenhouse'&&row.section==='before').whatNotToDo,/outdoor rainfall/);
});

test('heat wave increases container and greenhouse urgency',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather({high:94}),departureDate:'2026-07-20',returnDate:'2026-07-25',caretakerAvailable:true});
 assert.equal(plan.tasks.find(row=>row.targetId==='greenhouse'&&row.section==='before').urgency,'Urgent');
 assert.equal(plan.tasks.find(row=>row.targetId==='pot'&&row.section==='before').urgency,'High');
});

test('frost risk and storm risk create preparation actions',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather({low:34,wind:31}),departureDate:'2026-09-20',returnDate:'2026-09-24',caretakerAvailable:false});
 assert.ok(plan.tasks.some(row=>row.action==='Prepare frost protection'));
 assert.ok(plan.tasks.some(row=>row.action==='Secure garden before wind'));
});

test('forecast rain remains an exception rather than completed watering',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather({rainChance:90}),departureDate:'2026-07-20',returnDate:'2026-07-24',caretakerAvailable:true});
 const bed=plan.tasks.find(row=>row.targetId==='bed'&&row.section==='before');
 assert.match(bed.whatNotToDo,/forecast rain/i);
 assert.equal(bed.status,'open');
});

test('matching existing task is linked and not duplicated on the Chore Board',()=>{
 const garden=baseGarden(),candidate=buildVacationPlan({garden,weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-22',caretakerAvailable:false}),target=candidate.tasks.find(row=>row.targetId==='pot'&&row.section==='before');
 garden.reminders=[{id:'existing',taskId:'existing-task',taskType:target.taskType,title:'Existing soil check',spaceId:'pot',dueDate:target.dueDate,status:'open'}];
 const plan=buildVacationPlan({garden,weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-22',caretakerAvailable:false});
 const linked=plan.tasks.find(row=>row.targetId==='pot'&&row.section==='before');
 assert.equal(linked.reusedExistingTask,true);
 assert.equal(linked.linkedTaskId,'existing-task');
 assert.equal(vacationTasksForBoard({...garden,vacationPlans:[plan]}).some(row=>row.id===linked.id),false);
});

test('completed existing task completes matching vacation instruction',()=>{
 const garden=baseGarden(),candidate=buildVacationPlan({garden,weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-22'}),target=candidate.tasks.find(row=>row.targetId==='pot'&&row.section==='before');
 garden.taskHistory=[{id:'history',taskId:'old',taskType:target.taskType,title:'Done',spaceId:'pot',dueDate:target.dueDate,status:'done',at:'2026-07-19T18:00:00Z'}];
 const linked=linkExistingGardenTasks(garden,[target])[0];
 assert.equal(linked.status,'completed');
});

test('duplicate vacation tasks collapse by connected action key',()=>{
 const base={id:'a',action:'Check soil',taskType:'Check Moisture',targetId:'pot',dueDate:'2026-07-21',priority:50,duplicateKey:'same'},rows=dedupeVacationTasks([base,{...base,id:'b',priority:90}]);
 assert.equal(rows.length,1);
 assert.equal(rows[0].priority,90);
});

test('forecast change requests review',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-25'});
 assert.equal(vacationPlanNeedsReview(plan,weather({high:96,fetchedAt:'2026-07-19T10:00:00Z'})),true);
});

test('refresh preserves manual caretaker edits and completion',()=>{
 const plan=buildVacationPlan({garden:baseGarden(),weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-25',caretakerAvailable:true}),task=plan.tasks.find(row=>row.section==='during');task.manualEdited=true;task.instruction='Use Brooke’s exact handoff wording.';task.status='completed';task.completedAt='2026-07-21T20:00:00Z';
 const refreshed=refreshVacationPlan(plan,baseGarden(),weather({high:94,fetchedAt:'2026-07-19T10:00:00Z'}),'Brooke'),same=refreshed.tasks.find(row=>row.duplicateKey===task.duplicateKey);
 assert.equal(same.instruction,'Use Brooke’s exact handoff wording.');
 assert.equal(same.status,'completed');
});

test('trip date change rebuilds duration and dates without changing plan id',()=>{
 const garden=baseGarden(),plan=buildVacationPlan({garden,weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-22'}),changed=buildVacationPlan({garden,weather:weather(),departureDate:'2026-07-20',returnDate:'2026-07-30',id:plan.id});
 assert.equal(changed.id,plan.id);
 assert.equal(changed.duration,11);
 assert.ok(changed.tasks.some(row=>row.dueDate==='2026-07-31'));
});
