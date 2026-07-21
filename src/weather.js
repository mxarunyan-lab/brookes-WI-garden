import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GREEN_BAY } from './data.js';
import { buildEnvironmentalSnapshot, createManualCorrection, normalizeEnvironmentalRecord, SOURCE_TYPES } from './environmentalIntelligence.js';

const CACHE_KEY='brookes-garden-environment-v1';
const CORRECTION_KEY='brookes-garden-weather-corrections-v1';
const GARDEN_KEY='brookes-garden-state-v2';
const CACHE_MAX_AGE=5*60*1000;
const NWS_STATION='KGRB';
const labels={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Cloudy',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',66:'Freezing Rain',67:'Heavy Freezing Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Rain Showers',81:'Rain Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorms',96:'Storms with Hail',99:'Severe Storms with Hail'};

const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
const toF=value=>Number.isFinite(Number(value))?Number((Number(value)*9/5+32).toFixed(1)):null;
const measurement=(item,convert=value=>value)=>{const value=Number(item?.value);return Number.isFinite(value)?convert(value):null};
export const measurementToMph=item=>{const value=Number(item?.value);if(!Number.isFinite(value))return null;const unit=String(item?.unitCode||'').toLowerCase();if(unit.includes('km_h')||unit.includes('km/h'))return Number((value*.621371).toFixed(1));if(unit.includes('m_s')||unit.includes('m/s'))return Number((value*2.23694).toFixed(1));if(unit.includes('[mi_i]/h')||unit.includes('mph'))return Number(value.toFixed(1));return Number(value.toFixed(1))};
const measurementToInches=item=>{const value=Number(item?.value);if(!Number.isFinite(value)||value<0)return null;const unit=String(item?.unitCode||'').toLowerCase();if(unit.includes(':mm')||unit.endsWith('/mm'))return Number((value/25.4).toFixed(3));if(unit.includes(':cm')||unit.endsWith('/cm'))return Number((value/2.54).toFixed(3));if(unit.includes('[in_i]')||unit.includes(':in'))return Number(value.toFixed(3));if(unit.includes(':m')||unit.endsWith('/m'))return Number((value*39.3700787).toFixed(3));return null};
const codeFromText=text=>{const value=String(text||'').toLowerCase();if(value.includes('thunder'))return 95;if(value.includes('heavy rain'))return 65;if(value.includes('rain')||value.includes('shower'))return 63;if(value.includes('drizzle'))return 53;if(value.includes('snow'))return 73;if(value.includes('fog')||value.includes('smoke'))return 45;if(value.includes('cloud'))return value.includes('partly')?2:3;if(value.includes('clear')||value.includes('sunny'))return 0;return 2};
const gardenSpaces=()=>read(GARDEN_KEY,{spaces:[]})?.spaces||[];

async function fetchJson(url,signal){
 const response=await fetch(url,{signal,cache:'no-store',headers:{Accept:'application/geo+json, application/json','User-Agent':'RunyanGarden/0.16'}});
 if(!response.ok)throw new Error(`Weather service returned ${response.status}`);
 return response.json();
}

function alertRows(alerts){return(alerts?.features||[]).map(item=>({event:item?.properties?.event||'',severity:item?.properties?.severity||'',headline:item?.properties?.headline||'',starts:item?.properties?.onset||item?.properties?.effective||null,ends:item?.properties?.ends||item?.properties?.expires||null})).filter(item=>item.event)}

export function nwsObservationRecord(feature,alerts=[]){
 const p=feature?.properties||{},condition=p.textDescription||'Current conditions';
 return normalizeEnvironmentalRecord({record_id:feature?.id||undefined,source_type:SOURCE_TYPES.OBSERVED,source_name:`National Weather Service ${NWS_STATION}`,source_provider:'National Weather Service',source_station_id:NWS_STATION,observed_at:p.timestamp,received_at:new Date(),expires_at:p.timestamp?new Date(new Date(p.timestamp).getTime()+2*60*60*1000):null,temperature:measurement(p.temperature,toF),feels_like:measurement(p.heatIndex,toF)??measurement(p.windChill,toF)??measurement(p.temperature,toF),humidity:measurement(p.relativeHumidity),dew_point:measurement(p.dewpoint,toF),wind_speed:measurementToMph(p.windSpeed),wind_gust:measurementToMph(p.windGust),wind_direction:measurement(p.windDirection),pressure:measurement(p.barometricPressure,value=>Number((value/100).toFixed(1))),precipitation_rate:measurementToInches(p.precipitationLastHour),precipitation_amount:measurementToInches(p.precipitationLastHour),precipitation_period:'1-hour',weather_condition:condition,weather_alerts:alerts,weather_code:codeFromText(condition),quality_status:'official-observation',confidence:'High'});
}

