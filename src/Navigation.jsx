import React from 'react';
import { CalendarDays, Leaf, Sprout, Sun, UserRound } from 'lucide-react';

export default function BottomNav({page,navigate}){
 const items=[
  {id:'today',label:'Today',icon:Sun},
  {id:'plant',label:'What to Plant',icon:Leaf},
  {id:'garden',label:'My Garden',icon:Sprout},
  {id:'learn',label:'Plan',icon:CalendarDays},
  {id:'profile',label:'Profile',icon:UserRound},
 ];
 return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({id,label,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>navigate(id)}><Icon size={23} strokeWidth={1.9}/><span>{label}</span></button>)}</nav>;
}
