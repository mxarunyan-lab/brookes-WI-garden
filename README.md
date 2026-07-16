# The Runyan Garden

A mobile-first, year-round Wisconsin gardening companion built for the Runyan household in Green Bay.

## Current release: v0.10.1

- Brooke: Director of Seed Acquisition
- Archie: Director of Dirt Operations
- Shared Runyan Garden identity with profile-specific Brooke’s Garden and Archie’s Garden home titles
- Learn renamed to Plan with clear 7-day, 30-day, seed, and succession sections
- Immediate scroll-to-top behavior on every page transition and profile switch
- Raised-bed artwork based on six black square beds and three white oval beds
- Shared-ownership copy across Today, My Garden, Garden Memory, and Profile
- Household activity records visibly attributed to the active gardener
- Profile reorganized into gardener, garden-center, location, and app-information groups
- Profile Version Center showing version 0.10.1 and build `runyan-ux`
- Installable PWA behavior with refreshed offline cache v11

## Current storage boundary

The profiles share the garden saved on the current device. Supabase cloud sync is still required before Brooke’s and Archie’s separate phones automatically share the same live records, tasks, packet photos, and QR destinations.

## Render deployment

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

Every new commit to `main` should trigger an automatic deployment.
