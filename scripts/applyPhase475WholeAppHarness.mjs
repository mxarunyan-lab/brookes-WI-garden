import{readFile,writeFile}from'node:fs/promises';

const path='scripts/verifyPhase474WholeApp.mjs';
let source=await readFile(path,'utf8'),changed=false;
const changes=[
 {
  label:'flat Tool Shed navigation helper',
  old:"async function toolCard(page,group,label){await primary(page,'Tool Shed');const drawer=page.locator('.tool-shed-drawer').filter({hasText:group});await drawer.locator('summary').click();await clickButton(page,new RegExp(escape(label),'i'))}",
  next:"async function toolCard(page,label){await primary(page,'Tool Shed');await clickButton(page,new RegExp(escape(label),'i'))}\nasync function directPage(page,id){await page.goto(`${base}/?page=${id}`,{waitUntil:'networkidle',timeout:20000})}\nasync function printableLabels(page){await toolCard(page,'Printable Garden Pack & Labels');await clickButton(page,/Open Plant Labels/i)}",
 },
 {label:'compact Garden Center expectation',old:"route('center','Manage and plan the garden',page=>primary(page,'Center'))",next:"route('center','Garden Center',page=>primary(page,'Center'))"},
 {label:'Garden Weather direct card',old:"route('weather-garden','Weather for Your Garden',page=>toolCard(page,'WEATHER TOOLS','Garden Weather'))",next:"route('weather-garden','Weather for Your Garden',page=>toolCard(page,'Garden Weather'))"},
 {label:'Rain direct card',old:"route('weather-rain','Rain and Watering Review',page=>toolCard(page,'WEATHER TOOLS','Rain & Watering Review'))",next:"route('weather-rain','Rain and Watering Review',page=>toolCard(page,'Rain & Watering Review'))"},
 {label:'Frost weather direct card',old:"route('weather-frost','Frost and Planting Timing',page=>toolCard(page,'WEATHER TOOLS','Frost & Planting Timing'))",next:"route('weather-frost','Frost and Planting Timing',page=>toolCard(page,'Frost & Planting Dates'))"},
 {label:'Vacation Tool Shed ownership',old:"route('vacation','Vacation Mode',page=>centerCard(page,'Vacation Mode'))",next:"route('vacation','Vacation Mode',page=>toolCard(page,'Vacation Mode'))"},
 {label:'Shopping Tool Shed ownership',old:"route('shopping-list','Garden Shopping List',page=>centerCard(page,'Shopping List'))",next:"route('shopping-list','Garden Shopping List',page=>toolCard(page,'Shopping List'))"},
 {label:'History Tool Shed ownership',old:"route('memory','Garden Memory',page=>centerCard(page,'Garden History'))",next:"route('memory','Garden History',page=>toolCard(page,'Garden History'))"},
 {label:'Spacing direct card',old:"route('spacing-calculator','Spacing Calculator',page=>toolCard(page,'UTILITIES','Spacing Calculator'))",next:"route('spacing-calculator','Spacing Calculator',page=>toolCard(page,'Spacing Calculator'))"},
 {label:'Soil direct card',old:"route('soil-calculator','Soil & Container Calculator',page=>toolCard(page,'UTILITIES','Soil & Container Calculator'))",next:"route('soil-calculator','Soil & Container Calculator',page=>toolCard(page,'Soil & Container Calculator'))"},
 {label:'Legacy frost calculator direct route',old:"route('frost-calculator','Frost & Planting Dates',page=>toolCard(page,'UTILITIES','Frost & Planting Dates'))",next:"route('frost-calculator','Frost & Planting Dates',page=>directPage(page,'frost-calculator'))"},
 {label:'Seed quantity direct card',old:"route('seed-quantity-calculator','Seed Quantity Calculator',page=>toolCard(page,'UTILITIES','Seed Quantity Calculator'))",next:"route('seed-quantity-calculator','Seed Quantity Calculator',page=>toolCard(page,'Seed Quantity Calculator'))"},
 {label:'Measurements direct card',old:"route('garden-measurements','Garden Measurements',page=>toolCard(page,'UTILITIES','Garden Measurements'))",next:"route('garden-measurements','Garden Measurements',page=>toolCard(page,'Garden Measurements'))"},
 {label:'Printable pack direct card',old:"route('printable-pack','Printable Garden Pack',page=>toolCard(page,'NOTES & PRINTABLES','Printable Garden Pack'))",next:"route('printable-pack','Printable Garden Pack',page=>toolCard(page,'Printable Garden Pack & Labels'))"},
 {label:'Labels printable handoff',old:"route('labels','Plant Labels',page=>toolCard(page,'NOTES & PRINTABLES','Plant Labels'))",next:"route('labels','Plant Labels',page=>printableLabels(page))"},
];
for(const{label,old,next}of changes){
 if(source.includes(next))continue;
 if(!source.includes(old))throw new Error(`${path}: expected source not found for ${label}`);
 source=source.replace(old,next);
 changed=true;
}
if(changed)await writeFile(path,source);
console.log(JSON.stringify({ok:true,changed},null,2));
