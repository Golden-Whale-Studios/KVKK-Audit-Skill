# Personal data (kişisel veri)

## KVKK-PD-001: Personal data inventory

**Default severity:** `info`
**Applies to:** `both`
**Legal basis:** KVKK md. 3 (Art. 3) defines personal data (kişisel veri) as any information relating to an identified or identifiable natural person; md. 4 sets the processing principles — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Kişisel Veriler](https://www.kvkk.gov.tr/Icerik/2050/Kisisel-Veriler)

This rule does not report a violation. It builds the `dataInventory` that every other rule relies on:
which personal data the application collects, stores or sends, and where. Report one grouped
`KVKK-PD-001` finding (severity `info`) that summarises the inventory.

### What to look for

- Database schemas, migrations, ORM models, DTOs, API request/response types, form fields and
  mobile data classes containing person-related fields:
  - identity: name/surname, Turkish ID number (TCKN, T.C. kimlik no), passport no, date and place of birth;
  - contact: e-mail, phone, address, postal code;
  - financial: IBAN, card holder name, billing details;
  - online identifiers: IP address, device ID / advertising ID, push token, user ID linked to a person,
    precise location (lat/lng), cookies tied to a user;
  - content created by a person that identifies them: photos, voice recordings, free-text profiles.
- Literal values that look like real personal data in code, fixtures or seeds (11-digit TCKN-like
  numbers, real-looking e-mails, `+90 5xx` phone numbers, `TR` IBANs).
- Third-party SDK calls that send user attributes (identify/setUser/setUserProperties).

Group fields by category in `dataInventory` (`category`, `fields`, `locations`). Mark a category
`specialCategory: true` only for KVKK md. 6 data (see `special-categories.md`).

### Common patterns

The scanner (`scan-patterns.mjs`, `patterns.json`) returns candidates for this rule
(`pd-national-id`, `pd-phone-*`, `pd-email-*`, `pd-iban`, `pd-address`, `pd-birthdate`,
`pd-person-name`). Confirm them by reading the code. Also look for fields the scanner does not cover
(IP, location, device IDs). Typical shapes:

- **Node/TypeScript:** Prisma `model User { tckn String  phone String }`, Mongoose
  `new Schema({ email: String, address: String })`, Zod/Joi schemas, `req.body.email`.
- **Python:** Django `models.CharField(... name="tc_kimlik_no")`, SQLAlchemy `Column("phone", String)`,
  Pydantic `class Customer(BaseModel): iban: str`.
- **Java/Kotlin:** JPA `@Entity class Customer { @Column String nationalId; }`,
  `data class User(val email: String, val birthDate: LocalDate)`.
- **.NET:** EF Core entity `public string PhoneNumber { get; set; }`, `[EmailAddress]` attributes.
- **PHP:** Laravel migration `$table->string('tckn', 11);`, `$request->input('adres')`.
- **Mobile:** Android `Settings.Secure.ANDROID_ID`, `AdvertisingIdClient`, `FusedLocationProviderClient`;
  iOS `identifierForVendor`, `ASIdentifierManager`, `CLLocationManager`; Flutter/React Native contact
  or location plugins.
- **SQL:** `CREATE TABLE customers (tc_no CHAR(11), email VARCHAR ...)`.

### Needs-verification when

- A field name is ambiguous (`name` of a product vs. a person, `address` of a server, `id` that may or
  may not map to a person).
- An identifier (device ID, IP, analytics ID) is collected but you cannot see whether it is linked to a
  person. Under md. 3, "identifiable" is enough, so keep it in the inventory and mark it `needs_verification`.
- Literal values in tests or seeds look real but could be synthetic.

### Recommendation

Keep the inventory as the basis for the privacy notice (aydınlatma metni), the retention policy and,
if required, the VERBİS registration. Collect only fields needed for a stated purpose (KVKK md. 4(2)(ç):
relevant, limited and proportionate). Replace real-looking personal data in fixtures and seeds with
clearly synthetic values.
