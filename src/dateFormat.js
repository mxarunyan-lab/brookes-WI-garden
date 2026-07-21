const DEFAULT_TIME_ZONE='America/Chicago';

export function parseDisplayDate(value){
 if(!value)return null;
 if(value instanceof Date)return Number.isNaN(value.getTime())?null:value;
 const text=String(value).trim();
 const match=text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
 if(match&&!text.includes('T')){
  const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0);
  return Number.isNaN(date.getTime())?null:date;
 }
 const date=new Date(text);
 return Number.isNaN(date.getTime())?null:date;
}

export function formatGardenDate(value,{fallback='Date unavailable',timeZone=DEFAULT_TIME_ZONE}={}){
 const date=parseDisplayDate(value);
 if(!date)return fallback;
 try{const parts=new Intl.DateTimeFormat('en-US',{timeZone,month:'numeric',day:'numeric',year:'2-digit'}).formatToParts(date).reduce((out,part)=>(out[part.type]=part.value,out),{});return`${parts.month}/${parts.day}/${parts.year}`}catch{return fallback}
}

export function formatGardenTime(value,{fallback='Time unavailable',timeZone=DEFAULT_TIME_ZONE}={}){
 const date=parseDisplayDate(value);
 if(!date)return fallback;
 try{return new Intl.DateTimeFormat('en-US',{timeZone,hour:'numeric',minute:'2-digit'}).format(date)}catch{return fallback}
}

export function formatGardenDateTime(value,{fallback='Not recorded',timeZone=DEFAULT_TIME_ZONE,prefix=''}={}){
 const date=parseDisplayDate(value);
 if(!date)return fallback;
 return`${prefix}${formatGardenDate(date,{fallback,timeZone})} at ${formatGardenTime(date,{fallback,timeZone})}`;
}

export function formatGardenDateRange(start,end,options={}){
 const first=formatGardenDate(start,options),last=formatGardenDate(end,options);
 if(first===options.fallback||last===options.fallback)return first;
 return first===last?first:`${first} - ${last}`;
}

export function localDateInputValue(value=new Date()){
 const date=parseDisplayDate(value)||new Date();
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:DEFAULT_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).reduce((out,part)=>(out[part.type]=part.value,out),{});
 return`${parts.year}-${parts.month}-${parts.day}`;
}

export function localDateTimeInputValue(value=new Date()){
 const date=parseDisplayDate(value)||new Date();
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:DEFAULT_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(date).reduce((out,part)=>(out[part.type]=part.value,out),{});
 return`${parts.year}-${parts.month}-${parts.day}T${parts.hour==='24'?'00':parts.hour}:${parts.minute}`;
}
