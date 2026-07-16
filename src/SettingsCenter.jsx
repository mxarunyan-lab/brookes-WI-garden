import React from 'react';
import { ChevronRight, Info, QrCode, Sprout, UserRound, Warehouse } from 'lucide-react';
import { APP_VERSION, BUILD_ID, UPDATED_AT, WHATS_NEW } from './version.js';
import { ProfileAvatar, ProfileSwitcher } from './RunyanProfiles.jsx';

export default function SettingsCenter({ profiles, activeProfile, switchProfile, navigate }) {
  return <main className="screen simple-screen profile-screen settings-center">
    <section className="dark-header simple-header compact-simple-header">
      <div className="simple-icon"><UserRound /></div>
      <span>THE GARDEN OF THE RUNYANS</span>
      <h1>{activeProfile.name}’s Profile</h1>
      <p>One shared Green Bay garden, with a clear record of who watered, harvested, checked, or planned.</p>
    </section>
    <section className="profile-form-wrap">
      <div className="active-profile-strip"><ProfileAvatar profile={activeProfile} small /><span><small>Currently using the app</small><strong>{activeProfile.name} • {activeProfile.role}</strong></span></div>
      <ProfileSwitcher profiles={profiles} activeId={activeProfile.id} onSwitch={switchProfile} />
      <p className="role-note">{activeProfile.id === 'brooke' ? 'Brooke is the primary garden planner. Planning and setup decisions are attributed to her profile.' : 'Archie can complete care work, record conditions, harvest, and add observations. Shared cloud syncing is the next infrastructure step.'}</p>

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
