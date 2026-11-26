/* WHEEP · the story's timeline, shared by story.js (web) and the After Effects build (pasted into expressions).
   ES5 on purpose. One day, ten stories, then it loops. Change S_PACE to slow everything down or speed it up together. */
var S_PACE = 2.8;                                                       // scales every story's hold together (S_HOLD is set at 2.8)
// ten stories, each held this many seconds (at S_PACE 2.8): intro, words, guess, minutes, chapters, top 5, portrait, type, friends, share
var S_HOLD = [6, 7, 8.5, 7, 7.5, 8, 8.5, 8.5, 8, 9.5];
var SCENES = [0];
for (var sh_ = 0; sh_ < S_HOLD.length; sh_++) SCENES.push(SCENES[sh_] + S_HOLD[sh_] / 2.8);
var STORY_DUR = SCENES[SCENES.length - 1] * S_PACE, S_BEAT = .4 * S_PACE;
for (var si_ = 0; si_ < SCENES.length; si_++) SCENES[si_] *= S_PACE;
// a moment inside scene i, dt seconds (at pace 1) after it starts
function sAt(i, dt) { return SCENES[i] + dt * S_PACE; }

function sClamp(x) { return Math.max(0, Math.min(1, x)); }
function sOut(u) { return 1 - Math.pow(1 - sClamp(u), 4); }                              // arrivals
function sIn(u) { u = sClamp(u); return u * u; }                                         // exits (faster)
function sFlow(u) { u = sClamp(u); return u * u * u * (u * (u * 6 - 15) + 10); }        // shapes
function sBack(u) { u = sClamp(u); var c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }   // a small overshoot for pops
function sLerp(a, b, t) { return a + (b - a) * t; }
function sWrap(T) { return ((T % STORY_DUR) + STORY_DUR) % STORY_DUR; }
// an element's presence: in over inD from a, out over outD before b (pace-scaled)
function sEnv(T, a, b, inD, outD) { inD = (inD || .45) * S_PACE; outD = (outD || .25) * S_PACE; return Math.min(sOut((T - a) / inD), 1 - sIn((T - (b - outD)) / outD)); }
function sScene(T, i) { return sEnv(T, SCENES[i], SCENES[i + 1]); }
// build-up: element `d` (in pace-1 seconds) after its scene starts, gone with the scene
function sBuild(T, i, d) { return sEnv(T, sAt(i, d || 0), SCENES[i + 1]); }

