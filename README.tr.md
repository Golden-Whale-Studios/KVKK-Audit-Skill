# KVKK Denetim Becerisi (KVKK Audit Skill)

Kodlama agent'ınızın, kod tabanınızı **KVKK**'ya (6698 sayılı Kişisel Verilerin Korunması Kanunu)
göre denetlemesini ve uygulamanızın Türkiye'de yayına çıkmaya hazır görünüp görünmediğini
söylemesini sağlayan, açık kaynaklı bir Agent Skill.

English: [README.md](README.md)

> **Hukuki görüş değildir.** Bu araç, kaynak kodun otomatik yapılmış teknik bir ön taramasıdır.
> "Yayına hazır görünüyor" hükmü, mevzuata uygunluğun hukuki bir güvencesi değildir. Büyük projeler,
> yayından önce raporu yetkin bir hukukçuya inceletmelidir.

## Ne yapar

Agent'ınıza "Bunu Türkiye'de yayına alabilir miyim?" veya "KVKK denetimi yap" deyin. Agent, becerinin
talimatlarını izleyerek şunları yapar:

1. KVKK'nın uygulanıp uygulanmadığına ve sizin veri sorumlusu mu yoksa veri işleyen mi olduğunuza karar verir.
2. Teknoloji yığınınızı, veri katmanınızı, formlarınızı, üçüncü taraf SDK'larınızı, log'larınızı ve
   altyapınızı haritalandırır.
3. Kişisel veri envanteri çıkarır ve özel nitelikli kişisel verileri işaretler.
4. 15 kuralı (aşağıya bakın) denetler; her kural resmî bir mevzuat kaynağına (kvkk.gov.tr, mevzuat.gov.tr) bağlanır.
5. `kvkk-report/report.md` (insanlar için) ve `kvkk-report/report.json` (araçlar için) dosyalarını
   şu hükümlerden biriyle yazar: `serious_risk` (ciddi risk var), `fixes_needed` (düzeltmeler gerekli)
   veya `looks_ready` (yayına hazır görünüyor).

Kurallar şunları kapsar: kişisel veri envanteri, özel nitelikli veriler, açık rıza, aydınlatma metni,
saklama ve hesap silme, parola saklama, şifresiz aktarım, depodaki gizli anahtarlar, özel nitelikli
verinin şifresiz saklanması, log'larda kişisel veri, yurt dışına aktarım, çerez rızasından önce izleme,
ilgili kişi başvuruları ve ticari ileti izni (İYS).

Bir tarama aracının göremeyeceği konular (VERBİS kaydı, veri işleyen sözleşmeleri, ihlal planı, saklama ve
imha politikası) her raporda bir kontrol listesinde yer alır.

İlkeler:

- **Yalnızca KVKK.** GDPR yok (ayrı bir GDPR becerisi yol haritasında).
- **Şüpheli bulguları sessizce silmez.** Şüpheli bir bulgu `needs_verification` (doğrulanması gerekiyor)
  olarak raporlanır ve hükme dahil edilir. Denetim yine de bazı sorunları kaçırabilir.
- **Rapora veri sızmaz.** Kesitler rapor kesinleştirilirken maskelenir (TCKN benzeri numaralar,
  e-postalar, Türkiye IBAN'ları, telefon numaraları, gizli değer adlı alanlar ve yaygın anahtar
  biçimleri); agent ayrıca betiğin tanıyamayacağı her şeyi (ör. ad ve adresler) raporda yeniden kontrol
  eder. Raporu paylaşmadan önce gözden geçirin.
- **Salt okunur.** Beceri kodunuzu değiştirmez; yalnızca `kvkk-report/` klasörüne yazar.
- **Betik olmadan da çalışır.** Node.js betikleri yardımcıdır. Node yoksa agent yazılı elle izlenen yolu uygular (belgelenmiştir ancak henüz test edilmemiştir; bkz. docs/TESTING.md).
- **Sizin diliniz.** Rapor, agent ile konuştuğunuz dilde yazılır (olmazsa işletim sistemi dili, o da
  olmazsa İngilizce). KVKK terimleri her zaman Türkçe aslıyla verilir; ör. "explicit consent (açık rıza, KVKK md. 5)".

## Ne yapmaz

