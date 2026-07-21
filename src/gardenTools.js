const CU_FT_TO_GALLONS=7.48052;
const GALLON_TO_CU_FT=1/CU_FT_TO_GALLONS;

export const COMMON_SOIL_BAGS=[0.75,1,1.5,2];

const numbers=value=>(String(value||'').match(/\d+(?:\.\d+)?/g)||[]).map(Number).filter(Number.isFinite);
const normalized=value=>String(value||'').toLowerCase().replace(/[–—]/g,'-');

export function parseSpacingInches(value,fallback=12){
 const found=numbers(value);
 if(!found.length)return fallback;
 let amount=Math.max(...found);
 const text=normalized(value);
 if(/\bft\b|feet|foot/.test(text))amount*=12;
 return Math.max(1,amount);
}

export function parseSpaceDimensions(space={}){
 const result={lengthFeet:null,widthFeet:null,depthInches:null,diameterInches:null,gallons:null,source:''};
 const explicitLength=Number(space.lengthFeet??space.length),explicitWidth=Number(space.widthFeet??space.width),explicitDepth=Number(space.depthInches??space.depth),explicitDiameter=Number(space.diameterInches??space.diameter);
 if(Number.isFinite(explicitLength)&&explicitLength>0)result.lengthFeet=explicitLength;
 if(Number.isFinite(explicitWidth)&&explicitWidth>0)result.widthFeet=explicitWidth;
 if(Number.isFinite(explicitDepth)&&explicitDepth>0)result.depthInches=explicitDepth;
 if(Number.isFinite(explicitDiameter)&&explicitDiameter>0)result.diameterInches=explicitDiameter;
 const size=normalized(space.size||space.bagSize||'');
 const found=numbers(size);
 if(found.length>=2&&/[x×]/.test(size)){
  const factor=/\b(in|inch|inches)\b/.test(size)?1/12:1;
  if(!result.lengthFeet)result.lengthFeet=found[0]*factor;
  if(!result.widthFeet)result.widthFeet=found[1]*factor;
  if(found[2]&&!result.depthInches)result.depthInches=/\bft\b|feet|foot/.test(size)?found[2]*12:found[2];
  result.source='Saved size text';
 }else if(found.length&&/gallon|\bgal\b/.test(size)){
  result.gallons=found[0];
  result.source='Saved gallon size';
 }else if(found.length&&/diameter|round|\bpot\b/.test(size)){
  result.diameterInches=/\bft\b|feet|foot/.test(size)?found[0]*12:found[0];
  if(found[1])result.depthInches=/\bft\b|feet|foot/.test(size)?found[1]*12:found[1];
  result.source='Saved container size';
 }
 return result;
}

export function calculateSpacing({layout='square',lengthFeet=0,widthFeet=0,diameterInches=0,spacingInches=12,rowSpacingInches=0}){
 const spacing=Math.max(1,Number(spacingInches)||12),rowSpacing=Math.max(spacing,Number(rowSpacingInches)||Math.round(spacing*1.5));
 let count=0,detail='';
 if(layout==='container'){
  const diameter=Math.max(0,Number(diameterInches)||0),usable=Math.max(0,diameter-spacing),area=Math.PI*Math.pow(usable/2,2),plantArea=Math.pow(spacing,2);
  count=diameter>=spacing?Math.max(1,Math.floor(area/plantArea*0.82)):0;
  detail=`Round container ${diameter.toFixed(1)} in. across with about ${(spacing/2).toFixed(1)} in. edge clearance.`;
 }else{
  const length=Math.max(0,Number(lengthFeet)||0)*12,width=Math.max(0,Number(widthFeet)||0)*12;
  if(layout==='rows'){
   const plantsPerRow=Math.floor(length/spacing),rows=Math.floor(width/rowSpacing);count=Math.max(0,plantsPerRow*rows);
   detail=`${rows} row${rows===1?'':'s'} at ${rowSpacing} in. apart with up to ${plantsPerRow} plant${plantsPerRow===1?'':'s'} per row.`;
  }else{
   const across=Math.floor(width/spacing),long=Math.floor(length/spacing);count=Math.max(0,across*long);
   detail=`Approximate ${across} × ${long} ${layout==='grid'?'grid':'square-spacing'} layout.`;
  }
 }
 return{count,spacingInches:spacing,rowSpacingInches:layout==='rows'?rowSpacing:spacing,edgeClearanceInches:spacing/2,detail,estimated:true};
}

