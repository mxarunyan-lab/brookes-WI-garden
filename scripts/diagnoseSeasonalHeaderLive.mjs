import{chromium}from'playwright';

const base='https://brookes-garden-compass.onrender.com';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:900},deviceScaleFactor:1});
const page=await context.newPage();
await page.addInitScript(()=>localStorage.setItem('runyan-garden-active-profile','archie'));
await page.goto(`${base}/?page=today&diagnose=${Date.now()}`,{waitUntil:'networkidle'});
await page.locator('.compact-home-hero').waitFor();
const diagnosis=await page.locator('.compact-home-hero').evaluate(element=>{
 const style=getComputedStyle(element),rect=element.getBoundingClientRect();
 const matched=[];
 for(const sheet of [...document.styleSheets]){
  let rules;
  try{rules=sheet.cssRules}catch{continue}
  for(const rule of [...rules]){
   if(!rule.selectorText||!rule.style)continue;
   try{
    if(element.matches(rule.selectorText)&&['height','min-height','max-height','padding','padding-top','padding-bottom','box-sizing'].some(name=>rule.style.getPropertyValue(name))){
     matched.push({sheet:sheet.href||'inline',selector:rule.selectorText,css:rule.style.cssText});
    }
   }catch{}
  }
 }
 return{
  rect:{width:rect.width,height:rect.height,top:rect.top,bottom:rect.bottom},
  computed:{height:style.height,minHeight:style.minHeight,maxHeight:style.maxHeight,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom,boxSizing:style.boxSizing,backgroundImage:style.backgroundImage},
  className:element.className,
  matched
 };
});
console.log(JSON.stringify(diagnosis,null,2));
const c=diagnosis.computed;
console.log(`height=${diagnosis.rect.height};css=${c.height};min=${c.minHeight};max=${c.maxHeight};pad=${c.paddingTop}/${c.paddingBottom};box=${c.boxSizing}`);
await context.close();
await browser.close();
