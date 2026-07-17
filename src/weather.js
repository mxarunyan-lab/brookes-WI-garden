import { useCallback, useEffect, useRef, useState } from 'react';
import { GREEN_BAY } from './data.js';

const CACHE_KEY='brookes-garden-weather-v6';
const RAIN_HOLD_KEY='brookes-garden-rain-hold-v2';
const CACHE_MAX_AGE=5*60*1000;
const STALE_AFTER=20*60*1000;
const NWS_STATION='KGRB';

const labels={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Cloudy',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',66:'Freezing Rain',67:'Heavy Freezing Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Rain Showers',81:'Rain Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorms',96:'Storms with Hail',99:'Severe Storms with Hail'};
const toF=v=>Number.isFinite(v)?Math.round(v*9/5+32):null;
const gbDate=v=>new Intl.DateTimeFormat('en-CA',{timeZone:GREEN_BAY.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};

function measurementToInches(measurement){
 const value=Number(measurement?.value);
 if(!Number.isFinite(value)||value<=0)return 0;
 const unit=String(measurement?.unitCode||'').toLowerCase();
 let inches=0;
 if(unit.includes(':mm')||unit.endsWith('/mm'))inches=value/25.4;
 else if(unit.includes(':cm')||unit.endsWith('/cm'))inches=value/2.54;
 else if(unit.includes('[in_i]')||unit.includes(':in'))inches=value;
 else if(unit.includes(':m')||unit.endsWith('/m'))inches=value*39.3700787;
 else return 0;
 return inches>10?0:inches;
}

function activeHold(){
 const h=read(RAIN_HOLD_KEY);
 if(!h?.holdUntil||h.holdUntil<=Date.now()||Number(h.amount)>10){localStorage.removeItem(RAIN_HOLD_KEY);return null}
 return h;
}
function writeHold(amount,source='weather',detectedAt=Date.now()){
 const inches=Number(amount||0);
 if(!Number.isFinite(inches)||inches<0.1||inches>10)return activeHold();
 const current=activeHold();
 const next={amount:Math.max(Number(current?.amount||0),inches),source,detectedAt,holdUntil:Math.max(Number(current?.holdUntil||0),detectedAt+24*60*60*1000)};
 localStorage.setItem(RAIN_HOLD_KEY,JSON.stringify(next));
 return next;
}

async function fetchJson(url,signal){
 const r=await fetch(url,{signal,cache:'no-store',headers:{Accept:'application/geo+json, application/json'}});
 if(!r.ok)throw new Error(`Weather service returned ${r.status}`);
 return r.json();
}
function codeFromText(text){const v=String(text||'').toLowerCase();if(v.includes('thunder'))return 95;if(v.includes('heavy rain'))return 65;if(v.includes('rain')||v.includes('shower'))return 63;if(v.includes('drizzle'))return 53;if(v.includes('snow'))return 73;if(v.includes('fog')||v.includes('smoke'))return 45;if(v.includes('cloud'))return v.includes('partly')?2:3;if(v.includes('clear')||v.includes('sunny'))return 0;return 2}
function parseWind(v){const m=String(v||'').match(/\d+/);return m?Number(m[0]):0}
function observedRain(features=[],hours=24){
 const cutoff=Date.now()-hours*3600000,buckets=new Map();
 for(const feature of features){
  const p=feature?.properties||{},at=new Date(p.timestamp||0).getTime();
  if(!Number.isFinite(at)||at<cutoff||at>Date.now()+300000)continue;
  const inches=measurementToInches(p.precipitationLastHour);
  if(!(inches>0))continue;
  const bucket=Math.floor(at/3600000);
  buckets.set(bucket,Math.max(buckets.get(bucket)||0,inches));
 }
 const total=[...buckets.values()].reduce((a,b)=>a+b,0);
 return total>10?0:total;
}

function normalizeNws({forecast,latest,history,alerts}){
 const obs=latest?.properties||{},periods=forecast?.properties?.periods||[],today=gbDate(Date.now());
 const day=periods.find(p=>p.isDaytime&&gbDate(p.startTime)===today)||periods.find(p=>p.isDaytime)||periods[0];
 const night=periods.find(p=>!p.isDaytime&&new Date(p.startTime)>=new Date(day?.startTime||Date.now()))||periods.find(p=>!p.isDaytime);
 const condition=obs.textDescription||day?.shortForecast||'Current conditions',code=codeFromText(condition),temperature=toF(Number(obs.temperature?.value));
 const rain24=observedRain(history?.features,24),rain6=observedRain(history?.features,6),currentRain=measurementToInches(obs.precipitationLastHour);
 const activeAlerts=(alerts?.features||[]).map(x=>({event:x?.properties?.event,severity:x?.properties?.severity,headline:x?.properties?.headline})).filter(x=>x.event);
 const storming=/thunder|tornado|severe storm/i.test(condition)||activeAlerts.some(x=>/thunderstorm|tornado/i.test(x.event));
 const raining=storming||currentRain>0||/rain|drizzle|shower/i.test(condition);
 const hold=writeHold(Math.max(rain24,currentRain),'NWS/KGRB');
 return{temperature:temperature??Number(day?.temperature??0),apparent:temperature??Number(day?.temperature??0),weatherCode:code,condition,isDay:true,wind:Math.round(Number(obs.windSpeed?.value||0)*2.23694)||parseWind(day?.windSpeed),precipitation:Number(currentRain.toFixed(2)),recentRain6h:Number(rain6.toFixed(2)),recentRain24h:Number(rain24.toFixed(2)),rainHoldAmount:Number(hold?.amount||0),rainHoldSource:hold?.source||'',isRainingNow:raining,isStormingNow:storming,rainChance:Number(String(day?.detailedForecast||'').match(/(\d+)%/)?.[1]||0),high:Number(day?.temperature??temperature??0),low:Number(night?.temperature??temperature??0),dailyRainChance:Number(String(day?.detailedForecast||'').match(/(\d+)%/)?.[1]||0),observedAt:obs.timestamp||new Date().toISOString(),fetchedAt:new Date().toISOString(),provider:'National Weather Service',station:NWS_STATION,activeAlerts};
}

async function fetchNws(signal){
 const point=await fetchJson(`https://api.weather.gov/points/${GREEN_BAY.latitude},${GREEN_BAY.longitude}`,signal),forecastUrl=point?.properties?.forecast;
 if(!forecastUrl)throw new Error('NWS forecast unavailable');
 const start=new Date(Date.now()-24*3600000).toISOString();
 const[forecast,latest,history,alerts]=await Promise.all([fetchJson(forecastUrl,signal),fetchJson(`https://api.weather.gov/stations/${NWS_STATION}/observations/latest`,signal),fetchJson(`https://api.weather.gov/stations/${NWS_STATION}/observations?start=${encodeURIComponent(start)}&limit=80`,signal),fetchJson(`https://api.weather.gov/alerts/active?point=${GREEN_BAY.latitude},${GREEN_BAY.longitude}`,signal)]);
 return normalizeNws({forecast,latest,history,alerts});
}

function todayIndex(payload){const dates=payload.daily?.time||[],date=String(payload.current?.time||'').slice(0,10),i=dates.indexOf(date);return i>=0?i:0}
function modelRain(payload,hours){const times=payload.hourly?.time||[],values=payload.hourly?.precipitation||[],now=new Date(payload.current?.time||Date.now()).getTime(),cutoff=now-hours*3600000;const total=values.reduce((sum,v,i)=>{const at=new Date(times[i]).getTime();return Number.isFinite(at)&&at>cutoff&&at<=now?sum+Number(v||0):sum},0);return total>10?0:total}
async function fetchFallback(signal){
 const params=new URLSearchParams({latitude:String(GREEN_BAY.latitude),longitude:String(GREEN_BAY.longitude),current:'temperature_2m,apparent_temperature,is_day,weather_code,precipitation,wind_speed_10m',hourly:'precipitation_probability,precipitation',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max',temperature_unit:'fahrenheit',wind_speed_unit:'mph',precipitation_unit:'inch',timezone:GREEN_BAY.timezone,past_days:'1',forecast_days:'3'});
 const p=await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`,signal),i=todayIndex(p),code=p.current.weather_code,r24=modelRain(p,24),r6=modelRain(p,6),hold=writeHold(r24,'Open-Meteo fallback');
 return{temperature:Math.round(p.current.temperature_2m),apparent:Math.round(p.current.apparent_temperature),weatherCode:code,condition:labels[code]||'Current conditions',isDay:Boolean(p.current.is_day),wind:Math.round(p.current.wind_speed_10m||0),precipitation:Number(p.current.precipitation||0),recentRain6h:Number(r6.toFixed(2)),recentRain24h:Number(r24.toFixed(2)),rainHoldAmount:Number(hold?.amount||0),rainHoldSource:hold?.source||'',isRainingNow:Number(p.current.precipitation||0)>0||[51,53,55,61,63,65,80,81,82,95,96,99].includes(code),isStormingNow:[95,96,99].includes(code),rainChance:Math.round(p.hourly?.precipitation_probability?.[0]||0),high:Math.round(p.daily.temperature_2m_max[i]),low:Math.round(p.daily.temperature_2m_min[i]),dailyRainChance:Math.round(p.daily.precipitation_probability_max[i]||0),observedAt:p.current.time,fetchedAt:new Date().toISOString(),provider:'Open-Meteo fallback',station:'',activeAlerts:[]};
}

export function useGreenBayWeather(){
 const cached=read(CACHE_KEY),[weather,setWeather]=useState(cached?.weather||null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[source,setSource]=useState(cached?.weather?'cached':''),[savedAt,setSavedAt]=useState(cached?.savedAt||0),seq=useRef(0),controllerRef=useRef(null);
 const apply=useCallback((next,nextSource,id)=>{if(id!==seq.current)return;const hold=activeHold(),merged={...next,rainHoldAmount:Math.max(Number(next.rainHoldAmount||0),Number(hold?.amount||0)),rainHoldSource:hold?.source||next.rainHoldSource||''},now=Date.now();setWeather(merged);setSource(nextSource);setSavedAt(now);setError('');localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:now,weather:merged}))},[]);
 const refresh=useCallback(async({force=false}={})=>{const c=read(CACHE_KEY);if(!force&&c?.savedAt&&Date.now()-c.savedAt<CACHE_MAX_AGE){setWeather(c.weather);setSource('cached');setSavedAt(c.savedAt);setLoading(false);return}const id=++seq.current;controllerRef.current?.abort();const controller=new AbortController();controllerRef.current=controller;const timer=setTimeout(()=>controller.abort(),12000);setLoading(true);setError('');try{apply(await fetchNws(controller.signal),'live',id)}catch{if(id!==seq.current||controller.signal.aborted)return;try{apply(await fetchFallback(controller.signal),'fallback',id);setError('Official NWS weather was unavailable. Showing a labeled fallback.')}catch{if(c?.weather){setWeather(c.weather);setSource('cached');setSavedAt(c.savedAt||0);setError('Live weather unavailable. Saved weather must not drive watering decisions.')}else{setSource('unavailable');setError('Weather unavailable. Do not rely on automated watering advice.')}}}finally{clearTimeout(timer);if(id===seq.current)setLoading(false)}},[apply]);
 const recordRain=useCallback(amount=>{const inches=Number(amount);if(!Number.isFinite(inches)||inches<=0||inches>10)return false;const hold=writeHold(inches,'Home rain gauge');setWeather(w=>w?{...w,rainHoldAmount:hold.amount,rainHoldSource:hold.source,recentRain24h:Math.max(Number(w.recentRain24h||0),inches)}:w);return true},[]);
 useEffect(()=>{localStorage.removeItem('brookes-garden-weather-v5');localStorage.removeItem('brookes-garden-rain-hold-v1');refresh({force:true});let last=0;const foreground=()=>{if(document.visibilityState&&document.visibilityState!=='visible')return;const now=Date.now();if(now-last<5000)return;last=now;refresh({force:true})};const online=()=>refresh({force:true});document.addEventListener('visibilitychange',foreground);window.addEventListener('pageshow',foreground);window.addEventListener('online',online);return()=>{controllerRef.current?.abort();document.removeEventListener('visibilitychange',foreground);window.removeEventListener('pageshow',foreground);window.removeEventListener('online',online)}},[refresh]);
 const stale=source==='cached'||source==='unavailable'||(savedAt?Date.now()-savedAt>STALE_AFTER:true);
 return{weather,loading,error,source,stale,savedAt,refresh:()=>refresh({force:true}),recordRain};
}

export function gardenWeatherAlert(w){if(!w)return null;if(w.isStormingNow)return{type:'storm',label:'Storm happening now',title:w.condition,detail:'Do not water or work outside during lightning.',reading:`${w.temperature}°`};if(w.isRainingNow)return{type:'rain',label:'Rain happening now',title:w.condition,detail:'Do not water. Leave outdoor beds alone today.',reading:`${w.temperature}°`};if((w.rainHoldAmount||0)>=.25)return{type:'recent-rain',label:'Outdoor watering paused',title:`${w.rainHoldAmount.toFixed(2)} in. recorded`,detail:`Skip routine outdoor watering and soil-check tasks today. Source: ${w.rainHoldSource||'recent rainfall'}.`,reading:`${w.rainHoldAmount.toFixed(2)} in`};if((w.rainHoldAmount||0)>=.1)return{type:'recent-rain',label:'Rain fell recently',title:`${w.rainHoldAmount.toFixed(2)} in. recorded`,detail:'Hold off on outdoor watering.',reading:`${w.rainHoldAmount.toFixed(2)} in`};if(w.activeAlerts?.length)return{type:'alert',label:'Official weather alert',title:w.activeAlerts[0].event,detail:w.activeAlerts[0].headline||'Check a trusted local weather source.',reading:'NWS'};if(w.low<=36)return{type:'frost',label:'Cold-night watch',title:`Low near ${w.low}° tonight`,detail:'Protect tender plants before sunset.',reading:`${w.low}°`};if(w.dailyRainChance>=70)return{type:'rain',label:'Rain likely',title:`${w.dailyRainChance}% chance today`,detail:'Hold off on automatic outdoor watering.',reading:`${w.dailyRainChance}%`};if(w.wind>=20)return{type:'wind',label:'Windy conditions',title:`Wind around ${w.wind} mph`,detail:'Secure lightweight pots and covers.',reading:`${w.wind}`};if(w.high>=88)return{type:'heat',label:'Heat watch',title:`High near ${w.high}° today`,detail:'Check uncovered containers and seedlings early.',reading:`${w.high}°`};return{type:'good',label:'Garden weather',title:`${w.condition} in 54302`,detail:'Use plant-specific care and recorded rainfall before watering.',reading:`${w.temperature}°`}}
