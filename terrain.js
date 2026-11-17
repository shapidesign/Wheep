// WHEEP emotional terrain: a heightfield drawn as stacked 3D contour rings.
// Mountains = internalised anger and suppression, hills = empathy, rivers = crying.
// ponytail: hand-rolled canvas projection, no WebGL/three.js, so it runs offline on a classroom laptop.

const N = 72;                 // grid resolution
const LEVELS = 15;            // contour bands
const RAMP = ['#16C7B9', '#2FA8F0', '#5B7CF7', '#8C63F2', '#C257D6', '#F06A8E', '#FF9A4A', '#FFD36E'];

// Day index 0 = Thu 3.12 (last cry). 12 = today, Tue 15.12. 13–15 = forecast to Fri 18.12.
const DAYS = [
  'ה׳ 3.12', 'ו׳ 4.12', 'ש׳ 5.12', 'א׳ 6.12', 'ב׳ 7.12', 'ג׳ 8.12', 'ד׳ 9.12',
  'ה׳ 10.12', 'ו׳ 11.12', 'ש׳ 12.12', 'א׳ 13.12', 'ב׳ 14.12', 'היום', 'ד׳ 16.12', 'ה׳ 17.12', 'ו׳ 18.12',
];
const TODAY = 12;

// Per-day amplitudes (sampled, linearly interpolated between days).
const curve = (pts) => (d) => {
  const i = Math.max(0, Math.min(pts.length - 1, d));
  const a = Math.floor(i), b = Math.min(pts.length - 1, a + 1);
  return pts[a] + (pts[b] - pts[a]) * (i - a);
};
const ridgeAmp  = curve([.34, .38, .42, .47, .52, .58, .63, .68, .72, .77, .82, .86, .9, .92, .94, .55]);
const angerAmp  = curve([.42, .44, .45, .5, .62, .64, .66, .67, .68, .7, .78, .76, .75, .76, .77, .6]);
const empathyAmp= curve([.34, .33, .33, .32, .32, .31, .31, .3, .3, .3, .29, .29, .29, .29, .3, .34]);
const riverFlow = curve([1, .72, .5, .36, .27, .21, .17, .14, .12, .1, .09, .08, .07, .07, .08, .62]);

// The river runs west → east through the low ground between the ridge (back) and the empathy hills (front).
const RIVER = [[-.96, .12], [-.62, .22], [-.3, .18], [-.02, .26], [.28, .2], [.6, .26], [.96, .16]];

const FEATURES = [
  { id: 'ridge',   name: 'רכס ההדחקה',          kind: 'הר',  at: [.3, -.36] },
  { id: 'anger',   name: 'פסגת הכעס המופנם',    kind: 'פסגה', at: [-.55, -.18] },
  { id: 'empathy', name: 'גבעות האמפתיה',       kind: 'גבעות', at: [-.05, .66] },
  { id: 'river',   name: 'נחל השחרור',          kind: 'נחל', at: [-.3, .18] },
];

function gauss(x, y, cx, cy, sx, sy, rot = 0) {
  const dx = x - cx, dy = y - cy;
  const c = Math.cos(rot), s = Math.sin(rot);
  const u = dx * c + dy * s, v = -dx * s + dy * c;
  return Math.exp(-(u * u) / (2 * sx * sx) - (v * v) / (2 * sy * sy));
}

function distToRiver(x, y) {
  let best = 9;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1];
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    const px = ax + vx * t - x, py = ay + vy * t - y;
    best = Math.min(best, Math.hypot(px, py));
  }
  return best;
}

function heightAt(x, y, d) {
  let h = .05 + .035 * Math.sin(x * 5.1 + 1.3) * Math.cos(y * 4.3 - .4) + .02 * Math.sin((x + y) * 9);
  h += ridgeAmp(d) * gauss(x, y, .3, -.36, .46, .17, .35);
  h += angerAmp(d) * gauss(x, y, -.55, -.18, .12, .12);
  const e = empathyAmp(d);
  h += e * gauss(x, y, -.45, .62, .19, .17) + e * .95 * gauss(x, y, -.05, .7, .18, .16) + e * .85 * gauss(x, y, .4, .64, .17, .16);
  // the valley stays cut even when dry; flow only deepens it
  h += .1 * Math.exp(-((y - .2) ** 2) / (2 * .3 * .3));          // gentle shoulders on both banks
  const r = riverFlow(d);
  h -= (.17 + .1 * r) * Math.exp(-(distToRiver(x, y) ** 2) / (2 * .075 * .075));
  return Math.max(0, h);
}

const flowAt = riverFlow;
const amps = { ridge: ridgeAmp, anger: angerAmp, empathy: empathyAmp, river: riverFlow };

