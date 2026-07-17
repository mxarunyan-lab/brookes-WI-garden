import React from'react';
import{Sprout,Tags,Wrench}from'lucide-react';
import{SecondaryCard,SecondaryHero,SecondarySectionHeader}from'./SecondaryUI.jsx';

export default function ToolShed({navigate}){
 return <main className="screen secondary-screen tool-shed-screen"><SecondaryHero icon={Wrench} eyebrow="OPTIONAL GARDEN UTILITIES" title="Tool Shed" description="Create labels and use focused tools without leaving the garden workflow." className="tool-shed-hero"/><section className="screen-pad secondary-screen-content tool-shed-content"><SecondarySectionHeader eyebrow="CREATE AND PRINT" description="Bed signs, plant tags, and custom record labels now live together."/><div className="secondary-card-list tool-shed-card-list"><SecondaryCard kind="utility" tone="gold" icon={Tags} title="Plant Labels" description="Create bed signs, individual plant tags, or one custom QR label for a saved garden record." meta="Bed Signs · Plant Tags · Custom QR Label" onClick={()=>navigate('labels')}/></div><section className="tool-shed-note"><Sprout/><span><strong>Garden work stays elsewhere.</strong><small>Current plants live in Garden. Chores, planting, shopping, seeds, indoor growing, and records live in Center.</small></span></section></section></main>;
}
