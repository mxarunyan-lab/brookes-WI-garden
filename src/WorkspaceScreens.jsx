import React from'react';
import{AlertTriangle,Bell,Check,ChevronDown,ChevronRight,Cloud,CloudRain,CloudSun,Droplets,Leaf,Megaphone,Moon,RefreshCw,Snowflake,Sun}from'lucide-react';
import{formatDateTime}from'./data.js';
import{WisconsinLandscape}from'./art.jsx';

function WeatherIcon({weather,size=34}){
  const c=weather?.weatherCode??2;
  if([71,73,75,77,85,86].includes(c))return <Snowflake size={size}/>;
  if([51,53,55,61,63,65,66,67,80,81,82,95,96,99].includes(c))return <CloudRain size={size}/>;
  if([3,45,48].includes(c))return <Cloud size={size}/>;
  if(!weather?.isDay)return <Moon size={size}/>;
  if(c===0)return <Sun size={size}/>;
  return <CloudSun size={size}/>;
}

const weatherTime=value=>{
  if(!value)return 'time unavailable';
  try{return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(value))}catch{return'time unavailable'}
};

function WeatherLine({weather,loading,error,refresh,alert,source,stale,savedAt,recordRain}){
  const calm=!alert||alert.type==='good';
  const sourceLabel=weather?.provider||'Weather source unavailable';
  const freshness=source==='live'&&!stale?`${sourceLabel} · updated ${weatherTime(savedAt||weather?.fetchedAt)}`:source==='fallback'?`${sourceLabel} · fallback · updated ${weatherTime(savedAt||weather?.fetchedAt)}`:`Saved weather · updated ${weatherTime(savedAt||weather?.fetchedAt)}`;
  const addRain=()=>{
    const value=window.prompt('How much rain fell at your home in inches? Example: 0.56');
    if(value===null)return;
    const amount=Number(value);
    if(!Number.isFinite(amount)||amount<=0){window.alert('Enter a rain amount greater than zero, such as 0.56.');return}
    if(recordRain?.(amount))window.alert(`${amount.toFixed(2)} inches recorded. Outdoor watering is paused for 24 hours.`);
  };
  return <section className={`compact-weather-line ${stale?'weather-is-stale':''}`}>
    <div className="compact-weather-reading"><WeatherIcon weather={weather}/><span><strong>{weather?`${weather.temperature}° · ${weather.condition}`:'Green Bay 54302 weather'}</strong><small>{loading?'Updating official weather…':error||`High ${weather?.high??'—'}° · Low ${weather?.low??'—'}°`}</small><em className="weather-freshness">{freshness}</em></span></div>
    <button className="weather-refresh-button" onClick={refresh} aria-label="Refresh official weather"><RefreshCw/></button>
    <button className="weather-rain-record" onClick={addRain}><Droplets/>Record rain at home</button>
    {weather?.rainHoldAmount>0&&<div className="weather-rain-hold"><Droplets/><span><strong>{Number(weather.rainHoldAmount).toFixed(2)} in. rain hold active</strong><small>{weather.rainHoldSource||'Recent rainfall'} · outdoor watering paused</small></span></div>}
    {stale&&<div className="weather-stale-warning" role="status"><AlertTriangle/><span><strong>Weather may be outdated</strong><small>Do not use this reading for watering or storm decisions until official weather refreshes.</small></span></div>}
    <div className={`compact-weather-message ${calm?'is-calm':''}`}><Check/><span><strong>{calm?'No major weather concerns today':alert.title}</strong><small>{calm?'Normal garden care should be fine.':alert.detail}</small></span></div>
  </section>;
}

export function TodayWorkspace({profile,tasks,dailyDone,noticeOpen,setNoticeOpen,weatherState,weatherAlert,activity,navigate,onTask,tomorrowTasks=[]}){
  const completeIds=new Set((dailyDone||[]).map(x=>typeof x==='string'?x:x.id));
  const active=tasks.filter(t=>!completeIds.has(t.id));
  const outdoor=active.filter(t=>!['greenhouse'].includes(t.kind)&&t.target!=='indoor').length;
  const indoor=active.filter(t=>t.kind==='greenhouse'||t.target==='indoor').length;
  const planting=active.filter(t=>t.kind==='navigate'||t.kind==='seasonalGuide').length;
  const last=(activity||[]).slice(0,1);
  const announcement=active.find(t=>t.kind==='seasonalGuide')||active.find(t=>t.kind==='navigate')||null;
  return <main className="screen today-screen">
    <section className="today-hero compact-home-hero">
      <button className="round-control hero-bell" onClick={()=>setNoticeOpen(v=>!v)}><Bell/>{active.length>0&&<span className="notification-count">{active.length}</span>}</button>
      {noticeOpen&&<div className="notification-popover actionable-briefing"><strong>Garden briefing</strong><span>{active.length} unfinished action{active.length===1?'':'s'} today.</span><button onClick={()=>navigate('chores')}>Open Chore Board <ChevronRight/></button></div>}
      <div className="hero-title-wrap compact-hero-title"><Leaf/><div><h1>{profile.gardenerName||'Brooke'}’s Garden</h1><p>The Runyan Garden · Green Bay</p></div></div>
      <WisconsinLandscape/>
    </section>
    <section className="today-body compact-today-body screen-pad">
      <WeatherLine {...weatherState} alert={weatherAlert}/>
      <section className="bulletin-card home-bulletin compact-bulletin">
        <button className="bulletin-summary" onClick={()=>navigate('chores')}>
          <span><small>THE GARDEN BULLETIN</small><strong>{active.length?`${active.length} thing${active.length===1?'':'s'} need attention`:'Nothing urgent today'}</strong></span>
          <ChevronRight/>
        </button>
        <div className="bulletin-stat-grid"><span><strong>{outdoor}</strong><small>Outdoor</small></span><span><strong>{indoor}</strong><small>Indoor</small></span><span><strong>{planting}</strong><small>Planting</small></span></div>
        <details className="tomorrow-preview">
          <summary><span><strong>Tomorrow</strong><small>{tomorrowTasks.length} expected task{tomorrowTasks.length===1?'':'s'}</small></span><ChevronDown/></summary>
          <div>{tomorrowTasks.slice(0,4).map(t=><button key={t.id} onClick={()=>navigate('chores')}><span><strong>{t.title}</strong><small>{t.plant?.name||t.subtitle}</small></span><ChevronRight/></button>)}{!tomorrowTasks.length&&<p>Nothing is currently expected tomorrow.</p>}</div>
        </details>
      </section>
      {last.length>0&&<details className="compact-handoff collapsible-handoff">
        <summary><span><small>LATEST HANDOFF</small><strong>What already happened</strong></span><ChevronDown/></summary>
        {last.map(entry=><article key={entry.id}><Check/><span><strong>{entry.actor?`${entry.actor}: `:''}{entry.title}</strong><small>{entry.detail}</small></span><em>{formatDateTime(entry.at)}</em></article>)}
        <button className="text-link" onClick={()=>navigate('chores')}>See completed work <ChevronRight/></button>
      </details>}
      {announcement&&<button className="garden-announcement" onClick={()=>onTask(announcement)}><span className="announcement-icon"><Megaphone/></span><span><small>GARDEN ANNOUNCEMENT</small><strong>{announcement.title}</strong><em>{announcement.subtitle}</em></span><ChevronRight/></button>}
    </section>
  </main>;
}