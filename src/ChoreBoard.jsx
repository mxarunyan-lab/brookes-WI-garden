import React,{useMemo,useState}from'react';
import{CalendarPlus,Check,ChevronDown,ChevronRight,ClipboardList,CloudRain,Home,Leaf,Plus,Sprout,Undo2,Warehouse,XCircle}from'lucide-react';
import{formatDateTime}from'./data.js';
import{buildTaskBoard,completionFor,filterEmptyMessage,taskArea}from'./taskBoard.js';

const todayKey=()=>new Date().toISOString().slice(0,10);
const dueLabel=task=>{if(!task.dueDate||task.dueDate===todayKey())return'Due today';if(task.dueDate<todayKey())return`Overdue since ${task.dueDate}`;return`Due ${task.dueDate}`};

function TaskIcon({task,done}){if(done)return <Check/>;if(task.weatherDriven)return <CloudRain/>;if(taskArea(task)==='Greenhouse')return <Warehouse/>;if(task.kind==='navigate'||task.kind==='seasonalGuide')return <Leaf/>;return <Sprout/>}

function Row({task,completion,onOpen,onOpenSpace,onStatus,onUndo}){
 const done=Boolean(completion),status=completion?.status||'',space=task.space?.name||task.plant?.spaceName||'',plant=task.plant?.name||'';
 const dismissLabel=task.weatherDriven?'Dismiss':'Not needed';
 return <article className={`chore-row intelligence-task-row ${done?'is-complete':''} ${status==='skipped'?'is-skipped':''} ${status==='not-needed'?'is-not-needed':''}`}>
  <div className="chore-row-icon"><TaskIcon task={task} done={done}/></div>
  <div className="chore-row-copy">
   <div className="task-meta-line"><span className={`task-priority priority-${String(task.priorityLabel||'Normal').toLowerCase()}`}>{task.priorityLabel||'Normal'}</span><span>{task.taskType||'Garden task'}</span><span>{dueLabel(task)}</span></div>
   <h3>{task.title}</h3>
   {!done&&task.subtitle&&<p>{task.subtitle}</p>}
   {!done&&(plant||space)&&<small className="task-location-line">{[plant,space].filter(Boolean).join(' · ')}</small>}
   {!done&&task.reason&&<small><strong>Why:</strong> {task.reason}</small>}
   {!done&&task.when&&<small><strong>When:</strong> {task.when}</small>}
   {done&&<p>{status==='skipped'?'Skipped':status==='not-needed'?'Marked not needed':'Completed'} by {completion.actor} · {formatDateTime(completion.at)}</p>}
  </div>
  <div className="chore-row-actions">
   {done?<button onClick={()=>onUndo(task.id)}><Undo2/>Undo</button>:<>
    {task.plant&&<button className="primary-button compact" onClick={()=>onOpen(task)}>Open plant</button>}
    {!task.plant&&<button className="primary-button compact" onClick={()=>onOpen(task)}>Open</button>}
    {task.space&&<button onClick={()=>onOpenSpace(task.space.id)}>Open space</button>}
    <button onClick={()=>onStatus(task,'done')}><Check/>Done</button>
    <button onClick={()=>onStatus(task,'not-needed')}><XCircle/>{dismissLabel}</button>
    {!task.weatherDriven&&<button onClick={()=>onStatus(task,'skipped')}>Skip</button>}
   </>}
  </div>
 </article>;
}

function TaskSection({id,kicker,title,tasks,completion,defaultOpen=false,emptyText='',...props}){
 const[open,setOpen]=useState(defaultOpen),[showAll,setShowAll]=useState(false);
 if(!tasks.length)return emptyText?<section className="chore-section compact-empty-section"><div><span className="section-kicker">{kicker}</span><p>{emptyText}</p></div></section>:null;
 const visible=showAll?tasks:tasks.slice(0,4);
 return <section className={`chore-section collapsible-chore-section ${open?'is-open':''}`}>
  <button className="chore-section-toggle" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-controls={`section-${id}`}>
   <span><small>{kicker}</small><strong>{title}</strong></span><em>{tasks.length}</em><ChevronDown/>
  </button>
  {open&&<div id={`section-${id}`} className="chore-section-body"><div className="chore-list">{visible.map(task=><Row key={task.id} task={task} completion={completion(task.id)} {...props}/>)}</div>{tasks.length>4&&<button className="show-all-tasks" onClick={()=>setShowAll(value=>!value)}>{showAll?'Show fewer':`Show all ${tasks.length}`}</button>}</div>}
 </section>;
}

