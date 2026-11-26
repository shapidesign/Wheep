/* WHEEP motion: snap, hold, snap. One loop of LOOP seconds, cut into BEATS.
   Every value is a function of T = time mod LOOP, built from cyclic sequences, so the last frame runs straight into the first.
   ES5 on purpose: ae/make.js pastes this file into After Effects expressions unchanged. */
var LOOP = 4.8, BEATS = 12, BEAT = LOOP / BEATS;

function mT(time) { return ((time % LOOP) + LOOP) % LOOP; }
function mHash(a, b, c) { var x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); }
// the snap: the move happens in the first 28% of a beat (quartic out), then it holds
function mEase(u) { u = Math.min(1, Math.max(0, u / .28)); return 1 - Math.pow(1 - u, 4); }
// which event we are in, which one came before, and how far the snap is (every = beats per event, off = stagger in beats)
function mBeat(T, every, off) {
  var n = BEATS / every, x = (T / BEAT - (off || 0)) / every, i = Math.floor(x);
  return { i: ((i % n) + n) % n, p: (((i - 1) % n) + n) % n, e: mEase(x - i), n: n };
}
// a cyclic random sequence between lo and hi, snapping to a new value every `every` beats
function mSeq(T, seed, id, lo, hi, every, off) {
  var s = mBeat(T, every || 1, off), a = mHash(seed, id, s.p), b = mHash(seed, id, s.i);
  return lo + (hi - lo) * (a + (b - a) * s.e);
}
// the same, but only landing on values from a list
function mPick(T, seed, id, arr, every, off) {
  var s = mBeat(T, every || 1, off);
  var a = arr[Math.floor(mHash(seed, id, s.p) * arr.length)], b = arr[Math.floor(mHash(seed, id, s.i) * arr.length)];
  return a + (b - a) * s.e;
}
// out (first half of the loop) → in (second half): a hard switch with one snap
function mPhase(T) {
  var b = Math.floor(T / BEAT), u = T / BEAT - b, h = BEATS / 2;
  if (b === 0) return 1 - mEase(u);
  if (b === h) return mEase(u);
  return b < h ? 0 : 1;
}
// rotation that clicks one tooth (π/n) per beat; 12 clicks = whole teeth, so the loop closes
function mRot(T, n, dir) { var b = Math.floor(T / BEAT); return dir * (b + mEase(T / BEAT - b)) * Math.PI / n; }
// a box inverts its colours on a few beats
function mFlip(T, seed, j) { return mHash(seed, j + 50, Math.floor(T / BEAT)) < .16; }
// circle packing in a disc of radius R (best of 60 tries each time, so big circles first, then the gaps fill)
function mPack(seed, R, count) {
  var out = [];
  for (var a = 0; a < count; a++) {
    var best = null;
    for (var s = 0; s < 60; s++) {
      var ang = mHash(seed, a, s * 2) * 2 * Math.PI, d = Math.sqrt(mHash(seed, a, s * 2 + 1)) * R;
      var x = Math.cos(ang) * d, y = Math.sin(ang) * d, r = Math.min(R - d, R * .45);   // no single circle takes over
      for (var i = 0; i < out.length; i++) r = Math.min(r, Math.sqrt((x - out[i].x) * (x - out[i].x) + (y - out[i].y) * (y - out[i].y)) - out[i].r);
      if (!best || r > best.r) best = { x: x, y: y, r: r };
    }
    if (best.r < R * .035) break;
    out.push(best);
  }
  return out;
}
// a mark's life in the loop: stamps in at `at` (fast ease-out), pops out at `out` (faster ease-in), gone before the loop ends
function mPop(T, at, out) {
  if (T < at) return 0;
  var a = mEase((T - at) / BEAT);
  if (T < out) return a;
  var u = Math.min(1, (T - out) / (BEAT * .3));
  return a * (1 - u * u);
}
// when mark i of n stamps in (spread over beats 1–5) and pops out (beat 11, last mark first)
function mStampAt(i, n) { return BEAT * (1 + i * Math.min(1, 4 / Math.max(1, n - 1))); }
function mClearAt(i, n) { return BEAT * (11 + (n - 1 - i) / Math.max(1, n) * .55); }
// how many marks are on the line right now (the counter follows the marks)
function mCount(T, n) { var c = 0; for (var i = 0; i < n; i++) if (mPop(T, mStampAt(i, n), mClearAt(i, n)) > .5) c++; return c; }
// a hit: jumps on the beat `beat` and settles back within it
function mHit(T, beat) { var u = T / BEAT - beat; return u >= 0 && u < 1 ? 1 - mEase(u) : 0; }
// SHAPES flow, type snaps. 0 = out, 1 = in: hold out (beats 0–4), rise (4–7), hold in (7–10), return (10–12).
// smootherstep has zero slope at both ends, so the holds and the loop seam never jerk. lag (in beats) lets layers trail.
function mSmooth(u) { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (u * 6 - 15) + 10); }
function mState(T, lag) {
  var x = mT(T - (lag || 0) * BEAT) / BEAT;
  if (x < 4) return 0;
  if (x < 7) return mSmooth((x - 4) / 3);
  if (x < 10) return 1;
  return 1 - mSmooth((x - 10) / 2);
}
// continuous rotation: whole teeth per loop, so it closes
function mSpin(T, n, dir, teeth) { return dir * (teeth || 1) * (2 * Math.PI / n) * mT(T) / LOOP; }
// a slow breath, twice per loop
function mBreath(T, amt) { return 1 + amt * Math.sin(4 * Math.PI * mT(T) / LOOP); }
// the four drawn keyframes of the shape (clover, soft square, rounded star, needle)
var M_KEYS = [0, .34, .67, 1];

if (typeof module !== 'undefined') module.exports = { LOOP: LOOP, BEATS: BEATS, BEAT: BEAT, mT: mT, mHash: mHash, mEase: mEase, mBeat: mBeat, mSeq: mSeq, mPick: mPick, mPhase: mPhase, mRot: mRot, mFlip: mFlip, mPack: mPack, mPop: mPop, mStampAt: mStampAt, mClearAt: mClearAt, mCount: mCount, mHit: mHit, mSmooth: mSmooth, mState: mState, mSpin: mSpin, mBreath: mBreath, M_KEYS: M_KEYS };
