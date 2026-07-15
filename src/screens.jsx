import React, { useMemo } from 'react';
import {
  Bell, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, CloudSun,
  Droplets, FlaskConical, Flower2, Home, Leaf, Lightbulb, MapPin, Menu, Plus,
  Snowflake, Sprout, Sun, Thermometer, UserRound, Warehouse, Wind, X,
} from 'lucide-react';
import { colors, cropData, gardenSpaces } from './data.js';
import {
  CheeseIcon, LettuceArt, PepperArt, SeedPacket, WisconsinLandscape,
  WisconsinStamp, cropArt, gardenArt,
} from './art.jsx';

function TodayScreen({ completed, toggleDone, onMenu, onBell, noticeOpen, setModal }) {
  return (
    <main className="screen today-screen">
      <section className="today-hero">
        <button className="round-control hero-menu" onClick={onMenu} aria-label="Open menu"><Menu size={22} /></button>
        <button className="round-control hero-bell" onClick={onBell} aria-label="Open notifications">
          <Bell size={21} />
          <span className="notification-count">2</span>
        </button>
        {noticeOpen && (
          <div className="notification-popover">
            <strong>Garden alerts</strong>
            <span>Frost watch tonight near 34°F.</span>
            <span>Lettuce succession planting is due.</span>
          </div>
        )}
        <div className="hero-title-wrap">
          <Leaf size={25} fill="#91a83f" color="#91a83f" />
          <h1>Brooke’s<br />Garden</h1>
          <p>Growing good things in Wisconsin</p>
          <CheeseIcon className="hero-cheese" />
        </div>
        <WisconsinLandscape />
      </section>

      <section className="today-body screen-pad">
        <WeatherCard />
        <div className="task-stack">
          <TaskCard
            id="water"
            icon={<PepperArt compact />}
            title="Water the peppers"
            subtitle="Outdoor • Raised Bed 1"
            action="Mark Done"
            done={completed.includes('water')}
            onAction={() => toggleDone('water')}
          />
          <TaskCard
            id="lettuce"
            icon={<LettuceArt compact />}
            title="Start lettuce succession sowing"
            subtitle="Indoors"
            action="Show Me How"
            tone="gold"
            done={completed.includes('lettuce')}
            onAction={() => setModal({ type: 'task', task: 'lettuce' })}
          />
          <TaskCard
            id="frost"
            icon={<Snowflake size={31} color="#4c8fb7" strokeWidth={2.2} />}
            title="Frost watch tonight"
            subtitle="Low near 34°F"
            action="Snooze"
            tone="quiet"
            done={completed.includes('frost')}
            onAction={() => toggleDone('frost')}
          />
        </div>
        <FrostCard setModal={setModal} />
        <section className="week-ahead">
          <div>
            <span className="section-kicker">COMING UP</span>
            <h2>This week in the garden</h2>
          </div>
          <button className="text-link" onClick={() => setModal({ type: 'week' })}>View all <ChevronRight size={16} /></button>
        </section>
        <div className="mini-events">
          <div><CalendarDays size={18} /><span><strong>Tomorrow</strong> Check greenhouse vents</span></div>
          <div><Sprout size={18} /><span><strong>Friday</strong> Direct sow spinach</span></div>
        </div>
      </section>
    </main>
  );
}

function WeatherCard() {
  return (
    <section className="weather-card">
      <div className="weather-label"><MapPin size={15} /> Today in Green Bay</div>
      <div className="weather-grid">
        <div className="temperature-block">
          <CloudSun size={45} color="#fff" fill="#efb52b" />
          <span className="temperature">62°</span>
          <span className="conditions"><strong>Partly Cloudy</strong><small>H: 66° &nbsp; L: 48°</small></span>
        </div>
        <div className="rain-block">
          <Droplets size={29} color="#7cb0db" />
          <span><strong>10%</strong><small>Rain Chance</small></span>
        </div>
      </div>
    </section>
  );
}

function TaskCard({ icon, title, subtitle, action, tone = 'green', done, onAction }) {
  return (
    <article className={`task-card ${done ? 'is-done' : ''}`}>
      <div className="task-icon">{done ? <Check size={24} color={colors.green} /> : icon}</div>
      <div className="task-copy"><h3>{title}</h3><p>{done ? 'Completed today' : subtitle}</p></div>
      <button className={`task-button tone-${tone}`} onClick={onAction}>{done ? 'Undo' : action}</button>
    </article>
  );
}

function FrostCard({ setModal }) {
  return (
    <button className="frost-card" onClick={() => setModal({ type: 'frost' })}>
      <div><span>Frost watch</span><strong>Temps near freezing tonight.</strong><small>Protect tender plants!</small></div>
      <div className="frost-reading"><strong>34°</strong><span>Tonight</span></div>
      <Thermometer size={37} color={colors.red} />
    </button>
  );
}

