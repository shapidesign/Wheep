/* WHEEP v2 · one shape for every feeling.
   n = number of points (each emotion owns one, from 3).
   k = quality, 0 = very bouba … 1 = very kiki.
   The four Figma drawings (wheep-shapes, Group 6) are the keyframes:
   clover → soft square → rounded star → needle star. */

const EMO = {
  fear:    { n: 3, he: 'פחד',   en: 'fear',    c: '#C8FF3D' },
  joy:     { n: 4, he: 'הנאה',  en: 'joy',     c: '#FFD23F' },
  cry:     { n: 5, he: 'עצב',   en: 'sadness', c: '#3FC8F5' },   // key stays 'cry': sadness, measured by crying
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

// One continuous curve through the four drawings (Catmull-Rom), so a morph that crosses a keyframe doesn't stop there.
// (Smoothstep per segment eased each segment to a halt at every drawing: soft → sharp stalled twice on the way.)
// The keyframes themselves are exact; only the in-betweens changed.
const cr = (a, b, c, d, t) => .5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
function params(k) {
  k = Math.min(1, Math.max(0, k));
  let i = 0;
  while (i < KEYS.length - 2 && k > KEYS[i + 1].k) i++;
  const A = KEYS[Math.max(0, i - 1)], B = KEYS[i], C = KEYS[i + 1], D = KEYS[Math.min(KEYS.length - 1, i + 2)], t = (k - B.k) / (C.k - B.k);
  let w = B.w.map((_, j) => Math.max(0, cr(A.w[j], B.w[j], C.w[j], D.w[j], t)));
  const sum = w.reduce((x, y) => x + y, 0) || 1; w = w.map(x => x / sum);
  return { w, ri: Math.min(.92, Math.max(.04, cr(A.ri, B.ri, C.ri, D.ri, t))), p: Math.min(4, Math.max(.4, cr(A.p, B.p, C.p, D.p, t))) };
}

// radius (0..1) at angle a for n points
function radius(a, n, P) {
  const f = ((((a * n) / (2 * Math.PI)) % 1) + 1) % 1;   // 0 at a tip; wrapped, so an angle shifted below 0 (the hand cut) doesn't stretch the top lobe
  const d = Math.min(f, 1 - f);                         // 0 tip … .5 valley
  const v = Math.cos(Math.PI * d);                      // round tip, sharp valley
  const u = .5 + .5 * Math.cos(2 * Math.PI * d);        // round everywhere
  const t = 1 - 2 * d;                                  // sharp everywhere
  const g = P.w[0] * v + P.w[1] * u + P.w[2] * t;
  return P.ri + (1 - P.ri) * Math.pow(Math.max(g, 0), P.p);
}

/* Hand-cut (naive, after Matisse's cut-outs): every feeling has its own cut, the same everywhere it appears.
   Its lobes are not equal: each is a little longer or shorter, a little early or late around the circle,
   the whole is a bit lopsided and squashed, and some feelings have one flat side, as if cut along a straight edge.
   n and k still decide the shape (points, bouba … kiki); the cut only makes it look made by hand.
   SHAPE_HAND: 0 = the exact geometric drawing, 1 = fully naive; .5 (default) = a hand-made edge on the drawing. */
var SHAPE_HAND = .5;   // half the cut: hand-made, not naive
const _cuts = {};
function cutOf(n) {
  if (_cuts[n]) return _cuts[n];
  const h = j => { const x = Math.sin(n * 91.7 + j * 47.3) * 43758.5453; return x - Math.floor(x); };
  const c = {
    size: Array.from({ length: n }, (_, i) => 1 + (h(i + 1) - .5) * .62),    // each lobe its own length
    shift: Array.from({ length: n }, (_, i) => (h(i + 40) - .5) * .5),       // and a little early or late
    m1: { a: .06 + h(80) * .04, p: h(81) * 6.3 }, m2: { a: .04 + h(82) * .03, p: h(83) * 6.3 },   // lopsided, not round
    sx: 1 + (h(90) - .5) * .26, flat: h(91) > .45 ? .66 + h(92) * .14 : 0,  // squashed; maybe one straight cut
  };
  c.sy = 1 / c.sx;
  return (_cuts[n] = c);
}
const _sm = t => t * t * (3 - 2 * t);
// radius with the cut: lobe sizes and positions blend smoothly from one tip to the next
function radiusHand(a, n, P) {
  if (!SHAPE_HAND || n < 2) return radius(a, n, P);
  const c = cutOf(n), A = SHAPE_HAND, f = (a * n) / (2 * Math.PI), i0 = Math.floor(f), t = _sm(f - i0), i1 = i0 + 1;
  const sz = lerp(c.size[((i0 % n) + n) % n], c.size[((i1 % n) + n) % n], t), sh = lerp(c.shift[((i0 % n) + n) % n], c.shift[((i1 % n) + n) % n], t);
  const r = radius(a - A * sh * 2 * Math.PI / n, n, P) * (1 + A * (sz - 1));
  return r * (1 + A * (c.m1.a * Math.sin(a + c.m1.p) + c.m2.a * Math.sin(2 * a + c.m2.p)));
}

/* SVG path centred on (cx,cy), outer radius r, rotation rot (radians, 0 = a tip points up). */
// ponytail: 360 sampled points, plenty for print-size SVG; raise steps for huge posters
// flow (optional): { a, p } makes the outline soft and alive: a slow, low wave along the edge (amplitude a, phase p).
// Without it the shape is exactly the drawing.
function shapePath(n, k, r = 50, cx = 0, cy = 0, rot = 0, steps = 360, flow = null) {
  const P = params(k);
  let d = '';
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    // fractional n (logo morphing between feelings): blend the two neighbouring counts
    const n0 = Math.floor(n), f = n - n0;
    let rr = r * (f ? lerp(radiusHand(a, n0, P), radiusHand(a, n0 + 1, P), f) : radiusHand(a, n, P));
    if (flow) rr *= 1 + flow.a * (.6 * Math.sin(2 * a + flow.p) + .4 * Math.sin(3 * a - 1.3 * flow.p));
    // the cut's squash and straight edge, in the shape's own frame (so they turn with it)
    let lx = rr * Math.sin(a), ly = -rr * Math.cos(a);
    if (SHAPE_HAND) {
      const c = cutOf(f ? Math.round(n) : n);
      lx *= lerp(1, c.sx, SHAPE_HAND); ly *= lerp(1, c.sy, SHAPE_HAND);
      if (c.flat) ly = Math.min(ly, r * lerp(1.5, c.flat, SHAPE_HAND));
    }
    const cs = Math.cos(rot), sn = Math.sin(rot), x = cx + lx * cs - ly * sn, y = cy + lx * sn + ly * cs;
    d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + 'Z';
}

if (typeof module !== 'undefined') module.exports = { EMO, shapePath, params, radius, radiusHand, cutOf };
