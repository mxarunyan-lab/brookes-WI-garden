export const SEED_PACKET_DRAFT_KEY='runyan-seed-packet-draft-v1';
export const SUPPORTED_PACKET_IMAGE_TYPES=new Set(['image/jpeg','image/png','image/webp']);

const currentYear=()=>new Date().getFullYear();
const asText=value=>String(value??'').trim();
const normalized=value=>asText(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const uniq=values=>[...new Set(values.filter(Boolean))];
const PREFILL_MANUAL_FIELDS=new Set(['name','variety','brand','notes','sourceShoppingItemId']);
const lineList=text=>asText(text).split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean);
const confidence=(score)=>score>=.86?'High':score>=.58?'Medium':'Low';
const IDENTITY_STOPWORDS=new Set(['vegetable','vegetables','herb','herbs','flower','flowers','fruit','fruits','heirloom','hybrid','organic','annual','biennial','perennial','full sun','part sun','shade','seeds','seed','non gmo','untreated','easy to grow']);
const plausibleIdentity=value=>{const text=normalized(value);return Boolean(text&&text.length>=2&&text.length<=60&&!IDENTITY_STOPWORDS.has(text)&&!/^\d+$/.test(text)&&!/(net wt|packed for|lot no|days to|planting depth|spacing|germination|www\.)/.test(text))};
const validBarcode=value=>{const digits=String(value||'').replace(/\D/g,'');if(![8,12,13,14].includes(digits.length))return false;let sum=0,parity=digits.length%2;for(let i=0;i<digits.length-1;i++)sum+=Number(digits[i])*(i%2===parity?3:1);return(10-sum%10)%10===Number(digits.at(-1))};
const field=(value,{score=.75,sourcePhoto='front',originalText='',inferred=false}={})=>({value,confidence:confidence(score),sourcePhoto,originalText:originalText||asText(value),inferred:Boolean(inferred),extractedAt:new Date().toISOString(),correctedAt:null,manuallyCorrected:false,source:inferred?'inferred':'packet'});
const found=(text,regex,index=1)=>asText(text.match(regex)?.[index]);
const dimension=(text,regex)=>{const match=text.match(regex);return match?`${match[1]} ${match[2]}`.replace(/\s+/g,' ').trim():''};
const lineContaining=(lines,regex)=>lines.find(line=>regex.test(line))||'';
const sentenceContaining=(text,regex)=>asText(text).split(/(?<=[.!?])\s+|\n+/).find(sentence=>regex.test(sentence))||'';

const BRAND_PATTERNS=[
 ['Burpee',/\bburpee\b/i],['Ferry-Morse',/\bferry[ -]?morse\b/i],['Botanical Interests',/\bbotanical interests\b/i],['Seed Savers Exchange',/\bseed savers exchange\b/i],['Baker Creek',/\bbaker creek\b|rareseeds/i],['Renee’s Garden',/\brenee'?s garden\b/i],['Johnny’s Selected Seeds',/\bjohnny'?s selected seeds\b/i],['High Mowing Organic Seeds',/\bhigh mowing\b/i],['Territorial Seed Company',/\bterritorial seed\b/i],['Lake Valley Seed',/\blake valley seed\b/i],['Seeds of Change',/\bseeds of change\b/i],['Sow Right Seeds',/\bsow right seeds\b/i],['MIgardener',/\bmigardener\b/i],['American Seed',/\bamerican seed\b/i],['Park Seed',/\bpark seed\b/i]
];
const CROPS=[
 ['Bell Pepper',/\bbell pepper\b|\bsweet pepper\b/i,'vegetable'],['Hot Pepper',/\bhot pepper\b|\bjalape[nñ]o\b|\bhabanero\b|\bserrano\b/i,'vegetable'],['Tomato',/\btomato\b/i,'vegetable'],['Cucumber',/\bcucumber\b/i,'vegetable'],['Zucchini',/\bzucchini\b/i,'vegetable'],['Summer Squash',/\bsummer squash\b/i,'vegetable'],['Winter Squash',/\bwinter squash\b|\bbutternut\b|\bacorn squash\b/i,'vegetable'],['Pumpkin',/\bpumpkin\b/i,'vegetable'],['Green Bean',/\bgreen beans?\b|\bsnap beans?\b/i,'vegetable'],['Pea',/\bpeas?\b/i,'vegetable'],['Lettuce',/\blettuce\b/i,'vegetable'],['Spinach',/\bspinach\b/i,'vegetable'],['Kale',/\bkale\b/i,'vegetable'],['Radish',/\bradish\b/i,'vegetable'],['Carrot',/\bcarrots?\b/i,'vegetable'],['Beet',/\bbeets?\b/i,'vegetable'],['Broccoli',/\bbroccoli\b/i,'vegetable'],['Cabbage',/\bcabbage\b/i,'vegetable'],['Cauliflower',/\bcauliflower\b/i,'vegetable'],['Basil',/\bbasil\b/i,'herb'],['Cilantro',/\bcilantro\b|\bcoriander\b/i,'herb'],['Dill',/\bdill\b/i,'herb'],['Parsley',/\bparsley\b/i,'herb'],['Chives',/\bchives?\b/i,'herb'],['Sunflower',/\bsunflower\b/i,'flower'],['Marigold',/\bmarigold\b/i,'flower'],['Nasturtium',/\bnasturtium\b/i,'flower'],['Zinnia',/\bzinnia\b/i,'flower'],['Cosmos',/\bcosmos\b/i,'flower'],['Sweet Alyssum',/\bsweet alyssum\b/i,'flower'],['Watermelon',/\bwatermelon\b/i,'fruit'],['Cantaloupe',/\bcantaloupe\b|\bmuskmelon\b/i,'fruit'],['Strawberry',/\bstrawberr(?:y|ies)\b/i,'fruit']
];

