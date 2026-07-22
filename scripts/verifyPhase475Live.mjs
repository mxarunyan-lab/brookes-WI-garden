import assert from'node:assert/strict';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const expectedBuild='phase-4-7-5-navigation-lock';
const attempts=Number(process.env.VERIFY_ATTEMPTS||48),delay=Number(process.env.VERIFY_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fetchText=async url=>{const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200,`${url} returned ${response.status}`);return response.text()};
let result=null,lastError=null;
for(let attempt=1;attempt<=attempts;attempt+=1){
 let browser;
 try{
  const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json'},cache:'no-store'});
  assert.equal(healthResponse.status,200,`Health endpoint returned ${healthResponse.status}`);
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.version,'0.20.4');
  const html=await fetchText(`${base}/`);
  const scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]);
  const stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match=>match[1]);
  assert.ok(scriptPaths.length,'Live JavaScript asset was not found.');
  assert.ok(stylePaths.length,'Live CSS asset was not found.');
  const js=(await Promise.all(scriptPaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  const css=(await Promise.all(stylePaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  assert.match(js,new RegExp(expectedBuild));
  assert.match(js,/CALCULATORS & UTILITIES/);
  assert.match(js,/WEATHER & TIMING/);
  assert.match(js,/RECORDS & EXTRAS/);
  assert.match(js,/Printable Garden Pack & Labels/);
  assert.match(css,/compact-secondary-header/);
  assert.match(css,/tool-shed-directory-card/);
  assert.match(css,/garden-center-tile/);

  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.addInitScript(()=>localStorage.setItem('runyan-garden-active-profile','archie'));
  const goto=async route=>{const response=await page.goto(`${base}/?page=${route}&phase475=${Date.now()}`,{waitUntil:'domcontentloaded'});assert.equal(response?.status(),200);await page.locator('main').waitFor()};
  await goto('center');
  await page.getByRole('heading',{name:'Garden Center',exact:true}).waitFor();
  assert.equal(await page.locator('.garden-center-tile').count(),5);
  const centerText=await page.locator('main').innerText();
  for(const title of['Seed Department','Planting Desk','Growing Spaces','Indoor Growing','Garden Chore Board'])assert.ok(centerText.includes(title),`${title} missing live`);
  for(const title of['Shopping List','Vacation Mode','Garden History'])assert.equal(centerText.includes(title),false,`${title} duplicated live on Garden Center`);
  assert.ok((await page.locator('.garden-center-hero').boundingBox()).height<160,'Live Garden Center header remains oversized');

  await goto('tools');
  await page.getByRole('heading',{name:'Tool Shed',exact:true}).waitFor();
  assert.equal(await page.locator('.tool-shed-directory-card').count(),11);
  assert.equal(await page.getByText('RECORDS & EXTRAS',{exact:true}).count(),1);
  assert.equal(await page.locator('details.tool-shed-drawer').count(),0);
  const weatherCases=[['Garden Weather','Weather for Your Garden','garden'],['Rain & Watering Review','Rain and Watering Review','rain'],['Frost & Planting Dates','Frost and Planting Timing','frost']];
  for(const[card,title,mode]of weatherCases){
   await goto('tools');
   await page.getByRole('button',{name:new RegExp(`^${card.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\.`)}).click();
   await page.getByRole('heading',{name:title,exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('runyan-weather-tool-mode-v1')),mode);
  }
  await context.close();
  await browser.close();browser=null;
  result={ok:true,base,attempt,health,expectedBuild,scriptPaths,stylePaths,gardenCenterDestinations:5,toolShedDestinations:11,weatherModes:3,viewport:390};
  break;
 }catch(error){
  if(browser)await browser.close().catch(()=>{});
  lastError=error;
  console.error(`[Phase 4.7.5 live check ${attempt}/${attempts}] ${error.message}`);
  if(attempt<attempts)await sleep(delay);
 }
}
assert.ok(result,`Live Phase 4.7.5 verification failed after ${attempts} attempts: ${lastError?.stack||lastError}`);
console.log(JSON.stringify(result,null,2));