const toFeet=(value,unit)=>Math.max(0,Number(value)||0)*(unit==='in'?1/12:unit==='ft'?1:unit==='gal'?0:1);

export function calculateSoilVolume({shape='raised',length=0,width=0,depth=0,diameter=0,height=0,gallons=0,lengthUnit='ft',widthUnit='ft',depthUnit='in',diameterUnit='in',heightUnit='in',bufferPercent=10}){
 let cubicFeet=0,assumption='';
 if(shape==='grow-bag'){
  cubicFeet=Math.max(0,Number(gallons)||0)*GALLON_TO_CU_FT;
  assumption='Grow-bag volume uses the labeled gallon capacity.';
 }else if(shape==='round'){
  const diameterFeet=toFeet(diameter,diameterUnit),heightFeet=toFeet(height,heightUnit);
  cubicFeet=Math.PI*Math.pow(diameterFeet/2,2)*heightFeet;
  assumption='Round-pot volume is treated as a straight cylinder; tapered pots usually hold slightly less.';
 }else{
  cubicFeet=toFeet(length,lengthUnit)*toFeet(width,widthUnit)*toFeet(depth,depthUnit);
  assumption=shape==='raised'?'Raised-bed volume uses inside length × inside width × fill depth.':'Rectangular volume uses inside length × inside width × fill depth.';
 }
 const buffer=Math.max(0,Number(bufferPercent)||0),bufferedCubicFeet=cubicFeet*(1+buffer/100),estimatedGallons=cubicFeet*CU_FT_TO_GALLONS;
 const bags=Object.fromEntries(COMMON_SOIL_BAGS.map(size=>[String(size),cubicFeet>0?Math.ceil(bufferedCubicFeet/size):0]));
 return{cubicFeet,bufferedCubicFeet,estimatedGallons,bags,bufferPercent:buffer,assumption,estimated:true};
}

export function calculateSeedQuantity({desiredPlants=1,germinationRate=85,survivalRate=90,extras=0,available=null}){
 const desired=Math.max(0,Math.ceil(Number(desiredPlants)||0)),extra=Math.max(0,Math.ceil(Number(extras)||0)),germination=Math.min(100,Math.max(1,Number(germinationRate)||1))/100,survival=Math.min(100,Math.max(1,Number(survivalRate)||1))/100,target=desired+extra,seeds=Math.ceil(target/(germination*survival)),availableNumber=available===null||available===undefined?null:Math.max(0,Number(available)||0);
 return{desiredPlants:desired,extras:extra,targetPlants:target,seedsToStart:seeds,germinationRate:germination*100,survivalRate:survival*100,available:availableNumber,shortfall:availableNumber===null?0:Math.max(0,seeds-availableNumber),estimated:true};
}

export function parseFrostDate(value,kind='last'){
 const now=new Date(),fallback=kind==='last'?'May 15':'October 10',text=String(value||fallback).trim(),year=now.getFullYear(),candidate=new Date(`${text}, ${year} 12:00:00`);
 if(Number.isNaN(candidate.getTime()))return new Date(`${fallback}, ${year} 12:00:00`);
 if(candidate<now)candidate.setFullYear(candidate.getFullYear()+1);
 return candidate;
}

export function addWeeks(date,weeks){const next=new Date(date);next.setDate(next.getDate()+Number(weeks||0)*7);return next}
export function formatToolDate(date){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(date)}

