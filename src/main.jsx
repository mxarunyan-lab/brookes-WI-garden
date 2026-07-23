import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { DEFAULT_PROFILES, ProfileChooser } from './RunyanProfiles.jsx';
import './styles.css';
import './styles/phase-4-7-3-smoothing.css';
import './styles/phase-4-7-4-certification.css';
import './styles/phase-4-7-5-navigation-lock.css';
import './styles/phase-4-7-5-card-layout-lock.css';
import './styles/phase-4-7-6-seasonal-header.css';
import './styles/phase-4-7-8-urgent-home.css';
import './styles/phase-4-8-1-mobile-continuity.css';
import './styles/phase-4-8-2-weather-truth.css';
import './styles/phase-4-8-3-first-time-clarity.css';
import './seasonalHeaderRuntime.js';
import './legacyQrFocus.js';

const ACTIVE_PROFILE_KEY = 'runyan-garden-active-profile';
const GARDEN_KEY = 'brookes-garden-state-v2';
const PAGE_KEY = 'brookes-garden-page-v2';
const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStorage = (key, value) => { try { localStorage.setItem(key, value); return true; } catch (error) { console.error(`[Runyan Garden] Could not save ${key}`, error); return false; } };

function RootApp() {
 const [activeProfileId, setActiveProfileId] = useState(() => readStorage(ACTIVE_PROFILE_KEY));
 const chooseProfile = (profileId) => {
  const selected = DEFAULT_PROFILES.find((profile) => profile.id === profileId) || DEFAULT_PROFILES[0];
  writeStorage(ACTIVE_PROFILE_KEY, selected.id);
  writeStorage(PAGE_KEY, 'today');
  try { const garden = JSON.parse(readStorage(GARDEN_KEY) || '{}'); writeStorage(GARDEN_KEY, JSON.stringify({ ...garden, profile: { ...(garden.profile || {}), gardenerName: selected.name, activeProfileId: selected.id } })); }
  catch (error) { console.error('[Runyan Garden] Could not update the active gardener profile', error); }
  setActiveProfileId(selected.id);
 };
 if (!activeProfileId) return <ProfileChooser profiles={DEFAULT_PROFILES} onChoose={chooseProfile} />;
 return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><RootApp /></React.StrictMode>);
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
