/* WHEEP · the wrapped story (web). One day, six scenes on a 16 s loop (1080×1350):
   0 intro (the name) · 1 the feeling that led the day · 2 the figure and when it happened
   3 outside vs inside · 4 the day in feelings · 5 the two lines, then back to the start.
   Timeline and shape motion live in story-core.js (shared with After Effects).
   Needs shape.js, motion.js (M_KEYS), days.js (palette, SECOLO), story-core.js. */

const SW = 1080, SH = 1350, SNS = 'http://www.w3.org/2000/svg';

function createStory(svg, day) {
  const e = EMO[day.emo], pal = palette(e.c), n = e.n, id = 's' + Math.floor(Math.random() * 1e9);
  const el = (tag, attrs = {}, parent = svg) => {
    const x = document.createElementNS(SNS, tag);
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    parent.append(x);
    return x;
  };
  const gretaList = [];   // every Greta text breathes: { t, base, amp, phase }
  const txt = (parent, str, x, y, size, o = {}) => {
    // fill follows the ground: white on ink, ink on the feeling (svg text defaults to black, which vanished in the intro)
    const t = el('text', { x, y, 'font-size': size, fill: 'currentColor', 'text-anchor': o.anchor || 'start', style: `direction:${o.ltr ? 'ltr' : 'rtl'};font-family:${o.face || 'Greta'}` }, parent);
    t.textContent = str;
    if (!o.face) { const w = o.w ?? 50; gretaList.push({ t, base: w, amp: o.amp ?? 22, phase: gretaList.length * .9 }); t.style.fontVariationSettings = `'wght' ${w}`; }
    return t;
  };
  const setW = (t, w) => t.style.fontVariationSettings = `'wght' ${Math.max(0, Math.min(100, w)).toFixed(1)}`;
  const secolo = (t, i) => t.style.fontFamily = SECOLO[((i % 4) + 4) % 4];
  const rect = (parent, x, y, w, h, fill) => el('rect', { x, y, width: w, height: h, fill }, parent);

  // text that must fit: measured at its heaviest (Greta breathes up to wght 100), then shrunk or wrapped
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

  svg.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${day.name}, ${day.day} ${day.date}. ${e.he}: ${day.num} ${day.unit}. ${day.b} ${day.s}`);
  svg.textContent = '';
  const defs = el('defs');

  // ground: ink, then the feeling's colour opens from the shape (and closes again at the end)
  rect(svg, 0, 0, SW, SH, pal.k);
  const wipeClip = el('clipPath', { id: id + 'w' }, defs), wipeC = el('circle', {}, wipeClip);
  rect(svg, 0, 0, SW, SH, pal.m).setAttribute('clip-path', `url(#${id}w)`);

  // the shape and two trailing bands of itself
  const band1 = el('path', { fill: pal.b }), band2 = el('path', { fill: pal.a }), hero = el('path', {});

  const G = SCENES.slice(0, -1).map(() => el('g'));
  const fits = [];   // [text, maxWidth, lineHeight?] laid out once fonts are in

  // 0 · intro
  const introName = txt(G[0], day.name, 540, 930, 140, { anchor: 'middle', w: 90, amp: 10 });
  fits.push([introName, 900]);
  txt(G[0], 'זה היום שלך.', 540, 1010, 54, { anchor: 'middle', w: 40 });
  txt(G[0], `${day.day} · ${day.date}`, 540, 1072, 34, { anchor: 'middle', w: 60, amp: 15 });

  // 1 · the feeling that led the day (written once; letter spacing pulls it together)
  const top = day.shares[0];
  txt(G[1], 'הרגש שהוביל את היום', 540, 220, 38, { anchor: 'middle', w: 80, amp: 18 });
  const word = txt(G[1], e.he, 540, 1090, 230, { anchor: 'middle', face: SECOLO[0] });
  txt(G[1], `${top.pct}% מהשעות שבהן היית ער`, 540, 1176, 40, { anchor: 'middle', w: 50 });

  // 2 · the figure, then when it happened
  txt(G[2], 'מה נמדד', 1020, 240, 38, { w: 85, amp: 12 });
  const num = txt(G[2], day.num, 60, 690, 320, { ltr: true, face: SECOLO[0] });
  const unit = txt(G[2], day.unit, 60, 766, 48, { anchor: 'end', w: 60 });
  fits.push([unit, 520]);
  const TL = { x0: 60, x1: 1020, y: 1068 }, hx = h => TL.x0 + h / 24 * (TL.x1 - TL.x0);
  txt(G[2], 'מתי', 1020, 940, 34, { w: 85, amp: 12 });
  const cap = txt(G[2], day.label, 60, 940, 34, { anchor: 'end', w: 50 });
  fits.push([cap, 660]);
  rect(G[2], TL.x0, TL.y - 1.5, TL.x1 - TL.x0, 3, 'currentColor');
  [0, 6, 12, 18, 24].forEach(h => {
    rect(G[2], hx(h) - 1, TL.y, 2, 14, 'currentColor');
    txt(G[2], String(h).padStart(2, '0') + ':00', hx(h) + (h === 0 ? 36 : h === 24 ? -36 : 0), TL.y + 46, 26, { ltr: true, anchor: 'middle', w: 40, amp: 10 });
  });
  const spans = day.spans.map(([a, b]) => ({ a, b, r: rect(G[2], hx(a), TL.y - 13, 0, 24, 'currentColor') }));
  const marks = day.marks.map(([h, k], j) => ({ x: hx(h), k, j, p: el('path', { fill: 'currentColor' }, G[2]) }));

  // 3 · outside vs inside: title, the gap on its own line, the scale on the shape's own four drawings, one sentence
  const col = { x0: 60, x1: 450 }, k2x = kk => col.x0 + kk * (col.x1 - col.x0);
  txt(G[3], 'בחוץ מול בפנים', col.x1, 560, 44, { w: 85, amp: 12 });
  txt(G[3], `פער של ${Math.round(Math.abs(day.kIn - day.kOut) * 100)}%`, col.x1, 618, 36, { w: 55 });
  M_KEYS.forEach(kk => el('path', { fill: pal.b, d: shapePath(n, kk, 18, k2x(kk), 730, 0) }, G[3]));
  txt(G[3], 'רך', k2x(0), 692, 28, { anchor: 'middle', w: 50, amp: 12 });
  txt(G[3], 'חד', k2x(1), 692, 28, { anchor: 'middle', w: 50, amp: 12 });
  rect(G[3], col.x0, 779, col.x1 - col.x0, 2, 'currentColor');
  const ka = Math.min(day.kOut, day.kIn), kb = Math.max(day.kOut, day.kIn);
  const gapBar = rect(G[3], k2x(ka), 774, 0, 12, 'currentColor');
  const close = Math.abs(k2x(day.kIn) - k2x(day.kOut)) < 120;
  [[day.kOut, 'בחוץ', 0], [day.kIn, 'בפנים', close ? 1 : 0]].forEach(([kk, label, row]) => {
    rect(G[3], k2x(kk) - 1, 780, 2, 50 + row * 40, 'currentColor');
    txt(G[3], label, k2x(kk), 862 + row * 40, 32, { anchor: 'middle', w: 80, amp: 14 });
  });
  const nowP = el('path', { fill: 'currentColor' }, G[3]);   // ink on the feeling: white vanished on the light ones
  const meaning = txt(G[3], day.kIn > day.kOut ? 'בחוץ נראית רגוע יותר ממה שהיה בפנים.' : 'בפנים היה רך יותר ממה שהראית בחוץ.', col.x1, 1000, 40, { w: 45 });
  fits.push([meaning, col.x1 - col.x0, 52]);   // wraps

  // 4 · the day in feelings: an ink band, the waking hours as coloured stretches, the top three
  const g4 = G[4];
  rect(g4, 0, 520, SW, 700, pal.k);
  txt(g4, 'היום שלך ברגשות', 1020, 610, 44, { w: 85, amp: 12 }).setAttribute('fill', pal.w);
  const stripClip = el('clipPath', { id: id + 'm' }, defs), stripR = rect(stripClip, 60, 640, 0, 110, '#000');
  const strip = el('g', { 'clip-path': `url(#${id}m)` }, g4);
  const sx = h => 60 + (h - 7) / 16.5 * 960;
  day.segs.forEach(s => {
    rect(strip, sx(s.from), 650, Math.max(1, sx(s.to) - sx(s.from) - 3), 90, EMO[s.emo].c);
    if (sx(s.to) - sx(s.from) > 44) el('path', { fill: pal.k, d: shapePath(EMO[s.emo].n, .5, 18, (sx(s.from) + sx(s.to)) / 2, 695, 0) }, strip);
  });
  [[7, '07:00'], [12, '12:00'], [18, '18:00'], [23.5, '23:30']].forEach(([h, l]) =>
    txt(g4, l, sx(h) + (h === 7 ? 36 : h === 23.5 ? -36 : 0), 790, 26, { ltr: true, anchor: 'middle', w: 40, amp: 10 }).setAttribute('fill', pal.w));
  const rows = day.shares.slice(0, 3).map((s, j) => {
    const g = el('g', {}, g4), y = 900 + j * 100, E = EMO[s.emo];
    el('path', { fill: E.c, d: shapePath(E.n, .5, 26, 990, y - 14, 0) }, g);
    txt(g, E.he, 950, y, 44, { w: j ? 45 : 90 }).setAttribute('fill', pal.w);
    const bar = rect(g, 230, y - 26, 0, 22, E.c);
    txt(g, `${s.pct}%`, 60, y, 54, { ltr: true, face: SECOLO[2] }).setAttribute('fill', pal.w);
    return { g, bar, w: s.pct / 100 * 500 };
  });

  // 5 · the two lines, signed
  const lineA = txt(G[5], day.b, 1020, 940, 64, { w: 100 });
  const lineB = txt(G[5], day.s, 1020, 0, 64, { w: 30 });
  const sign = txt(G[5], `${day.name} · ${day.day} ${day.date}`, 1020, 0, 34, { w: 60, amp: 15 });

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
  const headName = txt(head, day.name, 1020, 104, 36, { w: 70, amp: 15 });
  fits.push([headName, 520]);

  // once the fonts are in: fit names and units, wrap the long lines, stack the closing block
  let laid = false;
  function layout() {
    fits.forEach(([t, maxW, lineH]) => lineH ? wrap(t, maxW, lineH) : fit(t, maxW));
    const la = wrap(lineA, 960, 76);
    lineB.setAttribute('y', 940 + la * 76); const lb = wrap(lineB, 960, 76);
    sign.setAttribute('y', 940 + (la + lb) * 76 + 40);
    laid = true;
  }

  function draw(T) {
    if (!laid) layout();
    T = sWrap(T);
    const b = Math.floor(T / S_BEAT);
    const open = sOpen(T), h0 = sHero(T, day.kOut, day.kIn);
    wipeC.setAttribute('cx', h0[0]); wipeC.setAttribute('cy', h0[1]); wipeC.setAttribute('r', open * 1900);
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

    // scenes in and out
    G.forEach((g, i) => {
      const v = sScene(T, i);
      g.setAttribute('opacity', v.toFixed(3));
      g.setAttribute('transform', `translate(0 ${((1 - v) * 28).toFixed(1)})`);
      g.style.display = v > 0 ? '' : 'none';
    });

    // Greta breathes everywhere; the intro name and the closing lines carry their own story on top
    gretaList.forEach(g => setW(g.t, sGreta(T, g.base, g.amp, g.phase)));
    setW(introName, sGreta(T, 10 + 80 * sOut((T - .2) / 1.2), 10, 0));
    const turn = sOut((T - 14.4) / .4);
    setW(lineA, sGreta(T, 100 - 65 * turn, 8, 0)); setW(lineB, sGreta(T, 30 + 65 * turn, 8, 1.5));
    setW(wordmark, 100 * (1 - h0[3]));

    // 1 · letter spacing pulls the word together, Secolo cuts on the beat
    word.setAttribute('letter-spacing', (4 + 70 * (1 - sOut((T - 2.3) / 1.1))).toFixed(1));
    secolo(word, b);

    // 2 · the figure counts up; the line fills
    if (/^\d+$/.test(day.num)) num.textContent = String(Math.round(+day.num * sOut((T - 5.2) / 1.6)));
    secolo(num, b + 1);
    const fill = sOut((T - 5.8) / .8);
    spans.forEach(s => s.r.setAttribute('width', Math.max(6, (hx(s.b) - hx(s.a)) * fill) * (fill > 0)));
    const nm = marks.length;
    marks.forEach(m => {
      const pop = sOut((T - (5.6 + m.j * Math.min(.3, 1.4 / nm))) / .3);
      m.p.setAttribute('d', pop > 0 ? shapePath(n, m.k === null ? day.kOut : m.k, 26 * pop, m.x, TL.y - 40, 0) : '');
    });

    // 3 · the gap bar draws, the "now" shape rides the scale with the big shape
    gapBar.setAttribute('width', Math.max(4, (k2x(kb) - k2x(ka)) * sOut((T - 8.1) / .8)));
    nowP.setAttribute('d', shapePath(n, h0[3], 17, k2x(sClamp(h0[3])), 780, sSpin(T, n)));

    // 4 · the day opens left to right, the top three come in one by one
    stripR.setAttribute('width', 960 * sOut((T - 10.9) / 1.3));
    rows.forEach((r, j) => {
      const v = sOut((T - 11.6 - j * .25) / .5);
      r.g.setAttribute('opacity', v.toFixed(3));
      r.bar.setAttribute('width', r.w * v);
    });

    // header
    prog.forEach(p => p.fill.setAttribute('width', p.w * sClamp((T - p.a) / (p.b - p.a))));
    mark.setAttribute('d', shapePath(n, h0[3], 20, 72, 92, sSpin(T, n)));
  }
  return { draw, day };
}

if (typeof module !== 'undefined') module.exports = { createStory };
