# Printable shift assignment — PRINT2 locked direction

Liked base: room-sorted roster (PRINT2). Refined sheet for PROP-3/4 print work.

## Locked content (LinearThrone)

### Unit setup (create/edit unit) — persistent contacts

Configured once when creating/editing a unit; print on every sheet; **do not change per shift**:

| Field | On sheet |
| --- | --- |
| Charge nurse Spectra and/or phone/ext | Header with charge name |
| Unit clerk / Front desk number | Header, standard or slightly smaller |

Mockup: `review-u1-unit-setup-contacts.png`

### Header (top of sheet)

1. **Unit designation** — large, bold, dominant (e.g. `MED-SURG 4 WEST`)
2. **Date** + **Day / Night shift** clearly distinguished
3. **Charge nurse** + Spectra (+ phone/ext from unit setup)
4. **Unit clerk / Front desk** — from unit setup; standard or slightly smaller

### Table columns

| Column | Notes |
| --- | --- |
| Room | Primary sort |
| Patient | Workstation / print only (not wall) |
| Nurse | Assigned RN |
| Nurse Spectra | Spectralink for that nurse |
| PCT | Assigned PCT if any |
| PCT Spectra | Spectralink for that PCT |
| Flags | Safety text; **isolation must name type**: Contact / Airborne / Droplet (not generic “Iso”) |

### Orientation

- Must support **portrait and landscape**
- Same fields; landscape uses width for Spectra + PCT columns without crushing flags

## Mockups

| File | Orientation |
| --- | --- |
| `review-print2b-roster-portrait.png` | Portrait |
| `review-print2b-roster-landscape.png` | Landscape |
| `review-s5-print2-orientation-preview.png` | In-app preview with Portrait/Landscape toggle |

Supersedes `review-print2-room-roster.png` as the direction for the room roster PDF (PRINT1 nurse-centric sheet remains optional secondary). See also `PRINT-LAYOUTS-SPEC.md` for PRINT3.
