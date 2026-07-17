from pathlib import Path
import re


def required_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected text for {label}')
    return text.replace(old, new, 1)

app_path=Path('src/App.jsx')
text=app_path.read_text()
text=required_replace(text,"import SeedTools from'./SeedTools.jsx';","import SeedTools from'./SeedTools.jsx';\nimport SeedDepartmentBoundary from'./SeedDepartmentBoundary.jsx';",'Seed Department boundary import')
text=required_replace(text,"import{prepareGardenForSync,softDelete,touchRecord}from'./syncModel.js';","import{prepareGardenForSync,softDelete,touchRecord}from'./syncModel.js';\nimport{persistJson}from'./gardenPersistence.js';",'persistence import')
text=required_replace(text," const weatherState=useGreenBayWeather(),actor=garden.profile?.gardenerName||'Brooke';"," const weatherState=useGreenBayWeather(),actor=garden.profile?.gardenerName||'Brooke',packetSaveLock=useRef(false);",'packet save lock')
old_effect=" useEffect(()=>localStorage.setItem(PAGE_KEY,page),[page]);useEffect(()=>localStorage.setItem(GARDEN_KEY,JSON.stringify(garden)),[garden]);useEffect(()=>localStorage.setItem(DAILY_KEY,JSON.stringify(daily)),[daily]);"
new_effect=" useEffect(()=>{try{localStorage.setItem(PAGE_KEY,page)}catch(error){console.error('[Runyan Garden] page-state persistence failure',error)}},[page]);useEffect(()=>{const result=persistJson(GARDEN_KEY,garden);if(!result.ok)console.error('[Runyan Garden] garden-state persistence remains in memory only',result)},[garden]);useEffect(()=>{const result=persistJson(DAILY_KEY,daily);if(!result.ok)console.error('[Runyan Garden] daily-state persistence remains in memory only',result)},[daily]);"
text=required_replace(text,old_effect,new_effect,'guarded persistence effects')
pattern=re.compile(r"savePacket=data=>setGarden\(current=>\{const now=.*?return\{\.\.\.current,shoppingItems,seedPackets:\[packet,\.\.\.current\.seedPackets\]\}\}\),deletePacket=",re.S)
replacement="""savePacket=data=>{if(packetSaveLock.current)return{ok:false,kind:'busy',message:'The packet is already being saved. Wait for the current save to finish.'};packetSaveLock.current=true;try{const now=new Date().toISOString(),id=newId('packet'),packet={id,...data,createdAt:now,updatedAt:now,createdBy:actor,updatedBy:actor,revision:1,deletedAt:null},shoppingItems=(garden.shoppingItems||[]).map(item=>item.id===data.sourceShoppingItemId?{...item,linkedSeedInventoryId:id,updatedAt:now,updatedBy:actor}:item),next={...garden,shoppingItems,seedPackets:[packet,...(garden.seedPackets||[])]},stored=persistJson(GARDEN_KEY,next);if(!stored.ok)return stored;setGarden(next);showToast('Seed packet saved.');return{ok:true,packet}}catch(error){console.error('[Runyan Garden] packet save transaction failed',{error,data:{...data,photo:data.photo?'[image]':'',frontPhoto:data.frontPhoto?'[image]':'',backPhoto:data.backPhoto?'[image]':''}});return{ok:false,kind:'save',message:'The packet could not be saved. Your draft and photos are still available so you can retry.'}}finally{packetSaveLock.current=false}},addPacketQuantity=(id,amount=1)=>{if(packetSaveLock.current)return{ok:false,kind:'busy',message:'Another packet update is already running.'};packetSaveLock.current=true;try{const now=new Date().toISOString(),seedPackets=(garden.seedPackets||[]).map(packet=>packet.id===id?touchRecord({...packet,quantity:Math.max(0,Number(packet.quantity)||0)+Math.max(1,Number(amount)||1)},actor):packet),next={...garden,seedPackets},stored=persistJson(GARDEN_KEY,next);if(!stored.ok)return stored;setGarden(next);showToast('Packet quantity updated.');return{ok:true,packet:seedPackets.find(packet=>packet.id===id)}}catch(error){console.error('[Runyan Garden] packet quantity update failed',{id,amount,error});return{ok:false,kind:'save',message:'The packet quantity could not be updated. Try again.'}}finally{packetSaveLock.current=false}},deletePacket="""
text,count=pattern.subn(replacement,text,count=1)
if count!=1:
    raise SystemExit(f'Packet save replacement count was {count}')
old_view="{page==='seed-tools'&&<SeedTools garden={garden} navigate={navigate} savePacket={savePacket} deletePacket={deletePacket} mode=\"inventory\"/>}"
new_view="{page==='seed-tools'&&<SeedDepartmentBoundary onBack={()=>navigate('center')}><SeedTools garden={garden} navigate={navigate} savePacket={savePacket} deletePacket={deletePacket} onAddPacketQuantity={addPacketQuantity} mode=\"inventory\"/></SeedDepartmentBoundary>}"
text=required_replace(text,old_view,new_view,'Seed Department boundary wiring')
app_path.write_text(text)
print('updated src/App.jsx')

year_path=Path('src/yearRoundEngine.js')
year=year_path.read_text()
year=required_replace(year,'environmentSchemaVersion:1,weatherDecisionSchemaVersion:1,version:14','environmentSchemaVersion:1,weatherDecisionSchemaVersion:1,seedPacketSchemaVersion:1,version:15','seed packet schema marker')
year_path.write_text(year)
print('updated src/yearRoundEngine.js')
