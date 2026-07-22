import springPayload from'../.asset-staging/spring.avif.b64?raw';
import summerPart0 from'../.asset-staging/summer.avif.b64.part00?raw';
import summerPart1 from'../.asset-staging/summer.avif.b64.part01?raw';
import summerPart2 from'../.asset-staging/summer.avif.b64.part02?raw';
import fallPayload from'../.asset-staging/fall.avif.b64?raw';
import winterPayload from'../.asset-staging/winter.avif.b64.part00?raw';

const clean=value=>String(value||'').replace(/\s+/g,'');
const avifDataUrl=payload=>`data:image/avif;base64,${clean(payload)}`;

export const SEASONAL_GARDEN_ASSET_SOURCES={
 spring:avifDataUrl(springPayload),
 summer:avifDataUrl(`${summerPart0}${summerPart1}${summerPart2}`),
 fall:avifDataUrl(fallPayload),
 winter:avifDataUrl(winterPayload),
};