function nwsForecastRecord(period,kind='hourly',alerts=[]){
 const probability=Number(period?.probabilityOfPrecipitation?.value);
 const temperature=Number(period?.temperature);
 return normalizeEnvironmentalRecord({record_id:`nws-${kind}-${period?.number||period?.startTime}`,source_type:SOURCE_TYPES.FORECAST,source_name:'National Weather Service forecast',source_provider:'National Weather Service',source_station_id:NWS_STATION,forecast_for:period?.startTime,received_at:new Date(),expires_at:period?.endTime,temperature:Number.isFinite(temperature)?temperature:null,minimum_temperature:!period?.isDaytime&&kind==='daily'?temperature:null,maximum_temperature:period?.isDaytime&&kind==='daily'?temperature:null,wind_speed:Number(String(period?.windSpeed||'').match(/\d+/)?.[0]||0),wind_direction:period?.windDirection||null,precipitation_probability:Number.isFinite(probability)?probability:null,weather_condition:period?.shortForecast||period?.detailedForecast||'',weather_alerts:alerts,weather_code:codeFromText(period?.shortForecast||period?.detailedForecast),quality_status:'official-forecast',confidence:'Medium'});
}

async function fetchNws(signal){
 const point=await fetchJson(`https://api.weather.gov/points/${GREEN_BAY.latitude},${GREEN_BAY.longitude}`,signal),props=point?.properties||{};
 if(!props.forecast||!props.forecastHourly)throw new Error('NWS forecast unavailable');
 const start=new Date(Date.now()-24*3600000).toISOString();
 const[forecast,hourly,latest,history,alerts]=await Promise.all([
  fetchJson(props.forecast,signal),fetchJson(props.forecastHourly,signal),fetchJson(`https://api.weather.gov/stations/${NWS_STATION}/observations/latest`,signal),fetchJson(`https://api.weather.gov/stations/${NWS_STATION}/observations?start=${encodeURIComponent(start)}&limit=80`,signal),fetchJson(`https://api.weather.gov/alerts/active?point=${GREEN_BAY.latitude},${GREEN_BAY.longitude}`,signal)
 ]);
 const activeAlerts=alertRows(alerts),records=[];
 records.push(nwsObservationRecord(latest,activeAlerts));
 for(const feature of history?.features||[])records.push(nwsObservationRecord(feature,activeAlerts));
 for(const period of hourly?.properties?.periods||[])records.push(nwsForecastRecord(period,'hourly',activeAlerts));
 for(const period of forecast?.properties?.periods||[])records.push(nwsForecastRecord(period,'daily',activeAlerts));
 return{records,provider:'National Weather Service',mode:'live'};
}

function openMeteoRecords(payload){
 const records=[],current=payload.current||{},currentCode=Number(current.weather_code);
 records.push(normalizeEnvironmentalRecord({record_id:`open-meteo-current-${current.time||Date.now()}`,source_type:SOURCE_TYPES.ESTIMATED,source_name:'Open-Meteo current estimate',source_provider:'Open-Meteo',observed_at:current.time,received_at:new Date(),expires_at:current.time?new Date(new Date(current.time).getTime()+90*60*1000):null,temperature:current.temperature_2m,feels_like:current.apparent_temperature,humidity:current.relative_humidity_2m,wind_speed:current.wind_speed_10m,wind_gust:current.wind_gusts_10m,precipitation_rate:current.precipitation,precipitation_amount:current.precipitation,precipitation_period:'current-model-hour',weather_condition:labels[currentCode]||'Current conditions estimate',weather_code:currentCode,quality_status:'regional-model-estimate',confidence:'Low'}));
 const times=payload.hourly?.time||[];
 for(let i=0;i<times.length;i++)records.push(normalizeEnvironmentalRecord({record_id:`open-meteo-hourly-${times[i]}`,source_type:SOURCE_TYPES.FORECAST,source_name:'Open-Meteo forecast',source_provider:'Open-Meteo',forecast_for:times[i],received_at:new Date(),expires_at:new Date(new Date(times[i]).getTime()+60*60*1000),temperature:payload.hourly?.temperature_2m?.[i],humidity:payload.hourly?.relative_humidity_2m?.[i],wind_speed:payload.hourly?.wind_speed_10m?.[i],wind_gust:payload.hourly?.wind_gusts_10m?.[i],precipitation_amount:payload.hourly?.precipitation?.[i],precipitation_period:'forecast-hour',precipitation_probability:payload.hourly?.precipitation_probability?.[i],weather_condition:labels[payload.hourly?.weather_code?.[i]]||'Forecast conditions',weather_code:payload.hourly?.weather_code?.[i],quality_status:'regional-model-forecast',confidence:'Medium'}));
 const dates=payload.daily?.time||[];
 for(let i=0;i<dates.length;i++)records.push(normalizeEnvironmentalRecord({record_id:`open-meteo-daily-${dates[i]}`,source_type:SOURCE_TYPES.FORECAST,source_name:'Open-Meteo daily forecast',source_provider:'Open-Meteo',forecast_for:`${dates[i]}T12:00:00`,received_at:new Date(),expires_at:`${dates[i]}T23:59:59`,minimum_temperature:payload.daily?.temperature_2m_min?.[i],maximum_temperature:payload.daily?.temperature_2m_max?.[i],precipitation_amount:payload.daily?.precipitation_sum?.[i],precipitation_period:'forecast-day',precipitation_probability:payload.daily?.precipitation_probability_max?.[i],weather_condition:labels[payload.daily?.weather_code?.[i]]||'Daily forecast',weather_code:payload.daily?.weather_code?.[i],quality_status:'regional-model-forecast',confidence:'Medium'}));
 return records;
}

