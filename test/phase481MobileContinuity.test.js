import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const src=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');

test('all Add Plant requests pass through the centralized Growing Space guard',()=>{
 const app=src('App.jsx'),modal=src('ClearDetailModal.jsx');
 assert.match(app,/const requestModal=request=>/);
 assert.match(app,/request\?\.type!==['"]addPlant['"]/);
 assert.match(app,/!space\.hidden&&!space\.deletedAt/);
 assert.match(app,/setPendingAddPlant\(\{\.\.\.request\}\)/);
 assert.match(app,/type:'growingSpaceRequired'/);
 assert.match(app,/setModal=\{requestModal\}/);
 assert.doesNotMatch(app,/setModal\(\{type:'addPlant'/);
 assert.match(modal,/GROWING SPACE REQUIRED/);
 assert.match(modal,/Add a Growing Space first/);
 assert.match(modal,/Every planting needs a location/);
 assert.match(modal,/role="dialog"/);
 assert.match(modal,/aria-modal="true"/);
});

test('Growing Space handoff restores pending Add Plant data and selects the new space',()=>{
 const app=src('App.jsx'),modal=src('ClearDetailModal.jsx');
 assert.match(app,/sessionStorage\.setItem\('garden-open-bed',space\.id\)/);
 assert.match(app,/prefill:\{\.\.\.\(pendingAddPlant\.prefill\|\|\{\}\),spaceId:space\.id\}/);
 assert.match(app,/requestAnimationFrame\(\(\)=>setModal\(request\)\)/);
 assert.match(app,/return\{\.\.\.space,resumeAddPlant:true\}/);
 assert.match(modal,/if\(!created\?\.resumeAddPlant\)close\(\)/);
 assert.match(modal,/spaceId:modal\.spaceId\|\|initial\.spaceId/);
});

test('Vacation Mode uses Garden Buddy copy while retaining caretaker compatibility fields',()=>{
 const vacation=src('VacationMode.jsx'),planner=src('vacationPlanner.js'),app=src('App.jsx');
 for(const field of['caretakerAvailable','caretakerName','caretakerNotes']){assert.match(vacation,new RegExp(field));assert.match(planner,new RegExp(field))}
 assert.match(vacation,/A Garden Buddy can check the garden/);
 assert.match(vacation,/Garden Buddy name/);
 assert.match(vacation,/GARDEN BUDDY GUIDE/);
 assert.match(vacation,/Runyan Garden Buddy Guide/);
 assert.match(planner,/Garden Buddy Guide/);
 assert.match(app,/Garden Buddy instruction saved/);
 assert.doesNotMatch(vacation,/Helper name|LOCAL HELPER VIEW|No helper available/);
});

test('More, Tool Shed, weather, and Home continuity rules are present',()=>{
 const more=src('styles/phase-4-8-1-mobile-continuity.css'),tools=src('ToolShed.jsx'),weather=src('WorkspaceScreens.jsx');
 assert.match(more,/more-settings-hub:not\(\[open\]\)>div\{display:none!important\}/);
 assert.equal((tools.match(/<ToolCategory /g)||[]).length,3);
 assert.match(tools,/useState\(null\)/);
 assert.match(tools,/title="Garden Weather & Timing"/);
 assert.match(weather,/SecondaryHero icon=\{CloudSun\}/);
 assert.match(weather,/onBack=\{\(\)=>navigate\('back'\)\}/);
 assert.equal((weather.match(/<WeatherDetails/g)||[]).length,1);
 assert.match(more,/border-radius:22px 22px 0 0!important/);
 assert.match(more,/background:var\(--green-950\)!important/);
});
