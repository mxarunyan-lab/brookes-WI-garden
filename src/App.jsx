import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav, DetailModal, MenuDrawer, PlantScreen, ProfileScreen } from './screens.jsx';
import { GardenWorkspace, TodayWorkspace } from './WorkspaceScreens.jsx';
import PlannerScreen from './PlannerScreen.jsx';
import GardenControls from './GardenControls.jsx';
import { getCropRecommendations, newId, starterGarden } from './data.js';
import { gardenWeatherAlert, useGreenBayWeather } from './weather.js';
import { buildYearRoundTasks, getSeasonMode, migrateGarden } from './yearRoundEngine.js';
import { buildTimeline, createSuccession, nextStage, normalizePlanning } from './planning.js';

const GARDEN_KEY = 'brookes-garden-state-v2';
const PAGE_KEY = 'brookes-garden-page-v2';
const DAILY_KEY = 'brookes-garden-daily-v4';

function safeLoad(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function dayKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
function plusDays(days) { const date = new Date(); date.setDate(date.getDate()+days); return date.toISOString().slice(0,10); }

function App() {
  const [page, setPage] = useState(() => localStorage.getItem(PAGE_KEY) || 'today');
  const [garden, setGarden] = useState(() => normalizePlanning(migrateGarden(safeLoad(GARDEN_KEY, starterGarden), starterGarden)));
  const [daily, setDaily] = useState(() => {
    const stored = safeLoad(DAILY_KEY, { date: dayKey(), done: [], snoozed: {} });
    return stored.date === dayKey() ? { ...stored, snoozed: stored.snoozed || {} } : { date: dayKey(), done: [], snoozed: {} };
  });
  const [filter, setFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const weatherState = useGreenBayWeather();

  useEffect(() => localStorage.setItem(PAGE_KEY, page), [page]);
  useEffect(() => localStorage.setItem(GARDEN_KEY, JSON.stringify(garden)), [garden]);
  useEffect(() => localStorage.setItem(DAILY_KEY, JSON.stringify(daily)), [daily]);

  const showToast = (message) => { setToast(message); window.clearTimeout(window.__gardenToast); window.__gardenToast = window.setTimeout(()=>setToast(''),2600); };
  const navigate = (next) => { setPage(next); setDrawerOpen(false); setNoticeOpen(false); window.scrollTo({top:0,behavior:'smooth'}); };
  const activityEntry = (entry) => ({ id:newId('activity'), at:new Date().toISOString(), ...entry });
  const addActivity = (entry) => setGarden((current)=>({...current,activity:[activityEntry(entry),...(current.activity||[])].slice(0,200)}));
  const markDaily = (id, done=true) => setDaily((current)=>({ ...current, done: done ? Array.from(new Set([...(current.done||[]),id])) : (current.done||[]).filter((item)=>item!==id) }));
  const snoozeTask = (id, days=1) => { setDaily((current)=>({...current,snoozed:{...(current.snoozed||{}),[id]:plusDays(days)}})); setNoticeOpen(false); showToast(days===1?'Moved to tomorrow.':`Snoozed for ${days} days.`); };

  const addPlant = (plant) => {
    const created={id:newId('plant'),name:plant.name.trim(),variety:plant.variety?.trim()||'',cropId:plant.cropId||'',spaceId:plant.spaceId,stage:plant.stage||'Growing',plantedAt:plant.plantedAt||new Date().toISOString().slice(0,10),batchName:plant.batchName||'Batch 1',quantity:Number(plant.quantity)||1,successionEnabled:Boolean(plant.successionEnabled),successionDays:Number(plant.successionDays)||14,lastWatered:null,lastSoilCheck:null,lastFertilized:null,moisture:'unknown',notes:'',archived:false};
    setGarden((current)=>({...current,profile:{...current.profile,setupComplete:true},plants:[...current.plants,created],succession:created.successionEnabled?[...(current.succession||[]),createSuccession(created,created.successionDays,created.quantity)]:current.succession||[],activity:[activityEntry({type:'planted',title:`Added ${created.name}`,detail:`${created.batchName} is now tracked.`,plantId:created.id}),...(current.activity||[])].slice(0,200)}));
    showToast(`${created.name} is now in the garden.`);
  };
  const addSpace = (space) => { const created={id:newId('space'),name:space.name.trim(),type:space.type||'bed',capacity:Number(space.capacity)||12,hidden:false}; setGarden((current)=>({...current,spaces:[...current.spaces,created],activity:[activityEntry({type:'space',title:`Added ${created.name}`,detail:'New growing space created.'}),...(current.activity||[])].slice(0,200)})); showToast(`${created.name} was added.`); };
  const manageSpace = (action,spaceId) => {
    const space=garden.spaces.find((item)=>item.id===spaceId); if(!space)return; const plantCount=garden.plants.filter((plant)=>plant.spaceId===spaceId&&!plant.archived).length;
    if(action==='remove'){ if(plantCount){showToast(`Move or archive the ${plantCount} tracked plant${plantCount===1?'':'s'} first.`);return;} if(!window.confirm(`Remove ${space.name}?`))return; setGarden((current)=>({...current,spaces:current.spaces.filter((item)=>item.id!==spaceId)})); showToast(`${space.name} removed.`); return; }
    if(action==='hide'||action==='show'){const hidden=action==='hide';setGarden((current)=>({...current,spaces:current.spaces.map((item)=>item.id===spaceId?{...item,hidden}:item)}));showToast(hidden?`${space.name} hidden for now.`:`${space.name} restored.`);return;}
    setGarden((current)=>{const visible=current.spaces.filter((item)=>!item.hidden),hidden=current.spaces.filter((item)=>item.hidden),index=visible.findIndex((item)=>item.id===spaceId),target=action==='up'?index-1:index+1;if(index<0||target<0||target>=visible.length)return current;[visible[index],visible[target]]=[visible[target],visible[index]];return{...current,spaces:[...visible,...hidden]};});
  };
  const updateProfile=(profile)=>{setGarden((current)=>({...current,profile:{...current.profile,...profile}}));showToast('Garden settings saved.');};
  const recordSoilCheck=(plantId,moisture)=>{const plant=garden.plants.find((item)=>item.id===plantId),now=new Date().toISOString();setGarden((current)=>({...current,plants:current.plants.map((item)=>item.id===plantId?{...item,moisture,lastSoilCheck:now}:item),activity:[activityEntry({type:'soil',title:`Checked ${plant?.name||'plant'} soil`,detail:`Soil felt ${moisture}.`,plantId}),...(current.activity||[])].slice(0,200)}));if(moisture!=='dry')markDaily(`soil-${plantId}`);};
  const recordWatered=(plantId)=>{const plant=garden.plants.find((item)=>item.id===plantId),now=new Date().toISOString();setGarden((current)=>({...current,plants:current.plants.map((item)=>item.id===plantId?{...item,moisture:'damp',lastSoilCheck:now,lastWatered:now}:item),activity:[activityEntry({type:'watered',title:`Watered ${plant?.name||'plant'}`,detail:'Watering recorded.',plantId}),...(current.activity||[])].slice(0,200)}));markDaily(`soil-${plantId}`);showToast('Watering recorded.');};
  const logGreenhouseCheck=({temperature,humidity,note})=>{const reading={id:newId('reading'),at:new Date().toISOString(),temperature:Number(temperature)||null,humidity:Number(humidity)||null,note:note||''};setGarden((current)=>({...current,greenhouseReadings:[reading,...(current.greenhouseReadings||[])].slice(0,100),activity:[activityEntry({type:'greenhouse',title:'Greenhouse check',detail:[temperature?`${temperature}°F`:'',humidity?`${humidity}% humidity`:'',note].filter(Boolean).join(' • ')||'Conditions checked.'}),...(current.activity||[])].slice(0,200)}));markDaily('greenhouse-check');showToast('Greenhouse conditions saved.');};
  const addSeed=(seed)=>{const created={id:newId('seed'),cropId:seed.cropId,name:seed.name,variety:seed.variety?.trim()||'',packetYear:Number(seed.packetYear)||new Date().getFullYear(),quantity:Number(seed.quantity)||0,addedAt:new Date().toISOString()};setGarden((current)=>({...current,seeds:[...(current.seeds||[]),created]}));showToast(`${created.name} added to the seed box.`);};
  const updatePlantStage=(plantId)=>{const plant=garden.plants.find((item)=>item.id===plantId);if(!plant)return;const stage=nextStage(plant.stage);setGarden((current)=>({...current,plants:current.plants.map((item)=>item.id===plantId?{...item,stage,stageUpdatedAt:new Date().toISOString()}:item)}));showToast(`${plant.name} is now ${stage}.`);};
  const savePlant=(plantId,draft)=>{const old=garden.plants.find((item)=>item.id===plantId);setGarden((current)=>({...current,plants:current.plants.map((item)=>item.id===plantId?{...item,...draft,quantity:Number(draft.quantity)||1,stageUpdatedAt:item.stage!==draft.stage?new Date().toISOString():item.stageUpdatedAt}:item),activity:[activityEntry({type:'plant',title:`Updated ${draft.name}`,detail:`Stage: ${draft.stage} • ${current.spaces.find((space)=>space.id===draft.spaceId)?.name||'Unassigned'}`,plantId}),...(current.activity||[])].slice(0,200)}));showToast(`${old?.name||'Plant'} updated.`);};
  const archivePlant=(plantId)=>{const plant=garden.plants.find((item)=>item.id===plantId);if(!plant)return;setGarden((current)=>({...current,plants:current.plants.map((item)=>item.id===plantId?{...item,archived:true,stage:item.stage==='Failed'?'Failed':'Finished',archivedAt:new Date().toISOString()}:item),activity:[activityEntry({type:'archive',title:`Archived ${plant.name}`,detail:'Removed from active care tasks but kept in garden history.',plantId}),...(current.activity||[])].slice(0,200)}));setModal(null);showToast(`${plant.name} archived.`);};
  const deletePlant=(plantId)=>{const plant=garden.plants.find((item)=>item.id===plantId);if(!plant||!window.confirm(`Delete ${plant.name}? This removes its active record.`))return;setGarden((current)=>({...current,plants:current.plants.filter((item)=>item.id!==plantId),succession:(current.succession||[]).filter((item)=>item.plantId!==plantId)}));setModal(null);showToast(`${plant.name} deleted.`);};
  const saveHarvest=(plantId,data)=>{const plant=garden.plants.find((item)=>item.id===plantId);if(!plant)return;const harvest={id:newId('harvest'),plantId,name:plant.name,amount:Number(data.amount)||0,unit:data.unit,quality:data.quality,note:data.note,growAgain:data.growAgain,at:new Date().toISOString()};setGarden((current)=>({...current,harvests:[harvest,...(current.harvests||[])],plants:current.plants.map((item)=>item.id===plantId?{...item,stage:'Producing',lastHarvested:harvest.at,growAgain:data.growAgain}:item),activity:[activityEntry({type:'harvest',title:`Harvested ${plant.name}`,detail:`${harvest.amount} ${harvest.unit} • ${harvest.quality}${harvest.note?` • ${harvest.note}`:''}`,plantId}),...(current.activity||[])].slice(0,200)}));showToast(`${plant.name} harvest saved.`);};
  const saveProblem=(plantId,data)=>{const plant=garden.plants.find((item)=>item.id===plantId);const problem={id:newId('problem'),plantId,type:data.type,severity:data.severity,note:data.note,status:'open',at:new Date().toISOString()};setGarden((current)=>({...current,problems:[problem,...(current.problems||[])],activity:[activityEntry({type:'problem',title:`${data.type}: ${plant?.name||'Plant'}`,detail:`${data.severity} • ${data.note}`,plantId}),...(current.activity||[])].slice(0,200)}));showToast('Problem record saved.');};
  const recordHarvest=(plantId)=>setModal({type:'managePlant',plant:garden.plants.find((item)=>item.id===plantId),view:'harvest'});
  const scheduleSuccession=(plantId,completedCurrent=false)=>{const plant=garden.plants.find((item)=>item.id===plantId);if(!plant)return;const next=createSuccession(plant,plant.successionDays||14,plant.quantity||6);setGarden((current)=>({...current,succession:[...(current.succession||[]).map((item)=>completedCurrent&&item.plantId===plantId&&item.status!=='done'?{...item,status:'done'}:item),next]}));showToast(`Next ${plant.name} batch scheduled.`);};
  const completePlanItem=(item)=>{if(item.type==='succession')setGarden((current)=>({...current,succession:(current.succession||[]).map((entry)=>entry.id===item.id?{...entry,status:'done'}:entry)}));addActivity({type:'plan',title:`Completed: ${item.title}`,detail:item.detail||'Plan item completed.'});showToast('Plan item completed.');};

  const cropRecommendations=useMemo(()=>getCropRecommendations(new Date()),[]);
  const weatherAlert=useMemo(()=>gardenWeatherAlert(weatherState.weather),[weatherState.weather]);
  const seasonMode=useMemo(()=>getSeasonMode(new Date()),[]);
  const activeGarden=useMemo(()=>({...garden,spaces:garden.spaces.filter((space)=>!space.hidden),plants:garden.plants.filter((plant)=>!plant.archived)}),[garden]);
  const allTasks=useMemo(()=>buildYearRoundTasks({garden:activeGarden,weather:weatherState.weather,date:new Date()}),[activeGarden,weatherState.weather]);
  const todayTasks=allTasks.filter((task)=>{const until=daily.snoozed?.[task.id];return !until||until<=dayKey();});
  const timeline=useMemo(()=>buildTimeline(activeGarden),[activeGarden]);
  const openTask=(task)=>{if(task.kind==='setup')setModal({type:'addMenu'});if(task.kind==='setupPlant')setModal({type:'addPlant'});if(task.kind==='soil')setModal({type:'soilCheck',plant:task.plant});if(task.kind==='navigate')navigate(task.target);if(task.kind==='greenhouse')setModal({type:'greenhouseCheck'});if(task.kind==='plantDetail')setModal({type:'managePlant',plant:task.plant});};

  const controlModal=modal?.type==='managePlant';
  return <div className="site-stage"><div className={`app-shell page-${page}`}>
    {page==='today'&&<TodayWorkspace profile={garden.profile} tasks={todayTasks} dailyDone={daily.done||[]} onTask={openTask} onSnooze={(id)=>snoozeTask(id,1)} onMenu={()=>setDrawerOpen(true)} noticeOpen={noticeOpen} setNoticeOpen={setNoticeOpen} weatherState={weatherState} weatherAlert={weatherAlert} activity={garden.activity||[]} setModal={setModal} seasonMode={seasonMode}/>} 
    {page==='plant'&&<PlantScreen filter={filter} setFilter={setFilter} recommendations={cropRecommendations} setModal={setModal} navigate={navigate}/>} 
    {page==='garden'&&<GardenWorkspace garden={garden} setModal={setModal} manageSpace={manageSpace}/>} 
    {page==='learn'&&<PlannerScreen garden={garden} timeline={timeline} addSeed={addSeed} completePlanItem={completePlanItem} updatePlantStage={updatePlantStage} recordHarvest={recordHarvest} scheduleSuccession={scheduleSuccession}/>} 
    {page==='profile'&&<ProfileScreen profile={garden.profile} updateProfile={updateProfile}/>} 
    <BottomNav page={page} navigate={navigate}/>{drawerOpen&&<MenuDrawer close={()=>setDrawerOpen(false)} navigate={navigate}/>} 
    {controlModal&&<GardenControls modal={modal} garden={garden} close={()=>setModal(null)} savePlant={savePlant} archivePlant={archivePlant} deletePlant={deletePlant} saveHarvest={saveHarvest} saveProblem={saveProblem}/>} 
    {modal&&!controlModal&&<DetailModal key={`${modal.type}-${modal.plant?.id||modal.space?.id||modal.crop?.id||''}`} modal={modal} close={()=>setModal(null)} garden={garden} addPlant={addPlant} addSpace={addSpace} recordSoilCheck={recordSoilCheck} recordWatered={recordWatered} logGreenhouseCheck={logGreenhouseCheck} setModal={setModal}/>} 
    {toast&&<div className="toast" role="status">{toast}</div>}
  </div></div>;
}
export default App;
