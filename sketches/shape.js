// WHEEP sketches: the one shape language, shared. round 0 = spikes (held in), 1 = soft (let out).
window.WHEEP = (() => {
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (t) => Math.max(0, Math.min(1, t));
  const polar = ({ round = 0, R = 20, cx = 24, cy = 24, n = 9, tremble = 0, phase = 0, N = 220 }) => {
    const A = lerp(.5, .06, round), K = lerp(2.6, 1, round);
    let d = '';
    for (let j = 0; j < N; j++) {
      const u = (j / N) * n * 2, tri = Math.abs((u % 2) - 1), soft = (Math.cos(Math.PI * u) + 1) / 2;
      const w = lerp(tri ** K, soft, round), ang = -Math.PI / 2 + (j / N) * Math.PI * 2;
      const r = R * (1 - A * (1 - w)) * (1 + tremble * Math.sin(phase + Math.floor((u + 1) / 2) * 1.9) * w);
      d += `${j ? 'L' : 'M'}${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`;
    }
    return `${d}Z`;
  };
  const KB = [[255, 90, 54], [255, 210, 63], [63, 200, 245]];
  const kb = (t) => { t = clamp(t) * 2; const i = Math.min(1, Math.floor(t)), f = t - i; return `rgb(${KB[i].map((x, k) => Math.round(x + (KB[i + 1][k] - x) * f))})`; };
  // a small brutalist shape: hard ink shadow, outline, flat fill
  const mini = (round, fill = kb(round), n = 9, size = 40, dashed = false) => {
    const c = size / 2, d = polar({ round, R: c * .84, cx: c, cy: c, n });
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true" style="overflow:visible">`
      + (dashed ? `<path d="${d}" fill="none" stroke="#121212" stroke-width="1.5" stroke-dasharray="3 3"/>`
        : `<path d="${d}" fill="#121212" transform="translate(2 2)"/><path d="${d}" fill="${fill}" stroke="#121212" stroke-width="2" stroke-linejoin="round"/>`)
      + '</svg>';
  };
  // fit the phone(s) to the window on desktop
  const fit = (w = 414, h = 868) => {
    const go = () => {
      const top = (document.querySelector('.sk-nav')?.offsetHeight || 0) + 48;
      document.documentElement.style.setProperty('--fit', innerWidth <= 500 ? 1 : Math.min(1, (innerHeight - top) / h, (innerWidth - 40) / w).toFixed(3));
    };
    addEventListener('resize', go); go();
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { lerp, clamp, polar, kb, mini, fit, reduced };
})();
