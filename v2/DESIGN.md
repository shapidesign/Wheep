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

- **Hand-cut, naive (after Matisse's cut-outs):** every feeling has its own cut, the same everywhere it appears (`shape.js → cutOf(n)`, seeded by n): at half strength (`SHAPE_HAND = .5`: hand-made, not naive) its lobes differ in length by about ±15% and are a little unevenly spaced, the body is slightly lopsided and squashed, and a few feelings (shame, joy) have a faintly straighter side. n and k still decide the shape; the cut only makes it look made by hand. `SHAPE_HAND = 0` gives back the exact geometric drawing, 1 the fully naive cut. The 3D pendants keep the geometric drawing.
- **Fill only, never a stroke.** A shape is a solid area of colour: no outline, no stroked version, at any size. (In Figma, new vectors get a default stroke: remove it.)
- **k** moves through four drawn keyframes: clover (0), soft square (.34), rounded star (.67), needle star (1). Never draw a shape by hand. Pick n and k. Between them the shape follows one continuous curve (Catmull-Rom through the four), so a morph that crosses a drawing never stops on it.
- **No bands.** A shape is only its own form: no trailing outlines or rings around it.
- **One shape layer per poster: the hero or the background, never both.** Either the feeling's shape stands in front and carries the day, or one or two background shapes carry it from behind. Scenes where the shape *is* the message (intro, the feeling, outside vs inside) use the hero; scenes led by type or data (what was measured, the day in feelings, the two lines) use the background. The hero is soft outside, its true quality inside. Small shapes appear only as data (one mark per event), never as a swarm.
- **Background shapes, when the poster has no hero.** One or two large shapes, tone on tone: the ground mixed 8% toward ink (so ink text over them keeps ≥4.5:1 on every feeling) (on the ink ground, `#26221C`). They sit right above the ground, under the frame and the type, placed in the areas the layout leaves empty. They use the feeling's n and take over the hero's story (the main one follows the scene's k: out ↔ in, or back to soft at the end; a second one morphs slowly, 7–11 s), turn slowly and grow in with the scene. Never in a feeling colour, never small, never more than two. (`story.js → ghost()`)
- n can go fractional for transitions only (the logo melting between feelings). Content always uses a whole n.

## 3. Type: Secolo + Greta Serif VF

- **Secolo** (Michal Sahar, Hebrew) is the display voice, and only in its four regular cuts: **Secolo 19, 20, 21, 22**. No weights. **Mixed letter by letter:** every letter of a word sits on its own cut, so one word is always made of several of the four, and each letter jumps to another cut on every beat. Tracked **−20** (−0.02em) everywhere.
- **Greta Serif VF** (Typotheque, wght 0–100) is for reading and for the logo: the day sentence, the units, the 24h line, the info line and the lowercase `wheep` wordmark.
- **Weight carries the meaning:** heavy is what's shown, hairline is what's hidden. The two lines of the day sentence swap weight when the poster goes from out to in.
- Figma: text styles `Display/*`, `Text/*`, `Logo/Wordmark` and `Doc/*` in the file wheep-shapes. Their family is a stand-in, because the Figma connection used to build them can't load local fonts. Swap each style to its real font (named in the style description) in the Figma app.

## 4. Colour: one feeling, five tones

Each poster takes its feeling's colour and builds five tones from it (`days.js → palette()`): **m** the feeling (the ground), **a** a light tint (55% toward white), **b** a dark shade (50% toward ink), **k** ink `#16130F`, and **w** white. The feeling's colour covers the poster, so the feeling reads first. Ink carries the type; white appears only where type crosses the shape.

## 5. The wrapped: one day as a story

This is a wrapped for an app: it reveals the day step by step, so a person can take it in. One 1080×1350 frame, eleven stories on an 87 s loop (each story's hold is set in `story-core.js → S_HOLD`, 6–9.5 s; the share card gets the longest), a progress bar on top like a story, and the person's name in the header (it's theirs).

| # | Story | Seconds | What it tells |
|---|---|---|---|
| 1 | intro | 6 | ink. The name fills the measure and writes in from hairline, "ככה עבר עליך היום.", a white shape blooming off the bottom |
| 2 | the words | 7 | "היום דיברת", the count across the measure (counts up), "מילים", then words per hour 07–23 as bars; the loudest hour in ink and named |
| 3 | guess | 8.5 | ink. "איזה רגש הוביל את היום שלך?" Three shapes, each with its feeling's name under it. At 3.4 s the right one turns ink, the others fade, its colour floods the poster from the shape (soft and large enough to cover every corner), the frame turns ink, and the feeling's name lands |
| 4 | the minutes | 7 | "396" and "דקות של כעס"; one ink square per 10 minutes, filling with the count |
| 5 | three chapters | 7.5 | morning, afternoon, evening as three bands in the feeling that held each one, its shape cropped by the band, the word in Secolo |
| 6 | top five | 8 | ink. The five longest stretches, ranked 1–5: shape and word in the feeling's colour, the hours, and a bar of that moment's MPL (0–1000) with the figure riding at its end. MPL per stretch: held-in feelings press it up (holding in ~760, anger ~650, shame ~600, fear ~560), letting out brings it down (tears ~300, joy ~260, release ~160) |
| 7 | the daily portrait | 8.5 | ink. Every stretch of the day becomes its feeling's shape, sized by how long it lasted, packed into one form (`mPack`, seeded: no two portraits alike), each morphing on its own; the top three below |
| 8 | the type | 8.5 | three modules, top to bottom: the type's name and line; your two shapes side by side (what showed, what was inside, each morphing from soft to what it was) with the gap knocked out of the divider; then the four types as a hairline 2×2 table (outside rows, inside columns, labels outside the cells) where only yours fills, from the reading side (the one filled thing on the poster). The share of men of that type sits in the footer |
| 9 | the friends | 8 | "מה שלום החברים שלך?" Four friends, each with their daily shape (it holds still: it is their day, not a motion), feeling and gap; the one with the widest gap gets a nudge in an ink box ("אולי תתקשר ל…?") |
| 10 | tomorrow | 8.5 | "לקראת מחר": one line by type ("תגיד את זה בקול.", "תן לראות את הרך.", "תגיד גם למה.", "תמשיך ככה.") and why, from the day; today's inside shape and tomorrow's, softening, with an arrow drawing between them; then three small things to do (a five-minute call to the friend with the widest gap, a minute of quiet before answering, one sentence about what you felt), each with its +MPL. Dry and specific, not a lecture |
| 11 | the share card | 9.5 | "ככה עבר עליי היום", the name, the shape with the type and the leading feeling, three figures (words, minutes, the day's measure), and the day in feelings as one bar. The share button sends this poster |

- **One tight grid.** Every poster is the same frame: 56 px margins, 6 columns with 16 px gutters, a progress bar, a top row (name · day and date · wheep) and a bottom row between two hairline rules. Inside it the type is sized to fill its measure (`fit()` measures Greta at wght 100 and Secolo at its widest cut), the data spans the full width, and rules split the poster into modules. No zone is left empty: what the type and data don't fill, the shape layer does. (This replaced the three layouts A · line, B · dial, C · grid.)
- **The feeling is written once:** the header of scene 1. No repeated depth word.
- **Copy voice:** second person singular throughout (you felt, you showed, your fear), on the story, the phone and the kiosk. A tracker talking, dry and specific. State what was measured and when, add one fact the person didn't see. Every figure is the feeling's own measure, never a body signal: a count, a duration, the fear index (מדד פחד, 0–1000), or the MPL (מדד לחץ גבריות, 0–1000) for holding in. No pulse anywhere. No melodrama, no lessons.
- **Copy:** every word lives in `copy.js` (`COPY.ui` for the scene titles, `COPY.profiles` for the six visitor profiles, `COPY.week` for the demo week). `admin.html` edits it with a live preview, saves to this browser (localStorage, so the kiosk machine picks it up) and exports a new `copy.js` to commit.
- **Data:** `days.js → DAYS` (the weekly demo, for `DEMO_NAME`), or `gen.js → makeDay({ name, date })` (anyone). The day in feelings comes from `genMix(seed, top)`, and the top feeling always leads it.

## 6. Logo

`wheep` lowercase in Greta Serif VF, plus the shape mark. The mark drifts through all seven feelings (fractional n), and each letter's weight follows the mark's k with a per-letter delay. It never holds one form. A static use is a frozen frame. See `logo.html`.

## 7. Motion: shapes flow, type snaps, Greta breathes, the story loops

- **Shapes never hold still.** Each poster's shapes grow in (smootherstep), turn, breathe ±2.5% and keep morphing (k). Their quality follows the story: clover ↔ soft square in the intro, soft → the day's outside in scene 1, out ↔ in in scene 2, the inside turning into what it was in scene 3 (1.6 s), back to soft at the end. Data marks pop in with a small overshoot and keep morphing too. The scenes cut (like a story); every element builds in again on the next poster.
- **Greta, letter by letter:** every letter moves on all three axes on its own (`story-core.js → sLetter`), slowly enough to read: weight as a slow wave along the line plus each letter's own drift (6–12 s), width 70–100 at each letter's pace, optical size swelling over 12 s. Every period is the loop divided by a whole number, so it closes at any pace. `S_GRETA` (amount, and how differently the letters move) is set from the admin page. The intro name grows from hairline to bold first; the two closing lines swap weight once the second has written in.
- **Secolo snaps:** every letter cuts to another of 19–22 every 0.4 s (each on its own offset, so the word stays mixed) on the feeling word, the figures and the shares. The feeling word starts with wide letter spacing and pulls tight to −20.
- **Paper and frame rate, after Vox explainers:** the story is drawn at 15 frames a second: the eases stay smooth, the frames step. Each drawn frame the paper texture shifts and every shape trembles very slightly (±0.2% size, ±1 px): a faint boil. Shapes are never rigid: their edge ripples softly (a slow two-harmonic wave, 1.2%), and more while they are changing (up to 6%, follow-through), via `shapePath(…, flow)`. Shapes that hold still (the friends') neither boil nor ripple. The texture is one 512 px tile made once per page: soft mottling, fine grain and a few fibres, drawn at half scale and blended `overlay` at 20%, so it stays a fine paper on a 50" screen; it is in the shared picture too.
- **Cuts between stories** come from the posters' own language, a different one per cut (`story.js → TRANS`): **iris** (the next poster opens out of its feeling's shape, only where colour meets ink, so it is seen), **columns** (the six grid columns drop in from the reading side, 70 ms apart), **deal** (a paper card from below, turned −9°, lands with a small overshoot on the stack, a soft shadow under it), **push** (the new poster comes in from the left, forward in Hebrew, and pushes the old one right at a third of the speed: parallax). Moves between positions use quint in-out; arrivals quint out; 0.75–0.95 s each. On the phone and kiosk the ground runs to the screen edges.
- **Build-up:** the elements of a poster start as its cut settles, 50 ms apart, most important first, quint ease-out over 0.65 s: lines of type rise out of a mask (they appear from behind their own baseline, not fading), rules draw from the reading side, everything else lifts 24 px and fades. The name writes itself in letter by letter.
- **Data reveals:** the figures and shares count up, the 24h axis draws, ticks arrive, durations wipe in, events pop onto it; the gap fills on the scale as the inside shape turns; the day in feelings opens stretch by stretch, and the top three arrive 0.25 s apart.
- **Pace:** 6.2–9.5 s per scene. The motion inside a poster runs in real seconds (it finishes in about 3–5 s), and `S_PACE` only sets how long each poster then holds.
- **Pause and move, like a story:** on every playing poster (week page, phone, kiosk) the left 30% of the poster goes to the next story and the right 30% to the one before (the story moves right to left, as Hebrew reads); a click or tap in the middle pauses on the frame ("מושהה") and plays on from it. The zones are measured on the poster, not the window, so they work on a wide screen. Week page: each poster keeps its own clock. Phone: swipe right for the next day; a hold (0.45 s+) pauses while held, a shorter press is a tap; with a mouse every click is a click; a click fallback catches any tap whose pointer events are dropped. Kiosk: forward from the last story goes to the next person; a new person always starts playing. Arrow keys (left = forward) and Space do the same from the keyboard.
- **Reduced motion:** the story still plays every story from the start (phone and kiosk); each one appears fully built instead of moving.

## 7b. Text rules

- **Every block on its own line.** Titles, figures and captions never share a baseline with something that can grow (the gap sits under its title, not beside it).
- **Fit and wrap at the heaviest weight.** Greta breathes up to wght 100, so text is measured at 100. Names and units shrink to fit their width; sentences wrap to their column (web: measured tspans; AE: paragraph text boxes).
- **No orphans:** wrapped lines are balanced (the narrowest width that keeps the same number of lines), and a last line of one word pulls one more down.
- **Performance:** only scenes on screen are drawn, a letter is restyled only when its rounded axes change, and the week page draws only the stories in view.
- **Contrast:** ink on the feeling, white on ink; every pair is ≥4.5:1 (the weakest, ink on holding-in purple, is 5.2; ink over a background shape on purple, 4.6). The hero is placed in columns the type doesn't use (or bleeds off an edge), so ink type never sits on the ink shape; background shapes are tone on tone, so type reads over them. The "now" mark is ink, because white disappears on the light feelings.

## 8. Files

- `story.js`: the story engine, `createStory(svg, day, { bleed })` → `draw(seconds)`. Six posters on the tight grid; built on the first draw (after the fonts), only the poster on screen is drawn.
- `gen.js`: `makeDay({ name, date, top? })`, deterministic per name and date (so a rescan gives the same day), plus `sensorId(name)`.
- `wrapped.html`: the week as seven stories (`?day=N` for one, `?t=12` to freeze a moment).
- **Live:**
  - `live.html` is the exhibition screen, made for a **vertical display**: the story fills the screen, with one thin strip at the bottom (a small QR, one line, a name field). `?qr=0` drops the QR when it is printed next to the screen. **F**, or the strip's button, switches to story only, full screen (the poster's ground runs to the edges); `?only=1` opens story only without full screen. On each person's last poster the QR becomes a link to their own story, so they can take the poster and share it. It has a queue: each visitor's wrapped (typed at the kiosk or sent from a phone) plays through once, then the next visitor's, then the rotation of made-up men resumes. A new visitor cuts in on the made-up men but never on another visitor; the line under the QR shows who's on screen and who's next, and a name still being typed (רו → רון → רונן) replaces its own place in line, and generated visitors' stories playing next to it. The rotation's men (איתי, יובל, עידו, יהונתן, אבי, ליאור) each have their own profile (`gen.js → MOCK_NAMES`); `?names=a,b,c` overrides who appears. A name typed on a visitor's phone reaches the screen live through `sync.js`: the phone posts the first name to a public ntfy.sh topic, the screen listens on it (no account, no server of ours; anyone who knows the topic could read the names, so it is long and random).
  - `me.html` is the visitor's phone. They type a name, the page "detects" a WHEEP sensor (a stable id per name), syncs, and plays their story. It needs no server, so it runs as-is on GitHub Pages, and `?name=` links straight to someone's story.
  - On the phone the day plays as stories, like Instagram or Spotify Wrapped: today first, then the five days before it (each led by a different feeling, so the colours and shapes mix). Mirrored for Hebrew (the story moves right to left): tap the left edge for the next story and the right edge to go back, swipe right for the next day, tap the middle or hold to pause. Arrow keys and space do the same. A strip of days runs along the top; a finished day holds on its share card (to save or share it), and a tap or swipe moves to the next day.
- **Share:** on each day's last poster the phone offers "שתף את הפוסטר שלך": `summary.js → sharePoster()` renders that poster to a PNG (the story itself, drawn off screen with the fonts embedded) and opens the share sheet with the image, a line and the link to the person's story. Without a share sheet the image downloads and the link is copied. "שמור תמונה" saves the same picture (a JPEG, about 1.5 MB, because the grain doesn't compress as PNG).
- `copy.js` / `admin.html`: all the words (scene titles, feeling names, profiles, the week) and how the text moves, and the page to edit them.
- The After Effects build still uses the earlier layout A and letter motion; it is updated separately.
- `story-core.js`: the story's timeline (pace, scene times, build-ups, the shape's places and states, per-letter Greta), in ES5, shared by the web and pasted into every After Effects expression.
- **After Effects:** `ae/wheep-wrapped.aep`, one comp per story (`STORY NN · …`) plus `ALL · N stories`. Each story has a CONTROLS null (k out, k in, points, five colours), and every text layer is editable. Source Text expressions handle the Secolo cuts, per-letter Greta (`setFont(…, i, 1)` on registered wght/wdth/OPTI instances), the letter write-in (an opacity animator), the count-up and letter spacing (`setFont` / `setText` / `setTracking`).
  - Week: `node ae/make.js`. Any people: `node ae/make.js --names "נועה,אבי"` (generated like the live page). Then run `ae/build.jsx` in AE (File › Scripts › Run Script File).
  - Export: `zsh ae/render.sh` writes `export/wheep-story-NN.mp4` and `.gif` (24 s loops; the AE build is behind the web and is updated separately).
- Known AE 27 quirks: ExtendScript groups unparenthesised nested ternaries wrongly (`a ? x : b ? y : z`), so always parenthesise; shape-layer groups draw first-on-top; aerender and ffmpeg read stdin (redirect it in loops); reading `fontObject.designVector` from a script crashes the script engine; the `ADBE Text VF Axis` animator can't be added from a script; in RTL paragraphs, justification is mirrored; a time range written with a dash reverses in a Hebrew line, so labels use "עד".
