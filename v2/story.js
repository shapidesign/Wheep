/* WHEEP · the wrapped story (web). One day as eleven stories (1080×1350), like a Wrapped:
   0 intro: the name, "ככה עבר עליך היום", the shape   1 the words you said   2 guess: which feeling led your day?
   3 the minutes of that feeling   4 the day in three chapters   5 the top five moments (ink)
   6 your daily portrait: the day's stretches as shapes, packed   7 your type (outside × inside)
   8 how are your friends?   9 tomorrow: one thing to keep doing   10 the share card (also the picture the share button sends).
   One tight grid (6 columns), type sized to fill its measure, one shape layer per poster (shapes have no bands),
   Secolo mixed letter by letter, Greta breathing letter by letter. Timeline in story-core.js; words in copy.js.
   Needs shape.js, motion.js, days.js (palette, SECOLO), copy.js, story-core.js; gen.js for the friends. */

const SW = 1080, SH = 1350, SNS = 'http://www.w3.org/2000/svg';
const LAYOUT = {};   // kept for old callers
// the seven feelings a guess can offer (gen.js has the same list; story.js must also run without it)
const GUESS_KEYS = ['fear', 'joy', 'cry', 'release', 'shame', 'anger', 'press'];

// four types on two axes: what showed (outside) and what was there (inside), soft or sharp
const WHEEP_TYPES = {
  ss: { name: 'מים שקטים', line: 'רך בחוץ, רך בפנים. מה שראו זה מה שהיה.' },
  sh: { name: 'סיר לחץ', line: 'בחוץ נראית רגוע. בפנים זה רתח.' },
  hs: { name: 'קיפוד', line: 'בחוץ היית חד. בפנים היה רך יותר.' },
  hh: { name: 'סערה גלויה', line: 'חד בחוץ וחד בפנים. לא הסתרת.' },
};
// paper grain: one 256×256 tile of grey noise, made once per page and shared by every story
let GRAIN_URL = null;
function grainTile() {
  if (GRAIN_URL) return GRAIN_URL;
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d');
  // soft mottling: a coarse random grid drawn up with smoothing, tiled 3×3 so the edges meet
  const m = document.createElement('canvas'); m.width = m.height = 24;
  const mx = m.getContext('2d'), mi = mx.createImageData(24, 24);
  for (let i = 0; i < mi.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 46; mi.data[i] = mi.data[i + 1] = mi.data[i + 2] = v; mi.data[i + 3] = 255; }
  mx.putImageData(mi, 0, 0);
  x.imageSmoothingEnabled = true;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) x.drawImage(m, dx * N, dy * N, N, N);
  // fine grain on top
  const im = x.getImageData(0, 0, N, N);
  for (let i = 0; i < im.data.length; i += 4) { const g = (Math.random() - .5) * 70; im.data[i] += g; im.data[i + 1] += g; im.data[i + 2] += g; }
  x.putImageData(im, 0, 0);
  // fibres: short soft strokes, light and dark
  for (let f = 0; f < 140; f++) {
    const px = Math.random() * N, py = Math.random() * N, a = Math.random() * Math.PI, l = 6 + Math.random() * 22;
    x.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'; x.lineWidth = .6 + Math.random() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + (Math.random() - .5) * 6, py + Math.sin(a) * l * .5 + (Math.random() - .5) * 6, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return (GRAIN_URL = c.toDataURL('image/png'));
}
const typeKey = d => (d.kOut >= .55 ? 'h' : 's') + (d.kIn >= .55 ? 'h' : 's');

