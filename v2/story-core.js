/* WHEEP · the story's timeline, shared by story.js (web) and the After Effects build (pasted into expressions).
   ES5 on purpose. One day, six scenes, 16 s, then it loops. */
var STORY_DUR = 16, S_BEAT = .4;
var SCENES = [0, 2.2, 5.0, 7.8, 10.6, 13.6, 16];

function sClamp(x) { return Math.max(0, Math.min(1, x)); }
function sOut(u) { return 1 - Math.pow(1 - sClamp(u), 4); }                              // arrivals
function sIn(u) { u = sClamp(u); return u * u; }                                         // exits (faster)
function sFlow(u) { u = sClamp(u); return u * u * u * (u * (u * 6 - 15) + 10); }        // shapes
function sLerp(a, b, t) { return a + (b - a) * t; }
function sWrap(T) { return ((T % STORY_DUR) + STORY_DUR) % STORY_DUR; }
// a scene element's presence: in over inD from a, out over outD before b
function sEnv(T, a, b, inD, outD) { inD = inD || .45; outD = outD || .25; return Math.min(sOut((T - a) / inD), 1 - sIn((T - (b - outD)) / outD)); }
function sScene(T, i) { return sEnv(T, SCENES[i], SCENES[i + 1]); }

// the shape's place in each scene [x, y, r]; it moves there over 0.9 s and its quality follows the story
var S_LEAD = .75, S_TRAIL = [.15, .3];   // the bands trail the shape by these (s)
// placed so the outer band (×1.32) never runs under the header, the scene titles or the column text
var S_K = [[540, 620, 130], [540, 600, 240], [910, 590, 225], [1050, 660, 340], [960, 340, 100], [540, 500, 240], [540, 620, 130]];
function sHero(T, kOut, kIn) {
  T = sWrap(T);
  // the shape leads: it starts moving 0.6 s before each scene, so the text arrives on a settled shape
  var i = 0; while (i < SCENES.length - 2 && T + S_LEAD >= SCENES[i + 1]) i++;
  var move = sFlow((T + S_LEAD - SCENES[i]) / .75), x, y, r;
  if (i === 0) { x = S_K[0][0]; y = S_K[0][1]; r = S_K[0][2]; }
  else { x = sLerp(S_K[i - 1][0], S_K[i][0], move); y = sLerp(S_K[i - 1][1], S_K[i][1], move); r = sLerp(S_K[i - 1][2], S_K[i][2], move); }
  if (i === 5) { var back = sFlow((T - 15.1) / .9); x = sLerp(x, S_K[6][0], back); y = sLerp(y, S_K[6][1], back); r = sLerp(r, S_K[6][2], back); }
  var k = .34;
  if (T >= 2.2) k = sLerp(.34, kOut, sFlow((T - 2.2) / .9));
  if (T >= 8.3) k = sLerp(kOut, kIn, sFlow((T - 8.3) / 1.5));      // scene 3: what was inside
  if (T >= 15.1) k = sLerp(kIn, .34, sFlow((T - 15.1) / .9));
  return [x, y, r, k];
}
// the ground opens into the feeling's colour on scene 1 and closes at the end
function sOpen(T) { T = sWrap(T); return sFlow((T - 2.0) / .6) * (1 - sFlow((T - 15.3) / .7)); }
// continuous turn: two whole teeth per loop, so it closes
function sSpin(T, n) { return (2 * Math.PI / n) * 2 * sWrap(T) / STORY_DUR; }
function sBreath(T) { return 1 + .02 * Math.sin(4 * Math.PI * sWrap(T) / STORY_DUR); }
// Greta breathing: a weight that oscillates around base; period 4 s (4 per loop), so it closes too
function sGreta(T, base, amp, phase) { return Math.max(0, Math.min(100, base + amp * Math.sin(2 * Math.PI * sWrap(T) / 4 + (phase || 0)))); }

// Greta on all three axes: weight breathes (4 s), width narrows and returns (8 s), optical size swings (4 s, a quarter out of step).
// wdth only goes down from its default (100), so text measured at full width never overflows. Returns [wght, wdth, OPTI].
function sGretaAxes(T, base, amp, phase) {
  var t = 2 * Math.PI * sWrap(T); phase = phase || 0;
  return [sGreta(T, base, amp, phase), 82 + 18 * (.5 + .5 * Math.sin(t / 8 + phase * 1.3)), 50 + 50 * Math.sin(t / 4 + phase + Math.PI / 2)];
}
if (typeof module !== 'undefined') module.exports = { STORY_DUR: STORY_DUR, SCENES: SCENES, S_BEAT: S_BEAT, S_K: S_K, S_LEAD: S_LEAD, S_TRAIL: S_TRAIL, sOut: sOut, sIn: sIn, sFlow: sFlow, sEnv: sEnv, sScene: sScene, sHero: sHero, sOpen: sOpen, sSpin: sSpin, sBreath: sBreath, sGreta: sGreta, sGretaAxes: sGretaAxes, sWrap: sWrap, sClamp: sClamp, sLerp: sLerp };
