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
| עצב sadness (measured by crying) | 5 | `#3FC8F5` |
| שחרור release | 6 | `#3DDC97` |
| בושה shame | 7 | `#FF9F1C` |
| כעס anger | 8 | `#FF5A36` |
| הדחקה holding in | 9 | `#9B6BFF` |

- **Fill only, never a stroke.** A shape is a solid area of colour: no outline, no stroked version, at any size. (In Figma, new vectors get a default stroke: remove it.)
- **k** moves through four drawn keyframes: clover (0), soft square (.34), rounded star (.67), needle star (1). Never draw a shape by hand. Pick n and k.
- **One shape layer per poster: the hero or the background, never both.** Either the feeling's shape stands in front (in ink, with its two bands) and carries the day, or one or two background shapes carry it from behind. Scenes where the shape *is* the message (intro, the feeling, outside vs inside) use the hero; scenes led by type or data (what was measured, the day in feelings, the two lines) use the background. The hero is soft outside, its true quality inside. Small shapes appear only as data (one mark per event), never as a swarm.
- **Background shapes, when the poster has no hero.** One or two large shapes, tone on tone: the ground mixed 14% toward ink (on the ink ground, `#26221C`). They sit right above the ground, under the frame and the type, placed in the areas the layout leaves empty. They use the feeling's n and take over the hero's story (the main one follows the scene's k: out ↔ in, or back to soft at the end; a second one morphs slowly, 7–11 s), turn slowly and grow in with the scene. Never in a feeling colour, never small, never more than two. (`story.js → ghost()`)
- n can go fractional for transitions only (the logo melting between feelings). Content always uses a whole n.

## 3. Type: Secolo + Greta Serif VF

- **Secolo** (Michal Sahar, Hebrew) is the display voice, and only in its four regular cuts: **Secolo 19, 20, 21, 22**. No weights. **Mixed letter by letter:** every letter of a word sits on its own cut, so one word is always made of several of the four, and each letter jumps to another cut on every beat. Tracked **−20** (−0.02em) everywhere.
- **Greta Serif VF** (Typotheque, wght 0–100) is for reading and for the logo: the day sentence, the units, the 24h line, the info line and the lowercase `wheep` wordmark.
- **Weight carries the meaning:** heavy is what's shown, hairline is what's hidden. The two lines of the day sentence swap weight when the poster goes from out to in.
- Figma: text styles `Display/*`, `Text/*`, `Logo/Wordmark` and `Doc/*` in the file wheep-shapes. Their family is a stand-in, because the Figma connection used to build them can't load local fonts. Swap each style to its real font (named in the style description) in the Figma app.

## 4. Colour: one feeling, five tones

Each poster takes its feeling's colour and builds five tones from it (`days.js → palette()`): **m** the feeling (the ground), **a** a light tint (55% toward white), **b** a dark shade (50% toward ink), **k** ink `#16130F`, and **w** white. The feeling's colour covers the poster, so the feeling reads first. Ink carries the type; white appears only where type crosses the shape.

## 5. The wrapped: one day as a story

This is a wrapped for an app: it reveals the day step by step, so a person can take it in. One 1080×1350 frame, six scenes on a 47.6 s loop (`S_PACE` 2.8 × the original 17 s; each poster holds 6–9.5 s, and the closing lines get the longest, so there is time to read), a progress bar on top like a story, and the person's name in the header (it's theirs).

