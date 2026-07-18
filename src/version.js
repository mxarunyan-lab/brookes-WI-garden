export const APP_VERSION='0.19.0';
export const BUILD_ID='phase-4-6-intelligence-reality-check';
export const UPDATED_AT='July 18, 2026';
export const WHATS_NEW=[
 'Seed Packet Intelligence now validates OCR before using it, rejects malformed identity fragments, compares the front and back using side-specific rules, and looks for supported exact official product matches',
 'Supported exact packet matches can prefill missing official product and growing-guide fields while preserving a compact source label, original packet wording, confidence, and any conflicts that still need confirmation',
 'Clear packet text remains authoritative when it conflicts with online information, and manually corrected values are never silently overwritten by a rescan, lookup, or generic guidance',
 'Vacation Mode now builds a garden-specific before, during, and after plan from saved plants, stages, Growing Spaces, recent watering, observed rain, forecast risks, caretaker availability, and trip length',
 'Caretaker handoffs now identify the exact plant or Growing Space, date, action, what to check first, what not to do, weather exceptions, urgency, completion state, and notes',
 'Vacation tasks reuse matching Chore Board work instead of creating duplicate reminders, preserve manually edited instructions during forecast changes, and keep completed trip history when a plan closes',
 'Smart Watering, Vacation Mode, the Garden Bulletin, and the Chore Board now share stronger duplicate keys so the same action is not repeated through disconnected cards',
 'Planting Desk and Indoor Growing now reuse exact packet instructions, owned-seed status, calculator results, available Growing Spaces, expected emergence, seed usage, and the existing Plant Journey',
 'Garden Shopping List handoffs now retain crop, variety, brand, quantity, reason, linked recommendation or calculator, intended Growing Space, timing, priority, and already-owned status while preventing duplicates',
 'Harvest and issue forms now prefill the selected plant, variety, Growing Space, date, stage, and packet context instead of asking for known information again',
 'Photo workflows now distinguish packet text recognition from ordinary stored photos; plant, issue, harvest, stage, and Growing Space photos are not described as analyzed unless analysis actually occurred',
 'Spacing, soil, frost-date, seed-quantity, and measurement results can now be saved and applied to Growing Spaces, Planting Desk, Indoor Growing, seed reservations, or the Garden Shopping List',
 'QR links continue to use stable record IDs after renaming and now show a safe unavailable-record screen when an old or deleted destination cannot be opened',
 'Phase 5 shared sync was not started, and packet recognition remains best-effort because not every photo or official online product can be identified automatically'
];
