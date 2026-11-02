---
name: kvkk-audit
description: "Audits a codebase for KVKK (Turkish data protection law, Law No. 6698) and tells the developer whether the app looks ready to launch in Turkey without personal-data issues. Use when the user asks for a KVKK audit, check or compliance review, a Turkish data protection or privacy review of their code, 'can I launch in Turkey?', 'is my app KVKK compliant?', or in Turkish: 'KVKK denetimi', 'kişisel veri denetimi', 'KVKK uyumlu mu?', 'Türkiye'de yayına çıkabilir miyim?'. Writes kvkk-report/report.md and kvkk-report/report.json with a verdict, a personal-data inventory, findings with official legal references and a checklist. A technical pre-screen, not legal advice."
license: MIT
---

# KVKK Audit

Audit the project in the current working directory against KVKK (Kişisel Verilerin Korunması
Kanunu, Law No. 6698) and its secondary regulations. Only KVKK — not GDPR. The result is a verdict
(`serious_risk`, `fixes_needed` or `looks_ready`) plus a report the developer can act on.

## When to use

- The user asks whether their app can launch in Turkey, is KVKK compliant, or wants a KVKK /
  Turkish data-protection / kişisel veri audit of their code.
- The user asks for a detailed KVKK report (`detailed`, `detaylı`, `--detailed`) or re-runs the
  audit after filling in the checklist of a previous report.

Do not use it for GDPR or other laws, or for writing legal documents.

## Ground rules

- **Read-only audit.** Do not change the user's code. Only create files in `kvkk-report/`.
- **Never drop a doubtful finding.** Report it with `certainty: "needs_verification"`.
- **Never show raw personal data or secret values** in chat or in the report. Snippets go only into
  the draft and are masked when the report is finalized (see Step 5 of the workflow). The script
  masks only some formats: never copy a secret value into a snippet (use `***` or omit it).
- **Scripts are optional helpers.** If Node.js is missing or a script fails, continue by hand. Never
  stop the audit because of a script.
- Every report ends with the "not legal advice" (hukuki görüş değildir) disclaimer, even a
  `looks_ready` one.

## Paths

- **Skill directory** (`SKILL_DIR`): the folder that contains this `SKILL.md`. All paths below
  (`references/…`, `scripts/…`, `schema/…`) are relative to it. Resolve it to an absolute path
  once, before Step 0.
- **Project root**: the current working directory, which is the project being audited. Run every
  script from there. Output goes to `kvkk-report/` in the project root.

## Steps

Follow [references/workflow.md](references/workflow.md) step by step. It is the full procedure;
this is only the overview.

- **Setup**: resolve `SKILL_DIR`, check for Node.js, pick the report language and the mode
  (`summary` by default, `detailed` on request).
- **Step 0 — Applicability and role**: does KVKK apply, and is the project a data controller
  (veri sorumlusu) or a data processor (veri işleyen)? Ask at most one question; otherwise assume
  `controller` and say so.
- **Step 1 — Discovery**: stack, data layer, endpoints, forms, third-party SDKs, logging, infra,
  privacy texts. Optionally run `scripts/scan-patterns.mjs` for candidates.
- **Step 2 — Personal-data inventory**: what personal data is collected, where it is stored and
  where it goes; mark special categories.
- **Step 3 — Apply the rules** in [references/rules/](references/rules/) to the inventory and the
  code, with role conditions.
- **Step 4 — Verify evidence**: confirm each finding in the code or mark it `needs_verification`.
- **Step 5 — Report**: write `kvkk-report/draft.json`, run `scripts/finalize-report.mjs` to produce
  `kvkk-report/report.json`, then write `kvkk-report/report.md` from it and tell the user the
  verdict and the file paths.

## References

| File | Use it for |
|---|---|
| [references/workflow.md](references/workflow.md) | The step-by-step procedure (read first). |
| [references/rules/](references/rules/) | The rule catalog: one file per area, each rule with ID, legal basis, what to look for, patterns, needs-verification cases and the fix. |
| [references/severity.md](references/severity.md) | Severity meaning, certainty, verdict rule, cross-border exception, role handling. |
| [references/checklist.md](references/checklist.md) | Questions the code cannot answer; copied into every report. |
| [references/report-template.md](references/report-template.md) | Layout of `report.md` and the disclaimer text. |
| [references/language.md](references/language.md) | Report language choice and the KVKK term glossary. |
| [references/sources.md](references/sources.md) | Official sources and their last verification date. |
| [schema/report.schema.json](schema/report.schema.json) | The `report.json` format. |

Scripts (Node.js 18+, no dependencies):

| Script | Does |
|---|---|
| `scripts/scan-patterns.mjs <projectDir>` | Prints candidate matches as JSON. Candidates are leads, not findings. |
| `scripts/finalize-report.mjs <draft.json> --mode summary\|detailed --out kvkk-report` | Masks snippets, groups findings (summary), sets the verdict, validates and writes `report.json`. |
| `scripts/detect-language.mjs` | Prints the OS language code, used when the conversation language is unknown. |
