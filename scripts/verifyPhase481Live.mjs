import assert from'node:assert/strict';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const expectedBuild='phase-4-8-1-mobile-continuity';
const attempts=Number(process.env.VERIFY_ATTEMPTS||48),delay=Number(process.env.VERIFY_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fetchText=async url=>{const response=await fetch(url,{cache:'no-store',headers:{'cache-control':'no-cache'}});assert.equal(response.status,200,`${url} returned ${response.status}`);return response.text()};
const currentGreenBaySeason=()=>{const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'numeric'}).format(new Date()));if(month>=3&&month<=5)return'spring';if(month>=6&&month<=8)return'summer';if(month>=9&&month<=11)return'fall';return'winter'};

let deployment=null,lastError=null;
for(let attempt=1;attempt<=attempts;attempt+=1){try{
 const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json','cache-control':'no-cache'},cache:'no-store'});assert.equal(healthResponse.status,200);const health=await healthResponse.json();assert.equal(health.ok,true);assert.equal(health.version,'0.20.9');
 const html=await fetchText(`${base}/?phase481=${Date.now()}`),scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m=>m[1]),stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m=>m[1]);assert.ok(scriptPaths.length);assert.ok(stylePaths.length);
 const js=(await Promise.all(scriptPaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n'),css=(await Promise.all(stylePaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
 assert.match(js,new RegExp(expectedBuild));assert.match(js,/Garden Weather & Timing/);assert.match(js,/Garden Buddy/);assert.match(js,/Add a Growing Space first/);assert.match(js,/WateringCanIcon|watering-can-icon/);
 assert.match(css,/garden-header-summer\.webp\?v=0480/);assert.match(css,/aspect-ratio:2(?:\/1)?/);assert.match(css,/background-size:contain/);assert.match(css,/tool-shed-category-summary/);assert.match(css,/more-settings-hub:not\(\[open\]\)>div/);assert.match(css,/var\(--green-950\)/);
 deployment={attempt,health,scriptPaths,stylePaths};break;
}catch(error){lastError=error;console.error(`[Phase 4.8.1 deploy check ${attempt}/${attempts}] ${error.message}`);if(attempt<attempts)await sleep(delay)}}
assert.ok(deployment,`Phase 4.8.1 never appeared live: ${lastError?.stack||lastError}`);

const liveSeason=currentGreenBaySeason(),seasonalAsset=`/images/garden-headers/garden-header-${liveSeason}.webp?v=0480`,assetResponse=await fetch(`${base}${seasonalAsset}`,{cache:'no-store'});assert.equal(assetResponse.status,200);assert.match(assetResponse.headers.get('content-type')||'',/image\/webp/);assert.ok((await assetResponse.arrayBuffer()).byteLength>10000);

const browser=await chromium.launch({headless:true});
try{const widths=[320,375,390,430];for(const width of widths){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:900},deviceScaleFactor:1}),page=await context.newPage();
 await page.addInitScript(()=>{localStorage.setItem('runyan-garden-active-profile','archie');localStorage.setItem('brookes-garden-state-v2',JSON.stringify({profile:{gardenerName:'Archie',gardenName:'The Runyan Garden',location:'Green Bay'},spaces:[],plants:[],vacationPlans:[]}))});
 const goto=async route=>{const response=await page.goto(`${base}/?page=${route}&phase481=${width}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response?.status(),200);await page.locator('main').waitFor()};
 await goto('today');const hero=page.locator('.compact-home-hero'),todayCard=page.locator('.what-matters-today');await hero.waitFor();await todayCard.waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);const heroBox=await hero.boundingBox(),cardBox=await todayCard.boundingBox();assert.ok(Math.abs(heroBox.width/heroBox.height-2)<.04);assert.ok(cardBox.y<heroBox.y+heroBox.height);
 const heroStyle=await hero.evaluate(el=>({backgroundImage:getComputedStyle(el).backgroundImage,backgroundSize:getComputedStyle(el).backgroundSize,borderRadius:getComputedStyle(el).borderRadius}));assert.ok(heroStyle.backgroundImage.includes(`garden-header-${liveSeason}.webp`));assert.equal(heroStyle.backgroundSize,'contain');assert.match(heroStyle.borderRadius,/22px 22px 0px 0px|18px 18px 0px 0px/);assert.equal(await page.locator('.watering-can-icon').count(),1);
 await goto('more');const settings=page.locator('.more-settings-hub');await settings.waitFor();assert.equal(await settings.getAttribute('open'),null);assert.equal(await settings.locator(':scope > div').evaluate(el=>getComputedStyle(el).display),'none');
 await goto('tools');assert.equal(await page.locator('.tool-shed-category').count(),3);assert.equal(await page.locator('.tool-shed-card-list').count(),0);await page.getByRole('button',{name:/Weather & Timing/}).click();assert.equal(await page.getByText('Garden Weather & Timing',{exact:true}).count(),1);await page.getByText('Garden Weather & Timing',{exact:true}).click();await page.getByRole('heading',{name:'Garden Weather & Timing'}).waitFor();assert.equal(await page.getByRole('tab').count(),3);await context.close();}
 console.log(JSON.stringify({ok:true,base,deployment,expectedBuild,liveSeason,seasonalAsset,widths:[320,375,390,430]},null,2));
}finally{await browser.close()}
