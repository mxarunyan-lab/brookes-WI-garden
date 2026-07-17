import { GREEN_BAY } from './data.js';

export const SOURCE_TYPES={OBSERVED:'observed',FORECAST:'forecast',MANUAL:'manual',ESTIMATED:'estimated'};
export const FRESHNESS={CURRENT:'Current',RECENT:'Recent',STALE:'Stale',UNAVAILABLE:'Unavailable'};
export const ENVIRONMENTAL_SCHEMA_VERSION=1;
export const ENVIRONMENTAL_FIELDS=[
 'record_id','source_type','source_name','source_provider','source_station_id','observed_at','forecast_for','received_at','expires_at','location','latitude','longitude','temperature','feels_like','minimum_temperature','maximum_temperature','humidity','dew_point','wind_speed','wind_gust','wind_direction','pressure','precipitation_rate','precipitation_amount','precipitation_period','precipitation_probability','snow_amount','solar_radiation','uv_index','cloud_cover','weather_condition','weather_alerts','frost_risk','freeze_risk','heat_risk','wind_risk','disease_pressure','drying_risk','soil_moisture_estimate','confidence','quality_status','is_stale','is_manual_correction','entered_by','entry_note','supersedes_observation_id'
];

const numberOrNull=value=>{const n=Number(value);return value===''||value===null||value===undefined||!Number.isFinite(n)?null:n};
const isoOrNull=value=>{if(!value)return null;const date=value instanceof Date?value:new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};
const nowIso=()=>new Date().toISOString();
const id=(prefix='environment')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function normalizeEnvironmentalRecord(input={}){
 const sourceType=Object.values(SOURCE_TYPES).includes(input.source_type)?input.source_type:SOURCE_TYPES.ESTIMATED;
 const receivedAt=isoOrNull(input.received_at)||nowIso();
 const record={
  record_id:input.record_id||id('environment'),source_type:sourceType,source_name:input.source_name||input.source_provider||'Unknown source',source_provider:input.source_provider||'',source_station_id:input.source_station_id||'',observed_at:isoOrNull(input.observed_at),forecast_for:isoOrNull(input.forecast_for),received_at:receivedAt,expires_at:isoOrNull(input.expires_at),location:input.location||GREEN_BAY.name,latitude:numberOrNull(input.latitude)??GREEN_BAY.latitude,longitude:numberOrNull(input.longitude)??GREEN_BAY.longitude,temperature:numberOrNull(input.temperature),feels_like:numberOrNull(input.feels_like),minimum_temperature:numberOrNull(input.minimum_temperature),maximum_temperature:numberOrNull(input.maximum_temperature),humidity:numberOrNull(input.humidity),dew_point:numberOrNull(input.dew_point),wind_speed:numberOrNull(input.wind_speed),wind_gust:numberOrNull(input.wind_gust),wind_direction:input.wind_direction??null,pressure:numberOrNull(input.pressure),precipitation_rate:numberOrNull(input.precipitation_rate),precipitation_amount:numberOrNull(input.precipitation_amount),precipitation_period:input.precipitation_period||null,precipitation_probability:numberOrNull(input.precipitation_probability),snow_amount:numberOrNull(input.snow_amount),solar_radiation:numberOrNull(input.solar_radiation),uv_index:numberOrNull(input.uv_index),cloud_cover:numberOrNull(input.cloud_cover),weather_condition:input.weather_condition||'',weather_alerts:Array.isArray(input.weather_alerts)?input.weather_alerts:[],frost_risk:input.frost_risk??null,freeze_risk:input.freeze_risk??null,heat_risk:input.heat_risk??null,wind_risk:input.wind_risk??null,disease_pressure:input.disease_pressure??null,drying_risk:input.drying_risk??null,soil_moisture_estimate:input.soil_moisture_estimate??null,confidence:input.confidence||'Medium',quality_status:input.quality_status||'usable',is_stale:Boolean(input.is_stale),is_manual_correction:Boolean(input.is_manual_correction),entered_by:input.entered_by??null,entry_note:input.entry_note||'',supersedes_observation_id:input.supersedes_observation_id||null
 };
 return record;
}

