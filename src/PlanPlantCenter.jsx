import React,{useState}from'react';
import{CalendarDays,Leaf}from'lucide-react';
import PlantRecommendations from'./PlantRecommendations.jsx';
import PlannerScreen from'./PlannerScreen.jsx';

export default function PlanPlantCenter(props){
 const[view,setView]=useState('plant');
 return <main className="plan-plant-shell">
  <section className="plan-plant-switch" aria-label="Plan and Plant sections">
   <button className={view==='plant'?'active':''} onClick={()=>{setView('plant');requestAnimationFrame(()=>window.scrollTo(0,0));}}><Leaf/>What can we grow?</button>
   <button className={view==='plan'?'active':''} onClick={()=>{setView('plan');requestAnimationFrame(()=>window.scrollTo(0,0));}}><CalendarDays/>Upcoming plan</button>
  </section>
  {view==='plant'?<PlantRecommendations recommendations={props.recommendations} setModal={props.setModal} navigate={props.navigate}/>:<PlannerScreen garden={props.garden} timeline={props.timeline} addSeed={props.addSeed} completePlanItem={props.completePlanItem} updatePlantStage={props.updatePlantStage} recordHarvest={props.recordHarvest} scheduleSuccession={props.scheduleSuccession}/>} 
 </main>;
}