export const GREEN_BAY_TIME_ZONE='America/Chicago';

export const SEASONAL_GARDEN_HEADERS={
 spring:'/images/garden-headers/garden-header-spring.webp?v=0479',
 summer:'/images/garden-headers/garden-header-summer.webp?v=0479',
 fall:'/images/garden-headers/garden-header-fall.webp?v=0479',
 winter:'/images/garden-headers/garden-header-winter.webp?v=0479'
};

export function getGreenBayMonth(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:GREEN_BAY_TIME_ZONE,month:'numeric'}).formatToParts(date);
 const month=Number(parts.find(part=>part.type==='month')?.value);
 return Number.isFinite(month)&&month>=1&&month<=12?month:1;
}

export function getGreenBaySeason(date=new Date()){
 const month=getGreenBayMonth(date);
 if(month>=3&&month<=5)return'spring';
 if(month>=6&&month<=8)return'summer';
 if(month>=9&&month<=11)return'fall';
 return'winter';
}

export function getSeasonalGardenHeader(date=new Date()){
 const season=getGreenBaySeason(date);
 return{season,src:SEASONAL_GARDEN_HEADERS[season]};
}
