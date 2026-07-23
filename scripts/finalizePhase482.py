from pathlib import Path
import json,re

env=Path('src/environmentalIntelligence.js')
t=env.read_text()
if "./weatherCondition.js" not in t:
    t=t.replace("import { GREEN_BAY } from './data.js';", "import { GREEN_BAY } from './data.js';\nimport { weatherCodeFromCondition } from './weatherCondition.js';")
t=t.replace("'record_id','source_type','source_name','source_provider','source_station_id','observed_at'", "'record_id','source_type','source_name','source_provider','source_station_id','weather_code','weather_code_inferred','is_day','observed_at'")
t=t.replace("const isoOrNull=value=>{if(!value)return null;const date=value instanceof Date?value:new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};", "const isoOrNull=value=>{if(value===null||value===undefined||value==='')return null;let date;if(value instanceof Date)date=value;else if(typeof value==='number')date=new Date(value);else if(typeof value==='string'&&/^\\d{10,13}$/.test(value.trim())){const n=Number(value.trim());date=new Date(value.trim().length===10?n*1000:n)}else date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};")
old="record_id:input.record_id||id('environment'),source_type:sourceType,source_name:input.source_name||input.source_provider||'Unknown source',source_provider:input.source_provider||'',source_station_id:input.source_station_id||'',observed_at:isoOrNull(input.observed_at)"
new="record_id:input.record_id||id('environment'),source_type:sourceType,source_name:input.source_name||input.source_provider||'Unknown source',source_provider:input.source_provider||'',source_station_id:input.source_station_id||'',weather_code:numberOrNull(input.weather_code)??weatherCodeFromCondition(input.weather_condition),weather_code_inferred:input.weather_code===null||input.weather_code===undefined,is_day:input.is_day===null||input.is_day===undefined?null:Boolean(Number(input.is_day)||input.is_day===true),observed_at:isoOrNull(input.observed_at)"
if old not in t: raise SystemExit('environment record anchor missing')
t=t.replace(old,new)
start=t.index('export function buildEnvironmentalSnapshot')
end=t.index('\nexport const personalWeatherStationAdapter',start)
replacement="""export function buildEnvironmentalSnapshot({records=[],corrections=[],spaces=[],now=Date.now()}={}){
 const normalized=records.map(normalizeEnvironmentalRecord),priority=record=>/Runyan Garden Station|Weather Underground/i.test(record.source_name||record.source_provider||'')?3:record.source_type===SOURCE_TYPES.OBSERVED?2:record.source_type===SOURCE_TYPES.ESTIMATED?1:0;
 const observations=normalized.filter(record=>record.source_type!==SOURCE_TYPES.FORECAST).sort((a,b)=>priority(b)-priority(a)||new Date(b.observed_at||b.received_at||0)-new Date(a.observed_at||a.received_at||0));
 const forecasts=normalized.filter(record=>record.source_type===SOURCE_TYPES.FORECAST&&(!record.expires_at||new Date(record.expires_at).getTime()>=now)).sort((a,b)=>new Date(a.forecast_for||0)-new Date(b.forecast_for||0));
 const current=observations[0]||null,rain=effectiveRainfall({records:observations,corrections,sinceHours:24,now}),derived=deriveGardenSignals({current,forecast:forecasts,rain,spaces,now});
 const localKey=value=>new Intl.DateTimeFormat('en-CA',{timeZone:GREEN_BAY.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)),today=localKey(now),todayForecast=forecasts.filter(row=>row.forecast_for&&localKey(row.forecast_for)===today),todayDaily=todayForecast.filter(row=>row.minimum_temperature!==null||row.maximum_temperature!==null),todayHourly=todayForecast.filter(row=>row.temperature!==null);
 const highs=todayDaily.map(row=>row.maximum_temperature).filter(Number.isFinite),lows=todayDaily.map(row=>row.minimum_temperature).filter(Number.isFinite),high=highs.length?Math.max(...highs):todayHourly.length?Math.max(...todayHourly.map(row=>row.temperature).filter(Number.isFinite)):current?.temperature,low=lows.length?Math.min(...lows):todayHourly.length?Math.min(...todayHourly.map(row=>row.temperature).filter(Number.isFinite)):current?.temperature;
 const forecastRain=Math.max(0,...todayForecast.map(row=>Number(row.precipitation_probability||0))),rainCreditBySpace=Object.fromEntries(spaces.map(space=>[space.id,rainCreditForSpace(space,rain.amount)])),currentFreshness=derived.freshness;
 const currentSource=current?.source_name||current?.source_provider||'Weather unavailable',forecastSource=todayForecast[0]?.source_provider||todayForecast[0]?.source_name||forecasts[0]?.source_provider||'Forecast unavailable';
 return{schemaVersion:ENVIRONMENTAL_SCHEMA_VERSION,records:normalized,corrections:corrections.map(normalizeEnvironmentalRecord),observations,forecasts,currentObservation:current,recentRain:rain,signals:derived.signals,freshness:currentFreshness,confidence:derived.confidence,rainCreditBySpace,provider:currentSource,station:current?.source_station_id||'',temperature:current?.temperature,apparent:current?.feels_like??current?.temperature,weatherCode:current?.weather_code,condition:current?.weather_condition||'Current conditions unavailable',isDay:current?.is_day!==false,wind:current?.wind_speed??0,windGust:current?.wind_gust??0,humidity:current?.humidity,precipitation:current?.precipitation_rate??0,recentRain6h:effectiveRainfall({records:observations,corrections,sinceHours:6,now}).amount,recentRain24h:rain.amount,rainHoldAmount:rain.amount,rainHoldSource:rain.source,isRainingNow:Number(current?.precipitation_rate||0)>0,isStormingNow:/thunder|tornado|severe/i.test(current?.weather_condition||'')||Boolean(current?.weather_alerts?.some(alert=>/thunder|tornado|severe/i.test(alert.event||alert.headline||''))),rainChance:forecastRain,high:Number.isFinite(high)?Math.round(high):null,low:Number.isFinite(low)?Math.round(low):null,dailyRainChance:forecastRain,observedAt:current?.observed_at||null,fetchedAt:current?.received_at||forecasts[0]?.received_at||null,activeAlerts:forecasts.flatMap(row=>row.weather_alerts||[]),isStale:currentFreshness===FRESHNESS.STALE||currentFreshness===FRESHNESS.UNAVAILABLE,currentObservationSource:currentSource,forecastSource,alertSource:'National Weather Service',currentObservedAt:current?.observed_at||null,forecastRetrievedAt:todayForecast[0]?.received_at||forecasts[0]?.received_at||null,currentFreshness,forecastFreshness:todayForecast.length?'Current':'Unavailable',usedCurrentFallback:!/Runyan Garden Station|Weather Underground/i.test(currentSource),usedForecastFallback:!/^National Weather Service/i.test(forecastSource)};
}
"""
t=t[:start]+replacement+t[end:]
t=t.replace("id:'personal-weather-station',active:false", "id:'personal-weather-station',active:true")
env.write_text(t)

