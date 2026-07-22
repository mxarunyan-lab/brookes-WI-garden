import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath=new URL('../.github/workflows/verify-phase46x3-live.yml',import.meta.url);
const packagePath=new URL('../package.json',import.meta.url);
const verifierPath=new URL('../scripts/verifyPhase472Live.mjs',import.meta.url);

test('permanent Render workflow uses only the Phase 4.7.3 verifier and status names',async()=>{
  const workflow=await readFile(workflowPath,'utf8');
  const pkg=JSON.parse(await readFile(packagePath,'utf8'));
  const verifier=await readFile(verifierPath,'utf8');

  assert.match(workflow,/name: Verify Render Phase 4\.7\.3/);
  assert.match(workflow,/group: phase473-live-verification/);
  assert.match(workflow,/npm run verify:phase473:live/);
  assert.match(workflow,/context\":\"render\/phase-4-7-3/);
  assert.match(workflow,/name: phase473-live-verification/);
  assert.doesNotMatch(workflow,/Phase 4\.7\.1|phase-4-7-1|phase471-live-verification/);
  assert.doesNotMatch(workflow,/npm run verify:phase46x3:live/);
  assert.equal(pkg.scripts['verify:phase473:live'],'node scripts/verifyPhase472Live.mjs');
  assert.match(verifier,/phase-4-7-3-final-pre-sync-smoothing/);
});

test('status publication cannot make a successful live verification red',async()=>{
  const workflow=await readFile(workflowPath,'utf8');
  assert.match(workflow,/Could not publish the pending Render verification status/);
  assert.match(workflow,/Live verification completed, but GitHub could not publish the Render commit status/);
  assert.match(workflow,/name: Enforce live verification result/);
  assert.match(workflow,/steps\.verify\.outcome/);
  assert.doesNotMatch(workflow,/test "\$state" = success/);
});
