// Shared Bouba/Kiki kit for the feature previews (same geometry and colours as the app).
(() => {
  const lerp = (a, b, t) => a + (b - a) * t;
  const BASE = {
    burst: () => 1,
    drop: (a) => .7 + .44 * Math.max(0, Math.cos(a + Math.PI / 2)) ** 5,
    box: (a) => .8 / ((Math.abs(Math.cos(a)) ** 7 + Math.abs(Math.sin(a)) ** 7) ** (1 / 7)),
    bubble: (a) => .78 + .5 * Math.max(0, Math.cos(a - Math.PI * .7)) ** 22,
    blob: (a) => .92 + .06 * Math.sin(a * 3),
  };
  const SHARP = { burst: 1, drop: .42, box: .3, bubble: .36, blob: .5 };
  const polar = ({ round = 0, R = 20, cx = 24, cy = 24, n = 9, base = 'burst', tremble = 0, phase = 0, N = 200 }) => {
    const B = BASE[base], A = lerp(.5, .07, round) * SHARP[base], K = lerp(2.6, 1, round);
    let d = '';
    for (let j = 0; j < N; j++) {
      const u = (j / N) * n * 2, tri = Math.abs((u % 2) - 1), soft = (Math.cos(Math.PI * u) + 1) / 2;
      const w = lerp(tri ** K, soft, round), spike = Math.floor((u + 1) / 2);
      const ang = -Math.PI / 2 + (j / N) * Math.PI * 2;
      const r = R * B(ang) * (1 - A * (1 - w)) * (1 + tremble * Math.sin(phase + spike * 1.9) * w);
      d += `${j ? 'L' : 'M'}${(cx + r * Math.cos(ang)).toFixed(2)} ${(cy + r * Math.sin(ang)).toFixed(2)}`;
    }
    return d + 'Z';
  };
  const KB = [[255, 90, 54], [255, 210, 63], [63, 200, 245]];
  const color = (round) => {
    const t = Math.max(0, Math.min(1, round)) * 2, i = Math.min(1, Math.floor(t)), f = t - i;
    return `rgb(${KB[i].map((x, k) => Math.round(x + (KB[i + 1][k] - x) * f)).join(',')})`;
  };
  const shape = (round, { base = 'burst', n = 9, fill, shadow = false, cls = 'kshape', dashed = false } = {}) => {
    const d = polar({ round, R: 18, base, n });
    return `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${shadow ? `<path d="${d}" transform="translate(2.5 2.5)" fill="#121212"/>` : ''}<path d="${d}" fill="${fill || color(round)}" stroke="#121212" stroke-width="2.4" stroke-linejoin="round"${dashed ? ' stroke-dasharray="4 3"' : ''}/></svg>`;
  };
  window.K = { lerp, polar, color, shape, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
})();
