import test from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{readFileSync}from'node:fs';
import{buildGardenSubtitle,GARDEN_SEASONS,getGreenBaySeason,possessiveGardenTitle,resolveGardenHeaderSeason}from'../src/seasonalGardenHeader.js';

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

const payloads={
 spring:['.asset-staging/spring.avif.b64'],
 summer:['.asset-staging/summer.avif.b64.part00','.asset-staging/summer.avif.b64.part01','.asset-staging/summer.avif.b64.part02'],
 fall:['.asset-staging/fall.avif.b64'],
 winter:['.asset-staging/winter.avif.b64.part00'],
};
const expectedHashes={
 spring:'77ada230e515b7332eafd9330a66c56b90d621dd465c37f893852f09cfe6b905',
 summer:'29144a56500a85ce9a7161660dc8fb453fe779615610dfefb0359e1467add96b',
 fall:'83c555a1483fbf9fdf9e7f33dbf5ee4a1ca09fe278c7c628628d34fe6659a181',
 winter:'90194a0c2fa691dc74a916c401804371e0ad6914fb0120eec7f54246a4d5b46e',
};

test('every automatic season bundles the exact approved AVIF artwork',()=>{
 assert.deepEqual(GARDEN_SEASONS,['spring','summer','fall','winter']);
 for(const season of GARDEN_SEASONS){
  const encoded=payloads[season].map(path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')).join('').replace(/\s+/g,'');
  const asset=Buffer.from(encoded,'base64');
  assert.ok(asset.length>10000,`${season} asset is unexpectedly small`);
  assert.equal(asset.subarray(4,12).toString('ascii'),'ftypavif',`${season} is not an AVIF file`);
  assert.equal(createHash('sha256').update(asset).digest('hex'),expectedHashes[season],`${season} artwork changed`);
 }
});

test('seasonal asset module provides one data URL for every approved season',()=>{
 const source=readFileSync(new URL('../src/seasonalGardenAssetSources.js',import.meta.url),'utf8');
 for(const season of GARDEN_SEASONS)assert.match(source,new RegExp(`${season}:avifDataUrl\\(`));
 assert.match(source,/data:image\/avif;base64/);
});

test('seasonal header styling uses a fully opaque live identity surface',()=>{
 const css=readFileSync(new URL('../src/styles/seasonal-home-header.css',import.meta.url),'utf8');
 assert.match(css,/\.seasonal-garden-header__identity\{[\s\S]*background:#fffaf0;/);
 assert.match(css,/width:min\(54%,420px\)/);
 assert.match(css,/@media\(min-width:700px\)\{[\s\S]*width:min\(420px,calc\(100% - 76px\)\)/);
});
