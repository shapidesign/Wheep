// Builds ae/build.jsx: the wrapped story for After Effects, from the same data and timeline the web uses.
//   node ae/make.js                          → the week (days.js, DEMO_NAME)
//   node ae/make.js --names "נועה,אבי"       → one story per name, generated like the live page (today's date)
//   node ae/make.js --frames /some/folder    → also save check stills
// Then run build.jsx in After Effects (File › Scripts › Run Script File), and `zsh ae/render.sh` to export.
const fs = require('fs'), path = require('path');
const { mHash } = require('../motion.js');
const { EMO } = require('../shape.js');
global.mHash = mHash; global.EMO = EMO;   // gen.js runs in the browser with these as globals
const { COPY } = require('../copy.js');
global.COPY = COPY;                     // days.js / gen.js take their words from copy.js
const { DAYS, palette, DEMO_NAME } = require('../days.js');
const { STORY_DUR } = require('../story-core.js');
const { makeDay, genMix, nameSeed } = require('../gen.js');

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const names = arg('--names');
const two = i => String(i + 1).padStart(2, '0');

const days = names
  ? names.split(',').map(s => s.trim()).filter(Boolean).map((name, i) => ({ ...makeDay({ name, date: new Date() }), comp: `STORY ${two(i)} · ${name}` }))
  : DAYS.map((d, i) => { const seed = nameSeed(DEMO_NAME, d.date); return { ...d, name: DEMO_NAME, seed, ...genMix(seed, d.emo), comp: `STORY ${two(i)} · ${d.day}` }; });

const data = days.map(d => ({ ...d, n: EMO[d.emo].n, he: EMO[d.emo].he, pal: palette(EMO[d.emo].c) }));
const emos = Object.fromEntries(Object.entries(EMO).map(([k, e]) => [k, { n: e.n, he: e.he, c: e.c }]));

// ExtendScript reads files as Latin-1 unless told otherwise: escape everything non-ASCII
const ascii = s => s.replace(/[\u0080-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const CORE = fs.readFileSync(path.join(__dirname, '../story-core.js'), 'utf8') + '\n';   // pasted into every expression

const tpl = fs.readFileSync(path.join(__dirname, 'build.template.jsx'), 'utf8');
const out = tpl.replace('/*DATA*/', JSON.stringify(data))
  .replace('/*EMOS*/', JSON.stringify(emos))
  .replace('/*UI*/', JSON.stringify(COPY.ui))
  .replace('/*DUR*/', String(STORY_DUR))
  .replaceAll('/*OUT*/', JSON.stringify(path.join(__dirname, 'wheep-wrapped.aep')))
  .replace('/*CORE*/', JSON.stringify(CORE))
  .replace('/*FRAMES*/', JSON.stringify(arg('--frames') || ''));
fs.writeFileSync(path.join(__dirname, 'build.jsx'), ascii(out));
fs.writeFileSync(path.join(__dirname, 'comps.txt'), data.map(d => d.comp).join('\n') + '\n');   // render.sh reads this
console.log(`wrote ae/build.jsx: ${data.length} stories (${data.map(d => d.name + '/' + d.emo).join(', ')})`);
