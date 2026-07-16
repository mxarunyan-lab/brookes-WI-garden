import React, { useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  FlaskConical,
  Flower2,
  Home,
  Leaf,
  Lightbulb,
  MapPin,
  Menu,
  Moon,
  NotebookPen,
  Plus,
  RefreshCw,
  Snowflake,
  Sprout,
  Sun,
  Thermometer,
  UserRound,
  Warehouse,
  Wind,
  X,
} from 'lucide-react';
import { colors, formatDateTime } from './data.js';
import {
  CheeseIcon,
  LettuceArt,
  PepperArt,
  SeedPacket,
  WisconsinLandscape,
  WisconsinStamp,
  cropArt,
  gardenArt,
} from './art.jsx';

function WeatherIcon({ weather, size = 45 }) {
  const code = weather?.weatherCode ?? 2;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <Snowflake size={size} color="#d9efff" />;
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return <CloudRain size={size} color="#d9efff" />;
  if ([3, 45, 48].includes(code)) return <Cloud size={size} color="#fff" />;
  if (!weather?.isDay) return <Moon size={size} color="#f7dc8b" fill="#f7dc8b" />;
  if (code === 0) return <Sun size={size} color="#efb52b" fill="#efb52b" />;
  return <CloudSun size={size} color="#fff" fill="#efb52b" />;
}

function TodayScreen({
  profile,
  tasks,
  dailyDone,
  onTask,
  onMenu,
  onBell,
  noticeOpen,
  weatherState,
  weatherAlert,
  activity,
  setModal,
}) {
  const notificationCount = Number(Boolean(weatherState.error)) + Number(Boolean(weatherAlert && weatherAlert.type !== 'good')) + Number(!tasks.length);

  return (
    <main className="screen today-screen">
      <section className="today-hero">
        <button className="round-control hero-menu" onClick={onMenu} aria-label="Open menu"><Menu size={22} /></button>
        <button className="round-control hero-bell" onClick={onBell} aria-label="Open notifications">
          <Bell size={21} />
          {notificationCount > 0 && <span className="notification-count">{notificationCount}</span>}
        </button>
        {noticeOpen && (
          <div className="notification-popover">
            <strong>Garden briefing</strong>
            {weatherAlert && <span>{weatherAlert.title}</span>}
            <span>{tasks.length} useful action{tasks.length === 1 ? '' : 's'} ready today.</span>
            {weatherState.error && <span>{weatherState.error}</span>}
          </div>
        )}
        <div className="hero-title-wrap">
          <Leaf size={25} fill="#91a83f" color="#91a83f" />
          <h1>{profile.gardenerName || 'Brooke'}’s<br />Garden</h1>
          <p>Growing good things in Wisconsin</p>
          <CheeseIcon className="hero-cheese" />
        </div>
        <WisconsinLandscape />
      </section>

      <section className="today-body screen-pad">
        <WeatherCard {...weatherState} />

        <div className="dashboard-heading">
          <div>
            <span className="section-kicker">TODAY’S USEFUL ACTIONS</span>
            <h2>What actually needs attention</h2>
          </div>
        </div>

        <div className="task-stack">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              done={dailyDone.includes(task.id)}
              onAction={() => onTask(task)}
            />
          ))}
        </div>

        {weatherAlert && (
          <WeatherAlertCard alert={weatherAlert} onClick={() => setModal({ type: 'weatherAlert', alert: weatherAlert, weather: weatherState.weather })} />
        )}

        <section className="week-ahead activity-heading">
          <div>
            <span className="section-kicker">GARDEN LOG</span>
            <h2>Recently recorded</h2>
          </div>
          <button className="text-link" onClick={() => setModal({ type: 'activity' })}>View all <ChevronRight size={16} /></button>
        </section>
        <RecentActivity activity={activity} setModal={setModal} />
      </section>
    </main>
  );
}

