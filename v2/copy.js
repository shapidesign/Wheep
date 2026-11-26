/* WHEEP · every word the wrapped says, in one place. Edit here or in admin.html (which can export this file).
   {pct}, {gap} and {name} are filled in by the story. Data (numbers, hours, shapes) lives in gen.js and days.js. */
const COPY_DEFAULT = {
  "feelings": { "anger": "כעס", "press": "הדחקה", "fear": "פחד", "cry": "בכי", "joy": "הנאה", "shame": "בושה", "release": "שחרור" },
  "motion": { "amp": 1, "spread": 1 },
  "ui": {
    "intro": "זה היום שלך.",
    "led": "הרגש שהוביל את היום",
    "share": "{pct}% מהשעות שבהן היית ער",
    "measured": "מה נמדד",
    "when": "מתי",
    "outIn": "בחוץ מול בפנים",
    "gap": "פער של {gap}%",
    "soft": "רך",
    "sharp": "חד",
    "outside": "בחוץ",
    "inside": "בפנים",
    "meaningUp": "בחוץ נראית רגוע יותר ממה שהיה בפנים.",
    "meaningDown": "בפנים היה רך יותר ממה שהראית בחוץ.",
    "feelings": "היום שלך ברגשות",
    "summaryTitle": "הסיכום של {name}"
  },
  "profiles": {
    "anger": {
      "unit": "פעמים הרמת את הקול",
      "label": "שלוש בדרך, אחת בארוחת ערב",
      "b": "בבוקר זה היה על הכביש.",
      "s": "בערב זה היה על מי שישב מולך."
    },
    "press": {
      "unit": "שעות של דופק גבוה במנוחה",
      "label": "בישיבות, ובדרך הביתה",
      "b": "אמרת \"אין בעיה\" ארבע פעמים.",
      "s": "הדופק ספר אחרת."
    },
    "fear": {
      "unit": "דופק שיא",
      "label": "22:24, הודעה מהבנק",
      "b": "פתחת הודעה מהבנק בלילה.",
      "s": "לקח לך 40 דקות להירדם."
    },
    "cry": {
      "unit": "דקות של בכי",
      "label": "21:10, בסוף סרט",
      "b": "בכית בסוף הסרט.",
      "s": "אמרת שזה מהעייפות."
    },
    "joy": {
      "unit": "צחוקים",
      "label": "11 אמיתיים · 3 מנומסים",
      "b": "רוב היום צחקת באמת.",
      "s": "שלושה צחוקים היו בשביל אחרים."
    },
    "shame": {
      "unit": "פעמים שתקת כשרצית לדבר",
      "label": "בישיבה, ובשיחה עם אבא",
      "b": "היה לך מה להגיד, פעמיים.",
      "s": "בשתי הפעמים בלעת את זה."
    }
  },
  "week": [
    {
      "unit": "פעמים הרמת את הקול",
      "label": "שתיים בפקק, אחת בבית",
      "b": "בפקק זה היה על הנהגים.",
      "s": "בבית זה היה על מי שהיה שם."
    },
    {
      "unit": "שעות של דופק גבוה במנוחה",
      "label": "בבוקר בישיבה, אחר הצהריים מול המחשב",
      "b": "כשאלו אמרת שהכל טוב.",
      "s": "הגוף לא הסכים."
    },
    {
      "unit": "דופק שיא",
      "label": "19:40, שיחה נכנסת מאמא",
      "b": "הטלפון צלצל, לא ענית.",
      "s": "הדופק ענה במקומך."
    },
    {
      "unit": "דקות של בכי",
      "label": "07:30, במקלחת",
      "b": "בכית לפני העבודה.",
      "s": "אחר כך הדופק נרגע לכל היום."
    },
    {
      "unit": "צחוקים",
      "label": "9 אמיתיים, 2 מנומסים",
      "b": "רוב הצחוקים היו אמיתיים.",
      "s": "השניים בעבודה היו מנומסים."
    },
    {
      "unit": "מילים בארוחת שישי",
      "label": "20:00 עד 21:30, ליד השולחן",
      "b": "ישבת שעה וחצי ליד השולחן.",
      "s": "ולא אמרת כלום."
    },
    {
      "unit": "שעות רגועות",
      "label": "כל היום, בלי קפיצות",
      "b": "יום שקט.",
      "s": "בחוץ ובפנים, אותה צורה."
    }
  ]
};

// edits saved in this browser by admin.html sit on top of the defaults
function copyMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(over)) out[k] = (base[k] && typeof base[k] === 'object') ? copyMerge(base[k], over[k]) : over[k];
  return out;
}
const COPY_KEY = 'wheep-copy';
let COPY_SAVED = null;
try { COPY_SAVED = JSON.parse(localStorage.getItem(COPY_KEY) || 'null'); } catch (e) { /* private mode, node: defaults only */ }
const COPY = copyMerge(COPY_DEFAULT, COPY_SAVED);
// the feelings' names are words too: they replace the ones in shape.js wherever the story, summary or app shows them
if (typeof EMO !== 'undefined') for (const k in COPY.feelings) if (EMO[k]) EMO[k].he = COPY.feelings[k];
const copyFill = (s, vals) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vals ? vals[k] : m));

if (typeof module !== 'undefined') module.exports = { COPY, COPY_DEFAULT, copyMerge, copyFill, COPY_KEY };
