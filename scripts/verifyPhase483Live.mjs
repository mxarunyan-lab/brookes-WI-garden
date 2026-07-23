import assert from'node:assert/strict';

const base=(process.env.GARDEN_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const noStore={cache:'no-store',headers:{'cache-control':'no-cache','pragma':'no-cache'}};
const get=async path=>{const separator=path.includes('?')?'&':'?';const response=await fetch(`${base}${path}${separator}verify=${Date.now()}`,noStore);assert.equal(response.ok,true,`${path} returned ${response.status}`);return response};
const health=await(await get('/api/health')).json();
assert.equal(health.version,'0.21.1');
assert.equal(health.buildId,'phase-4-8-3b-garden-history-entry');
assert.equal(health.phase,'4.8.3b');
const html=await(await get('/')).text();
assert.match(html,/id=["']root["']/);
const directMemory=await get('/?page=memory');
assert.match(await directMemory.text(),/id=["']root["']/);
const assetMatch=html.match(/<script[^>]+src=["']([^"']+\.js)["']/);
assert.ok(assetMatch,'Production JavaScript asset was not found in the app shell.');
const bundle=await(await get(assetMatch[1])).text();
assert.match(bundle,/Garden History/);
assert.match(bundle,/Review garden activity, harvests, problems, and photos\./);
assert.match(bundle,/GARDEN RECORDS/);
assert.match(bundle,/phase-4-8-3b-garden-history-entry/);
const sw=await(await get('/sw.js')).text();
assert.match(sw,/brookes-garden-v0483b-garden-history-entry-20260723/);
const stationResponse=await get('/api/weather/current');
const station=await stationResponse.json();
assert.equal('apiKey'in station,false);
assert.equal('PWS_API_KEY'in station,false);
if(station.ok){assert.equal(station.stationId,'KWIGREEN307');assert.ok(station.observation?.observation_timestamp,'Fresh station observation timestamp is required');}
console.log(JSON.stringify({ok:true,base,health,directMemory:true,bundle:{gardenHistory:true,description:true,eyebrow:true},station:{ok:station.ok,configured:station.configured,provider:station.provider,stationId:station.stationId,observedAt:station.observation?.observation_timestamp||null},cache:'brookes-garden-v0483b-garden-history-entry-20260723'},null,2));
