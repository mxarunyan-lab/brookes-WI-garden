import assert from'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const widths=[320,375,390,430,768,1200],strict=process.env.PHASE474_STRICT==='1';
const today=new Date().toISOString().slice(0,10),now=new Date().toISOString();
const seedGarden={
 profile:{gardenerName:'Archie',activeProfileId:'archie',gardenName:'The Runyan Garden',location:'Green Bay, Wisconsin 54302',zip:'54302',zone:'5b',lastFrost:'May 15',firstFrost:'October 10',notifications:{weather:true,tasks:true,shopping:true}},
 spaces:[
  {id:'space-raised',name:'Certification Raised Bed',type:'black-square-bed',capacity:12,hidden:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null},
  {id:'space-container',name:'Certification Container Planter',type:'container',capacity:4,hidden:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null},
  {id:'space-potato',name:'Certification Potato Grow Bag',type:'potato-grow-bag',capacity:4,hidden:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null},
  {id:'space-greenhouse',name:'Certification Greenhouse',type:'greenhouse',capacity:8,hidden:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null},
  {id:'space-indoor',name:'Certification Indoor Shelf',type:'indoor',capacity:12,hidden:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null}
 ],
 plants:[{id:'plant-tomato',operationId:'cert-plant',name:'Certification Tomato With A Deliberately Long Variety Name',cropId:'tomato',variety:'Long-Name Slicing Tomato (QA)',spaceId:'space-raised',quantity:2,stage:'Growing',status:'active',archived:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null}],
 seedPackets:[{id:'packet-lettuce',operationId:'cert-packet',brand:'Burpee',name:'Lettuce',crop:'Lettuce',cropId:'lettuce',variety:'Iceberg A Long Certification Variety',quantity:100,originalQuantity:100,reservedQuantity:0,status:'active',frontPhoto:'',backPhoto:'',createdAt:now,updatedAt:now,revision:1,deletedAt:null}],
 reminders:[{id:'reminder-cert',taskId:'reminder-cert',operationId:'cert-reminder',title:'Certification moisture check with a deliberately long task title',taskType:'Check Moisture',priority:95,priorityLabel:'Urgent',dueDate:today,plantId:'plant-tomato',spaceId:'space-raised',reason:'Confirm the soil check workflow remains connected.',note:'Controlled Phase 4.7.4 test record.',manual:true,enabled:true,status:'active',createdAt:now,updatedAt:now,revision:1,deletedAt:null}],
 trays:[{id:'tray-cert',name:'Certification Tray',crop:'Lettuce',variety:'Iceberg A',cells:12,stage:'Germinating',spaceId:'space-indoor',sourcePacketId:'packet-lettuce',createdAt:now,updatedAt:now,revision:1,deletedAt:null}],
 growLights:[{id:'light-cert',name:'Certification Basement Lights',onTime:'06:00',offTime:'22:00',checkedToday:false,createdAt:now,updatedAt:now,revision:1,deletedAt:null}],
 hardeningPlans:[],hydroPods:[{id:'pod-cert',position:'1',crop:'Basil',status:'Growing',createdAt:now,updatedAt:now,revision:1,deletedAt:null}],greenhouseReadings:[],
 shoppingItems:[{id:'shopping-cert',name:'Certification Compost',quantity:1,purchased:false,status:'active',createdAt:now,updatedAt:now,revision:1,deletedAt:null}],
 problems:[{id:'problem-cert',plantId:'plant-tomato',title:'Certification leaf check',status:'open',createdAt:now,updatedAt:now,revision:1,deletedAt:null}],harvests:[],activity:[{id:'activity-cert',type:'note',title:'Certification data loaded',detail:'Controlled browser-audit records.',at:now,actor:'Archie'}],
 seedUsage:[],taskHistory:[],plantingDecisions:[],yearPlan:{crops:[]},weatherRecommendationHistory:[],vacationPlans:[],calculatorResults:[],seedTransactions:[],wateringEvents:[],soilCheckEvents:[],photos:[],attachments:[],qrLabels:[],offlineOperations:[],succession:[]
};

await mkdir('phase474-audit/whole-app',{recursive:true});
const browser=await chromium.launch({headless:true}),results=[],findings=[];
const route=(id,expected,open)=>({id,expected,open});

