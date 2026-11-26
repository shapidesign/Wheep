/* WHEEP · the final poster as a picture, for saving and sharing.
   The story draws its last poster (the share card) off screen, fully built; it is serialised with the fonts embedded
   and drawn into a canvas, so the PNG is exactly the poster on screen.
   posterPNG(day) → JPEG Blob (2×, the name stays for old callers). savePoster(day) / sharePoster(day, url). Needs story.js and everything it needs. */

const POSTER_FONTS = [
  ['Greta', 'fonts/GretaSerifVF.ttf', 'truetype', 'font-weight:100 900'],
  ['GretaHL', 'fonts/GretaTextPro_HL-Regular.otf', 'opentype', 'font-weight:400'],
  ['Secolo19', 'fonts/Secolo-19.otf', 'opentype', ''], ['Secolo20', 'fonts/Secolo-20.otf', 'opentype', ''],
  ['Secolo21', 'fonts/Secolo-21.otf', 'opentype', ''], ['Secolo22', 'fonts/Secolo-22.otf', 'opentype', ''],
];
let posterFontCSS = null;
async function posterFonts() {
  if (posterFontCSS) return posterFontCSS;
  const toData = async url => {
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const parts = await Promise.all(POSTER_FONTS.map(async ([fam, url, fmt, extra]) =>
    `@font-face{font-family:${fam};src:url(data:font/${fmt === 'truetype' ? 'ttf' : 'otf'};base64,${await toData(url)}) format('${fmt}');${extra}}`));
  return (posterFontCSS = parts.join(''));
}

async function posterPNG(day, scale = 2) {
  // draw the story's last moment in a hidden (but laid out) svg, so every fit measures the real faces
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:-20000px;top:0;width:1080px;height:1350px;opacity:0;pointer-events:none';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 1080); svg.setAttribute('height', 1350);
  box.append(svg); document.body.append(box);
  try {
    const st = createStory(svg, day);
    st.draw(SCENES[SCENES.length - 1] - .05);
    [...svg.children].forEach(g => { if (g.style.display === 'none') g.remove(); });   // only the final poster
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = await posterFonts();
    svg.prepend(style);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
      await new Promise(r => setTimeout(r, 80));   // let the embedded fonts settle before drawing
      const c = document.createElement('canvas');
      c.width = 1080 * scale; c.height = 1350 * scale;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return await new Promise(r => c.toBlob(r, 'image/jpeg', .9));   // JPEG: the paper grain makes a PNG ~5 MB; this is ~1.5 MB
    } finally { URL.revokeObjectURL(url); }
  } finally { box.remove(); }
}

const posterFile = async day => new File([await posterPNG(day)], `wheep-${day.name}-${day.date.replace('.', '-')}.jpg`, { type: 'image/jpeg' });
function download(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// save: the share sheet on a phone ("Save image"), a download on a desktop
async function savePoster(day) {
  const file = await posterFile(day);
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `WHEEP · ${day.name}` }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(file);
}

// share with friends: the poster, a line, and the link to the person's own story.
// Returns 'shared', 'copied' (no share sheet: the image downloads and the link is copied) or 'cancelled'.
async function sharePoster(day, url) {
  const file = await posterFile(day), text = 'ככה עבר עליי היום · WHEEP';
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `WHEEP · ${day.name}`, text, url }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  if (navigator.share) {
    try { await navigator.share({ title: `WHEEP · ${day.name}`, text, url }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  download(file);
  try { await navigator.clipboard.writeText(url); } catch (e) { /* no clipboard: the download is enough */ }
  return 'copied';
}
