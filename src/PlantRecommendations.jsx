import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Leaf, MapPin, Sprout } from 'lucide-react';
import { cropArt } from './art.jsx';

const GROUPS = [
  { id: 'indoors', label: 'Start indoors now', help: 'Seeds to begin under grow lights before they move outside.' },
  { id: 'outside', label: 'Plant outside now', help: 'Seeds or young plants that can go into an outdoor bed now.' },
  { id: 'grow-inside', label: 'Grow indoors now', help: 'Crops that can stay inside and be harvested there.' },
  { id: 'existing', label: 'Already growing', help: 'Seasonal care for crops that should already be underway.' },
  { id: 'later', label: 'Plan for later', help: 'Useful upcoming windows, but nothing needs planting today.' },
];

function recommendationGroup(crop) {
  const status = String(crop.status || '').toLowerCase();
  const timing = String(crop.timing || '').toLowerCase();
  if (status.includes('start indoors')) return 'indoors';
  if (status.includes('direct sow') || status.includes('plant outdoors') || status.includes('transplant')) return 'outside';
  if (status.includes('care') || status.includes('harvest') || timing.includes('existing')) return 'existing';
  if (['lettuce', 'spinach', 'onions', 'basil'].includes(crop.id) && ['winter', 'spring'].includes(crop.indoorSeason)) return 'grow-inside';
  return 'later';
}

function CropCard({ crop, setModal }) {
  return <button className="crop-card" onClick={() => setModal({ type: 'crop', crop })}>
    <div className="crop-art">{cropArt(crop.id)}</div>
    <div className="crop-copy"><h3>{crop.name}</h3><span>{crop.variety}</span><small>{crop.note}</small></div>
    <div className={`crop-status tone-${crop.tone}`}><Sprout size={19}/><span><strong>{crop.status}</strong><small>{crop.timing}</small></span></div>
    <ChevronRight size={20}/>
  </button>;
}

export default function PlantRecommendations({ recommendations, setModal, navigate }) {
  const [family, setFamily] = useState('all');
  const grouped = useMemo(() => {
    const visible = family === 'all' ? recommendations : recommendations.filter((crop) => crop.family === family);
    return GROUPS.map((group) => ({ ...group, crops: visible.filter((crop) => recommendationGroup(crop) === group.id) })).filter((group) => group.crops.length);
  }, [recommendations, family]);

  return <main className="screen plant-screen">
    <section className="dark-header plant-header">
      <button className="back-button" aria-label="Back to today" onClick={() => navigate('today')}><ChevronLeft/></button>
      <h1>What Can I<br/>Plant Now?</h1>
      <div className="location-row"><MapPin size={17}/> Green Bay, Wisconsin <span>USDA Zone 5b</span></div>
    </section>
    <section className="cream-panel plant-panel">
      <div className="season-note"><CalendarDays size={18}/><span><strong>Plain-language recommendations</strong> “Young plants” means seedlings already started indoors or purchased as small plants.</span></div>
      <div className="filter-row" aria-label="Crop filters">{['all','vegetables','herbs','flowers'].map((item)=><button key={item} className={family===item?'active':''} onClick={()=>setFamily(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}</div>
      <div className="recommendation-groups">
        {grouped.map((group)=><section key={group.id} className="recommendation-group"><div className="group-heading"><Leaf size={19}/><div><h2>{group.label}</h2><p>{group.help}</p></div></div><div className="crop-list">{group.crops.map((crop)=><CropCard key={crop.id} crop={crop} setModal={setModal}/>)}</div></section>)}
      </div>
    </section>
  </main>;
}
