export const APP_VERSION='0.20.0';
export const BUILD_ID='phase-4-6x-pre-sync-readiness';
export const UPDATED_AT='July 18, 2026';
export const WHATS_NEW=[
 'Garden backups are now validated before download and again before restore, including record counts, linked records, integrity checks, and embedded photo references',
 'A Data Health summary under Backup and Restore now checks stable IDs, relationships, timestamps, duplicate risks, and safe recovery readiness without exposing technical logs by default',
 'Legacy seed records now consolidate into one Seed Inventory while preserving packet history, quantities, source details, photos, and existing links',
 'Watering and soil checks now retain attributable event records so Today, Smart Watering, the Chore Board, and garden history can share one source of truth',
 'Plants, Growing Spaces, seed packets, Vacation plans, tasks, shopping items, photos, QR labels, calculator results, and lifecycle events receive stronger stable IDs and relationship metadata',
 'Repeated task completions, watering saves, packet quantity changes, seed use, reservations, harvests, issues, Vacation actions, and calculator handoffs are better protected from duplicate processing',
 'Plant and Growing Space renames continue using stable IDs, so linked Plant Journeys, photos, tasks, harvests, issues, seed use, and QR destinations stay connected',
 'Vacation plans, task completion, watering history, seed quantities, shopping items, photos, and Plant Journeys now have record-specific future conflict rules instead of one generic overwrite rule',
 'A safe local restore and migration rehearsal can verify retry and rollback behavior using a copy of the garden without connecting to cloud sync or replacing active records',
 'Phase 5 cloud syncing, authentication, invitations, and production data migration have not started'
];
