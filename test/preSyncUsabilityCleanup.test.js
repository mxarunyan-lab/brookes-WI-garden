import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const src=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');

test('Chore Board presents one active queue plus later work and history',()=>{
 const source=src('ChoreBoard.jsx');
 assert.match(source,/id="attention"/);assert.match(source,/NEEDS ATTENTION/);assert.match(source,/title="Do these first"/);assert.match(source,/title="Later work"/);assert.match(source,/title="Completed, skipped, or not needed"/);
 assert.equal(source.includes('WEATHER ALERTS'),false);assert.equal(source.includes('Past the due date'),false);assert.equal(source.includes('Due today" tasks='),false);
});

test('More consolidates household settings into one collapsed destination with no closed body',()=>{
 const source=src('MoreHub.jsx'),css=src('styles/phase-4-8-1-mobile-continuity.css');
 assert.match(source,/<details className="more-settings-hub">/);assert.doesNotMatch(source,/<details className="more-settings-hub" open/);
 assert.match(source,/Garden and gardeners/);assert.match(source,/Location and frost dates/);assert.match(source,/Notifications/);
 assert.match(css,/more-settings-hub:not\(\[open\]\)>div\{display:none!important\}/);
 assert.equal((source.match(/title="Account"/g)||[]).length,0);assert.equal((source.match(/title="Settings"/g)||[]).length,0);assert.equal((source.match(/title="Garden Preferences"/g)||[]).length,0);
});

test('Today stays useful without repeating primary navigation and weather copy is human-readable',()=>{
 const workspace=src('WorkspaceScreens.jsx'),home=src('UrgentHome.jsx');
 assert.equal(workspace.includes('today-quick-links'),false);assert.match(home,/Everything looks good today/);assert.match(home,/No urgent garden actions right now/);assert.match(home,/Welcome to/);
 assert.match(workspace,/impactDisplayTitle/);assert.match(workspace,/Rain changed the watering plan/);assert.match(workspace,/WHAT TO DO/);assert.equal(workspace.includes('WEATHER-ACTION-SUMMARY'),false);
});

test('Phase 4.8.1 navigation styles retain More, weather, Indoor, and compact Tool Shed protections',()=>{
 const lock=src('styles/phase-4-7-5-navigation-lock.css'),smoothing=src('styles/phase-4-7-3-smoothing.css'),continuity=src('styles/phase-4-8-1-mobile-continuity.css'),toolShed=src('ToolShed.jsx'),main=src('main.jsx');
 assert.match(main,/phase-4-7-5-navigation-lock\.css/);assert.match(main,/phase-4-8-1-mobile-continuity\.css/);assert.match(lock,/compact-secondary-header/);assert.match(smoothing,/more-settings-hub>summary/);assert.match(smoothing,/weather-tool-tabs/);assert.match(smoothing,/indoor-center-content \.control-center-title/);
 assert.equal((toolShed.match(/<ToolCategory /g)||[]).length,3);assert.match(continuity,/tool-shed-category-summary/);
});

test('release metadata identifies Phase 4.8.1 user-facing continuity improvements',()=>{
 const source=src('version.js');
 assert.match(source,/APP_VERSION='0\.20\.9'/);assert.match(source,/phase-4-8-1-mobile-continuity/);
 assert.match(source,/Tool Shed categories now stay compact until opened/);assert.match(source,/Weather and timing tools are easier to understand/);assert.match(source,/Add Plant guides you to create a Growing Space first/);assert.match(source,/Vacation Mode now consistently uses Garden Buddy/);assert.match(source,/Home’s seasonal header now connects more cleanly to Today/);assert.match(source,/Garden & Account Settings no longer leaves an empty panel when closed/);
});
