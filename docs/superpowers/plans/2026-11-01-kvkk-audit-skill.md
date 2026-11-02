# KVKK Audit Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coding agent'ların bir kod tabanını KVKK açısından tarayıp genel hüküm + bulgular içeren Markdown/JSON rapor üretmesini sağlayan, açık kaynak bir Agent Skill paketi.

**Architecture:** Taramayı agent yapar; `skills/kvkk-audit/SKILL.md` adım adım iş akışını, `references/` kural kataloğunu ve rapor şablonunu taşır. Bağımlılıksız Node betikleri (aday kalıp taraması, gruplama, hüküm hesabı, maskeleme, şema doğrulama, dil tespiti) tutarlılık sağlar ama zorunlu değildir. Aynı skill dizini hem `npx skills` hem Claude Code plugin yapısıyla kurulur; `AGENTS.md` ve Cursor kuralı ince giriş noktalarıdır.

**Tech Stack:** Markdown (Agent Skills formatı), Node.js ≥ 18 ES modules (betikler, sıfır runtime bağımlılığı), `node:test`, devDependency olarak `ajv` (yalnızca testlerde şema tutarlılığı).

**Spec:** `docs/superpowers/specs/2026-11-01-kvkk-audit-skill-design.md`

## Global Constraints

- Kapsam yalnızca KVKK (6698 s. Kanun + ikincil düzenlemeler); GDPR yok.
- Her raporda "hukuki görüş değildir" uyarısı zorunlu; "yayına hazır" hükmünde bile.
- Risk kaçırmama: emin olunamayan bulgu silinmez, `certainty: "needs_verification"` ile raporlanır ve hükme dahil edilir.
- Hüküm: herhangi bir `critical` → `serious_risk`; değilse herhangi bir `high`/`medium` → `fixes_needed`; değilse `looks_ready`.
- Önem dereceleri: `critical`, `high`, `medium`, `low`, `info`. Kesinlik: `confirmed`, `needs_verification`.
- Yurt dışı servisler tek gruplanmış bulgu `KVKK-XB-001`, derece `info`; özel nitelikli veri aktarımı kanıtı varsa `high`.
- Rapor dili: konuşma dili → OS dil ayarı → `en`. KVKK terimleri her dilde Türkçe aslıyla: ör. "explicit consent (açık rıza, KVKK md. 5)".
- JSON'da kimlikler, enum değerleri ve alan adları İngilizce sabit; serbest metinler rapor dilinde.
- Çıktı: proje kökünde `kvkk-report/report.md` ve `kvkk-report/report.json`.
- Özet rapor varsayılan; aynı `ruleId` bulguları gruplanır, ilk 3 örnek gösterilir. Detaylı rapor istek üzerine.
- Her mevzuat atfı resmî kaynak bağlantısıyla (mevzuat.gov.tr, kvkk.gov.tr) verilir; katalogda "son doğrulama tarihi" bulunur.
- Kural dosyaları İngilizce; README İngilizce + Türkçe; lisans MIT.
- Betikler çalıştırılamazsa skill yalnızca talimatlarla tamamlanabilmeli.
- Rol adımı: veri sorumlusu (`controller`) / veri işleyen (`processor`); belirlenemezse `controller` varsayılır ve raporda belirtilir.

## Review Focus

1. Rapordaki kanıt kesitleri gerçek kişisel veri ya da gizli anahtar içerebilir → kesitlerde TCKN benzeri 11 hane, e-posta, IBAN, telefon ve anahtar/şifre değerleri maskelenmeli (Task 2, `redactSnippet` testleri).
2. Hiç kişisel veri içermeyen ya da boş proje → çökme yok; geçerli rapor, boş bulgular, `looks_ready` (Task 2 ve Task 4 testleri).
3. Büyük depolar: `node_modules`, `.git`, `dist`, `build`, `vendor`, küçültülmüş dosyalar, ikili dosyalar ve 1 MB üstü dosyalar taranmamalı (Task 4 testleri).
4. Önceki çalıştırmadan kalan `kvkk-report/` → taranmamalı (kendi raporunu bulgu sanmamalı) ve üzerine yazılmalı (Task 4 ve Task 2 testleri).
5. Windows yolları → rapordaki dosya yolları her zaman `/` ile ve proje köküne göreli (Task 4 testi).

