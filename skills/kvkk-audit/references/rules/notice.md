# Obligation to inform (aydınlatma yükümlülüğü)

## KVKK-NOT-001: No privacy notice link where personal data is collected

**Default severity:** `medium`
**Applies to:** `controller`
**Legal basis:** KVKK md. 10 (Art. 10): at the time personal data is obtained, the controller must inform the data subject; Aydınlatma Tebliği md. 4–5 set minimum content and procedure — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Aydınlatma Yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-), [Aydınlatma Tebliği](https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig)

The obligation applies whatever the processing condition is, including consent, contract or legal
obligation. It does not depend on a request, and the controller must be able to prove it was met
(Tebliğ md. 5(1)(a), (d), (e)). Whether the notice text is complete is checklist item
`CL-PRIVACY-NOTICE-CONTENT`. This rule checks only that the notice is reachable where data is collected.

### What to look for

- Every place that collects personal data from the user: sign-up, login with profile completion,
  contact/support forms, newsletter sign-up, checkout, job application, mobile onboarding, and in-app
  permission prompts (location, contacts, camera).
- Next to each, a visible link or text for the privacy notice (aydınlatma metni / KVKK aydınlatma /
  gizlilik), shown **before or at** submission.
- A privacy-notice page or route that exists in the app or website at all.
- The notice shown merged into the consent checkbox text, which conflicts with Tebliğ md. 5(1)(f)
  (separate informing and consent). Report this here and in `KVKK-CON-001`.

### Common patterns

The scanner has no dedicated pattern for this rule. Start from the forms found under `KVKK-PD-001` and
look for links such as `aydinlatma`, `kvkk`, `privacy`, `gizlilik`.

- **Node/TypeScript:** React/Next `<form onSubmit=...>` with `email`/`phone` inputs and no
  `<a href="/aydinlatma-metni">`; Next.js `pages/` or `app/` without a privacy route.
- **Python:** Django template `register.html` without `{% url 'privacy' %}`; FastAPI backend with a
  Jinja form.
- **Java/Kotlin:** Thymeleaf `signup.html`; Android `RegisterActivity` layout without a notice
  `TextView` link.
- **.NET:** Razor Pages `Register.cshtml` (ASP.NET Identity scaffold) without a notice link.
- **PHP:** Laravel `resources/views/auth/register.blade.php`; WordPress contact forms.
- **Mobile:** iOS `SignUpViewController` / SwiftUI `Form` without a `Link` to the notice; the notice
  only in app-store metadata but not in the app.

### Needs-verification when

- The form is rendered from a CMS, remote config or third-party widget that you cannot inspect.
- The link exists only in a global footer. That may satisfy "at the time of collection" for a web
  form, but not for a mobile flow without the footer.
- The project is a backend/API only, so the collecting UI lives in another repository.

### Recommendation

Add a clearly visible link to the privacy notice at every collection point, shown before submission.
Keep it separate from any consent text. Make sure the notice states, in plain language, the controller's
identity, the purposes, the recipients or recipient groups and transfer purposes, the collection method and
the legal basis, and the md. 11 rights. Provide a new notice before using data for a new purpose
(Tebliğ md. 5(1)(b)).
