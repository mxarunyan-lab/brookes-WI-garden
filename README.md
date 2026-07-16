# Brooke's Wisconsin Garden

A mobile-first, year-round Wisconsin gardening companion built for Green Bay.

## Current release: v0.9.0

- Live Green Bay weather and automatic year-round seasonal priorities
- Actionable Garden Briefing, task snoozing, and manageable garden spaces
- Detailed plant controls, measured harvests, problems, Garden Memory, and seasonal review
- Indoor Growing Center with trays, lights, hardening off, greenhouse history, and hydroponics
- Seed packet camera capture with the original photo stored alongside confirmed packet details
- Required review before a photographed packet enters the seed inventory
- Packet records for variety, brand, year, quantity, maturity, depth, spacing, and notes
- Printable QR labels for garden spaces, plants, seedling trays, and hydroponic pods
- Cow added to the farm scene in place of the Made in Wisconsin sticker
- Simplified cheese-and-sprout app icon with no WI badge
- Profile Version Center showing version 0.9.0 and build `seed-tools`
- Installable PWA behavior with refreshed offline cache v9

The packet workflow intentionally requires human confirmation rather than pretending uncertain camera text is always correct. Shared cross-phone QR routing will be completed with cloud sync in v1.0.0.

The collapsible garden-card concept remains reserved for the later visual-overhaul phase.

## Render deployment

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

Every new commit to `main` should trigger an automatic deployment.