function PlantScreen({ filter, setFilter, setModal, navigate }) {
  const visible = useMemo(() => filter === 'all' ? cropData : cropData.filter((crop) => crop.family === filter), [filter]);
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
          <span>Dates are tailored to Green Bay, WI<small>Average last frost: May 11</small></span>
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

function GardenScreen({ setModal }) {
  return (
    <main className="screen garden-screen">
      <section className="dark-header garden-header">
        <Leaf size={24} color="#8ea83b" fill="#8ea83b" />
        <h1>My Garden</h1>
        <p>Your spaces. Your progress.</p>
        <button className="add-garden" onClick={() => setModal({ type: 'add' })}><Plus /></button>
      </section>
      <section className="garden-list screen-pad">
        {gardenSpaces.map((space) => <GardenSpace key={space.id} space={space} setModal={setModal} />)}
        <div className="encouragement"><CheeseIcon /><span>You’re growing something great.<strong>Keep it up, Brooke!</strong></span><span className="heart">♥</span></div>
      </section>
    </main>
  );
}

function GardenSpace({ space, setModal }) {
  return (
    <button className="garden-space" onClick={() => setModal({ type: 'space', space })}>
      <div className="garden-thumb">{gardenArt(space.type)}</div>
      <div className="garden-space-copy">
        <div className="space-title"><h3>{space.name}</h3>{space.type === 'greenhouse' ? <Warehouse size={17} /> : space.type === 'hydro' ? <Droplets size={17} color="#4c8fb7" /> : <Leaf size={16} color="#2d7650" />}</div>
        <span>{space.count}</span>
        <div className="progress-row"><div className="progress-track"><span style={{ width: `${space.progress}%` }} /></div><strong>{space.progress}%</strong></div>
        <div className="space-divider" />
        <small>Next task</small>
        <p>{space.type === 'hydro' ? <FlaskConical size={16} /> : space.type === 'greenhouse' ? <Wind size={16} /> : <Droplets size={16} />} {space.task}</p>
        <div className="harvest"><CalendarDays size={16} /><span><small>Harvest</small>{space.harvest}</span></div>
      </div>
    </button>
  );
}

function SimpleScreen({ icon, title, eyebrow, body, button, onClick }) {
  return (
    <main className="screen simple-screen">
      <section className="dark-header simple-header">
        <div className="simple-icon">{icon}</div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </section>
      <section className="simple-content">
        <WisconsinStamp />
        <h2>Built for the way you actually garden.</h2>
        <p>This first version is laying the foundation for weather-aware reminders, succession planting, seed inventory, QR labels, and shared garden progress.</p>
        <button className="primary-button" onClick={onClick}>{button}</button>
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

function DetailModal({ modal, close, showToast }) {
  let content;
  if (modal.type === 'task') {
    content = <><span className="modal-kicker">SUCCESSION PLANTING</span><h2>Start the next lettuce batch</h2><p>Sow a small group now so the whole crop does not become ready at once.</p><ol><li>Fill a shallow tray with damp seed-starting mix.</li><li>Sow 6–8 seeds about ¼ inch deep.</li><li>Keep the tray bright and evenly moist.</li><li>We’ll remind you to start the next batch in 14 days.</li></ol></>;
  } else if (modal.type === 'frost') {
    content = <><span className="modal-kicker red">WEATHER ALERT</span><h2>Protect tender plants tonight</h2><p>Move containers and seedlings inside before sunset. Cover outdoor peppers and tomatoes with breathable frost cloth, then uncover them in the morning.</p></>;
  } else if (modal.type === 'crop') {
    content = <><span className="modal-kicker">GREEN BAY • ZONE 5B</span><div className="modal-crop-art">{cropArt(modal.crop.id)}</div><h2>{modal.crop.name}</h2><p><strong>{modal.crop.status} {modal.crop.timing.toLowerCase()}.</strong> This recommendation is based on Green Bay’s typical frost window and the crop’s preferred soil temperature.</p><div className="info-grid"><span><small>Planting depth</small>¼ inch</span><span><small>Sun</small>6+ hours</span><span><small>Harvest</small>35–60 days</span><span><small>Succession</small>Every 2 weeks</span></div></>;
  } else if (modal.type === 'space') {
    content = <><span className="modal-kicker">GARDEN SPACE</span><h2>{modal.space.name}</h2><p>{modal.space.count} are currently tracked here. The next recommended action is <strong>{modal.space.task.toLowerCase()}</strong>.</p><div className="modal-space-art">{gardenArt(modal.space.type)}</div></>;
  } else if (modal.type === 'add') {
    content = <><span className="modal-kicker">ADD TO MY GARDEN</span><h2>What are you adding?</h2><div className="choice-grid"><button><Sprout /> Plant or crop</button><button><Flower2 /> Garden bed</button><button><Warehouse /> Greenhouse tray</button><button><Droplets /> Hydroponic pod</button></div></>;
  } else if (modal.type === 'dates') {
    content = <><span className="modal-kicker">LOCAL TIMING</span><h2>Why these dates?</h2><p>Recommendations use Green Bay’s usual frost pattern as a starting point. Later versions will adjust daily using live weather, soil conditions, and what Brooke records in the garden.</p></>;
  } else if (modal.type === 'week') {
    content = <><span className="modal-kicker">NEXT 7 DAYS</span><h2>Coming up this week</h2><ul className="week-list"><li><strong>Tomorrow</strong> Check greenhouse vents</li><li><strong>Friday</strong> Direct sow spinach</li><li><strong>Saturday</strong> Inspect seedling moisture</li><li><strong>Sunday</strong> Review hydroponic nutrient level</li></ul></>;
  } else {
    content = <><span className="modal-kicker">FIRST VERSION</span><h2>This section is ready for the next build.</h2><p>The polished shell is in place. The next pass will turn this into a full setup flow with saved garden details and personal preferences.</p></>;
  }

  return (
    <div className="overlay modal-overlay" onMouseDown={close}>
      <section className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={close}><X /></button>
        {content}
        <button className="primary-button" onClick={() => { showToast('Saved to Brooke’s garden.'); close(); }}>Got it</button>
      </section>
    </div>
  );
}


export { TodayScreen, PlantScreen, GardenScreen, SimpleScreen, BottomNav, MenuDrawer, DetailModal };