// Marching squares over the grid for one iso level; returns segments in grid space [x1,y1,x2,y2].
function isoSegments(H, level) {
  const segs = [];
  const lerp = (a, b) => (level - a) / (b - a);
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i + 1], dd = H[(j + 1) * N + i];
      const idx = (a > level) | ((b > level) << 1) | ((c > level) << 2) | ((dd > level) << 3);
      if (idx === 0 || idx === 15) continue;
      const top = [i + lerp(a, b), j], right = [i + 1, j + lerp(b, c)];
      const bottom = [i + lerp(dd, c), j + 1], left = [i, j + lerp(a, dd)];
      const add = (p, q) => segs.push(p[0], p[1], q[0], q[1]);
      switch (idx) {
        case 1: case 14: add(left, top); break;
        case 2: case 13: add(top, right); break;
        case 3: case 12: add(left, right); break;
        case 4: case 11: add(right, bottom); break;
        case 6: case 9: add(top, bottom); break;
        case 7: case 8: add(left, bottom); break;
        case 5: add(left, top); add(right, bottom); break;
        case 10: add(top, right); add(left, bottom); break;
      }
    }
  }
  return segs;
}

class Terrain {
  constructor(canvas, { labels = null, onSelect = null, interactive = true, autoSpin = false, cy = .58 } = {}) {
    this.cy = cy;
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.labels = labels;            // container for HTML labels
    this.onSelect = onSelect;
    this.day = TODAY;
    this.yaw = -.62;
    this.tilt = .5;
    this.selected = null;
    this.autoSpin = autoSpin && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.phase = 0;
    this.cache = new Map();
    this.labelEls = new Map();
    if (labels) this.buildLabels();
    if (interactive) this.bindPointer();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dirty = true;
  }

  setDay(d) { this.day = d; this.dirty = true; }
  select(id) { this.selected = id; this.dirty = true; this.labelEls.forEach((el, k) => el.classList.toggle('is-on', k === id)); }

