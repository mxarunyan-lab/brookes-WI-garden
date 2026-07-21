import assert from'node:assert/strict';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const expectedBuild='phase-4-7-3-final-pre-sync-smoothing';
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
  assert.match(js,/GARDEN STATUS/);
  assert.match(js,/No garden work needs your attention right now/);
  assert.doesNotMatch(js,/today-quick-links/);
  assert.match(js,/Garden Weather/);
  assert.match(js,/Rain & Watering Review/);
  assert.match(js,/Frost & Planting Timing/);
  assert.match(js,/RECENT RAIN CREDIT/);
  assert.match(js,/SAVED GREEN BAY TIMING/);
  assert.match(js,/GARDEN & ACCOUNT SETTINGS/);
  assert.match(js,/<details className="more-settings-hub"/);
  assert.doesNotMatch(js,/<details className="more-settings-hub" open/);
  assert.match(css,/tool-shed-drawer>summary\{background:#fffaf0!important/);
  assert.match(css,/tool-shed-drawer>summary \.secondary-section-header small/);
  assert.match(css,/indoor-center-content \.control-center-title/);
  assert.match(css,/gap:12px!important/);
  assert.match(css,/weather-tool-tabs/);
  result={ok:true,base,attempt,health,expectedBuild,scriptPaths,stylePaths};
  break;
 }catch(error){lastError=error;if(attempt<attempts)await sleep(delay)}
}
assert.ok(result,`Live Phase 4.7.3 verification failed after ${attempts} attempts: ${lastError?.stack||lastError}`);
console.log(JSON.stringify(result,null,2));