w=Path('src/weather.js'); t=w.read_text()
t=t.replace("import { buildEnvironmentalSnapshot, createManualCorrection, normalizeEnvironmentalRecord, SOURCE_TYPES } from './environmentalIntelligence.js';", "import { buildEnvironmentalSnapshot, createManualCorrection, normalizeEnvironmentalRecord, personalWeatherStationAdapter, SOURCE_TYPES } from './environmentalIntelligence.js';")
t=t.replace("weather_condition:condition,weather_alerts:alerts,weather_code:codeFromText(condition)", "weather_condition:condition,weather_alerts:alerts,weather_code:codeFromText(condition),is_day:p.timestamp?new Date(p.timestamp).getHours()>=6&&new Date(p.timestamp).getHours()<20:null")
t=t.replace("weather_condition:period?.shortForecast||period?.detailedForecast||'',weather_alerts:alerts,weather_code:codeFromText(period?.shortForecast||period?.detailedForecast)", "weather_condition:period?.shortForecast||period?.detailedForecast||'',weather_alerts:alerts,weather_code:codeFromText(period?.shortForecast||period?.detailedForecast),is_day:period?.isDaytime")
t=t.replace("weather_condition:labels[currentCode]||'Current conditions estimate',weather_code:currentCode", "weather_condition:labels[currentCode]||'Current conditions estimate',weather_code:currentCode,is_day:current.is_day")
marker="async function fetchFallback(signal){"
insert="""async function fetchPersonal(signal){
 const response=await fetch('/api/weather/current',{signal,cache:'no-store',headers:{accept:'application/json'}});const payload=await response.json();if(!response.ok||!payload.ok)throw new Error(payload.reason||'Personal station unavailable');return personalWeatherStationAdapter.normalize(payload.observation);
}

"""
if insert.strip() not in t:t=t.replace(marker,insert+marker)
old="apply(outcome.result,outcome.source,requestId);\n    if(outcome.usedFallback)setError('Official NWS weather was unavailable. Showing a labeled regional forecast fallback.');"
new="""let combined=outcome.result;
    try{const station=await runTimedWeatherOperation(fetchPersonal,{timeoutMs:8000,onController:controller=>{if(requestId!==seq.current)controller.abort()}});combined={...outcome.result,records:[station,...outcome.result.records],provider:'Runyan Garden Station + '+outcome.result.provider}}catch{}
    apply(combined,outcome.source,requestId);
    if(outcome.usedFallback)setError('Official NWS weather was unavailable. Showing a labeled regional forecast fallback.');"""
if old not in t: raise SystemExit('weather apply anchor missing')
t=t.replace(old,new)
w.write_text(t)

