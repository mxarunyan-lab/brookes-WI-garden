import{chromium}from'playwright';

const base='https://brookes-garden-compass.onrender.com';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:900},deviceScaleFactor:1});
const page=await context.newPage();
await page.addInitScript(()=>localStorage.setItem('runyan-garden-active-profile','archie'));
await page.goto(`${base}/?page=today&diagnose=${Date.now()}`,{waitUntil:'networkidle'});
await page.locator('.compact-home-hero').waitFor();
const diagnosis=await page.locator('.compact-home-hero').evaluate(element=>{
 const style=getComputedStyle(element),rect=element.getBoundingClientRect(),matched=[];
 const inspect=(rules,sheet,condition='')=>{
  for(const rule of [...rules]){
   if(rule.cssRules){inspect(rule.cssRules,sheet,rule.conditionText||condition);continue}
   if(!rule.selectorText||!rule.style)continue;
   try{
    if(element.matches(rule.selectorText)&&['height','min-height','max-height','padding','padding-top','padding-bottom','box-sizing','background','background-image'].some(name=>rule.style.getPropertyValue(name))){
     matched.push({sheet,condition,selector:rule.selectorText,css:rule.style.cssText});
    }
   }catch{}
  }
 };
 for(const sheet of [...document.styleSheets]){
  try{inspect(sheet.cssRules,sheet.href||'inline')}catch{}
 }
 return{
  dataset:{...document.documentElement.dataset},
  rect:{width:rect.width,height:rect.height,top:rect.top,bottom:rect.bottom},
  computed:{height:style.height,minHeight:style.minHeight,maxHeight:style.maxHeight,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom,boxSizing:style.boxSizing,background:style.background,backgroundImage:style.backgroundImage},
  className:element.className,
  matched
 };
});
console.log(JSON.stringify(diagnosis,null,2));
const c=diagnosis.computed;
console.log(`season=${diagnosis.dataset.gardenSeason||'none'};height=${diagnosis.rect.height};min=${c.minHeight};box=${c.boxSizing};bg=${c.backgroundImage==='none'?'none':'image'}`);
await context.close();
await browser.close();
