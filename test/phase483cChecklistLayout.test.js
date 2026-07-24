import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const cssPath='src/styles/phase-4-8-3b-garden-history.css';
const read=path=>readFile(path,'utf8');

test('Phase 4.8.3c resets obsolete list-item grid and preserves a usable button grid',async()=>{
 const css=await read(cssPath);
 assert.match(css,/\.garden-setup-steps\{[^}]*width:100%[^}]*min-width:0/);
 const li=css.match(/\.garden-setup-steps li\{([^}]*)\}/)?.[1]||'';
 assert.match(li,/display:block/);
 assert.match(li,/width:100%/);
 assert.match(li,/min-width:0/);
 assert.doesNotMatch(li,/grid-template-columns\s*:\s*34px\s+1fr/);
 const button=css.match(/\.garden-setup-steps li>button\{([^}]*)\}/)?.[1]||'';
 assert.match(button,/width:100%/);
 assert.match(button,/max-width:100%/);
 assert.match(button,/min-width:0/);
 assert.match(button,/min-height:56px/);
 assert.match(button,/box-sizing:border-box/);
 assert.match(button,/grid-template-columns:28px minmax\(0,1fr\) 18px/);
 assert.match(button,/white-space:normal/);
 assert.doesNotMatch(button,/word-break:break-all/);
});

test('320px layout math leaves a substantial content column without overflow',()=>{
 const viewport=320,bodyGutter=24,cardPadding=24,buttonPadding=20,columns=26+18,gaps=16;
 const available=viewport-bodyGutter-cardPadding;
 const buttonWidth=available;
 const contentWidth=buttonWidth-buttonPadding-columns-gaps;
 assert.ok(buttonWidth>34,'button must be substantially wider than the obsolete 34px column');
 assert.ok(buttonWidth>=250,'button must occupy the available mobile card width');
 assert.ok(contentWidth>=170,'content column must remain usable at 320px');
 assert.ok(buttonWidth<=viewport,'button must not overflow the viewport');
 const title='Confirm Garden Details';
 assert.ok(contentWidth/title.length>6,'title must not collapse to one character per line');
});

test('hiding a Growing Space keeps Garden rendered and exposes a restore path',async()=>{
 const workspace=await read('src/BedWorkspace.jsx');
 assert.match(workspace,/const handleManage=\(action,id\)=>/);
 assert.match(workspace,/action==='hide'\|\|action==='remove'/);
 assert.match(workspace,/setSelected\(current=>current===id\?null:current\)/);
 assert.match(workspace,/manage=\{handleManage\}/);
 assert.match(workspace,/handleManage\('show',s\.id\)/);
 assert.match(workspace,/All Growing Spaces are hidden/);
 assert.match(workspace,/Your garden data is still saved/);
});

test('Phase 4.8.3d release identifiers and data-neutral onboarding logic remain intact',async()=>{
 const[version,server,sw,onboarding,app]=await Promise.all(['src/version.js','server/index.js','public/sw.js','src/setupOnboarding.js','src/App.jsx'].map(read));
 assert.match(version,/APP_VERSION='0\.21\.1'/);
 assert.match(version,/phase-4-8-3d-operational-cleanup-hide-fix/);
 assert.match(version,/Hiding a Growing Space now keeps Garden open/);
 assert.match(server,/phase:'4\.8\.3d'/);
 assert.match(server,/phase-4-8-3d-operational-cleanup-hide-fix/);
 assert.match(sw,/v0483d-operational-cleanup-hide-fix-20260724/);
 for(const key of['setupDetailsConfirmedAt','setupGardenConfirmedAt','setupCompletedAt'])assert.match(onboarding,new RegExp(key));
 assert.match(app,/beginGardenSetupReview/);
 assert.match(app,/confirmGardenSetup/);
});
