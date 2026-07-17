import React from'react';
import{ChevronRight,QrCode,Sprout,Tags,Wrench}from'lucide-react';

function ToolCard({icon:Icon,title,description,onClick,tone='green'}){
 return <button type="button" className={`tool-shed-card tone-${tone}`} onClick={onClick} aria-label={`${title}. ${description}`}>
  <span className="tool-card-icon" aria-hidden="true"><Icon/></span>
  <span className="tool-card-copy"><strong>{title}</strong><small>{description}</small></span>
  <ChevronRight className="tool-card-arrow" aria-hidden="true"/>
 </button>;
}

export default function ToolShed({navigate}){
 return <main className="screen tool-shed-screen">
  <section className="dark-header garden-header tool-shed-header"><Wrench/><span>OPTIONAL GARDEN UTILITIES</span><h1>Tool Shed</h1><p>Create labels and use focused tools without leaving the garden workflow.</p></section>
  <section className="screen-pad tool-shed-content">
   <div className="tool-shed-group-heading"><span>CREATE AND PRINT</span><small>Choose the label format that fits the job.</small></div>
   <div className="tool-shed-card-list">
    <ToolCard icon={Tags} title="Plant Labels" description="Create and download QR bed signs and cut-apart labels for active plants." onClick={()=>navigate('labels')} tone="gold"/>
    <ToolCard icon={QrCode} title="Record QR Labels" description="Create one QR label for a saved plant, Growing Space, seedling tray, or hydroponic pod." onClick={()=>navigate('seed-labels')} tone="green"/>
   </div>
   <section className="tool-shed-note"><Sprout/><span><strong>Garden work stays elsewhere.</strong><small>Current plants live in Garden. Chores, planting, seeds, indoor growing, and records live in Center.</small></span></section>
  </section>
 </main>;
}
