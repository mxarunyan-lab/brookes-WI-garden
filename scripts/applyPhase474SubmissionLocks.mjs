import{readFile,writeFile}from'node:fs/promises';
async function patch(path,changes){let source=await readFile(path,'utf8'),changed=false;for(const{old,next,label}of changes){if(source.includes(next))continue;if(!source.includes(old))throw new Error(`${path}: expected source not found for ${label}`);source=source.replace(old,next);changed=true}if(changed)await writeFile(path,source);return changed}
const modalChanged=await patch('src/ClearDetailModal.jsx',[
 {label:'useRef import',old:"import React,{useMemo,useState}from'react';",next:"import React,{useMemo,useRef,useState}from'react';"},
 {label:'plant submission lock',old:"const[mode,setMode]=useState(modal.prefill?'details':inventory.length?'seeds':'catalog'),[search,setSearch]=useState(''),[nameTouched,setNameTouched]=useState(false);",next:"const[mode,setMode]=useState(modal.prefill?'details':inventory.length?'seeds':'catalog'),[search,setSearch]=useState(''),[nameTouched,setNameTouched]=useState(false),submitLock=useRef(false);"},
 {label:'plant duplicate-submit prevention',old:"const submit=event=>{event.preventDefault();const used=packetDefaults?.uncounted?0:",next:"const submit=event=>{event.preventDefault();if(submitLock.current)return;const used=packetDefaults?.uncounted?0:"},
 {label:'plant lock activation',old:"if(d.name.trim()&&d.cropName.trim()&&d.spaceId){const enteredAt=",next:"if(d.name.trim()&&d.cropName.trim()&&d.spaceId){submitLock.current=true;const enteredAt="},
 {label:'space submission lock',old:"function AddSpace({addSpace,close}){const[d,setD]=useState(",next:"function AddSpace({addSpace,close}){const submitLock=useRef(false),[d,setD]=useState("},
 {label:'space duplicate-submit prevention',old:"onSubmit={event=>{event.preventDefault();addSpace(cleanGrowingSpaceForType(d));close()}}",next:"onSubmit={event=>{event.preventDefault();if(submitLock.current)return;submitLock.current=true;addSpace(cleanGrowingSpaceForType(d));close()}}"}
]);
const choreChanged=await patch('src/ChoreBoard.jsx',[
 {label:'chore useRef import',old:"import React,{useEffect,useMemo,useState}from'react';",next:"import React,{useEffect,useMemo,useRef,useState}from'react';"},
 {label:'chore submission lock',old:"function ReminderForm({garden,onAdd,onSave,onClose,initial=null}){const base=",next:"function ReminderForm({garden,onAdd,onSave,onClose,initial=null}){const submitLock=useRef(false),base="},
 {label:'chore duplicate-submit prevention',old:"submit=event=>{event.preventDefault();if(!d.title.trim())return;const data=",next:"submit=event=>{event.preventDefault();if(submitLock.current||!d.title.trim())return;submitLock.current=true;const data="}
]);
console.log(JSON.stringify({ok:true,changed:{modalChanged,choreChanged}},null,2));
