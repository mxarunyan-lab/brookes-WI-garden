# The Garden of the Runyans

A mobile-first, year-round Wisconsin gardening companion built for the Runyan household in Green Bay.

## Current release: v0.10.0

- Brooke and Archie device profiles with garden planner and garden helper roles
- One-time “Who’s in the garden?” setup that remembers the selected person on the device
- Fast profile switching from Profile
- Care, harvest, problem, and garden-log actions attributed to the active gardener
- One shared local garden rather than separate duplicate gardens
- App always opens on Today instead of reopening Profile or another secondary screen
- Existing live weather, planting guidance, Garden Memory, Indoor Growing Center, packet photos, and QR labels remain available
- Profile Version Center showing version 0.10.0 and build `runyan-profiles`
- Installable PWA behavior with refreshed offline cache v10

## Current storage boundary

The two profiles share the garden saved on the current device. Supabase cloud sync is still required before Brooke’s and Archie’s separate phones automatically share the same live records, tasks, packet photos, and QR destinations.

## Render deployment

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

Every new commit to `main` should trigger an automatic deployment.
