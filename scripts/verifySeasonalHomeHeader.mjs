import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{chromium}from'playwright';
import{getGreenBaySeason,SEASONAL_HEADER_IMAGES}from'../src/seasonalGardenHeader.js';

const base=(process.env.APP_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const widths=[320,375,390,430];
const expectedSeason=getGreenBaySeason();
const expectedImage=SEASONAL_HEADER_IMAGES[expectedSeason];
const results=[];
let paidPacketRequests=0;
await mkdir('seasonal-home-audit',{recursive:true});
const browser=await chromium.launch({headless:true});

const gardenState=profile=>({
 profile,
 spaces:[],plants:[],seedPackets:[],seedUsage:[],trays:[],growLights:[],hardeningPlans:[],hydroPods:[],greenhouseReadings:[],reminders:[],taskHistory:[],plantingDecisions:[],shoppingItems:[],yearPlan:{crops:[]},weatherRecommendationHistory:[],vacationPlans:[],calculatorResults:[],seedTransactions:[],wateringEvents:[],soilCheckEvents:[],photos:[],attachments:[],qrLabels:[],offlineOperations:[],problems:[],harvests:[],activity:[],succession:[],vacationTasks:[],environmentalRecords:[],environmentalCorrections:[]
});
const defaultProfile={gardenerName:'Archie',gardenName:'The Runyan Garden',location:'Green Bay, Wisconsin',zone:'5b',activeProfileId:'archie'};

async function open(width,profile=defaultProfile){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:900},deviceScaleFactor:1});
 await context.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'0.20.5',packetVisionConfigured:false})}));
 await context.route('**/api/seed-packets/analyze',route=>{paidPacketRequests+=1;return route.abort()});
 const page=await context.newPage();
 await page.addInitScript(state=>{
  localStorage.setItem('runyan-garden-active-profile','archie');
  localStorage.setItem('brookes-garden-page-v2','today');
  localStorage.setItem('brookes-garden-state-v2',JSON.stringify(state));
 },gardenState(profile));
 const response=await page.goto(`${base}/?page=today&seasonal=${Date.now()}`,{waitUntil:'networkidle'});
 assert.equal(response?.status(),200,`Today failed at ${width}px`);
 await page.locator('.seasonal-garden-header').waitFor();
 await page.locator('.today-dashboard-card').waitFor();
 return{context,page};
}

