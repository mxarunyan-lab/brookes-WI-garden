export const WEATHER_LABELS={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Cloudy',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',56:'Freezing Drizzle',57:'Heavy Freezing Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',66:'Freezing Rain',67:'Heavy Freezing Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Rain Showers',81:'Rain Showers',82:'Heavy Rain Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorms',96:'Thunderstorms with Hail',99:'Severe Thunderstorms with Hail'};

export function weatherCodeFromCondition(condition=''){
 const value=String(condition||'').trim().toLowerCase();
 if(/thunder|lightning|tornado/.test(value))return 95;
 if(/freezing rain|freezing drizzle|sleet|ice pellet/.test(value))return 66;
 if(/snow|flurr/.test(value))return 71;
 if(/drizzle/.test(value))return 51;
 if(/rain|shower/.test(value))return 61;
 if(/fog|smoke|mist|haze/.test(value))return 45;
 if(/overcast|cloudy/.test(value))return /partly|mostly clear|few cloud/.test(value)?2:3;
 if(/mostly clear|few cloud/.test(value))return 1;
 if(/partly cloudy/.test(value))return 2;
 if(/clear|sunny|fair/.test(value))return 0;
 return null;
}

export function weatherConditionFamily({weatherCode,condition='',precipitationRate=0}={}){
 const explicit=weatherCodeFromCondition(condition),numeric=Number(weatherCode),code=Number.isFinite(numeric)?numeric:explicit;
 const precip=Number(precipitationRate);
 if([95,96,99].includes(code)||/thunder|lightning/.test(String(condition).toLowerCase()))return'storm';
 if([71,73,75,77,85,86].includes(code))return'snow';
 if([66,67,56,57].includes(code))return'freezing';
 if((Number.isFinite(precip)&&precip>0)||[51,53,55].includes(code))return'drizzle';
 if([61,63,65,80,81,82].includes(code))return'rain';
 if([45,48].includes(code))return'fog';
 if(code===3)return'cloudy';
 if(code===2)return'partly-cloudy';
 if(code===1)return'mostly-clear';
 if(code===0)return'clear';
 return'unknown';
}

export function weatherConditionPresentation({weatherCode,condition='',precipitationRate=0,isDay=true}={}){
 const family=weatherConditionFamily({weatherCode,condition,precipitationRate});
 const day=isDay!==false;
 const iconName=family==='clear'?(day?'Sun':'Moon'):family==='mostly-clear'?(day?'CloudSun':'CloudMoon'):family==='partly-cloudy'?(day?'CloudSun':'CloudMoon'):family==='cloudy'?'Cloud':family==='fog'?'CloudFog':family==='drizzle'?'CloudDrizzle':family==='rain'?'CloudRain':family==='storm'?'CloudLightning':family==='snow'?'Snowflake':family==='freezing'?'CloudSnow':'Thermometer';
 const numeric=Number(weatherCode),label=String(condition||'').trim()||(Number.isFinite(numeric)?WEATHER_LABELS[numeric]:'')||'Conditions unavailable';
 return{family,label,iconName,accessibilityLabel:`${label}${day?' during the day':' at night'}`,isDay:day};
}
