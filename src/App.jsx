import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav, DetailModal, MenuDrawer, PlantScreen, ProfileScreen } from './screens.jsx';
import { GardenWorkspace, TodayWorkspace } from './WorkspaceScreens.jsx';
import PlannerScreen from './PlannerScreen.jsx';
import { getCropRecommendations, newId, starterGarden } from './data.js';
import { gardenWeatherAlert, useGreenBayWeather } from './weather.js';
import { buildYearRoundTasks, getSeasonMode, migrateGarden } from './yearRoundEngine.js';
import { buildTimeline, createSuccession, nextStage, normalizePlanning } from './planning.js';

const GARDEN_KEY = 'brookes-garden-state-v2';
const PAGE_KEY = 'brookes-garden-page-v2';
const DAILY_KEY = 'brookes-garden-daily-v3';

function safeLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function dayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function App() {
  const [page, setPage] = useState(() => localStorage.getItem(PAGE_KEY) || 'today');
  const [garden, setGarden] = useState(() => normalizePlanning(migrateGarden(safeLoad(GARDEN_KEY, starterGarden), starterGarden)));
  const [daily, setDaily] = useState(() => {
    const stored = safeLoad(DAILY_KEY, { date: dayKey(), done: [], snoozed: [] });
    return stored.date === dayKey() ? { ...stored, snoozed: stored.snoozed || [] } : { date: dayKey(), done: [], snoozed: [] };
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

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__gardenToast);
    window.__gardenToast = window.setTimeout(() => setToast(''), 2600);
  };
  const navigate = (next) => { setPage(next); setDrawerOpen(false); setNoticeOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const activityEntry = (entry) => ({ id: newId('activity'), at: new Date().toISOString(), ...entry });
  const addActivity = (entry) => setGarden((current) => ({ ...current, activity: [activityEntry(entry), ...(current.activity || [])].slice(0, 150) }));
  const markDaily = (id, done = true) => setDaily((current) => {
    const base = current.date === dayKey() ? current : { date: dayKey(), done: [], snoozed: [] };
    return { ...base, done: done ? Array.from(new Set([...base.done, id])) : base.done.filter((item) => item !== id) };
  });
  const snoozeTask = (id) => {
    setDaily((current) => ({ ...current, snoozed: Array.from(new Set([...(current.snoozed || []), id])) }));
    setNoticeOpen(false);
    showToast('Moved out of today. It will return tomorrow.');
  };

  const addPlant = (plant) => {
    const created = { id: newId('plant'), name: plant.name.trim(), variety: plant.variety?.trim() || '', cropId: plant.cropId || '', spaceId: plant.spaceId, stage: plant.stage || 'Growing', plantedAt: plant.plantedAt || new Date().toISOString().slice(0, 10), batchName: plant.batchName || 'Batch 1', quantity: Number(plant.quantity) || 1, successionEnabled: Boolean(plant.successionEnabled), successionDays: Number(plant.successionDays) || 14, lastWatered: null, lastSoilCheck: null, lastFertilized: null, moisture: 'unknown', notes: '' };
    setGarden((current) => ({ ...current, profile: { ...current.profile, setupComplete: true }, plants: [...current.plants, created], succession: created.successionEnabled ? [...(current.succession || []), createSuccession(created, created.successionDays, created.quantity)] : current.succession || [], activity: [activityEntry({ type: 'planted', title: `Added ${created.name}`, detail: `${created.batchName} is now tracked.`, plantId: created.id }), ...(current.activity || [])].slice(0, 150) }));
    showToast(`${created.name} is now in the garden.`);
    return created;
  };
  const addSpace = (space) => {
    const created = { id: newId('space'), name: space.name.trim(), type: space.type || 'bed', capacity: Number(space.capacity) || 12, hidden: false };
    setGarden((current) => ({ ...current, profile: { ...current.profile, setupComplete: true }, spaces: [...current.spaces, created], activity: [activityEntry({ type: 'space', title: `Added ${created.name}`, detail: 'New growing space created.' }), ...(current.activity || [])].slice(0, 150) }));
    showToast(`${created.name} was added.`);
  };
  const manageSpace = (action, spaceId) => {
    const space = garden.spaces.find((item) => item.id === spaceId);
    if (!space) return;
    const plantCount = garden.plants.filter((plant) => plant.spaceId === spaceId).length;
    if (action === 'remove') {
      if (plantCount) { showToast(`Move or remove the ${plantCount} tracked plant${plantCount === 1 ? '' : 's'} first.`); return; }
      if (!window.confirm(`Remove ${space.name}? This cannot be undone.`)) return;
      setGarden((current) => ({ ...current, spaces: current.spaces.filter((item) => item.id !== spaceId), activity: [activityEntry({ type: 'space', title: `Removed ${space.name}`, detail: 'Unused garden space removed.' }), ...(current.activity || [])].slice(0, 150) }));
      showToast(`${space.name} removed.`);
      return;
    }
    if (action === 'hide' || action === 'show') {
      const hidden = action === 'hide';
      setGarden((current) => ({ ...current, spaces: current.spaces.map((item) => item.id === spaceId ? { ...item, hidden } : item) }));
      showToast(hidden ? `${space.name} hidden for now.` : `${space.name} restored.`);
      return;
    }
    setGarden((current) => {
      const visible = current.spaces.filter((item) => !item.hidden);
      const hidden = current.spaces.filter((item) => item.hidden);
      const index = visible.findIndex((item) => item.id === spaceId);
      const target = action === 'up' ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= visible.length) return current;
      [visible[index], visible[target]] = [visible[target], visible[index]];
      return { ...current, spaces: [...visible, ...hidden] };
    });
  };
  const updateProfile = (profile) => { setGarden((current) => ({ ...current, profile: { ...current.profile, ...profile, setupComplete: profile.setupComplete ?? current.profile.setupComplete } })); showToast('Garden settings saved.'); };
  const recordSoilCheck = (plantId, moisture) => {
    const plant = garden.plants.find((item) => item.id === plantId); const now = new Date().toISOString();
    setGarden((current) => ({ ...current, plants: current.plants.map((item) => item.id === plantId ? { ...item, moisture, lastSoilCheck: now } : item), activity: [activityEntry({ type: 'soil', title: `Checked ${plant?.name || 'plant'} soil`, detail: `Soil felt ${moisture}.`, plantId }), ...(current.activity || [])].slice(0, 150) }));
    if (moisture !== 'dry') markDaily(`soil-${plantId}`, true);
  };
  const recordWatered = (plantId) => {
    const plant = garden.plants.find((item) => item.id === plantId); const now = new Date().toISOString();
    setGarden((current) => ({ ...current, plants: current.plants.map((item) => item.id === plantId ? { ...item, moisture: 'damp', lastSoilCheck: now, lastWatered: now } : item), activity: [activityEntry({ type: 'watered', title: `Watered ${plant?.name || 'plant'}`, detail: 'Watering recorded.', plantId }), ...(current.activity || [])].slice(0, 150) }));
    markDaily(`soil-${plantId}`, true); showToast('Watering recorded.');
  };
  const logGreenhouseCheck = ({ temperature, humidity, note }) => { addActivity({ type: 'greenhouse', title: 'Greenhouse check', detail: [temperature ? `${temperature}°F` : '', humidity ? `${humidity}% humidity` : '', note].filter(Boolean).join(' • ') || 'Conditions checked.' }); markDaily('greenhouse-check', true); showToast('Greenhouse conditions saved.'); };
  const addSeed = (seed) => { const created = { id: newId('seed'), cropId: seed.cropId, name: seed.name, variety: seed.variety?.trim() || '', packetYear: Number(seed.packetYear) || new Date().getFullYear(), quantity: Number(seed.quantity) || 0, addedAt: new Date().toISOString() }; setGarden((current) => ({ ...current, seeds: [...(current.seeds || []), created], activity: [activityEntry({ type: 'seed', title: `Added ${created.name} seeds`, detail: `${created.quantity} estimated seeds • packet ${created.packetYear}` }), ...(current.activity || [])].slice(0, 150) })); showToast(`${created.name} added to the seed box.`); };
  const updatePlantStage = (plantId) => { const plant = garden.plants.find((item) => item.id === plantId); if (!plant) return; const stage = nextStage(plant.stage); setGarden((current) => ({ ...current, plants: current.plants.map((item) => item.id === plantId ? { ...item, stage, stageUpdatedAt: new Date().toISOString() } : item), activity: [activityEntry({ type: 'stage', title: `${plant.name} advanced to ${stage}`, detail: `${plant.batchName || 'Current batch'} progress updated.`, plantId }), ...(current.activity || [])].slice(0, 150) })); showToast(`${plant.name} is now marked ${stage}.`); };
  const recordHarvest = (plantId) => { const plant = garden.plants.find((item) => item.id === plantId); if (!plant) return; const harvest = { id: newId('harvest'), plantId, name: plant.name, amount: 1, unit: 'harvest', at: new Date().toISOString() }; setGarden((current) => ({ ...current, harvests: [harvest, ...(current.harvests || [])], plants: current.plants.map((item) => item.id === plantId ? { ...item, stage: 'Producing', lastHarvested: harvest.at } : item), activity: [activityEntry({ type: 'harvest', title: `Harvested ${plant.name}`, detail: `${plant.batchName || 'Current batch'} harvest recorded.`, plantId }), ...(current.activity || [])].slice(0, 150) })); showToast(`${plant.name} harvest recorded.`); };
  const scheduleSuccession = (plantId, completedCurrent = false) => { const plant = garden.plants.find((item) => item.id === plantId); if (!plant) return; const next = createSuccession(plant, plant.successionDays || 14, plant.quantity || 6); setGarden((current) => ({ ...current, plants: current.plants.map((item) => item.id === plantId ? { ...item, successionEnabled: true } : item), succession: [...(current.succession || []).map((item) => completedCurrent && item.plantId === plantId && item.status !== 'done' ? { ...item, status: 'done' } : item), next], activity: [activityEntry({ type: 'succession', title: completedCurrent ? `Started another ${plant.name} batch` : `Scheduled another ${plant.name} batch`, detail: `Next batch planned in ${plant.successionDays || 14} days.`, plantId }), ...(current.activity || [])].slice(0, 150) })); showToast(`Next ${plant.name} batch scheduled.`); };
  const completePlanItem = (item) => { if (item.type === 'succession') setGarden((current) => ({ ...current, succession: (current.succession || []).map((entry) => entry.id === item.id ? { ...entry, status: 'done' } : entry) })); addActivity({ type: 'plan', title: `Completed: ${item.title}`, detail: item.detail || 'Plan item completed.' }); showToast('Plan item completed.'); };

  const cropRecommendations = useMemo(() => getCropRecommendations(new Date()), []);
  const weatherAlert = useMemo(() => gardenWeatherAlert(weatherState.weather), [weatherState.weather]);
  const seasonMode = useMemo(() => getSeasonMode(new Date()), []);
  const activeGarden = useMemo(() => ({ ...garden, spaces: garden.spaces.filter((space) => !space.hidden) }), [garden]);
  const allTasks = useMemo(() => buildYearRoundTasks({ garden: activeGarden, weather: weatherState.weather, date: new Date() }), [activeGarden, weatherState.weather]);
  const todayTasks = allTasks.filter((task) => !(daily.snoozed || []).includes(task.id));
  const timeline = useMemo(() => buildTimeline(garden), [garden]);
  const openTask = (task) => { if (task.kind === 'setup') setModal({ type: 'addMenu' }); if (task.kind === 'setupPlant') setModal({ type: 'addPlant' }); if (task.kind === 'soil') setModal({ type: 'soilCheck', plant: task.plant }); if (task.kind === 'navigate') navigate(task.target); if (task.kind === 'greenhouse') setModal({ type: 'greenhouseCheck' }); if (task.kind === 'plantDetail') setModal({ type: 'plantDetail', plant: task.plant }); };

  return <div className="site-stage"><div className={`app-shell page-${page}`}>
    {page === 'today' && <TodayWorkspace profile={garden.profile} tasks={todayTasks} dailyDone={daily.done} onTask={openTask} onSnooze={snoozeTask} onMenu={() => setDrawerOpen(true)} noticeOpen={noticeOpen} setNoticeOpen={setNoticeOpen} weatherState={weatherState} weatherAlert={weatherAlert} activity={garden.activity || []} setModal={setModal} seasonMode={seasonMode} />}
    {page === 'plant' && <PlantScreen filter={filter} setFilter={setFilter} recommendations={cropRecommendations} setModal={setModal} navigate={navigate} />}
    {page === 'garden' && <GardenWorkspace garden={garden} setModal={setModal} manageSpace={manageSpace} />}
    {page === 'learn' && <PlannerScreen garden={garden} timeline={timeline} addSeed={addSeed} completePlanItem={completePlanItem} updatePlantStage={updatePlantStage} recordHarvest={recordHarvest} scheduleSuccession={scheduleSuccession} />}
    {page === 'profile' && <ProfileScreen profile={garden.profile} updateProfile={updateProfile} />}
    <BottomNav page={page} navigate={navigate} />
    {drawerOpen && <MenuDrawer close={() => setDrawerOpen(false)} navigate={navigate} />}
    {modal && <DetailModal key={`${modal.type}-${modal.plant?.id || modal.space?.id || modal.crop?.id || ''}`} modal={modal} close={() => setModal(null)} garden={garden} addPlant={addPlant} addSpace={addSpace} recordSoilCheck={recordSoilCheck} recordWatered={recordWatered} logGreenhouseCheck={logGreenhouseCheck} setModal={setModal} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div></div>;
}
export default App;
