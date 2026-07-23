import assert from'node:assert/strict';

const base=(process.env.GARDEN_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const noStore={cache:'no-store',headers:{'cache-control':'no-cache','pragma':'no-cache'}};
const get=async path=>{const response=await fetch(`${base}${path}?verify=${Date.now()}`,noStore);assert.equal(response.ok,true,`${path} returned ${response.status}`);return response};
const health=await(await get('/api/health')).json();
assert.equal(health.version,'0.21.1');
assert.equal(health.buildId,'phase-4-8-3-first-time-clarity');
assert.equal(health.phase,'4.8.3');
const html=await(await get('/')).text();
assert.match(html,/id=["']root["']/);
const sw=await(await get('/sw.js')).text();
assert.match(sw,/brookes-garden-v0483-first-time-clarity-20260723/);
const stationResponse=await get('/api/weather/current');
const station=await stationResponse.json();
assert.equal('apiKey'in station,false);
assert.equal('PWS_API_KEY'in station,false);
if(station.ok){assert.equal(station.stationId,'KWIGREEN307');assert.ok(station.observation?.observation_timestamp,'Fresh station observation timestamp is required');}
console.log(JSON.stringify({ok:true,base,health,station:{ok:station.ok,configured:station.configured,provider:station.provider,stationId:station.stationId,observedAt:station.observation?.observation_timestamp||null},cache:'brookes-garden-v0483-first-time-clarity-20260723'},null,2));