---

## Dosya yapısı

```
skills/kvkk-audit/
  SKILL.md                      # giriş: tetikleme açıklaması + iş akışı özeti
  references/
    workflow.md                 # adım 0-5 ayrıntılı talimat
    report-template.md          # özet ve detaylı Markdown şablonu
    language.md                 # dil seçimi ve terim kuralları
    severity.md                 # derece/kesinlik/hüküm kuralları
    checklist.md                # koddan doğrulanamayan maddeler
    sources.md                  # resmî kaynak bağlantıları + son doğrulama tarihi
    rules/*.md                  # alan başına bir kural dosyası (Task 5)
  schema/report.schema.json
  scripts/
    lib/validate.mjs  lib/verdict.mjs  lib/group.mjs  lib/redact.mjs  lib/lang.mjs  lib/scan.mjs
    patterns.json
    scan-patterns.mjs  finalize-report.mjs  detect-language.mjs  compare-findings.mjs
examples/<name>/...  examples/<name>/expected-findings.json
tests/*.test.mjs
.claude-plugin/plugin.json   AGENTS.md   .cursor/rules/kvkk-audit.mdc
README.md  README.tr.md  LICENSE  package.json  .gitignore  docs/TESTING.md
```

## Ortak veri tipleri (tüm görevler)

`Finding` (detaylı, gruplanmamış):

```
{ id: string,            // "F-001"
  ruleId: string,        // "KVKK-LOG-001"
  title: string,
  severity: "critical"|"high"|"medium"|"low"|"info",
  certainty: "confirmed"|"needs_verification",
  legalRefs: [{ label: string, url: string }],
  description: string,
  recommendation: string,
  occurrences: [{ file: string, line: number, snippet?: string }],
  occurrenceCount: number }
```

`Report`:

```
{ schemaVersion: "1.0",
  tool: { name: "kvkk-audit", version: string },
  generatedAt: string,                     // ISO 8601
  language: string,                        // BCP 47, ör. "tr", "en"
  mode: "summary"|"detailed",
  project: { name: string, role: "controller"|"processor",
             roleAssumed: boolean, applicability: "applies"|"likely"|"unclear" },
  verdict: "serious_risk"|"fixes_needed"|"looks_ready",
  summary: string,
  dataInventory: [{ category: string, fields: string[], specialCategory: boolean, locations: string[] }],
  findings: Finding[],
  crossBorder: { services: [{ name: string, dataTypes: string[],
                 evidence: [{ file: string, line: number }], specialCategoryEvidence: boolean }] },
  checklist: [{ id: string, question: string, legalRefs: [{label,url}], status: "unknown"|"yes"|"no" }],
  disclaimer: string }
```

Kural kimlikleri (Task 5 bunları tanımlar; diğer görevler bunlara başvurur):
`KVKK-PD-001` kişisel veri envanteri · `KVKK-SP-001` özel nitelikli veri · `KVKK-CON-001` açık rıza eksik/paketlenmiş · `KVKK-NOT-001` aydınlatma bağlantısı yok · `KVKK-RET-001` saklama/imha yok · `KVKK-RET-002` hesap silme yok · `KVKK-SEC-001` zayıf parola saklama · `KVKK-SEC-002` şifresiz aktarım (http) · `KVKK-SEC-003` depoda gizli anahtar · `KVKK-SEC-004` özel nitelikli veri şifresiz saklama · `KVKK-LOG-001` log'da kişisel veri · `KVKK-XB-001` yurt dışı aktarım (gruplu) · `KVKK-CK-001` rıza öncesi izleme · `KVKK-DSR-001` ilgili kişi başvuru mekanizması yok · `KVKK-IYS-001` ticari ileti izni ayrı değil.

---

### Task 1: Proje iskeleti, rapor şeması ve doğrulayıcı

