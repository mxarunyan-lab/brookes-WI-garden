import{readFile,writeFile}from'node:fs/promises';

async function patch(path,replacements){
 let source=await readFile(path,'utf8'),changed=false;
 for(const{label,old,next}of replacements){
  if(source.includes(next))continue;
  if(!source.includes(old))throw new Error(`${path}: expected source not found for ${label}`);
  source=source.replace(old,next);
  changed=true;
 }
 if(changed)await writeFile(path,source);
 return changed;
}

const results={};
results.app=await patch('src/App.jsx',[
 {label:'moved destination contextual parents',old:"const navigate=requested=>{const parentFallbacks={chores:'center','plan-plant':'center',weather:'today'},",next:"const navigate=requested=>{const parentFallbacks={chores:'center','plan-plant':'center',weather:'today',vacation:'tools','shopping-list':'tools',memory:'tools'},"},
 {label:'moved destination navigation ownership',old:"parentMap={weather:'today',chores:'center',vacation:'center','plan-plant':'center','shopping-list':'center','seed-tools':'center',indoor:'center',memory:'center'",next:"parentMap={weather:'today',chores:'center',vacation:'tools','plan-plant':'center','shopping-list':'tools','seed-tools':'center',indoor:'center',memory:'tools'"},
]);
results.shopping=await patch('src/GardenShoppingList.jsx',[
 {label:'Shopping List back ownership',old:"onBack={()=>navigate('center')} backLabel=\"Back to Garden Center\"",next:"onBack={()=>navigate('tools')} backLabel=\"Back to Tool Shed\""},
 {label:'Shopping List eyebrow',old:'eyebrow="RUNYAN GARDEN CENTER" title="Garden Shopping List"',next:'eyebrow="RECORDS & EXTRAS" title="Garden Shopping List"'},
]);
results.vacation=await patch('src/VacationMode.jsx',[
 {label:'Vacation Mode back ownership',old:"onBack={()=>navigate('center')} backLabel=\"Back to Garden Center\"",next:"onBack={()=>navigate('tools')} backLabel=\"Back to Tool Shed\""},
 {label:'Vacation Mode eyebrow',old:'eyebrow="CONNECTED TRIP CARE" title="Vacation Mode"',next:'eyebrow="RECORDS & EXTRAS" title="Vacation Mode"'},
]);
results.indoor=await patch('src/IndoorCenter.jsx',[
 {label:'Indoor icon imports',old:"import{ArrowLeft,Check,ChevronRight,Droplets,FlaskConical,LampDesk,PackageSearch,Plus,Sprout,ThermometerSun,Warehouse}from'lucide-react';",next:"import{Check,ChevronRight,Droplets,FlaskConical,LampDesk,PackageSearch,Plus,Sprout,ThermometerSun,Warehouse}from'lucide-react';"},
 {label:'Indoor shared header import',old:"import{formatDateTime,getCropProfile}from'./data.js';",next:"import{formatDateTime,getCropProfile}from'./data.js';\nimport{SecondaryHero}from'./SecondaryUI.jsx';"},
 {label:'Indoor compact shared header',old:"return <main className=\"screen indoor-center-screen\"><section className=\"dark-header garden-header indoor-center-header\"><button className=\"back-button\" onClick={()=>navigate('back')} aria-label=\"Go back\"><ArrowLeft/></button><Sprout/><span>YEAR-ROUND GROWING</span><h1>Indoor Growing</h1><p>Start from a saved packet when possible. The tray, seed use, expected emergence, care guidance, and Plant Journey then stay connected.</p></section><section className=\"indoor-center-content screen-pad\">",next:"return <main className=\"screen secondary-screen indoor-center-screen\"><SecondaryHero icon={Sprout} eyebrow=\"YEAR-ROUND GROWING\" title=\"Indoor Growing\" description=\"Start from a saved packet when possible so tray, seed use, care guidance, and Plant Journey stay connected.\" onBack={()=>navigate('center')} backLabel=\"Back to Garden Center\" className=\"center-department-hero indoor-center-header\"/><section className=\"indoor-center-content secondary-screen-content screen-pad\">"},
]);
results.lockfile=await patch('package-lock.json',[
 {label:'top-level lockfile version',old:'"version": "0.20.3"',next:'"version": "0.20.4"'},
 {label:'root package lockfile version',old:'"name": "brookes-wi-garden",\n      "version": "0.20.3"',next:'"name": "brookes-wi-garden",\n      "version": "0.20.4"'},
]);
console.log(JSON.stringify({ok:true,results},null,2));
