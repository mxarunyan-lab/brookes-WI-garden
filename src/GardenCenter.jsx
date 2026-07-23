import React from'react';
import{CalendarRange,ChevronRight,ClipboardList,PackageSearch,ShoppingBasket,Sprout,Warehouse}from'lucide-react';
import{buildGardenIntelligenceEngine}from'./gardenIntelligenceEngine.js';
import{gardenShoppingItems}from'./gardenShopping.js';
import{SecondaryHero}from'./SecondaryUI.jsx';

function DestinationRow({icon:Icon,title,description,status,onClick}){return <button type="button" className="garden-center-tile navigation-directory-card plan-care-row" onClick={onClick} aria-label={`${title}. ${description}${status?` ${status}`:''}`}><span className="garden-center-tile-icon" aria-hidden="true"><Icon/></span><span className="garden-center-tile-copy"><strong>{title}</strong><small>{description}</small>{status&&<em>{status}</em>}</span><ChevronRight className="garden-center-tile-arrow" aria-hidden="true"/></button>}

export default function GardenCenter({garden,navigate,tasks=[]}){
 const packets=(garden.seedPackets||[]).filter(item=>!item.deletedAt).length,packetEngine=buildGardenIntelligenceEngine({garden}),readyPackets=packetEngine.queues.today.length,trays=(garden.trays||[]).filter(item=>!item.deletedAt).length,shopping=gardenShoppingItems(garden).filter(item=>!item.purchased&&!item.deletedAt).length,activeTrip=(garden.vacationPlans||[]).find(item=>!item.deletedAt&&item.status!=='completed'),attention=(tasks||[]).filter(task=>task.urgent||task.priority==='urgent').length;
 return <main className="screen secondary-screen garden-center-screen"><SecondaryHero icon={ClipboardList} eyebrow="GARDEN COMPASS" title="Plan & Care" description="Plan what to grow, manage garden work, and prepare for what comes next." className="garden-center-hero"/><section className="screen-pad secondary-screen-content garden-center-content"><div className="garden-center-compact-grid plan-care-list" aria-label="Plan and Care destinations">
  <DestinationRow icon={Sprout} title="Planting Planner" description="See what can be planted now, plan future plantings, and review what is coming up." status={readyPackets?`${readyPackets} packet${readyPackets===1?'':'s'} ready now`:'Review planting options'} onClick={()=>navigate('plan-plant')}/>
  <DestinationRow icon={ClipboardList} title="Garden Tasks" description="Review work that needs attention, what is coming up, and what was completed today." status={attention?`${attention} item${attention===1?'':'s'} need attention`:'Garden work is caught up'} onClick={()=>navigate('chores')}/>
  <DestinationRow icon={PackageSearch} title="My Seeds" description="Photograph seed packets, review saved seeds, and plan what to start." status={`${packets} saved packet${packets===1?'':'s'}`} onClick={()=>navigate('seed-tools')}/>
  <DestinationRow icon={Warehouse} title="Indoor Growing" description="Manage seedling trays, grow lights, hydroponic pods, and greenhouse areas." status={`${trays} active tray${trays===1?'':'s'}`} onClick={()=>navigate('indoor')}/>
  <DestinationRow icon={ShoppingBasket} title="Garden Shopping List" description="Track seeds, plants, soil, and supplies still needed for the garden." status={`${shopping} item${shopping===1?'':'s'} still needed`} onClick={()=>navigate('shopping-list')}/>
  <DestinationRow icon={CalendarRange} title="Vacation Mode" description="Prepare the garden and create a care guide for a Garden Buddy." status={activeTrip?'Trip plan active':'No active trip'} onClick={()=>navigate('vacation')}/>
 </div></section></main>;
}
