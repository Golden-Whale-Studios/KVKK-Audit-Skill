# Report language and KVKK terms

## Choosing the report language

Use the first one that is known:

1. **The language the user writes to you in.** You decide this yourself from the conversation.
2. **The operating system's language**, when there is no conversation (CI, batch, a one-line
   command): run `node "<SKILL_DIR>/scripts/detect-language.mjs"`. It checks, in order, `LC_ALL`,
   `LC_MESSAGES`, `LANG`, the first entry of `LANGUAGE`, then the system locale, and prints a code
   such as `tr` or `en`. Without Node, read those environment variables yourself in the same order
   (`tr_TR.UTF-8` means `tr`; ignore empty values and `C` / `POSIX`).
3. **English** (`en`) otherwise.

Write the code in `report.json` as `language` (for example `tr`, `en`, `de`). Write `report.md` and
every free-text field of `report.json` (`summary`, titles, descriptions, recommendations, checklist
questions, inventory categories, data types) in that language. Tell the user the result in the
conversation language.

## What never changes

IDs, enum values and field names in `report.json` are always the English values defined in
`schema/report.schema.json`: `critical`, `needs_verification`, `fixes_needed`, `controller`,
`KVKK-LOG-001`, `CL-VERBIS`, and so on. Links are not translated.

## Term rule

KVKK terms always carry their Turkish original. In a non-Turkish report, write the term in the
report language, then the Turkish term and, where useful, the article in parentheses:

- "explicit consent (açık rıza, KVKK md. 5)"
- "obligation to inform (aydınlatma yükümlülüğü, KVKK md. 10)"
- "Einwilligung (açık rıza, KVKK md. 5)"

Use the full form the first time a term appears in the report; later, the short form "explicit
consent (açık rıza)" is enough. In a Turkish report, use the Turkish term and article only:
"açık rıza (KVKK md. 5)". Cite articles as "KVKK md. N"; in English text "KVKK md. N (Art. N)" is
also fine.

## Glossary

| Turkish (original) | English | Article |
|---|---|---|
| Kişisel Verilerin Korunması Kanunu (KVKK) | Personal Data Protection Law No. 6698 | — |
| kişisel veri | personal data | md. 3 |
| açık rıza | explicit consent | md. 3, md. 5 |
| aydınlatma yükümlülüğü | obligation to inform (privacy notice duty) | md. 10 |
| aydınlatma metni | privacy notice | md. 10 |
| veri sorumlusu | data controller | md. 3 |
| veri işleyen | data processor | md. 3 |
| özel nitelikli kişisel veri | special categories of personal data | md. 6 |
| ilgili kişi | data subject | md. 3, md. 11 |
| VERBİS (Veri Sorumluları Sicil Bilgi Sistemi) | Data Controllers' Registry Information System | md. 16 |
| Kurul (Kişisel Verileri Koruma Kurulu) | the Personal Data Protection Board | — |
| Kurum (Kişisel Verileri Koruma Kurumu) | the Personal Data Protection Authority | — |
| yurt dışına aktarım | transfer abroad | md. 9 |
| standart sözleşme | standard contract | md. 9 |
| saklama ve imha politikası | retention and destruction policy | md. 7 |
| silme, yok etme, anonim hale getirme | erasure, destruction, anonymisation | md. 7 |
| veri güvenliği | data security | md. 12 |
| veri ihlali | data breach | md. 12 |
| ilgili kişi başvurusu | data subject request | md. 11, md. 13 |
| ticari elektronik ileti / İYS | commercial electronic message / Message Management System | Law No. 6563 |

## Labels for enum values

Use these labels in `report.md`. For another language, translate the English label and keep the
Turkish one in parentheses on first use, for example "Ernstes Risiko (Ciddi risk var)".

| Value | English | Türkçe |
|---|---|---|
| `serious_risk` | Serious risk | Ciddi risk var |
| `fixes_needed` | Fixes needed | Düzeltmeler gerekli |
| `looks_ready` | Looks ready to launch | Yayına hazır görünüyor |
| `critical` | Critical | Kritik |
| `high` | High | Yüksek |
| `medium` | Medium | Orta |
| `low` | Low | Düşük |
| `info` | Info | Bilgi |
| `confirmed` | Confirmed | Doğrulandı |
| `needs_verification` | Needs verification | Doğrulanması gerekiyor |
| `controller` | Data controller | Veri sorumlusu |
| `processor` | Data processor | Veri işleyen |
| `applies` / `likely` / `unclear` | Applies / Likely / Unclear | Uygulanır / Muhtemelen uygulanır / Belirsiz |
| `unknown` / `yes` / `no` | Unknown / Yes / No | Bilinmiyor / Evet / Hayır |