function WeatherCard({ weather, loading, error, source, refresh }) {
  return (
    <section className="weather-card" aria-live="polite">
      <div className="weather-card-top">
        <div className="weather-label"><MapPin size={15} /> Today in Green Bay</div>
        <button className="weather-refresh" onClick={refresh} disabled={loading} aria-label="Refresh weather">
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
        </button>
      </div>
      {weather ? (
        <>
          <div className="weather-grid">
            <div className="temperature-block">
              <WeatherIcon weather={weather} />
              <span className="temperature">{weather.temperature}°</span>
              <span className="conditions">
                <strong>{weather.condition}</strong>
                <small>H: {weather.high}° &nbsp; L: {weather.low}°</small>
                <small>Feels like {weather.apparent}°</small>
              </span>
            </div>
            <div className="rain-block">
              <Droplets size={29} color="#7cb0db" />
              <span><strong>{weather.rainChance}%</strong><small>Rain chance</small></span>
            </div>
          </div>
          <div className="weather-footnote">
            <span>{source === 'live' ? 'Live conditions' : 'Saved conditions'} • updated {formatDateTime(weather.updatedAt)}</span>
            <span>{weather.wind} mph wind</span>
          </div>
        </>
      ) : (
        <div className="weather-loading">
          <RefreshCw size={22} className={loading ? 'is-spinning' : ''} />
          <span>{loading ? 'Loading live Green Bay weather…' : 'Weather is unavailable right now.'}</span>
        </div>
      )}
      {error && <div className="weather-error"><CircleAlert size={15} /> {error}</div>}
    </section>
  );
}

function TaskCard({ task, done, onAction }) {
  let icon = <Sprout size={31} color="#397b4d" />;
  if (task.kind === 'setup') icon = <Plus size={29} color="#397b4d" />;
  if (task.kind === 'navigate') icon = <LettuceArt compact />;
  if (task.kind === 'greenhouse') icon = <Warehouse size={29} color="#397b4d" />;
  if (task.kind === 'soil' && task.plant?.cropId === 'peppers') icon = <PepperArt compact />;

  return (
    <article className={`task-card ${done ? 'is-done' : ''}`}>
      <div className="task-icon">{done ? <Check size={24} color={colors.green} /> : icon}</div>
      <div className="task-copy"><h3>{task.title}</h3><p>{done ? 'Recorded for today' : task.subtitle}</p></div>
      <button className={`task-button tone-${task.tone || 'green'}`} onClick={onAction}>{done ? 'Review' : task.action}</button>
    </article>
  );
}

function WeatherAlertCard({ alert, onClick }) {
  const Icon = alert.type === 'frost' ? Snowflake : alert.type === 'heat' ? Thermometer : alert.type === 'rain' ? CloudRain : alert.type === 'wind' ? Wind : CloudSun;
  return (
    <button className={`weather-alert-card alert-${alert.type}`} onClick={onClick}>
      <div>
        <span>{alert.label}</span>
        <strong>{alert.title}</strong>
        <small>{alert.detail}</small>
      </div>
      <div className="weather-alert-reading"><strong>{alert.reading}</strong><span>Today</span></div>
      <Icon size={35} />
    </button>
  );
}

function RecentActivity({ activity, setModal }) {
  if (!activity.length) {
    return (
      <button className="empty-activity" onClick={() => setModal({ type: 'addPlant' })}>
        <NotebookPen size={23} />
        <span><strong>No fake history here.</strong><small>Add a plant or complete a check and the real garden log will begin.</small></span>
        <ChevronRight size={18} />
      </button>
    );
  }
  return (
    <div className="mini-events activity-list">
      {activity.slice(0, 3).map((entry) => (
        <button key={entry.id} onClick={() => setModal({ type: 'activityEntry', entry })}>
          <CheckCircle2 size={18} />
          <span><strong>{entry.title}</strong>{entry.detail}</span>
          <small>{formatDateTime(entry.at)}</small>
        </button>
      ))}
    </div>
  );
}

