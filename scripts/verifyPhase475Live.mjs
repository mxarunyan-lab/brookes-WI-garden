import assert from'node:assert/strict';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
const expectedBuild='phase-4-7-9-seasonal-header-static-repair';
const attempts=Number(process.env.VERIFY_ATTEMPTS||48),delay=Number(process.env.VERIFY_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fetchText=async url=>{const response=await fetch(url,{cache:'no-store',headers:{'cache-control':'no-cache'}});assert.equal(response.status,200,`${url} returned ${response.status}`);return response.text()};
const currentGreenBaySeason=()=>{const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'numeric'}).format(new Date()));if(month>=3&&month<=5)return'spring';if(month>=6&&month<=8)return'summer';if(month>=9&&month<=11)return'fall';return'winter'};

let deployment=null,lastError=null;
for(let attempt=1;attempt<=attempts;attempt+=1){
 try{
  const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json','cache-control':'no-cache'},cache:'no-store'});
  assert.equal(healthResponse.status,200,`Health endpoint returned ${healthResponse.status}`);
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  const html=await fetchText(`${base}/?phase479=${Date.now()}`);
  const scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]);
  const stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match=>match[1]);
  assert.ok(scriptPaths.length,'Live JavaScript asset was not found.');
  assert.ok(stylePaths.length,'Live CSS asset was not found.');
  const js=(await Promise.all(scriptPaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  const css=(await Promise.all(stylePaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  assert.match(js,new RegExp(expectedBuild));
  assert.match(js,/Urgent Garden Alerts/);
  assert.match(js,/Nothing urgent right now/);
  assert.match(js,/watering-can-icon/);
  assert.match(js,/America\/Chicago/);
  assert.match(js,/CALCULATORS & UTILITIES/);
  assert.match(js,/WEATHER & TIMING/);
  assert.match(js,/RECORDS & EXTRAS/);
  assert.match(css,/garden-header-summer\.webp\?v=0479/);
  assert.match(css,/garden-header-summer\.avif\?v=0479/);
  assert.match(css,/aspect-ratio:2(?:\/1)?/);
  assert.match(css,/background-size:contain/);
  assert.match(css,/image-set\(/);
  assert.match(css,/urgent-alert-overlay/);
  assert.match(css,/z-index:5000/);
  assert.match(css,/100dvh/);
  assert.match(css,/compact-secondary-header/);
  assert.match(css,/tool-shed-directory-card/);
  assert.match(css,/garden-center-tile/);
  deployment={attempt,health,scriptPaths,stylePaths};
  break;
 }catch(error){
  lastError=error;
  console.error(`[Phase 4.7.9 deploy check ${attempt}/${attempts}] ${error.message}`);
  if(attempt<attempts)await sleep(delay);
 }
}
assert.ok(deployment,`Phase 4.7.9 never appeared live: ${lastError?.stack||lastError}`);

const liveSeason=currentGreenBaySeason(),seasonalAsset=`/images/garden-headers/garden-header-${liveSeason}.webp?v=0479`;
const assetResponse=await fetch(`${base}${seasonalAsset}`,{cache:'no-store'});
assert.equal(assetResponse.status,200,`${seasonalAsset} returned ${assetResponse.status}`);
assert.match(assetResponse.headers.get('content-type')||'',/image\/webp/);
assert.ok((await assetResponse.arrayBuffer()).byteLength>10000,`${seasonalAsset} is unexpectedly small`);

const browser=await chromium.launch({headless:true});
try{
 const widths=[320,375,390,430];
 for(const width of widths){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.addInitScript(()=>{
   localStorage.setItem('runyan-garden-active-profile','archie');
   localStorage.setItem('brookes-garden-state-v2',JSON.stringify({profile:{gardenerName:'Archie',gardenName:'The Runyan Garden',location:'Green Bay'}}));
  });
  const goto=async route=>{const response=await page.goto(`${base}/?page=${route}&phase479=${width}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response?.status(),200);await page.locator('main').waitFor()};
  await goto('today');
  const hero=page.locator('.compact-home-hero'),todayCard=page.locator('.what-matters-today'),title=page.locator('.compact-hero-title');
  await hero.waitFor();await todayCard.waitFor();await title.waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,`${width}px has horizontal overflow`);
  const heroBox=await hero.boundingBox(),cardBox=await todayCard.boundingBox(),titleBox=await title.boundingBox();
  assert.ok(Math.abs(heroBox.width/heroBox.height-2)<.04,`${width}px seasonal header ratio was ${heroBox.width/heroBox.height}`);
  assert.ok(cardBox.y<heroBox.y+heroBox.height,`${width}px Today card does not overlap the seasonal header`);
  assert.ok(titleBox.width>heroBox.width*.25&&titleBox.width<heroBox.width*.45,`${width}px live title panel width is incorrect`);
  assert.ok(titleBox.height>10&&titleBox.y>=heroBox.y&&titleBox.y+titleBox.height<=heroBox.y+heroBox.height,`${width}px live title panel is outside the header`);
  const heroStyle=await hero.evaluate(element=>({backgroundImage:getComputedStyle(element).backgroundImage,backgroundSize:getComputedStyle(element).backgroundSize,borderRadius:getComputedStyle(element).borderRadius,afterDisplay:getComputedStyle(element,'::after').display}));
  assert.ok(heroStyle.backgroundImage.includes(`garden-header-${liveSeason}.webp`),`Expected ${liveSeason} header, received ${heroStyle.backgroundImage}`);
  assert.equal(heroStyle.backgroundSize,'contain');
  assert.notEqual(heroStyle.borderRadius,'0px');
  assert.equal(heroStyle.afterDisplay,'none');
  const titleState=await title.evaluate(element=>({text:element.innerText,background:getComputedStyle(element).backgroundColor,clipPath:getComputedStyle(element).clipPath,overflow:getComputedStyle(element).overflow}));
  assert.match(titleState.text,/Archie’s Garden/);
  assert.match(titleState.text,/The Runyan Garden/);
  assert.match(titleState.text,/Green Bay/);
  assert.notEqual(titleState.background,'rgba(0, 0, 0, 0)');
  assert.equal(titleState.clipPath,'none');
  assert.equal(titleState.overflow,'hidden');
  assert.equal(await page.locator('.watering-can-icon').count(),1,'Watering can trigger is missing or duplicated');
  assert.equal(await page.getByText('GARDEN STATUS',{exact:true}).count(),0,'The removed Garden Status dashboard returned');
  assert.equal(await page.locator('.today-quick-links').count(),0,'Removed Today shortcut boxes returned');
  const trigger=page.getByRole('button',{name:/Urgent garden alerts/i});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Urgent Garden Alerts',exact:true});
  await dialog.waitFor();
  assert.equal(await page.locator('.urgent-alert-overlay').evaluate(element=>element.parentElement===document.body),true,'Urgent alert overlay is not attached to document.body');
  const dialogBox=await dialog.boundingBox();
  assert.ok(dialogBox.x>=0&&dialogBox.x+dialogBox.width<=width+1,`${width}px alert dialog exceeds viewport`);
  const dialogStyle=await dialog.evaluate(element=>({z:Number(getComputedStyle(element).zIndex),overflowY:getComputedStyle(element).overflowY}));
  const nav=page.locator('.bottom-nav');
  if(await nav.count())assert.ok(dialogStyle.z>(await nav.evaluate(element=>Number(getComputedStyle(element).zIndex)||0)),'Urgent alert dialog is behind bottom navigation');
  assert.equal(dialogStyle.overflowY,'auto');
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.classList.contains('urgent-garden-trigger'));
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  await context.close();
 }
 result={ok:true,base,deployment,expectedBuild,liveSeason,seasonalAsset,widths,gardenCenterDestinations:5,toolShedDestinations:11};
 console.log(JSON.stringify(result,null,2));
}finally{
 await browser.close();
}
