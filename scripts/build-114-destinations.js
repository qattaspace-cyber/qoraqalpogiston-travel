const fs = require('fs');
const path = require('path');

// District normalization mapping
const districtMap = {
  "amudaryo": { id: "amudaryo", uz: "Amudaryo tumani", kaa: "Ámiwdárya rayonı", ru: "Амударьинский район", en: "Amu Darya District" },
  "beruniy": { id: "beruniy", uz: "Beruniy tumani", kaa: "Beruniy rayonı", ru: "Берунийский район", en: "Beruniy District" },
  "ellikqala": { id: "ellikqala", uz: "Ellikqal'a tumani", kaa: "Ellikqala rayonı", ru: "Элликкалинский район", en: "Ellikkala District" },
  "qoraozak": { id: "qoraozak", uz: "Qorao'zak tumani", kaa: "Qaraózek rayonı", ru: "Караузякский район", en: "Karaozyak District" },
  "turtkol": { id: "turtkol", uz: "To'rtko'l tumani", kaa: "Tórtkúl rayonı", ru: "Турткульский район", en: "Turtkul District" },
  "xojayli": { id: "xojayli", uz: "Xo'jayli tumani", kaa: "Xojeli rayonı", ru: "Ходжейлийский район", en: "Khojeyli District" },
  "qungirot": { id: "qungirot", uz: "Qo'ng'irot tumani", kaa: "Qońırat rayonı", ru: "Кунградский район", en: "Kungrad District" },
  "muynak": { id: "muynak", uz: "Mo'ynoq tumani", kaa: "Moynaq rayonı", ru: "Муйнакский район", en: "Muynak District" },
  "nukus-city": { id: "nukus-city", uz: "Nukus shahri", kaa: "Nókis qalası", ru: "Город Нукус", en: "Nukus City" },
  "nukus-district": { id: "nukus-district", uz: "Nukus tumani", kaa: "Nókis rayonı", ru: "Нукусский район", en: "Nukus District" },
  "kegeyli": { id: "kegeyli", uz: "Kegeyli tumani", kaa: "Kegeyli rayonı", ru: "Кегейлийский район", en: "Kegeyli District" },
  "chimboy": { id: "chimboy", uz: "Chimboy tumani", kaa: "Shımbay rayonı", ru: "Чимбайский район", en: "Chimbay District" },
  "kanlikol": { id: "kanlikol", uz: "Qanliko'l tumani", kaa: "Qanlıkól rayonı", ru: "Канлыкульский район", en: "Kanlykul District" },
  "taxtakopir": { id: "taxtakopir", uz: "Taxtako'pir tumani", kaa: "Taxtakópir rayonı", ru: "Тахтакупырский район", en: "Takhtakupir District" },
  "bozatau": { id: "bozatau", uz: "Bo'zatau tumani", kaa: "Bozataw rayonı", ru: "Бозатауский район", en: "Bozatau District" },
  "taxiatosh": { id: "taxiatosh", uz: "Taxiatosh tumani", kaa: "Taxıyatas rayonı", ru: "Тахиаташский район", en: "Takhiatash District" },
  "shumanay": { id: "shumanay", uz: "Shumanay tumani", kaa: "Shomanay rayonı", ru: "Шуманайский район", en: "Shumanay District" }
};