ws=Path('src/WorkspaceScreens.jsx'); t=ws.read_text()
t=t.replace("import{AlertTriangle,CalendarDays,Check,CheckCircle2,ChevronDown,ChevronRight,Cloud,CloudRain,CloudSun,Droplets,Leaf,Moon,RefreshCw,Snowflake,Sun}from'lucide-react';", "import{AlertTriangle,CalendarDays,Check,CheckCircle2,ChevronDown,ChevronRight,Cloud,CloudDrizzle,CloudFog,CloudLightning,CloudMoon,CloudRain,CloudSnow,CloudSun,Droplets,Leaf,Moon,RefreshCw,Snowflake,Sun,Thermometer}from'lucide-react';")
if "weatherConditionPresentation" not in t:t=t.replace("import{WeatherDetails}from'./WeatherDetails.jsx';", "import{WeatherDetails}from'./WeatherDetails.jsx';\nimport{weatherConditionPresentation}from'./weatherCondition.js';")
a=t.index('function WeatherIcon'); b=t.index('const weatherTime',a)
icon="""function WeatherIcon({weather,size=34}){const p=weatherConditionPresentation({weatherCode:weather?.weatherCode,condition:weather?.condition,precipitationRate:weather?.precipitation,isDay:weather?.isDay}),icons={Sun,Moon,CloudSun,CloudMoon,Cloud,CloudFog,CloudDrizzle,CloudRain,CloudLightning,Snowflake,CloudSnow,Thermometer},Icon=icons[p.iconName]||Thermometer;return <Icon size={size} aria-label={p.accessibilityLabel}/>} 
"""
t=t[:a]+icon+t[b:]
oldline=re.search(r"function WeatherLine\([^\n]+",t).group(0)
newline=oldline.replace("sourceLabel=weather?.provider||'Weather source unavailable',freshness=source==='live'&&!stale?`${sourceLabel} - updated ${weatherTime(savedAt||weather?.fetchedAt)}`:source==='fallback'?`${sourceLabel} - fallback - updated ${weatherTime(savedAt||weather?.fetchedAt)}`:`Saved weather - updated ${weatherTime(savedAt||weather?.fetchedAt)}`", "sourceLabel=weather?.currentObservationSource||weather?.provider||'Weather source unavailable',observed=weather?.currentObservedAt||weather?.observedAt||weather?.fetchedAt||savedAt,freshness=`${sourceLabel.toUpperCase()} · OBSERVED ${weatherTime(observed)}`")
newline=newline.replace("<button className=\"weather-refresh-button\" onClick={refresh} aria-label=\"Refresh official weather\"><RefreshCw/></button>", "<button className=\"weather-refresh-button\" onClick={refresh} disabled={loading} aria-label=\"Refresh garden weather\"><RefreshCw className={loading?'is-spinning':''}/></button>{weather?.usedCurrentFallback&&<em className=\"weather-source-badge\">BACKUP SOURCE</em>}{stale&&<em className=\"weather-source-badge is-stale\">STALE</em>}")
t=t.replace(oldline,newline)
ws.write_text(t)

ver=Path('src/version.js'); ver.write_text("export const APP_VERSION='0.21.0';\nexport const BUILD_ID='phase-4-8-2-weather-truth';\nexport const UPDATED_AT='July 23, 2026';\nexport const WHATS_NEW=[\n 'Weather icons now match the reported conditions',\n 'Today now uses today’s actual forecast high and low',\n 'Weather readings show their source and observation time',\n 'Backup and stale readings are clearly identified',\n 'Garden Compass can use the Runyan garden weather station when configured'\n];\n")
p=Path('package.json'); data=json.loads(p.read_text()); data['version']='0.21.0'; p.write_text(json.dumps(data,indent=2)+'\n')
Path('public/service-worker.js').write_text(Path('public/service-worker.js').read_text().replace("brookes-garden-v0481-mobile-continuity-20260723","brookes-garden-v0482-weather-truth-20260723"))
Path('render.yaml').write_text(Path('render.yaml').read_text().replace('value: 0.20.9','value: 0.21.0'))
css=Path('src/styles/phase-4-8-2-weather-truth.css'); css.write_text(".weather-source-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-size:.68rem;font-weight:800;letter-spacing:.06em;background:var(--cream);color:var(--green-950)}.weather-source-badge.is-stale{background:#f6d9c7}.weather-refresh-button:disabled{opacity:.65}.weather-refresh-button .is-spinning{animation:weather-spin 1s linear infinite}@keyframes weather-spin{to{transform:rotate(360deg)}}\n")
main=Path('src/main.jsx'); mt=main.read_text(); imp="import './styles/phase-4-8-2-weather-truth.css';"
if imp not in mt: mt=mt.replace("import './styles/phase-4-8-1-mobile-continuity.css';", "import './styles/phase-4-8-1-mobile-continuity.css';\n"+imp)
main.write_text(mt)
