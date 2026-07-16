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
  const [garden, setGarden] = useState(() => safeLoad(GARDEN_KEY, starterGarden));
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

  const addActivity = (entry) => {
    setGarden((current) => ({
      ...current,
      activity: [
        { id: newId('activity'), at: new Date().toISOString(), ...entry },
        ...(current.activity || []),
      ].slice(0, 100),
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
      moisture: 'unknown',
    };
    setGarden((current) => ({ ...current, plants: [...current.plants, created] }));
    addActivity({ type: 'planted', title: `Added ${created.name}`, detail: 'Now tracked in Brooke’s garden.' });
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
    setGarden((current) => ({ ...current, spaces: [...current.spaces, created] }));
    addActivity({ type: 'space', title: `Added ${created.name}`, detail: 'New garden space created.' });
    showToast(`${created.name} was added.`);
  };

  const updateProfile = (profile) => {
    setGarden((current) => ({ ...current, profile: { ...current.profile, ...profile } }));
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
    }));
    addActivity({
      type: 'soil',
      title: `Checked ${plant?.name || 'plant'} soil`,
      detail: moisture === 'dry' ? 'Soil felt dry.' : moisture === 'damp' ? 'Soil felt damp.' : 'Soil felt wet.',
      plantId,
    });
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
    }));
    addActivity({ type: 'watered', title: `Watered ${plant?.name || 'plant'}`, detail: 'Watering recorded.', plantId });
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
  const firstTrackedPlant = garden.plants[0] || null;

  const todayTasks = useMemo(() => {
    const tasks = [];
    if (!garden.plants.length) {
      tasks.push({
        id: 'setup-first-plant',
        kind: 'setup',
        title: 'Tell us what is actually growing',
        subtitle: 'Add the first real plant so reminders stop being generic.',
        action: 'Add Plant',
        tone: 'green',
      });
    } else if (firstTrackedPlant) {
      tasks.push({
        id: `soil-${firstTrackedPlant.id}`,
        kind: 'soil',
        plant: firstTrackedPlant,
        title: `Check ${firstTrackedPlant.name} soil`,
        subtitle: 'Feel the soil before deciding whether to water.',
        action: 'Check Soil',
        tone: 'green',
      });
    }

    tasks.push({
      id: 'review-planting',
      kind: 'navigate',
      title: 'See what still makes sense to plant',
      subtitle: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date()),
      action: 'Review',
      tone: 'gold',
      target: 'plant',
    });

    if (garden.spaces.some((space) => space.type === 'greenhouse')) {
      tasks.push({
        id: 'greenhouse-check',
        kind: 'greenhouse',
        title: 'Log greenhouse conditions',
        subtitle: 'Record temperature, humidity, or a quick note.',
        action: 'Check',
        tone: 'quiet',
      });
    }
    return tasks;
  }, [garden.plants, garden.spaces, firstTrackedPlant]);

  const openTask = (task) => {
    if (task.kind === 'setup') setModal({ type: 'addPlant' });
    if (task.kind === 'soil') setModal({ type: 'soilCheck', plant: task.plant });
    if (task.kind === 'navigate') navigate(task.target);
    if (task.kind === 'greenhouse') setModal({ type: 'greenhouseCheck' });
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
