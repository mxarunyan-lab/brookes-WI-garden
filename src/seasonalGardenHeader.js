export const GARDEN_TIME_ZONE='America/Chicago';

export const SEASONAL_HEADER_IMAGES={
 spring:'/images/garden-headers/spring.webp',
 summer:'/images/garden-headers/summer.webp',
 fall:'/images/garden-headers/fall.webp',
 winter:'/images/garden-headers/winter.webp',
};

export function getGreenBaySeason(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:GARDEN_TIME_ZONE,month:'numeric',day:'numeric',year:'numeric'}).formatToParts(date);
 const month=Number(parts.find(part=>part.type==='month')?.value);
 if(month>=3&&month<=5)return'spring';
 if(month>=6&&month<=8)return'summer';
 if(month>=9&&month<=11)return'fall';
 return'winter';
}

export function resolveGardenHeaderSeason(preference='automatic',date=new Date()){
 return Object.hasOwn(SEASONAL_HEADER_IMAGES,preference)?preference:getGreenBaySeason(date);
}

export function possessiveGardenTitle(name){
 const clean=String(name||'').trim();
 if(!clean)return'My Garden';
 return clean.toLowerCase().endsWith('s')?`${clean}’ Garden`:`${clean}’s Garden`;
}

export function cleanGardenLocation(location){
 return String(location||'').trim().replace(/\s+54302$/,'').replace(/,\s*Wisconsin$/i,'').trim();
}

export function buildGardenSubtitle(gardenName,location){
 return[String(gardenName||'').trim(),cleanGardenLocation(location)].filter(Boolean).join(' — ');
}
