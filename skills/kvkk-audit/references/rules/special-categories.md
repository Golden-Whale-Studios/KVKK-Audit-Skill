# Special categories of personal data (özel nitelikli kişisel veri)

## KVKK-SP-001: Special-category personal data is processed

**Default severity:** `medium`
**Applies to:** `both`
**Legal basis:** KVKK md. 6 (Art. 6) as amended by Law No. 7499 (in force 1 June 2024): processing is prohibited unless a md. 6(3) condition applies, and the Board's adequate measures (md. 6(4); Kurul decision 2018/10) are mandatory — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Özel Nitelikli Kişisel Veriler](https://www.kvkk.gov.tr/Icerik/2051/Ozel-Nitelikli-Kisisel-Veriler), [Özel Nitelikli Veri Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/70f95c73-06a2-44dc-81e9-34201bdd7f5c.pdf)

The md. 6(1) list is closed and cannot be extended by analogy. It covers race, ethnic origin, political opinion,
philosophical belief, religion, sect or other belief, appearance and dress (kılık ve kıyafet),
membership of an association, foundation or trade union, health, sexual life, criminal conviction
and security measures, and biometric and genetic data. Since 1 June 2024, all these categories follow
the same rules: the old separate treatment of health and sexual-life data was removed, and explicit
consent (açık rıza) is now one of several md. 6(3) conditions rather than the only route.

### What to look for

- Fields, tables, enums or API payloads that hold any md. 6(1) category: diagnosis, prescriptions,
  blood type, allergies, disability, pregnancy, test results; fingerprint, face template/embedding,
  voiceprint; religion/sect; union membership; ethnicity; political view; sexual orientation;
  criminal record (sabıka); headscarf/dress choices; DNA/genetic results.
- Uploads that are likely to contain such data: medical reports, ID photos used for face matching,
  health-insurance documents.
- Features that derive such data (for example, a face-recognition login, a health or symptom tracker, a dating
  profile with orientation).

Record each category in `dataInventory` with `specialCategory: true`. Also feed it into
`KVKK-SEC-004` (storage protection), `KVKK-LOG-001` (logs) and `KVKK-XB-001` (escalation when
it goes abroad).

### Common patterns

The scanner returns candidates through `sp-health`, `sp-biometric`, `sp-belief-union` and
`sp-criminal`. These are keyword matches, so read the surrounding code.

- **Node/TypeScript:** `diagnosis: String` in a Prisma/Mongoose model; `faceapi.computeFaceDescriptor()`
  results saved to a DB; `bloodType` in a form schema.
- **Python:** Django `MedicalRecord` model, `face_recognition.face_encodings()` stored with a user;
  `religion = models.CharField(...)`.
- **Java/Kotlin:** `@Entity class PatientRecord`, `BiometricPrompt` (note: Android `BiometricPrompt`
  normally verifies on-device and does **not** give the app the fingerprint. That is not storage of
  biometric data, but say so in the report).
- **.NET:** `public string Diagnosis { get; set; }`, `Microsoft.Azure.CognitiveServices.Vision.Face`
  person groups.
- **PHP:** Laravel `$table->string('kan_grubu')`, `$table->text('sabika_kaydi')`.
- **Mobile:** HealthKit (`HKHealthStore`), Google Fit / Health Connect reads; iOS `LAContext`
  (on-device, same caveat as `BiometricPrompt`); camera capture sent to a face-matching API.

### Needs-verification when

- The keyword appears but the meaning is unclear (for example, `health` as a service health check, `din` as a variable,
  `patient` in a demo app).
- Biometric APIs are used. Check whether templates leave the device or are stored server-side.
- Free-text fields (notes, messages) could contain health or other md. 6 data, but nothing in the code
  shows that they are meant to.

Report these with certainty `needs_verification`. Do not drop them.

### Recommendation

Identify and document the md. 6(3) condition that allows each processing activity. If it is explicit consent,
obtain it separately (see `KVKK-CON-001`). Apply the Board's adequate measures from decision 2018/10,
as summarised in the special-categories guide. For electronic media these include cryptographic storage,
keys kept securely and in a different place, secure logging of every operation, regular security tests, and
at least two-factor authentication for remote access. Collect the minimum needed. Add checklist item
`CL-SPECIAL-CATEGORY-MEASURES` to the report.
Raise the severity to `high` when special-category data is processed together with a `KVKK-SEC-004`,
`KVKK-LOG-001` or `KVKK-XB-001` (special-category evidence) finding.
