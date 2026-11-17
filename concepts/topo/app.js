// WHEEP prototype: tabs, forecast content, map, trends, profile. All data is demo data.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── device scaling (desktop presentation) ── */
  const device = $('#device');
  const fit = () => {
    if (innerWidth <= 500) { device.style.transform = ''; return; }
    device.style.transform = `scale(${Math.min(1, (innerHeight - 32) / 868, (innerWidth - 32) / 414)})`;
  };
  addEventListener('resize', fit); fit();

  /* ── weather icons (authored SVG, one stroke family) ── */
  // Same 24 grid and 1.75 stroke as the tab icons; colour carries the weather (sun gold, cloud ink, rain cyan).
  const CLOUD = (dy = 0) => `<path d="M7 ${18.25 - dy}h10a3.75 3.75 0 0 0 .3-7.49 5.25 5.25 0 0 0-10.1 1.2A3.15 3.15 0 0 0 7 ${18.25 - dy}z" fill="rgba(201,208,245,.16)" stroke="#C9D0F5"/>`;
  const WX = {
    clear: '<circle cx="12" cy="12" r="4" fill="#FFD36E"/><path stroke="#FFD36E" d="M12 2.75v1.75M12 19.5v1.75M2.75 12h1.75M19.5 12h1.75M5.45 5.45l1.25 1.25M17.3 17.3l1.25 1.25M5.45 18.55l1.25-1.25M17.3 6.7l1.25-1.25"/>',
    cloud: CLOUD(),
    drizzle: CLOUD(3) + '<path stroke="#6CF4FF" d="M10 18.25l-.75 2M14.5 18.25l-.75 2"/>',
    rain: CLOUD(3) + '<path stroke="#6CF4FF" d="M8.75 18.25l-1 2.5M12.75 18.25l-1 2.5M16.75 18.25l-1 2.5"/>',
  };
  const wx = (k, label) => `<svg class="wx" viewBox="0 0 24 24" role="img" aria-label="${label}">${WX[k]}</svg>`;
  const WXNAME = { clear: 'בהיר', cloud: 'מעונן', drizzle: 'טפטוף', rain: 'גשם' };

  /* ── the notebook glyphs, drawn by hand (pen wobble via #hand filter) ── */
  const GLYPH = {
    cry:     { name: 'בכי',    color: '#6CF4FF', d: 'M12.2 2.9C10 7.1 6.9 10.2 7.2 14.4c.3 3.6 2.6 6 5.1 5.9 3-.2 5-2.7 4.6-6.2-.4-3.3-2.9-6.6-4.7-11.2z' },
    anger:   { name: 'כעס',    color: '#FF9A4A', d: 'M12.0 1.8L13.2 8.6L18.1 6.3L16.0 10.3L21.5 9.5L15.4 12.3L19.2 17.2L14.3 15.4L16.0 21.6L12.2 15.7L8.2 19.2L8.7 14.9L4.2 17.6L8.6 12.9L3.1 9.9L8.7 9.8L5.6 4.3L10.7 8.4z' },
    empathy: { name: 'אמפתיה', color: '#E77FD8', d: 'M12 11.4C9.3 5.2 4.3 7.6 7.7 11.9c-4 3.4.9 8.2 4.1 1.4 3.1 6.4 8.4 2.5 4.4-1.4 3.9-4-1.4-7.2-4.2-.5z' },
    press:   { name: 'הדחקה',  color: '#A3ACDD', d: 'M8.7 3.3l7.2-.2 4.9 5.4.1 7.1-5.2 5.2-7.4-.1-5-5.3.3-7.2z' },
  };
  const glyph = (k, cls = 'glyph') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH[k].d}" stroke="${GLYPH[k].color}" filter="url(#hand)"/></svg>`;

  /* ── Bouba/Kiki: one shape that is spiky under pressure and rounds off with release ──
     round 0 = sharp burst (kiki), 1 = soft near-circle (bouba). Corners are cut by `c` and bridged with curves. */
  const kikiBouba = (round, R = 20, cx = 24, cy = 24, n = 9) => {
    const inner = .42 + .55 * round, c = .5 * round;
    const v = Array.from({ length: n * 2 }, (_, i) => {
      const a = -Math.PI / 2 + i * Math.PI / n, r = R * (i % 2 ? inner : 1);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
    const f = (n2) => n2.toFixed(2);
    return v.map((p, i) => {
      const pr = v[(i + v.length - 1) % v.length], nx = v[(i + 1) % v.length];
      const a = [p[0] + (pr[0] - p[0]) * c, p[1] + (pr[1] - p[1]) * c];
      const b = [p[0] + (nx[0] - p[0]) * c, p[1] + (nx[1] - p[1]) * c];
      return `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(p[0])} ${f(p[1])} ${f(b[0])} ${f(b[1])}`;
    }).join('') + 'Z';
  };
  const kbColor = (round) => {
    const A = [255, 154, 74], B = [108, 244, 255];            // anger amber → river cyan
    return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * round)).join(',')})`;
  };
  const paintKB = (svg, round) => { const p = svg.querySelector('path'); p.setAttribute('d', kikiBouba(round)); p.setAttribute('stroke', kbColor(round)); };

  /* ── today: hourly ── */
  const HOURS = [
    ['עכשיו', 'clear', 5, ''], ['10:00', 'cloud', 5, ''], ['12:00', 'cloud', 5, ''],
    ['14:00', 'cloud', 10, 'ישיבת צוות', 'press'], ['16:00', 'cloud', 5, ''], ['18:00', 'drizzle', 15, 'פקק באיילון', 'anger'],
    ['20:00', 'cloud', 10, ''], ['22:00', 'drizzle', 25, 'שיחה עם שירי', 'empathy'],
  ];
  // the machine forecasts the weather; the hand marks what he expects to feel
  $('#hourly').innerHTML = HOURS.map(([t, k, p, why, g]) => `
    <li><span class="h-time num">${t}</span>${wx(k, WXNAME[k])}
    <span class="h-pct num${p < 15 ? ' is-low' : ''}">${p}%</span><span class="h-cause">${g ? glyph(g, 'glyph glyph-cause') : ''}${why}</span></li>`).join('');

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
  const pos = (v) => ((v - 1000) / 40) * 100;
  $('#days').innerHTML = DAYROWS.map(([n, k, p, lo, hi, now, why, g]) => `
    <li><span class="d-name">${n}</span>${wx(k, WXNAME[k])}
      <span class="d-pct num${p < 15 ? ' is-low' : ''}">${p}%</span>
      <span class="d-range" aria-label="לחץ בין ${lo} ל-${hi}"><span class="lo num">${lo}</span>
        <span class="d-bar"><i style="right:${pos(lo)}%;width:${pos(hi) - pos(lo)}%"></i>${now ? `<b style="right:${pos(now)}%"></b>` : ''}</span>
        <span class="hi num">${hi}</span></span>
      ${why ? `<span class="d-why">${g ? glyph(g, 'glyph glyph-cause') : ''}${why}</span>` : ''}</li>`).join('');

  /* ── journal: the human answer is allowed to be "not sure" ── */
  const JOURNAL = {
    yes: 'נרשם. הדיווח שלך לא תואם לחיישן ונשלח לבדיקה.',
    no: 'נרשם. תואם לחיישן.',
    unsure: 'נרשם. ספק נשמר כנתון.',
  };
  $$('.choices button').forEach((b) => b.addEventListener('click', () => {
    $$('.choices button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#journal-out').textContent = JOURNAL[b.dataset.answer];
  }));

  /* ── alert expand ── */
  const alertBtn = $('#alert');
  alertBtn.addEventListener('click', () => {
    const open = alertBtn.getAttribute('aria-expanded') === 'true';
    alertBtn.setAttribute('aria-expanded', String(!open));
    $('#alert-more').hidden = open;
  });

  /* ── tabs ── */
  const tabs = $$('[role="tab"]');
  let mapTerrain = null;
  const show = (name, focusTab = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    $$('.screen').forEach((s) => {
      const on = s.id === `screen-${name}`;
      if (on && s.hidden) {
        s.hidden = false;
        s.classList.remove('is-entering'); void s.offsetWidth; s.classList.add('is-entering');
        s.scrollTop = 0;
      } else if (!on) s.hidden = true;
    });
    if (name === 'map') { initMap(); setSky(wetness(mapTerrain.day)); } else setSky(0);
    if (name === 'trends') drawTrends();
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  $('.tabbar').addEventListener('keydown', (e) => {
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const step = { ArrowLeft: 1, ArrowRight: -1 }[e.key]; // RTL: left is "next"
    if (step) { e.preventDefault(); show(tabs[(i + step + tabs.length) % tabs.length].dataset.tab, true); }
  });
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));
  /* ── opening: a performance tracker becomes WHEEP at midnight, 1.12.2026, then explains itself ── */
  const intro = $('#intro'), shapeEl = $('#iw-shape');
  // ring and drop share one structure (move + 4 cubics), so the numbers interpolate cleanly
  const RING = [100, 22, 143, 22, 178, 57, 178, 100, 178, 143, 143, 178, 100, 178, 57, 178, 22, 143, 22, 100, 22, 57, 57, 22, 100, 22];
  const DROP = [100, 20, 110, 52, 150, 84, 150, 120, 150, 152, 127, 176, 100, 176, 73, 176, 50, 152, 50, 120, 50, 84, 90, 52, 100, 20];
  const shapeD = (t) => {
    const p = RING.map((v, i) => (v + (DROP[i] - v) * t).toFixed(1));
    return `M${p[0]} ${p[1]}C${p.slice(2, 8).join(' ')}C${p.slice(8, 14).join(' ')}C${p.slice(14, 20).join(' ')}C${p.slice(20, 26).join(' ')}Z`;
  };
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  let introTimers = [], morphRaf = 0;
  const setShape = (t) => {
    shapeEl.setAttribute('d', shapeD(t));
    shapeEl.style.strokeDasharray = `${88 + 12 * t} 100`;   // strain ring at 88% closes into a whole drop
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
        const k = Math.min(1, (t - t0) / 1500);
        setShape(ease(k));
        if (k < 1) morphRaf = requestAnimationFrame(step);
      };
      morphRaf = requestAnimationFrame(step);
    }, 1500));
    introTimers.push(setTimeout(showAbout, 3600));
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
  $('#ab-map').innerHTML = [
    ['cry', 'בכי · משקעים.', 'כל דמעה נרשמת כגשם, ונחל נפתח במפה.'],
    ['anger', 'כעס מופנם · פסגות.', 'מה שלא נאמר מתחדד ומתגבה.'],
    ['press', 'הדחקה · לחץ גבוה.', '"הכל טוב" נצבר בשקט, יום אחרי יום.'],
    ['empathy', 'אמפתיה · גבעות.', 'לחות באוויר. שיחות שנמשכו.'],
  ].map(([k, h, t]) => `<li>${glyph(k, 'glyph glyph-about')}<span><b>${h}</b> ${t}</span></li>`).join('');
  [['.kb-a', 0], ['.kb-b', .5], ['.kb-c', 1]].forEach(([s, r]) => paintKB($(s), r));
  paintKB($('#kb-hero'), flowAt(TODAY));
  paintKB($('#kb-live'), flowAt(TODAY));

  // deep links for presenting and recording: #map, #trends, #profile, #intro (replay), #about
  const fromHash = () => {
    const h = location.hash.slice(1);
    if (h === 'intro') return runIntro();
    if (h === 'about') return openInfo();
    if (tabs.some((t) => t.dataset.tab === h)) show(h);
  };
  addEventListener('hashchange', fromHash);

  /* ── mini map on today ── */
  new Terrain($('#mini-map'), { labels: $('#mini-labels'), interactive: false, autoSpin: true, cy: .66 });
  $('#mini-map').addEventListener('click', () => show('map'));

  /* ── sky: the screen's ground follows the weather of the scrubbed day ── */
  const DRY = ['#0A0E2E', '#15195A', '#12406A', '#0C5A66'];
  const WET = ['#071C2C', '#0B3D57', '#0E5F6E', '#11806F'];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)).join(',')})`;
  const phoneEl = $('.phone');
  const setSky = (wet) => DRY.forEach((c, i) => phoneEl.style.setProperty(`--sky-${i}`, mix(c, WET[i], wet)));
  const wetness = (d) => Math.max(0, Math.min(1, (flowAt(d) - .08) / .55));

  /* ── map tab ── */
  const SHEET = {
    ridge: (d) => ({ kind: 'הר · הדחקה', val: Math.round(amps.ridge(d) * 1000), unit: 'מ׳',
      note: d > TODAY + .01 ? 'צפוי לרדת בכ-400 מ׳ אם יירד גשם ביום ו׳.'
        : d < .5 ? 'גובה בסיס, ביום של הבכי האחרון.'
        : `גבה ב-${Math.round((amps.ridge(d) - amps.ridge(0)) * 1000)} מ׳ מאז הבכי האחרון.${d >= TODAY - .5 ? ' 9 הדחקות השבוע.' : ''}` }),
    anger: (d) => ({ kind: 'פסגה · כעס מופנם', val: Math.round(amps.anger(d) * 1000), unit: 'מ׳',
      note: d >= 10 ? '2 כעסים שלא נאמרו החודש. השיא: יום א׳, פקק באיילון.' : d >= 5 ? 'כעס שלא נאמר ב-8.12 · ישיבת צוות.' : 'בסיס. אין כעסים רשומים.' }),
    empathy: (d) => ({ kind: 'גבעות · אמפתיה', val: Math.round(amps.empathy(d) * 245), unit: '% לחות רגשית',
      note: '4 שיחות השבוע ארוכות מ-20 דקות.' }),
    river: (d) => ({ kind: 'נחל · בכי', val: Math.round(flowAt(d) * 100), unit: '% זרימה',
      note: d > TODAY + .01 ? 'תחזית: 60% סיכוי לזרימה מחודשת ביום ו׳.'
        : d < .5 ? '11 דקות ברמזור בדרך הביתה.'
        : 'הערוץ מתייבש. אין משקעים מאז 3.12.' }),
  };
  const FEATURE_GLYPH = { ridge: 'press', anger: 'anger', empathy: 'empathy', river: 'cry' };
  $('#legend').innerHTML = ['anger', 'press', 'empathy', 'cry']
    .map((k) => `<li>${glyph(k)}${GLYPH[k].name}</li>`).join('');
  let selected = null;
  const renderSheet = () => {
    const d = mapTerrain ? mapTerrain.day : TODAY;
    $('#sheet-empty').hidden = !!selected;
    $('#sheet-body').hidden = !selected;
    if (!selected) return;
    const f = FEATURES.find((x) => x.id === selected);
    const s = SHEET[selected](d);
    $('#sheet-kind').textContent = s.kind;
    $('#sheet-name').textContent = f.name;
    $('#sheet-glyph').innerHTML = glyph(FEATURE_GLYPH[selected], 'glyph glyph-sheet');
    const pct = s.unit.startsWith('%');
    $('#sheet-val').textContent = s.val.toLocaleString('he-IL') + (pct ? '%' : '');
    $('#sheet-unit').textContent = pct ? s.unit.slice(1).trim() : s.unit;
    $('#sheet-note').textContent = s.note;
  };
  const select = (id) => {
    selected = id === selected ? null : id;
    mapTerrain.select(selected);
    $('#map-hint').style.opacity = 0;
    renderSheet();
  };

  const dayInput = $('#day');
  const setDay = (d) => {
    mapTerrain.setDay(d);
    const i = Math.round(d);
    const label = i === TODAY ? 'היום · ג׳ 15.12' : i > TODAY ? `תחזית · ${DAYS[i]}` : DAYS[i];
    $('#map-day-label').textContent = label;
    dayInput.setAttribute('aria-valuetext', label);
    setSky(wetness(d));
    paintKB($('#kb-live'), Math.min(1, flowAt(d) * 1.1));
    renderSheet();
  };

  function initMap() {
    if (mapTerrain) { mapTerrain.resize(); return; }
    mapTerrain = new Terrain($('#map-canvas'), { labels: $('#map-labels'), onSelect: select });
    dayInput.addEventListener('input', () => { stopPlay(); setDay(+dayInput.value); });
  }

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

  /* ── trends ── */
  // 16.11 → 15.12 (i = 0…29). Dry since a cry on 14.11, one cry on 3.12 (i = 17), rising every day since.
  // 6.12 (i = 20) is a sensor gap: the patch was removed overnight.
  const noise = (i) => Math.sin(i * 12.9898) * 43758.5453 % 1;
  const month = Array.from({ length: 30 }, (_, i) => {
    const base = i < 17 ? 1012 + i * .7 : 1009 + (i - 17) * 1.83;
    return Math.round(base + (i < 17 ? noise(i) * 1.2 : 0));   // after the cry it only climbs
  });
  month[29] = 1031;
  month[20] = null;
  const GAP_MONTH = 20, UNVERIFIED_WEEK = 0;            // 9.12 is the first day of the week view
  const RANGES = {
    week: { press: month.slice(-7), rain: [0, 0, 0, 0, 0, 0, 0], unverified: UNVERIFIED_WEEK, gap: null,
      labels: ['ד׳ 9.12', 'ש׳', 'היום'], mark: null, unit: 'שבוע' },
    month: { press: month, rain: month.map((_, i) => (i === 17 ? 11 : 0)), unverified: 23, gap: GAP_MONTH,
      labels: ['16.11', '1.12', 'היום'], mark: 17, unit: 'חודש' },
  };
  let range = 'month';
  let tearState = 'pending';                              // pending | confirmed | rejected

  const W = 340;
  const drawTrends = () => {
    const r = RANGES[range];
    // pressure line (time runs right → left, like the RTL scrubber)
    const P = r.press, n = P.length, lo = 1000, hi = 1040, H = 120;
    const x = (i) => W - (i / (n - 1)) * W;
    const y = (v) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 10);
    // split the line where the sensor was off, so the gap reads as missing data, not as a value
    const runs = [[]];
    P.forEach((v, i) => (v == null ? runs.push([]) : runs[runs.length - 1].push([x(i), y(v)])));
    const path = (pts) => pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join('');
    const lines = runs.filter((rn) => rn.length > 1);
    const mk = r.mark != null ? `<g class="mark"><line x1="${x(r.mark)}" x2="${x(r.mark)}" y1="6" y2="${H}" stroke="#6CF4FF" stroke-dasharray="3 4"/><text x="${x(r.mark) - 6}" y="16" text-anchor="end">בכי אחרון 3.12</text></g>` : '';
    const gap = r.gap != null ? `<g class="gap"><rect x="${x(r.gap + 1)}" y="6" width="${x(r.gap - 1) - x(r.gap + 1)}" height="${H - 6}" fill="url(#g-hatch)"/><text x="${x(r.gap)}" y="${H - 6}" text-anchor="middle">החיישן הוסר</text></g>` : '';
    $('#chart-press').innerHTML = `
      <defs><linearGradient id="g-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C257D6" stop-opacity=".45"/><stop offset="1" stop-color="#2FA8F0" stop-opacity="0"/></linearGradient>
      <linearGradient id="g-line" x1="1" x2="0"><stop offset="0" stop-color="#2FA8F0"/><stop offset=".6" stop-color="#8C63F2"/><stop offset="1" stop-color="#FF9A4A"/></linearGradient>
      <pattern id="g-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(190,200,255,.28)" stroke-width="1.5"/></pattern></defs>
      ${[1010, 1020, 1030].map((v) => `<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(190,200,255,.12)"/><text x="${W}" y="${y(v) - 4}" text-anchor="start" class="num">${v}</text>`).join('')}
      ${lines.map((pts) => `<path d="${path(pts)}L${pts[pts.length - 1][0]} ${H}L${pts[0][0]} ${H}Z" fill="url(#g-area)"/>`).join('')}
      ${lines.map((pts) => `<path d="${path(pts)}" fill="none" stroke="url(#g-line)" stroke-width="2.4" stroke-linejoin="round"/>`).join('')}
      ${gap}${mk}
      <circle cx="${x(n - 1)}" cy="${y(P[n - 1])}" r="5" fill="#FFD36E" stroke="#15195A" stroke-width="2"/>
      ${r.labels.map((l, i) => `<text x="${W - (i / (r.labels.length - 1)) * W}" y="${H + 20}" text-anchor="${i === 0 ? 'end' : i === r.labels.length - 1 ? 'start' : 'middle'}">${l}</text>`).join('')}`;
    $('#press-now').textContent = P[n - 1];
    const delta = P[n - 1] - P[0];
    $('#press-delta').innerHTML = `<span dir="ltr" class="num">${delta >= 0 ? '+' : '−'}${Math.abs(delta)}</span> ב${r.unit}`;

    // rain bars
    const R = r.rain, m = R.length, max = 12, bw = W / m;
    const total = R.reduce((a, b) => a + b, 0);
    $('#rain-total').textContent = total;
    // the unverified tear: an outline with a question mark, not a bar, until someone decides
    const uv = r.unverified != null && tearState !== 'rejected'
      ? (() => { const ux = W - (r.unverified + 1) * bw + bw * .2, uw = bw * .6, uh = 14;
          return `<rect x="${ux}" y="${90 - uh}" width="${uw}" height="${uh}" rx="2" fill="none" stroke="#6CF4FF" stroke-dasharray="2 2"/><text x="${ux + uw / 2}" y="${90 - uh - 5}" text-anchor="middle" class="q">${tearState === 'confirmed' ? 'בבדיקה' : '?'}</text>`; })()
      : '';
    const bars = R.map((v, i) => {
      const h = (v / max) * 80;
      return `<rect x="${W - (i + 1) * bw + bw * .2}" y="${90 - h}" width="${bw * .6}" height="${Math.max(h, 1.5)}" rx="${Math.min(3, bw * .3)}" fill="${v ? '#6CF4FF' : 'rgba(190,200,255,.18)'}"/>`;
    }).join('');
    const empty = total === 0 ? `<text x="${W / 2}" y="44" text-anchor="middle" style="font-size:14px;fill:#C9D0F5">אין משקעים מאומתים ב${r.unit} הזה.</text>` : '';
    $('#chart-rain').innerHTML = bars + uv + empty + r.labels.map((l, i) => `<text x="${W - (i / (r.labels.length - 1)) * W}" y="110" text-anchor="${i === 0 ? 'end' : i === r.labels.length - 1 ? 'start' : 'middle'}">${l}</text>`).join('');
  };
  $$('#range button').forEach((b) => b.addEventListener('click', () => {
    range = b.dataset.range;
    $$('#range button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    drawTrends();
  }));

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
        const mark = log?.g && !hideTear ? glyph(log.g, 'glyph glyph-cal') : '';
        const label = `${day} בדצמבר${log?.unverified && !hideTear ? ', דמעה לא מאומתת' : log?.text ? `, ${log.text}` : ''}`;
        return `<button type="button" class="c ${cls}" data-day="${day}" aria-pressed="${calSel === day}" aria-label="${label}"><span class="num">${day}</span>${mark}</button>`;
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
    $('#pending-badge').hidden = true;
    renderCal(); renderDetail(); drawTrends();
  });
  $('#cal-key').innerHTML = ['cry', 'anger', 'press'].map((k) => `<li>${glyph(k)}${GLYPH[k].name}</li>`).join('')
    + '<li><i class="ck-gap"></i>חיישן מנותק</li><li><i class="ck-fc"></i>תחזית</li>';
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
  /* ── EgoCheck: corrections accepted on the keyboard lower the inner pressure ── */
  const tileNum = $('.gauge-num'), tileNote = tileNum.nextElementSibling;
  const renderEgo = () => {
    let log = {};
    try { log = JSON.parse(localStorage.getItem('wheep.egocheck') || '{}'); } catch (_) { /* no storage */ }
    const rows = Object.values(log).sort((a, b) => a.at.localeCompare(b.at));
    const drop = rows.reduce((n, r) => n + (r.from - r.to), 0);
    const p = 1031 - drop;
    tileNum.innerHTML = `${p} <small>hPa</small>`;
    tileNote.textContent = drop ? `יורד. ${rows.length} תיקונים היום.` : 'עולה. 12 ימים ברצף.';
    $('#ego-out').innerHTML = rows.length ? `
      <div class="ego-sum"><span class="num">${rows.length}</span><p>תיקונים התקבלו היום. הלחץ ירד ב-<b class="num">${drop}</b> hPa.</p></div>
      <ol class="ego-list">${rows.map((r) => `<li><span class="ego-t num">${r.at}</span><span class="ego-chat">${esc(r.chat)}</span><span class="ego-d num" dir="ltr">−${r.from - r.to}</span><span class="ego-code">${esc(r.code)}</span></li>`).join('')}</ol>`
      : '<p class="ego-empty">לא התקבלו תיקונים היום. כל תיקון שתקבלו במקלדת יירשם כאן כירידה בלחץ.</p>';
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  addEventListener('storage', (e) => { if (e.key === 'wheep.egocheck') renderEgo(); });
  renderEgo();

  // the app opens on the WHOOP → WHEEP transition, unless a deep link asks for a specific tab
  const tabHash = tabs.some((t) => `#${t.dataset.tab}` === location.hash);
  if (tabHash) { intro.hidden = true; fromHash(); } else if (location.hash === '#about') openInfo(); else runIntro();
})();
