# DiscoverKarakalpakstan

## Asosiy nashr: Cloudflare Pages

Ommaviy brend: **DiscoverKarakalpakstan**. Asosiy (canonical) manzil: **https://discoverkarakalpakstan.uz/**.
Moslashtirilgan manba repositorysi: [qattaspace-cyber/qoraqalpogiston-travel](https://github.com/qattaspace-cyber/qoraqalpogiston-travel).
Repository mavjudligi sayt Cloudflare’da nashr qilinganini bildirmaydi; nashr va domen ulanishi alohida tekshiriladi.

Asosiy nashr usuli — **Cloudflare Pages → Git Integration**, `main` tarmog‘i:

- Framework preset: **None**.
- Root directory: bo‘sh qoldiriladi (repository ildizi).
- Build command: `node scripts/prepare-pages.js`.
- Build output directory: `_site`.

Cloudflare’ga repository ulangach, `main` yangilanishlari Pages yig‘ilmasini avtomatik boshlaydi.
Eski GitHub Pages workflow’i faqat qo‘lda ishga tushadi; `push` uni boshlamaydi.
Domen, DNS va Google Search Console qadamlari: [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md).

## Loyiha haqida

Qoraqalpog‘istonning turistik obyektlari uchun statik HTML/CSS/JavaScript xarita. Loyiha dastlab **Qoraqalpog‘iston Travel** nomi bilan GitHub Pages uchun tayyorlangan; foydalanuvchi hisobi va alohida backend talab qilmaydi. Media nusxalari Google Drive’da, ochiq sahifa uchun rasmlar va kichik ko‘rish nusxalari loyiha fayllarida saqlanadi.

## Hozirgi imkoniyatlar

- 64 obyektning barchasida media bor: **131 tasvir — 120 fotosurat va 11 `overview`**. 43 obyekt uchun kamida ikki alohida tasvir, 42 obyekt uchun kamida ikki fotosurat mavjud.
- 8 turizm toifasi, hudud/masofa filtrlari va to‘rt tilli qidiruv: `uz`, `kaa`, `ru`, `en`.
- 1920 px gacha keng xarita, ekran balandligiga mos ish maydoni, ochiladigan/yig‘iladigan filtr va obyekt panellari. Panel tugmalari aylantirishda ko‘rinib turadi; Leaflet panel o‘lchami o‘zgarganda yangilanadi.
- Universitet taqdimotiga mos atlas dizayni, haqiqiy Ayaz-qal’a asosiy surati, tizim shriftlari va mahalliy Leaflet 1.9.4. Runtime Tailwind ishlatilmaydi.
- “Biz haqimizda” bo‘limida muallif **Tajibayeva Lalaxan Radjapovna — Qoraqalpoq Davlat universiteti iqtisodiy va ijtimoiy geografiya ixtisosligi tayanch doktoranti** deb ko‘rsatilgan. “Foydali ma’lumotlar” bo‘limi olib tashlangan.
- Manba va muallif havolalari bilan galereya, brauzer xotirasidagi saqlangan joylar, Google/Yandex navigatsiyasi va to‘rtta sayohat marshruti.
- “Batafsil ma’lumot” oynasining boshida 64 obyektning har biri haqida to‘rt tildagi qisqa tavsif va Google/Yandex navigatsiya tugmalari bor.
- Mobil boshqaruvlar, klaviatura bilan ishlaydigan galereya/modal va mahalliy rasm zaxiralari.

## Rasmlar va manbalar

Oldingi 86 tasvirga 45 yangi tasvir qo‘shildi: arxeologik obyektlar uchun 33, madaniy obyektlar uchun 11 va Puljay uchun bitta tasvir. **91 tasvirning qayta foydalanish sharti tasdiqlangan. Yana 40 tasvir foydalanuvchining barcha topilgan rasmlarni ko‘rsatish haqidagi aniq talabi asosida kiritilgan; ularning foydalanish ruxsati tasdiqlangan deb ko‘rsatilmaydi.**

Bu 40 yozuvda `publicationRequested: true`, `verified: false`, `reuseVerified: false` saqlanadi. Nashriyotning haqiqiy mualliflik huquqi va foydalanish sharti `license`, `licenseUrl` hamda manba yozuvida qoladi; ular erkin yoki Creative Commons litsenziyasi sifatida qayta nomlanmaydi. Obyektning tasvirga mosligi, manba/litsenziya shartini aniqlash va qayta foydalanish ruxsati alohida tekshiruvlardir.

`kind: "overview"` tasvirlar yerda olingan foto sifatida taqdim etilmaydi. Imam Iyshan (28), Qusxana (30), Eshim Axun (36) va Puljay (27) uchun EOX’ning 2024-yilgi sun’iy yo‘ldosh ko‘rinishlari, Sulton Valiy Ota (31) uchun umumiy majmua ko‘rinishi, Berkut (26) uchun tarixiy kitobdagi aerofoto ishlatiladi. Izohlar aynan nimani ko‘rsatayotganini tushuntiradi. Kurgashinning tarixiy aerofotosi va NASA ko‘rinishlarida ham tur/sana alohida yozilgan.

Manba dalillari `data/media-research-*.json` va yangi `data/media-requested-archaeology-2026-10.json`, `data/media-requested-cultural-2026-10.json`, `data/media-requested-puljay-2026-10.json` fayllarida. Nashr sanasi surat olingan sana deb talqin qilinmaydi. Bir obyekt o‘rniga boshqa qal’a yoki masjidning surati qo‘yilmaydi.

Uzbekistan Travel tasvirlari [turizm saytlari uchun maxsus shartlar](https://uzbekistan.travel/en/license-agreement/) asosida ishlatiladi; bu Creative Commons emas. Beleuli CC BY-NC-SA 2.0 va Kurgashin arxiv kadri CC BY-NC 4.0 shartlariga ega. Muslim.uz’ning ikki surati uchun portal talab qilgan muallif va ikkita havola `requiredAttribution` orqali saqlanadi. Qolgan nashriyotlarning shartlari har bir yozuvda o‘z holicha keltirilgan.

Beleuli uchun imagegen orqali sinab ko‘rilgan aniqlashtirish peshtoq tafsilotini o‘zgartirgani sababli nashrga kiritilmadi; asl tasvir saqlandi. Yangi rasmlarda generativ tarzda yaratilgan obyekt tafsilotlari ishlatilmaydi. Yetti noto‘g‘ri 1 px kichik nusxa va ikkita ortiqcha katta ko‘rish nusxasi tuzatildi; kichik nusxalar 480 px gacha tayyorlanadi.

## Faol fayllar

| Fayl | Vazifasi |
| --- | --- |
| `index.html`, `css/app.css` | Sahifa va mahalliy dizayn |
| `data/destinations.json` | Asosiy 64 obyekt katalogi |
| `data/categories.json`, `data/districts.json` | Toifalar va hududlar |
| `data/routes.json` | Sayohat marshrutlari va barqaror obyekt IDlari |
| `data/locales/{uz,kaa,ru,en}.json` | To‘rt tilli interfeys |
| `data/media-storage.json` | Drive IDlari, fayl hashlari va ochiq ruxsat holati |
| `data/media-sources.json`, `data/photo_attribution.json` | Haqiqiy manba, muallif, foydalanish sharti va tasdiq holati |
| `data/coordinate-sources.json` | Koordinatalarning mustaqil manba tekshiruvi |
| `data/routing/index.json`, `data/routing/geometry/` | Nukus yo‘llari va yakuniy yaqinlashish qismlari |
| `data/app-config.json` | Ixtiyoriy jonli marshrut provayderi sozlamasi |
| `js/` | Media, tillar, xarita, filtrlar, navigatsiya va interfeys |

Eski `data/destinations.js`, `data/routes.js`, `data/translations.js`, `css/style.css` va `css/input.css` faol sahifaga ulanmagan. Ularni tahrirlash faol katalogni yangilamaydi. Obyekt IDlarini o‘zgartirmang: marshrutlar, rasmlar, saqlangan joylar va kesh shu IDlarga bog‘langan.

## Google Drive

Media papkasi: [Qoraqalpogiston Travel — Media](https://drive.google.com/drive/folders/13d8iQHc3wtarFhKtnRG_7B-mQCmPv5Kt).

Barcha 131 media uchun Drive reyestrida fayl IDsi, manzil va mahalliy nusxaning SHA-256 qiymati saqlanadi. Hozir ochiq o‘qish ruxsati tasdiqlanmagan: `publicReadable: false`, `publicUrl: null`. Drive ulashish sozlamalari o‘zgartirilmagan; sayt mahalliy rasm va kichik nusxalar bilan ishlaydi. Hisob ma’lumotlari, tokenlar va vaqtinchalik imzolangan URLlar katalogga kiritilmaydi.

Galereya ochiq Drive manzili tasdiqlansa uni ishlata oladi; xatoda mahalliy nusxaga qaytadi. Yopiq Drive fayli tashrif buyuruvchidan hisobga kirishni talab qiladigan sahifaga almashtirilmaydi. `publicReadable` faqat ruxsat metadata’si bilan tekshirilgach `true` qilinadi. [Drive fayl metadata hujjati](https://developers.google.com/workspace/drive/api/reference/rest/v3/files).

## Yo‘llar va koordinatalar

64/64 Nukus yo‘li 2026-yil 21-oktabrda OSRM provayderidan qayta olindi. Saqlangan masofa OSRM tavsiya qilgan eng tez xaritalangan avtomobil yo‘liga tegishli. Bu obyektning aynan pin nuqtasigacha avtomobil kira olishini tasdiqlamaydi.

41 yo‘lda ma’lum yo‘l oxiridan obyektgacha 100 metrdan katta farq bor. Ma’lum yo‘l uzluksiz, tekshirilmagan yaqinlashish qismi punktir bilan chiziladi; qoldiq to‘g‘ri chiziq masofasidir. Eng katta farq Janubiy Ustyurt hudud nuqtasiga 67,527 km. Masofa filtri faqat xaritalangan Nukus yo‘li uzunligini ishlatadi.

Mustaqil nashrlar 30 obyektning nuqtasini qo‘llab-quvvatlaydi. 12 ta eski `exact` nuqta hali mustaqil tekshiruvga muhtoj, 22 nuqta katta hududni ifodalovchi `representative` koordinatadir. Interfeys taxminiylikni ko‘rsatadi; e’lon qilingan koordinata avtomobil kirish joyi degani emas.

Keshda `fetchedAt`, 30 kunlik `expiresAt`, `distanceMeters`, `durationSeconds` va provayder yozilgan. Provayder xarita yangilanish sanasini bermagan: `providerDataVersion: null`. Olish sanasi bilan xarita yangilanish sanasi bir xil deb ko‘rsatilmaydi; safar vaqti kafolatlanmaydi.

Jonli marshrutlash odatda o‘chirilgan:

```json
"routing": {
  "liveRoutingEnabled": false,
  "endpoint": null
}
```

GPS faqat foydalanuvchi joylashuv tugmasini bosganda so‘raladi va sahifa xotirasida qoladi. Jonli provaydersiz foydalanuvchidan masofa to‘g‘ri chiziq sifatida belgilanadi. Yon panel va batafsil oynadagi Google/Yandex havolalari manzil koordinatasiga avtomobil yo‘lini ochadi: boshlanish nuqtasi mavjud GPS koordinatasi yoki Nukus. Havolalar yo‘l keshi yuklanishiga bog‘liq emas. Google ayrim qurilmalarda navigatsiya o‘rniga yo‘l ko‘rinishini ochishi mumkin; yo‘l mavjudligini tashqi provayder hal qiladi. [Google Maps URL formati](https://developers.google.com/maps/documentation/urls/get-started), [Yandex Maps URL formati](https://yandex.ru/dev/yandex-apps-launch-maps/doc/ru/concepts/yandexmaps-web).

Kelajakda mos HTTPS provayder sozlansa, maxfiy kalit frontendga joylanmaydi; ommaviy OSRM demo serveri barcha tashrif buyuruvchilar uchun backend qilib ishlatilmaydi. [OSRM demo foydalanish shartlari](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server).

## Katalog va media bilan ishlash

`photos` yozuvlari manba, muallif, litsenziya/shart havolasi, to‘rt tildagi izoh, `kind`, tekshiruv bayroqlari va o‘zgartirish tavsifini saqlaydi. Interfeys predmet mosligi tekshirilgan tasvirni quyidagi holatlarda ko‘rsatadi: qayta foydalanish tasdiqlangan yoki foydalanuvchining aniq nashr talabi (`publicationRequested`) va haqiqiy manba havolasi mavjud. Ikkinchi holat tasdiqlangan foydalanish ruxsati deb ko‘rsatilmaydi.

- `scripts/collect-images.ps1` Commons metadata’si va rasmlarini yig‘adi. `-Publish` tekshirilgan yozuvlarni faol katalogga uyg‘unlashtiradi; `-MetadataOnly` bilan birga berilmaydi. Xatoda avvalgi muvaffaqiyatli media saqlanadi. Boshqa nashriyot sharti Commons litsenziyasi sifatida talqin qilinmaydi.
- `scripts/publish-reviewed-media.ps1` odatda `preferred`, `subjectVerified`, `licenseVerified`, `reuseVerified` tasdiqlarini talab qiladi. `-IncludeRequestedRights` faqat yozuvda aniq `publicationRequested: true` mavjud bo‘lsa alohida foydalanuvchi talabini hisobga oladi. Asl SHA-256, haqiqiy manba va shart havolalari saqlanadi; veb nusxa 1200 px, kichik nusxa 480 px gacha tayyorlanadi. `Math.Min(1.0, …)` kattalashtirishni cheklaydi va Int32 yaxlitlanish xatosini oldini oladi.
- `scripts/precompute-routes.js --refresh` yo‘llarni yangilaydi; `--id=OBYEKT_ID`, `--max-age-days=30`, `--endpoint=HTTPS_BASE` mavjud. So‘rov oralig‘i kamida 1.1 soniya. Xatoda avvalgi muvaffaqiyatli yo‘l va uning haqiqiy sanasi saqlanadi.
- Eski `scripts/integrate-images.js` faol yozishdan chiqarilgan. `build-64-destinations.js` va `build-114-destinations.js` faqat `data/generated/`ga nomzod katalog chiqaradi.

Tadqiqot rasmlari `research/`da qoladi va Git/Pages’ga kiritilmaydi. Yangi/legacy generatorlar faol katalog, mavjud media va koordinatalarni avtomatik almashtirmaydi.

## Avvalgi mahalliy ko‘rish va joriy nashr yo‘li

Dastlabki bosqich qaydida foydalanuvchi so‘rovi bilan mahalliy server [http://127.0.0.1:3000/](http://127.0.0.1:3000/) manzilida ochilgani ko‘rsatilgan. Bu hozir server ishlayotganini bildirmaydi. Mahalliy ko‘rish alohida so‘ralsa, loyiha papkasidan `node server.js` bilan boshlash mumkin; u faqat `127.0.0.1`ga ulanadi.

Cloudflare Pages uchun `node scripts/prepare-pages.js` `_site/`ga faqat faol kod/ma’lumotlar, katalogga kiritilgan media va 64 aktiv yo‘l geometriyasini yig‘adi. Eski katalog/uslublar, tadqiqot fayllari, server, ZIPlar va ortiqcha geometriyalar kiritilmaydi. Bu buyruq ilovani ishga tushirmaydi. `_site/` Git’ga kiritilmaydi; Cloudflare uni manbadan yig‘adi.

Joriy nashr yo‘li yuqoridagi Cloudflare Pages Git Integration sozlamalaridir. `.github/workflows/pages.yml` faqat qo‘lda boshlanadigan eski GitHub Pages varianti sifatida saqlangan; u `main` push’larida ishlamaydi va Cloudflare uchun kerak emas. GitHub Pages’ga alohida nashr so‘ralgandagina uning sozlamalari va qo‘lda workflow ishga tushirilishi ko‘rib chiqiladi. [GitHub Pages workflow hujjati](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Dastlabki bosqich qaydiga ko‘ra test yozilmagan yoki bajarilmagan; avtomatlashtirilgan brauzer tekshiruvi qilinmagan. Manba/rasm tahlili, ma’lumotlar va fayllar mosligi, Drive metadata qayta o‘qilishi hamda JavaScript/PowerShell sintaksisi ko‘rilgan. Keyingi nashr va uning tekshiruv holati alohida qayd etiladi.
