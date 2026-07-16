import React from 'react';
import { BookOpen, ChevronRight, ClipboardList, HardDriveDownload, Settings, Sprout, Warehouse } from 'lucide-react';

const LinkCard=({icon:Icon,title,subtitle,onClick})=><button className="more-link-card" onClick={onClick}><span className="more-link-icon"><Icon/></span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight/></button>;

export default function MoreHub({garden,navigate}){
 const active=(garden.profile?.gardenerName||'Brooke');
 return <main className="screen more-screen">
  <section className="dark-header more-header"><span>THE REST OF THE TOOL SHED</span><h1>More</h1><p>Settings, records, indoor systems, and the useful things you do not need in the bottom bar every day.</p></section>
  <section className="screen-pad more-content">
   <section className="more-current-user"><Sprout/><span><small>CURRENT GARDENER</small><strong>{active}</strong></span></section>
   <div className="more-grid">
    <LinkCard icon={Settings} title="Garden Settings" subtitle="Profiles, Green Bay location, backup, sync readiness, version, and app information" onClick={()=>navigate('profile')}/>
    <LinkCard icon={Warehouse} title="Indoor Growing" subtitle="Seedlings, recommended lights, greenhouse care, hardening off, and winter crops" onClick={()=>navigate('indoor')}/>
    <LinkCard icon={BookOpen} title="Garden Records" subtitle="Harvests, problems, favorites, lessons, and the history that improves next year" onClick={()=>navigate('memory')}/>
    <LinkCard icon={ClipboardList} title="Garden Chore Board" subtitle="The full task hub, completed work, and tomorrow preview" onClick={()=>navigate('chores')}/>
   </div>
   <section className="more-backup-note"><HardDriveDownload/><span><strong>Shared garden is the next major milestone.</strong><small>Your local garden can be backed up from Garden Settings before migration.</small></span></section>
  </section>
 </main>
}