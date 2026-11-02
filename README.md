# KVKK Audit Skill

An open-source Agent Skill that lets a coding agent audit your codebase
against **KVKK** (Kişisel Verilerin Korunması Kanunu, Turkish Personal Data Protection Law No. 6698)
and tell you whether your app looks ready to launch in Turkey.

Türkçe: [README.tr.md](README.tr.md)

> **Not legal advice (hukuki görüş değildir).** This is an automated technical pre-screen of source
> code. A "looks ready" verdict is not a legal guarantee of compliance. Larger projects should have
> a qualified lawyer review the report before launch.

## What it does

Ask your agent "Can I launch this in Turkey?" or "Run a KVKK audit". The agent follows the skill and:

1. Decides whether KVKK applies and whether you are a data controller (veri sorumlusu) or a data
   processor (veri işleyen).
2. Maps your stack, data layer, forms, third-party SDKs, logging and infrastructure.
3. Builds a personal-data inventory and marks special categories (özel nitelikli kişisel veri).
4. Checks 15 rules (see below), each with an official legal reference (kvkk.gov.tr, mevzuat.gov.tr).
5. Writes `kvkk-report/report.md` (for people) and `kvkk-report/report.json` (for tools) with a
   verdict: `serious_risk`, `fixes_needed` or `looks_ready`.

Rules cover: personal-data inventory, special categories, explicit consent (açık rıza), privacy
notice (aydınlatma), retention and account deletion, password storage, unencrypted transfer, secrets in
the repository, unencrypted special-category storage, personal data in logs, transfers abroad,
tracking before cookie consent, data-subject requests, and marketing-message permission (İYS).

Things a scanner cannot see (VERBİS registration, processor contracts, breach plan, retention
policy) are listed in a checklist in every report.

Principles:

- **Only KVKK.** Not GDPR (a separate skill is on the roadmap).
- **Does not silently drop doubtful findings.** A doubtful finding is reported as
  `needs_verification` and counts toward the verdict. The audit can still miss issues.
- **No data leaks into the report.** Snippets are masked when the report is finalised (TCKN-like
  numbers, e-mails, Turkish IBANs, phone numbers, secret-named values and common key formats), and the
  agent re-checks the report for anything the script cannot recognise, such as names and addresses.
  Review the report before sharing it.
- **Read-only.** The skill never changes your code; it only writes into `kvkk-report/`.
- **Works without scripts.** The Node.js scripts are helpers. If Node is missing, the agent follows
  the written manual path (documented, but not yet tested; see docs/TESTING.md).
- **Your language.** The report is written in the language you talk to the agent in (falling back to
  the OS language, then English). KVKK terms always keep their Turkish original, for example
  "explicit consent (açık rıza, KVKK md. 5)".

## What it does not do

- It does not give legal advice or certify compliance.
- It cannot see what is outside the code: VERBİS registration, contracts, internal policies, cloud
  consoles, third-party consent tools.
- It does not edit your code or fix the issues for you.
- It does not cover other laws (GDPR, sector regulations). Marketing-message permission under Law
  No. 6563 is reported as a low-severity note only.

## Install

### Any agent that supports Agent Skills (Claude Code, Codex, Cursor and others)

```bash
npx skills add Golden-Whale-Studios/KVKK-Audit-Skill
```

This copies `skills/kvkk-audit/` into your agent's skills folder.

### Claude Code plugin

The repository is also a Claude Code plugin (`.claude-plugin/plugin.json`, skill in
`skills/kvkk-audit/`). Clone it and load it:

```bash
git clone https://github.com/Golden-Whale-Studios/KVKK-Audit-Skill.git
claude --plugin-dir ./KVKK-Audit-Skill
```

Or copy the skill by hand:

```bash
# personal skill, available in all projects
cp -r skills/kvkk-audit ~/.claude/skills/kvkk-audit
# or project skill
mkdir -p .claude/skills && cp -r skills/kvkk-audit .claude/skills/kvkk-audit
```

### AGENTS.md (Codex and other agents that read it)

Copy `AGENTS.md` and `skills/kvkk-audit/` into your project (or merge the "KVKK audit" section into
your existing `AGENTS.md`). `AGENTS.md` tells the agent to read `skills/kvkk-audit/SKILL.md` when
you ask for a KVKK audit. If you installed the skill in another folder, edit the path in `AGENTS.md`.

### Cursor rule

