/* WHEEP · day generator. Turns a name (and a date) into one day of data for the story.
   Deterministic: the same name on the same date always gets the same day, so a QR scan feels like a real sensor read.
   Needs shape.js (EMO) and motion.js (mHash). */

const GEN_KEYS = ['fear', 'joy', 'cry', 'release', 'shame', 'anger', 'press'];

function nameSeed(name, date) {
  let h = 7;
  for (const ch of String(name).trim() + '|' + date) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  return h / 997;
}

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

// six curated (fake) people: the data. Their words (unit, label, the two lines) are in copy.js → COPY.profiles.
// A visitor's name syncs to one of them; the day in feelings still varies per name.
// marks: [hour, k] (k: 0 round, 1 spiky, null = the day's k) · spans: [from, to]
const PROFILES = [
  { emo: 'anger', kOut: .28, kIn: .94, num: '4', count: true,
    marks: [[7.9, null], [8.3, null], [13.1, null], [19.6, 1]], spans: [] },
  { emo: 'press', kOut: .18, kIn: .9, num: '5:40', count: false,
    marks: [], spans: [[8.5, 11.5], [15, 17.7]] },
  { emo: 'fear', kOut: .3, kIn: .85, num: '131', count: false,
    marks: [[22.4, 1]], spans: [] },
  { emo: 'cry', kOut: .6, kIn: .06, num: '3', count: false,
    marks: [[21.2, 0]], spans: [[21.2, 21.25]] },
  { emo: 'joy', kOut: .45, kIn: .05, num: '14', count: true,
    marks: [[7.6, 0], [9.2, 1], [10.4, 0], [11.9, 0], [12.6, 0], [13.3, 1], [15.1, 0], [16.4, 0], [17.8, 0], [18.9, 0], [19.7, 0], [20.5, 1], [21.4, 0], [22.6, 0]],
    spans: [] },
  { emo: 'shame', kOut: .35, kIn: .78, num: '2', count: false,
    marks: [[11.5, 1], [20.3, 1]], spans: [] },
];

// the six men on the exhibition screen keep the same profile on every device (anyone else is synced by name)
const MOCK_NAMES = { 'איתי': 'anger', 'יובל': 'press', 'עידו': 'fear', 'יהונתן': 'cry', 'אבי': 'joy', 'ליאור': 'shame' };

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// one person's day. opts: { name, date (Date), top? } → everything story.js draws
function makeDay(opts) {
  const date = opts.date || new Date();
  const dstr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  const seed = nameSeed(opts.name, dstr);
  const top = opts.top || MOCK_NAMES[opts.name.trim()];
  const profile = top ? PROFILES.find(p => p.emo === top) : PROFILES[Math.floor(mHash(seed, 1, 1) * PROFILES.length)];
  const { segs, shares } = genMix(seed, profile.emo);
  const words = (typeof COPY !== 'undefined' && COPY.profiles[profile.emo]) || {};
  return { name: opts.name.trim(), day: WEEKDAYS[date.getDay()], date: dstr, seed, segs, shares, ...profile, ...words };
}

// sensor id shown while "detecting": stable per name
function sensorId(name) { return 'WHEEP-' + Math.floor(nameSeed(name, 'id') * 997 % 65535).toString(16).toUpperCase().padStart(4, '0'); }

if (typeof module !== 'undefined') module.exports = { makeDay, genMix, sensorId, nameSeed, GEN_KEYS, PROFILES, MOCK_NAMES };
