# node-express-leaky

Intentionally NON-COMPLIANT test material for the kvkk-audit skill. Not a real application. All
data, keys and hosts are fake (`example.com`, `sk_test_FAKE_...`, `AKIA_FAKE_...`).

Expected verdict: `serious_risk` (see `expected-findings.json`).

Planted issues:

- Sign-up collects TCKN, e-mail and phone (`src/routes/auth.js`, `public/register.html`).
- One checkbox bundles terms, privacy notice, KVKK explicit consent and marketing permission, with no
  separate marketing opt-in (`KVKK-CON-001`, `KVKK-IYS-001`) and no privacy-notice link (`KVKK-NOT-001`).
- E-mail written to the log (`KVKK-LOG-001`).
- Passwords hashed with MD5, and a legacy login path stores and compares plaintext passwords
  (`KVKK-SEC-001`; plaintext is what makes it `critical`, hence `serious_risk`).
- Partner API called over `http://` (`KVKK-SEC-002`).
- Keys hard-coded in `src/config.js` (`KVKK-SEC-003`).
- Sentry and Google Analytics, the latter fired before consent (`KVKK-XB-001`, `KVKK-CK-001`).
- No account deletion (`KVKK-RET-002`), no retention job (`KVKK-RET-001`), no data-request channel (`KVKK-DSR-001`).

Paths in `expected-findings.json` (`file`) are relative to this example's root, with `/` separators.
