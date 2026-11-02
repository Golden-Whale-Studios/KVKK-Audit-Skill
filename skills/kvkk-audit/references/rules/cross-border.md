# Transfer of personal data abroad (yurt dışına aktarım)

## KVKK-XB-001: Services that may receive personal data abroad (grouped)

**Default severity:** `info`
**Applies to:** `both`
**Legal basis:** KVKK md. 9 (Art. 9) as amended by Law No. 7499 art. 34 (published 12 March 2024, in force 1 June 2024): transfer abroad needs a md. 5/6 condition **and** an adequacy decision, or an appropriate safeguard (e.g. a standard contract notified to the Authority within five business days of signature, md. 9(5)), or one of the incidental exceptions in md. 9(6) — [Yurt Dışına Aktarım](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim), [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Yurt Dışına Aktarım Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/13711235-abb6-4b17-9a6b-0a68c1ad86c5.pdf), [Standart Sözleşmeler](https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler)

**Reporting policy (fixed):**

- Report a **single grouped finding** for this rule. List **every** detected service in it and in
  `crossBorder.services[]`, each with its name, the personal-data types it receives, and evidence
  locations. Do not create one finding per service.
- Default severity is `info`. On its own, this finding does not move the verdict to `fixes_needed`.
- The legal basis for each transfer is asked in checklist item **`CL-XB-SAFEGUARDS`**. Always include
  that item when this finding exists.
- **Escalate to `high`** when there is evidence that special-category data (özel nitelikli kişisel
  veri, KVKK md. 6) goes to any listed service. Set `specialCategoryEvidence: true` on that service and
  say which data and where.

On the verification date (see `sources.md`) the Authority's page said the Board had not yet
issued any adequacy decision. Treat the standard contract route (four types: controller→controller,
controller→processor, processor→processor, processor→controller) as the usual safeguard, and re-check
the page. The Board's transfer guide says storage in a cloud located abroad and offered by a service
provider, or remote access from abroad, can count as a transfer.

### What to look for

- SDKs and APIs of services operated or hosted outside Türkiye that receive personal data: analytics,
  advertising, attribution, crash reporting, session recording, e-mail/SMS/push providers, payment,
  customer support/chat, CRM, AI/LLM APIs, maps, authentication providers.
- Cloud regions outside Türkiye for databases, storage, queues, functions and log stores.
- Server-side calls that forward user data to foreign endpoints (webhooks, exports).
- For each service, record which personal-data types it receives, based on `KVKK-PD-001` and
  `KVKK-SP-001`.

### Common patterns

The scanner returns candidates through the `xb-*` patterns: Firebase/Google, Google Analytics/gtag/GTM, Sentry,
Mixpanel, Amplitude, Segment, Hotjar, Facebook/Meta Pixel, Stripe, and cloud region strings. Add other
services you recognise (for example OpenAI/Anthropic APIs, Intercom, Twilio, SendGrid, Mailchimp,
OneSignal, Datadog, AppsFlyer, Adjust).

- **Node/TypeScript:** `Sentry.init({ dsn })`, `mixpanel.identify(user.email)`, `new S3Client({ region: 'eu-central-1' })`.
- **Python:** `sentry_sdk.init(...)`, `boto3.client('s3', region_name='us-east-1')`, `stripe.Customer.create(email=...)`.
- **Java/Kotlin:** `FirebaseAnalytics.getInstance(context).setUserProperty(...)`, AWS SDK `Region.EU_WEST_1`.
- **.NET:** `services.AddApplicationInsightsTelemetry()`, Azure resources in `westeurope`.
- **PHP:** `\Sentry\init([...])`, `Mailchimp\...->lists->addListMember(...)`.
- **Mobile/infra:** `google-services.json`, `GoogleService-Info.plist`, Firebase Crashlytics, Facebook SDK
  in `Podfile`/`build.gradle`; Terraform `provider "aws" { region = "us-east-1" }`.

### Needs-verification when

- You cannot tell from the code whether a service receives personal data (an SDK initialised without
  user identifiers may still collect device IDs or IP addresses).
- The provider may process data in Türkiye or another region chosen in its console.
- Special-category evidence is indirect (for example, a health app sends event names to analytics).
  Escalate to `high` with `needs_verification` rather than staying at `info`.

### Recommendation

For every listed service, confirm a md. 9 route: an adequacy decision if one exists, or the matching Board
standard contract signed and notified to the Authority within five business days, binding corporate rules,
or another appropriate safeguard. Incidental exceptions are only for non-regular, one-off transfers.
Mention transfers abroad in the privacy notice. Prefer Türkiye-region hosting, or avoid sending personal
data and especially special-category data to these services, for example by pseudonymising user IDs or
disabling IP collection. Answer `CL-XB-SAFEGUARDS`.
