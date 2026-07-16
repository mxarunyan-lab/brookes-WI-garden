# The Runyan Garden

A mobile-first, year-round Wisconsin gardening companion built for the Runyan household in Green Bay.

## Current release: v0.10.2

- One full Green Bay weather card plus one short garden-specific weather conclusion
- Plain-language planting categories: start indoors, plant outside, grow indoors, already growing, and plan for later
- Gardening shorthand replaced with clear seed, seedling, young-plant, and transplant language
- Today tasks identify the plant, growing space, physical action, and reason the task appeared
- Task completion records show who handled the work and when, with an Undo control
- Indoor crop setup distinguishes spring seedlings from mature indoor fruit or leaf production
- Indoor records support container size, assigned grow light, and daily light-hour plans
- Stable IDs, created/updated timestamps, gardener attribution, revisions, and soft deletion added for cloud sync
- Downloadable local garden backup available in Profile before the v1.0.0 migration
- Brooke: Director of Seed Acquisition; Archie: Director of Dirt Operations
- Profile Version Center shows version 0.10.2 and build `clarity-sync-ready`
- Installable PWA cache version v12

## Current storage boundary

The profiles still share the garden saved on the current device. v1.0.0 will add Supabase authentication, cross-phone synchronization, shared tasks, cloud backups, and shared QR destinations.

## Render deployment

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Branch: `main`

Every new commit to `main` should trigger an automatic deployment.
