const fs = require('fs');
const path = require('path');

// District mapping definition
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

// 64 Curated Destinations according to user-approved list
const destinationsRaw = [
  // 01-27 Tarixiy va arxeologik obyektlar
  {
    num: 1,
    name: {
      uz: "Chilpik (Chilpyk Dakhma)",
      kaa: "Shilpik (Shilpik Daxması)",
      ru: "Чилпык (Дахма Чилпык)",
      en: "Chilpyk (Chilpyk Dakhma)"
    },
    dist: "amudaryo",
    lat: 42.264253,
    lng: 60.069767,
    cat: "cultural",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Eramizdan avvalgi I asr – eramizning II asriga oid qadimiy zardushtiylik sukunat minorasi (daxma). Nukusdan taxminan 43 km janubda, Amudaryoning o'ng qirg'og'ida baland tepalikda joylashgan.",
      kaa: "Eramızǵa shekemgi I ásir – eramızdıń II ásirine tiyisli áyyemgi zardushtıylıq tınıshlıq minarası (daxma). Nókisten 43 km qublada, Ámiwdáryanıń oń jaǵasında jaylasqan.",
      ru: "Древняя зороастрийская дахма (башня молчания) конца I в. до н.э. – начала II в. н.э., расположенная на холме на правом берегу Амударьи, в 43 км к югу от Нукуса.",
      en: "Ancient Zoroastrian dakhma (tower of silence) dating from the 1st century BCE to 2nd century CE, situated on a hill on the right bank of the Amu Darya, 43 km south of Nukus."
    }
  },
  {
    num: 2,
    name: {
      uz: "Sulton Uvays Dag Gyaur-qal’a",
      kaa: "Sultan Wáyiys Taǵı Gáwir-qala",
      ru: "Гяур-кала Султануиздага",
      en: "Gyaur-Kala of Sultan Uvays"
    },
    dist: "qoraozak",
    lat: 42.080556,
    lng: 60.275278,
    cat: "historical",
    unesco: "UNESCO Tentative",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Sulton Uvays tog'lari etagida joylashgan antik davr mustahkam mudofaa qal'asi. Chilpik va Jampik oralig'ida strategik nuqtada qad ko'targan.",
      kaa: "Sultan Wáyiys tawları eteginde jaylasqan áyyemgi dáwir qorǵanıw qalası. Shilpik hám Jampik aralıǵındaǵı zárúr noqat.",
      ru: "Античная оборонительная крепость у подножия хребта Султануиздаг, расположенная между Чилпыком и Джампык-калой.",
      en: "Ancient defensive fortress at the foot of Sultan Uvays range, standing strategically between Chilpyk and Jampyk-kala."
    }
  },
  {
    num: 3,
    name: {
      uz: "Jampik-qal’a",
      kaa: "Jampıq-qala",
      ru: "Джампык-кала",
      en: "Jampyk-Kala"
    },
    dist: "qoraozak",
    lat: 42.026861,
    lng: 60.326019,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Quyi Amudaryo biosfera rezervati chekkasida joylashgan, IV asrdan XIV asrgacha faol bo'lgan, qalin paxsali devorlari saqlangan go'zal qal'a.",
      kaa: "Tómen Ámiwdárya biosfera rezervatı shetinde jaylasqan, IV ásirden XIV ásirshe shekem qollanılǵan, qalıń paxsa diywalları saqlanǵan gózzal qala.",
      ru: "Живописная крепость IV–XIV веков с монументальными пахсовыми стенами на краю Нижне-Амударьинского биосферного резервата.",
      en: "Picturesque fortress dating from the 4th to 14th centuries with towering pakhsa mud walls on the edge of the Lower Amu Darya Biosphere Reserve."
    }
  },
  {
    num: 4,
    name: {
      uz: "Qizil-qal’a",
      kaa: "Qızıl-qala",
      ru: "Кызыл-кала",
      en: "Kyzyl-Kala"
    },
    dist: "beruniy",
    lat: 41.930028,
    lng: 60.784111,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "I–XII asrlarga tegishli, Toproq-qal'ani himoya qilish uchun qurilgan minoralari bilan yaqinda restavratsiya qilingan mustahkam qizil rangli qal'a.",
      kaa: "I–XII ásirlerge tiyisli, Topraq-qalanı qorǵaw ushın qurılǵan minarları menen jaqında qayta tiklengen qızıl reńli qala.",
      ru: "Отреставрированная крепость I–XII веков с характерными башнями из красной глины, служившая форпостом Топрак-калы.",
      en: "Restored red clay fortress dating from the 1st to 12th centuries with prominent bastions, built as a defense outpost for Toprak-Kala."
    }
  },
  {
    num: 5,
    name: {
      uz: "Toproq-qal’a",
      kaa: "Topraq-qala",
      ru: "Топрак-кала",
      en: "Toprak-Kala"
    },
    dist: "ellikqala",
    lat: 41.927139,
    lng: 60.822917,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qadimgi Xorazm hukmdorlarining II–III asrlardagi poytaxt saroyi va markazi. Jahonga mashhur saroy devoriy suratlari va arxeologik topilmalari bilan mashhur.",
      kaa: "Áyyemgi Xorezm húkimdarlarınıń II–III ásirlerdegi oraylıq sarayı. Dúnyaǵa ataqlı saray súwretleri hám arxeologiyalıq tabılmaları menen belgili.",
      ru: "Столичный дворцовый комплекс древних правителей Хорезма II–III веков н.э., известный монументальной архитектурой и настенными росписями.",
      en: "Royal palace city and ceremonial capital of ancient Khwarazm rulers (2nd–3rd centuries CE), famous for spectacular architectural layout and frescoes."
    }
  },
  {
    num: 6,
    name: {
      uz: "Akshaxon-qal’a",
      kaa: "Aqshaxan-qala",
      ru: "Акшахан-кала (Казаклы-яткан)",
      en: "Akshakhan-Kala"
    },
    dist: "beruniy",
    lat: 41.828889,
    lng: 60.716917,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Miloddan avvalgi III asr – milodiy II asrlarga oid qadimgi shahar-qal'a. Bu yerdan noyob qadimgi portretlar va devoriy suratlar xazinasi topilgan.",
      kaa: "Eramızǵa shekemgi III ásir – eramızdıń II ásirlerine tiyisli qala. Bul jerden biybaha áyyemgi portretler hám diywal súwretleri tabılǵan.",
      ru: "Крупное городище III в. до н.э. – II в. н.э., где обнаружены выдающиеся настенные росписи с портретами зороастрийских жрецов и правителей.",
      en: "Extensive citadel from the 3rd century BCE – 2nd century CE, site of remarkable ancient wall frescoes depicting royal portraits and mythological scenes."
    }
  },
  {
    num: 7,
    name: {
      uz: "Ayaz-qal’a I",
      kaa: "Ayaz-qala I",
      ru: "Аяз-кала I",
      en: "Ayaz-Kala I"
    },
    dist: "ellikqala",
    lat: 42.014186,
    lng: 61.028997,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qizilqum cho'li bo'yida baland tabiiy qoya ustida qad ko'targan, miloddan avvalgi IV–III asrlarga oid eng mahobatli va go'zal qal'a.",
      kaa: "Qızılqum shóli shetinde biyik tábiyiy tóbede ornalasqan, eramızǵa shekemgi IV–III ásirlerge tiyisli eń saltanatlı qala.",
      ru: "Грандиозная крепость IV–III вв. до н.э. на вершине изолированного плато на краю пустыни Кызылкум с панорамным обзором.",
      en: "Majestic fortress from the 4th–3rd centuries BCE perched on top of a dramatic desert plateau overlooking the Kyzylkum plains."
    }
  },
  {
    num: 8,
    name: {
      uz: "Ayaz-qal’a II",
      kaa: "Ayaz-qala II",
      ru: "Аяз-кала II",
      en: "Ayaz-Kala II"
    },
    dist: "ellikqala",
    lat: 42.010836,
    lng: 61.027175,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Ayaz-qal'a majmuasining o'rta asrlarga oid (VII–VIII asrlar) qismi, qoyali tepalik yonida qurilgan feodal hukmdor qasri.",
      kaa: "Ayaz-qala kompleksiniń orta ásirlerge (VII–VIII ásirler) tiyisli bólegi, feodal húkimdar sarayı.",
      ru: "Средневековый феодальный замок VII–VIII веков н.э., воздвигнутый у подножия холма большой крепости.",
      en: "Early medieval feudal castle (7th–8th centuries CE) erected beside the southern base of the main Ayaz-Kala hill."
    }
  },
  {
    num: 9,
    name: {
      uz: "Ayaz-qal’a III",
      kaa: "Ayaz-qala III",
      ru: "Аяз-кала III",
      en: "Ayaz-Kala III"
    },
    dist: "ellikqala",
    lat: 42.005500,
    lng: 61.030556,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Eramizning I–II asrlariga tegishli katta mudofaa istehkomi va turar-joy majmuasi, 40 ta xonali saroy qoldiqlari bilan.",
      kaa: "Eramızdıń I–II ásirlerine tiyisli úlken qorǵanıw imaratı hám 40 bólmeli saray qaldıqları bolǵan qala.",
      ru: "Укрепленное городище I–II вв. н.э. у подножия холма, включающее обширный двор и остатки 40-комнатного дворца.",
      en: "Fortified settlement from the 1st–2nd centuries CE at the foot of the hill, featuring a monumental multi-room palace courtyard."
    }
  },
  {
    num: 10,
    name: {
      uz: "Katta Qirq Qiz qal’a",
      kaa: "Úlken Qırq Qız qala",
      ru: "Большая Кырк-кыз кала",
      en: "Greater Kyrk-Kyz Kala"
    },
    dist: "ellikqala",
    lat: 42.007831,
    lng: 61.157581,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Miloddan avvalgi IV asr – milodiy VII asrlarga mansub, afsonaviy 40 nafar qahramon qiz nomi bilan bog'liq qadimiy mudofaa qal'asi.",
      kaa: "Eramızǵa shekemgi IV ásir – eramızdıń VII ásirlerine tiyisli, ańızdaǵı 40 batır qız atı menen baylanıslı áyyemgi qala.",
      ru: "Древняя крепость IV в. до н.э. – VII в. н.э., овеянная легендой о сорока девушках-воительницах, защищавших родину.",
      en: "Ancient fortress spanning from 4th century BCE to 7th century CE, linked to the heroic legend of forty warrior women defending the land."
    }
  },
  {
    num: 11,
    name: {
      uz: "Kichik Qirq Qiz qal’a",
      kaa: "Kishi Qırq Qız qala",
      ru: "Малая Кырк-кыз кала",
      en: "Lesser Kyrk-Kyz Kala"
    },
    dist: "ellikqala",
    lat: 42.018108,
    lng: 61.101056,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Katta Qirq Qiz qal'asi yaqinidagi antik mudofaa inshooti, arxeologik yodgorlik.",
      kaa: "Úlken Qırq Qız qalası qasındaǵı áyyemgi qorǵanıw qorǵanı.",
      ru: "Античное оборонительное укрепление, расположенное по соседству с Большой Кырк-кыз калой.",
      en: "Ancient fortified watchpoint and settlement located adjacent to Greater Kyrk-Kyz fortress."
    }
  },
  {
    num: 12,
    name: {
      uz: "Kurgashin-qal’a",
      kaa: "Qurǵasın-qala",
      ru: "Кургашин-кала",
      en: "Kurgashin-Kala"
    },
    dist: "ellikqala",
    lat: 42.034167,
    lng: 61.321778,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Miloddan avvalgi IV–III asrlarda Xorazmning shimoli-sharqiy chegaralarini qo'riqlash uchun bunyod etilgan strategik chegara qal'asi.",
      kaa: "Eramızǵa shekemgi IV–III ásirlerde Xorezmniń arqa-shıǵıs shegaraların qorǵaw ushın salınǵan shegara qalası.",
      ru: "Пограничная крепость IV–III веков до н.э., охранявшая северо-восточные рубежи древнего Хорезма.",
      en: "Strategic border fortress from the 4th–3rd centuries BCE constructed to guard the north-eastern frontiers of ancient Khwarazm."
    }
  },
  {
    num: 13,
    name: {
      uz: "Bozor-qal’a",
      kaa: "Bazar-qala",
      ru: "Базар-кала",
      en: "Bazar-Kala"
    },
    dist: "turtkol",
    lat: 41.823869,
    lng: 61.187269,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qadimgi savdo yo'llari tutashgan chorrahada joylashgan karvon va bozor shaharchasi qal'asi (miloddan avvalgi II asr – milodiy I asr).",
      kaa: "Áyyemgi sawda jolları kesilisken noqatta jaylasqan kárwan hám bazar qalası.",
      ru: "Городище и торговая крепость II в. до н.э. – I в. н.э. на оживленном перекрестке древних караванных путей.",
      en: "Trade hub fortress and caravan town dating from the 2nd century BCE to 1st century CE on Silk Road crossroads."
    }
  },
  {
    num: 14,
    name: {
      uz: "Jonbos-qal’a (Djanbas-kala)",
      kaa: "Janbas-qala",
      ru: "Джанбас-кала",
      en: "Djanbas-Kala"
    },
    dist: "turtkol",
    lat: 41.858219,
    lng: 61.303608,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Miloddan avvalgi IV asr – milodiy I asrlarga tegishli, ichida minoralarsiz ikki qator devorlar va qadimiy olov ibodatxonasi saqlangan noyob qal'a.",
      kaa: "Eramızǵa shekemgi IV ásir – eramızdıń I ásirine tiyisli, minarsız qos qabat diywalları hám ot ibadatxanası bolǵan qala.",
      ru: "Уникальная безбашенная крепость IV в. до н.э. – I в. н.э. с двойными стенами и святилищем огнепоклонников.",
      en: "Unique fortress without towers dating from the 4th century BCE to 1st century CE, preserving double curtain walls and a fire temple."
    }
  },
  {
    num: 15,
    name: {
      uz: "Qo‘yqirilgan-qal’a (Koi-Krilgan-kala)",
      kaa: "Qoyqırılǵan-qala",
      ru: "Кой-Крылган-кала",
      en: "Koi-Krylgan-Kala"
    },
    dist: "turtkol",
    lat: 41.755192,
    lng: 61.116969,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Miloddan avvalgi IV–III asrlarda barpo etilgan noyob doirasimon shakldagi qadimgi rasadxona va zardushtiylik maqbara-ibodatxonasi.",
      kaa: "Eramızǵa shekemgi IV–III ásirlerde qurılǵan tegis domalaq formasındaǵı áyyemgi observatoriya hám ibadatxana qala.",
      ru: "Уникальный круглый храмово-астрономический комплекс IV–III вв. до н.э., служивший обсерваторией и культовым центром.",
      en: "Unique circular monument (4th–3rd century BCE) that served as an ancient astronomical observatory and cult temple complex."
    }
  },
  {
    num: 16,
    name: {
      uz: "Angka-qal’a",
      kaa: "Anqa-qala",
      ru: "Ангка-кала",
      en: "Angka-Kala"
    },
    dist: "turtkol",
    lat: 41.758667,
    lng: 61.151167,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qo'yqirilgan-qal'a yonidagi antik mudofaa qo'rg'oni (eraning boshlari).",
      kaa: "Qoyqırılǵan-qala janındaǵı antik dáwir qorǵanı.",
      ru: "Античное оборонительное укрепление первых веков н.э. неподалеку от Кой-Крылган-калы.",
      en: "Ancient fortified outpost from the early centuries CE situated close to Koi-Krylgan-Kala."
    }
  },
  {
    num: 17,
    name: {
      uz: "Eres-qal’a",
      kaa: "Eres-qala",
      ru: "Эрес-кала",
      en: "Eres-Kala"
    },
    dist: "turtkol",
    lat: 41.667331,
    lng: 61.091889,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "To'rtko'l vohasidagi antik davr mudofaa manzilgohi, arxeologik yodgorlik.",
      kaa: "Tórtkúl oazisinde jaylasqan antik dáwir qorǵanı.",
      ru: "Античное укрепленное поселение в низовьях Турткульского оазиса.",
      en: "Antiquity-era fortified settlement located in the Turtkul oasis."
    }
  },
  {
    num: 18,
    name: {
      uz: "Katta Guldursun",
      kaa: "Úlken Gúldirsin",
      ru: "Большой Гулдурсун",
      en: "Greater Guldursun"
    },
    dist: "ellikqala",
    lat: 41.693214,
    lng: 60.981156,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Xorazmning eng yirik qal'alaridan biri (XII–XIII asrlar), Guldursun malika afsonasi bilan mashhur bo'lgan mudofaa devorlari.",
      kaa: "Xorezmniń eń iri qalalarınıń biri (XII–XIII ásirler), Gúldirsin xanzada ańızı menen ataq shıqqan úlken qorǵan.",
      ru: "Одна из крупнейших крепостей средневекового Хорезма XII–XIII вв. с мощнейшими стенами, связанная с поэтичной легендой о царевне Гульдурсун.",
      en: "One of the largest medieval fortresses of Khwarazm (12th–13th centuries) known for imposing walls and the tragic legend of princess Guldursun."
    }
  },
  {
    num: 19,
    name: {
      uz: "Pil-qal’a",
      kaa: "Pil-qala",
      ru: "Пил-кала",
      en: "Pil-Kala"
    },
    dist: "beruniy",
    lat: 41.705000,
    lng: 60.748611,
    cat: "historical",
    unesco: "Madaniy meros",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Beruniy tumanidagi qadimiy paxsa istehkom, antik va ilk o'rta asrlarda Amudaryo bo'yidagi mudofaa tarmog'i tarkibiy qismi.",
      kaa: "Beruniy rayonındaǵı áyyemgi paxsa qorǵan, antik hám erte orta ásirlerdegi qorǵanıw noqatı.",
      ru: "Древняя глинобитная крепость в Берунийском районе, форпост на торговом речном пути Амударьи.",
      en: "Ancient mud-brick stronghold in Beruniy district, part of the riverine defense network along the Amu Darya."
    }
  },
  {
    num: 20,
    name: {
      uz: "Mizdaxkan majmuasi",
      kaa: "Mizdaxqan kompleksi",
      ru: "Комплекс Миздахкан",
      en: "Mizdakhkan Complex"
    },
    dist: "xojayli",
    lat: 42.401167,
    lng: 59.389333,
    cat: "pilgrimage",
    unesco: "Tarixiy nekropol",
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "2400 yillik tarixga ega ulkan tarixiy-arxeologik va ziyorat majmuasi, O'rta Osiyodagi eng qadimiy va muqaddas nekropollardan biri.",
      kaa: "2400 jıllıq tariyxqa iye úlken tariyxıy-arxeologiyalıq hám zıyarat kompleksi, Orta Aziyadaǵı eń áyyemgi nekropol.",
      ru: "Грандиозный историко-археологический некрополь с более чем 2400-летней историей, один из древнейших сакральных центров Центральной Азии.",
      en: "Monumental historic-archaeological complex and sacred necropolis spanning over 2,400 years of continuous cultural heritage."
    }
  },
  {
    num: 21,
    name: {
      uz: "Mazlumxon Sulu maqbarasi",
      kaa: "Mazlumxan Sulıw maqbarası",
      ru: "Мавзолей Мазлумхан-сулу",
      en: "Mazlumkhan Sulu Mausoleum"
    },
    dist: "xojayli",
    lat: 42.402669,
    lng: 59.388194,
    cat: "pilgrimage",
    unesco: "Oltin O'rda me'morchiligi",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Mizdaxkandagi XIII–XIV asrlarga oid yerosti me'moriy durdonasi. Moviy koshinlar bilan bezatilgan gumbazli nozik maqbara.",
      kaa: "Mizdaxqandaǵı XIII–XIV ásirlerge tiyisli jer astı arxitekturalıq dáslepki gáwharı. Kók naǵıslar menen bezetilgen gúmbezli maqbara.",
      ru: "Подземный шедевр зодчества XIII–XIV веков в некрополе Миздахкан, облицованный утонченной голубой глазурованной майоликой.",
      en: "Underground architectural gem of the 13th–14th centuries in Mizdakhkan, decorated with exquisite turquoise and dark-blue glazed tiles."
    }
  },
  {
    num: 22,
    name: {
      uz: "Beleuli karvonsaroyi",
      kaa: "Beliwli kárwansarayı",
      ru: "Караван-сарай Белеули",
      en: "Beleuli Caravanserai"
    },
    dist: "qungirot",
    lat: 44.503900,
    lng: 57.115600,
    cat: "historical",
    unesco: "Ipak Yo'li merosi",
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Ustyurt platosidagi Oltin O'rda davriga (XIV asr) oid tosh karvonsaroy. Qadimiy xalqaro savdo yo'lining eng shimoliy bekatlaridan biri.",
      kaa: "Ústirt platosındaǵı Altın Orda dáwirine (XIV ásir) tiyisli tas kárwansaray. Áyyemgi kárwan jolınıń arqa beketlerinen biri.",
      ru: "Каменный караван-сарай эпохи Золотой Орды (XIV в.) на плато Устюрт на древнем торговом пути между Поволжьем и Хорезмом.",
      en: "Stone caravanserai from the Golden Horde period (14th century) situated on the Ustyurt plateau on the historic Volga-Khwarazm trade route."
    }
  },
  {
    num: 23,
    name: {
      uz: "Kurgancha (Davletgirey)",
      kaa: "Qorǵansha (Dáwletgirey)",
      ru: "Курганча (Давлетгирей)",
      en: "Kurgancha (Davletgirey)"
    },
    dist: "qungirot",
    lat: 44.500000,
    lng: 58.166700,
    cat: "historical",
    unesco: "Ustyurt qal'asi",
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Ustyurt platosining sharqiy qismida joylashgan qadimiy tosh qal'a va mustahkam manzilgoh. Ekspeditsion 4x4 marshrut orqali yetib boriladi.",
      kaa: "Ústirt platosınıń shıǵıs bóleginde jaylasqan áyyemgi tas qala. Ekspediciyalıq 4x4 jónelisi arqalı barıladı.",
      ru: "Укрепленное каменное городище на плато Устюрт, доступное в рамках внедорожных экспедиций 4х4.",
      en: "Ancient stone-built stronghold on the Ustyurt plateau, accessible primarily via dedicated 4x4 expedition routes."
    }
  },
  {
    num: 24,
    name: {
      uz: "Norinjon Bobo",
      kaa: "Narınjan Baba",
      ru: "Наринджан-бобо",
      en: "Narinjan Bobo"
    },
    dist: "ellikqala",
    lat: 41.753743,
    lng: 60.983448,
    cat: "pilgrimage",
    unesco: "Ziyoratgoh",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Ellikqal'a tumanidagi qadimiy ziyoratgoh va avliyo qabri, mahalliy ziyorat turizmining ehtirom qilinadigan maskanlaridan biri.",
      kaa: "Ellikqala rayonındaǵı áyyemgi zıyaratgáh hám áwliye qábiri.",
      ru: "Почитаемое святое место и мавзолей шейха в Элликкалинском районе, центр локального паломничества.",
      en: "Venerated holy shrine and saint's tomb in Ellikkala district, a prominent site for regional spiritual pilgrimage."
    }
  },
  {
    num: 25,
    name: {
      uz: "Sulton Uvays Bobo",
      kaa: "Sultan Wáyiys Baba",
      ru: "Султан Увайс-бобо",
      en: "Sultan Uvays Bobo"
    },
    dist: "beruniy",
    lat: 42.010922,
    lng: 60.645334,
    cat: "pilgrimage",
    unesco: "Muqaddas qadamjo",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Sulton Uvays tog'larida joylashgan, butun Markaziy Osiyodan ziyoratchilar tashrif buyuradigan eng muqaddas ziyoratgoh majmuasi va muqaddas baliqli hovuz.",
      kaa: "Sultan Wáyiys tawlarında jaylasqan, pútkil Orta Aziyadan zıyaratshılar keletuǵın eń muqaddes qádemjay hám muqaddas balıqlı kól.",
      ru: "Один из наиболее почитаемых суфийских святых комплексов Центральной Азии со священным родником и священными рыбами.",
      en: "One of Central Asia's most revered Sufi pilgrimage sites located in Sultan Uvays mountains, featuring a sacred spring and holy fish pond."
    }
  },
  {
    num: 26,
    name: {
      uz: "Berkut-qal’a",
      kaa: "Búrkis-qala",
      ru: "Беркут-кала",
      en: "Berkut-Kala"
    },
    dist: "ellikqala",
    lat: 41.787917,
    lng: 61.055056,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Milodiy V–VIII asrlarga oid, Berkut-qal'a vohasining markazi bo'lgan mahobatli feodal qasr va istehkom.",
      kaa: "Eramızdıń V–VIII ásirlerine tiyisli, Búrkis-qala oazisiniń orayı bolǵan saltanatlı feodal qasır.",
      ru: "Раннесредневековый феодальный замок V–VIII веков н.э., служивший центром развитого оазиса Беркут-кала.",
      en: "Early medieval feudal fortress-castle (5th–8th centuries CE) that formed the hub of the Berkut-Kala oasis settlement network."
    }
  },
  {
    num: 27,
    name: {
      uz: "Puljay",
      kaa: "Púljay",
      ru: "Пульджай",
      en: "Puljay"
    },
    dist: "qungirot",
    lat: 43.177192,
    lng: 58.367806,
    cat: "historical",
    unesco: "UNESCO Tentative (2025)",
    type: "exact",
    approximate: false,
    fourByFour: true,
    desc: {
      uz: "Qo'ng'irot hududidagi UNESCO Tentative ro'yxatiga kiritilgan antik va ilk o'rta asrlarga mansub arxeologik yodgorlik.",
      kaa: "Qońırat aymaǵındaǵı YUNESKO dizimine kirgizilgen antik dáwir arxeologiyalıq esteligi.",
      ru: "Археологический памятник античного периода в Кунградском районе, входящий в Предварительный список ЮНЕСКО.",
      en: "Antiquity archaeological monument in Kungrad district, listed on the UNESCO World Heritage Tentative List."
    }
  },

  // 28-37 Ziyoratgohlar va diniy-madaniy obyektlar (Top 10 saralangan)
  {
    num: 28,
    name: {
      uz: "Imam Iyshan",
      kaa: "Imam Iyshan",
      ru: "Имам Ийшан",
      en: "Imam Iyshan"
    },
    dist: "nukus-district",
    lat: 42.638425,
    lng: 59.320294,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Nukus tumanidagi mashhur ma'rifatparvar ruhoniy va avliyo qadami bilan bog'liq ziyoratgoh.",
      kaa: "Nókis rayonındaǵı belgili ma'ripatparwar hám áwliye qádemi menen baylanıslı zıyaratgáh.",
      ru: "Известное место паломничества в Нукусском районе, связанное с именем выдающегося религиозного просветителя.",
      en: "Well-known pilgrimage shrine in Nukus district dedicated to an esteemed Islamic scholar and spiritual teacher."
    }
  },
  {
    num: 29,
    name: {
      uz: "Shorsha Baba qabristoni",
      kaa: "Shorasha Baba qoyımshılıǵı",
      ru: "Кладбище Шорша-баба",
      en: "Shorsha Baba Cemetery"
    },
    dist: "nukus-city",
    lat: 42.494598,
    lng: 59.609568,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Nukus shahri atrofidagi tarixiy qabriston va ziyoratgoh maskani.",
      kaa: "Nókis qalası átirapındaǵı tariyxıy qoyımshılıq hám zıyarat orını.",
      ru: "Историческое кладбище и место поминовения на окраине города Нукус.",
      en: "Historic memorial grounds and spiritual site located on the outskirts of Nukus."
    }
  },
  {
    num: 30,
    name: {
      uz: "Qusxana qabristoni",
      kaa: "Qusxana qoyımshılıǵı",
      ru: "Кладбище Кусхана",
      en: "Qusxana Cemetery"
    },
    dist: "nukus-city",
    lat: 42.362973,
    lng: 59.626968,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Nukus janubidagi qadimiy ziyoratgoh va qabriston hududi.",
      kaa: "Nókis qublasındaǵı áyyemgi zıyaratgáh hám qoyımshılıq aymaǵı.",
      ru: "Старинное мемориальное место паломничества к югу от Нукуса.",
      en: "Historical spiritual memorial site located south of Nukus city."
    }
  },
  {
    num: 31,
    name: {
      uz: "Sulton Valiy Ota",
      kaa: "Sultan Wáliy Ata",
      ru: "Султан Вали Ота",
      en: "Sulton Valiy Ota"
    },
    dist: "beruniy",
    lat: 42.010922,
    lng: 60.645334,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Sulton Uvays tizmasidagi mashhur qadamjolardan biri bo'lib, ehtirom qilinadigan ma'naviy manzil.",
      kaa: "Sultan Wáyiys dizbegindegi eń kóp zıyarat etiletuǵın ruwxıy orınlardıń biri.",
      ru: "Святое паломническое место в горном массиве Султануиздаг.",
      en: "Venerated holy destination situated in the Sultan Uvays mountains."
    }
  },
  {
    num: 32,
    name: {
      uz: "Shayx Abbos Valiy",
      kaa: "Shayx Abbos Wáliy",
      ru: "Шейх Аббас Вали",
      en: "Shaykh Abbas Valiy"
    },
    dist: "beruniy",
    lat: 42.012168,
    lng: 60.642818,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Beruniy tumanidagi Sulton Uvays majmuasi yaqinida joylashgan hurmatli tasavvuf shayxi ziyoratgohi.",
      kaa: "Beruniy rayonında Sultan Wáyiys kompleksi janındaǵı húrmetli tasawwuf shayxı zıyaratgáhı.",
      ru: "Суфийская святыня и гробница шейха Аббаса Вали неподалеку от комплекса Султан Увайс.",
      en: "Sufi shrine and mausoleum of Shaykh Abbas Valiy located adjacent to Sultan Uvays complex."
    }
  },
  {
    num: 33,
    name: {
      uz: "Kechirmas Bobo",
      kaa: "Keshirmes Baba",
      ru: "Кечирмас-бобо",
      en: "Kechirmas Bobo"
    },
    dist: "ellikqala",
    lat: 41.718005,
    lng: 60.994346,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Ellikqal'a tumanidagi xalq orasida alohida ixlos bilan ziyorat qilinadigan muqaddas qadamjo.",
      kaa: "Ellikqala rayonındaǵı xalıq arasında arnawlı ıqlas penen zıyarat etiletuǵın muqaddes qádemjay.",
      ru: "Святое место в Элликкалинском районе, пользующееся большим почтением паломников.",
      en: "Venerated sacred place in Ellikkala district frequented by pilgrims seeking spiritual solace."
    }
  },
  {
    num: 34,
    name: {
      uz: "Shamun Nabi",
      kaa: "Shamun Nabiy",
      ru: "Шамун Наби",
      en: "Shamun Nabi"
    },
    dist: "xojayli",
    lat: 42.401576,
    lng: 59.388835,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Mizdaxkan majmuasida joylashgan, yetti gumbazli noyob maqbara va afsonaviy avliyo qadami.",
      kaa: "Mizdaxqan kompleksinde jaylasqan, jeti gúmbezli biytakrar maqbara.",
      ru: "Уникальный семикупольный мавзолей в некрополе Миздахкан, посвященный праведнику Шамун-наби.",
      en: "Unique seven-domed mausoleum in Mizdakhkan dedicated to the legendary Islamic saint Shamun Nabi."
    }
  },
  {
    num: 35,
    name: {
      uz: "Shayx Jalil Bobo",
      kaa: "Shayx Jalil Baba",
      ru: "Шейх Джалил-бобо",
      en: "Shaykh Jalil Bobo"
    },
    dist: "qoraozak",
    lat: 42.159566,
    lng: 60.249484,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qorao'zak tumanida joylashgan, boy ma'naviy tarixga ega ziyoratgoh va avliyo maskani.",
      kaa: "Qaraózek rayonında jaylasqan, bay ruwxıy tariyxqa iye zıyaratgáh.",
      ru: "Святое место и мазар суфийского наставника Шейха Джалила в Караузякском районе.",
      en: "Historic Sufi pilgrimage shrine dedicated to Shaykh Jalil in Karaozyak district."
    }
  },
  {
    num: 36,
    name: {
      uz: "Eshim Axun",
      kaa: "Eshim Axun",
      ru: "Эшим Ахун",
      en: "Eshim Akhun"
    },
    dist: "kanlikol",
    lat: 42.859587,
    lng: 58.905592,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qanliko'l tumanidagi mashhur ma'rifatparvar ulamo va diniy alloma Eshim Axun maqbarasi.",
      kaa: "Qanlıkól rayonındaǵı belgili ma'ripatparwar ulamo Eshim Axun maqbarası.",
      ru: "Мавзолей почитаемого религиозного мыслителя и просветителя Эшим Ахуна в Канлыкульском районе.",
      en: "Mausoleum of respected Islamic scholar and teacher Eshim Akhun in Kanlykul district."
    }
  },
  {
    num: 37,
    name: {
      uz: "Yusuf Eshon Bobo masjidi",
      kaa: "Yusuf Iyshan Baba meshiti",
      ru: "Мечеть Юсуф Эшон-бобо",
      en: "Yusuf Eshon Bobo Mosque"
    },
    dist: "amudaryo",
    lat: 42.113009,
    lng: 60.058938,
    cat: "pilgrimage",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Amudaryo tumanidagi tarixiy masjid va ziyoratgoh markazi.",
      kaa: "Ámiwdárya rayonındaǵı tariyxıy meshit hám zıyarat orayı.",
      ru: "Историческая мечеть и почитаемый духовный центр в Амударьинском районе.",
      en: "Historical mosque and spiritual pilgrimage site situated in Amu Darya district."
    }
  },

  // 38-53 Tabiat, ekologiya va landshaftlar (16 ta obyekt)
  {
    num: 38,
    name: {
      uz: "Orol dengizi (G'arbiy qirg'oq)",
      kaa: "Aral teńizi (Batıs jaǵası)",
      ru: "Аральское море (Западный берег)",
      en: "Aral Sea (Western Coast)"
    },
    dist: "muynak",
    lat: 44.850000,
    lng: 58.900000,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Orol dengizining saqlanib qolgan g'arbiy suv havzasi qirg'og'i, baland Ustyurt qoyalari va o'tov lagerlari joylashgan hayratlanarli tabiiy maskan.",
      kaa: "Aral teńiziniń saqlanıp qalǵan batıs suw háwizi jaǵası, biyik Ústirt qıyaları hám kiyiz úy lagerleri ornalasqan tábiyiy orın.",
      ru: "Сохранившаяся западная акватория Аральского моря у подножия чинков плато Устюрт с юрточными лагерями.",
      en: "Remaining western basin of the Aral Sea set below towering Ustyurt cliffs with experiential yurt camps."
    }
  },
  {
    num: 39,
    name: {
      uz: "Aralkum milliy tabiat bog‘i",
      kaa: "Aralkum milliy tábiyat baǵı",
      ru: "Национальный природный парк Аралкум",
      en: "Aralkum National Nature Park"
    },
    dist: "muynak",
    lat: 43.850000,
    lng: 59.500000,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Orol dengizining qurigan tubida vujudga kelgan yangi qumli cho'l ekotizimi va saksovulzorlar bilan o'ralgan milliy tabiat bog'i.",
      kaa: "Aral teńiziniń qurıǵan túbinde payda bolǵan jańa shól ekosisteması hám saksewiller menen qorshalǵan milliy tábiyat baǵı.",
      ru: "Новейшая песчано-солончаковая пустыня Аралкум на бывшем дне моря, охраняемая природная зона с саксауловыми насаждениями.",
      en: "Newly emerged desert ecosystem on the desiccated bed of the Aral Sea, legally protected national park."
    }
  },
  {
    num: 40,
    name: {
      uz: "Mo‘ynoq kema qabristoni",
      kaa: "Moynaq keme qoyımshılıǵı",
      ru: "Кладбище кораблей в Муйнаке",
      en: "Muynak Ship Cemetery"
    },
    dist: "muynak",
    lat: 43.790139,
    lng: 59.033972,
    cat: "cultural",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Ilgari port bo'lgan qumloq maydonda qolib ketgan baliqchi kemalari qoldiqlari — global ekologik fojea va Orol dengizi tarixining ochiq osmon ostidagi ramzi.",
      kaa: "Burın port bolǵan qumda qalǵan keme qaldıqları — global ekologiyalıq waqıya hám Aral teńizi tariyxınıń ashıq aspan astındaǵı belgisi.",
      ru: "Знаменитый мемориал на бывшем дне гавани Муйнака с ржавеющими остовами рыболовецких судов — всемирный символ Аральской трагедии.",
      en: "World-famous outdoor monument of stranded fishing vessels resting on the sandy former seabed of Muynak harbor."
    }
  },
  {
    num: 41,
    name: {
      uz: "Ustyurt platosi (Ekspeditsiya markazi)",
      kaa: "Ústirt platosı (Ekspediciya orayı)",
      ru: "Плато Устюрт (Экспедиционный центр)",
      en: "Ustyurt Plateau (Expedition Center)"
    },
    dist: "qungirot",
    lat: 44.000000,
    lng: 57.500000,
    cat: "nature",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Millionlab yillar avvalgi qadimiy Tetis okeani tubi bo'lgan, sirli yoriqlar va yovvoyi tabiatga ega cheksiz ohaktoshli plato.",
      kaa: "Millionlap jıllar aldınǵı Tetis okeanı túbi bolǵan, sırlı jaraqlar hám jabayı tábiyatqa iye sheksiz plato.",
      ru: "Бескрайнее известняковое плато, бывшее дно древнего океана Тетис, с первозданными пустынными ландшафтами.",
      en: "Vast limestone plateau forming the bed of the prehistoric Tethys ocean, an iconic destination for remote off-road expeditions."
    }
  },
  {
    num: 42,
    name: {
      uz: "Ustyurt chinklari va kanyonlari",
      kaa: "Ústirt shıńları hám kanyonları",
      ru: "Чинки и каньоны Устюрта",
      en: "Ustyurt Chinks and Canyons"
    },
    dist: "muynak",
    lat: 45.300476,
    lng: 58.398560,
    cat: "nature",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Balandligi yuzlab metrga yetadigan ohaktosh va gips qatlamlaridan iborat hayratlanarli tik qoyalar, kanyonlar va rang-barang geologik tuzilmalar.",
      kaa: "Biyikligi júzlep metrge jetetuǵın qıyalar, kanyonlar hám reńbe-reń geologiyalıq dúzilisler.",
      ru: "Фантастические обрывистые уступы (чинки) высотой до 200–300 метров с разноцветными слоями осадочных пород и глубокими каньонами.",
      en: "Breathtaking vertical limestone precipices and dramatic chasms rising up to hundreds of meters above desert depressions."
    }
  },
  {
    num: 43,
    name: {
      uz: "Aktumsik burni",
      kaa: "Aqtumsıq burnı",
      ru: "Мыс Актумсык",
      en: "Cape Aktumsyk"
    },
    dist: "muynak",
    lat: 45.101840,
    lng: 58.328940,
    cat: "nature",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Ustyurt platosining Orol dengizi tomon turtib chiqqan eng baland va hayratlanarli burunlaridan biri, mashhur foto-nuqta.",
      kaa: "Ústirt platosınıń Aral teńizine qaray shıǵıp turǵan eń biyik hám gózzal burnı.",
      ru: "Живописный мыс на чинке Устюрта, вдающийся в сторону Аральского моря, открывающий головокружительный панорамный вид.",
      en: "Dramatic promontory jutting from the Ustyurt plateau towards the Aral Sea, offering awe-inspiring panoramas."
    }
  },
  {
    num: 44,
    name: {
      uz: "Barsakelmes sho‘rxogi",
      kaa: "Barsakelmes duzlańı",
      ru: "Солончак Барсакельмес",
      en: "Barsakelmes Salt Flat"
    },
    dist: "qungirot",
    lat: 43.250000,
    lng: 57.666667,
    cat: "nature",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "O'zbekistondagi eng yirik oppoq tuz qoplami — quyosh nurlarida ko'z qamashtiradigan, cheksiz oppoq sahro manzarasi.",
      kaa: "Ózbekstandaǵı eń úlken appaq duz qaplamı — kún nurında kóz qamastıratuǵın sheksiz duzlı dalalıq.",
      ru: "Огромная ослепительно белая соляная пустыня на плато Устюрт — один из крупнейших солончаков мира.",
      en: "Colossal blindingly white salt pan on the Ustyurt plateau creating an otherworldly lunar landscape."
    }
  },
  {
    num: 45,
    name: {
      uz: "Sudochye ko‘llar tizimi",
      kaa: "Sudoche kól sisteması",
      ru: "Озерная система Судочье",
      en: "Sudochye Lakes System"
    },
    dist: "muynak",
    lat: 43.482800,
    lng: 58.520300,
    cat: "ecological",
    unesco: "Xalqaro ahamiyatga ega ornitologik hudud",
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Yuzlab turdagi ko'chib yuruvchi qushlar, pushti flamingolar va baliqlar maskani bo'lgan yirik tabiiy ko'llar tarmog'i va sobiq Urga qishlog'i.",
      kaa: "Júzlep túrdegi quslar, qızıl gajır (flamingo) hám balıqlar mákanı bolǵan úlken tábiyiy kól hám tariyxıy Urga awılı.",
      ru: "Уникальный озерный оазис и Рамсарское водно-болотное угодье, где гнездятся фламинго и пеликаны, у заброшенного поселка Урга.",
      en: "Important wetland lake network and bird haven hosting pink flamingos and pelicans, near the abandoned fishing hamlet of Urga."
    }
  },
  {
    num: 46,
    name: {
      uz: "Sudochye-Akpetki davlat buyurtmaxonasi",
      kaa: "Sudoche-Aqpetki mámleketlik buyırtpaxanası",
      ru: "Заказник Судочье-Акпетки",
      en: "Sudochye-Akpetki Nature Sanctuary"
    },
    dist: "muynak",
    lat: 43.489794,
    lng: 58.688965,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Sudochye ko'llari va Akpetki arxipelagi atrofidagi biologik xilma-xillikni saqlashga qaratilgan davlat tabiat qo'riqxonasi.",
      kaa: "Sudoche kólleri hám Aqpetki arxipelagı átirapındaǵı biologiyalıq baylıqtı qorǵawǵa arnalǵan mámleketlik qorıqxana.",
      ru: "Особо охраняемая природная территория для защиты уникальной фауны водоплавающих птиц Приаралья.",
      en: "State natural sanctuary dedicated to preserving waterbirds and vulnerable wetlands of the Aral region."
    }
  },
  {
    num: 47,
    name: {
      uz: "Jiltirbas (Zhyltyrbas) ko‘li",
      kaa: "Jıltırbas kóli",
      ru: "Озеро Жылтырбас",
      en: "Zhyltyrbas Lake"
    },
    dist: "muynak",
    lat: 43.546514,
    lng: 59.807002,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Orolbo'yi hududida tiklangan suv havzalaridan biri, noyob o'simlik va hayvonot olamiga ega tabiat maskani.",
      kaa: "Aralboyı aymaǵında qayta tiklengen suw háwizlerinen biri, tábiyiy kól.",
      ru: "Восстановленный водоем в восточной части Приаралья, важная экосистема для местной ихтиофауны и пернатых.",
      en: "Restored wetland lake ecosystem in the eastern Aral zone supporting local fish and bird biodiversity."
    }
  },
  {
    num: 48,
    name: {
      uz: "Quyi Amudaryo davlat biosfera rezervati",
      kaa: "Tómen Ámiwdárya mámleketlik biosfera rezervatı",
      ru: "Нижне-Амударьинский биосферный резерват",
      en: "Lower Amu Darya Biosphere Reserve"
    },
    dist: "beruniy",
    lat: 42.080000,
    lng: 60.254700,
    cat: "ecological",
    unesco: "UNESCO Biosphere Reserve (2021)",
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "UNESCO Butunjahon biosfera rezervatlari tarmog'iga kiritilgan, noyob to'qay o'rmonlari va Buxoro bug'ulari saqlanadigan xalqaro qo'riqxona.",
      kaa: "YUNESKO dúnyalıq biosfera rezervatları dizimine kirgizilgen, toǵayzarlıqlar hám Buxara buǵıları qorǵalatuǵın xalıqaralıq qorıqxana.",
      ru: "Включен во Всемирную сеть биосферных резерватов ЮНЕСКО (2021). Охраняет тугайные реликтовые леса и бухарского оленя хангула.",
      en: "Inscribed on UNESCO World Network of Biosphere Reserves in 2021, protecting pristine tugay riparian forests and endangered Bukhara deer."
    }
  },
  {
    num: 49,
    name: {
      uz: "Saigachiy qo‘riqlanadigan landshafti",
      kaa: "Saygachiy qorǵalatuǵın landshaftı",
      ru: "Охраняемый ландшафт Сайгачий",
      en: "Saigachiy Protected Landscape"
    },
    dist: "qungirot",
    lat: 45.150556,
    lng: 57.729167,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Yo'qolib borayotgan qadimiy sayg'oq antilopalari va Ustyurt cho'l landshaftini himoya qilish uchun tashkil etilgan keng hududli kompleks qo'riqxona.",
      kaa: "Joǵalıp baratırǵan áyyemgi aqkúlik (sayǵaq) kiyiklerin hám Ústirt shólin qorǵaw ushın dúzilgen qorıqxana.",
      ru: "Комплексный заказник на плато Устюрт для защиты популяции сайгаков и уязвимых пустынных экосистем.",
      en: "Extensive wildlife preserve on the Ustyurt plateau established to safeguard the endangered saiga antelope and arid ecosystems."
    }
  },
  {
    num: 50,
    name: {
      uz: "Janubiy Ustyurt milliy tabiat bog‘i",
      kaa: "Qubla Ústirt milliy tábiyat baǵı",
      ru: "Южно-Устюртский национальный природный парк",
      en: "South Ustyurt National Nature Park"
    },
    dist: "qungirot",
    lat: 42.081389,
    lng: 56.664722,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: true,
    desc: {
      uz: "Qoraqalpog'istonning g'arbiy chegarasida joylashgan, Ustyurt cho'li florasi va faunasini himoya qiluvchi ulkan milliy tabiat bog'i.",
      kaa: "Qaraqalpaqstannıń batıs shegarasında jaylasqan, Ústirt tábiyatın qorǵawshı milliy tábiyat baǵı.",
      ru: "Крупный национальный парк на юго-западной окраине плато Устюрт, сохраняющий первозданную дикую природу.",
      en: "Large national nature park on the southwestern edge of the Ustyurt plateau preserving pristine wilderness."
    }
  },
  {
    num: 51,
    name: {
      uz: "Qizilqum cho‘li (Qoraqalpog'iston qismi)",
      kaa: "Qızılqum shóli (Qaraqalpaqstan bólegi)",
      ru: "Пустыня Кызылкум (Каракалпакстан)",
      en: "Kyzylkum Desert (Karakalpakstan)"
    },
    dist: "ellikqala",
    lat: 41.950000,
    lng: 61.400000,
    cat: "nature",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Qizil qum barxanlari, tuya minish sayohatlari va ochiq osmon ostidagi yulduzli tunlar bilan mashhur ulkan qumli sahro.",
      kaa: "Qızıl qum tóbeleri, túye minip sayaxat etiw hám ashıq aspan astındaǵı juldızlı túnler menen ataqlı shól.",
      ru: "Красные песчаные дюны, сафари на верблюдах и неповторимые звездные ночи в бескрайней пустыне Кызылкум.",
      en: "Vast expanse of red sand dunes offering camel trekking adventures and unforgettable starry desert nights."
    }
  },
  {
    num: 52,
    name: {
      uz: "Amudaryo deltasi",
      kaa: "Ámiwdárya deltası",
      ru: "Дельта реки Амударья",
      en: "Amu Darya Delta"
    },
    dist: "muynak",
    lat: 43.200000,
    lng: 59.200000,
    cat: "ecological",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Amudaryoning quyi oqimidagi kanallar, qamishzorlar va botqoqliklardan iborat noyob suvli-botqoqli ekologik tizim.",
      kaa: "Ámiwdáryanıń tómen aǵımındaǵı kanallar, qamıszarlıqlar hám qolaylı tábiyiy suwlı orınlar.",
      ru: "Биологически богатая дельтовая система речных протоков, тростниковых зарослей и проточных озер.",
      en: "Biologically rich delta wetlands, reed beds, and channels formed at the lower reaches of the Amu Darya river."
    }
  },
  {
    num: 53,
    name: {
      uz: "Ayazko‘l",
      kaa: "Ayazkól",
      ru: "Озеро Аязколь",
      en: "Ayazkol Lake"
    },
    dist: "ellikqala",
    lat: 42.056800,
    lng: 61.066780,
    cat: "nature",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Ayaz-qal'a qal'alari yaqinidagi sokin tabiiy ko'l, qushlarni kuzatish va ko'l bo'yida dam olish maskani.",
      kaa: "Ayaz-qala qasındaǵı tábiyiy tınısh kól, quslardı tamasha etiw hám dem alıw ornı.",
      ru: "Живописное озеро у подножия крепостей Аяз-кала, идеальное место для бердвотчинга и отдыха на природе.",
      en: "Serene natural desert lake located near Ayaz-Kala fortresses, popular for birdwatching and tranquil relaxation."
    }
  },

  // 54-61 Muzeylar va madaniy nuqtalar (8 ta obyekt)
  {
    num: 54,
    name: {
      uz: "I.V. Savitskiy nomidagi Qoraqalpog‘iston davlat san’at muzeyi",
      kaa: "I.V. Savickiy atındaǵı Qaraqalpaqstan mámleketlik kórkem-óner muzeyi",
      ru: "Государственный музей искусств им. И.В. Савицкого",
      en: "State Museum of Arts named after I.V. Savitsky"
    },
    dist: "nukus-city",
    lat: 42.465450,
    lng: 59.613010,
    cat: "museums",
    unesco: "Jahonga mashhur 'Sahrodagi Luvr'",
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "'Sahrodagi Luvr' deb nom olgan, dunyodagi ikkinchi yirik rus avangard san'ati to'plami va boy qoraqalpoq amaliy san'at xazinasi saqlanadigan jahon darajasidagi muzey.",
      kaa: "'Shóldegi Luvr' dep atalǵan, dúnyadaǵı ekinshi orında turatuǵın rus avangard toparı hám bay qaraqalpaq kórkem-óneri muzeyi.",
      ru: "Знаменитый «Лувр в пустыне», обладающий второй по величине в мире коллекцией русского авангарда и богатейшим собранием каракалпакского этнографического искусства.",
      en: "Internationally renowned as the 'Louvre in the Desert', home to the world's second-largest collection of Russian avant-garde art and priceless Karakalpak ethnography."
    }
  },
  {
    num: 55,
    name: {
      uz: "Qoraqalpog‘iston Respublikasi tarixi va madaniyati davlat muzeyi",
      kaa: "Qaraqalpaqstan Respublikası tariyxı hám mádeniyatı mámleketlik muzeyi",
      ru: "Государственный музей истории и культуры Республики Каракалпакстан",
      en: "State Museum of History and Culture of Karakalpakstan"
    },
    dist: "nukus-city",
    lat: 42.462270,
    lng: 59.611130,
    cat: "museums",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Markaziy Osiyodagi eng qadimgi muzeylardan biri bo'lib, o'lkashunoslik, arxeologiya va tabiatga oid o'n minglab eksponatlarni qamrab oladi.",
      kaa: "Orta Aziyadaǵı eń áyyemgi muzeylerdiń biri, arxeologiya, tariyx hám tábiyatqa tiyisli on mıńlaǵan eksponatlar orayı.",
      ru: "Один из старейших краеведческих музеев региона с богатейшей археологической, исторической и естественнонаучной экспозицией.",
      en: "One of the oldest museums in Central Asia showcasing extensive archaeological finds, ethnographic treasures, and regional natural history."
    }
  },
  {
    num: 56,
    name: {
      uz: "Shamuratovlar oilasi uy-muzeyi",
      kaa: "Shamuratovlar shańaraǵı úy-muzeyi",
      ru: "Дом-музей семьи Шамуратовых",
      en: "Shamuratov Family House Museum"
    },
    dist: "nukus-city",
    lat: 42.467463,
    lng: 59.611269,
    cat: "museums",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Qoraqalpog'istonning mashhur ijodkorlari — Amet va Ayimxon Shamuratovlarning shaxsiy buyumlari, ijodiy merosi va milliy madaniyatiga bag'ishlangan samimiy uy-muzey.",
      kaa: "Qaraqalpaqstannıń belgili dóretiwshileri Amet hám Ayımxan Shamuratovlardıń kórkem miyrasına arnalǵan úy-muzey.",
      ru: "Уютный мемориальный дом-музей выдающихся деятелей культуры Каракалпакстана — писателя Амета и певицы Айымхан Шамуратовых.",
      en: "Intimate memorial house-museum celebrating the artistic legacy and personal collections of distinguished Karakalpak cultural icons Amet and Ayimkhan Shamuratov."
    }
  },
  {
    num: 57,
    name: {
      uz: "Berdaq milliy muzeyi",
      kaa: "Berdax milliy muzeyi",
      ru: "Национальный музей Бердаха",
      en: "Berdakh National Museum"
    },
    dist: "nukus-city",
    lat: 42.451650,
    lng: 59.625260,
    cat: "museums",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Buyuk qoraqalpoq shoiri va mutafakkiri Berdaq (1827–1900) hayoti, adabiy merosi hamda qoraqalpoq adabiyoti tarixiga bag'ishlangan muazzam muzey.",
      kaa: "Ullı qaraqalpaq shayırı hám oyshılı Berdaq (1827–1900) ómiri hám ádebiyat tariyxına baǵıshlanǵan muzey.",
      ru: "Музей, посвященный жизни и творческому наследию великого каракалпакского поэта-мыслителя Бердаха и развитию национальной литературы.",
      en: "Monumental museum dedicated to the life, poetry, and philosophy of the revered Karakalpak classic poet Berdakh (1827–1900)."
    }
  },
  {
    num: 58,
    name: {
      uz: "Mo‘ynoq ochiq osmon ostidagi Kemalar qabristoni muzeyi",
      kaa: "Moynaq ashıq aspan astındaǵı Kemeler qoyımshılıǵı muzeyi",
      ru: "Музей «Кладбище кораблей» под открытым небом в Муйнаке",
      en: "Muynak Open-Air Ship Graveyard Museum"
    },
    dist: "muynak",
    lat: 43.790139,
    lng: 59.033972,
    cat: "museums",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Mo'ynoqdagi ochiq maydonda Orol fojiasi guvohi bo'lgan kemalar, ko'rgazmali plakatlar va kuzatuv maydonchasini o'z ichiga olgan yodgorlik muzeyi.",
      kaa: "Moynaqtaǵı ashıq maydandaǵı kemeler, ekspoziciyalıq plakatlar hám tamasha maydanshası.",
      ru: "Мемориальный комплекс под открытым небом с панорамной смотровой площадкой и рядами законсервированных судов на песчаном дне.",
      en: "Outdoor museum and memorial complex featuring observation decks and rows of preserved vessels on the desertified sea floor."
    }
  },
  {
    num: 59,
    name: {
      uz: "Mo‘ynoq ekologiya muzeyi",
      kaa: "Moynaq ekologiya muzeyi",
      ru: "Музей экологии Муйнака",
      en: "Muynak Ecology Museum"
    },
    dist: "muynak",
    lat: 43.766330,
    lng: 59.028710,
    cat: "museums",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Mo'ynoq shahrida joylashgan, Orol dengizining flora, fauna va baliqchilik sanorati o'tmishini aks ettiruvchi boy ekspozitsiya zali.",
      kaa: "Moynaq qalasındaǵı, Aral teńiziniń burınǵı balıqshılıq tariyxı hám tábiyatın kórsetiwshi muzey.",
      ru: "Экспозиция, посвященная былому расцвету рыбоперерабатывающей промышленности и экосистеме Аральского моря до обмеления.",
      en: "Exhibition center documenting the flourishing fishing industry and unique aquatic ecosystem of the Aral Sea prior to its desiccation."
    }
  },
  {
    num: 60,
    name: {
      uz: "Azatbay Otarbayev musiqa ustaxonasi",
      kaa: "Azatbay Otarbayev muzıka ustaxanası",
      ru: "Мастерская традиционных музыкальных инструментов Азатбая Отарбаева",
      en: "Azatbay Otarbayev Musical Instrument Workshop"
    },
    dist: "nukus-city",
    lat: 42.461000,
    lng: 59.615000,
    cat: "crafts",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Milliy qoraqalpoq cholg'ulari — dutor, qobiz va g'ijjak yasash bo'yicha mashhur xalq ustasi ustaxonasi.",
      kaa: "Qaraqalpaq xalıq saz ásbapları — dıwtar, qobız hám ǵıjjay soǵıw boyınsha ataqlı usta ustaxanası.",
      ru: "Мастерская потомственного мастера по изготовлению традиционных каракалпакских инструментов (дутар, кобыз, гиджак).",
      en: "Artisanal workshop dedicated to crafting traditional Karakalpak instruments including dutar, kobyz, and ghijjak."
    }
  },
  {
    num: 61,
    name: {
      uz: "Orol dengizi tarixi muzeyi",
      kaa: "Aral teńizi tariyxı muzeyi",
      ru: "Музей истории Аральского моря",
      en: "Museum of the History of the Aral Sea"
    },
    dist: "muynak",
    lat: 43.789640,
    lng: 59.032420,
    cat: "museums",
    unesco: null,
    type: "exact",
    approximate: false,
    fourByFour: false,
    desc: {
      uz: "Mo'ynoq mayog'i yaqinida joylashgan, tarixiy fotolar, qadimiy baliqchilik asboblari va dengiz xaritalari jamlangan yangi muzey binosi.",
      kaa: "Moynaq mayagı janındaǵı, tariyxıy fotosúwretler hám teńiz kartaları jıynaǵı bolǵan muzey.",
      ru: "Музей у маяка в Муйнаке с архивными фотографиями, картинами художников-маринистов и артефактами морской эпохи.",
      en: "Museum located near the Muynak lighthouse featuring archival photographs, maritime paintings, and navigational artifacts."
    }
  },

  // 62-64 Hunarmandchilik va etno-turizm (3 ta obyekt)
  {
    num: 62,
    name: {
      uz: "Adil Tazhimuratov zargarlik ustaxonasi",
      kaa: "Ádil Tájimuratov zergerlik ustaxanası",
      ru: "Ювелирная мастерская Адиля Тажимуратова",
      en: "Adil Tazhimuratov Jewelry Workshop"
    },
    dist: "chimboy",
    lat: 42.942500,
    lng: 59.771000,
    cat: "crafts",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Chimboydagi qadimiy uslubda kumush va feruza bilan qoraqalpoq milliy taqinchoqlari, saukele bezaklari yasovchi mashhur zargar ustaxonasi.",
      kaa: "Shımbaydaǵı áyyemgi usılda gúmis hám feyruza menen qaraqalpaq zergerlik buyımların soǵıwshı belgili zerger ustaxanası.",
      ru: "Знаменитая ремесленная мастерская в Чимбае по изготовлению аутентичных серебряных украшений и элементов традиционного саукеле.",
      en: "Famous traditional silversmith workshop in Chimbay specializing in handmade authentic Karakalpak jewelry and bridal headdress ornaments."
    }
  },
  {
    num: 63,
    name: {
      uz: "Qorateran ekoturizm kompleksi",
      kaa: "Qarateresteran ekoturizm kompleksi",
      ru: "Экотуристический комплекс Каратерен",
      en: "Karateran Ecotourism Complex"
    },
    dist: "muynak",
    lat: 43.317633,
    lng: 60.375700,
    cat: "ethno",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Mo'ynoq tumanidagi ko'l bo'yida tashkil etilgan, milliy o'tovlar, qayiqda suzish va an'anaviy baliq taomlari bilan mashhur ekoturizm maskani.",
      kaa: "Moynaq rayonındaǵı kól jaǵasında shólkemlestirilgen, kiyiz úyler hám qayıq sayaxatları orayı.",
      ru: "Комплекс экотуризма на берегу озера с юртовым лагерем, катанием на лодках и блюдами местной кухни.",
      en: "Ecotourism complex situated along lake waters featuring yurt accommodations, boat rides, and regional culinary traditions."
    }
  },
  {
    num: 64,
    name: {
      uz: "Tax-tepa etno qishlog‘i",
      kaa: "Tax-tóbe etno awılı",
      ru: "Этно-деревня Тах-тепа",
      en: "Takh-Tepa Ethno Village"
    },
    dist: "chimboy",
    lat: 43.177500,
    lng: 60.466667,
    cat: "ethno",
    unesco: null,
    type: "representative",
    approximate: true,
    fourByFour: false,
    desc: {
      uz: "Qoraqalpoq xalqining qadimiy turmush tarzi, o'tov tikish an'analari, gilamdo'zlik va milliy taomlarini namoyish etuvchi ochiq etno majmua.",
      kaa: "Qaraqalpaq xalqınıń áyyemgi turmıs tárizi, kiyiz úy tigiw dástúrleri hám gilemshilikti kórsetiwshi etno awıl.",
      ru: "Этнографическая деревня, знакомящая гостей с традиционным бытом каракалпаков, сборкой юрт, ковроткачеством и обрядами.",
      en: "Interactive ethnographic village showcasing ancient nomadic traditions, authentic yurt assembly, carpet weaving, and folklore feasts."
    }
  }
];

