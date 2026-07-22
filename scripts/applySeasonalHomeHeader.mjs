import{readFile,writeFile}from'node:fs/promises';

const replaceOnce=(source,oldValue,newValue,label)=>{
 if(source.includes(newValue))return source;
 if(!source.includes(oldValue))throw new Error(`Expected ${label} source was not found.`);
 return source.replace(oldValue,newValue);
};

{
 const path='src/WorkspaceScreens.jsx';
 let source=await readFile(path,'utf8');
 source=replaceOnce(source,"import{WisconsinLandscape}from'./art.jsx';","import{SeasonalGardenHeader}from'./SeasonalGardenHeader.jsx';",'Today seasonal header import');
 const next=`export function TodayWorkspace({profile,garden,tasks,dailyDone,noticeOpen,setNoticeOpen,weatherState,weatherAlert,weatherGuidance,activity,navigate,onTask,tomorrowTasks=[]}){
 const board=buildTaskBoard({tasks,completions:dailyDone}),active=board.needsAttention,last=(activity||[]).slice(0,1),seedIntelligence=buildGardenIntelligenceEngine({garden,weather:weatherState.weather,date:new Date()}),openGardenWeather=()=>{try{sessionStorage.setItem(WEATHER_MODE_KEY,'garden')}catch{}navigate('weather')};
 const notificationControl=<button className="round-control hero-bell" onClick={()=>setNoticeOpen(value=>!value)} aria-label="Open garden notifications"><Bell/>{active.length>0&&<span className="notification-count">{active.length}</span>}</button>;
 const notificationPopover=noticeOpen&&<div className="notification-popover actionable-briefing"><strong>Garden notifications</strong><span>{active.length?\`${'${active.length}'} unfinished action${'${active.length===1?\'\':\'s\'}'} due now.\`:'No unread garden actions right now.'}</span>{active.slice(0,3).map(task=><button key={task.id} onClick={()=>onTask(task)}>{task.title}<ChevronRight/></button>)}<button onClick={()=>navigate('chores')}>Open Chore Board <ChevronRight/></button></div>;
 return <main className="screen today-screen">
  <SeasonalGardenHeader profile={profile} notificationControl={notificationControl} notificationPopover={notificationPopover}/>
  <section className="today-dashboard-card" aria-labelledby="today-dashboard-title"><h2 id="today-dashboard-title" className="today-dashboard-card__heading">Today</h2><WhatMattersToday board={board} activeTasks={active} seedIntelligence={seedIntelligence} navigate={navigate} onTask={onTask}/></section>
  <section className="today-body compact-today-body screen-pad"><WeatherLine {...weatherState} alert={weatherAlert} guidance={weatherGuidance} onOpenWeather={openGardenWeather}/>{last.length>0&&<details className="compact-handoff collapsible-handoff"><summary><span><small>LATEST HANDOFF</small><strong>What already happened</strong></span><ChevronDown/></summary>{last.map(entry=><article key={entry.id}><Check/><span><strong>{entry.actor?\`${'${entry.actor}'}: \`:''}{entry.title}</strong><small>{entry.detail}</small></span><em>{formatDateTime(entry.at)}</em></article>)}<button className="text-link" onClick={()=>navigate('chores')}>See completed work <ChevronRight/></button></details>}</section>
 </main>;
}`;
 if(!source.includes('className="seasonal-garden-header')){
  const pattern=/export function TodayWorkspace\([\s\S]*?\n\nfunction WeatherToolTabs/;
  if(!pattern.test(source))throw new Error('TodayWorkspace boundary was not found.');
  source=source.replace(pattern,`${next}\n\nfunction WeatherToolTabs`);
 }
 await writeFile(path,source);
}

{
 const path='src/main.jsx';
 let source=await readFile(path,'utf8');
 source=replaceOnce(source,"import './styles/phase-4-7-5-card-layout-lock.css';","import './styles/phase-4-7-5-card-layout-lock.css';\nimport './styles/seasonal-home-header.css';",'seasonal Home stylesheet import');
 await writeFile(path,source);
}

{
 const path='src/version.js';
 let source=await readFile(path,'utf8');
 source=source.replace("export const APP_VERSION='0.20.4';","export const APP_VERSION='0.20.5';")
  .replace("export const BUILD_ID='phase-4-7-5-navigation-lock';","export const BUILD_ID='seasonal-mobile-garden-header';")
  .replace("export const WHATS_NEW=[","export const WHATS_NEW=[\n 'Today now uses the approved automatic Green Bay seasonal garden header and one compact overlapping dashboard card',");
 if(!source.includes("APP_VERSION='0.20.5'"))throw new Error('Version update failed.');
 await writeFile(path,source);
}

{
 const path='server/index.js';
 let source=await readFile(path,'utf8');
 source=source.replace("version: process.env.APP_VERSION || '0.20.4'","version: process.env.APP_VERSION || '0.20.5'");
 if(!source.includes("version: process.env.APP_VERSION || '0.20.5'"))throw new Error('Server health version update failed.');
 await writeFile(path,source);
}

{
 const path='package.json';
 const pkg=JSON.parse(await readFile(path,'utf8'));
 pkg.version='0.20.5';
 pkg.scripts['verify:seasonal-header:live']='node scripts/verifySeasonalHomeHeaderLive.mjs';
 await writeFile(path,`${JSON.stringify(pkg,null,2)}\n`);
}

console.log(JSON.stringify({ok:true,build:'seasonal-mobile-garden-header'},null,2));
