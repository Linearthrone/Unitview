---
type: proposal-intake
prop_id: PROP-1
prop_full: PROP-1-persistence-honesty
from: TT-01
to: PM-01
priority: P0
status: Intake — waiting LinearThrone approval before TINA tickets
created: 2026-09-05
sent_at: 2026-09-05
mode: idea
title: Persistence honesty — fail-closed vault writes before any SQLite rewrite
proposal: docs/agents/unexecuted_proposals/persistence-honesty-and-architecture-eval.md
source_ticket: docs/agents/tasks/TASK-20260905-001-PM01-to-TT01.md
assignee_role: PM-01 (TINA)
---

# PROP-1 : Persistence honesty (TT-01 → TINA / PM-01)

**For:** PM-01 (TINA). **From:** TT-01. **Mode:** `idea`.  
**Proposal:** `docs/agents/unexecuted_proposals/persistence-honesty-and-architecture-eval.md`

LinearThrone directed: thinktank first; **he approves recommendations**; then TINA evaluates as PM and executes at her discretion. **Do not issue PROP-1.M until he approves.**

## One-paragraph recommended route

The live store is already the main-process AES-256-GCM vault (`phi.vault.json`), not SQLite. The kill bugs are fire-and-forget whole-document writes, fail-open load that can seed/overwrite PHI, and services that turn store errors into empty/vacant units. **Keep the vault.** Serialize + await + atomic write; fail closed on decrypt/parse; stop seed-on-read; honest errors; fix docs. Do **not** introduce `better-sqlite3`, split `UnitViewClient`, or batch FHIR in this PROP.

## Seat dissent

None on sequencing. STRAT/CONTRA/SYS/RISK/USER all ranked vault-honesty first. SQLite is an optional later product choice, not the first engineering move. Review item that live `unit-view-client` imports tsconfig-excluded root files is **false** (imports are `components/` siblings).

## Suggested next tickets (not binding; hold for approval)

| Split | Role | One-line |
| --- | --- | --- |
| PROP-1.1 | BED + DBD | Fail-closed vault initialize |
| PROP-1.2 | BED | Serialized awaited atomic `saveSecureStore` |
| PROP-1.3 | FED | Fail-loud services + store-unavailable UI |
| PROP-1.4 | FED | Coalesce autosave (one persist) |
| PROP-1.5 | FED | Docs/About honesty |
| PROP-1.6 | QA | Persist regression |
| PROP-1.7 | SLOP | Post-QA audit |

## Open questions still needing LinearThrone

1. Vault stays as 5.x SoT, or SQLite this program (encrypted file)?
2. Any live Epic SMART workstation (not sandbox)?
3. Fail-closed board on decrypt fail — yes?

TT-01 does not ticket FED/BED/QA.
