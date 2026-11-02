# Logging (log kayıtları)

## KVKK-LOG-001: Personal data written to logs without masking

**Default severity:** `medium`
**Applies to:** `both`
**Legal basis:** KVKK md. 4(2)(ç) (relevant, limited and proportionate) and md. 12(1) (measures against unlawful access); the Board's security guide lists log records and data masking among technical measures — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Kişisel Veri Güvenliği Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/7512d0d4-f345-41cb-bc5b-8d5cf125e3a1.pdf)

Logs are copied, shipped to third-party tools, kept longer than application data and read by many
people. Personal data in logs therefore widens access and retention beyond the purpose. Security logs
of access to personal data are recommended; the problem is logging the personal data itself.

### What to look for

- Log statements that print personal-data fields or whole user/request objects: e-mail, phone,
  TCKN, IBAN, address, birth date, full name, tokens, passwords.
- Request/response logging middleware that dumps bodies or headers (Authorization, cookies).
- Error handlers that log full payloads, and crash reporters configured to send request bodies or
  user details.
- Special-category data in logs. Raise to `high`. Also raise to `high` for passwords, TCKN or full card
  data in logs.

### Common patterns

The scanner returns candidates through `log-personal-data`: a log call and a personal-data term on the
same line. Multi-line calls and whole-object logging need manual review.

- **Node/TypeScript:** `console.log(user)`, `logger.info({ body: req.body })`, `morgan('combined')`
  with a custom body token, `pino` without `redact` paths.
- **Python:** `logging.info(f"user {user.email}")`, `print(request.data)`, Django `DEBUG=True` error pages.
- **Java/Kotlin:** `log.info("Customer: {}", customer)` where `toString()` includes all fields; Lombok
  `@ToString` on entities; Android `Log.d(TAG, "phone=" + phone)`.
- **.NET:** `_logger.LogInformation("User {@User}", user)` (destructuring with `@`), Serilog request logging
  with bodies.
- **PHP:** `Log::info($request->all())`, `error_log(print_r($_POST, true))`.
- **Mobile:** `print`/`NSLog`/`os_log` with user data in release builds; Crashlytics custom keys with e-mail.

### Needs-verification when

- The logged variable might already be masked by a logger configuration you cannot see (redaction rules
  in a log pipeline).
- The statement runs only in development builds. Check whether the flag is off in production.
- The field name matches but the value is not personal (for example `emailTemplateId`).

### Recommendation

Log identifiers instead of personal data, such as an internal user ID or a hash. Mask or redact sensitive
fields in the logger configuration (for example `pino` `redact`, Serilog destructuring policies, Logback
masking patterns). Never log credentials or tokens. Disable body logging in production. Set a retention
period for logs and include log stores in `KVKK-RET-001`.