export function freshnessFor(record,now=Date.now(),windows={current:20*60*1000,recent:2*60*60*1000}){
 if(!record)return FRESHNESS.UNAVAILABLE;
 const timestamp=record.source_type===SOURCE_TYPES.FORECAST?record.forecast_for:record.observed_at||record.received_at;
 const time=timestamp?new Date(timestamp).getTime():NaN;
 if(!Number.isFinite(time))return FRESHNESS.UNAVAILABLE;
 if(record.expires_at&&new Date(record.expires_at).getTime()<now)return FRESHNESS.STALE;
 const age=Math.max(0,now-time);
 if(age<=windows.current)return FRESHNESS.CURRENT;
 if(age<=windows.recent)return FRESHNESS.RECENT;
 return FRESHNESS.STALE;
}

export function confidenceFor(record,freshness=freshnessFor(record)){
 if(!record)return'Low';
 let score=record.source_type===SOURCE_TYPES.MANUAL?4:record.source_type===SOURCE_TYPES.OBSERVED?4:record.source_type===SOURCE_TYPES.FORECAST?3:1;
 if(freshness===FRESHNESS.RECENT)score-=1;
 if(freshness===FRESHNESS.STALE||freshness===FRESHNESS.UNAVAILABLE)score-=2;
 if(record.quality_status&&record.quality_status!=='usable'&&record.quality_status!=='verified')score-=1;
 return score>=4?'High':score>=2?'Medium':'Low';
}

export function createManualCorrection({rainfall_amount,temperature=null,note='',observed_at=new Date(),source='Home weather monitor',entered_by=null,supersedes_observation_id=null}={}){
 const rain=numberOrNull(rainfall_amount);
 if(rain===null||rain<0||rain>10)throw new Error('Rainfall must be between 0 and 10 inches.');
 return normalizeEnvironmentalRecord({record_id:id('manual-weather'),source_type:SOURCE_TYPES.MANUAL,source_name:source,source_provider:'Manual home monitor',observed_at,received_at:new Date(),expires_at:new Date(new Date(observed_at).getTime()+36*60*60*1000),temperature,precipitation_amount:Number(rain.toFixed(2)),precipitation_period:'event',confidence:'High',quality_status:'manual-correction',is_manual_correction:true,entered_by,entry_note:note,supersedes_observation_id});
}

const eventKey=record=>{
 const at=new Date(record.observed_at||record.forecast_for||record.received_at||0).getTime();
 const hours=Math.floor(at/3600000);
 return`${record.source_type}|${record.source_station_id||record.source_provider||record.source_name}|${record.precipitation_period||'event'}|${hours}`;
};

export function dedupeRainRecords(records=[]){
 const map=new Map();
 for(const raw of records){
  const record=normalizeEnvironmentalRecord(raw);
  const amount=numberOrNull(record.precipitation_amount);
  if(amount===null||amount<0)continue;
  const key=eventKey(record),current=map.get(key);
  if(!current||amount>(current.precipitation_amount??-1))map.set(key,record);
 }
 return[...map.values()];
}

