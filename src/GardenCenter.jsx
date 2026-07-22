import React from'react';
import{ChevronRight,ClipboardList,Map,PackageSearch,Sprout,Warehouse}from'lucide-react';
import{buildGardenIntelligenceEngine}from'./gardenIntelligenceEngine.js';
import{SecondaryHero}from'./SecondaryUI.jsx';

function DepartmentTile({icon:Icon,title,status,onClick}){return <button type="button" className="garden-center-tile navigation-directory-card" onClick={onClick} aria-label={`${title}. ${status}`}><span className="garden-center-tile-icon" aria-hidden="true"><Icon/></span><span className="garden-center-tile-copy"><strong>{title}</strong><small>{status}</small></span><ChevronRight className="garden-center-tile-arrow" aria-hidden="true"/></button>}

export default function GardenCenter({garden,navigate}){
 const packets=(garden.seedPackets||[]).filter(item=>!item.deletedAt).length,packetEngine=buildGardenIntelligenceEngine({garden}),readyPackets=packetEngine.queues.today.length,soonPackets=packetEngine.queues.week.length,trays=(garden.trays||[]).filter(item=>!item.deletedAt).length,spaces=(garden.spaces||[]).filter(item=>!item.hidden&&!item.deletedAt).length;
 return <main className="screen secondary-screen garden-center-screen"><SecondaryHero icon={Sprout} eyebrow="GARDEN CENTER" title="Garden Center" className="garden-center-hero"/><section className="screen-pad secondary-screen-content garden-center-content"><div className="garden-center-compact-grid" aria-label="Garden Center destinations">
  <DepartmentTile icon={PackageSearch} title="Seed Department" status={`${packets} saved packet${packets===1?'':'s'}`} onClick={()=>navigate('seed-tools')}/>
  <DepartmentTile icon={Sprout} title="Planting Desk" status={readyPackets?`${readyPackets} saved packet${readyPackets===1?'':'s'} ready now`:soonPackets?`${soonPackets} saved packet${soonPackets===1?'':'s'} coming up`:'Open planting recommendations'} onClick={()=>navigate('plan-plant')}/>
  <DepartmentTile icon={Map} title="Growing Spaces" status={`${spaces} active space${spaces===1?'':'s'}`} onClick={()=>navigate('garden')}/>
  <DepartmentTile icon={Warehouse} title="Indoor Growing" status={`${trays} active tray${trays===1?'':'s'}`} onClick={()=>navigate('indoor')}/>
  <DepartmentTile icon={ClipboardList} title="Garden Chore Board" status="Open the full task board" onClick={()=>navigate('chores')}/>
 </div></section></main>;
}
