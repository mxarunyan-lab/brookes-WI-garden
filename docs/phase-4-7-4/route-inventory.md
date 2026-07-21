# Phase 4.7.4 Route Inventory

Baseline: `5bc0bffda3f7c07fa23067ad478efc9849340fca`

The application uses an internal `page` registry rather than a path router. `bed` and `gardenLabel` query parameters provide direct record entry. Initial results are intentionally marked pending until browser exercise is complete.

| Route ID | Path / entry | Screen | Primary area | Normal entry | Direct URL | Required state | Empty / error handling | Initial result |
|---|---|---|---|---|---|---|---|---|
| today | `/` | Today | Today | Bottom navigation | Root only | None | Caught-up, weather error | Pending |
| garden | internal `garden` | Garden / Growing Spaces | Garden | Bottom navigation | No page URL | None | Empty spaces supported | Pending |
| center | internal `center` | Garden Center | Center | Bottom navigation | No page URL | None | Department counts | Pending |
| tools | internal `tools` | Tool Shed | Tool Shed | Bottom navigation | No page URL | None | Drawers | Pending |
| more | internal `more` | More | More | Bottom navigation | No page URL | None | Settings drawer | Pending |
| weather | internal `weather` | Weather workspace | Tool Shed / Today | Today or Tool Shed | No page URL | Weather optional | Loading, stale, error | Pending |
| chores | internal `chores` | Garden Chore Board | Center | Garden Center / Today | No page URL | Tasks optional | Empty queues | Pending |
| plan-plant | internal `plan-plant` | Planting Desk | Center | Garden Center | No page URL | Seeds optional | Empty queues | Pending |
| vacation | internal `vacation` | Vacation Mode | Center | Garden Center | No page URL | Plan optional | Empty trip | Pending |
| shopping-list | internal `shopping-list` | Garden Shopping List | Center | Garden Center | No page URL | Items optional | Empty list | Pending |
| indoor | internal `indoor` | Indoor Growing | Center | Garden Center | No page URL | Indoor records optional | Empty sections | Pending |
| memory | internal `memory` | Garden History | Center | Garden Center | No page URL | History optional | Empty history | Pending |
| seed-tools | internal `seed-tools` | Seed Department | Center | Garden Center | No page URL | Packets optional | Boundary + empty state | Pending |
| spacing-calculator | internal | Spacing Calculator | Tool Shed | Utilities drawer | No page URL | Optional packet/space | Form state | Pending |
| soil-calculator | internal | Soil & Container Calculator | Tool Shed | Utilities drawer | No page URL | Optional space | Form state | Pending |
| frost-calculator | internal | Frost & Planting Dates | Tool Shed | Utilities / Frost tool | No page URL | Profile dates | Form state | Pending |
| seed-quantity-calculator | internal | Seed Quantity Calculator | Tool Shed | Utilities drawer | No page URL | Packet optional | Form state | Pending |
| garden-measurements | internal | Garden Measurements | Tool Shed | Utilities drawer | No page URL | None | Form state | Pending |
| printable-pack | internal | Printable Garden Pack | Tool Shed | Notes & Printables | No page URL | Records optional | Print empty handling | Pending |
| labels | internal | Plant Labels | Tool Shed | Notes & Printables | No page URL | Records optional | Empty labels | Pending |
| seed-labels | internal | Custom / Seed Labels | Tool Shed | Alias / stored links | No page URL | Records optional | Empty labels | Pending |
| profile | internal alias | More alias | More | Legacy alias | No page URL | None | Renders More | Pending |
| admin-profile | internal | Garden and Gardeners | More | Settings drawer | No page URL | Profile | Form | Pending |
| admin-location | internal | Location and Frost Dates | More | Settings drawer | No page URL | Profile | Form | Pending |
| admin-notifications | internal | Notification Settings | More | Settings drawer | No page URL | Browser support optional | Permission states | Pending |
| admin-backup | internal | Backup and Restore | More | More card | No page URL | Garden data | Validation / rehearsal | Pending |
| admin-help | internal | Quick Help | More | More card | No page URL | None | Accordion | Pending |
| admin-whatsnew | internal | What's New | More | More card | No page URL | None | Static | Pending |
| admin-support | internal | Help and Support | More | Legacy / hidden | No page URL | Mail client optional | Mail link | Pending |
| admin-about | internal | About | More | More card | No page URL | None | Static | Pending |

## Direct record entries

| Route ID | Query | Destination | Missing record behavior | Initial result |
|---|---|---|---|---|
| record-space | `?bed=<spaceId>` | Garden, selected Growing Space | Record unavailable modal | Pending |
| label-space | `?gardenLabel=space:<id>` | Garden, selected Growing Space | Record unavailable modal | Pending |
| label-plant | `?gardenLabel=plant:<id>` | Plant Journey modal | Record unavailable modal | Pending |
| label-tray | `?gardenLabel=tray:<id>` | Indoor Growing record | Record unavailable modal | Pending |
| label-pod | `?gardenLabel=pod:<id>` | Indoor Growing record | Record unavailable modal | Pending |
| invalid-label | invalid `gardenLabel` | Today + unavailable modal | Safe fallback expected | Pending |

## Modal-only routes

`managePlant`, `addPlant`, `addSpace`, `soilCheck`, `seasonalChore`, `greenhouseCheck`, `weatherAlert`, `recordUnavailable`, and Plant Confirmation are inventoried as modal workflows rather than independent URLs.

## Initial navigation findings

- `NAV-001`: state-driven secondary pages are not bookmarkable or refreshable as direct page URLs. Browser verification will determine severity and the safest compatibility correction.
- `NAV-002`: `admin-support` and `seed-labels` exist in the page registry but may have no current visible normal-navigation entry. Browser and action inventory will determine whether they are legacy compatibility routes or obsolete dead paths.