// Raw authoritative list of all 114 items
const raw114 = [
  // 1–27 Tarixiy va arxeologik
  { num: 1, name: "Chilpik (Chilpyk Dakhma)", dist: "amudaryo", lat: 42.264253, lng: 60.069767, cat: "cultural", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 2, name: "Sulton Uvays Dag Gyaur-qal’a", dist: "qoraozak", lat: 42.080556, lng: 60.275278, cat: "historical", unesco: "UNESCO Tentative", type: "exact" },
  { num: 3, name: "Jampik-qal’a", dist: "qoraozak", lat: 42.026861, lng: 60.326019, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 4, name: "Qizil-qal’a", dist: "beruniy", lat: 41.930028, lng: 60.784111, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 5, name: "Toproq-qal’a", dist: "ellikqala", lat: 41.927139, lng: 60.822917, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 6, name: "Akshaxon-qal’a", dist: "beruniy", lat: 41.828889, lng: 60.716917, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 7, name: "Ayaz-qal’a I", dist: "beruniy", lat: 42.014186, lng: 61.028997, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 8, name: "Ayaz-qal’a II", dist: "ellikqala", lat: 42.010836, lng: 61.027175, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 9, name: "Ayaz-qal’a III", dist: "ellikqala", lat: 42.005500, lng: 61.030556, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 10, name: "Katta Qirq Qiz qal’a", dist: "ellikqala", lat: 42.007831, lng: 61.157581, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 11, name: "Kichik Qirq Qiz qal’a", dist: "ellikqala", lat: 42.018108, lng: 61.101056, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 12, name: "Kurgashin-qal’a", dist: "ellikqala", lat: 42.034167, lng: 61.321778, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 13, name: "Bozor-qal’a", dist: "turtkol", lat: 41.823869, lng: 61.187269, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 14, name: "Jonbos-qal’a (Djanbas-kala)", dist: "turtkol", lat: 41.858219, lng: 61.303608, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 15, name: "Qo‘yqirilgan-qal’a (Koi-Krilgan)", dist: "turtkol", lat: 41.755192, lng: 61.116969, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 16, name: "Angka-qal’a", dist: "turtkol", lat: 41.758667, lng: 61.151167, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 17, name: "Eres-qal’a", dist: "turtkol", lat: 41.667331, lng: 61.091889, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 18, name: "Katta Guldursun", dist: "ellikqala", lat: 41.693214, lng: 60.981156, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 19, name: "Pil-qal’a", dist: "beruniy", lat: 41.705000, lng: 60.748611, cat: "historical", unesco: "Madaniy meros", type: "exact" },
  { num: 20, name: "Mizdaxkan majmuasi", dist: "xojayli", lat: 42.401167, lng: 59.389333, cat: "pilgrimage", unesco: "Tarixiy nekropol", type: "exact" },
  { num: 21, name: "Mazlumxon Sulu maqbarasi", dist: "xojayli", lat: 42.402669, lng: 59.388194, cat: "pilgrimage", unesco: "Oltin O'rda me'morchiligi", type: "exact" },
  { num: 22, name: "Beleuli karvonsaroyi", dist: "qungirot", lat: 44.503900, lng: 57.115600, cat: "historical", unesco: "Ipak Yo'li merosi", type: "representative", fourByFour: true },
  { num: 23, name: "Kurgancha (Davletgirey)", dist: "qungirot", lat: 44.500000, lng: 58.166700, cat: "historical", unesco: "Ustyurt qal'asi", type: "representative", fourByFour: true },
  { num: 24, name: "Norinjon Bobo", dist: "ellikqala", lat: 41.753743, lng: 60.983448, cat: "pilgrimage", unesco: "Ziyoratgoh", type: "exact" },
  { num: 25, name: "Sulton Uvays Bobo", dist: "beruniy", lat: 42.010922, lng: 60.645334, cat: "pilgrimage", unesco: "Muqaddas qadamjo", type: "exact" },
  { num: 26, name: "Berkut-qal’a", dist: "ellikqala", lat: 41.787917, lng: 61.055056, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },
  { num: 27, name: "Puljay", dist: "qungirot", lat: 43.177192, lng: 58.367806, cat: "historical", unesco: "UNESCO Tentative (2025)", type: "exact" },

  // 28–75 Ziyoratgohlar va diniy-madaniy
  { num: 28, name: "Azler Bobo", dist: "nukus-district", lat: 42.569206, lng: 59.550516, cat: "pilgrimage", type: "exact" },
  { num: 29, name: "Imam Iyshan", dist: "nukus-district", lat: 42.638425, lng: 59.320294, cat: "pilgrimage", type: "exact" },
  { num: 30, name: "Salmen Ota qabristoni", dist: "nukus-city", lat: 42.481629, lng: 59.644595, cat: "pilgrimage", type: "exact" },
  { num: 31, name: "Shorsha Baba qabristoni", dist: "nukus-city", lat: 42.494598, lng: 59.609568, cat: "pilgrimage", type: "exact" },
  { num: 32, name: "Qusxana qabristoni", dist: "nukus-city", lat: 42.362973, lng: 59.626968, cat: "pilgrimage", type: "exact" },
  { num: 33, name: "Buyuk shahid Panteleimon pravoslav cherkovi", dist: "nukus-city", lat: 42.457715, lng: 59.611314, cat: "cultural", type: "exact" },
  { num: 34, name: "Shinar Bobo", dist: "beruniy", lat: 42.012168, lng: 60.642818, cat: "pilgrimage", type: "exact" },
  { num: 35, name: "Sulton Valiy Ota", dist: "beruniy", lat: 42.010922, lng: 60.645334, cat: "pilgrimage", type: "exact" },
  { num: 36, name: "Shayx Abbos Valiy", dist: "beruniy", lat: 42.012168, lng: 60.642818, cat: "pilgrimage", type: "exact" },
  { num: 37, name: "Kechirmas Bobo", dist: "ellikqala", lat: 41.718005, lng: 60.994346, cat: "pilgrimage", type: "exact" },
  { num: 38, name: "Bibi Mushkulkushod masjidi", dist: "ellikqala", lat: 41.579079, lng: 60.912247, cat: "pilgrimage", type: "exact" },
  { num: 39, name: "Shamun Nabi maqbarasi", dist: "xojayli", lat: 42.401576, lng: 59.388835, cat: "pilgrimage", type: "exact" },
  { num: 40, name: "Rejeb (Erejep) Xalifa", dist: "xojayli", lat: 42.401483, lng: 59.387511, cat: "pilgrimage", type: "exact" },
  { num: 41, name: "Madaminxon maqbarasi", dist: "xojayli", lat: 42.402445, lng: 59.387998, cat: "pilgrimage", type: "exact" },
  { num: 42, name: "Yusuf Iyshan Bobo qabristoni", dist: "xojayli", lat: 42.402053, lng: 59.416986, cat: "pilgrimage", type: "exact" },
  { num: 43, name: "Sulton Axun qabristoni", dist: "xojayli", lat: 42.437065, lng: 59.517281, cat: "pilgrimage", type: "exact" },
  { num: 44, name: "Qabiljan Bobo qabristoni", dist: "xojayli", lat: 42.427042, lng: 59.480871, cat: "pilgrimage", type: "exact" },
  { num: 45, name: "Payg‘ambar qizi", dist: "qungirot", lat: 43.120333, lng: 59.097080, cat: "pilgrimage", type: "exact" },
  { num: 46, name: "Daut Ota", dist: "qungirot", lat: 43.031701, lng: 58.731436, cat: "pilgrimage", type: "exact" },
  { num: 47, name: "Buraxan Ota", dist: "qungirot", lat: 43.171540, lng: 58.817809, cat: "pilgrimage", type: "exact" },
  { num: 48, name: "Hakim Ota (Sulaymon Boqirg‘oniy)", dist: "muynak", lat: 43.297970, lng: 58.938570, cat: "pilgrimage", type: "exact" },
  { num: 49, name: "Jantemir Ishan", dist: "muynak", lat: 43.400186, lng: 59.019211, cat: "pilgrimage", type: "exact" },
  { num: 50, name: "Toqmaq Ota", dist: "muynak", lat: 43.801738, lng: 58.990088, cat: "pilgrimage", type: "exact" },
  { num: 51, name: "Ishan Qala", dist: "kegeyli", lat: 42.670202, lng: 59.748517, cat: "pilgrimage", type: "exact" },
  { num: 52, name: "Shibliy Ota", dist: "kegeyli", lat: 42.694471, lng: 59.787843, cat: "pilgrimage", type: "exact" },
  { num: 53, name: "Shayx Jalil Bobo", dist: "qoraozak", lat: 42.159566, lng: 60.249484, cat: "pilgrimage", type: "exact" },
  { num: 54, name: "Murat Shayx", dist: "qoraozak", lat: 42.924222, lng: 60.120232, cat: "pilgrimage", type: "exact" },
  { num: 55, name: "Qoshqar (Qo‘chqor) Ota", dist: "qoraozak", lat: 42.818078, lng: 59.926267, cat: "pilgrimage", type: "exact" },
  { num: 56, name: "Qabaqli Ota", dist: "qoraozak", lat: 43.490667, lng: 60.261139, cat: "pilgrimage", type: "exact" },
  { num: 57, name: "Qayip Ota", dist: "qoraozak", lat: 43.052204, lng: 60.033656, cat: "pilgrimage", type: "exact" },
  { num: 58, name: "Nag‘im Ota", dist: "qoraozak", lat: 43.166415, lng: 60.015164, cat: "pilgrimage", type: "exact" },
  { num: 59, name: "Bag‘dat Ota", dist: "qoraozak", lat: 43.082778, lng: 59.964872, cat: "pilgrimage", type: "exact" },
  { num: 60, name: "Qaraqum Iyshan", dist: "bozatau", lat: 43.344508, lng: 59.487328, cat: "pilgrimage", type: "exact" },
  { num: 61, name: "Axun Bobo", dist: "chimboy", lat: 43.171661, lng: 59.656378, cat: "pilgrimage", type: "exact" },
  { num: 62, name: "Yaxya Masnauiy Eshon", dist: "chimboy", lat: 42.942889, lng: 59.762975, cat: "pilgrimage", type: "exact" },
  { num: 63, name: "Mardan Ota", dist: "chimboy", lat: 42.941248, lng: 59.600378, cat: "pilgrimage", type: "exact" },
  { num: 64, name: "Hoji Eshon Bobo", dist: "chimboy", lat: 42.938628, lng: 59.803149, cat: "pilgrimage", type: "exact" },
  { num: 65, name: "Eshimbet Eshon", dist: "chimboy", lat: 43.048570, lng: 59.856607, cat: "pilgrimage", type: "exact" },
  { num: 66, name: "Eshim Axun", dist: "kanlikol", lat: 42.859587, lng: 58.905592, cat: "pilgrimage", type: "exact" },
  { num: 67, name: "Irza Bobo", dist: "kanlikol", lat: 42.879648, lng: 58.946051, cat: "pilgrimage", type: "exact" },
  { num: 68, name: "Abdikerim Ishan", dist: "kanlikol", lat: 42.766794, lng: 59.033329, cat: "pilgrimage", type: "exact" },
  { num: 69, name: "Ajim Shiyit", dist: "taxtakopir", lat: 43.041003, lng: 60.297936, cat: "pilgrimage", type: "exact" },
  { num: 70, name: "Miskin", dist: "taxtakopir", lat: 42.981464, lng: 60.270828, cat: "pilgrimage", type: "exact" },
  { num: 71, name: "Manatay", dist: "taxtakopir", lat: 43.138597, lng: 60.327703, cat: "pilgrimage", type: "exact" },
  { num: 72, name: "Amanda", dist: "taxtakopir", lat: 43.024356, lng: 60.315492, cat: "pilgrimage", type: "exact" },
  { num: 73, name: "Qalandar Dog‘li madrasasi", dist: "turtkol", lat: 41.481386, lng: 61.058120, cat: "pilgrimage", type: "exact" },
  { num: 74, name: "Yusuf Eshon Bobo masjidi", dist: "amudaryo", lat: 42.113009, lng: 60.058938, cat: "pilgrimage", type: "exact" },
  { num: 75, name: "Ketmonchi Bobo qabristoni", dist: "taxiatosh", lat: 42.320369, lng: 59.582755, cat: "pilgrimage", type: "exact" },

  // 76–96 Ekologik, tabiiy va landshaft
  { num: 76, name: "Orol dengizi (G'arbiy sohil)", dist: "muynak", lat: 44.850000, lng: 58.900000, cat: "ecological", type: "representative", fourByFour: true },
  { num: 77, name: "Aralkum milliy tabiat bog‘i", dist: "muynak", lat: 43.850000, lng: 59.500000, cat: "ecological", type: "representative", fourByFour: true },
  { num: 78, name: "Mo‘ynoq kema qabristoni", dist: "muynak", lat: 43.790139, lng: 59.033972, cat: "ecological", type: "exact" },
  { num: 79, name: "Ustyurt platosi (Kenglik)", dist: "qungirot", lat: 44.000000, lng: 57.500000, cat: "nature", type: "representative", fourByFour: true },
  { num: 80, name: "Ustyurt chinklari va kanyonlari", dist: "qungirot", lat: 45.300476, lng: 58.398560, cat: "nature", type: "representative", fourByFour: true },
  { num: 81, name: "Aktumsik burni", dist: "qungirot", lat: 45.101840, lng: 58.328940, cat: "nature", type: "representative", fourByFour: true },
  { num: 82, name: "Barsakelmes sho‘rxogi", dist: "qungirot", lat: 43.250000, lng: 57.666667, cat: "nature", type: "representative", fourByFour: true },
  { num: 83, name: "Sudochye ko‘llar tizimi", dist: "muynak", lat: 43.482800, lng: 58.520300, cat: "ecological", unesco: "Ramsar Xalqaro Hududi", type: "exact" },
  { num: 84, name: "Sudochye-Akpetki davlat buyurtmaxonasi", dist: "muynak", lat: 43.489794, lng: 58.688965, cat: "nature", type: "representative" },
  { num: 85, name: "Jiltirbas (Zhyltyrbas) ko‘li", dist: "muynak", lat: 43.546514, lng: 59.807002, cat: "nature", unesco: "Ramsar Hududi", type: "exact" },
  { num: 86, name: "Quyi Amudaryo davlat biosfera rezervati", dist: "beruniy", lat: 42.080000, lng: 60.254700, cat: "ecological", unesco: "UNESCO Biosfera Rezervati (2021)", type: "exact" },
  { num: 87, name: "Saigachiy qo‘riqlanadigan landshafti", dist: "qungirot", lat: 45.150556, lng: 57.729167, cat: "nature", type: "representative", fourByFour: true },
  { num: 88, name: "Janubiy Ustyurt milliy tabiat bog‘i", dist: "qungirot", lat: 42.081389, lng: 56.664722, cat: "nature", type: "representative", fourByFour: true },
  { num: 89, name: "Qizilqum cho‘li ekoturizm hududi", dist: "ellikqala", lat: 41.950000, lng: 61.400000, cat: "nature", type: "representative" },
  { num: 90, name: "Amudaryo deltasi suv-botqoqliklari", dist: "muynak", lat: 43.200000, lng: 59.200000, cat: "ecological", type: "representative" },
  { num: 91, name: "Kokcha toshga aylangan o‘rmoni", dist: "ellikqala", lat: 41.962160, lng: 61.331580, cat: "nature", type: "representative" },
  { num: 92, name: "Ayazko‘l", dist: "ellikqala", lat: 42.056800, lng: 61.066780, cat: "nature", type: "exact" },
  { num: 93, name: "Xo‘jako‘l–Qarajar ko‘llari", dist: "qungirot", lat: 43.265500, lng: 58.888000, cat: "nature", type: "representative" },
  { num: 94, name: "Makpalko‘l", dist: "muynak", lat: 43.661900, lng: 59.178100, cat: "nature", type: "representative" },
  { num: 95, name: "Maypost–Domalak ko‘llar tizimi", dist: "muynak", lat: 43.598650, lng: 59.413949, cat: "nature", type: "representative" },
  { num: 96, name: "Mejdurechensk suv ombori", dist: "muynak", lat: 43.450000, lng: 59.350000, cat: "nature", type: "representative" },

  // 97–106 Muzeylar va madaniy obyektlar
  { num: 97, name: "I.V. Savitskiy nomidagi Qoraqalpog‘iston davlat san’at muzeyi", dist: "nukus-city", lat: 42.465450, lng: 59.613010, cat: "museums", unesco: "Sharq Luvri", type: "exact" },
  { num: 98, name: "Qoraqalpog‘iston tarixi va madaniyati davlat muzeyi", dist: "nukus-city", lat: 42.462270, lng: 59.611130, cat: "museums", type: "exact" },
  { num: 99, name: "Shamuratovlar oilasi uy-muzeyi", dist: "nukus-city", lat: 42.467463, lng: 59.611269, cat: "museums", type: "exact" },
  { num: 100, name: "Berdaq milliy muzeyi", dist: "nukus-city", lat: 42.451650, lng: 59.625260, cat: "museums", type: "exact" },
  { num: 101, name: "Arxeologik kolleksiya / Aralaldi muzeyi", dist: "nukus-city", lat: 42.453916, lng: 59.603246, cat: "museums", type: "exact" },
  { num: 102, name: "Mo‘ynoq ochiq osmon ostidagi Kemalar qabristoni muzeyi", dist: "muynak", lat: 43.790139, lng: 59.033972, cat: "museums", type: "exact" },
  { num: 103, name: "Mo‘ynoq ekologiya muzeyi", dist: "muynak", lat: 43.766330, lng: 59.028710, cat: "museums", type: "exact" },
  { num: 104, name: "Badiiy akademiya ko‘rgazma zali", dist: "nukus-city", lat: 42.463500, lng: 59.612000, cat: "museums", type: "exact" },
  { num: 105, name: "Azatbay Otarbayev musiqa ustaxonasi", dist: "nukus-city", lat: 42.461000, lng: 59.615000, cat: "crafts", type: "exact" },
  { num: 106, name: "Orol dengizi tarixi muzeyi", dist: "muynak", lat: 43.789640, lng: 59.032420, cat: "museums", type: "exact" },

  // 107–114 Etno-turizm va hunarmandchilik
  { num: 107, name: "Chimboy Cultural Settlement", dist: "chimboy", lat: 42.945000, lng: 59.770000, cat: "ethno", type: "representative" },
  { num: 108, name: "Berdaq va Kunxo‘ja merosi maskanlari", dist: "chimboy", lat: 42.948000, lng: 59.765000, cat: "cultural", type: "representative" },
  { num: 109, name: "Baxshichilik merosi markazi", dist: "chimboy", lat: 42.943000, lng: 59.775000, cat: "ethno", type: "representative" },
  { num: 110, name: "Qara Uy (Yurt) ustaxonalari", dist: "chimboy", lat: 42.946000, lng: 59.768000, cat: "crafts", type: "representative" },
  { num: 111, name: "Chimboy zargarlik ustaxonalari", dist: "chimboy", lat: 42.944000, lng: 59.772000, cat: "crafts", type: "representative" },
  { num: 112, name: "Adil Tazhimuratov zargarlik ustaxonasi", dist: "chimboy", lat: 42.942500, lng: 59.771000, cat: "crafts", type: "representative" },
  { num: 113, name: "Qorateran ekoturizm kompleksi", dist: "taxtakopir", lat: 43.317633, lng: 60.375700, cat: "ecological", type: "representative" },
  { num: 114, name: "Tax-tepa etno qishlog‘i (Beltov)", dist: "taxtakopir", lat: 43.177500, lng: 60.466667, cat: "ethno", type: "representative" }
];

