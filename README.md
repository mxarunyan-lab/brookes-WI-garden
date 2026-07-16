# Brooke's Wisconsin Garden

A mobile-first Wisconsin gardening companion built for Green Bay.

## Working phase now included

- Live Green Bay weather with current temperature, feels-like temperature, daily high/low, rain chance, wind, refresh, saved fallback data, and weather-driven garden guidance
- Date-aware Green Bay planting recommendations that change throughout the season instead of remaining stuck on spring sample dates
- A real garden setup flow for adding plants and growing spaces
- Saved plant stages, planting dates, soil checks, watering records, greenhouse checks, and activity history
- A soil-first watering flow: Brooke records whether soil is dry, damp, or wet before the app recommends watering or skipping it
- Raised bed, greenhouse, and hydroponics spaces that calculate progress from the plants actually entered
- Local device persistence so the garden survives closing and reopening the app
- Installable PWA metadata and an updated service worker that avoids serving stale app versions or caching the external weather API
- Responsive mobile layouts while preserving the approved Wisconsin visual design

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Render deployment

The `main` branch deploys to Render using:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

Every new commit to `main` should trigger an automatic deployment.