async function clickButton(page,name){const item=page.getByRole('button',{name});await item.first().waitFor({state:'visible'});await item.first().click()}
async function primary(page,label){await clickButton(page,new RegExp(`^${label}$`,'i'))}
async function centerCard(page,label){await primary(page,'Center');await clickButton(page,new RegExp(label,'i'))}
async function toolCard(page,group,label){await primary(page,'Tool Shed');const drawer=page.locator('.tool-shed-drawer').filter({hasText:group});await drawer.locator('summary').click();await clickButton(page,new RegExp(label,'i'))}
async function moreSetting(page,label){await primary(page,'More');await page.locator('.more-settings-hub>summary').click();await clickButton(page,new RegExp(label,'i'))}
async function moreCard(page,label){await primary(page,'More');await clickButton(page,new RegExp(label,'i'))}

const routes=[
 route('today','GARDEN STATUS',page=>primary(page,'Today')),
 route('garden','The Runyan Garden',page=>primary(page,'Garden')),
 route('center','Manage and plan the garden',page=>primary(page,'Center')),
 route('tools','Tool Shed',page=>primary(page,'Tool Shed')),
 route('more','Garden & Account Settings',page=>primary(page,'More')),
 route('weather-garden','Weather for Your Garden',page=>toolCard(page,'WEATHER TOOLS','Garden Weather')),
 route('weather-rain','Rain and Watering Review',async page=>{await toolCard(page,'WEATHER TOOLS','Rain and Watering Review')}),
 route('weather-frost','Frost and Planting Timing',async page=>{await toolCard(page,'WEATHER TOOLS','Forecast and Frost Timing')}),
 route('chores','Chore Board',page=>centerCard(page,'Garden Chore Board')),
 route('plan-plant','Planting Desk',page=>centerCard(page,'Planting Desk')),
 route('vacation','Vacation Mode',page=>centerCard(page,'Vacation Mode')),
 route('shopping-list','Garden Shopping List',page=>centerCard(page,'Shopping List')),
 route('indoor','Indoor Growing',page=>centerCard(page,'Indoor Growing')),
 route('memory','Garden History',page=>centerCard(page,'Garden History')),
 route('seed-tools','Seed Department',page=>centerCard(page,'Seed Department')),
 route('spacing-calculator','Spacing Calculator',page=>toolCard(page,'UTILITIES','Spacing Calculator')),
 route('soil-calculator','Soil & Container Calculator',page=>toolCard(page,'UTILITIES','Soil & Container Calculator')),
 route('frost-calculator','Frost & Planting Dates',page=>toolCard(page,'UTILITIES','Frost & Planting Dates')),
 route('seed-quantity-calculator','Seed Quantity Calculator',page=>toolCard(page,'UTILITIES','Seed Quantity Calculator')),
 route('garden-measurements','Garden Measurements',page=>toolCard(page,'UTILITIES','Garden Measurements')),
 route('printable-pack','Printable Garden Pack',page=>toolCard(page,'NOTES & PRINTABLES','Printable Garden Pack')),
 route('labels','Plant Labels',page=>toolCard(page,'NOTES & PRINTABLES','Plant Labels')),
 route('admin-profile','Garden Profile',page=>moreSetting(page,'Garden and gardeners')),
 route('admin-location','Location and Frost Dates',page=>moreSetting(page,'Location and frost dates')),
 route('admin-notifications','Notification Settings',page=>moreSetting(page,'Notifications')),
 route('admin-backup','Backup and Restore',page=>moreCard(page,'Data Management')),
 route('admin-help','Quick Help',page=>moreCard(page,'Quick Help')),
 route('admin-whatsnew',"What's New",page=>moreCard(page,"What's New")),
 route('admin-about','About',page=>moreCard(page,'About Garden Compass'))
];

const queryRoutes=[
 {id:'record-space',url:'?bed=space-raised',expected:'Certification Raised Bed'},
 {id:'public-space',url:'?bed=space-raised&view=public',expected:'What is growing here'},
 {id:'label-space',url:'?gardenLabel=space:space-raised',expected:'Certification Raised Bed'},
 {id:'label-plant',url:'?gardenLabel=plant:plant-tomato',expected:'Certification Tomato'},
 {id:'label-tray',url:'?gardenLabel=tray:tray-cert',expected:'Indoor Growing'},
 {id:'label-pod',url:'?gardenLabel=pod:pod-cert',expected:'Indoor Growing'},
 {id:'missing-record',url:'?gardenLabel=plant:missing-certification-record',expected:'record is no longer available'}
];

