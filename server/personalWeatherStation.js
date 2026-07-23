const MAX_STATION_AGE_MS=20*60*1000;
const DEFAULT_TIMEOUT_MS=8000;

const finite=value=>{const number=Number(value);return Number.isFinite(number)?number:null};
const inRange=(value,min,max)=>value===null||value===undefined?null:value>=min&&value<=max?value:null;

export function normalizeWeatherUndergroundObservation(payload,{expectedStationId,now=Date.now()}={}){
 const raw=Array.isArray(payload?.observations)?payload.observations[0]:null;
 if(!raw)return{ok:false,reason:'no-observation'};
 const stationId=String(raw.stationID||raw.stationId||'').trim();
 if(expectedStationId&&stationId.toUpperCase()!==String(expectedStationId).toUpperCase())return{ok:false,reason:'station-mismatch'};
 const observedAt=raw.obsTimeUtc||raw.obsTimeLocal||(raw.epoch?new Date(Number(raw.epoch)*1000).toISOString():null);
 const observedMs=observedAt?new Date(observedAt).getTime():NaN;
 if(!Number.isFinite(observedMs))return{ok:false,reason:'invalid-timestamp'};
 if(now-observedMs>MAX_STATION_AGE_MS)return{ok:false,reason:'stale-observation',observedAt:new Date(observedMs).toISOString()};
 const imperial=raw.imperial||{};
 const temperature=inRange(finite(imperial.temp),-100,150);
 if(temperature===null)return{ok:false,reason:'invalid-temperature'};
 const humidity=inRange(finite(raw.humidity),0,100);
 const windSpeed=inRange(finite(imperial.windSpeed),0,250);
 const windGust=inRange(finite(imperial.windGust),0,300);
 const precipitationRate=inRange(finite(imperial.precipRate),0,20);
 const precipitationAmount=inRange(finite(imperial.precipTotal),0,50);
 const quality=String(raw.qcStatus??raw.qualityControlStatus??'').toLowerCase();
 if(/fail|invalid|reject|bad/.test(quality))return{ok:false,reason:'provider-quality-control'};
 return{ok:true,observation:{provider:'Weather Underground / The Weather Company PWS',station_id:stationId,observation_timestamp:new Date(observedMs).toISOString(),received_at:new Date(now).toISOString(),temperature,humidity,dew_point:inRange(finite(imperial.dewpt),-120,150),pressure:inRange(finite(imperial.pressure),20,35),wind_speed:windSpeed,wind_gust:windGust,wind_direction:inRange(finite(raw.winddir),0,360),precipitation_rate:precipitationRate,precipitation_accumulation:precipitationAmount,solar_radiation:inRange(finite(raw.solarRadiation),0,2000),uv_index:inRange(finite(raw.uv),0,30),quality_control_status:raw.qcStatus??raw.qualityControlStatus??'provider-observation',is_day:null,weather_condition:'Personal garden station observation'}};
}

export async function fetchPersonalWeatherStation({fetchImpl=fetch,env=process.env,signal}={}){
 const provider=String(env.PWS_PROVIDER||'').trim().toLowerCase(),stationId=String(env.PWS_STATION_ID||'').trim(),apiKey=String(env.PWS_API_KEY||'').trim();
 if(!provider||!stationId||!apiKey)return{ok:false,configured:false,provider:provider||null,stationId:stationId||null,reason:'missing-configuration'};
 if(provider!=='weather-underground')return{ok:false,configured:true,provider,stationId,reason:'unsupported-provider'};
 const ownController=new AbortController(),timer=setTimeout(()=>ownController.abort(),Number(env.PWS_TIMEOUT_MS)||DEFAULT_TIMEOUT_MS);
 const abort=()=>ownController.abort();signal?.addEventListener?.('abort',abort,{once:true});
 try{
  const query=new URLSearchParams({stationId,format:'json',units:'e',numericPrecision:'decimal',apiKey});
  const response=await fetchImpl(`https://api.weather.com/v2/pws/observations/current?${query}`,{signal:ownController.signal,headers:{accept:'application/json'}});
  if(!response.ok)return{ok:false,configured:true,provider,stationId,reason:`provider-http-${response.status}`};
  const normalized=normalizeWeatherUndergroundObservation(await response.json(),{expectedStationId:stationId});
  return{...normalized,configured:true,provider,stationId};
 }catch(error){
  return{ok:false,configured:true,provider,stationId,reason:error?.name==='AbortError'?'timeout':'provider-request-failed'};
 }finally{
  clearTimeout(timer);
  signal?.removeEventListener?.('abort',abort);
 }
}
