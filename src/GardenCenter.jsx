import React from'react';
import{BookOpen,CalendarDays,CalendarRange,ChevronRight,ClipboardList,Map,PackageSearch,ShoppingBasket,Sprout,Warehouse}from'lucide-react';
import{activeShoppingCount}from'./gardenShopping.js';
import{buildGardenIntelligenceEngine}from'./gardenIntelligenceEngine.js';
import{SecondaryHero}from'./SecondaryUI.jsx';

function DepartmentTile({icon:Icon,title,status,onClick,tone='cream',featured=false}){return <button type="button" className={`garden-center-tile tone-${tone}${featured?' is-featured':''}`} onClick={onClick} aria-label={`${title}. ${status}`}><span className="garden-center-tile-icon" aria-hidden="true"><Icon/></span><span className="garden-center-tile-copy"><strong>{title}</strong><small>{status}</small></span><ChevronRight aria-hidden="true"/></button>}

export default function GardenCenter({garden,navigate,tasks=[],dailyDone=[]}){
 const packetRows=(garden.seedPackets||[]).filter(item=>!item.deletedAt),packets=packetRows.length,packetEngine=buildGardenIntelligenceEngine({garden}),readyPackets=packetEngine.queues.today.length,soonPackets=packetEngine.queues.week.length,trays=(garden.trays||[]).filter(item=>!item.deletedAt).length,problems=(garden.problems||[]).filter(item=>item.status!=='resolved'&&!item.deletedAt).length,planned=(garden.yearPlan?.crops||[]).filter(item=>item.status==='definitely'||item.status==='maybe').length,shopping=activeShoppingCount(garden),trip=(garden.vacationPlans||[]).find(plan=>!plan.deletedAt&&plan.status==='active'),spaces=(garden.spaces||[]).filter(item=>!item.hidden&&!item.deletedAt).length;
 const openNext=()=>{sessionStorage.setItem('planting-desk-destination','next:supplies');navigate('plan-plant')};
 return <main className="screen secondary-screen garden-center-screen"><SecondaryHero icon={Sprout} eyebrow="GARDEN CENTER" title="Manage and plan the garden" description="Departments for seeds, planting plans, shopping, indoor growing, vacation care, and records." className="garden-center-hero"/><section className="screen-pad secondary-screen-content garden-center-content"><div className="garden-center-compact-grid">
  <DepartmentTile icon={Sprout} title="Planting Desk" status={readyPackets?`${readyPackets} saved packet${readyPackets===1?'':'s'} ready now`:soonPackets?`${soonPackets} saved packet${soonPackets===1?'':'s'} coming up`:'Open seed and planting recommendations'} tone="rust" featured onClick={()=>navigate('plan-plant')}/>
  <DepartmentTile icon={PackageSearch} title="Seed Department" status={`${packets} saved packet${packets===1?'':'s'}`} tone="green" featured onClick={()=>navigate('seed-tools')}/>
  <DepartmentTile icon={Map} title="Growing Spaces" status={`${spaces} active space${spaces===1?'':'s'}`} tone="cream" onClick={()=>navigate('garden')}/>
  <DepartmentTile icon={ClipboardList} title="Garden Chore Board" status="Open the full task board" tone="gold" onClick={()=>navigate('chores')}/>
  <DepartmentTile icon={ShoppingBasket} title="Shopping List" status={`${shopping} item${shopping===1?'':'s'} needed`} tone="gold" onClick={()=>navigate('shopping-list')}/>
  <DepartmentTile icon={Warehouse} title="Indoor Growing" status={`${trays} active tray${trays===1?'':'s'}`} tone="blue" onClick={()=>navigate('indoor')}/>
  <DepartmentTile icon={CalendarRange} title="Vacation Mode" status={trip?`${trip.duration} day trip plan active`:'Build a garden-specific trip plan'} tone="blue" onClick={()=>navigate('vacation')}/>
  <DepartmentTile icon={BookOpen} title="Garden History" status={`${problems} active issue${problems===1?'':'s'}`} tone="cream" onClick={()=>navigate('memory')}/>
  <DepartmentTile icon={CalendarDays} title="Next Season" status={`${planned} draft crop${planned===1?'':'s'}`} tone="green" onClick={openNext}/>
 </div></section></main>;
}
