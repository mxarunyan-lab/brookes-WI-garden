import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const src=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');

test('Today does not repeat primary navigation shortcuts below Garden Status',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.equal(source.includes('function TodayQuickLinks'),false);
 assert.equal(source.includes('<TodayQuickLinks'),false);
 assert.doesNotMatch(source,/My Garden<\/strong>/);
 assert.doesNotMatch(source,/Garden Tasks<\/strong>/);
});

test('Tool Shed weather cards choose distinct weather modes',()=>{
 const source=src('ToolShed.jsx');
 assert.match(source,/openWeather\('garden'\)/);
 assert.match(source,/openWeather\('rain'\)/);
 assert.match(source,/openWeather\('frost'\)/);
 assert.match(source,/Rain & Watering Review/);
 assert.match(source,/Frost & Planting Dates/);
});

test('Weather workspace renders distinct Garden, Rain, and Frost content',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/mode==='garden'/);
 assert.match(source,/mode==='rain'/);
 assert.match(source,/mode==='frost'/);
 assert.match(source,/RECENT RAIN CREDIT/);
 assert.match(source,/SAVED GREEN BAY TIMING/);
 assert.equal((source.match(/<WeatherDetails/g)||[]).length,1);
});

test('Garden and Account Settings is collapsed by default',()=>{
 const source=src('MoreHub.jsx');
 assert.match(source,/<details className="more-settings-hub">/);
 assert.doesNotMatch(source,/<details className="more-settings-hub" open/);
 assert.match(source,/GARDEN & ACCOUNT SETTINGS/);
});

test('Phase 4.7.5 styles retain Indoor spacing and distinct weather tabs while flattening Tool Shed',()=>{
 const smoothing=src('styles/phase-4-7-3-smoothing.css'),lock=src('styles/phase-4-7-5-navigation-lock.css');
 assert.match(smoothing,/indoor-center-content \.control-center-title/);
 assert.match(smoothing,/gap:12px!important/);
 assert.match(smoothing,/weather-tool-tabs/);
 assert.match(lock,/tool-shed-directory-card/);
 assert.match(lock,/tool-shed-directory-section/);
 assert.match(lock,/background:var\(--phase475-surface\)!important/);
});
