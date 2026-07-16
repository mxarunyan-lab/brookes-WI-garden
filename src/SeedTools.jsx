import React, { useMemo, useState } from 'react';
import { ArrowLeft, Camera, Check, Download, ImagePlus, Printer, QrCode, Sprout, Tags } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TYPES = [['space','Garden space'],['plant','Plant or batch'],['tray','Seedling tray'],['pod','Hydroponic pod']];
const fileToDataUrl=(file)=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});
function targetRows(garden,type){if(type==='space')return(garden.spaces||[]).map(x=>({id:x.id,label:x.name,detail:x.type}));if(type==='plant')return(garden.plants||[]).filter(x=>!x.archived).map(x=>({id:x.id,label:x.name,detail:x.variety||x.stage}));if(type==='tray')return(garden.trays||[]).map(x=>({id:x.id,label:x.name,detail:x.crop}));return(garden.hydroPods||[]).map(x=>({id:x.id,label:`Pod ${x.position}`,detail:x.crop||x.status}));}

export default function SeedTools({garden,navigate,savePacket,deletePacket}){
 const [tab,setTab]=useState('packets'),[photo,setPhoto]=useState('');
 const [draft,setDraft]=useState({name:'',variety:'',brand:'',packetYear:new Date().getFullYear(),quantity:'',daysToMaturity:'',depth:'',spacing:'',notes:''});
 const [labelType,setLabelType]=useState('space'),[targetId,setTargetId]=useState(''),[labelNote,setLabelNote]=useState('');
 const rows=useMemo(()=>targetRows(garden,labelType),[garden,labelType]),selected=rows.find(x=>x.id===targetId)||rows[0];
 const qrValue=selected?`${window.location.origin}/?gardenLabel=${encodeURIComponent(labelType)}:${encodeURIComponent(selected.id)}`:'';
 const capture=async(event)=>{const file=event.target.files?.[0];if(file)setPhoto(await fileToDataUrl(file));};
 const submitPacket=(event)=>{event.preventDefault();if(!draft.name.trim())return;savePacket({...draft,photo,packetYear:Number(draft.packetYear),quantity:Number(draft.quantity)||0,daysToMaturity:Number(draft.daysToMaturity)||null});setDraft({name:'',variety:'',brand:'',packetYear:new Date().getFullYear(),quantity:'',daysToMaturity:'',depth:'',spacing:'',notes:''});setPhoto('');};
 const printLabel=()=>{const html=document.getElementById('printable-garden-label')?.outerHTML;if(!html)return;const popup=window.open('','_blank','width=480,height=640');popup.document.write(`<html><head><title>Garden label</title><style>body{font-family:Arial;padding:24px}.qr-label-card{width:300px;border:2px solid #063c27;border-radius:18px;padding:20px;text-align:center}.qr-label-card h3{margin:10px 0 2px}.qr-label-card p{margin:4px 0;color:#555}.print-hide{display:none}</style></head><body>${html}<script>window.onload=()=>window.print()</script></body></html>`);popup.document.close();};

 return <main className="screen seed-tools-screen">
  <section className="dark-header seed-tools-header"><button className="back-button" onClick={()=>navigate('profile')} aria-label="Back"><ArrowLeft/></button><Sprout/><span>PHYSICAL GARDEN TOOLS</span><h1>Seeds & Labels</h1><p>Capture packets, confirm their details, and print labels that open the right garden record.</p></section>
  <section className="seed-tools-body screen-pad">
   <div className="seed-tools-tabs"><button className={tab==='packets'?'active':''} onClick={()=>setTab('packets')}><Camera/> Packets</button><button className={tab==='labels'?'active':''} onClick={()=>setTab('labels')}><QrCode/> QR Labels</button></div>
   {tab==='packets'&&<><section className="capture-explainer"><ImagePlus/><span><strong>Photo first, confirmation second.</strong><small>The picture is saved with the packet. Brooke confirms every field before it enters the seed inventory.</small></span></section>
    <form className="packet-capture-form" onSubmit={submitPacket}>
     <label className="packet-photo-input">{photo?<img src={photo} alt="Seed packet preview"/>:<><Camera/><strong>Photograph or choose a packet</strong><small>Front or back; add the clearest side first.</small></>}<input type="file" accept="image/*" capture="environment" onChange={capture}/></label>
     <div className="packet-grid">
      <label>Crop<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Pepper"/></label><label>Variety<input value={draft.variety} onChange={e=>setDraft({...draft,variety:e.target.value})} placeholder="Jalapeño"/></label>
      <label>Brand<input value={draft.brand} onChange={e=>setDraft({...draft,brand:e.target.value})} placeholder="Seed company"/></label><label>Packet year<input type="number" value={draft.packetYear} onChange={e=>setDraft({...draft,packetYear:e.target.value})}/></label>
      <label>Estimated seeds left<input type="number" min="0" value={draft.quantity} onChange={e=>setDraft({...draft,quantity:e.target.value})}/></label><label>Days to maturity<input type="number" min="1" value={draft.daysToMaturity} onChange={e=>setDraft({...draft,daysToMaturity:e.target.value})}/></label>
      <label>Planting depth<input value={draft.depth} onChange={e=>setDraft({...draft,depth:e.target.value})} placeholder="1/4 inch"/></label><label>Spacing<input value={draft.spacing} onChange={e=>setDraft({...draft,spacing:e.target.value})} placeholder="12 inches"/></label>
     </div>
     <label>Packet notes<textarea value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="Indoor start or direct-sow instructions, special notes, germination information…"/></label>
     <button className="primary-button" type="submit"><Check/> Confirm and save packet</button>
    </form>
    <section className="saved-packets"><div className="section-row"><div><span className="section-kicker">SAVED PACKETS</span><h2>{(garden.seedPackets||[]).length} photographed</h2></div></div>
     {(garden.seedPackets||[]).length?(garden.seedPackets||[]).map(packet=><article key={packet.id}>{packet.photo?<img src={packet.photo} alt=""/>:<div className="packet-placeholder"><Tags/></div>}<span><strong>{packet.name}{packet.variety?` — ${packet.variety}`:''}</strong><small>{packet.brand||'Brand not entered'} • {packet.packetYear} • {packet.quantity||0} seeds left</small><small>{packet.daysToMaturity?`${packet.daysToMaturity} days to maturity`:'Maturity not entered'}</small></span><button onClick={()=>deletePacket(packet.id)}>Remove</button></article>):<div className="empty-memory"><Camera/><span><strong>No packet photos yet.</strong><small>Capture one above; nothing is entered without review.</small></span></div>}
    </section></>}
   {tab==='labels'&&<><section className="label-builder"><div><span className="section-kicker">CREATE A LABEL</span><h2>Choose exactly what the code should open</h2></div>
    <label>Label type<select value={labelType} onChange={e=>{setLabelType(e.target.value);setTargetId('');}}>{TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label>Garden record<select value={targetId||selected?.id||''} onChange={e=>setTargetId(e.target.value)}>{rows.map(row=><option key={row.id} value={row.id}>{row.label} — {row.detail}</option>)}</select></label>
    <label>Small label note<input value={labelNote} onChange={e=>setLabelNote(e.target.value)} placeholder="Optional variety or row note"/></label></section>
    {selected?<section id="printable-garden-label" className="qr-label-card"><div className="qr-label-kicker">RUNYAN GARDEN CENTER</div><QRCodeSVG value={qrValue} size={180} fgColor="#063c27" bgColor="#fbf7ec" level="M" includeMargin/><h3>{selected.label}</h3><p>{labelNote||selected.detail}</p><small>Scan to open this garden record</small></section>:<div className="empty-memory"><QrCode/><span><strong>No records available for this label type.</strong><small>Add a space, plant, tray, or pod first.</small></span></div>}
    {selected&&<div className="label-actions print-hide"><button className="primary-button" onClick={printLabel}><Printer/> Print label</button><button onClick={()=>navigator.clipboard?.writeText(qrValue)}><Download/> Copy label link</button></div>}
    <section className="label-help"><QrCode/><span><strong>Labels are tied to saved records.</strong><small>They are printable now. Cross-phone routing will become fully shared when cloud sync arrives in v1.0.0.</small></span></section></>}
  </section>
 </main>;
}