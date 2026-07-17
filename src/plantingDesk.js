import { cropCatalog, newId } from './data.js';

const todayKey=()=>new Date().toISOString().slice(0,10);
const packetKey=packet=>`packet-${packet.id}`;
const cropName=value=>String(value||'').trim().toLowerCase();
const unavailable=packet=>packet.deletedAt||packet.discarded||packet.available===false||Number(packet.quantity||0)<=0||Number(packet.reservedQuantity||0)>=Number(packet.quantity||0);

export function plantingActionLabel(item){
 const text=`${item.type||''} ${item.title||''} ${item.detail||''}`.toLowerCase();
 if(text.includes('hardening'))return'Complete Today’s Step';
 if(text.includes('transplant'))return'Mark as Transplanted';
 if(text.includes('pot up'))return'Mark as Potted Up';
 if(text.includes('start')||text.includes('sow'))return text.includes('direct')?'Mark as Sown':'Start Seeds';
 if(text.includes('prepare'))return'Prepare Space';
 if(item.type==='succession')return'Start Next Batch';
 if(item.type==='harvest')return'Log Harvest';
 if(item.type==='stage')return'Confirm Stage';
 return'Open Plant';
}

export function plantingItems(timeline=[]){
 return timeline.filter(item=>!item.historical&&!item.informational&&['stage','succession','harvest','planting','transplant','hardening','pot-up','space-prep','support'].includes(item.type));
}

export function recentPlantUpdates(timeline=[]){
 return timeline.filter(item=>item.type==='lifecycle'||item.historical||item.informational).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}

const recommendationMode=recommendation=>{
 const status=String(recommendation?.status||'').toLowerCase();
 if(status.includes('start seeds indoors')||status.includes('indoors'))return'Start indoors';
 if(status.includes('transplant'))return'Transplant';
 if(status.includes('outdoors')||status.includes('direct'))return'Direct sow';
 return'';
};

const packetMode=(packet,recommendation)=>{
 const notes=String(packet.notes||'').toLowerCase();
 if(notes.includes('direct sow'))return'Direct sow';
 if(notes.includes('transplant'))return'Transplant';
 if(notes.includes('start indoors')||notes.includes('indoors'))return'Start indoors';
 return recommendationMode(recommendation);
};

const suitableSpaces=(garden,mode)=>{
 const spaces=(garden.spaces||[]).filter(space=>!space.hidden&&!space.deletedAt);
 if(mode==='Start indoors')return spaces.filter(space=>['indoor','basement','seed-tray','greenhouse'].includes(space.type));
 if(mode==='Direct sow'||mode==='Transplant')return spaces.filter(space=>!['indoor','basement','hydro','seed-tray'].includes(space.type));
 return spaces;
};

export function buildGrowNowRecommendations({garden,recommendations=[]}){
 const decisions=new Map((garden.plantingDecisions||[]).filter(item=>!item.deletedAt).map(item=>[item.subjectKey,item]));
 const catalogByName=new Map(cropCatalog.map(crop=>[cropName(crop.name),crop]));
 const recommendationByName=new Map(recommendations.map(item=>[cropName(item.name),item]));
 const packets=(garden.seedPackets||[]).filter(packet=>!unavailable(packet));
 const owned=packets.map(packet=>{
  const recommendation=recommendationByName.get(cropName(packet.name));
  const mode=packetMode(packet,recommendation);
  if(!mode||decisions.get(packetKey(packet))?.decision==='not-this-season')return null;
  const spaces=suitableSpaces(garden,mode),age=new Date().getFullYear()-Number(packet.packetYear||new Date().getFullYear());
  return{
   id:packetKey(packet),subjectKey:packetKey(packet),source:'owned-packet',owned:true,packet,crop:catalogByName.get(cropName(packet.name))||recommendation,
   title:[packet.brand,packet.variety||packet.name].filter(Boolean).join(' '),cropName:packet.name,variety:packet.variety||'',brand:packet.brand||'Brand not entered',
   quantity:Math.max(0,Number(packet.quantity||0)-Number(packet.reservedQuantity||0)),mode,timing:recommendation?.timing||recommendation?.status||'Current seasonal window',
   reason:recommendation?.note||packet.notes||'This exact packet is owned and matches the current planting window.',uncertainty:packet.notes?'Packet notes are being prioritized.':'Confirm packet directions before planting.',
   spaces,spaceWarning:spaces.length?'':'No clearly suitable saved growing space is available.',germinationTest:age>=4,
   decision:decisions.get(packetKey(packet))||null,
  };
 }).filter(Boolean);
 const ownedNames=new Set(packets.map(packet=>cropName(packet.name)));
 const unowned=recommendations.filter(item=>recommendationMode(item)&&!ownedNames.has(cropName(item.name))).slice(0,3).map(item=>({
  id:`catalog-${item.id}`,subjectKey:`catalog-${item.id}`,source:'purchase',owned:false,crop:item,title:`${item.name}${item.variety?` — ${item.variety}`:''}`,cropName:item.name,variety:item.variety||'',brand:'Not owned',quantity:0,mode:recommendationMode(item),timing:item.timing||item.status,reason:item.note||'This crop fits the current seasonal window.',uncertainty:'Purchase suggestion based on general crop guidance.',spaces:suitableSpaces(garden,recommendationMode(item)),decision:decisions.get(`catalog-${item.id}`)||null,
 })).filter(item=>item.decision?.decision!=='not-this-season');
 return [...owned,...unowned].sort((a,b)=>Number(b.owned)-Number(a.owned)).slice(0,8);
}

export function createPlantingDecision({subjectKey,decision,dueDate='',note=''},actor='System'){
 const now=new Date().toISOString();
 return{id:newId('planting-decision'),subjectKey,decision,dueDate:dueDate||todayKey(),note,actor,at:now,createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};
}
