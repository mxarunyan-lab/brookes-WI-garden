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

test('all four seasonal paths use the stable WebP delivery route',()=>{
 assert.deepEqual(Object.keys(SEASONAL_GARDEN_HEADERS),['spring','summer','fall','winter']);
 assert.equal(new Set(Object.values(SEASONAL_GARDEN_HEADERS)).size,4);
 for(const[season,path]of Object.entries(SEASONAL_GARDEN_HEADERS)){
  assert.equal(path,`/images/garden-headers/garden-header-${season}.webp?v=0477`);
 }
});

test('seasonal header stays focused on Today and preserves navigation',async()=>{
 const[main,runtime,css,today,urgentHome,navigation]=await Promise.all([
  read('src/main.jsx'),
  read('src/seasonalHeaderRuntime.js'),
  read('src/styles/phase-4-7-6-seasonal-header.css'),
  read('src/WorkspaceScreens.jsx'),
  read('src/UrgentHome.jsx'),
  read('src/Navigation.jsx')
 ]);
 assert.match(main,/phase-4-7-6-seasonal-header\.css/);
 assert.match(main,/phase-4-7-8-urgent-home\.css/);
 assert.match(main,/seasonalHeaderRuntime\.js/);
 assert.match(runtime,/dataset\[ATTRIBUTE\]=season/);
 assert.match(runtime,/visibilitychange/);
 assert.match(css,/today-hero\.compact-home-hero/);
 assert.match(css,/aspect-ratio:2\/1!important/);
 assert.match(css,/background-size:contain!important/);
 assert.match(css,/garden-header-summer\.webp\?v=0477/);
 assert.match(css,/compact-home-hero:after\{display:none!important\}/);
 assert.match(css,/clip-path:inset\(50%\)!important/);
 assert.match(css,/margin-top:-22px!important/);
 assert.doesNotMatch(css,/background-size:cover/);
 assert.doesNotMatch(css,/height:clamp\(168px/);
 assert.match(today,/profile\.gardenerName/);
 assert.match(today,/UrgentAlertControl/);
 assert.match(urgentHome,/notification-count/);
 assert.match(urgentHome,/hero-bell/);
 assert.match(urgentHome,/WateringCanIcon/);
 assert.doesNotMatch(today,/today-quick-links/);
 assert.match(navigation,/BottomNav/);
});

test('server converts approved AVIF masters to stable WebP for Safari',async()=>{
 const server=await read('server/index.js');
 assert.match(server,/import sharp from 'sharp'/);
 assert.match(server,/garden-header-:season\.webp/);
 assert.match(server,/garden-header-\$\{season\}\.avif/);
 assert.match(server,/\.webp\(\{quality: 95, effort: 6, smartSubsample: true\}\)/);
 assert.match(server,/image\/webp/);
 assert.match(server,/seasonalHeaderCache/);
});

test('approved AVIF master files remain intact as server-side conversion sources',async()=>{
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
