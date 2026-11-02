# Checklist: items the code cannot answer

The skill does **not** ask these questions during the audit. It lists them in the report
(`checklist[]` in `report.json`) with `status: "unknown"`. The user can fill each one in with
`yes` or `no` and run the skill again. A `no` answer marks a gap to address and should be mentioned
in the summary. Some items are statutory duties and others are recommended measures; each item's legal basis says which. The verdict rule in `severity.md` does not change.

Each item gives its ID, a yes/no question, the legal basis with an official link, and the role it
applies to (`controller`, `processor` or `both`). Copy the question and links into the report as they are.
Translate only the question text into the report language.

## CL-VERBIS

**Question:** Is the organisation registered in the Data Controllers' Registry (VERBİS), or has it
confirmed that a Board exemption applies to it?
**Legal basis:** KVKK md. 16 (Art. 16): register before processing starts; the Board may grant
exemptions on objective criteria —
[Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law),
[Veri Sorumluları Sicili Nedir?](https://www.kvkk.gov.tr/Icerik/2043/Veri-Sorumlulari-Sicili-Nedir),
[Kayıt istisnaları](https://www.kvkk.gov.tr/Icerik/2044/Veri-Sorumlulugu-Siciline-Kayit-Istisnalari).
The current exemption thresholds were not verified for this catalog. Verify with counsel.
**Applies to:** controller

## CL-PROCESSOR-CONTRACTS

**Question:** Is there a written contract with every data processor (veri işleyen) that handles personal data for you
(hosting, e-mail, SMS, payment, analytics, support tools)? Does each contract cover the security
measures they must take?
**Legal basis:** Recommended measure, not a stand-alone statutory requirement: KVKK has no explicit written-processor-contract
provision. KVKK md. 12(2) (Art. 12(2)) makes the controller jointly responsible with processors for security measures, and a
contract is the usual evidence of how that is met. Separately, a transfer to a processor abroad needs a md. 9 route, usually
the Board's standard contract (controller→processor or processor→processor) notified within five business days; see
`CL-XB-SAFEGUARDS` —
[Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law),
[Veri Güvenliğine İlişkin Yükümlülükler](https://www.kvkk.gov.tr/Icerik/2040/Veri-Guvenligine-Iliskin-Yukumlulukler);
controller–processor contracts are listed as an administrative measure in the
[Kişisel Veri Güvenliği Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/7512d0d4-f345-41cb-bc5b-8d5cf125e3a1.pdf).
**Applies to:** both

## CL-BREACH-72H

**Question:** Is there a written data-breach response plan (veri ihlali müdahale planı)? Can it notify the
Board without delay and within 72 hours of learning of a breach, and notify affected persons as soon as reasonably possible?
If you are a processor, does it notify the controller without delay?
**Legal basis:** KVKK md. 12(5) (Art. 12(5)) and Kurul decision 24/01/2019, 2019/10 —
[Veri İhlali Bildirimi (2019/10)](https://www.kvkk.gov.tr/Icerik/5362/Veri-Ihlali-Bildirimi),
[Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law).
**Applies to:** both

## CL-PRIVACY-NOTICE-CONTENT

**Question:** Does the privacy notice (aydınlatma metni) state all of the following in clear, plain language:
the controller's identity, the processing purposes, the recipients or recipient groups and why they get the data,
how the data is collected, the legal basis (hukuki sebep), and the data subject's md. 11 rights? Is it kept separate from any
explicit-consent text?
**Legal basis:** KVKK md. 10 (Art. 10) and the Aydınlatma Tebliği md. 4–5 —
[Aydınlatma Yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-),
[Aydınlatma Tebliği](https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig).
**Applies to:** controller

## CL-RETENTION-POLICY

**Question:** Have you set a maximum retention period for each category of personal data? Do you erase,
destroy or anonymise data when that period ends, through a documented retention and destruction policy
(kişisel veri saklama ve imha politikası) or an equivalent process?
**Legal basis:** KVKK md. 4(2)(d) and md. 7 (Art. 4(2)(d), Art. 7) —
[Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law),
[Silme, yok etme, anonim hale getirme](https://www.kvkk.gov.tr/Icerik/2038/kisisel-verilerin-silinmesi-yok-edilmesi-veya-anonim-hale-getirilmesi),
[Silme Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/bc1cb353-ef85-4e58-bb99-3bba31258508.pdf).
This catalog did not verify which controllers the Deletion Regulation requires to keep a *written*
policy, or the maximum interval between periodic destructions. Verify with counsel.
**Applies to:** both

## CL-XB-SAFEGUARDS

**Question:** For every service in finding `KVKK-XB-001` that stores or accesses personal data outside
Türkiye, is there a legal route under KVKK md. 9? For example: an adequacy decision, a signed standard contract
(standart sözleşme) notified to the Authority within five business days of signature, approved binding
corporate rules, or a documented incidental-transfer exception.
**Legal basis:** KVKK md. 9 as amended by Law No. 7499 (in force 1 June 2024) —
[Yurt Dışına Aktarım](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim),
[Standart Sözleşmeler](https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler),
[Yurt Dışına Aktarım Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/13711235-abb6-4b17-9a6b-0a68c1ad86c5.pdf),
[Law No. 6698 (EN)](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law).
**Applies to:** both

## CL-DSR-PROCESS

**Question:** Is someone responsible for answering data-subject requests (ilgili kişi başvuruları)?
Can they answer each request in writing or electronically, free of charge (except a Board-tariff fee
for extra cost), within 30 days?
**Legal basis:** KVKK md. 11 and md. 13 (Art. 11, Art. 13) —
[Başvuruların cevaplanması](https://www.kvkk.gov.tr/Icerik/2046/Ilgili-Kisiler-Tarafindan-Yapilan-Basvurularin-Cevaplanmasi-Yukumlulugu),
[İlgili Kişinin Hakları](https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari).
**Applies to:** controller

## CL-SPECIAL-CATEGORY-MEASURES

(Report this item only when `KVKK-SP-001` has findings.)
**Question:** For the special-category data you process, have you put in place the Board's adequate measures?
These include a separate security policy, staff training and confidentiality agreements, encryption with keys
kept in a different place, secure logging of every operation, and two-factor authentication for remote access.
Have you identified a md. 6(3) processing condition for this data?
**Legal basis:** KVKK md. 6(3)–(4) (Art. 6) and Kurul decision 31/01/2018, 2018/10 —
[Özel Nitelikli Kişisel Veriler](https://www.kvkk.gov.tr/Icerik/2051/Ozel-Nitelikli-Kisisel-Veriler),
[Özel Nitelikli Veri Rehberi](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/70f95c73-06a2-44dc-81e9-34201bdd7f5c.pdf).
**Applies to:** both
