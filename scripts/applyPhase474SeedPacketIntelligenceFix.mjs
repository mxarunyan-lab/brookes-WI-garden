import{readFile,writeFile}from'node:fs/promises';

const changed=[];
const replaceOnce=(source,oldValue,newValue,label)=>{
 if(source.includes(newValue))return source;
 if(!source.includes(oldValue))throw new Error(`Expected ${label} source was not found.`);
 changed.push(label);
 return source.replace(oldValue,newValue);
};

{
 const path='server/seedPacketVision.js';
 let source=await readFile(path,'utf8');
 source=replaceOnce(source,
  "const DEFAULT_REPAIR_PASSES = /^(1|true|yes|strict)$/i.test(process.env.SEED_PACKET_VISION_REPAIR_PASSES || '');",
  "const DEFAULT_REPAIR_PASSES = !/^(0|false|no|off)$/i.test(process.env.SEED_PACKET_VISION_REPAIR_PASSES || '');",
  'default packet repair passes');
 source=replaceOnce(source,
  "const prompt = `Act as a careful seed-packet document analyst. Inspect the FRONT and BACK images together as one physical packet. Use visible text, layout, icons, nearby labels, and front/back context. Never concatenate unrelated labels. FULL SUN is sunlight, VEGETABLE is category, and HEIRLOOM is a designation. Read fractions, ranges, barcode digits, lot, weight, packed-for year, sell-by date, and price separately. Return null rather than inventing. Every populated field must have matching fieldEvidence. Every fieldEvidence property not used must be null. Distinguish printed counts from weight-only inventory. Capture succession instructions as automation intelligence. Do not infer an exact seed count from packet weight. Return only the strict schema.`;",
  "const prompt = `Act as a meticulous seed-packet document analyst. Inspect the FRONT and BACK images together as one physical packet. Read every clearly visible identity, inventory, planting, timing, care, and harvest fact before returning. Preserve complete printed sentences and ranges; never shorten a sentence merely to fit a field. Use visible text, layout, icons, nearby labels, and front/back context. Never concatenate unrelated labels. FULL SUN is sunlight, VEGETABLE is category, HEIRLOOM and NON-GMO are designations, and long-day/short-day wording belongs in seasonal or regional guidance. Read fractions, ranges, barcode digits, lot, weight, packed-for year, sell-by date, and price separately. Return null rather than inventing, and treat a manufacturer-not-stated value as legitimately absent rather than a failure. Every populated field must have matching fieldEvidence. Every fieldEvidence property not used must be null. Distinguish printed counts from weight-only inventory. Capture succession instructions as automation intelligence. Do not infer an exact seed count from packet weight. Return only the strict schema.`;",
  'complete packet transcription prompt');
 const targetedMarker="  ['packetIdentity.productName', 'productName'],\n";
 const targetedInsert="  ['packetIdentity.productName', 'productName'],\n  ['packetIdentity.category', 'category'],\n  ['packetIdentity.designations', 'designations'],\n  ['inventory.packetYear', 'packetYear'],\n  ['inventory.printedSeedCount', 'printedSeedCount'],\n";
 source=replaceOnce(source,targetedMarker,targetedInsert,'expanded identity and inventory second pass');
 const growingMarker="  ['growing.thinningSpacingUnit', 'thinningSpacingUnit'],\n";
 const growingInsert="  ['growing.thinningSpacingUnit', 'thinningSpacingUnit'],\n  ['growing.finalSpacingValue', 'finalSpacingValue'],\n  ['growing.finalSpacingUnit', 'finalSpacingUnit'],\n  ['growing.germinationTemperatureMinimum', 'germinationTemperatureMinimum'],\n  ['growing.germinationTemperatureMaximum', 'germinationTemperatureMaximum'],\n";
 source=replaceOnce(source,growingMarker,growingInsert,'expanded growing-details second pass');
 const instructionMarker="  ['instructions.directSowGuidance', 'directSowGuidance'],\n";
 const instructionInsert="  ['instructions.directSowGuidance', 'directSowGuidance'],\n  ['instructions.indoorStartGuidance', 'indoorStartGuidance'],\n  ['instructions.transplantGuidance', 'transplantGuidance'],\n  ['instructions.seasonalWindow', 'seasonalWindow'],\n  ['instructions.frostTiming', 'frostTiming'],\n  ['instructions.fertilizingGuidance', 'fertilizingGuidance'],\n";
 source=replaceOnce(source,instructionMarker,instructionInsert,'expanded instruction second pass');
 source=replaceOnce(source,
  "  return identityMissing || missing.length >= 6 ? missing : [];",
  "  return identityMissing || missing.length ? missing.slice(0, 18) : [];",
  'second pass for every missing supported field');
 source=replaceOnce(source,
  "  const officialProduct = await productResearch({...analysis.packetIdentity, ...analysis.machineIdentifiers}).catch(() => ({exact: false, candidate: null, sources: []}));",
  "  const officialProduct = await productResearch({...analysis.packetIdentity, ...analysis.machineIdentifiers, packetYear: analysis.inventory.packetYear, rawVisibleText: analysis.rawVisibleText}).catch(() => ({exact: false, candidate: null, sources: []}));",
  'pass visible packet context into official research');
 await writeFile(path,source);
}

