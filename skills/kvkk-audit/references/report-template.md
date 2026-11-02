# Report template (`kvkk-report/report.md`)

Build `report.md` from the finalized `kvkk-report/report.json`, never from the draft: only the
finalized file has masked snippets. Write all text in the report language (see `language.md`),
translating the headings below. Keep IDs (`KVKK-LOG-001`, `CL-VERBIS`, `F-001`) and file paths as
they are. Show severity, certainty and verdict with their labels from `language.md`; when the report
is not in English, put the English enum value in backticks after the label.

The same template serves both modes:

- **summary** (default): one block per grouped finding, up to 3 example locations, and the total
  count ("40 places, 3 shown").
- **detailed**: one block per finding with every occurrence, its snippet, legal references and fix.

Empty sections stay in the report with one line such as "No personal data found." Never remove the
checklist or the disclaimer.

---

## Template

````markdown
# KVKK audit report: <project.name>

**Verdict: <verdict label>**

<verdict sentence, see "Verdict sentences" below>

| | |
|---|---|
| Date | <generatedAt> |
| Mode | <summary or detailed> |
| Role | <data controller (veri sorumlusu) or data processor (veri işleyen)><if roleAssumed: ", assumed: could not be determined from the code"> |
| KVKK applicability | <applies / likely / unclear>: <one-line reason> |
| Findings | <n> critical · <n> high · <n> medium · <n> low · <n> info (<n> need verification) |

## Summary

<report.json summary paragraph>

<If roleAssumed is true: "The role was assumed to be data controller (veri sorumlusu) because it could
not be determined. If you process data on behalf of business customers, say so and run the audit
again: some findings would become information notes for your customers.">

## Personal data inventory

| Category | Fields | Special category | Where |
|---|---|---|---|
| <category> | <fields, comma-separated> | <Yes / No> | <locations, comma-separated> |

## Findings

<Sorted by severity, then rule ID, as in report.json. If there are none: "No findings.">

### <n>. <title> (<severity label>, <certainty label>)

- **Rule:** `<ruleId>` · **Places:** <occurrenceCount><summary mode, if more than shown: " (3 shown)">
- **Legal basis:** [<label>](<url>), [<label>](<url>)
- **What was found:** <description>
- **Where:**
  - `<file>:<line>`: `<masked snippet from report.json, if any>`
- **How to fix:** <recommendation>

<repeat for each finding>

## Services abroad (yurt dışına aktarım)

<From crossBorder.services, listing every service. If empty: "No services abroad were detected.">

| Service | Personal data sent | Evidence | Special-category data |
|---|---|---|---|
| <name> | <dataTypes> | `<file>:<line>`, ... | <Yes / No> |

The legal route for these transfers (KVKK md. 9) is asked in checklist item `CL-XB-SAFEGUARDS`.

## Checklist: what the code cannot show

Answer each item with `yes` or `no` in `kvkk-report/report.json` (`checklist[].status`) and run the
audit again.

| ID | Question | Legal basis | Answer |
|---|---|---|---|
| `<id>` | <question> | [<label>](<url>) | <unknown / yes / no> |

## Disclaimer

<report.json disclaimer>
````

## Verdict sentences

Translate into the report language:

- `serious_risk`: "At least one critical issue was found. Fix it before launching in Turkey."
- `fixes_needed`: "No critical issue was found, but issues of high or medium severity need fixing before launch."
- `looks_ready`: "No critical, high or medium issue was found in the code. Review the checklist; this is not a legal guarantee."

## Disclaimer text

Use this text in `report.json` (`disclaimer`) and at the end of `report.md`. The English text and the
Turkish original are the canonical versions.

- Report in **Turkish** (`tr`): the Turkish text only.
- Report in **English** (`en`): the English text, then the Turkish original.
- Any **other language**: a faithful translation of the English text, then the Turkish original.

**English:**

> This report is an automated technical pre-screen of the source code under the Turkish Personal Data Protection Law No. 6698 (KVKK). It is not legal advice (hukuki görüş değildir). Findings may be incomplete or wrong, and matters the code cannot show, such as VERBİS registration, contracts and internal policies, are only listed in the checklist. A "looks ready" verdict is not a legal guarantee of compliance. Have your data processing reviewed by a qualified lawyer before launch.

**Turkish original (Türkçe asıl metin):**

> Bu rapor, kaynak kodun 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında otomatik olarak yapılmış teknik bir ön taramasıdır; hukuki görüş değildir. Bulgular eksik veya hatalı olabilir; VERBİS kaydı, sözleşmeler ve iç politikalar gibi koddan anlaşılamayan konular yalnızca kontrol listesinde yer alır. "Yayına hazır görünüyor" hükmü, mevzuata uygunluğun hukuki bir güvencesi değildir. Yayına çıkmadan önce veri işleme faaliyetlerinizi bir hukukçuya inceletin.