Copy `.cursor/rules/kvkk-audit.mdc` into your project's `.cursor/rules/` and keep the skill folder at
`skills/kvkk-audit/` (or edit the path in the rule). The rule can be attached when you ask for a KVKK audit.

Codex and Cursor setups are not yet verified, see [docs/TESTING.md](docs/TESTING.md).

Requirements: Node.js 18+ is optional (for the helper scripts). No dependencies.

## Usage

Run your agent in the root of the project you want to audit and ask:

| You say | Result |
|---|---|
| "Run a KVKK audit" / "Can I launch this app in Turkey?" | Summary report: findings grouped by rule, 3 example places each |
| "Give me a detailed KVKK report" | Detailed report: every finding and every place, with masked snippets |
| "KVKK denetimi yap" / "Türkiye'de yayına çıkabilir miyim?" | The same, in Turkish |
| "We are a B2B SaaS, we process data for our customers. Run the KVKK audit." | Role is data processor; controller-only rules become information notes |

After the first run, open `kvkk-report/report.json`, set each checklist item's `status` to `yes` or
`no`, and run the audit again. Your answers carry over and every `no` is mentioned in the summary.

Add `kvkk-report/` to your own `.gitignore` unless you want to commit the reports (this repository already ignores it).

### Sample summary report (fake data)

```markdown
# KVKK audit report: shop-app

**Verdict: Serious risk**

At least one critical issue was found. Fix it before launching in Turkey.

| | |
|---|---|
| Role | data controller (veri sorumlusu) |
| KVKK applicability | Applies: Turkish UI, TRY prices, TCKN field |
| Findings | 1 critical · 2 high · 3 medium · 0 low · 2 info (1 need verification) |

## Findings

### 1. Passwords stored in plaintext (Critical, Confirmed)

- **Rule:** `KVKK-SEC-001` · **Places:** 2
- **Legal basis:** [Veri Güvenliğine İlişkin Yükümlülükler](https://www.kvkk.gov.tr/Icerik/2040/Veri-Guvenligine-Iliskin-Yukumlulukler)
- **Where:**
  - `src/routes/auth.js:12`: `const user = { email, legacyPassword: ***, ... };`
- **How to fix:** Store only a slow salted hash (Argon2id, bcrypt or scrypt).

### 2. One pre-ticked checkbox bundles terms and explicit consent (High, Confirmed)

- **Rule:** `KVKK-CON-001` · **Places:** 1
- **Where:** `public/register.html:19`
- **How to fix:** Ask for each purpose separately with unticked boxes (açık rıza, KVKK md. 5).

...

## Disclaimer

This report is an automated technical pre-screen ... It is not legal advice (hukuki görüş değildir). ...
```

A full report also has a personal-data inventory, a services-abroad table and the checklist.

## Run the helper scripts yourself

```bash
node skills/kvkk-audit/scripts/scan-patterns.mjs <projectDir>        # candidate matches as JSON
node skills/kvkk-audit/scripts/finalize-report.mjs <draft.json> --mode summary --out kvkk-report
node skills/kvkk-audit/scripts/detect-language.mjs                   # OS language code
node skills/kvkk-audit/scripts/compare-findings.mjs <report.json> <expected-findings.json>
```

The example projects in `examples/` are deliberately leaky (or clean) test material. See
[docs/TESTING.md](docs/TESTING.md) for how the skill is tested.

## Repository layout

```
skills/kvkk-audit/      the skill: SKILL.md, references/ (workflow, rules, checklist, sources), schema/, scripts/
examples/               four fake projects with expected-findings.json
tests/                  automated tests (node --test)
docs/TESTING.md         how to test the skill on the examples
AGENTS.md               entry point for agents that read AGENTS.md
.cursor/rules/          Cursor rule
.claude-plugin/         Claude Code plugin manifest
```

## Contributing

Corrections to the rule catalog are welcome, especially legal updates. Every legal statement must come
with a link to an official source (kvkk.gov.tr, mevzuat.gov.tr, resmigazete.gov.tr or ticaret.gov.tr),
and the "Last verified" date in `skills/kvkk-audit/references/sources.md` should be updated when you
re-check a source. Where you cannot verify a detail, say "verify with counsel" instead of guessing.

```bash
npm install
npm test
```

Add or change a test for any rule, pattern or script you touch. Rule files are in English.

## Roadmap

- A GitHub Action that runs the audit on pull requests.
- A separate GDPR skill (this one stays KVKK-only).
- More patterns for the scanner and more example projects (Java, .NET, PHP, iOS).

## License

MIT, see [LICENSE](LICENSE).
