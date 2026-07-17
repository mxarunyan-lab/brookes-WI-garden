import React from'react';
import{BookOpen,CalendarDays,ChevronRight,ClipboardList,PackageSearch,Sprout,Warehouse}from'lucide-react';
import{cropCatalog}from'./data.js';

function Department({icon:Icon,title,subtitle,status,onClick,tone='green'}){return <button type="button" className={`garden-center-department tool-style-department tone-${tone}`} onClick={onClick} aria-label={`${title}. ${subtitle}`}><span className="department-icon"><Icon/></span><span className="department-copy"><strong>{title}</strong><small>{subtitle}</small><em>{status}</em></span><ChevronRight className="department-arrow"/></button>}
const SLOGANS=['Questionable expertise since opening day.','Extremely organized seeds. Moderately organized gardeners.','Open daily, weather and motivation permitting.','Two directors. No idea where the trowel went.'];

export default function GardenCenter({garden,navigate}){
 const trays=(garden.trays||[]).length,lights=(garden.growLights||[]).length,packets=(garden.seedPackets||[]).filter(item=>!item.deletedAt).length,seeds=(garden.seeds||[]).filter(item=>!item.deletedAt).length,harvests=(garden.harvests||[]).length,problems=(garden.problems||[]).filter(item=>item.status!=='resolved').length,openTasks=(garden.reminders||[]).filter(item=>!item.deletedAt&&item.enabled!==false).length,planned=(garden.yearPlan?.crops||[]).filter(item=>item.status==='definitely'||item.status==='maybe'),missing=planned.filter(item=>!(garden.seeds||[]).some(seed=>!seed.deletedAt&&seed.cropId===item.cropId)&&!(garden.seedPackets||[]).some(packet=>!packet.deletedAt&&packet.cropId===item.cropId)),slogan=SLOGANS[Math.floor(Date.now()/86400000)%SLOGANS.length];
 const openNext=section=>{sessionStorage.setItem('planting-desk-destination',`next:${section}`);navigate('plan-plant')};
 return <main className="screen garden-center-screen">
  <section className="dark-header garden-header garden-center-header"><Sprout/><span>ARCHIE & BROOKE’S GARDEN STORE</span><h1>Runyan Garden Center</h1><p>Planning, seeds, care, records, and the next useful garden move.<br/>{slogan}</p></section>
  <section className="garden-center-content screen-pad">
   <div className="department-heading"><span>PICK A DEPARTMENT</span><small>Choose what you need to plan, care for, review, or prepare.</small></div>
   <div className="garden-center-grid">
    <Department icon={ClipboardList} title="Care Desk" subtitle="Review and complete Garden Chore Board tasks" status={openTasks?`${openTasks} saved reminder${openTasks===1?'':'s'}`:'Open the full chore board'} onClick={()=>navigate('chores')} tone="gold"/>
    <Department icon={PackageSearch} title="Seed Department" subtitle="Review exact packets, varieties, quantities, photos, and notes" status={`${packets} exact packet${packets===1?'':'s'} · ${seeds} saved seed record${seeds===1?'':'s'}`} onClick={()=>navigate('seed-tools')} tone="green"/>
    <Department icon={Sprout} title="Planting Department" subtitle="Open Today, This Week, Plan Ahead, and Grow Now" status="Seasonal planting guidance" onClick={()=>navigate('plan-plant')} tone="rust"/>
    <Department icon={Warehouse} title="Indoor Growing" subtitle="Manage seedling trays, grow lights, greenhouse work, and basement growing" status={`${trays} tray${trays===1?'':'s'} · ${lights} light setup${lights===1?'':'s'}`} onClick={()=>navigate('indoor')} tone="blue"/>
    <Department icon={BookOpen} title="Records Counter" subtitle="Review harvests, problems, observations, photos, and garden history" status={`${harvests} harvest${harvests===1?'':'s'} · ${problems} active issue${problems===1?'':'s'}`} onClick={()=>navigate('memory')} tone="cream"/>
    <Department icon={CalendarDays} title="Next Season" subtitle="Plan crops, seed purchases, spaces, supplies, and improvements" status={missing.length?`${missing.length} planned crop${missing.length===1?'':'s'} may need seed`:`${planned.length} crop${planned.length===1?'':'s'} in the draft`} onClick={()=>openNext('supplies')} tone="gold"/>
   </div>
   {planned.length>0&&<button type="button" className="next-season-strip" onClick={()=>openNext('crops')}><CalendarDays/><span><strong>{planned.length} crop{planned.length===1?'':'s'} in next season’s draft</strong><small>{missing.length?`Seed may be needed for ${missing.map(item=>cropCatalog.find(crop=>crop.id===item.cropId)?.name).filter(Boolean).slice(0,3).join(', ')}`:'Saved seed currently covers the crop draft.'}</small></span><ChevronRight/></button>}
  </section>
 </main>;
}
