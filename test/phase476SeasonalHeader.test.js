import test from'node:test';
import assert from'node:assert/strict';
import{readFile,stat}from'node:fs/promises';
import{getGreenBaySeason,SEASONAL_GARDEN_HEADERS,GREEN_BAY_TIME_ZONE}from'../src/gardenSeason.js';

const read=path=>readFile(path,'utf8');

test('Green Bay seasonal boundaries use America/Chicago meteorological seasons',()=>{
 assert.equal(GREEN_BAY_TIME_ZONE,'America/Chicago');
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
 for(const[value,season]of cases)assert.equal(getGreenBaySeason(new Date(value)),season,`${value} should be ${season}`);
});

test('all four approved seasonal asset paths are distinct AVIF headers',()=>{
 assert.deepEqual(Object.keys(SEASONAL_GARDEN_HEADERS),['spring','summer','fall','winter']);
 assert.equal(new Set(Object.values(SEASONAL_GARDEN_HEADERS)).size,4);
 for(const[season,path]of Object.entries(SEASONAL_GARDEN_HEADERS)){
  assert.match(path,new RegExp(`garden-header-${season}\\.avif$`));
 }
});

test('seasonal header runtime and CSS stay focused on Today without changing navigation',async()=>{
 const[main,runtime,css,today,navigation]=await Promise.all([
  read('src/main.jsx'),
  read('src/seasonalHeaderRuntime.js'),
  read('src/styles/phase-4-7-6-seasonal-header.css'),
  read('src/WorkspaceScreens.jsx'),
  read('src/Navigation.jsx')
 ]);
 assert.match(main,/phase-4-7-6-seasonal-header\.css/);
 assert.match(main,/seasonalHeaderRuntime\.js/);
 assert.match(runtime,/dataset\[ATTRIBUTE\]=season/);
 assert.match(runtime,/visibilitychange/);
 assert.match(css,/compact-home-hero/);
 assert.match(css,/background-size:cover/);
 assert.match(css,/margin-top:-24px!important/);
 assert.match(css,/what-matters-today/);
 assert.match(css,/wisconsin-landscape\{display:none!important\}/);
 assert.match(today,/profile\.gardenerName/);
 assert.match(today,/profile\.gardenName/);
 assert.match(today,/profile\.location/);
 assert.match(today,/notification-count/);
 assert.match(today,/hero-bell/);
 assert.doesNotMatch(today,/today-quick-links/);
 assert.match(navigation,/BottomNav/);
});

test('seasonal assets are real compact image files after the asset step',async()=>{
 for(const season of['spring','summer','fall','winter']){
  const path=`public/images/garden-headers/garden-header-${season}.avif`;
  const info=await stat(path);
  assert.ok(info.size>10000,`${season} asset is unexpectedly small`);
  const bytes=await readFile(path);
  assert.equal(bytes.subarray(4,12).toString('ascii'),'ftypavif',`${season} is not an AVIF file`);
 }
});

test('seasonal CSS is balanced and contains no shortcut dashboard grid',async()=>{
 const css=await read('src/styles/phase-4-7-6-seasonal-header.css');
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.doesNotMatch(css,/today-quick-links/);
 assert.doesNotMatch(css,/bottom-nav/);
});
