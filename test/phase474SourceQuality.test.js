import test from'node:test';
import assert from'node:assert/strict';
import{readdirSync,readFileSync}from'node:fs';
import path from'node:path';

const root=new URL('../src/',import.meta.url);
function walk(directory){return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const full=new URL(entry.name+(entry.isDirectory()?'/':''),directory);return entry.isDirectory()?walk(full):/\.(jsx?|css)$/.test(entry.name)?[full]:[]})}
const files=walk(root);
const rowsFor=(source,pattern)=>source.split('\n').flatMap((line,index)=>pattern.test(line)?[index+1]:[]);

test('source contains no known mojibake sequences',()=>{
 const findings=[];
 for(const file of files){const source=readFileSync(file,'utf8');for(const line of rowsFor(source,/[ÃÂâ][\u0080-\u00ff\u2010-\u2122]|â€“|â€”|â€™|â€œ|â€|Â·|Â°/))findings.push(`${path.basename(file.pathname)}:${line}`)}
 assert.deepEqual(findings,[],`Broken text encoding remains at ${findings.join(', ')}`);
});

test('source contains no placeholder hash links or console-log-only click handlers',()=>{
 const findings=[];
 for(const file of files){const source=readFileSync(file,'utf8');for(const line of rowsFor(source,/href=["']#["']|onClick\s*=\s*\{\s*\(.*?\)\s*=>\s*(?:\{\s*)?console\.log/))findings.push(`${path.basename(file.pathname)}:${line}`)}
 assert.deepEqual(findings,[],`Placeholder interaction remains at ${findings.join(', ')}`);
});

test('launch code does not overwrite the user page with Today',()=>{
 const source=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.equal(source.includes("writeStorage(PAGE_KEY, 'today');\n\nReactDOM"),false);
});

test('approved Phase 4.7.3 and Phase 4.7.4 styles load after the legacy cascade',()=>{
 const source=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 const legacy=source.indexOf("import './styles.css'"),phase473=source.indexOf("import './styles/phase-4-7-3-smoothing.css'"),phase474=source.indexOf("import './styles/phase-4-7-4-certification.css'");
 assert.ok(legacy>=0&&phase473>legacy&&phase474>phase473);
});
