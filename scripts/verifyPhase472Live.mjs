import assert from'node:assert/strict';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const expectedBuild='phase-4-7-2-pre-sync-usability-cleanup';
const attempts=Number(process.env.VERIFY_ATTEMPTS||60),delay=Number(process.env.VERIFY_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fetchText=async url=>{const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200,`${url} returned ${response.status}`);return response.text()};
let result=null,lastError=null;
for(let attempt=1;attempt<=attempts;attempt+=1){
 try{
  const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json'},cache:'no-store'});
  assert.equal(healthResponse.status,200,`Health endpoint returned ${healthResponse.status}`);
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.version,'0.20.3');
  const html=await fetchText(`${base}/`);
  const scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]);
  const stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match=>match[1]);
  assert.ok(scriptPaths.length,'Live JavaScript asset was not found.');
  assert.ok(stylePaths.length,'Live CSS asset was not found.');
  const js=(await Promise.all(scriptPaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  const css=(await Promise.all(stylePaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  assert.match(js,new RegExp(expectedBuild));
  assert.match(js,/TODAY'S WORK/);
  assert.match(js,/Do these first/);
  assert.match(js,/GARDEN STATUS/);
  assert.match(js,/You are caught up/);
  assert.match(js,/GARDEN & ACCOUNT/);
  assert.match(js,/Location and frost dates/);
  assert.match(js,/WHAT TO DO/);
  assert.match(js,/Rain changed the watering plan/);
  assert.doesNotMatch(js,/WEATHER[-_ ]?ACTION[-_ ]?SUMMARY/i);
  assert.match(css,/chore-command-bar/);
  assert.match(css,/more-settings-hub/);
  assert.match(css,/today-quick-links/);
  assert.match(css,/weather-brief-decision/);
  assert.match(css,/tool-shed-card-list/);
  result={ok:true,base,attempt,health,expectedBuild,scriptPaths,stylePaths};
  break;
 }catch(error){lastError=error;if(attempt<attempts)await sleep(delay)}
}
assert.ok(result,`Live Phase 4.7.2 verification failed after ${attempts} attempts: ${lastError?.stack||lastError}`);
console.log(JSON.stringify(result,null,2));
