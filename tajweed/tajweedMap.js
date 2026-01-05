/* =========================
   Tajweed matching map
   Используется для подсветки
========================= */

export const TAJWEED_MAP = [
  {
    rule: "idgham_ghunnah",
    description: "Нун с сукуном / танвин + ي ن م و",
    match: /(نْ|ً|ٍ|ٌ)\s*[ينمو]/g
  },
  {
    rule: "idgham_no_ghunnah",
    description: "Нун с сукуном / танвин + ل ر",
    match: /(نْ|ً|ٍ|ٌ)\s*[لر]/g
  },
  {
    rule: "ikhfa",
    description: "Нун с сукуном / танвин + буквы ихфа",
    match: /(نْ|ً|ٍ|ٌ)\s*[تثجدذزسشصضطظفقك]/g
  },
  {
    rule: "izhar",
    description: "Нун с сукуном / танвин + горловые",
    match: /(نْ|ً|ٍ|ٌ)\s*[ءهعحغخ]/g
  },
  {
    rule: "iqlab",
    description: "Нун с сукуном / танвин + ب",
    match: /(نْ|ً|ٍ|ٌ)\s*ب/g
  },
  {
    rule: "qalqalah",
    description: "Буквы калькаля при сукуне",
    match: /[قطبجد]ْ/g
  }
];
