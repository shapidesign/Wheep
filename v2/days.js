/* WHEEP daily wrapped: the week's content + three stacked compositions.
   Shared by wrapped.html and the After Effects builder (ae/make.js → ae/build.jsx). */

/* Each day is one infographic: what the tracker measured, when, and how far the inside was from the outside.
   num/unit: the headline figure, always the feeling's own measure (never pulse): a count, a duration, the fear index (0–1000) or the MPL (masculinity pressure level, 0–1000) for holding in. count: the number counts up with the marks.
   marks: events on the 24h line [hour, k] (k: 0 = round, 1 = spiky; null = the day's k).
   spans: durations on the 24h line [from, to] in hours. label: what the line shows, in words.
   kOut/kIn: the big shape outside (what he showed) and inside (what was there); the gap is |kIn − kOut|.
   b/s: the closing two lines: the plain fact, then what the data adds. Dry, specific, no melodrama. */
const DAYS = [
  { day: 'ראשון', date: '22.11', emo: 'anger',   kOut: .30, kIn: .96, num: '3',    count: true,  unit: 'פעמים הרמת את הקול',
    marks: [[8.2, null], [8.7, null], [18.3, 1]], spans: [], label: 'שתיים בפקק, אחת בבית',
    b: 'בפקק זה היה על הנהגים.',   s: 'בבית זה היה על מי שהיה שם.' },
  { day: 'שני',   date: '23.11', emo: 'press',   kOut: .20, kIn: .88, num: '640',  count: true,  unit: 'מדד לחץ הגבריות שלך (MPL)',
    marks: [], spans: [[9, 11.2], [14, 16]], label: 'בבוקר בישיבה, אחר הצהריים מול המחשב',
    b: 'כשאלו אמרת שהכל טוב.',      s: 'הגוף לא הסכים.' },
  { day: 'שלישי', date: '24.11', emo: 'fear',    kOut: .34, kIn: .82, num: '790',  count: true,  unit: 'מדד הפחד שלך, בשיא',
    marks: [[19.67, 1]], spans: [], label: '19:40, שיחה נכנסת מאמא',
    b: 'הטלפון צלצל, לא ענית.',     s: 'הפחד ענה במקומך.' },
  { day: 'רביעי', date: '25.11', emo: 'cry',     kOut: .62, kIn: .08, num: '2',    count: false, unit: 'דקות שבכית',
    marks: [[7.5, 0]], spans: [[7.5, 7.6]], label: '07:30, במקלחת',
    b: 'בכית לפני העבודה.',         s: 'אחר כך היית רגוע כל היום.' },
  { day: 'חמישי', date: '26.11', emo: 'joy',     kOut: .50, kIn: .04, num: '11',   count: true,  unit: 'צחוקים',
    marks: [[8.5, 0], [10, 1], [11.5, 0], [13, 0], [13.4, 0], [15, 1], [17.5, 0], [19, 0], [20.2, 0], [21, 0], [22.5, 0]], spans: [],
    label: '9 אמיתיים, 2 מנומסים',
    b: 'רוב הצחוקים היו אמיתיים.',  s: 'השניים בעבודה היו מנומסים.' },
  { day: 'שישי',  date: '27.11', emo: 'shame',   kOut: .36, kIn: .74, num: '0',    count: false, unit: 'מילים בארוחת שישי',
    marks: [], spans: [[20, 21.5]], label: '20:00 עד 21:30, ליד השולחן',
    b: 'ישבת שעה וחצי ליד השולחן.', s: 'ולא אמרת כלום.' },
  { day: 'שבת',   date: '28.11', emo: 'release', kOut: .10, kIn: 0,   num: '24',   count: false, unit: 'שעות רגועות',
    marks: [], spans: [[0, 24]], label: 'כל היום, בלי קפיצות',
    b: 'יום שקט.',                   s: 'בחוץ ובפנים, אותה צורה.' },
];

// the week's words can be edited in copy.js / admin.html (COPY.week[i] overrides unit, label, b, s)
if (typeof COPY !== 'undefined') DAYS.forEach((d, i) => Object.assign(d, COPY.week[i] || {}));

// the weekly demo belongs to one (made-up) person; the live page uses the visitor's own name
const DEMO_NAME = 'אורי';

const SECOLO = ['Secolo19', 'Secolo20', 'Secolo21', 'Secolo22'];   // regular cuts only: the motion is the cut between them

// a poster's five colours, all read as one feeling
function palette(hex) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  return { m: hex, a: mix(hex, '#FFFFFF', .55), b: mix(hex, '#16130F', .5), k: '#16130F', w: '#FFFFFF' };
}

if (typeof module !== 'undefined') module.exports = { DAYS, palette, SECOLO, DEMO_NAME };
