import React from 'react';
import { MoreHorizontal, Store, Sprout, Sun, Wrench } from 'lucide-react';

export default function BottomNav({page,navigate}){
 const items=[
  {id:'today',label:'Today',icon:Sun},
  {id:'garden',label:'Garden',icon:Sprout},
  {id:'center',label:'Center',icon:Store},
  {id:'tools',label:'Tool Shed',icon:Wrench},
  {id:'more',label:'More',icon:MoreHorizontal}
 ];
 return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({id,label,icon:Icon})=><button key={id} type="button" className={page===id?'active':''} aria-current={page===id?'page':undefined} aria-label={label} onClick={()=>navigate(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>;
}
