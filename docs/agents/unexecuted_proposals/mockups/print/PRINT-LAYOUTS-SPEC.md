# Printable layouts — locked print direction

## Unit setup (create/edit unit) — persistent contacts

Set once in unit setup; printed on every shift sheet; **do not change per shift**:

| Field | Use on sheet |
| --- | --- |
| Charge nurse Spectra (and/or phone/ext) | Header with charge name |
| Unit clerk / Front desk number | Header, standard or slightly smaller |

Mockup: `review-u1-unit-setup-contacts.png`

---

## PRINT2b — Room roster (portrait + landscape)

Full field list: `PRINT2-SPEC.md`.

---

## PRINT3 — Nurse blocks (landscape)

Additional landscape layout. Same header family as PRINT2b (including persistent charge/front-desk numbers from unit setup).

### Header

1. **Unit designation** — large, bold, dominant  
2. **Date** + **Day / Night shift**  
3. **Charge nurse** + Spectra (+ phone/ext from unit setup)  
4. **Unit clerk / Front desk** — slightly smaller  

### Body

**Nurse blocks (primary)**  
Each assigned nurse is a rectangle block:

- Title: nurse name + role + Spectra  
- Interior: assigned rooms as chips/cells grouped in that block  

**PCT blocks (smaller)**  
Compact rectangles, three lines:

1. Name  
2. Spectra  
3. Room assignment range (e.g. `812–826`)  

**Alerts column**  

- DNR / DNI (with rooms)  
- Name alerts (with rooms)  

**Shift strip (small area)**  

- Shift call-outs  
- Pulled / on-call staff  

### Orientation

- **Landscape** primary for PRINT3  
- Portrait not required for PRINT3 unless later requested  

### Mockups

| File | What |
| --- | --- |
| `review-print3-nurse-blocks-landscape.png` | Full landscape sheet |
| `review-print3-blocks-detail.png` | Nurse / PCT / alerts / call-outs detail |
| `review-s6-print-layout-picker.png` | Roster vs nurse-blocks picker |

---

## Print menu

Offer both:

- **Assignment roster** (PRINT2b) — portrait or landscape  
- **Nurse blocks** (PRINT3) — landscape  
