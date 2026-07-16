import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Leaf, Sprout, TriangleAlert } from 'lucide-react';

export default function GardenMemory({ garden, navigate, resolveProblem }) {
  const [tab, setTab] = useState('overview');
  const harvests = garden.harvests || [];
  const problems = garden.problems || [];
  const active = problems.filter((x) => x.status !== 'resolved');
  const resolved = problems.filter((x) => x.status === 'resolved');
  const totals = useMemo(() => {
    const map = new Map();
    harvests.forEach((h) => {
      const row = map.get(h.name) || { name: h.name, count: 0, amounts: {}, growAgain: h.growAgain };
      row.count += 1;
      row.amounts[h.unit] = (row.amounts[h.unit] || 0) + (Number(h.amount) || 0);
      if (h.growAgain) row.growAgain = h.growAgain;
      map.set(h.name, row);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [harvests]);

  return <main className="screen memory-screen">
    <section className="dark-header memory-header">
      <button className="back-button" onClick={() => navigate('profile')} aria-label="Back"><ArrowLeft /></button>
      <Sprout />
      <span>THE GARDEN REMEMBERS</span>
      <h1>Garden Memory</h1>
      <p>Harvests, problems, favorites, and what to change next season.</p>
    </section>
    <section className="memory-body screen-pad">
      <div className="memory-tabs">
        {['overview', 'harvests', 'problems', 'review'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      {tab === 'overview' && <div className="memory-summary-grid"><article><strong>{harvests.length}</strong><span>Harvest records</span></article><article><strong>{totals.length}</strong><span>Crops harvested</span></article><article><strong>{active.length}</strong><span>Active issues</span></article><article><strong>{resolved.length}</strong><span>Resolved issues</span></article></div>}
      {tab === 'harvests' && <section className="memory-list">{totals.length ? totals.map((row) => <article key={row.name}><Leaf /><span><strong>{row.name}</strong><small>{row.count} harvest{row.count === 1 ? '' : 's'} • {Object.entries(row.amounts).map(([unit, amount]) => `${amount} ${unit}`).join(', ')}</small><small>{row.growAgain || 'No grow-again rating yet'}</small></span></article>) : <div className="empty-memory"><Leaf /><span><strong>No harvests yet.</strong><small>Harvest records appear here automatically.</small></span></div>}</section>}
      {tab === 'problems' && <section className="memory-list">{active.map((problem) => <article key={problem.id}><TriangleAlert /><span><strong>{problem.type}</strong><small>{problem.severity} • {problem.note}</small></span><button onClick={() => resolveProblem(problem.id)}><CheckCircle2 /> Resolve</button></article>)}{!active.length && <div className="empty-memory"><CheckCircle2 /><span><strong>No active problems.</strong><small>Resolved issues remain part of the season history.</small></span></div>}</section>}
      {tab === 'review' && <section className="season-review"><span className="section-kicker">2026 SEASON REVIEW</span><h2>What the records say so far</h2><p>{totals[0] ? `${totals[0].name} has been harvested most often.` : 'Harvest some crops to begin the production review.'}</p><p>{active.length ? `${active.length} issue${active.length === 1 ? '' : 's'} still need attention.` : 'No unresolved garden problems are currently recorded.'}</p><p>{totals.filter((x) => String(x.growAgain).toLowerCase().includes('skip')).length ? 'At least one crop is marked to skip next season.' : 'No crops are currently marked to skip next season.'}</p></section>}
    </section>
  </main>;
}