# Phase 4.7.4 Defect Ledger

Baseline: `5bc0bffda3f7c07fa23067ad478efc9849340fca`

This ledger remains open until the strict second regression and live-production verification fill the final result columns.

| Defect | Severity | Screen / workflow | Reproduction | Root cause | Correction | Regression protection | Local result | Production result |
|---|---|---|---|---|---|---|---|---|
| VIS-001 | P1 | Today hero identity | Open Today at 320–430px; garden subtitle crossed the sun/rays and competed with the bell | Identity and illustration shared the same unrestricted hero area | Reserved upper-left cream-backed identity block, dark text, explicit bell clearance, moved sun/ray group | `verifyPhase474Hero.mjs` at 320/375/390/430/768/1200 | Passing | Pending |
| CSS-001 | P1 | Phase 4.7.3 final styling | Final smoothing stylesheet existed but was not explicitly imported after the legacy cascade | Release-specific CSS was not part of the guaranteed entry-point order | Explicitly import Phase 4.7.3 and Phase 4.7.4 styles after `styles.css` | `phase474SourceQuality.test.js` | Passing | Pending |
| NAV-001 | P1 | Secondary pages / refresh | Open a secondary page and refresh or attempt `?page=admin-about`; app returned to a different state | Page ownership existed only in React state/local storage; startup also reset page to Today | Registered `?page=` routes, aliases, popstate handling, URL sync, record-query preservation; removed unconditional launch reset | `phase474PageRouting.test.js`, whole-app direct-route checks | Passing | Pending |
| DATA-001 | P1 | Growing Space edit lifecycle | Create Container Planter or Potato Grow Bag, reopen Edit; type and conditional fields were incomplete or generic | Edit form had an obsolete hand-written type list separate from create form | Shared `GROWING_SPACE_TYPES`; complete conditional edit fields; type-safe hidden-value cleanup | `phase474GrowingSpaceTypes.test.js`, critical lifecycle journey | In progress | Pending |
| TEXT-001 | P2 | Seed Department | Open packet form; germination placeholder displayed broken punctuation | Mojibake string `7â€“14 days` in source | Corrected to `7–14 days`; source-wide encoding gate | `phase474SourceQuality.test.js` | Passing | Pending |
| A11Y-001 | P2 | Growing Spaces | Inspect icon-only back, move-up, move-down, and close controls | Controls relied on icon shape without accessible names | Added contextual `aria-label` values | Whole-app visible-action audit | Passing at 390px | Pending |
| VIS-002 | P3 | Growing Spaces / labels | Measure detail tabs, move controls, and label-selection controls on phone | Several targets were below practical touch size | Enforced 40–44px minimum targets in Phase 4.7.4 stylesheet | Whole-app touch-target audit | Passing at 390px | Pending |
| TASK-001 | P1 | Chore Board manual reminders | Create a manual task; no Edit or Delete lifecycle was available | Manual reminders only supported add/status actions | Added edit form, stable-ID update, confirmation, soft delete, and completion cleanup | Critical chore lifecycle journey | In progress | Pending |
| DATA-002 | P1 | Destructive record actions | Remove space/plant/packet; confirmation and relationship safety were inconsistent | Destructive controls called soft-delete actions directly; spaces could be removed with active plants | Confirm plant/packet/empty-space removal; block space removal while active plants remain linked | Critical lifecycle journey | In progress | Pending |
| DATA-003 | P1 | Add Space, Add Planting, Add Task | Rapidly activate Save twice | Forms depended on modal closure timing rather than an explicit submission lock | Added `useRef` one-submission locks; Seed Department retained existing lock | Critical repeated-activation journey | In progress | Pending |
| LABEL-001 | P2 | Potato Grow Bag create/edit | Create form said “Bag size”; edit form said “Grow bag size” | Duplicate form implementations used inconsistent copy | Standardized both to “Grow bag size” | Exact conditional-field browser assertions | In progress | Pending |
| TEST-001 | Internal | Certification polling | First lifecycle run falsely reported a saved record missing | Browser-evaluated predicate lost Node closure values and threw before persistence settled | Poll local storage from Node with captured IDs/names | Focused critical journey | Corrected | Not applicable |
| TEST-002 | Internal | Conditional-field assertions | Fuzzy label lookup matched “Grow bag size” when searching “Container size” | Playwright default substring matching | Exact label locators | Focused critical journey | Corrected | Not applicable |

## Current release status

No defect is closed for production until the exact final build passes the strict all-width regression and the live Render verifier.
