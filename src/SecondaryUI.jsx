import React from'react';
import{ArrowLeft,ChevronRight}from'lucide-react';

export function SecondaryHero({icon:Icon,eyebrow,title,description,onBack,backLabel='Back',className=''}){
 return <section className={`dark-header secondary-hero compact-secondary-header ${className}`.trim()}>
  {onBack&&<button type="button" className="secondary-back-button" onClick={onBack} aria-label={backLabel}><ArrowLeft/></button>}
  {Icon&&<span className="secondary-hero-icon" aria-hidden="true"><Icon/></span>}
  <span className="secondary-hero-copy">
   {eyebrow&&<span className="secondary-hero-eyebrow">{eyebrow}</span>}
   <h1>{title}</h1>
   {description&&<p>{description}</p>}
  </span>
 </section>;
}

export function SecondarySectionHeader({eyebrow,title,description,count}){
 return <div className="secondary-section-header">
  <span><small>{eyebrow}</small>{title&&<strong>{title}</strong>}{description&&<p>{description}</p>}</span>
  {count!==undefined&&count!==null&&<em>{count}</em>}
 </div>;
}

export function SecondaryCard({icon:Icon,title,description,meta,onClick,tone='cream',kind='admin',count,children,ariaLabel}){
 const content=<><span className="secondary-card-icon" aria-hidden="true">{Icon&&<Icon/>}</span><span className="secondary-card-copy"><strong>{title}</strong>{description&&<small>{description}</small>}{meta&&<em>{meta}</em>}</span>{count!==undefined&&count!==null&&<b className="secondary-card-count">{count}</b>}{onClick&&<ChevronRight className="secondary-card-chevron" aria-hidden="true"/>}{children}</>;
 if(onClick)return <button type="button" className={`secondary-card ${kind}-card tone-${tone}`} onClick={onClick} aria-label={ariaLabel||`${title}. ${description||''}`.trim()}>{content}</button>;
 return <article className={`secondary-card ${kind}-card tone-${tone}`}>{content}</article>;
}

export function ModeSelector({items,value,onChange}){
 return <div className="secondary-mode-selector" role="tablist" aria-label="Planting Desk view">{items.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" role="tab" aria-selected={value===item.id} className={`${value===item.id?'active ':''}${item.primary?'is-primary':''}`.trim()} onClick={()=>onChange(item.id)}>{Icon&&<Icon/>}<span><strong>{item.label}</strong>{item.description&&<small>{item.description}</small>}</span></button>})}</div>;
}

export function InlineNotice({title,description,actions=[]}){
 return <div className="secondary-inline-notice" role="status"><span><strong>{title}</strong>{description&&<small>{description}</small>}</span>{actions.length>0&&<div>{actions.map(action=><button key={action.label} type="button" onClick={action.onClick}>{action.label}</button>)}</div>}</div>;
}
