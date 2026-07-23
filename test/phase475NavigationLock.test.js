import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('Plan & Care is locked to six planning and care destinations',async()=>{
 const source=await read('src/GardenCenter.jsx');
 const titles=['Planting Planner','Garden Tasks','My Seeds','Indoor Growing','Garden Shopping List','Vacation Mode'];
 assert.equal((source.match(/<DestinationRow /g)||[]).length,6);
 for(const title of titles)assert.equal(source.split(`title="${title}"`).length-1,1,`${title} must appear once`);
 assert.match(source,/title="Plan & Care"/);
 assert.match(source,/aria-label="Plan and Care destinations"/);
 assert.doesNotMatch(source,/Departments for seeds/);
 assert.match(source,/navigation-directory-card/);
});

test('Tool Shed is a three-category controlled accordion with six utility destinations',async()=>{
 const source=await read('src/ToolShed.jsx');
 const titles=['Spacing Calculator','Soil & Container Calculator','Seed Quantity Calculator','Garden Measurements','Garden Weather & Timing','Print & Labels'];
 assert.equal((source.match(/<ToolCategory /g)||[]).length,3);
 assert.equal((source.match(/<ToolCard /g)||[]).length,6);
 for(const title of titles)assert.equal(source.includes(`title="${title}"`),true,`${title} must remain available`);
 for(const heading of['Calculators & Utilities','Weather & Timing','Print & Labels'])assert.equal(source.includes(`title="${heading}"`),true,`${heading} category missing`);
 for(const moved of['Shopping List','Vacation Mode','Garden History'])assert.equal(source.includes(`title="${moved}"`),false,`${moved} must not remain in Tool Shed`);
 assert.match(source,/useState\(null\)/);
 assert.match(source,/current===id\?null:id/);
 assert.match(source,/aria-expanded=\{open\}/);
 assert.match(source,/aria-controls=/);
 assert.match(source,/count=\{4\}/);
 assert.match(source,/count=\{1\}/);
 assert.doesNotMatch(source,/Rain & Watering Review/);
 assert.doesNotMatch(source,/title="Frost & Planting Dates"/);
});

test('moved destinations keep existing routes and new navigation ownership',async()=>{
 const[app,shopping,vacation,memory,nav]=await Promise.all(['src/App.jsx','src/GardenShoppingList.jsx','src/VacationMode.jsx','src/GardenMemory.jsx','src/Navigation.jsx'].map(read));
 assert.match(nav,/'shopping-list':'center'/);
 assert.match(nav,/vacation:'center'/);
 assert.match(nav,/memory:'garden'/);
 assert.match(nav,/weather:'tools'/);
 assert.match(shopping,/navigate\(/);
 assert.match(vacation,/navigate\(/);
 assert.match(memory,/navigate\(/);
 assert.match(app,/page==='shopping-list'/);
 assert.match(app,/page==='vacation'/);
 assert.match(app,/page==='memory'/);
});

test('secondary pages share the compact header system without changing Today or My Garden',async()=>{
 const[ui,main,css,layout,today,garden]=await Promise.all(['src/SecondaryUI.jsx','src/main.jsx','src/styles/phase-4-7-5-navigation-lock.css','src/styles/phase-4-7-5-card-layout-lock.css','src/WorkspaceScreens.jsx','src/BedWorkspace.jsx'].map(read));
 assert.match(ui,/compact-secondary-header/);
 assert.match(main,/phase-4-7-5-navigation-lock\.css/);
 assert.match(main,/phase-4-7-5-card-layout-lock\.css/);
 assert.match(main,/phase-4-8-1-mobile-continuity\.css/);
 assert.match(main,/phase-4-8-3-first-time-clarity\.css/);
 assert.match(main,/phase-4-8-3b-garden-history\.css/);
 assert.match(css,/secondary-hero\.compact-secondary-header/);
 assert.match(layout,/-webkit-line-clamp:1!important/);
 assert.match(today,/compact-home-hero/);
 assert.match(garden,/individual-bed-card/);
 assert.doesNotMatch(css,/compact-home-hero\s*\{/);
});

test('release CSS files have balanced braces',async()=>{
 for(const path of['src/styles/phase-4-7-5-navigation-lock.css','src/styles/phase-4-7-5-card-layout-lock.css','src/styles/phase-4-8-1-mobile-continuity.css','src/styles/phase-4-8-3-first-time-clarity.css','src/styles/phase-4-8-3b-garden-history.css']){
  const source=await read(path),opens=(source.match(/\{/g)||[]).length,closes=(source.match(/\}/g)||[]).length;
  assert.equal(opens,closes,`${path} has unbalanced braces`);
 }
});

test('current build marker identifies Phase 4.8.3b Garden History entry',async()=>{
 const version=await read('src/version.js');
 assert.match(version,/APP_VERSION='0\.21\.1'/);
 assert.match(version,/BUILD_ID='phase-4-8-3b-garden-history-entry'/);
});
