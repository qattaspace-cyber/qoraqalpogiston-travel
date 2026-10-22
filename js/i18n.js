// Internationalization (i18n) Engine with JSON Fetching
const SUPPORTED_LANGUAGES = ["uz", "kaa", "ru", "en"];
let storedLang = "uz";
try {
  storedLang = localStorage.getItem("site_lang") || "uz";
} catch (err) {
  // The default language remains available when browser storage is blocked.
}
let currentLang = SUPPORTED_LANGUAGES.includes(storedLang) ? storedLang : "uz";
// A complete Uzbek dictionary keeps every control usable if locale requests fail.
// This source copy mirrors data/locales/uz.json and must retain all UI keys.
const FALLBACK_LOCALE_DICTIONARY = Object.freeze({
  "siteTitle": "Qoraqalpog'iston Travel",
  "siteSubtitle": "Kashf etishga arziydigan diyor",
  "siteTagline": "Tabiat • Tarix • Madaniyat • Odamlar",
  "headerQuote": "Buyuk meros, cheksiz imkoniyatlar — Qoraqalpog'iston kashfiyotlar yurti!",
  "navHome": "Bosh sahifa",
  "navPlaces": "Joylar",
  "navRoutes": "Marshrutlar",
  "navEvents": "Tadbirlar",
  "navAbout": "Biz haqimizda",
  "btnLogin": "Kirish",
  "tourismTypesTitle": "Turizm turlari",
  "districtFilterTitle": "Hudud bo'yicha",
  "allDistricts": "Barcha tumanlar",
  "extraFiltersTitle": "Qo'shimcha filtrlar",
  "distanceFilterLabel": "Masofa (Nukusdan)",
  "clearFilters": "Filtrlarni tozalash",
  "searchPlaceholder": "Joy, tuman yoki kalit so'z bo'yicha qidirish...",
  "popularDestinationsTitle": "Mashhur turistik obyektlar",
  "seeAll": "Barchasini ko'rish →",
  "objectDetailsTitle": "Tanlangan obyekt haqida ma'lumot",
  "distanceFromNukus": "Nukusdan masofa",
  "distanceFromYou": "Sizdan masofa",
  "routePath": "Borish yo'li",
  "btnDetails": "Batafsil",
  "btnShowRoute": "Marshrutni ko'rish",
  "myLocation": "Mening joylashuvim",
  "savedFavorites": "Saqlangan",
  "profile": "Profil",
  "mapView": "Xarita",
  "all": "Barchasi",
  "objectsFound": "ta obyekt topildi",
  "realPhotoBadge": "Haqiqiy foto",
  "footerSlogan": "QORAQALPOG'ISTON — BARCHA SAYYOHLAR UCHUN OCHIQ",
  "allDestinationsTitle": "Turistik obyektlar",
  "noResults": "Bu filtrlarga mos joy topilmadi.",
  "loading": "Ma'lumotlar yuklanmoqda…",
  "loadError": "Ma'lumotlarni yuklab bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.",
  "retry": "Qayta urinish",
  "galleryPrevious": "Oldingi rasm",
  "galleryNext": "Keyingi rasm",
  "photoCaption": "Rasm izohi",
  "photoSource": "Rasm manbasi",
  "viewOriginal": "Asl rasmni ko'rish",
  "illustrativePhoto": "Yuqoridan ko‘rinish",
  "historicalFacts": "Tarixiy ma'lumot",
  "placeSummary": "Qisqacha ma’lumot",
  "legends": "Rivoyat va afsonalar",
  "legendUnavailable": "Bu obyekt haqida alohida tekshirilgan rivoyat ma'lumoti kiritilmagan.",
  "howToGetThere": "Qanday boriladi?",
  "coordinatesApproximate": "Koordinatalar taxminiy",
  "routeApproximate": "Taxminiy marshrut",
  "routePartial": "Marshrut yo'lning oxirgi ma'lum nuqtasigacha chizilgan",
  "routeApproachDistance": "Yo'l nuqtasidan obyektgacha",
  "straightLineDistance": "To'g'ri chiziq bo'yicha masofa",
  "routingUnavailable": "Yo'l marshruti hozir mavjud emas",
  "openGoogleMaps": "Google Maps orqali borish",
  "openYandexMaps": "Yandex Maps orqali borish",
  "useMyLocation": "Mening joylashuvimdan hisoblash",
  "locationDenied": "Joylashuvga ruxsat berilmagan",
  "locationUnavailable": "Joylashuvni aniqlab bo'lmadi",
  "distancesAll": "Barcha masofalar",
  "distanceUnder50": "50 km dan kam",
  "distance50to150": "50 km dan 150 km gacha (150 kirmaydi)",
  "distance150to300": "150–300 km (chegaralari kiradi)",
  "distanceOver300": "300 km dan uzoq",
  "roadAsphalt": "Asfalt yo'l",
  "road4x4": "4×4 talab qilinadi",
  "routesTitle": "Tavsiya etilgan marshrutlar",
  "routeStops": "Marshrut bekatlari",
  "durationDays": "kun",
  "routeEstimated": "Marshrut davomiyligi taxminiy",
  "noSavedPlaces": "Hali saqlangan joy yo'q. Joy kartasidagi yurak belgisini bosing.",
  "aboutTitle": "Qoraqalpog‘iston turizmi: interaktiv xarita",
  "aboutText": "Tajibayeva Lalaxan Radjapovna tomonidan tayyorlangan ushbu interaktiv xarita Qoraqalpog‘istonning turistik salohiyati, madaniy merosi va sayohat yo‘nalishlarini o‘rganishga bag‘ishlangan.",
  "phaseOne": "Dastlabki nashr",
  "attributionPending": "Rasm muallifi va litsenziyasi aniqlashtirilmoqda",
  "toggleFavorite": "Joyni saqlash yoki saqlanganlardan olib tashlash",
  "clearRoute": "Marshrutni tozalash",
  "placesFound": "{count} ta joy topildi",
  "zoomIn": "Yaqinlashtirish",
  "zoomOut": "Uzoqlashtirish",
  "close": "Yopish",
  "previous": "Oldingi",
  "next": "Keyingi",
  "showAll": "Barchasini ko'rsatish",
  "coordinateLabel": "Koordinatalar",
  "navigationTargetWarning": "Navigatsiya taxminiy koordinataga yo'naltirishi mumkin. Borishdan oldin yakuniy manzilni aniqlashtiring.",
  "mapStreet": "Yo'llar xaritasi",
  "mapSatellite": "Sun'iy yo'ldosh",
  "mapRelief": "Relyef",
  "gpsUnavailable": "Brauzer joylashuvni aniqlashni qo'llab-quvvatlamaydi",
  "gpsInsecure": "Joylashuvni aniqlash uchun sayt HTTPS orqali ochilishi kerak",
  "gpsDenied": "Brauzerda joylashuvga ruxsat berilmagan",
  "gpsTimeout": "Joylashuvni aniqlash vaqti tugadi. Qayta urinib ko'ring.",
  "gpsFailure": "Joylashuvni aniqlab bo'lmadi. Qayta urinib ko'ring.",
  "mapTilesError": "Xarita qatlamini yuklab bo'lmadi. Internet aloqasini tekshiring.",
  "routeUnavailable": "Bu joy uchun yo'l marshrutini hisoblab bo'lmadi",
  "routeGeometryUnavailable": "Marshrut chizig'i mavjud emas",
  "routingCacheUnavailable": "Saqlangan marshrut ma'lumotlarini yuklab bo'lmadi",
  "distanceFilterTitle": "Nukusdan xaritadagi yo'l masofasi",
  "routeFromNukusCaption": "Nukusdan xaritadagi yo'l",
  "routeFromUserCaption": "Sizdan xaritadagi yo'l",
  "coordinatesUnverified": "Manzil koordinatasi hali mustaqil manbadan tasdiqlanmagan",
  "coordinateSource": "Koordinata manbasi",
  "favoritesOnlyActive": "Faqat saqlangan joylar ko‘rsatilmoqda",
  "pageTitle": "Qoraqalpog‘iston Travel — Madaniyat va sayohat atlasi",
  "brandRegion": "Qoraqalpog‘iston",
  "atlasLabel": "Madaniyat va sayohat atlasi",
  "skipToMap": "Xaritaga o‘tish",
  "navigationLabel": "Asosiy navigatsiya",
  "languageLabel": "Tilni tanlash",
  "mapRegionLabel": "Interaktiv turistik xarita",
  "heroEyebrow": "O‘zbekiston · Orolbo‘yi",
  "heroTitle": "Qadimiy meros.",
  "heroTitleAccent": "Yangi kashfiyotlar.",
  "heroDescription": "Cho‘l qal’alari, Orolbo‘yi manzaralari va tirik an’analar. Qoraqalpog‘istonni joylar, hikoyalar va yo‘llar orqali kashf eting.",
  "heroMapAction": "Xaritadan boshlash",
  "heroRoutesAction": "Marshrutlarni ko‘rish",
  "heroPhotoPlace": "Ayaz-qal’a I",
  "heroPhotoDistrict": "Ellikqal’a tumani",
  "heroPhotoCredit": "Foto: Bgag · CC0 · qirqilgan",
  "overviewIntro": "Bir hudud. Ming yillik tarix. Sizning navbatdagi kashfiyotingiz.",
  "statDestinations": "Turistik obyekt",
  "statCategories": "Turizm toifasi",
  "statLanguages": "Interfeys tili",
  "overviewNote": "Nukusdan boshlanadigan sayohat",
  "mapEyebrow": "01 / Hududni o‘rganing",
  "mapTitle": "Sayohatingiz xaritadan boshlanadi",
  "placesEyebrow": "02 / Ochiq osmon ostidagi meros",
  "routesEyebrow": "03 / Yo‘lga chiqish vaqti",
  "routesDescription": "Nukusdan madaniy meros va keng ufqlar sari.",
  "showMore": "Yana ko‘rsatish",
  "heritageUNESCOTentative": "UNESCO dastlabki ro‘yxati",
  "heritageUNESCOTentative2025": "UNESCO dastlabki ro‘yxati · 2025",
  "heritageCultural": "Madaniy meros",
  "heritageNecropolis": "Tarixiy nekropol",
  "heritageGoldenHorde": "Oltin O‘rda me’morchiligi",
  "heritageSilkRoad": "Ipak yo‘li merosi",
  "heritageUstyurtFortress": "Ustyurt qal’asi",
  "heritagePilgrimage": "Ziyoratgoh",
  "heritageSacred": "Muqaddas qadamjo",
  "heritageBirdArea": "Xalqaro ahamiyatdagi qushlar hududi",
  "heritageBiosphere": "UNESCO biosfera rezervati · 2021",
  "heritageSavitsky": "«Sahrodagi Luvr»",
  "routeCacheStale": "Yo‘l ma’lumoti yangilanishi kerak",
  "routeDataDate": "Yo‘l ma’lumoti olingan sana",
  "mappedRoadDistance": "Xaritadagi avtomobil yo‘li",
  "mapFixMap": "Xaritani tuzatish",
  "mapLayers": "Xarita qatlamlari",
  "aboutEyebrow": "Muallif va loyiha",
  "aboutAuthor": "Tajibayeva Lalaxan Radjapovna",
  "aboutPosition": "Qoraqalpoq Davlat universiteti iqtisodiy va ijtimoiy geografiya ixtisosligi tayanch doktoranti.",
  "workspacePanels": "Xarita panellari",
  "showFilters": "Filtrlarni ochish",
  "hideFilters": "Filtrlarni yig‘ish",
  "showDetails": "Obyekt panelini ochish",
  "hideDetails": "Obyekt panelini yig‘ish"
});
let localeDictionary = { ...FALLBACK_LOCALE_DICTIONARY };
let localeRequestId = 0;

