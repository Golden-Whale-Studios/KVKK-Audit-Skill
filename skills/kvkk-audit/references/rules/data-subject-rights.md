# Data subject rights (ilgili kişinin hakları)

## KVKK-DSR-001: No mechanism for data subject requests

**Default severity:** `medium`
**Applies to:** `controller`
**Legal basis:** KVKK md. 11 (rights: learn whether data is processed, request information, learn purposes, know recipients in Türkiye and abroad, rectification, erasure, notification to third parties, objection to a result against the person arising from analysis solely through automated systems, compensation) and md. 13 (requests answered within thirty days, free of charge unless extra cost, in writing or electronically) — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [İlgili Kişinin Hakları](https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari), [Başvuruların cevaplanması](https://www.kvkk.gov.tr/Icerik/2046/Ilgili-Kisiler-Tarafindan-Yapilan-Basvurularin-Cevaplanmasi-Yukumlulugu)

Under md. 13(1), requests are made in writing or by other means the Board determines. The accepted
channels are set in the Tebliğ on applications to the data controller. This catalog did not verify
that Tebliğ's details, so verify with counsel. This rule checks whether the product gives users, and the
team, a practical way to receive requests and carry them out.

### What to look for

- A way to submit a KVKK request: a contact address or form for KVKK requests, named in the privacy
  notice or in-app (e.g. "KVKK başvuru", "veri talebi", "privacy request").
- Internal ability to fulfil the rights: export a user's data (access), edit profile fields
  (rectification), delete or anonymise (erasure; see `KVKK-RET-002`), and list the third parties that
  received the data.
- Automated-only analysis that can produce a result against the user (for example automatic bans or credit
  scoring) with no route to object (md. 11(1)(g)).

### Common patterns

The scanner has no dedicated pattern for this rule. Look for routes, admin tools and templates.

- **Node/TypeScript:** missing `GET /me/export` or admin "export user data" script; no
  `/kvkk-basvuru` page.
- **Python:** Django admin without an export action for user data; no management command for a
  data-subject export.
- **Java/Kotlin:** Spring app with no endpoint or job to compile a user's data; Android app with no
  "Privacy / KVKK request" entry in settings.
- **.NET:** ASP.NET Identity `DownloadPersonalData` page removed or disabled.
- **PHP:** WordPress "Export Personal Data" tools disabled; Laravel with no request form.
- **Mobile:** settings screen without a privacy or request entry or a link to the request channel.

### Needs-verification when

- Requests are handled by a support team via e-mail or a ticketing tool outside the code. Report as
  `needs_verification` and ask whether it is documented in the privacy notice.
- The project is a backend for another controller's front end.

### Recommendation

Publish a request channel in the privacy notice and the product. Make sure the team can locate, export,
correct and erase a person's data across systems and processors, and can say which third parties received
it. Answer within thirty days, free of charge unless the Board tariff applies, and reply in writing or
electronically. Add checklist item `CL-DSR-PROCESS`.
