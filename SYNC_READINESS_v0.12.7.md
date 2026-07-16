# The Runyan Garden — v1.0.0 Sync Readiness

## Records ready to migrate
- Gardener profiles
- Growing spaces and stable space IDs
- Plants and their crop, seed, and space links
- Seed inventory and photographed packet metadata
- Chore outcomes, snoozes, and gardener attribution
- Activity history
- Harvest and problem records
- Succession plans
- Next-season/year plan
- Indoor trays, lights, hardening plans, greenhouse readings, and hydroponic household records
- Stable QR links based on garden-record IDs

## Cloud storage required
- Bed photos
- Seed-packet photos
- Any future plant progress photos

## Initial migration rule
1. Download a local backup.
2. Choose the phone with the most complete garden as the source device.
3. Create one shared Runyan Garden household.
4. Upload structured records first.
5. Upload photos and replace local data URLs with cloud URLs.
6. Verify record totals before allowing the second phone to join.
7. Keep the original local copy until verification succeeds.

## Conflict rules for v1.0.0
- Every record keeps a stable ID, revision, updated timestamp, and updated-by gardener.
- Completing a chore is idempotent: the first completion wins and both devices receive the same completed state.
- Later edits merge only when they affect different fields; otherwise the newest server timestamp wins and the prior value remains in activity history.
- Deletions are soft deletes so stale devices cannot silently restore removed records.
- QR labels continue using stable IDs and resolve through the shared garden after migration.

## v0.12.7 conclusion
The single-device data model is sufficiently structured for shared sync. v1.0.0 should focus on authentication, household membership, database migration, photo storage, realtime updates, offline queues, and conflict handling rather than another feature expansion.
