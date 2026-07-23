import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('bottom navigation remains locked to the approved five destinations',async()=>{
 const source=await read('src/App.jsx');
 assert.match(source,/Today/);assert.match(source,/My Garden/);assert.match(source,/Garden Center/);assert.match(source,/Tool Shed/);assert.match(source,/More/);
});

test('Tool Shed remains a destination rather than a bottom-navigation drawer',async()=>{
 const source=await read('src/App.jsx');
 assert.match(source,/tool-shed/);
});

test('More keeps the Garden and Account Settings hub and existing destinations',async()=>{
 const source=await read('src/MoreHub.jsx');
 assert.match(source,/Garden & Account Settings/);assert.match(source,/Garden and gardeners/);assert.match(source,/Location and frost dates/);assert.match(source,/Notifications/);
});

test('Weather workspace retains contextual back navigation',async()=>{
 const source=await read('src/WorkspaceScreens.jsx');
 assert.match(source,/navigate\('back'\)/);
});

test('Phase 4.7.5 CSS files have balanced braces',async()=>{
 for(const path of['src/styles/phase-4-7-5-navigation-lock.css','src/styles/phase-4-7-5-card-layout-lock.css','src/styles/phase-4-8-1-mobile-continuity.css']){
  const source=await read(path),opens=(source.match(/\{/g)||[]).length,closes=(source.match(/\}/g)||[]).length;
  assert.equal(opens,closes,`${path} has unbalanced braces`);
 }
});

test('current build marker identifies Phase 4.8.2 weather truth',async()=>{
 const version=await read('src/version.js');
 assert.match(version,/APP_VERSION='0\.21\.0'/);
 assert.match(version,/BUILD_ID='phase-4-8-2-weather-truth'/);
});
