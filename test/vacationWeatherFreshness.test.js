import test from'node:test';
import assert from'node:assert/strict';
import{buildVacationIntelligence}from'../src/vacationPlanner.js';

const garden={profile:{},spaces:[{id:'bed',name:'Raised Bed',type:'bed'}],plants:[{id:'kale',name:'Kale',spaceId:'bed',stage:'Established'}]};
const plan={departureDate:'2026-07-28',returnDate:'2026-07-31'};
const weather=overrides=>({recentRain24h:.6,high:82,low:62,wind:8,rainChance:20,forecasts:[],...overrides});

test('central Stale freshness blocks observed-rain credit even when fetchedAt is recent',()=>{
 const intelligence=buildVacationIntelligence({garden,plan,now:'2026-07-27T12:00:00Z',weather:weather({currentFreshness:'Stale',fetchedAt:'2026-07-27T11:59:00Z'})});
 assert.equal(intelligence.weather.weatherFresh,false);
 assert.equal(intelligence.weather.observedRainCredit,false);
 assert.match(intelligence.weather.summary,/fresh check/i);
 assert.match(intelligence.beforeYouLeave.find(item=>item.id==='garden-beds').reason,/not fresh enough/i);
});

test('central Current and Recent freshness permit observed-rain evidence',()=>{
 for(const currentFreshness of ['Current','Recent']){
  const intelligence=buildVacationIntelligence({garden,plan,now:'2026-07-27T12:00:00Z',weather:weather({currentFreshness})});
  assert.equal(intelligence.weather.weatherFresh,true,currentFreshness);
  assert.equal(intelligence.weather.observedRainCredit,true,currentFreshness);
 }
});

test('Unavailable freshness never awards rain credit',()=>{
 const intelligence=buildVacationIntelligence({garden,plan,weather:weather({currentFreshness:'Unavailable'})});
 assert.equal(intelligence.weather.weatherFresh,false);
 assert.equal(intelligence.weather.observedRainCredit,false);
});

test('legacy weather without centralized classification uses the same two-hour ceiling',()=>{
 const recent=buildVacationIntelligence({garden,plan,now:'2026-07-27T12:00:00Z',weather:weather({fetchedAt:'2026-07-27T10:30:00Z'})});
 const stale=buildVacationIntelligence({garden,plan,now:'2026-07-27T12:00:01Z',weather:weather({fetchedAt:'2026-07-27T10:00:00Z'})});
 assert.equal(recent.weather.observedRainCredit,true);
 assert.equal(stale.weather.observedRainCredit,false);
});
