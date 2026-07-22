import test from'node:test';
import assert from'node:assert/strict';
import{existsSync}from'node:fs';
import{buildGardenSubtitle,getGreenBaySeason,possessiveGardenTitle,resolveGardenHeaderSeason,SEASONAL_HEADER_IMAGES}from'../src/seasonalGardenHeader.js';

const cases=[
 ['2026-02-15T18:00:00Z','winter'],
 ['2026-03-01T18:00:00Z','spring'],
 ['2026-05-31T18:00:00Z','spring'],
 ['2026-06-01T18:00:00Z','summer'],
 ['2026-08-31T18:00:00Z','summer'],
 ['2026-09-01T18:00:00Z','fall'],
 ['2026-11-30T18:00:00Z','fall'],
 ['2026-12-01T18:00:00Z','winter'],
];
for(const[date,season]of cases)test(`${date.slice(0,10)} resolves to ${season}`,()=>assert.equal(getGreenBaySeason(new Date(date)),season));

test('season boundary follows America/Chicago rather than UTC or traveler timezone',()=>{
 assert.equal(getGreenBaySeason(new Date('2026-03-01T05:30:00Z')),'winter');
 assert.equal(getGreenBaySeason(new Date('2026-03-01T06:30:00Z')),'spring');
});

test('future fixed-season preference resolves without changing the automatic default',()=>{
 assert.equal(resolveGardenHeaderSeason('automatic',new Date('2026-07-22T18:00:00Z')),'summer');
 assert.equal(resolveGardenHeaderSeason('winter',new Date('2026-07-22T18:00:00Z')),'winter');
});

test('possessive title handles missing and s-ending names',()=>{
 assert.equal(possessiveGardenTitle('Archie'),'Archie’s Garden');
 assert.equal(possessiveGardenTitle('James'),'James’ Garden');
 assert.equal(possessiveGardenTitle('  '),'My Garden');
});

test('subtitle never leaves a dangling separator',()=>{
 assert.equal(buildGardenSubtitle('The Runyan Garden','Green Bay, Wisconsin'),'The Runyan Garden — Green Bay');
 assert.equal(buildGardenSubtitle('The Runyan Garden',''),'The Runyan Garden');
 assert.equal(buildGardenSubtitle('','Green Bay, Wisconsin'),'Green Bay');
 assert.equal(buildGardenSubtitle('',''),'');
});

test('every automatic season has one dedicated production image asset',()=>{
 assert.deepEqual(Object.keys(SEASONAL_HEADER_IMAGES),['spring','summer','fall','winter']);
 for(const[season,source]of Object.entries(SEASONAL_HEADER_IMAGES)){
  assert.match(source,new RegExp(`^/images/garden-headers/${season}\\.avif$`));
  assert.equal(existsSync(`public${source}`),true,`${season} approved header asset is missing`);
 }
});