// Helper to slugify
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[’'ʻ‘`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The legacy 114-item numbering conflicts with the reviewed 64-item catalogue.
// Every result remains a candidate; a name match preserves its reviewed identity and media.
const canonicalPath = path.join(__dirname, '..', 'data', 'destinations.json');
const canonical = fs.existsSync(canonicalPath) ? JSON.parse(fs.readFileSync(canonicalPath, 'utf8')) : [];
if (!Array.isArray(canonical)) throw new Error('Canonical destinations must be an array.');

// Generate candidates only. Promotion requires identity, location and translation review.
const destinations114 = raw114.map((item) => {
  const slug = `${item.num}-${slugify(item.name)}`;
  const distInfo = districtMap[item.dist] || districtMap["nukus-city"];
  const is4x4 = Boolean(item.fourByFour);

  const candidate = {
    id: `candidate-114-${slug}`,
    number: item.num,
    category: item.cat,
    district: distInfo.id,
    districtName: {
      uz: distInfo.uz,
      kaa: distInfo.kaa,
      ru: distInfo.ru,
      en: distInfo.en
    },
    coordinates: {
      lat: item.lat,
      lng: item.lng
    },
    coordinateType: item.type, // 'exact' | 'representative'
    name: {
      uz: item.name,
      kaa: item.name,
      ru: item.name,
      en: item.name
    },
    description: {
      uz: `${item.name} — Qoraqalpog'istonning ${distInfo.uz} hududidagi muhim turistik maskani.`,
      kaa: `${item.name} — Qaraqalpaqstannıń ${distInfo.kaa} aymaǵındaǵı áhmiyetli turistlik orını.`,
      ru: `${item.name} — значимый туристический объект в ${distInfo.ru}, Каракалпакстан.`,
      en: `${item.name} — prominent tourist destination situated in ${distInfo.en}, Karakalpakstan.`
    },
    access: {
      road: is4x4 ? "offroad" : "asphalt",
      roadCondition: {
        uz: is4x4 ? "Faqat 4x4 / Ekspeditsiya yo'li" : "Asfalt / qatnov qulay",
        kaa: is4x4 ? "Tek 4x4 / Ekspediciya jolı" : "Asfalt / qatnaw qolaylı",
        ru: is4x4 ? "Только 4х4 / экспедиционный маршрут" : "Асфальт / удобный подъезд",
        en: is4x4 ? "4x4 Off-road only" : "Paved asphalt road"
      },
      vehicle: is4x4 ? "4x4" : "car",
      fourByFour: is4x4
    },
    routeHint: {
      uz: `Nukusdan ${distInfo.uz} tomon yo'nalish`,
      kaa: `Nókisten ${distInfo.kaa} baǵdarı`,
      ru: `Направление из Нукуса в ${distInfo.ru}`,
      en: `Direction from Nukus towards ${distInfo.en}`
    },
    unesco: item.unesco || null,
    images: [],
    photos: [],
    photoAttribution: { verified: false }
  };
  const matches = canonical.filter((destination) => destination.name &&
    slugify(destination.name.uz) === slugify(item.name));
  const reviewed = matches.length === 1 ? matches[0] : null;
  return {
    ...candidate,
    ...(reviewed || {}),
    candidateNumber: item.num,
    legacyCandidateId: slug,
    canonicalDestinationId: reviewed ? reviewed.id : null,
    candidateStatus: 'identity-coordinates-and-translations-review-required'
  };
});

const generatedDir = path.join(__dirname, '..', 'data', 'generated');
fs.mkdirSync(generatedDir, { recursive: true });
const outputPath = path.join(generatedDir, 'destinations-114.json');
fs.writeFileSync(outputPath, `${JSON.stringify(destinations114, null, 2)}\n`, 'utf8');
console.log(`Saved ${destinations114.length} unapproved review candidates to data/generated/destinations-114.json.`);
console.log('Legacy numbering must never automatically replace canonical IDs or routing-cache keys.');
console.log('Canonical destinations, photo sources and routing caches were not changed.');
