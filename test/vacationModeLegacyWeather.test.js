import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const source=await readFile('src/VacationMode.jsx','utf8');

test('Vacation Mode does not dereference a missing legacy weather summary',()=>{
 assert.match(source,/const summary=plan\?\.weatherSummary/);
 assert.match(source,/Number\.isFinite\(high\)/);
 assert.match(source,/Forecast incomplete/);
 assert.doesNotMatch(source,/weatherSummary\?\.high!==null\?`\$\{Math\.round\(active\.weatherSummary\.high\)/);
});

test('Vacation Mode keeps local calendar dates and current Garden Buddy wording',()=>{
 assert.match(source,/getFullYear\(\)/);
 assert.match(source,/getMonth\(\)\+1/);
 assert.doesNotMatch(source,/const today=\(\)=>new Date\(\)\.toISOString\(\)\.slice\(0,10\)/);
 assert.match(source,/eyebrow="PLAN & CARE"/);
 assert.match(source,/Print Garden Buddy guide/);
 assert.doesNotMatch(source,/Print helper guide|Helper edits are preserved|No additional helper tasks/);
});
