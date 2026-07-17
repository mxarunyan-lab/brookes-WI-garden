import{jsPDF}from'jspdf';import QRCode from'qrcode';

export const publicBedLink=id=>`${window.location.origin}${window.location.pathname}?bed=${encodeURIComponent(id)}&view=public`;
const safe=s=>String(s||'').replace(/[\\/:*?"<>|]+/g,'-').trim();
const save=(doc,name)=>doc.save(`${safe(name)||'runyan-garden-labels'}.pdf`);
const qr=link=>QRCode.toDataURL(link,{width:1000,margin:3,errorCorrectionLevel:'M',color:{dark:'#000000',light:'#ffffff'}});
const text=(doc,value,x,y,size=12,style='normal',align='left')=>{doc.setFont('helvetica',style);doc.setFontSize(size);doc.text(String(value||''),x,y,{align})};
const wrap=(doc,value,width)=>doc.splitTextToSize(String(value||''),width);

export async function downloadBedSigns(spaces,plants=[]){
 const doc=new jsPDF({unit:'in',format:'letter',orientation:'portrait'});
 for(let i=0;i<spaces.length;i++){
  if(i)doc.addPage();const s=spaces[i],link=publicBedLink(s.id),code=await qr(link),items=plants.filter(p=>p.spaceId===s.id&&!p.archived&&!p.deletedAt);
  doc.setDrawColor(20);doc.setLineWidth(.03);doc.roundedRect(.45,.45,7.6,10.1,.18,.18);
  text(doc,'THE RUNYAN GARDEN',4.25,.82,11,'bold','center');text(doc,s.name,4.25,1.28,25,'bold','center');
  doc.addImage(code,'PNG',2.05,1.62,4.4,4.4);text(doc,'SCAN TO SEE WHAT IS GROWING HERE',4.25,6.28,11,'bold','center');
  doc.setLineWidth(.012);doc.line(.85,6.55,7.65,6.55);text(doc,'CURRENTLY IN THIS BED',.9,6.9,10,'bold');
  if(items.length){let y=7.22;for(const p of items.slice(0,9)){const title=`${p.name}${p.variety?` — ${p.variety}`:''}`;text(doc,title,.95,y,12,'bold');text(doc,`${p.quantity||1} plant${Number(p.quantity||1)===1?'':'s'} · ${p.stage||'Growing'}`,1.0,y+.22,9);y+=.55}}
  else text(doc,'No active plants are currently listed.',.95,7.25,11);
  text(doc,`Bed code: ${s.id}`,.9,10.15,7);text(doc,'Green Bay, Wisconsin',7.6,10.15,7,'normal','right');
 }
 save(doc,spaces.length===1?`${spaces[0].name}-bed-sign`:'Runyan-Garden-bed-signs');
}

export async function downloadPlantTags(spaces,plants=[]){
 const active=plants.filter(p=>!p.archived&&!p.deletedAt);if(!active.length)throw new Error('No active plants are available for tags.');
 const doc=new jsPDF({unit:'in',format:'letter',orientation:'portrait'}),cols=2,rows=4,w=3.65,h=2.45,gap=.15,left=.45,top=.42;
 for(let i=0;i<active.length;i++){
  if(i&&i%(cols*rows)===0)doc.addPage();const n=i%(cols*rows),col=n%cols,row=Math.floor(n/cols),x=left+col*(w+gap),y=top+row*(h+gap),p=active[i],s=spaces.find(v=>v.id===p.spaceId),link=publicBedLink(p.spaceId),code=await qr(link);
  doc.setLineWidth(.018);doc.setLineDashPattern([.06,.04],0);doc.roundedRect(x,y,w,h,.12,.12);doc.setLineDashPattern([],0);
  text(doc,'THE RUNYAN GARDEN',x+.18,y+.27,7,'bold');text(doc,p.name,x+.18,y+.62,17,'bold');
  const crop=[p.cropName||'',p.variety||''].filter(Boolean).join(' · ')||'Variety not recorded';doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(wrap(doc,crop,2.05),x+.18,y+.88);
  text(doc,s?.name||'Unassigned location',x+.18,y+1.38,9,'bold');text(doc,`${p.quantity||1} plant${Number(p.quantity||1)===1?'':'s'} · ${p.stage||'Growing'}`,x+.18,y+1.62,8);
  doc.addImage(code,'PNG',x+2.52,y+.25,.92,.92);text(doc,'Scan for bed',x+2.98,y+1.35,7,'bold','center');text(doc,`Plant ID: ${p.id}`,x+.18,y+2.2,6);
 }
 save(doc,'Runyan-Garden-plant-tags');
}
