# Phase 4.7.5 — Garden Center and Tool Shed Navigation Lock

Baseline: Phase 4.7.4 certified `main` at `0d4881b23e4885680b5bc9993ee19b6f0a81227b`.

## Locked information architecture

### Garden Center

- Seed Department
- Planting Desk
- Growing Spaces
- Indoor Growing
- Garden Chore Board

Shopping List, Vacation Mode, and Garden History are owned by Tool Shed → Records & Extras and retain their existing routes and stored collections.

### Tool Shed

- Calculators & Utilities: 4 direct destinations
- Weather & Timing: 3 direct destinations with distinct weather modes
- Records & Extras: 4 direct destinations

Section headings are visual labels only. No accordion, drawer, folder, or intermediate category action remains.

## Header contract

Today retains the approved illustrated hero and Phase 4.7.4 identity-safe positioning. My Garden retains its primary garden header. Full-page supporting destinations use the shared compact secondary-header system.

## Safety contract

No collection name, stable record ID, relationship, backup format, attribution field, weather calculation, seed-analysis behavior, or Phase 4.7.4 lifecycle protection is changed by this phase.

The actual committed grow-bag create form carries the approved `Grow bag size` label. The committed lifecycle journey now seeds local data once per browser context, preserves records across direct-page navigation and refresh, uses exact field locators, interacts with Hilling stage as a select, and opens completed-task History before Undo. No application control or persistence rule was weakened for testing.

## Release gates

| Gate | Result |
|---|---|
| Complete unit and integration suite | Passing on corrected source |
| Production build | Passing on corrected source |
| Phase 4.7.4 interconnected lifecycle | Full committed persistence-safe rerun in progress |
| Phase 4.7.4 PWA, direct routes, and printables | Pending lifecycle gate |
| Garden Center and Tool Shed at 320/375/390/430/768/1200 | Pending lifecycle gate |
| Screenshot review at 320/390/768 | Pending |
| Seed Packet Intelligence paid requests during navigation QA | Must remain 0 |
| Live Render assets and 390px mobile navigation | Pending merge |

Phase 5 work remains excluded until every gate and the live production verifier pass.
