import React from'react';
import{ChevronDown,ChevronRight,CircleHelp,DatabaseBackup,Info,LifeBuoy,MapPin,Settings,Sprout}from'lucide-react';

const LinkRow=({icon:Icon,title,subtitle,onClick})=><button type="button" className="more-link-row" onClick={onClick} aria-label={`${title}. ${subtitle}`}><span className="more-link-icon"><Icon/></span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight/></button>;

const HELP=[
 ['Where do I find things?','Today is immediate weather and work. Garden shows current plants and Growing Spaces. Center holds chores, seeds, planting, indoor growing, records, and next-season planning. Tool Shed holds optional labels and print utilities. More holds settings, backup, updates, and support.'],
 ['Why is the app recommending something that is not in Seed Inventory?','The app checks owned seed packets first. When none are a strong seasonal fit, it may recommend a suitable crop so there is time to purchase seeds or plants.'],
 ['What does In Seed Inventory mean?','A usable owned packet or saved seed record matches the recommendation. Exact packet brand, variety, quantity, and timing are used when available.'],
 ['What does Seeds Needed mean?','The crop fits the planting window, but no usable matching seed is recorded. The app does not invent a brand, variety, packet, or quantity.'],
 ['What does Saved Idea mean?','The planting opportunity was saved for later review. It is not an active planting and does not reduce seed inventory.'],
 ['What does Already Planned mean?','A matching active planting or saved plan already exists, so the app avoids creating a duplicate recommendation.'],
 ['What is the difference between the Chore Board and Planting Desk?','The Chore Board holds actions needing attention. The Planting Desk focuses on what to start, sow, harden off, transplant, or plan next.'],
 ['How does Smart Watering work?','It considers crop, lifecycle stage, Growing Space, recent rain, heat, and saved soil or watering observations. Check the soil before recording watering.'],
 ['What is Plant Journey?','Plant Journey is the history and current status for one planting or batch, including packet, variety, stage, estimates, milestones, notes, photos, watering, harvests, and problems.']
];

export default function MoreHub({garden,navigate}){
 const active=garden.profile?.gardenerName||'Brooke';
 const openProfile=section=>{sessionStorage.setItem('settings-destination',section);navigate('profile')};
 return <main className="screen more-screen">
  <section className="dark-header garden-header more-header"><Sprout/><span>THE RUNYAN GARDEN</span><h1>More</h1><p>Garden settings, data controls, updates, and help.</p></section>
  <section className="screen-pad more-content">
   <div className="more-group"><div className="more-group-heading"><span>GARDEN PROFILE</span><small>Currently gardening as {active}</small></div><div className="more-list"><LinkRow icon={Settings} title="Garden Settings" subtitle="Profiles, location, Growing Zone, and app preferences" onClick={()=>openProfile('settings')}/><LinkRow icon={MapPin} title="Location and Frost Dates" subtitle="Review the Green Bay location used for weather and planting guidance" onClick={()=>openProfile('location')}/></div></div>
   <div className="more-group"><div className="more-group-heading"><span>DATA</span><small>Keep a recovery copy of the garden.</small></div><div className="more-list"><LinkRow icon={DatabaseBackup} title="Backup and Restore" subtitle="Download a backup and review recovery options" onClick={()=>openProfile('backup')}/></div></div>
   <div className="more-group"><div className="more-group-heading"><span>HELP AND ABOUT</span><small>Plain-language help and app information.</small></div><div className="more-list"><LinkRow icon={Info} title="What’s New and About" subtitle="Version details and meaningful user-facing changes" onClick={()=>openProfile('about')}/><LinkRow icon={LifeBuoy} title="Help and Support" subtitle="Open an email with the app name and version ready to include" onClick={()=>window.location.href='mailto:?subject=Runyan%20Garden%20Support'}/></div></div>
   <details className="more-help current-quick-help"><summary><CircleHelp/><span><strong>Quick Help</strong><small>Navigation and recommendations in plain language</small></span><ChevronRight/></summary><div className="more-help-list">{HELP.map(([title,text])=><details key={title} className="quick-help-topic"><summary><strong>{title}</strong><ChevronDown/></summary><p>{text}</p></details>)}</div></details>
  </section>
 </main>;
}
