import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import test from'node:test';

const workflowPath=new URL('../.github/workflows/verify-phase46x3-live.yml',import.meta.url);
const packagePath=new URL('../package.json',import.meta.url);
const verifierPath=new URL('../scripts/verifyPhase481Live.mjs',import.meta.url);

test('permanent Render workflow uses the Phase 4.8.1 live mobile verifier and established status names',async()=>{
 const workflow=await readFile(workflowPath,'utf8'),pkg=JSON.parse(await readFile(packagePath,'utf8')),verifier=await readFile(verifierPath,'utf8');
 assert.match(workflow,/name: Verify Render Phase 4\.8\.1/);
 assert.match(workflow,/group: phase481-live-verification/);
 assert.match(workflow,/npm run verify:phase481:live/);
 assert.match(workflow,/context":"render\/phase-4-8-1/);
 assert.match(workflow,/name: phase481-live-verification/);
 assert.match(workflow,/Install Playwright Chromium/);
 assert.equal(pkg.scripts['verify:phase481:live'],'node scripts/verifyPhase481Live.mjs');
 assert.match(verifier,/phase-4-8-1-mobile-continuity/);
 assert.match(verifier,/garden-header-.*\.webp/);
 assert.match(verifier,/background-size:contain/);
 assert.match(verifier,/tool-shed-category/);
 assert.match(verifier,/viewport:\{width,height:900\}/);
 assert.match(verifier,/\[320,375,390,430\]/);
});

test('status publication cannot make a successful live verification red',async()=>{
 const workflow=await readFile(workflowPath,'utf8');
 assert.match(workflow,/Could not publish the pending Render verification status/);
 assert.match(workflow,/Live verification completed, but GitHub could not publish the Render commit status/);
 assert.match(workflow,/name: Enforce live verification result/);
 assert.match(workflow,/steps\.verify\.outcome/);
 assert.doesNotMatch(workflow,/test "\$state" = success/);
});