function createStory(svg, day, opts = {}) {   // opts.bleed: the ground runs past the frame to the real screen edge
  const e = EMO[day.emo], n = e.n, P = palette(e.c), U = { ...COPY_DEFAULT.ui, ...COPY.ui };
  if (COPY.motion) Object.assign(S_GRETA, COPY.motion);
  const W = SW, H = SH, M = 56, G = 16, COL = (W - 2 * M - 5 * G) / 6, MEAS = W - 2 * M;
  const X = c => W - M - c * (COL + G);
  const TOP = M + 52, BOT = H - M - 44, NSC = SCENES.length - 1;
  const B = opts.bleed ? 3000 : 0;
  const CUT = .4, IN = .65, STAG = .05, INK = '#16130F';
  const FPS = 15;   // a little under full motion, like Vox explainers: the eases stay smooth, the frames step
  const TRACK = -.02;   // Secolo tracking, in em
  const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
  const outQ5 = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 5);
  const osc = (t, a, b, per, ph = 0) => a + (b - a) * (.5 - .5 * Math.cos(2 * Math.PI * t / per + ph));
  const ck = k => Math.max(0, Math.min(1, k));
  const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) + (parseInt(b.substr(i, 2), 16) - parseInt(a.substr(i, 2), 16)) * t).toString(16).padStart(2, '0')).join('');
  const hh = x => String(Math.floor(x)).padStart(2, '0') + ':' + String(Math.round(x % 1 * 60)).padStart(2, '0');
  const fmt = v => Math.round(v).toLocaleString('he-IL');
  const feel = k => (COPY.feelings || {})[k] || EMO[k].he;
  const el = (tag, a = {}, txt) => { const x = document.createElementNS(SNS, tag); for (const k in a) x.setAttribute(k, a[k]); if (txt != null) x.textContent = txt; return x; };

  // ——— what the day says (all from the same seed, so a rescan gives the same story) ———
  const h = j => sHash(day.seed || 1, j);
  const mins = Math.round(day.shares[0].pct / 100 * 16.5 * 60);
  const words = day.words ?? Math.round((day.emo === 'shame' ? 1200 : 2600) + h(11) * 5200);
  const perHour = Array.from({ length: 17 }, (_, i) => .25 + h(20 + i) + (i > 4 && i < 8 ? .6 : 0));   // 07–23; lunch is louder
  const sumH = perHour.reduce((a, b) => a + b, 0), wordsAt = perHour.map(v => v / sumH * words), peak = wordsAt.indexOf(Math.max(...wordsAt));
  const overlap = (s, a, b) => Math.max(0, Math.min(s.to, b) - Math.max(s.from, a));
  const chapter = (a, b) => { const t = {}; day.segs.forEach(s => t[s.emo] = (t[s.emo] || 0) + overlap(s, a, b)); return Object.entries(t).sort((x, y) => y[1] - x[1])[0][0]; };
  // MPL (masculinity pressure level, 0–1000) of a stretch of the day: held-in feelings press it up, letting out brings it down
  const MPL_BASE = { press: 760, anger: 650, shame: 600, fear: 560, joy: 260, cry: 300, release: 160 };
  const mplOf = (s, j) => Math.round(Math.min(990, (MPL_BASE[s.emo] ?? 500) + (h(70 + j) - .5) * 180));
  const type = WHEEP_TYPES[typeKey(day)];
  const typePct = 8 + Math.floor(h(9) * 30);
  const friends = typeof makeDay === 'function' && typeof MOCK_NAMES !== 'undefined'
    ? Object.keys(MOCK_NAMES).filter(f => f !== day.name).slice(0, 4).map(f => makeDay({ name: f, date: new Date() })) : [];

  svg.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${day.name}, ${day.day} ${day.date}. ${feel(day.emo)}: ${mins} דקות. ${words} מילים. ${type.name}.`);
  svg.textContent = '';
  if (opts.bleed) svg.style.overflow = 'visible';

  // ——— building blocks: each scene is a group with its own updaters f(u, T) and build-in elements ———
  let S;
  const live = f => S.dyn.push(f);
  const add = (node, i) => { S.g.append(node); if (i != null) { node.dataset.i = i; S.ins.push(node); } return node; };
  const T = (txt, x, y, size, o = {}) => add(el('text', { x, y, 'font-size': size, direction: 'rtl', 'text-anchor': o.anchor || 'start',
    fill: o.fill, 'font-family': o.font || 'Greta, GretaHL', style: `font-variation-settings:'wght' ${o.w ?? 40}` }, txt), o.i ?? 0);
  // Secolo: every letter on its own cut (19–22), jumping on the beat; tracked TRACK. setText() swaps letters for count-ups.
  const Sx = (txt, x, y, size, o = {}) => {
    const t = T('', x, y, size, { ...o, font: SECOLO[0] }), seed = o.seed ?? 0;
    t.style.letterSpacing = TRACK + 'em'; t._L = [];
    t._set = str => {
      if (str === t._str) return; t._str = str;
      const c = [...String(str)];
      while (t._L.length < c.length) { const s = el('tspan'); t.append(s); t._L.push(s); }
      while (t._L.length > c.length) t._L.pop().remove();
      c.forEach((ch, i) => { t._L[i].textContent = ch; });
    };
    t._set(txt);
    live((u, TT) => { const b = Math.floor(TT / CUT); t._L.forEach((s, i) => s.setAttribute('font-family', SECOLO[(b + Math.floor(sHash(i + seed * 7, 3.1) * 4) + i) % 4])); });
    return t;
  };
  const setText = (t, s) => t._set ? t._set(s) : (t.textContent = s);
  const fit = (t, width, max = 1e4) => {
    const f0 = +t.getAttribute('font-size'); let l = 0;
    if (t._L) { const w = t._L.map(() => 0); SECOLO.forEach(c => t._L.forEach((s, i) => { s.setAttribute('font-family', c); w[i] = Math.max(w[i], s.getComputedTextLength()); })); l = w.reduce((a, b) => a + b, 0); }
    else { t.style.fontVariationSettings = "'wght' 100"; l = t.getComputedTextLength(); }   // Greta at its heaviest
    const f = Math.min(max, f0 * width / (l || 1)); t.setAttribute('font-size', f.toFixed(1)); return f;
  };
  const shrink = (t, w) => { if (t.getComputedTextLength() > w) fit(t, w); return t; };
  const hang = (t, top, f) => t.setAttribute('y', (top + f * .74).toFixed(1));
  let seedN = 0;
  const breathe = (t, base, amp = 22, reveal) => {
    const chars = [...t.textContent]; t.textContent = '';
    const seed = 1.37 * seedN++, L = chars.map(ch => { const s = el('tspan', {}, ch); t.append(s); return { s, fv: '', o: '' }; }), st = Math.min(.08, 1.6 / Math.max(1, L.length));
    live((u, TT) => {
      const b = typeof base === 'function' ? base(u) : base;
      L.forEach((l, i) => {
        const a = sLetter(TT, i, b, amp, seed), fv = `'wght' ${a[0].toFixed(1)}, 'wdth' ${a[1].toFixed(1)}, 'OPTI' ${a[2].toFixed(1)}`;   // tenths: whole steps made big type jump
        if (fv !== l.fv) { l.fv = fv; l.s.style.fontVariationSettings = fv; }
        if (reveal != null) { const o = ease((u - reveal - i * st) / .35).toFixed(2); if (o !== l.o) { l.o = o; l.s.setAttribute('opacity', o); } }
      });
    });
    return t;
  };
  const rule = (y, c, i = 0, x1 = M, x2 = W - M, hgt = 2) => add(el('rect', { x: x1, y, width: x2 - x1, height: hgt, fill: c }), i);
  // a shape: no bands, just the form. It morphs (kf), turns, breathes; o.at pops it in (overshoot), otherwise it grows in.
  const shape = (nn, kf, r, cx, cy, fill, o = {}) => {
    const q = add(el('path', { fill })); q._id = Math.random() * 97;
    live((u, TT) => {
      const v = u - (o.at ?? 0), s = o.at != null ? (v < 0 ? 0 : sBack(v / .45)) : (o.grow ?? .7) + (1 - (o.grow ?? .7)) * sFlow(v / .9);
      const br = o.still ? 1 : 1 + .025 * Math.sin(2 * Math.PI * TT / 3.2 + (o.ph || 0));   // o.still: no breath, no turn
      const j = o.still ? 0 : sHash(Math.round(TT * FPS), q._id) - .5;   // boil: a faint new tremble on every drawn frame
      // flow: the edge is never quite rigid; it ripples softly, and more while the shape is changing (follow-through)
      const k1 = ck(kf(v, TT)), k0 = ck(kf(v - .15, TT - .15)), fl = o.still ? null : { a: .012 + Math.min(.05, Math.abs(k1 - k0) * .5), p: TT * 1.7 + q._id };
      q.setAttribute('d', s > .01 ? shapePath(nn, k1, r * s * br * (1 + j * .004), cx + j, cy - j * .6, (o.dir || 1) * v * (o.spin ?? .12) + j * .005, o.steps || 220, fl) : '');
    });
    return q;
  };
  // background shapes: tone on tone, under the frame and the type. Only on posters whose shapes are data, not a hero.
  const ghost = (kf, r, cx, cy, ground, nn = n) => {
    const q = el('path', { fill: ground === INK ? '#26221C' : mixHex(ground, INK, .08) });   // .08: ink text over it keeps ≥4.5:1 on every feeling
    S.g.insertBefore(q, S.g.children[1]);
    live((u, TT) => q.setAttribute('d', shapePath(nn, ck(kf(u, TT)), r * (.85 + .15 * sFlow(u / 1.4)), cx, cy, -TT * .05, 200)));
  };
  const countUp = (t, to, at, dur, suf = '') => live(u => setText(t, fmt(to * sOut((u - at) / dur)) + suf));
  const frame = (s, ground, label) => {
    const fg = ground === INK ? P.w : INK;
    add(el('rect', { x: -B, y: -B, width: W + 2 * B, height: H + 2 * B, fill: ground }));
    for (let i = 0; i < NSC; i++) {
      const w = (MEAS - (NSC - 1) * 6) / NSC, x = W - M - (i + 1) * w - i * 6, a = SCENES[i], b = SCENES[i + 1];
      add(el('rect', { x, y: M - 24, width: w, height: 4, fill: fg, opacity: .25 }));
      const f = add(el('rect', { x, y: M - 24, width: 0, height: 4, fill: fg }));
      live((u, TT) => { const v = w * sClamp((TT - a) / (b - a)); f.setAttribute('x', x + w - v); f.setAttribute('width', v); });
    }
    shrink(T(day.name, W - M, M + 30, 26, { fill: fg, w: 80 }), X(2) - X(4));
    T(`${day.day} · ${day.date}`, X(2), M + 30, 26, { fill: fg, w: 30 });
    shape(n, u => osc(u, 0, 1, 4.8), 13, M + 13, M + 21, fg, { grow: 1, steps: 100 });
    T('wheep', M + 34, M + 30, 28, { fill: fg, w: 90, anchor: 'start' }).setAttribute('direction', 'ltr');
    rule(M + 52, fg); rule(BOT, fg);
    if (label) shrink(T(label, W - M, H - M - 6, 26, { fill: fg, w: 30 }), MEAS);
    return fg;
  };
  const title = (fg, s) => shrink(breathe(T(s, W - M, TOP + 54, 34, { fill: fg, i: 1 }), 60), MEAS);

  const POSTERS = [
    // 1 · intro: the name fills the measure and writes in from hairline; the shape blooms off the bottom
    () => {
      const fg = frame(0, INK, U.dailySummary);
      shape(n, u => osc(u, 0, .34, 4.4), 560, W * .32, H * .92, P.w, { grow: .4 });
      const nm = T(day.name, W - M, 0, 300, { fill: fg, i: 1 }), f = fit(nm, MEAS, 420); hang(nm, TOP + 48, f);
      breathe(nm, u => 6 + 94 * sFlow(u / 1.6), 10, .2);
      shrink(breathe(T(U.intro, W - M, TOP + 48 + f * .74 + 110, 76, { fill: fg, i: 2 }), 20), MEAS);
    },
    // 2 · the words: the count fills the measure, then the day as hours of talk
    () => {
      const fg = frame(1, P.m, U.wordsNote);
      ghost((u, TT) => osc(TT, day.kOut, day.kIn, 7), 340, 60, TOP + 330, P.m);
      const a = breathe(T(U.wordsLead, W - M, 0, 90, { fill: fg, i: 1 }), 70); const fa = fit(a, MEAS * .6, 96); hang(a, TOP + 70, fa);
      const num = Sx(fmt(words), W - M, 0, 600, { fill: fg, i: 2 }), f = fit(num, MEAS, 520); hang(num, TOP + 70 + fa * .74 + 60, f);
      countUp(num, words, .3, 2);
      const unitY = TOP + 70 + fa * .74 + 60 + f * .74 + 40;
      const un = breathe(T(U.wordsUnit, W - M, 0, 90, { fill: fg, i: 3 }), 70); hang(un, unitY, fit(un, MEAS * .4, 96));
      // words per hour, 07–23: bars over the full measure, the loudest hour in ink
      const y1 = BOT - 70, y0 = unitY + 170, bw = MEAS / 17, top = Math.max(...wordsAt);
      wordsAt.forEach((v, i) => {
        const x = W - M - (i + 1) * bw, hgt = (y1 - y0) * v / top, r = add(el('rect', { x: x + 4, width: bw - 8, fill: i === peak ? INK : mixHex(P.m, INK, .3) }));
        live(u => { const g = hgt * sOut((u - 1 - i * .05) / .7); r.setAttribute('y', y1 - g); r.setAttribute('height', g); });
      });
      rule(y1, fg, 4);
      [[0, '07'], [5, '12'], [11, '18'], [16, '23']].forEach(([i, l]) => T(l, W - M - (i + .5) * bw, y1 + 34, 24, { fill: fg, w: 40, anchor: 'middle', i: 4 }));
      shrink(breathe(T(copyFill(U.wordsPeak, { from: hh(7 + peak), to: hh(8 + peak) }), W - M, y0 - 40, 32, { fill: fg, i: 5 }), 60), MEAS);
    },
    // 3 · guess: three shapes, no words. The right one turns ink, the others fade, and its colour floods the poster.
    () => {
      const fg = frame(2, INK, U.guessNote), REVEAL = 3.4, cy = TOP + 560, cx = [W * .8, W * .5, W * .2];
      title(fg, U.guess);
      // the frame and title start white on ink; once the colour has flooded in they turn ink
      const chrome = [...S.g.querySelectorAll(`[fill="${P.w}"]`)];
      live(u => { const c = u > REVEAL + 1 ? INK : P.w; chrome.forEach(x => x.setAttribute('fill', c)); });
      const pool = GUESS_KEYS.filter(x => x !== day.emo), a = pool[Math.floor(h(1) * pool.length)];
      let b = pool[Math.floor(h(2) * pool.length)]; if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      const order = [a, day.emo, b], right = Math.floor(h(3) * 3); [order[1], order[right]] = [order[right], order[1]];
      // the flood: the answer's shape, soft enough (k .34, deep valleys stay full) and big enough to cover every corner,
      // so ink text never ends up on an ink gap between the points
      const flood = el('path', { fill: P.m }); S.g.insertBefore(flood, S.g.children[1]);
      live(u => { const g = sFlow((u - REVEAL - .4) / 1.4); flood.setAttribute('d', g > 0 ? shapePath(n, .34, 60 + g * 2700, cx[right], cy, u * .2) : ''); });
      order.forEach((emo, i) => {
        const E = EMO[emo], ok = emo === day.emo;
        const sh = shape(E.n, u => osc(u, .1, .9, 3.4, i * 2), 150, cx[i], cy, E.c, { at: .4 + i * .18 });
        live(u => { sh.setAttribute('fill', ok && u > REVEAL ? INK : E.c); sh.setAttribute('opacity', !ok && u > REVEAL ? .2 : 1); });
        const lab = Sx(feel(emo), cx[i], cy + 250, 80, { fill: fg, anchor: 'middle', i: 3 + i, seed: i }); fit(lab, W * .28, 80);
        live(u => { lab.setAttribute('fill', u > REVEAL + 1 ? INK : fg); lab.setAttribute('opacity', u > REVEAL && !ok ? .2 : 1); });
      });
      const ans = Sx(feel(day.emo), W - M, BOT - 50, 260, { fill: INK, seed: 4 }); fit(ans, MEAS, 300);
      live(u => ans.setAttribute('opacity', ease((u - REVEAL - 1.2) / .6)));
    },
    // 4 · the minutes: how long the feeling held you; one square per 10 minutes, counting in with the number
    () => {
      const fg = frame(3, P.m, U.minutesNote);
      ghost((u, TT) => osc(TT, day.kIn, day.kOut, 8), 320, W - 40, BOT - 200, P.m);
      const num = Sx(fmt(mins), W - M, 0, 700, { fill: fg, i: 1 }), f = fit(num, MEAS * .78, 600); hang(num, TOP + 60, f);
      countUp(num, mins, .2, 2.2);
      const lab = Sx(copyFill(U.minutesUnit, { feel: feel(day.emo) }), W - M, 0, 160, { fill: fg, i: 2, seed: 3 }), fl = fit(lab, MEAS, 160);
      hang(lab, TOP + 60 + f * .74 + 50, fl);
      const n10 = Math.max(1, Math.round(mins / 10)), cols = 12, y0 = TOP + 60 + f * .74 + 50 + fl * .74 + 70, rows = Math.ceil(n10 / cols);
      const cw = MEAS / cols, ch = Math.min(cw, (BOT - 30 - y0) / rows);
      for (let b = 0; b < n10; b++) {
        const r = add(el('rect', { x: W - M - (b % cols + 1) * cw + 4, y: y0 + Math.floor(b / cols) * ch + 4, width: cw - 8, height: ch - 8, fill: INK }));
        live(u => r.setAttribute('opacity', sOut((u - .2) / 2.2) * n10 > b ? 1 : 0));
      }
    },
    // 5 · three chapters: morning, afternoon, evening as bands in the feeling that held each one
    () => {
      const fg = frame(4, INK, U.chaptersNote), parts = [[U.morning, 7, 12], [U.noon, 12, 17], [U.evening, 17, 23.5]];
      title(fg, U.chapters);
      const y0 = TOP + 90, bh = (BOT - y0) / 3;
      parts.forEach(([name, a, b], i) => {
        const emo = chapter(a, b), E = EMO[emo], y = y0 + i * bh, id = `c${i}${Math.random().toString(36).slice(2, 7)}`;
        const band = add(el('rect', { x: 0, y, width: W, height: bh, fill: E.c }));
        live(u => { const v = W * sOut((u - .3 - i * .35) / .7); band.setAttribute('x', W - v); band.setAttribute('width', v); });
        const clip = el('clipPath', { id }); clip.append(el('rect', { x: -B, y, width: W + 2 * B, height: bh })); S.g.append(clip);
        shape(E.n, u => osc(u, .1, .9, 4, i), bh * .62, M + 120 + i * 90, y + bh * .55, INK, { at: .7 + i * .35 }).setAttribute('clip-path', `url(#${id})`);
        breathe(T(`${name} · ${hh(a)} עד ${hh(b)}`, W - M, y + 54, 30, { fill: INK, i: 3 + i * 3 }), 70);
        const w = Sx(feel(emo), W - M, 0, 200, { fill: INK, i: 4 + i * 3, seed: i }); hang(w, y + 84, fit(w, MEAS * .62, bh * .62));
      });
    },
    // 6 · top five moments: the five longest stretches, ranked, on ink; each feeling in its colour
    () => {
      const fg = frame(5, INK, U.top5Note);
      title(fg, U.top5);
      const top5 = [...day.segs].sort((a, b) => (b.to - b.from) - (a.to - a.from)).slice(0, 5), y0 = TOP + 100, rh = (BOT - 30 - y0) / 5, longest = top5[0].to - top5[0].from;
      top5.forEach((s, i) => {
        const y = y0 + i * rh, E = EMO[s.emo], at = .5 + i * .22;
        rule(y, fg, 3 + i * 2, M, W - M, 1);
        Sx(String(i + 1), W - M, y + rh * .82, rh * .95, { fill: fg, i: 3 + i * 2, seed: i });
        shape(E.n, u => osc(u, .05, .95, 3, i), rh * .27, X(1) + 10, y + rh / 2, E.c, { at });
        Sx(feel(s.emo), X(1) - rh * .38, y + rh * .52, rh * .42, { fill: E.c, i: 4 + i * 2, seed: i + 2 });
        breathe(T(`${hh(s.from)} עד ${hh(s.to)}`, X(1) - rh * .38, y + rh * .84, 26, { fill: fg, i: 4 + i * 2 }), 50, 12);
        // the bar is the moment's MPL (0–1000), growing from the left; the figure rides at its end
        const v = mplOf(s, i), full = X(3.4) - M - 150, bar = add(el('rect', { x: M, y: y + rh * .3, height: rh * .4, width: 0, fill: E.c }));
        const lab = Sx('0', M, y + rh * .63, rh * .3, { fill: fg, anchor: 'end', seed: i + 4 });
        live(u => { const g = sOut((u - at) / .9), w = full * v / 1000 * g; bar.setAttribute('width', w); lab.setAttribute('x', M + w + 14); setText(lab, fmt(v * g)); });
      });
    },
    // 7 · the daily portrait: every stretch of the day becomes its feeling's shape, sized by how long it lasted,
    //     packed into one form. No two days (or people) make the same portrait.
    () => {
      const fg = frame(6, INK, U.portraitNote);
      title(fg, U.portrait);
      const C = { x: W / 2, y: TOP + 520 }, R = 440, segs = [...day.segs].sort((a, b) => (b.to - b.from) - (a.to - a.from));
      const pack = mPack(day.seed || 1, R, segs.length + 8).sort((a, b) => b.r - a.r);
      pack.forEach((c, j) => {
        const s = segs[j % segs.length], E = EMO[s.emo], k0 = .15 + h(40 + j) * .7, extra = j >= segs.length;
        shape(E.n, (v, TT) => osc(TT, k0, extra ? k0 : (s.emo === day.emo ? day.kIn : 1 - k0), 4 + h(60 + j) * 4, j), c.r * (extra ? .8 : 1.02), C.x + c.x, C.y + c.y,
          extra ? mixHex(E.c, INK, .55) : E.c, { at: .4 + j * .09, spin: (j % 2 ? -1 : 1) * (.04 + h(80 + j) * .08), ph: j });
      });
      let y = BOT - 3 * 92;
      day.shares.slice(0, 3).forEach((s, i) => {
        const E = EMO[s.emo];
        rule(y, fg, 8 + i, M, W - M, 1);
        Sx(feel(s.emo), W - M, y + 74, 72, { fill: E.c, i: 8 + i, seed: i });
        countUp(Sx('0%', M, y + 74, 72, { fill: fg, anchor: 'end', i: 8 + i, seed: i + 3 }), s.pct, 1.4 + i * .2, 1, '%');
        y += 92;
      });
    },
    // 8 · your type. Three modules, read top to bottom:
    //     the name and its line (what you are), your two shapes side by side (why: what showed, what was inside, the gap),
    //     then the four types as a 2×2 table where only yours is filled (where you sit among the others).
    () => {
      const fg = frame(7, P.m, copyFill(U.typePeers, { pct: typePct, type: type.name })), key = typeKey(day);
      title(fg, U.type);
      const nm = Sx(type.name, W - M, 0, 300, { fill: fg, i: 2 }), f = fit(nm, MEAS, 230); hang(nm, TOP + 96, f);
      const nb = TOP + 96 + f * .74;
      shrink(breathe(T(type.line, W - M, nb + 64, 40, { fill: fg, i: 3 }), 55), MEAS);
      // module 2 · the pair: outside (right, read first) and inside, each morphing from soft to what it was
      const r1 = nb + 112, r2 = r1 + 420, cxR = W - M - MEAS / 4, cxL = M + MEAS / 4, sy = r1 + 215;
      rule(r1, fg, 4);
      add(el('rect', { x: W / 2 - 1, y: r1 + 28, width: 2, height: r2 - r1 - 56, fill: fg }), 4);
      [[U.outside, day.kOut, cxR, .6], [U.inside, day.kIn, cxL, .9]].forEach(([lab, kk, cx, at], j) => {
        T(lab, cx, r1 + 56, 30, { fill: fg, w: 70, anchor: 'middle', i: 5 + j });
        shape(n, u => sLerp(.34, kk, sFlow((u - at - .3) / 1.1)), 135, cx, sy, INK, { at, spin: .05, dir: j ? -1 : 1 });
        const kw = Sx(kk >= .55 ? U.sharpShort : U.softShort, cx, r2 - 34, 64, { fill: fg, anchor: 'middle', i: 6 + j, seed: j });
        live(u => kw.setAttribute('opacity', ease((u - at - 1.2) / .4)));
      });
      // the gap, knocked out of the divider
      const gap = Math.round(Math.abs(day.kIn - day.kOut) * 100);
      add(el('rect', { x: W / 2 - 92, y: sy - 74, width: 184, height: 128, fill: P.m }), 7);
      T(U.gapShort, W / 2, sy - 34, 24, { fill: fg, w: 70, anchor: 'middle', i: 7 });
      const gp = Sx('0%', W / 2, sy + 38, 72, { fill: fg, anchor: 'middle', i: 7, seed: 3 });
      countUp(gp, gap, 1.6, 1.2, '%');
      // module 3 · the four types: rows = outside (sharp on top), columns = inside (soft on the right, as Hebrew reads)
      rule(r2, fg, 8);
      const rowW = 150, g = { x0: M, x1: W - M - rowW, y0: r2 + 64, y1: BOT - 18 }, cw = (g.x1 - g.x0) / 2, ch = (g.y1 - g.y0) / 2;
      T(U.softIn, g.x1 - cw / 2, r2 + 44, 24, { fill: fg, w: 70, anchor: 'middle', i: 8 });
      T(U.sharpIn, g.x0 + cw / 2, r2 + 44, 24, { fill: fg, w: 70, anchor: 'middle', i: 8 });
      T(U.sharpOut, W - M, g.y0 + ch / 2 + 9, 24, { fill: fg, w: 70, i: 8 });
      T(U.softOut, W - M, g.y0 + ch * 1.5 + 9, 24, { fill: fg, w: 70, i: 8 });
      const cells = { hs: [0, 0], hh: [1, 0], ss: [0, 1], sh: [1, 1] }, FILL = 3.1;
      Object.entries(cells).forEach(([k, [col, row]], j) => {
        const x = g.x1 - (col + 1) * cw, y = g.y0 + row * ch, mine = k === key;
        add(el('rect', { x: x + 1, y: y + 1, width: cw - 2, height: ch - 2, fill: 'none', stroke: fg, 'stroke-width': 2 }), 9 + j * .5);
        if (mine) {   // yours fills from the reading side, the one filled thing on the poster
          const wipe = add(el('rect', { x: x + cw, y, width: 0, height: ch, fill: INK }));
          live(u => { const v = cw * sOut((u - FILL) / .6); wipe.setAttribute('x', x + cw - v); wipe.setAttribute('width', v); });
          shape(n, () => day.kIn, ch * .26, x + ch * .42, y + ch / 2, P.m, { at: FILL + .4, spin: .05 });
        }
        const t = T(WHEEP_TYPES[k].name, x + cw - 24, y + ch / 2 + 12, 36, { fill: fg, w: mine ? 90 : 45, i: 9 + j * .5 });
        if (mine) live(u => t.setAttribute('fill', u > FILL + .25 ? P.m : fg));
      });
    },
    // 9 · how are your friends? Their day in one line each; the one with the widest gap gets a nudge.
    () => {
      const fg = frame(8, P.a, U.friendsNote);
      title(fg, U.friends);
      if (!friends.length) return;
      const y0 = TOP + 90, need = friends.reduce((a, b) => Math.abs(b.kIn - b.kOut) > Math.abs(a.kIn - a.kOut) ? b : a), callH = 230;
      const rh = (BOT - y0 - callH - 30) / friends.length;
      friends.forEach((fr, i) => {
        const E = EMO[fr.emo], y = y0 + i * rh, at = .4 + i * .2, gap = Math.round(Math.abs(fr.kIn - fr.kOut) * 100);
        rule(y, fg, 2 + i, M, W - M, 1);
        shape(E.n, () => fr.kIn, rh * .32, W - M - rh * .32, y + rh / 2, E.c, { at, spin: 0, still: true });   // their daily shape: it holds
        Sx(fr.name, W - M - rh * .78, y + rh * .5, rh * .4, { fill: fg, i: 3 + i, seed: i });
        breathe(T(copyFill(U.friendLine, { feel: feel(fr.emo), gap }), W - M - rh * .78, y + rh * .8, 28, { fill: fg, i: 3 + i }), 45, 12);
        // their gap: a bar that grows toward sharp
        const bw = (X(3.5) - M - 80) * gap / 100, bx = X(3.5), bar = add(el('rect', { x: bx, y: y + rh * .42, height: rh * .16, width: 0, fill: E.c }));
        live(u => { const v = bw * sOut((u - at) / .9); bar.setAttribute('x', bx - v); bar.setAttribute('width', v); });
        T(gap + '%', M, y + rh * .56, 30, { fill: fg, w: 70, anchor: 'end', i: 3 + i });
      });
      // the nudge
      const cy = BOT - callH, E = EMO[need.emo];
      add(el('rect', { x: M, y: cy, width: MEAS, height: callH - 20, fill: INK }), 9);
      shape(E.n, () => need.kIn, 70, M + 110, cy + (callH - 20) / 2, E.c, { at: 2.6, spin: 0, still: true });
      const t1 = Sx(copyFill(U.friendCall, { name: need.name }), W - M - 30, cy + 100, 80, { fill: P.w, i: 10, seed: 5 }); fit(t1, MEAS - 260, 90);
      shrink(breathe(T(copyFill(U.friendWhy, { feel: feel(need.emo) }), W - M - 30, cy + 160, 30, { fill: P.w, i: 11 }), 50), MEAS - 260);
    },
    // 10 · tomorrow: one thing to keep doing, from your own day. Today's inside shape eases toward a softer one,
    //      then three small things you can do, each with what it would take off your MPL.
    () => {
      const fg = frame(9, P.m, U.nextNote), key = typeKey(day), soft = Math.max(.05, Math.min(day.kIn, day.kOut) - .25);
      title(fg, U.next);
      const hd = Sx(U['next_' + key], W - M, 0, 300, { fill: fg, i: 2 }), f = fit(hd, MEAS, 210); hang(hd, TOP + 96, f);
      const nb = TOP + 96 + f * .74;
      shrink(breathe(T(copyFill(U['nextWhy_' + key], { feel: feel(day.emo) }), W - M, nb + 64, 40, { fill: fg, i: 3 }), 55), MEAS);
      // today → tomorrow: your inside shape, and the same shape softening
      const r1 = nb + 112, r2 = r1 + 400, sy = r1 + 210, cxR = W - M - MEAS / 4, cxL = M + MEAS / 4;
      rule(r1, fg, 4);
      [[U.today, cxR, () => day.kIn, .5], [U.tomorrow, cxL, u => sLerp(day.kIn, soft, sFlow((u - 1.6) / 1.6)), .8]].forEach(([lab, cx, kf, at], j) => {
        T(lab, cx, r1 + 56, 30, { fill: fg, w: 70, anchor: 'middle', i: 5 + j });
        shape(n, kf, 130, cx, sy, INK, { at, spin: .04, dir: j ? -1 : 1 });
      });
      // the arrow between them draws from the reading side
      const ay = sy, ax1 = cxR - 170, ax0 = cxL + 170, ar = add(el('path', { fill: 'none', stroke: fg, 'stroke-width': 3 }));
      live(u => { const g = outQ5((u - 1.2) / .8), x = ax1 - (ax1 - ax0) * g; ar.setAttribute('d', g > 0 ? `M${ax1} ${ay}L${x} ${ay}` + (g > .95 ? `M${ax0 + 22} ${ay - 16}L${ax0} ${ay}L${ax0 + 22} ${ay + 16}` : '') : ''); });
      // three small things, each with its MPL
      rule(r2, fg, 8);
      const acts = [[copyFill(U.act1, { name: friends.length ? friends.reduce((a, b) => Math.abs(b.kIn - b.kOut) > Math.abs(a.kIn - a.kOut) ? b : a).name : '' }), 25], [U.act2, 15], [U.act3, 10]];
      const rh = (BOT - r2 - 20) / acts.length;
      acts.forEach(([txt, d], j) => {
        const y = r2 + j * rh, at = 2 + j * .2;
        if (j) rule(y, fg, 9 + j, M, W - M, 1);
        shape(n, () => soft, rh * .22, W - M - rh * .22, y + rh / 2, INK, { at, spin: 0, still: true });
        shrink(breathe(T(txt, W - M - rh * .6, y + rh / 2 + 13, 36, { fill: fg, i: 9 + j }), 60), MEAS - rh * .6 - 220);
        const m = Sx('0', M, y + rh / 2 + 22, 64, { fill: fg, anchor: 'start', i: 9 + j, seed: j + 2 }); m.setAttribute('direction', 'ltr');   // '−25 MPL' reads left to right
        live(u => setText(m, '+' + Math.round(d * sOut((u - at) / .6)) + ' MPL'));
      });
    },
    // 10 · the share card: everything on one poster, made to be sent (the share button sends this one)
    () => {
      const fg = frame(10, P.m, U.shareNote);
      breathe(T(U.shareTitle, W - M, TOP + 54, 34, { fill: fg, i: 1 }), 60);
      const nm = T(day.name, W - M, 0, 300, { fill: fg, i: 2 }), f = fit(nm, MEAS, 300); hang(nm, TOP + 86, f); breathe(nm, 95, 10);
      // the shape and the type, side by side
      const r1 = TOP + 86 + f * .74 + 40, hb = 360;
      rule(r1, fg, 3);
      shape(n, (u, TT) => osc(TT, day.kOut, day.kIn, 5), hb * .44, M + hb * .5, r1 + hb / 2 + 6, INK, { grow: .5 });
      T(U.typeLabel, W - M, r1 + 56, 28, { fill: fg, w: 70, i: 4 });
      const tn = Sx(type.name, W - M, r1 + 170, 130, { fill: fg, i: 4, seed: 2 }); fit(tn, MEAS - hb - 20, 140);
      T(U.ledLabel, W - M, r1 + 236, 28, { fill: fg, w: 70, i: 5 });
      const fw = Sx(feel(day.emo), W - M, r1 + 336, 110, { fill: fg, i: 5, seed: 4 }); fit(fw, MEAS - hb - 20, 120);
      // three figures across the measure
      const r2 = r1 + hb + 20, cw3 = MEAS / 3;
      rule(r2, fg, 6);
      [[U.wordsUnit, fmt(words)], [copyFill(U.minutesUnit, { feel: feel(day.emo) }), fmt(mins)], [day.unit, day.num]].forEach(([lab, val], i) => {
        const x = W - M - i * cw3;
        if (i) add(el('rect', { x: x + 8, y: r2, width: 2, height: 200, fill: fg }), 6);
        const v = Sx(val, x - (i ? 24 : 0), r2 + 120, 120, { fill: fg, i: 7 + i, seed: i + 6 }); fit(v, cw3 - 40, 120);
        shrink(T(lab, x - (i ? 24 : 0), r2 + 170, 24, { fill: fg, w: 60, i: 7 + i }), cw3 - 40);
      });
      // the day in feelings: one bar across the measure, the top three named under it
      const r3 = r2 + 220;
      rule(r3, fg, 10);
      let x = W - M; const by = r3 + 36, bhgt = BOT - by - 90;
      day.shares.forEach((s, i) => {
        const w = MEAS * s.pct / 100;
        add(el('rect', { x: x - w, y: by, width: Math.max(0, w - 3), height: bhgt, fill: i ? EMO[s.emo].c : INK }), 11);
        if (i < 3) shrink(T(`${feel(s.emo)} ${s.pct}%`, x - 6, by + bhgt + 40, 28, { fill: fg, w: i ? 50 : 90, i: 12 }), Math.max(60, w - 10));
        x -= w;
      });
    },
  ];

  // built on the first draw, once the fonts are in.
  // On top of every poster: a light paper grain (one noise tile, made once per page, repeated, blended 'overlay').
  // Between stories, a transition from the posters' own language, a different one per cut (TRANS):
  //   iris     the next poster opens out of its feeling's shape, growing from where the eye already is
  //   columns  the six grid columns drop in one after another, from the reading side
  //   deal     a paper card is dealt in from below, turned, and lands on the stack
  //   push     the new poster slides in from the left (forward, in Hebrew) and pushes the old one out, with parallax
  // Inside each poster the elements build in: lines of type rise out of a mask, rules draw from the reading side,
  // everything else lifts and fades. Enter = ease-out, exit is the cut itself; 50 ms stagger, most important first.
  let scenes = null, grain, grainPat, shadow, clipEl, clipRect, clipPath, clipCols, lastStep = null;
  const uid = 'w' + Math.random().toString(36).slice(2, 8);
  // the cut INTO story i (0 = the loop back). An iris needs a change of ground to be seen, so it goes where colour meets ink.
  const TRANS = ['deal', 'iris', 'columns', 'deal', 'push', 'columns', 'deal', 'iris', 'push', 'deal', 'iris'];
  const TDUR = { iris: .95, columns: .85, deal: .8, push: .75 };
  const inOut = x => x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2;            // quint in-out: moving between positions
  const outQ = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 5);                   // quint out: arriving
  const land = x => { const c = 1.1, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };   // back out: a card that lands
  function build() {
    scenes = POSTERS.map(make => {
      S = { g: el('g'), dyn: [], ins: [] }; svg.append(S.g); make();
      // build-ins: masks for type, a draw direction for rules
      S.ins.forEach(x => {
        if (x.tagName === 'text') {
          const bb = x.getBBox(); if (!bb.height) return;
          const id = uid + 'm' + Math.random().toString(36).slice(2, 8), cp = el('clipPath', { id });
          cp.append(el('rect', { x: -B - 200, y: bb.y - 6, width: W + 2 * B + 400, height: bb.height + 12 }));   // vertical only: counters grow, labels move
          const wrap = el('g', { 'clip-path': `url(#${id})` }); x.replaceWith(wrap); wrap.append(cp, x);
          x._kind = 'mask'; x._h = bb.height + 12;
        } else if (x.tagName === 'rect' && +x.getAttribute('height') <= 2 && +x.getAttribute('width') > 40) {
          x._kind = 'rule'; x._x2 = +x.getAttribute('x') + +x.getAttribute('width');
        } else x._kind = 'lift';
      });
      S.g.style.display = 'none'; return S;
    });
    const defs = el('defs');
    const pat = el('pattern', { id: uid + 'g', width: 512, height: 512, patternUnits: 'userSpaceOnUse' }); grainPat = pat;
    const img = el('image', { width: 512, height: 512, href: grainTile() }); img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', grainTile());
    pat.append(img); defs.append(pat);
    const blur = el('filter', { id: uid + 's', x: '-20%', y: '-20%', width: '140%', height: '140%' }); blur.append(el('feGaussianBlur', { stdDeviation: 22 })); defs.append(blur);
    clipEl = el('clipPath', { id: uid + 'c' });
    clipRect = el('rect'); clipPath = el('path'); clipCols = Array.from({ length: 6 }, () => el('rect'));
    defs.append(clipEl); svg.prepend(defs);
    shadow = el('rect', { x: 0, y: 24, width: W, height: H, fill: INK, opacity: 0, filter: `url(#${uid}s)` }); svg.append(shadow);
    grain = el('rect', { x: -B, y: -B, width: W + 2 * B, height: H + 2 * B, fill: `url(#${uid}g)`, 'pointer-events': 'none' });
    grain.style.mixBlendMode = 'overlay'; grain.setAttribute('opacity', .2); svg.append(grain);
  }
  const useClip = (...nodes) => { if (clipEl.firstChild !== nodes[0] || clipEl.childNodes.length !== nodes.length) clipEl.replaceChildren(...nodes); };
  const reset = g => { g.removeAttribute('transform'); g.removeAttribute('clip-path'); };
  let shown = -1, under = -1;
  function draw(TT) {
    if (!scenes) build();
    const step = Math.floor(sWrap(TT) * FPS);
    if (step === lastStep) return;   // same frame: nothing to redraw
    lastStep = step;
    TT = step / FPS;
    grainPat.setAttribute('patternTransform', `translate(${Math.round(sHash(step, 1.7) * 512)} ${Math.round(sHash(step, 3.1) * 512)}) scale(.5)`);   // the paper boils; half scale so it stays fine on a big screen
    let i = 0; while (i < NSC - 1 && TT >= SCENES[i + 1]) i++;
    const sc = scenes[i], u = Math.max(0, TT - SCENES[i]);
    if (i !== shown) {   // the new poster goes on top; the one it covers stays visible under it until the cut is done
      if (under >= 0 && under !== shown) { scenes[under].g.style.display = 'none'; reset(scenes[under].g); }
      under = shown; shown = i;
      sc.g.style.display = '';
      svg.insertBefore(shadow, grain); svg.insertBefore(sc.g, grain);
    }
    const kind = TRANS[i], D = TDUR[kind], q = Math.min(1, u / D), cutting = q < 1 && under >= 0 && under !== i;
    const ug = cutting ? scenes[under].g : null, cx = W / 2, cy = H / 2, X0 = -B, Y0 = -B, WW = W + 2 * B, HH = H + 2 * B;
    shadow.setAttribute('opacity', 0);
    if (cutting) {
      ug.style.display = '';
      sc.g.setAttribute('clip-path', `url(#${uid}c)`);
      if (kind === 'iris') {
        // the next feeling's shape opens from the centre; soft (k .34) so its valleys also cover the corners
        const p = inOut(q), r = 30 + p * (Math.hypot(WW, HH) * .75);
        clipPath.setAttribute('d', shapePath(n, .34, r, cx, cy, p * 1.2)); useClip(clipPath);
        sc.g.removeAttribute('transform');
        ug.setAttribute('transform', `translate(${cx} ${cy}) scale(${(1 + .06 * p).toFixed(4)}) translate(${-cx} ${-cy})`);   // the old one pushes back
      } else if (kind === 'columns') {
        // six columns of the grid, right to left, each falling in with its own ease
        // the columns are the poster's own sixths; the outer two run on to the screen edges
        const cw = W / 6;
        clipCols.forEach((r, j) => {
          const v = outQ((q * D - j * .07) / (D - .35)), x0 = j === 5 ? -B : W - (j + 1) * cw, x1 = j === 0 ? W + B : W - j * cw;
          r.setAttribute('x', x0 - .5); r.setAttribute('width', x1 - x0 + 1); r.setAttribute('y', Y0); r.setAttribute('height', HH * v);
        });
        useClip(...clipCols);
        sc.g.removeAttribute('transform');
        ug.setAttribute('transform', `translate(0 ${(60 * outQ(q)).toFixed(1)})`);
      } else if (kind === 'push') {
        // forward in Hebrew is to the left: the new poster comes from the left, the old one leaves right, slower (parallax)
        const p = inOut(q), off = (W + B) * (1 - p);
        clipRect.setAttribute('x', X0); clipRect.setAttribute('y', Y0); clipRect.setAttribute('width', WW); clipRect.setAttribute('height', HH); useClip(clipRect);
        sc.g.setAttribute('transform', `translate(${(-off).toFixed(1)} 0)`);
        ug.setAttribute('transform', `translate(${(W * .35 * p).toFixed(1)} 0)`);
      } else {   // deal
        const p = land(q), k = 1 - p;
        clipRect.setAttribute('x', 0); clipRect.setAttribute('y', 0); clipRect.setAttribute('width', W); clipRect.setAttribute('height', H); useClip(clipRect);
        const tf = `translate(${(-60 * k).toFixed(1)} ${(H * .85 * k).toFixed(1)}) rotate(${(-9 * k).toFixed(2)} ${cx} ${cy})`;
        sc.g.setAttribute('transform', tf);
        shadow.setAttribute('transform', tf); shadow.setAttribute('opacity', (.4 * Math.max(0, Math.min(1, k * 3))).toFixed(3));
        ug.setAttribute('transform', `translate(${cx} ${cy}) scale(${(1 - .035 * (1 - k)).toFixed(4)}) translate(${-cx} ${-cy})`);
      }
    } else {
      // a dealt card is the frame while it flies; after it lands its ground runs out to the real edge (phone, kiosk)
      const g = kind === 'deal' && B ? outQ((u - D) / .35) : 1;
      if (g < 1 && under >= 0 && under !== i) {
        clipRect.setAttribute('x', -B * g); clipRect.setAttribute('y', -B * g); clipRect.setAttribute('width', W + 2 * B * g); clipRect.setAttribute('height', H + 2 * B * g);
        useClip(clipRect); sc.g.setAttribute('clip-path', `url(#${uid}c)`); sc.g.removeAttribute('transform');
      } else {
        reset(sc.g);
        if (under >= 0 && under !== i) { scenes[under].g.style.display = 'none'; reset(scenes[under].g); under = -1; }
      }
    }
    // build-ins start as the cut settles
    const b0 = under >= 0 && under !== i ? D * .45 : .1;
    sc.ins.forEach(x => {
      const v = outQ((u - b0 - +x.dataset.i * STAG) / IN);
      if (x._kind === 'mask') { x.setAttribute('transform', `translate(0 ${((1 - v) * x._h).toFixed(1)})`); x.setAttribute('opacity', v > 0 ? 1 : 0); }
      else if (x._kind === 'rule') x.setAttribute('transform', `translate(${x._x2} 0) scale(${v.toFixed(4)} 1) translate(${-x._x2} 0)`);
      else { x.setAttribute('opacity', v.toFixed(3)); x.setAttribute('transform', `translate(0 ${((1 - v) * 24).toFixed(1)})`); }
    });
    sc.dyn.forEach(f => f(u, TT));
  }
  return { draw, day };
}

if (typeof module !== 'undefined') module.exports = { createStory, LAYOUT, WHEEP_TYPES };
