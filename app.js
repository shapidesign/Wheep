// WHEEP prototype: tabs, forecast content, map, trends, profile. All data is demo data.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ── micro-interactions: everything that changes says so, briefly ── */
  const fx = (el, cls) => { if (!el || reduced) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); el.addEventListener('animationend', () => el.classList.remove(cls), { once: true }); };
  const countTo = (el, from, to, ms = 700) => {
    if (!el) return;
    if (reduced || from === to) { el.textContent = to.toLocaleString('he-IL'); return; }
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 4; el.textContent = Math.round(from + (to - from) * e).toLocaleString('he-IL'); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  // the points fly from where they were earned to the רווחה tab
  const flyPts = (txt, from) => {
    if (reduced) return;
    const ph = document.querySelector('.phone'), box = ph.getBoundingClientRect(), sc = box.width / ph.offsetWidth || 1;
    const tab = document.querySelector('#tab-gain'), src = (from && from.offsetParent ? from : tab).getBoundingClientRect(), dst = tab.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'fly-pts num'; el.textContent = txt;
    el.style.left = `${(src.left + src.width / 2 - box.left) / sc}px`; el.style.top = `${(src.top + src.height / 2 - box.top) / sc}px`;
    el.style.setProperty('--dx', `${(dst.left + dst.width / 2 - src.left - src.width / 2) / sc}px`);
    el.style.setProperty('--dy', `${(dst.top + dst.height / 2 - src.top - src.height / 2) / sc}px`);
    ph.appendChild(el);
    el.addEventListener('animationend', () => ph.removeChild(el), { once: true });
  };
  // AURA: the same app as light, not ink. Every shape is a blurred gradient orb on cream;
  // the sharper (kiki) a shape is, the crisper its edge; the rounder (bouba), the more it dissolves into the page.
  const AURA = document.documentElement.classList.contains('aura');
  const RMAP = { '#3FC8F5': '#3D8BE0', '#FF5A36': '#F0504A', '#9B6BFF': '#8C7BE8', '#FF7AC6': '#F27BC4', '#FFD23F': '#F7C531', '#3DDC97': '#4FCB8A' };
  const R = (hex) => (AURA && hex ? RMAP[hex] || hex : hex);
  // the halo hue around each core: neighbours on the colour wheel, so every orb carries two lights
  const HALO = { '#3D8BE0': '#F27BC4', '#F0504A': '#F7C531', '#8C7BE8': '#3D8BE0', '#F27BC4': '#F7A23B', '#F7C531': '#FF8A3D', '#4FCB8A': '#D6E35A' };
  const haloOf = (c) => HALO[c] || '#F7C531';
  let gseq = 0;
  const auraSvg = (d, f, round, cls, attrs, dim = false) => {
    const id = `au${++gseq}`, r = Math.max(0, Math.min(1, round)), h = haloOf(f);
    const glow = (1.2 + r * 3.6).toFixed(2), edge = (.12 + r * .5).toFixed(2), sc = (1.04 + r * .14).toFixed(3);
    return `<svg class="${cls} aura-orb" viewBox="0 0 48 48"${attrs}><defs>`
      + `<radialGradient id="${id}g" cx="40%" cy="36%" r="72%"><stop offset="0" stop-color="${h}"/><stop offset=".55" stop-color="${f}"/><stop offset="1" stop-color="${f}"/></radialGradient>`
      + `<filter id="${id}h" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${glow}"/></filter>`
      + `<filter id="${id}e" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${edge}"/></filter></defs>`
      + `<g${dim ? ' opacity=".42"' : ''}><path d="${d}" fill="${h}" opacity="${(.35 + r * .3).toFixed(2)}" filter="url(#${id}h)" transform="translate(24 24) scale(${sc}) translate(-24 -24)"/>`
      + `<path d="${d}" fill="url(#${id}g)" filter="url(#${id}e)"/></g></svg>`;
  };
  const rf = (arr) => { if (AURA) arr.forEach((x) => { x.fill = R(x.fill); }); return arr; };
  $$('[data-style]').forEach((b) => {
    b.setAttribute('aria-pressed', String((b.dataset.style === 'aura') === AURA));
    b.addEventListener('click', () => { localStorage.setItem('wheepStyle', b.dataset.style); location.reload(); });
  });

  /* ── device scaling (desktop presentation) ── */
  const device = $('#device');
  const fit = () => {
    if (innerWidth <= 500) { device.style.transform = ''; return; }
    device.style.transform = `scale(${Math.min(1, (innerHeight - 32) / 868, (innerWidth - 32) / 414)})`;
  };
  addEventListener('resize', fit); fit();

  /* ── the notebook glyphs, drawn by hand (pen wobble via #hand filter) ── */
  const GLYPH = {
    cry:     { name: 'בכי',    color: '#6CF4FF', d: 'M12.2 2.9C10 7.1 6.9 10.2 7.2 14.4c.3 3.6 2.6 6 5.1 5.9 3-.2 5-2.7 4.6-6.2-.4-3.3-2.9-6.6-4.7-11.2z' },
    anger:   { name: 'כעס',    color: '#FF9A4A', d: 'M12.0 1.8L13.2 8.6L18.1 6.3L16.0 10.3L21.5 9.5L15.4 12.3L19.2 17.2L14.3 15.4L16.0 21.6L12.2 15.7L8.2 19.2L8.7 14.9L4.2 17.6L8.6 12.9L3.1 9.9L8.7 9.8L5.6 4.3L10.7 8.4z' },
    empathy: { name: 'אמפתיה', color: '#E77FD8', d: 'M12 11.4C9.3 5.2 4.3 7.6 7.7 11.9c-4 3.4.9 8.2 4.1 1.4 3.1 6.4 8.4 2.5 4.4-1.4 3.9-4-1.4-7.2-4.2-.5z' },
    press:   { name: 'הדחקה',  color: '#A3ACDD', d: 'M8.7 3.3l7.2-.2 4.9 5.4.1 7.1-5.2 5.2-7.4-.1-5-5.3.3-7.2z' },
  };
  const glyph = (k, cls = 'glyph') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH[k].d}" stroke="${GLYPH[k].color}" filter="url(#hand)"/></svg>`;

  /* ── Bouba/Kiki: the one shape of WHEEP ──
     round 0 = kiki (sharp spikes: pressure), 1 = bouba (soft blob: release).
     One polar outline for every size and every morph, so the language never changes. */
  const lerp = (a, b, t) => a + (b - a) * t;
  // base outlines: every measure has its own silhouette, the spikes (kiki) or smoothness (bouba) ride on top
  const DROP_L = 1.75, DROP_A = Math.acos(1 / DROP_L);            // a real drop: a circle with two tangents meeting in a tip
  const BASE = {
    burst: () => 1,                                                       // anger: a star burst
    drop: (a) => {                                                        // crying: a drop, tip up
      const f = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)));
      return .68 * (f < DROP_A ? 1 / Math.cos(f - DROP_A) : 1);
    },
    box: (a) => .8 / ((Math.abs(Math.cos(a)) ** 7 + Math.abs(Math.sin(a)) ** 7) ** (1 / 7)), // suppression: boxed in
    bubble: (a) => .9 / ((Math.abs(Math.cos(a)) ** 3 + Math.abs(Math.sin(a) / .74) ** 3) ** (1 / 3))
      + .44 * Math.max(0, Math.cos(a - Math.PI * .72)) ** 34,             // talk: a speech bubble with a tail
    blob: (a) => .86 + .07 * Math.cos(4 * a + .5),                        // joy: a soft four-lobed bouba
    bean: (a) => .82 + .13 * Math.cos(3 * a + 1),                         // a squashed bean (needs)
    // emotions: amorphous, each with its own gesture
    shiver: (a) => .8 + .07 * Math.cos(13 * a),                                                   // fear: a small body that ripples
    flare: (a) => .66 + .44 * Math.max(0, -Math.sin(a)) ** 1.4 * (.5 + .5 * Math.cos(5 * (a + Math.PI / 2))), // anger: it flares up
    sag: (a) => .6 + .48 * Math.max(0, Math.sin(a)) ** 1.6 + .14 * Math.abs(Math.cos(a)) ** 4 * (Math.sin(a) > 0 ? 1 : .3),      // sadness: it sinks and spreads
    recoil: (a) => .86 + .1 * Math.cos(2 * a + .6) - .42 * Math.max(0, Math.cos(a)) ** 6,        // disgust: it pulls away, a dent
    bloom: (a) => .86 + .065 * Math.cos(8 * a + Math.PI / 2),                                               // joy: it opens
  };
  // how much the spikes may cut into each silhouette: the burst is all spikes, the others keep their outline readable
  const SHARP = { burst: 1, drop: .14, box: .3, bubble: .06, blob: .12, bean: .14, shiver: .22, flare: .3, sag: .16, recoil: .18, bloom: .14 };
  // silhouettes that are not centred on their own origin (the drop's tip, the bubble's tail)
  const OFF = { drop: .26, bubble: -.07, flare: .14, sag: -.2, recoil: 0 };
  const polar = ({ round = 0, R = 20, cx = 24, cy = 24, n = 9, amp, k, tremble = 0, phase = 0, N = 180, base = 'burst', lobes = 1 }) => {
    const B = BASE[base], S = SHARP[base];
    cy += (OFF[base] || 0) * R;
    const A = (amp ?? lerp(.5, .07, round)) * S * (AURA ? .78 : 1), K = k ?? lerp(2.6, 1, round);
    const ph = AURA ? base.length * 1.37 + n * .41 : 0;   // each silhouette gets its own organic lobes
    let d = '';
    for (let j = 0; j < N; j++) {
      const u = (j / N) * n * 2;                          // two units per spike
      const tri = Math.abs((u % 2) - 1);                  // 1 at a tip, 0 in a valley
      const soft = (Math.cos(Math.PI * u) + 1) / 2;
      const w = lerp(tri ** K, soft, round);
      const spike = Math.floor((u + 1) / 2);
      const ang = -Math.PI / 2 + (j / N) * Math.PI * 2;
      const lobe = AURA ? 1 + lobes * (.06 * Math.sin(3 * ang + ph) + .03 * Math.sin(5 * ang + ph * 1.7) + .02 * Math.sin(2 * ang + ph * .6)) : 1;
      const r = R * B(ang) * lobe * (1 - A * (1 - w)) * (1 + tremble * Math.sin(phase + spike * 1.9) * w);
      d += `${j ? 'L' : 'M'}${(cx + r * Math.cos(ang)).toFixed(2)} ${(cy + r * Math.sin(ang)).toFixed(2)}`;
    }
    return d + 'Z';
  };
  // flat three-stop scale: kiki red → tense yellow → bouba cyan (a colour per state, never a gradient)
  const KB = AURA ? [[240, 80, 74], [247, 197, 49], [61, 139, 224]] : [[255, 90, 54], [255, 210, 63], [63, 200, 245]];
  const kbColor = (round) => {
    const t = Math.max(0, Math.min(1, round)) * 2, i = Math.min(1, Math.floor(t)), f = t - i;
    return `rgb(${KB[i].map((x, k) => Math.round(x + (KB[i + 1][k] - x) * f)).join(',')})`;
  };
  // neo-brutalist shape: flat fill, thick ink outline, hard offset shadow (a second path)
  const INK = '#121212';
  const mini = (round, cls = 'mini', dashed = false, label = '', fill, base = 'burst', n = 9, shadow = false) => {
    const d = polar({ round, R: 18, base, n });
    if (AURA) return auraSvg(d, R(fill) || kbColor(round), round, cls, ` ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}`, dashed);
    const sh = shadow ? `<path d="${d}" transform="translate(2.5 2.5)" fill="${INK}"/>` : '';
    return `<svg class="${cls}" viewBox="0 0 48 48" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${sh}<path d="${d}" fill="${fill || kbColor(round)}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"${dashed ? ' stroke-dasharray="4 3"' : ''}/></svg>`;
  };

  /* ── the 16 days: 3.12 (last cry) → 18.12 (forecast); index 12 is today ── */
  const DAYS = ['ה׳ 3.12', 'ו׳ 4.12', 'ש׳ 5.12', 'א׳ 6.12', 'ב׳ 7.12', 'ג׳ 8.12', 'ד׳ 9.12', 'ה׳ 10.12',
    'ו׳ 11.12', 'ש׳ 12.12', 'א׳ 13.12', 'ב׳ 14.12', 'ג׳ 15.12', 'ד׳ 16.12', 'ה׳ 17.12', 'ו׳ 18.12'];
  const TODAY = 12;
  const FLOW = [1, .72, .5, .36, .27, .21, .17, .14, .12, .1, .09, .08, .07, .07, .08, .62];
  const mpl = (p) => Math.round((p - 1000) * 25);            // MPL · masculinity pressure level, 0–1000
  const PRESS = [1009, 1011, 1013, 1014, 1016, 1018, 1020, 1022, 1024, 1025, 1027, 1029, 1031, 1032, 1033, 1018];
  const at = (arr, d) => { const i = Math.max(0, Math.min(arr.length - 1, d)), a0 = Math.floor(i), a1 = Math.min(arr.length - 1, a0 + 1); return arr[a0] + (arr[a1] - arr[a0]) * (i - a0); };
  const flowAt = (d) => at(FLOW, d);
  // the composite of the four measures per day (crying is one of four)
  const DAYR = [.86, .7, .58, .5, .46, .3, .36, .4, .27, .44, .2, .3, .33, .34, .36, .66];
  const roundAt = (d) => at(DAYR, d);
  const stateWord = (r) => (r > .7 ? 'עגול' : r > .35 ? 'מתוח' : 'חד');

  /* ── today: 7-day forecast ── */
  const DAYROWS = [
    ['היום', 'clear', 5, 1024, 1031, 1031, ''],
    ['ד׳', 'cloud', 10, 1026, 1033],
    ['ה׳', 'cloud', 20, 1028, 1035],
    ['ו׳', 'rain', 60, 1012, 1034, null, 'ארוחת ערב משפחתית', 'cry'],
    ['ש׳', 'drizzle', 35, 1008, 1020],
    ['א׳', 'cloud', 15, 1010, 1018],
    ['ב׳', 'cloud', 10, 1012, 1019],
  ];
  // one encoding per row: the shape and its chance; the cause in the hand's mark
  $('#days').innerHTML = DAYROWS.map(([n, k, p, lo, hi, now, why, g]) => `
    <li><span class="d-name">${n}</span>${mini(Math.min(1, p / 60), 'mini mini-f', n !== 'היום', `${p}% שחרור`)}
      <span class="d-pct num${p < 15 ? ' is-low' : ''}">${p}%</span>
      <span class="d-why">${why ? `${g ? glyph(g, 'glyph glyph-cause') : ''}${why}` : ''}</span></li>`).join('');

  /* ── alert expand ── */
  const alertBtn = $('#alert');
  alertBtn.addEventListener('click', () => {
    const open = alertBtn.getAttribute('aria-expanded') === 'true';
    alertBtn.setAttribute('aria-expanded', String(!open));
    $('#alert-more').hidden = open;
  });

  /* ── tabs ── */
  const tabs = $$('[role="tab"]');
  const show = (name, focusTab = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    $$('.screen').forEach((s2) => {
      const on = s2.id === `screen-${name}`;
      if (on && s2.hidden) {
        s2.hidden = false;
        s2.classList.remove('is-entering'); void s2.offsetWidth; s2.classList.add('is-entering');
        s2.scrollTop = 0;
      } else if (!on) s2.hidden = true;
      $('.phone').classList.remove('is-scrolled');
      $('.phone').classList.toggle('on-today', name === 'today');
      $('.phone').classList.toggle('on-profile', name === 'profile');
    });
    setFrame(curTarget());
    if (name === 'trends') drawTrends();
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  $('.tabbar').addEventListener('keydown', (e) => {
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const step = { ArrowLeft: 1, ArrowRight: -1 }[e.key]; // RTL: left is "next"
    if (step) { e.preventDefault(); show(tabs[(i + step + tabs.length) % tabs.length].dataset.tab, true); }
  });
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));

  /* ── sky: the screen's ground follows the weather of the scrubbed day ── */
  const DRY = ['#0A0E2E', '#15195A', '#12406A', '#0C5A66'];
  const WET = ['#071C2C', '#0B3D57', '#0E5F6E', '#11806F'];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)).join(',')})`;
  const phoneEl = $('.phone');
  const setSky = () => {};                                // the brutalist ground stays flat
  const wetness = (d) => Math.max(0, Math.min(1, (flowAt(d) - .08) / .55));

  /* ── opening: the strain ring becomes the pressure shape at midnight, 1.12.2026 ── */
  const intro = $('#intro'), shapeEl = $('#iw-shape');
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  let introTimers = [], morphRaf = 0;
  const PACE = Math.max(.2, +new URLSearchParams(location.search).get('pace') || 1);   // ?pace=2 slows the opening for film.html
  const setShape = (t) => {
    const d = polar({ R: lerp(78, 88, t), cx: 100, cy: 100, n: 11, amp: .5 * t, k: 2.6, N: 264, lobes: t });
    shapeEl.setAttribute('d', d); $('#iw-sh').setAttribute('d', d);
    shapeEl.style.strokeDasharray = `${88 + 12 * t} 100`;   // the strain ring at 88% closes into a whole shape
  };
  const clearIntro = () => { introTimers.forEach(clearTimeout); introTimers = []; cancelAnimationFrame(morphRaf); };
  const showAbout = () => {
    clearIntro();
    setShape(1);
    intro.classList.add('is-midnight', 'is-about');
    $('#ab-go').focus({ preventScroll: true });
  };
  const runIntro = () => {
    clearIntro();
    intro.hidden = false;
    intro.classList.remove('is-midnight', 'is-about', 'is-info');
    setShape(0);
    if (reduced) return showAbout();
    introTimers.push(setTimeout(() => {
      intro.classList.add('is-midnight');
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / (1500 * PACE));
        setShape(ease(k));
        if (k < 1) morphRaf = requestAnimationFrame(step);
      };
      morphRaf = requestAnimationFrame(step);
    }, 1500 * PACE));
    introTimers.push(setTimeout(showAbout, 3800 * PACE));
  };
  const openInfo = () => {                                  // the info button opens the explanation directly
    intro.hidden = false;
    intro.classList.add('is-info');
    showAbout();
  };
  const closeIntro = () => {
    clearIntro();
    intro.hidden = true;
    intro.classList.remove('is-info');
    if (location.hash === '#intro' || location.hash === '#about') history.replaceState(null, '', location.pathname + location.search);
    $('.screen:not([hidden])').focus({ preventScroll: true });
  };
  $('#intro-skip').addEventListener('click', showAbout);
  $('#ab-go').addEventListener('click', closeIntro);
  intro.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeIntro(); });
  $('#info-btn').addEventListener('click', openInfo);
  [['.kb-a', 0], ['.kb-b', .5], ['.kb-c', 1]].forEach(([sel, r]) => { $(sel).outerHTML = mini(r, 'mini kb-row'); });

  // deep links for presenting and recording: #shape, #trends, #profile, #intro (replay), #about
  const fromHash = () => {
    const h = location.hash.slice(1);
    if (h === 'intro') return runIntro();
    if (h === 'about') return openInfo();
    if (tabs.some((t) => t.dataset.tab === h)) show(h);
  };
  addEventListener('hashchange', fromHash);
  // the info button steps aside once a screen scrolls, so it never sits on top of content
  $$('.screen').forEach((sc) => sc.addEventListener('scroll', () => $('.phone').classList.toggle('is-scrolled', sc.scrollTop > 24), { passive: true }));

  /* ── what the man inside needs (said in the third person on purpose: the app keeps him like a pet) ── */
  const NEEDS = rf([
    { id: 'talk', name: 'שיחה', base: 'bubble', n: 6, fill: '#FF7AC6', v: 20 },
    { id: 'move', name: 'תנועה', base: 'blob', n: 7, fill: '#FFD23F', v: 45 },
    { id: 'sleep', name: 'שינה', base: 'bean', n: 6, fill: '#9B6BFF', v: 35 },
    { id: 'release', name: 'שחרור', base: 'drop', n: 7, fill: '#3FC8F5', v: 10 },
  ]);
  const needsAvg = () => NEEDS.reduce((n, x) => n + x.v, 0) / NEEDS.length / 100;
  const NEEDS0 = needsAvg();
  const care = () => Math.max(0, needsAvg() - NEEDS0) * .6;

  // the frame is the variable: as the shape softens, the ink thins, the shadows drop and the corners round.
  // Today's sharp shape (~.3) keeps the full brutal frame; the round day after a cry (~.86) has almost none.
  const setFrame = (round) => {
    if (AURA) return;
    const k = Math.max(0, Math.min(1, (round - .3) / .5)), ph = $('.phone').style, o = (6 * (1 - k)).toFixed(1), o2 = (4 * (1 - k)).toFixed(1);
    ph.setProperty('--sh', `${o}px ${o}px 0 var(--plate)`);
    ph.setProperty('--sh-sm', `${o2}px ${o2}px 0 var(--plate)`);
    ph.setProperty('--bw', `${(3 - 1.8 * k).toFixed(2)}px`);
    ph.setProperty('--r', `${Math.round(14 + 16 * k)}px`);
    $('.phone').dataset.frame = k > .66 ? 'round' : k > .2 ? 'mid' : 'sharp';
  };

  /* ── four measures, each its own Bouba/Kiki shape; the hero is their average ── */
  const state = { press: 9, talks: 4 };
  const METRICS = rf([
    { id: 'cry', name: 'בכי', base: 'drop', n: 7, fill: '#3FC8F5', val: () => '0', sub: '1 לא מאומת', round: () => .08 },
    { id: 'anger', name: 'כעס שנאמר', base: 'burst', n: 9, fill: '#FF5A36', val: () => '1/3', sub: '2 נשארו בפנים', round: () => .3 },
    { id: 'press', name: 'הדחקות', base: 'box', n: 8, fill: '#9B6BFF', val: () => String(state.press), sub: '"הכל טוב"', round: () => Math.max(0, 1 - state.press / 11) },
    { id: 'talk', name: 'שיחות עומק', base: 'bubble', n: 6, fill: '#FF7AC6', val: () => String(state.talks), sub: 'מעל 20 דק׳', round: () => Math.min(1, state.talks / 6) },
  ]);
  const composite = () => METRICS.reduce((n, m) => n + m.round(), 0) / METRICS.length;
  const renderMetrics = () => {
    const prevVals = $$('#metric-grid .metric b').map((b) => b.textContent);
    $('#metric-grid').innerHTML = METRICS.map((m) => `
      <li class="metric">${mini(m.round(), 'mini metric-shape', false, '', m.fill, m.base, m.n, true)}
        <b class="num">${m.val()}</b><span class="m-name">${m.name}</span><small>${m.sub}</small></li>`).join('');
    if (prevVals.length) $$('#metric-grid .metric').forEach((li, i) => { if (li.querySelector('b').textContent !== prevVals[i]) fx(li, 'is-up'); });
    const m = liveMpl();
    if (Math.round(shapeDay) === TODAY) { countTo($('#hero-mpl'), +$('#hero-mpl').textContent || m, m); $('#hero-shape').setAttribute('aria-label', `הצורה של היום: ${stateWord(heroTarget())}, MPL ${m}`); }
    setFrame(curTarget());
    // every 25 MPL let go of is worth 10 points
    if (m <= lastMpl - 25) { const steps = Math.floor((lastMpl - m) / 25); earn(`MPL ירד ב-${steps * 25}`, steps * 10); lastMpl -= steps * 25; }
  };

  /* ── the live shapes: Today's hero and the shape tab, both trembling with pressure ── */
  let shapeDay = TODAY, lastMpl = 775;
  const live = {
    hero: { cur: .3, sh: $('#hero-shape .sh'), fg: $('#hero-shape .fg'), def: $('#hero-d'), ed: $('#hero-shape .ed'), R: 140 },
  };
  if (AURA) Object.entries(live).forEach(([k, L]) => {
    const svg = L.fg.ownerSVGElement;
    svg.querySelector('defs').insertAdjacentHTML('beforeend', `<radialGradient id="${k}-ag" cx="40%" cy="36%" r="72%"><stop offset="0"/><stop offset=".6"/><stop offset="1"/></radialGradient><filter id="${k}-ab" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter><filter id="${k}-ae" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1"/></filter>`);
    L.gs = [...svg.querySelectorAll(`#${k}-ag stop`)]; L.blur = svg.querySelector(`#${k}-ab feGaussianBlur`);
    L.fg.setAttribute('filter', `url(#${k}-ae)`); L.fg.style.fill = `url(#${k}-ag)`;
    L.sh.setAttribute('filter', `url(#${k}-ab)`); L.edge = svg.querySelector(`#${k}-ae feGaussianBlur`);
  });
  const heroTarget = () => Math.min(1, composite() + care());
  const H0 = composite();
  // MPL today moves with everything he does: talks, care, released measures
  const liveMpl = () => Math.max(0, Math.min(1000, Math.round(775 - (heroTarget() - H0) * 700)));
  const curTarget = () => (Math.round(shapeDay) === TODAY ? heroTarget() : roundAt(shapeDay));
  const frame = (t) => {
    [['hero', curTarget(), '#screen-today']].forEach(([key, target, scr]) => {
      const L = live[key];
      if ($(scr).hidden) { L.cur = target; return; }
      L.cur += (target - L.cur) * .08;
      const tremble = reduced ? 0 : (1 - L.cur) * .035;
      const d = polar({ round: L.cur, R: L.R, cx: 160, cy: 160, n: 11, tremble, phase: t / 120, N: 264 });
      L.sh.setAttribute('d', d);
      L.fg.setAttribute('d', d);
      L.fg.setAttribute('fill', kbColor(L.cur));
      if (AURA) {                                          // the big orb: its edge dissolves as it rounds
        const c = kbColor(L.cur);
        L.gs[0].setAttribute('stop-color', haloOf(R(['#FF5A36', '#FFD23F', '#3FC8F5'][Math.min(2, Math.round(L.cur * 2))]))); L.gs[1].setAttribute('stop-color', c); L.gs[2].setAttribute('stop-color', c);
        L.blur.setAttribute('stdDeviation', (10 + L.cur * 22).toFixed(1));
        L.edge.setAttribute('stdDeviation', (.6 + L.cur * 2.6).toFixed(2));
        L.sh.style.fill = haloOf(R(['#FF5A36', '#FFD23F', '#3FC8F5'][Math.min(2, Math.round(L.cur * 2))]));
        L.sh.style.transform = `scale(${(1.06 + L.cur * .12).toFixed(3)})`;
        const ph = $('.phone').style;                      // the light behind the screen follows the shape
        ph.setProperty('--f1', c); ph.setProperty('--f2', haloOf(c.startsWith('#') ? c : ''));
      }
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  /* ── shape tab: 16 days of one shape ── */
  const NOTES = {
    0: '11 דק׳ בכי ברמזור בדרך הביתה. הצורה כמעט עגולה.',
    3: 'החיישן הוסר בין 02:10 ל-07:40. הצורה נמדדה חלקית.',
    5: 'כעס שלא נאמר · ישיבת צוות. קוץ ראשון.',
    6: 'דמעה לא מאומתת · 0.4 מ״ל. סיבה אפשרית: בצל.',
    8: 'ארוחת שישי. שלוש פעמים "לא משנה".',
    10: 'פקק באיילון. 40 דקות של שתיקה. קוץ חדש.',
    11: 'אבא שאל מה נשמע. "סבבה".',
    12: '12 ימים ללא משקעים. 9 הדחקות השבוע.',
    15: 'תחזית: 60% שהצורה תתעגל. ארוחת ערב משפחתית.',
  };
  const strip = $('#shape-strip');
  strip.innerHTML = DAYS.map((d, i) => `<button type="button" class="sday${i > TODAY ? ' is-fc' : ''}${i === TODAY ? ' is-today' : ''}" data-i="${i}" aria-label="${d}">${mini(roundAt(i), 'mini', i > TODAY || i === 6)}<span>${d.split(' ')[1].split('.')[0]}</span></button>`).join('');
  const dayInput = $('#day');
  const setDay = (d) => {
    shapeDay = d;
    const i = Math.round(d), r = roundAt(d);
    const label = i === TODAY ? 'היום' : i > TODAY ? `תחזית · ${DAYS[i]}` : DAYS[i];
    $('#hero-day').textContent = label;
    dayInput.setAttribute('aria-valuetext', label);
    $('#hero-mpl').textContent = i === TODAY ? liveMpl() : mpl(at(PRESS, d));
    $('#hero-note').textContent = i === TODAY ? '' : NOTES[i] || 'יבש. אין רישום.';
    $('#hero-shape').setAttribute('aria-label', `צורת הגבריות ב-${label}: ${stateWord(i === TODAY ? heroTarget() : r)}`);
    strip.querySelectorAll('.sday').forEach((b) => b.classList.toggle('is-sel', +b.dataset.i === i));
    setFrame(curTarget());
  };
  dayInput.addEventListener('input', () => { stopPlay(); setDay(+dayInput.value); });
  strip.addEventListener('click', (e) => { const b = e.target.closest('.sday'); if (!b) return; stopPlay(); dayInput.value = b.dataset.i; setDay(+b.dataset.i); });

  const play = $('#play');
  let playing = null;
  const stopPlay = () => { cancelAnimationFrame(playing); playing = null; play.setAttribute('aria-pressed', 'false'); play.setAttribute('aria-label', 'הפעלת מעבר על הימים'); };
  play.setAttribute('aria-pressed', 'false');
  play.addEventListener('click', () => {
    if (playing) return stopPlay();
    play.setAttribute('aria-pressed', 'true');
    play.setAttribute('aria-label', 'עצירה');
    let d = +dayInput.value >= 15 ? 0 : +dayInput.value;
    let last = performance.now();
    const tick = (t) => {
      d += (t - last) / 450; last = t;       // ~0.45s per day
      if (d >= 15) { d = 15; dayInput.value = d; setDay(d); return stopPlay(); }
      dayInput.value = d; setDay(d);
      playing = requestAnimationFrame(tick);
    };
    playing = requestAnimationFrame(tick);
  });
  setDay(TODAY);

  renderMetrics();
  $('#ab-map').innerHTML = METRICS.map((m) => `<li>${mini(.25, 'mini ab-mini', false, '', m.fill, m.base, m.n, true)}<span>${m.name}</span></li>`).join('');

  /* ── talk now: the quick fix is a conversation (and WHEEP still counts it) ── */
  const PEOPLE = rf([
    { id: 'ido', name: 'עידו', rel: 'חבר מהצבא', init: 'ע', fill: '#3FC8F5' },
    { id: 'shiri', name: 'שירי', rel: 'בת זוג', init: 'ש', fill: '#FF7AC6' },
    { id: 'dad', name: 'אבא', rel: 'לא דיברתם 9 ימים', init: 'א', fill: '#FFD23F' },
    { id: 'guys', name: "החבר'ה", rel: 'שיחה קבוצתית · 5', init: '5', fill: '#9B6BFF', group: true },
  ]);
  const OPENERS = ['יש לך 5 דקות?', 'אני לא ממש בסדר השבוע.', 'רציתי לשמוע מה איתך באמת.'];
  const GROUP_OPENERS = ['מישהו פנוי לשיחה הערב?', 'אני צריך לדבר על משהו.', 'בלי בדיחות הפעם, טוב?'];
  let who = null, opener = 0, callTimer = 0, callSecs = 0, callStart = 0;
  $('#talk-people').innerHTML = PEOPLE.map((p) => `
    <button type="button" class="person" data-id="${p.id}"><span class="avatar" style="background:${p.fill}">${p.init}</span><b>${p.name}</b><small>${p.rel}</small></button>`).join('');
  const sheet = $('#talk-sheet');
  const MSGS = ['חשבתי עליך היום.', 'מה איתך באמת?', 'בא לך לקפוץ הערב?'];
  let sheetMode = 'call';
  const openSheet = (id, mode = 'call') => {
    who = [...PEOPLE, ...CREW].find((p) => p.id === id); opener = 0; sheetMode = mode;
    $('#ts-who').innerHTML = `<span class="avatar" style="background:${who.fill}">${who.init}</span>${who.name} · ${who.rel}`;
    const lines = mode === 'msg' ? MSGS : who.group ? GROUP_OPENERS : OPENERS;
    $('#ts-lines').innerHTML = lines.map((l, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-i="${i}">${l}</button>`).join('');
    $('#ts-h').textContent = mode === 'msg' ? 'מה לכתוב?' : 'איך לפתוח?';
    $('#ts-go').textContent = mode === 'msg' ? `שלח ל${who.name}` : who.group ? 'פתח שיחה קבוצתית' : `התקשר ל${who.name}`;
    sheet.hidden = false;
    $('#ts-lines button').focus();
  };
  const closeSheet = () => { sheet.hidden = true; };
  $('#talk-people').addEventListener('click', (e) => { const b = e.target.closest('.person'); if (b) openSheet(b.dataset.id); });
  $('#ts-lines').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    opener = +b.dataset.i;
    $$('#ts-lines button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  });
  $('#ts-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  const call = $('#call');
  const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  $('#ts-go').addEventListener('click', () => {
    if (sheetMode === 'msg') {
      closeSheet();
      $('#crew-out').textContent = `נשלח ל${who.name}: "${MSGS[opener]}" הודעה לא נחשבת שיחת עומק.`;
      return;
    }
    const line = (who.group ? GROUP_OPENERS : OPENERS)[opener];
    closeSheet();
    call.hidden = false; call.classList.remove('is-live', 'is-done');
    $('#call-avatar').textContent = who.init; $('#call-avatar').style.background = who.fill;
    $('#call-name').textContent = who.group ? "החבר'ה · 5 משתתפים" : who.name;
    $('#call-line').textContent = `"${line}"`;
    $('#call-state').textContent = who.group ? 'מחבר את הקבוצה…' : 'מתקשר…';
    $('#call-time').textContent = '00:00'; $('#call-out').textContent = '';
    callSecs = 0;
    $('#call-end').focus();
    callStart = setTimeout(() => {
      call.classList.add('is-live');
      $('#call-state').textContent = who.group ? '3 מתוך 5 הצטרפו' : 'בשיחה';
      // demo time: each tick is half a real minute, so a long talk fits in a few seconds
      callTimer = setInterval(() => { callSecs += 31; $('#call-time').textContent = mmss(callSecs); }, 100);
    }, 1400);
  });
  const endCall = () => {
    clearTimeout(callStart); clearInterval(callTimer);
    const mins = Math.floor(callSecs / 60);
    call.classList.add('is-done');
    if (mins >= 20) {
      state.talks += 1; state.press = Math.max(0, state.press - 1);
      $('#call-out').textContent = `שיחה של ${mins} דק׳ נרשמה. שיחות עומק +1 · הדחקות −1.`;
      NEEDS[0].v = Math.min(100, NEEDS[0].v + 30);
      // a long talk rounds the people on it too: the friend, or the whole crew
      (who.group ? CREW : CREW.filter((f) => f.id === who.id)).forEach((f) => { f.r = Math.min(1, f.r + .15); });
      earn(who.group ? `שיחה קבוצתית · ${mins} דק׳` : `שיחה עם ${who.name} · ${mins} דק׳`, who.group ? 40 : 30, $('#call-end'));
      $('#call-out').textContent += ` +${who.group ? 40 : 30} נקודות רווחה.`;
      renderMetrics(); renderNeeds(); renderCrew();
    } else {
      $('#call-out').textContent = callSecs ? `שיחה של ${mins} דק׳. קצרה מדי כדי להיחשב כשיחת עומק.` : 'השיחה לא נענתה. לא נרשם דבר.';
    }
    $('#call-state').textContent = 'השיחה הסתיימה';
    setTimeout(() => { call.hidden = true; $('.screen:not([hidden])').focus({ preventScroll: true }); }, 2600);
  };
  $('#call-end').addEventListener('click', endCall);

  /* ── shape tab: what he needs, and four small ways to give it ── */
  const ACTS = [
    ['talk', 'להתקשר לעידו', '20 דק׳ · +30 שיחה', 30],
    ['move', 'הליכה בלי אוזניות', '20 דק׳ · +25 תנועה', 25],
    ['sleep', 'לישון ב-23:00', 'הלילה · +30 שינה', 30],
  ];
  const renderNeeds = () => {
    const ul = $('#needs');
    if (ul.children.length) {
      NEEDS.forEach((x, i) => {
        const li = ul.children[i], num = li.querySelector('b');
        if (+num.textContent === x.v) return;
        li.style.setProperty('--v', x.v); li.querySelector('.bar i').style.width = `${x.v}%`;
        li.querySelector('.need-shape').outerHTML = mini(x.v / 100, 'mini need-shape', false, '', x.fill, x.base, x.n);
        countTo(num, +num.textContent, x.v); fx(li, 'is-up');
      });
      return;
    }
    ul.innerHTML = NEEDS.map((x) => `<li class="need" style="--v:${x.v}">${mini(x.v / 100, 'mini need-shape', false, '', x.fill, x.base, x.n)}<span>${x.name}</span><span class="bar"><i style="width:${x.v}%;background:${x.fill}"></i></span><b class="num">${x.v}</b></li>`).join('');
  };
  $('#acts').innerHTML = ACTS.map(([id, t, sub], i) => `<button type="button" class="act" data-i="${i}"><b>${t}</b><small>${sub}</small></button>`).join('');
  $('#acts').addEventListener('click', (e) => {
    const b = e.target.closest('.act'); if (!b) return;
    const [id, t, , add] = ACTS[+b.dataset.i];
    fx(b, 'is-pressed');
    if (id === 'talk') return openSheet('ido');               // the talk is a real call, counted only if it is long
    const need = NEEDS.find((x) => x.id === id);
    need.v = Math.min(100, need.v + add);
    renderNeeds(); renderMetrics();
    const low = NEEDS.slice().sort((a, c) => a.v - c.v)[0];
    earn(t, 15, b);
    $('#acts-out').textContent = `${t} · נרשם, +15 נקודות. הוא התעגל קצת. הכי חסר לו עכשיו: ${low.name}.`;
  });
  renderNeeds();

  /* ── emotions: the patch maps Ekman's five continents; a radar like a player card, without a score ── */
  const EMO = rf([
    { id: 'fear', name: 'פחד', base: 'shiver', n: 13, fill: '#9B6BFF', v: 82, prev: 70, out: .18,
      states: [['דאגה', 8], ['חרדה', 5], ['בהלה', 1]], trigger: 'הכסף לחתונה', did: 'אמרת "הכל טוב"' },
    { id: 'anger', name: 'כעס', base: 'flare', n: 9, fill: '#FF5A36', v: 64, prev: 71, out: .3,
      states: [['עצבנות', 6], ['תסכול', 4], ['זעם', 1]], trigger: 'פקק באיילון', did: 'שתקת 40 דקות' },
    { id: 'sad', name: 'עצב', base: 'sag', n: 7, fill: '#3FC8F5', v: 48, prev: 35, out: .12,
      states: [['בדידות', 4], ['אכזבה', 3], ['אבל', 0]], trigger: 'אבא שאל מה נשמע', did: 'לא תויג' },
    { id: 'disgust', name: 'גועל', base: 'recoil', n: 6, fill: '#3DDC97', v: 30, prev: 26, out: .62,
      states: [['בוז עצמי', 3], ['סלידה', 2]], trigger: 'המראה בחדר הכושר', did: 'יצאת מוקדם' },
    { id: 'joy', name: 'הנאה', base: 'bloom', n: 6, fill: '#FFD23F', v: 41, prev: 52, out: .85,
      states: [['הקלה', 3], ['שמחה', 2], ['גאווה', 1]], trigger: 'שיחה עם עידו', did: 'צחקת' },
  ]);
  // an emotion's mark: its own amorphous silhouette; how sharp it is = how much stayed inside
  const picto = (e, cls = 'picto', x, y, size) => {
    const d = polar({ round: e.out, R: 19, cx: 24, cy: 24, base: e.base, n: e.n, N: 220 });
    const pos = x == null ? '' : ` x="${x}" y="${y}" width="${size}" height="${size}"`;
    if (AURA) return auraSvg(d, e.fill, e.out, cls, `${pos} aria-hidden="true"`);
    return `<svg class="${cls}" viewBox="0 0 48 48"${pos} aria-hidden="true"><path d="${d}" transform="translate(2.5 2.5)" fill="#121212"/><path d="${d}" fill="${e.fill}" stroke="#121212" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
  };
  let emoSel = 'fear';
  const RC = { x: 170, y: 180, R: 110 };
  const rPt = (i, v) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / EMO.length);
    return [RC.x + Math.cos(a) * RC.R * v / 99, RC.y + Math.sin(a) * RC.R * v / 99];
  };
  const pts = (vals) => vals.map((v, i) => rPt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');
  const renderEmo = () => {
    let g = '';
    [20, 40, 60, 80, 99].forEach((v) => { g += `<polygon points="${pts(EMO.map(() => v))}" fill="none" stroke="#121212" stroke-opacity=".16" stroke-width="1.2"/>`; });
    EMO.forEach((_, i) => { const [x, y] = rPt(i, 99); g += `<line x1="${RC.x}" y1="${RC.y}" x2="${x}" y2="${y}" stroke="#121212" stroke-opacity=".16" stroke-width="1.2"/>`; });
    [20, 40, 60, 80].forEach((v) => { const [, y] = rPt(0, v); g += `<text x="${RC.x - 4}" y="${y + 3.5}" text-anchor="end" class="r-tick num">${v}</text>`; });
    const now = pts(EMO.map((e) => e.v));
    if (AURA) {
      g += `<defs>${EMO.map((e, i) => { const [x, y] = rPt(i, e.v); return `<linearGradient id="ray-${e.id}" gradientUnits="userSpaceOnUse" x1="${RC.x}" y1="${RC.y}" x2="${x}" y2="${y}"><stop offset="0" stop-color="#5B5BD6"/><stop offset=".45" stop-color="${haloOf(e.fill)}"/><stop offset="1" stop-color="${e.fill}"/></linearGradient>`; }).join('')}</defs>`;
      EMO.forEach((e, i) => {
        const [x, y] = rPt(i, e.v), [px, py] = rPt(i, e.prev), on = e.id === emoSel;
        g += `<line x1="${RC.x}" y1="${RC.y}" x2="${x}" y2="${y}" stroke="url(#ray-${e.id})" stroke-width="${on ? 17 : 13}" stroke-linecap="round"/>`;
        g += `<circle cx="${px}" cy="${py}" r="4" fill="none" stroke="#2A2622" stroke-width="1" stroke-dasharray="2 2"/>`;
        g += `<circle cx="${x}" cy="${y}" r="${on ? 13 : 11}" fill="none" stroke="#2A2622" stroke-width="1"/>`;
      });
    } else {
    g += `<polygon points="${now}" transform="translate(3 3)" fill="#121212"/>`;
    g += `<polygon points="${now}" fill="#FFD23F" stroke="#121212" stroke-width="2.6" stroke-linejoin="round"/>`;
    g += `<polygon points="${pts(EMO.map((e) => e.prev))}" fill="none" stroke="#121212" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round"/>`;
    }
    EMO.forEach((e, i) => {
      const [x, y] = rPt(i, e.v), on = e.id === emoSel;
      if (!AURA) g += `<circle cx="${x}" cy="${y}" r="${on ? 7.5 : 5.5}" fill="${e.fill}" stroke="#121212" stroke-width="2"/>`;
      const [lx, ly] = rPt(i, 99 * 1.3);
      g += `<g class="r-label${on ? ' is-on' : ''}" data-emo="${e.id}" transform="translate(${lx.toFixed(1)} ${(ly - 8).toFixed(1)})">
        ${picto(e, 'picto', -20, -32, 40)}
        <text y="21" text-anchor="middle" class="r-name">${e.name} <tspan class="num">${e.v}</tspan></text></g>`;
    });
    const R = $('#radar');
    R.innerHTML = g;
    R.setAttribute('aria-label', `עוצמת הרגשות השבוע: ${EMO.map((e) => `${e.name} ${e.v}`).join(', ')}`);
    $('#emo-pick').innerHTML = EMO.map((e) => `<button type="button" role="radio" aria-checked="${e.id === emoSel}" data-emo="${e.id}">${picto(e)}<span>${e.name}</span></button>`).join('');
    const e = EMO.find((x) => x.id === emoSel), d = e.v - e.prev;
    $('#emo-det').innerHTML = `<div class="panel-row"><h2 class="panel-h emo-h">${picto(e)}${e.name}</h2>
      <span class="panel-val"><b class="num">${e.v}</b> · ${d > 0 ? '+' : ''}<span class="num">${d}</span> מהשבוע שעבר</span></div>
      <p class="emo-out">יצא החוצה <b class="num">${Math.round(e.out * 100)}%</b> · השאר נשאר בפנים</p>
      <ul class="emo-states">${e.states.map(([n, v]) => `<li><span>${n}</span><span class="bar"><i style="width:${v * 10}%;background:${e.fill}"></i></span><b class="num">${v}</b></li>`).join('')}</ul>
      <div class="emo-facts"><p><small>מה הדליק</small><b>${e.trigger}</b></p><p><small>מה עשית עם זה</small><b>${e.did}</b></p></div>`;
  };
  $('#screen-emo').addEventListener('click', (e) => { const b = e.target.closest('[data-emo]'); if (b) { emoSel = b.dataset.emo; renderEmo(); } });
  renderEmo();

  /* ── the crew: a shared shape, no ranks; you can see who is sharp and reach him ── */
  const CREW = rf([
    { id: 'ido', name: 'עידו', init: 'ע', fill: '#3FC8F5', r: .22, last: 'שקט 4 ימים. הצורה שלו חדה כמו שלך.' },
    { id: 'doron', name: 'דורון', init: 'ד', fill: '#3DDC97', r: .7, last: 'דיבר עם אבא שלו אתמול, 40 דק׳.' },
    { id: 'alon', name: 'אלון', init: 'א', fill: '#FF7AC6', r: .5, last: 'שלח "בוא נדבר" בקבוצה. אף אחד לא ענה.' },
    { id: 'yoni', name: 'יוני', init: 'י', fill: '#FFD23F', r: .38, last: 'במילואים. החיישן לא מסונכרן.', off: true },
  ]);
  const renderCrew = () => {
    const g = (CREW.reduce((n, f) => n + f.r, 0) + heroTarget()) / (CREW.length + 1);
    $('#crew-shape').innerHTML = mini(g, 'mini', false, `הצורה של הקבוצה: ${stateWord(g)}`, undefined, 'burst', 9, true);
    $('#crew-state').textContent = `הקבוצה · ${g > .5 ? 'מתעגלת' : 'מתוחה'}`;
    $('#crew-list').innerHTML = CREW.map((f) => `<li class="mate">
      ${mini(f.r, 'mini mate-shape', !!f.off, '', undefined, 'burst', 9, true)}
      <div class="mate-body"><p class="mate-name"><b>${f.name}</b></p><p class="mate-last">${f.last}</p></div>
      <div class="mate-acts"><button type="button" class="crew-btn" data-crew-call="${f.id}">להתקשר</button><button type="button" class="crew-btn" data-crew-msg="${f.id}">הודעה</button></div></li>`).join('');
  };
  $('#screen-crew').addEventListener('click', (e) => {
    const c = e.target.closest('[data-crew-call]'); if (c) return openSheet(c.dataset.crewCall);
    const m = e.target.closest('[data-crew-msg]'); if (m) return openSheet(m.dataset.crewMsg, 'msg');
    if (e.target.closest('[data-crew-group]')) return openSheet('guys');
  });
  $('#crew-invite').addEventListener('click', () => { $('#crew-out').textContent = 'קוד הזמנה: WHP-4417. בתוקף 24 שעות. מי שמצטרף רואה את הצורה שלך.'; });
  renderCrew();

  /* ── רווחה: points for what came out. Personal only: no table, no ranks, nobody sees the balance ── */
  const GAIN = { bal: 340, led: [] };
  const EARN = [
    ['בכי מאומת', 50, 'נמדד אוטומטית'],
    ['שיחת עומק · 20 דק׳ ומעלה', 30, 'talk'],
    ['שיחה קבוצתית', 40, 'group'],
    ['טיפול ב"מה הוא צריך"', 15, 'care'],
    ['כל ירידה של 25 ב-MPL', 10, 'נמדד אוטומטית'],
  ];
  const SHOP = [
    { t: 'ערב זוגי · מסעדה לשניים', c: 300, n: 'שולחן שקט, בלי מסך' },
    { t: 'סדנת שליטה בכעסים · 4 מפגשים', c: 400, n: `לפי המדבקה: ${METRICS.find((m) => m.id === 'anger').sub.match(/\d+/)[0]} כעסים נשארו בפנים היום` },
    { t: 'מנוי חודשי ליוגה או לבריכה', c: 450, n: 'תנועה: 45 מתוך 100 היום' },
    { t: 'מפגש עם מטפל · 50 דק׳', c: 500, n: 'מהרשימה של קופת רווחה, בלי הפניה' },
    { t: 'סדנת זוגיות · לדבר בלי לנצח', c: 650, n: 'ערב אחד, שניכם' },
    { t: 'עיסוי זוגי', c: 700, n: '60 דק׳ · שתי מיטות' },
    { t: 'יום חופש מהעבודה, בלי להסביר', c: 1200, n: 'המעסיק מקבל אישור, לא סיבה' },
  ];
  const clock = () => { const n = new Date(); return `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`; };
  const renderGain = () => {
    $('#gain-bal').textContent = GAIN.bal.toLocaleString('he-IL');
    const next = SHOP.find((x) => !x.done && x.c > GAIN.bal) || SHOP.find((x) => !x.done);
    $('#gain-bar').style.width = next ? `${Math.min(100, GAIN.bal / next.c * 100)}%` : '100%';
    $('#gain-next-t').innerHTML = next ? (next.c > GAIN.bal ? `עוד <b class="num">${next.c - GAIN.bal}</b> ל${next.t}` : `אפשר לממש: ${next.t}`) : 'מימשת הכל.';
    const sum = GAIN.led.reduce((n, l) => n + l[1], 0);
    $('#led-sum').innerHTML = sum ? `<span class="num">+${sum}</span> היום` : '';
    $('#ledger').innerHTML = GAIN.led.length
      ? GAIN.led.map(([t, p, at]) => `<li><span class="num l-at">${at}</span><span class="l-t">${t}</span><b class="num l-p">+${p}</b></li>`).join('')
      : '<li class="l-empty">עוד לא הרווחת היום. 12 ימים בלי בכי לא שווים נקודות.</li>';
    $('#earn').innerHTML = EARN.map(([t, p, how]) => `<li><span class="e-t">${t}</span><b class="num e-p">+${p}</b>${['talk', 'group', 'care'].includes(how) ? `<button type="button" class="crew-btn e-go" data-earn="${how}">${how === 'group' ? 'לפתוח' : how === 'talk' ? 'להתקשר' : 'לטפל'}</button>` : `<span class="e-how">${how}</span>`}</li>`).join('');
    $('#shop').innerHTML = SHOP.map((x, i) => `<li class="${x.done ? 'is-done' : ''}"><span class="s-t">${x.t}<small>${x.n}</small></span><span class="num s-c">${x.c}</span><button type="button" class="crew-btn" data-buy="${i}" ${x.done || x.c > GAIN.bal ? 'disabled' : ''}>${x.done ? 'מומש' : 'לממש'}</button></li>`).join('');
  };
  const earn = (t, pts, from) => {
    const was = GAIN.bal;
    GAIN.bal = Math.min(5000, GAIN.bal + pts); GAIN.led.unshift([t, pts, clock()]); renderGain();
    countTo($('#gain-bal'), was, GAIN.bal);
    flyPts(`+${pts}`, from);
    fx($('#tab-gain'), 'is-bump'); fx($('#ledger li'), 'is-new');
  };
  $('#screen-gain').addEventListener('click', (e) => {
    const g = e.target.closest('[data-earn]');
    if (g) {
      if (g.dataset.earn === 'group') return openSheet('guys');
      show('today');
      const target = g.dataset.earn === 'talk' ? '#talk-h' : '#needs-h';
      return setTimeout(() => $(target).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 60);
    }
    const b = e.target.closest('[data-buy]'); if (!b) return;
    const x = SHOP[+b.dataset.buy];
    if (x.done || x.c > GAIN.bal) return;
    const was = GAIN.bal;
    GAIN.bal -= x.c; x.done = true; x.code = `WHP-${1000 + Math.floor(Math.random() * 9000)}`; x.at = clock();
    renderGain(); renderPerks();
    countTo($('#gain-bal'), was, GAIN.bal);
    fx($(`#shop [data-buy="${SHOP.indexOf(x)}"]`).closest('li'), 'is-stamped');
    flyPts(`−${x.c}`, b);
    $('#gain-out').textContent = `מומש: ${x.t}. הקוד ${x.code} נשלח לקופת רווחה, שתעדכן את המעסיק שלך. נשמר ב"ההטבות שלי" בפרופיל.`;
  });
  // the profile keeps what he redeemed
  const renderPerks = () => {
    const mine = SHOP.filter((x) => x.done);
    $('#my-perks').innerHTML = mine.length
      ? mine.map((x) => `<li><span class="p-t">${x.t}<small>מומש היום ב-<span class="num">${x.at}</span> · בתוקף עד <span class="num">31.1.2027</span></small></span><b class="num p-code">${x.code}</b></li>`).join('')
      : '<li class="p-empty">עוד לא מימשת כלום. <button type="button" class="link-btn" data-go="gain">לרווחה</button></li>';
    $('#perks-n').textContent = mine.length ? `${mine.length}` : '';
  };
  $('#my-perks').addEventListener('click', (e) => { if (e.target.closest('[data-go]')) show('gain'); });
  renderGain(); renderPerks();

  /* ── trends ── */
  // 16.11 → 15.12 (i = 0…29). Dry since a cry on 14.11, one cry on 3.12 (i = 17), rising every day since.
  // 6.12 (i = 20) is a sensor gap: the patch was removed overnight.
  const noise = (i) => Math.sin(i * 12.9898) * 43758.5453 % 1;
  const month = Array.from({ length: 30 }, (_, i) => {
    const base = i < 17 ? 1012 + i * .7 : 1009 + (i - 17) * 1.83;
    return mpl(base + (i < 17 ? noise(i) * 1.2 : 0));           // after the cry it only climbs
  });
  month[29] = mpl(1031);
  month[20] = null;
  // each day's roundness: right after a cry the shape is round, it sharpens with every dry day
  const monthRound = month.map((_, i) => Math.min(1, Math.exp(-(i < 17 ? i + 2 : i - 17) / 3.2) * 1.05));
  const RANGES = {
    week: { press: month.slice(-7), round: monthRound.slice(-7), unverified: 0, gap: null, mark: null,
      labels: [[0, 'ד׳ 9.12'], [3, 'ש׳ 12.12'], [6, 'היום']], since: 'בשבוע' },
    month: { press: month, round: monthRound, unverified: 23, gap: 20, mark: 17,
      labels: [[0, '16.11'], [15, '1.12'], [29, 'היום']], since: 'ב-30 יום' },
  };
  let range = 'month';
  let tearState = 'pending';                              // pending | confirmed | rejected

  const W = 340;
  // one line, one fill: MPL over time (right = oldest, as Hebrew reads); events sit in their own lane under the axis
  const drawTrends = () => {
    const r = RANGES[range];
    const P = r.press, n = P.length;
    const L = 30, R = W - 6, top = 14, base = 150, lane = 172;
    const x = (i) => R - (i / (n - 1)) * (R - L);
    const y = (v) => top + (1 - v / 1000) * (base - top);
    const step = (R - L) / (n - 1);
    let g = '';
    [250, 500, 750, 1000].forEach((v) => {
      g += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" class="c-grid"/><text x="0" y="${y(v) + 4}" class="c-y num" direction="ltr" text-anchor="start">${v}</text>`;
    });
    if (r.gap != null) g += `<rect x="${x(r.gap) - step / 2}" y="${top}" width="${step}" height="${base - top}" fill="url(#g-hatch)" class="c-gap"/>`;
    // contiguous runs (the sensor gap breaks the line)
    const runs = []; let cur = [];
    P.forEach((v, i) => { if (v == null) { if (cur.length) runs.push(cur); cur = []; } else cur.push(i); });
    if (cur.length) runs.push(cur);
    runs.forEach((run) => {
      const line = run.map((i, k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)} ${y(P[i]).toFixed(1)}`).join('');
      g += `<path d="${line}L${x(run[run.length - 1]).toFixed(1)} ${base}L${x(run[0]).toFixed(1)} ${base}Z" class="c-area"/>`;
      g += `<path d="${line}" class="c-line"/>`;
    });
    g += `<line x1="${L}" x2="${R}" y1="${base}" y2="${base}" class="c-base"/>`;
    // the event lane: what happened, under the day it happened
    const ev = [];
    if (r.mark != null) ev.push([r.mark, 'בכי', `<path d="${polar({ round: .9, R: 7, cx: x(r.mark), cy: lane, base: 'drop', n: 7 })}" fill="#3FC8F5" class="c-ev"/>`]);
    if (r.gap != null) ev.push([r.gap, 'חיישן', `<rect x="${x(r.gap) - 6}" y="${lane - 6}" width="12" height="12" rx="3" fill="url(#g-hatch)" class="c-ev"/>`]);
    if (r.unverified != null && tearState !== 'rejected') ev.push([r.unverified, tearState === 'confirmed' ? 'בבדיקה' : 'דמעה?', `<circle cx="${x(r.unverified)}" cy="${lane}" r="6.5" fill="#fff" class="c-ev" stroke-dasharray="${tearState === 'confirmed' ? '0' : '3 2'}"/>`]);
    ev.forEach(([i, label, mark], k) => {
      g += `<line x1="${x(i)}" x2="${x(i)}" y1="${P[i] == null ? top : y(P[i])}" y2="${lane - 8}" class="c-drop"/>${mark}<text x="${x(i)}" y="${lane + 20 + (k % 2) * 15}" text-anchor="middle" class="c-ev-t">${label}</text>`;
    });
    // today: the one point that is called out
    g += `<circle cx="${x(n - 1)}" cy="${y(P[n - 1])}" r="6" class="c-now"/>`;
    g += r.labels.map(([i, l]) => `<text x="${x(i)}" y="${ev.length ? lane + 56 : lane + 4}" direction="ltr" text-anchor="${i === 0 ? 'end' : i === n - 1 ? 'start' : 'middle'}" class="c-x">${l}</text>`).join('');
    const svg = $('#chart-press');
    svg.setAttribute('viewBox', `0 0 340 ${ev.length ? 234 : 182}`);
    svg.innerHTML = `<defs><pattern id="g-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(18,18,18,.45)" stroke-width="1.5"/></pattern></defs>${g}`;
    $('#press-now').textContent = P[n - 1];
    const first = P.find((v) => v != null), delta = P[n - 1] - first;
    $('#press-delta').innerHTML = `<span dir="ltr" class="num">${delta >= 0 ? '+' : '−'}${Math.abs(delta)}</span> ${r.since}`;
    $$('#screen-trends [data-only]').forEach((el) => { el.hidden = el.dataset.only !== range; });
  };
  $$('#range button').forEach((b) => b.addEventListener('click', () => {
    range = b.dataset.range;
    $$('#range button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    drawTrends();
  }));

  // four measures across the last four weeks: one row per measure, one tile per week, coloured by how round it was
  const WEEK_LABELS = ['16.11', '23.11', '30.11', '7.12'];
  const WEEKS = {
    cry: { r: [.35, .2, .92, .08], v: ['1', '0', '2', '0'] },
    anger: { r: [.45, .42, .36, .3], v: ['2/4', '2/5', '1/4', '1/3'] },
    press: { r: [.55, .46, .33, .22], v: ['4', '5', '7', '9'] },
    talk: { r: [.5, .55, .6, .67], v: ['2', '3', '3', '4'] },
  };
  const trendWord = (a2) => { const d = a2[a2.length - 1] - a2[0]; return d > .08 ? 'מתעגל' : d < -.08 ? 'מתחדד' : 'יציב'; };
  $('#measures-weeks').innerHTML = `<colgroup><col class="c-name"><col span="4"><col class="c-trend"></colgroup><thead><tr><th scope="col"><span class="sr">מדד</span></th>${WEEK_LABELS.map((w, i) => `<th scope="col" class="num">${i === WEEK_LABELS.length - 1 ? 'השבוע' : w}</th>`).join('')}<th scope="col"><span class="sr">מגמה</span></th></tr></thead><tbody>`
    + METRICS.map((m) => {
      const w = WEEKS[m.id], t = trendWord(w.r);
      return `<tr><th scope="row">${mini(.5, 'mini mw-icon', false, '', m.fill, m.base, m.n)}<span>${m.name}</span></th>${w.v.map((v, i) => `<td><span class="mw-tile num" style="background:${R(w.r[i] < .34 ? '#FF5A36' : w.r[i] < .6 ? '#FFD23F' : '#3FC8F5')}">${v}</span></td>`).join('')}<td><span class="mw-trend is-${t === 'מתעגל' ? 'up' : t === 'מתחדד' ? 'down' : 'flat'}">${t}</span></td></tr>`;
    }).join('') + '</tbody>';

  // December 2026 calendar (1.12 is a Tuesday; columns run Sunday → Saturday, right to left).
  // Every marked day carries a hand glyph and one line of context; one day is left untagged.
  const DAYLOG = {
    3:  { g: 'cry', text: '11 דק׳ · ברמזור בדרך הביתה.' },
    6:  { g: null, gap: true, text: 'החיישן הוסר בין 02:10 ל-07:40. לא תויג.' },
    8:  { g: 'anger', text: 'כעס שלא נאמר · ישיבת צוות.' },
    9:  { g: 'cry', unverified: true },
    10: { g: 'press', n: 2, text: 'הדחקה ×2 · "הכל טוב, אחי".' },
    11: { g: 'press', n: 3, text: 'הדחקה ×3 · ארוחת שישי.' },
    13: { g: 'anger', text: 'כעס שלא נאמר · 40 דקות בפקק באיילון.' },
    14: { g: 'press', n: 2, text: 'הדחקה ×2 · אבא שאל מה נשמע.' },
    15: { g: 'press', n: 2, text: 'הדחקה ×2 · עד עכשיו.' },
    18: { g: null, fc: true, text: 'תחזית · 60% · ארוחת ערב משפחתית.' },
  };
  const TEAR = {
    pending: 'דמעה לא מאומתת · <span class="num">0.4</span> מ״ל · סיבה אפשרית: בצל.',
    confirmed: 'נשלח לאימות ידני בקופת רווחה. זמן טיפול משוער: 14 ימי עסקים.',
    rejected: 'נמחק. הרצף היבש נשמר.',
  };
  const cal = $('#cal');
  let calSel = null;
  const renderCal = () => {
    cal.innerHTML = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map((d) => `<span class="dow">${d}</span>`).join('')
      + '<span></span><span></span>'
      + Array.from({ length: 31 }, (_, i) => {
        const day = i + 1, log = DAYLOG[day];
        const hideTear = day === 9 && tearState === 'rejected';
        const cls = [
          day === 3 ? 'rain' : '', day === 15 ? 'today' : '', day > 15 ? (log?.fc ? 'fc' : 'future') : '',
          log?.gap ? 'gap' : '', log?.unverified && !hideTear ? 'unverified' : '', calSel === day ? 'is-sel' : '',
        ].join(' ');
        const r0 = day <= 15 ? monthRound[day + 14] : day === 18 ? .66 : null;
        const shape = r0 != null && !log?.gap ? mini(r0, 'mini cal-shape', day > 15 || (day === 9 && !hideTear), '') : '';
        const label = `${day} בדצמבר${log?.unverified && !hideTear ? ', דמעה לא מאומתת' : log?.text ? `, ${log.text}` : ''}`;
        return `<button type="button" class="c ${cls}" data-day="${day}" aria-pressed="${calSel === day}" aria-label="${label}">${shape}<span class="num">${day}</span></button>`;
      }).join('');
  };
  const renderDetail = () => {
    const box = $('#cal-detail');
    if (!calSel) { box.innerHTML = '<p class="cal-hint">הקש על יום כדי לראות מה נרשם בו.</p>'; return; }
    const log = DAYLOG[calSel];
    const date = `<span class="cd-date num">${calSel}.12</span>`;
    if (calSel === 9 && log) {
      box.innerHTML = `<p class="cd-line">${date}${glyph('cry', 'glyph glyph-detail')}<span>${TEAR[tearState]}</span></p>`
        + (tearState === 'pending' ? `<div class="cd-actions"><button type="button" data-tear="confirmed">אשר</button><button type="button" data-tear="rejected">דחה</button></div>` : '');
      return;
    }
    const text = log?.text || (calSel > 15 ? 'עוד לא נמדד.' : 'יבש. אין רישום.');
    box.innerHTML = `<p class="cd-line">${date}${log?.g ? glyph(log.g, 'glyph glyph-detail') : ''}<span>${text}</span></p>`;
  };
  cal.addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    calSel = +b.dataset.day === calSel ? null : +b.dataset.day;
    renderCal(); renderDetail();
    cal.querySelector(`[data-day="${b.dataset.day}"]`)?.focus();
  });
  $('#cal-detail').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tear]');
    if (!b) return;
    tearState = b.dataset.tear;
    // the decision follows him everywhere: Today's measure, the shape tab note, the week in words
    METRICS[0].sub = tearState === 'rejected' ? 'הדמעה נמחקה' : 'בבדיקה בקופה';
    NOTES[6] = tearState === 'rejected' ? 'הדמעה נמחקה. הרצף היבש נשמר.' : 'דמעה לא מאומתת · נשלחה לאימות ידני.';
    renderMetrics();
    const storyRow = $('#story li');
    if (storyRow && tearState === 'rejected') storyRow.querySelector('.st-text').textContent = 'נמחק. הרצף היבש נשמר.';
    $('#pending-badge').hidden = true;
    renderCal(); renderDetail(); drawTrends();
  });
  $('#cal-key').innerHTML = `<li>${mini(.08, 'mini ck-shape')}חד</li><li>${mini(.95, 'mini ck-shape')}עגול</li>`
    + '<li><i class="ck-unv"></i>לא מאומת</li><li><i class="ck-gap"></i>חיישן מנותק</li>';
  renderCal();

  // small data: the week as the man tagged it himself
  const STORY = [
    ['ד׳ 9.12', 'cry', 'אולי בצל. אולי לא.'],
    ['ה׳ 10.12', 'press', 'אמרתי "הכל טוב, אחי" פעמיים.'],
    ['ו׳ 11.12', 'press', 'ארוחת שישי. שלוש פעמים "לא משנה".'],
    ['ש׳ 12.12', null, 'ישנתי עד 11.'],
    ['א׳ 13.12', 'anger', 'פקק באיילון. 40 דקות של שתיקה.'],
    ['ב׳ 14.12', 'press', 'אבא שאל מה נשמע. "סבבה".'],
    ['היום', null, 'לא תויג.'],
  ];
  $('#story').innerHTML = STORY.map(([d, g, t]) => `
    <li><span class="st-day">${d}</span><span class="st-mark">${g ? glyph(g) : '<i class="st-empty" aria-hidden="true"></i>'}</span><span class="st-text${t === 'לא תויג.' ? ' is-empty' : ''}">${t}</span></li>`).join('');

  /* ── profile: sharing reveals what it pays ── */
  $('#share').addEventListener('change', (e) => {
    $('#share-out').hidden = !e.target.checked;
    if (e.target.checked) $('#screen-profile').scrollTo({ top: 1e5, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ── profile: goal stepper ── */
  const goal = $('#goal-rain');
  const stepBtns = $$('[data-step]');
  const syncGoal = () => {
    const v = +goal.value;
    stepBtns[0].disabled = v <= 0;
    stepBtns[1].disabled = v >= 7;
    $('#goal-note').textContent = v === 0 ? 'יעד אפס כבוי. המעקב ממשיך.' : `ממוצע לגילך: 4 בשבוע. הושלמו 0 מתוך ${v}.`;
  };
  stepBtns.forEach((b) => b.addEventListener('click', () => { goal.value = String(Math.max(0, Math.min(7, +goal.value + +b.dataset.step))); syncGoal(); }));
  syncGoal();
  // the app opens on the WHOOP → WHEEP transition, unless a deep link asks for a specific tab
  const tabHash = tabs.some((t) => `#${t.dataset.tab}` === location.hash);
  if (tabHash) { intro.hidden = true; fromHash(); } else if (location.hash === '#about') openInfo(); else runIntro();
})();
