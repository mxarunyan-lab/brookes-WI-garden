import fs from'node:fs';
import{spawnSync}from'node:child_process';
const version=fs.readFileSync('src/version.js','utf8');
if(!version.includes("APP_VERSION='0.21.0'")){
 const result=spawnSync('python',['scripts/finalizePhase482.py'],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
