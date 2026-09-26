---
type: roster
project: UnitView
source: Linearthrone/SoulCore.AI
updated: 2026-09-05
---

# UnitView agent roster (from SoulCore.AI)

Role packs imported from [Linearthrone/SoulCore.AI](https://github.com/Linearthrone/SoulCore.AI) `Agents/` so this repo can run the same file-based team as House Victoria.

Activate a seat with `@Agents/{ID}.md`. Tickets live in `docs/agents/tasks/`. Reports live in `docs/agents/reports/`.

## Callsign

| Callsign | ID | Role |
| --- | --- | --- |
| **TINA** | **PM-01** | Project Manager + Architect + Product Manager + AI-CTO. Master control. |

Start here: [`PM-01.md`](./PM-01.md) → [`PM-01-EN.md`](./PM-01-EN.md) + [`PM-01-Work-Standards.md`](./PM-01-Work-Standards.md).

## UnitView execution seats

| ID | Role | Owns in this repo |
| --- | --- | --- |
| **FED-01** | Frontend | `renderer/` React/Electron UI |
| **BED-01** | Backend | Electron main (`src/`, `main` process), IPC, services |
| **DBD-01** | Database | Encrypted vault persistence, schema, seed data |
| **SEC-01** | Security | Auth, HIPAA/Epic FHIR safeguards, vault, audit |
| **OPS-01** | Operations | Windows build/installer, release verify |
| **QA-01** | QA | Smoke, regression, issue files — **no product code edits** |
| **SLOP-01** | Slop auditor | Post-QA duplicate/alias/slop audit — **read-only** |
| **TT-01** | Thinktank | Ideas + stuck-ticket unblock → proposals, never execution tickets |
| **DEV-01** | Legacy combined | Historical UnitView `to-DEV01` only. **Do not open new DEV-01 tickets.** |

## SoulCore machine seats (not default UnitView owners)

Keep these playbooks for LinearThrone's shared machines. Do **not** ticket them for UnitView product work.

| ID | Scope |
| --- | --- |
| **REX-01** / **REX-01-SHADOW** | Unreal LiveCoding / Kayleigh possess (House Victoria body) |
| **VBOX-01** | `victoria-sandbox` VirtualBox Ubuntu |
| **OPS-HOME** | Home PC SoulCore.Host / ChatDesktop |
| **OPS-TAB** | Tablet SMS/MMS gateway |

## Collaboration directories

```text
docs/agents/
├── tasks/                  # pending tickets (active queue)
├── reports/                # pending review reports
├── issues/                 # QA-filed issues
├── log/                    # historical UnitView archive (pre-PROP)
├── unexecuted_proposals/   # TT-01 proposals
└── PROP_NUMBERING.md       # PROP registry
```

New TT-sourced work uses `PROP-{N}.{M}-PM01-to-{ROLE}.md`. Legacy UnitView chores keep `TASK-{date}-{ID}-PM01-to-{ROLE}.md`.
