import assert from 'node:assert/strict';
import test from 'node:test';
import { runWeatherWithFallback } from '../src/weather.js';

test('Open-Meteo receives a fresh signal after the NWS request times out', async () => {
  const controllers=[];
  let fallbackStartedAborted=null;
  const outcome=await runWeatherWithFallback({
    primary:signal=>new Promise((resolve,reject)=>{
      signal.addEventListener('abort',()=>reject(Object.assign(new Error('NWS timed out'),{name:'AbortError'})),{once:true});
    }),
    fallback:async signal=>{
      fallbackStartedAborted=signal.aborted;
      return{provider:'Open-Meteo',records:[{id:'fallback-record'}]};
    },
    primaryTimeoutMs:10,
    fallbackTimeoutMs:100,
    onController:(controller,stage)=>controllers.push({controller,stage})
  });

  assert.equal(outcome.usedFallback,true);
  assert.equal(outcome.source,'fallback');
  assert.equal(outcome.result.provider,'Open-Meteo');
  assert.equal(fallbackStartedAborted,false);
  assert.equal(controllers.length,2);
  assert.equal(controllers[0].stage,'primary');
  assert.equal(controllers[1].stage,'fallback');
  assert.notEqual(controllers[0].controller,controllers[1].controller);
  assert.equal(controllers[0].controller.signal.aborted,true);
  assert.equal(controllers[1].controller.signal.aborted,false);
});

test('a successful NWS request does not start the fallback request', async () => {
  let fallbackCalls=0;
  const controllers=[];
  const outcome=await runWeatherWithFallback({
    primary:async signal=>({provider:'National Weather Service',records:[],signalWasAborted:signal.aborted}),
    fallback:async()=>{fallbackCalls+=1;return{provider:'Open-Meteo',records:[]}},
    primaryTimeoutMs:100,
    fallbackTimeoutMs:100,
    onController:(controller,stage)=>controllers.push({controller,stage})
  });

  assert.equal(outcome.usedFallback,false);
  assert.equal(outcome.source,'live');
  assert.equal(outcome.result.signalWasAborted,false);
  assert.equal(fallbackCalls,0);
  assert.equal(controllers.length,1);
  assert.equal(controllers[0].stage,'primary');
});
