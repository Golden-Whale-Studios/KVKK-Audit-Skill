# KVKK Audit Skill — Tasarım Belgesi

Tarih: 2026-11-01
Durum: Onaylandı (2026-11-01)

Bu belgede **(karar: kullanıcı)** işareti proje sahibinin verdiği kararları,
**(karar: tasarımcı)** işareti tasarımı yazanın kendi verdiği ve itiraz
edilebilecek kararları gösterir. İşaretsiz maddeler uygulayıcıya bırakılmıştır
ya da doğrudan konuşmadan çıkan bağlamdır.

## 1. Amaç ve neden

Kullanıcı verisi toplayan ve işleyen uygulamalar geliştiren kişilerin,
uygulamalarını Türkiye'de veri koruma açısından sorun yaşamadan yayınlayıp
yayınlayamayacaklarını yayın öncesinde öğrenmelerini sağlamak.

Ürün, coding agent'lar (Claude Code, Cursor, Codex vb.) için bir **skill**
olarak açık kaynak dağıtılır. Geliştirici skill'i kendi kod tabanında bir test
gibi çalıştırır; agent kodu 6698 sayılı Kişisel Verilerin Korunması Kanunu
(KVKK) ve ikincil düzenlemeler açısından tarar ve bir rapor üretir. Rapor tek
bir soruya cevap vermeye çalışır: **"Bu uygulamayı Türkiye şartlarında, veri
açısından sorun yaşamadan yayınlayabilir miyim?"** (karar: kullanıcı)

Neden şimdi: GitHub Trending'de coding agent skill'leri ve özellikle "denetim"
skill'leri (ör. cloudflare/security-audit-skill, Ekim 2026'da ~31 bin yıldız)
en hızlı büyüyen kategori. KVKK'ya özel bir skill bulunmuyor.

## 2. Hedef kullanıcı

- Ürününü Türkiye'de yayınlayacak Türk geliştirici.
- Türkiye pazarına girmek isteyen yabancı geliştirici. (karar: kullanıcı —
  "global çapta")

Kullanıcı hukukçu değil, geliştirici. Rapor geliştiricinin anlayacağı dilde,
kod referanslarıyla ve somut düzeltme önerileriyle yazılır.

## 3. Hedefler

1. Bir kod tabanını KVKK açısından tarayıp genel hüküm + bulgular içeren bir
   rapor üretmek.