async function certify(page,width){
 const header=page.locator('.seasonal-garden-header'),image=header.locator('.seasonal-garden-header__image'),identity=header.locator('.seasonal-garden-header__identity'),bell=header.getByRole('button',{name:'Open garden notifications'}),card=page.locator('.today-dashboard-card');
 assert.equal(await header.count(),1,`Seasonal header duplicated at ${width}px`);
 assert.equal(await image.count(),1,`Seasonal image duplicated at ${width}px`);
 assert.equal(await bell.count(),1,`Notification bell duplicated at ${width}px`);
 assert.equal(await page.getByRole('heading',{name:'Today',exact:true}).count(),1,`Today heading duplicated at ${width}px`);
 assert.equal(await header.getAttribute('data-season'),expectedSeason,`Current Green Bay season is wrong at ${width}px`);
 assert.equal(await image.getAttribute('src'),expectedImage,`Wrong ${expectedSeason} image source at ${width}px`);
 const imageData=await image.evaluate(node=>({complete:node.complete,naturalWidth:node.naturalWidth,naturalHeight:node.naturalHeight,fit:getComputedStyle(node).objectFit,position:getComputedStyle(node).objectPosition}));
 assert.equal(imageData.complete,true,`Seasonal image did not complete at ${width}px`);
 assert.ok(imageData.naturalWidth>=600&&imageData.naturalHeight>=300,`Seasonal image is undersized: ${JSON.stringify(imageData)}`);
 assert.ok(Math.abs(imageData.naturalWidth/imageData.naturalHeight-2)<.01,`Seasonal image ratio changed: ${JSON.stringify(imageData)}`);
 assert.equal(imageData.fit,'cover',`Seasonal image is stretched at ${width}px`);
 const[headerRect,cardRect,identityRect,bellRect]=await Promise.all([header.boundingBox(),card.boundingBox(),identity.boundingBox(),bell.boundingBox()]);
 assert.ok(headerRect&&headerRect.height>=148&&headerRect.height<=190,`Header is not compact at ${width}px: ${headerRect?.height}`);
 assert.ok(cardRect&&headerRect&&headerRect.y+headerRect.height-cardRect.y>=14&&headerRect.y+headerRect.height-cardRect.y<=32,`Today overlap is not intentional at ${width}px: ${JSON.stringify({headerRect,cardRect})}`);
 assert.ok(cardRect.y>headerRect.y+headerRect.height*.68,`Today card covers important header artwork at ${width}px`);
 assert.ok(cardRect.y<900&&cardRect.y+Math.min(cardRect.height,220)<700,`Header and Today card dominate the first screen at ${width}px`);
 assert.ok(identityRect&&bellRect&&identityRect.x+identityRect.width<=bellRect.x-6,`Identity panel collides with bell at ${width}px`);
 const panelStyle=await identity.evaluate(node=>({background:getComputedStyle(node).backgroundColor,opacity:getComputedStyle(node).opacity}));
 assert.match(panelStyle.background,/rgba?\(/,`Identity panel lacks an opaque surface at ${width}px`);
 assert.equal(panelStyle.opacity,'1');
 assert.equal(panelStyle.background,'rgb(255, 250, 240)',`Identity panel must completely hide baked image text at ${width}px`);
 const title=await header.locator('.seasonal-garden-header__title').innerText(),subtitle=await header.locator('.seasonal-garden-header__subtitle').innerText();
 assert.equal(title,'Archie’s Garden');
 assert.equal(subtitle,'The Runyan Garden — Green Bay');
 const cardText=await card.innerText();
 assert.ok(cardText.includes('Today'));
 assert.ok(/caught up|Nothing needs attention/i.test(cardText),`Simple caught-up state is missing at ${width}px: ${cardText}`);
 for(const forbidden of['Plant Journal','Growing Spaces','Garden Tasks'])assert.equal(cardText.includes(forbidden),false,`${forbidden} shortcut was added at ${width}px`);
 assert.equal(await page.locator('.today-quick-links').count(),0,'Today shortcut boxes returned.');
 const navLabels=await page.locator('.bottom-nav button').allTextContents();
 assert.deepEqual(navLabels.map(value=>value.trim()),['Today','Garden','Center','Tool Shed','More'],`Bottom navigation changed at ${width}px`);
 await bell.click();
 await page.getByText('Garden notifications',{exact:true}).waitFor({state:'visible'});
 await bell.click();
 const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,bodyWidth:document.body.scrollWidth}));
 assert.ok(overflow.scrollWidth<=overflow.clientWidth+1&&overflow.bodyWidth<=overflow.clientWidth+1,`Today overflows at ${width}px: ${JSON.stringify(overflow)}`);
 await page.screenshot({path:`seasonal-home-audit/today-${width}.png`,fullPage:true});
 return{width,season:expectedSeason,headerHeight:headerRect.height,overlap:headerRect.y+headerRect.height-cardRect.y,imageData};
}

try{
 for(const width of widths){const{context,page}=await open(width);results.push(await certify(page,width));await context.close()}
 const longProfile={gardenerName:'Alexandria James',gardenName:'The Very Long Runyan Community Garden',location:'Green Bay, Wisconsin',activeProfileId:'archie'};
 {const{context,page}=await open(320,longProfile);const title=page.locator('.seasonal-garden-header__title'),subtitle=page.locator('.seasonal-garden-header__subtitle'),bell=page.getByRole('button',{name:'Open garden notifications'});const[titleRect,subtitleRect,bellRect]=await Promise.all([title.boundingBox(),subtitle.boundingBox(),bell.boundingBox()]);assert.ok(titleRect&&titleRect.height<50,'Long gardener name exceeds two lines');assert.ok(subtitleRect&&subtitleRect.height<45,'Long garden identity exceeds two lines');assert.ok(subtitleRect.x+subtitleRect.width<=bellRect.x-4,'Long identity collides with bell');await page.screenshot({path:'seasonal-home-audit/today-320-long-identity.png',fullPage:true});await context.close()}
 {const{context,page}=await open(390,{gardenerName:'Archie',gardenName:'The Runyan Garden',location:'',activeProfileId:'archie'});assert.equal(await page.locator('.seasonal-garden-header__subtitle').innerText(),'The Runyan Garden');assert.equal((await page.locator('.seasonal-garden-header__subtitle').innerText()).includes('—'),false,'Missing location left a dangling dash');await context.close()}
 assert.equal(paidPacketRequests,0,'Seasonal Home QA made a paid packet-analysis request.');
 await writeFile('seasonal-home-audit/results.json',JSON.stringify({ok:true,widths,expectedSeason,expectedImage,results,paidPacketRequests},null,2));
 console.log(JSON.stringify({ok:true,widths,expectedSeason,expectedImage,paidPacketRequests},null,2));
}finally{await browser.close()}
