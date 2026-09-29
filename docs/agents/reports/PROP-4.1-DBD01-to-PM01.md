# PROP-4.1 — DBD-01 → PM-01

**Status:** Pass (local)  
**Ticket:** `PROP-4.1-PM01-to-DBD01.md`

## Did

Progressive geometry lives on the existing layout row (`UnitLayoutMetadata.progressiveView`): preferred mode, template, paint cells, room pins keyed by patient id. Sanitize on read. `layoutService.saveProgressiveView` writes that field only. No second patient table.

## Evidence

`npx --yes tsx --test renderer/src/lib/progressive-view.test.ts` — 5/5 pass.
