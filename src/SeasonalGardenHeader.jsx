import React from'react';
import{buildGardenSubtitle,possessiveGardenTitle,resolveGardenHeaderSeason}from'./seasonalGardenHeader.js';
import{SEASONAL_GARDEN_ASSET_SOURCES}from'./seasonalGardenAssetSources.js';

export function SeasonalGardenHeader({profile={},notificationControl,notificationPopover,date,seasonPreference='automatic'}){
 const season=resolveGardenHeaderSeason(seasonPreference,date);
 const title=possessiveGardenTitle(profile.gardenerName);
 const subtitle=buildGardenSubtitle(profile.gardenName,profile.location);
 return <section className="seasonal-garden-header home-seasonal-header" data-season={season} aria-label={`${profile.gardenName||'Garden'} seasonal overview`}>
  <img className="seasonal-garden-header__image" src={SEASONAL_GARDEN_ASSET_SOURCES[season]} alt="" aria-hidden="true" loading="eager" fetchPriority="high" decoding="async"/>
  <div className="seasonal-garden-header__identity">
   <h1 className="seasonal-garden-header__title">{title}</h1>
   {subtitle&&<p className="seasonal-garden-header__subtitle">{subtitle}</p>}
  </div>
  <div className="seasonal-garden-header__notifications">{notificationControl}{notificationPopover}</div>
 </section>;
}
