# android-kotlin-leaky

Intentionally NON-COMPLIANT test material for the kvkk-audit skill. Source fragments only; it is not
meant to compile. All data is fake.

Expected verdict: `fixes_needed` (see `expected-findings.json`).

Planted issues:

- The phone number is written to Logcat with `Log.d` (`KVKK-LOG-001`, `MainActivity.kt`).
- Firebase Analytics is initialised at app start, before any consent (`KVKK-CK-001`, `KVKK-XB-001`).

Nothing here is `critical`: no secrets, no special-category data, no weak password handling.

Paths in `expected-findings.json` (`file`) are relative to this example's root, with `/` separators.
