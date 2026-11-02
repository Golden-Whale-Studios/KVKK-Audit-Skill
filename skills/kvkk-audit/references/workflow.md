# KVKK audit workflow

Do the steps in order. Each step ends with **Done when**: do not start the next step until you have
everything listed there. Keep short working notes as you go (no personal-data values in them);
Step 5 turns them into the report.

Paths written as `references/…`, `scripts/…` and `schema/…` are relative to the **skill directory**
(`SKILL_DIR`, the folder that contains `SKILL.md`). The **project root** is the current working
directory. Run all commands from the project root.

General rules for the whole audit:

- Do not modify the user's files. The only files you create are inside `kvkk-report/`.
- Do not read or scan these: `node_modules`, `.git`, `dist`, `build`, `vendor`, `.next`,
  `coverage`, `kvkk-report` (your own earlier output), minified files (`*.min.js`, `*.min.css`),
  binary files and files over 1 MB.
- Never paste personal data or secret values into chat. When you refer to evidence, give
  `file:line` and describe it ("an e-mail address is logged"), do not quote the value.
- A script failure never ends the audit. Every script step has a manual fallback below.

---

## Setup (before Step 0)

1. **Resolve `SKILL_DIR`.** Find the absolute path of the folder that contains `SKILL.md` (your
   agent may show it as the skill's base directory; otherwise locate `kvkk-audit/SKILL.md` on disk,
   for example under `skills/`, `.claude/skills/`, `.agents/skills/` or `.cursor/`). Below,
   `<SKILL_DIR>` means that absolute path. Use forward slashes or quote the path if it has spaces.
2. **Check Node.js.** Run `node --version`. If it prints `v18` or newer, scripts are available.
   Otherwise (not installed, older, or the command is not allowed) set "scripts: unavailable" and
   use the manual fallbacks.
3. **Pick the mode.** If the user said "detailed", "detaylı", "detaylı rapor", "full report" or
   `--detailed`, the mode is `detailed`. Otherwise it is `summary`.
4. **Pick the report language** with [language.md](language.md): the language the user writes to
   you in; if unknown (non-interactive run), the output of
   `node "<SKILL_DIR>/scripts/detect-language.mjs"`; if that is not possible, `en`.
5. **Look for a previous report.** If `kvkk-report/report.json` exists, read only its `checklist`
   array and note each item's `id` and `status`. Answers `yes`/`no` filled in by the user are
   carried into the new report (Step 5). Everything else in `kvkk-report/` will be overwritten.

**Done when** you have: `SKILL_DIR`, scripts available yes/no, mode, report language, and any
previous checklist answers.

---

## Step 0: Applicability and role

**Applicability.** KVKK applies when the software processes personal data of people in Türkiye or
targets Türkiye. Look for signals: Turkish UI text or `tr` locale files, TRY currency, Turkish phone
formats (`+90`), TCKN fields, `.com.tr` / `.tr` domains, Turkish addresses (il/ilçe), İYS, Turkish
payment providers (iyzico, PayTR), or the user saying they will launch in Turkey. Set
`project.applicability`:

- `applies` — the user said they target Turkey, or the code clearly targets Turkish users.
- `likely` — the app processes personal data and has some Turkish signals, but not conclusive ones.
- `unclear` — no signal either way. Continue the audit anyway and say so in the summary.

**Role.** Decide whether the project is a data controller (`controller`, veri sorumlusu: decides why
and how personal data is processed, e.g. a consumer app or an online shop) or a data processor
(`processor`, veri işleyen: processes data on behalf of customers, e.g. a B2B SaaS, an
API/white-label service, an agency building for a client). Use README, docs, terms, pricing pages,
multi-tenant code (tenant/organisation models, "customer's end users").

- If the evidence is clear: set `role`, `roleAssumed: false`.
- If it is unclear and you can talk to the user: ask **one** question, then stop and wait for the
  answer. For example: "Does your company decide what personal data this app collects and why (data
  controller, veri sorumlusu), or does it process data for business customers who decide that (data
  processor, veri işleyen)?" Set the answered role with `roleAssumed: false`. Do not ask anything else
  during the audit.
