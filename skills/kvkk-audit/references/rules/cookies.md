# Cookies and tracking (çerezler)

## KVKK-CK-001: Tracking runs before consent

**Default severity:** `medium`
**Applies to:** `both`
**Legal basis:** KVKK md. 5 and md. 10 as applied to cookies by the Board's Çerez Uygulamaları Hakkında Rehber: non-essential cookies such as behavioural advertising need explicit consent, obtained by an active act **before** they are placed, unless another md. 5 condition applies; Criteria A/B mark cookies that the guide treats as not needing consent — [Çerez Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/fb193dbb-b159-4221-8a7b-3addc083d33f.pdf), [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law)

The guide recommends two criteria for cookies that need no consent: (A) used only to transmit a communication,
and (B) strictly necessary for a service the user explicitly requested. For other cookies, the controller
first checks whether another md. 5/6 condition applies; the guide discusses legitimate interest
(md. 5(2)(f)) with a balancing test. Explicit consent is used only if no other condition fits. Points from the guide:

- First-party analytics limited to audience measurement for the site's own operation may fall under
  Criterion B.
- Behavioural advertising cookies require explicit consent.
- Social plug-ins should not set third-party cookies for non-members by default.
- Merely visiting a site is not consent.
- Consent-required cookies must be off by default in the consent panel.
- Consent cannot be bundled into the terms of use or the privacy notice.
- Cookie walls may invalidate consent.
- Withdrawal must be easy.

The same logic applies to SDKs and identifiers in mobile apps and other terminal devices.

### What to look for

- Advertising, marketing or third-party analytics tags/SDKs loaded or initialised unconditionally on
  page load or app start (before any consent check).
- A consent banner that only has "OK/Accept", or has categories pre-enabled.
- Consent state stored, but tracking code not gated by it.
- `document.cookie` writes or third-party scripts setting identifiers before consent.
- Mobile ad/attribution SDKs collecting the advertising ID at start-up.

### Common patterns

The scanner returns candidates through `ck-document-cookie` and `ck-tracking-calls` (`gtag(`, `fbq(`). The
`xb-*` candidates also point to tracking SDKs.

- **Node/TypeScript (web):** `<Script src=".../gtag/js?id=G-...">` (googletagmanager.com) in the
  root layout without consent gating; `fbq('init', ...)` in `_app.tsx`; Google Consent Mode
  `gtag('consent','default',{ad_storage:'granted'})`.
- **Python:** Django/Jinja base template that includes analytics snippets unconditionally.
- **Java/Kotlin:** Android `FirebaseAnalytics` collection enabled by default (no
  `firebase_analytics_collection_enabled=false` until consent); Facebook SDK auto-logging enabled.
- **.NET:** `_Layout.cshtml` with tracking scripts outside a consent check.
- **PHP:** WordPress theme `header.php` hard-coding GA/Pixel; plugins configured to load before consent.
- **Mobile:** iOS SDKs reading IDFA before consent; React Native/Flutter analytics `init()` in app start-up.

### Needs-verification when

- A consent-management platform is loaded and may block tags through configuration you cannot see
  (for example, a tag manager with consent triggers).
- The tool is first-party analytics that may fall under Criterion B (audience measurement only, no
  cross-site tracking, no marketing use). Report it as `needs_verification` and describe what to check.
- Cookies are set by the server for sessions or load balancing, which are likely strictly necessary.

### Recommendation

Load advertising and other non-essential tracking only after an affirmative opt-in for that purpose.
Show "accept", "reject" and "preferences" with equal prominence, with non-essential categories off by
default. Keep the cookie consent separate from the terms and the privacy notice, and link to the cookie
notice in the panel. Make withdrawal easy (for example, a persistent preferences icon). Configure mobile
SDKs with collection disabled until consent.
