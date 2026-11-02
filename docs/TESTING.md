# Testing the KVKK audit skill

There are two layers: automated tests for the scripts and the catalog, and an end-to-end run where a
real agent audits the example projects.

## 1. Automated tests

```bash
npm install     # installs ajv, used only by tests
npm test        # node --test tests/
```

These cover the scripts (`redact`, `group`, `verdict`, `validate`, `lang`, `scan`, `finalize`), the rule
catalog and the example expectations. They do not run an agent.

## 2. End-to-end run on the examples

| Example | Expected verdict | What it checks |
|---|---|---|
| `examples/node-express-leaky` | `serious_risk` | Many rules at once: plaintext password, MD5, secrets, http, consent, notice, logs, cookies, abroad, no deletion |
| `examples/python-fastapi-leaky` | `serious_risk` | Special-category (health) data, no encryption, public S3 bucket, transfer abroad |
| `examples/android-kotlin-leaky` | `fixes_needed` | Mobile: phone in the log, analytics before consent, Firebase |
| `examples/node-clean` | `looks_ready` | No false positives on a compliant-by-design project |

Each example has an `expected-findings.json` (`expectedVerdict`, `mustFind` entries of `ruleId` with
optional `severity` and `file`, and `mustNotFind` rule IDs).

### Steps (per example)

1. Open your agent with the **example folder as the working directory** (so `kvkk-report/` is created
   inside it and file paths are relative to the example root), with the skill installed. Do not open
   the example's `README.md` or `expected-findings.json` first: they give away the answers.
2. Ask: "Run a KVKK audit." (add "detailed" or "detaylı" for the detailed mode).
3. When it finishes, from the repository root:

   ```bash
   node skills/kvkk-audit/scripts/compare-findings.mjs examples/<name>/kvkk-report/report.json examples/<name>/expected-findings.json
   ```

   It prints `{ missing, unexpected, verdictOk }` and exits 0 only when nothing is missing, nothing
   unexpected is present and the verdict matches (exit 1 otherwise, 2 on usage errors).
4. If it fails, decide whether the skill instructions or catalog are at fault (fix them) or the
   expectation is wrong (change `expected-findings.json` and explain why), then run again.
5. Delete `examples/<name>/kvkk-report/` afterwards (it is gitignored, but it holds masked data).

### Language check

Run `node-express-leaky` once while writing to the agent in Turkish (for example "KVKK denetimi yap")
and once in English. The report must follow the conversation language: Turkish `report.md` and free
text with `"language": "tr"` in `report.json`, KVKK terms in their Turkish original; English
otherwise. IDs, enum values and field names stay English in both.

## 3. Recorded results (2026-11-02, Claude Code, Node v26.13.0)

The agent under test followed `skills/kvkk-audit/SKILL.md` and `references/workflow.md`, with the
caveats under "Limits of this run", non-interactively (role not asked), mode `summary`, with the
example folder as the project root. It did not open the example's `README.md` or
`expected-findings.json` before finishing its audit, but see the scanner caveat below.

| Example | Verdict | Missing | Unexpected | Exit | Iterations |
|---|---|---|---|---|---|
| node-express-leaky (English) | `serious_risk` | none | none | 0 | 1 |
| node-express-leaky (Turkish) | `serious_risk` | none | none | 0 | 1 |
| python-fastapi-leaky | `serious_risk` | none | none | 0 | 1 |
| android-kotlin-leaky | `fixes_needed` | none | none | 0 | 1 |
| node-clean (re-audited after the final fix wave) | `looks_ready` | none | none | 0 | 1 |

The Turkish run produced `language: "tr"`, a Turkish `report.md` (headings, verdict label "Ciddi risk
var", labels and text) with KVKK terms in Turkish, the Turkish disclaimer only, and Turkish checklist
questions.

Limits of this run:

- `scan-patterns.mjs` also scans the example's own `README.md`, so its candidate list included README
  lines. The agent printed only file and line and ignored them, but the README was part of the scanner's input.
- The reports were produced with throwaway generator scripts (draft JSON, checklist boilerplate and
  `report.md` rendering) that are not part of the repo. The findings were the agent's own judgement, but
  the no-Node manual path described in the workflow was **not exercised**; it is documented, not yet tested.
- The Turkish run was a language-switch check by the same model, not an independent evaluation.
- It was a single agent session by the same model that helped build the catalog,
the scripts ran on Windows with Node 26, and it does not show how other agents or models behave. Treat
it as a smoke test, not a benchmark. Re-run it when you change the rules, the workflow or the
patterns.

## 4. Codex and Cursor smoke test: NOT VERIFIED

No Codex or Cursor access was available when this document was written, so this step is **not
verified**. A human should run it:

**Codex (or any agent reading AGENTS.md)**

1. Copy `AGENTS.md` and `skills/kvkk-audit/` into a scratch copy of `examples/node-express-leaky`
   (or install with `npx skills add Golden-Whale-Studios/KVKK-Audit-Skill`).
2. Start the agent in that folder and ask: "Run a KVKK audit."
3. Check that it opens `skills/kvkk-audit/SKILL.md` and `references/workflow.md`, writes
   `kvkk-report/report.md` and `kvkk-report/report.json`, and ends with the verdict and the
   "not legal advice" disclaimer.
4. Run `node skills/kvkk-audit/scripts/compare-findings.mjs kvkk-report/report.json expected-findings.json`
   (adjust the paths to where the files are) and expect exit 0.

**Cursor**

1. Copy `.cursor/rules/kvkk-audit.mdc` to `.cursor/rules/` and `skills/kvkk-audit/` to
   `skills/kvkk-audit/` in the same scratch copy.
2. Open the folder in Cursor, start an agent chat and ask: "Run a KVKK audit."
3. Check that the rule is attached, the agent follows the skill, and the same two files are written.
4. Run the same `compare-findings.mjs` command and expect exit 0.

Record the agent, its version, the date and the `compare-findings.mjs` output in this file.
