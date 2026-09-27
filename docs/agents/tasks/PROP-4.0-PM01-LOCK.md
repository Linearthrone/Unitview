# PROP-4.0 — LinearThrone lock (2026-09-27)

Source: TT-01 `progressive-view.md` + LinearThrone directing TINA to start Progressive so the unit can be exercised and tuned.

| Q | Lock |
|---|------|
| Name | **Progressive view** |
| Clinical truth | One unit. Same rooms, assignments, census, safety flags as Command surface. Two presentations. |
| Authoring | **Admin only.** Corridor templates and/or paint, then place room pins. Nurses do not author. |
| Map | Hallway-enough, not-to-scale. **Glance-only** (no drag on the map). No blueprints / CAD. |
| Columns | **Assignable** — drop onto nurse columns writes the same nurse slots as Command surface. |
| Default | Command surface until an admin switches the unit to Progressive. |
| Wall | Same PROP-3 rules: identifiers off, clinical marks on, no idle lock. |
| Sequence | Tokens + 3.2 card language come along; do not reopen vault / SQLite / `UnitViewClient` split. |

Open question closed: columns are assignable so charge can work Progressive without flipping back to Command for every assignment.