function ReminderForm({garden,onAdd,onClose}){
 const[d,setD]=useState({title:'',taskType:'Check Moisture',plantId:'',spaceId:'',priority:60,dueDate:todayKey(),reason:'',note:''}),selectedPlant=garden.plants.find(plant=>plant.id===d.plantId);
 const submit=event=>{event.preventDefault();if(!d.title.trim())return;onAdd({...d,spaceId:d.spaceId||selectedPlant?.spaceId||''});onClose()};
 return <form className="manual-reminder-form" onSubmit={submit}><div className="manual-reminder-heading"><div><span className="section-kicker">MANUAL REMINDER</span><h2>Add a garden task</h2></div><button type="button" onClick={onClose} aria-label="Close reminder form"><XCircle/></button></div><label>Task name<input value={d.title} onChange={event=>setD({...d,title:event.target.value})} required/></label><label>Task type<select value={d.taskType} onChange={event=>setD({...d,taskType:event.target.value})}>{['Water','Check Moisture','Fertilize','Prune','Harvest','Stake','Hill Potatoes','Harden Off','Deadhead','Inspect For Pests'].map(type=><option key={type}>{type}</option>)}</select></label><div className="two-field-row"><label>Plant<select value={d.plantId} onChange={event=>setD({...d,plantId:event.target.value})}><option value="">No specific plant</option>{garden.plants.filter(plant=>!plant.deletedAt&&!plant.archived).map(plant=><option key={plant.id} value={plant.id}>{plant.name}</option>)}</select></label><label>Growing space<select value={d.spaceId} onChange={event=>setD({...d,spaceId:event.target.value})}><option value="">Use plant location</option>{garden.spaces.filter(space=>!space.deletedAt).map(space=><option key={space.id} value={space.id}>{space.name}</option>)}</select></label></div><div className="two-field-row"><label>Priority<select value={d.priority} onChange={event=>setD({...d,priority:Number(event.target.value)})}><option value="95">Urgent</option><option value="80">High</option><option value="60">Normal</option><option value="35">Low</option></select></label><label>Due date<input type="date" value={d.dueDate} onChange={event=>setD({...d,dueDate:event.target.value})}/></label></div><label>Reason<input value={d.reason} onChange={event=>setD({...d,reason:event.target.value})}/></label><label>Notes<textarea value={d.note} onChange={event=>setD({...d,note:event.target.value})}/></label><button className="primary-button"><CalendarPlus/>Add to Chore Board</button></form>;
}

export default function ChoreBoard({todayTasks,dailyDone,onOpen,onOpenSpace,onStatus,onUndo,navigate,garden,onAddReminder}){
 const[filter,setFilter]=useState('All'),[adding,setAdding]=useState(false);
 const board=useMemo(()=>buildTaskBoard({tasks:todayTasks,completions:dailyDone,filter}),[todayTasks,dailyDone,filter]);
 const urgentIds=new Set(board.sections.urgent.map(task=>task.id));
 const overdue=board.sections.overdue.filter(task=>!urgentIds.has(task.id));
 const overdueIds=new Set(overdue.map(task=>task.id));
 const weather=board.sections.weather.filter(task=>!urgentIds.has(task.id)&&!overdueIds.has(task.id));
 const weatherIds=new Set(weather.map(task=>task.id));
 const dueToday=board.sections.dueToday.filter(task=>!urgentIds.has(task.id)&&!weatherIds.has(task.id));
 const completion=id=>completionFor(dailyDone,id);
 const filters=['All','Outdoor','Indoor',...(todayTasks.some(task=>taskArea(task)==='Greenhouse')?['Greenhouse']:[])];
 return <main className="screen chore-board-screen"><section className="dark-header chore-board-header"><button className="back-button" onClick={()=>navigate('back')} aria-label="Go back"><Home/></button><ClipboardList/><span>THE GARDEN BULLETIN</span><h1>Garden Chore Board</h1><p>Only real actions are counted. Priority labels can overlap, but the total never double-counts a task.</p></section><section className="screen-pad chore-board-content">
  <div className="chore-summary reconciled-summary"><div><strong>{board.counts.needsAttention} need attention</strong><small>Unique unfinished chores due today or overdue</small></div><div className="reconciled-counts"><span><b>{board.counts.urgent}</b> urgent</span><span><b>{board.counts.dueToday}</b> due today</span><span><b>{board.counts.overdue}</b> overdue</span><span><b>{board.counts.weather}</b> weather alerts</span><span><b>{board.counts.upcoming}</b> upcoming</span></div><button onClick={()=>setAdding(true)}><Plus/>Add reminder</button></div>
  {adding&&<ReminderForm garden={garden} onAdd={onAddReminder} onClose={()=>setAdding(false)}/>} 
  <div className="chore-filters" aria-label="Filter chores by growing area">{filters.map(item=><button key={item} className={filter===item?'active':''} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}</div>
  {!board.needsAttention.length&&!board.sections.upcoming.length&&<div className="all-clear"><Check/><span><strong>{filterEmptyMessage(filter)}</strong><small>Completed, skipped, and not-needed decisions remain saved below.</small></span></div>}
  <TaskSection id="urgent" kicker="URGENT" title="Needs attention first" tasks={board.sections.urgent} completion={completion} defaultOpen onOpen={onOpen} onOpenSpace={onOpenSpace} onStatus={onStatus} onUndo={onUndo}/>
  <TaskSection id="today" kicker="DO TODAY" title="Due today" tasks={dueToday} completion={completion} defaultOpen onOpen={onOpen} onOpenSpace={onOpenSpace} onStatus={onStatus} onUndo={onUndo}/>
  <TaskSection id="overdue" kicker="OVERDUE" title="Past the due date" tasks={overdue} completion={completion} onOpen={onOpen} onOpenSpace={onOpenSpace} onStatus={onStatus} onUndo={onUndo}/>
  <TaskSection id="weather" kicker="WEATHER ALERTS" title="Weather changed the plan" tasks={weather} completion={completion} defaultOpen={weather.some(task=>task.priority>=90)} emptyText={filter==='All'?'No weather alerts are affecting the garden.':''} onOpen={onOpen} onOpenSpace={onOpenSpace} onStatus={onStatus} onUndo={onUndo}/>
  <TaskSection id="upcoming" kicker="UPCOMING" title="Future work" tasks={board.sections.upcoming} completion={completion} onOpen={onOpen} onOpenSpace={onOpenSpace} onStatus={onStatus} onUndo={onUndo}/>
  {board.completed.length>0&&<TaskSection id="history" kicker="COMPLETED, SKIPPED, OR NOT NEEDED" title="Off the active board" tasks={board.completed} completion={completion} onOpen={onOpen} onOpenSpace={onOpenSpace} onStatus={onStatus} onUndo={onUndo}/>} 
 </section></main>;
}