async function fetchFallback(signal){
 const params=new URLSearchParams({latitude:String(GREEN_BAY.latitude),longitude:String(GREEN_BAY.longitude),current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,precipitation,wind_speed_10m,wind_gusts_10m',hourly:'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',temperature_unit:'fahrenheit',wind_speed_unit:'mph',precipitation_unit:'inch',timezone:GREEN_BAY.timezone,past_days:'1',forecast_days:'7'});
 const payload=await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`,signal);
 return{records:openMeteoRecords(payload),provider:'Open-Meteo',mode:'fallback'};
}

export function useGreenBayWeather(){
 const cached=read(CACHE_KEY,{savedAt:0,records:[]}),[records,setRecords]=useState(cached.records||[]),[corrections,setCorrections]=useState(()=>read(CORRECTION_KEY,[])),[loading,setLoading]=useState(true),[error,setError]=useState(''),[source,setSource]=useState(cached.records?.length?'cached':'unavailable'),[savedAt,setSavedAt]=useState(cached.savedAt||0),seq=useRef(0),controllerRef=useRef(null);
 const snapshot=useMemo(()=>buildEnvironmentalSnapshot({records,corrections,spaces:gardenSpaces()}),[records,corrections]);
 const apply=useCallback((result,nextSource,requestId)=>{if(requestId!==seq.current)return;const now=Date.now();setRecords(result.records);setSource(nextSource);setSavedAt(now);setError('');write(CACHE_KEY,{savedAt:now,records:result.records,provider:result.provider});},[]);
 const refresh=useCallback(async({force=false}={})=>{
  const currentCache=read(CACHE_KEY,{savedAt:0,records:[]});
  if(!force&&currentCache.savedAt&&Date.now()-currentCache.savedAt<CACHE_MAX_AGE){setRecords(currentCache.records||[]);setSource('cached');setSavedAt(currentCache.savedAt);setLoading(false);return}
  const requestId=++seq.current;controllerRef.current?.abort();const controller=new AbortController();controllerRef.current=controller;const timer=setTimeout(()=>controller.abort(),15000);setLoading(true);setError('');
  try{apply(await fetchNws(controller.signal),'live',requestId)}catch(firstError){if(requestId!==seq.current)return;try{apply(await fetchFallback(controller.signal),'fallback',requestId);setError('Official NWS weather was unavailable. Showing a labeled regional forecast fallback.')}catch{if(currentCache.records?.length){setRecords(currentCache.records);setSource('cached');setSavedAt(currentCache.savedAt||0);setError('Garden conditions could not refresh. Showing the latest available reading.')}else{setSource('unavailable');setError('Weather data is temporarily unavailable. Check soil before watering.')}}}finally{clearTimeout(timer);if(requestId===seq.current)setLoading(false)}
 },[apply]);
 const persistCorrections=useCallback(next=>{setCorrections(next);write(CORRECTION_KEY,next)},[]);
 const recordRain=useCallback(input=>{try{const data=typeof input==='object'?input:{rainfall_amount:input},record=createManualCorrection({...data,rainfall_amount:data.rainfall_amount??data.amount,source:data.source||'Home weather monitor',entered_by:null});persistCorrections([record,...corrections]);return record}catch{return false}},[corrections,persistCorrections]);
 const updateCorrection=useCallback((recordId,patch)=>{const next=corrections.map(row=>row.record_id===recordId?createManualCorrection({rainfall_amount:patch.rainfall_amount??patch.amount??row.precipitation_amount,temperature:patch.temperature??row.temperature,note:patch.note??row.entry_note,observed_at:patch.observed_at??row.observed_at,source:patch.source??row.source_name,entered_by:row.entered_by,supersedes_observation_id:patch.supersedes_observation_id??row.supersedes_observation_id}):row);next.forEach((row,index)=>{if(corrections[index]?.record_id===recordId)row.record_id=recordId});persistCorrections(next)},[corrections,persistCorrections]);
 const removeCorrection=useCallback(recordId=>persistCorrections(corrections.filter(row=>row.record_id!==recordId)),[corrections,persistCorrections]);
 useEffect(()=>{localStorage.removeItem('brookes-garden-weather-v6');localStorage.removeItem('brookes-garden-rain-hold-v2');refresh({force:true});let last=0;const foreground=()=>{if(document.visibilityState&&document.visibilityState!=='visible')return;const now=Date.now();if(now-last<5000)return;last=now;refresh({force:true})};const online=()=>refresh({force:true});document.addEventListener('visibilitychange',foreground);window.addEventListener('pageshow',foreground);window.addEventListener('online',online);return()=>{controllerRef.current?.abort();document.removeEventListener('visibilitychange',foreground);window.removeEventListener('pageshow',foreground);window.removeEventListener('online',online)}},[refresh]);
 return{weather:snapshot,environment:snapshot,loading,error,source,stale:snapshot.isStale,savedAt,refresh:()=>refresh({force:true}),recordRain,updateCorrection,removeCorrection,corrections};
}

export function gardenWeatherAlert(weather){
 if(!weather)return null;
 const signals=weather.signals||{};
 if(weather.isStormingNow)return{type:'storm',label:'Storm happening now',title:weather.condition,detail:'Do not water or work outside during lightning.',reading:`${weather.temperature??'—'}°`};
 if(weather.isRainingNow)return{type:'rain',label:'Rain happening now',title:weather.condition,detail:'Observed rain is happening now. Outdoor watering should wait.',reading:`${weather.temperature??'—'}°`};
 if(signals.heavyRain?.status)return{type:'recent-rain',label:'Heavy rain received',title:`${weather.recentRain24h.toFixed(2)} in recorded`,detail:signals.heavyRain.reason,reading:`${weather.recentRain24h.toFixed(2)} in`};
 if(signals.recentMeaningfulRain?.status)return{type:'recent-rain',label:'Outdoor watering adjusted',title:`${weather.recentRain24h.toFixed(2)} in recorded`,detail:'Exposed spaces receive rain credit. Protected spaces still need their own soil check.',reading:`${weather.recentRain24h.toFixed(2)} in`};
 if(signals.freezeRisk?.status||signals.frostRisk?.status)return{type:'frost',label:'Cold-night watch',title:`Low near ${weather.low}°`,detail:(signals.freezeRisk?.status?signals.freezeRisk:signals.frostRisk).reason,reading:`${weather.low}°`};
 if(weather.activeAlerts?.length)return{type:'alert',label:'Official weather alert',title:weather.activeAlerts[0].event,detail:weather.activeAlerts[0].headline||'Check a trusted local weather source.',reading:'NWS'};
 if(signals.windDamageRisk?.status)return{type:'wind',label:'Windy conditions',title:`Wind near ${Math.round(weather.windGust||weather.wind||0)} mph`,detail:signals.windDamageRisk.reason,reading:`${Math.round(weather.windGust||weather.wind||0)}`};
 if(signals.heatStressRisk?.status)return{type:'heat',label:'Heat watch',title:`High near ${weather.high}°`,detail:signals.heatStressRisk.reason,reading:`${weather.high}°`};
 if(signals.rainExpectedSoon?.status)return{type:'rain',label:'Rain may arrive soon',title:`Up to ${Math.round(weather.dailyRainChance||0)}% chance`,detail:'Forecast rain may delay a watering decision, but it never counts as completed watering.',reading:`${Math.round(weather.dailyRainChance||0)}%`};
 return{type:'good',label:'Garden weather',title:`${weather.condition} in 54302`,detail:'Use plant-specific care, Growing Space exposure, and recorded rainfall before watering.',reading:`${weather.temperature??'—'}°`};
}