export function effectiveRainfall({records=[],corrections=[],sinceHours=24,now=Date.now()}={}){
 const cutoff=now-sinceHours*3600000;
 const observed=dedupeRainRecords(records).filter(record=>record.source_type!==SOURCE_TYPES.FORECAST&&new Date(record.observed_at||record.received_at||0).getTime()>=cutoff);
 const manual=dedupeRainRecords(corrections).filter(record=>record.is_manual_correction&&new Date(record.observed_at||record.received_at||0).getTime()>=cutoff);
 const superseded=new Set(manual.map(record=>record.supersedes_observation_id).filter(Boolean));
 const provider=observed.filter(record=>!superseded.has(record.record_id));
 let total=provider.reduce((sum,record)=>sum+Number(record.precipitation_amount||0),0);
 for(const correction of manual){
  if(correction.supersedes_observation_id){total+=Number(correction.precipitation_amount||0);continue}
  const at=new Date(correction.observed_at||0).getTime();
  const matching=provider.filter(record=>Math.abs(new Date(record.observed_at||0).getTime()-at)<=3*3600000);
  if(matching.length){const original=Math.max(...matching.map(record=>Number(record.precipitation_amount||0)));total+=Math.max(0,Number(correction.precipitation_amount||0)-original)}else total+=Number(correction.precipitation_amount||0);
 }
 return{amount:Number(clamp(total,0,10).toFixed(2)),provider_records:provider,manual_records:manual,source:manual.length?'Home weather monitor correction applied':provider[0]?.source_name||provider[0]?.source_provider||'No observed rain source'};
}

export function classifySpaceExposure(space={}){
 const explicit=String(space.weatherExposure||space.rainExposure||'').toLowerCase();
 const type=String(space.type||'').toLowerCase();
 if(explicit)return explicit;
 if(['indoor','basement','hydro','seed-tray'].includes(type))return'indoor';
 if(type==='greenhouse')return'fully-rain-protected';
 if(/porch|overhang|covered/.test(type))return'partially-rain-protected';
 if(type==='container')return'container-outdoors';
 if(type.includes('raised')||type.includes('black-square')||type.includes('white-oval'))return'raised-bed';
 if(type.includes('in-ground')||type==='bed')return'in-ground-bed';
 return'fully-exposed-outdoors';
}

export function rainCreditForSpace(space={},rainAmount=0){
 const exposure=classifySpaceExposure(space),amount=Math.max(0,Number(rainAmount)||0);
 const factors={'indoor':0,'fully-rain-protected':0,'greenhouse':0,'covered-porch':0.1,'partially-rain-protected':0.35,'container-outdoors':0.8,'raised-bed':0.9,'in-ground-bed':1,'fully-exposed-outdoors':1};
 return{exposure,factor:factors[exposure]??1,amount:Number((amount*(factors[exposure]??1)).toFixed(2))};
}

function signal(status,confidence,reason,source,timestamp,affectedGrowingSpaces=[],expiresAt=null){return{status,confidence,reason,source,timestamp,affectedGrowingSpaces,expiresAt}}

