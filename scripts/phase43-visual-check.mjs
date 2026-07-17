import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173';
const widths=[320,375,390,430];
const outDir=path.resolve('phase43-artifacts');
await fs.mkdir(outDir,{recursive:true});
const report={baseUrl,widths,runs:[],startedAt:new Date().toISOString()};

const routeClass=pageName=>`.app-shell.page-${pageName}`;

async function waitRoute(page,name){
 await page.locator(routeClass(name)).waitFor({state:'attached',timeout:10000});
 await page.waitForTimeout(120);
}

async function enterGarden(page){
 if(await page.getByText('Who’s in the garden?',{exact:true}).count()){
  await page.locator('.profile-choice-list button').filter({hasText:'Brooke'}).first().click();
  await page.waitForTimeout(200);
 }
}

async function clickBottom(page,label,route){
 const nav=page.locator('nav.bottom-nav');
 await nav.getByRole('button',{name:label,exact:true}).click();
 await waitRoute(page,route);
}

async function activeTab(page,label){
 const current=page.locator('nav.bottom-nav button[aria-current="page"]');
 const text=(await current.innerText()).trim();
 if(text!==label)throw new Error(`Expected active bottom tab ${label}, received ${text||'none'}`);
}

async function noOverflow(page,label){
 const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth}));
 if(metrics.scrollWidth>metrics.innerWidth+1||metrics.bodyWidth>metrics.innerWidth+1)throw new Error(`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
}

async function bottomClearance(page,label){
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await page.waitForTimeout(80);
 const result=await page.evaluate(()=>{
  const nav=document.querySelector('.bottom-nav');
  const main=document.querySelector('main');
  if(!nav||!main)return{ok:false,reason:'missing main or nav'};
  const items=[...main.querySelectorAll('button,a,input,select,textarea,summary')].filter(el=>{
   const style=getComputedStyle(el),rect=el.getBoundingClientRect();
   return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
  });
  const last=items.at(-1);
  if(!last)return{ok:true,reason:'no interactive content'};
  const rect=last.getBoundingClientRect(),navRect=nav.getBoundingClientRect();
  return{ok:rect.bottom<=navRect.top+1,lastBottom:rect.bottom,navTop:navRect.top,scrollY:window.scrollY,scrollHeight:document.documentElement.scrollHeight,lastText:(last.textContent||last.getAttribute('aria-label')||'').trim().slice(0,80)};
 });
 if(!result.ok)throw new Error(`${label}: final action may be hidden by navigation ${JSON.stringify(result)}`);
}

async function capture(page,width,name){
 await page.screenshot({path:path.join(outDir,`${width}-${name}.png`),fullPage:true});
}

async function checkScreen(page,width,{name,route,active='Center',screenshot=false}){
 await waitRoute(page,route);
 await activeTab(page,active);
 await noOverflow(page,`${width}-${name}`);
 await bottomClearance(page,`${width}-${name}`);
 if(screenshot)await capture(page,width,name);
}

async function clickCard(page,text){
 const candidate=page.getByRole('button',{name:new RegExp(text,'i')}).first();
 await candidate.scrollIntoViewIfNeeded();
 await candidate.click();
}

for(const width of widths){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const problems=[];
 page.on('pageerror',error=>problems.push(`pageerror: ${error.message}`));
 page.on('console',message=>{
  if(message.type()==='error'&&!/Failed to load resource|net::ERR_|service worker/i.test(message.text()))problems.push(`console: ${message.text()}`);
 });
 const run={width,screens:[],problems};
 report.runs.push(run);
 try{
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await enterGarden(page);
  await waitRoute(page,'today');
  await activeTab(page,'Today');
  await noOverflow(page,`${width}-today`);
  await capture(page,width,'today-locked');
  run.screens.push('Today');

  await clickBottom(page,'Garden','garden');
  await activeTab(page,'Garden');
  await noOverflow(page,`${width}-garden`);
  await capture(page,width,'garden-locked');
  run.screens.push('Runyan Garden');

  await clickBottom(page,'Center','center');
  for(const text of ['Care Desk','Planting Department','Garden Shopping List','Seed Department','Indoor Growing','Records Counter','Next Season'])await page.getByText(text,{exact:false}).first().waitFor();
  await checkScreen(page,width,{name:'center',route:'center',active:'Center',screenshot:true});
  run.screens.push('Runyan Garden Center');

  const centerScreens=[
   {card:'Care Desk',route:'chores',name:'chore-board',back:'Back to Garden Center'},
   {card:'Planting Department',route:'plan-plant',name:'planting-desk',back:'Back to Garden Center'},
   {card:'Garden Shopping List',route:'shopping-list',name:'shopping-list',back:'Back to Garden Center'},
   {card:'Seed Department',route:'seed-tools',name:'seed-inventory',back:'Back to Garden Center'},
   {card:'Indoor Growing',route:'indoor',name:'indoor-growing',back:'Go back'},
   {card:'Records Counter',route:'memory',name:'garden-records',back:'Go back'},
   {card:'Next Season',route:'plan-plant',name:'next-season',back:'Back to Garden Center'}
  ];
  for(const item of centerScreens){
   await clickCard(page,item.card);
   await checkScreen(page,width,{name:item.name,route:item.route,active:'Center',screenshot:['chore-board','planting-desk','shopping-list','seed-inventory','indoor-growing','garden-records'].includes(item.name)});
   if(item.name==='planting-desk')await page.getByText('Grow Now',{exact:true}).first().waitFor();
   const back=page.getByRole('button',{name:item.back,exact:true}).first();
   await back.click();
   await checkScreen(page,width,{name:`center-return-${item.name}`,route:'center',active:'Center'});
   run.screens.push(item.name);
  }

  await clickBottom(page,'Tool Shed','tools');
  for(const text of ['Plant Labels','Printable Garden Pack','Spacing Calculator','Soil & Container Calculator','Frost & Planting Dates','Seed Quantity Calculator','Garden Measurements'])await page.getByText(text,{exact:true}).first().waitFor();
  await checkScreen(page,width,{name:'tool-shed',route:'tools',active:'Tool Shed',screenshot:true});
  run.screens.push('Tool Shed');
  const toolScreens=[
   {card:'Plant Labels',route:'labels',name:'plant-labels'},
   {card:'Printable Garden Pack',route:'printable-pack',name:'printable-pack'},
   {card:'Spacing Calculator',route:'spacing-calculator',name:'spacing-calculator'},
   {card:'Soil & Container Calculator',route:'soil-calculator',name:'soil-calculator'},
   {card:'Frost & Planting Dates',route:'frost-calculator',name:'frost-calculator'},
   {card:'Seed Quantity Calculator',route:'seed-quantity-calculator',name:'seed-quantity-calculator'},
   {card:'Garden Measurements',route:'garden-measurements',name:'garden-measurements'}
  ];
  for(const item of toolScreens){
   await clickCard(page,item.card);
   await checkScreen(page,width,{name:item.name,route:item.route,active:'Tool Shed',screenshot:['plant-labels','soil-calculator'].includes(item.name)});
   if(item.route.includes('calculator')||item.route==='garden-measurements')await page.locator('.tool-result-card').first().waitFor();
   await page.getByRole('button',{name:'Back to Tool Shed',exact:true}).click();
   await checkScreen(page,width,{name:`tools-return-${item.name}`,route:'tools',active:'Tool Shed'});
   run.screens.push(item.name);
  }

  await clickBottom(page,'More','more');
  const moreCards=['Garden Profile','Location and Frost Dates','Notification Settings','Backup and Restore','Quick Help','What’s New','Help and Support','About'];
  for(const text of moreCards)await page.getByText(text,{exact:true}).first().waitFor();
  if(await page.getByText('Garden Settings Overview',{exact:true}).count())throw new Error('Garden Settings Overview returned');
  await checkScreen(page,width,{name:'more',route:'more',active:'More',screenshot:true});
  run.screens.push('More');
  const moreScreens=[
   {card:'Garden Profile',route:'admin-profile',name:'garden-profile'},
   {card:'Location and Frost Dates',route:'admin-location',name:'location-frost'},
   {card:'Notification Settings',route:'admin-notifications',name:'notification-settings'},
   {card:'Backup and Restore',route:'admin-backup',name:'backup-restore'},
   {card:'Quick Help',route:'admin-help',name:'quick-help'},
   {card:'What’s New',route:'admin-whatsnew',name:'whats-new'},
   {card:'Help and Support',route:'admin-support',name:'help-support'},
   {card:'About',route:'admin-about',name:'about'}
  ];
  for(const item of moreScreens){
   await clickCard(page,item.card);
   await checkScreen(page,width,{name:item.name,route:item.route,active:'More',screenshot:item.name==='location-frost'});
   await page.getByRole('button',{name:'Back to More',exact:true}).click();
   await checkScreen(page,width,{name:`more-return-${item.name}`,route:'more',active:'More'});
   run.screens.push(item.name);
  }
  if(problems.length)throw new Error(`Browser errors: ${problems.join(' | ')}`);
 }catch(error){
  run.failure=error.stack||String(error);
  run.url=page.url();
  run.title=await page.title().catch(()=>"");
  run.bodyText=(await page.locator('body').innerText().catch(()=>"")).slice(0,4000);
  run.htmlFile=`${width}-failure.html`;
  run.screenshotFile=`${width}-failure.png`;
  await fs.writeFile(path.join(outDir,`${width}-failure.txt`),run.failure);
  await fs.writeFile(path.join(outDir,run.htmlFile),await page.content().catch(()=>''));
  await page.screenshot({path:path.join(outDir,run.screenshotFile),fullPage:true}).catch(()=>{});
 }finally{
  await context.close();
  await browser.close();
 }
}
report.finishedAt=new Date().toISOString();
report.success=report.runs.every(run=>!run.failure);
await fs.writeFile(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
if(!report.success){
 console.error(JSON.stringify(report,null,2));
 process.exit(1);
}
console.log(JSON.stringify(report,null,2));
