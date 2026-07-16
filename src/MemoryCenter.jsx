import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Leaf, Sprout, Star, Trophy, UserRound } from 'lucide-react';
import { formatDateTime } from './data.js';

function totalByCrop(harvests) {
  return harvests.reduce((map, item) => {
    const key = item.name || 'Unknown crop';
    if (!map[key]) map[key] = { name: key, count: 0, amount: 0, units: new Set(), love: 0, skip: 0 };
    map[key].count += 1;
    map[key].amount += Number(item.amount) || 0;
    map[key].units.add(item.unit || 'harvest');
    if (item.growAgain === 'yes') map[key].love += 1;
    if (item.growAgain === 'no') map[key].skip += 1;
    return map;
  }, {});
}

export default function MemoryCenter({ garden, navigate, resolveProblem }) {
  const [tab, setTab] = useState('summary');
  const harvests = garden.harvests || [];
  const problems = garden.problems || [];
  const activeProblems = problems.filter((item) => item.status !== 'resolved');
  const resolvedProblems = problems.filter((item) => item.status === 'resolved');
  const cropTotals = useMemo(() => Object.values(totalByCrop(harvests)).sort((a, b) => b.count - a.count), [harvests]);
  const favorite = cropTotals.find((item) => item.love > 0);
  const skip = cropTotals.find((item) => item.skip > 0);
  const actorCounts = (garden.activity || []).reduce((map, item) => { const actor = item.actor || 'Brooke'; map[actor] = (map[actor] || 0) + 1; return map; }, {});

  return <main className="screen memory-screen">
    <section className="dark-header memory-header">
      <button className="back-button" onClick={() => navigate('profile')}><ArrowLeft /></button>
      <Leaf size={26} />
      <span>THE GARDEN REMEMBERS</span>
      <h1>Garden Memory</h1>
      <p>Harvests, favorites, problems, and lessons that carry into next season.</p>
    </section>
    <section className="memory-content screen-pad">
      <div className="memory-tabs">
        {['summary','harvests','problems','review'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'summary' ? 'Overview' : item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>

      {tab === 'summary' && <>
        <div className="memory-stat-grid">
          <article><Trophy /><span><strong>{harvests.length}</strong><small>harvest records</small></span></article>
          <article><AlertTriangle /><span><strong>{activeProblems.length}</strong><small>active problems</small></span></article>
          <article><Star /><span><strong>{favorite?.name || 'Not rated yet'}</strong><small>grow-again favorite</small></span></article>
        </div>
        <section className="memory-card"><span className="section-kicker">WHAT THE APP REMEMBERS</span><h2>Useful lessons, not just a diary</h2>
          {favorite ? <p><strong>{favorite.name}</strong> has been marked as worth growing again.</p> : <p>Log a harvest and answer “grow again?” to begin building favorites.</p>}
          {skip && <p><strong>{skip.name}</strong> was marked as one to skip next year.</p>}
          {activeProblems.length > 0 && <p>{activeProblems.length} issue{activeProblems.length === 1 ? '' : 's'} still need attention.</p>}
        </section>
        <section className="memory-card"><span className="section-kicker">RUNYAN ACTIVITY FOUNDATION</span><h2>Who has been helping</h2><div className="actor-list">{Object.entries(actorCounts).length ? Object.entries(actorCounts).map(([actor,count]) => <div key={actor}><UserRound /><span><strong>{actor}</strong><small>{count} recorded action{count === 1 ? '' : 's'}</small></span></div>) : <p>Actions will be attributed as Brooke, Archie, or System as shared profiles are introduced.</p>}</div></section>
      </>}

      {tab === 'harvests' && <>
        <div className="memory-section-title"><span className="section-kicker">THIS SEASON</span><h2>Harvest Center</h2></div>
        {cropTotals.length ? <div className="crop-memory-list">{cropTotals.map((crop) => <article key={crop.name}><Sprout /><span><strong>{crop.name}</strong><small>{crop.count} harvest{crop.count === 1 ? '' : 's'} • {crop.amount || 'Unmeasured'} total entered</small></span>{crop.love > 0 && <em>Grow again</em>}{crop.skip > 0 && <em className="skip">Skip next year</em>}</article>)}</div> : <div className="memory-empty">No harvests yet. Log them from a plant’s control center.</div>}
        <div className="harvest-history">{harvests.map((item) => <article key={item.id}><strong>{item.name}</strong><span>{item.amount} {item.unit} • {item.quality || 'Unrated'}</span><small>{formatDateTime(item.at)} • {item.actor || 'Brooke'}</small>{item.note && <p>{item.note}</p>}</article>)}</div>
      </>}

      {tab === 'problems' && <>
        <div className="memory-section-title"><span className="section-kicker">WATCH, HANDLE, RESOLVE</span><h2>Problem Center</h2></div>
        <h3 className="problem-heading">Active</h3>
        {activeProblems.length ? <div className="problem-list">{activeProblems.map((item) => <article key={item.id}><AlertTriangle /><span><strong>{item.type}</strong><small>{garden.plants.find((plant) => plant.id === item.plantId)?.name || 'Plant'} • {item.severity}</small><p>{item.note}</p></span><button onClick={() => resolveProblem(item.id)}><CheckCircle2 /> Resolve</button></article>)}</div> : <div className="memory-empty">No active problems recorded.</div>}
        <h3 className="problem-heading">Resolved</h3>
        {resolvedProblems.length ? <div className="problem-list resolved">{resolvedProblems.map((item) => <article key={item.id}><CheckCircle2 /><span><strong>{item.type}</strong><small>{formatDateTime(item.resolvedAt)} • {item.actor || 'Brooke'}</small><p>{item.note}</p></span></article>)}</div> : <div className="memory-empty compact">Resolved issues will stay here for next year’s reference.</div>}
      </>}

      {tab === 'review' && <>
        <div className="memory-section-title"><span className="section-kicker">2026 SEASON REVIEW</span><h2>What should change next year?</h2></div>
        <div className="review-grid">
          <article><Star /><strong>Grow again</strong><p>{cropTotals.filter((item) => item.love > 0).map((item) => item.name).join(', ') || 'No favorites rated yet.'}</p></article>
          <article><AlertTriangle /><strong>Skip or reconsider</strong><p>{cropTotals.filter((item) => item.skip > 0).map((item) => item.name).join(', ') || 'Nothing has been marked to skip.'}</p></article>
          <article><Trophy /><strong>Most frequently harvested</strong><p>{cropTotals[0]?.name || 'Harvest data will identify this.'}</p></article>
          <article><CheckCircle2 /><strong>Problems handled</strong><p>{resolvedProblems.length} resolved • {activeProblems.length} still active</p></article>
        </div>
        <p className="review-note">This review updates automatically from real records. Future versions will compare seasons and suggest timing or variety changes.</p>
      </>}
    </section>
  </main>;
}
