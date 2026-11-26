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

## 5. The wrapped: one day as a story

This is a wrapped for an app: it reveals the day step by step, so a person can take it in. One 1080×1350 frame, six scenes on a 16 s loop, a progress bar on top like a story, and the person's name in the header (it's theirs).

| Scene | Time | What it tells |
|---|---|---|
| 0 · intro | 0–2.2 s | the name, "זה היום שלך.", the date. Ink ground, the shape small and white |
| 1 · the feeling | 2.2–5.0 | the ground opens into the feeling's colour from the shape. "הרגש שהוביל את היום", then the feeling word (once, as the header) pulled together by letter spacing, and its share of waking hours |
| 2 · what was measured | 5.0–7.8 | the figure (counts up) and its unit, then a 24h line with the events and durations, and a plain caption |
| 3 · outside vs inside | 7.8–10.6 | the scale on the shape's four drawings, the gap, a "now" shape riding with the big shape as it turns inside, one sentence that says what the gap means |
| 4 · the day in feelings | 10.6–13.6 | an ink band: the waking hours as coloured stretches (each feeling's colour and shape), opening left to right, then the top three feelings with their share |
| 5 · the two lines | 13.6–16 | the fact, then what the data adds (they swap weight), signed with the name and date; the ground closes back to ink |

- **The feeling is written once:** the header of scene 1. No repeated depth word.
- **Copy voice:** a tracker talking, dry and specific. State what was measured and when, add one fact the person didn't see. No melodrama, no lessons.
- **Data:** `days.js → DAYS` (the weekly demo, for `DEMO_NAME`), or `gen.js → makeDay({ name, date })` (anyone). The day in feelings comes from `genMix(seed, top)`, and the top feeling always leads it.

## 6. Logo

`wheep` lowercase in Greta Serif VF, plus the shape mark. The mark drifts through all seven feelings (fractional n), and each letter's weight follows the mark's k with a per-letter delay. It never holds one form. A static use is a frozen frame. See `logo.html`.

## 7. Motion: shapes flow, type snaps, Greta breathes, the story loops

- **The shape leads, the text follows.** The shape has a place and size per scene (`story-core.js → S_K`) and starts moving 0.75 s *before* each scene (smootherstep), so the words arrive on a settled shape. Two bands trail it by 0.15 s and 0.3 s. Its quality follows the story: soft in the intro, the day's outside in scenes 1–2, easing inside in scene 3 (1.5 s), soft again at the end. It turns continuously (whole teeth per loop) and breathes ±2%.
- **Greta breathes:** every Greta line oscillates in weight around its base (±10–22, a 4 s period, a different phase per line), so the reading type is never still. The intro name grows from hairline to bold first, and the two closing lines swap weight at 14.4 s.
- **Secolo snaps:** it cuts between 19–22 every 0.4 s on the feeling word, the figure and the shares. The feeling word starts with wide letter spacing and pulls tight.
- **Text enters fast and leaves faster:** in over 0.45 s (quartic ease-out, rising 28 px), out over 0.25 s (ease-in).
- **Data reveals:** the figure counts up, events stamp onto the 24h line, durations wipe in, the day in feelings opens left to right, and the top three arrive 0.25 s apart.
- **Pace:** 2.4–3 s per scene. Every period divides 16 s, so the loop closes.
- **Reduced motion:** the story holds on scene 4 (the day in feelings).

## 7b. Text rules

- **Every block on its own line.** Titles, figures and captions never share a baseline with something that can grow (the gap sits under its title, not beside it).
- **Fit and wrap at the heaviest weight.** Greta breathes up to wght 100, so text is measured at 100. Names and units shrink to fit their width; sentences wrap to their column (web: measured tspans; AE: paragraph text boxes).
- **Contrast:** ink on the feeling, white on ink. Ink text never sits on the dark band: the shape's places are chosen so the outer band clears the header, the titles and the column while their scene is up (checked frame by frame). The "now" mark is ink, because white disappears on the light feelings.

## 8. Files

- `story.js`: the story engine, `createStory(svg, day)` → `draw(seconds)`.
- `gen.js`: `makeDay({ name, date, top? })`, deterministic per name and date (so a rescan gives the same day), plus `sensorId(name)`.
- `wrapped.html`: the week as seven stories (`?day=N` for one, `?t=12` to freeze a moment).
- **Live:**
  - `live.html` is the exhibition screen: a QR code pointing at this deployment's own `me.html`, and generated visitors' stories playing next to it (`?names=a,b,c` sets who appears).
  - `me.html` is the visitor's phone. They type a name, the page "detects" a WHEEP sensor (a stable id per name), syncs, and plays their story. It needs no server, so it runs as-is on GitHub Pages, and `?name=` links straight to someone's story.
- `story-core.js`: the story's timeline (scene times, the shape's places and states, Greta breathing), in ES5, shared by the web and pasted into every After Effects expression.
- **After Effects:** `ae/wheep-wrapped.aep`, one comp per story (`STORY NN · …`) plus `ALL · N stories`. Each story has a CONTROLS null (k out, k in, points, five colours), and every text layer is editable. Source Text expressions handle the Secolo cuts, Greta breathing, the count-up and letter spacing (`setFont` / `setText` / `setTracking`).
  - Week: `node ae/make.js`. Any people: `node ae/make.js --names "נועה,אבי"` (generated like the live page). Then run `ae/build.jsx` in AE (File › Scripts › Run Script File).
  - Export: `zsh ae/render.sh` writes `export/wheep-story-NN.mp4` and `.gif` (16 s loops).
- Known AE 27 quirks: ExtendScript groups unparenthesised nested ternaries wrongly (`a ? x : b ? y : z`), so always parenthesise; shape-layer groups draw first-on-top; aerender and ffmpeg read stdin (redirect it in loops); reading `fontObject.designVector` from a script crashes the script engine; the `ADBE Text VF Axis` animator can't be added from a script; in RTL paragraphs, justification is mirrored; a time range written with a dash reverses in a Hebrew line, so labels use "עד".
