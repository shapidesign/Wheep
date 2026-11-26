/* WHEEP · the day as one still: a static infographic of the whole story, for saving as a PNG.
   summarySVG(day) → an SVG string (1080×1350, fonts embedded so it renders the same as an image);
   summaryPNG(day) → a PNG Blob (2× for sharpness). Needs shape.js, motion.js (M_KEYS), days.js (palette).
   Fonts are fetched from ./fonts and inlined once. */

const SUM_FONTS = { Greta: 'fonts/GretaSerifVF.ttf', Secolo21: 'fonts/Secolo-21.otf' };
let sumFontCSS = null;
async function sumFonts() {
  if (sumFontCSS) return sumFontCSS;
  const toData = async (url, mime) => {
    const buf = await (await fetch(url)).arrayBuffer();
    let bin = '', bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return `data:${mime};base64,${btoa(bin)}`;
  };
  const [g, s] = await Promise.all([toData(SUM_FONTS.Greta, 'font/ttf'), toData(SUM_FONTS.Secolo21, 'font/otf')]);
  sumFontCSS = `@font-face{font-family:Greta;src:url(${g});font-weight:100 900}@font-face{font-family:Secolo21;src:url(${s})}`;
  return sumFontCSS;
}

const sumEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function summarySVG(day, fontCSS = '') {
  const e = EMO[day.emo], pal = palette(e.c), n = e.n;
  const out = [];
  const T = (str, x, y, size, o = {}) => out.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${o.fill || pal.k}" text-anchor="${o.anchor || 'start'}"` +
    ` style="direction:${o.ltr ? 'ltr' : 'rtl'};font-family:${o.face || 'Greta'};font-variation-settings:'wght' ${o.w ?? 50}">${sumEsc(str)}</text>`);
  const P = (d, fill) => out.push(`<path d="${d}" fill="${fill}"/>`);
  const R = (x, y, w, h, fill) => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`);

  R(0, 0, 1080, 1350, pal.m);

  // the shape, inside: bleeds off the right edge, with its two bands
  P(shapePath(n, day.kIn, 270 * 1.32, 960, 400, -.3), pal.b);
  P(shapePath(n, day.kIn, 270 * 1.16, 960, 400, -.15), pal.a);
  P(shapePath(n, day.kIn, 270, 960, 400, 0), pal.k);

  // header
  P(shapePath(n, day.kIn, 20, 72, 72, 0), pal.k);
  T('wheep', 104, 84, 36, { ltr: true, w: 70 });
  T(`${day.day} · ${day.date}`, 560, 84, 30, { w: 55 });

  // the column: whose day, the feeling that led it, the figure
  T(copyFill(COPY.ui.summaryTitle, { name: day.name }), 560, 200, 46, { w: 95 });
  T(COPY.ui.led, 560, 262, 30, { w: 60 });
  T(e.he, 560, 430, 190, { face: 'Secolo21' });
  T(copyFill(COPY.ui.share, { pct: day.shares[0].pct }), 560, 482, 30, { w: 50 });
  T(day.num, 60, 668, 190, { ltr: true, face: 'Secolo21' });
  T(day.unit, 560, 722, 34, { w: 60 });
  T(day.label, 560, 766, 28, { w: 45 });

  // outside vs inside, on the four drawings
  const k2x = k => 60 + k * 960;
  R(0, 800, 1080, 2, pal.k);
  T(COPY.ui.outIn, 1020, 850, 32, { w: 90 });
  T(copyFill(COPY.ui.gap, { gap: Math.round(Math.abs(day.kIn - day.kOut) * 100) }), 60, 850, 32, { anchor: 'end', w: 90 });
  M_KEYS.forEach(k => P(shapePath(n, k, 15, k2x(k), 896, 0), pal.b));
  T(COPY.ui.soft, k2x(0) + 30, 902, 24, { anchor: 'end', w: 50 });
  T(COPY.ui.sharp, k2x(1) - 30, 902, 24, { w: 50 });
  R(60, 934, 960, 2, pal.k);
  const ka = Math.min(day.kOut, day.kIn), kb = Math.max(day.kOut, day.kIn);
  R(k2x(ka), 929, Math.max(4, k2x(kb) - k2x(ka)), 12, pal.k);
  const close = Math.abs(k2x(day.kIn) - k2x(day.kOut)) < 120;
  [[day.kOut, COPY.ui.outside, 0], [day.kIn, COPY.ui.inside, close ? 1 : 0]].forEach(([k, l, row]) => {
    R(k2x(k) - 1, 935, 2, 22 + row * 30, pal.k);
    T(l, k2x(k), 980 + row * 30, 26, { anchor: 'middle', w: 80 });
  });

  // the day in feelings, on ink: the strip, the top three, the two lines
  R(0, 1030, 1080, 320, pal.k);
  T(COPY.ui.feelings, 1020, 1080, 30, { fill: pal.w, w: 85 });
  const sx = h => 60 + (h - 7) / 16.5 * 960;
  day.segs.forEach(s => R(sx(s.from), 1100, Math.max(1, sx(s.to) - sx(s.from) - 3), 40, EMO[s.emo].c));
  T('07:00', 60, 1170, 22, { ltr: true, fill: pal.w, w: 40 });
  T('23:30', 1020, 1170, 22, { ltr: true, anchor: 'end', fill: pal.w, w: 40 });
  day.shares.slice(0, 3).forEach((s, j) => {
    const E = EMO[s.emo], x = 1020 - j * 320;
    P(shapePath(E.n, .5, 16, x - 14, 1206, 0), E.c);
    T(`${E.he} ${s.pct}%`, x - 40, 1216, 28, { fill: pal.w, w: j ? 45 : 90 });
  });
  T(day.b, 1020, 1280, 36, { fill: pal.w, w: 95 });
  T(day.s, 1020, 1326, 36, { fill: pal.w, w: 35 });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><style>${fontCSS}</style>${out.join('')}</svg>`;
}

async function summaryPNG(day, scale = 2) {
  const svg = summarySVG(day, await sumFonts());
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    await new Promise(r => setTimeout(r, 60));   // let the embedded fonts settle before drawing
    const c = document.createElement('canvas');
    c.width = 1080 * scale; c.height = 1350 * scale;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(r, 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

// save on a phone (share sheet → "Save image") or download on a desktop
async function saveSummary(day) {
  const blob = await summaryPNG(day);
  const file = new File([blob], `wheep-${day.name}-${day.date.replace('.', '-')}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `WHEEP · ${day.name}` }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
