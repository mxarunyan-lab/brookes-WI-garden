import React from'react';
import{BookOpen,Calculator,CalendarDays,CalendarRange,CloudSun,Droplets,FileText,PackageSearch,Ruler,ShoppingBasket,Sprout,Wrench}from'lucide-react';
import{SecondaryCard,SecondaryHero,SecondarySectionHeader}from'./SecondaryUI.jsx';

const WEATHER_MODE_KEY='runyan-weather-tool-mode-v1';

function DirectorySection({eyebrow,children}){return <section className="tool-shed-directory-section" aria-labelledby={`tool-section-${eyebrow.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}><SecondarySectionHeader eyebrow={eyebrow}/><div className="secondary-card-list tool-shed-card-list">{children}</div></section>}
function ToolCard({icon,title,description,onClick}){return <SecondaryCard kind="utility tool-shed-directory" tone="cream" icon={icon} title={title} description={description} onClick={onClick}/>}

export default function ToolShed({navigate}){
 const openWeather=mode=>{try{sessionStorage.setItem(WEATHER_MODE_KEY,mode)}catch{}navigate('weather')};
 return <main className="screen secondary-screen tool-shed-screen"><SecondaryHero icon={Wrench} eyebrow="GARDEN UTILITIES" title="Tool Shed" className="tool-shed-hero"/><section className="screen-pad secondary-screen-content tool-shed-content">
  <DirectorySection eyebrow="CALCULATORS & UTILITIES">
   <ToolCard icon={Ruler} title="Spacing Calculator" description="Estimate how many plants fit in a Growing Space." onClick={()=>navigate('spacing-calculator')}/>
   <ToolCard icon={PackageSearch} title="Soil & Container Calculator" description="Estimate soil volume and common bag quantities." onClick={()=>navigate('soil-calculator')}/>
   <ToolCard icon={Sprout} title="Seed Quantity Calculator" description="Estimate how many seeds to start for the plants wanted." onClick={()=>navigate('seed-quantity-calculator')}/>
   <ToolCard icon={Calculator} title="Garden Measurements" description="Convert common garden dimensions, areas, volumes, and row lengths." onClick={()=>navigate('garden-measurements')}/>
  </DirectorySection>
  <DirectorySection eyebrow="WEATHER & TIMING">
   <ToolCard icon={CloudSun} title="Garden Weather" description="Current conditions and effects on saved plants and Growing Spaces." onClick={()=>openWeather('garden')}/>
   <ToolCard icon={Droplets} title="Rain & Watering Review" description="Rain credit, watering decisions, and soil-check guidance." onClick={()=>openWeather('rain')}/>
   <ToolCard icon={CalendarDays} title="Frost & Planting Dates" description="Forecast conditions and saved Green Bay frost timing." onClick={()=>openWeather('frost')}/>
  </DirectorySection>
  <DirectorySection eyebrow="RECORDS & EXTRAS">
   <ToolCard icon={ShoppingBasket} title="Shopping List" description="Seeds, plants, and supplies still needed for the garden." onClick={()=>navigate('shopping-list')}/>
   <ToolCard icon={CalendarRange} title="Vacation Mode" description="Build and manage connected garden-care trip plans." onClick={()=>navigate('vacation')}/>
   <ToolCard icon={FileText} title="Printable Garden Pack & Labels" description="Create printable logs, maps, planning sheets, and plant labels." onClick={()=>navigate('printable-pack')}/>
   <ToolCard icon={BookOpen} title="Garden History" description="Review harvests, issues, photos, and season decisions." onClick={()=>navigate('memory')}/>
  </DirectorySection>
 </section></main>;
}
