# Brooke's Wisconsin Garden

A mobile-first, year-round Wisconsin gardening companion built for Green Bay.

## Working systems

- Live Green Bay weather with saved fallback conditions and garden-specific weather guidance
- Automatic seasonal modes for winter, seed starting, outdoor transition, summer care, harvest, and fall shutdown
- Actionable Garden Briefing: every listed action opens the exact task instead of only reporting a count
- Today-task snoozing so nonurgent items can move out of the way until tomorrow
- Real garden spaces and plant records across outdoor beds, containers, greenhouse, hydroponics, indoor starts, and basement growing
- Garden-space controls for moving spaces up/down, hiding seasonal spaces, restoring them later, and safely removing empty spaces
- Soil-first watering checks instead of generic watering alarms
- Seven-day and thirty-day garden plans generated from planting dates, stages, succession schedules, and harvest estimates
- One-tap plant-stage advancement and basic harvest logging
- Automatic succession planning for lettuce, spinach, green onions, and basil
- Mobile seed inventory with packet year, variety, estimated amount remaining, aging guidance, and a possible shopping list
- Persistent local records for plants, seeds, succession batches, harvests, greenhouse checks, watering, and activity
- New Wisconsin cheese-sun landscape detail and cheese-sprout install icon
- Installable PWA behavior with a refreshed offline cache
- Responsive Wisconsin visual design based on the approved product mockup

The collapsible garden-card concept is intentionally reserved for the later visual-overhaul phase; this release prioritizes clear working management controls.

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
