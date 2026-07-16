import React from 'react';
import { CalendarDays, Home, Leaf, Sprout, Sun, UserRound, X } from 'lucide-react';
import { CheeseIcon } from './art.jsx';

export default function BottomNav({page,navigate}){
 const items=[{id:'today',label:'Today',icon:Sun},{id:'plant',label:'What to Plant',icon:Leaf},{id:'garden',label:'My Garden',icon:Sprout},{id:'learn',label:'Plan',icon:CalendarDays},{id:'profile',label:'Profile',icon:UserRound}];
 return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({id,label,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>navigate(id)}><Icon size={23} strokeWidth={1.9}/><span>{label}</span></button>)}</nav>;
}

export function RunyanMenu({close,navigate}){return <div className="overlay" onMouseDown={close}><aside className="drawer" onMouseDown={(event)=>event.stopPropagation()}><button className="drawer-close" onClick={close}><X/></button><CheeseIcon className="drawer-cheese"/><span className="section-kicker">THE RUNYAN GARDEN</span><h2>Good things grow here.</h2><button onClick={()=>navigate('today')}><Home/> Today</button><button onClick={()=>navigate('plant')}><Leaf/> What can we plant?</button><button onClick={()=>navigate('garden')}><Sprout/> Our garden spaces</button><button onClick={()=>navigate('learn')}><CalendarDays/> Garden plan</button><button onClick={()=>navigate('profile')}><UserRound/> Profiles & settings</button></aside></div>;}
