import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Droplets, FlaskConical, LampDesk, Plus, Sprout, ThermometerSun, Warehouse } from 'lucide-react';
import { formatDateTime } from './data.js';

export default function IndoorCenter({ garden, navigate, addTray, addLight, toggleLight, startHardening, advanceHardening, saveHydroPod, setModal }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const [lightOpen, setLightOpen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);
  const [tray, setTray] = useState({ name: 'Tray A', crop: '', cells: 12, stage: 'Sown' });
  const [light, setLight] = useState({ name: 'Basement Lights', onTime: '06:00', offTime: '22:00' });
  const [pod, setPod] = useState({ position: '1', crop: '', status: 'Planted' });
  const indoorPlants = useMemo(() => garden.plants.filter((plant) => {
    const space = garden.spaces.find((item) => item.id === plant.spaceId);
    return ['indoor', 'basement', 'greenhouse', 'hydro'].includes(space?.type);
  }), [garden]);
  const hardening = garden.hardeningPlans || [];
  const latestReading = garden.greenhouseReadings?.[0];

  return <main className="screen indoor-center-screen">
    <section className="dark-header indoor-center-header">
      <button className="back-button" onClick={() => navigate('profile')} aria-label="Back to profile"><ArrowLeft /></button>
      <Sprout size={28} />
      <span>YEAR-ROUND GROWING</span>
      <h1>Indoor Growing Center</h1>
      <p>Seedlings, lights, greenhouse checks, hardening off, and hydroponics in one place.</p>
    </section>
    <section className="indoor-center-content screen-pad">
      <article className="control-center-card">
        <div className="control-center-title"><Sprout /><div><span className="section-kicker">SEEDLING TRAYS</span><h2>{garden.trays?.length || 0} active trays</h2></div><button onClick={() => setTrayOpen(!trayOpen)}><Plus /> Add</button></div>
        {trayOpen && <form onSubmit={(event) => { event.preventDefault(); addTray(tray); setTrayOpen(false); }} className="inline-control-form">
          <label>Tray name<input value={tray.name} onChange={(e) => setTray({ ...tray, name: e.target.value })} required /></label>
          <label>What is planted?<input value={tray.crop} onChange={(e) => setTray({ ...tray, crop: e.target.value })} placeholder="Peppers, basil, tomatoes…" required /></label>
          <div className="two-field-row"><label>Cells<input type="number" min="1" value={tray.cells} onChange={(e) => setTray({ ...tray, cells: e.target.value })} /></label><label>Stage<select value={tray.stage} onChange={(e) => setTray({ ...tray, stage: e.target.value })}><option>Sown</option><option>Germinating</option><option>Sprouted</option><option>Ready to pot up</option></select></label></div>
          <button className="primary-button">Save tray</button>
        </form>}
        <div className="center-list">{(garden.trays || []).map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.crop} • {item.cells} cells</small></span><em>{item.stage}</em></div>)}{!garden.trays?.length && <p className="center-empty">Add a tray once seeds are started. The app will remember what is in it and where it is in the process.</p>}</div>
      </article>

      <article className="control-center-card">
        <div className="control-center-title"><LampDesk /><div><span className="section-kicker">GROW LIGHTS</span><h2>Simple schedules</h2></div><button onClick={() => setLightOpen(!lightOpen)}><Plus /> Add</button></div>
        {lightOpen && <form onSubmit={(event) => { event.preventDefault(); addLight(light); setLightOpen(false); }} className="inline-control-form"><label>Name<input value={light.name} onChange={(e) => setLight({ ...light, name: e.target.value })} /></label><div className="two-field-row"><label>On<input type="time" value={light.onTime} onChange={(e) => setLight({ ...light, onTime: e.target.value })} /></label><label>Off<input type="time" value={light.offTime} onChange={(e) => setLight({ ...light, offTime: e.target.value })} /></label></div><button className="primary-button">Save light schedule</button></form>}
        <div className="center-list">{(garden.growLights || []).map((item) => <button className="light-row" key={item.id} onClick={() => toggleLight(item.id)}><LampDesk /><span><strong>{item.name}</strong><small>{item.onTime}–{item.offTime}</small></span><em className={item.checkedToday ? 'is-checked' : ''}>{item.checkedToday ? <><Check /> Checked</> : 'Check today'}</em></button>)}{!garden.growLights?.length && <p className="center-empty">Add the basement or greenhouse light schedule once, then use one tap to confirm it is working.</p>}</div>
      </article>

      <article className="control-center-card">
        <div className="control-center-title"><ThermometerSun /><div><span className="section-kicker">HARDENING OFF</span><h2>Move seedlings outside safely</h2></div></div>
        {indoorPlants.filter((plant) => ['Seedling', 'Growing'].includes(plant.stage) && !hardening.some((plan) => plan.plantId === plant.id && !plan.complete)).map((plant) => <button className="start-hardening" key={plant.id} onClick={() => startHardening(plant.id)}><span><strong>Start {plant.name}</strong><small>Creates a guided seven-day plan.</small></span><Plus /></button>)}
        <div className="hardening-list">{hardening.filter((plan) => !plan.complete).map((plan) => <div key={plan.id}><span><strong>{plan.plantName}: Day {plan.day} of 7</strong><small>{['1 hour in shade','2 hours in shade','3 hours with morning sun','4 hours outside','6 hours outside','Most of the day outside','Full day and overnight if weather is safe'][plan.day - 1]}</small></span><button onClick={() => advanceHardening(plan.id)}>{plan.day === 7 ? 'Finish' : 'Done today'}</button></div>)}{!hardening.some((plan) => !plan.complete) && <p className="center-empty">When seedlings are ready, start a plan here. Brooke only needs to complete today’s step.</p>}</div>
      </article>

      <article className="control-center-card greenhouse-center-card">
        <div className="control-center-title"><Warehouse /><div><span className="section-kicker">GREENHOUSE</span><h2>{latestReading ? `${latestReading.temperature ?? '—'}°F • ${latestReading.humidity ?? '—'}%` : 'No reading yet'}</h2></div><button onClick={() => setModal({ type: 'greenhouseCheck' })}>Log check</button></div>
        {latestReading && <p className="last-reading">Last checked {formatDateTime(latestReading.at)}{latestReading.note ? ` • ${latestReading.note}` : ''}</p>}
        <div className="reading-history">{(garden.greenhouseReadings || []).slice(0, 5).map((reading) => <div key={reading.id}><ThermometerSun /><span><strong>{reading.temperature ?? '—'}°F</strong><small>{reading.humidity ?? '—'}% humidity • {formatDateTime(reading.at)}</small></span></div>)}</div>
      </article>

      <article className="control-center-card">
        <div className="control-center-title"><FlaskConical /><div><span className="section-kicker">HYDROPONICS</span><h2>{garden.hydroPods?.length || 0} pods recorded</h2></div><button onClick={() => setPodOpen(!podOpen)}><Plus /> Pod</button></div>
        {podOpen && <form onSubmit={(event) => { event.preventDefault(); saveHydroPod(pod); setPodOpen(false); }} className="inline-control-form"><div className="two-field-row"><label>Position<input value={pod.position} onChange={(e) => setPod({ ...pod, position: e.target.value })} /></label><label>Status<select value={pod.status} onChange={(e) => setPod({ ...pod, status: e.target.value })}><option>Planted</option><option>Germinating</option><option>Growing</option><option>Harvesting</option><option>Empty</option></select></label></div><label>Crop<input value={pod.crop} onChange={(e) => setPod({ ...pod, crop: e.target.value })} placeholder="Lettuce, basil…" /></label><button className="primary-button">Save pod</button></form>}
        <div className="hydro-grid">{(garden.hydroPods || []).map((item) => <div key={item.id}><Droplets /><strong>Pod {item.position}</strong><span>{item.crop || 'Empty'}</span><small>{item.status}</small></div>)}</div>
      </article>
    </section>
  </main>;
}