**Files:**
- Create: `package.json`, `.gitignore`, `LICENSE` (MIT, yıl 2026), `skills/kvkk-audit/schema/report.schema.json`, `skills/kvkk-audit/scripts/lib/validate.mjs`
- Test: `tests/validate.test.mjs`, `tests/fixtures/valid-report.json`

**Interfaces:**
- Produces: `validateReport(report: object): string[]` (boş dizi = geçerli; her hata `"<json-path>: <mesaj>"`). `report.schema.json` (JSON Schema draft 2020-12) yukarıdaki `Report` tipini birebir tanımlar, `additionalProperties: false`.

- [ ] **Step 1:** `package.json`: `"type": "module"`, `"engines": {"node": ">=18"}`, `"scripts": {"test": "node --test tests/"}`, devDependency `ajv` (2020 desteği için `ajv/dist/2020.js`). `.gitignore`: `node_modules/`, `kvkk-report/`.
- [ ] **Step 2: Failing testler yaz** — `tests/validate.test.mjs`:
  - `valid-report.json` için `validateReport` → `[]`.
  - `verdict: "ok"` → hata dizisi `"verdict"` içeren bir eleman barındırır.
  - Eksik `disclaimer` → hata.
  - `findings[0].severity: "urgent"` → `"findings[0].severity"` içeren hata.
  - Fazladan üst düzey alan `foo` → hata.
  - Tutarlılık: ajv ile `report.schema.json` derlenir; fixture ve yukarıdaki 4 bozuk varyant için ajv'nin geçerli/geçersiz kararı `validateReport(...).length === 0` ile aynı.
- [ ] **Step 3:** `npm install && npm test` → FAIL.
- [ ] **Step 4:** Şemayı ve `validateReport`'u (bağımlılıksız, şemadaki tip/enum/zorunlu alan/additionalProperties kurallarını elle uygular) yaz.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: rapor şeması ve doğrulayıcı"`

### Task 2: Hüküm, gruplama, maskeleme ve `finalize-report`

**Files:**
- Create: `skills/kvkk-audit/scripts/lib/verdict.mjs`, `lib/group.mjs`, `lib/redact.mjs`, `skills/kvkk-audit/scripts/finalize-report.mjs`
- Test: `tests/verdict.test.mjs`, `tests/group.test.mjs`, `tests/redact.test.mjs`, `tests/finalize.test.mjs`

**Interfaces:**
- Consumes: `validateReport` (Task 1).
- Produces:
  - `computeVerdict(findings: Finding[]): "serious_risk"|"fixes_needed"|"looks_ready"`
  - `groupFindings(findings: Finding[], { maxExamples = 3 } = {}): Finding[]` — `ruleId` başına tek bulgu; `severity` = en yüksek; `certainty` = herhangi biri `confirmed` ise `confirmed`; `occurrences` = ilk `maxExamples`; `occurrenceCount` = toplam; `id` grupta ilk bulgunun `id`'si; sıralama derece (critical→info), sonra `ruleId`.
  - `redactSnippet(text: string): string`
  - CLI: `node finalize-report.mjs <draft.json> --mode summary|detailed [--out <dir>]` — taslak `Report`'u (findings detaylı, `verdict` olmayabilir) okur; `redactSnippet` tüm kesitlere; `summary` ise `groupFindings`; `verdict = computeVerdict(...)`; `validateReport`; geçerliyse `<out>/report.json` yazar (varsayılan `kvkk-report`, klasörü oluşturur, varsa üzerine yazar), exit 0; geçersizse hataları stderr'e, exit 1.

