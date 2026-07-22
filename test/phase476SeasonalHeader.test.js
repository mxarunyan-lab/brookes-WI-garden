import test from'node:test';
import assert from'node:assert/strict';
import{readFile,stat}from'node:fs/promises';
import{getGreenBaySeason,SEASONAL_GARDEN_HEADERS}from'../src/gardenSeason.js';

const read=path=>readFile(path,'utf8');

test('Green Bay meteorological seasons use America/Chicago boundaries',()=>{
 const cases=[
  ['2026-02-15T18:00:00Z','winter'],
  ['2026-03-01T18:00:00Z','spring'],
  ['2026-05-31T18:00:00Z','spring'],
  ['2026-06-01T18:00:00Z','summer'],
  ['2026-08-31T18:00:00Z','summer'],
  ['2026-09-01T18:00:00Z','fall'],
  ['2026-11-30T18:00:00Z','fall'],
  ['2026-12-01T18:00:00Z','winter']
 ];
 for(const[value,expected]of cases)assert.equal(getGreenBaySeason(new Date(value)),expected,value);
});

test('all four approved seasonal assets are mapped and committed',async()=>{
 assert.deepEqual(Object.keys(SEASONAL_GARDEN_HEADERS),['spring','summer','fall','winter']);
 for(const[season,publicPath]of Object.entries(SEASONAL_GARDEN_HEADERS)){
  assert.match(publicPath,new RegExp(`garden-header-${season}\\.webp$`));
  const file=publicPath.replace(/^\//,'public/');
  const info=await stat(file);
  assert.ok(info.size>200000,`${season} header should retain illustration detail`);
 }
});

test('Today keeps live identity and notification controls over seasonal artwork',async()=>{
 const[today,main,runtime,css]=await Promise.all([
  read('src/WorkspaceScreens.jsx'),
  read('src/main.jsx'),
  read('src/seasonalHeaderRuntime.js'),
  read('src/styles/phase-4-7-6-seasonal-header.css')
 ]);
 assert.match(today,/profile\.gardenerName/);
 assert.match(today,/profile\.gardenName/);
 assert.match(today,/profile\.location/);
 assert.match(today,/hero-bell/);
 assert.match(today,/notification-count/);
 assert.match(main,/phase-4-7-6-seasonal-header\.css/);
 assert.match(main,/seasonalHeaderRuntime\.js/);
 assert.match(runtime,/document\.documentElement\.dataset/);
 assert.match(runtime,/visibilitychange/);
 assert.match(css,/data-garden-season="spring"/);
 assert.match(css,/data-garden-season="summer"/);
 assert.match(css,/data-garden-season="fall"/);
 assert.match(css,/data-garden-season="winter"/);
 assert.match(css,/\.wisconsin-landscape\{display:none!important\}/);
});

test('seasonal header stays compact and Today overlaps without shortcut tiles or navigation changes',async()=>{
 const[css,today,navigation]=await Promise.all([
  read('src/styles/phase-4-7-6-seasonal-header.css'),
  read('src/WorkspaceScreens.jsx'),
  read('src/Navigation.jsx')
 ]);
 assert.match(css,/height:clamp\(168px,46vw,190px\)!important/);
 assert.match(css,/margin-top:-24px!important/);
 assert.match(css,/compact-today-body>\.what-matters-today/);
 assert.doesNotMatch(today,/today-quick-links/);
 assert.match(navigation,/BottomNav/);
 const opens=(css.match(/\{/g)||[]).length,closes=(css.match(/\}/g)||[]).length;
 assert.equal(opens,closes,'seasonal CSS braces must balance');
});