| Scene | Time | What it tells |
|---|---|---|
| 0 · intro | 0–6.2 s | ink ground. The name fills the measure and writes itself in from hairline, "ככה עבר עליך היום." under it. Hero: a white shape blooms off the bottom |
| 1 · the feeling | 6.2–14 | "הרגש שהוביל את היום", then the feeling word in Secolo across the full measure, pulled tight from wide letter spacing; a rule; its share counting up. Hero: bleeds off the bottom right, turning into the day's outside |
| 2 · what was measured | 14–21.8 | the figure across four columns (counts up), its unit, a full-width 24h line with ticks, durations and events, a plain caption. Background shapes |
| 3 · outside vs inside (מוחצן או מופנם) | 21.8–29.7 | the gap counting up beside its title; the poster split in two halves, the outside shape holding, the inside one turning into what it was; a full-width soft → sharp scale where the gap fills behind a moving "now" shape; the meaning in the footer. Hero pair |
| 4 · the day in feelings | 29.7–38.1 | ink ground. A tall full-width strip of the waking hours (each stretch carries its feeling's shape), then the top three as a ruled table: shape, word, share. Background shape |
| 5 · the two lines | 38.1–47.6 | the fact, a rule, what the data adds; each line as big as the measure allows, writing in, then they swap weight. Signed in the footer. Background shapes, the big one closing back to soft |

- **One tight grid.** Every poster is the same frame: 56 px margins, 6 columns with 16 px gutters, a progress bar, a top row (name · day and date · wheep) and a bottom row between two hairline rules. Inside it the type is sized to fill its measure (`fit()` measures Greta at wght 100 and Secolo at its widest cut), the data spans the full width, and rules split the poster into modules. No zone is left empty: what the type and data don't fill, the shape layer does. (This replaced the three layouts A · line, B · dial, C · grid.)
- **The feeling is written once:** the header of scene 1. No repeated depth word.
- **Copy voice:** second person singular throughout (you felt, you showed, your fear), on the story, the phone and the kiosk. A tracker talking, dry and specific. State what was measured and when, add one fact the person didn't see. Every figure is the feeling's own measure, never a body signal: a count, a duration, the fear index (מדד פחד, 0–1000), or the MPL (מדד לחץ גבריות, 0–1000) for holding in. No pulse anywhere. No melodrama, no lessons.
- **Copy:** every word lives in `copy.js` (`COPY.ui` for the scene titles, `COPY.profiles` for the six visitor profiles, `COPY.week` for the demo week). `admin.html` edits it with a live preview, saves to this browser (localStorage, so the kiosk machine picks it up) and exports a new `copy.js` to commit.
- **Data:** `days.js → DAYS` (the weekly demo, for `DEMO_NAME`), or `gen.js → makeDay({ name, date })` (anyone). The day in feelings comes from `genMix(seed, top)`, and the top feeling always leads it.

## 6. Logo

`wheep` lowercase in Greta Serif VF, plus the shape mark. The mark drifts through all seven feelings (fractional n), and each letter's weight follows the mark's k with a per-letter delay. It never holds one form. A static use is a frozen frame. See `logo.html`.

## 7. Motion: shapes flow, type snaps, Greta breathes, the story loops

- **Shapes never hold still.** Each poster's shapes grow in (smootherstep), turn, breathe ±2.5% and keep morphing (k). The hero's two bands trail it by 0.15 s and 0.3 s. Their quality follows the story: clover ↔ soft square in the intro, soft → the day's outside in scene 1, out ↔ in in scene 2, the inside turning into what it was in scene 3 (1.6 s), back to soft at the end. Data marks pop in with a small overshoot and keep morphing too. The scenes cut (like a story); every element builds in again on the next poster.
- **Greta, letter by letter:** every letter moves on all three axes on its own (`story-core.js → sLetter`), slowly enough to read: weight as a slow wave along the line plus each letter's own drift (6–12 s), width 70–100 at each letter's pace, optical size swelling over 12 s. Every period is the loop divided by a whole number, so it closes at any pace. `S_GRETA` (amount, and how differently the letters move) is set from the admin page. The intro name grows from hairline to bold first; the two closing lines swap weight once the second has written in.
- **Secolo snaps:** every letter cuts to another of 19–22 every 0.4 s (each on its own offset, so the word stays mixed) on the feeling word, the figures and the shares. The feeling word starts with wide letter spacing and pulls tight to −20.
- **Build-up:** inside each scene the elements arrive one after another, 0.09 s apart (quartic ease-out over 0.7 s, rising 28 px). The name and the two closing lines write themselves in letter by letter.
- **Data reveals:** the figures and shares count up, the 24h axis draws, ticks arrive, durations wipe in, events pop onto it; the gap fills on the scale as the inside shape turns; the day in feelings opens stretch by stretch, and the top three arrive 0.25 s apart.
- **Pace:** 6.2–9.5 s per scene. The motion inside a poster runs in real seconds (it finishes in about 3–5 s), and `S_PACE` only sets how long each poster then holds.
- **Reduced motion:** the story holds on scene 4 (the day in feelings).

## 7b. Text rules

- **Every block on its own line.** Titles, figures and captions never share a baseline with something that can grow (the gap sits under its title, not beside it).
- **Fit and wrap at the heaviest weight.** Greta breathes up to wght 100, so text is measured at 100. Names and units shrink to fit their width; sentences wrap to their column (web: measured tspans; AE: paragraph text boxes).
- **No orphans:** wrapped lines are balanced (the narrowest width that keeps the same number of lines), and a last line of one word pulls one more down.
- **Performance:** only scenes on screen are drawn, a letter is restyled only when its rounded axes change, and the week page draws only the stories in view.
- **Contrast:** ink on the feeling, white on ink. The hero is placed in columns the type doesn't use (or bleeds off an edge), so ink type never sits on the ink shape; background shapes are tone on tone, so type reads over them. The "now" mark is ink, because white disappears on the light feelings.

## 8. Files

- `story.js`: the story engine, `createStory(svg, day, { bleed })` → `draw(seconds)`. Six posters on the tight grid; built on the first draw (after the fonts), only the poster on screen is drawn.
- `gen.js`: `makeDay({ name, date, top? })`, deterministic per name and date (so a rescan gives the same day), plus `sensorId(name)`.
- `wrapped.html`: the week as seven stories (`?day=N` for one, `?t=12` to freeze a moment).
- **Live:**
  - `live.html` is the exhibition screen, made for a **vertical display**: the story fills the screen, with one thin strip at the bottom (a small QR, one line, a name field). `?qr=0` drops the QR when it is printed next to the screen. **F**, or the strip's button, switches to story only, full screen (the poster's ground runs to the edges); `?only=1` opens story only without full screen. On each person's last poster the QR becomes a link to their own story, so they can take the poster and share it. It has a queue: each visitor's wrapped (typed at the kiosk or sent from a phone) plays through once, then the next visitor's, then the rotation of made-up men resumes. A new visitor cuts in on the made-up men but never on another visitor; the line under the QR shows who's on screen and who's next, and a name still being typed (רו → רון → רונן) replaces its own place in line, and generated visitors' stories playing next to it. The rotation's men (איתי, יובל, עידו, יהונתן, אבי, ליאור) each have their own profile (`gen.js → MOCK_NAMES`); `?names=a,b,c` overrides who appears. A name typed on a visitor's phone reaches the screen live through `sync.js`: the phone posts the first name to a public ntfy.sh topic, the screen listens on it (no account, no server of ours; anyone who knows the topic could read the names, so it is long and random).
  - `me.html` is the visitor's phone. They type a name, the page "detects" a WHEEP sensor (a stable id per name), syncs, and plays their story. It needs no server, so it runs as-is on GitHub Pages, and `?name=` links straight to someone's story.
  - On the phone the day plays as stories, like Instagram or Spotify Wrapped: today first, then the five days before it (each led by a different feeling, so the colours and shapes mix). Tap the left side for the next scene and the right side to go back (mirrored for Hebrew), swipe for another day, hold to pause. Arrow keys and space do the same. A strip of days runs along the top; a finished day moves on to the next by itself.
