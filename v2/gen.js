/* WHEEP · day generator. Turns a name (and a date) into one day of data for the story.
   Deterministic: the same name on the same date always gets the same day, so a QR scan feels like a real sensor read.
   Needs shape.js (EMO) and motion.js (mHash). */

const GEN_KEYS = ['fear', 'joy', 'cry', 'release', 'shame', 'anger', 'press'];

function nameSeed(name, date) {
  let h = 7;
  for (const ch of String(name).trim() + '|' + date) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  return h / 997;
}
const hh = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return String(H).padStart(2, '0') + ':' + String(M).padStart(2, '0'); };

// the day in feelings: 7–10 stretches from 07:00 to 23:30; the top feeling holds the most time
function genMix(seed, top) {
  const r = i => mHash(seed, 900, i);
  const n = 7 + Math.floor(r(0) * 4), others = GEN_KEYS.filter(k => k !== top);
  const cuts = [7];
  let w = []; for (let i = 0; i < n; i++) w.push(.5 + r(i + 1) * 1.5);
  const sum = w.reduce((a, b) => a + b, 0);
  w.forEach(x => cuts.push(cuts[cuts.length - 1] + x / sum * 16.5));
  const segs = [];
  for (let i = 0; i < n; i++) segs.push({ from: cuts[i], to: cuts[i + 1], emo: r(i + 20) < .42 ? top : others[Math.floor(r(i + 40) * others.length)] });
  // make sure the top feeling really leads: hand it the longest stretches until it does
  const total = e => segs.filter(s => s.emo === e).reduce((a, s) => a + s.to - s.from, 0);
  const leader = () => GEN_KEYS.reduce((b, e) => total(e) > total(b) ? e : b, top);
  for (const s of [...segs].sort((a, b) => (b.to - b.from) - (a.to - a.from))) { if (leader() === top) break; s.emo = top; }
  const shares = GEN_KEYS.map(e => ({ emo: e, pct: Math.round(total(e) / 16.5 * 100) })).filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct);
  return { segs, shares };
}

// per feeling: the figure, its unit, what the 24h line shows, and two dry lines. r(i) is this day's dice.
const GEN_TEMPLATES = {
  anger: r => {
    const n = 1 + Math.floor(r(1) * 4), marks = [];
    for (let i = 0; i < n; i++) marks.push([7.5 + r(10 + i) * 15, i === n - 1 ? 1 : null]);
    marks.sort((a, b) => a[0] - b[0]);
    return { num: String(n), count: true, unit: n === 1 ? 'פעם הרמת את הקול' : 'פעמים הרמת את הקול', marks, spans: [],
      label: marks.map(m => hh(m[0])).join(' · '), b: n === 1 ? 'פעם אחת, ולא בכוונה.' : 'רובן היו על דברים קטנים.', s: 'האחרונה הייתה הכי חזקה.', kOut: .3, kIn: .95 };
  },
  press: r => {
    const a = 8.5 + r(1) * 3, b = a + 1 + r(2) * 2, c = 13.5 + r(3) * 3, d = c + .8 + r(4) * 2;
    const tot = (b - a) + (d - c), H = Math.floor(tot), M = Math.round((tot - H) * 60);
    return { num: `${H}:${String(M).padStart(2, '0')}`, count: false, unit: 'שעות של דופק גבוה במנוחה', marks: [], spans: [[a, b], [c, d]],
      label: `${hh(a)} עד ${hh(b)} · ${hh(c)} עד ${hh(d)}`, b: 'כשאלו אמרת שהכל טוב.', s: 'הגוף לא הסכים.', kOut: .2, kIn: .88 };
  },
  fear: r => {
    const t = 9 + r(1) * 12, bpm = 112 + Math.floor(r(2) * 26), m = 3 + Math.floor(r(3) * 12);
    return { num: String(bpm), count: false, unit: 'דופק שיא', marks: [[t, 1]], spans: [], label: hh(t),
      b: `משהו הקפיץ אותך ב־${hh(t)}.`, s: `אחרי ${m} דקות הדופק ירד.`, kOut: .34, kIn: .82 };
  },
  cry: r => {
    const t = 6.5 + r(1) * 16, m = 1 + Math.floor(r(2) * 6);
    return { num: String(m), count: false, unit: m === 1 ? 'דקה של בכי' : 'דקות של בכי', marks: [[t, 0]], spans: [[t, t + m / 60]], label: hh(t),
      b: m === 1 ? 'בכית דקה אחת.' : `בכית ${m} דקות.`, s: 'אחר כך הדופק נרגע.', kOut: .62, kIn: .08 };
  },
  joy: r => {
    const n = 5 + Math.floor(r(1) * 9), polite = 1 + Math.floor(r(2) * 3), marks = [];
    for (let i = 0; i < n; i++) marks.push([7.5 + r(10 + i) * 15.5, i < polite ? 1 : 0]);
    marks.sort((a, b) => a[0] - b[0]);
    return { num: String(n), count: true, unit: 'צחוקים', marks, spans: [], label: `${n - polite} אמיתיים · ${polite} מנומסים`,
      b: 'רוב הצחוקים היו אמיתיים.', s: polite === 1 ? 'אחד היה מנומס.' : `${polite} היו מנומסים.`, kOut: .5, kIn: .04 };
  },
  shame: r => {
    const n = 1 + Math.floor(r(1) * 3), t = 12 + r(2) * 9;
    return { num: String(n), count: false, unit: n === 1 ? 'פעם שתקת כשרצית לדבר' : 'פעמים שתקת כשרצית לדבר', marks: [[t, 1]], spans: [], label: hh(t),
      b: 'היה לך מה להגיד.', s: 'בחרת לשתוק.', kOut: .36, kIn: .74 };
  },
  release: r => {
    const a = 9 + r(1) * 4, h = 3 + Math.floor(r(2) * 6);
    return { num: String(h), count: false, unit: 'שעות רגועות', marks: [], spans: [[a, a + h]], label: `${hh(a)} עד ${hh(a + h)}`,
      b: 'היה שקט.', s: 'בחוץ ובפנים, אותה צורה.', kOut: .1, kIn: 0 };
  },
};

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// one person's day. opts: { name, date (Date), top? } → everything story.js draws
function makeDay(opts) {
  const date = opts.date || new Date();
  const dstr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  const seed = nameSeed(opts.name, dstr);
  const top = opts.top || GEN_KEYS[Math.floor(mHash(seed, 1, 1) * GEN_KEYS.length)];
  const data = GEN_TEMPLATES[top](i => mHash(seed, 50, i));
  const { segs, shares } = genMix(seed, top);
  return { name: opts.name.trim(), day: WEEKDAYS[date.getDay()], date: dstr, emo: top, seed, segs, shares, ...data };
}

// sensor id shown while "detecting": stable per name
function sensorId(name) { return 'WHEEP-' + Math.floor(nameSeed(name, 'id') * 997 % 65535).toString(16).toUpperCase().padStart(4, '0'); }

if (typeof module !== 'undefined') module.exports = { makeDay, genMix, sensorId, nameSeed, GEN_KEYS };
