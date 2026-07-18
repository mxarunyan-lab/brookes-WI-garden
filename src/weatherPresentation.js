const numeric=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
const asDate=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?null:date};
const unique=values=>[...new Set(values.filter(Boolean))];
const overlap=(a=[],b=[])=>a.some(value=>b.includes(value));
const cleanSentence=value=>String(value||'').replace(/\s+/g,' ').trim().replace(/\s*\.\s*$/,'');

export function hasUsableWeather(weather){return Boolean(numeric(weather?.temperature)!==null||numeric(weather?.high)!==null||numeric(weather?.low)!==null||(weather?.condition&&!/unavailable/i.test(String(weather.condition))))}
export function roundWeatherValue(value,{digits=0,suffix=''}={}){const number=numeric(value);if(number===null)return'';return`${Number(number.toFixed(digits))}${suffix}`}
export function formatRainAmount(value){const number=numeric(value);if(number===null)return'';return`${Number(number.toFixed(number<1?2:1))} in`}

function groupKey(row,rows){
 if(row.actionKey==='ventilate-greenhouse'||/greenhouse/i.test(`${row.title} ${row.recommendedAction}`))return'greenhouse';
 if(row.category==='watering')return'watering';
 if(row.category==='frost')return'frost-cold';
 if(row.category==='storm'||row.category==='heavy-rain')return'storms-wind';
 if(row.category==='wind'){
  const heat=rows.find(candidate=>candidate.category==='heat'&&(overlap(candidate.affectedPlants,row.affectedPlants)||overlap(candidate.affectedGrowingSpaces,row.affectedGrowingSpaces)));
  return heat?'heat-drying':'storms-wind';
 }
 if(row.category==='heat')return'heat-drying';
 if(row.category==='disease-risk')return'damp-disease';
 if(row.category==='calm')return'calm';
 if(row.category==='unavailable')return'unavailable';
 return row.category||'other';
}

const TITLES={watering:'Watering','heat-drying':'Heat and drying','frost-cold':'Frost and cold','storms-wind':'Storms and wind',greenhouse:'Greenhouse','damp-disease':'Damp-weather risk',calm:'Conditions look steady',unavailable:'Weather temporarily unavailable',other:'Garden weather'};

export function groupWeatherImpacts(recommendations=[],limit=3){
 const rows=(recommendations||[]).filter(row=>row&&row.actionKey!=='no-frost-action'),groups=new Map();
 for(const row of rows){const key=groupKey(row,rows),current=groups.get(key)||{key,title:TITLES[key]||TITLES.other,priority:0,confidence:'Low',rows:[],affectedPlants:[],affectedSpaces:[],destinations:[]};current.rows.push(row);current.priority=Math.max(current.priority,Number(row.priority)||0);current.affectedPlants=unique([...current.affectedPlants,...(row.affectedPlants||[])]);current.affectedSpaces=unique([...current.affectedSpaces,...(row.affectedGrowingSpaces||[])]);current.destinations=unique([...current.destinations,row.destination]);if(row.confidence==='High'||current.confidence==='Low'&&row.confidence==='Medium')current.confidence=row.confidence||current.confidence;groups.set(key,current)}
 return[...groups.values()].map(group=>{
  const ordered=[...group.rows].sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0)),actions=unique(ordered.map(row=>cleanSentence(row.recommendedAction||row.plainLanguageExplanation))).slice(0,3),explanations=unique(ordered.map(row=>cleanSentence(row.plainLanguageExplanation))).slice(0,2),sources=unique(ordered.map(row=>row.source)),freshness=unique(ordered.map(row=>row.dataFreshness));
  return{...group,summary:actions.length?`${actions.join('. ')}.`:explanations.length?`${explanations.join('. ')}.`:'No additional action is needed.',explanation:explanations.length?`${explanations.join('. ')}.`:'',source:sources.join(' · '),freshness:freshness.join(' · '),destination:group.destinations[0]||'chores',primary:ordered[0]};
 }).sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title)).slice(0,limit);
}

export function normalizeForecastDays(forecasts=[],limit=4){
 const days=new Map();
 for(const row of forecasts||[]){const date=asDate(row.forecast_for);if(!date)continue;const key=date.toISOString().slice(0,10),current=days.get(key)||{date:key,rows:[],high:null,low:null,rainProbability:null,rainAmount:0,source:''},high=numeric(row.maximum_temperature??row.high),low=numeric(row.minimum_temperature??row.low),temperature=numeric(row.temperature),hour=date.getHours();current.rows.push(row);if(high!==null)current.high=current.high===null?high:Math.max(current.high,high);if(low!==null)current.low=current.low===null?low:Math.min(current.low,low);if(high===null&&low===null&&temperature!==null){if(hour>=6&&hour<18)current.high=current.high===null?temperature:Math.max(current.high,temperature);else current.low=current.low===null?temperature:Math.min(current.low,temperature)}const chance=numeric(row.precipitation_probability);if(chance!==null)current.rainProbability=current.rainProbability===null?chance:Math.max(current.rainProbability,chance);current.rainAmount+=numeric(row.precipitation_amount)||0;current.source=current.source||row.source_name||row.source_provider||'';days.set(key,current)}
 return[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,limit).map(day=>({...day,high:day.high===null?null:Math.round(day.high),low:day.low===null?null:Math.round(day.low),rainProbability:day.rainProbability===null?null:Math.round(day.rainProbability),rainAmount:Number(day.rainAmount.toFixed(2)),temperatureLabel:day.high!==null&&day.low!==null?`High ${Math.round(day.high)}° · Low ${Math.round(day.low)}°`:day.high!==null?`High ${Math.round(day.high)}° available`:day.low!==null?`Low ${Math.round(day.low)}° available`:'Temperature details unavailable'}));
}

export function bestWeatherTimestamp({weather,savedAt}={}){
 const current=weather?.currentObservation,forecast=(weather?.forecasts||[]).find(row=>row.received_at||row.updated_at);
 if(current?.observed_at)return{label:'Last observation',value:current.observed_at};
 if(weather?.observedAt)return{label:'Last observation',value:weather.observedAt};
 if(forecast?.received_at||forecast?.updated_at)return{label:'Forecast updated',value:forecast.received_at||forecast.updated_at};
 if(savedAt||weather?.fetchedAt)return{label:'App refreshed',value:savedAt||weather.fetchedAt};
 return{label:'Update time',value:null};
}
