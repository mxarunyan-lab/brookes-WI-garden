# Phase 4.6X Pre-Sync Readiness Report

## Decision

**NOT READY FOR PHASE 5.0**

The structural model, conflict simulations, validated backup/restore flow, mock migration, retry, and rollback mechanisms pass against deterministic fixtures and the repository’s representative garden data. The remaining high-risk operational gate is a validated export, isolated restore, and migration rehearsal using the actual garden dataset currently stored in Archie and Brooke’s production browser local storage. That data is not present in GitHub and cannot be inspected remotely. Phase 5.0 must not begin until the deployed **Run Safe Restore Rehearsal** reports ready on the real device dataset and a validated backup is retained.

## What was audited

The audit covered the authoritative garden dataset, device-local caches and drafts, plants, Growing Spaces, Plant Journeys and lifecycle events, seed packets and quantity changes, Indoor Growing, tasks and completions, Bulletin and Smart Watering views, watering and soil checks, weather records and rainfall corrections, shopping, Vacation Mode, harvests, issues, photos, QR labels, calculator results, activity, schema metadata, backup/restore, and future offline-operation requirements.

The complete storage and relationship map is in `PHASE_4_6X_DATA_MAP.md`.

## Structural problems found

1. Seed inventory had two writable collections: `seeds` and `seedPackets`.
2. Watering and soil checks were mainly stored as plant projections rather than authoritative events.
3. Legacy and nested records could lack stable IDs, timestamps, attribution, or record-specific status.
4. Embedded photos had no common stable parent manifest.
5. Backup files had no full manifest, record-count validation, or integrity value.
6. Restore could replace active data before isolated equivalence validation.
7. Important writes did not share one operation-ID and idempotency contract.
8. Conflict rules, roles, offline queue shape, migration retry, and rollback behavior were not executable or centrally documented.
9. QR installation state could remain in a separate local key instead of the shared garden dataset.

## What was fixed

- `seedPackets` is now the sole writable inventory authority; legacy `seeds` records migrate non-destructively with provenance.
- Seed quantities use attributed transaction events and operation IDs, including reserve, release, plant/use, and correction behavior.
- Watering and soil checks now have authoritative event streams while existing plant fields remain derived convenience projections.
- Stable IDs and sync-safe metadata are assigned idempotently to important records, nested lifecycle events, Vacation actions, drafts, photos, and QR labels.
- Record-specific states, soft-delete markers, attribution, timestamps, revision fields, schema history, and relationship validation were standardized.
- Embedded photos remain intact and receive stable metadata describing parent type, parent ID, content information, and migration status.
- QR destinations continue to use stable IDs and produce archived/unavailable safe states rather than blank screens.
- Task completion, watering, seed use, shopping, harvests, Vacation actions, photos, calculator applications, restore, and migrations use idempotency or duplicate keys appropriate to the record type.
- One validated Backup and Restore workflow now performs integrity, count, relationship, checksum, and isolated-restore checks before replacement.
- A Data Health and local migration rehearsal is available under More → Backup and Restore.
- No Supabase tables, authentication, cloud syncing, remote storage, or production migration were added.

## Record readiness

### Sync-ready in structure and simulation

Plants, Growing Spaces, Plant Journeys, lifecycle events, seed packets, seed transactions, Indoor Growing records, tasks, task completions, watering events, soil-check events, shopping items, Vacation plans and actions, harvests, issues, photos, attachments, QR labels, calculator results, activity, environmental corrections, and schema metadata have stable identities, documented authority, relationship validation, conflict rules, and backup/migration mappings.

### Remaining operational blocker

All record types remain blocked from **production Phase 5 migration approval** until the real production-local dataset completes the deployed Data Health, backup, isolated restore, repeated mock migration, and rollback rehearsal. This is an evidence gate, not a known code failure.

## Conflict policies

- Task completion: completed wins; duplicate operation IDs collapse; attribution is preserved.
- Notes: latest confirmed revision wins; prior revision is retained where supported.
- Photos: different images are preserved; exact repeats deduplicate; deletion affects only that photo ID.
- Seed quantity: append-only transactions reconcile; stale quantity snapshots cannot overwrite newer events; impossible negative results are blocked.
- Shopping: exact duplicate keys merge; purchased or already-owned state cannot silently revert.
- Vacation plan: one stable plan; date changes recalculate; manual instructions and completed/canceled actions survive regeneration.
- Vacation action: completed/canceled wins over stale active state; assignment and manual edits are preserved.
- Plant rename: newest valid name wins; ID relationships remain unchanged.
- Delete versus edit: deletion markers prevent silent resurrection; newer edits become recovery conflicts.
- Harvest and watering: distinct events remain; same-operation retries deduplicate.
- Plant Journey: lifecycle events are unioned by stable ID/operation ID and ordered chronologically.
- Rainfall: observed/corrected rain remains event data; forecast rain never becomes a completion.

## Shared-workflow result

The Archie/Brooke/two-device simulations passed for duplicate task completion, concurrent edits, Vacation plan changes, caretaker completion, seed reservation and use, watering and soil checks, shopping duplicates, photo additions/deletions, Plant Journey events, offline retries, and stale-state conflict handling. Vacation Mode remained one shared plan and did not recreate completed or manually edited actions.

## Backup and restore result

Validated exports contain schema/export versions, timestamps, record counts, relationships, status and attribution fields, deletion/archive markers, photo handling, migration metadata, and an integrity value. Corrupted or incomplete backups are rejected. Isolated restore equivalence passed, and active data is not replaced until validation and user confirmation succeed.

## Migration rehearsal result

The local dataset transforms into cloud-shaped mock entities without contacting a cloud service. Two consecutive runs are idempotent, interrupted targets are detected and repaired on retry, stable IDs remain unchanged, and record-count validation passes for the representative dataset.

## Rollback result

Rollback rehearsal passed: the source dataset remains unchanged, a failed mock target is discardable, the validated backup restores an equivalent isolated copy, and retry remains available. Phase 5 must retain this rule: local production data cannot be removed until the remote copy is fully validated.

## Build and test result

- 50 targeted Phase 4.6X structural, shared-workflow, backup, restore, migration, and rollback scenarios passed.
- The compact critical regression and full shared-model regression passed locally with 193 tests and no failures.
- The production build passed.
- Backup/Data Health mobile checks passed at 320, 375, 390, and 430 pixels with no horizontal overflow, blank screens, script errors, hidden actions, or restore data loss.

## Known risks and Phase 5 requirements

- Actual embedded photos remain in local records; Phase 5 must migrate binaries only after upload verification and must not destroy originals prematurely.
- Device-local drafts, active-profile choice, UI state, and pending processing remain intentionally device-local.
- The offline queue is a contract and simulation only; successful local writes must not be described as cloud-confirmed before Phase 5.
- The real production-local garden backup and rehearsal must be completed and retained before Phase 5 starts.
- Caretaker and read-only permissions are policies only; authentication and enforcement belong to Phase 5.

**NOT READY FOR PHASE 5.0**
