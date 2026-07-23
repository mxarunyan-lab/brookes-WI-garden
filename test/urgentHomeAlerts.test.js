import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{formatUrgentBadge,getSeasonalIdea,getSetupTask,getUrgentGardenAlerts,isGardenSetupIncomplete,isUrgentGardenItem}from'../src/urgentGardenAlerts.js';

const due='2026-07-23';
test('setup, onboarding, and optional seasonal ideas never become urgent alerts',()=>{
 const rows=[
  {id:'setup-first-plant',kind:'setupPlant',priority:99,priorityLabel:'Urgent',dueDate:due,title:'Add what is actually growing'},
  {id:'fall-planting-review',kind:'seasonalGuide',priority:99,dueDate:due,title:'Choose fall planting opportunities'},
  {id:'winter-plan-review',kind:'navigate',priority:99,dueDate:due,title:'Review the next garden season'},
  {id:'identify-1',kind:'plantDetail',priority:94,dueDate:due,title:'Match mystery plant to a crop'}
 ];
 assert.deepEqual(getUrgentGardenAlerts(rows,{today:new Date(`${due}T12:00:00`)}),[]);
});

test('only explicit time-sensitive garden danger reaches the urgent alert list',()=>{
 const rows=[
  {id:'weather-freeze',kind:'weather',priority:96,dueDate:due,title:'Protect tender plants from a freeze'},
  {id:'greenhouse-hot',kind:'greenhouse',priority:94,dueDate:due,title:'Ventilate the greenhouse'},
  {id:'water-now',kind:'soil',taskType:'Water',priority:92,dueDate:due,title:'Water tomato now'},
  {id:'manual-urgent',kind:'manual',priority:90,priorityLabel:'Urgent',dueDate:due,title:'Cover the new transplants'},
  {id:'harvest',kind:'plantDetail',priority:96,dueDate:due,title:'Check tomatoes for harvest'},
  {id:'future-storm',kind:'weather',priority:99,dueDate:'2026-07-30',title:'Prepare for storm'}
 ];
 const urgent=getUrgentGardenAlerts(rows,{today:new Date(`${due}T12:00:00`)});
 assert.deepEqual(urgent.map(row=>row.id),['weather-freeze','greenhouse-hot','water-now','manual-urgent']);
 assert.equal(isUrgentGardenItem(rows[4],{today:new Date(`${due}T12:00:00`)}),false);
});

test('urgent badges are absent at zero and cap at 9+',()=>{
 assert.equal(formatUrgentBadge(0),null);
 assert.equal(formatUrgentBadge(1),'1');
 assert.equal(formatUrgentBadge(9),'9');
 assert.equal(formatUrgentBadge(10),'9+');
});

test('setup and seasonal helpers keep calm Home content separate',()=>{
 const setup={id:'setup-first-plant',kind:'setupPlant'},seasonal={id:'fall-planting-review',kind:'seasonalGuide'};
 assert.equal(getSetupTask([seasonal,setup]),setup);
 assert.equal(getSeasonalIdea([setup,seasonal]),seasonal);
 assert.equal(isGardenSetupIncomplete({plants:[]}),true);
 assert.equal(isGardenSetupIncomplete({plants:[{id:'plant-1',stage:'Established'}]}),false);
});

test('Home source uses a watering can, top-level portal dialog, and no Garden Status alarm card',async()=>{
 const[home,workspace,css]=await Promise.all([
  readFile(new URL('../src/UrgentHome.jsx',import.meta.url),'utf8'),
  readFile(new URL('../src/WorkspaceScreens.jsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles/phase-4-7-8-urgent-home.css',import.meta.url),'utf8')
 ]);
 assert.match(home,/WateringCanIcon/);
 assert.match(home,/createPortal/);
 assert.match(home,/role="dialog"/);
 assert.match(home,/aria-modal="true"/);
 assert.match(home,/document\.body\.style\.overflow='hidden'/);
 assert.match(home,/Nothing urgent right now/);
 assert.doesNotMatch(workspace,/<Bell\/>/);
 assert.doesNotMatch(workspace,/GARDEN STATUS/);
 assert.ok(workspace.indexOf('SimplifiedTodayCard')<workspace.indexOf('<WeatherLine'));
 assert.match(css,/\.urgent-alert-overlay\{position:fixed/);
 assert.match(css,/z-index:5000/);
 assert.match(css,/100dvh/);
 assert.match(css,/safe-area-inset-top/);
});
