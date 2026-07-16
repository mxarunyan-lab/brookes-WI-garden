import React from 'react';
import { ChevronRight, Info, QrCode, Sprout, UserRound, Warehouse } from 'lucide-react';
import { APP_VERSION, BUILD_ID, UPDATED_AT, WHATS_NEW } from './version.js';
import { DEFAULT_PROFILES, ProfileAvatar, ProfileSwitcher } from './RunyanProfiles.jsx';

const ACTIVE_PROFILE_KEY = 'runyan-garden-active-profile';
const GARDEN_KEY = 'brookes-garden-state-v2';

export default function SettingsCenter({ navigate }) {
  const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY) || 'brooke';
  const activeProfile = DEFAULT_PROFILES.find((profile) => profile.id === activeId) || DEFAULT_PROFILES[0];
  const switchProfile = (profileId) => {
    const selected = DEFAULT_PROFILES.find((profile) => profile.id === profileId) || DEFAULT_PROFILES[0];
    localStorage.setItem(ACTIVE_PROFILE_KEY, selected.id);
    try {
      const garden = JSON.parse(localStorage.getItem(GARDEN_KEY) || '{}');
      localStorage.setItem(GARDEN_KEY, JSON.stringify({ ...garden, profile: { ...(garden.profile || {}), gardenerName: selected.name, activeProfileId: selected.id } }));
    } catch {}
    localStorage.setItem('brookes-garden-page-v2', 'today');
    window.location.reload();
  };

  return <main className="screen simple-screen profile-screen settings-center">
    <section className="dark-header simple-header compact-simple-header">
      <div className="simple-icon"><UserRound /></div>
      <span>THE GARDEN OF THE RUNYANS</span>
      <h1>{activeProfile.name}’s Profile</h1>
      <p>One shared Green Bay garden, with a clear record of who watered, harvested, checked, or planned.</p>
    </section>
    <section className="profile-form-wrap">
      <div className="active-profile-strip"><ProfileAvatar profile={activeProfile} small /><span><small>Currently using the app</small><strong>{activeProfile.name} • {activeProfile.role}</strong></span></div>
      <ProfileSwitcher profiles={DEFAULT_PROFILES} activeId={activeProfile.id} onSwitch={switchProfile} />
      <p className="role-note">{activeProfile.id === 'brooke' ? 'Brooke is the primary garden planner. Planning and setup decisions are attributed to her profile.' : 'Archie can complete care work, record conditions, harvest, and add observations. Shared cross-phone syncing is the next infrastructure step.'}</p>

      <label>Weather location<input value="Green Bay, Wisconsin" disabled /></label>
      <label>USDA zone<input value="5b" disabled /></label>

      <button className="indoor-center-link" onClick={() => navigate('indoor')}><Warehouse /><span><strong>Indoor Growing Center</strong><small>Trays, lights, greenhouse, hardening off, and hydroponics</small></span><ChevronRight /></button>
      <button className="indoor-center-link" onClick={() => navigate('memory')}><Sprout /><span><strong>Garden Memory</strong><small>Harvest totals, favorites, problems, and seasonal lessons</small></span><ChevronRight /></button>
      <button className="indoor-center-link" onClick={() => navigate('seed-tools')}><QrCode /><span><strong>Seeds & QR Labels</strong><small>Photograph packets, confirm details, and print garden labels</small></span><ChevronRight /></button>

      <section className="version-center">
        <div className="version-title"><Info /><div><span className="section-kicker">ABOUT THIS APP</span><h2>The Garden of the Runyans</h2></div></div>
        <div className="version-grid"><span><small>Version</small><strong>{APP_VERSION}</strong></span><span><small>Build</small><strong>{BUILD_ID}</strong></span><span><small>Updated</small><strong>{UPDATED_AT}</strong></span><span><small>Storage</small><strong>On this device</strong></span></div>
        <div className="whats-new"><span className="section-kicker">WHAT’S NEW IN {APP_VERSION}</span>{WHATS_NEW.map((item) => <div key={item}><Sprout /><span>{item}</span></div>)}</div>
      </section>
    </section>
  </main>;
}