- Hukuki görüş vermez, uygunluğu belgelemez.
- Kodun dışındakileri göremez: VERBİS kaydı, sözleşmeler, iç politikalar, bulut konsolları, üçüncü
  taraf rıza araçları.
- Kodunuzu değiştirmez, sorunları sizin yerinize düzeltmez.
- Diğer mevzuatı (GDPR, sektörel düzenlemeler) kapsamaz. 6563 sayılı Kanun kapsamındaki ticari ileti
  izni yalnızca düşük dereceli bir not olarak raporlanır.

## Kurulum

### Agent Skills destekleyen her agent (Claude Code, Codex, Cursor ve diğerleri)

```bash
npx skills add Golden-Whale-Studios/KVKK-Audit-Skill
```

Bu komut `skills/kvkk-audit/` klasörünü agent'ınızın beceri klasörüne kopyalar.

### Claude Code eklentisi

Depo aynı zamanda bir Claude Code eklentisidir (`.claude-plugin/plugin.json`, beceri
`skills/kvkk-audit/` içinde). Klonlayıp yükleyin:

```bash
git clone https://github.com/Golden-Whale-Studios/KVKK-Audit-Skill.git
claude --plugin-dir ./KVKK-Audit-Skill
```

Ya da beceriyi elle kopyalayın:

```bash
# kişisel beceri, tüm projelerde kullanılabilir
cp -r skills/kvkk-audit ~/.claude/skills/kvkk-audit
# veya proje becerisi
mkdir -p .claude/skills && cp -r skills/kvkk-audit .claude/skills/kvkk-audit
```

### AGENTS.md (Codex ve AGENTS.md okuyan diğer agent'lar)

`AGENTS.md` dosyasını ve `skills/kvkk-audit/` klasörünü projenize kopyalayın (ya da "KVKK audit"
bölümünü mevcut `AGENTS.md` dosyanıza ekleyin). `AGENTS.md`, KVKK denetimi istediğinizde agent'a
`skills/kvkk-audit/SKILL.md` dosyasını okumasını söyler. Beceriyi başka bir klasöre kurduysanız
`AGENTS.md` içindeki yolu düzenleyin.

### Cursor kuralı

`.cursor/rules/kvkk-audit.mdc` dosyasını projenizin `.cursor/rules/` klasörüne kopyalayın ve beceri
klasörünü `skills/kvkk-audit/` konumunda tutun (ya da kuraldaki yolu düzenleyin). Kural, KVKK denetimi
istediğinizde devreye girebilir.

Codex ve Cursor kurulumları henüz doğrulanmadı, bkz. [docs/TESTING.md](docs/TESTING.md).

Gereksinim: Node.js 18+ isteğe bağlıdır (yardımcı betikler için). Bağımlılık yoktur.

## Kullanım

Agent'ınızı denetlemek istediğiniz projenin kökünde çalıştırın ve şunlardan birini söyleyin:

| Siz söylersiniz | Sonuç |
|---|---|
| "KVKK denetimi yap" / "Bu uygulamayı Türkiye'de yayına alabilir miyim?" | Özet rapor: bulgular kurala göre gruplanır, her biri için 3 örnek yer |
| "Detaylı KVKK raporu ver" | Detaylı rapor: her bulgu ve her yer, maskelenmiş kesitlerle |
| "Run a KVKK audit" | Aynısı, İngilizce |
| "B2B SaaS'ız, müşterilerimiz adına veri işliyoruz. KVKK denetimi yap." | Rol veri işleyen olur; yalnızca veri sorumlusunu ilgilendiren kurallar bilgi notuna dönüşür |

İlk çalıştırmadan sonra `kvkk-report/report.json` dosyasını açın, her kontrol listesi maddesinin
`status` alanını `yes` veya `no` yapın ve denetimi yeniden çalıştırın. Yanıtlarınız yeni rapora
taşınır ve her `no` özette anılır.

Raporları depoya eklemek istemiyorsanız kendi `.gitignore` dosyanıza `kvkk-report/` ekleyin (bu depo
zaten yok sayar).

### Örnek özet rapor (sahte veri)

