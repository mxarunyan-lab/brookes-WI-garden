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

test('More consolidates household settings into one grouped destination',()=>{
 const source=src('MoreHub.jsx');
 assert.match(source,/more-settings-hub/);
 assert.match(source,/Garden and gardeners/);
 assert.match(source,/Location and frost dates/);
 assert.match(source,/Notifications/);
 assert.equal((source.match(/title="Account"/g)||[]).length,0);
 assert.equal((source.match(/title="Settings"/g)||[]).length,0);
 assert.equal((source.match(/title="Garden Preferences"/g)||[]).length,0);
});

test('Today is useful when caught up and weather copy is human-readable',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/today-quick-links/);
 assert.match(source,/You are caught up/);
 assert.match(source,/impactDisplayTitle/);
 assert.match(source,/Rain changed the watering plan/);
 assert.match(source,/WHAT TO DO/);
 assert.equal(source.includes('WEATHER-ACTION-SUMMARY'),false);
});

test('Tool Shed readability and compact mobile ownership overrides load last',()=>{
 const source=src('styles.css');
 assert.match(source,/tool-shed-card-list \.secondary-card\.tone-green/);
 assert.match(source,/color:#173d2b!important/);
 assert.match(source,/chore-command-bar/);
 assert.match(source,/more-settings-hub/);
 assert.match(source,/weather-brief-decision/);
 assert.match(source,/today-quick-links/);
});

test('release metadata identifies the pre-sync usability cleanup',()=>{
 const source=src('version.js');
 assert.match(source,/phase-4-7-2-pre-sync-usability-cleanup/);
 assert.match(source,/Chore Board now has one clear needs-attention queue/);
});
