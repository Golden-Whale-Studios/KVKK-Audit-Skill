# Commercial electronic messages (ticari elektronik ileti)

## KVKK-IYS-001: Marketing message permission not obtained separately

**Default severity:** `low`
**Applies to:** `both`
**Legal basis:** Related law outside KVKK proper, reported for information: Law No. 6563 on electronic commerce and the Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik md. 7 (consent in writing or electronically; if inside a contract, under a separate heading with a refusal option; not pre-selected; not a precondition of goods or services; burden of proof on the sender) and md. 9 (refusal at any time) — [Ticari İletişim Yönetmeliği](https://kayseri.ticaret.gov.tr/yayinlar/tuketici/ticari-iletisim-ve-ticari-elektronik-iletiler-hakkinda-yonetmelik), [Law No. 6563 (TR, PDF)](https://mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf), [Hizmetin Açık Rıza Şartına Bağlanması](https://www.kvkk.gov.tr/Icerik/5412/Acik-Rizanin-Hizmet-Sartina-Baglanmasi)

KVKK is the scope of this skill. Permission (onay) for commercial e-mail, SMS and calls comes from
Law No. 6563 and its Regulation, and is managed through the İleti Yönetim Sistemi (İYS). The audit
checks only what code can show: whether marketing permission is collected separately, unticked and
optionally, and whether refusals are honoured. This catalog did not verify the wording of Law No. 6563
md. 6 or the İYS-specific duties (registering permissions in İYS, checking İYS before sending), so verify
with counsel. Using personal data for marketing may also need explicit consent under KVKK;
see `KVKK-CON-001`.

### What to look for

- Marketing permission merged with terms acceptance, the privacy notice or the KVKK explicit consent
  in one checkbox.
- Marketing permission pre-selected, or required to sign up or check out.
- Marketing sends (newsletter, SMS campaigns, push promotions) with no stored permission check, no
  unsubscribe or refusal handling, or no record of when and how permission was given.
- Integration with İYS, or its absence, when the product sends SMS or e-mail campaigns to users in Türkiye.

### Common patterns

The scanner has no dedicated pattern for this rule. Search for `marketing`, `newsletter`, `ileti`, `iys`, `kampanya`,
`unsubscribe`, `optIn`.

- **Node/TypeScript:** `marketingOptIn: true` default in a sign-up schema; SendGrid/Mailchimp list add
  on registration without a separate opt-in.
- **Python:** `newsletter = models.BooleanField(default=True)`; Celery campaign task without a permission filter.
- **Java/Kotlin:** `@AssertTrue boolean marketingConsent`; Android sign-up `CheckBox` "Kampanyalardan
  haberdar olmak istiyorum" checked by default.
- **.NET:** registration model with `[Required] bool AcceptMarketing`; SMS provider called for every user.
- **PHP:** Laravel `'marketing' => 'accepted'`; WooCommerce checkout adding all customers to a list.
- **Mobile:** push campaigns sent to all tokens with no marketing-permission flag; OneSignal/Firebase
  Messaging topics subscribed at install.

### Needs-verification when

- Permission is collected or synced through İYS or a CRM outside the code.
- The messages may be transactional (order status, security alerts), which need no marketing permission.
- The recipients may be merchants or traders (esnaf ve tacir). Different rules may apply, so verify with counsel.

### Recommendation

Collect marketing permission with its own unticked checkbox or step, separate from the terms, the privacy
notice and any KVKK consent. Do not make it a condition of the service. Store the date, channel and text.
Honour refusals promptly and include a refusal option in every message. Check with counsel how to register
and verify permissions in İYS.
