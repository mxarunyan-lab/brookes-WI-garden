import assert from'node:assert/strict';
import{mkdir}from'node:fs/promises';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const widths=[320,375,390,430,768,1200];
const mobileShots=new Set([320,375,390,430]);
await mkdir('phase474-audit/hero',{recursive:true});

const overlap=(a,b)=>Boolean(a&&b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y);
const inside=(child,parent,tolerance=1)=>child.x>=parent.x-tolerance&&child.y>=parent.y-tolerance&&child.x+child.width<=parent.x+parent.width+tolerance&&child.y+child.height<=parent.y+parent.height+tolerance;

const browser=await chromium.launch({headless:true});
try{
 for(const width of widths){
  const height=width>=768?1000:900;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
  await page.addInitScript(()=>{
   localStorage.setItem('runyan-garden-active-profile','archie');
   localStorage.setItem('brookes-garden-state-v2',JSON.stringify({
    profile:{gardenerName:'Archie',activeProfileId:'archie',gardenName:'The Runyan Garden',location:'Green Bay, Wisconsin 54302',zone:'5b'},
    spaces:[],plants:[],activity:[],seedPackets:[],reminders:[],taskHistory:[]
   }));
  });
  await page.goto(base,{waitUntil:'networkidle'});
  const identity=page.locator('.compact-home-hero .compact-hero-title');
  const title=identity.locator('h1');
  const subtitle=identity.locator('p');
  const bell=page.locator('.compact-home-hero .hero-bell');
  const sun=page.locator('.compact-home-hero .wisconsin-landscape>g').first();
  const hero=page.locator('.compact-home-hero');
  const weather=page.locator('.compact-weather-line').first();
  await identity.waitFor({state:'visible'});
  await weather.waitFor({state:'visible'});
  assert.match((await title.innerText()).trim(),/^Archie['’]s Garden$/);
  assert.match((await subtitle.innerText()).trim(),/^The Runyan Garden\s*[-—]\s*Green Bay$/);
  const boxes={identity:await identity.boundingBox(),title:await title.boundingBox(),subtitle:await subtitle.boundingBox(),bell:await bell.boundingBox(),sun:await sun.boundingBox(),hero:await hero.boundingBox(),weather:await weather.boundingBox()};
  for(const[key,value]of Object.entries(boxes))assert.ok(value,`${key} did not produce a box at ${width}px`);
  assert.equal(overlap(boxes.identity,boxes.bell),false,`Identity overlaps notification bell at ${width}px: ${JSON.stringify(boxes)}`);
  assert.equal(overlap(boxes.identity,boxes.sun),false,`Identity overlaps the illustrated sun or rays at ${width}px: ${JSON.stringify(boxes)}`);
  assert.equal(overlap(boxes.hero,boxes.weather),false,`Weather card overlaps the hero at ${width}px: ${JSON.stringify(boxes)}`);
  assert.ok(inside(boxes.title,boxes.identity),`Gardener name escapes identity block at ${width}px`);
  assert.ok(inside(boxes.subtitle,boxes.identity),`Garden name/location escapes identity block at ${width}px`);
  const geometry=await page.evaluate(()=>({html:[document.documentElement.scrollWidth,document.documentElement.clientWidth],body:[document.body.scrollWidth,document.body.clientWidth],shell:(()=>{const node=document.querySelector('.app-shell');return node?[node.scrollWidth,node.clientWidth]:null})()}));
  assert.ok(geometry.html[0]<=geometry.html[1]+1,`Hero creates page overflow at ${width}px: ${JSON.stringify(geometry)}`);
  if(geometry.shell)assert.ok(geometry.shell[0]<=geometry.shell[1]+1,`Hero creates app-shell overflow at ${width}px: ${JSON.stringify(geometry)}`);
  const styles=await identity.evaluate(node=>{const block=getComputedStyle(node),heading=getComputedStyle(node.querySelector('h1')),secondary=getComputedStyle(node.querySelector('p'));return{background:block.backgroundColor,heading:heading.color,secondary:secondary.color,textAlign:block.textAlign}});
  assert.equal(styles.textAlign,'left',`Identity is not left aligned at ${width}px`);
  assert.match(styles.background,/rgba?\(/);
  assert.notEqual(styles.heading,styles.background);
  assert.notEqual(styles.secondary,styles.background);
  assert.deepEqual(pageErrors,[],`Page errors at ${width}px: ${pageErrors.join('\n')}`);
  if(mobileShots.has(width))await page.screenshot({path:`phase474-audit/hero/today-hero-${width}.png`,clip:{x:0,y:0,width,height:Math.min(360,height)}});
  else await page.screenshot({path:`phase474-audit/hero/today-hero-${width}.png`,fullPage:false});
  await page.close();
 }
 console.log(JSON.stringify({ok:true,base,widths,confirmed:['identity grouped','left aligned','bell clear','sun and rays clear','subtitle contrast backing','no horizontal overflow','weather below hero']},null,2));
}finally{await browser.close()}
