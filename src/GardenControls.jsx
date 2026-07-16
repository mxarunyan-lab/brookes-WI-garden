import React, { useState } from 'react';
import { AlertTriangle, Archive, Leaf, Sprout, Trash2, X } from 'lucide-react';

const stages = ['Seed','Germinating','Seedling','Growing','Flowering','Producing','Ready to harvest','Dormant','Overwintering','Finished','Failed'];

export default function GardenControls({ modal, garden, close, savePlant, archivePlant, deletePlant, saveHarvest, saveProblem }) {
  const plant = garden.plants.find((item) => item.id === modal.plant?.id) || modal.plant;
  if (!plant) return null;
  const [view, setView] = useState(modal.view || 'plant');
  const [draft, setDraft] = useState({ ...plant });
  const [harvest, setHarvest] = useState({ amount: 1, unit: 'count', quality: 'Good', note: '', growAgain: 'yes' });
  const [problem, setProblem] = useState({ type: 'Pest spotted', severity: 'Keep watching', note: '' });

  const save = (event) => { event.preventDefault(); savePlant(plant.id, draft); close(); };
  const submitHarvest = (event) => { event.preventDefault(); saveHarvest(plant.id, harvest); close(); };
  const submitProblem = (event) => { event.preventDefault(); saveProblem(plant.id, problem); close(); };

  return <div className="overlay modal-overlay" onMouseDown={close}><section className="detail-modal control-modal" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" onClick={close} aria-label="Close"><X /></button>
    <span className="modal-kicker">PLANT CONTROL CENTER</span><h2>{plant.name}</h2>
    <div className="control-tabs"><button className={view==='plant'?'active':''} onClick={()=>setView('plant')}>Details</button><button className={view==='harvest'?'active':''} onClick={()=>setView('harvest')}>Harvest</button><button className={view==='problem'?'active':''} onClick={()=>setView('problem')}>Problem</button></div>
    {view === 'plant' && <form className="modal-form" onSubmit={save}>
      <label>Plant name<input value={draft.name || ''} onChange={(event)=>setDraft({...draft,name:event.target.value})} required /></label>
      <label>Variety<input value={draft.variety || ''} onChange={(event)=>setDraft({...draft,variety:event.target.value})} /></label>
      <div className="two-field-row"><label>Quantity<input type="number" min="1" value={draft.quantity || 1} onChange={(event)=>setDraft({...draft,quantity:Number(event.target.value)})} /></label><label>Started<input type="date" value={draft.plantedAt || ''} onChange={(event)=>setDraft({...draft,plantedAt:event.target.value})} /></label></div>
      <label>Growing space<select value={draft.spaceId || ''} onChange={(event)=>setDraft({...draft,spaceId:event.target.value})}>{garden.spaces.map((space)=><option key={space.id} value={space.id}>{space.name}{space.hidden?' (hidden)':''}</option>)}</select></label>
      <label>Current stage<select value={draft.stage || 'Growing'} onChange={(event)=>setDraft({...draft,stage:event.target.value})}>{stages.map((stage)=><option key={stage}>{stage}</option>)}</select></label>
      <label>Notes<textarea value={draft.notes || ''} onChange={(event)=>setDraft({...draft,notes:event.target.value})} placeholder="Growth, flavor, pests, things to remember next year…" /></label>
      <button className="primary-button" type="submit">Save plant changes</button>
      <div className="record-danger-zone"><button type="button" onClick={()=>archivePlant(plant.id)}><Archive /> Archive / finish</button><button type="button" className="danger-control" onClick={()=>deletePlant(plant.id)}><Trash2 /> Delete plant</button></div>
    </form>}
    {view === 'harvest' && <form className="modal-form" onSubmit={submitHarvest}>
      <div className="control-callout"><Leaf /><span><strong>Record what Brooke actually picked.</strong><small>Repeat-producing plants stay active.</small></span></div>
      <div className="two-field-row"><label>Amount<input type="number" min="0" step="0.1" value={harvest.amount} onChange={(event)=>setHarvest({...harvest,amount:Number(event.target.value)})} /></label><label>Unit<select value={harvest.unit} onChange={(event)=>setHarvest({...harvest,unit:event.target.value})}><option>count</option><option>ounces</option><option>pounds</option><option>handful</option><option>bunch</option><option>basket</option></select></label></div>
      <label>Quality<select value={harvest.quality} onChange={(event)=>setHarvest({...harvest,quality:event.target.value})}><option>Excellent</option><option>Good</option><option>Okay</option><option>Poor</option></select></label>
      <label>Grow this again?<select value={harvest.growAgain} onChange={(event)=>setHarvest({...harvest,growAgain:event.target.value})}><option value="yes">Yes</option><option value="maybe">Maybe</option><option value="no">No</option></select></label>
      <label>Harvest note<textarea value={harvest.note} onChange={(event)=>setHarvest({...harvest,note:event.target.value})} placeholder="Taste, size, what worked…" /></label>
      <button className="primary-button" type="submit">Save harvest</button>
    </form>}
    {view === 'problem' && <form className="modal-form" onSubmit={submitProblem}>
      <div className="control-callout warning"><AlertTriangle /><span><strong>Log what you see, not a guess.</strong><small>This creates a history without pretending to diagnose it.</small></span></div>
      <label>Problem type<select value={problem.type} onChange={(event)=>setProblem({...problem,type:event.target.value})}><option>Pest spotted</option><option>Disease concern</option><option>Frost damage</option><option>Heat damage</option><option>Animal damage</option><option>Plant died</option><option>General issue</option></select></label>
      <label>What should happen next?<select value={problem.severity} onChange={(event)=>setProblem({...problem,severity:event.target.value})}><option>Keep watching</option><option>Needs attention soon</option><option>Needs attention today</option></select></label>
      <label>What did Brooke observe?<textarea value={problem.note} onChange={(event)=>setProblem({...problem,note:event.target.value})} placeholder="Describe spots, insects, damage, weather, or anything unusual." required /></label>
      <button className="primary-button" type="submit">Save problem record</button>
    </form>}
  </section></div>;
}
