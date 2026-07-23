import fs from'node:fs';
import{spawnSync}from'node:child_process';
const version=fs.readFileSync('src/version.js','utf8');
if(!version.includes("APP_VERSION='0.21.0'")){
 const compatibilityPath='public/service-worker.js';
 const actualPath='public/sw.js';
 const createdCompatibility=!fs.existsSync(compatibilityPath)&&fs.existsSync(actualPath);
 if(createdCompatibility)fs.copyFileSync(actualPath,compatibilityPath);
 const result=spawnSync(process.platform==='win32'?'python':'python3',['scripts/finalizePhase482.py'],{stdio:'inherit'});
 if(result.error){console.error(result.error.message);process.exit(1)}
 if(result.status!==0)process.exit(result.status||1);
 if(createdCompatibility&&fs.existsSync(compatibilityPath)){
  fs.copyFileSync(compatibilityPath,actualPath);
  fs.unlinkSync(compatibilityPath);
 }
}
