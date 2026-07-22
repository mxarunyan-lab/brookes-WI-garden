import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const widths=[320,375,390,430,768,1200];
const garden={
 profile:{gardenerName:'Archie',activeProfileId:'archie',gardenName:'The Runyan Garden',location:'Green Bay, Wisconsin',zone:'5b'},
 spaces:[{id:'space-qa',name:'QA Garden Bed',type:'bed',hidden:false,deletedAt:null}],
 plants:[],seedPackets:[],seedUsage:[],trays:[],growLights:[],hardeningPlans:[],hydroPods:[],greenhouseReadings:[],
 reminders:[],taskHistory:[],plantingDecisions:[],shoppingItems:[{id:'shop-qa',name:'QA Soil',category:'Soil & Amendments',quantity:1,purchased:false,alreadyOwned:false,deletedAt:null}],
 yearPlan:{crops:[]},weatherRecommendationHistory:[],vacationPlans:[{id:'trip-qa',status:'completed',departureDate:'2026-07-01',returnDate:'2026-07-03',tasks:[],deletedAt:null}],calculatorResults:[],seedTransactions:[],wateringEvents:[],soilCheckEvents:[],photos:[],attachments:[],qrLabels:[],offlineOperations:[],
 problems:[],harvests:[{id:'harvest-qa',name:'QA Tomato',amount:1,unit:'count',harvestedAt:'2026-07-20T12:00:00.000Z',deletedAt:null}],activity:[],succession:[],vacationTasks:[],environmentalRecords:[],environmentalCorrections:[]
};
const centerTitles=['Seed Department','Planting Desk','Growing Spaces','Indoor Growing','Garden Chore Board'];
const removedCenter=['Shopping List','Vacation Mode','Garden History'];
const toolTitles=['Spacing Calculator','Soil & Container Calculator','Seed Quantity Calculator','Garden Measurements','Garden Weather','Rain & Watering Review','Frost & Planting Dates','Shopping List','Vacation Mode','Printable Garden Pack & Labels','Garden History'];
const results=[];
await mkdir('phase475-audit/garden-center',{recursive:true});
await mkdir('phase475-audit/tool-shed',{recursive:true});
await mkdir('phase475-audit/headers',{recursive:true});
const browser=await chromium.launch({headless:true});