- [ ] **Step 1: Failing testler**
  - verdict: `[]` → `looks_ready`; `[info, low]` → `looks_ready`; `[medium]` → `fixes_needed`; `[high, low]` → `fixes_needed`; `[critical(needs_verification)]` → `serious_risk`.
  - group: aynı `ruleId`'den 5 bulgu (`low`,`high`) + başka 1 → 2 bulgu; ilki `high`, `occurrences.length === 3`, `occurrenceCount === 5`; `certainty` karışıkken `confirmed`.
  - redact: `"tc: 12345678901"` → 11 hane görünmez (`"tc: ***********"` biçiminde, uzunluk korunur); `"a@b.com"` → `"***@***"`; `"TR330006100519786457841326"` → `TR` + yıldızlar; `"+90 532 123 45 67"` maskelenir; `password = "hunter2"` / `api_key: 'sk-…'` değeri maskelenir; `"user.email"` (alan adı) değişmez.
  - finalize: geçici dizinde taslak → `--mode summary` sonrası `report.json` var, `validateReport` boş, gruplanmış, kesitler maskelenmiş; boş `findings` → `looks_ready`; geçersiz taslak → exit 1; mevcut `report.json` üzerine yazılır.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Fonksiyonları ve CLI'yi yaz (`node:fs`, `node:path`, `process.argv`; bağımlılık yok).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** — `feat: hüküm, gruplama, maskeleme ve finalize-report`

### Task 3: Dil tespiti

**Files:**
- Create: `skills/kvkk-audit/scripts/lib/lang.mjs`, `skills/kvkk-audit/scripts/detect-language.mjs`
- Test: `tests/lang.test.mjs`

**Interfaces:**
- Produces: `resolveLanguage({ conversationLang?: string, env?: object, intlLocale?: string }): string` — sıra: `conversationLang` → `env.LC_ALL` → `env.LC_MESSAGES` → `env.LANG` → `env.LANGUAGE` (ilk öğe) → `intlLocale` → `"en"`. `tr_TR.UTF-8` → `"tr"`; `C`/`POSIX` yok sayılır. CLI `detect-language.mjs` argümansız çalışır, `process.env` ve `Intl.DateTimeFormat().resolvedOptions().locale` ile sonucu stdout'a yazar.

