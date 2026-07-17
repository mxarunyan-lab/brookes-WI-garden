export const APP_VERSION='0.12.13';
export const BUILD_ID='weather-race-and-rainfall-correction';
export const UPDATED_AT='July 17, 2026';
export const WHATS_NEW=[
 'Weather requests now use newest-request-wins protection so an older response cannot replace fresher conditions',
 'Duplicate iPhone startup, pageshow, and visibility refreshes are cancelled or throttled instead of racing each other',
 'Today’s high, low, sunrise, sunset, and rain chance are selected by the actual Green Bay date rather than assuming the first daily row is today',
 'Recent rainfall is totaled across the last 6 and 24 hours so watering guidance reflects rain that already fell',
 'A quarter inch or more of recent rain suppresses routine outdoor watering guidance for the day',
 'Current rain and thunderstorms continue to override heat and generic forecast messaging',
 'Failed weather refreshes keep the newest successful reading instead of rolling the card back to an older cache',
 'Weather cache data now uses a new schema so broken v0.12.12 readings are not reused',
 'The weather card continues to identify live versus saved conditions and show the update time',
 'Offline cache v30 refreshes installed iPhone copies with the weather correction release'
];