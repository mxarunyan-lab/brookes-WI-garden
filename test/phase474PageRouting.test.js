import test from'node:test';
import assert from'node:assert/strict';
import{normalizePage,pageFromPopState,pageUrl,readInitialPage,REGISTERED_PAGES}from'../src/pageRouting.js';

const location=(search='',pathname='/garden',hash='')=>({search,pathname,hash});
const storage=value=>({getItem:key=>key==='brookes-garden-page-v2'?value:null});

test('all registered page IDs normalize without changing identity',()=>{
 for(const page of REGISTERED_PAGES)assert.equal(normalizePage(page),page==='profile'?'more':page);
 assert.equal(normalizePage('settings'),'more');
 assert.equal(normalizePage('tool-shed'),'tools');
 assert.equal(normalizePage('not-a-route'),'today');
});

test('page query wins over saved local page and remains refreshable',()=>{
 assert.equal(readInitialPage(location('?page=admin-about'),storage('garden')),'admin-about');
 assert.equal(readInitialPage(location('?page=seed-tools'),storage('today')),'seed-tools');
 assert.equal(readInitialPage(location(''),storage('tools')),'tools');
});

test('record query routes retain ownership of their existing startup behavior',()=>{
 assert.equal(readInitialPage(location('?bed=space-123&page=admin-about'),storage('tools')),'today');
 assert.equal(readInitialPage(location('?gardenLabel=plant:plant-123&page=more'),storage('tools')),'today');
});

test('page URLs use a clean root URL for Today and an explicit page query otherwise',()=>{
 assert.equal(pageUrl('today',location('?page=tools','/')),'/');
 assert.equal(pageUrl('admin-about',location('','/')),'/?page=admin-about');
 assert.equal(pageUrl('tool-shed',location('','/garden')),'/garden?page=tools');
});

test('browser popstate page selection is validated',()=>{
 assert.equal(pageFromPopState({state:{gardenPage:'admin-backup'}},location('')),'admin-backup');
 assert.equal(pageFromPopState({state:null},location('?page=weather')),'weather');
 assert.equal(pageFromPopState({state:{gardenPage:'invalid'}},location('?page=invalid')),'today');
});
