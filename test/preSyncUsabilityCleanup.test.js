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
 const workspace=src('WorkspaceScreens.jsx'),home=src('UrgentHome.jsx');
 assert.equal(workspace.includes('today-quick-links'),false);
 assert.match(home,/Everything looks good today/);
 assert.match(home,/No urgent garden actions right now/);
 assert.match(home,/Welcome to/);
 assert.match(workspace,/impactDisplayTitle/);
 assert.match(workspace,/Rain changed the watering plan/);
 assert.match(workspace,/WHAT TO DO/);
 assert.equal(workspace.includes('WEATHER-ACTION-SUMMARY'),false);
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

test('release metadata identifies the exact seasonal header while preserving the navigation lock',()=>{
 const source=src('version.js');
 assert.match(source,/APP_VERSION='0\.20\.6'/);
 assert.match(source,/phase-4-7-8-urgent-only-home/);
 assert.match(source,/exact 2:1 composition without cropping or stretching/);
 assert.match(source,/iPhone Safari no longer displays AVIF corruption/);
 assert.match(source,/watering can/);
 assert.match(source,/top-level accessible overlay/);
 assert.match(source,/Garden Center remains locked to the five core garden-management destinations/);
 assert.match(source,/Tool Shed remains a flat one-tap directory/);
});
