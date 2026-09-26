# PROP-1 — PM-01 closeout

**Status:** MERGED  
**PR:** https://github.com/Linearthrone/Unitview_5.1.5c/pull/2  
**Merge:** `11754bf` on `master` (2026-09-06, LinearThrone / Linearthrone)

## Lock (unchanged)

1. Encrypted `phi.vault.json` is the 5.x store. No SQLite this program.
2. Epic stays sandbox fixtures.
3. Decrypt/parse failure → login/main screen + banner. Vault not overwritten. No vacant-room seed.

## Shipped

Fail-closed load, atomic/serialized saves, one board autosave snapshot, honesty docs. Unit tests 21/21. Workstation still the proof that a corrupt vault’s bytes stay unchanged.

## Next

Next free proposal `N` is **2**. No new tickets from this closeout.
