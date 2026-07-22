import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('Garden Center is locked to five core destinations',async()=>{
 const source=await read('src/GardenCenter.jsx');
 const titles=['Seed Department','Planting Desk','Growing Spaces','Indoor Growing','Garden Chore Board'];
 assert.equal((source.match(/<DepartmentTile /g)||[]).length,5);
 for(const title of titles)assert.equal(source.split(`title="${title}"`).length-1,1,`${title} must appear once`);
 for(const removed of['Shopping List','Vacation Mode','Garden History','Next Season'])assert.equal(source.includes(`title="${removed}"`),false,`${removed} must not remain in Garden Center`);
 assert.match(source,/title="Garden Center"/);
 assert.doesNotMatch(source,/Departments for seeds/);
 assert.match(source,/navigation-directory-card/);
});

test('Tool Shed is a flat eleven-destination directory',async()=>{
 const source=await read('src/ToolShed.jsx');
 const titles=['Spacing Calculator','Soil & Container Calculator','Seed Quantity Calculator','Garden Measurements','Garden Weather','Rain & Watering Review','Frost & Planting Dates','Shopping List','Vacation Mode','Printable Garden Pack & Labels','Garden History'];
 assert.equal((source.match(/<ToolCard /g)||[]).length,11);
 for(const title of titles)assert.equal(source.includes(`title="${title}"`),true,`${title} must be directly visible`);
 for(const heading of['CALCULATORS & UTILITIES','WEATHER & TIMING','RECORDS & EXTRAS'])assert.equal(source.includes(heading),true,`${heading} section missing`);
 assert.doesNotMatch(source,/<details/);
 assert.doesNotMatch(source,/tool-shed-drawer/);
 assert.doesNotMatch(source,/count=/);
 assert.match(source,/openWeather\('garden'\)/);
 assert.match(source,/openWeather\('rain'\)/);
 assert.match(source,/openWeather\('frost'\)/);
});

test('moved destinations keep existing routes and Tool Shed ownership',async()=>{
 const[app,shopping,vacation,memory]=await Promise.all(['src/App.jsx','src/GardenShoppingList.jsx','src/VacationMode.jsx','src/GardenMemory.jsx'].map(read));
 assert.match(app,/vacation:'tools'/);
 assert.match(app,/'shopping-list':'tools'/);
 assert.match(app,/memory:'tools'/);
 assert.match(app,/parentMap=\{weather:'today',chores:'center',vacation:'tools','plan-plant':'center','shopping-list':'tools','seed-tools':'center',indoor:'center',memory:'tools'/);
 assert.match(shopping,/navigate\('tools'\)/);
 assert.match(vacation,/navigate\('tools'\)/);
 assert.match(memory,/navigate\('tools'\)/);
 assert.match(app,/page==='shopping-list'/);
 assert.match(app,/page==='vacation'/);
 assert.match(app,/page==='memory'/);
});

test('secondary pages share the compact header system without changing Today or My Garden',async()=>{
 const[ui,main,css,layout,today,garden]=await Promise.all(['src/SecondaryUI.jsx','src/main.jsx','src/styles/phase-4-7-5-navigation-lock.css','src/styles/phase-4-7-5-card-layout-lock.css','src/WorkspaceScreens.jsx','src/BedWorkspace.jsx'].map(read));
 assert.match(ui,/compact-secondary-header/);
 assert.match(main,/phase-4-7-5-navigation-lock\.css/);
 assert.match(main,/phase-4-7-5-card-layout-lock\.css/);
 assert.match(css,/secondary-hero\.compact-secondary-header/);
 assert.match(layout,/-webkit-line-clamp:1!important/);
 assert.match(today,/compact-home-hero/);
 assert.match(garden,/individual-bed-card/);
 assert.doesNotMatch(css,/compact-home-hero\s*\{/);
});

test('Phase 4.7.5 CSS files have balanced braces',async()=>{
 for(const path of['src/styles/phase-4-7-5-navigation-lock.css','src/styles/phase-4-7-5-card-layout-lock.css']){
  const source=await read(path),opens=(source.match(/\{/g)||[]).length,closes=(source.match(/\}/g)||[]).length;
  assert.equal(opens,closes,`${path} has unbalanced braces`);
 }
});

test('Phase 4.7.5 build marker is present',async()=>{
 const version=await read('src/version.js');
 assert.match(version,/APP_VERSION='0\.20\.4'/);
 assert.match(version,/BUILD_ID='phase-4-7-5-navigation-lock'/);
});
