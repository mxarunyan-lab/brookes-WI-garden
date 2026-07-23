import React,{useEffect,useId,useRef}from'react';
import{CheckCircle2,ChevronRight,X}from'lucide-react';
import{createPortal}from'react-dom';
import{formatUrgentBadge,isGardenSetupIncomplete}from'./urgentGardenAlerts.js';

export function WateringCanIcon({size=26}){return <svg className="watering-can-icon" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M11 11.5h12.5v13H11z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/><path d="M23.5 14h2.2c2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3h-2.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M11 14.5 4.2 11 2 14.2l9 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.5 11.5V9.7c0-2.3 1.9-4.2 4.2-4.2s4.2 1.9 4.2 4.2v1.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M13.5 24.5h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>}

const focusableSelector='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function UrgentAlertControl({open,setOpen,alerts=[],onOpenTask,navigate}){
 const triggerRef=useRef(null),dialogRef=useRef(null),titleId=useId(),count=alerts.length,badge=formatUrgentBadge(count);
 const close=()=>setOpen(false);
 useEffect(()=>{
  if(!open)return undefined;
  const previousOverflow=document.body.style.overflow,previousActive=document.activeElement;
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>dialogRef.current?.querySelector(focusableSelector)?.focus());
  const onKeyDown=event=>{
   if(event.key==='Escape'){event.preventDefault();setOpen(false);return}
   if(event.key!=='Tab'||!dialogRef.current)return;
   const controls=[...dialogRef.current.querySelectorAll(focusableSelector)].filter(element=>!element.hasAttribute('disabled'));
   if(!controls.length){event.preventDefault();return}
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKeyDown);
  return()=>{
   document.removeEventListener('keydown',onKeyDown);
   document.body.style.overflow=previousOverflow;
   const target=triggerRef.current||previousActive;
   requestAnimationFrame(()=>target?.focus?.());
  };
 },[open,setOpen]);
 const label=count?`Urgent garden alerts. ${count} urgent item${count===1?'':'s'}.`:'Urgent garden alerts. Nothing urgent.';
 const dialog=open&&typeof document!=='undefined'?createPortal(<div className="urgent-alert-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section id="urgent-garden-alert-dialog" ref={dialogRef} className="urgent-alert-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}><header><span><small>GARDEN CHECK</small><h2 id={titleId}>Urgent Garden Alerts</h2></span><button type="button" className="urgent-alert-close" onClick={close} aria-label="Close urgent garden alerts"><X/></button></header>{count?<><p className="urgent-alert-summary">Only time-sensitive items that could harm the garden are shown here.</p><div className="urgent-alert-list">{alerts.map(alert=><button type="button" key={alert.id||alert.title} onClick={()=>{close();onOpenTask?.(alert)}}><span><small>{alert.taskType||alert.weatherAlert?.type||'URGENT'}</small><strong>{alert.title||alert.weatherAlert?.what||'Garden action needed'}</strong><em>{alert.subtitle||alert.reason||alert.weatherAlert?.why||'Open for the urgent action details.'}</em></span><ChevronRight/></button>)}</div><button type="button" className="urgent-alert-board-link" onClick={()=>{close();navigate('chores')}}>Open Chore Board <ChevronRight/></button></>:<div className="urgent-alert-empty"><CheckCircle2/><span><strong>Nothing urgent right now</strong><p>Your garden does not need immediate attention.</p></span></div>}</section></div>,document.body):null;
 return <><button ref={triggerRef} type="button" className="round-control hero-bell urgent-garden-trigger" onClick={()=>setOpen(value=>!value)} aria-label={label} aria-expanded={open} aria-controls={open?'urgent-garden-alert-dialog':undefined}><WateringCanIcon/>{badge&&<span className="notification-count">{badge}</span>}</button>{dialog}</>;
}

const firstName=value=>String(value||'Gardener').trim().split(/\s+/)[0]||'Gardener';

export function SimplifiedTodayCard({profile,garden,urgentAlerts=[],setupTask,onTask,navigate,onOpenAlerts}){
 const setup=isGardenSetupIncomplete(garden),primary=urgentAlerts[0];
 if(setup)return <section className="what-matters-today today-summary-card is-onboarding" aria-labelledby="what-matters-today-title"><div className="today-summary-copy"><small>TODAY</small><h2 id="what-matters-today-title">Welcome to {firstName(profile?.gardenerName)}’s Garden</h2><p>Add what you’re growing so Garden Compass can give you useful, plant-specific guidance.</p></div><div className="today-summary-actions"><button type="button" className="home-primary-route" onClick={()=>setupTask?onTask(setupTask):navigate('center')}>Add What I’m Growing <ChevronRight/></button><button type="button" className="today-secondary-link" onClick={()=>navigate('center')}>Explore the Garden Center</button></div></section>;
 if(primary)return <section className="what-matters-today today-summary-card has-urgent-action" aria-labelledby="what-matters-today-title"><div className="today-summary-copy"><small>TODAY</small><h2 id="what-matters-today-title">{primary.title||'One garden action needs attention now'}</h2><p>{primary.subtitle||primary.reason||'Open the urgent alert for the action details.'}</p></div><button type="button" className="home-primary-route" onClick={onOpenAlerts}>View Urgent Alerts <ChevronRight/></button></section>;
 return <section className="what-matters-today today-summary-card is-clear" aria-labelledby="what-matters-today-title"><div className="today-clear-message"><CheckCircle2/><span><small>TODAY</small><h2 id="what-matters-today-title">Everything looks good today</h2><p>No urgent garden actions right now.</p></span></div></section>;
}

export function SeasonalIdeaCard({task,onOpen}){if(!task)return null;return <section className="seasonal-idea-card"><span><small>SEASONAL IDEA</small><strong>{task.title}</strong><p>{task.subtitle||task.reason||'Open this optional seasonal garden idea.'}</p></span><button type="button" onClick={()=>onOpen(task)}>{task.action||'See Options'} <ChevronRight/></button></section>}
