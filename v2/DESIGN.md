---
name: WHEEP v2
description: A tracker for what a man feels, told in variable shapes and a variable serif. Nothing in the system holds one form.
colors:
  ink: "#16130F"
  white: "#FFFFFF"
  ground: "#16130F"       # documentation and app surfaces are dark, like the app (= ink)
  panel: "#24211C"        # cards, tiles, shape cells on the dark ground
  fear: "#C8FF3D"
  joy: "#FFD23F"
  tears: "#3FC8F5"
  release: "#3DDC97"
  shame: "#FF9F1C"
  anger: "#FF5A36"
  holding-in: "#9B6BFF"
  sadness: "#3D6BFF"
typography:
  family: "Greta Serif VF (Latin + Hebrew, one family for everything)"
  axes: { wght: "0–100", wdth: "0–100 (default 100)", OPTI: "0–100 (default 100)" }
  italic: "Greta Serif Italic VF, accents only"
shape:
  source: shape.js → shapePath(n, k)
  n: "points per feeling, from 3"
  k: "0 bouba … 1 kiki"
---

# WHEEP v2 · design system

Replaces the v1 system in `../../DESIGN.md` (dark weather app, the drop, Leon/Hammer). After the critique: out of the corporate world, no drop, one shape language, a serif with a human hand, and form that changes in order to say something.

## 1. Principle: the form is the message

Every element has a resting form and a pressure form. What's shown outside is soft and heavy; what's held inside is sharp and thin. The system never shows one state alone: it moves between **out** and **in**, and the movement is the content.

## 1b. Surfaces: dark, like the app

The system lives on a dark ground (`#16130F`, the same ink the posters use), with white type and `#24211C` panels for cards and tiles. Feeling colours are the only bright things. Posters keep their own five tones. Figma variables: `color/ink`, `color/white`, `color/panel`.

## 2. Shapes

One generator, `shape.js`: `shapePath(n, k, r, cx, cy, rot)`.

| Feeling | n | colour |
|---|---|---|
| פחד fear | 3 | `#C8FF3D` |
| הנאה joy | 4 | `#FFD23F` |
| בכי tears | 5 | `#3FC8F5` |
| שחרור release | 6 | `#3DDC97` |
| בושה shame | 7 | `#FF9F1C` |
| כעס anger | 8 | `#FF5A36` |
| הדחקה holding in | 9 | `#9B6BFF` |

- **Fill only, never a stroke.** A shape is a solid area of colour: no outline, no stroked version, at any size. (In Figma, new vectors get a default stroke: remove it.)
- **k** moves through four drawn keyframes: clover (0), soft square (.34), rounded star (.67), needle star (1). Never draw a shape by hand. Pick n and k.
- **One big shape per poster.** The feeling's shape carries the day: soft outside, its true quality inside. Small shapes appear only as data (one mark per event), never as decoration or a swarm.
- n can go fractional for transitions only (the logo melting between feelings). Content always uses a whole n.

## 3. Type: Secolo + Greta Serif VF

- **Secolo** (Michal Sahar, Hebrew) is the display voice, and only in its four regular cuts: **Secolo 19, 20, 21, 22**. No weights. Its motion is the cut: the number and the feeling word jump to the next cut on every beat.
- **Greta Serif VF** (Typotheque, wght 0–100) is for reading and for the logo: the day sentence, the units, the 24h line, the info line and the lowercase `wheep` wordmark.
- **Weight carries the meaning:** heavy is what's shown, hairline is what's hidden. The two lines of the day sentence swap weight when the poster goes from out to in.
- Figma: text styles `Display/*`, `Text/*`, `Logo/Wordmark` and `Doc/*` in the file wheep-shapes. Their family is a stand-in, because the Figma connection used to build them can't load local fonts. Swap each style to its real font (named in the style description) in the Figma app.

## 4. Colour: one feeling, five tones

