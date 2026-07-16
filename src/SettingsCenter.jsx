import React, { useState } from 'react';
import { BookHeart, ChevronRight, Info, Sprout, UserRound, Warehouse } from 'lucide-react';
import MemoryCenter from './MemoryCenter.jsx';
import { APP_VERSION, BUILD_ID, UPDATED_AT, WHATS_NEW } from './version.js';

const GARDEN_KEY = 'brookes-garden-state-v2';
function loadGarden() { try { return JSON.parse(localStorage.getItem(GARDEN_KEY) || '{}'); } catch { return {}; } }

export default function SettingsCenter({ profile, updateProfile, navigate }) {
  const [name, setName] = useState(profile.gardenerName || 'Brooke');
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryGarden, setMemoryGarden] = useState(() => loadGarden());
  const openMemory = () => { setMemoryGarden(loadGarden()); setMemoryOpen(true); };
  const resolveProblem = (problemId) => {
    const garden = loadGarden();
    const now = new Date().toISOString();
    const actor = garden.profile?.gardenerName || 'Brooke';
    const next = { ...garden, problems: (garden.problems || []).map((item) => item.id === problemId ? { ...item, status: 'resolved', resolvedAt: now, actor } : item), activity: [{ id: `activity-${Date.now()}`, at: now, actor, type: 'problem-resolved', title: 'Garden problem resolved', detail: 'Moved to resolved problem history.' }, ...(garden.activity || [])] };
    localStorage.setItem(GARDEN_KEY, JSON.stringify(next));
    setMemoryGarden(next);
  };
  if (memoryOpen) return <MemoryCenter garden={memoryGarden} navigate={() => setMemoryOpen(false)} resolveProblem={resolveProblem} />;
  return <main className="screen simple-screen profile-screen settings-center">
    <section className="dark-header simple-header compact-simple-header">
      <div className="simple-icon"><UserRound /></div>
      <span>RUNYAN GARDEN CENTER</span>
      <h1>{name}’s Profile</h1>
      <p>Green Bay weather, year-round growing, garden memory, and the exact version running on this device.</p>
    </section>
    <section className="profile-form-wrap">
      <label>Gardener name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Weather location<input value="Green Bay, Wisconsin" disabled /></label>
      <label>USDA zone<input value="5b" disabled /></label>
      <button className="primary-button" onClick={() => updateProfile({ gardenerName: name.trim() || 'Brooke' })}>Save profile</button>
      <button className="indoor-center-link" onClick={() => navigate('indoor')}><Warehouse /><span><strong>Indoor Growing Center</strong><small>Trays, lights, greenhouse, hardening off, and hydroponics</small></span><ChevronRight /></button>
      <button className="indoor-center-link" onClick={openMemory}><BookHeart /><span><strong>Garden Memory</strong><small>Harvests, favorites, problems, and seasonal lessons</small></span><ChevronRight /></button>
      <section className="version-center">
        <div className="version-title"><Info /><div><span className="section-kicker">ABOUT THIS APP</span><h2>Brooke’s Wisconsin Garden</h2></div></div>
        <div className="version-grid"><span><small>Version</small><strong>{APP_VERSION}</strong></span><span><small>Build</small><strong>{BUILD_ID}</strong></span><span><small>Updated</small><strong>{UPDATED_AT}</strong></span><span><small>Environment</small><strong>Production</strong></span></div>
        <div className="whats-new"><span className="section-kicker">WHAT’S NEW IN {APP_VERSION}</span>{WHATS_NEW.map((item) => <div key={item}><Sprout /><span>{item}</span></div>)}</div>
      </section>
    </section>
  </main>;
}