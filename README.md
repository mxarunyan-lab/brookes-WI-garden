# Brooke's Wisconsin Garden

A mobile-first, year-round Wisconsin gardening companion built for Green Bay.

## Working systems

- Live Green Bay weather with saved fallback conditions and garden-specific weather guidance
- Automatic seasonal modes for winter, seed starting, outdoor transition, summer care, harvest, and fall shutdown
- Real garden spaces and plant records across outdoor beds, containers, greenhouse, hydroponics, indoor starts, and basement growing
- Soil-first watering checks instead of generic watering alarms
- Seven-day and thirty-day garden plans generated from planting dates, stages, succession schedules, and harvest estimates
- One-tap plant-stage advancement and basic harvest logging
- Automatic succession planning for lettuce, spinach, green onions, and basil
- Mobile seed inventory with packet year, variety, estimated amount remaining, aging guidance, and a possible shopping list
- Persistent local records for plants, seeds, succession batches, harvests, greenhouse checks, watering, and activity
- Installable PWA behavior with a refreshed offline cache
- Responsive Wisconsin visual design based on the approved product mockup

See `ROADMAP.md` for completed work and the remaining camera/QR, control-center, seasonal-memory, shared-sync, and garden-planning phases.

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

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

Every new commit to `main` should trigger an automatic deployment.
