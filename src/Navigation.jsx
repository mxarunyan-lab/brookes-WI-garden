import React from 'react';
import { ClipboardList, MoreHorizontal, Sprout, Sun, Wrench } from 'lucide-react';

const parentByPage={chores:'center','plan-plant':'center','seed-tools':'center',indoor:'center','shopping-list':'center',vacation:'center',memory:'garden',weather:'tools','spacing-calculator':'tools','soil-calculator':'tools','frost-calculator':'tools','seed-quantity-calculator':'tools','garden-measurements':'tools','printable-pack':'tools',labels:'tools','seed-labels':'tools','admin-profile':'more','admin-location':'more','admin-notifications':'more','admin-backup':'more','admin-help':'more','admin-whatsnew':'more','admin-support':'more','admin-about':'more'};
export default function BottomNav({page,navigate}){
 const selected=parentByPage[page]||page,items=[
  {id:'today',label:'Today',icon:Sun},
  {id:'garden',label:'Garden',icon:Sprout},
  {id:'center',label:'Plan',icon:ClipboardList},
  {id:'tools',label:'Tool Shed',icon:Wrench},
  {id:'more',label:'More',icon:MoreHorizontal}
 ];
 return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({id,label,icon:Icon})=><button key={id} type="button" className={selected===id?'active':''} aria-current={selected===id?'page':undefined} aria-label={label} onClick={()=>navigate(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>;
}