// the shape's place in each scene [x, y, r], one path per layout; it moves there and its quality follows the story
// placed so the outer band (×1.32) never runs under the header, the scene titles or the text of that layout
var S_KS = [
  [[540, 620, 130], [540, 600, 240], [910, 590, 225], [1050, 660, 340], [960, 340, 100], [540, 500, 240], [540, 620, 130]],   // A · line
  [[540, 520, 170], [150, 760, 300], [150, 260, 80], [130, 250, 70], [540, 250, 85], [540, 1180, 300], [540, 520, 170]],    // B · dial
  [[540, 780, 160], [540, 930, 250], [220, 420, 130], [260, 700, 230], [800, 300, 110], [540, 380, 170], [540, 780, 160]]   // C · grid
];
var S_K = S_KS[0];
var S_LEAD = .75 * S_PACE, S_TRAIL = [.15 * S_PACE, .3 * S_PACE];   // the shape leads each scene; the bands trail it
function sHero(T, kOut, kIn, v) {
  var S_K = S_KS[v || 0];
  T = sWrap(T);
  var i = 0; while (i < SCENES.length - 2 && T + S_LEAD >= SCENES[i + 1]) i++;
  var move = sFlow((T + S_LEAD - SCENES[i]) / (.75 * S_PACE)), x, y, r;
  if (i === 0) { x = S_K[0][0]; y = S_K[0][1]; r = S_K[0][2]; }
  else { x = sLerp(S_K[i - 1][0], S_K[i][0], move); y = sLerp(S_K[i - 1][1], S_K[i][1], move); r = sLerp(S_K[i - 1][2], S_K[i][2], move); }
  var back = sFlow((T - sAt(6, -.9)) / (.9 * S_PACE));
  if (i === 5) { x = sLerp(x, S_K[6][0], back); y = sLerp(y, S_K[6][1], back); r = sLerp(r, S_K[6][2], back); }
  var k = .34;
  if (T >= sAt(1, 0)) k = sLerp(.34, kOut, sFlow((T - sAt(1, 0)) / (.9 * S_PACE)));
  if (T >= sAt(3, .5)) k = sLerp(kOut, kIn, sFlow((T - sAt(3, .5)) / (1.5 * S_PACE)));   // scene 3: what was inside
  if (T >= sAt(6, -.9)) k = sLerp(kIn, .34, back);
  return [x, y, r, k];
}
// the ground opens into the feeling's colour on scene 1 and closes at the end
function sOpen(T) { T = sWrap(T); return sFlow((T - sAt(1, -.2)) / (.6 * S_PACE)) * (1 - sFlow((T - sAt(6, -.7)) / (.7 * S_PACE))); }
// continuous turn: two whole teeth per loop, so it closes
function sSpin(T, n) { return (2 * Math.PI / n) * 2 * sWrap(T) / STORY_DUR; }
function sBreath(T) { return 1 + .02 * Math.sin(4 * Math.PI * sWrap(T) / STORY_DUR); }
// Greta breathing for a whole line (period 4 s; 4 divides the loop)
function sGreta(T, base, amp, phase) { return Math.max(0, Math.min(100, base + amp * Math.sin(2 * Math.PI * sWrap(T) / 4 + (phase || 0)))); }
// Greta on all three axes for a whole line: [wght, wdth, OPTI]; wdth only narrows from 100
function sGretaAxes(T, base, amp, phase) {
  var t = 2 * Math.PI * sWrap(T); phase = phase || 0;
  return [sGreta(T, base, amp, phase), 82 + 18 * (.5 + .5 * Math.sin(t / 8 + phase * 1.3)), 50 + 50 * Math.sin(t / 4 + phase + Math.PI / 2)];
}
// Greta letter by letter, every letter on its own axes, slow enough to read. Every period is the loop divided by a whole number, so it closes at any pace.
//   wght: a slow wave travelling along the line, plus each letter's own drift
//   wdth: each letter narrows and widens at its own pace (70–100)
//   OPTI: a slow swell between thin and fat contrast
// S_GRETA scales it: amp = how much it moves, spread = how differently the letters move (admin.html sets both)
var S_GRETA = { amp: 1, spread: 1 };
function sHash(a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }
function sLetter(T, i, base, amp, seed) {
  var t = sWrap(T), tau = 2 * Math.PI, A = amp * S_GRETA.amp, sp = S_GRETA.spread;
  var D = STORY_DUR, p1 = D / [3, 4, 5][Math.floor(sHash(i, seed) * 3)], p2 = D / [1, 2, 3][Math.floor(sHash(i + 7, seed) * 3)];
  var w = base + A * .75 * Math.sin(tau * t / (D / 4) - i * .3 * sp + seed) + A * .35 * sp * Math.sin(tau * t / p1 + i * 2.1);
  var wd = 100 - Math.min(30, 30 * S_GRETA.amp * sp) * (.5 + .5 * Math.sin(tau * t / p2 + i * 1.7 * sp + seed));
  var op = 50 + 50 * Math.min(1, S_GRETA.amp) * Math.sin(tau * t / (D / 2) + i * .5 * sp + seed);
  return [sSoft(w), wd, op];
}
// a soft 0–100 limit: near the ends the value eases in instead of sitting flat (a hard clamp held, then jumped)
function sSoft(w) { return w > 85 ? 85 + 15 * Math.tanh((w - 85) / 15) : (w < 15 ? 15 - 15 * Math.tanh((15 - w) / 15) : w); }

if (typeof module !== 'undefined') module.exports = { S_PACE: S_PACE, STORY_DUR: STORY_DUR, SCENES: SCENES, S_BEAT: S_BEAT, S_K: S_K, S_KS: S_KS, S_GRETA: S_GRETA, S_LEAD: S_LEAD, S_TRAIL: S_TRAIL, sAt: sAt, sOut: sOut, sIn: sIn, sFlow: sFlow, sBack: sBack, sEnv: sEnv, sScene: sScene, sBuild: sBuild, sHero: sHero, sOpen: sOpen, sSpin: sSpin, sBreath: sBreath, sGreta: sGreta, sGretaAxes: sGretaAxes, sLetter: sLetter, sSoft: sSoft, sHash: sHash, sWrap: sWrap, sClamp: sClamp, sLerp: sLerp };
