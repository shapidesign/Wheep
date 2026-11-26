/* WHEEP v2 · one shape for every feeling.
   n = number of points (each emotion owns one, from 3).
   k = quality, 0 = very bouba … 1 = very kiki.
   The four Figma drawings (wheep-shapes, Group 6) are the keyframes:
   clover → soft square → rounded star → needle star. */

const EMO = {
  fear:    { n: 3, he: 'פחד',   en: 'fear',    c: '#C8FF3D' },
  joy:     { n: 4, he: 'הנאה',  en: 'joy',     c: '#FFD23F' },
  cry:     { n: 5, he: 'בכי',   en: 'tears',   c: '#3FC8F5' },
  release: { n: 6, he: 'שחרור', en: 'release', c: '#3DDC97' },
  shame:   { n: 7, he: 'בושה',  en: 'shame',   c: '#FF9F1C' },
  anger:   { n: 8, he: 'כעס',   en: 'anger',   c: '#FF5A36' },
  press:   { n: 9, he: 'הדחקה', en: 'holding in', c: '#9B6BFF' },
};

// keyframes: wave mix [v = round tip/sharp valley, u = round both, t = sharp both], inner radius, exponent
const KEYS = [
  { k: 0,    w: [1, 0, 0], ri: .42, p: .55 },  // clover
  { k: .34,  w: [0, 1, 0], ri: .74, p: 1.1 },  // soft square
  { k: .67,  w: [0, 1, 0], ri: .24, p: 3.2 },  // rounded star
  { k: 1,    w: [0, 0, 1], ri: .07, p: 2.6 },  // needle star
];

const lerp = (a, b, t) => a + (b - a) * t;

function params(k) {
  k = Math.min(1, Math.max(0, k));
  let i = 0;
  while (i < KEYS.length - 2 && k > KEYS[i + 1].k) i++;
  const A = KEYS[i], B = KEYS[i + 1], t = (k - A.k) / (B.k - A.k);
  const s = t * t * (3 - 2 * t); // smoothstep so the morph eases between drawings
  return { w: A.w.map((x, j) => lerp(x, B.w[j], s)), ri: lerp(A.ri, B.ri, s), p: lerp(A.p, B.p, s) };
}

// radius (0..1) at angle a for n points
function radius(a, n, P) {
  const f = ((a * n) / (2 * Math.PI)) % 1;            // 0 at a tip
  const d = Math.min(f, 1 - f);                         // 0 tip … .5 valley
  const v = Math.cos(Math.PI * d);                      // round tip, sharp valley
  const u = .5 + .5 * Math.cos(2 * Math.PI * d);        // round everywhere
  const t = 1 - 2 * d;                                  // sharp everywhere
  const g = P.w[0] * v + P.w[1] * u + P.w[2] * t;
  return P.ri + (1 - P.ri) * Math.pow(Math.max(g, 0), P.p);
}

/* SVG path centred on (cx,cy), outer radius r, rotation rot (radians, 0 = a tip points up). */
// ponytail: 360 sampled points, plenty for print-size SVG; raise steps for huge posters
function shapePath(n, k, r = 50, cx = 0, cy = 0, rot = 0, steps = 360) {
  const P = params(k);
  let d = '';
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    // fractional n (logo morphing between feelings): blend the two neighbouring counts
    const n0 = Math.floor(n), f = n - n0;
    const rr = r * (f ? lerp(radius(a, n0, P), radius(a, n0 + 1, P), f) : radius(a, n, P));
    const x = cx + rr * Math.sin(a + rot), y = cy - rr * Math.cos(a + rot);
    d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + 'Z';
}

if (typeof module !== 'undefined') module.exports = { EMO, shapePath, params, radius };