export function deriveGardenSignals({current=null,forecast=[],rain={amount:0,source:''},spaces=[],now=Date.now()}={}){
 const source=current?.source_name||current?.source_provider||rain.source||'Environmental Intelligence';
 const timestamp=current?.observed_at||current?.received_at||new Date(now).toISOString();
 const freshness=freshnessFor(current,now),confidence=confidenceFor(current,freshness);
 const high=Math.max(current?.maximum_temperature??-Infinity,...forecast.map(row=>row.maximum_temperature??row.temperature??-Infinity));
 const low=Math.min(current?.minimum_temperature??Infinity,...forecast.map(row=>row.minimum_temperature??row.temperature??Infinity));
 const wind=Math.max(current?.wind_gust??current?.wind_speed??0,...forecast.map(row=>row.wind_gust??row.wind_speed??0));
 const humidity=current?.humidity??null;
 const rainSoon=forecast.some(row=>Number(row.precipitation_probability||0)>=65||Number(row.precipitation_amount||0)>=0.2);
 const exposed=spaces.filter(space=>rainCreditForSpace(space,rain.amount).factor>0).map(space=>space.id);
 const protectedIds=spaces.filter(space=>rainCreditForSpace(space,rain.amount).factor===0).map(space=>space.id);
 const signals={};
 signals.recentMeaningfulRain=signal(rain.amount>=0.25,confidence,rain.amount>=0.25?`${rain.amount.toFixed(2)} in of observed or manually corrected rain was recorded recently.`:'No meaningful observed rainfall is recorded in the current event window.',rain.source||source,timestamp,exposed,new Date(now+6*3600000).toISOString());
 signals.lightRainOnly=signal(rain.amount>0&&rain.amount<0.25,confidence,rain.amount>0&&rain.amount<0.25?`Only ${rain.amount.toFixed(2)} in was recorded; soil may still need checking.`:'Recent rainfall is not in the light-rain range.',rain.source||source,timestamp,exposed,new Date(now+6*3600000).toISOString());
 signals.heavyRain=signal(rain.amount>=0.75,confidence,rain.amount>=0.75?`${rain.amount.toFixed(2)} in was recorded; drainage and saturated soil may need attention.`:'Heavy rain is not currently recorded.',rain.source||source,timestamp,exposed,new Date(now+12*3600000).toISOString());
 signals.rainExpectedSoon=signal(rainSoon,forecast.length?'Medium':'Low',rainSoon?'Forecast rain may justify delaying, but never completing, a watering task.':'No strong rain window is present in the available forecast.',forecast[0]?.source_name||forecast[0]?.source_provider||source,forecast[0]?.forecast_for||timestamp,exposed,new Date(now+6*3600000).toISOString());
 const drying=Number(high)>=85||Number(wind)>=18||(humidity!==null&&humidity<35);
 signals.dryingConditions=signal(drying,confidence,drying?'Heat, wind, or low humidity may dry soil faster than usual.':'No major accelerated-drying signal is present.',source,timestamp,spaces.map(space=>space.id),new Date(now+6*3600000).toISOString());
 signals.highEvaporationRisk=signal(Number(high)>=90&&Number(wind)>=12,confidence,'High heat combined with wind can increase evaporation, especially in containers and raised beds.',source,timestamp,spaces.filter(space=>['container-outdoors','raised-bed'].includes(classifySpaceExposure(space))).map(space=>space.id),new Date(now+6*3600000).toISOString());
 signals.heatStressRisk=signal(Number(high)>=90,forecast.length?'Medium':confidence,Number(high)>=90?`Temperatures near ${Math.round(high)}° may stress seedlings, transplants, and containers.`:'No major heat-stress threshold is present.',source,timestamp,spaces.map(space=>space.id),new Date(now+12*3600000).toISOString());
 signals.frostRisk=signal(Number(low)<=36,forecast.length?'Medium':confidence,Number(low)<=36?`A low near ${Math.round(low)}° may threaten tender plants.`:'No frost threshold is present in the available conditions.',source,timestamp,spaces.filter(space=>!['indoor','fully-rain-protected'].includes(classifySpaceExposure(space))).map(space=>space.id),new Date(now+18*3600000).toISOString());
 signals.freezeRisk=signal(Number(low)<=32,forecast.length?'Medium':confidence,Number(low)<=32?`A low near ${Math.round(low)}° may freeze exposed tender plants.`:'No freeze threshold is present.',source,timestamp,spaces.filter(space=>!['indoor'].includes(classifySpaceExposure(space))).map(space=>space.id),new Date(now+18*3600000).toISOString());
 signals.windDamageRisk=signal(Number(wind)>=25,confidence,Number(wind)>=25?`Wind near ${Math.round(wind)} mph may damage tall plants, covers, or containers.`:'No high-wind threshold is present.',source,timestamp,spaces.filter(space=>classifySpaceExposure(space)!=='indoor').map(space=>space.id),new Date(now+6*3600000).toISOString());
 const fungal=humidity!==null&&humidity>=80&&Number(current?.temperature||70)>=60;
 signals.fungalDiseaseRisk=signal(fungal,confidence,fungal?'Warm, humid conditions may increase fungal pressure. Inspect leaves rather than assuming disease.':'No strong warm-humid disease-pressure signal is present.',source,timestamp,spaces.map(space=>space.id),new Date(now+8*3600000).toISOString());
 signals.greenhouseOverheatRisk=signal(Number(high)>=80,forecast.length?'Medium':confidence,Number(high)>=80?'Outdoor warmth can make a greenhouse much hotter; ventilation should be checked.':'Outdoor conditions do not currently imply a greenhouse heat warning.',source,timestamp,spaces.filter(space=>classifySpaceExposure(space)==='fully-rain-protected').map(space=>space.id),new Date(now+6*3600000).toISOString());
 signals.wateringShouldBeDelayed=signal(rain.amount>=0.25||rainSoon,rain.amount>=0.25?confidence:'Medium',rain.amount>=0.25?`Watering may be delayed because ${rain.amount.toFixed(2)} in was recorded.`:'Forecast rain may justify a cautious delay; it does not count as watering.',rain.amount>=0.25?(rain.source||source):(forecast[0]?.source_name||source),timestamp,exposed,new Date(now+6*3600000).toISOString());
 signals.soilCheckRecommended=signal((rain.amount>0&&rain.amount<0.25)||freshness===FRESHNESS.STALE,confidence,(freshness===FRESHNESS.STALE)?'Conditions are stale. Check soil before making a watering decision.':'Light rain may not have reached the root zone. Check soil first.',source,timestamp,[...new Set([...exposed,...protectedIds])],new Date(now+4*3600000).toISOString());
 signals.protectTenderPlants=signals.freezeRisk.status||signals.frostRisk.status?signal(true,'Medium',signals.freezeRisk.status?signals.freezeRisk.reason:signals.frostRisk.reason,source,timestamp,signals.frostRisk.affectedGrowingSpaces,signals.frostRisk.expiresAt):signal(false,confidence,'No frost or freeze protection signal is active.',source,timestamp,[],new Date(now+12*3600000).toISOString());
 signals.transplantStressRisk=signal(Number(high)>=88||Number(wind)>=20||signals.frostRisk.status,'Medium','Heat, wind, or cold may make transplanting more stressful. Use the next calmer suitable window.',source,timestamp,spaces.filter(space=>classifySpaceExposure(space)!=='indoor').map(space=>space.id),new Date(now+12*3600000).toISOString());
 signals.safePlantingWindow=signal(!signals.transplantStressRisk.status&&!signals.heavyRain.status&&!signals.freezeRisk.status,'Medium','No major heat, wind, freeze, or heavy-rain conflict is present in the available window.',source,timestamp,spaces.map(space=>space.id),new Date(now+12*3600000).toISOString());
 signals.poorPlantingWindow=signal(!signals.safePlantingWindow.status,'Medium','A current or forecast weather risk makes planting less suitable right now.',source,timestamp,spaces.map(space=>space.id),new Date(now+12*3600000).toISOString());
 signals.delaySpraying=signal(Number(wind)>=12||rainSoon,'Medium','Delay foliar spraying when wind or near-term rain could reduce effectiveness or cause drift.',source,timestamp,spaces.filter(space=>classifySpaceExposure(space)!=='indoor').map(space=>space.id),new Date(now+6*3600000).toISOString());
 signals.delayFertilizing=signal(signals.heavyRain.status||rainSoon,'Medium','Heavy or imminent rain can wash fertilizer away. Wait for a calmer window.',source,timestamp,exposed,new Date(now+12*3600000).toISOString());
 return{freshness,confidence,signals};
}

