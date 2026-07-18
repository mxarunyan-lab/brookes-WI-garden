from pathlib import Path


def replace_required(text,old,new,label):
    if old not in text: raise SystemExit(f'missing {label}')
    return text.replace(old,new,1)

path=Path('src/seedPacketIntelligence.js')
text=path.read_text()
text=replace_required(text,"const uniq=values=>[...new Set(values.filter(Boolean))];","const uniq=values=>[...new Set(values.filter(Boolean))];\nconst PREFILL_MANUAL_FIELDS=new Set(['name','variety','brand','notes','sourceShoppingItemId']);",'prefill field whitelist')
old="for(const [key,value] of Object.entries(prefill)){if(value!==''&&value!==null&&value!==undefined&&!['fieldMeta','packetIntelligence'].includes(key)&&!merged.fieldMeta[key])merged.fieldMeta[key]={source:'manual',confidence:'High',manuallyCorrected:false,correctedAt:null}}"
new="for(const [key,value] of Object.entries(prefill)){if(PREFILL_MANUAL_FIELDS.has(key)&&value!==''&&value!==null&&value!==undefined&&!merged.fieldMeta[key])merged.fieldMeta[key]={source:'manual',confidence:'High',manuallyCorrected:false,correctedAt:null}}"
text=replace_required(text,old,new,'default metadata filtering')
text=replace_required(text,"const entries=Object.entries(draft.fieldMeta||{}),ready=[],check=[];","const entries=Object.entries(draft.fieldMeta||{}).filter(([key])=>Boolean(PACKET_FIELD_LABELS[key])),ready=[],check=[];",'reviewable packet fields')
path.write_text(text)

path=Path('src/SeedTools.jsx')
text=path.read_text()
old='return <section className="packet-review-summary" aria-live="polite"><div><CheckCircle2/><span><small>READY</small><strong>{review.ready.length} confirmed detail{review.ready.length===1?\'\':\'s\'}</strong></span></div>{review.ready.length>0&&<ul>{review.ready.slice(0,5).map(item)}</ul>}'
new='return <section className="packet-review-summary" aria-live="polite">{review.ready.length>0&&<><div><CheckCircle2/><span><small>READY</small><strong>{review.ready.length} confirmed detail{review.ready.length===1?\'\':\'s\'}</strong></span></div><ul>{review.ready.slice(0,5).map(item)}</ul></>}'
text=replace_required(text,old,new,'empty ready summary')
path.write_text(text)

path=Path('src/WorkspaceScreens.jsx')
text=path.read_text()
old='{row&&<details className="garden-weather-why"><summary><Info/>Why this appeared <ChevronDown/></summary><div><p><strong>Timing:</strong> {row.timing}</p><p><strong>Confidence:</strong> {row.confidence} · {row.sourceType} · {row.dataFreshness}</p><p><strong>Source:</strong> {row.source}{row.lastUpdated?` · updated ${weatherTime(row.lastUpdated)}`:\'\'}</p><div className="garden-weather-feedback"><button onClick={()=>onDecision?.(row,\'not-useful\')}>Not useful</button></div></div></details>}{!calm&&row&&<div className="garden-weather-actions"><button className="primary-button" onClick={()=>navigate(row.destination||\'chores\')}>Open related work</button><button className="icon-text-button" onClick={()=>onDecision?.(row,\'dismissed\')}><X/>Dismiss</button></div>}'
new='{!calm&&row&&<button className="compact-impact-dismiss" onClick={()=>onDecision?.(row,\'dismissed\')} aria-label={`Dismiss ${group.title} weather impact`}><X/>Dismiss</button>}'
text=replace_required(text,old,new,'compact weather impact')
path.write_text(text)

path=Path('src/styles/phase-4-5-stabilization.css')
text=path.read_text()
text += "\n.compact-impact-dismiss{display:inline-flex;align-items:center;justify-content:flex-start;gap:5px;min-height:34px;justify-self:start;padding:4px 7px;border-radius:9px;background:transparent;color:#5f5a50;font-size:.73rem;font-weight:800}.compact-impact-dismiss svg{width:14px;height:14px}.phase-45-weather-brief .garden-weather-insight{gap:5px}\n"
path.write_text(text)

path=Path('test/seedPacketIntelligence.test.js')
text=path.read_text()
text += "\ntest('recovered draft defaults are not counted as confirmed packet details',()=>{const original=emptyPacketDraft({name:'Radish'}),recovered=emptyPacketDraft(original),review=extractionReview(recovered);assert.deepEqual(review.ready.map(row=>row.key),['name'])});\n"
path.write_text(text)
print('applied browser acceptance fixes')
