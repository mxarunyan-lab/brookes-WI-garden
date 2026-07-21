import{mkdir,readdir,readFile,writeFile}from'node:fs/promises';
import path from'node:path';

const root=path.resolve('src'),outDir=path.resolve('phase474-audit');
await mkdir(outDir,{recursive:true});

async function walk(dir){const rows=[];for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())rows.push(...await walk(full));else if(/\.(jsx?|tsx?)$/.test(entry.name))rows.push(full)}return rows}
const files=await walk(root),actions=[],routes=new Map(),findings=[];
const tagRe=/<(button|a|input|select|textarea|summary|details|form)\b([^>]*)>/g;
const visibleText=(source,index)=>source.slice(index,index+260).replace(/<[^>]+>/g,' ').replace(/\{[^}]+\}/g,' ').replace(/\s+/g,' ').trim().slice(0,140);
const attr=(attrs,name)=>{const quoted=attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`));if(quoted)return quoted[1];const brace=attrs.match(new RegExp(`${name}\\s*=\\s*\\{([^}]*)\\}`));return brace?.[1]?.trim()||''};
const hasBehavior=attrs=>/\b(onClick|onSubmit|onChange|onInput|onPointerUp|onKeyDown|href|formAction)\s*=/.test(attrs);
const wrappedByLabel=(source,index)=>{const before=source.slice(Math.max(0,index-500),index);return before.lastIndexOf('<label')>before.lastIndexOf('</label>')};
for(const file of files){const source=await readFile(file,'utf8'),relative=path.relative(process.cwd(),file).replaceAll('\\','/');
 for(const match of source.matchAll(/page==='([^']+)'/g))routes.set(match[1],{routeId:match[1],source:relative,kind:'page-registry'});
 for(const match of source.matchAll(/navigate\('([^']+)'\)/g))if(!routes.has(match[1]))routes.set(match[1],{routeId:match[1],source:relative,kind:'navigation-target'});
 let match;while((match=tagRe.exec(source))){const[tag,element,attrs]=match,line=source.slice(0,match.index).split('\n').length,label=attr(attrs,'aria-label')||attr(attrs,'title')||visibleText(source,match.index+tag.length),handler=attr(attrs,'onClick')||attr(attrs,'onSubmit')||attr(attrs,'onChange')||attr(attrs,'href'),className=attr(attrs,'className'),disabled=/\bdisabled\b/.test(attrs),type=attr(attrs,'type')||element,behavior=hasBehavior(attrs);
  const row={actionId:`ACT-${String(actions.length+1).padStart(4,'0')}`,file:relative,line,element,type,label:label||'(no visible label extracted)',className,handler:handler||'',hasBehavior:behavior,disabled,initialRisk:''};
  if(element==='button'&&type==='button'&&!behavior)row.initialRisk='explicit-button-without-handler';
  if(element==='a'&&(!/\bhref\s*=/.test(attrs)||attr(attrs,'href')==='#'))row.initialRisk='link-without-usable-destination';
  if(element==='input'&&!attr(attrs,'aria-label')&&!attr(attrs,'id')&&!wrappedByLabel(source,match.index)&&!/type=["']?(hidden|file)/.test(attrs))row.initialRisk='unassociated-input-needs-browser-verification';
  if(row.initialRisk)findings.push({...row});actions.push(row);
 }
 for(const match of source.matchAll(/onClick\s*=\s*\{\(\)=>\{?\s*console\.log/g))findings.push({file:relative,line:source.slice(0,match.index).split('\n').length,initialRisk:'console-log-only-action'});
 for(const match of source.matchAll(/href=["']#["']/g))findings.push({file:relative,line:source.slice(0,match.index).split('\n').length,initialRisk:'hash-link'});
}
const routeRows=[...routes.values()].sort((a,b)=>a.routeId.localeCompare(b.routeId));
const csvEscape=value=>`"${String(value??'').replaceAll('"','""')}"`;
const headers=['actionId','file','line','element','type','label','className','handler','hasBehavior','disabled','initialRisk'];
const csv=[headers.join(','),...actions.map(row=>headers.map(key=>csvEscape(row[key])).join(','))].join('\n');
await writeFile(path.join(outDir,'action-inventory.json'),JSON.stringify(actions,null,2));
await writeFile(path.join(outDir,'action-inventory.csv'),csv);
await writeFile(path.join(outDir,'route-target-inventory.json'),JSON.stringify(routeRows,null,2));
await writeFile(path.join(outDir,'initial-static-findings.json'),JSON.stringify(findings,null,2));
await writeFile(path.join(outDir,'inventory-summary.json'),JSON.stringify({generatedAt:new Date().toISOString(),filesScanned:files.length,actionsFound:actions.length,routeTargetsFound:routeRows.length,staticRiskFlags:findings.length},null,2));
console.log(JSON.stringify({ok:true,filesScanned:files.length,actionsFound:actions.length,routeTargetsFound:routeRows.length,staticRiskFlags:findings.length,outDir},null,2));
