# python-fastapi-leaky

Intentionally NON-COMPLIANT test material for the kvkk-audit skill. Not a real application. All
data and keys are fake.

Expected verdict: `serious_risk` (see `expected-findings.json`).

Planted issues:

- Patient records with a `diagnosis` field (special-category health data, `KVKK-SP-001`) in `app/models.py`.
- The diagnosis column is plain text, with no encryption (`KVKK-SEC-004`).
- Exports are uploaded to an S3 bucket in `us-east-1` with a public-read ACL (`app/storage.py`).
  The foreign region is `KVKK-XB-001`, escalated to `high` because special-category data goes there;
  the public ACL raises `KVKK-SEC-004` to `critical`, which makes the verdict `serious_risk`.

Paths in `expected-findings.json` (`file`) are relative to this example's root, with `/` separators.
