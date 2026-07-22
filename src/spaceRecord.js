export const SOIL_SPACE_TYPES=new Set(['bed','black-square-bed','white-oval-bed','oval-bed','in-ground','container','potato-grow-bag','greenhouse']);
export const CONTAINER_FIELDS=['size','material','drainageHoles','selfWateringReservoir'];
export const POTATO_GROW_BAG_FIELDS=['bagSize','seedPotatoesPlanted','hillingStage','lastHilledDate'];
export const SOIL_FIELDS=['soilType','drainageQuality','mulchStatus','irrigationMethod','sunExposure'];
const clear=(record,fields)=>fields.reduce((next,field)=>({...next,[field]:typeof record[field]==='boolean'?false:''}),record);
export function cleanGrowingSpaceForType(input={}){
 let record={...input};
 if(!SOIL_SPACE_TYPES.has(record.type))record=clear(record,SOIL_FIELDS);
 if(record.type!=='container')record=clear(record,CONTAINER_FIELDS);
 if(record.type!=='potato-grow-bag')record=clear(record,POTATO_GROW_BAG_FIELDS);
 record.capacity=Math.max(1,Math.min(200,Number(record.capacity)||1));
 if(record.type==='potato-grow-bag'&&record.seedPotatoesPlanted!=='')record.seedPotatoesPlanted=Math.max(0,Number(record.seedPotatoesPlanted)||0);
 return record;
}
