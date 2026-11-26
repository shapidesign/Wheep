/* WHEEP · the wrapped story (web). One day, six scenes on a 24 s loop (1080×1350):
   0 intro (the name) · 1 the feeling that led the day · 2 the figure and when it happened
   3 outside vs inside · 4 the day in feelings · 5 the two lines, then back to the start.
   Every element builds in on its own beat; Greta moves letter by letter on wght, wdth and OPTI.
   Timeline and shape motion live in story-core.js (shared with After Effects); words come from copy.js.
   Needs shape.js, motion.js (M_KEYS), days.js (palette, SECOLO), copy.js, story-core.js. */

const SW = 1080, SH = 1350, SNS = 'http://www.w3.org/2000/svg';

function createStory(svg, day, opts = {}) {   // opts.bleed: the ground runs past the frame to the real screen edge
  const e = EMO[day.emo], pal = palette(e.c), n = e.n, id = 's' + Math.floor(Math.random() * 1e9), U = COPY.ui;
  const el = (tag, attrs = {}, parent = svg) => {
    const x = document.createElementNS(SNS, tag);
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    parent.append(x);
    return x;
  };
  const fvs = (t, w, wd = 100, op = 100) => t.style.fontVariationSettings =
    `'wght' ${Math.max(0, Math.min(100, w)).toFixed(1)}, 'wdth' ${wd.toFixed(1)}, 'OPTI' ${Math.max(0, Math.min(100, op)).toFixed(1)}`;
  const secolo = (t, i) => t.style.fontFamily = SECOLO[((i % 4) + 4) % 4];
  const rect = (parent, x, y, w, h, fill) => el('rect', { x, y, width: w, height: h, fill }, parent);

  // build-up: every element enters on its own delay inside its scene (and leaves with the scene)
  const builds = [];   // { node, scene, d, rise }
  const build = (node, scene, d, rise = 28) => (builds.push({ node, scene, d, rise }), node);
  // Greta texts: split into letters later; each letter gets its own axes. reveal: letters appear one by one
  const gretas = [];   // { t, base, amp, reveal }
  const txt = (parent, str, x, y, size, o = {}) => {
    // fill follows the ground: white on ink, ink on the feeling (svg text defaults to black)
    const t = el('text', { x, y, 'font-size': size, fill: o.fill || 'currentColor', 'text-anchor': o.anchor || 'start', style: `direction:${o.ltr ? 'ltr' : 'rtl'};font-family:${o.face || 'Greta'}` }, parent);
    t.textContent = str;
    if (!o.face) { gretas.push({ t, base: o.w ?? 50, amp: o.amp ?? 22, reveal: o.reveal, seed: gretas.length * 1.37 }); fvs(t, o.w ?? 50); }
    if (o.scene != null) build(t, o.scene, o.d || 0);
    return t;
  };

  // text that must fit: measured at its widest (wght 100, wdth 100), then shrunk or wrapped
  const widest = t => { const keep = t.style.fontVariationSettings; t.style.fontVariationSettings = `'wght' 100`; const w = t.getComputedTextLength(); t.style.fontVariationSettings = keep; return w; };
  const fit = (t, maxW) => { const w = widest(t); if (w > maxW) t.setAttribute('font-size', (+t.getAttribute('font-size') * maxW / w).toFixed(1)); };
  const wrap = (t, maxW, lineH) => {
    const words = t.textContent.split(' '), x = t.getAttribute('x');
    t.textContent = '';
    let line = [], tsp = null, lines = 0;
    const start = () => { tsp = el('tspan', { x, dy: lines ? lineH : 0 }, t); lines++; };
    start();
    for (const w of words) {
      tsp.textContent = [...line, w].join(' ');
      if (line.length && widest(t) > maxW) { tsp.textContent = line.join(' '); line = [w]; start(); tsp.textContent = w; }
      else line.push(w);
    }
    return lines;
  };
  // after layout: every Greta text becomes one tspan per letter (inside its wrapped lines, if any)
  const letters = [];
  const splitLetters = g => {
    const hosts = g.t.querySelector('tspan') ? [...g.t.querySelectorAll(':scope > tspan')] : [g.t];
    let i = 0;
    hosts.forEach(h => {
      const chars = [...h.textContent];
      h.textContent = '';
      chars.forEach(ch => { const s = el('tspan', {}, h); s.textContent = ch; letters.push({ s, g, i: i++ }); });
    });
    g.count = i;
  };

  svg.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${day.name}, ${day.day} ${day.date}. ${e.he}: ${day.num} ${day.unit}. ${day.b} ${day.s}`);
  svg.textContent = '';
  const defs = el('defs');

  // ground: ink, then the feeling's colour opens from the shape (and closes again at the end)
  const B = opts.bleed ? 3000 : 0;
  if (opts.bleed) svg.style.overflow = 'visible';
  rect(svg, -B, -B, SW + 2 * B, SH + 2 * B, pal.k);
  const wipeClip = el('clipPath', { id: id + 'w' }, defs), wipeC = el('circle', {}, wipeClip);
  rect(svg, -B, -B, SW + 2 * B, SH + 2 * B, pal.m).setAttribute('clip-path', `url(#${id}w)`);

  // the shape and two trailing bands of itself
  const band1 = el('path', { fill: pal.b }), band2 = el('path', { fill: pal.a }), hero = el('path', {});

  const G = SCENES.slice(0, -1).map(() => el('g'));
  const fits = [];   // [text, maxWidth, lineHeight?]

  // 0 · intro: the name letter by letter, then the line, then the date
  const introName = txt(G[0], day.name, 540, 930, 140, { anchor: 'middle', w: 90, amp: 14, reveal: sAt(0, .25) });
  fits.push([introName, 900]);
  txt(G[0], U.intro, 540, 1010, 54, { anchor: 'middle', w: 40, scene: 0, d: 1.0 });
  txt(G[0], `${day.day} · ${day.date}`, 540, 1072, 34, { anchor: 'middle', w: 60, amp: 15, scene: 0, d: 1.3 });

  // 1 · the feeling that led the day (written once; letter spacing pulls it together)
  txt(G[1], U.led, 540, 220, 38, { anchor: 'middle', w: 80, amp: 26, scene: 1, d: .1 });
  const word = build(txt(G[1], e.he, 540, 1090, 230, { anchor: 'middle', face: SECOLO[0] }), 1, .35, 60);
  txt(G[1], copyFill(U.share, { pct: day.shares[0].pct }), 540, 1176, 40, { anchor: 'middle', w: 50, scene: 1, d: 1.2 });

  // 2 · the figure, then when it happened
  txt(G[2], U.measured, 1020, 240, 38, { w: 85, amp: 26, scene: 2, d: 0 });
  const num = build(txt(G[2], day.num, 60, 690, 320, { ltr: true, face: SECOLO[0] }), 2, .2, 50);
  const unit = txt(G[2], day.unit, 60, 766, 48, { anchor: 'end', w: 60, scene: 2, d: .7 });
  fits.push([unit, 520]);
  const TL = { x0: 60, x1: 1020, y: 1068 }, hx = h => TL.x0 + h / 24 * (TL.x1 - TL.x0);
  txt(G[2], U.when, 1020, 940, 34, { w: 85, amp: 26, scene: 2, d: 1.0 });
  const cap = txt(G[2], day.label, 60, 940, 34, { anchor: 'end', w: 50, scene: 2, d: 1.15 });
  fits.push([cap, 660]);
  const axis = rect(G[2], TL.x0, TL.y - 1.5, 0, 3, 'currentColor');            // draws itself left to right
  [0, 6, 12, 18, 24].forEach((h, j) => {
    const g = build(el('g', {}, G[2]), 2, 1.4 + j * .08, 10);
    rect(g, hx(h) - 1, TL.y, 2, 14, 'currentColor');
    txt(g, String(h).padStart(2, '0') + ':00', hx(h) + (h === 0 ? 36 : h === 24 ? -36 : 0), TL.y + 46, 26, { ltr: true, anchor: 'middle', w: 40, amp: 18 });
  });
  const spans = day.spans.map(([a, b]) => ({ a, b, r: rect(G[2], hx(a), TL.y - 13, 0, 24, 'currentColor') }));
  const marks = day.marks.map(([h, k], j) => ({ x: hx(h), k, j, p: el('path', { fill: 'currentColor' }, G[2]) }));

  // 3 · outside vs inside: title, the gap, the scale on the shape's own four drawings (they pop in), one sentence
  const col = { x0: 60, x1: 450 }, k2x = kk => col.x0 + kk * (col.x1 - col.x0);
  txt(G[3], U.outIn, col.x1, 560, 44, { w: 85, amp: 26, scene: 3, d: 0 });
  txt(G[3], copyFill(U.gap, { gap: Math.round(Math.abs(day.kIn - day.kOut) * 100) }), col.x1, 618, 36, { w: 55, scene: 3, d: .3 });
  const legend = M_KEYS.map((kk, j) => ({ kk, j, p: el('path', { fill: pal.b }, G[3]) }));
  txt(G[3], U.soft, k2x(0), 692, 28, { anchor: 'middle', w: 50, amp: 20, scene: 3, d: .5 });
  txt(G[3], U.sharp, k2x(1), 692, 28, { anchor: 'middle', w: 50, amp: 20, scene: 3, d: .85 });
  const scaleLine = rect(G[3], col.x0, 779, 0, 2, 'currentColor');
  const ka = Math.min(day.kOut, day.kIn), kb = Math.max(day.kOut, day.kIn);
  const gapBar = rect(G[3], k2x(ka), 774, 0, 12, 'currentColor');
  const close = Math.abs(k2x(day.kIn) - k2x(day.kOut)) < 120;
  [[day.kOut, U.outside, 0, 1.3], [day.kIn, U.inside, close ? 1 : 0, 1.5]].forEach(([kk, label, row, d]) => {
    const g = build(el('g', {}, G[3]), 3, d, 16);
    rect(g, k2x(kk) - 1, 780, 2, 50 + row * 40, 'currentColor');
    txt(g, label, k2x(kk), 862 + row * 40, 32, { anchor: 'middle', w: 80, amp: 24 });
  });
  const nowP = build(el('path', { fill: 'currentColor' }, G[3]), 3, 1.4, 0);
  const meaning = txt(G[3], day.kIn > day.kOut ? U.meaningUp : U.meaningDown, col.x1, 1000, 40, { w: 45, scene: 3, d: 1.8 });
  fits.push([meaning, col.x1 - col.x0, 52]);

  // 4 · the day in feelings: an ink band rises, the waking hours open as coloured stretches, the top three arrive
  const g4 = build(el('g', {}, G[4]), 4, 0, 160);
  rect(g4, 0, 520, SW, 760, pal.k);
  txt(g4, U.feelings, 1020, 610, 44, { w: 85, amp: 26, fill: pal.w, scene: 4, d: .25 });
  const stripClip = el('clipPath', { id: id + 'm' }, defs), stripR = rect(stripClip, 60, 640, 0, 110, '#000');
  const strip = el('g', { 'clip-path': `url(#${id}m)` }, g4);
  const sx = h => 60 + (h - 7) / 16.5 * 960;
  day.segs.forEach(s => {
    rect(strip, sx(s.from), 650, Math.max(1, sx(s.to) - sx(s.from) - 3), 90, EMO[s.emo].c);
    if (sx(s.to) - sx(s.from) > 44) el('path', { fill: pal.k, d: shapePath(EMO[s.emo].n, .5, 18, (sx(s.from) + sx(s.to)) / 2, 695, 0) }, strip);
  });
  [[7, '07:00'], [12, '12:00'], [18, '18:00'], [23.5, '23:30']].forEach(([h, l], j) =>
    txt(g4, l, sx(h) + (h === 7 ? 36 : h === 23.5 ? -36 : 0), 790, 26, { ltr: true, anchor: 'middle', w: 40, amp: 18, fill: pal.w, scene: 4, d: 1.1 + j * .1 }));
  const rows = day.shares.slice(0, 3).map((s, j) => {
    const g = build(el('g', {}, g4), 4, 1.3 + j * .3, 24), y = 900 + j * 100, E = EMO[s.emo];
    el('path', { fill: E.c, d: shapePath(E.n, .5, 26, 990, y - 14, 0) }, g);
    txt(g, E.he, 950, y, 44, { w: j ? 45 : 90, amp: 24, fill: pal.w });
    const bar = rect(g, 230, y - 26, 0, 22, E.c);
    txt(g, `${s.pct}%`, 60, y, 54, { ltr: true, face: SECOLO[2], fill: pal.w });
    return { bar, w: s.pct / 100 * 500, d: 1.3 + j * .3 };
  });

  // 5 · the two lines, letter by letter, signed
  const lineA = txt(G[5], day.b, 1020, 940, 64, { w: 95, amp: 12, reveal: sAt(5, .15) });
  const lineB = txt(G[5], day.s, 1020, 0, 64, { w: 30, amp: 12, reveal: sAt(5, 1.0) });
  const sign = txt(G[5], `${day.name} · ${day.day} ${day.date}`, 1020, 0, 34, { w: 60, amp: 15, scene: 5, d: 1.9 });

  // header (on top of everything): progress like a story, the mark, the name
  const head = el('g');
  const prog = SCENES.slice(0, -1).map((a, i) => {
    const x = 60 + i * (960 + 10) / 6, w = (960 + 10) / 6 - 10;
    const p = { track: rect(head, x, 34, w, 5, 'currentColor'), fill: rect(head, x, 34, 0, 5, 'currentColor'), x, w, a, b: SCENES[i + 1] };
    p.track.setAttribute('opacity', .25);
    return p;
  });
  const mark = el('path', { fill: 'currentColor' }, head);
  const wordmark = el('text', { x: 104, y: 104, 'font-size': 38, fill: 'currentColor', style: 'direction:ltr;font-family:Greta' }, head);
  wordmark.textContent = 'wheep';
  const headName = txt(head, day.name, 1020, 104, 36, { w: 70, amp: 18 });
  fits.push([headName, 520]);

  // once the fonts are in: fit, wrap, stack the closing block, then split every Greta text into letters
  let laid = false;
  function layout() {
    fits.forEach(([t, maxW, lineH]) => lineH ? wrap(t, maxW, lineH) : fit(t, maxW));
    const la = wrap(lineA, 960, 76);
    lineB.setAttribute('y', 940 + la * 76); const lb = wrap(lineB, 960, 76);
    sign.setAttribute('y', 940 + (la + lb) * 76 + 40);
    gretas.forEach(splitLetters);
    laid = true;
  }

  function draw(T) {
    if (!laid) layout();
    T = sWrap(T);
    const b = Math.floor(T / S_BEAT), P = S_PACE;
    const open = sOpen(T), h0 = sHero(T, day.kOut, day.kIn);
    wipeC.setAttribute('cx', h0[0]); wipeC.setAttribute('cy', h0[1]); wipeC.setAttribute('r', open * (1900 + B));
    const onColour = open > .5;
    svg.style.color = onColour ? pal.k : pal.w;

    // the shape: flows, turns, trails itself
    const breath = sBreath(T);
    [[band2, S_TRAIL[0], 1.16], [band1, S_TRAIL[1], 1.32]].forEach(([p, lag, s]) => {
      const h = sHero(T - lag, day.kOut, day.kIn);
      p.setAttribute('d', shapePath(n, h[3], h[2] * s * breath, h[0], h[1], -sSpin(T - lag, n)));
    });
    hero.setAttribute('d', shapePath(n, h0[3], h0[2] * breath, h0[0], h0[1], sSpin(T, n)));
    hero.setAttribute('fill', onColour ? pal.k : pal.w);

    // scenes: hidden when off; every element builds in on its own delay and rises into place
    G.forEach((g, i) => { g.style.display = sScene(T, i) > 0 ? '' : 'none'; });
    builds.forEach(o => {
      const v = sBuild(T, o.scene, o.d);
      o.node.setAttribute('opacity', v.toFixed(3));
      o.node.setAttribute('transform', `translate(0 ${((1 - v) * o.rise).toFixed(1)})`);
    });

    // Greta, letter by letter: each on its own wght / wdth / OPTI; revealed texts write themselves in
    letters.forEach(L => {
      const g = L.g;
      let base = g.base;
      if (g.t === lineA) base = 95 - 65 * sOut((T - sAt(5, 1.6)) / (.4 * P));   // the shown line thins when the hidden one lands
      if (g.t === lineB) base = 30 + 65 * sOut((T - sAt(5, 1.6)) / (.4 * P));
      fvs(L.s, ...sLetter(T, L.i, base, g.amp, g.seed));
      if (g.reveal != null) {
        const sc = g.t === introName ? 0 : 5;
        const v = Math.min(sOut((T - g.reveal - L.i * .05 * P) / (.35 * P)), sScene(T, sc));
        L.s.setAttribute('opacity', v.toFixed(3));
      }
    });
    wordmark.style.fontVariationSettings = `'wght' ${(100 * (1 - h0[3])).toFixed(1)}`;

    // 1 · letter spacing pulls the word together, Secolo cuts on the beat
    word.setAttribute('letter-spacing', (4 + 90 * (1 - sOut((T - sAt(1, .35)) / (1.4 * P)))).toFixed(1));
    secolo(word, b);

    // 2 · the figure counts up; the axis draws; bars wipe in; marks stamp one by one
    if (/^\d+$/.test(day.num)) num.textContent = String(Math.round(+day.num * sOut((T - sAt(2, .3)) / (1.8 * P))));
    secolo(num, b + 1);
    axis.setAttribute('width', (TL.x1 - TL.x0) * sOut((T - sAt(2, 1.25)) / (.8 * P)));
    const fill = sOut((T - sAt(2, 1.7)) / (.8 * P));
    spans.forEach(s => s.r.setAttribute('width', Math.max(6, (hx(s.b) - hx(s.a)) * fill) * (fill > 0)));
    const nm = marks.length;
    marks.forEach(m => {
      const pop = sBack((T - sAt(2, 1.7 + m.j * Math.min(.25, 1.2 / nm))) / (.35 * P));
      m.p.setAttribute('d', pop > .01 ? shapePath(n, m.k === null ? day.kOut : m.k, 26 * pop, m.x, TL.y - 40, 0) : '');
    });

    // 3 · the legend pops in, the scale draws, the gap bar fills, the "now" shape rides with the big shape
    legend.forEach(L => {
      const pop = sBack((T - sAt(3, .5 + L.j * .12)) / (.35 * P));
      L.p.setAttribute('d', pop > .01 ? shapePath(n, L.kk, 18 * pop, k2x(L.kk), 730, 0) : '');
    });
    scaleLine.setAttribute('width', (col.x1 - col.x0) * sOut((T - sAt(3, .9)) / (.6 * P)));
    gapBar.setAttribute('width', Math.max(4, (k2x(kb) - k2x(ka)) * sOut((T - sAt(3, 1.1)) / (.8 * P))));
    nowP.setAttribute('d', shapePath(n, h0[3], 17, k2x(sClamp(h0[3])), 780, sSpin(T, n)));

    // 4 · the day opens left to right; each share bar grows as its row arrives
    stripR.setAttribute('width', 960 * sOut((T - sAt(4, .45)) / (1.4 * P)));
    rows.forEach(r => r.bar.setAttribute('width', r.w * sOut((T - sAt(4, r.d + .15)) / (.6 * P))));

    // header
    prog.forEach(p => p.fill.setAttribute('width', p.w * sClamp((T - p.a) / (p.b - p.a))));
    mark.setAttribute('d', shapePath(n, h0[3], 20, 72, 92, sSpin(T, n)));
  }
  return { draw, day };
}

if (typeof module !== 'undefined') module.exports = { createStory };
