import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const src=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');

test('Garden Center is a department hub, not a duplicate daily dashboard',()=>{
 const source=src('GardenCenter.jsx');
 assert.equal(source.includes('NEXT BEST MOVE'),false);
 assert.equal(source.includes('garden-center-next-step'),false);
 assert.equal(source.includes('due today'),false);
 assert.match(source,/Manage and plan the garden/);
 assert.match(source,/Seed Department/);
 assert.match(source,/Growing Spaces/);
});

test('Today owns one compact status summary without redundant navigation tiles',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/GARDEN STATUS/);
 assert.equal(source.includes('today-quick-links'),false);
 assert.match(source,/No garden work needs your attention right now/);
 assert.equal(source.includes("TODAY'S GARDEN BRIEF"),false);
 assert.equal(source.includes('GARDEN TASKS</small><strong>'),false);
 assert.equal(source.includes('seed-readiness-announcement'),false);
});

test('Tool Shed is tool-focused and More owns consolidated settings and data management',()=>{
 const toolShed=src('ToolShed.jsx'),more=src('MoreHub.jsx');
 assert.match(toolShed,/WEATHER TOOLS/);
 assert.match(toolShed,/NOTES & PRINTABLES/);
 assert.match(toolShed,/UTILITIES/);
 assert.match(toolShed,/openWeather\('garden'\)/);
 assert.match(toolShed,/openWeather\('rain'\)/);
 assert.match(toolShed,/openWeather\('frost'\)/);
 assert.equal(toolShed.includes('title="Settings"'),false);
 assert.equal(toolShed.includes('title="Data Management"'),false);
 assert.match(more,/<details className="more-settings-hub">/);
 assert.match(more,/Garden and gardeners/);
 assert.match(more,/Location and frost dates/);
 assert.match(more,/Notifications/);
 assert.match(more,/title="Data Management"/);
 assert.match(more,/title="Quick Help"/);
 assert.match(more,/title="What's New"/);
});

test('Weather Tools uses contextual back navigation and focused modes',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/navigate\('back'\)/);
 assert.match(source,/mode==='garden'/);
 assert.match(source,/mode==='rain'/);
 assert.match(source,/mode==='frost'/);
 assert.equal(source.includes('defaultOpen/>'),false);
 assert.equal(source.includes('Back to Today'),false);
});

test('Planting Desk separates saved seeds and generic opportunities with collapsed groups',()=>{
 const source=src('PlanPlantHub.jsx');
 assert.match(source,/MY SAVED SEEDS/);
 assert.match(source,/OTHER PLANTING OPPORTUNITIES/);
 assert.match(source,/CollapsedGardenIntelligenceQueues/);
 assert.match(source,/CollapsedRecommendationCard/);
 assert.match(source,/planting-desk-open-groups-v2/);
 assert.equal(source.includes('{[defaultGroup]:true}'),false);
});

test('bell and Today visible actions share the same task board source',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/board=buildTaskBoard/);
 assert.match(source,/active=board\.needsAttention/);
 assert.match(source,/notification-count/);
 assert.match(source,/WhatMattersToday board=\{board\} activeTasks=\{active\}/);
});

test('320px mobile layout contains the Wisconsin hero artwork',()=>{
 const source=src('styles.css');
 assert.match(source,/@media\(max-width:360px\)/);
 assert.match(source,/\.compact-home-hero \.wisconsin-landscape/);
 assert.match(source,/width:100%!important/);
 assert.match(source,/max-width:100%!important/);
});