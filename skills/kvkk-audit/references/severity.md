# Severity, certainty and verdict

These rules are fixed. Rule files give each rule a **default** severity; this file says how a
finding's final severity, its certainty and the overall verdict are decided. `finalize-report.mjs`
computes the verdict with exactly the logic below; when scripts cannot run, apply it by hand.

## Enums (identical in every language; JSON values stay in English)

- Severity: `critical`, `high`, `medium`, `low`, `info`.
- Certainty: `confirmed`, `needs_verification`.
- Verdict: `serious_risk`, `fixes_needed`, `looks_ready`.

## Verdict rule

1. If any finding has severity `critical` → verdict `serious_risk`.
2. Otherwise, if any finding has severity `high` or `medium` → verdict `fixes_needed`.
3. Otherwise (only `low` / `info` findings, or none) → verdict `looks_ready`.

Findings with certainty `needs_verification` count toward the verdict exactly like `confirmed`
findings of the same severity (do-not-miss principle). Every report — including a `looks_ready`
one — shows the checklist and the "not legal advice" (hukuki görüş değildir) disclaimer.

## Severity meaning

| Severity | Use when |
|---|---|
| `critical` | Personal data is exposed or trivially exposable now: plaintext or reversibly stored passwords, a live production secret granting access to personal data committed to the repository, special-category data (özel nitelikli kişisel veri) publicly reachable or sent in cleartext. |
| `high` | A clear legal obligation is unmet in code and it affects many data subjects or special-category data: missing or bundled explicit consent (açık rıza) where consent is the basis, personal data over plain `http://`, weak password hashing. |
| `medium` | An obligation is likely unmet but the impact is limited or depends on context: missing privacy-notice (aydınlatma) link, no retention/erasure path, personal data in logs, tracking before cookie consent, no data-subject request channel. |
| `low` | Hygiene issue with small impact, or an obligation from a related law outside KVKK proper (for example commercial electronic messages). |
| `info` | Inventory and context: what personal data exists, which services are abroad. Never changes the verdict. |

Rule files may tell you to raise or lower a finding from its default (each rule says when).
Never lower below `info`, and never drop a finding.

## Certainty

- `confirmed` — the code clearly shows the issue (you read the lines; the fix is missing).
- `needs_verification` — the scanner or your reading suggests the issue, but something outside the
  code could resolve it (a config value, an external service, a server setting, a document). Each
  rule's "Needs-verification when" section lists these cases. **Never drop a finding because of
  doubt; report it as `needs_verification`.**

## Exception: KVKK-XB-001 (cross-border services)

- All services that may receive personal data abroad are reported as **one** grouped finding,
  `KVKK-XB-001`, listing every service (name, data types, evidence locations).
- Its default severity is `info`, so on its own it does not move the verdict to `fixes_needed`.
  The legal basis for the transfers (adequacy decision, standard contract notified to the
  Authority, or another md. 9 route) is asked in checklist item `CL-XB-SAFEGUARDS`.
- Escalate `KVKK-XB-001` to `high` when there is evidence that special-category data
  (özel nitelikli kişisel veri, KVKK md. 6) goes to one of those services; set
  `specialCategoryEvidence: true` on that service.

## Role

The audited project is a data controller (`controller`, veri sorumlusu) or a data processor
(`processor`, veri işleyen). If the role cannot be determined, assume `controller` and say so in
the report (`roleAssumed: true`). Rules whose `Applies to:` is `controller` are reported for
processors only as `info` notes that the controller they serve must handle the matter.
