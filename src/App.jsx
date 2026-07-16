import React, { useEffect, useMemo, useState } from 'react';
import {
  BottomNav,
  DetailModal,
  GardenScreen,
  LearnScreen,
  MenuDrawer,
  PlantScreen,
  ProfileScreen,
  TodayScreen,
} from './screens.jsx';
import { getCropRecommendations, newId, starterGarden } from './data.js';
import { gardenWeatherAlert, useGreenBayWeather } from './weather.js';
import { buildYearRoundTasks, getSeasonMode, migrateGarden } from './yearRoundEngine.js';

const GARDEN_KEY = 'brookes-garden-state-v2';
const PAGE_KEY = 'brookes-garden-page-v2';
const DAILY_KEY = 'brookes-garden-daily-v2';

function safeLoad(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function dayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function App() {
  const [page, setPage] = useState(() => localStorage.getItem(PAGE_KEY) || 'today');
  const [garden, setGarden] = useState(() => migrateGarden(safeLoad(GARDEN_KEY, starterGarden), starterGarden));
  const [daily, setDaily] = useState(() => {
    const stored = safeLoad(DAILY_KEY, { date: dayKey(), done: [] });
    return stored.date === dayKey() ? stored : { date: dayKey(), done: [] };
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

  const navigate = (next) => {
    setPage(next);
    setDrawerOpen(false);
    setNoticeOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markDaily = (id, done = true) => {
    setDaily((current) => {
      const base = current.date === dayKey() ? current : { date: dayKey(), done: [] };
      const nextDone = done
        ? Array.from(new Set([...base.done, id]))
        : base.done.filter((item) => item !== id);
      return { ...base, done: nextDone };
    });
  };

  const activityEntry = (entry) => ({
    id: newId('activity'),
    at: new Date().toISOString(),
    ...entry,
  });

  const addActivity = (entry) => {
    setGarden((current) => ({
      ...current,
      activity: [activityEntry(entry), ...(current.activity || [])].slice(0, 150),
    }));
  };

  const addPlant = (plant) => {
    const created = {
      id: newId('plant'),
      name: plant.name.trim(),
      variety: plant.variety?.trim() || '',
      cropId: plant.cropId || '',
      spaceId: plant.spaceId,
      stage: plant.stage || 'Growing',
      plantedAt: plant.plantedAt || new Date().toISOString().slice(0, 10),
      lastWatered: null,
      lastSoilCheck: null,
      lastFertilized: null,
      moisture: 'unknown',
      notes: '',
    };
    setGarden((current) => ({
      ...current,
      profile: { ...current.profile, setupComplete: true },
      plants: [...current.plants, created],
      activity: [
        activityEntry({ type: 'planted', title: `Added ${created.name}`, detail: 'Now tracked in Brooke’s year-round garden.', plantId: created.id }),
        ...(current.activity || []),
      ].slice(0, 150),
    }));
    showToast(`${created.name} is now in the garden.`);
    return created;
  };

  const addSpace = (space) => {
    const created = {
      id: newId('space'),
      name: space.name.trim(),
      type: space.type || 'bed',
      capacity: Number(space.capacity) || 12,
    };
    setGarden((current) => ({
      ...current,
      profile: { ...current.profile, setupComplete: true },
      spaces: [...current.spaces, created],
      activity: [
        activityEntry({ type: 'space', title: `Added ${created.name}`, detail: 'New year-round growing space created.' }),
        ...(current.activity || []),
      ].slice(0, 150),
    }));
    showToast(`${created.name} was added.`);
  };

  const updateProfile = (profile) => {
    setGarden((current) => ({
      ...current,
      profile: { ...current.profile, ...profile, setupComplete: profile.setupComplete ?? current.profile.setupComplete },
    }));
    showToast('Garden settings saved.');
  };

  const recordSoilCheck = (plantId, moisture) => {
    const plant = garden.plants.find((item) => item.id === plantId);
    const now = new Date().toISOString();
    setGarden((current) => ({
      ...current,
      plants: current.plants.map((item) => item.id === plantId
        ? { ...item, moisture, lastSoilCheck: now }
        : item),
      activity: [
        activityEntry({
          type: 'soil',
          title: `Checked ${plant?.name || 'plant'} soil`,
          detail: moisture === 'dry' ? 'Soil felt dry.' : moisture === 'damp' ? 'Soil felt damp.' : 'Soil felt wet.',
          plantId,
        }),
        ...(current.activity || []),
      ].slice(0, 150),
    }));
    if (moisture !== 'dry') markDaily(`soil-${plantId}`, true);
  };

  const recordWatered = (plantId) => {
    const plant = garden.plants.find((item) => item.id === plantId);
    const now = new Date().toISOString();
    setGarden((current) => ({
      ...current,
      plants: current.plants.map((item) => item.id === plantId
        ? { ...item, moisture: 'damp', lastSoilCheck: now, lastWatered: now }
        : item),
      activity: [
        activityEntry({ type: 'watered', title: `Watered ${plant?.name || 'plant'}`, detail: 'Watering recorded.', plantId }),
        ...(current.activity || []),
      ].slice(0, 150),
    }));
    markDaily(`soil-${plantId}`, true);
    showToast('Watering recorded.');
  };

  const logGreenhouseCheck = ({ temperature, humidity, note }) => {
    addActivity({
      type: 'greenhouse',
      title: 'Greenhouse check',
      detail: [temperature ? `${temperature}°F` : '', humidity ? `${humidity}% humidity` : '', note].filter(Boolean).join(' • ') || 'Conditions checked.',
    });
    markDaily('greenhouse-check', true);
    showToast('Greenhouse conditions saved.');
  };

  const cropRecommendations = useMemo(() => getCropRecommendations(new Date()), []);
  const weatherAlert = useMemo(() => gardenWeatherAlert(weatherState.weather), [weatherState.weather]);
  const seasonMode = useMemo(() => getSeasonMode(new Date()), []);
  const todayTasks = useMemo(() => buildYearRoundTasks({
    garden,
    weather: weatherState.weather,
    date: new Date(),
  }), [garden, weatherState.weather]);

  const openTask = (task) => {
    if (task.kind === 'setup') setModal({ type: 'addMenu' });
    if (task.kind === 'setupPlant') setModal({ type: 'addPlant' });
    if (task.kind === 'soil') setModal({ type: 'soilCheck', plant: task.plant });
    if (task.kind === 'navigate') navigate(task.target);
    if (task.kind === 'greenhouse') setModal({ type: 'greenhouseCheck' });
    if (task.kind === 'plantDetail') setModal({ type: 'plantDetail', plant: task.plant });
  };

  return (
    <div className="site-stage">
      <div className={`app-shell page-${page}`}>
        {page === 'today' && (
          <TodayScreen
            profile={garden.profile}
            tasks={todayTasks}
            dailyDone={daily.done}
            onTask={openTask}
            onMenu={() => setDrawerOpen(true)}
            onBell={() => setNoticeOpen((value) => !value)}
            noticeOpen={noticeOpen}
            weatherState={weatherState}
            weatherAlert={weatherAlert}
            activity={garden.activity || []}
            setModal={setModal}
            seasonMode={seasonMode}
          />
        )}
        {page === 'plant' && (
          <PlantScreen
            filter={filter}
            setFilter={setFilter}
            recommendations={cropRecommendations}
            setModal={setModal}
            navigate={navigate}
          />
        )}
        {page === 'garden' && <GardenScreen garden={garden} setModal={setModal} />}
        {page === 'learn' && <LearnScreen />}
        {page === 'profile' && <ProfileScreen profile={garden.profile} updateProfile={updateProfile} />}

        <BottomNav page={page} navigate={navigate} />

        {drawerOpen && <MenuDrawer close={() => setDrawerOpen(false)} navigate={navigate} />}
        {modal && (
          <DetailModal
            key={`${modal.type}-${modal.plant?.id || modal.space?.id || modal.crop?.id || ''}`}
            modal={modal}
            close={() => setModal(null)}
            garden={garden}
            addPlant={addPlant}
            addSpace={addSpace}
            recordSoilCheck={recordSoilCheck}
            recordWatered={recordWatered}
            logGreenhouseCheck={logGreenhouseCheck}
            setModal={setModal}
          />
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}

export default App;
