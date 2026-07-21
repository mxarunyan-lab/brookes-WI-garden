export const REGISTERED_PAGES=[
 'today','weather','chores','garden','plan-plant','center','vacation','shopping-list','tools',
 'spacing-calculator','soil-calculator','frost-calculator','seed-quantity-calculator','garden-measurements',
 'printable-pack','more','profile','admin-profile','admin-location','admin-notifications','admin-backup',
 'admin-help','admin-whatsnew','admin-support','admin-about','indoor','memory','seed-tools','seed-labels','labels'
];
const PAGE_SET=new Set(REGISTERED_PAGES),ALIASES={plant:'plan-plant',learn:'plan-plant',settings:'more',profile:'more','garden-settings':'more','tool-shed':'tools','garden-shopping-list':'shopping-list','record-qr-labels':'seed-labels'};
export const normalizePage=value=>{const page=ALIASES[String(value||'').trim()]||String(value||'').trim();return PAGE_SET.has(page)?page:'today'};
export function readInitialPage(location=window.location,storage=window.localStorage){
 try{
  const params=new URLSearchParams(location.search||'');
  if(params.has('bed')||params.has('gardenLabel'))return'today';
  const requested=params.get('page');
  if(requested)return normalizePage(requested);
  return normalizePage(storage?.getItem?.('brookes-garden-page-v2')||'today');
 }catch{return'today'}
}
export function pageUrl(page,location=window.location){
 const next=normalizePage(page),params=new URLSearchParams();
 if(next!=='today')params.set('page',next);
 const query=params.toString();
 return`${location.pathname||'/'}${query?`?${query}`:''}${location.hash||''}`;
}
export function syncPageUrl(page,{replace=false,location=window.location,history=window.history}={}){
 try{const url=pageUrl(page,location);if(`${location.pathname}${location.search}${location.hash||''}`===url)return;history[replace?'replaceState':'pushState']({gardenPage:normalizePage(page)},'',url)}catch{}
}
export function pageFromPopState(event,location=window.location){return normalizePage(event?.state?.gardenPage||new URLSearchParams(location.search||'').get('page')||'today')}
