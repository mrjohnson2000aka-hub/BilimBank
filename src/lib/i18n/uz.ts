import type { Dict } from './en';
const uz: Dict = {
  common: {
    appName: 'BilimBank', join: 'BilimBankka qoʻshilish', signIn: 'Kirish', signOut: 'Chiqish', save: 'Saqlash', saved: 'Saqlandi', saving: 'Saqlanmoqda…', cancel: 'Bekor qilish', close: 'Yopish',
    back: 'Orqaga', next: 'Keyingi', skip: 'Keyinroq', loading: 'Yuklanmoqda…', edit: 'Tahrirlash', remove: 'Olib tashlash', confirm: 'Tasdiqlash', search: 'Qidirish', optional: 'ixtiyoriy',
    credit: 'kredit', credits: 'kredit', minutes: 'daq', viewProfile: 'Profilni koʻrish', viewSlots: 'Boʻsh vaqtlarni koʻrish', tryAgain: 'Qayta urinish',
    somethingWrong: 'Xatolik yuz berdi. Qayta urinib koʻring.', example: 'Namuna', seeAll: 'Hammasi', yes: 'Ha', no: 'Yoʻq', none: 'Hozircha yoʻq', add: 'Qoʻshish',
    areYouSure: 'Ishonchingiz komilmi?', newMentor: 'Yangi mentor', reviewsN: '{n} ta fikr', reviews1: '1 ta fikr', you: 'Siz', deletedUser: 'Sobiq aʼzo'
  },
  nav: {
    how: 'Qanday ishlaydi', explore: 'Koʻnikmalar', community: 'Hamjamiyat', discover: 'Qidiruv', sessions: 'Darslar', messages: 'Xabarlar', wallet: 'Hamyon',
    notifications: 'Bildirishnomalar', profile: 'Ochiq profilim', settings: 'Sozlamalar', admin: 'Admin', leaderboard: 'Reyting', help: 'Yordam markazi',
    availability: 'Boʻsh vaqtlar', account: 'Hisob va maxfiylik', editProfile: 'Profilni tahrirlash', menu: 'Menyu'
  },
  home: {
    heroTitle: 'Bilimingiz qadrli. Uni ulashing.',
    heroText: 'Bilganingizni oʻrgating. Doim oʻrganmoqchi boʻlgan narsani oʻrganing. Darslar uchun pul toʻlamasdan oʻquvchilar bilan koʻnikma almashing va birga oʻsing.',
    ctaPrimary: 'Bepul oʻrganishni boshlash', ctaSecondary: 'Koʻnikmalarni koʻrish', exampleLabel: 'Namuna profil', oneCredit: '1 soat dars = 1 kredit',
    exampleName: 'Namuna mentor', exampleBio: 'Algebrani oʻrgatadi, grafik dizaynni oʻrganmoqchi', exchangeA: 'Siz ingliz tilini oʻrgatasiz', exchangeB: 'Siz Python oʻrganasiz',
    howTitle: 'Qanday ishlaydi', howText: 'Roʻyxatdan oʻtishdan birinchi darsgacha toʻrt qadam.',
    steps: [
      ['Profil yarating', 'Koʻnikmalaringiz, qiziqishlaringiz va boʻsh vaqtingizni qoʻshing.'],
      ['Bilimingizni ulashing', 'Yaxshi biladigan fanlaringizdan dars bering.'],
      ['Kredit almashing', 'Har bir oʻtilgan soatlik dars uchun bir kredit oling.'],
      ['Yangi narsa oʻrganing', 'Kreditlaringizni boshqa oʻquvchidan oʻrganishga sarflang.']
    ],
    popularTitle: 'Mashhur koʻnikmalar', popularText: 'Shu hafta kim oʻrgata olishini koʻrish uchun fanni tanlang.',
    featuredTitle: 'Tanlangan mentorlar', featuredText: 'Shu hafta boʻsh vaqti bor, baholangan mentorlar.', featuredEmpty: 'Oʻquvchilar koʻnikma va boʻsh vaqt qoʻshishi bilan mentorlar shu yerda koʻrinadi. Birinchisi siz boʻlishingiz mumkin.',
    matchTitle: 'Oʻzingizga mos sherikni toping', matchText: 'BilimBank eng yaxshi almashinuvni birinchi qoʻyadi: siz oʻrganmoqchi boʻlgan narsani oʻrgatadigan va siz oʻrgatadigan narsani oʻrganmoqchi boʻlgan odam. Moslashtirish aniq qoidalarga asoslangan va har bir taklif nima uchun tanlanganini tushuntiradi.',
    matchCta: 'Mos sheriklarimni koʻrish',
    statsTitle: 'BilimBank raqamlarda', statActive: 'Faol oʻquvchilar', statActiveDef: 'Soʻnggi 30 kunda kirgan yoki darsda qatnashgan',
    statHours: 'Almashilgan soatlar', statHoursDef: 'Faqat ikkala tomon tasdiqlagan darslar', statSessions: 'Oʻtkazilgan darslar', statRating: 'Oʻrtacha baho',
    statRatingPending: '5 ta fikrdan keyin koʻrsatiladi', recentTitle: 'Yaqinda oʻtkazildi', recentItem: '{skill} · {min} daq',
    testimonialsTitle: 'Oʻquvchilar fikri', testimonialFrom: '{name} haqida oʻquvchi',
    faqTitle: 'Koʻp soʻraladigan savollar',
    faq: [
      ['BilimBank haqiqatan bepulmi?', 'Ha. BilimBankda pul yoʻq. Dars berib kredit topasiz va uni oʻrganishga sarflaysiz. Yangi aʼzolar 10 boshlangʻich kredit oladi.'],
      ['Mutaxassis boʻlmasam-chi?', 'Shart emas. Yaxshi bilgan narsangizni oʻrgating, darajangizni halol koʻrsating, oʻquvchilar oʻzlariga mosini tanlaydi.'],
      ['Darslar qanday oʻtadi?', 'Onlayn, Google Meet orqali. Oʻqituvchi tasdiqlagach, vaqt va havola Darslarim boʻlimida ikkalangizga koʻrinadi.'],
      ['Oʻqituvchi kreditni qachon oladi?', 'Faqat ikkala tomon dars boʻlib oʻtganini tasdiqlagandan keyin. Unga qadar kredit band turadi, sarflanmaydi.'],
      ['Kimdir kelmasa-chi?', 'Dars sahifasidan xabar bering. Ikkinchi tomon javob bera oladi, kelishmovchilikni kreditlar harakatlanishidan oldin admin koʻrib chiqadi.'],
      ['Maʼlumotlarim maxfiymi?', 'Emailingiz, tugʻilgan sanangiz, xabarlaringiz, kredit tarixingiz va uchrashuv havolalari ochiq profilda hech qachon koʻrinmaydi.']
    ],
    safetyTitle: 'Xavfsizlik va hamjamiyat qoidalari',
    safety: [
      ['Avvalo hurmat', 'Xushmuomala boʻling, vaqtida keling va mavzudan chetga chiqmang. Haqorat va kamsitish hisobni toʻxtatishga olib keladi.'],
      ['Hammasi BilimBank ichida', 'Darslarni BilimBank xabarlarida kelishing. 18 yoshgacha oʻquvchi ishtirok etgan chatlarda kontakt maʼlumotlari bloklanadi.'],
      ['Ota-onalar kelishi mumkin', '18 yoshgacha oʻquvchining istalgan darsiga ota-ona yoki vasiy qoʻshilishi mumkin.'],
      ['Muammo haqida xabar bering', 'Har bir dars va chatda xabar berish tugmasi bor. Xabarlar faqat adminlarga boradi.']
    ],
    finalTitle: 'Birinchi darsingizgacha 10 kredit', finalText: 'Bepul profil yarating, oʻrgata oladigan bitta koʻnikmani qoʻshing va bugun mentorni band qiling.'
  },
  footer: {
    tagline: 'Yaxshi bilgan narsangizni oʻrgatib, bepul oʻrganing.', about: 'Biz haqimizda', help: 'Yordam markazi', privacy: 'Maxfiylik siyosati', terms: 'Foydalanish shartlari',
    guidelines: 'Hamjamiyat qoidalari', contact: 'Aloqa', product: 'Mahsulot', company: 'BilimBank', legal: 'Qoidalar'
  },
  auth: {
    signUpTitle: 'BilimBank hisobini yarating', signUpText: 'Har bir oʻquvchi uchun bepul. Qisqa sozlashdan keyin 10 boshlangʻich kredit olasiz.',
    fullName: 'Toʻliq ism', email: 'Email manzil', password: 'Parol', passwordHint: 'Kamida 8 ta belgi.', country: 'Mamlakat', timezone: 'Vaqt mintaqasi',
    language: 'Afzal til', agreePrefix: 'Men roziman:', terms: 'Foydalanish shartlari', privacy: 'Maxfiylik siyosati', guidelines: 'Hamjamiyat qoidalari', and: 'va',
    createAccount: 'Hisob yaratish', haveAccount: 'Hisobingiz bormi?', signInTitle: 'Xush kelibsiz', signInText: 'Darslarni band qilish va kreditlarni boshqarish uchun kiring.',
    noAccount: 'BilimBankda yangimisiz?', forgot: 'Parolni unutdingizmi?', forgotTitle: 'Parolni tiklash', forgotText: 'Emailingizni kiriting, sizga tiklash havolasini yuboramiz.',
    sendLink: 'Havolani yuborish', linkSent: 'Agar bu email bilan hisob boʻlsa, tiklash havolasi yuborildi.', checkEmailTitle: 'Emailingizni tekshiring',
    checkEmailText: '{email} manziliga tasdiqlash havolasini yubordik. Manzilingizni tasdiqlash va profilni sozlashni davom ettirish uchun uni oching.',
    resetTitle: 'Yangi parol tanlang', newPassword: 'Yangi parol', updatePassword: 'Parolni yangilash', passwordUpdated: 'Parol yangilandi.',
    google: 'Google orqali davom etish', or: 'yoki', mustAgree: 'Davom etish uchun shartlarga rozilik bildiring.', invalidLogin: 'Email yoki parol notoʻgʻri.',
    emailNotConfirmed: 'Avval emailingizni tasdiqlang. Pochtangizdagi havolani oching.', weakPassword: 'Kamida 8 ta belgidan foydalaning.', emailTaken: 'Bu email allaqachon roʻyxatdan oʻtgan. Kirib koʻring.'
  },
  onboarding: {
    title: 'Profilingizni sozlang', stepOf: '{n}-qadam, jami 6', stepNames: ['Profil', 'Oʻrgata olaman', 'Oʻrganmoqchiman', 'Men haqimda', 'Boʻsh vaqt', 'Koʻrib chiqish'],
    s1Title: 'Oʻzingizni tanishtiring', s1Text: 'Ismingiz va rasmingiz ochiq profilda koʻrinadi. Maktabingiz va tugʻilgan sanangiz, agar maktabni koʻrsatishni tanlamasangiz, maxfiy qoladi.',
    displayName: 'Koʻrinadigan ism', username: 'Foydalanuvchi nomi', usernameHint: 'Faqat kichik lotin harflari, raqamlar va _. Profil havolangizda ishlatiladi.', avatar: 'Profil rasmi',
    upload: 'Rasm yuklash', avatarHint: 'PNG, JPG yoki WebP, 2 MB gacha.', school: 'Maktab, universitet yoki oʻquv markazi', level: 'Sinf, kurs yoki daraja',
    showSchool: 'Maktabimni ochiq profilda koʻrsatish', showSchoolMinor: '18 yoshgacha oʻquvchilar uchun yashirin.', birthDate: 'Tugʻilgan sana', birthHint: 'Maxfiy. Faqat yosh siyosatini qoʻllash uchun (13+).',
    s2Title: 'Nimani oʻrgata olasiz?', s2Text: 'Yaxshi biladigan koʻnikmalaringizni tanlang va darajangizni halol koʻrsating. Buni istalgan vaqtda oʻzgartirishingiz mumkin.',
    s3Title: 'Nimani oʻrganmoqchisiz?', s3Text: 'Bu orqali sizga mentor topamiz va ikki tomonlama almashinuvlarni taklif qilamiz.',
    searchSkills: 'Koʻnikmalarni qidirish', suggest: '"{name}" ni yangi koʻnikma sifatida taklif qilish', suggestHint: 'Taklif qilingan koʻnikmalarni admin koʻrib chiqadi. Siz undan darhol foydalanishingiz mumkin.',
    levels: { beginner: 'Boshlangʻich', intermediate: 'Oʻrta', advanced: 'Yuqori', expert: 'Ekspert' }, yourLevel: 'Darajangiz',
    s4Title: 'Qisqacha tanishtiruv', s4Text: 'Ikki-uch jumla: natijalaringiz, tajribangiz va qanday oʻrgatishni yoqtirasiz.', bio: 'Men haqimda',
    bioPh: 'masalan: IELTS 7.5. Real mavzularda soʻzlashuvni mashq qilishni va aniq fikr bildirishni yoqtiraman.', languages: 'Dars bera oladigan tillaringiz', languagesHint: 'Vergul bilan ajrating, masalan: English, Uzbek, Russian',
    s5Title: 'Qachon dars bera olasiz?', s5Text: 'Haftalik vaqtlarni qoʻshing. Oʻquvchilar faqat shu vaqtlar ichida va hech qachon bir vaqtga ikki marta band qila olmaydi.',
    s6Title: 'Ochiq profilingiz', s6Text: 'Boshqa oʻquvchilar shuni koʻradi. Shaxsiy maʼlumotlar hech qachon koʻrsatilmaydi.',
    agree: 'Foydalanish shartlari, Maxfiylik siyosati va Hamjamiyat qoidalariga roziman.', finish: 'Platformaga kirish', laterHint: 'Ixtiyoriy maydonlarni keyinroq Sozlamalarda toʻldirishingiz mumkin.',
    tooYoung: 'BilimBank {age} yosh va undan katta oʻquvchilar uchun.', needName: 'Ismingizni kiriting.', needBirth: 'Tugʻilgan sanangizni kiriting.', needUsername: '3–24 belgidan iborat foydalanuvchi nomini tanlang.',
    usernameTaken: 'Bu foydalanuvchi nomi band.', welcome: 'BilimBankka xush kelibsiz. Hamyoningizga 10 kredit qoʻshildi.'
  },
  skills: { levelLabel: 'Daraja', teachersN: '{n} ta mentor', teachers1: '1 ta mentor', learnersN: '{n} ta oʻquvchi', teachThis: 'Men buni oʻrgata olaman', noMentors: 'Hozir bu koʻnikma boʻyicha boʻsh vaqti bor mentor yoʻq.', category: 'Turkum' },
  profile: {
    teaches: 'Oʻrgata olaman', wantsToLearn: 'Oʻrganmoqchiman', rating: 'Baho', reviews: 'Fikrlar', noReviews: 'Hali fikrlar yoʻq.', completed: 'Oʻtkazilgan darslar',
    hoursTaught: 'Bergan dars soatlari', hoursLearned: 'Oʻrgangan soatlari', memberSince: '{date} dan beri aʼzo', languages: 'Dars tillari', online: 'Google Meet orqali onlayn',
    bookTitle: 'Darsni band qilish', chooseSkill: 'Koʻnikma', duration: 'Davomiyligi', pickDay: 'Kun', noSlots: 'Bu kunda boʻsh vaqt yoʻq. Boshqa kunni tanlang.',
    noSlotsAtAll: 'Yaqin haftalarda boʻsh vaqt yoʻq.', cost: 'Narxi', balanceAfter: 'Band qilgandan keyingi balansingiz', note: 'Mentorga xabar', notePh: 'Nima ustida ishlamoqchisiz?',
    rulesTitle: 'Dars qoidalari', rules: 'Vaqtida keling, hurmat bilan muomala qiling va mavzudan chetga chiqmang. Yozishmani BilimBank ichida olib boring. Istalgan darsga ota-ona yoki vasiy qoʻshilishi mumkin. Notoʻgʻri tuyulgan holat haqida xabar bering.',
    agreeRules: 'Dars qoidalariga roziman', bookNow: '{c} evaziga band qilish', bookedTitle: 'Soʻrov yuborildi', bookedText: '{name} tasdiqlaydi yoki rad etadi. Shu vaqtgacha kreditlaringiz band turadi.',
    openSession: 'Darsni ochish', signInToBook: 'Band qilish uchun kiring', yourProfile: 'Bu sizning ochiq profilingiz.', balance: 'Balansingiz', upcomingOwner: 'Kelgusi darslaringiz (faqat sizga koʻrinadi)',
    timesIn: 'Vaqtlar {tz} boʻyicha', notFound: 'Bu profil mavjud emas yoki endi koʻrinmaydi.', report: 'Profil haqida xabar berish', block: 'Bloklash', unblock: 'Blokdan chiqarish'
  },
  discover: {
    title: 'Koʻnikmalar', subtitle: 'Faqat filtrlaringizga mos haqiqiy boʻsh vaqti bor mentorlar koʻrsatiladi.', searchPh: 'Koʻnikma yoki ism, masalan: Ingliz tili, Algebra, Python',
    category: 'Turkum', anyCategory: 'Barcha turkumlar', language: 'Dars tili', anyLanguage: 'Istalgan til', level: 'Mentor darajasi', anyLevel: 'Istalgan daraja',
    minRating: 'Eng past baho', anyRating: 'Istalgan baho', duration: 'Dars davomiyligi', when: 'Qachon', next7: 'Keyingi 7 kun', next14: 'Keyingi 14 kun', next30: 'Keyingi 30 kun',
    onDate: 'Aniq sana', timeOfDay: 'Kun vaqti', anyTime: 'Istalgan vaqt', morning: 'Ertalab (06–12)', afternoon: 'Kunduzi (12–17)', evening: 'Kechqurun (17–23)',
    apply: 'Boʻsh vaqtlarni koʻrsatish', reset: 'Filtrlarni tozalash', results: 'Boʻsh vaqti bor {n} ta mentor', results1: 'Boʻsh vaqti bor 1 ta mentor', noResults: 'Bu filtrlarga mos boʻsh vaqt yoʻq',
    noResultsText: 'Kengroq vaqt oraligʻi, boshqa kun yoki kamroq filtrni sinab koʻring.', bestTitle: 'Sizga eng mos sheriklar', bestText: 'Avval ikki tomonlama almashinuvlar, keyin umumiy boʻsh vaqt, til va baholar boʻyicha.',
    bestEmpty: 'Mos sheriklarni koʻrish uchun profilingizga oʻrganmoqchi boʻlgan koʻnikmalarni qoʻshing.', reasonBoth: 'Siz {mine} ni oʻrgata olasiz, {name} uni oʻrganmoqchi va {theirs} ni oʻrgata oladi.',
    reasonTeach: '{name} siz oʻrganmoqchi boʻlgan {theirs} ni oʻrgatadi.', overlapH: 'Haftasiga {n} soat umumiy boʻsh vaqt', sharedLang: 'Ikkalangiz ham {langs} bilasiz', past: 'Avval birga {n} ta dars',
    signInForMatches: 'Ikki tomonlama mosliklarni koʻrish uchun kiring.', nextFree: 'Eng yaqin boʻsh vaqt', levelIn: '{skill}: {level}', filters: 'Filtrlar'
  },
  status: {
    pending: 'Tasdiq kutilmoqda', confirmed: 'Tasdiqlangan', upcoming: 'Kelgusi', in_progress: 'Davom etmoqda', awaiting: 'Yakunlash tasdigʻi kutilmoqda', completed: 'Oʻtkazildi',
    cancelled: 'Bekor qilindi', declined: 'Rad etildi', expired: 'Muddati oʻtdi', disputed: 'Bahsli', no_show_learner: 'Kelmadi (oʻquvchi)', no_show_teacher: 'Kelmadi (oʻqituvchi)', void: 'Admin bekor qildi'
  },
  sessions: {
    title: 'Darslarim', tabs: { upcoming: 'Kelgusi', pending: 'Kutilayotgan soʻrovlar', awaiting: 'Tasdiq kutilmoqda', completed: 'Oʻtkazilgan', cancelled: 'Bekor qilingan' },
    empty: { upcoming: 'Kelgusi darslar yoʻq. Boshlash uchun mentorni band qiling.', pending: 'Kutilayotgan soʻrovlar yoʻq.', awaiting: 'Hozir tasdiqlanadigan narsa yoʻq.', completed: 'Hali oʻtkazilgan darslar yoʻq.', cancelled: 'Bekor qilingan darslar yoʻq.' },
    list: 'Roʻyxat', calendar: 'Hafta', youTeach: 'Siz {name}ga dars berasiz', youLearn: 'Siz {name}dan oʻrganasiz', needsYou: 'Sizdan harakat kutilmoqda',
    confirm: 'Tasdiqlash', decline: 'Rad etish', cancel: 'Darsni bekor qilish', reschedule: 'Vaqtini oʻzgartirish', join: 'Google Meet-ga qoʻshilish', confirmDone: 'Dars oʻtganini tasdiqlash',
    reportNoShow: 'Kelmaganini bildirish', openDispute: 'Bahs ochish', review: 'Fikr qoldirish', report: 'Muammo haqida xabar berish', message: 'Xabar yozish', details: 'Batafsil',
    startsIn: '{t} dan keyin boshlanadi', started: 'Boshlandi', ended: 'Tugadi', countdownDays: '{d} kun {h} soat', countdownHours: '{h} soat {m} daq', countdownMin: '{m} daq',
    prepTitle: 'Darsdan oldin', prep: ['Mavzuni xabarlarda kelishib oling.', 'Kamera va mikrofonni tekshiring.', 'Qogʻoz, daftar yoki umumiy hujjat tayyorlang.', 'Ikki daqiqa oldin qoʻshiling.'],
    notes: 'Umumiy qaydlar', notesPh: 'Reja, havolalar yoki uy vazifasi. Bu qaydlarni ikkalangiz koʻrasiz.', saveNotes: 'Qaydlarni saqlash',
    meetTitle: 'Uchrashuv', meetReady: 'Google Meet havolangiz tayyor.', meetWaiting: 'Oʻqituvchi qoʻshgach, uchrashuv havolasi shu yerda paydo boʻladi.',
    meetCreate: 'Google Meet havolasini yaratish', meetPaste: 'Yoki Google Meet havolasini qoʻying', meetPastePh: 'https://meet.google.com/abc-defg-hij', meetSave: 'Havolani saqlash',
    meetConnectHint: 'Hisob sozlamalarida Google Calendar-ni ulang, shunda BilimBank Meet havolasi va taklifni oʻzi yaratadi.', meetFailed: 'Google uchrashuvni yarata olmadi: {e}. Uning oʻrniga havolani qoʻyishingiz mumkin.',
    meetNotSetUp: 'Bu saytda avtomatik Meet havolalari hali sozlanmagan. Google Meet havolasini qoʻying.',
    cancelTitle: 'Darsni bekor qilasizmi?', cancelLearner: 'Band qilingan kreditlaringiz sizga qaytadi.', cancelTeacher: 'Oʻquvchiga band qilingan kreditlari qaytadi.',
    cancelDeadline: 'Tasdiqlangan darslarni boshlanishidan {h} soat oldingacha bekor qilish mumkin.', reasonPh: 'Sabab (ikkinchi tomonga koʻrinadi)',
    rescheduleTitle: 'Yangi vaqtni tanlang', rescheduleText: 'Joriy soʻrovingiz bekor qilinadi va {name}ga yangisi yuboriladi.',
    doneTitle: 'Dars boʻlib oʻtdimi?', doneText: 'Ikkalangiz tasdiqlagach, band qilingan kreditlar oʻqituvchiga oʻtadi. Buni ortga qaytarib boʻlmaydi.', waitingOther: 'Siz tasdiqladingiz. {name} kutilmoqda.',
    noShowTitle: 'Kelmaganini bildirish', noShowText: '{name}ga javob berish uchun {h} soat beriladi. Rozi boʻlsa, qoida qoʻllanadi. Rozi boʻlmasa, admin koʻrib chiqadi. Hech kim avtomatik jazolanmaydi.',
    noShowPh: 'Nima boʻldi? masalan: Meet havolasida 15 daqiqa kutdim.', disputeTitle: 'Bahs ochish', disputeText: 'Muammoni tasvirlang. Admin qaror qabul qilishdan oldin band qilish, tasdiqlar va dalillarni koʻrib chiqadi.',
    disputeKinds: { quality: 'Dars sifati', other: 'Boshqa' }, respondTitle: '{name} siz darsga kelmaganingizni bildirdi', respondText: 'Nima boʻlganini yozing. Rozi boʻlsangiz, qoida hozir qoʻllanadi. Rozi boʻlmasangiz, admin hal qiladi.',
    agree: 'Roziman', disagree: 'Rozi emasman', responsePh: 'Sizning fikringiz', underReview: 'Bu darsni admin koʻrib chiqmoqda.',
    reviewTitle: 'Dars qanday oʻtdi?', overall: 'Umumiy', preparation: 'Tayyorgarlik', clarity: 'Tushunarlilik', helpfulness: 'Foydaliligi', reviewPh: 'Nima yaxshi boʻldi? Nimani yaxshilash mumkin? (ixtiyoriy)',
    submitReview: 'Fikrni eʼlon qilish', reviewed: 'Siz bu darsga fikr qoldirdingiz.', reportTitle: 'Muammo haqida xabar berish', reportPh: 'Adminlarga nima boʻlganini yozing.',
    reportReasons: { safety: 'Xavfsizlik', harassment: 'Haqorat', inappropriate: 'Nojoʻya xatti-harakat', spam: 'Spam', no_show: 'Kelmaslik', other: 'Boshqa' },
    sendReport: 'Xabarni yuborish', reported: 'Xabar yuborildi. Uni faqat adminlar koʻradi.', held: '{c} band', when: 'Vaqt', skill: 'Koʻnikma', length: 'Davomiyligi', cost: 'Kredit',
    teacher: 'Oʻqituvchi', learner: 'Oʻquvchi', statusLabel: 'Holat', yourTime: 'sizning vaqt mintaqangizda ({tz})', requestNote: 'Oʻquvchi xabari', respondBy: '{date} gacha javob bering',
    noWeek: 'Bu haftada dars yoʻq.', thisWeek: 'Shu hafta', prevWeek: 'Oldingi hafta', nextWeek: 'Keyingi hafta', notFound: 'Dars topilmadi.'
  },
  wallet: {
    title: 'Hamyon', available: 'Mavjud', held: 'Band qilingan', earned: 'Dars berib topilgan', spent: 'Oʻrganishga sarflangan', history: 'Tranzaksiyalar tarixi',
    types: { starter_grant: 'Boshlangʻich kreditlar', hold: 'Kredit band qilindi', hold_release: 'Band bekor qilindi', hold_capture: 'Dars uchun toʻlov', teaching_reward: 'Dars uchun mukofot', learner_refund: 'Qaytarildi', admin_adjustment: 'Admin tuzatishi', no_show_penalty: 'Kelmaganlik jarimasi' },
    date: 'Sana', type: 'Turi', amount: 'Miqdor', session: 'Dars', balance: 'Keyingi balans', empty: 'Hali tranzaksiyalar yoʻq.', heldTitle: 'Band qilingan kreditlar', noneHeld: 'Band qilingan kredit yoʻq.',
    explain: 'Kreditlar band qilinganda ushlab turiladi va faqat ikkalangiz tasdiqlagach oʻqituvchiga oʻtadi. Har bir oʻzgarish shu yerda yoziladi va tahrirlanmaydi.'
  },
  messages: {
    title: 'Xabarlar', empty: 'Hali yozishmalar yoʻq. Dars band qilganingizda yoki soʻrov olganingizda yozishma ochiladi.', select: 'Yozishmani tanlang.',
    ph: 'Xabar yozing', send: 'Yuborish', safety: 'Xabarlardan darslarni kelishish uchun foydalaning. Parolni hech qachon ulashmang. 18 yoshgacha oʻquvchi bor chatlarda kontakt maʼlumotlari bloklanadi.',
    report: 'Xabar berish', block: 'Bloklash', unblock: 'Blokdan chiqarish', blocked: 'Siz bu odamni blokladingiz. U sizga yoza olmaydi.', blockedByOther: 'Bu odamga yoza olmaysiz.',
    read: 'Oʻqildi', back: 'Orqaga'
  },
  notifications: {
    title: 'Bildirishnomalar', empty: 'Yangi bildirishnoma yoʻq.', markAll: 'Hammasini oʻqilgan deb belgilash',
    kinds: {
      booking_request: 'Yangi dars soʻrovi', booking_confirmed: 'Darsingiz tasdiqlandi', booking_declined: 'Soʻrovingiz rad etildi', booking_cancelled: 'Dars bekor qilindi',
      booking_expired: 'Soʻrov muddati oʻtdi va kreditlaringiz qaytarildi', booking_rescheduled: 'Oʻquvchi dars vaqtini oʻzgartirdi', confirm_requested: 'Dars oʻtganini tasdiqlang',
      credit_earned: 'Siz kredit topdingiz', credit_refunded: 'Kreditlar sizga qaytarildi', credit_adjusted: 'Admin kreditlaringizni tuzatdi', new_message: 'Yangi xabar',
      no_show_reported: 'Darsingiz boʻyicha kelmaganlik haqida xabar berildi', dispute_review: 'Xabaringiz koʻrib chiqilmoqda', dispute_resolved: 'Bahs hal qilindi', meet_ready: 'Uchrashuv havolangiz tayyor'
    }
  },
  leaderboard: {
    title: 'Oʻqituvchilar reytingi', text: 'Faqat oʻtkazilgan darslar uchun topilgan kreditlar boʻyicha. Boshlangʻich, qaytarilgan va band qilingan kreditlar hisoblanmaydi.',
    rank: '#', teacher: 'Oʻqituvchi', earned: 'Topilgan', sessions: 'Darslar', rating: 'Baho', empty: 'Darslar oʻtkazilgani sari reyting toʻladi.',
    hide: 'Sozlamalar → Profil boʻlimida oʻzingizni reytingdan yashirishingiz mumkin.', disabled: 'Reyting oʻchirilgan.'
  },
  settings: {
    profileTitle: 'Profil', availabilityTitle: 'Boʻsh vaqtlar', accountTitle: 'Hisob va maxfiylik', privacy: 'Maxfiylik', showSchool: 'Maktabimni ochiq profilda koʻrsatish',
    showLeaderboard: 'Meni ochiq reytingda koʻrsatish', weekly: 'Haftalik vaqtlar', weeklyText: 'Vaqtlar sizning mintaqangizda ({tz}).', addRange: 'Vaqt qoʻshish', specific: 'Bir martalik sanalar',
    specificText: 'Muayyan kundagi qoʻshimcha boʻsh vaqtlar.', exceptions: 'Taʼtil va band kunlar', exceptionsText: 'Bu kunlarda band qilib boʻlmaydi.', from: 'Dan', to: 'Gacha',
    date: 'Sana', notePh: 'Izoh (ixtiyoriy)', durations: 'Taklif qiladigan dars davomiyligi', notice: 'Eng kam ogohlantirish vaqti', noticeHours: '{n} soat', horizon: 'Oldindan band qilish', horizonDays: '{n} kun oldin',
    buffer: 'Darslar orasidagi tanaffus', bufferMin: '{n} daqiqa', timezone: 'Vaqt mintaqasi', preview: 'Eng yaqin boʻsh vaqtlaringiz', previewEmpty: 'Hali boʻsh vaqt yoʻq. Yuqorida haftalik vaqt qoʻshing.',
    emailPrefs: 'Email bildirishnomalar', prefEssential: 'Band qilish, bekor qilish, yakunlash va hisob haqidagi xatlar doim yuboriladi.', prefMessages: 'Yangi xabarlar haqida email yuborish',
    prefReminders: 'Dars eslatmalari (24 soat va 1 soat oldin)', prefCalendar: 'Oʻqituvchimning Google Calendar-i emailimga taklif yuborsin', calendar: 'Google Calendar va Meet',
    calendarText: 'Bir marta ulang, shunda siz oʻtadigan darsni tasdiqlaganingizda BilimBank Google Calendar tadbiri va Meet havolasini yaratadi.', connect: 'Google Calendar-ni ulash',
    connected: '{email} sifatida ulangan', disconnect: 'Uzish', calendarUnavailable: 'Bu saytda hali sozlanmagan. Admin Google maʼlumotlarini qoʻshishi kerak.',
    language: 'Interfeys tili', data: 'Maʼlumotlaringiz', export: 'Maʼlumotlarimni yuklab olish', deleteTitle: 'Hisobni oʻchirish', deleteText: 'Profilingiz, koʻnikmalaringiz va boʻsh vaqtlaringiz oʻchiriladi va siz chiqasiz. Hisob-kitob uchun tranzaksiya va dars yozuvlari anonim saqlanadi.',
    deleteConfirm: 'Tasdiqlash uchun DELETE deb yozing', deleteBtn: 'Hisobimni oʻchirish', deleteBlocked: 'Avval ochiq darslaringizni yakunlang yoki bekor qiling.', avatarRemove: 'Rasmni olib tashlash'
  },
  help: {
    title: 'Yordam markazi', text: 'Javoblar, xavfsizlik qoidalari va siyosatlar bir joyda.', contactText: 'Savol yoki xavfsizlik muammosi boʻlsa, bizga {email} manziliga yozing.', contactNone: 'Adminlar bilan bogʻlanish uchun darslar va profillardagi Xabar berish tugmalaridan foydalaning.',
    sections: { about: 'BilimBank haqida', how: 'Kreditlar qanday ishlaydi', safety: 'Xavfsizlik', guidelines: 'Hamjamiyat qoidalari', privacy: 'Maxfiylik siyosati', terms: 'Foydalanish shartlari', contact: 'Aloqa' }
  },
  admin: {
    title: 'Boshqaruv', only: 'Faqat adminlarga koʻrinadi. Har bir oʻzgarish audit jurnaliga yoziladi.',
    tabs: { overview: 'Umumiy', people: 'Ishtirokchilar', sessions: 'Darslar', queue: 'Koʻrib chiqish', skills: 'Koʻnikmalar', settings: 'Sozlamalar', audit: 'Audit jurnali' },
    from: 'Dan', to: 'Gacha', apply: 'Qoʻllash', exportCsv: 'CSV yuklab olish', users: 'Roʻyxatdan oʻtganlar', onboarded: 'Sozlashni tugatganlar', active: 'Faol (30 kun)', newUsers: 'Oraliqda yangi',
    bookings: 'Oraliqdagi band qilishlar', confirmed: 'Tasdiqlangan', completed: 'Oʻtkazilgan', cancelled: 'Bekor qilingan', hours: 'Tasdiqlangan soatlar', avgRating: 'Oʻrtacha baho', completion: 'Yakunlanish ulushi',
    noShowRate: 'Kelmaslik ulushi', disputeRate: 'Bahslar ulushi', issued: 'Berilgan kreditlar', starter: 'Boshlangʻich', rewards: 'Dars mukofotlari', adjustments: 'Tuzatishlar', daily: 'Kunlik faollik',
    signups: 'Roʻyxatdan oʻtish', booked: 'Band qilingan', topTeach: 'Eng koʻp taklif qilingan', topLearn: 'Eng koʻp soʻralgan', openItems: 'Ochiq masalalar', disputes: 'Bahslar', reports: 'Xabarlar', flags: 'Shubhali holatlar',
    emailFailed: 'Yuborilmagan xatlar', integrations: 'Integratsiyalar', emailOk: 'Email yuborish', googleOk: 'Google Calendar va Meet', serviceOk: 'Server kaliti', cronOk: 'Rejalashtirilgan ishlar',
    on: 'Ulangan', off: 'Sozlanmagan', searchPeople: 'Ism yoki foydalanuvchi nomi boʻyicha qidirish', name: 'Ism', status: 'Holat', role: 'Rol', joined: 'Qoʻshilgan', balance: 'Balans',
    suspend: 'Toʻxtatish', reinstate: 'Tiklash', makeAdmin: 'Admin qilish', makeStudent: 'Adminlikdan olish', adjust: 'Kreditni tuzatish', amount: 'Miqdor (+/-)', reason: 'Sabab (majburiy, yoziladi)',
    resolve: 'Hal qilish', outcome: 'Natija', outcomes: { completed: 'Oʻtkazildi, oʻqituvchiga toʻlash', no_show_learner: 'Oʻquvchi kelmadi, oʻqituvchiga toʻlash', no_show_teacher: 'Oʻqituvchi kelmadi, qaytarish va jarima', void: 'Bekor qilish va qaytarish, jarimasiz' },
    ledger: 'Tranzaksiyalar', statusFilter: 'Holat', any: 'Istalgan', open: 'Ochiq', reviewing: 'Koʻrilmoqda', closed: 'Yopilgan', dismiss: 'Rad etish', actioned: 'Chora koʻrildi',
    hideReview: 'Fikrni yashirish', showReview: 'Fikrni koʻrsatish', suggested: 'Taklif qilingan koʻnikmalar', approve: 'Tasdiqlash', disable: 'Oʻchirish', mergeInto: 'Birlashtirish…', addSkill: 'Koʻnikma qoʻshish',
    nameEn: 'Nomi (inglizcha)', nameUz: 'Nomi (oʻzbekcha)', settingsSaved: 'Sozlamalar saqlandi.', confirmAction: 'Amalni tasdiqlang', recentReviews: 'Soʻnggi fikrlar',
    s: { starter_credits: 'Boshlangʻich kreditlar', durations: 'Dars davomiyligi (daqiqa)', weekly_earning_cap: 'Haftalik topish chegarasi (kredit)', pair_weekly_cap: 'Oʻquvchi–oʻqituvchi juftligi uchun haftalik chegara',
      reciprocal_flag_threshold: '30 kunda shuncha darsi bor juftliklarni belgilash', cancel_deadline_hours: 'Bekor qilish muddati (soat)', response_window_hours: 'Oʻqituvchi javob muddati (soat)',
      reminder_hours: 'Eslatmalar (necha soat oldin)', noshow_penalty: 'Oʻqituvchi kelmasligi jarimasi (kredit)', noshow_response_hours: 'Kelmaslik xabariga javob muddati (soat)', leaderboard_enabled: 'Ochiq reyting',
      announcement: 'Eʼlon banneri (yashirish uchun boʻsh qoldiring)' }
  },
  errors: {
    not_signed_in: 'Avval kiring.', account_suspended: 'Hisobingiz toʻxtatilgan. Adminlarga murojaat qiling.', finish_onboarding: 'Avval profilingizni sozlashni tugating.',
    insufficient_credits: 'Kreditingiz yetarli emas.', slot_taken: 'Bu vaqtni hozirgina boshqa odam band qildi. Boshqasini tanlang.', slot_unavailable: 'Bu vaqt endi boʻsh emas. Boshqasini tanlang.',
    you_are_busy: 'Bu vaqtda sizda boshqa dars bor.', teacher_weekly_cap: 'Bu mentor haftalik dars chegarasiga yetdi. Keyingi haftani sinab koʻring.',
    pair_weekly_cap: 'Bu mentor bilan haftalik chegaraga yetdingiz. Boshqa mentorni yoki keyingi haftani tanlang.', cannot_book_yourself: 'Oʻzingizni band qila olmaysiz.',
    skill_not_offered: 'Bu mentor bu koʻnikmani oʻrgatmaydi.', teacher_unavailable: 'Bu mentor hozir mavjud emas.', blocked: 'Bu odam bilan aloqa qila olmaysiz.',
    already_answered: 'Bu soʻrovga allaqachon javob berilgan.', request_expired: 'Bu soʻrov muddati oʻtgan.', cannot_cancel: 'Bu darsni endi bekor qilib boʻlmaydi.',
    already_started: 'Dars allaqachon boshlangan.', past_cancel_deadline: 'Bekor qilish uchun kech. Kelmaganini bildiring yoki bahs oching.', not_confirmable: 'Bu darsni hozir tasdiqlab boʻlmaydi.',
    not_started: 'Dars boshlangandan keyin tasdiqlashingiz mumkin.', already_confirmed: 'Siz allaqachon tasdiqlagansiz.', too_early: 'Kelmaganini boshlanishdan 10 daqiqa keyin bildirish mumkin.',
    not_reportable: 'Bu dars haqida hozir xabar berib boʻlmaydi.', not_disputable: 'Bu dars boʻyicha hozir bahs ochib boʻlmaydi.', not_completed: 'Dars oʻtkazilgandan keyin fikr qoldirishingiz mumkin.',
    already_reviewed: 'Siz bu darsga allaqachon fikr qoldirgansiz.', invalid_meet_link: 'https://meet.google.com/abc-defg-hij kabi havolani qoʻying', too_young: 'BilimBank 13 yosh va undan katta oʻquvchilar uchun.',
    terms_required: 'Shartlarga rozilik bildiring.', birth_date_required: 'Toʻgʻri tugʻilgan sanani kiriting.', name_required: 'Ismingizni kiriting.', contact_details_blocked: 'Bu chatda telefon raqami va email ulashib boʻlmaydi.',
    rate_limited: 'Juda tez harakat qilyapsiz. Biroz kuting.', admin_only: 'Faqat adminlar uchun.', reason_required: 'Sababini yozing.', cannot_change_self: 'Oʻz rolingiz yoki holatingizni oʻzgartira olmaysiz.',
    invalid_amount: 'Miqdor -100 va 100 orasida boʻlishi kerak.', not_found: 'Topilmadi.', invalid_timezone: 'Toʻgʻri vaqt mintaqasini tanlang.', duplicate: 'Bu allaqachon mavjud.', network: 'Aloqa muammosi. Qayta urinib koʻring.'
  }
};
export default uz;