export function emptyPacketDraft(prefill={}){
 const draftId=prefill.draftId||`seed-draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
 const base={draftId,operationId:prefill.operationId||`seed-packet-from:${draftId}`,schemaVersion:1,name:'',variety:'',brand:'',productName:'',category:'',packetYear:'',quantity:'',originalQuantity:'',reservedQuantity:0,countType:'estimated',packetWeight:'',lotNumber:'',barcode:'',designations:[],notableClaims:'',colorDescription:'',daysToMaturity:'',maturityBasis:'',germinationEstimate:'',germinationTemperature:'',seedStartingGuidance:'',sowingMethod:'',directSowGuidance:'',transplantGuidance:'',seasonalWindow:'',frostTiming:'',depth:'',spacing:'',thinningSpacing:'',rowSpacing:'',sunlight:'',waterGuidance:'',soilGuidance:'',fertilizingGuidance:'',plantHeight:'',plantSpread:'',growthHabit:'',successionGuidance:'',harvestGuidance:'',harvestWindow:'',supportNeeds:'',specialCare:'',regionalGuidance:'',packetWarnings:'',treatmentInformation:'',seedSavingRestrictions:'',containerSuitability:'',notes:'',sourceShoppingItemId:'',fieldMeta:{},packetIntelligence:{front:null,back:null},draftStatus:'Draft'};
 const merged={...base,...prefill,fieldMeta:{...(base.fieldMeta||{}),...(prefill.fieldMeta||{})},packetIntelligence:{front:null,back:null,...(prefill.packetIntelligence||{})}};
 for(const [key,value] of Object.entries(prefill)){if(PREFILL_MANUAL_FIELDS.has(key)&&value!==''&&value!==null&&value!==undefined&&!merged.fieldMeta[key])merged.fieldMeta[key]={source:'manual',confidence:'High',manuallyCorrected:false,correctedAt:null}}
 return merged;
}

export function markManualField(draft,key,value){
 return{...draft,[key]:value,fieldMeta:{...(draft.fieldMeta||{}),[key]:{...(draft.fieldMeta?.[key]||{}),source:'manual',confidence:'High',manuallyCorrected:Boolean(draft.fieldMeta?.[key]?.source==='packet'||draft.fieldMeta?.[key]?.source==='inferred'),correctedAt:new Date().toISOString()}}};
}

function detectIdentity(text,side){
 const lines=lineList(text),fields={};
 const brand=BRAND_PATTERNS.find(([,regex])=>regex.test(text));if(brand)fields.brand=field(brand[0],{score:.96,sourcePhoto:side,originalText:lineContaining(lines,brand[1])});
 const exactCrop=CROPS.find(([,regex])=>regex.test(text)),genericPepper=!exactCrop&&lines.find(line=>/^peppers?$/i.test(line)),crop=exactCrop||(genericPepper&&['Pepper',/^peppers?$/i,'vegetable']);if(crop){fields.name=field(crop[0],{score:exactCrop?.92:.62,sourcePhoto:side,originalText:lineContaining(lines,crop[1]),inferred:!exactCrop});fields.category=field(crop[2],{score:.72,sourcePhoto:side,originalText:crop[0],inferred:true})}
 const year=found(text,/(?:packed\s+for|packet\s+year|packed|sell\s+by|use\s+by|season)\D{0,12}(20\d{2})/i);if(year&&Number(year)>=2000&&Number(year)<=currentYear()+3)fields.packetYear=field(Number(year),{score:.95,sourcePhoto:side,originalText:lineContaining(lines,new RegExp(year))});
 const countMatch=text.match(/(?:contains?|approximately|approx\.?|about)?\s*(\d{1,6})\s*(?:seeds?|ct\.?|count)\b/i);if(countMatch){fields.quantity=field(Number(countMatch[1]),{score:/contains|count/i.test(countMatch[0])?.9:.7,sourcePhoto:side,originalText:countMatch[0]});fields.originalQuantity=field(Number(countMatch[1]),{score:.8,sourcePhoto:side,originalText:countMatch[0]});fields.countType=field(/approximately|approx|about/i.test(countMatch[0])?'estimated':'exact',{score:.85,sourcePhoto:side,originalText:countMatch[0],inferred:true})}
 const weight=found(text,/(?:net\s*wt\.?|packet\s*weight|weight)\s*[:.]?\s*([\d.]+\s*(?:oz|ounces?|g|grams?|mg))\b/i);if(weight)fields.packetWeight=field(weight,{score:.92,sourcePhoto:side,originalText:lineContaining(lines,/net\s*wt|weight/i)});
 const lot=found(text,/\blot\s*(?:no\.?|number|#|:)??\s*([a-z0-9-]{3,})\b/i);if(lot)fields.lotNumber=field(lot,{score:.9,sourcePhoto:side,originalText:lineContaining(lines,/\blot\b/i)});
 const barcodeCandidates=[...text.matchAll(/\b(\d{8,14})\b/g)].map(match=>match[1]),barcode=barcodeCandidates.find(validBarcode);if(barcode)fields.barcode=field(barcode,{score:.9,sourcePhoto:side,originalText:barcode});
 const designations=uniq([/\borganic\b/i.test(text)&&'Organic',/\bheirloom\b/i.test(text)&&'Heirloom',/\bhybrid\b|\bf1\b/i.test(text)&&'Hybrid',/\bannual\b/i.test(text)&&'Annual',/\bbiennial\b/i.test(text)&&'Biennial',/\bperennial\b/i.test(text)&&'Perennial',/\bnon[- ]?gmo\b/i.test(text)&&'Non-GMO',/\buntreated\b/i.test(text)&&'Untreated']);if(designations.length)fields.designations=field(designations,{score:.9,sourcePhoto:side,originalText:designations.join(', ')});
 const claims=uniq([/pollinator/i.test(text)&&'Pollinator friendly',/container|patio/i.test(text)&&'Container suitable',/disease resistant/i.test(text)&&'Disease resistant',/open pollinated/i.test(text)&&'Open pollinated',/easy to grow/i.test(text)&&'Easy to grow']);if(claims.length)fields.notableClaims=field(claims.join(' · '),{score:.78,sourcePhoto:side,originalText:claims.join(', ')});
 if(/\bmix\b/i.test(text)){const mixLine=lineContaining(lines,/\bmix\b/i);fields.colorDescription=field(mixLine,{score:.68,sourcePhoto:side,originalText:mixLine})}
 if(crop){const cropLineIndex=lines.findIndex(line=>crop[1].test(line)),nearby=lines.slice(Math.max(0,cropLineIndex-3),cropLineIndex+4),sameLine=lines[cropLineIndex]?.replace(crop[1],'').replace(/\bseeds?\b/ig,'').trim(),candidate=[sameLine,...nearby].find(line=>plausibleIdentity(line)&&!brand?.[1]?.test(line)&&!crop[1].test(line));if(candidate)fields.variety=field(candidate.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi,''),{score:.72,sourcePhoto:side,originalText:candidate})}
 if(crop){const product=[fields.variety?.value,crop[0],'Seeds'].filter(Boolean).join(' ');fields.productName=field(product,{score:fields.variety?.value?.7:.58,sourcePhoto:side,originalText:[fields.variety?.originalText,lineContaining(lines,crop[1])].filter(Boolean).join(' · '),inferred:true})}
 return fields;
}

function detectGrowingDetails(text,side){
 const lines=lineList(text),fields={};
 const direct=sentenceContaining(text,/direct\s*sow|sow\s+outdoors?|outdoor sow/i),indoors=sentenceContaining(text,/start\s+indoors?|sow\s+indoors?/i),transplant=sentenceContaining(text,/transplant/i);
 const methods=uniq([direct&&'Direct sow',indoors&&'Start indoors',transplant&&'Transplant']);if(methods.length)fields.sowingMethod=field(methods.join(' + '),{score:.88,sourcePhoto:side,originalText:methods.join(', ')});
 if(direct)fields.directSowGuidance=field(direct,{score:.82,sourcePhoto:side,originalText:direct});if(indoors)fields.seedStartingGuidance=field(indoors,{score:.82,sourcePhoto:side,originalText:indoors});if(transplant)fields.transplantGuidance=field(transplant,{score:.78,sourcePhoto:side,originalText:transplant});
 const frost=sentenceContaining(text,/weeks?\s+(?:before|after)\s+(?:the\s+)?(?:last|first)\s+frost/i);if(frost)fields.frostTiming=field(frost,{score:.86,sourcePhoto:side,originalText:frost});
 const seasonal=sentenceContaining(text,/spring|summer|fall|autumn|after danger of frost|as soon as soil/i);if(seasonal)fields.seasonalWindow=field(seasonal,{score:.62,sourcePhoto:side,originalText:seasonal});
 const depth=dimension(text,/(?:plant|sow)(?:\s+seed)?\s*(?:at|about|depth|:)??\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(inch(?:es)?|in\.?|cm)\b/i);if(depth)fields.depth=field(depth,{score:.84,sourcePhoto:side,originalText:lineContaining(lines,/plant|sow/i)});
 const thin=dimension(text,/(?:thin(?:ning)?\s+(?:to|spacing)?|thin plants to)\s*[:.]?\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(inch(?:es)?|in\.?|cm)\b/i);if(thin)fields.thinningSpacing=field(thin,{score:.82,sourcePhoto:side,originalText:lineContaining(lines,/thin/i)});
 const row=dimension(text,/(?:row\s+spacing|rows?\s+apart)\s*[:.]?\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(inch(?:es)?|in\.?|cm|feet|foot|ft\.?)\b/i);if(row)fields.rowSpacing=field(row,{score:.82,sourcePhoto:side,originalText:lineContaining(lines,/row/i)});
 const spacing=dimension(text,/(?:plant\s+spacing|spacing|space\s+plants?)\s*[:.]?\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(inch(?:es)?|in\.?|cm|feet|foot|ft\.?)\b/i);if(spacing)fields.spacing=field(spacing,{score:.8,sourcePhoto:side,originalText:lineContaining(lines,/spacing|space plants/i)});
 const germDays=text.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*days?\s*(?:to\s*)?(?:germinat|emerg)/i)||text.match(/(?:germination|emergence)\s*[:.]?\s*(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*days?/i);if(germDays)fields.germinationEstimate=field(`${germDays[1]}–${germDays[2]} days`,{score:.9,sourcePhoto:side,originalText:germDays[0]});
 const germTemp=text.match(/(?:germination\s+temperature|soil\s+temperature|germinate\s+at)?\s*(\d{2,3})\s*(?:-|–|to)\s*(\d{2,3})\s*°?\s*f\b/i);if(germTemp)fields.germinationTemperature=field(`${germTemp[1]}–${germTemp[2]}°F`,{score:.82,sourcePhoto:side,originalText:germTemp[0]});
 const maturity=text.match(/(\d{2,3})\s*days?\s*(?:to\s*)?(?:maturity|harvest)/i)||text.match(/(?:days?\s+to\s+maturity|maturity)\s*[:.]?\s*(\d{2,3})/i);if(maturity){fields.daysToMaturity=field(Number(maturity[1]),{score:.9,sourcePhoto:side,originalText:maturity[0]});const context=sentenceContaining(text,new RegExp(maturity[1]));if(/from\s+transplant|after\s+transplant/i.test(context))fields.maturityBasis=field('transplant',{score:.92,sourcePhoto:side,originalText:context});else if(/from\s+sow|from\s+seed|after\s+sowing/i.test(context))fields.maturityBasis=field('sowing',{score:.92,sourcePhoto:side,originalText:context})}
 const sunlight=/full\s+sun/i.test(text)?'Full sun':/part(?:ial)?\s+(?:sun|shade)/i.test(text)?'Part sun / part shade':/shade/i.test(text)?'Shade':' ';if(sunlight.trim())fields.sunlight=field(sunlight,{score:.9,sourcePhoto:side,originalText:lineContaining(lines,/sun|shade/i)});
 const water=sentenceContaining(text,/water|moist|moisture|keep soil/i);if(water)fields.waterGuidance=field(water,{score:.65,sourcePhoto:side,originalText:water});
 const soil=sentenceContaining(text,/soil|well[- ]drained|fertile|ph\b/i);if(soil)fields.soilGuidance=field(soil,{score:.62,sourcePhoto:side,originalText:soil});
 const fertilizer=sentenceContaining(text,/fertiliz|feed|compost/i);if(fertilizer)fields.fertilizingGuidance=field(fertilizer,{score:.62,sourcePhoto:side,originalText:fertilizer});
 const height=found(text,/(?:height|grows?\s+to)\s*[:.]?\s*([\d-]+\s*(?:inches?|in\.?|feet|ft\.?))/i);if(height)fields.plantHeight=field(height,{score:.82,sourcePhoto:side,originalText:lineContaining(lines,/height|grows to/i)});
 const spread=found(text,/(?:spread|width)\s*[:.]?\s*([\d-]+\s*(?:inches?|in\.?|feet|ft\.?))/i);if(spread)fields.plantSpread=field(spread,{score:.82,sourcePhoto:side,originalText:lineContaining(lines,/spread|width/i)});
 const habit=lineContaining(lines,/bush|vining|vine|compact|determinate|indeterminate|climbing|trailing/i);if(habit)fields.growthHabit=field(habit,{score:.65,sourcePhoto:side,originalText:habit});
 const succession=sentenceContaining(text,/succession|every\s+\d+\s+weeks?|repeat sow/i);if(succession)fields.successionGuidance=field(succession,{score:.78,sourcePhoto:side,originalText:succession});
 const harvest=sentenceContaining(text,/harvest|pick when|ready when/i);if(harvest)fields.harvestGuidance=field(harvest,{score:.74,sourcePhoto:side,originalText:harvest});
 const support=sentenceContaining(text,/trellis|stake|support|cage/i);if(support)fields.supportNeeds=field(support,{score:.78,sourcePhoto:side,originalText:support});
 const container=sentenceContaining(text,/container|pot|patio/i);if(container)fields.containerSuitability=field(container,{score:.72,sourcePhoto:side,originalText:container});
 const regional=sentenceContaining(text,/zone\s*\d|regional|map|north|south|climate/i);if(regional)fields.regionalGuidance=field(regional,{score:.55,sourcePhoto:side,originalText:regional});
 const warning=sentenceContaining(text,/warning|caution|do not eat|poison|toxic/i);if(warning)fields.packetWarnings=field(warning,{score:.82,sourcePhoto:side,originalText:warning});
 const treatment=sentenceContaining(text,/treated|fungicide|inoculated|coated/i);if(treatment)fields.treatmentInformation=field(treatment,{score:.76,sourcePhoto:side,originalText:treatment});
 const saving=sentenceContaining(text,/do not save seed|seed saving|hybrid seed|patent|propagation prohibited/i);if(saving)fields.seedSavingRestrictions=field(saving,{score:.74,sourcePhoto:side,originalText:saving});
 const care=sentenceContaining(text,/special care|protect from|mulch|pinch|deadhead/i);if(care)fields.specialCare=field(care,{score:.6,sourcePhoto:side,originalText:care});
 return fields;
}

export function parsePacketText(text,{side='front'}={}){
 const rawText=asText(text),identity=detectIdentity(rawText,side),growing=detectGrowingDetails(rawText,side),fields=side==='front'?{...growing,...identity}:{...identity,...growing};
 return{side,rawText,fields,fieldCount:Object.keys(fields).length,extractedAt:new Date().toISOString(),status:Object.keys(fields).length?'read':'unreadable'};
}

export function applyPacketExtraction(draft,extraction){
 const next={...draft,fieldMeta:{...(draft.fieldMeta||{})},packetIntelligence:{front:null,back:null,...(draft.packetIntelligence||{}),[extraction.side]:extraction}};
 for(const [key,meta] of Object.entries(extraction.fields||{})){
  if(['name','variety','productName'].includes(key)&&!plausibleIdentity(meta.value))continue;
  const existingMeta=next.fieldMeta[key],existing=next[key];
  if(existingMeta?.source==='manual'||existingMeta?.manuallyCorrected)continue;
  if(existing!==''&&existing!==null&&existing!==undefined&&!(Array.isArray(existing)&&!existing.length)&&!existingMeta)continue;
  next[key]=meta.value;next.fieldMeta[key]=meta;
 }
 next.draftStatus=Object.values(extraction.fields||{}).some(meta=>meta.confidence==='Low')?'Some details need review':'Ready to review';
 return next;
}

export function extractionReview(draft){
 const entries=Object.entries(draft.fieldMeta||{}).filter(([key])=>Boolean(PACKET_FIELD_LABELS[key])),ready=[],check=[];
 for(const [key,meta] of entries){const row={key,value:draft[key],...meta};if(meta.confidence==='High'||meta.source==='manual')ready.push(row);else check.push(row)}
 const essential=['name','variety','brand','packetYear','daysToMaturity','spacing'];const missing=essential.filter(key=>draft[key]===''||draft[key]===null||draft[key]===undefined).map(key=>({key}));
 return{ready,check,missing};
}

export function findLikelyDuplicatePacket(candidate,packets=[]){
 const rows=(packets||[]).filter(packet=>!packet.deletedAt),c={name:normalized(candidate.name),variety:normalized(candidate.variety),brand:normalized(candidate.brand),year:asText(candidate.packetYear),lot:normalized(candidate.lotNumber),barcode:normalized(candidate.barcode)};
 let best=null;
 for(const packet of rows){let score=0,reasons=[];const p={name:normalized(packet.name),variety:normalized(packet.variety),brand:normalized(packet.brand),year:asText(packet.packetYear),lot:normalized(packet.lotNumber),barcode:normalized(packet.barcode)};
  if(c.barcode&&p.barcode&&c.barcode===p.barcode){score+=6;reasons.push('same barcode')}
  if(c.lot&&p.lot&&c.lot===p.lot){score+=5;reasons.push('same lot number')}
  if(c.name&&p.name&&c.name===p.name){score+=2;reasons.push('same crop')}
  if(c.variety&&p.variety&&c.variety===p.variety){score+=3;reasons.push('same variety')}
  if(c.brand&&p.brand&&c.brand===p.brand){score+=2;reasons.push('same brand')}
  if(c.year&&p.year&&c.year===p.year){score+=1;reasons.push('same packet year')}
  if(score>=6&&(!best||score>best.score))best={packet,score,reasons};
 }
 return best;
}

export function packetPayload(draft,{frontPhoto='',backPhoto='',imageMeta={}}={}){
 const numberOrNull=value=>value===''||value===null||value===undefined?null:Number.isFinite(Number(value))?Number(value):null;
 return{...draft,name:asText(draft.name),variety:asText(draft.variety),brand:asText(draft.brand),packetYear:numberOrNull(draft.packetYear),quantity:Math.max(0,numberOrNull(draft.quantity)||0),originalQuantity:numberOrNull(draft.originalQuantity),reservedQuantity:Math.max(0,numberOrNull(draft.reservedQuantity)||0),daysToMaturity:numberOrNull(draft.daysToMaturity),cropId:'',photo:frontPhoto||backPhoto||'',frontPhoto,backPhoto,imageMeta,packetIntelligence:draft.packetIntelligence||{front:null,back:null},fieldMeta:draft.fieldMeta||{},draftStatus:'Saved',savedAt:new Date().toISOString()};
}

export function savePacketDraft(snapshot){
 try{sessionStorage.setItem(SEED_PACKET_DRAFT_KEY,JSON.stringify({...snapshot,savedAt:new Date().toISOString()}));return{ok:true}}catch(error){console.error('[Runyan Garden] seed packet draft save failed',error);return{ok:false,error}}
}
export function loadPacketDraft(){try{const raw=sessionStorage.getItem(SEED_PACKET_DRAFT_KEY);return raw?JSON.parse(raw):null}catch(error){console.error('[Runyan Garden] seed packet draft read failed',error);return null}}
export function clearPacketDraft(){try{sessionStorage.removeItem(SEED_PACKET_DRAFT_KEY)}catch{}}

export function validatePacketImage(file){
 if(!file)return{ok:false,message:'Choose a packet photo first.'};
 if(!SUPPORTED_PACKET_IMAGE_TYPES.has(file.type))return{ok:false,message:'This photo format is not supported yet. Use JPEG, PNG, or WebP, or enter the packet manually.'};
 if(file.size>25*1024*1024)return{ok:false,message:'This photo is too large to process safely. Use a smaller photo or retake it with the camera.'};
 return{ok:true};
}

async function imageFromDataUrl(dataUrl){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('The selected image could not be opened.'));image.src=dataUrl})}
export async function compressPacketImage(file,{maxDimension=1600,quality=.78}={}){
 const validation=validatePacketImage(file);if(!validation.ok)throw Object.assign(new Error(validation.message),{kind:'unsupported'});
 const input=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('The selected image could not be read.'));reader.readAsDataURL(file)}),image=await imageFromDataUrl(input),scale=Math.min(1,maxDimension/Math.max(image.naturalWidth,image.naturalHeight)),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);const dataUrl=canvas.toDataURL('image/jpeg',quality),qualityWarnings=[];
 if(file.size>6*1024*1024)qualityWarnings.push('Large photo compressed before saving.');if(Math.min(width,height)<700)qualityWarnings.push('Text may be too small for a confident read.');
 return{dataUrl,width,height,originalBytes:file.size,compressedBytes:Math.round(dataUrl.length*.75),qualityWarnings,mimeType:'image/jpeg'};
}

export async function rotatePacketImage(dataUrl,degrees=90){
 const image=await imageFromDataUrl(dataUrl),quarter=Math.abs(degrees)%180===90,canvas=document.createElement('canvas');canvas.width=quarter?image.naturalHeight:image.naturalWidth;canvas.height=quarter?image.naturalWidth:image.naturalHeight;const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.translate(canvas.width/2,canvas.height/2);context.rotate(degrees*Math.PI/180);context.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);return canvas.toDataURL('image/jpeg',.8);
}

export async function readPacketPhoto(dataUrl,{side='front',timeoutMs=45000,onProgress}={}){
 const task=async()=>{onProgress?.({status:'loading',progress:0});const module=await import('tesseract.js'),worker=await module.createWorker('eng',1,{logger:message=>{if(message?.status)onProgress?.({status:message.status,progress:Number(message.progress)||0})}});try{const result=await worker.recognize(dataUrl),text=result?.data?.text||'',parsed=parsePacketText(text,{side});if(!parsed.fieldCount)throw Object.assign(new Error('The packet text could not be read clearly.'),{kind:'unreadable',rawText:text});return parsed}finally{await worker.terminate()}};
 let timeout;try{return await Promise.race([task(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Object.assign(new Error('Packet reading timed out.'),{kind:'timeout'})),timeoutMs)})])}finally{clearTimeout(timeout)}
}

export const PACKET_FIELD_LABELS={name:'Crop',variety:'Variety',brand:'Brand',productName:'Product name',category:'Category',packetYear:'Packet year',quantity:'Seed count',packetWeight:'Packet weight',lotNumber:'Lot number',barcode:'Barcode',designations:'Designations',notableClaims:'Packet claims',daysToMaturity:'Days to maturity',maturityBasis:'Maturity basis',germinationEstimate:'Germination',germinationTemperature:'Germination temperature',sowingMethod:'Sowing method',seedStartingGuidance:'Indoor-start guidance',directSowGuidance:'Direct-sow guidance',transplantGuidance:'Transplant guidance',seasonalWindow:'Seasonal window',frostTiming:'Frost timing',depth:'Planting depth',spacing:'Plant spacing',thinningSpacing:'Thinning spacing',rowSpacing:'Row spacing',sunlight:'Sunlight',waterGuidance:'Moisture guidance',soilGuidance:'Soil guidance',fertilizingGuidance:'Fertilizing guidance',plantHeight:'Plant height',plantSpread:'Plant spread',growthHabit:'Growth habit',successionGuidance:'Succession guidance',harvestGuidance:'Harvest guidance',supportNeeds:'Support needs',specialCare:'Special care',regionalGuidance:'Regional guidance',packetWarnings:'Warnings',treatmentInformation:'Treatment',seedSavingRestrictions:'Seed-saving restrictions',containerSuitability:'Container suitability'};
