# Epic FHIR and HIPAA technical safeguards

UnitView can now pull an inpatient census from Epic FHIR and applies workstation-level HIPAA Security Rule technical safeguards. This is **not** a legal certification. A covered entity still needs policies, workforce training, a risk analysis, and a Business Associate Agreement before using the app with real PHI.

## Get data from Epic

1. Create a **Backend Services** app at [fhir.epic.com](https://fhir.epic.com/).
2. Request Patient, Encounter, Condition, Flag, AllergyIntolerance, NutritionOrder, and Location read scopes.
3. Generate an RSA key pair (RS384) and upload the public JWKS:

   ```bash
   node scripts/generate-epic-jwks.mjs
   ```

4. In **Admin → Epic FHIR**:
   - Set auth mode to **SMART Backend Services**
   - Paste the non-production client ID
   - Paste the private key PEM (it is stored only in the encrypted desktop vault)
   - Set the unit **Location** FHIR ID so Encounter search is scoped to this floor
   - Set patient data source to **Epic FHIR census**
5. Open a unit and click **Sync Epic census**, or just enter the unit — census sync runs automatically when the data source is Epic.

Until credentials are issued, leave auth mode on **Epic-shaped sandbox fixtures**. That pack now includes the three named Epic sandbox people (Lopez / Lin / Roberts on rooms 812–814) plus generated inpatients for rooms **801–840**, so **Sync Epic census** can fill a typical 30–40 bed unit.

How to fill most of a unit:

1. Admin → **Epic FHIR** → Auth mode **Epic-shaped sandbox fixtures**. Patient data source **Epic FHIR census**. Save.
2. Open the unit (rooms should already exist — vacant is fine).
3. Click **Sync Epic census**. Records match by room number first, then leftover census occupies remaining vacant beds.
4. To fill from local demo charts instead of FHIR-shaped names, use Admin → **Insert mock patients**. That path does not talk to Epic.

Live Backend Services still need a real client ID, private key, and the unit **Location** FHIR ID. Open Epic sandbox patients at fhir.epic.com only apply when auth mode is live and Encounter search returns them.

Default sandbox endpoints:

- FHIR R4: `https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4`
- Token: `https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token`
- MRN system (sandbox): `urn:oid:1.2.840.114350.1.13.0.1.7.5.737384`

Live calls use HTTPS only. The private key never leaves the Electron main process.

## Technical safeguards implemented

| Control | What UnitView does |
| --- | --- |
| Unique user identification | Employee-number login, roles, wall-display PHI hiding |
| Emergency access / least privilege | Role capabilities already hide identifiers from WALLDISPLAY |
| Desktop wallpaper map | Optional live unit-map wallpaper defaults to redacted identifiers; start/stop is audited |
| Automatic logoff | 15-minute idle timeout with a 2-minute warning |
| Encryption at rest | AES-256-GCM vault in the user-data directory; OS keychain wraps the master key when available |
| Encryption in transit | FHIR and token URLs must be HTTPS |
| Audit controls | Append-only log of sign-in, PHI view, admit/discharge, export, FHIR sync. Details are redacted |
| Integrity | Authenticated encryption (GCM) for the local store |
| Access control | PBKDF2 password hashes, lockout after 5 failures, password policy, forced change on first-run accounts |
| Transmission / client hardening | Context isolation, sandbox, production CSP, DevTools hidden outside development |

## First-run accounts

Seeded accounts (`admin` / `1001` / `1002` / `wall`) still exist so the app can be installed, but they **must change password** on first sign-in. Default secrets are no longer shown on the admin screen.

## What you still have to do

- Sign a BAA with anyone who hosts or supports the app
- Complete a Security Rule risk analysis
- Restrict physical access to nursing-station PCs
- Turn on workstation disk encryption (BitLocker)
- Replace first-run accounts and disable unused users
- Register the production Epic client ID with the health system
- Keep audit logs according to your retention policy
