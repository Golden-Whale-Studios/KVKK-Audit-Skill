# Data security (veri güvenliği)

KVKK md. 12(1) requires the controller to take all necessary technical and organisational measures
to prevent unlawful processing of, and unlawful access to, personal data, and to ensure its protection.
Under md. 12(2) the controller is jointly responsible with its processors. The Law does not name
specific algorithms. The Board's Kişisel Veri Güvenliği Rehberi lists measures such as access
limitation, strong passwords and limits on login attempts, encryption with internationally accepted
tools and key management, SSL or more secure connections when collecting data through websites and
mobile apps, log records and data masking. Where a recommendation below names a concrete algorithm,
it is common engineering practice, not a legal text.

## KVKK-SEC-001: Weak or plaintext password storage

**Default severity:** `high`
**Applies to:** `both`
**Legal basis:** KVKK md. 12(1) (Art. 12(1)) — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Veri Güvenliğine İlişkin Yükümlülükler](https://www.kvkk.gov.tr/Icerik/2040/Veri-Guvenligine-Iliskin-Yukumlulukler), [Kişisel Veri Güvenliği Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/7512d0d4-f345-41cb-bc5b-8d5cf125e3a1.pdf)

### What to look for

- Passwords stored in plaintext or with reversible encryption.
- Passwords hashed with fast, unsalted general-purpose hashes (MD5, SHA-1, single-round SHA-256).
- Password comparison with `==`/`===` against a stored value, or SQL `WHERE password = ?`.
- No limit on login attempts (the guide names limiting attempts against brute force).

Raise to `critical` when passwords are stored in plaintext or with reversible encryption.

### Common patterns

The scanner returns candidates through `sec-weak-hash` and `sec-plain-password-compare`.

- **Node/TypeScript:** `crypto.createHash('md5').update(password)`; `user.password === req.body.password`.
- **Python:** `hashlib.sha1(password.encode())`; `User.objects.get(password=pw)`.
- **Java/Kotlin:** `MessageDigest.getInstance("MD5")` on a password; Spring `NoOpPasswordEncoder`.
- **.NET:** `MD5.Create().ComputeHash(...)` on a password; custom `PasswordHasher` returning the input.
- **PHP:** `md5($password)`, `sha1($password)`; `$user->password == $_POST['password']`.
- **Mobile:** passwords saved in `SharedPreferences`/`UserDefaults` instead of Keystore/Keychain.

### Needs-verification when

- MD5/SHA-1 appears near "password" but is used for something else (a checksum or cache key).
- Hashing happens in an identity provider or library you cannot see.

### Recommendation

Store passwords only with a slow, salted password-hashing function (for example Argon2id, bcrypt or
scrypt, via the framework's standard password hasher). Compare using the library's verify function.
Limit login attempts. Rotate weakly hashed passwords to the new scheme at the next login.

## KVKK-SEC-002: Personal data sent over unencrypted connections

**Default severity:** `high`
**Applies to:** `both`
**Legal basis:** KVKK md. 12(1) (Art. 12(1)); the Board's security guide names SSL or more secure connections when personal data is collected through websites and mobile apps — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Kişisel Veri Güvenliği Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/7512d0d4-f345-41cb-bc5b-8d5cf125e3a1.pdf)

### What to look for

- Non-local `http://` endpoints used for APIs, webhooks, form actions, SDK endpoints or file
  downloads that carry personal data.
- TLS verification disabled (`rejectUnauthorized: false`, `verify=False`, trust-all managers).
- Mobile cleartext allowed (`usesCleartextTraffic="true"`, `NSAllowsArbitraryLoads`).
- DB, SMTP or message-broker connections without TLS to hosts outside a private network.

### Common patterns

The scanner returns candidates through `sec-http` (localhost, private ranges and XML namespaces are excluded).

- **Node/TypeScript:** `fetch('http://api.partner.com/users')`; `https.Agent({ rejectUnauthorized: false })`.
- **Python:** `requests.post("http://...", json=user)`; `requests.get(url, verify=False)`.
- **Java/Kotlin:** `HttpURLConnection` to `http://`; OkHttp `hostnameVerifier { _, _ -> true }`.
- **.NET:** `HttpClient` base address `http://`; `ServerCertificateCustomValidationCallback = (...) => true`.
- **PHP:** `curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false)`; `<form action="http://...">`.
- **Mobile:** Android `network_security_config` with `cleartextTrafficPermitted="true"`; iOS ATS exceptions.

### Needs-verification when

- The URL is a placeholder, documentation link or development-only host.
- TLS might be terminated by a proxy or load balancer outside the code.
- You cannot see whether personal data travels on that connection. Report it as `needs_verification` and
  lower the severity to `medium`.

### Recommendation

Use HTTPS/TLS for every connection that carries personal data. Never disable certificate verification
in production builds. Remove cleartext exceptions from mobile configs. Enable TLS on database and mail
connections that leave a private network.

## KVKK-SEC-003: Secrets committed to the repository

**Default severity:** `high`
**Applies to:** `both`
**Legal basis:** KVKK md. 12(1) (Art. 12(1)): measures against unlawful access; the Board's security guide says encryption keys must be kept where only authorised persons can access them and lists key management among technical measures — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Kişisel Veri Güvenliği Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/7512d0d4-f345-41cb-bc5b-8d5cf125e3a1.pdf)

### What to look for

- API keys, database passwords, JWT signing secrets, OAuth client secrets, private keys and cloud
  access keys as literals in source, config files or committed `.env` files.
- Keys that unlock systems holding personal data: database, storage bucket, CRM, e-mail/SMS provider,
  payment provider.

Raise to `critical` when a live production secret that grants access to personal data is present.
Never copy the secret value into a snippet: replace it with `***` or omit the snippet (workflow
Step 4.5). `redactSnippet` masks only some formats.

### Common patterns

The scanner returns candidates through `sec-hardcoded-secret` and `sec-key-material` (PEM private key blocks,
`AKIA...`, `sk_live_...`, `AIza...`).

- **Node/TypeScript:** `const JWT_SECRET = "..."`; committed `.env` with `DATABASE_URL=postgres://user:pass@...`.
- **Python:** `SECRET_KEY = "..."` in Django `settings.py`; `boto3.client(aws_secret_access_key="...")`.
- **Java/Kotlin:** `spring.datasource.password=...` in `application.properties`; keystore passwords in Gradle files.
- **.NET:** connection strings with `Password=` in `appsettings.json`.
- **PHP:** `define('DB_PASSWORD', '...')` in `wp-config.php`; committed Laravel `.env`.
- **Mobile:** API keys in `strings.xml`, `Info.plist` or `google-services.json` (Firebase web API keys
  are not secret by themselves, but server keys and service-account JSON are).

### Needs-verification when

- The value is an obvious placeholder, a test key (`sk_test_...`), or a public client identifier.
- You cannot tell whether the key is for production or still valid.

### Recommendation

Remove secrets from the code and its history. Rotate every exposed secret. Load secrets from environment
variables or a secrets manager. Add `.env` and key files to `.gitignore`, and add secret scanning to CI.

## KVKK-SEC-004: Special-category data stored without encryption

**Default severity:** `high`
**Applies to:** `both`
**Legal basis:** KVKK md. 6(4) and md. 12(1); Kurul decision 2018/10 requires, for electronic media, storing special-category data with cryptographic methods and keeping keys securely and in different environments — [Özel Nitelikli Veri Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/70f95c73-06a2-44dc-81e9-34201bdd7f5c.pdf), [Özel Nitelikli Kişisel Veriler](https://www.kvkk.gov.tr/Icerik/2051/Ozel-Nitelikli-Kisisel-Veriler), [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law)

### What to look for

- Columns, documents or files that hold `KVKK-SP-001` data (health, biometric templates, religion,
  criminal records, etc.) stored as plain text, with no field-level or storage-level encryption visible.
- Encryption keys stored next to the data (same DB or same config file), which conflicts with
  "keys in different environments".
- Special-category uploads in public or unencrypted buckets.
- Special-category data sent between servers without VPN/sFTP/TLS, or by unencrypted e-mail.

Raise to `critical` when special-category data is publicly reachable (public bucket, unauthenticated
endpoint) or sent in cleartext.

### Common patterns

The scanner provides `sp-*` candidates. Combine them with storage code.

- **Node/TypeScript:** Mongoose `diagnosis: String` without `mongoose-field-encryption` or MongoDB CSFLE;
  S3 `ACL: 'public-read'` on medical uploads.
- **Python:** Django `TextField` for health notes without `django-cryptography` / pgcrypto.
- **Java/Kotlin:** JPA entity without an `@Convert(converter = EncryptedStringConverter.class)`;
  Room tables with health data without SQLCipher.
- **.NET:** EF Core property without a value converter for encryption; SQL Server without Always
  Encrypted/TDE.
- **PHP:** Laravel model without `protected $casts = ['diagnosis' => 'encrypted'];`.
- **Mobile:** HealthKit/biometric data cached in plain files instead of the Keychain or EncryptedFile APIs.

### Needs-verification when

- Encryption may be applied at the storage layer (disk/TDE/KMS) and is not visible in code.
  Disk encryption alone may not meet "cryptographic methods" for the data, so verify.
- The special-category classification itself is `needs_verification` under `KVKK-SP-001`.

### Recommendation

Encrypt special-category data at field or record level with a vetted library or database feature. Keep
keys in a KMS or HSM, separate from the data. Log every access securely. Restrict access to authorised
roles. Transfer special-category data only over encrypted channels. Apply the rest of the 2018/10 measures
(see `CL-SPECIAL-CATEGORY-MEASURES`).
