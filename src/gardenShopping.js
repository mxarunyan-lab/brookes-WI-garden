import{cropCatalog,newId}from'./data.js';
import{shoppingDuplicateKey}from'./connectedIntelligence.js';

export const SHOPPING_CATEGORIES=['Seeds','Starter Plant','Bulb or Tuber','Soil and Amendments','Container','Support and Trellis','Indoor Growing','Tool or Supply','Other'];
const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const now=()=>new Date().toISOString();

export function shoppingIdentity(item={}){
 return item.duplicateKey||shoppingDuplicateKey({...item,date:''});
}

export function legacyShoppingItems(garden={}){
 const native=garden.shoppingItems||[],shadowed=new Set(native.map(item=>item.sourceDecisionId).filter(Boolean));
 return(garden.plantingDecisions||[]).filter(item=>!item.deletedAt&&item.decision==='shopping-list'&&!shadowed.has(item.id)).map(item=>{
  const cropId=String(item.subjectKey||'').replace(/^catalog-/,'').replace(/^packet-/,'').replace(/^seed-/,'');
  const crop=cropCatalog.find(entry=>entry.id===cropId),name=crop?`${crop.name} Seeds`:String(item.note||'Garden item').split('.')[0];
  return{id:`legacy-shopping-${item.id}`,name,category:'Seeds',cropId:crop?.id||cropId,variety:'',brand:'',quantity:1,note:item.note||'',reason:'Added from a Planting Desk recommendation.',sourceRecommendation:item.subjectKey||'',sourceDecisionId:item.id,intendedSpaceId:'',desiredWindow:item.dueDate||'',purchased:false,addedAt:item.createdAt||item.at||now(),updatedAt:item.updatedAt||item.at||now(),legacy:true,deletedAt:null};
 });
}

export function gardenShoppingItems(garden={}){
 const rows=[...(garden.shoppingItems||[]),...legacyShoppingItems(garden)].filter(item=>!item.deletedAt),seen=new Set();
 return rows.filter(item=>{const key=item.id||shoppingIdentity(item);if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>Number(Boolean(a.purchased))-Number(Boolean(b.purchased))||String(b.addedAt||'').localeCompare(String(a.addedAt||'')));
}

export function activeShoppingCount(garden={}){return gardenShoppingItems(garden).filter(item=>!item.purchased).length}

export function findShoppingDuplicate(garden={},candidate={}){
 const key=shoppingIdentity(candidate);return gardenShoppingItems(garden).find(item=>!item.purchased&&shoppingIdentity(item)===key)||null;
}

export function createShoppingItem(data={},actor='System'){
 const at=now();const category=data.category==='Plants'?'Starter Plant':SHOPPING_CATEGORIES.includes(data.category)?data.category:'Other',base={name:String(data.name||'Garden item').trim(),category,cropId:data.cropId||'',variety:data.variety||'',brand:data.brand||'',quantity:Math.max(1,Number(data.quantity)||1),note:data.note||'',reason:data.reason||'',sourceRecommendation:data.sourceRecommendation||'',sourceDecisionId:data.sourceDecisionId||'',sourceProjectId:data.sourceProjectId||'',linkedTaskId:data.linkedTaskId||'',intendedSpaceId:data.intendedSpaceId||'',desiredWindow:data.desiredWindow||'',priority:Number(data.priority)||50,alreadyOwned:Boolean(data.alreadyOwned),ownedRecordId:data.ownedRecordId||'',purchased:Boolean(data.purchased),purchasedAt:data.purchasedAt||'',linkedSeedInventoryId:data.linkedSeedInventoryId||'',linkedPlantId:data.linkedPlantId||'',addedAt:data.addedAt||at};const duplicateKey=data.duplicateKey||shoppingDuplicateKey({...base,date:''});return{id:newId('shopping'),...base,operationId:data.operationId||`shopping:${duplicateKey}`,duplicateKey,status:base.purchased?'purchased':base.alreadyOwned?'owned':'active',createdAt:data.createdAt||at,updatedAt:at,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null};
}

export function materializeShoppingItem(item={},actor='System'){
 if(!item.legacy)return item;
 return createShoppingItem({...item,id:undefined,sourceDecisionId:item.sourceDecisionId},actor);
}
