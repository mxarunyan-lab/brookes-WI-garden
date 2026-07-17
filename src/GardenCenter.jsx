import React from'react';
import{BookOpen,CalendarDays,ChevronRight,ClipboardList,PackageSearch,ShoppingBasket,Sprout,Warehouse}from'lucide-react';
import{activeShoppingCount}from'./gardenShopping.js';
import{SecondaryHero}from'./SecondaryUI.jsx';
import{buildTaskBoard}from'./taskBoard.js';

function DepartmentTile({icon:Icon,title,status,onClick,tone='cream',featured=false}){return <button type="button" className={`garden-center-tile tone-${tone}${featured?' is-featured':''}`} onClick={onClick} aria-label={`${title}. ${status}`}><span className="garden-center-tile-icon" aria-hidden="true"><Icon/></span><span className="garden-center-tile-copy"><strong>{title}</strong><small>{status}</small></span><ChevronRight aria-hidden="true"/></button>}

export default function GardenCenter({garden,navigate,tasks=[],dailyDone=[]}){
 const board=buildTaskBoard({tasks,completions:dailyDone}),due=board.counts.dueToday||0,packets=(garden.seedPackets||[]).filter(item=>!item.deletedAt).length,trays=(garden.trays||[]).filter(item=>!item.deletedAt).length,problems=(garden.problems||[]).filter(item=>item.status!=='resolved'&&!item.deletedAt).length,planned=(garden.yearPlan?.crops||[]).filter(item=>item.status==='definitely'||item.status==='maybe').length,shopping=activeShoppingCount(garden);
 const openNext=()=>{sessionStorage.setItem('planting-desk-destination','next:supplies');navigate('plan-plant')};
 return <main className="screen secondary-screen garden-center-screen"><SecondaryHero icon={Sprout} eyebrow="ARCHIE & BROOKE’S GARDEN STORE" title="Runyan Garden Center" description="Planning, seeds, care, records, and the next useful garden move." className="garden-center-hero"/><section className="screen-pad secondary-screen-content garden-center-content"><div className="garden-center-compact-grid">
  <DepartmentTile icon={ClipboardList} title="Care Desk" status={`${due} due today`} tone="gold" onClick={()=>navigate('chores')}/>
  <DepartmentTile icon={Sprout} title="Planting Department" status="Grow Now available" tone="rust" onClick={()=>navigate('plan-plant')}/>
  <DepartmentTile icon={ShoppingBasket} title="Garden Shopping List" status={`${shopping} item${shopping===1?'':'s'} needed`} tone="gold" onClick={()=>navigate('shopping-list')}/>
  <DepartmentTile icon={PackageSearch} title="Seed Department" status={`${packets} packet${packets===1?'':'s'}`} tone="green" onClick={()=>navigate('seed-tools')}/>
  <DepartmentTile icon={Warehouse} title="Indoor Growing" status={`${trays} active tray${trays===1?'':'s'}`} tone="blue" onClick={()=>navigate('indoor')}/>
  <DepartmentTile icon={BookOpen} title="Records Counter" status={`${problems} active issue${problems===1?'':'s'}`} tone="cream" onClick={()=>navigate('memory')}/>
  <DepartmentTile icon={CalendarDays} title="Next Season" status={`${planned} draft crop${planned===1?'':'s'}`} tone="green" featured onClick={openNext}/>
 </div></section></main>;
}
