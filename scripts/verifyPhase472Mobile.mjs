import assert from'node:assert/strict';
import{mkdir}from'node:fs/promises';
import{chromium}from'playwright';

const base=(process.env.APP_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const widths=[320,375,390,430];
await mkdir('phase472-mobile',{recursive:true});

const rgb=value=>{const match=String(value).match(/[\d.]+/g)||[];return match.slice(0,3).map(Number)};
const luminance=([r=0,g=0,b=0])=>{const values=[r,g,b].map(channel=>{const s=channel/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)});return .2126*values[0]+.7152*values[1]+.0722*values[2]};
const contrast=(foreground,background)=>{const a=luminance(rgb(foreground)),b=luminance(rgb(background));return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};

const browser=await chromium.launch({headless:true});
try{
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.setItem('runyan-garden-active-profile','brooke');localStorage.setItem('brookes-garden-page-v2','today')});
  await page.reload({waitUntil:'networkidle'});

  const checkOverflow=async label=>{const dimensions=await page.evaluate(()=>({html:[document.documentElement.scrollWidth,document.documentElement.clientWidth],body:[document.body.scrollWidth,document.body.clientWidth],shell:document.querySelector('.app-shell')?[document.querySelector('.app-shell').scrollWidth,document.querySelector('.app-shell').clientWidth]:null}));assert.ok(dimensions.html[0]<=dimensions.html[1]+1,`${label} overflows the viewport at ${width}px: ${JSON.stringify(dimensions)}`);if(dimensions.shell)assert.ok(dimensions.shell[0]<=dimensions.shell[1]+1,`${label} app shell overflows at ${width}px: ${JSON.stringify(dimensions)}`)};

  await page.getByRole('button',{name:'Today'}).click();
  await page.getByRole('button',{name:'My Garden'}).waitFor({state:'visible'});
  await checkOverflow('Today');
  assert.equal(await page.locator('.today-quick-links button').count(),3,'Today should show three useful shortcuts.');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-today.png',fullPage:true});

  await page.getByRole('button',{name:'Garden Tasks'}).click();
  await page.getByText('NEEDS ATTENTION',{exact:true}).first().waitFor({state:'visible'}).catch(()=>{});
  await checkOverflow('Chore Board');
  const choreText=await page.locator('main').innerText();
  assert.doesNotMatch(choreText,/WEATHER ALERTS|Past the due date|DO TODAY/);
  assert.ok(await page.locator('.chore-section').count()<=3,'Chore Board should have at most three task sections.');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-chore-board.png',fullPage:true});

  await page.getByRole('button',{name:'Tool Shed'}).click();
  await checkOverflow('Tool Shed');
  await page.locator('.tool-shed-drawer').first().evaluate(element=>element.open=true);
  const cardStyles=await page.locator('.tool-shed-card-list .secondary-card').evaluateAll(cards=>cards.map(card=>{const title=card.querySelector('.secondary-card-copy strong'),cardStyle=getComputedStyle(card),titleStyle=getComputedStyle(title);return{title:title?.textContent||'',foreground:titleStyle.color,background:cardStyle.backgroundColor}}));
  assert.ok(cardStyles.length>0,'Tool Shed cards were not found.');
  for(const card of cardStyles)assert.ok(contrast(card.foreground,card.background)>=4.5,`${card.title} contrast is too low: ${JSON.stringify(card)}`);
  if(width===390)await page.screenshot({path:'phase472-mobile/390-tool-shed.png',fullPage:true});

  await page.getByRole('button',{name:'More'}).click();
  await checkOverflow('More');
  assert.equal(await page.locator('.more-settings-hub').count(),1,'More should contain one grouped settings hub.');
  assert.equal(await page.locator('.more-compact-list>.secondary-card').count(),4,'More should contain four remaining top-level destinations.');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-more.png',fullPage:true});

  await page.getByRole('button',{name:'Today'}).click();
  await page.getByRole('button',{name:/Open Weather Tools/i}).click();
  await page.getByText('Garden Weather',{exact:true}).waitFor({state:'visible'});
  await checkOverflow('Weather Tools');
  const weatherText=await page.locator('main').innerText();
  assert.doesNotMatch(weatherText,/WEATHER[-_ ]?ACTI|ACTION[-_ ]?SUMMARY/i);
  assert.match(weatherText,/WHAT TO DO/);
  if(width===390)await page.screenshot({path:'phase472-mobile/390-weather.png',fullPage:true});

  await page.close();
 }
 console.log(JSON.stringify({ok:true,base,widths,screens:['Today','Chore Board','Tool Shed','More','Weather Tools']},null,2));
}finally{await browser.close()}
