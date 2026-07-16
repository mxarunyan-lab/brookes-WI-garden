import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { DEFAULT_PROFILES, ProfileChooser } from './RunyanProfiles.jsx';
import './styles.css';

const ACTIVE_PROFILE_KEY = 'runyan-garden-active-profile';
const GARDEN_KEY = 'brookes-garden-state-v2';
const PAGE_KEY = 'brookes-garden-page-v2';

function RootApp() {
  const [activeProfileId, setActiveProfileId] = useState(() => localStorage.getItem(ACTIVE_PROFILE_KEY));

  const chooseProfile = (profileId) => {
    const selected = DEFAULT_PROFILES.find((profile) => profile.id === profileId) || DEFAULT_PROFILES[0];
    localStorage.setItem(ACTIVE_PROFILE_KEY, selected.id);
    localStorage.setItem(PAGE_KEY, 'today');
    try {
      const garden = JSON.parse(localStorage.getItem(GARDEN_KEY) || '{}');
      localStorage.setItem(GARDEN_KEY, JSON.stringify({
        ...garden,
        profile: { ...(garden.profile || {}), gardenerName: selected.name, activeProfileId: selected.id },
      }));
    } catch {}
    setActiveProfileId(selected.id);
    window.location.reload();
  };

  if (!activeProfileId) return <ProfileChooser profiles={DEFAULT_PROFILES} onChoose={chooseProfile} />;
  return <App />;
}

localStorage.setItem(PAGE_KEY, 'today');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
