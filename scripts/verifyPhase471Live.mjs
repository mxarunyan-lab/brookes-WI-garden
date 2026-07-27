import assert from 'node:assert/strict';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const expectedVersion='0.20.3';
const expectedBuild='phase-4-7-1-ia-restoration-mobile-final';
const attempts=Number(process.env.VERIFY_ATTEMPTS||60);
const delay=Number(process.env.VERIFY_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const fetchText=async url=>{
 const response=await fetch(url,{headers:{accept:'text/html,application/javascript,text/css,*/*'},cache:'no-store'});
 assert.equal(response.status,200,`${url} returned ${response.status}`);
 return response.text();
};

let result=null,lastError=null;
for(let attempt=1;attempt<=attempts;attempt+=1){
 try{
  const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json'},cache:'no-store'});
  assert.equal(healthResponse.status,200,`Health endpoint returned ${healthResponse.status}`);
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.version,expectedVersion);

  const html=await fetchText(`${base}/`);
  const scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]);
  const stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match=>match[1]);
  assert.ok(scriptPaths.length,'Live frontend JavaScript asset was not found.');
  assert.ok(stylePaths.length,'Live frontend stylesheet asset was not found.');

  const js=(await Promise.all(scriptPaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  const css=(await Promise.all(stylePaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');

  assert.match(js,new RegExp(expectedBuild.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(js,/WHAT MATTERS TODAY/);
  assert.match(js,/MY SAVED SEEDS/);
  assert.match(js,/OTHER PLANTING OPPORTUNITIES/);
  assert.match(js,/WEATHER TOOLS/);
  assert.match(js,/NOTES & PRINTABLES/);
  assert.match(js,/Data Management/);
  assert.match(js,/Quick Help/);
  assert.doesNotMatch(js,/TODAY'S GARDEN BRIEF/);
  assert.doesNotMatch(js,/NEXT BEST MOVE/);
  assert.doesNotMatch(js,/Back to Today/);

  assert.match(css,/@media\(max-width:360px\)/);
  assert.match(css,/\.compact-home-hero \.wisconsin-landscape/);
  assert.match(css,/max-width:100%/);
  assert.match(css,/overflow-x:hidden/);

  result={ok:true,base,health,attempt,scriptPaths,stylePaths,expectedBuild};
  break;
 }catch(error){
  lastError=error;
  if(attempt<attempts)await sleep(delay);
 }
}

assert.ok(result,`Live Phase 4.7.1 verification failed after ${attempts} attempts: ${lastError?.stack||lastError}`);
console.log(JSON.stringify(result,null,2));