- If it is unclear and you cannot ask (CI, batch, or the user does not answer): `role: "controller"`,
  `roleAssumed: true`. The report must say the role was assumed.

**Done when** you have: `applicability` with a one-line reason, `role`, and `roleAssumed`.

---

## Step 1: Discovery

Build a map of the project. Read, do not run, the code.

1. **Stack**: languages, frameworks, package manifests (`package.json`, `requirements.txt`,
   `pom.xml`, `build.gradle`, `*.csproj`, `composer.json`, `Podfile`, `pubspec.yaml`, `go.mod` …).
2. **Data layer**: ORM models, schemas, migrations, SQL files, GraphQL types, mobile local storage.
3. **Entry points**: API routes and controllers, forms and sign-up/checkout pages, webhooks, jobs.
4. **Third parties**: SDKs and API clients (analytics, crash reporting, payment, e-mail/SMS, push,
   chat, AI, maps, auth), tag managers and `<script>` tags.
5. **Logging and errors**: logger configuration, request logging middleware, crash reporters.
6. **Infrastructure**: Dockerfiles, Terraform, Kubernetes, serverless config, cloud regions, `.env*`
   examples, CI files.
7. **Privacy texts**: privacy notice (aydınlatma metni), consent texts, cookie banner, terms.

**Optional scanner.** If scripts are available, run it once:

```
mkdir -p kvkk-report
node "<SKILL_DIR>/scripts/scan-patterns.mjs" . > kvkk-report/candidates.json
```

In PowerShell create the folder with `New-Item -ItemType Directory -Force kvkk-report`; in Windows
PowerShell 5.1 use `| Out-File -Encoding utf8 kvkk-report/candidates.json` instead of `>`. Each candidate is
`{patternId, ruleId, file, line, match}`. `match` is **raw source text and may contain real
personal data or secrets**: use it only to decide where to look, never copy it into chat or into a
report field. If the command fails or Node is unavailable, skip it: the manual search in Steps 2-3
covers the same ground (the "Common patterns" section of each rule file lists what to search for).

For a large repository you may split discovery by folder across sub-agents if your agent supports
them; otherwise go folder by folder.

