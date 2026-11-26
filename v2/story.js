/* WHEEP · the wrapped story (web). One day, six scenes on a 34 s loop (1080×1350), each one a tight poster:
   0 intro (the name) · 1 the feeling that led the day · 2 the figure and when it happened
   3 outside vs inside · 4 the day in feelings · 5 the two lines.
   Every poster sits on a 6-column grid inside the same frame (progress, name/date/wheep, rules top and bottom).
   Type is sized to fill its measure, data spans the full width, and each poster has ONE shape layer:
   the hero (in front, ink with two trailing bands) or one or two background shapes (tone on tone, behind). Never both.
   Shapes morph (k), turn and breathe; Secolo cuts between 19–22 on the beat; every Greta line breathes letter by letter.
   Timeline lives in story-core.js (SCENES, S_PACE, sLetter); words come from copy.js.
   Needs shape.js, motion.js, days.js (palette, SECOLO), copy.js, story-core.js. */

const SW = 1080, SH = 1350, SNS = 'http://www.w3.org/2000/svg';
const LAYOUT = {};   // kept for old callers: the three layouts were replaced by the one tight grid

function createStory(svg, day, opts = {}) {   // opts.bleed: the ground runs past the frame to the real screen edge
  const e = EMO[day.emo], n = e.n, P = palette(e.c), U = COPY.ui;
  if (COPY.motion) Object.assign(S_GRETA, COPY.motion);
  const W = SW, H = SH, M = 56, G = 16, COL = (W - 2 * M - 5 * G) / 6, MEAS = W - 2 * M;
  const X = c => W - M - c * (COL + G);                  // right edge of column c (RTL: column 0 on the right)
  const TOP = M + 52, BOT = H - M - 44;                   // the live area between the two rules
  const B = opts.bleed ? 3000 : 0;
  const CUT = .4, IN = .7, STAG = .09;
  const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
  const osc = (t, a, b, per, ph = 0) => a + (b - a) * (.5 - .5 * Math.cos(2 * Math.PI * t / per + ph));
  const clampK = k => Math.max(0, Math.min(1, k));
  const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) + (parseInt(b.substr(i, 2), 16) - parseInt(a.substr(i, 2), 16)) * t).toString(16).padStart(2, '0')).join('');
  const hh = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round(h % 1 * 60)).padStart(2, '0');
  const feel = k => (COPY.feelings || {})[k] || EMO[k].he;

  const el = (tag, a = {}, txt) => {
    const x = document.createElementNS(SNS, tag);
    for (const k in a) x.setAttribute(k, a[k]);
    if (txt != null) x.textContent = txt;
    return x;
  };

  svg.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${day.name}, ${day.day} ${day.date}. ${feel(day.emo)}: ${day.num} ${day.unit}. ${day.b} ${day.s}`);
  svg.textContent = '';
  if (opts.bleed) svg.style.overflow = 'visible';

  // ——— building blocks. Each scene is a group with its own updaters f(u, T) and build-in elements. ———
  let S;   // the scene being built: { g, dyn: [], ins: [] }
  const live = f => S.dyn.push(f);
  const add = (node, i) => { S.g.append(node); if (i != null) { node.dataset.i = i; S.ins.push(node); } return node; };

  // text: right-aligned by default (RTL start); anchor 'end' = left-aligned
  const T = (txt, x, y, size, o = {}) => add(el('text', { x, y, 'font-size': size, direction: 'rtl', 'text-anchor': o.anchor || 'start',
    fill: o.fill, 'font-family': o.font || 'Greta, GretaHL', style: `font-variation-settings:'wght' ${o.w ?? 40}` }, txt), o.i ?? 0);
  // Secolo: every letter is its own tspan on its own cut (19–22), and each one jumps to another cut on the beat,
  // so a word is always a mix of the four. Tracked -20 (−0.02em). setText() swaps the letters (count-ups).
  const TRACK = -.02;
  const Sx = (txt, x, y, size, o = {}) => {
    const t = T('', x, y, size, { ...o, font: SECOLO[0] });
    t.style.letterSpacing = TRACK + 'em';
    const seed = o.seed ?? 0;
    t._cut = seed; t._L = [];
    t._set = str => {
      if (str === t._str) return; t._str = str;
      const chars = [...String(str)];
      while (t._L.length < chars.length) { const s = el('tspan'); t.append(s); t._L.push(s); }
      while (t._L.length > chars.length) t._L.pop().remove();
      chars.forEach((ch, i) => { t._L[i].textContent = ch; });
    };
    t._set(txt);
    live((u, TT) => { const b = Math.floor(TT / CUT); t._L.forEach((s, i) => s.setAttribute('font-family', SECOLO[(b + Math.floor(sHash(i + seed * 7, 3.1) * 4) + i) % 4])); });
    return t;
  };
  const setText = (t, str) => t._set ? t._set(str) : (t.textContent = str);
  const fit = (t, width, max = 1e4) => {
    const f0 = +t.getAttribute('font-size');
    let l = 0;
    if (t._L) {   // Secolo: each letter at its widest cut, so no mix can overflow
      const w = t._L.map(() => 0);
      SECOLO.forEach(c => t._L.forEach((s, i) => { s.setAttribute('font-family', c); w[i] = Math.max(w[i], s.getComputedTextLength()); }));
      l = w.reduce((a, b) => a + b, 0);
    } else { t.style.fontVariationSettings = "'wght' 100"; l = t.getComputedTextLength(); }   // Greta: measured at its heaviest
    const f = Math.min(max, f0 * width / (l || 1)); t.setAttribute('font-size', f.toFixed(1)); return f;
  };
  const shrink = (t, width) => { if (t.getComputedTextLength() > width) fit(t, width); };
  const hang = (t, top, f) => t.setAttribute('y', (top + f * .74).toFixed(1));   // baseline from a top edge (cap height ≈ .74)
  // Greta breathes letter by letter (sLetter); base may follow the scene (the swap). reveal: letters write in from that second.
  let seedN = 0;
  const breathe = (t, base, amp = 22, reveal) => {
    const chars = [...t.textContent]; t.textContent = '';
    const seed = 1.37 * seedN++, L = chars.map(ch => { const s = el('tspan', {}, ch); t.append(s); return { s, fv: '', o: '' }; });
    const st = Math.min(.08, 1.6 / Math.max(1, L.length));
    live((u, TT) => {
      const b = typeof base === 'function' ? base(u) : base;
      L.forEach((l, i) => {
        const a = sLetter(TT, i, b, amp, seed), fv = `'wght' ${Math.round(a[0])}, 'wdth' ${Math.round(a[1])}, 'OPTI' ${Math.round(a[2] / 2) * 2}`;
        if (fv !== l.fv) { l.fv = fv; l.s.style.fontVariationSettings = fv; }
        if (reveal != null) { const o = ease((u - reveal - i * st) / .35).toFixed(2); if (o !== l.o) { l.o = o; l.s.setAttribute('opacity', o); } }
      });
    });
    return t;
  };
  const rule = (y, c, i = 0, x1 = M, x2 = W - M) => add(el('rect', { x: x1, y, width: x2 - x1, height: 2, fill: c }), i);

  // the hero: core + two bands trailing it in time (k, turn, size). kf(u) = quality at scene time u.
  const hero = (kf, r, cx, cy, o = {}) => {
    const mono = o.mono, fills = mono ? [o.fill] : [o.b || P.b, o.a || P.a, o.fill || P.k], sc = mono ? [1] : [1.16, 1.08, 1], lag = mono ? [0] : [.3, .15, 0];
    const paths = fills.map(f => add(el('path', { fill: f })));
    const dir = o.dir || 1, grow = o.grow ?? .7;
    live((u, TT) => paths.forEach((q, j) => {
      const v = u - lag[j] - (o.delay || 0), g = grow + (1 - grow) * sFlow(v / .9), breath = 1 + .025 * Math.sin(2 * Math.PI * TT / 3.2);
      q.setAttribute('d', shapePath(n, clampK(kf(v)), r * sc[j] * g * breath, cx, cy, dir * v * .12, o.steps || 240));
    }));
  };
  // background shapes: tone on tone, right above the ground, under the frame and the type. Only on posters with no hero.
  const ghost = (kf, r, cx, cy, ground) => {
    const q = el('path', { fill: ground === P.k ? '#26221C' : mixHex(P.m, P.k, .14) });
    S.g.insertBefore(q, S.g.children[1]);
    live((u, TT) => q.setAttribute('d', shapePath(n, clampK(kf(u, TT)), r * (.85 + .15 * sFlow(u / 1.4)), cx, cy, -TT * .05, 200)));
  };
  // a data mark: pops in at `at` (small overshoot), then keeps morphing
  const mark = (nn, kf, r, cx, cy, fill, at) => {
    const q = add(el('path', { fill }));
    live(u => { const s = u < at ? 0 : sBack((u - at) / .45); q.setAttribute('d', s > .01 ? shapePath(nn, clampK(kf(u)), r * s, cx, cy, u * .3, 120) : ''); });
  };
  const countUp = (t, to, at, dur, suffix = '') => live(u => setText(t, Math.round(to * sOut((u - at) / dur)) + suffix));

  // the frame: a data sheet. Same edges on every poster, so the middle can be loud.
  const frame = (s, ground) => {
    const fg = ground === P.k ? P.w : P.k;
    add(el('rect', { x: -B, y: -B, width: W + 2 * B, height: H + 2 * B, fill: ground }));
    for (let i = 0; i < 6; i++) {
      const w = (MEAS - 5 * 8) / 6, x = W - M - (i + 1) * w - i * 8, a = SCENES[i], b = SCENES[i + 1];
      add(el('rect', { x, y: M - 24, width: w, height: 4, fill: fg, opacity: .25 }));
      const f = add(el('rect', { x, y: M - 24, width: 0, height: 4, fill: fg }));
      live((u, TT) => { const v = w * sClamp((TT - a) / (b - a)); f.setAttribute('x', x + w - v); f.setAttribute('width', v); });
    }
    shrink(T(day.name, W - M, M + 30, 26, { fill: fg, w: 80 }), X(2) - X(4));
    T(`${day.day} · ${day.date}`, X(2), M + 30, 26, { fill: fg, w: 30 });
    hero(u => osc(u, 0, 1, 4.8), 13, M + 13, M + 21, { mono: true, fill: fg, grow: 1, steps: 120 });
    T('wheep', M + 34, M + 30, 28, { fill: fg, w: 90, anchor: 'start' }).setAttribute('direction', 'ltr');
    rule(M + 52, fg);
    rule(BOT, fg);
    return fg;
  };
  const foot = (fg, txt) => shrink(T(txt, W - M, H - M - 6, 26, { fill: fg, w: 30 }), MEAS);
  const title = (fg, txt) => shrink(breathe(T(txt, W - M, TOP + 54, 34, { fill: fg, i: 1 }), 60), MEAS);

  const POSTERS = [
    // 0 · intro (hero): the name fills the measure and writes itself in from hairline; the shape blooms off the bottom
    () => {
      const fg = frame(0, P.k);
      hero(u => osc(u, 0, .34, 4.4), 560, W * .32, H * .92, { fill: P.w, a: '#3a342c', b: '#24211C', grow: .4 });
      const nm = T(day.name, W - M, 0, 300, { fill: fg, i: 1 }), f = fit(nm, MEAS, 420); hang(nm, TOP + 48, f);
      breathe(nm, u => 6 + 94 * sFlow(u / 1.6), 10, .2);
      shrink(breathe(T(U.intro, W - M, TOP + 48 + f * .74 + 110, 76, { fill: fg, i: 2 }), 20), MEAS);
      foot(fg, 'סיכום יומי');
    },
    // 1 · the feeling (hero): the word is the poster, pulled tight from wide tracking; the shape turns to the day's outside
    () => {
      const fg = frame(1, P.m);
      hero(u => u < 1.4 ? sLerp(.34, day.kOut, sFlow(u / 1.4)) : osc(u - 1.4, day.kOut, day.kOut + (day.kIn - day.kOut) * .35, 3), 500, W * .72, H + 60);
      title(fg, U.led);
      const fw = Sx(feel(day.emo), W - M, 0, 400, { fill: fg, i: 2 }), f = fit(fw, MEAS, 640); hang(fw, TOP + 96, f);
      live(u => fw.style.letterSpacing = (TRACK + .3 * (1 - sOut(u / 1.6))).toFixed(3) + 'em');   // pulls tight to −20
      const ry = TOP + 96 + f * .74 + 48;
      rule(ry, fg, 3);
      const pc = Sx('0%', M, ry + 230, 260, { fill: fg, anchor: 'end', i: 4, seed: 1 });
      countUp(pc, day.shares[0].pct, .4, 1.4, '%');
      shrink(breathe(T(U.share.replace(/\{pct\}%\s?/, ''), M, ry + 290, 34, { fill: fg, anchor: 'end', i: 5 }), 50), MEAS / 2);
      // no footer: the hero bleeds through the bottom right, and the title already says it
    },
    // 2 · measured (background): the figure takes four columns; the events pop onto a full-width 24h line
    () => {
      const fg = frame(2, P.m), w4 = MEAS - 2 * (COL + G);
      ghost(u => osc(u, day.kOut, day.kIn, 2.8), 380, 40, TOP + 300, P.m);
      ghost((u, TT) => osc(TT, day.kIn, day.kOut, 7), 360, W * .66, BOT - 330, P.m);
      title(fg, U.measured);
      const nu = Sx(day.num, W - M, 0, 800, { fill: fg, i: 2 }), nf = fit(nu, w4, 820); hang(nu, TOP + 100, nf);
      if (day.count && /^\d+$/.test(day.num)) countUp(nu, +day.num, 0, 1.8);
      const u0 = T(day.unit, W - M, TOP + 100 + nf * .74 + 110, 80, { fill: fg, i: 3 });
      fit(u0, w4, 80); breathe(u0, 85, 14);
      const y = BOT - 150, hx = h => W - M - (h / 24) * MEAS;   // RTL: 00 on the right
      const ax = rule(y, fg, 4);
      live(u => { const v = MEAS * sOut((u - .3) / 1.2); ax.setAttribute('x', W - M - v); ax.setAttribute('width', v); });
      for (let h = 0; h <= 24; h++) add(el('rect', { x: hx(h) - 1, y: y - (h % 6 ? 10 : 22), width: 2, height: h % 6 ? 10 : 22, fill: fg }), 4 + h * .1);
      for (let h = 0; h <= 24; h += 6) T(String(h).padStart(2, '0'), hx(h), y + 40, 24, { fill: fg, w: 40, anchor: 'middle', i: 4 + h * .1 });
      day.spans.forEach(([a, b], i) => {
        const r = add(el('rect', { x: hx(a), y: y - 60, width: 0, height: 60, fill: P.k }));
        live(u => { const v = Math.max(6, hx(a) - hx(b)) * sOut((u - 1.4 - i * .3) / .8); r.setAttribute('x', hx(a) - v); r.setAttribute('width', v); });
      });
      day.marks.forEach(([h, k], i) => mark(n, u => osc(u + i, day.kOut, k ?? day.kIn, 2.2), 28, hx(h), y - 42, P.k, 1.4 + i * Math.min(.25, 1.2 / day.marks.length)));
      shrink(breathe(T(day.label, W - M, BOT - 40, 34, { fill: fg, i: 6 }), 40), MEAS);
      foot(fg, U.when);
    },
    // 3 · outside vs inside (hero pair): the outside holds, the inside turns into what it was; the gap opens on the scale
    () => {
      const fg = frame(3, P.m), gap = Math.round(Math.abs(day.kIn - day.kOut) * 100), turn = u => sFlow((u - 1) / 1.6);
      const kNow = u => sLerp(day.kOut, day.kIn, turn(u));
      title(fg, U.outIn);
      const gp = Sx('0%', M, TOP + 330, 300, { fill: fg, anchor: 'end', i: 2 });
      live(u => setText(gp, Math.round(gap * turn(u)) + '%'));
      shrink(breathe(T(U.gap.replace(/:?\s*\{gap\}%/, ''), W - M, TOP + 330, 72, { fill: fg, i: 2 }), 85, 14), MEAS / 2);
      rule(TOP + 380, fg, 3);
      const cy = TOP + 640, r = 230;
      add(el('rect', { x: W / 2 - 1, y: TOP + 380, width: 2, height: 520, fill: fg }), 3);
      hero(u => day.kOut + .04 * Math.sin(u * 2), r, W * .75, cy);
      hero(kNow, r, W * .25, cy, { dir: -1, delay: .15 });
      breathe(T(U.outside, W - M, TOP + 890, 34, { fill: fg, i: 4 }), 70);
      breathe(T(U.inside, W / 2 - G, TOP + 890, 34, { fill: fg, i: 5 }), 70);
      rule(TOP + 900, fg, 3);
      const y = BOT - 90, sx = k => W - M - k * MEAS;   // soft (right) → sharp (left)
      const blk = add(el('rect', { y: y - 24, height: 48, fill: P.k }));
      live(u => { const a = sx(day.kOut), b = sx(kNow(u)); blk.setAttribute('x', Math.min(a, b)); blk.setAttribute('width', Math.abs(a - b)); });
      rule(y - 1, fg, 6);
      M_KEYS.forEach((k, i) => mark(n, () => k, 22, sx(k) + (k === 0 ? -22 : k === 1 ? 22 : 0), y + 56, fg, .5 + i * .12));
      const now = add(el('path', { fill: P.k }));
      live(u => now.setAttribute('d', shapePath(n, kNow(u), 34, sx(kNow(u)), y - 60, u * .6, 120)));
      T(U.soft, W - M, y - 40, 26, { fill: fg, w: 60, i: 6 });
      T(U.sharp, M, y - 40, 26, { fill: fg, w: 60, anchor: 'end', i: 6 });
      foot(fg, day.kIn > day.kOut ? U.meaningUp : U.meaningDown);
    },
    // 4 · the day in feelings (background): the strip opens, each stretch carries its feeling's shape; then the top three
    () => {
      const fg = frame(4, P.k);
      ghost((u, TT) => osc(TT, .2, .9, 9), 420, W * .42, BOT - 40, P.k);
      title(fg, U.feelings);
      const y = TOP + 90, h = 460, hx = t => W - M - ((t - 7) / 16.5) * MEAS;
      day.segs.forEach((s, i) => {
        const r = add(el('rect', { y, height: h, fill: EMO[s.emo].c })), at = .3 + (s.from - 7) / 16.5 * 1.4, w = hx(s.from) - hx(s.to) - 3;
        live(u => { const v = Math.max(0, w * sOut((u - at) / .5)); r.setAttribute('x', hx(s.from) - v); r.setAttribute('width', v); });
        if (w > 60) mark(EMO[s.emo].n, u => osc(u + i, .1, .9, 3.2), Math.min(w * .3, 40), hx(s.from) - w / 2, y + h - 60, P.k, at + .4);
      });
      [7, 12, 18, 23.5].forEach(t => T(hh(t), hx(t), y + h + 34, 22, { fill: fg, w: 40, anchor: t === 7 ? 'start' : t === 23.5 ? 'end' : 'middle', i: 3 }));
      let ry = y + h + 64;
      day.shares.slice(0, 3).forEach((s, i) => {
        rule(ry, fg, 18 + i * 3);
        const rh = i ? (BOT - y - h - 64 - 240) / 2 : 240, at = 1.7 + i * .25;
        mark(EMO[s.emo].n, u => osc(u, .05, .95, 3.6, i * 2), rh * .3, W - M - rh * .3, ry + rh / 2 + 4, EMO[s.emo].c, at);
        Sx(feel(s.emo), W - M - rh * .7, ry + rh * .66, rh * .5, { fill: fg, i: 18 + i * 3, seed: i });
        countUp(Sx('0%', M, ry + rh * .7, rh * .62, { fill: EMO[s.emo].c, anchor: 'end', i: 18 + i * 3, seed: i + 1 }), s.pct, at, 1, '%');
        ry += rh;
      });
      foot(fg, 'מ־07:00 עד 23:30');
    },
    // 5 · the two lines (background): each line as big as the measure allows, they write in, then swap weight
    () => {
      const fg = frame(5, P.m);
      ghost(u => sLerp(day.kIn, .34, sFlow((u - 3) / 2)), 520, W * .3, BOT + 40, P.m);
      ghost((u, TT) => osc(TT, day.kOut, day.kIn, 9), 300, W - 20, TOP + 120, P.m);
      title(fg, copyFill(U.summaryTitle, { name: day.name }));
      const halves = s => { const w = s.split(' '), h = Math.ceil(w.length / 2); return w.length > 3 ? [w.slice(0, h).join(' '), w.slice(h).join(' ')] : [s]; };
      const swap = u => sFlow((u - 3.4) / 1.2);
      let y = TOP + 140;
      [[day.b, u => sLerp(100, 8, swap(u)), .2], [day.s, u => sLerp(8, 100, swap(u)), 1.4]].forEach(([s, base, rev], k) => {
        halves(s).forEach((line, j) => {
          const t = T(line, W - M, 0, 120, { fill: fg }), f = fit(t, MEAS, 230);
          hang(t, y, f); y += f; breathe(t, base, 8, rev + j * .5);
        });
        y += 40;
        if (k === 0) { rule(y - 16, fg, 12); y += 30; }
      });
      foot(fg, `${day.name} · ${day.day} ${day.date}`);
    },
  ];

  // built on the first draw, once the fonts are in (every fit measures the real faces)
  let scenes = null;
  function build() {
    scenes = POSTERS.map(make => {
      S = { g: el('g'), dyn: [], ins: [] };
      svg.append(S.g); make();
      S.g.style.display = 'none';
      return S;
    });
  }

  let shown = -1;
  function draw(TT) {
    if (!scenes) build();
    TT = sWrap(TT);
    let i = 0; while (i < 5 && TT >= SCENES[i + 1]) i++;
    if (i !== shown) { if (shown >= 0) scenes[shown].g.style.display = 'none'; scenes[i].g.style.display = ''; shown = i; }
    const sc = scenes[i], u = Math.max(0, TT - SCENES[i]);   // u: seconds into the scene; a slower S_PACE only holds each poster longer
    sc.ins.forEach(x => {
      const v = ease((u - +x.dataset.i * STAG) / IN);
      x.setAttribute('opacity', v.toFixed(3));
      x.setAttribute('transform', `translate(0 ${((1 - v) * 28).toFixed(1)})`);
    });
    sc.dyn.forEach(f => f(u, TT));
  }
  return { draw, day };
}

if (typeof module !== 'undefined') module.exports = { createStory, LAYOUT };
