# Retention, erasure and destruction (saklama ve imha)

## KVKK-RET-001: No retention period or erasure mechanism

**Default severity:** `medium`
**Applies to:** `both`
**Legal basis:** KVKK md. 4(2)(d) (store only for the period set by legislation or needed for the purpose) and md. 7 (erase, destroy or anonymise ex officio when the reasons for processing cease) — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [Silme, yok etme, anonim hale getirme](https://www.kvkk.gov.tr/Icerik/2038/kisisel-verilerin-silinmesi-yok-edilmesi-veya-anonim-hale-getirilmesi), [Silme Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/bc1cb353-ef85-4e58-bb99-3bba31258508.pdf)

The controller must erase personal data on its own initiative. No request from the data subject is
needed. A processor carries out deletion on the controller's instructions, so for a processor check that
the code can delete or return data when the controller asks.

### What to look for

- Any automated clean-up of personal data: scheduled jobs (cron, queues, cloud schedulers), DB TTL
  indexes, object-storage lifecycle rules, log retention settings.
- Configured retention periods (`RETENTION_DAYS`, `ttl`, `expireAfterSeconds`, `deleteAfter`).
- Soft-delete only (`deleted_at`, `is_deleted`) with no later hard delete or anonymisation.
- Backups, data exports, analytics copies and log stores kept forever.
- Inactive accounts, abandoned carts, rejected job applications, expired OTP/verification records
  with no purge.

### Common patterns

The scanner has no dedicated pattern for this rule. Search for the absence or presence of clean-up code.

- **Node/TypeScript:** `node-cron` / BullMQ repeatable jobs deleting users; Mongo
  `createIndex({ createdAt: 1 }, { expireAfterSeconds: ... })`; Prisma `deleteMany({ where: { createdAt: { lt } } })`.
- **Python:** Celery beat tasks; Django management command `purge_inactive_users`; `django-softdelete`
  without purge.
- **Java/Kotlin:** Spring `@Scheduled(cron = ...)` cleanup service; Hibernate `@SQLDelete` soft-delete
  only.
- **.NET:** Hangfire/Quartz recurring jobs; EF Core global query filter `IsDeleted` with no purge.
- **PHP:** Laravel `$schedule->command('model:prune')` with `Prunable`/`MassPrunable` models;
  `SoftDeletes` without pruning.
- **Infrastructure/mobile:** S3/GCS lifecycle rules in Terraform; CloudWatch/Log Analytics retention;
  local SQLite/Room/Core Data caches on the device never cleared after logout.

### Needs-verification when

- Retention is likely enforced outside the repository (DBA scripts, cloud console lifecycle rules,
  managed log retention).
- Soft delete exists and a hard delete may run elsewhere.
- Retention periods depend on other laws (tax, commerce, health). These need a legal assessment, so do
  not mark them as violations; report them as `needs_verification`.

### Recommendation

Set a maximum retention period for each data category, based on its purpose and any legal storage
duty. Implement automated erasure or anonymisation when the period ends, covering backups, logs and
copies. Record erasure actions. Document the periods in a retention and destruction policy (kişisel veri
saklama ve imha politikası) and add checklist item `CL-RETENTION-POLICY`. Which controllers must keep a
*written* policy, and the maximum interval between periodic destructions, are set by the Deletion
Regulation. This catalog did not verify them, so verify with counsel.

## KVKK-RET-002: No account deletion path

**Default severity:** `medium`
**Applies to:** `controller`
**Legal basis:** KVKK md. 7 (erasure when the reasons for processing cease, ex officio or on request) and md. 11(1)(e) (right to request erasure or destruction under md. 7) — [Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law), [İlgili Kişinin Hakları](https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari)

KVKK does not literally require a "delete account" button. However, when a user closes the relationship,
the reason for processing most account data usually ends, and md. 7 then requires erasure. This rule
reports applications that create user accounts but provide no way, in-app or through a documented
request, to end the account and erase its data.

### What to look for

- Applications with registration or login but no account deletion endpoint, UI or documented request
  route.
- A "delete account" action that only deactivates the account (`active = false`) with no erasure or
  anonymisation afterwards.
- Deletion that misses related data: uploads in object storage, data held by third-party processors
  (CRM, e-mail, analytics), search indexes, caches.

### Common patterns

The scanner has no dedicated pattern for this rule.

- **Node/TypeScript:** missing `DELETE /users/me` or `/account` route; Firebase Auth
  `user.delete()` without deleting Firestore/Storage documents.
- **Python:** Django without a view that deletes `request.user`; DRF `UserViewSet` without `destroy`.
- **Java/Kotlin:** Spring controller without `@DeleteMapping("/me")`; Keycloak users never removed.
- **.NET:** ASP.NET Identity scaffold `DeletePersonalData.cshtml` removed or disabled.
- **PHP:** Laravel Jetstream/Fortify `DeleteUser` action not wired; WordPress without
  "Erase personal data" handling.
- **Mobile:** no in-app account deletion screen in iOS/Android apps that support account creation.

### Needs-verification when

- Deletion is handled by e-mail or support request outside the code. Check that it is documented in the
  privacy notice.
- Some data must be kept under another law (invoices, for example). Partial retention may then be lawful.
- Authentication is delegated to an identity provider whose deletion flow you cannot see.

### Recommendation

Provide an account deletion path: an in-app action, or a documented request process answered within the
md. 13 period. It should erase or anonymise the account's personal data across the database, storage,
caches and processors. Keep only what another law requires, for the period it requires, and explain this
in the privacy notice.
