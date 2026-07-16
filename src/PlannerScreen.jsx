import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, PackagePlus, Plus, Seedling, ShoppingBasket, Sprout } from 'lucide-react';
import { cropCatalog } from './data.js';
import { daysFromNow, prettyDate, seedStatusForCrop, splitTimeline } from './planning.js';
import { CheeseIcon, cropArt } from './art.jsx';

function dueLabel(date) {
  const delta = daysFromNow(date);
  if (delta < 0) return `${Math.abs(delta)} day${Math.abs(delta) === 1 ? '' : 's'} overdue`;
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  return `In ${delta} days`;
}

export default function PlannerScreen({ garden, timeline, addSeed, completePlanItem, updatePlantStage, recordHarvest, scheduleSuccession }) {
  const [tab, setTab] = useState('week');
  const [showSeedForm, setShowSeedForm] = useState(false);
  const [seedDraft, setSeedDraft] = useState({ cropId: 'lettuce', name: 'Lettuce', variety: '', packetYear: new Date().getFullYear(), quantity: 20 });
  const groups = useMemo(() => splitTimeline(timeline), [timeline]);
  const visible = tab === 'week' ? groups.week : tab === 'month' ? groups.month : [];
  const shopping = cropCatalog.filter((crop) => seedStatusForCrop(garden, crop.id).tone === 'red');

  const saveSeed = (event) => {
    event.preventDefault();
    addSeed(seedDraft);
    setShowSeedForm(false);
  };

  return (
    <main className="screen planner-screen">
      <section className="dark-header planner-header">
        <CalendarDays size={26} />
        <span>THE GARDEN THINKS AHEAD</span>
        <h1>Plan & Seeds</h1>
        <p>What is due, what comes next, and whether Brooke already owns what she needs.</p>
      </section>

      <section className="planner-content screen-pad">
        <div className="planner-tabs">
          <button className={tab === 'week' ? 'active' : ''} onClick={() => setTab('week')}>Next 7 days</button>
          <button className={tab === 'month' ? 'active' : ''} onClick={() => setTab('month')}>Next 30 days</button>
          <button className={tab === 'seeds' ? 'active' : ''} onClick={() => setTab('seeds')}>Seeds</button>
        </div>

        {tab !== 'seeds' && (
          <>
            <div className="plan-summary">
              <span className="section-kicker">UPCOMING</span>
              <h2>{visible.length ? `${visible.length} thing${visible.length === 1 ? '' : 's'} to keep on the radar` : 'Nothing needs scheduling here yet'}</h2>
              <p>{visible.length ? 'Tap the exact action. The app records it and moves the plan forward.' : 'Add plants, stages, or succession schedules and the app will build this automatically.'}</p>
            </div>
            <div className="plan-list">
              {visible.map((item) => {
                const plant = garden.plants.find((entry) => entry.id === item.plantId);
                return (
                  <article key={item.id} className="plan-item">
                    <div className="plan-date"><strong>{prettyDate(item.date)}</strong><small>{dueLabel(item.date)}</small></div>
                    <div className="plan-copy"><h3>{item.title}</h3><p>{item.detail}</p></div>
                    <div className="plan-actions">
                      {item.type === 'stage' && plant && <button onClick={() => updatePlantStage(plant.id)}>Advance stage</button>}
                      {item.type === 'harvest' && plant && <button onClick={() => recordHarvest(plant.id)}>Log harvest</button>}
                      {item.type === 'succession' && plant && <button onClick={() => scheduleSuccession(plant.id, true)}>Started batch</button>}
                      <button className="quiet-plan-button" onClick={() => completePlanItem(item)} aria-label="Mark complete"><Check size={17} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {tab === 'seeds' && (
          <>
            <div className="seed-toolbar">
              <div><span className="section-kicker">SEED BOX</span><h2>{garden.seeds.length} packet{garden.seeds.length === 1 ? '' : 's'} recorded</h2></div>
              <button onClick={() => setShowSeedForm((value) => !value)}><Plus size={17} /> Add packet</button>
            </div>

            {showSeedForm && (
              <form className="seed-form" onSubmit={saveSeed}>
                <label>Crop<select value={seedDraft.cropId} onChange={(event) => { const crop = cropCatalog.find((item) => item.id === event.target.value); setSeedDraft({ ...seedDraft, cropId: event.target.value, name: crop?.name || '' }); }}>{cropCatalog.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label>
                <label>Variety<input value={seedDraft.variety} onChange={(event) => setSeedDraft({ ...seedDraft, variety: event.target.value })} placeholder="Optional" /></label>
                <div className="two-field-row"><label>Packet year<input type="number" min="2000" max="2100" value={seedDraft.packetYear} onChange={(event) => setSeedDraft({ ...seedDraft, packetYear: event.target.value })} /></label><label>Approx. seeds left<input type="number" min="0" value={seedDraft.quantity} onChange={(event) => setSeedDraft({ ...seedDraft, quantity: event.target.value })} /></label></div>
                <button className="primary-button" type="submit">Save seed packet</button>
              </form>
            )}

            <div className="seed-list">
              {garden.seeds.map((seed) => {
                const status = seedStatusForCrop(garden, seed.cropId);
                return <article key={seed.id}><div className="seed-art">{cropArt(seed.cropId)}</div><span><strong>{seed.name}</strong><small>{seed.variety || 'Variety not entered'} • packet {seed.packetYear}</small></span><em className={`seed-tone-${status.tone}`}>{status.label}</em></article>;
              })}
              {!garden.seeds.length && <button className="empty-seeds" onClick={() => setShowSeedForm(true)}><PackagePlus /><span><strong>Add the seed packets already in the house.</strong><small>Then planting advice can say “already owned” instead of creating an unnecessary shopping trip.</small></span><ChevronRight /></button>}
            </div>

            <section className="seed-shopping">
              <ShoppingBasket size={22} />
              <div><span className="section-kicker">POSSIBLE SHOPPING LIST</span><h3>{shopping.length ? `${shopping.length} common crop${shopping.length === 1 ? '' : 's'} not recorded` : 'The common crop list is covered'}</h3><p>{shopping.length ? shopping.map((crop) => crop.name).join(' • ') : 'Nothing to add based on the current catalog.'}</p></div>
            </section>
          </>
        )}

        <section className="succession-helper">
          <Seedling size={26} />
          <div><span className="section-kicker">SUCCESSION PLANTING</span><h3>Small batches instead of one giant harvest</h3><p>Open any tracked lettuce, spinach, green onion, or basil plant and schedule its next batch. The date then appears here automatically.</p></div>
          <CheeseIcon />
        </section>
      </section>
    </main>
  );
}
