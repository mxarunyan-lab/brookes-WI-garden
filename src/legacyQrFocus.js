const params=new URLSearchParams(window.location.search);
const encoded=params.get('gardenLabel')||'';
const split=encoded.indexOf(':');
const type=split>=0?encoded.slice(0,split):'';
const id=split>=0?encoded.slice(split+1):'';

if((type==='tray'||type==='pod')&&id){
 let attempts=0;
 const focusRecord=()=>{
  attempts+=1;
  const indoor=document.querySelector('.indoor-center-screen');
  if(!indoor)return false;
  let garden={};
  try{garden=JSON.parse(localStorage.getItem('brookes-garden-state-v2')||'{}')}catch{}
  const record=type==='tray'?(garden.trays||[]).find(item=>item.id===id):(garden.hydroPods||[]).find(item=>item.id===id);
  if(!record)return true;
  const label=type==='tray'?record.name:`Pod ${record.position}`;
  const selector=type==='tray'?'.center-list > div':'.hydro-grid > div';
  const target=[...document.querySelectorAll(selector)].find(element=>(element.innerText||'').includes(label));
  if(!target)return false;
  const details=target.closest('details');
  if(details)details.open=true;
  target.classList.add('indoor-record-focus');
  requestAnimationFrame(()=>target.scrollIntoView({block:'center',behavior:'auto'}));
  return true;
 };
 const observer=new MutationObserver(()=>{if(focusRecord()||attempts>80)observer.disconnect()});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('load',focusRecord,{once:true});
}
