/* WHEEP · the wrapped story (web). One day, six scenes on a 34 s loop (1080×1350):
   0 intro (the name) · 1 the feeling that led the day · 2 the figure and when it happened
   3 outside vs inside · 4 the day in feelings · 5 the two lines, then back to the start.
   Three layouts, so neighbouring stories don't move alike (LAYOUT, by feeling; opts.layout overrides):
     A · line  the shape travels centre → right → bleeds off; a 24h line, a horizontal scale, a strip and bars; text rises in
     B · dial  the shape swings left, then hides small; a 24h clock, the two shapes side by side, a ring; text slides in
     C · grid  the shape sinks low, then climbs; a grid of hours, a vertical scale, a 100-square waffle; text drops in
   Every element builds in on its own beat; Greta moves letter by letter on wght, wdth and OPTI.
   Timeline and shape paths live in story-core.js; words come from copy.js.
   Needs shape.js, motion.js (M_KEYS), days.js (palette, SECOLO), copy.js, story-core.js. */

const SW = 1080, SH = 1350, SNS = 'http://www.w3.org/2000/svg';
const LAYOUT = { anger: 0, press: 1, fear: 2, cry: 0, joy: 1, shame: 2, release: 0 };   // the week reads A B C A B C A

function createStory(svg, day, opts = {}) {   // opts.bleed: the ground runs past the frame to the real screen edge
  const e = EMO[day.emo], pal = palette(e.c), n = e.n, id = 's' + Math.floor(Math.random() * 1e9), U = COPY.ui;
  const V = opts.layout ?? LAYOUT[day.emo] ?? 0;
  if (COPY.motion) Object.assign(S_GRETA, COPY.motion);
  const el = (tag, attrs = {}, parent = svg) => {
    const x = document.createElementNS(SNS, tag);
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    parent.append(x);
    return x;
  };
  const secolo = (t, i) => t.style.fontFamily = SECOLO[((i % 4) + 4) % 4];
  const rect = (parent, x, y, w, h, fill) => el('rect', { x, y, width: w, height: h, fill }, parent);
  const P = S_PACE;
  const ease = (T, i, d, dur) => sOut((T - sAt(i, d)) / (dur * P));        // a reveal inside scene i
  const pop = (T, i, d) => sBack((T - sAt(i, d)) / (.35 * P));

  // build-up: every element enters on its own delay inside its scene, from the layout's direction
  const DIR = [[0, 1], [1.4, 0], [0, -1]][V];   // A rises, B slides in from the right (the reading side), C drops
  const builds = [];
  const build = (node, scene, d, rise = 28) => (builds.push({ node, scene, d, rise }), node);
  // Greta texts: split into letters later; each letter gets its own axes. reveal: letters appear one by one
  const gretas = [];
  const txt = (parent, str, x, y, size, o = {}) => {
    // fill follows the ground: white on ink, ink on the feeling (svg text defaults to black)
    const t = el('text', { x, y, 'font-size': size, fill: o.fill || 'currentColor', 'text-anchor': o.anchor || 'start', style: `direction:${o.ltr ? 'ltr' : 'rtl'};font-family:${o.face || 'Greta'}` }, parent);
    t.textContent = str;
    if (!o.face) { gretas.push({ t, base: o.w ?? 50, amp: o.amp ?? 22, reveal: o.reveal, seed: gretas.length * 1.37 }); t.style.fontVariationSettings = `'wght' ${o.w ?? 50}`; }
    if (o.scene != null) build(t, o.scene, o.d || 0, o.rise);
    return t;
  };

  // text that must fit: measured at its widest (wght 100), then shrunk, or wrapped into balanced lines
  let probe;   // made after the svg is cleared, below
  const measure = (s, size, rtl) => { probe.setAttribute('font-size', size); probe.style.direction = rtl ? 'rtl' : 'ltr'; probe.textContent = s; return probe.getComputedTextLength(); };
  const fit = (t, maxW) => {
    const w = t.style.fontFamily.startsWith('Greta') ? measure(t.textContent, t.getAttribute('font-size'), t.style.direction !== 'ltr') : t.getComputedTextLength();
    if (w > maxW) t.setAttribute('font-size', (+t.getAttribute('font-size') * maxW / w).toFixed(1));
  };
  const wrap = (t, maxW, lineH) => {
    const words = t.textContent.split(' ').filter(Boolean), size = t.getAttribute('font-size'), x = t.getAttribute('x');
    const W = s => measure(s, size, true);
    const greedy = w => {
      const lines = [[]];
      for (const word of words) {
        const cur = lines[lines.length - 1];
        if (cur.length && W([...cur, word].join(' ')) > w) lines.push([word]); else cur.push(word);
      }
      return lines;
    };
    let lines = greedy(maxW);
    if (lines.length > 1) {   // balance: the narrowest width that still takes the same number of lines (even rag, no orphans)
      let lo = maxW * .3, hi = maxW;
      for (let k = 0; k < 12; k++) { const mid = (lo + hi) / 2; if (greedy(mid).length > lines.length) lo = mid; else hi = mid; }
      lines = greedy(hi);
      const last = lines[lines.length - 1], prev = lines[lines.length - 2];   // still one word alone? pull one down
      if (last.length === 1 && prev.length > 2 && W([prev[prev.length - 1], ...last].join(' ')) <= maxW) last.unshift(prev.pop());
    }
    t.textContent = '';
    lines.forEach((l, i) => { el('tspan', { x, dy: i ? lineH : 0 }, t).textContent = l.join(' '); });
    return lines.length;
  };
  // after layout: every Greta text becomes one tspan per letter (inside its wrapped lines, if any)
  const letters = [];
  const splitLetters = g => {
    const hosts = g.t.querySelector('tspan') ? [...g.t.querySelectorAll(':scope > tspan')] : [g.t];
    let i = 0;
    hosts.forEach(h => {
      const chars = [...h.textContent];
      h.textContent = '';
      chars.forEach(ch => { const s = el('tspan', {}, h); s.textContent = ch; letters.push({ s, g, i: i++, fv: '', o: '' }); });
    });
    g.count = i;
  };

  svg.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${day.name}, ${day.day} ${day.date}. ${e.he}: ${day.num} ${day.unit}. ${day.b} ${day.s}`);
  svg.textContent = '';
  const defs = el('defs');
  probe = el('text', { x: -9999, y: -9999, style: "font-family:Greta;font-variation-settings:'wght' 100" });

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
  const anim = [];   // per-frame updates of the layout's infographics, run only while their scene is up
  const every = (sc, f) => anim.push({ sc, f });
  const arc = (cx, cy, r, a0, a1) => {
    if (a1 - a0 < 1e-3) return '';
    a1 = Math.min(a1, a0 + 2 * Math.PI - 1e-3);
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const hh = h => String(h).padStart(2, '0') + ':00';

  // 0 · intro: the name letter by letter, then the line, then the date
  const I = [{ x: 540, y: 930, a: 'middle' }, { x: 1020, y: 1000, a: 'start' }, { x: 540, y: 420, a: 'middle' }][V];
  const introName = txt(G[0], day.name, I.x, I.y, V === 1 ? 160 : 140, { anchor: I.a, w: 90, amp: 14, reveal: sAt(0, .25) });
  fits.push([introName, 900]);
  const iy = V === 2 ? [1150, 1210] : [I.y + 80, I.y + 142];
  txt(G[0], U.intro, I.x, iy[0], 54, { anchor: I.a, w: 40, scene: 0, d: 1.0 });
  txt(G[0], `${day.day} · ${day.date}`, I.x, iy[1], 34, { anchor: I.a, w: 60, amp: 15, scene: 0, d: 1.3 });

  // 1 · the feeling that led the day (written once; letter spacing pulls it together)
  const F1 = [{ x: 540, a: 'middle', l: 220, w: 1090, s: 1176, max: 960 }, { x: 1020, a: 'start', l: 240, w: 640, s: 720, max: 440 }, { x: 540, a: 'middle', l: 220, w: 470, s: 550, max: 960 }][V];
  txt(G[1], U.led, F1.x, F1.l, 38, { anchor: F1.a, w: 80, amp: 26, scene: 1, d: .1 });
  const word = build(txt(G[1], e.he, F1.x, F1.w, 230, { anchor: F1.a, face: SECOLO[0] }), 1, .35, 60);
  fits.push([word, F1.max]);
  fits.push([txt(G[1], copyFill(U.share, { pct: day.shares[0].pct }), F1.x, F1.s, 40, { anchor: F1.a, w: 50, scene: 1, d: 1.2 }), F1.max]);

  // 2 · the figure counts up, then when it happened
  const isInt = /^\d+$/.test(day.num);
  let num;
  txt(G[2], U.measured, 1020, 240, 38, { w: 85, amp: 26, scene: 2, d: 0 });
  if (V === 0) {   // A · a 24h line: the axis draws, hours arrive, bars wipe in, events pop
    num = build(txt(G[2], day.num, 60, 690, 320, { ltr: true, face: SECOLO[0] }), 2, .2, 50);
    fits.push([txt(G[2], day.unit, 60, 766, 48, { anchor: 'end', w: 60, scene: 2, d: .7 }), 520]);
    const TL = { x0: 60, x1: 1020, y: 1068 }, hx = h => TL.x0 + h / 24 * (TL.x1 - TL.x0);
    txt(G[2], U.when, 1020, 940, 34, { w: 85, amp: 26, scene: 2, d: 1.0 });
    fits.push([txt(G[2], day.label, 60, 940, 34, { anchor: 'end', w: 50, scene: 2, d: 1.15 }), 660]);
    const axis = rect(G[2], TL.x0, TL.y - 1.5, 0, 3, 'currentColor');
    [0, 6, 12, 18, 24].forEach((h, j) => {
      const g = build(el('g', {}, G[2]), 2, 1.4 + j * .08, 10);
      rect(g, hx(h) - 1, TL.y, 2, 14, 'currentColor');
      txt(g, hh(h), hx(h) + (h === 0 ? 36 : h === 24 ? -36 : 0), TL.y + 46, 26, { ltr: true, anchor: 'middle', w: 40, amp: 18 });
    });
    const spans = day.spans.map(([a, b]) => ({ a, b, r: rect(G[2], hx(a), TL.y - 13, 0, 24, 'currentColor') }));
    const marks = day.marks.map(([h, k], j) => ({ x: hx(h), k, j, p: el('path', { fill: 'currentColor' }, G[2]) }));
    every(2, T => {
      axis.setAttribute('width', (TL.x1 - TL.x0) * ease(T, 2, 1.25, .8));
      const f = ease(T, 2, 1.7, .8);
      spans.forEach(s => s.r.setAttribute('width', Math.max(6, (hx(s.b) - hx(s.a)) * f) * (f > 0)));
      marks.forEach(m => { const p = pop(T, 2, 1.7 + m.j * Math.min(.25, 1.2 / marks.length)); m.p.setAttribute('d', p > .01 ? shapePath(n, m.k ?? day.kOut, 26 * p, m.x, TL.y - 40, 0) : ''); });
    });
  } else if (V === 1) {   // B · a 24h clock: the ring draws, the hours come round it, the figure sits in the middle
    const C = { x: 540, y: 790, r: 270 }, ang = h => h / 24 * 2 * Math.PI - Math.PI / 2;
    const ring = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-opacity': .3 }, G[2]);
    [0, 6, 12, 18].forEach((h, j) => {
      const g = build(el('g', {}, G[2]), 2, 1.3 + j * .1, 14), a = ang(h);
      txt(g, hh(h), C.x + (C.r + 52) * Math.cos(a), C.y + (C.r + 52) * Math.sin(a) + 9, 26, { ltr: true, anchor: 'middle', w: 40, amp: 18 });
    });
    const spans = day.spans.map(([a, b]) => ({ a: ang(a), b: ang(b), p: el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 26 }, G[2]) }));
    const marks = day.marks.map(([h, k], j) => ({ a: ang(h), k, j, p: el('path', { fill: 'currentColor' }, G[2]) }));
    num = build(txt(G[2], day.num, C.x, C.y + 40, 180, { ltr: true, anchor: 'middle', face: SECOLO[0] }), 2, .2, 30);
    fits.push([num, 360]);
    fits.push([txt(G[2], day.unit, C.x, C.y + 100, 36, { anchor: 'middle', w: 60, scene: 2, d: .7 }), 380]);
    txt(G[2], U.when, 540, 1190, 30, { anchor: 'middle', w: 85, amp: 26, scene: 2, d: 1.0 });
    fits.push([txt(G[2], day.label, 540, 1245, 34, { anchor: 'middle', w: 50, scene: 2, d: 1.15 }), 960]);
    every(2, T => {
      ring.setAttribute('d', arc(C.x, C.y, C.r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * ease(T, 2, 1.0, 1.0)));
      const f = ease(T, 2, 1.7, .9);
      spans.forEach(s => s.p.setAttribute('d', f > 0 ? arc(C.x, C.y, C.r, s.a, s.a + Math.max(.03, s.b - s.a) * f) : ''));
      marks.forEach(m => { const p = pop(T, 2, 1.7 + m.j * Math.min(.25, 1.2 / marks.length)); m.p.setAttribute('d', p > .01 ? shapePath(n, m.k ?? day.kOut, 22 * p, C.x + (C.r - 50) * Math.cos(m.a), C.y + (C.r - 50) * Math.sin(m.a), 0) : ''); });
    });
  } else {   // C · a grid of 24 hours: each hour fills as much as it held, events land in their hour
    num = build(txt(G[2], day.num, 1020, 520, 260, { ltr: true, anchor: 'end', face: SECOLO[0] }), 2, .2, 40);
    fits.push([txt(G[2], day.unit, 1020, 600, 44, { w: 60, scene: 2, d: .7 }), 600]);
    txt(G[2], U.when, 1020, 672, 34, { w: 85, amp: 26, scene: 2, d: 1.0 });
    const cw = 80, rows = [700, 830], cx = h => 60 + (h % 12) * cw, cy = h => rows[h < 12 ? 0 : 1];
    const cover = h => Math.min(1, day.spans.reduce((c, [a, b]) => c + Math.max(0, Math.min(b, h + 1) - Math.max(a, h)), 0));
    const cells = [];
    for (let h = 0; h < 24; h++) {
      const g = build(el('g', {}, G[2]), 2, 1.2 + (h % 12) * .04 + (h < 12 ? 0 : .2), 12);
      rect(g, cx(h) + 2, cy(h), cw - 4, 80, 'currentColor').setAttribute('opacity', .14);
      cells.push({ h, c: cover(h), r: rect(g, cx(h) + 2, cy(h), 0, 80, 'currentColor') });
    }
    [0, 6, 12, 18].forEach((h, j) => txt(G[2], hh(h), cx(h) + 2, cy(h) + 108, 26, { ltr: true, w: 40, amp: 18, scene: 2, d: 1.5 + j * .08, rise: 10 }));
    const marks = day.marks.map(([h, k], j) => {
      const hr = Math.floor(h);
      return { x: cx(hr) + cw / 2, y: cy(hr) + 40, k, j, p: el('path', { fill: cover(hr) > .5 ? pal.w : pal.k }, G[2]) };
    });
    fits.push([txt(G[2], day.label, 1020, 1010, 34, { w: 50, scene: 2, d: 1.15 }), 960]);
    every(2, T => {
      cells.forEach(c => c.r.setAttribute('width', ((cw - 4) * c.c * ease(T, 2, 1.6 + (c.h % 12) * .05 + (c.h < 12 ? 0 : .2), .5)).toFixed(1)));
      marks.forEach(m => { const p = pop(T, 2, 2.0 + m.j * Math.min(.25, 1.2 / marks.length)); m.p.setAttribute('d', p > .01 ? shapePath(n, m.k ?? day.kOut, 24 * p, m.x, m.y, 0) : ''); });
    });
  }
  every(2, (T, b) => {
    if (isInt) num.textContent = String(Math.round(+day.num * ease(T, 2, .3, 1.8)));
    secolo(num, b + 1);
  });

  // 3 · outside vs inside: title, the gap, the comparison, one sentence that says what the gap means
  const gapPct = Math.round(Math.abs(day.kIn - day.kOut) * 100), meaningStr = day.kIn > day.kOut ? U.meaningUp : U.meaningDown;
  const ka = Math.min(day.kOut, day.kIn), kb = Math.max(day.kOut, day.kIn);
  if (V === 0) {   // A · a horizontal scale on the shape's own four drawings
    const col = { x0: 60, x1: 450 }, k2x = kk => col.x0 + kk * (col.x1 - col.x0);
    txt(G[3], U.outIn, col.x1, 560, 44, { w: 85, amp: 26, scene: 3, d: 0 });
    txt(G[3], copyFill(U.gap, { gap: gapPct }), col.x1, 618, 36, { w: 55, scene: 3, d: .3 });
    const legend = M_KEYS.map((kk, j) => ({ kk, j, p: el('path', { fill: pal.b }, G[3]) }));
    txt(G[3], U.soft, k2x(0), 692, 28, { anchor: 'middle', w: 50, amp: 20, scene: 3, d: .5 });
    txt(G[3], U.sharp, k2x(1), 692, 28, { anchor: 'middle', w: 50, amp: 20, scene: 3, d: .85 });
    const line = rect(G[3], col.x0, 779, 0, 2, 'currentColor');
    const gapBar = rect(G[3], k2x(ka), 774, 0, 12, 'currentColor');
    const close = Math.abs(k2x(day.kIn) - k2x(day.kOut)) < 170;   // the labels are about 150 wide
    [[day.kOut, U.outside, 0, 1.3], [day.kIn, U.inside, close ? 1 : 0, 1.5]].forEach(([kk, label, row, d]) => {
      const g = build(el('g', {}, G[3]), 3, d, 16);
      rect(g, k2x(kk) - 1, 780, 2, 50 + row * 40, 'currentColor');
      txt(g, label, Math.max(col.x0 + 75, Math.min(col.x1 - 75, k2x(kk))), 862 + row * 40, 32, { anchor: 'middle', w: 80, amp: 24 });   // kept inside the column
    });
    const nowP = build(el('path', { fill: 'currentColor' }, G[3]), 3, 1.4, 0);
    fits.push([txt(G[3], meaningStr, col.x1, 1000, 40, { w: 45, scene: 3, d: 1.8 }), col.x1 - col.x0, 52]);
    every(3, (T, b, h0) => {
      legend.forEach(L => { const p = pop(T, 3, .5 + L.j * .12); L.p.setAttribute('d', p > .01 ? shapePath(n, L.kk, 18 * p, k2x(L.kk), 730, 0) : ''); });
      line.setAttribute('width', (col.x1 - col.x0) * ease(T, 3, .9, .6));
      gapBar.setAttribute('width', Math.max(4, (k2x(kb) - k2x(ka)) * ease(T, 3, 1.1, .8)));
      nowP.setAttribute('d', shapePath(n, h0[3], 17, k2x(sClamp(h0[3])), 780, sSpin(T, n)));
    });
  } else if (V === 1) {   // B · the two shapes side by side: what showed (right, read first) and what was inside
    txt(G[3], U.outIn, 1020, 240, 44, { w: 85, amp: 26, scene: 3, d: 0 });
    txt(G[3], copyFill(U.gap, { gap: gapPct }), 1020, 300, 36, { w: 55, scene: 3, d: .3 });
    const pair = [[760, day.kOut, U.outside, .6], [320, day.kIn, U.inside, 1.0]].map(([x, kk, label, d]) => {
      txt(G[3], label, x, 930, 34, { anchor: 'middle', w: 80, amp: 24, scene: 3, d: d + .2, rise: 16 });
      return { x, kk, d, p: el('path', { fill: 'currentColor' }, G[3]) };
    });
    const link = rect(G[3], 600, 699, 0, 2, 'currentColor');
    fits.push([txt(G[3], meaningStr, 1020, 1080, 40, { w: 45, scene: 3, d: 1.8 }), 960, 52]);
    every(3, T => {
      pair.forEach(s => { const p = pop(T, 3, s.d); s.p.setAttribute('d', p > .01 ? shapePath(n, s.kk, 150 * p, s.x, 700, sSpin(T, n)) : ''); });
      const f = ease(T, 3, 1.3, .6);   // a line between them draws from the outside toward the inside
      link.setAttribute('x', 600 - 120 * f); link.setAttribute('width', 120 * f);
    });
  } else {   // C · a vertical scale: soft at the bottom, sharp at the top; the gap is a bar up the column
    const X = 900, k2y = kk => 1040 - kk * 560;
    txt(G[3], U.outIn, 1020, 260, 44, { w: 85, amp: 26, scene: 3, d: 0 });
    txt(G[3], copyFill(U.gap, { gap: gapPct }), 1020, 320, 36, { w: 55, scene: 3, d: .3 });
    const legend = M_KEYS.map((kk, j) => ({ kk, j, p: el('path', { fill: pal.b }, G[3]) }));
    txt(G[3], U.sharp, X, 445, 28, { anchor: 'middle', w: 50, amp: 20, scene: 3, d: .85 });
    txt(G[3], U.soft, X, 1085, 28, { anchor: 'middle', w: 50, amp: 20, scene: 3, d: .5 });
    const line = rect(G[3], X - 1, k2y(0), 2, 0, 'currentColor');
    const gapBar = rect(G[3], X - 6, k2y(ka), 12, 0, 'currentColor');
    const close = Math.abs(k2y(day.kIn) - k2y(day.kOut)) < 50;
    [[day.kOut, U.outside, 0, 1.3], [day.kIn, U.inside, close ? (day.kIn > day.kOut ? -1 : 1) : 0, 1.5]].forEach(([kk, label, row, d]) => {
      const g = build(el('g', {}, G[3]), 3, d, 16);
      rect(g, X - 70, k2y(kk) - 1, 70, 2, 'currentColor');
      txt(g, label, X - 84, k2y(kk) + 11 + row * 40, 32, { w: 80, amp: 24 });
    });
    const nowP = build(el('path', { fill: 'currentColor' }, G[3]), 3, 1.4, 0);
    fits.push([txt(G[3], meaningStr, 1020, 1180, 40, { w: 45, scene: 3, d: 1.8 }), 960, 52]);
    every(3, (T, b, h0) => {
      legend.forEach(L => { const p = pop(T, 3, .5 + L.j * .12); L.p.setAttribute('d', p > .01 ? shapePath(n, L.kk, 18 * p, X + 60, k2y(L.kk), 0) : ''); });
      const f = ease(T, 3, .9, .6);
      line.setAttribute('y', k2y(0) - 560 * f); line.setAttribute('height', 560 * f);
      const g = Math.max(4, (k2y(ka) - k2y(kb)) * ease(T, 3, 1.1, .8));
      gapBar.setAttribute('y', k2y(ka) - g); gapBar.setAttribute('height', g);
      nowP.setAttribute('d', shapePath(n, h0[3], 17, X, k2y(sClamp(h0[3])), sSpin(T, n)));
    });
  }

  // 4 · the day in feelings, on an ink band that rises
  const bandTop = [520, 420, 480][V];
  const g4 = build(el('g', {}, G[4]), 4, 0, 160);
  rect(g4, -B, bandTop, SW + 2 * B, SH - bandTop + B, pal.k);
  txt(g4, U.feelings, 1020, bandTop + 90, 44, { w: 85, amp: 26, fill: pal.w, scene: 4, d: .25 });
  const top3 = day.shares.slice(0, 3);
  if (V === 0) {   // A · the waking hours as a strip opening left to right, then the top three as bars
    const stripClip = el('clipPath', { id: id + 'm' }, defs), stripR = rect(stripClip, 60, 640, 0, 110, '#000');
    const strip = el('g', { 'clip-path': `url(#${id}m)` }, g4);
    const sx = h => 60 + (h - 7) / 16.5 * 960;
    day.segs.forEach(s => {
      rect(strip, sx(s.from), 650, Math.max(1, sx(s.to) - sx(s.from) - 3), 90, EMO[s.emo].c);
      if (sx(s.to) - sx(s.from) > 44) el('path', { fill: pal.k, d: shapePath(EMO[s.emo].n, .5, 18, (sx(s.from) + sx(s.to)) / 2, 695, 0) }, strip);
    });
    [[7, '07:00'], [12, '12:00'], [18, '18:00'], [23.5, '23:30']].forEach(([h, l], j) =>
      txt(g4, l, sx(h) + (h === 7 ? 36 : h === 23.5 ? -36 : 0), 790, 26, { ltr: true, anchor: 'middle', w: 40, amp: 18, fill: pal.w, scene: 4, d: 1.1 + j * .1 }));
    const rows = top3.map((s, j) => {
      const g = build(el('g', {}, g4), 4, 1.3 + j * .3, 24), y = 900 + j * 100, E = EMO[s.emo];
      el('path', { fill: E.c, d: shapePath(E.n, .5, 26, 990, y - 14, 0) }, g);
      txt(g, E.he, 950, y, 44, { w: j ? 45 : 90, amp: 24, fill: pal.w });
      txt(g, `${s.pct}%`, 60, y, 54, { ltr: true, face: SECOLO[2], fill: pal.w });
      return { bar: rect(g, 230, y - 26, 0, 22, E.c), w: s.pct / 100 * 500, d: 1.3 + j * .3 };
    });
    every(4, T => {
      stripR.setAttribute('width', 960 * ease(T, 4, .45, 1.4));
      rows.forEach(r => r.bar.setAttribute('width', r.w * ease(T, 4, r.d + .15, .6)));
    });
  } else if (V === 1) {   // B · a ring of the whole day, sweeping round; the top feeling's share in the middle
    const C = { x: 540, y: 830, r: 250 }, total = day.shares.reduce((a, s) => a + s.pct, 0) || 1;
    let acc = 0;
    const segs = day.shares.map(s => { const a0 = acc / total; acc += s.pct; return { a0, a1: acc / total, p: el('path', { fill: 'none', stroke: EMO[s.emo].c, 'stroke-width': 80 }, g4) }; });
    build(txt(g4, `${top3[0].pct}%`, C.x, C.y + 40, 130, { ltr: true, anchor: 'middle', face: SECOLO[2], fill: pal.w }), 4, 1.2, 20);
    txt(g4, EMO[top3[0].emo].he, C.x, C.y + 100, 40, { anchor: 'middle', w: 90, amp: 24, fill: pal.w, scene: 4, d: 1.35 });
    top3.forEach((s, j) => {
      const g = build(el('g', {}, g4), 4, 1.5 + j * .2, 0), x = 1020 - j * 330, E = EMO[s.emo];
      el('path', { fill: E.c, d: shapePath(E.n, .5, 18, x - 16, 1206, 0) }, g);
      txt(g, `${E.he} ${s.pct}%`, x - 46, 1218, 32, { w: j ? 45 : 90, amp: 24, fill: pal.w });
    });
    every(4, T => {
      const f = ease(T, 4, .45, 1.4), A = a => -Math.PI / 2 + a * 2 * Math.PI;
      segs.forEach(s => s.p.setAttribute('d', arc(C.x, C.y, C.r, A(s.a0), A(Math.min(s.a1, f)) - .012)));
    });
  } else {   // C · a waffle of 100 squares, one per percent of the waking day, filling from the top right
    const cell = 54, x0 = 60, y0 = 620, sq = [];
    day.shares.forEach(s => { for (let k = 0; k < s.pct && sq.length < 100; k++) sq.push(EMO[s.emo].c); });
    while (sq.length < 100) sq.push(null);
    const cells = sq.map((c, k) => {
      const r = rect(g4, x0 + (9 - (k % 10)) * cell, y0 + Math.floor(k / 10) * cell, cell - 6, cell - 6, c || pal.w);
      if (!c) r.setAttribute('fill-opacity', .12);
      r.setAttribute('opacity', 0);
      return { r, k, v: 0 };
    });
    top3.forEach((s, j) => {
      const g = build(el('g', {}, g4), 4, 1.3 + j * .3, 24), y = 720 + j * 110, E = EMO[s.emo];
      el('path', { fill: E.c, d: shapePath(E.n, .5, 24, 994, y - 14, 0) }, g);
      txt(g, E.he, 956, y, 42, { w: j ? 45 : 90, amp: 24, fill: pal.w });
      txt(g, `${s.pct}%`, 956, y + 58, 50, { ltr: true, anchor: 'end', face: SECOLO[2], fill: pal.w });
    });
    every(4, T => cells.forEach(c => {
      const v = Math.round(20 * ease(T, 4, .45 + c.k * .012, .25)) / 20;
      if (v !== c.v) { c.v = v; c.r.setAttribute('opacity', v); }
    }));
  }

  // 5 · the two lines, letter by letter, signed
  const L5 = [{ x: 1020, y: 940, a: 'start' }, { x: 1020, y: 330, a: 'start' }, { x: 540, y: 820, a: 'middle' }][V];
  const lineA = txt(G[5], day.b, L5.x, L5.y, 64, { anchor: L5.a, w: 95, amp: 12, reveal: sAt(5, .15) });
  const lineB = txt(G[5], day.s, L5.x, 0, 64, { anchor: L5.a, w: 30, amp: 12, reveal: sAt(5, 1.0) });
  const sign = txt(G[5], `${day.name} · ${day.day} ${day.date}`, L5.x, 0, 34, { anchor: L5.a, w: 60, amp: 15, scene: 5, d: 1.9 });

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
  fits.push([txt(head, day.name, 1020, 104, 36, { w: 70, amp: 18 }), 520]);

  // once the fonts are in: fit, wrap, stack the closing block, then split every Greta text into letters
  let laid = false;
  function layout() {
    fits.forEach(([t, maxW, lineH]) => lineH ? wrap(t, maxW, lineH) : fit(t, maxW));
    const la = wrap(lineA, 960, 76);
    lineB.setAttribute('y', L5.y + la * 76); const lb = wrap(lineB, 960, 76);
    sign.setAttribute('y', L5.y + (la + lb) * 76 + 40);
    probe.remove();
    gretas.forEach(g => { g.sc = G.findIndex(x => x.contains(g.t)); splitLetters(g); });
    laid = true;
  }

  function draw(T) {
    if (!laid) layout();
    T = sWrap(T);
    const b = Math.floor(T / S_BEAT);
    const open = sOpen(T), h0 = sHero(T, day.kOut, day.kIn, V);
    wipeC.setAttribute('cx', h0[0]); wipeC.setAttribute('cy', h0[1]); wipeC.setAttribute('r', open * (1900 + B));
    const onColour = open > .5;
    svg.style.color = onColour ? pal.k : pal.w;

    // the shape: flows, turns, trails itself
    const breath = sBreath(T);
    [[band2, S_TRAIL[0], 1.16], [band1, S_TRAIL[1], 1.32]].forEach(([p, lag, s]) => {
      const h = sHero(T - lag, day.kOut, day.kIn, V);
      p.setAttribute('d', shapePath(n, h[3], h[2] * s * breath, h[0], h[1], -sSpin(T - lag, n)));
    });
    hero.setAttribute('d', shapePath(n, h0[3], h0[2] * breath, h0[0], h0[1], sSpin(T, n)));
    hero.setAttribute('fill', onColour ? pal.k : pal.w);

    // scenes: hidden when off, and skipped (only what's on screen is drawn); elements build in from the layout's side
    const on = G.map((g, i) => { const v = sScene(T, i) > 0; g.style.display = v ? '' : 'none'; return v; });
    builds.forEach(o => {
      if (!on[o.scene]) return;
      const v = sBuild(T, o.scene, o.d), r = (1 - v) * o.rise;
      o.node.setAttribute('opacity', v.toFixed(3));
      o.node.setAttribute('transform', `translate(${(DIR[0] * r).toFixed(1)} ${(DIR[1] * r).toFixed(1)})`);
    });

    // Greta, letter by letter, rounded so a letter is only restyled when it visibly changes
    letters.forEach(L => {
      const g = L.g;
      if (g.sc >= 0 && !on[g.sc]) return;
      let base = g.base;
      if (g.t === lineA) base = 95 - 65 * ease(T, 5, 1.6, .5);   // the shown line thins when the hidden one lands
      if (g.t === lineB) base = 30 + 65 * ease(T, 5, 1.6, .5);
      const a = sLetter(T, L.i, base, g.amp, g.seed);
      const fv = `'wght' ${Math.round(a[0])}, 'wdth' ${Math.round(a[1])}, 'OPTI' ${Math.round(a[2] / 2) * 2}`;
      if (fv !== L.fv) { L.fv = fv; L.s.style.fontVariationSettings = fv; }
      if (g.reveal != null) {
        const st = Math.min(.08, 1.6 / g.count);   // a steady typing pace, but a long line still lands in time to be read
        const v = Math.min(sOut((T - g.reveal - L.i * st) / (.35 * P)), sScene(T, g.sc)).toFixed(2);
        if (v !== L.o) { L.o = v; L.s.setAttribute('opacity', v); }
      }
    });
    wordmark.style.fontVariationSettings = `'wght' ${Math.round(100 * (1 - h0[3]))}`;

    // 1 · letter spacing pulls the word together, Secolo cuts on the beat
    if (on[1]) { word.setAttribute('letter-spacing', (4 + 90 * (1 - ease(T, 1, .35, 1.4))).toFixed(1)); secolo(word, b); }
    anim.forEach(a => { if (on[a.sc]) a.f(T, b, h0); });

    // header
    prog.forEach(p => p.fill.setAttribute('width', p.w * sClamp((T - p.a) / (p.b - p.a))));
    mark.setAttribute('d', shapePath(n, h0[3], 20, 72, 92, sSpin(T, n)));
  }
  return { draw, day, layout: V };
}

if (typeof module !== 'undefined') module.exports = { createStory, LAYOUT };