// Helper to slugify
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[’'ʻ‘`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Read reviewed records only to preserve identities, coordinates and individually sourced media.
const canonicalPath = path.join(__dirname, '..', 'data', 'destinations.json');
const canonical = fs.existsSync(canonicalPath) ? JSON.parse(fs.readFileSync(canonicalPath, 'utf8')) : [];
if (!Array.isArray(canonical)) throw new Error('Canonical destinations must be an array.');
const canonicalById = new Map(canonical.map((destination) => [destination.id, destination]));

// Build a review candidate; this script never publishes or replaces the active catalogue.
const destinations64 = destinationsRaw.map((item) => {
  const padNum = String(item.num).padStart(2, '0');
  const slug = `${padNum}-${slugify(item.name.uz)}`;
  const distInfo = districtMap[item.dist] || districtMap["nukus-city"];
  const is4x4 = Boolean(item.fourByFour);

  const candidate = {
    id: slug,
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
    approximate: Boolean(item.approximate),
    name: item.name,
    description: item.desc,
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
  const reviewed = canonicalById.get(slug) || canonical.find((destination) =>
    destination.number === item.num && destination.name && slugify(destination.name.uz) === slugify(item.name.uz));
  return { ...candidate, ...(reviewed || {}), candidateStatus: 'review-required' };
});

const generatedDir = path.join(__dirname, '..', 'data', 'generated');
fs.mkdirSync(generatedDir, { recursive: true });
const outputPath = path.join(generatedDir, 'destinations-64.json');
fs.writeFileSync(outputPath, `${JSON.stringify(destinations64, null, 2)}\n`, 'utf8');
console.log(`Saved ${destinations64.length} review candidates to data/generated/destinations-64.json.`);
console.log('Canonical destinations, photo sources and routing caches were not changed.');
