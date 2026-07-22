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
  await page.getByText('GARDEN STATUS',{exact:true}).waitFor({state:'visible'});
  await checkOverflow('Today');
  assert.equal(await page.locator('.today-quick-links').count(),0,'Today must not repeat primary navigation shortcuts.');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-today.png',fullPage:true});

  await page.getByRole('button',{name:'Center'}).click();
  await page.getByRole('button',{name:/Garden Chore Board/}).click();
  await page.getByText('NEEDS ATTENTION',{exact:true}).first().waitFor({state:'visible'}).catch(()=>{});
  await checkOverflow('Chore Board');
  const choreText=await page.locator('main').innerText();
  assert.doesNotMatch(choreText,/WEATHER ALERTS|Past the due date|DO TODAY/);
  assert.ok(await page.locator('.chore-section').count()<=3,'Chore Board should have at most three task sections.');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-chore-board.png',fullPage:true});

  await page.getByRole('button',{name:'Tool Shed'}).click();
  await checkOverflow('Tool Shed');
  assert.equal(await page.locator('details.tool-shed-drawer').count(),0,'Tool Shed must remain a flat one-tap directory.');
  assert.equal(await page.locator('.tool-shed-directory-card').count(),11,'Tool Shed should expose eleven direct destinations.');
  const sectionLabelStyles=await page.locator('.tool-shed-directory-section>.secondary-section-header small').evaluateAll(labels=>labels.map(label=>{const style=getComputedStyle(label);let ancestor=label.parentElement,background='';while(ancestor){const candidate=getComputedStyle(ancestor).backgroundColor;if(candidate&&!/rgba?\(0, 0, 0, 0\)|transparent/.test(candidate)){background=candidate;break}ancestor=ancestor.parentElement}return{text:label.textContent||'',foreground:style.color,background:background||'rgb(11, 77, 51)'}}));
  assert.equal(sectionLabelStyles.length,3,'Tool Shed should expose three visual section headings.');
  for(const label of sectionLabelStyles)assert.ok(contrast(label.foreground,label.background)>=4.5,`${label.text} section label contrast is too low: ${JSON.stringify(label)}`);
  const cardStyles=await page.locator('.tool-shed-card-list .secondary-card').evaluateAll(cards=>cards.map(card=>{const title=card.querySelector('.secondary-card-copy strong'),cardStyle=getComputedStyle(card),titleStyle=getComputedStyle(title);return{title:title?.textContent||'',foreground:titleStyle.color,background:cardStyle.backgroundColor}}));
  assert.equal(cardStyles.length,11,'Tool Shed direct cards were not found.');
  for(const card of cardStyles)assert.ok(contrast(card.foreground,card.background)>=4.5,`${card.title} contrast is too low: ${JSON.stringify(card)}`);
  if(width===390)await page.screenshot({path:'phase472-mobile/390-tool-shed.png',fullPage:true});

  await page.getByRole('button',{name:'More'}).click();
  await checkOverflow('More');
  assert.equal(await page.locator('.more-settings-hub').count(),1,'More should contain one grouped settings hub.');
  assert.equal(await page.locator('.more-settings-hub').evaluate(element=>element.open),false,'Garden and Account Settings should start collapsed.');
  await page.locator('.more-settings-hub>summary').click();
  assert.equal(await page.locator('.more-settings-hub>div>button').count(),3,'Expanded settings should contain exactly three options.');
  assert.equal(await page.locator('.more-compact-list>.secondary-card').count(),4,'More should contain four remaining top-level destinations.');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-more.png',fullPage:true});

  await page.getByRole('button',{name:'Today'}).click();
  await page.getByRole('button',{name:/Open Garden Weather/i}).click();
  await page.getByRole('tab',{name:'Garden Weather'}).waitFor({state:'visible'});
  await checkOverflow('Garden Weather');
  assert.equal(await page.locator('#garden-weather-details').count(),1,'Full weather details should live in Garden Weather.');
  await page.getByRole('tab',{name:'Rain & Watering'}).click();
  await page.getByText('RECENT RAIN CREDIT',{exact:true}).waitFor({state:'visible'});
  assert.equal(await page.locator('#garden-weather-details').count(),0,'Rain and Watering should not duplicate the full technical drawer.');
  await checkOverflow('Rain and Watering');
  await page.getByRole('tab',{name:'Frost & Timing'}).click();
  await page.getByText('SAVED GREEN BAY TIMING',{exact:true}).waitFor({state:'visible'});
  assert.equal(await page.locator('#garden-weather-details').count(),0,'Frost and Timing should remain a focused tool.');
  await checkOverflow('Frost and Timing');
  if(width===390)await page.screenshot({path:'phase472-mobile/390-weather-frost.png',fullPage:true});

  await page.getByRole('button',{name:'Center'}).click();
  await page.getByRole('button',{name:/Indoor Growing/}).click();
  await page.getByText('Indoor Growing',{exact:true}).waitFor({state:'visible'});
  await checkOverflow('Indoor Growing');
  const indoorSpacing=await page.locator('.control-center-title').first().evaluate(element=>{const style=getComputedStyle(element),icon=element.querySelector(':scope>svg'),iconStyle=icon?getComputedStyle(icon):null;return{gap:parseFloat(style.columnGap||style.gap||'0'),iconWidth:iconStyle?parseFloat(iconStyle.width):0}});
  assert.ok(indoorSpacing.gap>=10,`Indoor title icon gap is too small: ${JSON.stringify(indoorSpacing)}`);
  assert.ok(indoorSpacing.iconWidth>=32,`Indoor title icon does not have a dedicated visual column: ${JSON.stringify(indoorSpacing)}`);
  if(width===390)await page.screenshot({path:'phase472-mobile/390-indoor.png',fullPage:true});

  await page.close();
 }
 console.log(JSON.stringify({ok:true,base,widths,screens:['Today','Chore Board','Tool Shed','More','Garden Weather','Rain and Watering','Frost and Timing','Indoor Growing']},null,2));
}finally{await browser.close()}
