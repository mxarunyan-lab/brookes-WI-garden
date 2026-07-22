import assert from'node:assert/strict';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'https://brookes-wi-garden.onrender.com').replace(/\/$/,'');
const expectedBuild='phase-4-7-8-static-seasonal-header';
const attempts=Number(process.env.VERIFY_ATTEMPTS||48),delay=Number(process.env.VERIFY_DELAY_MS||10000);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fetchText=async url=>{const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200,`${url} returned ${response.status}`);return response.text()};
const currentGreenBaySeason=()=>{const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'numeric'}).format(new Date()));if(month>=3&&month<=5)return'spring';if(month>=6&&month<=8)return'summer';if(month>=9&&month<=11)return'fall';return'winter'};
let result=null,lastError=null;
for(let attempt=1;attempt<=attempts;attempt+=1){
 let browser;
 try{
  const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json'},cache:'no-store'});
  assert.equal(healthResponse.status,200,`Health endpoint returned ${healthResponse.status}`);
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.version,'0.20.6');
  const html=await fetchText(`${base}/`);
  const scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]);
  const stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match=>match[1]);
  assert.ok(scriptPaths.length,'Live JavaScript asset was not found.');
  assert.ok(stylePaths.length,'Live CSS asset was not found.');
  const js=(await Promise.all(scriptPaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  const css=(await Promise.all(stylePaths.map(path=>fetchText(new URL(path,`${base}/`).toString())))).join('\n');
  assert.match(js,new RegExp(expectedBuild));
  assert.match(js,/America\/Chicago/);
  assert.match(js,/CALCULATORS & UTILITIES/);
  assert.match(js,/WEATHER & TIMING/);
  assert.match(js,/RECORDS & EXTRAS/);
  assert.match(css,/garden-header-summer\.webp\?v=0478/);
  assert.match(css,/aspect-ratio:2\/1/);
  assert.match(css,/background-size:contain/);
  assert.match(css,/compact-secondary-header/);
  assert.match(css,/tool-shed-directory-card/);
  assert.match(css,/garden-center-tile/);
  const liveSeason=currentGreenBaySeason(),seasonalAsset=`/images/garden-headers/garden-header-${liveSeason}.webp?v=0478`;
  const assetResponse=await fetch(`${base}${seasonalAsset}`,{cache:'no-store'});
  assert.equal(assetResponse.status,200,`${seasonalAsset} returned ${assetResponse.status}`);
  assert.match(assetResponse.headers.get('content-type')||'',/image\/webp/);
  const imageBytes=await assetResponse.arrayBuffer();
  assert.ok(imageBytes.byteLength>10000,`${seasonalAsset} is unexpectedly small`);

  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.addInitScript(()=>localStorage.setItem('runyan-garden-active-profile','archie'));
  const goto=async route=>{const response=await page.goto(`${base}/?page=${route}&phase478=${Date.now()}`,{waitUntil:'domcontentloaded'});assert.equal(response?.status(),200);await page.locator('main').waitFor()};

  await goto('today');
  const hero=page.locator('.compact-home-hero');
  const todayCard=page.locator('.what-matters-today');
  const title=page.locator('.compact-hero-title');
  await hero.waitFor();
  await todayCard.waitFor();
  const heroBox=await hero.boundingBox(),cardBox=await todayCard.boundingBox(),titleBox=await title.boundingBox();
  assert.ok(heroBox.height>=180&&heroBox.height<=190,`Seasonal header height was ${heroBox.height}`);
  assert.ok(Math.abs(heroBox.width/heroBox.height-2)<.03,`Seasonal header ratio was ${heroBox.width/heroBox.height}`);
  assert.ok(cardBox.y<heroBox.y+heroBox.height,'Today card does not overlap the seasonal header');
  const heroStyle=await hero.evaluate(element=>({backgroundImage:getComputedStyle(element).backgroundImage,backgroundSize:getComputedStyle(element).backgroundSize,borderRadius:getComputedStyle(element).borderRadius,afterDisplay:getComputedStyle(element,'::after').display}));
  assert.ok(heroStyle.backgroundImage.includes(`garden-header-${liveSeason}.webp`),`Expected ${liveSeason} header, received ${heroStyle.backgroundImage}`);
  assert.equal(heroStyle.backgroundSize,'contain');
  assert.notEqual(heroStyle.borderRadius,'0px');
  assert.equal(heroStyle.afterDisplay,'none');
  assert.ok(titleBox.width<=1&&titleBox.height<=1,'A duplicate live title panel is still visible over the approved artwork');
  assert.equal(await page.locator('.today-quick-links').count(),0,'Removed Today shortcut boxes returned');
  assert.equal(await page.locator('.hero-bell').count(),1,'Notification bell was duplicated');

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
  result={ok:true,base,attempt,health,expectedBuild,liveSeason,seasonalAsset,headerRatio:heroBox.width/heroBox.height,scriptPaths,stylePaths,gardenCenterDestinations:5,toolShedDestinations:11,weatherModes:3,viewport:390};
  break;
 }catch(error){
  if(browser)await browser.close().catch(()=>{});
  lastError=error;
  console.error(`[Phase 4.7.8 live check ${attempt}/${attempts}] ${error.message}`);
  if(attempt<attempts)await sleep(delay);
 }
}
assert.ok(result,`Live Phase 4.7.8 verification failed after ${attempts} attempts: ${lastError?.stack||lastError}`);
console.log(JSON.stringify(result,null,2));