async function loadLocale(lang) {
  const requestId = ++localeRequestId;
  const requestedLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : "uz";
  const candidates = requestedLang === "uz" ? ["uz"] : [requestedLang, "uz"];
  for (const candidate of candidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`data/locales/${candidate}.json`, { signal: controller.signal });
      if (!res.ok) continue;
      const dictionary = await res.json();
      if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) continue;
      if (requestId !== localeRequestId) return false;
      localeDictionary = { ...FALLBACK_LOCALE_DICTIONARY, ...dictionary };
      currentLang = candidate;
      try {
        localStorage.setItem("site_lang", candidate);
      } catch (err) {
        // Switching languages does not depend on persistent storage.
      }
      document.documentElement.lang = candidate;
      applyTranslations();
      return true;
    } catch (err) {
      console.warn(`Failed to load locale: ${candidate}`, err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  if (requestId !== localeRequestId) return false;
  currentLang = "uz";
  localeDictionary = { ...FALLBACK_LOCALE_DICTIONARY };
  document.documentElement.lang = currentLang;
  applyTranslations();
  return true;
}

function applyTranslations() {
  document.title = t("pageTitle");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (localeDictionary[key] !== undefined) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = localeDictionary[key];
      } else {
        el.textContent = localeDictionary[key];
      }
    }
  });

  document.querySelectorAll("[data-i18n-title], [data-i18n-aria-label]").forEach((el) => {
    const titleKey = el.getAttribute("data-i18n-title");
    const ariaKey = el.getAttribute("data-i18n-aria-label") || titleKey;
    if (titleKey && localeDictionary[titleKey] !== undefined) {
      el.title = localeDictionary[titleKey];
    }
    if (ariaKey && localeDictionary[ariaKey] !== undefined) {
      el.setAttribute("aria-label", localeDictionary[ariaKey]);
    }
  });

  const langSelect = document.getElementById("language-select");
  if (langSelect) langSelect.value = currentLang;

  window.dispatchEvent(new CustomEvent("language-changed", { detail: { lang: currentLang } }));
}

function t(key, values = {}) {
  const text = localeDictionary[key] || key;
  return String(text).replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : placeholder
  );
}

function getLocalized(obj) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[currentLang] || obj.uz || obj.kaa || obj.ru || obj.en || "";
}
