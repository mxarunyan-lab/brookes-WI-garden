export const APP_VERSION='0.18.0';
export const BUILD_ID='phase-4-5-stabilization';
export const UPDATED_AT='July 17, 2026';
export const WHATS_NEW=[
 'Seed packet saving now validates storage before clearing the form, preserves failed drafts, prevents rapid duplicate saves, and provides a recovery path instead of a blank screen',
 'Front and back packet photos now have separate capture controls: the front is used primarily for crop, variety, brand, year, count, weight, and packet identity while the back is used for planting and growing instructions',
 'Packet photos are compressed before storage and can prefill useful details through on-device text recognition; recognition is best-effort and does not claim every field can always be read',
 'Extracted packet details now retain confidence, source photo, original packet wording, and manual-correction status so uncertain fields can be reviewed without overwriting confirmed edits',
 'A temporary packet draft can be resumed after a reload or Seed Department display failure, while drafts remain separate from completed inventory records',
 'Possible duplicate packets now receive a non-blocking warning with options to open the existing packet, add quantity, continue editing, or save separately',
 'Today now shows one compact current-weather summary, only the top one to three grouped garden impacts, and the Garden Bulletin substantially earlier on the page',
 'Detailed forecast, rain history, all weather impacts, local corrections, confidence, and source information remain available in one consolidated Garden Weather Details drawer',
 'Related watering, heat-and-drying, frost-and-cold, storms-and-wind, greenhouse, and damp-weather messages are grouped to reduce repeated calls to action',
 'Forecast day and night periods are combined by date, missing highs or lows are labeled clearly, and weather values use sensible rounding instead of long decimals'
];
