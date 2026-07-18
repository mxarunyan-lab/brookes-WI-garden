# Phase 4.6X Local Data Map

This map documents the deployed v0.19.0 local data model before Phase 5.0. It identifies the authoritative record, storage location, relationships, deletion behavior, duplicate risk, photo handling, and sync-readiness status for every major workflow.

## Storage locations

- `brookes-garden-state-v2` — authoritative local garden dataset.
- `brookes-garden-daily-v5` — device-local task-view cache only; `taskHistory` is the authoritative completion stream.
- `runyan-garden-active-profile` — device-local active-gardener selection.
- `runyan-seed-packet-draft-v1` — session-only unsaved packet draft.
- Planting Desk, Indoor Growing, weather-detail, and navigation session keys — temporary device-local UI handoffs.
- Weather cache keys — external-data cache only, not shared garden truth.
- No IndexedDB database is currently used by the application.

## Authoritative collections

| Record type | Source of truth | Stable relationship | Delete/archive behavior | Main risk found | Phase 4.6X disposition |
|---|---|---|---|---|---|
| Garden profile/settings | `profile` | dataset root | retained | active profile mixed with device choice | shared settings retained; active user remains device-local |
| Growing Spaces | `spaces` | `space.id` | soft delete/archive | legacy rows may lack metadata | stable IDs and metadata migration |
| Plants / Plant Journeys | `plants` | `plant.id`, `spaceId`, `sourcePacketId` | soft delete/archive | stage events may lack IDs | nested lifecycle events receive stable IDs |
| Lifecycle events | `plants[].stageHistory` | `event.id`, `plantId` | retained with journey | append-only events could collide | stable event IDs and merge policy |
| Seed packets | `seedPackets` | `packet.id` | active/empty/archived/deleted | `seeds` was a second writable inventory | legacy `seeds` consolidated into `seedPackets` without deleting history |
| Seed quantity changes | `seedTransactions` | `operationId`, `packetId` | append-only/canceled | quantity projections could be overwritten | transaction ledger and reconciliation rules |
| Legacy seed use | `seedUsage` | `packetId`, `plantId` | retained | historical events lacked operation IDs | preserved and mirrored into transactions |
| Indoor trays/projects | `trays` | `tray.id`, packet/plant IDs | soft delete/archive | packet links may be missing | relationship validation and safe warnings |
| Grow lights | `growLights` | `light.id` | soft delete/archive | metadata gaps | stable metadata migration |
| Hardening plans | `hardeningPlans` | `plantId` | completed/archive | orphan risk after plant deletion | relationship validation |
| Hydroponic pods | `hydroPods` | `pod.id`, packet/plant IDs | soft delete/archive | parent links may be incomplete | stable IDs and validation |
| Greenhouse readings | `greenhouseReadings` | event ID, optional `spaceId` | append-only | timestamps/attribution inconsistent | standardized metadata |
| Manual tasks | `reminders` | `taskId`/`id` | completed/canceled/archived/deleted | status vocabulary inconsistent | record-specific status model |
| Task completions | `taskHistory` | `operationId`, `taskId` | append-only/deleted | duplicate double completion | operation-ID deduplication; completion wins |
| Bulletin/Today task views | derived from tasks and recommendations | underlying task/recommendation ID | not independently deleted | duplicate presentation risk | explicitly treated as derived views |
| Weather decisions | `weatherRecommendationHistory` | recommendation fingerprint/ID | retained | repeated decisions | operation-aware duplicate rules |
| Watering events | `wateringEvents` | event ID, plant/space IDs | append-only | `lastWatered` projection was the only durable truth | authoritative watering event stream added |
| Soil checks | `soilCheckEvents` | event ID, plant/space IDs | append-only | only plant projection/activity existed | authoritative soil-check event stream added |
| Environmental observations | `environmentalRecords` | normalized record ID | retained | external cache versus saved records unclear | saved records classified separately from cache |
| Rainfall corrections | `environmentalCorrections` | correction ID / superseded record ID | retained | attribution gaps | standardized metadata |
| Planting decisions | `plantingDecisions` | decision ID, packet/space IDs | retained | orphaned recommendations | relationship validation |
| Shopping items | `shoppingItems` | item ID and duplicate key | purchased/owned/archived/deleted | stale state could reopen purchased item | purchased/owned conflict policy |
| Vacation plans | `vacationPlans` | plan ID | draft/active/completed/canceled/archived | nested actions could regenerate over edits | one stable plan; manual/completed actions preserved |
| Vacation actions | `vacationPlans[].tasks` | action ID, plan ID, target ID | completed/canceled/archived/deleted | duplicate Chore Board projections | nested action remains authoritative; board is derived |
| Harvests | `harvests` | harvest ID, plant/space IDs | retained/deleted | retry duplicates | operation/duplicate-key idempotency |
| Issues/observations | `problems` | issue ID, plant/space IDs | open/resolved/archived/deleted | orphan risk | stable relationships and safe display warnings |
| Photos | parent embedded image + `photos` metadata manifest | photo ID, parent type/ID | active/archived/deleted | embedded strings lacked stable ownership metadata | non-destructive manifest added; originals preserved |
| Attachments | `attachments` | attachment ID, parent type/ID | active/archived/deleted | no common metadata model | normalized attachment metadata |
| Plant/space QR labels | `qrLabels` plus stable URL target ID | target type/ID | active/archived/deleted | installed status lived in separate key | label state prepared for garden dataset; stable URLs retained |
| Calculator results | `calculatorResults` | result ID, linked space/packet IDs | retained/deleted | results could disappear or duplicate | stable IDs and operation-aware application |
| Activity log | `activity` | event ID | append-only | derived copies mistaken for truth | classified as audit log, not workflow authority |
| Offline operations | `offlineOperations` | `operationId` | pending/completed/failed/conflict | no formal future queue shape | local queue contract added; no cloud sync implemented |
| Drafts | session storage | draft-specific ID/key | discard/expire | must never become shared garden truth | remains device-local |
| Schema metadata | dataset root | migration operation ID | append-only history | schema `version` and `schemaVersion` differed | one current schema version and sequential history |

## One-source-of-truth decisions

- `seedPackets` is the only writable seed inventory. Legacy `seeds` rows are migrated into it and preserved with provenance.
- `taskHistory` is the task-completion authority; the daily key is a device-local display cache.
- `wateringEvents` and `soilCheckEvents` are authoritative events; plant moisture and last-action fields are projections.
- Vacation actions remain nested in one Vacation plan. Chore Board and Bulletin display linked projections rather than new independent actions.
- Photos remain physically embedded for backward compatibility, while `photos` provides stable ownership and future-upload metadata.
- Garden Bulletin, Today, Smart Watering, and Chore Board do not become independent sources of truth.

## Highest-risk findings before correction

1. Two writable seed inventory collections.
2. No complete, validated backup manifest or integrity check.
3. Restore replaced active data before an isolated equivalence rehearsal.
4. Important legacy records and nested events could lack stable IDs or attribution.
5. Photo data lacked stable parent metadata and future migration state.
6. Task, watering, and seed retry operations lacked a consistent operation-ID contract.
7. Record-specific conflict policies and role rules were not documented in executable code.
8. No mock cloud-shaped migration, retry, interruption, or rollback rehearsal existed.

This map is the Checkpoint 1 baseline. Phase 4.6X changes must preserve every original record and embedded image while correcting these risks.
