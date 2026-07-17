export function classifyPersistenceError(error){
 const name=String(error?.name||''),message=String(error?.message||'');
 if(name==='QuotaExceededError'||/quota|storage.*full|exceeded/i.test(message))return{kind:'storage',message:'This device does not have enough browser storage for that packet yet. The draft and photos are still here. Remove an unneeded large photo or older browser data, then retry.'};
 if(/serialize|circular|json/i.test(message))return{kind:'serialization',message:'The packet contains information the app could not prepare for storage. Your draft is still available so you can edit and retry.'};
 return{kind:'storage',message:'The garden could not be saved on this device. Your work is still on screen. Retry, or keep editing before trying again.'};
}

export function persistJson(key,value,{logger=console}={}){
 try{
  const serialized=JSON.stringify(value);
  localStorage.setItem(key,serialized);
  return{ok:true,bytes:new Blob([serialized]).size};
 }catch(error){
  const classified=classifyPersistenceError(error);
  logger?.error?.('[Runyan Garden] persistence failure',{key,kind:classified.kind,error});
  return{ok:false,error,kind:classified.kind,message:classified.message};
 }
}

export function estimateJsonBytes(value){
 try{return new Blob([JSON.stringify(value)]).size}catch{return Infinity}
}
