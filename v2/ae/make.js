// Builds ae/build.jsx from the same data and motion the web posters use (days.js + shape.js + motion.js).
// Run: node ae/make.js   → then run build.jsx in After Effects (File > Scripts > Run Script File).
const fs = require('fs'), path = require('path');
const { EMO } = require('../shape.js');
const { DAYS, palette } = require('../days.js');
const { LOOP } = require('../motion.js');
const MOTION = fs.readFileSync(path.join(__dirname, '../motion.js'), 'utf8') + '\n';   // pasted into every expression

// resolve everything ExtendScript needs into plain data
const data = DAYS.map((d, i) => {
  const e = EMO[d.emo];
  return { ...d, n: e.n, he: e.he, seed: +(i * 1.7).toFixed(2), pal: palette(e.c) };
});
// ExtendScript reads files as Latin-1 unless told otherwise: escape everything non-ASCII
const ascii = s => s.replace(/[\u0080-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

const tpl = fs.readFileSync(path.join(__dirname, 'build.template.jsx'), 'utf8');
const out = tpl.replace('/*DATA*/', ascii(JSON.stringify(data)))
  .replaceAll('/*OUT*/', ascii(JSON.stringify(path.join(__dirname, 'wheep-wrapped.aep'))))
  .replace('/*MOTION*/', JSON.stringify(MOTION))
  .replace('/*LOOP*/', String(LOOP))
  .replace('/*FRAMES*/', ascii(JSON.stringify(process.argv[2] || '')));
fs.writeFileSync(path.join(__dirname, 'build.jsx'), ascii(out));
console.log('wrote ae/build.jsx for', data.length, 'posters');