- **Share:** on each day's last poster the phone offers "שתף את הפוסטר שלך": `summary.js → sharePoster()` renders that poster to a PNG (the story itself, drawn off screen with the fonts embedded) and opens the share sheet with the image, a line and the link to the person's story. Without a share sheet the image downloads and the link is copied. "שמור תמונה" saves the same PNG.
- `copy.js` / `admin.html`: all the words (scene titles, feeling names, profiles, the week) and how the text moves, and the page to edit them.
- The After Effects build still uses the earlier layout A and letter motion; it is updated separately.
- `story-core.js`: the story's timeline (pace, scene times, build-ups, the shape's places and states, per-letter Greta), in ES5, shared by the web and pasted into every After Effects expression.
- **After Effects:** `ae/wheep-wrapped.aep`, one comp per story (`STORY NN · …`) plus `ALL · N stories`. Each story has a CONTROLS null (k out, k in, points, five colours), and every text layer is editable. Source Text expressions handle the Secolo cuts, per-letter Greta (`setFont(…, i, 1)` on registered wght/wdth/OPTI instances), the letter write-in (an opacity animator), the count-up and letter spacing (`setFont` / `setText` / `setTracking`).
  - Week: `node ae/make.js`. Any people: `node ae/make.js --names "נועה,אבי"` (generated like the live page). Then run `ae/build.jsx` in AE (File › Scripts › Run Script File).
  - Export: `zsh ae/render.sh` writes `export/wheep-story-NN.mp4` and `.gif` (24 s loops; the AE build is behind the web and is updated separately).
- Known AE 27 quirks: ExtendScript groups unparenthesised nested ternaries wrongly (`a ? x : b ? y : z`), so always parenthesise; shape-layer groups draw first-on-top; aerender and ffmpeg read stdin (redirect it in loops); reading `fontObject.designVector` from a script crashes the script engine; the `ADBE Text VF Axis` animator can't be added from a script; in RTL paragraphs, justification is mirrored; a time range written with a dash reverses in a Hebrew line, so labels use "עד".
