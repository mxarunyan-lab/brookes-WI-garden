import React,{useMemo,useState}from'react';
import{CalendarCheck,Check,ChevronRight,Clock3,Leaf,PackageSearch,ShoppingBasket,Sprout,X}from'lucide-react';
import{cropCatalog}from'./data.js';

const FALL_OPTIONS=[
 {cropId:'lettuce',timing:'Sow now through early August',harvest:'Baby leaves in about 30 days; fuller heads around 45–55 days',why:'Fast, shallow-rooted, and well suited to cooler fall weather.'},
 {cropId:'spinach',timing:'Best from late July into August',harvest:'Baby leaves in roughly 30–40 days',why:'Prefers cooling weather and can tolerate light frost.'},
 {cropId:'radish',timing:'Sow from late July through August',harvest:'Many varieties finish in about 25–35 days',why:'One of the quickest reliable fall crops.'},
 {cropId:'kale',timing:'Start now for fall leaves',harvest:'Baby leaves first; mature harvest later in fall',why:'Cold tolerant and often improves in flavor after light frost.'},
 {cropId:'carrot',timing:'Sow promptly for a fall crop',harvest:'Variety dependent; smaller roots can be harvested earlier',why:'Cool fall weather supports good root quality, but the window closes earlier than radishes.'},
 {cropId:'peas',timing:'Possible for an early-fall crop if started promptly',harvest:'Choose a fast variety and allow roughly 55–65 days',why:'Cool-weather crop, but timing is tighter than leafy greens.'}
];

const cropFor=id=>cropCatalog.find(c=>c.id===id)||{id,name:id};
const savedFor=(garden,id)=>(garden.seeds||[]).find(s=>!s.deletedAt&&s.cropId===id);

export default function SeasonalChore({task,garden,onAdd,onDone,onSnooze,onSkip,close}){
 const[selected,setSelected]=useState(null);
 const options=useMemo(()=>FALL_OPTIONS.map(o=>({...o,crop:cropFor(o.cropId),seed:savedFor(garden,o.cropId)})),[garden]);
 const owned=options.filter(o=>o.seed),ideas=options.filter(o=>!o.seed);
 const choose=o=>setSelected(o);
 const plant=o=>{onAdd(o.crop);close()};
 return <div className="seasonal-guide">
  <button className="modal-close" onClick={close}><X/></button>
  <span className="modal-kicker">GREEN BAY FALL PLANTING GUIDE</span>
  <h2>What can still become a fall harvest?</h2>
  <p className="seasonal-guide-intro">The app checked the time of year, Green Bay’s short remaining season, and the seed records already saved in your Garden Center. Quick and cold-tolerant crops are listed first.</p>
  {owned.length>0&&<section className="seasonal-group owned-seasonal"><div className="seasonal-group-heading"><PackageSearch/><span><strong>Start with seeds you already own</strong><small>No shopping required unless the packet is empty or unreliable.</small></span></div><div className="seasonal-option-grid">{owned.map(o=><button key={o.cropId} className={selected?.cropId===o.cropId?'selected':''} onClick={()=>choose(o)}><Sprout/><span><strong>{o.crop.name}</strong><small>{o.seed.variety||o.crop.variety||'Saved packet'} · packet {o.seed.packetYear||'year unknown'}</small><em>{o.timing}</em></span><ChevronRight/></button>)}</div></section>}
  <section className="seasonal-group"><div className="seasonal-group-heading"><Leaf/><span><strong>{owned.length?'Other good possibilities':'Good possibilities even without saved seed'}</strong><small>You can still choose one and add the seed to the shopping list later.</small></span></div><div className="seasonal-option-grid">{ideas.map(o=><button key={o.cropId} className={selected?.cropId===o.cropId?'selected':''} onClick={()=>choose(o)}><ShoppingBasket/><span><strong>{o.crop.name}</strong><small>No matching seed packet saved</small><em>{o.timing}</em></span><ChevronRight/></button>)}</div></section>
  {selected&&<section className="seasonal-choice-detail"><CalendarCheck/><div><span className="section-kicker">RECOMMENDATION</span><h3>{selected.crop.name}</h3><p>{selected.why}</p><dl><div><dt>When</dt><dd>{selected.timing}</dd></div><div><dt>Expected harvest</dt><dd>{selected.harvest}</dd></div><div><dt>Seed status</dt><dd>{selected.seed?`${selected.seed.variety||selected.seed.name} is in the Seed Counter`:'No saved packet; the Garden Center should flag this as a possible purchase'}</dd></div></dl><button className="primary-button" onClick={()=>plant(selected)}>Add {selected.crop.name} to the garden plan</button></div></section>}
  <div className="seasonal-chore-actions"><button onClick={()=>{onDone(task.id);close()}}><Check/>I reviewed the options</button><button onClick={()=>{onSnooze(task.id,1);close()}}><Clock3/>Remind me tomorrow</button><button onClick={()=>{onSkip(task.id);close()}}>Skip fall planting this year</button></div>
 </div>;
}
