import React from 'react';
import { CalendarDays, MoreHorizontal, Store, Sprout, Sun } from 'lucide-react';

export default function BottomNav({page,navigate}){
 const items=[
  {id:'today',label:'Today',icon:Sun},
  {id:'garden',label:'Garden',icon:Sprout},
  {id:'plan-plant',label:'Planting',icon:CalendarDays},
  {id:'center',label:'Center',icon:Store},
  {id:'more',label:'More',icon:MoreHorizontal}
 ];
 return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({id,label,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>navigate(id)}><Icon size={22}/><span>{label}</span></button>)}</nav>;
}