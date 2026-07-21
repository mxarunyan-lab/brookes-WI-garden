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

test('Tool Shed readability, weather modes, More drawer, and Indoor spacing load globally',()=>{
 const source=src('styles/phase-4-7-3-smoothing.css'),toolShed=src('ToolShed.jsx');
 assert.match(source,/tool-shed-drawer>summary \.secondary-section-header small/);
 assert.match(source,/color:#173d2b!important/);
 assert.match(source,/more-settings-hub>summary/);
 assert.match(source,/weather-tool-tabs/);
 assert.match(source,/indoor-center-content \.control-center-title/);
 assert.match(toolShed,/phase-4-7-3-smoothing\.css/);
});

test('release metadata identifies the final pre-sync smoothing build',()=>{
 const source=src('version.js');
 assert.match(source,/phase-4-7-3-final-pre-sync-smoothing/);
 assert.match(source,/Today no longer repeats primary navigation shortcuts/);
 assert.match(source,/distinct Garden Weather, Rain and Watering, and Frost and Timing views/);
});