{
 const path='src/seedPacketIntelligence.js';
 let source=await readFile(path,'utf8');
 source=replaceOnce(source,
  "if(meta.confidence==='High'||meta.source==='manual'||meta.source==='online')ready.push(row);else check.push(row)",
  "if(meta.confidence!=='Low'||meta.source==='manual'||meta.source==='online')ready.push(row);else check.push(row)",
  'accept trustworthy medium-confidence packet text');
 source=replaceOnce(source,
  "const exactApproved=Boolean(draft.packetIntelligence?.onlineLookup?.approved);const essential=exactApproved?['name']:['name','variety','brand','packetYear','quantity','daysToMaturity','depth','thinningSpacing','germinationEstimate','sunlight'];const missing=essential.filter",
  "const exactApproved=Boolean(draft.packetIntelligence?.onlineLookup?.approved);const essential=exactApproved?['name']:['name','variety','brand'];const missing=essential.filter",
  'only identity fields block packet readiness');
 source=replaceOnce(source,
  "const optionalFields=['packetYear','quantity','lotNumber'];",
  "const optionalFields=['packetYear','quantity','lotNumber','daysToMaturity'];",
  'manufacturer-not-stated optional fields');
 await writeFile(path,source);
}

{
 const path='src/SeedTools.jsx';
 let source=await readFile(path,'utf8');
 source=replaceOnce(source,
  "const fieldStatus=meta=>!meta?'':`${meta.confidence||'Low'} · ${fieldSourceLabel(meta)}${meta.sourcePhoto?` · ${meta.sourcePhoto} photo`:''}`;\n",
  "const fieldStatus=meta=>!meta?'':`${meta.confidence||'Low'} · ${fieldSourceLabel(meta)}${meta.sourcePhoto?` · ${meta.sourcePhoto} photo`:''}`;\nconst LONG_PACKET_FIELDS=new Set(['notableClaims','seedStartingGuidance','directSowGuidance','transplantGuidance','seasonalWindow','frostTiming','waterGuidance','soilGuidance','fertilizingGuidance','successionGuidance','harvestGuidance','regionalGuidance','packetWarnings','treatmentInformation','seedSavingRestrictions','specialCare','containerSuitability','notes']);\n",
  'long packet field registry');
 const oldField="function PacketField({label,name,draft,onChange,children,required=false,placeholder='',type='text',min,step,inputMode}){\n const meta=draft.fieldMeta?.[name],status=fieldStatus(meta),id=`packet-${name}`;\n return <label htmlFor={id} className={meta?.confidence==='Low'?'packet-field needs-review':''}><span>{label}{required?' *':''}</span>{children||<input id={id} name={name} type={type} min={min} step={step} inputMode={inputMode} required={required} value={fieldValue(draft[name])} onChange={event=>onChange(name,event.target.value)} placeholder={placeholder}/>} {status&&<small className=\"packet-field-source\">{status}</small>}</label>;\n}";
 const newField="function PacketField({label,name,draft,onChange,children,required=false,placeholder='',type='text',min,step,inputMode}){\n const meta=draft.fieldMeta?.[name],status=fieldStatus(meta),id=`packet-${name}`,control=children||(LONG_PACKET_FIELDS.has(name)?<textarea id={id} name={name} rows=\"3\" required={required} value={fieldValue(draft[name])} onChange={event=>onChange(name,event.target.value)} placeholder={placeholder}/>:<input id={id} name={name} type={type} min={min} step={step} inputMode={inputMode} required={required} value={fieldValue(draft[name])} onChange={event=>onChange(name,event.target.value)} placeholder={placeholder}/>);\n return <label htmlFor={id} className={meta?.confidence==='Low'?'packet-field needs-review':''}><span>{label}{required?' *':''}</span>{control}{status&&<small className=\"packet-field-source\">{status}</small>}</label>;\n}";
 source=replaceOnce(source,oldField,newField,'multiline packet review fields');
 source=source.replaceAll('attention.slice(0,6).map(row=>','attention.map(row=>');
 source=source.replaceAll('Optional details not found: ','Optional details not printed or not verified: ');
 const oldLookup="const result=await lookupSeedProducts(identity,{verifyOnline:false});setLookup({...result,status:result.primaryCandidate?'candidates':'none',error:''})";
 const newLookup="const result=await lookupSeedProducts(identity,{verifyOnline:false});const exact=result.exactCandidate||result.primaryCandidate?.match?.exact&&result.primaryCandidate;if(exact){setDraft(current=>applySeedProductCandidate(current,exact));setLookup({...result,status:'matched',primaryCandidate:exact,candidates:[exact],otherCandidates:[],error:''})}else setLookup({...result,status:result.primaryCandidate?'candidates':'none',error:''})";
 source=replaceOnce(source,oldLookup,newLookup,'automatic exact official product application');
 const oldRetry="const result=await lookupSeedProducts(seedLookupIdentity(draft),{ignoreCache:true,verifyOnline:false});setLookup({...result,status:result.primaryCandidate?'candidates':'none',error:''})";
 const newRetry="const result=await lookupSeedProducts(seedLookupIdentity(draft),{ignoreCache:true,verifyOnline:false});const exact=result.exactCandidate||result.primaryCandidate?.match?.exact&&result.primaryCandidate;if(exact){setDraft(current=>applySeedProductCandidate(current,exact));setLookup({...result,status:'matched',primaryCandidate:exact,candidates:[exact],otherCandidates:[],error:''})}else setLookup({...result,status:result.primaryCandidate?'candidates':'none',error:''})";
 source=replaceOnce(source,oldRetry,newRetry,'automatic exact lookup retry application');
 source=replaceOnce(source,
  "setVisionState({status:'ready',message:official?'Exact packet identified and verified with an official source.':merged.optionalMissing.length?'Packet identified; a few optional details need review.':'Packet details ready.'",
  "setVisionState({status:'ready',message:official?'Exact packet identified and verified with an official source.':merged.conflicts.length?'Packet read; review the highlighted conflicts.':'Packet text read and ready. Optional details the manufacturer does not state may remain blank.'",
  'honest packet completion message');
 await writeFile(path,source);
}