async function auditVisibleActions(page,width,routeId){const rows=await page.locator('button:visible,a:visible,summary:visible,input:visible,select:visible,textarea:visible').evaluateAll(nodes=>nodes.map((node,index)=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node),label=(node.getAttribute('aria-label')||node.getAttribute('title')||node.innerText||node.getAttribute('placeholder')||node.getAttribute('name')||'').trim().replace(/\s+/g,' ');return{index,tag:node.tagName.toLowerCase(),label,width:box.width,height:box.height,display:style.display,visibility:style.visibility,disabled:Boolean(node.disabled),href:node.getAttribute('href')||''}}));for(const row of rows){if(!row.label&&row.tag!=='input')findings.push({id:'A11Y-ACTION-NAME',severity:'P2',width,routeId,detail:row});if(['button','a','summary'].includes(row.tag)&&!row.disabled&&(row.width<32||row.height<32))findings.push({id:'TOUCH-TARGET',severity:'P3',width,routeId,detail:row})}return rows.length}
async function auditScreen(page,width,routeId,expected){await page.locator('main').first().waitFor({state:'visible'});const text=(await page.locator('main').first().innerText()).trim();assert.ok(text.length>20,`${routeId} appears blank at ${width}px`);assert.match(text,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`${routeId} did not show ${expected} at ${width}px`);const dims=await page.evaluate(()=>({html:[document.documentElement.scrollWidth,document.documentElement.clientWidth],body:[document.body.scrollWidth,document.body.clientWidth],shell:(()=>{const n=document.querySelector('.app-shell');return n?[n.scrollWidth,n.clientWidth]:null})()}));if(dims.html[0]>dims.html[1]+1||dims.shell&&dims.shell[0]>dims.shell[1]+1)findings.push({id:'HORIZONTAL-OVERFLOW',severity:'P1',width,routeId,dims});const actions=await auditVisibleActions(page,width,routeId);return{textLength:text.length,actions,dims}}

try{
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:width>=768?1000:900},deviceScaleFactor:1});
  const errors=[],failed=[];page.on('pageerror',error=>errors.push(String(error?.stack||error)));page.on('response',response=>{if(response.status()>=400&&!/\/api\/weather/.test(response.url()))failed.push({status:response.status(),url:response.url()})});
  await page.addInitScript(garden=>{localStorage.setItem('runyan-garden-active-profile','archie');localStorage.setItem('brookes-garden-state-v2',JSON.stringify(garden));localStorage.removeItem('brookes-garden-daily-v5')},seedGarden);
  for(const item of routes){await page.goto(base,{waitUntil:'networkidle'});await item.open(page);const audit=await auditScreen(page,width,item.id,item.expected);results.push({width,routeId:item.id,kind:'normal-navigation',status:'pass',...audit});if(width===390)await page.screenshot({path:`phase474-audit/whole-app/390-${item.id}.png`,fullPage:true})}
  for(const item of queryRoutes){await page.goto(`${base}/${item.url}`,{waitUntil:'networkidle'});const audit=await auditScreen(page,width,item.id,item.expected);results.push({width,routeId:item.id,kind:'query-route',status:'pass',...audit});if(width===390)await page.screenshot({path:`phase474-audit/whole-app/390-${item.id}.png`,fullPage:true})}
  await page.goto(`${base}/?page=admin-about`,{waitUntil:'networkidle'});const directText=(await page.locator('main').first().innerText()).trim();if(!/About/i.test(directText))findings.push({id:'NAV-001',severity:'P1',width,routeId:'direct-page-url',detail:'The page query does not open the requested registered screen.'});
  if(errors.length)findings.push({id:'PAGE-ERROR',severity:'P1',width,detail:errors});if(failed.length)findings.push({id:'NETWORK-FAILURE',severity:'P1',width,detail:failed});
  await page.close();
 }
 await writeFile('phase474-audit/whole-app/results.json',JSON.stringify(results,null,2));
 await writeFile('phase474-audit/whole-app/findings.json',JSON.stringify(findings,null,2));
 const summary={ok:!findings.some(item=>['P0','P1'].includes(item.severity)),strict,widths,routesTested:routes.length,queryRoutesTested:queryRoutes.length,screenChecks:results.length,findings:findings.length,bySeverity:findings.reduce((acc,item)=>(acc[item.severity]=(acc[item.severity]||0)+1,acc),{})};
 await writeFile('phase474-audit/whole-app/summary.json',JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary,null,2));
 if(strict)assert.equal(findings.length,0,`Strict whole-app certification found ${findings.length} issue(s).`);
 else assert.equal(findings.filter(item=>item.id!=='NAV-001'&&['P0','P1'].includes(item.severity)).length,0,'Initial whole-app audit found a P0/P1 issue other than the documented direct-page finding.');
}finally{await browser.close()}
