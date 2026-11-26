/* WHEEP · every word the wrapped says, in one place. Edit here or in admin.html (which can export this file).
   {pct}, {gap} and {name} are filled in by the story. Data (numbers, hours, shapes) lives in gen.js and days.js. */
const COPY_DEFAULT = {
  "feelings": {
    "anger": "כעס",
    "press": "הדחקה",
    "fear": "פחד",
    "cry": "עצב",
    "joy": "הנאה",
    "shame": "בושה",
    "release": "שחרור"
  },
  "motion": {
    "amp": 1,
    "spread": 1
  },
  "ui": {
    "intro": "ככה עבר עליך היום.",
    "led": "הרגש שהוביל את היום שלך",
    "share": "{pct}% מהשעות שבהן היית ער",
    "measured": "מה מדדנו אצלך",
    "when": "מתי הרגשת את זה",
    "outIn": "מוחצן או מופנם",
    "gap": "הפער אצלך: {gap}%",
    "soft": "רך",
    "sharp": "חד",
    "outside": "מה שהראית",
    "inside": "מה שהרגשת",
    "meaningUp": "הראית רוגע, אבל בפנים הרגשת חד יותר.",
    "meaningDown": "בפנים הרגשת רך יותר ממה שהראית.",
    "feelings": "היום שלך ברגשות",
    "summaryTitle": "{name}, זה הסיכום שלך"
  },
  "profiles": {
    "anger": {
      "unit": "פעמים הרמת את הקול",
      "label": "שלוש כשנהגת, אחת בארוחת ערב",
      "b": "בבוקר זה היה על הכביש.",
      "s": "בערב זה היה על מי שישב מולך."
    },
    "press": {
      "unit": "מדד לחץ הגבריות שלך (MPL)",
      "label": "כשישבת בישיבות, ובדרך הביתה",
      "b": "אמרת \"אין בעיה\" ארבע פעמים.",
      "s": "ה־MPL שלך ספר אחרת."
    },
    "fear": {
      "unit": "מדד הפחד שלך, בשיא",
      "label": "22:24, כשקיבלת הודעה מהבנק",
      "b": "פתחת הודעה מהבנק בלילה.",
      "s": "לקח לך 40 דקות להירדם."
    },
    "cry": {
      "unit": "דקות שבכית",
      "label": "21:10, בסוף הסרט שראית",
      "b": "בכית בסוף הסרט.",
      "s": "אמרת שזה מהעייפות."
    },
    "joy": {
      "unit": "פעמים שצחקת",
      "label": "11 צחוקים אמיתיים · 3 מנימוס",
      "b": "רוב היום צחקת באמת.",
      "s": "שלוש פעמים צחקת בשביל אחרים."
    },
    "shame": {
      "unit": "פעמים שתקת כשרצית לדבר",
      "label": "בישיבה, ובשיחה עם אבא שלך",
      "b": "היה לך מה להגיד, פעמיים.",
      "s": "בשתי הפעמים בלעת את זה."
    }
  },
  "week": [
    {
      "unit": "פעמים הרמת את הקול",
      "label": "שתיים כשעמדת בפקק, אחת בבית",
      "b": "בפקק כעסת על הנהגים.",
      "s": "בבית כעסת על מי שהיה שם."
    },
    {
      "unit": "מדד לחץ הגבריות שלך (MPL)",
      "label": "בישיבת הבוקר, ואחר הצהריים מול המחשב",
      "b": "כששאלו אותך, אמרת שהכל טוב.",
      "s": "הגוף שלך לא הסכים."
    },
    {
      "unit": "מדד הפחד שלך, בשיא",
      "label": "19:40, כשאמא שלך התקשרה",
      "b": "הטלפון צלצל, לא ענית.",
      "s": "הפחד ענה במקומך."
    },
    {
      "unit": "דקות שבכית",
      "label": "07:30, כשהתקלחת",
      "b": "בכית לפני העבודה.",
      "s": "אחר כך היית רגוע כל היום."
    },
    {
      "unit": "פעמים שצחקת",
      "label": "9 צחוקים אמיתיים, 2 מנימוס",
      "b": "רוב הפעמים צחקת באמת.",
      "s": "בעבודה צחקת פעמיים מנימוס."
    },
    {
      "unit": "מילים שאמרת בארוחת שישי",
      "label": "ישבת שם מ־20:00 עד 21:30",
      "b": "ישבת שעה וחצי עם המשפחה.",
      "s": "ולא אמרת כלום."
    },
    {
      "unit": "שעות שהיית רגוע",
      "label": "ה־MPL שלך לא עלה כל היום",
      "b": "היה לך יום שקט.",
      "s": "מה שהראית ומה שהרגשת היו אותו דבר."
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
