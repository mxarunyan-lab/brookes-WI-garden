import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const src=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');

test('Chore Board presents one active queue plus later work and history',()=>{
 const source=src('ChoreBoard.jsx');
 assert.match(source,/id="attention"/);
 assert.match(source,/NEEDS ATTENTION/);
 assert.match(source,/title="Do these first"/);
 assert.match(source,/title="Later work"/);
 assert.match(source,/title="Completed, skipped, or not needed"/);
 assert.equal(source.includes('WEATHER ALERTS'),false);
 assert.equal(source.includes('Past the due date'),false);
 assert.equal(source.includes('Due today" tasks='),false);
});

test('More consolidates household settings into one collapsed destination',()=>{
 const source=src('MoreHub.jsx');
 assert.match(source,/<details className="more-settings-hub">/);
 assert.doesNotMatch(source,/<details className="more-settings-hub" open/);
 assert.match(source,/Garden and gardeners/);
 assert.match(source,/Location and frost dates/);
 assert.match(source,/Notifications/);
 assert.equal((source.match(/title="Account"/g)||[]).length,0);
 assert.equal((source.match(/title="Settings"/g)||[]).length,0);
 assert.equal((source.match(/title="Garden Preferences"/g)||[]).length,0);
});

test('Today stays useful without repeating primary navigation and weather copy is human-readable',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.equal(source.includes('today-quick-links'),false);
 assert.match(source,/You are caught up/);
 assert.match(source,/No garden work needs your attention right now/);
 assert.match(source,/impactDisplayTitle/);
 assert.match(source,/Rain changed the watering plan/);
 assert.match(source,/WHAT TO DO/);
 assert.equal(source.includes('WEATHER-ACTION-SUMMARY'),false);
});

test('Phase 4.7.5 navigation styles load globally and retain More, weather, and Indoor protections',()=>{
 const lock=src('styles/phase-4-7-5-navigation-lock.css'),smoothing=src('styles/phase-4-7-3-smoothing.css'),toolShed=src('ToolShed.jsx'),main=src('main.jsx');
 assert.match(main,/phase-4-7-5-navigation-lock\.css/);
 assert.match(lock,/compact-secondary-header/);
 assert.match(lock,/tool-shed-directory-card/);
 assert.match(smoothing,/more-settings-hub>summary/);
 assert.match(smoothing,/weather-tool-tabs/);
 assert.match(smoothing,/indoor-center-content \.control-center-title/);
 assert.doesNotMatch(toolShed,/<details/);
});

test('release metadata preserves the navigation lock and identifies the seasonal header release',()=>{
 const source=src('version.js');
 assert.match(source,/APP_VERSION='0\.20\.5'/);
 assert.match(source,/seasonal-mobile-garden-header/);
 assert.match(source,/Today now uses the approved automatic Green Bay seasonal garden header/);
 assert.match(source,/Garden Center now contains only the five core garden-management destinations/);
 assert.match(source,/Tool Shed is a flat one-tap directory/);
 assert.match(source,/three distinct focused weather modes/);
});
