const base=(process.env.APP_URL||'https://brookes-garden-compass.onrender.com').replace(/\/$/,'');
try{
 const healthResponse=await fetch(`${base}/api/health`,{headers:{accept:'application/json'},cache:'no-store'});
 const health=await healthResponse.json().catch(()=>({status:healthResponse.status}));
 const htmlResponse=await fetch(`${base}/`,{cache:'no-store'});
 const html=await htmlResponse.text();
 const scriptPaths=[...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match=>match[1]);
 const stylePaths=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match=>match[1]);
 const js=(await Promise.all(scriptPaths.map(async path=>fetch(new URL(path,`${base}/`),{cache:'no-store'}).then(response=>response.text())))).join('\n');
 const css=(await Promise.all(stylePaths.map(async path=>fetch(new URL(path,`${base}/`),{cache:'no-store'}).then(response=>response.text())))).join('\n');
 const buildMarkers=[...new Set(js.match(/phase-4-7-1-[a-z0-9-]+/gi)||[])];
 console.log(JSON.stringify({
  ok:true,
  base,
  healthStatus:healthResponse.status,
  htmlStatus:htmlResponse.status,
  health,
  buildMarkers,
  scriptPaths,
  stylePaths,
  checks:{
   whatMatters:js.includes('WHAT MATTERS TODAY'),
   savedSeeds:js.includes('MY SAVED SEEDS'),
   otherOpportunities:js.includes('OTHER PLANTING OPPORTUNITIES'),
   toolShed:js.includes('NOTES & PRINTABLES'),
   dataManagement:js.includes('Data Management'),
   removedBrief:!js.includes("TODAY'S GARDEN BRIEF"),
   removedNextMove:!js.includes('NEXT BEST MOVE'),
   contextualWeatherBack:!js.includes('Back to Today'),
   mobile360:css.includes('@media(max-width:360px)'),
   heroContainment:css.includes('.compact-home-hero .wisconsin-landscape')&&css.includes('max-width:100%')
  }
 },null,2));
}catch(error){
 console.error(JSON.stringify({ok:false,base,error:String(error?.stack||error)},null,2));
}