const openContext=async width=>{
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:width<500?900:1000},deviceScaleFactor:1});
 await context.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'0.20.4',packetVisionConfigured:false})}));
 const page=await context.newPage();
 await page.addInitScript(data=>{
  localStorage.setItem('runyan-garden-active-profile','archie');
  localStorage.setItem('brookes-garden-state-v2',JSON.stringify(data));
 },garden);
 return{context,page};
};
const goto=async(page,route)=>{
 const response=await page.goto(`${base}/?page=${route}`,{waitUntil:'domcontentloaded'});
 assert.equal(response?.status(),200,`${route} failed to load`);
 await page.locator('main').waitFor();
};
const noOverflow=async(page,label)=>{
 const row=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,bodyScrollWidth:document.body.scrollWidth}));
 assert.ok(row.scrollWidth<=row.clientWidth+1,`${label} document overflow ${JSON.stringify(row)}`);
 assert.ok(row.bodyScrollWidth<=row.clientWidth+1,`${label} body overflow ${JSON.stringify(row)}`);
};
const assertCards=async(page,selector,label)=>{
 const cards=page.locator(selector),count=await cards.count();
 for(let index=0;index<count;index+=1){
  const card=cards.nth(index),geometry=await card.evaluate(node=>{
   const cardRect=node.getBoundingClientRect(),title=node.querySelector('strong'),copy=node.querySelector('.garden-center-tile-copy,.secondary-card-copy'),arrow=node.querySelector('.garden-center-tile-arrow,.secondary-card-chevron')||[...node.querySelectorAll('svg')].at(-1);
   if(!title||!arrow)return{cardRect:null,titleRect:null,arrowRect:null,copyOverflow:true};
   const range=document.createRange();range.selectNodeContents(title);
   const titleRect=range.getBoundingClientRect(),arrowRect=arrow.getBoundingClientRect();
   return{cardRect:{x:cardRect.x,width:cardRect.width,right:cardRect.right},titleRect:{left:titleRect.left,right:titleRect.right,top:titleRect.top,bottom:titleRect.bottom},arrowRect:{left:arrowRect.left,right:arrowRect.right,top:arrowRect.top,bottom:arrowRect.bottom},copyOverflow:Boolean(copy&&copy.scrollWidth>copy.clientWidth+1)};
  });
  assert.ok(geometry.cardRect&&geometry.titleRect&&geometry.arrowRect,`${label} card ${index} missing title or arrow geometry`);
  assert.ok(geometry.cardRect.x>=-1&&geometry.cardRect.right<=page.viewportSize().width+1,`${label} card ${index} leaves viewport: ${JSON.stringify(geometry)}`);
  assert.equal(geometry.copyOverflow,false,`${label} card ${index} copy overflows its grid column: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.titleRect.right<=geometry.arrowRect.left+2,`${label} card ${index} visible title collides with arrow: ${JSON.stringify(geometry)}`);
 }
};

try{
 for(const width of widths){
  const{context,page}=await openContext(width);
  await goto(page,'center');
  await page.getByRole('heading',{name:'Garden Center',exact:true}).waitFor();
  assert.equal(await page.locator('.garden-center-tile').count(),5,`Garden Center count at ${width}`);
  for(const title of centerTitles)assert.equal(await page.getByRole('button',{name:new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\.`)}).count(),1,`${title} count at ${width}`);
  const centerText=await page.locator('main').innerText();
  for(const title of removedCenter)assert.equal(centerText.includes(title),false,`${title} duplicated on Garden Center at ${width}`);
  const hero=await page.locator('.garden-center-hero').boundingBox(),first=await page.locator('.garden-center-tile').first().boundingBox();
  assert.ok(hero&&hero.height<160,`Garden Center header is oversized at ${width}: ${hero?.height}`);
  assert.ok(first&&first.y>=hero.y+hero.height-1,`Garden Center first card overlaps header at ${width}`);
  await noOverflow(page,`Garden Center ${width}`);
  if([320,390,768].includes(width))await page.screenshot({path:`phase475-audit/garden-center/garden-center-${width}.png`,fullPage:true});
  await assertCards(page,'.garden-center-tile',`Garden Center ${width}`);

  await goto(page,'tools');
  await page.getByRole('heading',{name:'Tool Shed',exact:true}).waitFor();
  assert.equal(await page.locator('.tool-shed-directory-card').count(),11,`Tool Shed count at ${width}`);
  for(const title of toolTitles)assert.equal(await page.getByRole('button',{name:new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\.`)}).count(),1,`${title} count at ${width}`);
  for(const heading of['CALCULATORS & UTILITIES','WEATHER & TIMING','RECORDS & EXTRAS'])assert.equal(await page.getByText(heading,{exact:true}).count(),1,`${heading} count at ${width}`);
  assert.equal(await page.locator('details.tool-shed-drawer').count(),0,`Tool Shed drawer remains at ${width}`);
  await noOverflow(page,`Tool Shed ${width}`);
  if([320,390,768].includes(width))await page.screenshot({path:`phase475-audit/tool-shed/tool-shed-${width}.png`,fullPage:true});
  await assertCards(page,'.tool-shed-directory-card',`Tool Shed ${width}`);
  const last=page.locator('.tool-shed-directory-card').last();
  await last.scrollIntoViewIfNeeded();
  const clearance=await page.evaluate(()=>{const last=document.querySelector('.tool-shed-directory-card:last-of-type')||[...document.querySelectorAll('.tool-shed-directory-card')].at(-1),nav=document.querySelector('.bottom-nav');const a=last?.getBoundingClientRect(),b=nav?.getBoundingClientRect();return{lastBottom:a?.bottom||0,navTop:b?.top||innerHeight,viewport:innerHeight}});
  assert.ok(clearance.lastBottom<=clearance.navTop+1||clearance.lastBottom<=clearance.viewport-70,`Final Tool Shed card remains behind navigation at ${width}: ${JSON.stringify(clearance)}`);
  results.push({width,gardenCenter:'pass',toolShed:'pass',clearance});
  await context.close();
 }

 const{context,page}=await openContext(390);
 await goto(page,'today');
 assert.equal(await page.locator('.compact-home-hero').count(),1,'Today illustrated hero missing');
 assert.equal(await page.locator('.compact-secondary-header').count(),0,'Today was flattened into secondary header');
 await goto(page,'garden');
 assert.equal(await page.locator('.garden-header').count(),1,'My Garden primary header missing');
 assert.equal(await page.locator('.compact-secondary-header').count(),0,'My Garden was flattened into secondary header');

 const secondaryRoutes=[['center','Garden Center'],['tools','Tool Shed'],['plan-plant','Planting Desk'],['indoor','Indoor Growing'],['chores','Chore Board'],['spacing-calculator','Spacing Calculator'],['soil-calculator','Soil & Container Calculator'],['seed-quantity-calculator','Seed Quantity Calculator'],['garden-measurements','Garden Measurements'],['shopping-list','Garden Shopping List'],['vacation','Vacation Mode'],['printable-pack','Printable Garden Pack'],['memory','Garden History'],['admin-about','About']];
 for(const[route,title]of secondaryRoutes){
  await goto(page,route);
  await page.getByRole('heading',{name:title,exact:true}).first().waitFor();
  const header=page.locator('.compact-secondary-header').first();
  assert.equal(await header.count(),1,`${route} does not use compact secondary header`);
  const headerRect=await header.boundingBox(),content=page.locator('main>section').nth(1),contentRect=await content.boundingBox();
  assert.ok(headerRect&&headerRect.height<170,`${route} header is oversized: ${headerRect?.height}`);
  if(contentRect)assert.ok(contentRect.y>=headerRect.y+headerRect.height-1,`${route} content overlaps header`);
  await noOverflow(page,route);
 }

 await goto(page,'tools');
 const weatherCases=[['Garden Weather','Weather for Your Garden','garden'],['Rain & Watering Review','Rain and Watering Review','rain'],['Frost & Planting Dates','Frost and Planting Timing','frost']];
 for(const[card,title,mode]of weatherCases){
  await goto(page,'tools');
  await page.getByRole('button',{name:new RegExp(`^${card.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\.`)}).click();
  await page.getByRole('heading',{name:title,exact:true}).waitFor();
  assert.match(page.url(),/[?&]page=weather/);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('runyan-weather-tool-mode-v1')),mode,`${card} opened wrong mode`);
 }

 const moved=[['Shopping List','Garden Shopping List','shopping-list'],['Vacation Mode','Vacation Mode','vacation'],['Garden History','Garden History','memory']];
 for(const[card,title,route]of moved){
  await goto(page,'tools');
  await page.getByRole('button',{name:new RegExp(`^${card.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\.`)}).click();
  await page.getByRole('heading',{name:title,exact:true}).first().waitFor();
  assert.match(page.url(),new RegExp(`[?&]page=${route}`));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:title,exact:true}).first().waitFor();
  assert.match(page.url(),new RegExp(`[?&]page=${route}`));
  const back=page.getByRole('button',{name:'Back to Tool Shed'}).first();
  await back.click();
  await page.getByRole('heading',{name:'Tool Shed',exact:true}).waitFor();
 }

 await goto(page,'tools');
 await page.getByRole('button',{name:/^Shopping List\./}).click();
 await page.getByRole('heading',{name:'Garden Shopping List',exact:true}).waitFor();
 await page.goBack({waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Tool Shed',exact:true}).waitFor();
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('brookes-garden-state-v2')||'{}'));
 assert.ok(persisted.shoppingItems?.some(row=>row.id==='shop-qa'),'Shopping data changed during navigation');
 assert.ok(persisted.vacationPlans?.some(row=>row.id==='trip-qa'),'Vacation data changed during navigation');
 assert.ok(persisted.harvests?.some(row=>row.id==='harvest-qa'),'History data changed during navigation');
 await context.close();
 await writeFile('phase475-audit/results.json',JSON.stringify({ok:true,widths,results,paidPacketRequests:0},null,2));
 console.log(JSON.stringify({ok:true,widths,checks:results.length,paidPacketRequests:0},null,2));
}finally{await browser.close()}