Each poster takes its feeling's colour and builds five tones from it (`days.js → palette()`): **m** the feeling (the ground), **a** a light tint (55% toward white), **b** a dark shade (50% toward ink), **k** ink `#16130F`, and **w** white. The feeling's colour covers the poster, so the feeling reads first. Ink carries the type; white appears only where type crosses the shape.

## 5. Composition: a daily infographic

This is a wrapped for an app, so every element states a fact: how much, when, and what it was really. Inspired by Spotify Wrapped 2025 (concentric stripes, type laid over pattern), not copied from it.

| Layer (back → front) | What it is |
|---|---|
| ground | the feeling colour |
| depth word | the feeling word in Secolo, huge, turned on its side, light tint, behind the figure |
| bands | the shape itself repeated concentric (×1.5 dark, ×1.25 light): the pattern, made of the brand shape |
| shape | the one big shape, bleeding off one edge (sides alternate day by day) |
| figure | the number in Secolo + its unit in Greta, on the clear side, ink; white where it crosses the shape |
| 24h line | the day as a timeline: hours 00–24, durations as bars, events as small shapes at the hour they happened, and the time that matters above it |
| sentence | two lines in Greta, shown / hidden |
| info | day + date, the `wheep` mark, the out/in tag |

- **The marks are the data.** 3 shouts = 3 marks at 08:10, 08:40, 18:20. 11 laughs = 11 marks: 9 round, 2 spiky ("for the boss"), and the spikes show only once the poster turns inside.
- The data lives in `days.js → DAYS` (`num`, `count`, `unit`, `marks`, `spans`, `label`).

## 6. Logo

`wheep` lowercase in Greta Serif VF, plus the shape mark. The mark drifts through all seven feelings (fractional n), and each letter's weight follows the mark's k with a per-letter delay. It never holds one form. A static use is a frozen frame. See `logo.html`.

## 7. Motion: snap, hold, loop

All motion comes from one clock, `motion.js`, used unchanged by the web posters and pasted into every After Effects expression.

- **Loop:** 4.8 s = 12 beats of 0.4 s (144 frames at 30 fps). Every value is a function of the time inside the loop, so the last frame runs into the first. No restart cut.
- **Snap, don't flow:** a change happens in the first ~110 ms of its beat (quartic ease-out) and then holds. Exits are faster than entrances (ease-in, ~120 ms).
- **The loop's story:**
  - beats 0–5 **out:** the marks stamp onto the 24h line one by one, and on count days the number counts up with them.
  - beat 6 **the focal moment:** the shape cuts from what he showed to what was inside, with a small hit, and the sentence swaps weight.
  - beat 11 **the clear:** the marks pop off in reverse and the bars wipe out, so the poster is back where it started.
- **Supporting motion:** the shape clicks round one tooth (π/n) per beat, the bands counter-rotate, the number and depth word cut between Secolo 19–22 each beat, and the depth word jumps vertically every two beats.
- **Reduced motion:** the poster holds on beat 8 (everything on the line, the inside showing).

## 8. Daily wrapped: files

- Web: `wrapped.html` (`?day=N` for one poster, `?t=1.2` to freeze a moment).
- After Effects: `ae/wheep-wrapped.aep`, built by `node ae/make.js` → `ae/build.jsx` (File › Scripts › Run Script File).
- Each poster comp has a **CONTROLS** null: `k out`, `k in`, `points`, and five colours (`feeling`, `light`, `dark`, `ink`, `white`). Every layer is live: edit the words in the text layers, or the data in `days.js` and rebuild.
- Export: `zsh ae/render.sh` renders every loop and writes `export/wheep-wrapped-NN.mp4` and `.gif` (540 px, loops forever), plus `export/wheep-wrapped-week.mp4` (each poster twice).
- Known AE 27 quirks: reading `fontObject.designVector` from a script crashes the script engine; the `ADBE Text VF Axis` animator can't be added from a script; in RTL paragraphs, justification is mirrored; a time range written with a dash reverses in a Hebrew line, so labels use "עד".
