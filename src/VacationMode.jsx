import React,{useMemo,useState}from'react';
import{AlertTriangle,CalendarRange,Check,ChevronDown,ClipboardCheck,CloudSun,Edit3,Printer,RefreshCw,ShieldCheck,Sprout,Trash2,UserRound,X}from'lucide-react';
import{SecondaryHero,SecondarySectionHeader}from'./SecondaryUI.jsx';
import{formatGardenDate}from'./dateFormat.js';
import{buildVacationIntelligence,buildVacationPlan,vacationPlanNeedsReview}from'./vacationPlanner.js';

const today=()=>new Date().toISOString().slice(0,10);
const plusDays=days=>{const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
const sectionInfo={
 before:{title:'Before leaving',description:'Work that reduces avoidable risk before the trip.'},
 during:{title:'During the trip',description:'Specific Garden Buddy checks and weather exceptions.'},
 after:{title:'After returning',description:'Inspection and history reconciliation.'}
};

function TripSetup({garden,weather,onSave,existing=null,onCancel}){
 const[d,setD]=useState(()=>({
  departureDate:existing?.departureDate||plusDays(3),
  returnDate:existing?.returnDate||plusDays(8),
  caretakerAvailable:existing?.caretakerAvailable??true,
  caretakerName:existing?.caretakerName||'',
  caretakerNotes:existing?.caretakerNotes||''
 }));
 const[error,setError]=useState('');
 const submit=event=>{
  event.preventDefault();
  if(!d.departureDate||!d.returnDate||d.returnDate<d.departureDate){
   setError('Return date must be on or after the departure date.');
   return;
  }
  const plan=buildVacationPlan({garden,weather,actor:garden.profile?.gardenerName||'Brooke',id:existing?.id,...d});
  onSave(plan);
 };
 return <form className="vacation-setup-card" onSubmit={submit}>
  <div className="vacation-form-heading">
   <span><small>TRIP DETAILS</small><strong>{existing?'Update trip dates':'Create a connected vacation plan'}</strong></span>
   {onCancel&&<button type="button" onClick={onCancel} aria-label="Close trip editor"><X/></button>}
  </div>
  <div className="vacation-two-fields">
   <label>Departure date<input type="date" min={today()} value={d.departureDate} onChange={event=>setD({...d,departureDate:event.target.value})} required/></label>
   <label>Return date<input type="date" min={d.departureDate||today()} value={d.returnDate} onChange={event=>setD({...d,returnDate:event.target.value})} required/></label>
  </div>
  <label className="vacation-checkbox"><input type="checkbox" checked={d.caretakerAvailable} onChange={event=>setD({...d,caretakerAvailable:event.target.checked})}/> A Garden Buddy can check the garden</label>
  {d.caretakerAvailable&&<label>Garden Buddy name<input value={d.caretakerName} onChange={event=>setD({...d,caretakerName:event.target.value})} placeholder="Optional name"/></label>}
  <label>Handoff note<textarea rows="3" value={d.caretakerNotes} onChange={event=>setD({...d,caretakerNotes:event.target.value})} placeholder="Gate access, hose location, plants not to touch, or emergency contact details"/></label>
  {error&&<p className="vacation-error" role="alert">{error}</p>}
  <button className="primary-button" type="submit"><CalendarRange/>{existing?'Rebuild around new dates':'Build trip plan'}</button>
 </form>;
}

function InstructionEditor({task,onSave,onCancel}){
 const[d,setD]=useState({...task});
 return <form className="vacation-task-editor" onSubmit={event=>{event.preventDefault();onSave({...d,manualEdited:true,updatedAt:new Date().toISOString()})}}>
  <label>Instruction<textarea rows="3" value={d.instruction} onChange={event=>setD({...d,instruction:event.target.value})}/></label>
  <label>What to check<textarea rows="2" value={d.whatToCheck||''} onChange={event=>setD({...d,whatToCheck:event.target.value})}/></label>
  <label>What not to do<textarea rows="2" value={d.whatNotToDo||''} onChange={event=>setD({...d,whatNotToDo:event.target.value})}/></label>
  <label>Weather exception<textarea rows="2" value={d.weatherException||''} onChange={event=>setD({...d,weatherException:event.target.value})}/></label>
  <div><button className="primary-button" type="submit"><Check/>Save instruction</button><button type="button" onClick={onCancel}>Cancel</button></div>
 </form>;
}

function VacationTask({task,onComplete,onUpdate}){
 const[editing,setEditing]=useState(false);
 if(editing)return <InstructionEditor task={task} onSave={next=>{onUpdate(next);setEditing(false)}} onCancel={()=>setEditing(false)}/>;
 return <article className={`vacation-task-card priority-${String(task.urgency||'normal').toLowerCase()}`}>
  <button className={`vacation-task-check ${task.status==='completed'?'is-complete':''}`} onClick={()=>onComplete(task)} aria-label={`${task.status==='completed'?'Undo':'Complete'} ${task.action}`}><Check/></button>
  <div>
   <div className="vacation-task-title">
    <span><small>{task.urgency||'Normal'} - {formatGardenDate(task.dueDate)}</small><strong>{task.action}</strong></span>
    {task.manualEdited&&<em>MANUALLY EDITED</em>}
   </div>
   <h3>{task.targetName}</h3>
   <p>{task.instruction}</p>
   {Boolean(task.whatToCheck||task.whatNotToDo||task.weatherException)&&<details className="vacation-task-instructions">
    <summary><span>Check details</span><ChevronDown/></summary>
    <div>
     {task.whatToCheck&&<small><b>Check first:</b> {task.whatToCheck}</small>}
     {task.whatNotToDo&&<small><b>Do not:</b> {task.whatNotToDo}</small>}
     {task.weatherException&&<small><b>Weather exception:</b> {task.weatherException}</small>}
    </div>
   </details>}
  </div>
  <button className="vacation-edit" onClick={()=>setEditing(true)} aria-label={`Edit ${task.action}`}><Edit3/></button>
 </article>;
}

function VacationRisk({intelligence}){
 const risk=intelligence?.risk;
 if(!risk)return null;
 return <section className={`vacation-risk-card risk-${String(risk.level||'low').toLowerCase()}`}>
  <div className="vacation-risk-heading"><ShieldCheck/><span><small>VACATION RISK</small><h2>{risk.label}</h2><p>{risk.summary}</p></span></div>
  <div className="vacation-risk-reasons">
   {(risk.reasons||[]).map(reason=><small key={reason}><Check/> {reason}</small>)}
   {(risk.warnings||[]).map(reason=><small key={reason}><AlertTriangle/> {reason}</small>)}
  </div>
 </section>;
}

function BeforeYouLeave({items=[]}){
 const groups=['HIGH PRIORITY','MEDIUM PRIORITY','LOW PRIORITY'].map(label=>({label,items:items.filter(item=>item.priorityLabel===label)})).filter(group=>group.items.length);
 return <section className="vacation-intelligence-section">
  <SecondarySectionHeader eyebrow="BEFORE YOU LEAVE" title="Pre-vacation garden review" description="Prioritized from saved plants, growing spaces, lifecycle stage, and forecast risk." count={items.length}/>
  <div className="vacation-review-groups">
   {groups.map(group=><div key={group.label} className="vacation-review-group">
    <h3>{group.label}</h3>
    {group.items.map(item=><article className="vacation-review-card" key={item.id}>
     <div><strong>{item.subject}</strong><small>{item.crop}{item.variety?` - ${item.variety}`:''}</small></div>
     <p><b>Action:</b> {item.action}</p>
     <p><b>Why now:</b> {item.reason}</p>
     <dl>
      <div><dt>Date range</dt><dd>{item.dateRange}</dd></div>
      <div><dt>Source packet</dt><dd>{item.sourcePacket}</dd></div>
      <div><dt>Indoor/outdoor</dt><dd>{item.indoorOutdoor}</dd></div>
      <div><dt>Growing space</dt><dd>{item.growingSpaceRecommendation}</dd></div>
      <div><dt>Next action</dt><dd>{item.nextAvailableAction}</dd></div>
     </dl>
    </article>)}
   </div>)}
  </div>
 </section>;
}

function HelperGuide({guide}){
 if(!guide)return null;
 return <section className="vacation-helper-guide">
  <div className="vacation-helper-heading"><ClipboardCheck/><span><small>GARDEN BUDDY GUIDE</small><h2>{guide.title}</h2><p>{guide.dates} - printable on this device only.</p></span></div>
  <div className="vacation-helper-columns">
   <div><h3>Daily checks</h3>{(guide.dailyChecks||[]).map(item=><label key={item.id}><input type="checkbox" readOnly/> <span><strong>{item.label}</strong><small>{item.instruction}</small></span></label>)}</div>
   <div><h3>Do not</h3>{(guide.doNot||[]).map(item=><p key={item}>{item}</p>)}</div>
  </div>
 </section>;
}

function ReturnHomeReview({review}){
 if(!review)return null;
 return <section className="vacation-return-review">
  <div><Sprout/><span><small>RETURN HOME REVIEW</small><h2>{review.title}</h2></span></div>
  <div className="vacation-return-columns">
   <span><strong>Completed or likely covered</strong>{(review.completed||[]).map(item=><small key={item}><Check/> {item}</small>)}</span>
   <span><strong>Needs attention</strong>{(review.needsAttention||[]).map(item=><small key={item}><AlertTriangle/> {item}</small>)}</span>
  </div>
 </section>;
}

function printCaretaker(plan){
 const popup=window.open('','_blank','width=760,height=900');
 if(!popup)return window.alert('Allow pop-ups to print the Garden Buddy guide.');
 const guide=plan.intelligence?.helperGuide,tasks=(plan.tasks||[]).filter(task=>task.section==='during'&&task.status!=='completed'),escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 popup.document.write(`<!doctype html><html><head><title>Runyan Garden Buddy Guide</title><style>body{font-family:Arial,sans-serif;color:#173d2b;margin:36px}h1{font-family:Georgia,serif}article{border:1px solid #9aa79e;border-radius:12px;padding:14px;margin:12px 0;page-break-inside:avoid}small{display:block;margin:5px 0;color:#40594b}.box{font-size:22px;margin-right:8px}.avoid{background:#fff4df}</style></head><body><h1>${escape(guide?.title||'Runyan Garden Buddy Guide')}</h1><p>${escape(formatGardenDate(plan.departureDate))} through ${escape(formatGardenDate(plan.returnDate))}${plan.caretakerName?` - For ${escape(plan.caretakerName)}`:''}</p>${plan.caretakerNotes?`<p><strong>Household note:</strong> ${escape(plan.caretakerNotes)}</p>`:''}<h2>Daily Checks</h2>${(guide?.dailyChecks||[]).map(item=>`<article><h3><span class="box">&#9744;</span>${escape(item.label)}</h3><p>${escape(item.instruction)}</p><small>${escape(item.reason)}</small><p>Notes: ______________________________________________</p></article>`).join('')||'<p>No daily checks are required for this plan.</p>'}<h2>Do Not</h2>${(guide?.doNot||[]).map(item=>`<article class="avoid"><p>${escape(item)}</p></article>`).join('')}<h2>Scheduled Garden Buddy Tasks</h2>${tasks.map(task=>`<article><h3><span class="box">&#9744;</span>${escape(task.targetName)}</h3><p><strong>${escape(formatGardenDate(task.dueDate))}:</strong> ${escape(task.instruction)}</p>${task.whatToCheck?`<small><b>Check first:</b> ${escape(task.whatToCheck)}</small>`:''}${task.whatNotToDo?`<small><b>Do not:</b> ${escape(task.whatNotToDo)}</small>`:''}${task.weatherException?`<small><b>Weather exception:</b> ${escape(task.weatherException)}</small>`:''}<p>Notes: ______________________________________________</p></article>`).join('')||'<p>No additional helper tasks are required for this plan.</p>'}<script>window.onload=()=>window.print()</script></body></html>`);
 popup.document.close();
}

export default function VacationMode({garden,weather,navigate,onSavePlan,onRefreshPlan,onUpdateTask,onCompleteTask,onClosePlan}){
 const activeSaved=useMemo(()=>(garden.vacationPlans||[]).filter(plan=>!plan.deletedAt&&plan.status==='active').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0],[garden.vacationPlans]);
 const active=useMemo(()=>activeSaved?{...activeSaved,intelligence:activeSaved.intelligence||buildVacationIntelligence({garden,weather,plan:activeSaved})}:null,[activeSaved,garden,weather]);
 const[editing,setEditing]=useState(false),needsReview=active&&vacationPlanNeedsReview(active,weather);
 const groups=active?['before','during','after'].map(section=>({section,tasks:(active.tasks||[]).filter(task=>task.section===section&&!task.deletedAt)})):[];
 return <main className="screen secondary-screen vacation-mode-screen">
  <SecondaryHero icon={CalendarRange} eyebrow="RECORDS & EXTRAS" title="Vacation Mode" description="A garden-specific before, during, and after plan built from actual plants, spaces, stages, care history, and weather." onBack={()=>navigate('tools')} backLabel="Back to Tool Shed" className="center-department-hero vacation-mode-hero"/>
  <section className="screen-pad secondary-screen-content vacation-mode-content">
   {!active||editing?<TripSetup garden={garden} weather={weather} existing={editing?active:null} onSave={plan=>{onSavePlan(plan);setEditing(false)}} onCancel={editing?()=>setEditing(false):null}/>:<>
    <section className="vacation-plan-summary">
     <div><small>ACTIVE TRIP PLAN</small><h2>{formatGardenDate(active.departureDate)}-{formatGardenDate(active.returnDate)}</h2><p>{active.duration} days - {active.caretakerAvailable?`${active.caretakerName||'Garden Buddy'} guide included`:'No Garden Buddy available'}</p></div>
     <span><CloudSun/><strong>{active.weatherSummary?.high!==null?`${Math.round(active.weatherSummary.high)} degrees expected high`:'Forecast incomplete'}</strong><small>{active.weatherSummary?.meaningfulRain?'Meaningful rain is possible; it is not counted until observed.':'No dependable rain credit is assumed.'}</small></span>
    </section>
    <VacationRisk intelligence={active.intelligence}/>
    <BeforeYouLeave items={active.intelligence?.beforeYouLeave||[]}/>
    <HelperGuide guide={active.intelligence?.helperGuide}/>
    {needsReview&&<section className="vacation-change-alert">
     <AlertTriangle/><span><strong>The forecast changed meaningfully.</strong><small>Re-evaluate only the affected instructions. Manually edited Garden Buddy text will be preserved.</small></span><button onClick={()=>onRefreshPlan(active)}><RefreshCw/>Review changes</button>
    </section>}
    <div className="vacation-plan-actions">
     <button onClick={()=>setEditing(true)}><Edit3/>Change trip details</button>
     <button onClick={()=>printCaretaker(active)}><Printer/>Print helper guide</button>
     <button className="danger-control" onClick={()=>onClosePlan(active.id)}><Trash2/>End trip plan</button>
    </div>
    {active.changes?.length>0&&<details className="vacation-change-list">
     <summary><span><strong>What changed</strong><small>{active.changes.length} instruction change{active.changes.length===1?'':'s'} after re-evaluation</small></span><ChevronDown/></summary>
     {active.changes.map((change,index)=><article key={`${change.taskId}-${index}`}><strong>{change.title}</strong><p>{change.reason}</p><small>Previous: {change.from}</small><small>Now: {change.to}</small></article>)}
    </details>}
    {groups.map(group=><section className="vacation-task-section" key={group.section}>
     <SecondarySectionHeader eyebrow={group.section.toUpperCase()} title={sectionInfo[group.section].title} description={sectionInfo[group.section].description} count={group.tasks.length}/>
     {group.tasks.length?<div className="vacation-task-list">{group.tasks.map(task=><VacationTask key={task.id} task={task} onComplete={onCompleteTask} onUpdate={next=>onUpdateTask(active.id,next)}/>)}</div>:<p className="vacation-empty">No work is currently required in this section.</p>}
    </section>)}
    <ReturnHomeReview review={active.intelligence?.returnHome}/>
    <section className="vacation-honesty"><UserRound/><span><strong>This plan uses saved garden records.</strong><small>Weather exceptions remain forecasts until observed. Helper edits are preserved, and completed trip work is retained in history rather than regenerated. The helper guide is local only; no shared access was added.</small></span></section>
   </>}
  </section>
 </main>;
}