```markdown
# KVKK denetim raporu: shop-app

**Hüküm: Ciddi risk var (`serious_risk`)**

En az bir kritik sorun bulundu. Türkiye'de yayına çıkmadan önce düzeltin.

| | |
|---|---|
| Rol | veri sorumlusu |
| KVKK uygulanabilirliği | Uygulanır: Türkçe arayüz, TL fiyatlar, TCKN alanı |
| Bulgular | 1 kritik · 2 yüksek · 3 orta · 0 düşük · 2 bilgi (1 doğrulama gerektiriyor) |

## Bulgular

### 1. Parolalar düz metin olarak saklanıyor (Kritik (`critical`), Doğrulandı (`confirmed`))

- **Kural:** `KVKK-SEC-001` · **Yer sayısı:** 2
- **Hukuki dayanak:** [Veri Güvenliğine İlişkin Yükümlülükler](https://www.kvkk.gov.tr/Icerik/2040/Veri-Guvenligine-Iliskin-Yukumlulukler)
- **Nerede:**
  - `src/routes/auth.js:12`: `const user = { email, legacyPassword: ***, ... };`
- **Nasıl düzeltilir:** Yalnızca yavaş ve tuzlu bir özet (Argon2id, bcrypt veya scrypt) saklayın.

### 2. Önceden işaretli tek bir onay kutusu, şartları ve açık rızayı birleştiriyor (Yüksek (`high`), Doğrulandı (`confirmed`))

- **Kural:** `KVKK-CON-001` · **Yer sayısı:** 1
- **Nerede:** `public/register.html:19`
- **Nasıl düzeltilir:** Her amaç için ayrı ve işaretlenmemiş onay kutuları kullanın (açık rıza, KVKK md. 5).

...

## Sorumluluk reddi

Bu rapor, kaynak kodun 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında otomatik olarak
yapılmış teknik bir ön taramasıdır; hukuki görüş değildir. ...
```

Tam raporda ayrıca kişisel veri envanteri, yurt dışı hizmetler tablosu ve kontrol listesi bulunur.

## Yardımcı betikleri kendiniz çalıştırın

```bash
node skills/kvkk-audit/scripts/scan-patterns.mjs <projectDir>        # aday eşleşmeleri JSON olarak yazar
node skills/kvkk-audit/scripts/finalize-report.mjs <draft.json> --mode summary --out kvkk-report
node skills/kvkk-audit/scripts/detect-language.mjs                   # işletim sistemi dil kodu
node skills/kvkk-audit/scripts/compare-findings.mjs <report.json> <expected-findings.json>
```

`examples/` içindeki örnek projeler bilerek hatalı (ya da temiz) hazırlanmış test malzemesidir.
Becerinin nasıl test edildiği için [docs/TESTING.md](docs/TESTING.md) dosyasına bakın.

## Depo yapısı

```
skills/kvkk-audit/      beceri: SKILL.md, references/ (iş akışı, kurallar, kontrol listesi, kaynaklar), schema/, scripts/
examples/               beklenen bulgu dosyalarıyla dört sahte proje
tests/                  otomatik testler (node --test)
docs/TESTING.md         becerinin örnekler üzerinde nasıl test edileceği
AGENTS.md               AGENTS.md okuyan agent'lar için giriş noktası
.cursor/rules/          Cursor kuralı
.claude-plugin/         Claude Code eklenti bildirimi
```

## Katkı

Kural kataloğundaki düzeltmeler, özellikle mevzuat güncellemeleri, memnuniyetle karşılanır. Her hukuki
ifade resmî bir kaynağa (kvkk.gov.tr, mevzuat.gov.tr, resmigazete.gov.tr veya ticaret.gov.tr) bağlantı
içermelidir; bir kaynağı yeniden kontrol ettiğinizde `skills/kvkk-audit/references/sources.md` içindeki
"Last verified" tarihini güncelleyin. Doğrulayamadığınız bir ayrıntı için tahmin yürütmek yerine
"verify with counsel" (bir hukukçuyla doğrulayın) yazın.

```bash
npm install
npm test
```

Dokunduğunuz her kural, desen veya betik için bir test ekleyin ya da güncelleyin. Kural dosyaları İngilizcedir.

## Yol haritası

- Çekme isteklerinde denetimi çalıştıran bir GitHub Action.
- Ayrı bir GDPR becerisi (bu beceri yalnızca KVKK olarak kalır).
- Tarayıcı için daha fazla desen ve daha fazla örnek proje (Java, .NET, PHP, iOS).

## Lisans

MIT, bkz. [LICENSE](LICENSE).
