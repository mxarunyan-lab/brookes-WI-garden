import React from'react';
import{Bell,CircleHelp,Info,MapPin,Sprout,Users}from'lucide-react';
import{SecondaryCard,SecondaryHero}from'./SecondaryUI.jsx';

export default function MoreHub({garden,navigate}){
 const active=garden.profile?.gardenerName||'Brooke',location=garden.profile?.location||'Green Bay',zone=garden.profile?.zone||'5b',notifications=garden.profile?.notifications||{};
 const alertStatus=[notifications.weather!==false&&'weather',notifications.tasks!==false&&'tasks',notifications.shopping!==false&&'shopping'].filter(Boolean).join(', ')||'all alerts off';
 return <main className="screen secondary-screen more-screen"><SecondaryHero icon={Sprout} eyebrow="GARDEN COMPASS" title="More" description="Account, garden settings, help, and app information." className="more-hero"/><section className="screen-pad secondary-screen-content more-content"><div className="secondary-card-list more-compact-list">
  <SecondaryCard kind="admin" icon={Users} title="Account" description="Garden name and active gardener" meta={`${active} active`} onClick={()=>navigate('admin-profile')}/>
  <SecondaryCard kind="admin" icon={MapPin} title="Garden Settings" description="Location and frost dates" meta={`${location.replace(/\s+54302$/,'')} - Zone ${zone}`} onClick={()=>navigate('admin-location')}/>
  <SecondaryCard kind="admin" icon={Bell} title="Garden Preferences" description="Weather, task, and shopping alerts" meta={alertStatus} onClick={()=>navigate('admin-notifications')}/>
  <SecondaryCard kind="admin" icon={CircleHelp} title="Quick Help" description="Navigation, support, and feature guidance" onClick={()=>navigate('admin-help')}/>
  <SecondaryCard kind="admin" icon={Info} title="About Garden Compass" description="Version and latest improvements" onClick={()=>navigate('admin-about')}/>
 </div></section></main>;
}
