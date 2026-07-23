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

test('Tool Shed exposes one combined weather destination that opens Garden Weather',()=>{
 const source=src('ToolShed.jsx');
 assert.match(source,/sessionStorage\.setItem\(WEATHER_MODE_KEY,'garden'\)/);
 assert.match(source,/title="Garden Weather & Timing"/);
 assert.equal((source.match(/title="Garden Weather & Timing"/g)||[]).length,1);
 assert.doesNotMatch(source,/Rain & Watering Review/);
 assert.doesNotMatch(source,/title="Frost & Planting Dates"/);
});

test('Weather workspace renders distinct Garden, Rain, and Frost content',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/mode==='garden'/);
 assert.match(source,/mode==='rain'/);
 assert.match(source,/mode==='frost'/);
 assert.match(source,/RECENT RAIN CREDIT/);
 assert.match(source,/SAVED GREEN BAY TIMING/);
 assert.equal((source.match(/<WeatherDetails/g)||[]).length,1);
 assert.match(source,/SecondaryHero icon=\{CloudSun\}/);
 assert.match(source,/onBack=\{\(\)=>navigate\('back'\)\}/);
});

test('Garden and Account Settings is collapsed by default and hides its body',()=>{
 const source=src('MoreHub.jsx'),css=src('styles/phase-4-8-1-mobile-continuity.css');
 assert.match(source,/<details className="more-settings-hub">/);
 assert.doesNotMatch(source,/<details className="more-settings-hub" open/);
 assert.match(source,/GARDEN & ACCOUNT SETTINGS/);
 assert.match(css,/more-settings-hub:not\(\[open\]\)>div\{display:none!important\}/);
 assert.match(css,/more-settings-hub\[open\]>div\{display:grid!important\}/);
});

test('Phase 4.8.1 styles retain Indoor spacing, weather tabs, and compact Tool Shed categories',()=>{
 const smoothing=src('styles/phase-4-7-3-smoothing.css'),lock=src('styles/phase-4-7-5-navigation-lock.css'),continuity=src('styles/phase-4-8-1-mobile-continuity.css');
 assert.match(smoothing,/indoor-center-content \.control-center-title/);
 assert.match(smoothing,/gap:12px!important/);
 assert.match(smoothing,/weather-tool-tabs/);
 assert.match(lock,/tool-shed-directory-card/);
 assert.match(continuity,/tool-shed-category-summary/);
 assert.match(continuity,/tool-shed-category\.is-open/);
});