2. **Risk kaçırmamak**: emin olunamayan durumlar susturulmaz,
   "doğrulanması gerekiyor" etiketiyle raporlanır. (karar: kullanıcı — "orta
   seviye, risk kaçırmayacak şekilde")
3. Varsayılan olarak **özet rapor**; istenirse **detaylı rapor**. (karar:
   kullanıcı)
4. Raporun dili kullanıcının diline göre otomatik belirlenir. (karar:
   kullanıcı; sıralama aşağıda)
5. Olabildiğince çok agent'ta çalışmak. (karar: kullanıcı — "ne kadar
   kapsamlı kullanılabilirlik, o kadar iyi")
6. Başarı ölçütü: kullanıcı memnuniyeti. (karar: kullanıcı) Pratikte bu,
   gürültüsüz ama eksiksiz, eyleme dönüştürülebilir bir rapor demek.

## 4. Hedef dışı (non-goals)

- **Hukuki görüş vermek.** Skill bir teknik ön taramadır; avukatın yerini
  tutmaz. Rapor bunu her seferinde açıkça belirtir. "Yayına hazır" hükmü yasal
  güvence değildir.
- **GDPR ve diğer ülke mevzuatları.** İlk sürüm yalnızca KVKK. GDPR ileride
  **ayrı bir skill** olarak yapılabilir. (karar: kullanıcı)
- Kodu otomatik düzeltmek. Skill rapor üretir; düzeltmeyi kullanıcı ister ve
  agent normal akışında yapar.
- Çalışan sistemi (canlı veritabanı, sunucu yapılandırması, bulut hesabı)
  denetlemek. Kapsam: depodaki kod, yapılandırma ve dokümanlar.

## 5. Anti-hedefler (çalışsa bile başarısızlık sayılacaklar)

- Her `email` alanı için ayrı uyarı veren, yüzlerce bulguyla dolu, okunmayan
  bir rapor.
- Gerçek bir sorunu kaçırıp "yayına hazır" demek.
- Kullanıcıya yasal güvence veriyormuş izlenimi yaratmak.
- Kanun maddelerini yanlış ya da uydurma atıflarla göstermek.

## 6. Dağıtım ve uyumluluk

**(karar: tasarımcı)**

- Çekirdek: açık **Agent Skills** formatı — kök dizinde `SKILL.md`
  (frontmatter: `name`, `description`) ve yanında kural/başvuru dosyaları.
  Claude Code'da doğrudan; `npx skills` (vercel-labs/skills) ile Cursor,
  Codex ve diğer agent'lara kurulabilir.
- Skill desteklemeyen agent'lar için ince giriş noktaları: `AGENTS.md`
  bölümü ve Cursor kural dosyası; bunlar çekirdek dosyalara yönlendirir,
  içeriği kopyalamaz.
- Claude Code eklentisi (plugin) olarak da yayınlanabilecek dizin yapısı.
- Gelecek (ilk sürümde yok): agent olmadan CI'da çalışan GitHub Action.
- Lisans: MIT. (karar: tasarımcı)
- Depo dili: README İngilizce + Türkçe; kural dosyaları İngilizce yazılır
  (agent'lar ve uluslararası katkıcılar için), KVKK terimleri Türkçe
  asıllarıyla birlikte verilir. (karar: tasarımcı)

## 7. Mimari: tarama nasıl yapılır

Ayrı bir tarama programı yazılmaz; **taramayı agent'ın kendisi**, skill
içindeki talimatlara ve kural kataloğuna göre yapar. (karar: tasarımcı)

Tutarlılık için **isteğe bağlı yardımcı betikler** bulunabilir: ripgrep ile
çalışan kalıp listeleri, bulguları gruplayan küçük bir betik ve JSON şema
doğrulayıcı. Skill bu betikler çalıştırılamadığında da (ör. Node/Python yoksa)
yalnızca talimatlarla çalışmaya devam eder. (karar: tasarımcı)

Akış:

0. **Uygulanabilirlik ve rol**: Önce KVKK'nın uygulanıp uygulanmadığı
   (Türkiye'deki kişilerin verisi işleniyor mu, Türkiye'ye yönelik mi) ve
   kullanıcının rolü belirlenir: **veri sorumlusu** mu, **veri işleyen** mi
   (ör. B2B SaaS). Rol koddan ve dokümanlardan çıkarılır; etkileşimli
   çalışmada emin olunamazsa kullanıcıya tek soru sorulur, etkileşimsiz
   çalışmada "veri sorumlusu" varsayılır ve raporda belirtilir. Kurallar
   role göre koşullanır (aydınlatma, açık rıza, VERBİS ağırlıkla veri
   sorumlusunun yükümlülüğüdür). (karar: tasarımcı)
1. **Keşif**: Proje türü, diller, framework'ler, veri katmanı (ORM şemaları,
   migration'lar), API uçları, formlar, üçüncü taraf SDK'lar, log
   yapılandırması, bulut/altyapı dosyaları, gizlilik/aydınlatma metinleri.
2. **Kişisel veri envanteri**: Hangi kişisel veriler toplanıyor, nerede
   saklanıyor, nereye gidiyor. Özel nitelikli veriler ayrıca işaretlenir.
3. **Kuralların uygulanması**: Kural kataloğundaki her kural envantere ve koda
   karşı kontrol edilir.
4. **Kanıt doğrulaması**: Her bulgu için kodda kanıt aranır; kanıt yetersizse
   bulgu "doğrulanması gerekiyor" olarak işaretlenir (silinmez).
5. **Raporlama**: Markdown + JSON.

Büyük depolarda agent alt-agent kullanabiliyorsa keşif ve kural kontrolünü
paralelleştirebilir; kullanamıyorsa sıralı ilerler. Bu ayrıntı uygulayıcıya
bırakılmıştır.

GDPR'ın ileride ayrı skill olarak eklenebilmesi için kural kataloğu, rapor
şablonu ve JSON şeması mevzuattan bağımsız bir iskelet + mevzuata özel kural
dosyaları şeklinde ayrılır. (karar: tasarımcı)

## 8. Kural kataloğu (ilk sürüm)

Her kuralın: kimliği (ör. `KVKK-LOG-001`), başlığı, ilgili mevzuat atfı,
ne aranacağı, yaygın yığınlar için örnek kalıplar, önem derecesi
yönlendirmesi ve düzeltme önerisi vardır.

Kapsanacak alanlar:

| Alan | Örnek kontroller | Mevzuat |
|---|---|---|
| Kişisel veri tespiti | TCKN, telefon, e-posta, IBAN, adres, konum, IP, cihaz kimliği alanları | md. 3 |
| Özel nitelikli veri | Sağlık, biyometrik, din, sendika, ceza mahkûmiyeti vb. | md. 6 (2024 değişikliğiyle) |
| İşleme şartları / açık rıza | Rıza akışı var mı, rıza ayrı ve isteğe bağlı mı, kayıt altına alınıyor mu | md. 5 |
| Aydınlatma yükümlülüğü | Veri toplanan formlarda aydınlatma metni bağlantısı | md. 10 |
| Saklama ve imha | Saklama süresi / silme mekanizması / hesap silme | md. 7 |
| Veri güvenliği | Şifreleme (aktarım/depolama), parola saklama, erişim kontrolü, gizli anahtarların depoda olması | md. 12 |
| Log'larda kişisel veri | Maskelenmemiş kişisel veri log'a yazılıyor mu | md. 12 |
| Yurt dışına aktarım | Yurt dışı bulut bölgeleri, analitik/reklam/crash SDK'ları, üçüncü taraf API'ler | md. 9 (2024 değişikliğiyle) |
| Çerezler ve izleme | Rıza öncesi çalışan izleme çerezleri/SDK'lar | Kurul Çerez Rehberi |
| İlgili kişi hakları | Verilere erişim, düzeltme, silme talebi için mekanizma | md. 11, 13 |
| Ticari elektronik ileti | Pazarlama izni ayrı mı alınıyor | 6563 s. Kanun / İYS (ilgili alan, bilgi amaçlı) |

**Yurt dışı servisler** (AWS, GCP, Firebase, Google Analytics, Sentry,
Stripe vb.) her biri ayrı bir uyarı olarak değil, **tek bir gruplanmış
bulgu** olarak raporlanır: tespit edilen tüm servisler eksiksiz listelenir
(servis, aktarılan veri türü, kanıt konumu) ve hukuki dayanak (ör. standart
sözleşme + Kurul'a bildirim) kontrol listesinde sorulur. Bu bulgu tek başına
genel hükmü "Düzeltmeler gerekli"ye çekmez; hüküm kontrol listesinin
cevabına bırakılır. İstisna: özel nitelikli verinin yurt dışına aktarıldığına
dair kanıt varsa bulgu normal derecelendirilir. (karar: kullanıcı)

Koddan anlaşılamayan, **kontrol listesi** olarak raporda listelenen konular
(skill çalışma sırasında bunları sormaz; kullanıcı raporu doldurup skill'i
yeniden çalıştırabilir) (karar: tasarımcı): VERBİS
kaydı (md. 16), veri işleyen sözleşmeleri, veri ihlali bildirim süreci
(72 saat, Kurul kararı), aydınlatma metninin içeriği, kişisel veri
saklama ve imha politikası, yurt dışı aktarım için standart sözleşme
bildirimi.

Mevzuat atıfları güncel metne göre doğrulanmalıdır (bkz. Riskler).

## 9. Önem dereceleri ve genel hüküm

**(karar: tasarımcı)**

Bulgu dereceleri: `kritik`, `yüksek`, `orta`, `düşük`, `bilgi`.
Her bulgunun ayrıca bir **kesinlik** alanı vardır: `doğrulandı` /
`doğrulanması gerekiyor`.

Genel hüküm (raporun en üstünde):

- **Ciddi risk var** — en az bir `kritik` bulgu.
- **Düzeltmeler gerekli** — kritik yok, en az bir `yüksek` veya `orta`.
- **Yayına hazır görünüyor** — yalnızca `düşük`/`bilgi` bulgular. Bu
  durumda bile kontrol listesi ve "hukuki görüş değildir" uyarısı gösterilir.

"Doğrulanması gerekiyor" bulgular, derecelerine göre hükme dahil edilir (risk
kaçırmama ilkesi).

## 10. Rapor

**Özet rapor (varsayılan)** (karar: kullanıcı; gruplama: tasarımcı)

- Genel hüküm + bir paragraf özet.
- Kişisel veri envanteri özeti (tablo).
- Bulgular önem sırasına göre; **aynı kuraldan çıkan bulgular gruplanır**
  ("Log'larda maskelenmemiş kişisel veri — 40 yer", ilk 3 örnek gösterilir).
- Kontrol listesi (koddan doğrulanamayanlar).
- Hukuki görüş olmadığına dair not.

**Detaylı rapor (isteğe bağlı)**: Kullanıcı istediğinde ("detaylı rapor",
`--detailed` vb.) her bulgu tek tek: dosya:satır, kural kimliği, mevzuat
atfı, açıklama, kanıt kesiti, düzeltme önerisi.

**Çıktı dosyaları** (karar: tasarımcı):
`kvkk-report/report.md` ve `kvkk-report/report.json` (proje kökünde; agent
kullanıcıya konumu söyler). JSON belgelenmiş bir şemaya uyar
(`schema/report.schema.json`), dil bağımsızdır (kimlikler, dereceler ve alan
adları İngilizce sabit; açıklama metinleri rapor dilinde).

## 11. Dil

(karar: kullanıcı)

Rapor dili şu sırayla belirlenir:

1. Kullanıcının agent'la konuştuğu dil.
2. Belirlenemezse (ör. etkileşimsiz/CI çalıştırma) işletim sisteminin dil
   ayarı.
3. O da yoksa İngilizce.

Hangi dilde olursa olsun KVKK madde adları ve resmî terimler Türkçe
asıllarıyla birlikte verilir: ör. "explicit consent (açık rıza, KVKK md. 5)".

## 12. Doğrulama / test

- `examples/` altında kasıtlı olarak KVKK sorunları içeren küçük örnek
  projeler (en az: bir Node/Express API, bir Python/Django veya FastAPI
  uygulaması, bir mobil istemci parçası) ve her biri için beklenen bulgu
  listesi.
- Skill bu örneklerde çalıştırılır; beklenen bulguların hepsi yakalanmalı
  (kaçırma yok), gruplama özet raporu kısa tutmalı.
- JSON çıktısı şemaya karşı doğrulanır.
- Sorunsuz bir örnek proje de bulunur: "yayına hazır görünüyor" hükmü ve
  düşük gürültü beklenir.
- v1 doğrulama kapsamı (karar: tasarımcı): Claude Code'da tüm örnek
  projelerle tam test; Codex ve Cursor'da kurulum + en az bir örnek projeyle
  duman testi. Talimatlar alt-agent gibi özelliklere bağımlı olmadan da
  çalışacak şekilde yazılır.

## 13. Riskler

- **Mevzuat doğruluğu**: KVKK 2024'te (7499 s. Kanun) md. 6 ve md. 9'da
  değişti. Kural kataloğu güncel resmî metne ve Kurul rehberlerine göre
  yazılmalı; her atıf kaynağıyla birlikte tutulmalı. Katalogda "son
  doğrulama tarihi" bulunur. Avukat incelemesi yapılmaz; katalog
  uygulayıcı tarafından resmî kaynaklardan (mevzuat.gov.tr, kvkk.gov.tr
  Kurul kararları ve rehberleri) yazılır ve **her atıf kaynağın
  bağlantısıyla** verilir. README, büyük projelerin raporu kendi
  avukatlarına göstermesini önerir ve katalog topluluk düzeltmelerine
  açıktır. (karar: kullanıcı)
- **Agent tutarlılığı**: Farklı agent'lar/modeller farklı derinlikte
  tarayabilir. Talimatlar adım adım ve kontrol listesi biçiminde yazılır;
  örnek projelerle doğrulanır.
- **Yanlış güven**: "Yayına hazır" hükmü yanlış anlaşılabilir; her raporda
  uyarı zorunlu.

## 14. Uygulayıcıya bırakılanlar

- Dosya/dizin düzeninin ayrıntıları (yukarıdaki ana parçalar korunarak).
- Kural kataloğunun dosyalara nasıl bölüneceği.
- Örnek projelerin içeriği ve hangi yığınların seçileceği (yukarıdaki asgari
  liste korunarak).
- `SKILL.md` açıklama metninin (tetikleme cümlesi) tam ifadesi.
- README'nin yapısı.
