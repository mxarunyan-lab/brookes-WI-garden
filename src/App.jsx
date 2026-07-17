import React,{useEffect,useMemo,useRef,useState}from'react';
import ClearDetailModal from'./ClearDetailModal.jsx';
import BottomNav from'./Navigation.jsx';
import{TodayWorkspace}from'./WorkspaceScreens.jsx';
import ChoreBoard from'./ChoreBoard.jsx';
import BedWorkspace from'./BedWorkspace.jsx';
import PlanPlantHub from'./PlanPlantHub.jsx';
import GardenCenter from'./GardenCenter.jsx';
import MoreHub from'./MoreHub.jsx';
import GardenControls from'./GardenControls.jsx';
import IndoorCenter from'./IndoorCenter.jsx';
import SettingsCenter from'./SettingsCenter.jsx';
import GardenMemory from'./GardenMemory.jsx';
import SeedTools from'./SeedTools.jsx';
import LabelCounter from'./LabelCounter.jsx';
import{Check,ChevronRight,Plus,X}from'lucide-react';
import{getCropRecommendations,newId,starterGarden}from'./data.js';
import{gardenWeatherAlert,useGreenBayWeather}from'./weather.js';
import{buildYearRoundTasks,createManualReminder,getSeasonMode,migrateGarden}from'./yearRoundEngine.js';
import{buildTimeline,createSuccession,nextStage,normalizePlanning}from'./planning.js';
import{prepareGardenForSync,softDelete,touchRecord}from'./syncModel.js';

const GARDEN_KEY='brookes-garden-state-v2',PAGE_KEY='brookes-garden-page-v2',DAILY_KEY='brookes-garden-daily-v5';
const safeLoad=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const dayKey=()=>new Date().toISOString().slice(0,10);
const plusDays=days=>{const date=new Date();date.setDate(date.getDate()+days);return date.toISOString().slice(0,10)};
const normalizeAll=garden=>prepareGardenForSync({...garden,trays:garden.trays||[],growLights:garden.growLights||[],hardeningPlans:garden.hardeningPlans||[],hydroPods:garden.hydroPods||[],greenhouseReadings:garden.greenhouseReadings||[],seedPackets:garden.seedPackets||[],problems:garden.problems||[],harvests:garden.harvests||[],reminders:garden.reminders||[],taskHistory:garden.taskHistory||[],yearPlan:garden.yearPlan||{crops:[]}});

function PlantConfirmation({data,onClose,onView,onAdd}){return <div className="plant-confirmation-backdrop" role="dialog" aria-modal="true" aria-labelledby="plant-confirmation-title"><section className="plant-confirmation-card"><button className="plant-confirmation-close" onClick={onClose}><X/></button><span className="plant-confirmation-icon"><Check/></span><span className="section-kicker">PLANT ADDED</span><h2 id="plant-confirmation-title">{data.name} added to {data.spaceName}</h2><p>{[`${data.quantity} plant${data.quantity===1?'':'s'}`,data.variety||'Variety not entered'].join(' · ')}</p><div><button className="primary-button" onClick={onView}>View in {data.spaceName}<ChevronRight/></button><button className="secondary-button" onClick={onAdd}><Plus/>Add another plant</button></div></section></div>}