const CROP_TIMING={
 'bell-pepper':{indoorBefore:10,transplantAfter:2,directAfter:3,fallBefore:0},'hot-pepper':{indoorBefore:10,transplantAfter:2,directAfter:3,fallBefore:0},tomato:{indoorBefore:8,transplantAfter:2,directAfter:3,fallBefore:0},onion:{indoorBefore:10,transplantAfter:0,directAfter:-4,fallBefore:0},cabbage:{indoorBefore:8,transplantAfter:-4,directAfter:-6,fallBefore:10},broccoli:{indoorBefore:8,transplantAfter:-4,directAfter:-6,fallBefore:10},cauliflower:{indoorBefore:8,transplantAfter:-4,directAfter:-6,fallBefore:10},lettuce:{indoorBefore:6,transplantAfter:-4,directAfter:-6,fallBefore:8},spinach:{indoorBefore:0,transplantAfter:-4,directAfter:-6,fallBefore:8},kale:{indoorBefore:6,transplantAfter:-4,directAfter:-6,fallBefore:10},radish:{indoorBefore:0,transplantAfter:-4,directAfter:-6,fallBefore:6},carrot:{indoorBefore:0,transplantAfter:-3,directAfter:-4,fallBefore:10},peas:{indoorBefore:0,transplantAfter:-4,directAfter:-6,fallBefore:10},potato:{indoorBefore:0,transplantAfter:-4,directAfter:-4,fallBefore:0},cucumber:{indoorBefore:3,transplantAfter:2,directAfter:2,fallBefore:0},zucchini:{indoorBefore:3,transplantAfter:2,directAfter:2,fallBefore:0},'green-bean':{indoorBefore:0,transplantAfter:2,directAfter:2,fallBefore:0},corn:{indoorBefore:0,transplantAfter:2,directAfter:2,fallBefore:0},basil:{indoorBefore:6,transplantAfter:2,directAfter:2,fallBefore:0},marigold:{indoorBefore:6,transplantAfter:1,directAfter:1,fallBefore:0},garlic:{indoorBefore:0,transplantAfter:0,directAfter:0,fallBefore:3}
};

export function timingDefaults(cropId,packet={}){
 const defaults={indoorBefore:6,transplantAfter:1,directAfter:0,fallBefore:8,...(CROP_TIMING[cropId]||{})},text=normalized(`${packet.seedStartingGuidance||''} ${packet.notes||''}`),before=text.match(/(\d+)(?:\s*[-]\s*(\d+))?\s*weeks?\s*before/),after=text.match(/(\d+)(?:\s*[-]\s*(\d+))?\s*weeks?\s*after/);
 if(before)defaults.indoorBefore=Number(before[2]||before[1]);
 if(after)defaults.transplantAfter=Number(after[2]||after[1]);
 return defaults;
}

export function calculatePlantingDates({profile={},cropId='',packet={},indoorBefore,transplantAfter,directAfter,fallBefore}){
 const defaults=timingDefaults(cropId,packet),last=parseFrostDate(profile.lastFrost,'last'),first=parseFrostDate(profile.firstFrost,'first'),indoor=Number(indoorBefore??defaults.indoorBefore),transplant=Number(transplantAfter??defaults.transplantAfter),direct=Number(directAfter??defaults.directAfter),fall=Number(fallBefore??defaults.fallBefore);
 return{lastFrost:last,firstFrost:first,indoorStart:addWeeks(last,-indoor),transplantDate:addWeeks(last,transplant),directSowDate:addWeeks(last,direct),fallPlantingDate:fall>0?addWeeks(first,-fall):null,defaults:{indoorBefore:indoor,transplantAfter:transplant,directAfter:direct,fallBefore:fall},source:packet.id?'Exact packet timing when recorded; otherwise crop-level guidance.':'General crop-level guidance.',estimated:true};
}

export function calculateMeasurement({mode='inches-feet',a=0,b=0,c=0}){
 const x=Number(a)||0,y=Number(b)||0,z=Number(c)||0;
 if(mode==='inches-feet')return{label:'Feet',value:x/12,detail:`${x} inches ÷ 12`};
 if(mode==='bed-area')return{label:'Square feet',value:x*y,detail:`${x} ft × ${y} ft`};
 if(mode==='square-feet')return{label:'Square feet',value:(x*y)/144,detail:`${x} in × ${y} in`};
 if(mode==='cubic-feet')return{label:'Cubic feet',value:(x*y*z)/1728,detail:`${x} in × ${y} in × ${z} in`};
 if(mode==='gallons-cubic')return{label:'Cubic feet',value:x*GALLON_TO_CU_FT,detail:`${x} gallons ÷ ${CU_FT_TO_GALLONS.toFixed(2)}`};
 if(mode==='row-length')return{label:'Plants along row',value:y>0?Math.floor((x*12)/y):0,detail:`${x} ft row at ${y} in spacing`};
 if(mode==='round-volume'){const diameterFeet=x/12,heightFeet=y/12;return{label:'Gallons',value:Math.PI*Math.pow(diameterFeet/2,2)*heightFeet*CU_FT_TO_GALLONS,detail:`${x} in diameter × ${y} in high`}}
 return{label:'Result',value:0,detail:''};
}
