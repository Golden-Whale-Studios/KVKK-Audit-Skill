# Explicit consent (açık rıza)

## KVKK-CON-001: Explicit consent missing, bundled or pre-ticked

**Default severity:** `high`
**Applies to:** `controller`
**Legal basis:** KVKK md. 3 defines explicit consent (açık rıza) as freely given, specific and informed; md. 5(1) states consent as the rule and md. 5(2) lists the alternative conditions; md. 6(3)(a) is one of the special-category conditions; blanket consent and consent made a condition of the service are invalid — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Açık Rıza Alırken Dikkat Edilecek Hususlar](https://www.kvkk.gov.tr/Icerik/2037/Acik-Riza-Alirken-Dikkat-Edilecek-Hususlar), [Hizmetin Açık Rıza Şartına Bağlanması](https://www.kvkk.gov.tr/Icerik/5412/Acik-Rizanin-Hizmet-Sartina-Baglanmasi)

Explicit consent (md. 5(1), md. 6(3)(a)) is needed only when no md. 5(2)/6(3) alternative condition fits,
such as performance of a contract, a legal obligation or legitimate interest. The Authority says that
relying on consent when another condition applies misleads the data subject. This rule therefore targets:
(a) processing that can only rest on consent but has no consent step; and (b) consent steps that are
invalid by design.

### What to look for

- Purposes that typically need consent because no other md. 5(2) condition fits:
  marketing and profiling, behavioural advertising, sharing with partners for their own purposes, optional
  analytics beyond service operation, and special-category data where no other md. 6(3) condition applies.
  Check whether the data flows for these purposes are gated by a stored consent.
- A single "I accept the Terms, Privacy Notice and KVKK consent" checkbox. This bundles separate
  matters into one blanket consent (battaniye rıza).
- Consent checkboxes that are checked by default (`checked`, `defaultChecked`, `value={true}`,
  `isSelected = true`).
- Sign-up or checkout that cannot proceed unless optional consent is given (button disabled until
  the marketing/consent box is ticked; server-side validation `required` on an optional consent).
- No record of consent: no timestamp, text version, channel or user ID stored. The burden of proof
  is on the controller.
- No way to withdraw consent, or withdrawal that does not stop the processing.

### Common patterns

The scanner has no dedicated pattern for this rule, so read the sign-up, checkout, profile and settings flows.

- **Node/TypeScript (React/Vue/Angular):** `<input type="checkbox" defaultChecked name="kvkkConsent">`;
  `disabled={!acceptAll}` on submit; Express/Nest validator `consent: z.literal(true)` for an optional purpose.
- **Python:** Django form `consent = forms.BooleanField(required=True, initial=True)`;
  Flask/WTForms `BooleanField(default=True)`.
- **Java/Kotlin:** Spring `@AssertTrue private boolean marketingConsent;` on a registration DTO;
  Android `CheckBox` with `android:checked="true"`; Compose `Checkbox(checked = true, ...)`.
- **.NET:** `[Range(typeof(bool), "true", "true")] public bool Consent { get; set; }` on an optional purpose;
  Razor `<input asp-for="Consent" checked />`.
- **PHP:** Laravel rule `'consent' => 'accepted'` covering terms *and* consent together;
  Blade `<input type="checkbox" name="kvkk" checked>`.
- **Mobile:** iOS `UISwitch` with `isOn = true` for consent; onboarding with no "skip" option
  before analytics/ads SDK initialisation.

### Needs-verification when

- The purpose might rest on another md. 5(2) condition (contract, legal obligation, legitimate
  interest). The code cannot tell the legal assessment, so report with `needs_verification`.
- Consent UI is rendered by a third-party consent tool or remote config you cannot see.
- A consent record exists but you cannot see whether withdrawal stops the related processing.

### Recommendation

First decide the legal condition for each purpose. Use explicit consent only where no other condition fits.
Where consent is needed:

- Ask for it separately for each specific purpose, with unticked boxes.
- Show it apart from the privacy notice. The Aydınlatma Tebliği md. 5(1)(f) requires informing and obtaining consent to be done separately.
- Never make it a condition of the core service.
- Store who consented, to what text version, when and through which channel.
- Provide an easy withdrawal that stops the processing from the moment the withdrawal is received.