export default function App(){
 const[page,setPage]=useState('today');
 const history=useRef([{page:'today',scroll:0}]);
 const[garden,setGarden]=useState(()=>normalizeAll(normalizePlanning(migrateGarden(safeLoad(GARDEN_KEY,starterGarden),starterGarden))));
 const[daily,setDaily]=useState(()=>{const saved=safeLoad(DAILY_KEY,{date:dayKey(),done:[],snoozed:{}});if(saved.date!==dayKey())return{date:dayKey(),done:[],snoozed:{}};return{...saved,done:(saved.done||[]).map(item=>typeof item==='string'?{id:item,actor:'Unknown',at:new Date().toISOString(),status:'done'}:item),snoozed:saved.snoozed||{}}});
 const[noticeOpen,setNoticeOpen]=useState(false),[modal,setModal]=useState(null),[toast,setToast]=useState(''),[confirmation,setConfirmation]=useState(null);
 const weatherState=useGreenBayWeather(),actor=garden.profile?.gardenerName||'Brooke';
 useEffect(()=>localStorage.setItem(PAGE_KEY,page),[page]);
 useEffect(()=>localStorage.setItem(GARDEN_KEY,JSON.stringify(garden)),[garden]);
 useEffect(()=>localStorage.setItem(DAILY_KEY,JSON.stringify(daily)),[daily]);
 useEffect(()=>{const bed=new URLSearchParams(window.location.search).get('bed');if(bed){history.current=[{page:'today',scroll:0},{page:'garden',scroll:0}];setPage('garden')}},[]);
 const showToast=message=>{setToast(message);clearTimeout(window.__gardenToast);window.__gardenToast=setTimeout(()=>setToast(''),2600)};
 const navigate=requested=>{const aliases={plant:'plan-plant',learn:'plan-plant',settings:'profile'},target=aliases[requested]||requested;if(target==='back'){if(history.current.length>1){history.current.pop();const previous=history.current[history.current.length-1];setPage(previous.page);setNoticeOpen(false);setModal(null);requestAnimationFrame(()=>window.scrollTo({top:previous.scroll||0,left:0,behavior:'auto'}))}else{setPage('today');requestAnimationFrame(()=>window.scrollTo(0,0))}return}const current=history.current[history.current.length-1];if(current)current.scroll=window.scrollY||0;if(target!==page)history.current.push({page:target,scroll:0});setPage(target);setNoticeOpen(false);setModal(null);requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}))};
 const activityEntry=entry=>({id:newId('activity'),at:new Date().toISOString(),actor,...entry});
 const markDaily=(id,status='done')=>setDaily(current=>({...current,done:[...(current.done||[]).filter(item=>item.id!==id),{id,actor,at:new Date().toISOString(),status}]}));
 const recordTaskStatus=(task,status='done')=>{const at=new Date().toISOString(),statusLabel=status==='done'?'Completed':status==='not-needed'?'Not needed':'Skipped';markDaily(task.id,status);setGarden(current=>{const historyEntry={id:newId('task-history'),taskId:task.id,taskType:task.taskType||task.kind,title:task.title,status,plantId:task.plant?.id||'',spaceId:task.space?.id||task.plant?.spaceId||'',dueDate:task.dueDate||dayKey(),reason:task.reason||'',at,actor,createdAt:at,updatedAt:at,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};const activity=activityEntry({type:'task',title:`${statusLabel}: ${task.title}`,detail:[task.taskType,task.space?.name,task.reason].filter(Boolean).join(' • '),plantId:historyEntry.plantId,spaceId:historyEntry.spaceId});return{...current,reminders:task.manual?(current.reminders||[]).map(reminder=>reminder.taskId===task.id?touchRecord({...reminder,enabled:false},actor):reminder):current.reminders||[],taskHistory:[historyEntry,...(current.taskHistory||[])].slice(0,500),activity:[activity,...(current.activity||[])].slice(0,200)}});showToast(status==='done'?'Task completed.':status==='not-needed'?'Marked not needed.':'Task skipped.')};
 const undoDaily=id=>{setDaily(current=>({...current,done:(current.done||[]).filter(item=>item.id!==id)}));showToast('Task status undone for today.')};
 const snoozeTask=(id,days=1)=>{setDaily(current=>({...current,snoozed:{...(current.snoozed||{}),[id]:plusDays(days)}}));showToast(days===1?'Moved to tomorrow.':`Moved ${days} days.`)};
 const skipTask=id=>{markDaily(id,'skipped');showToast('Seasonal task skipped for this year.')};
 const addReminder=data=>{setGarden(current=>({...current,reminders:[createManualReminder(data,actor),...(current.reminders||[])]}));showToast('Reminder added to the Chore Board.')};
 const addPlant=data=>{const now=new Date().toISOString(),plant={id:newId('plant'),...data,name:data.name.trim(),variety:data.variety?.trim()||'',quantity:Number(data.quantity)||1,successionEnabled:Boolean(data.successionEnabled),successionDays:Number(data.successionDays)||14,lastWatered:null,lastSoilCheck:null,lastFertilized:null,moisture:'unknown',archived:false,createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};let destination='Unassigned';setGarden(current=>{const space=current.spaces.find(item=>item.id===plant.spaceId);destination=space?.name||'Unassigned';return{...current,profile:{...current.profile,setupComplete:true},plants:[...current.plants,plant],succession:plant.successionEnabled?[...(current.succession||[]),createSuccession(plant,plant.successionDays,plant.quantity)]:current.succession||[],activity:[activityEntry({type:'planted',title:`Added ${plant.name}`,detail:[plant.variety||'Variety not entered',destination,plant.successionEnabled?'succession plan created':''].filter(Boolean).join(' • '),plantId:plant.id,spaceId:plant.spaceId}),...(current.activity||[])].slice(0,200)}});setConfirmation({name:plant.name,variety:plant.variety,quantity:plant.quantity,spaceId:plant.spaceId,spaceName:destination})};
 const addSpace=data=>{const now=new Date().toISOString(),space={id:newId('space'),...data,name:data.name.trim(),capacity:Number(data.capacity)||12,hidden:false,photo:'',notes:'',createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};setGarden(current=>({...current,spaces:[...current.spaces,space],activity:[activityEntry({type:'space',title:`Created ${space.name}`,detail:'Growing space added.',spaceId:space.id}),...current.activity]}))};
 const saveSpace=(id,data)=>setGarden(current=>({...current,spaces:current.spaces.map(space=>space.id===id?touchRecord({...space,...data},actor):space)}));
 const manageSpace=(action,id)=>setGarden(current=>{const spaces=[...(current.spaces||[])],index=spaces.findIndex(space=>space.id===id);if(index<0)return current;if(action==='up'&&index>0)[spaces[index-1],spaces[index]]=[spaces[index],spaces[index-1]];else if(action==='down'&&index<spaces.length-1)[spaces[index+1],spaces[index]]=[spaces[index],spaces[index+1]];else if(action==='hide'||action==='show')spaces[index]=touchRecord({...spaces[index],hidden:action==='hide'},actor);else if(action==='remove')spaces[index]=softDelete(spaces[index],actor);return{...current,spaces}});
 const recordSoilCheck=(id,moisture)=>{const plant=garden.plants.find(item=>item.id===id),now=new Date().toISOString(),space=garden.spaces.find(item=>item.id===plant?.spaceId);setGarden(current=>({...current,plants:current.plants.map(item=>item.id===id?touchRecord({...item,moisture,lastSoilCheck:now},actor):item),activity:[activityEntry({type:'soil',title:`Checked ${plant?.name||'plant'} soil`,detail:[space?.name,`soil felt ${moisture}`,moisture==='dry'?'watering recommended':'no watering needed'].filter(Boolean).join(' • '),plantId:id,spaceId:plant?.spaceId}),...current.activity]}));if(moisture!=='dry')markDaily(`soil-${id}`)};
 const recordWatered=id=>{const now=new Date().toISOString(),plant=garden.plants.find(item=>item.id===id),space=garden.spaces.find(item=>item.id===plant?.spaceId);setGarden(current=>({...current,plants:current.plants.map(item=>item.id===id?touchRecord({...item,lastWatered:now,lastSoilCheck:now,moisture:'damp'},actor):item),activity:[activityEntry({type:'watered',title:`Watered ${plant?.name||'plant'}`,detail:[space?.name,'watering recorded after dry-soil check'].filter(Boolean).join(' • '),plantId:id,spaceId:plant?.spaceId}),...current.activity]}));markDaily(`soil-${id}`);markDaily(`water-${id}`)};
 const logGreenhouseCheck=data=>{const now=new Date().toISOString();setGarden(current=>({...current,greenhouseReadings:[{id:newId('reading'),...data,at:now,actor},...current.greenhouseReadings]}));markDaily('greenhouse-check')};
 const addSeed=data=>setGarden(current=>({...current,seeds:[...current.seeds,{id:newId('seed'),...data}]}));
 const savePacket=data=>setGarden(current=>({...current,seedPackets:[{id:newId('packet'),...data},...current.seedPackets]}));
 const deletePacket=id=>setGarden(current=>({...current,seedPackets:current.seedPackets.filter(item=>item.id!==id)}));
 const updatePlantStage=id=>setGarden(current=>({...current,plants:current.plants.map(plant=>plant.id===id?touchRecord({...plant,stage:nextStage(plant.stage),stageUpdatedAt:new Date().toISOString()},actor):plant)}));
 const savePlant=(id,data)=>setGarden(current=>({...current,plants:current.plants.map(plant=>plant.id===id?touchRecord({...plant,...data},actor):plant)}));
 const archivePlant=id=>{setGarden(current=>({...current,plants:current.plants.map(plant=>plant.id===id?touchRecord({...plant,archived:true},actor):plant)}));setModal(null)};
 const deletePlant=id=>{setGarden(current=>({...current,plants:current.plants.map(plant=>plant.id===id?softDelete(plant,actor):plant)}));setModal(null)};
 const saveHarvest=(id,data)=>setGarden(current=>({...current,harvests:[{id:newId('harvest'),plantId:id,...data,at:new Date().toISOString(),actor},...current.harvests]}));
 const saveProblem=(id,data)=>setGarden(current=>({...current,problems:[{id:newId('problem'),plantId:id,...data,status:'open',at:new Date().toISOString(),actor},...current.problems]}));
 const resolveProblem=id=>setGarden(current=>({...current,problems:current.problems.map(problem=>problem.id===id?{...problem,status:'resolved'}:problem)}));
 const recordHarvest=id=>setModal({type:'managePlant',plant:garden.plants.find(plant=>plant.id===id),view:'harvest'});
 const scheduleSuccession=(id,completed=false)=>{const plant=garden.plants.find(item=>item.id===id);if(!plant)return;setGarden(current=>({...current,succession:[...(current.succession||[]).map(item=>completed&&item.plantId===id?{...item,status:'done'}:item),createSuccession(plant,plant.successionDays||14,plant.quantity||6)]}))};
 const completePlanItem=item=>{if(item.type==='succession')setGarden(current=>({...current,succession:current.succession.map(entry=>entry.id===item.id?{...entry,status:'done'}:entry)}));showToast('Plan item completed.')};
 const saveYearPlan=plan=>setGarden(current=>({...current,yearPlan:plan}));
 const addTray=data=>setGarden(current=>({...current,trays:[...current.trays,{id:newId('tray'),...data}]}));
 const addLight=data=>setGarden(current=>({...current,growLights:[...current.growLights,{id:newId('light'),...data}]}));
 const toggleLight=id=>setGarden(current=>({...current,growLights:current.growLights.map(light=>light.id===id?{...light,checkedToday:!light.checkedToday}:light)}));
 const startHardening=plantId=>setGarden(current=>({...current,hardeningPlans:[{id:newId('hardening'),plantId,plantName:current.plants.find(plant=>plant.id===plantId)?.name,day:1,complete:false},...current.hardeningPlans]}));
 const advanceHardening=id=>setGarden(current=>({...current,hardeningPlans:current.hardeningPlans.map(plan=>plan.id===id?{...plan,day:plan.day+1,complete:plan.day>=7}:plan)}));
 const saveHydroPod=data=>setGarden(current=>({...current,hydroPods:[...current.hydroPods,{id:newId('pod'),...data}]}));
 const recommendations=useMemo(()=>getCropRecommendations(new Date()),[]);
 const weatherAlert=useMemo(()=>gardenWeatherAlert(weatherState.weather),[weatherState.weather]);
 const seasonMode=useMemo(()=>getSeasonMode(new Date()),[]);
 const activeGarden=useMemo(()=>({...garden,spaces:garden.spaces.filter(space=>!space.hidden&&!space.deletedAt),plants:garden.plants.filter(plant=>!plant.archived&&!plant.deletedAt)}),[garden]);
 const tasks=useMemo(()=>buildYearRoundTasks({garden:activeGarden,weather:weatherState.weather,date:new Date()}),[activeGarden,weatherState.weather]);
 const todayTasks=tasks.filter(task=>(!task.dueDate||task.dueDate<=dayKey())&&(!daily.snoozed?.[task.id]||daily.snoozed[task.id]<=dayKey()));
 const boardTasks=tasks.filter(task=>!daily.snoozed?.[task.id]||daily.snoozed[task.id]<=dayKey());
 const tomorrowTasks=useMemo(()=>{const date=new Date();date.setDate(date.getDate()+1);const tomorrow=date.toISOString().slice(0,10);return buildYearRoundTasks({garden:activeGarden,weather:weatherState.weather,date}).filter(task=>!task.dueDate||task.dueDate<=tomorrow)},[activeGarden,weatherState.weather]);
 const timeline=useMemo(()=>buildTimeline(activeGarden),[activeGarden]);
 const openTask=task=>{if(task.kind==='setup'||task.kind==='setupPlant')setModal({type:'addPlant'});else if(task.kind==='soil')setModal({type:'soilCheck',plant:task.plant,crop:task.crop});else if(task.kind==='seasonalGuide')setModal({type:'seasonalChore',task});else if(task.kind==='navigate')navigate(task.target);else if(task.kind==='greenhouse')setModal({type:'greenhouseCheck'});else if(task.kind==='plantDetail'&&task.plant)setModal({type:'managePlant',plant:task.plant});else if(task.kind==='weather'&&task.weatherAlert)setModal({type:'weatherAlert',alert:{label:task.weatherAlert.type,title:task.weatherAlert.what,detail:`${task.weatherAlert.why} ${task.weatherAlert.when}`,reading:task.weatherAlert.severity},weather:weatherState.weather});else if(task.kind==='manual'&&task.plant)setModal({type:'managePlant',plant:task.plant});else showToast(task.reason||'This reminder has no additional screen.')};
 const openSpace=id=>{if(id)sessionStorage.setItem('garden-open-bed',id);navigate('garden')};
 const controlModal=modal?.type==='managePlant',navPage=['indoor','memory','seed-tools','chores','profile','labels'].includes(page)?'more':page;
 const viewConfirmedBed=()=>{if(confirmation?.spaceId)sessionStorage.setItem('garden-open-bed',confirmation.spaceId);setConfirmation(null);navigate('garden')};
 const addAnother=()=>{const spaceId=confirmation?.spaceId;setConfirmation(null);setModal({type:'addPlant',spaceId})};
 return <div className="site-stage"><div className={`app-shell page-${page}`}>
  {page==='today'&&<TodayWorkspace profile={garden.profile} garden={garden} tasks={boardTasks} tomorrowTasks={tomorrowTasks} dailyDone={daily.done} noticeOpen={noticeOpen} setNoticeOpen={setNoticeOpen} weatherState={weatherState} weatherAlert={weatherAlert} activity={garden.activity} seasonMode={seasonMode} navigate={navigate} onTask={openTask}/>} 
  {page==='chores'&&<ChoreBoard todayTasks={boardTasks} dailyDone={daily.done} onOpen={openTask} onOpenSpace={openSpace} onStatus={recordTaskStatus} onUndo={undoDaily} navigate={navigate} garden={activeGarden} onAddReminder={addReminder}/>} 
  {page==='garden'&&<BedWorkspace garden={garden} setModal={setModal} manageSpace={manageSpace} saveSpace={saveSpace}/>} 
  {page==='plan-plant'&&<PlanPlantHub recommendations={recommendations} setModal={setModal} garden={garden} timeline={timeline} completePlanItem={completePlanItem} updatePlantStage={updatePlantStage} recordHarvest={recordHarvest} scheduleSuccession={scheduleSuccession} saveYearPlan={saveYearPlan}/>} 
  {page==='center'&&<GardenCenter garden={garden} navigate={navigate}/>} {page==='more'&&<MoreHub garden={garden} navigate={navigate}/>} {page==='profile'&&<SettingsCenter garden={garden}/>} 
  {page==='indoor'&&<IndoorCenter garden={garden} navigate={navigate} addTray={addTray} addLight={addLight} toggleLight={toggleLight} startHardening={startHardening} advanceHardening={advanceHardening} saveHydroPod={saveHydroPod} setModal={setModal}/>} 
  {page==='memory'&&<GardenMemory garden={garden} navigate={navigate} resolveProblem={resolveProblem}/>} {page==='seed-tools'&&<SeedTools garden={garden} navigate={navigate} savePacket={savePacket} deletePacket={deletePacket}/>} {page==='labels'&&<LabelCounter garden={garden} navigate={navigate}/>} 
  <BottomNav page={navPage} navigate={navigate}/>
  {controlModal&&<GardenControls modal={modal} garden={garden} close={()=>setModal(null)} savePlant={savePlant} archivePlant={archivePlant} deletePlant={deletePlant} saveHarvest={saveHarvest} saveProblem={saveProblem}/>} 
  {modal&&!controlModal&&<ClearDetailModal modal={modal} close={()=>setModal(null)} garden={garden} addPlant={addPlant} addSpace={addSpace} recordSoilCheck={recordSoilCheck} recordWatered={recordWatered} logGreenhouseCheck={logGreenhouseCheck} setModal={setModal} completeTask={id=>markDaily(id,'done')} snoozeTask={snoozeTask} skipTask={skipTask}/>} 
  {confirmation&&<PlantConfirmation data={confirmation} onClose={()=>setConfirmation(null)} onView={viewConfirmedBed} onAdd={addAnother}/>} {toast&&<div className="toast">{toast}</div>}
 </div></div>;
}
