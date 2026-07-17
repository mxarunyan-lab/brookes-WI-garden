export const APP_VERSION='0.12.15';
export const BUILD_ID='nws-rain-unit-correction';
export const UPDATED_AT='July 17, 2026';
export const WHATS_NEW=[
 'NWS precipitation measurements now use their reported unit codes instead of assuming meters',
 'KGRB millimeter rainfall is converted correctly to inches',
 'Impossible rainfall totals above 10 inches are rejected from automated garden guidance',
 'The corrupted 78.74-inch weather cache and rain hold are discarded automatically',
 'Weather and rain-hold storage use fresh schemas so poisoned values cannot survive the update',
 'Home rain-gauge entries are validated before they can create a watering hold',
 'National Weather Service remains the primary source for ZIP 54302 with Open-Meteo as labeled fallback',
 'Recent rain continues to suppress routine outdoor watering and soil-check tasks',
 'QR & Label Studio remains the PDF-only physical label workflow',
 'Offline cache v32 refreshes installed iPhone copies with the rainfall-unit correction'
];