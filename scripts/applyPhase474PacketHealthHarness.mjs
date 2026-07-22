import{readFile,writeFile}from'node:fs/promises';

const path='scripts/verifyPhase474CriticalJourneys.mjs';
let source=await readFile(path,'utf8'),changed=false;
const replacements=[
 {
  label:'service-worker-free browser context',
  old:"const browser=await chromium.launch({headless:true}),findings=[],steps=[];",
  next:"const browser=await chromium.launch({headless:true}),context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:900},deviceScaleFactor:1}),findings=[],steps=[];",
 },
 {
  label:'context-owned journey page',
  old:"const page=await browser.newPage({viewport:{width:390,height:900},deviceScaleFactor:1});",
  next:"const page=await context.newPage();",
 },
 {
  label:'context health capability mock',
  old:"await page.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'0.20.3',packetVisionConfigured:true})}));",
  next:"await context.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'0.20.3',packetVisionConfigured:true})}));",
 },
 {
  label:'context packet failure mock',
  old:"await page.route('**/api/seed-packets/analyze',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'CERTIFICATION_FAILURE',message:'Certification analysis failure. Photos and draft remain saved.'})}));",
  next:"await context.route('**/api/seed-packets/analyze',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'CERTIFICATION_FAILURE',message:'Certification analysis failure. Photos and draft remain saved.'})}));",
 },
 {
  label:'open optional packet details before seed count',
  old:"await page.getByLabel(/^Brand/).first().fill('Burpee');await page.getByLabel(/^Seed count/).first().fill('100');",
  next:"await page.getByLabel(/^Brand/).first().fill('Burpee');const allPacketDetails=page.locator('details.packet-all-details');if(!(await allPacketDetails.getAttribute('open')))await allPacketDetails.locator(':scope > summary').click();await page.getByLabel(/^Seed count/).first().fill('100');",
 },
];
for(const{label,old,next}of replacements){
 if(source.includes(next))continue;
 if(!source.includes(old))throw new Error(`${path}: expected source not found for ${label}`);
 source=source.replace(old,next);
 changed=true;
}
if(changed)await writeFile(path,source);
console.log(JSON.stringify({ok:true,changed},null,2));