export function buildEnvironmentalSnapshot({records=[],corrections=[],spaces=[],now=Date.now()}={}){
 const normalized=records.map(normalizeEnvironmentalRecord);
 const observations=normalized.filter(record=>record.source_type!==SOURCE_TYPES.FORECAST).sort((a,b)=>new Date(b.observed_at||b.received_at||0)-new Date(a.observed_at||a.received_at||0));
 const forecasts=normalized.filter(record=>record.source_type===SOURCE_TYPES.FORECAST&&(!record.expires_at||new Date(record.expires_at).getTime()>=now)).sort((a,b)=>new Date(a.forecast_for||0)-new Date(b.forecast_for||0));
 const current=observations[0]||null,rain=effectiveRainfall({records:observations,corrections,sinceHours:24,now}),derived=deriveGardenSignals({current,forecast:forecasts,rain,spaces,now});
 const daily=forecasts.filter(row=>row.minimum_temperature!==null||row.maximum_temperature!==null),hourly=forecasts.filter(row=>row.temperature!==null);
 const high=Math.max(current?.maximum_temperature??-Infinity,...daily.map(row=>row.maximum_temperature??row.temperature??-Infinity));
 const low=Math.min(current?.minimum_temperature??Infinity,...daily.map(row=>row.minimum_temperature??row.temperature??Infinity));
 const forecastRain=Math.max(0,...forecasts.map(row=>Number(row.precipitation_probability||0)));
 const rainCreditBySpace=Object.fromEntries(spaces.map(space=>[space.id,rainCreditForSpace(space,rain.amount)]));
 return{schemaVersion:ENVIRONMENTAL_SCHEMA_VERSION,records:normalized,corrections:corrections.map(normalizeEnvironmentalRecord),observations,forecasts,currentObservation:current,recentRain:rain,signals:derived.signals,freshness:derived.freshness,confidence:derived.confidence,rainCreditBySpace,provider:current?.source_provider||current?.source_name||forecasts[0]?.source_provider||'Weather unavailable',station:current?.source_station_id||'',temperature:current?.temperature,apparent:current?.feels_like??current?.temperature,weatherCode:current?.weather_code??2,condition:current?.weather_condition||'Current conditions unavailable',isDay:true,wind:current?.wind_speed??0,windGust:current?.wind_gust??0,humidity:current?.humidity,precipitation:current?.precipitation_rate??0,recentRain6h:effectiveRainfall({records:observations,corrections,sinceHours:6,now}).amount,recentRain24h:rain.amount,rainHoldAmount:rain.amount,rainHoldSource:rain.source,isRainingNow:Number(current?.precipitation_rate||0)>0,isStormingNow:/thunder|tornado|severe/i.test(current?.weather_condition||'')||Boolean(current?.weather_alerts?.some(alert=>/thunder|tornado|severe/i.test(alert.event||alert.headline||''))),rainChance:forecastRain,high:Number.isFinite(high)?Math.round(high):current?.temperature??null,low:Number.isFinite(low)?Math.round(low):current?.temperature??null,dailyRainChance:forecastRain,observedAt:current?.observed_at||null,fetchedAt:current?.received_at||forecasts[0]?.received_at||null,activeAlerts:current?.weather_alerts||forecasts.flatMap(row=>row.weather_alerts||[]),isStale:derived.freshness===FRESHNESS.STALE||derived.freshness===FRESHNESS.UNAVAILABLE};
}

export const personalWeatherStationAdapter={
 id:'personal-weather-station',active:false,requiredFields:['provider','station_id','observation_timestamp'],supportedFields:['temperature','humidity','dew_point','pressure','wind_speed','wind_gust','wind_direction','precipitation_rate','precipitation_accumulation','solar_radiation','uv_index','quality_control_status'],normalize(payload={}){return normalizeEnvironmentalRecord({source_type:SOURCE_TYPES.OBSERVED,source_name:payload.provider||'Personal weather station',source_provider:payload.provider||'',source_station_id:payload.station_id||'',observed_at:payload.observation_timestamp,temperature:payload.temperature,humidity:payload.humidity,dew_point:payload.dew_point,pressure:payload.pressure,wind_speed:payload.wind_speed,wind_gust:payload.wind_gust,wind_direction:payload.wind_direction,precipitation_rate:payload.precipitation_rate,precipitation_amount:payload.precipitation_accumulation,solar_radiation:payload.solar_radiation,uv_index:payload.uv_index,quality_status:payload.quality_control_status||'unknown'})}
};
