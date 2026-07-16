import React from 'react';
import { ChevronRight, Info, QrCode, Sprout, UserRound, Warehouse } from 'lucide-react';
import { APP_VERSION, BUILD_ID, UPDATED_AT, WHATS_NEW } from './version.js';
import { DEFAULT_PROFILES, ProfileAvatar, ProfileSwitcher } from './RunyanProfiles.jsx';

const ACTIVE_PROFILE_KEY='runyan-garden-active-profile';
const GARDEN_KEY='brookes-garden-state-v2';

export default function SettingsCenter({navigate}){
 const activeId=localStorage.getItem(ACTIVE_PROFILE_KEY)||'brooke';
 const activeProfile=DEFAULT_PROFILES.find((profile)=>profile.id===activeId)||DEFAULT_PROFILES[0];
 const switchProfile=(profileId)=>{const selected=DEFAULT_PROFILES.find((profile)=>profile.id===profileId)||DEFAULT_PROFILES[0];localStorage.setItem(ACTIVE_PROFILE_KEY,selected.id);try{const garden=JSON.parse(localStorage.getItem(GARDEN_KEY)||'{}');localStorage.setItem(GARDEN_KEY,JSON.stringify({...garden,profile:{...(garden.profile||{}),gardenerName:selected.name,activeProfileId:selected.id}}));}catch{}localStorage.setItem('brookes-garden-page-v2','today');window.scrollTo(0,0);window.location.reload();};
 return <main className="screen simple-screen profile-screen settings-center"><section className="dark-header simple-header compact-simple-header"><div className="simple-icon"><UserRound/></div><span>THE RUNYAN GARDEN</span><h1>{activeProfile.name}’s Profile</h1><p>One shared garden. The active profile simply records who handled the work.</p></section><section className="profile-form-wrap">
  <section className="settings-group"><span className="section-kicker">WHO’S GARDENING</span><div className="active-profile-strip"><ProfileAvatar profile={activeProfile} small/><span><small>Currently using the app</small><strong>{activeProfile.name}</strong><em>{activeProfile.role}</em></span></div><ProfileSwitcher profiles={DEFAULT_PROFILES} activeId={activeProfile.id} onSwitch={switchProfile}/><p className="role-note">No boss and no helper. Both profiles use the same garden plan and can complete care, record observations, harvest, and keep things alive.</p></section>
  <section className="settings-group"><span className="section-kicker">RUNYAN GARDEN CENTERS</span><button className="indoor-center-link" onClick={()=>navigate('indoor')}><Warehouse/><span><strong>Indoor Growing Center</strong><small>Trays, lights, greenhouse, hardening off, and hydroponics</small></span><ChevronRight/></button><button className="indoor-center-link" onClick={()=>navigate('memory')}><Sprout/><span><strong>Runyan Garden Memory</strong><small>Harvest totals, favorites, problems, and seasonal lessons</small></span><ChevronRight/></button><button className="indoor-center-link" onClick={()=>navigate('seed-tools')}><QrCode/><span><strong>Runyan Seed Box & QR Labels</strong><small>Photograph packets, confirm details, and print labels</small></span><ChevronRight/></button></section>
  <section className="settings-group"><span className="section-kicker">GARDEN LOCATION</span><label>Weather location<input value="Green Bay, Wisconsin" disabled/></label><label>USDA zone<input value="5b" disabled/></label></section>
  <section className="version-center"><div className="version-title"><Info/><div><span className="section-kicker">ABOUT THIS APP</span><h2>The Runyan Garden</h2></div></div><div className="version-grid"><span><small>Version</small><strong>{APP_VERSION}</strong></span><span><small>Build</small><strong>{BUILD_ID}</strong></span><span><small>Updated</small><strong>{UPDATED_AT}</strong></span><span><small>Storage</small><strong>On this device</strong></span></div><div className="whats-new"><span className="section-kicker">WHAT’S NEW IN {APP_VERSION}</span>{WHATS_NEW.map((item)=><div key={item}><Sprout/><span>{item}</span></div>)}</div></section>
 </section></main>;
}
