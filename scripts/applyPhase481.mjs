import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const must=(s,from,to,label)=>{if(!s.includes(from))throw new Error(`Missing ${label}`);return s.replace(from,to)};

let app=read('src/App.jsx');
app=must(app,"[confirmation,setConfirmation]=useState(null);","[confirmation,setConfirmation]=useState(null),[pendingAddPlant,setPendingAddPlant]=useState(null);",'pending state');
app=must(app," const showToast=message=>{setToast(message);clearTimeout(window.__gardenToast);window.__gardenToast=setTimeout(()=>setToast(''),2600)};"," const showToast=message=>{setToast(message);clearTimeout(window.__gardenToast);window.__gardenToast=setTimeout(()=>setToast(''),2600)};\n const requestModal=request=>{if(request?.type!=='addPlant'){setModal(request);return}const available=(garden.spaces||[]).filter(space=>!space.hidden&&!space.deletedAt);if(available.length){setModal(request);return}setPendingAddPlant({...request});setModal({type:'growingSpaceRequired'})};\n const beginRequiredSpace=()=>{navigate('garden');requestAnimationFrame(()=>setModal({type:'addSpace',resumePendingPlant:true}))};\n const cancelRequiredSpace=()=>{setPendingAddPlant(null);setModal(null)};",'request guard');
app=app.replaceAll("setModal({type:'addPlant'})","requestModal({type:'addPlant'})");
app=app.replaceAll("setModal({type:'addPlant',prefill:","requestModal({type:'addPlant',prefill:");
app=app.replaceAll("setModal({type:'addPlant',spaceId})","requestModal({type:'addPlant',spaceId})");
app=app.replaceAll("setModal={setModal}","setModal={requestModal}");
app=must(app," const addSpace=data=>{const now=new Date().toISOString(),space={id:newId('space'),...data,name:data.name.trim(),capacity:Number(data.capacity)||12,hidden:false,photo:'',notes:'',createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};setGarden(current=>({...current,spaces:[...current.spaces,space],activity:[activityEntry({type:'space',title:`Created ${space.name}`,detail:'Growing space added.',spaceId:space.id}),...current.activity]}))},saveSpace=", " const addSpace=data=>{const now=new Date().toISOString(),space={id:newId('space'),...data,name:data.name.trim(),capacity:Number(data.capacity)||12,hidden:false,photo:'',notes:'',createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};setGarden(current=>({...current,spaces:[...current.spaces,space],activity:[activityEntry({type:'space',title:`Created ${space.name}`,detail:'Growing space added.',spaceId:space.id}),...current.activity]}));sessionStorage.setItem('garden-open-bed',space.id);if(pendingAddPlant){const request={...pendingAddPlant,spaceId:space.id,prefill:{...(pendingAddPlant.prefill||{}),spaceId:space.id}};setPendingAddPlant(null);requestAnimationFrame(()=>setModal(request));return{...space,resumeAddPlant:true}}return space},saveSpace=",'addSpace handoff');
app=must(app,"<ClearDetailModal modal={modal} close={()=>setModal(null)} garden={garden}","<ClearDetailModal modal={modal} close={()=>setModal(null)} garden={garden} onSetUpGrowingSpace={beginRequiredSpace} onCancelGrowingSpace={cancelRequiredSpace}",'modal props');
write('src/App.jsx',app);

let modal=read('src/ClearDetailModal.jsx');
modal=must(modal,"function RecordUnavailable",`function GrowingSpaceRequired({close,onSetUp,onCancel}){return <div className="overlay modal-overlay" onMouseDown={onCancel}><section className="detail-modal growing-space-required-modal" role="dialog" aria-modal="true" aria-labelledby="growing-space-required-title" onMouseDown={event=>event.stopPropagation()}><button className="modal-close" onClick={onCancel} aria-label="Close dialog"><X/></button><AlertTriangle/><span className="modal-kicker">GROWING SPACE REQUIRED</span><h2 id="growing-space-required-title">Add a Growing Space first</h2><p>Every planting needs a location. Create a bed, container, grow bag, greenhouse area, or indoor Growing Space before adding a plant.</p><div className="modal-action-row"><button className="primary-button" onClick={onSetUp}>Set Up a Growing Space</button><button className="secondary-button" onClick={onCancel}>Not Now</button></div></section></div>}\n\nfunction RecordUnavailable`,'warning component');
modal=must(modal,"export default function ClearDetailModal(props){const{modal,close}=props;","export default function ClearDetailModal(props){const{modal,close}=props;if(modal.type==='growingSpaceRequired')return <GrowingSpaceRequired close={close} onSetUp={props.onSetUpGrowingSpace} onCancel={props.onCancelGrowingSpace||close}/>;",'warning routing');
modal=modal.replace("addSpace(cleanGrowingSpaceForType(d));close()","const created=addSpace(cleanGrowingSpaceForType(d));if(!created?.resumeAddPlant)close()");
modal=modal.replace("props.setModal({type:'addPlant',prefill:crop})","props.setModal({type:'addPlant',prefill:crop,source:'seasonal-chore'})");
write('src/ClearDetailModal.jsx',modal);

let vac=read('src/VacationMode.jsx');
const reps=[
 ['Specific helper checks and weather exceptions.','Specific Garden Buddy checks and weather exceptions.'],
 [' Someone local can check the garden',' A Garden Buddy can check the garden'],
 ['Helper name','Garden Buddy name'],
 ['LOCAL HELPER VIEW','GARDEN BUDDY GUIDE'],
 ['print the local garden helper guide.','print the Garden Buddy guide.'],
 ['Runyan Garden Vacation Guide','Runyan Garden Buddy Guide'],
 ['Scheduled Helper Tasks','Scheduled Garden Buddy Tasks'],
 ["active.caretakerName||'Local helper'","active.caretakerName||'Garden Buddy'"],
 ["'No helper available'","'No Garden Buddy available'"],
 ['Manually edited helper text','Manually edited Garden Buddy text']
];for(const[a,b]of reps)vac=vac.replaceAll(a,b);write('src/VacationMode.jsx',vac);

let planner=read('src/vacationPlanner.js');
planner=planner.replaceAll("title:'Runyan Garden Vacation Guide'","title:'Garden Buddy Guide'");
planner=planner.replaceAll('Caretaker container soil check','Garden Buddy container soil check').replaceAll('Caretaker bed soil check','Garden Buddy bed soil check').replaceAll('Caretaker greenhouse check','Garden Buddy greenhouse check').replaceAll('caretaker note','Garden Buddy note').replaceAll('caretaker can deploy','Garden Buddy can deploy').replaceAll('caretaker actions','Garden Buddy actions').replaceAll('Caretaker checkboxes','Garden Buddy checkboxes').replaceAll('caretaker notes','Garden Buddy notes').replaceAll("helperInstructionScope:'Local printable helper guide only'","helperInstructionScope:'Local printable Garden Buddy guide only'");
write('src/vacationPlanner.js',planner);

let main=read('src/main.jsx');
main=must(main,"import './styles/phase-4-7-8-urgent-home.css';","import './styles/phase-4-7-8-urgent-home.css';\nimport './styles/phase-4-8-1-mobile-continuity.css';",'stylesheet import');write('src/main.jsx',main);

console.log('Phase 4.8.1 source transforms applied');
