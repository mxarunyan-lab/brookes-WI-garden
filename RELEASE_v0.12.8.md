# v0.12.10 — Mobile Acceptance & Working Bed Labels

## Exact QR bed routing
- Every QR code now carries the stable bed ID and opens a read-only profile for that exact bed.
- Public bed profiles show plant names, varieties, quantities, stages, and public-safe care information.
- Private notes, household activity, and edit controls stay out of the public view.
- Missing or retired bed IDs show a clear recovery screen.
- Owners can move from the scanned profile into the editable bed workspace on the local device.

## Laminate-ready printing
- Single and multi-label printing use a dedicated print-only sheet.
- Each label includes a large high-contrast QR code, bed name, Runyan Garden branding, scan instructions, bed code, and cut border.
- Printing no longer marks a label as printed automatically.
- Labels can be marked installed after laminating and mounting.
- Test QR and Copy Exact Link actions use the same permanent bed URL.

## Mobile acceptance
- Added iPhone safe-area spacing for Safari and installed-app use.
- Added bottom-navigation clearance to long pages.
- Modals scroll within the available viewport and keep actions reachable.
- Form controls use keyboard-safe mobile sizing.
- Long labels, bed names, and buttons wrap instead of clipping.

## Workflow integrity
- Plant creation confirms plant name, variety, quantity, and exact destination.
- Confirmation offers View Bed and Add Another Plant actions.
- Bed move, hide, restore, and remove controls now perform their promised data changes.

Version: 0.12.10
Build: mobile-acceptance-working-bed-labels
Offline cache: v26
