import React from'react';
import{BookOpen,ChevronRight,FlaskConical,QrCode,Seedling,Warehouse}from'lucide-react';

function Department({icon:Icon,title,subtitle,status,onClick}){return <button className="garden-center-department" onClick={onClick}><span className="department-icon"><Icon/></span><span><strong>{title}</strong><small>{subtitle}</small><em>{status}</em></span><ChevronRight/></button>}

export default function GardenCenter({garden,navigate}){
 const trays=(garden.trays||[]).filter(x=>!x.deletedAt).length;
 const lights=(garden.growLights||[]).filter(x=>!x.deletedAt).length;
 const pods=(garden.hydroPods||[]).filter(x=>!x.deletedAt).length;
 const packets=(garden.seedPackets||[]).filter(x=>!x.deletedAt).length;
 const seeds=(garden.seeds||[]).filter(x=>!x.deletedAt).length;
 const harvests=(garden.harvests||[]).filter(x=>!x.deletedAt).length;
 const problems=(garden.problems||[]).filter(x=>!x.deletedAt&&x.status!=='resolved').length;
 return <main className="screen garden-center-screen">
  <section className="dark-header garden-center-header">
   <span className="garden-center-awning" aria-hidden="true"><i/><i/><i/><i/><i/></span>
   <span>ESTABLISHED 2024 • GREEN BAY, WISCONSIN</span>
   <h1>Runyan Garden Center</h1>
   <p>Questionable expertise. Extremely organized seeds. Open whenever somebody remembers the plants.</p>
  </section>
  <section className="garden-center-content screen-pad">
   <div className="storefront-note"><strong>Welcome to our little Wisconsin garden store.</strong><span>Pick the department that matches what you are trying to do. The app keeps the records connected behind the counter.</span></div>
   <Department icon={Warehouse} title="Indoor Growing Department" subtitle="Seedling trays, grow lights, hardening off, greenhouse checks, and basement crops" status={`${trays} tray${trays===1?'':'s'} • ${lights} light schedule${lights===1?'':'s'} • ${pods} hydro pod${pods===1?'':'s'}`} onClick={()=>navigate('indoor')}/>
   <Department icon={Seedling} title="Seed Department" subtitle="Seed inventory, packet photos, planting details, and shopping awareness" status={`${seeds} seed record${seeds===1?'':'s'} • ${packets} photographed packet${packets===1?'':'s'}`} onClick={()=>navigate('seed-tools')}/>
   <Department icon={QrCode} title="Label Counter" subtitle="Create and print QR labels for beds, plants, trays, and hydroponic pods" status="Physical garden labels connected to app records" onClick={()=>navigate('seed-tools')}/>
   <Department icon={BookOpen} title="Records Department" subtitle="Harvest totals, garden lessons, problems, favorites, and seasonal memory" status={`${harvests} harvest record${harvests===1?'':'s'} • ${problems} active issue${problems===1?'':'s'}`} onClick={()=>navigate('memory')}/>
   <Department icon={FlaskConical} title="Greenhouse & Hydroponics Desk" subtitle="Protected growing, winter production, pod cycles, and condition history" status="Inside the Indoor Growing Department" onClick={()=>navigate('indoor')}/>
  </section>
 </main>;
}