function PlantScreen({ filter, setFilter, recommendations, setModal, navigate }) {
  const visible = useMemo(
    () => filter === 'all' ? recommendations : recommendations.filter((crop) => crop.family === filter),
    [filter, recommendations],
  );
  return (
    <main className="screen plant-screen">
      <section className="dark-header plant-header">
        <div className="header-topline">
          <button className="back-button" aria-label="Back to today" onClick={() => navigate('today')}><ChevronLeft /></button>
          <div className="seed-cheese-art"><SeedPacket /><CheeseIcon /></div>
        </div>
        <h1>What Can I<br />Plant Now?</h1>
        <div className="location-row"><MapPin size={17} /> Green Bay, Wisconsin <span>USDA Zone 5b</span></div>
      </section>
      <section className="cream-panel plant-panel">
        <div className="season-note">
          <CalendarDays size={18} />
          <span><strong>Updated for today</strong> Recommendations change with the calendar instead of staying stuck on a spring demo.</span>
        </div>
        <div className="filter-row" aria-label="Crop filters">
          {['all', 'vegetables', 'herbs', 'flowers'].map((item) => (
            <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <div className="crop-list">
          {visible.map((crop) => <CropCard key={crop.id} crop={crop} setModal={setModal} />)}
        </div>
        <button className="plant-note" onClick={() => setModal({ type: 'dates' })}>
          <Lightbulb size={23} color="#d49517" />
          <span>Timing is tailored to Green Bay, WI<small>Live weather affects today’s alerts; planting windows use the local calendar.</small></span>
          <ChevronRight size={19} />
        </button>
      </section>
    </main>
  );
}

function CropCard({ crop, setModal }) {
  return (
    <button className="crop-card" onClick={() => setModal({ type: 'crop', crop })}>
      <div className="crop-art">{cropArt(crop.id)}</div>
      <div className="crop-copy"><h3>{crop.name}</h3><span>{crop.variety}</span></div>
      <div className={`crop-status tone-${crop.tone}`}>
        <Sprout size={20} />
        <span><strong>{crop.status}</strong><small>{crop.timing}</small></span>
      </div>
      <ChevronRight size={20} />
    </button>
  );
}

function GardenScreen({ garden, setModal }) {
  return (
    <main className="screen garden-screen">
      <section className="dark-header garden-header">
        <Leaf size={24} color="#8ea83b" fill="#8ea83b" />
        <h1>My Garden</h1>
        <p>Your spaces. Your real plants. Your progress.</p>
        <button className="add-garden" onClick={() => setModal({ type: 'addMenu' })}><Plus /></button>
      </section>
      <section className="garden-list screen-pad">
        <div className="garden-actions">
          <button onClick={() => setModal({ type: 'addPlant' })}><Sprout /> Add plant</button>
          <button onClick={() => setModal({ type: 'addSpace' })}><Plus /> Add space</button>
        </div>
        {garden.spaces.map((space) => (
          <GardenSpace key={space.id} space={space} plants={garden.plants.filter((plant) => plant.spaceId === space.id)} setModal={setModal} />
        ))}

        <section className="tracked-plants-section">
          <div className="section-row">
            <div><span className="section-kicker">TRACKED PLANTS</span><h2>What Brooke is growing</h2></div>
            <button className="text-link" onClick={() => setModal({ type: 'addPlant' })}>Add <Plus size={15} /></button>
          </div>
          {garden.plants.length ? (
            <div className="tracked-plant-list">
              {garden.plants.map((plant) => (
                <button key={plant.id} onClick={() => setModal({ type: 'plantDetail', plant })}>
                  <div className="tracked-plant-art">{plant.cropId ? cropArt(plant.cropId) : <Sprout />}</div>
                  <span><strong>{plant.name}</strong><small>{plant.variety || plant.stage} • {garden.spaces.find((space) => space.id === plant.spaceId)?.name || 'Unassigned'}</small></span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <button className="empty-garden" onClick={() => setModal({ type: 'addPlant' })}>
              <Sprout size={30} />
              <span><strong>No plants have been entered yet.</strong><small>Add what is truly growing so the dashboard can create useful care tasks.</small></span>
            </button>
          )}
        </section>

        <div className="encouragement"><CheeseIcon /><span>You’re building a garden that remembers.<strong>One real update at a time.</strong></span><span className="heart">♥</span></div>
      </section>
    </main>
  );
}

function GardenSpace({ space, plants, setModal }) {
  const progress = Math.min(100, Math.round((plants.length / Math.max(space.capacity || 1, 1)) * 100));
  const nextTask = plants.length ? `Check ${plants[0].name} soil` : 'Add the first plant';
  return (
    <button className="garden-space" onClick={() => setModal({ type: 'space', space, plants })}>
      <div className="garden-thumb">{gardenArt(space.type)}</div>
      <div className="garden-space-copy">
        <div className="space-title"><h3>{space.name}</h3>{space.type === 'greenhouse' ? <Warehouse size={17} /> : space.type === 'hydro' ? <Droplets size={17} color="#4c8fb7" /> : <Leaf size={16} color="#2d7650" />}</div>
        <span>{plants.length} of {space.capacity || '—'} spots tracked</span>
        <div className="progress-row"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
        <div className="space-divider" />
        <small>Next useful action</small>
        <p>{space.type === 'hydro' ? <FlaskConical size={16} /> : space.type === 'greenhouse' ? <Wind size={16} /> : <Droplets size={16} />} {nextTask}</p>
        <div className="harvest"><CalendarDays size={16} /><span><small>Schedule</small>{plants.length ? 'Based on planting dates' : 'Not started'}</span></div>
      </div>
    </button>
  );
}

function LearnScreen() {
  const guides = [
    ['Feel before you water', 'Use a finger check instead of watering from a generic timer.'],
    ['Green Bay planting windows', 'Cool-season crops, warm-season crops, and fall garlic timing.'],
    ['Greenhouse basics', 'Temperature, humidity, venting, and hardening off seedlings.'],
  ];
  return (
    <main className="screen simple-screen">
      <section className="dark-header simple-header compact-simple-header">
        <div className="simple-icon"><BookOpen /></div>
        <span>WISCONSIN KNOW-HOW</span>
        <h1>Garden Guide</h1>
        <p>Clear guidance that connects the recommendation to what Brooke should physically do.</p>
      </section>
      <section className="simple-content guide-content">
        <WisconsinStamp />
        <h2>Start with the useful stuff.</h2>
        <div className="guide-list">
          {guides.map(([title, body]) => <article key={title}><Leaf size={20} /><span><strong>{title}</strong><small>{body}</small></span></article>)}
        </div>
      </section>
    </main>
  );
}

function ProfileScreen({ profile, updateProfile }) {
  const [name, setName] = useState(profile.gardenerName || 'Brooke');
  return (
    <main className="screen simple-screen profile-screen">
      <section className="dark-header simple-header compact-simple-header">
        <div className="simple-icon"><UserRound /></div>
        <span>GARDEN SETTINGS</span>
        <h1>{name}’s Profile</h1>
        <p>Green Bay weather and Zone 5b recommendations are currently locked in for this Wisconsin-first build.</p>
      </section>
      <section className="profile-form-wrap">
        <label>Gardener name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Weather location<input value="Green Bay, Wisconsin" disabled /></label>
        <label>USDA zone<input value="5b" disabled /></label>
        <button className="primary-button" onClick={() => updateProfile({ gardenerName: name.trim() || 'Brooke' })}>Save settings</button>
        <p className="form-help">A future location setup will allow other Wisconsin gardeners to choose their city without weakening Brooke’s Green Bay experience.</p>
      </section>
    </main>
  );
}

function BottomNav({ page, navigate }) {
  const items = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'plant', label: 'What to Plant', icon: Leaf },
    { id: 'garden', label: 'My Garden', icon: Sprout },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserRound },
  ];
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)}>
          <Icon size={23} strokeWidth={1.9} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function MenuDrawer({ close, navigate }) {
  return (
    <div className="overlay" onMouseDown={close}>
      <aside className="drawer" onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={close}><X /></button>
        <CheeseIcon className="drawer-cheese" />
        <span className="section-kicker">BROOKE’S GARDEN</span>
        <h2>Good things grow here.</h2>
        <button onClick={() => navigate('today')}><Home /> Today</button>
        <button onClick={() => navigate('plant')}><Leaf /> What can I plant?</button>
        <button onClick={() => navigate('garden')}><Sprout /> My garden spaces</button>
        <button onClick={() => navigate('learn')}><BookOpen /> Wisconsin garden guide</button>
        <button onClick={() => navigate('profile')}><UserRound /> Garden settings</button>
      </aside>
    </div>
  );
}

function DetailModal({ modal, close, garden, addPlant, addSpace, recordSoilCheck, recordWatered, logGreenhouseCheck, setModal }) {
  let content;
  if (modal.type === 'soilCheck') content = <SoilCheckFlow plant={modal.plant} recordSoilCheck={recordSoilCheck} recordWatered={recordWatered} close={close} />;
  else if (modal.type === 'addPlant') content = <AddPlantForm modal={modal} garden={garden} addPlant={addPlant} close={close} />;
  else if (modal.type === 'addSpace') content = <AddSpaceForm addSpace={addSpace} close={close} />;
  else if (modal.type === 'greenhouseCheck') content = <GreenhouseCheckForm save={logGreenhouseCheck} close={close} />;
  else if (modal.type === 'crop') content = <CropDetail crop={modal.crop} setModal={setModal} />;
  else if (modal.type === 'space') content = <SpaceDetail modal={modal} setModal={setModal} />;
  else if (modal.type === 'plantDetail') content = <PlantDetail plant={modal.plant} garden={garden} setModal={setModal} />;
  else if (modal.type === 'weatherAlert') content = <WeatherAlertDetail modal={modal} />;
  else if (modal.type === 'activity') content = <ActivityDetail activity={garden.activity || []} />;
  else if (modal.type === 'activityEntry') content = <ActivityEntry entry={modal.entry} />;
  else if (modal.type === 'addMenu') content = <AddMenu setModal={setModal} />;
  else if (modal.type === 'dates') content = <><span className="modal-kicker">LOCAL TIMING</span><h2>How planting recommendations work</h2><p>The app uses today’s date and Green Bay’s Zone 5b growing pattern to change each crop card through the season. Weather alerts use the live forecast. The next phase will combine those with planting dates and frost forecasts for smarter reminders.</p></>;
  else content = <><span className="modal-kicker">BROOKE’S GARDEN</span><h2>That section is being prepared.</h2><p>This version now prioritizes real weather, real plant entries, and actions that save to the garden log.</p></>;

  return (
    <div className="overlay modal-overlay" onMouseDown={close}>
      <section className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close"><X /></button>
        {content}
        {!['soilCheck', 'addPlant', 'addSpace', 'greenhouseCheck', 'crop', 'space', 'plantDetail', 'addMenu'].includes(modal.type) && (
          <button className="primary-button" onClick={close}>Done</button>
        )}
      </section>
    </div>
  );
}

function SoilCheckFlow({ plant, recordSoilCheck, recordWatered, close }) {
  const [result, setResult] = useState('');
  const choose = (value) => {
    setResult(value);
    recordSoilCheck(plant.id, value);
  };
  return (
    <>
      <span className="modal-kicker">WATER ONLY WHEN NEEDED</span>
      <h2>Check {plant.name} soil</h2>
      <p>Push a finger about one inch into the soil near the plant. Choose what it actually feels like.</p>
      <div className="soil-choice-grid">
        <button className={result === 'dry' ? 'selected' : ''} onClick={() => choose('dry')}><Sun /><strong>Dry</strong><small>Loose or dusty</small></button>
        <button className={result === 'damp' ? 'selected' : ''} onClick={() => choose('damp')}><Leaf /><strong>Damp</strong><small>Cool and slightly moist</small></button>
        <button className={result === 'wet' ? 'selected' : ''} onClick={() => choose('wet')}><Droplets /><strong>Wet</strong><small>Water sticks to your finger</small></button>
      </div>
      {result === 'dry' && <div className="soil-result result-dry"><strong>Water it now.</strong><span>Water slowly at the soil until moisture reaches the root area, then record it below.</span></div>}
      {result === 'damp' && <div className="soil-result"><strong>Skip watering.</strong><span>The plant has moisture available. Check again later instead of watering by habit.</span></div>}
      {result === 'wet' && <div className="soil-result result-wet"><strong>Do not water.</strong><span>Let the soil dry. Check drainage if it stays wet for too long.</span></div>}
      <div className="modal-action-row">
        {result === 'dry' ? <button className="primary-button" onClick={() => { recordWatered(plant.id); close(); }}>I watered it</button> : <button className="primary-button" disabled={!result} onClick={close}>{result ? 'Save check' : 'Choose soil condition'}</button>}
        {result === 'dry' && <button className="secondary-button" onClick={close}>I’ll water later</button>}
      </div>
    </>
  );
}

function AddPlantForm({ modal, garden, addPlant, close }) {
  const [name, setName] = useState(modal.prefill?.name || '');
  const [variety, setVariety] = useState(modal.prefill?.variety || '');
  const [spaceId, setSpaceId] = useState(modal.spaceId || garden.spaces[0]?.id || '');
  const [stage, setStage] = useState('Growing');
  const [plantedAt, setPlantedAt] = useState(new Date().toISOString().slice(0, 10));
  const submit = (event) => {
    event.preventDefault();
    if (!name.trim() || !spaceId) return;
    addPlant({ name, variety, spaceId, stage, plantedAt, cropId: modal.prefill?.id || '' });
    close();
  };
  return (
    <form className="modal-form" onSubmit={submit}>
      <span className="modal-kicker">ADD A REAL PLANT</span>
      <h2>What is Brooke growing?</h2>
      <label>Plant or crop name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Bell peppers" required autoFocus /></label>
      <label>Variety, if known<input value={variety} onChange={(event) => setVariety(event.target.value)} placeholder="Example: California Wonder" /></label>
      <label>Garden space<select value={spaceId} onChange={(event) => setSpaceId(event.target.value)} required><option value="">Choose a space</option>{garden.spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</select></label>
      <label>Current stage<select value={stage} onChange={(event) => setStage(event.target.value)}><option>Seed</option><option>Seedling</option><option>Growing</option><option>Flowering</option><option>Producing</option><option>Ready to harvest</option></select></label>
      <label>Planted or started date<input type="date" value={plantedAt} onChange={(event) => setPlantedAt(event.target.value)} /></label>
      <button className="primary-button" type="submit" disabled={!name.trim() || !spaceId}>Add to Brooke’s garden</button>
    </form>
  );
}

function AddSpaceForm({ addSpace, close }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('bed');
  const [capacity, setCapacity] = useState(12);
  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    addSpace({ name, type, capacity });
    close();
  };
  return (
    <form className="modal-form" onSubmit={submit}>
      <span className="modal-kicker">NEW GARDEN SPACE</span>
      <h2>Add a bed, container, or growing system</h2>
      <label>Space name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Back fence bed" required autoFocus /></label>
      <label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option value="bed">Raised or in-ground bed</option><option value="container">Container area</option><option value="greenhouse">Greenhouse</option><option value="hydro">Hydroponics</option></select></label>
      <label>Approximate plant capacity<input type="number" min="1" max="100" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label>
      <button className="primary-button" type="submit" disabled={!name.trim()}>Add garden space</button>
    </form>
  );
}

function GreenhouseCheckForm({ save, close }) {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [note, setNote] = useState('');
  return (
    <form className="modal-form" onSubmit={(event) => { event.preventDefault(); save({ temperature, humidity, note }); close(); }}>
      <span className="modal-kicker">MANUAL GREENHOUSE CHECK</span>
      <h2>What do the thermometer and plants say?</h2>
      <p>This is a log, not a fake sensor connection. Enter only what you actually observe.</p>
      <div className="two-field-row">
        <label>Temperature °F<input type="number" value={temperature} onChange={(event) => setTemperature(event.target.value)} placeholder="72" /></label>
        <label>Humidity %<input type="number" min="0" max="100" value={humidity} onChange={(event) => setHumidity(event.target.value)} placeholder="58" /></label>
      </div>
      <label>Quick note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Vents open, seedlings look good…" /></label>
      <button className="primary-button" type="submit">Save greenhouse check</button>
    </form>
  );
}

function CropDetail({ crop, setModal }) {
  return (
    <>
      <span className="modal-kicker">GREEN BAY • ZONE 5B</span>
      <div className="modal-crop-art">{cropArt(crop.id)}</div>
      <h2>{crop.name}</h2>
      <p><strong>{crop.status} — {crop.timing}.</strong> {crop.note}</p>
      <p>{crop.summary}</p>
      <div className="info-grid"><span><small>Planting depth</small>{crop.depth}</span><span><small>Sun</small>{crop.sun}</span><span><small>Harvest</small>{crop.harvest}</span><span><small>Succession</small>{crop.succession}</span></div>
      <button className="primary-button" onClick={() => setModal({ type: 'addPlant', prefill: crop })}>Track this in My Garden</button>
      <button className="secondary-button full-width" onClick={() => setModal({ type: 'dates' })}>How timing is decided</button>
    </>
  );
}

function SpaceDetail({ modal, setModal }) {
  return (
    <>
      <span className="modal-kicker">GARDEN SPACE</span>
      <h2>{modal.space.name}</h2>
      <p>{modal.plants.length ? `${modal.plants.length} plant${modal.plants.length === 1 ? '' : 's'} are tracked here.` : 'Nothing is tracked here yet.'}</p>
      <div className="modal-space-art">{gardenArt(modal.space.type)}</div>
      {modal.plants.length > 0 && <ul className="space-plant-list">{modal.plants.map((plant) => <li key={plant.id}>{plant.name}<span>{plant.stage}</span></li>)}</ul>}
      <button className="primary-button" onClick={() => setModal({ type: 'addPlant', spaceId: modal.space.id })}>Add a plant here</button>
    </>
  );
}

function PlantDetail({ plant, garden, setModal }) {
  const space = garden.spaces.find((item) => item.id === plant.spaceId);
  return (
    <>
      <span className="modal-kicker">TRACKED PLANT</span>
      <div className="modal-crop-art">{plant.cropId ? cropArt(plant.cropId) : <Sprout />}</div>
      <h2>{plant.name}</h2>
      <p>{plant.variety || 'Variety not entered'} • {space?.name || 'Unassigned'}</p>
      <div className="info-grid"><span><small>Stage</small>{plant.stage}</span><span><small>Started</small>{plant.plantedAt || 'Not entered'}</span><span><small>Last soil check</small>{formatDateTime(plant.lastSoilCheck)}</span><span><small>Last watered</small>{formatDateTime(plant.lastWatered)}</span></div>
      <button className="primary-button" onClick={() => setModal({ type: 'soilCheck', plant })}>Check soil now</button>
    </>
  );
}

function WeatherAlertDetail({ modal }) {
  return (
    <>
      <span className={`modal-kicker ${modal.alert.type === 'frost' ? 'red' : ''}`}>LIVE WEATHER GUIDANCE</span>
      <h2>{modal.alert.title}</h2>
      <p>{modal.alert.detail}</p>
      {modal.weather && <div className="info-grid"><span><small>Current</small>{modal.weather.temperature}°</span><span><small>Feels like</small>{modal.weather.apparent}°</span><span><small>Today’s high</small>{modal.weather.high}°</span><span><small>Tonight’s low</small>{modal.weather.low}°</span></div>}
      <p className="source-note">Weather comes from the live Green Bay forecast. Always check the actual soil and plants before taking action.</p>
    </>
  );
}

function ActivityDetail({ activity }) {
  return (
    <>
      <span className="modal-kicker">GARDEN LOG</span><h2>Everything recently recorded</h2>
      {activity.length ? <ul className="full-activity-list">{activity.map((entry) => <li key={entry.id}><strong>{entry.title}</strong><span>{entry.detail}</span><small>{formatDateTime(entry.at)}</small></li>)}</ul> : <p>No activity has been recorded yet.</p>}
    </>
  );
}

function ActivityEntry({ entry }) {
  return <><span className="modal-kicker">GARDEN LOG ENTRY</span><h2>{entry.title}</h2><p>{entry.detail}</p><div className="entry-date">Recorded {formatDateTime(entry.at)}</div></>;
}

function AddMenu({ setModal }) {
  return (
    <>
      <span className="modal-kicker">ADD TO MY GARDEN</span><h2>What are you adding?</h2>
      <div className="choice-grid"><button onClick={() => setModal({ type: 'addPlant' })}><Sprout /> Plant or crop</button><button onClick={() => setModal({ type: 'addSpace' })}><Flower2 /> Garden space</button></div>
    </>
  );
}

export {
  TodayScreen,
  PlantScreen,
  GardenScreen,
  LearnScreen,
  ProfileScreen,
  BottomNav,
  MenuDrawer,
  DetailModal,
};