{
 const path='src/styles/phase-4-7-4-certification.css';
 let source=await readFile(path,'utf8');
 const marker='/* VIS-004 — Seed Packet Intelligence keeps complete instructions readable. */';
 if(!source.includes(marker)){
  source+=`\n\n${marker}\n.seed-tools-screen .packet-field{min-width:0}\n.seed-tools-screen .packet-field textarea,.seed-tools-screen .packet-exception-fields textarea{width:100%;min-height:92px;max-height:240px;padding:12px 14px;border:1px solid rgba(23,61,43,.22);border-radius:15px;background:#fffdf8;color:#173d2b;font:inherit;font-size:1rem;line-height:1.42;white-space:pre-wrap;overflow-wrap:anywhere;resize:vertical;box-sizing:border-box}\n.seed-tools-screen .packet-field textarea:focus,.seed-tools-screen .packet-exception-fields textarea:focus{outline:3px solid rgba(44,114,75,.18);border-color:#2c724b}\n.seed-tools-screen .packet-exception-fields{grid-template-columns:1fr!important}\n.seed-tools-screen .packet-exception-fields input{min-width:0;text-overflow:ellipsis}\n`;
  changed.push('readable seed packet review controls');
 }
 await writeFile(path,source);
}

console.log(JSON.stringify({ok:true,changed},null,2));
