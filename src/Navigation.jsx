import React from'react';
import{CalendarDays,Home,Store,Sprout,Sun,X}from'lucide-react';
import{CheeseIcon}from'./art.jsx';

function CowIcon({size=24}){return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><path d="M8 10 4 6v7M24 10l4-4v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 13c0-5 4-8 9-8s9 3 9 8v7c0 5-4 8-9 8s-9-3-9-8Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M10 11c2 0 3 1 4 3M22 11c-2 0-3 1-4 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/><circle cx="20" cy="17" r="1.3" fill="currentColor"/><path d="M11 22c2 2 8 2 10 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}

export default function BottomNav({page,navigate}){
 const items=[{id:'today',label:'Today',icon:Sun},{id:'garden',label:'Garden',icon:Sprout},{id:'plan-plant',label:'Plan & Plant',icon:CalendarDays},{id:'center',label:'Garden Center',icon:Store},{id:'profile',label:'Runyan',icon:CowIcon}];
 return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({id,label,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>navigate(id)}><Icon size={23}/><span>{label}</span></button>)}</nav>;
}

export function RunyanMenu({close,navigate}){return <div className="overlay" onMouseDown={close}><aside className="drawer" onMouseDown={event=>event.stopPropagation()}><button className="drawer-close" onClick={close}><X/></button><CheeseIcon className="drawer-cheese"/><span className="section-kicker">THE RUNYAN GARDEN</span><h2>Established 2024. Questionable expertise since opening day.</h2><button onClick={()=>navigate('today')}><Home/> Today</button><button onClick={()=>navigate('garden')}><Sprout/> Our garden</button><button onClick={()=>navigate('plan-plant')}><CalendarDays/> Plan & Plant</button><button onClick={()=>navigate('center')}><Store/> Runyan Garden Center</button><button onClick={()=>navigate('profile')}><CowIcon/> Runyan profiles & settings</button></aside></div>;}