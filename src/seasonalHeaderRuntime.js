import{getGreenBaySeason}from'./gardenSeason.js';

const ATTRIBUTE='gardenSeason';
const CHECK_INTERVAL_MS=60*60*1000;

export function applyGreenBayGardenSeason(date=new Date()){
 const season=getGreenBaySeason(date);
 if(typeof document!=='undefined')document.documentElement.dataset[ATTRIBUTE]=season;
 return season;
}

applyGreenBayGardenSeason();

if(typeof window!=='undefined'){
 const timer=window.setInterval(()=>applyGreenBayGardenSeason(),CHECK_INTERVAL_MS);
 const refreshWhenVisible=()=>{if(document.visibilityState==='visible')applyGreenBayGardenSeason()};
 document.addEventListener('visibilitychange',refreshWhenVisible);
 if(import.meta.hot)import.meta.hot.dispose(()=>{
  window.clearInterval(timer);
  document.removeEventListener('visibilitychange',refreshWhenVisible);
 });
}
