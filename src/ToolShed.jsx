import React,{useState}from'react';
import{Calculator,ChevronDown,CloudSun,FileText,PackageSearch,Ruler,Sprout,Wrench}from'lucide-react';
import{SecondaryCard,SecondaryHero}from'./SecondaryUI.jsx';

const WEATHER_MODE_KEY='runyan-weather-tool-mode-v1';
function ToolCard({icon,title,description,onClick}){return <SecondaryCard kind="utility tool-shed-directory" tone="cream" icon={icon} title={title} description={description} onClick={onClick}/>}
function ToolCategory({id,icon:Icon,title,description,count,open,onToggle,children}){return <section className={`tool-shed-category ${open?'is-open':''}`}><button type="button" className="tool-shed-category-summary" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-panel`}><Icon/><span><strong>{title}</strong><small>{description}</small></span><em>{count}</em><ChevronDown/></button>{open&&<div id={`${id}-panel`} className="secondary-card-list tool-shed-card-list">{children}</div>}</section>}

export default function ToolShed({navigate}){
 const[openCategory,setOpenCategory]=useState(null),toggle=id=>setOpenCategory(current=>current===id?null:id),openWeather=()=>{try{sessionStorage.setItem(WEATHER_MODE_KEY,'garden')}catch{}navigate('weather')};
 return <main className="screen secondary-screen tool-shed-screen"><SecondaryHero icon={Wrench} eyebrow="GARDEN UTILITIES" title="Tool Shed" description="Calculators, weather details, and print tools for the garden." className="tool-shed-hero"/><section className="screen-pad secondary-screen-content tool-shed-content">
  <ToolCategory id="tools-calculators" icon={Calculator} title="Calculators & Utilities" description="Plan spacing, soil, seeds, and garden measurements." count={4} open={openCategory==='calculators'} onToggle={()=>toggle('calculators')}>
   <ToolCard icon={Ruler} title="Spacing Calculator" description="Estimate how many plants fit in a Growing Space." onClick={()=>navigate('spacing-calculator')}/>
   <ToolCard icon={PackageSearch} title="Soil & Container Calculator" description="Estimate soil volume and common bag quantities." onClick={()=>navigate('soil-calculator')}/>
   <ToolCard icon={Sprout} title="Seed Quantity Calculator" description="Estimate how many seeds to start for the plants wanted." onClick={()=>navigate('seed-quantity-calculator')}/>
   <ToolCard icon={Calculator} title="Garden Measurements" description="Convert common garden dimensions, areas, volumes, and row lengths." onClick={()=>navigate('garden-measurements')}/>
  </ToolCategory>
  <ToolCategory id="tools-weather" icon={CloudSun} title="Weather & Timing" description="Review garden conditions, watering, frost, and planting timing." count={1} open={openCategory==='weather'} onToggle={()=>toggle('weather')}>
   <ToolCard icon={CloudSun} title="Garden Weather & Timing" description="Current conditions, rain and watering, frost, and planting timing for your saved garden." onClick={openWeather}/>
  </ToolCategory>
  <ToolCategory id="tools-print" icon={FileText} title="Print & Labels" description="Create garden checklists, plant labels, signs, and optional QR labels." count={1} open={openCategory==='print'} onToggle={()=>toggle('print')}>
   <ToolCard icon={FileText} title="Print & Labels" description="Create labels, Growing Space signs, checklists, and advanced QR labels." onClick={()=>navigate('printable-pack')}/>
  </ToolCategory>
 </section></main>;
}
