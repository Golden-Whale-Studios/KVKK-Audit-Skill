# node-clean

Compliant-by-design test material for the kvkk-audit skill. Not a real application; a small
reference of what the catalog expects to see. No `critical`, `high` or `medium` findings are expected.

Expected verdict: `looks_ready` (see `expected-findings.json`). Findings of `info` or `low` severity,
such as the personal-data inventory, are fine.

What it does right:

- Passwords stored with bcrypt; login uses the bcrypt verify function.
- Log lines carry only a user id and a masked contact value.
- Sign-up page links to the privacy notice and has separate, unticked boxes for explicit consent
  and for commercial messages.
- Account deletion route and a scheduled job that purges accounts inactive beyond the retention period.
- Login attempts are limited (5 failures, then a 15-minute lock per account).
- Only domestic infrastructure and no third-party tracking.

Out of scope for this example: the `/aydinlatma-metni` and `/kvkk-basvuru` pages are linked but not
implemented, and authentication is a stand-in (`requireSelf` trusts an `x-user-id` header).

Paths in `expected-findings.json` (`file`) are relative to this example's root, with `/` separators.