**Done when** you have: a list of the stack, data-layer files, entry points that receive personal
data, third-party services, logging setup, infrastructure/regions and privacy texts found (or "none
found"), plus the candidates file if the scanner ran.

---

## Step 2: Personal-data inventory

Use rules `KVKK-PD-001` ([rules/personal-data.md](rules/personal-data.md)) and `KVKK-SP-001`
([rules/special-categories.md](rules/special-categories.md)).

For each kind of personal data the project collects or stores, record:

- `category` (in the report language, e.g. "Contact", "Identity", "Location", "Health"),
- `fields` (field or column names only, never values),
- `specialCategory` (`true` for özel nitelikli kişisel veri: health, biometric, genetic, religion,
  belief, union/association membership, criminal records, sexual life, race/ethnicity, political
  opinion, appearance/dress),
- `locations` (files where it is defined or stored, project-relative with `/`),
- where it goes (which services, logs or exports receive it; this feeds `KVKK-XB-001` and
  `KVKK-LOG-001`).

If the project has no personal data at all, the inventory is empty. That is a valid result: continue,
the report is usually short; the other rules (for example committed secrets) still apply.

**Done when** you have: the inventory list (possibly empty), with special categories marked and the
destinations of each data type noted.

---

## Step 3: Apply the rules

Read every rule file in [rules/](rules/) and check each rule against the inventory and the code:

| File | Rules |
|---|---|
| [rules/personal-data.md](rules/personal-data.md) | `KVKK-PD-001` |
| [rules/special-categories.md](rules/special-categories.md) | `KVKK-SP-001` |
| [rules/consent.md](rules/consent.md) | `KVKK-CON-001` |
| [rules/notice.md](rules/notice.md) | `KVKK-NOT-001` |
| [rules/retention.md](rules/retention.md) | `KVKK-RET-001`, `KVKK-RET-002` |
| [rules/security.md](rules/security.md) | `KVKK-SEC-001` … `KVKK-SEC-004` |
| [rules/logging.md](rules/logging.md) | `KVKK-LOG-001` |
| [rules/cross-border.md](rules/cross-border.md) | `KVKK-XB-001` |
| [rules/cookies.md](rules/cookies.md) | `KVKK-CK-001` |
| [rules/data-subject-rights.md](rules/data-subject-rights.md) | `KVKK-DSR-001` |
| [rules/commercial-messages.md](rules/commercial-messages.md) | `KVKK-IYS-001` |

How to apply them:

1. **Candidates are input, not output.** If you have scanner candidates, open each candidate's
   file at its line and decide whether it is a real finding. Discard only candidates that are
   clearly not personal data or not the issue (e.g. `emailTemplateId`); keep anything doubtful.
2. **Check every rule, with or without candidates.** The scanner has no patterns for several rules
   (consent, notice, retention, account deletion, data-subject requests, commercial messages,
   unencrypted special-category storage). Check them by reading the relevant code: forms, sign-up,
   user model, settings pages, privacy texts.
3. **Severity.** Start from the rule's **Default severity**, then apply the rule's raise/lower
   conditions and the meaning table in [severity.md](severity.md).
4. **Role.** Each rule has **Applies to**. If the project is a `processor` and the rule applies to
   `controller` only (`KVKK-CON-001`, `KVKK-NOT-001`, `KVKK-RET-002`, `KVKK-DSR-001`), still check it,
   but report any finding as severity `info` with a note that the controller the project serves
   must handle it. Never drop it.
5. **Cross-border.** All services abroad form **one** finding `KVKK-XB-001` (default `info`) and also
   go into `crossBorder.services`. Raise it to `high` only with evidence that special-category data
   reaches a listed service, including indirect evidence (then `needs_verification`), and set
   `specialCategoryEvidence: true` on that service. See [rules/cross-border.md](rules/cross-border.md).
6. **Missing features** (no consent, no notice link, no deletion path): cite the place where the
   feature should be (the form, the sign-up handler, the user model) as the occurrence.

For each finding, note: `ruleId`, title, severity, file and line of each occurrence, the legal
references (label + URL copied from the rule's **Legal basis**), a description of what you saw and
the recommendation (from the rule's **Recommendation**, adapted to this project).

**Done when** every rule in the table has been checked and you have, for each rule, either a list of
findings or "no issue found".

---

## Step 4: Verify evidence

For every finding from Step 3:

1. Open the file at the cited line and confirm the issue is really there and the fix is not
   elsewhere (middleware, base class, config, another layer).
2. Set `certainty`:
   - `confirmed` — you read the lines and the issue is clearly present.
   - `needs_verification` — the issue depends on something you cannot see (a config value,
     an environment variable, a server or console setting, an external document), or matches a case
     in the rule's **Needs-verification when** list.
3. **Do not delete a finding because you are unsure.** Mark it `needs_verification`; it counts toward
   the verdict like a confirmed one. Delete a finding only if you proved it wrong (for example, the
   value is not personal data at all).
4. Pick one short evidence snippet per occurrence where useful: the single relevant source line,
   at most about 200 characters.
5. **In any snippet, for every rule, never copy a secret value**: API keys and tokens (for example
   `sk_live_…`, `AKIA…`, GitHub or Slack tokens), `Basic` or `Bearer` credentials, passwords in URLs
   or connection strings (`postgres://user:PASSWORD@host`), private keys and certificates. Write the
   line with each such value replaced by `***` (`postgres://admin:***@localhost:5432/app`), or leave
   the snippet out. The finalize script now masks these common formats too (URL credentials, `Basic`, well-known
   key prefixes, PEM private keys), but it cannot recognise everything (names, addresses, unusual
   token formats), so keep this ban as defence in depth.

**Done when** every finding has a `certainty`, at least one `file:line` occurrence (or the location
where the missing feature belongs), and optional snippets with no secret values in them.

---

## Step 5: Report

### 5.1 Write the draft: `kvkk-report/draft.json`

Create `kvkk-report/` if needed and write one JSON file in the shape of
[schema/report.schema.json](../schema/report.schema.json). Snippets go **only** here, unmasked if you
copied them from source; the next step masks them. Write findings one per issue (detailed level);
the script groups them in summary mode.

```json
{
  "schemaVersion": "1.0",
  "tool": { "name": "kvkk-audit", "version": "0.1.0" },
  "generatedAt": "<current time, ISO 8601, e.g. 2026-11-01T10:00:00Z>",
  "language": "<report language code, e.g. en or tr>",
  "mode": "<summary or detailed>",
  "project": { "name": "<project name>", "role": "controller", "roleAssumed": true, "applicability": "likely" },
  "summary": "<one paragraph in the report language: verdict reason, main risks, assumptions, any checklist 'no' answers>",
  "dataInventory": [
    { "category": "Contact", "fields": ["email", "phone"], "specialCategory": false, "locations": ["src/models/user.js"] }
  ],
  "findings": [
    {
      "id": "F-001",
      "ruleId": "KVKK-LOG-001",
      "title": "<in the report language>",
      "severity": "medium",
      "certainty": "confirmed",
      "legalRefs": [{ "label": "KVKK md. 12", "url": "https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law" }],
      "description": "<what was found, without personal data values>",
      "recommendation": "<how to fix it in this project>",
      "occurrences": [{ "file": "src/auth.js", "line": 42, "snippet": "<one source line>" }],
      "occurrenceCount": 1
    }
  ],
  "crossBorder": { "services": [
    { "name": "Sentry", "dataTypes": ["IP address", "user e-mail"], "evidence": [{ "file": "src/sentry.js", "line": 3 }], "specialCategoryEvidence": false }
  ] },
  "checklist": [
    { "id": "CL-VERBIS", "question": "<question in the report language>", "legalRefs": [{ "label": "...", "url": "..." }], "status": "unknown" }
  ],
  "disclaimer": "<disclaimer text from report-template.md in the report language>"
}
```

Field rules:

- IDs, enum values and field names stay in English; all free text is in the report language with
  KVKK terms as described in [language.md](language.md).
- File paths are relative to the project root and use `/`, never `\`.
- `findings[].id`: `F-001`, `F-002`, … in draft order. `occurrenceCount` = number of occurrences.
- `findings` may be empty; `crossBorder.services` is empty when no service abroad was found.
- **Checklist**: include every item from [checklist.md](checklist.md) whose **Applies to** is `both`
  or the project's role; include `CL-SPECIAL-CATEGORY-MEASURES` only if `KVKK-SP-001` has findings,
  and always include `CL-XB-SAFEGUARDS` when `KVKK-XB-001` exists. Copy the links as `legalRefs`
  and translate only the question. `status` is `unknown`, or the user's `yes`/`no` from the previous
  report (Setup step 5). Mention every `no` in the summary.
- `disclaimer`: the text from [report-template.md](report-template.md), as that file describes.
- You do not need to set `verdict`; the script computes it. If you set it, it is overwritten.

### 5.2 Finalize: `kvkk-report/report.json`

If scripts are available, run:

```
node "<SKILL_DIR>/scripts/finalize-report.mjs" kvkk-report/draft.json --mode <summary|detailed> --out kvkk-report
```

- Exit code 0: `kvkk-report/report.json` is written. It has masked snippets, grouped findings
  (summary mode), the verdict, and passed schema validation.
- Exit code 1: the draft is invalid; the errors are printed. Fix the draft and run again (up to
  three attempts), then fall back to the manual path.
- Exit code 2 with a message starting `Cannot read draft`: the draft is not valid JSON (or the path
  is wrong). Fix it and run again, exactly as for exit code 1.
- Any other exit code 2 or failure (bad usage, Node missing): check the command, then fall back to
  the manual path.

**Check the result** (both paths, before Step 5.3). Read every `snippet` in `kvkk-report/report.json`
and the free-text fields. If any still shows a secret value (key, token, `Basic`/`Bearer` credential,
password in a URL or connection string, private key) or a personal-data value (name, e-mail, phone,
TCKN, IBAN, address), fix that snippet or text in the draft (replace the value with `***` or remove
the snippet) and finalize again. Do not edit only `report.json` when the script is available, so the
two stay consistent.

**Manual path** (no Node, or the script keeps failing). Write `kvkk-report/report.json` yourself from
the draft, applying exactly what the script does:

1. **Mask every snippet** (same rules as the script):
   - `Bearer <token>` → `Bearer ***`.
   - A value assigned to a key whose name contains password, passwd, pwd, secret, token, api_key,
     access_key or private_key (with `=` or `:`) → keep the key, replace the value with `***`.
   - E-mail addresses → `***@***`.
   - Turkish IBANs (`TR` + 24 digits, spaces allowed) → `TR` followed by `*` for every other character.
   - Any standalone run of exactly 11 digits (TCKN-like) → 11 `*`.
   - Phone numbers (optional `+country code`, 10 digits with optional spaces, dots, dashes or
     brackets) → `*` for each character.
   - Any other secret value (API keys such as `sk_live_…` or `AKIA…`, `Basic` credentials,
     passwords in URLs or connection strings, private keys) → `***`. When unsure, remove the snippet.
   - Comparisons like `password === "x"` also have the right-hand value masked.
2. **Group** (summary mode only): one finding per `ruleId`. Order the members by severity first
   (critical, then high, medium, low, info; stable), then keep the most severe member's `id`, title,
   description, recommendation and legal references, and take the examples from it first; severity = the most severe of the group;
   certainty = `confirmed` if any member is confirmed, otherwise `needs_verification`; keep the first
   3 occurrences; `occurrenceCount` = sum of the members' counts. Sort by severity (critical, high,
   medium, low, info), then by `ruleId`. In detailed mode keep every finding as it is.
3. **Verdict** ([severity.md](severity.md)): any `critical` → `serious_risk`; otherwise any `high` or
   `medium` → `fixes_needed`; otherwise `looks_ready`. `needs_verification` findings count the same.
4. Set `mode`, check every required field of [schema/report.schema.json](../schema/report.schema.json)
   by eye, and write the file.

### 5.3 Write `kvkk-report/report.md`

Write it **from `kvkk-report/report.json`**, never from the draft, so that only masked snippets reach
it. Follow [report-template.md](report-template.md) in the report language. Use the verdict, findings,
and occurrences exactly as they are in `report.json`.

### 5.4 Clean up

Delete `kvkk-report/draft.json` and `kvkk-report/candidates.json`: they may contain unmasked personal
data or secrets. Keep them only while you still need to fix a failing draft. The folder must end with
`report.json` and `report.md` only. If deleting is not possible, tell the user these two files contain
unmasked data and must not be committed or shared.

### 5.5 Tell the user

In the conversation language, briefly:

- the verdict (with its label from [language.md](language.md)) and one sentence why,
- the number of findings per severity and the two or three most important ones (`ruleId`, title,
  `file:line`, no data values),
- whether the role was assumed and whether scripts ran or the manual path was used,
- the paths `kvkk-report/report.md` and `kvkk-report/report.json`,
- that they can answer the checklist in `report.json` (`yes`/`no`) and run the audit again, or ask for a
  detailed report,
- one line: this is a technical pre-screen, not legal advice (hukuki görüş değildir).

**Done when** `kvkk-report/report.json` (valid, masked) and `kvkk-report/report.md` exist, the draft
and candidates files are gone (or the user was warned), and the user has the verdict and the paths.
