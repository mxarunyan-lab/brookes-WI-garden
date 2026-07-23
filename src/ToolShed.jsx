import React,{useState}from'react';
import{BookOpen,Calculator,CalendarRange,ChevronDown,CloudSun,FileText,PackageSearch,Ruler,ShoppingBasket,Sprout,Wrench}from'lucide-react';
import{SecondaryCard,SecondaryHero}from'./SecondaryUI.jsx';

const WEATHER_MODE_KEY='runyan-weather-tool-mode-v1';

function ToolCard({icon,title,description,onClick}){return <SecondaryCard kind="utility tool-shed-directory" tone="cream" icon={icon} title={title} description={description} onClick={onClick}/>}
function ToolCategory({id,icon:Icon,title,description,count,open,onToggle,children}){return <section className={`tool-shed-category ${open?'is-open':''}`}><button type="button" className="tool-shed-category-summary" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-panel`}><Icon/><span><strong>{title}</strong><small>{description}</small></span><em>{count}</em><ChevronDown/></button>{open&&<div id={`${id}-panel`} className="secondary-card-list tool-shed-card-list">{children}</div>}</section>}

export default function ToolShed({navigate}){
 const[openCategory,setOpenCategory]=useState(null);
 const toggle=id=>setOpenCategory(current=>current===id?null:id);
 const openWeather=()=>{try{sessionStorage.setItem(WEATHER_MODE_KEY,'garden')}catch{}navigate('weather')};
 return <main className="screen secondary-screen tool-shed-screen"><SecondaryHero icon={Wrench} eyebrow="GARDEN UTILITIES" title="Tool Shed" className="tool-shed-hero"/><section className="screen-pad secondary-screen-content tool-shed-content">
  <ToolCategory id="tools-calculators" icon={Calculator} title="Calculators & Utilities" description="Plan spacing, soil, seeds, and garden measurements." count={4} open={openCategory==='calculators'} onToggle={()=>toggle('calculators')}>
   <ToolCard icon={Ruler} title="Spacing Calculator" description="Estimate how many plants fit in a Growing Space." onClick={()=>navigate('spacing-calculator')}/>
   <ToolCard icon={PackageSearch} title="Soil & Container Calculator" description="Estimate soil volume and common bag quantities." onClick={()=>navigate('soil-calculator')}/>
   <ToolCard icon={Sprout} title="Seed Quantity Calculator" description="Estimate how many seeds to start for the plants wanted." onClick={()=>navigate('seed-quantity-calculator')}/>
   <ToolCard icon={Calculator} title="Garden Measurements" description="Convert common garden dimensions, areas, volumes, and row lengths." onClick={()=>navigate('garden-measurements')}/>
  </ToolCategory>
  <ToolCategory id="tools-weather" icon={CloudSun} title="Weather & Timing" description="Understand conditions, watering, frost, and planting timing." count={1} open={openCategory==='weather'} onToggle={()=>toggle('weather')}>
   <ToolCard icon={CloudSun} title="Garden Weather & Timing" description="Current conditions, rain and watering, frost, and planting timing for your saved garden." onClick={openWeather}/>
  </ToolCategory>
  <ToolCategory id="tools-records" icon={BookOpen} title="Records & Extras" description="Shopping, trips, printables, and garden history." count={4} open={openCategory==='records'} onToggle={()=>toggle('records')}>
   <ToolCard icon={ShoppingBasket} title="Shopping List" description="Seeds, plants, and supplies still needed for the garden." onClick={()=>navigate('shopping-list')}/>
   <ToolCard icon={CalendarRange} title="Vacation Mode" description="Build and manage connected garden-care trip plans." onClick={()=>navigate('vacation')}/>
   <ToolCard icon={FileText} title="Printable Garden Pack & Labels" description="Create printable logs, maps, planning sheets, and plant labels." onClick={()=>navigate('printable-pack')}/>
   <ToolCard icon={BookOpen} title="Garden History" description="Review harvests, issues, photos, and season decisions." onClick={()=>navigate('memory')}/>
  </ToolCategory>
 </section></main>;
}