  field(d) {
    const key = Math.round(d * 20) / 20;
    if (this.cache.has(key)) return this.cache.get(key);
    const H = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      H[j * N + i] = heightAt(i / (N - 1) * 2 - 1, j / (N - 1) * 2 - 1, key);
    }
    const bands = [];
    for (let l = 1; l <= LEVELS; l++) {
      const level = l / LEVELS * 1.0;
      bands.push({ level, segs: isoSegments(H, level) });
    }
    const out = { H, bands };
    if (this.cache.size > 80) this.cache.clear();
    this.cache.set(key, out);
    return out;
  }

  project(x, y, z) {
    const s = Math.min(this.w, this.h * 1.25) * .5;
    const c = Math.cos(this.yaw), sn = Math.sin(this.yaw);
    const xr = x * c - y * sn, yr = x * sn + y * c;
    return [this.w / 2 + xr * s, this.h * this.cy + yr * s * this.tilt - z * s * .62, yr];
  }

  bindPointer() {
    let down = null, moved = 0;
    this.c.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY, this.yaw, this.tilt]; moved = 0; this.c.setPointerCapture(e.pointerId); });
    this.c.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down[0], dy = e.clientY - down[1];
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      this.yaw = down[2] + dx * .008;
      this.tilt = Math.max(.25, Math.min(.85, down[3] + dy * .003));
      this.dirty = true;
    });
    const up = (e) => {
      if (down && moved < 6) this.hit(e);
      down = null;
    };
    this.c.addEventListener('pointerup', up);
    this.c.addEventListener('pointercancel', () => { down = null; });
  }

  anchor(f) {
    const [x, y] = f.at;
    return this.project(x, y, heightAt(x, y, this.day) + (f.id === 'river' ? .02 : .06));
  }

  hit(e) {
    const r = this.c.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bd = 40;
    for (const f of FEATURES) {
      const [ax, ay] = this.anchor(f);
      const d = Math.hypot(ax - px, ay - py);
      if (d < bd) { bd = d; best = f.id; }
    }
    if (this.onSelect) this.onSelect(best);
  }

  buildLabels() {
    for (const f of FEATURES) {
      const b = document.createElement('button');
      b.className = 'terrain-label';
      b.type = 'button';
      b.dataset.kind = f.id;
      b.innerHTML = `<span class="pin" aria-hidden="true"></span><span>${f.name}</span>`;
      b.addEventListener('click', () => this.onSelect && this.onSelect(f.id));
      this.labels.appendChild(b);
      this.labelEls.set(f.id, b);
    }
  }

  loop(t) {
    if (this.autoSpin && !this.paused) { this.yaw += .0016; this.dirty = true; }
    if (!this.reduced) { this.phase = t / 1000; this.dirty = true; }
    if (this.dirty && this.c.offsetParent !== null) { this.draw(); this.dirty = false; }
    requestAnimationFrame(this.loop);
  }

  draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    const { bands } = this.field(this.day);
    const g = 2 / (N - 1);

    // base plane: a faint lat/long grid at sea level
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(150,170,255,.13)';
    for (let k = -1; k <= 1.001; k += .25) {
      ctx.beginPath();
      let p = this.project(k, -1, 0); ctx.moveTo(p[0], p[1]);
      p = this.project(k, 1, 0); ctx.lineTo(p[0], p[1]);
      p = this.project(-1, k, 0); ctx.moveTo(p[0], p[1]);
      p = this.project(1, k, 0); ctx.lineTo(p[0], p[1]);
      ctx.stroke();
    }

    const dim = this.selected && this.selected !== 'river';
    // the future is uncertain: forecast days draw broken, fainter contours
    const unsure = Math.max(0, Math.min(1, (this.day - TODAY) / 1.5));
    ctx.globalCompositeOperation = 'lighter';
    ctx.setLineDash(unsure > .05 ? [5, 1 + 2.5 * unsure] : []);
    bands.forEach(({ level, segs }, bi) => {
      const t = bi / (bands.length - 1);
      const col = RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))];
      ctx.strokeStyle = col;
      ctx.globalAlpha = (dim ? .35 : .55 + t * .4) * (1 - unsure * .12);
      ctx.lineWidth = bi % 5 === 4 ? 1.8 : 1.05;
      ctx.beginPath();
      for (let s = 0; s < segs.length; s += 4) {
        const a = this.project(segs[s] * g - 1, segs[s + 1] * g - 1, level);
        const b = this.project(segs[s + 2] * g - 1, segs[s + 3] * g - 1, level);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
    });

    ctx.setLineDash([]);

    // highlight the selected landform's rings
    if (this.selected && this.selected !== 'river') {
      const f = FEATURES.find((x) => x.id === this.selected);
      ctx.globalAlpha = 1;
      bands.forEach(({ level, segs }) => {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let s = 0; s < segs.length; s += 4) {
          const x = segs[s] * g - 1, y = segs[s + 1] * g - 1;
          if (Math.hypot(x - f.at[0], y - f.at[1]) > (f.id === 'ridge' ? .55 : .32)) continue;
          const a = this.project(x, y, level), b = this.project(segs[s + 2] * g - 1, segs[s + 3] * g - 1, level);
          ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();
      });
    }

    // the river: width and brightness follow the flow; forecast days draw dashed
    const flow = flowAt(this.day);
    const forecast = this.day > TODAY + .01;
    const pts = [];
    for (let i = 0; i < RIVER.length - 1; i++) {
      for (let k = 0; k < 12; k++) {
        const t = k / 12;
        const x = RIVER[i][0] + (RIVER[i + 1][0] - RIVER[i][0]) * t;
        const y = RIVER[i][1] + (RIVER[i + 1][1] - RIVER[i][1]) * t;
        pts.push(this.project(x, y, heightAt(x, y, this.day) + .012));
      }
    }
    const dimRiver = this.selected && this.selected !== 'river';
    const trace = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // the bed: always a continuous channel, so a dry river still reads as a river
    ctx.globalAlpha = dimRiver ? .2 : .42;
    ctx.strokeStyle = '#2E8FA8';
    ctx.lineWidth = 5;
    trace();
    ctx.globalAlpha = dimRiver ? .4 : 1;
    ctx.strokeStyle = '#6CF4FF';
    ctx.lineWidth = 1.4 + flow * 6;
    ctx.setLineDash(forecast ? [6, 7] : flow < .15 ? [2, 6] : [14, 6]);
    ctx.lineDashOffset = this.reduced ? 0 : -this.phase * 26 * Math.max(.15, flow);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (this.labels) {
      // place labels at their anchors, then push overlapping ones apart vertically
      const placed = FEATURES.map((f) => {
        const [x, y] = this.anchor(f);
        const el = this.labelEls.get(f.id);
        return { el, x, y, w: (el.lastElementChild.offsetWidth || 90) + 8, dy: 0 };
      }).sort((a, b) => b.y - a.y);          // bottom-most first; labels above it climb out of the way
      for (let i = 0; i < placed.length; i++) {
        for (let j = 0; j < i; j++) {
          const lower = placed[j], upper = placed[i];
          if (Math.abs(lower.x - upper.x) >= (lower.w + upper.w) / 2) continue;
          const gap = (lower.y - lower.dy) - (upper.y - upper.dy);
          if (gap < 28) upper.dy += 28 - gap;
        }
      }
      placed.forEach((p) => {
        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        p.el.querySelector('.pin').style.height = `${14 + p.dy}px`;
        p.el.style.marginTop = `${-46 - p.dy}px`;
      });
    }
  }
}