- [ ] **Step 1: Failing testler:** `{conversationLang:"de"}` → `"de"`; `{env:{LANG:"tr_TR.UTF-8"}}` → `"tr"`; `{env:{LANG:"C"}, intlLocale:"fr-FR"}` → `"fr"`; `{}` → `"en"`; `{env:{LANGUAGE:"pt_BR:en"}}` → `"pt"`.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat: rapor dili tespiti`

### Task 4: Aday kalıp tarayıcısı

**Files:**
- Create: `skills/kvkk-audit/scripts/patterns.json`, `skills/kvkk-audit/scripts/lib/scan.mjs`, `skills/kvkk-audit/scripts/scan-patterns.mjs`
- Test: `tests/scan.test.mjs`, `tests/fixtures/scan-project/**`

**Interfaces:**
- Produces:
  - `patterns.json`: `[{ id: string, ruleId: string, description: string, regex: string, flags?: string, extensions?: string[] }]`. En az şu grupları kapsar: TCKN/kimlik alan adları (`tckn|tc_?kimlik|national_?id|identity_?number`), telefon, e-posta, IBAN, adres, doğum tarihi alan adları (`KVKK-PD-001`); sağlık/teşhis/kan grubu/biyometrik/parmak izi/yüz/din/sendika/sabıka (`KVKK-SP-001`); log çağrısı + kişisel veri alanı aynı satırda (`console.(log|info|debug)`, `logger.`, `print(`, `Log.d`, `logging.` — `KVKK-LOG-001`); `md5|sha1` parola, düz metin parola karşılaştırması (`KVKK-SEC-001`); `http://` dış uç noktalar, localhost hariç (`KVKK-SEC-002`); anahtar/şifre atamaları (`KVKK-SEC-003`); Firebase, Google Analytics/gtag, Sentry, Mixpanel, Amplitude, Segment, Hotjar, Facebook Pixel, Stripe, AWS/GCP/Azure bölge tanımları (`KVKK-XB-001`); `document.cookie`, `gtag(`, `fbq(` (`KVKK-CK-001`).
  - `scanProject(rootDir: string, patterns): Candidate[]` — `Candidate = { patternId, ruleId, file, line, match }`; `file` köke göreli ve `/` ile.
  - CLI: `node scan-patterns.mjs <projectDir>` → stdout'a `Candidate[]` JSON.
- Kurallar: `node_modules`, `.git`, `dist`, `build`, `vendor`, `.next`, `coverage`, `kvkk-report` dizinleri atlanır; `*.min.js`, ikili dosyalar (ilk 8 KB'ta NUL baytı) ve 1 MB üstü dosyalar atlanır.

- [ ] **Step 1: Fixture + failing testler** — `tests/fixtures/scan-project/` içinde: `src/user.js` (`console.log("user", user.email)` ve `tcKimlikNo` alanı), `node_modules/x/index.js` (e-posta), `kvkk-report/report.md` (e-posta), `dist/app.min.js`, 1.1 MB'lık üretilen dosya (test kurulumunda oluşturulur), ikili `logo.png`. Testler:
  - `KVKK-LOG-001` ve `KVKK-PD-001` adayları `file === "src/user.js"` ile bulunur.
  - Hiçbir aday `node_modules/`, `kvkk-report/`, `dist/` ile başlamaz; büyük ve ikili dosya yoktur.
  - Tüm `file` değerleri `\` içermez.
  - Boş dizin → `[]`.
  - `patterns.json` içindeki her `regex` derlenebilir ve her `ruleId` yukarıdaki kural kimlikleri listesinde.
- [ ] **Step 2:** FAIL → **Step 3:** uygula (`fs.readdirSync` ile yürüyüş, satır bazlı regex) → **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat: aday kalıp tarayıcısı`

### Task 5: Mevzuat kaynakları ve kural kataloğu

**Files:**
- Create: `skills/kvkk-audit/references/sources.md`, `references/severity.md`, `references/checklist.md`, `references/rules/{personal-data,special-categories,consent,notice,retention,security,logging,cross-border,cookies,data-subject-rights,commercial-messages}.md`
- Test: `tests/catalog.test.mjs`

**Interfaces:**
- Consumes: kural kimlikleri listesi, `patterns.json` (Task 4).
- Produces: Her kural dosyasında her kural için şu başlıklar: `## <RULE-ID>: <title>`, ardından `**Default severity:**`, `**Applies to:** controller|processor|both`, `**Legal basis:**` (bağlantılı), `### What to look for`, `### Common patterns` (Node, Python, Java/Kotlin, .NET, PHP, mobil örnekleri), `### Needs-verification when`, `### Recommendation`.

- [ ] **Step 1: Failing test** — `catalog.test.mjs`: (a) 15 kural kimliğinin her biri tam olarak bir kural dosyasında `## <id>:` başlığıyla var; (b) her kuralda yukarıdaki 6 başlık var; (c) `Default severity` değeri geçerli enum; `KVKK-XB-001` için `info`; (d) kural dosyalarındaki her `https://` bağlantısı `sources.md`'de de listelenmiş; (e) `sources.md` `Last verified: 2026-` ile başlayan bir satır içeriyor; (f) `checklist.md` en az şu kimlikleri içeriyor: `CL-VERBIS`, `CL-PROCESSOR-CONTRACTS`, `CL-BREACH-72H`, `CL-PRIVACY-NOTICE-CONTENT`, `CL-RETENTION-POLICY`, `CL-XB-SAFEGUARDS`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Kaynakları doğrula** — WebFetch ile resmî metinleri aç ve atıfları doğrula: 6698 s. KVKK (mevzuat.gov.tr) md. 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 16; 7499 s. Kanun ile 2024 değişiklikleri (md. 6 ve md. 9, yürürlük 1 Haziran 2024); Kişisel Verilerin Yurt Dışına Aktarılmasına İlişkin Usul ve Esaslar Yönetmeliği (standart sözleşmenin imzadan sonra 5 iş günü içinde Kurum'a bildirimi); Kurul'un veri ihlali bildirimi kararı (72 saat, 2019/10); Kurul Çerez Uygulamaları Rehberi; Aydınlatma Yükümlülüğü Tebliği; Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Yönetmeliği; 6563 s. Kanun / İYS. Her bağlantı açılabilir olmalı; doğrulanamayan bilgi katalogda iddia olarak yazılmaz, "verify with counsel" notu düşülür.
- [ ] **Step 4:** `sources.md` (bağlantılar + `Last verified: <tarih>`), `severity.md` (Global Constraints'teki hüküm/derece/kesinlik kuralları + `KVKK-XB-001` istisnası), `checklist.md` ve kural dosyalarını yaz. Rol koşulları: `KVKK-CON-001`, `KVKK-NOT-001`, `KVKK-DSR-001`, `CL-VERBIS` → `controller`.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6: Commit** — `feat: KVKK kural kataloğu ve kaynaklar`

### Task 6: SKILL.md, iş akışı, rapor şablonu ve giriş noktaları

**Files:**
- Create: `skills/kvkk-audit/SKILL.md`, `references/workflow.md`, `references/report-template.md`, `references/language.md`, `.claude-plugin/plugin.json`, `AGENTS.md`, `.cursor/rules/kvkk-audit.mdc`
- Test: `tests/skill.test.mjs`

**Interfaces:**
- Consumes: tüm betik CLI'leri (Task 2-4), kural kataloğu (Task 5).
- Produces: `SKILL.md` frontmatter `name: kvkk-audit`, `description:` (KVKK/Turkish data protection/"can I launch in Turkey"/kişisel veri denetimi ifadelerini içeren tetikleme cümlesi, ≤ 1024 karakter).

İçerik kararları:
- `workflow.md` adımları: 0 uygulanabilirlik + rol (etkileşimliyse en fazla bir soru; değilse `controller` varsay, `roleAssumed: true`) → 1 keşif → 2 kişisel veri envanteri → 3 kurallar (rol koşullarıyla; varsa `scan-patterns.mjs` adayları girdi, ama kurallar aday olmadan da uygulanır) → 4 kanıt doğrulama (kanıt yoksa `needs_verification`, silme yok) → 5 rapor: taslak JSON yaz, varsa `finalize-report.mjs` çalıştır, yoksa gruplama/hüküm/maskeleme kurallarını elle uygula; `report.md`'yi şablona göre rapor dilinde yaz; kullanıcıya hükmü ve dosya yollarını söyle.
- Mod: kullanıcı "detailed", "detaylı", `--detailed` derse `detailed`, aksi `summary`.
- `report-template.md`: hüküm başlığı, özet, rol/uygulanabilirlik notu, envanter tablosu, bulgular, yurt dışı servisler tablosu, kontrol listesi, uyarı metni (en + tr asıl metin; diğer dillere çevrilir).
- `language.md`: Task 3 sırası + terim kuralı + KVKK terim sözlüğü (açık rıza, aydınlatma yükümlülüğü, veri sorumlusu, veri işleyen, özel nitelikli kişisel veri, VERBİS, ilgili kişi, Kurul).
- `plugin.json`: `name: "kvkk-audit"`, `version: "0.1.0"`, `license: "MIT"`.
- `AGENTS.md` ve `.mdc`: içerik kopyalamaz, `skills/kvkk-audit/SKILL.md`'yi okumaya yönlendirir.

- [ ] **Step 1: Failing test** — `skill.test.mjs`: frontmatter ayrıştırılır, `name === "kvkk-audit"`, `description` 1-1024 karakter ve `KVKK` içerir; `SKILL.md` ve `workflow.md` içinde geçen her `references/…`, `scripts/…`, `schema/…` yolu diskte var; `plugin.json` geçerli JSON ve `name` eşleşiyor; `AGENTS.md` ve `.mdc` `skills/kvkk-audit/SKILL.md` yolunu içeriyor; `report-template.md` uyarı metnini içeriyor.
- [ ] **Step 2:** FAIL → **Step 3:** yaz → **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat: SKILL.md, iş akışı ve agent giriş noktaları`

### Task 7: Örnek projeler ve karşılaştırma aracı

**Files:**
- Create: `examples/node-express-leaky/**`, `examples/python-fastapi-leaky/**`, `examples/android-kotlin-leaky/**` (yalnızca kaynak parçaları; derlenmesi gerekmez), `examples/node-clean/**`; her birinde `expected-findings.json`; `skills/kvkk-audit/scripts/compare-findings.mjs`
- Test: `tests/examples.test.mjs`

**Interfaces:**
- Consumes: `scanProject` (Task 4), `validateReport` (Task 1).
- Produces: `expected-findings.json`: `{ expectedVerdict, mustFind: [{ ruleId, file? }], mustNotFind: string[] }`. `compareFindings(report, expected): { missing: object[], unexpected: string[], verdictOk: boolean }`; CLI `node compare-findings.mjs <report.json> <expected.json>` sonucu yazar, `missing` boş değilse veya `verdictOk` false ise exit 1.

Örneklerin içermesi gerekenler:
- `node-express-leaky`: TCKN + e-posta ile kayıt, rızasız pazarlama izni (tek onay kutusu), log'a e-posta, MD5 parola, `http://` dış API, kodda API anahtarı, Sentry + Google Analytics, hesap silme yok → `serious_risk`.
- `python-fastapi-leaky`: sağlık verisi (teşhis) alanı, şifresiz saklama, yurt dışı bölge (`us-east-1`) S3 → `KVKK-SP-001`, `KVKK-SEC-004`, `KVKK-XB-001` (özel nitelikli kanıtlı, `high`) → `serious_risk`.
- `android-kotlin-leaky`: `Log.d` ile telefon numarası, Firebase Analytics rıza öncesi → `fixes_needed`.
- `node-clean`: bcrypt, maskeli log, aydınlatma bağlantısı, açık rıza akışı, hesap silme, saklama süresi, yalnızca yurt içi altyapı → `looks_ready`, `mustNotFind` en az `KVKK-LOG-001`, `KVKK-SEC-001`.

- [ ] **Step 1: Failing testler** — her `expected-findings.json` geçerli yapıda; her `mustFind` kuralı için kalıp tabanlı olanlarda (`patterns.json`'da `ruleId`'si olanlar) `scanProject` en az bir aday buluyor; `node-clean` için `KVKK-LOG-001` ve `KVKK-SEC-001` adayı yok; `compareFindings` sahte bir report ile eksik/beklenmeyen/hüküm durumlarını doğru raporluyor.
- [ ] **Step 2:** FAIL → **Step 3:** örnekleri ve `compare-findings.mjs`'i yaz (gerekirse `patterns.json`'u daralt; Task 4 testleri yeşil kalmalı) → **Step 4:** `npm test` PASS.
- [ ] **Step 5: Commit** — `feat: örnek projeler ve karşılaştırma aracı`

### Task 8: Belgeler ve uçtan uca agent doğrulaması

**Files:**
- Create: `README.md`, `README.tr.md`, `docs/TESTING.md`

İçerik: ne yapar / ne yapmaz (hukuki görüş değil; büyük projeler raporu avukatlarına göstermeli), kurulum (`npx skills add <repo>`, Claude Code plugin, AGENTS.md, Cursor), kullanım örnekleri (özet/detaylı), rapor örneği, katkı (katalog düzeltmeleri kaynak bağlantısıyla), yol haritası (GitHub Action, ayrı GDPR skill'i). `TESTING.md`: örnek projelerde agent çalıştırma ve `compare-findings.mjs` ile ölçme adımları.

- [ ] **Step 1:** Belgeleri yaz; README'deki her komut ve yol repoda mevcut.
- [ ] **Step 2: Claude Code'da tam test** — her örnek proje için skill'i çalıştır (örnek dizinini çalışma dizini yaparak), ardından `node skills/kvkk-audit/scripts/compare-findings.mjs examples/<n>/kvkk-report/report.json examples/<n>/expected-findings.json` → 4 örnekte exit 0. Ayrıca Türkçe ve İngilizce konuşmada rapor dilinin değiştiği bir kez kontrol edilir. Başarısızlıkta talimatları/kuralları düzelt, yeniden çalıştır.
- [ ] **Step 3: Codex ve Cursor duman testi** — kurulum + `node-express-leaky` üzerinde bir çalıştırma; erişim yoksa bu adım kullanıcıya bırakılır ve `TESTING.md`'de "doğrulanmadı" diye işaretlenir.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** — `docs: README, test kılavuzu`
