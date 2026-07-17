# Phase 4.4A — Environmental Intelligence Foundation

## Current weather sources

The primary adapter uses the National Weather Service for Green Bay, Wisconsin:

- Point forecast for the saved Runyan Garden coordinates
- Hourly forecast
- Daily forecast periods
- Current KGRB observation
- Recent KGRB observation history for observed rainfall
- Active NWS alerts for the saved point

Open-Meteo remains a clearly labeled fallback when the official NWS request fails. Open-Meteo current conditions are classified as a regional estimate rather than a personal or official local measurement.

## Normalized environmental record

`src/environmentalIntelligence.js` defines the normalized record used by weather-aware features. The record supports source identity, observation and forecast timestamps, received and expiration timestamps, location, temperature, humidity, dew point, wind, pressure, precipitation, snow, solar radiation, UV, cloud cover, alerts, derived risks, confidence, quality status, stale status, manual correction metadata, future household identity, and superseded observation links.

Missing provider values remain `null`. They are not invented.

## Provider adapter boundary

`src/weather.js` owns provider fetching and translates NWS and Open-Meteo payloads into normalized records. The rest of the app consumes a single environmental snapshot rather than parsing provider payloads independently.

A dormant `personalWeatherStationAdapter` is exported for Phase 4.4B. It accepts provider, station ID, observation time, temperature, humidity, dew point, pressure, wind, precipitation, solar radiation, UV, and quality-control status and returns the same normalized record shape. It is intentionally inactive.

## Source priority

The effective priority is:

1. Compatible personal weather-station observations after Phase 4.4B activates the adapter
2. Manual Home weather monitor corrections
3. Trusted public observations, currently NWS KGRB
4. Forecast-provider data
5. Regional model estimates, currently the labeled Open-Meteo fallback

Forecast rainfall never becomes observed rainfall and never completes a watering task.

## Freshness and confidence

Records are classified as Current, Recent, Stale, or Unavailable. Observation freshness is based on observation time, expiration, and provider quality. Stale or unavailable conditions lower confidence and switch care language to cautious soil checks rather than exact claims.

## Manual correction rules

The Today weather details drawer supports decimal rainfall, optional outdoor temperature, measurement time, source, and note. The default source is `Home weather monitor`. Before household syncing is active, `entered_by` remains `null`.

A correction can supplement an incomplete event or supersede a specific provider observation. The provider record remains preserved. Corrections expire as current-condition inputs but remain in correction history. Removing a correction restores provider-derived behavior.

## Rain-event handling

Rain is stored as timestamped event information. Repeated records from the same provider, station, accumulation period, and hour are deduplicated by retaining the strongest accumulation. Forecast records are excluded from observed totals. Effective rainfall applies manual replacement and supplement rules without deleting original observations.

## Growing Space exposure

Exposure is inferred from existing Growing Space type unless an explicit rain/weather exposure field is later saved:

- Indoor, basement, hydro, and seed-tray spaces: no outdoor rain credit
- Greenhouse: no automatic outdoor rain credit
- Covered or partially protected areas: reduced credit
- Outdoor containers: reduced credit and faster-drying consideration
- Raised beds: slightly reduced credit and faster-drainage consideration
- In-ground and fully exposed beds: full credit

No large setup flow is required. Existing Growing Spaces receive sensible defaults.

## Reusable environmental signals

The central layer creates explained, timestamped signals for meaningful rain, light rain, heavy rain, forecast rain, drying conditions, evaporation, heat, frost, freeze, wind, fungal pressure, greenhouse overheating, watering delay, soil checks, tender-plant protection, transplant stress, planting suitability, spraying delay, and fertilizer delay.

Each signal contains status, confidence, reason, source, timestamp, affected Growing Spaces, and reevaluation/expiration time.

## Smart Watering and Chore Board

Smart Watering now evaluates effective rain for the plant’s Growing Space. Meaningful observed rain changes routine watering to Check Soil for exposed spaces. Light rain triggers a soil check. Protected spaces continue to receive direct guidance. Forecast rain can delay watering cautiously but never marks the plant watered.

The Chore Board uses stable IDs to avoid duplicates and can create or adjust frost, heat, wind, drainage, greenhouse ventilation, spraying, fertilizing, and soil-check work. Completed history is not overwritten.

## Planting Desk recommendation logic

Recommendations are organized by the action that is realistic now:

- Direct Sow
- Start Indoors
- Buy Transplants
- Transplant Existing Seedlings
- Perennials and Plants
- Pollinator and Companion Plants
- Indoor Growing
- Save for Later
- Not This Season

The highest-priority actionable group opens first. Other groups stay collapsed and session expansion state is retained.

Each card includes crop type, current status, present action, Green Bay fit, Growing Space fit, traits to shop for, curated example cultivars where supported, planting method, date window, expected harvest/bloom, weather note, supplies needed, confidence, and failure risks.

Owned packets receive priority only when they fit. Discovery mode remains useful without an owned packet. Long-season crops are rejected or moved to transplant-only behavior when seed starting is no longer realistic. Eggplant is never recommended as late direct sowing.

## Named-variety sourcing

Named examples are limited to curated horticultural references, primarily University of Wisconsin–Madison Division of Extension and University of Minnesota Extension. Examples are labeled as possibilities, not the only correct choices. Generated cultivar names are prohibited.

Current examples include Amish Deer Tongue lettuce, Indian Summer and Olympia spinach, Hercules and Long Island Mammoth dill, Albinstar Baby Leek, Genovese basil, and Pastel Carpet Mix sweet alyssum.

## Date formatting

`src/dateFormat.js` formats user-facing garden dates as `MM-DD-YYYY` and local times such as `3:15 PM`. ISO storage remains unchanged for sorting, calculations, and future sync. Date-only values are parsed at local noon to avoid calendar-day shifts.

## Data storage and migration

Existing garden data remains in `brookes-garden-state-v2`. Environmental provider cache and manual corrections use versioned local-storage keys. `migrateGarden` adds empty environmental arrays and schema version fields idempotently without resetting plants, spaces, tasks, decisions, or histories.

## Phase 4.4B connection point and credentials

Phase 4.4B should activate a backend or serverless station connector and return the normalized record accepted by `personalWeatherStationAdapter`. Station credentials, Weather Underground keys, passwords, and private URLs must remain in secure backend environment variables. They must never be stored in frontend code, GitHub, prompts, logs, or local storage.

## Known limitations

- The personal Sainlogic / Weather Underground station is not connected.
- No physical soil-moisture sensor is connected; soil moisture remains cautious guidance, never an exact percentage.
- Greenhouse temperature is not inferred as an exact indoor reading; outdoor warmth creates a ventilation risk signal only.
- Regional fallback current conditions are model estimates and are labeled accordingly.
