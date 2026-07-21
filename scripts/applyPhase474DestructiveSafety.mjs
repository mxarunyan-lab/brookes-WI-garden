import{readFile,writeFile}from'node:fs/promises';
async function patch(path,changes){let source=await readFile(path,'utf8'),changed=false;for(const{old,next,label}of changes){if(source.includes(next))continue;if(!source.includes(old))throw new Error(`${path}: expected source not found for ${label}`);source=source.replace(old,next);changed=true}if(changed)await writeFile(path,source);return changed}
const bedChanged=await patch('src/BedWorkspace.jsx',[
 {label:'safe Growing Space removal',old:'<button className="danger-space-action" onClick={()=>manage(\'remove\',space.id)}><Trash2/> Remove</button>',next:'<button className="danger-space-action" disabled={plants.length>0} title={plants.length?`Move or remove ${plants.length} linked plant record${plants.length===1?\'\':\'s\'} first`:`Remove ${space.name}`} onClick={()=>{if(window.confirm(`Remove ${space.name}? This keeps other garden records unchanged.`))manage(\'remove\',space.id)}}><Trash2/>{plants.length?\' Plants linked\':\' Remove\'}</button>'}
]);
const plantChanged=await patch('src/GardenControls.jsx',[
 {label:'plant removal confirmation',old:'<button type="button" className="danger-control" onClick={()=>deletePlant(plant.id)}><Trash2/>Remove from active records</button>',next:'<button type="button" className="danger-control" onClick={()=>{if(window.confirm(`Remove ${plant.name} from active records? Its saved history will remain soft-deleted for recovery and migration.`))deletePlant(plant.id)}}><Trash2/>Remove from active records</button>'}
]);
const packetChanged=await patch('src/SeedTools.jsx',[
 {label:'packet removal confirmation',old:'<button type="button" onClick={()=>deletePacket(packet.id)} aria-label={`Remove ${packet.name} packet`}><X/>Remove</button>',next:'<button type="button" onClick={()=>{if(window.confirm(`Remove the saved ${[packet.brand,packet.variety||packet.name].filter(Boolean).join(\' \')} packet? Connected planting records will retain their saved packet snapshot.`))deletePacket(packet.id)}} aria-label={`Remove ${packet.name} packet`}><X/>Remove</button>'}
]);
console.log(JSON.stringify({ok:true,changed:{bedChanged,plantChanged,packetChanged}},null,2));
