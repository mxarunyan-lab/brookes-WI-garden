import test from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import{repairKnownMojibakeText}from'../src/dataReadiness.js';

const root=process.cwd(),scanDirs=['src','test','public'],badPatterns=['\u00c2\u00b7','\u00c2\u00b0','\u00c3\u0097','\u00e2\u20ac\u2122','\u00e2\u20ac\u0153','\u00e2\u20ac\u009d','\u00e2\u20ac\u2013','\u00e2\u20ac\u00a2','\uFFFD'];
function files(dir,out=[]){for(const name of fs.readdirSync(dir)){const full=path.join(dir,name),stat=fs.statSync(full);if(stat.isDirectory())files(full,out);else if(/\.(js|jsx|css|html|md)$/.test(full))out.push(full)}return out}

test('source text has no common mojibake sequences',()=>{
 const hits=[];
 for(const file of scanDirs.flatMap(dir=>files(path.join(root,dir)))){const text=fs.readFileSync(file,'utf8');for(const pattern of badPatterns)if(text.includes(pattern))hits.push(path.relative(root,file))}
 assert.deepEqual([...new Set(hits)],[]);
});

test('migration repairs deterministic mojibake already stored in browser data',()=>{
 const repaired=repairKnownMojibakeText({note:'Tomato \u00c2\u00b7 pepper \u00e2\u20ac\u2122saved\u00e2\u20ac\u2122'});
 assert.equal(repaired.note,'Tomato · pepper ’saved’');
});
