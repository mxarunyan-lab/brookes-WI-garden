import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';

const src=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');

test('Garden Center is locked to five core garden-management destinations',()=>{
 const source=src('GardenCenter.jsx');
 assert.equal(source.includes('NEXT BEST MOVE'),false);
 assert.equal(source.includes('garden-center-next-step'),false);
 assert.equal(source.includes('due today'),false);
 assert.match(source,/title="Garden Center"/);
 assert.equal((source.match(/<DepartmentTile /g)||[]).length,5);
 for(const title of['Seed Department','Planting Desk','Growing Spaces','Indoor Growing','Garden Chore Board'])assert.match(source,new RegExp(title));
 for(const removed of['Shopping List','Vacation Mode','Garden History'])assert.equal(source.includes(`title="${removed}"`),false);
});

test('Today owns one calm compact summary without the duplicated Garden Status dashboard',()=>{
 const workspace=src('WorkspaceScreens.jsx'),home=src('UrgentHome.jsx');
 assert.doesNotMatch(workspace,/GARDEN STATUS/);
 assert.match(workspace,/SimplifiedTodayCard/);
 assert.equal(workspace.includes('today-quick-links'),false);
 assert.match(home,/Everything looks good today/);
 assert.match(home,/No urgent garden actions right now/);
 assert.match(home,/Add What I’m Growing/);
 assert.equal(workspace.includes("TODAY'S GARDEN BRIEF"),false);
 assert.equal(workspace.includes('GARDEN TASKS</small><strong>'),false);
 assert.equal(workspace.includes('seed-readiness-announcement'),false);
});

test('Tool Shed uses three closed controlled categories and More retains settings and data management',()=>{
 const toolShed=src('ToolShed.jsx'),more=src('MoreHub.jsx'),css=src('styles/phase-4-8-1-mobile-continuity.css');
 assert.match(toolShed,/useState\(null\)/);
 assert.equal((toolShed.match(/<ToolCategory /g)||[]).length,3);
 assert.equal((toolShed.match(/<ToolCard /g)||[]).length,9);
 assert.match(toolShed,/title="Calculators & Utilities"[^>]+count=\{4\}/);
 assert.match(toolShed,/title="Weather & Timing"[^>]+count=\{1\}/);
 assert.match(toolShed,/title="Records & Extras"[^>]+count=\{4\}/);
 assert.match(toolShed,/title="Garden Weather & Timing"/);
 assert.doesNotMatch(toolShed,/title="Rain & Watering Review"/);
 assert.doesNotMatch(toolShed,/title="Frost & Planting Dates"/);
 assert.match(toolShed,/aria-expanded=\{open\}/);
 assert.match(toolShed,/aria-controls=/);
 assert.match(more,/<details className="more-settings-hub">/);
 assert.match(more,/Garden and gardeners/);
 assert.match(more,/Location and frost dates/);
 assert.match(more,/Notifications/);
 assert.match(css,/more-settings-hub:not\(\[open\]\)>div\{display:none!important\}/);
 assert.match(css,/more-settings-hub\[open\]>div\{display:grid!important\}/);
 assert.match(more,/title="Data Management"/);
 assert.match(more,/title="Quick Help"/);
 assert.match(more,/title="What's New"/);
});

test('Weather tools use contextual back navigation and focused modes',()=>{
 const source=src('WorkspaceScreens.jsx');
 assert.match(source,/onBack=\{\(\)=>navigate\('back'\)\}/);
 assert.match(source,/mode==='garden'/);
 assert.match(source,/mode==='rain'/);
 assert.match(source,/mode==='frost'/);
 assert.match(source,/role="tab"/);
 assert.match(source,/aria-selected=\{mode===id\}/);
 assert.equal((source.match(/<WeatherDetails/g)||[]).length,1);
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

test('watering can and Today use the same urgent-only task list',()=>{
 const workspace=src('WorkspaceScreens.jsx'),home=src('UrgentHome.jsx'),classifier=src('urgentGardenAlerts.js');
 assert.match(workspace,/board=buildTaskBoard/);
 assert.match(workspace,/urgentAlerts=getUrgentGardenAlerts\(board\.needsAttention\)/);
 assert.match(workspace,/UrgentAlertControl[^>]+alerts=\{urgentAlerts\}/);
 assert.match(workspace,/SimplifiedTodayCard[^>]+urgentAlerts=\{urgentAlerts\}/);
 assert.match(home,/notification-count/);
 assert.match(home,/WateringCanIcon/);
 assert.match(classifier,/NON_URGENT_KINDS/);
});

test('320px mobile layout contains the Wisconsin hero artwork',()=>{
 const source=src('styles.css');
 assert.match(source,/@media\(max-width:360px\)/);
 assert.match(source,/\.compact-home-hero \.wisconsin-landscape/);
 assert.match(source,/width:100%!important/);
 assert.match(source,/max-width:100%!important/);
});
