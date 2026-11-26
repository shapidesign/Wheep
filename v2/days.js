/* WHEEP daily wrapped: the week's content + three stacked compositions.
   Shared by wrapped.html and the After Effects builder (ae/make.js → ae/build.jsx). */

/* Each day is one infographic: what the tracker measured, and when.
   num/unit: the headline figure. count: the number counts up with the marks.
   marks: events on the 24h line [hour, k] (k: 0 = round, 1 = spiky; null = the day's k).
   spans: durations on the 24h line [from, to] in hours. label: the time that matters.
   kOut/kIn: the big shape outside (what he showed) and inside (what was there). */
const DAYS = [
  { day: 'ראשון', date: '22.11', emo: 'anger',   kOut: .30, kIn: .96, num: '3',    count: true,  unit: 'צעקות על הפקק',
    marks: [[8.2, null], [8.7, null], [18.3, 1]], spans: [], label: '08:10 · 08:40 · 18:20', b: 'אחת מהן',          s: 'הייתה על עצמך.' },
  { day: 'שני',   date: '23.11', emo: 'press',   kOut: .20, kIn: .88, num: '4:12', count: false, unit: 'שעות של "הכל טוב"',
    marks: [], spans: [[9, 11.2], [14, 16]], label: '09:00 עד 11:12 · 14:00 עד 16:00', b: 'הכל טוב.',         s: 'הדופק אמר אחרת.' },
  { day: 'שלישי', date: '24.11', emo: 'fear',    kOut: .34, kIn: .82, num: '128',  count: false, unit: 'פעימות לדקה',
    marks: [[19.67, 1]], spans: [], label: '19:40 · אמא', b: 'אמא התקשרה.',      s: 'לא ענית.' },
  { day: 'רביעי', date: '25.11', emo: 'cry',     kOut: .62, kIn: .08, num: '2',    count: false, unit: 'דקות במקלחת',
    marks: [[7.5, 0]], spans: [[7.5, 7.6]], label: '07:30', b: 'בכית.',            s: 'המים הסתירו.' },
  { day: 'חמישי', date: '26.11', emo: 'joy',     kOut: .50, kIn: .04, num: '11',   count: true,  unit: 'צחוקים',
    marks: [[8.5, 0], [10, 1], [11.5, 0], [13, 0], [13.4, 0], [15, 1], [17.5, 0], [19, 0], [20.2, 0], [21, 0], [22.5, 0]], spans: [],
    label: '9 עגולים · 2 בשביל הבוס', b: '9 מהם אמיתיים.',   s: '2 בשביל הבוס.' },
  { day: 'שישי',  date: '27.11', emo: 'shame',   kOut: .36, kIn: .74, num: '0',    count: false, unit: 'מילים בארוחת שישי',
    marks: [], spans: [[20, 21.5]], label: '20:00 עד 21:30 · שקט', b: 'שתקת',             s: 'כשהיה צריך לדבר.' },
  { day: 'שבת',   date: '28.11', emo: 'release', kOut: .10, kIn: 0,   num: '1',    count: false, unit: 'יום שלם',
    marks: [], spans: [[0, 24]], label: '00:00 עד 24:00', b: 'בלי להעמיד פנים.', s: 'אותה צורה בפנים.' },
];

const SECOLO = ['Secolo19', 'Secolo20', 'Secolo21', 'Secolo22'];   // regular cuts only: the motion is the cut between them

// a poster's five colours, all read as one feeling
function palette(hex) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  return { m: hex, a: mix(hex, '#FFFFFF', .55), b: mix(hex, '#16130F', .5), k: '#16130F', w: '#FFFFFF' };
}

if (typeof module !== 'undefined') module.exports = { DAYS, palette, SECOLO };
