import React from'react';
import{Bell,CircleHelp,DatabaseBackup,Info,LifeBuoy,MapPin,Sprout,Users}from'lucide-react';
import{SecondaryCard,SecondaryHero}from'./SecondaryUI.jsx';

export default function MoreHub({garden,navigate}){
 const active=garden.profile?.gardenerName||'Brooke',location=garden.profile?.location||'Green Bay',zone=garden.profile?.zone||'5b',notifications=garden.profile?.notifications||{};
 const alertStatus=[notifications.weather!==false&&'weather',notifications.tasks!==false&&'tasks',notifications.shopping!==false&&'shopping'].filter(Boolean).join(', ')||'all alerts off';
 return <main className="screen secondary-screen more-screen"><SecondaryHero icon={Sprout} eyebrow="THE RUNYAN GARDEN" title="More" description="Settings, data controls, help, and app information." className="more-hero"/><section className="screen-pad secondary-screen-content more-content"><div className="secondary-card-list more-compact-list">
  <SecondaryCard kind="admin" icon={Users} title="Garden Profile" description="Garden name and household gardeners" meta={`${active} active`} onClick={()=>navigate('admin-profile')}/>
  <SecondaryCard kind="admin" icon={MapPin} title="Location and Frost Dates" description="Saved weather and planting location" meta={`${location.replace(/\s+54302$/,'')} · Zone ${zone}`} onClick={()=>navigate('admin-location')}/>
  <SecondaryCard kind="admin" icon={Bell} title="Notification Settings" description="Weather, task, and shopping alerts" meta={alertStatus} onClick={()=>navigate('admin-notifications')}/>
  <SecondaryCard kind="admin" icon={DatabaseBackup} title="Backup and Restore" description="Create or restore a recovery copy" meta={garden.profile?.lastBackupAt?'Backup date saved':'No backup date recorded'} onClick={()=>navigate('admin-backup')}/>
  <SecondaryCard kind="admin" icon={CircleHelp} title="Quick Help" description="Navigation and feature guidance" onClick={()=>navigate('admin-help')}/>
  <SecondaryCard kind="admin" icon={Sprout} title="What’s New" description="Recent app improvements" onClick={()=>navigate('admin-whatsnew')}/>
  <SecondaryCard kind="admin" icon={LifeBuoy} title="Help and Support" description="Prepare an issue email" onClick={()=>navigate('admin-support')}/>
  <SecondaryCard kind="admin" icon={Info} title="About" description="Version and app information" onClick={()=>navigate('admin-about')}/>
 </div></section></main>;
}
