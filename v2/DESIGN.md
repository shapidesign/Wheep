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

This is a wrapped for an app: it reveals the day step by step, so a person can take it in. One 1080×1350 frame, six scenes on a 24 s loop (`S_PACE` 1.5 × the original 16 s, so viewers have time to read), a progress bar on top like a story, and the person's name in the header (it's theirs).

| Scene | Time | What it tells |
|---|---|---|
| 0 · intro | 0–3.3 s | the name, "זה היום שלך.", the date. Ink ground, the shape small and white |
| 1 · the feeling | 3.3–7.5 | the ground opens into the feeling's colour from the shape. "הרגש שהוביל את היום", then the feeling word (once, as the header) pulled together by letter spacing, and its share of waking hours |
| 2 · what was measured | 7.5–11.7 | the figure (counts up) and its unit, then a 24h line with the events and durations, and a plain caption |
| 3 · outside vs inside | 11.7–15.9 | the scale on the shape's four drawings, the gap, a "now" shape riding with the big shape as it turns inside, one sentence that says what the gap means |
| 4 · the day in feelings | 15.9–20.4 | an ink band: the waking hours as coloured stretches (each feeling's colour and shape), opening left to right, then the top three feelings with their share |
| 5 · the two lines | 20.4–24 | the fact, then what the data adds (they swap weight), signed with the name and date; the ground closes back to ink |

- **Three layouts** so the stories don't all move alike (`story.js → LAYOUT`, by feeling; the week reads A B C A B C A). Same six scenes, different composition, shape path and infographics:
  - **A · line:** the shape goes centre → right → bleeds off. A 24h line, a horizontal scale, a strip of the day and bars. Text rises in.
  - **B · dial:** the shape swings big to the left, then waits small in the corner. A 24h clock with the figure inside, the outside and inside shapes side by side, a ring of the day. Text slides in from the right.
  - **C · grid:** the shape sinks low, then climbs. A grid of 24 hours that fill as much as they held, a vertical scale, a waffle of 100 squares (one per percent). Text drops in.
- **The feeling is written once:** the header of scene 1. No repeated depth word.
- **Copy voice:** a tracker talking, dry and specific. State what was measured and when, add one fact the person didn't see. No melodrama, no lessons.
- **Copy:** every word lives in `copy.js` (`COPY.ui` for the scene titles, `COPY.profiles` for the six visitor profiles, `COPY.week` for the demo week). `admin.html` edits it with a live preview, saves to this browser (localStorage, so the kiosk machine picks it up) and exports a new `copy.js` to commit.
- **Data:** `days.js → DAYS` (the weekly demo, for `DEMO_NAME`), or `gen.js → makeDay({ name, date })` (anyone). The day in feelings comes from `genMix(seed, top)`, and the top feeling always leads it.

## 6. Logo

`wheep` lowercase in Greta Serif VF, plus the shape mark. The mark drifts through all seven feelings (fractional n), and each letter's weight follows the mark's k with a per-letter delay. It never holds one form. A static use is a frozen frame. See `logo.html`.

## 7. Motion: shapes flow, type snaps, Greta breathes, the story loops

- **The shape leads, the text follows.** The shape has a place and size per scene (`story-core.js → S_K`) and starts moving 0.75 s *before* each scene (smootherstep), so the words arrive on a settled shape. Two bands trail it by 0.15 s and 0.3 s. Its quality follows the story: soft in the intro, the day's outside in scenes 1–2, easing inside in scene 3 (1.5 s), soft again at the end. It turns continuously (whole teeth per loop) and breathes ±2%.
- **Greta, letter by letter:** every letter moves on all three axes on its own (`story-core.js → sLetter`), slowly enough to read: weight as a slow wave along the line plus each letter's own drift (6–12 s), width 70–100 at each letter's pace, optical size swelling over 12 s. All periods divide 24 s. `S_GRETA` (amount, and how differently the letters move) is set from the admin page. The intro name grows from hairline to bold first; the two closing lines swap weight once the second has written in.
- **Secolo snaps:** it cuts between 19–22 every 0.4 s on the feeling word, the figure and the shares. The feeling word starts with wide letter spacing and pulls tight.
- **Build-up:** inside each scene the elements arrive one after another (`sBuild(T, scene, delay)`: quartic ease-out, rising 28 px), and leave together with the scene (ease-in). The name and the two closing lines write themselves in letter by letter.
- **Data reveals:** the figure counts up, the 24h axis draws, hours arrive, events pop onto it (with a small overshoot), durations wipe in; the scale draws and the gap fills; the ink band rises, the day in feelings opens left to right, and the top three arrive 0.25 s apart.
- **Pace:** 3.3–4.5 s per scene. Change `S_PACE` to slow or speed the whole story; every period divides the loop, so it closes.
- **Reduced motion:** the story holds on scene 4 (the day in feelings).

## 7b. Text rules

- **Every block on its own line.** Titles, figures and captions never share a baseline with something that can grow (the gap sits under its title, not beside it).
- **Fit and wrap at the heaviest weight.** Greta breathes up to wght 100, so text is measured at 100. Names and units shrink to fit their width; sentences wrap to their column (web: measured tspans; AE: paragraph text boxes).
- **No orphans:** wrapped lines are balanced (the narrowest width that keeps the same number of lines), and a last line of one word pulls one more down.
- **Performance:** only scenes on screen are drawn, a letter is restyled only when its rounded axes change, and the week page draws only the stories in view.
- **Contrast:** ink on the feeling, white on ink. Ink text never sits on the dark band: the shape's places are chosen so the outer band clears the header, the titles and the column while their scene is up (checked frame by frame). The "now" mark is ink, because white disappears on the light feelings.

## 8. Files

- `story.js`: the story engine, `createStory(svg, day)` → `draw(seconds)`.
- `gen.js`: `makeDay({ name, date, top? })`, deterministic per name and date (so a rescan gives the same day), plus `sensorId(name)`.
- `wrapped.html`: the week as seven stories (`?day=N` for one, `?t=12` to freeze a moment).
- **Live:**
  - `live.html` is the exhibition screen: a QR code pointing at the published `me.html`, a name field (a visitor types it at the kiosk and their story plays twice, then the rotation resumes), and generated visitors' stories playing next to it. The rotation's men (איתי, יובל, עידו, יהונתן, אבי, ליאור) each have their own profile (`gen.js → MOCK_NAMES`); `?names=a,b,c` overrides who appears. There's no server, so a name typed on a phone stays on that phone.
  - `me.html` is the visitor's phone. They type a name, the page "detects" a WHEEP sensor (a stable id per name), syncs, and plays their story. It needs no server, so it runs as-is on GitHub Pages, and `?name=` links straight to someone's story.
- `copy.js` / `admin.html`: all the words (scene titles, feeling names, profiles, the week) and how the text moves, and the page to edit them.
- The After Effects build still uses layout A and the earlier letter motion; it is updated separately.
- `story-core.js`: the story's timeline (pace, scene times, build-ups, the shape's places and states, per-letter Greta), in ES5, shared by the web and pasted into every After Effects expression.
- **After Effects:** `ae/wheep-wrapped.aep`, one comp per story (`STORY NN · …`) plus `ALL · N stories`. Each story has a CONTROLS null (k out, k in, points, five colours), and every text layer is editable. Source Text expressions handle the Secolo cuts, per-letter Greta (`setFont(…, i, 1)` on registered wght/wdth/OPTI instances), the letter write-in (an opacity animator), the count-up and letter spacing (`setFont` / `setText` / `setTracking`).
  - Week: `node ae/make.js`. Any people: `node ae/make.js --names "נועה,אבי"` (generated like the live page). Then run `ae/build.jsx` in AE (File › Scripts › Run Script File).
  - Export: `zsh ae/render.sh` writes `export/wheep-story-NN.mp4` and `.gif` (24 s loops).
- Known AE 27 quirks: ExtendScript groups unparenthesised nested ternaries wrongly (`a ? x : b ? y : z`), so always parenthesise; shape-layer groups draw first-on-top; aerender and ffmpeg read stdin (redirect it in loops); reading `fontObject.designVector` from a script crashes the script engine; the `ADBE Text VF Axis` animator can't be added from a script; in RTL paragraphs, justification is mirrored; a time range written with a dash reverses in a Hebrew line, so labels use "עד".
