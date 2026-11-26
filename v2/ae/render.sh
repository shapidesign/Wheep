#!/bin/zsh
# Renders every story in wheep-wrapped.aep (names in comps.txt, written by make.js) to MP4 + GIF in ../export.
# Usage: zsh ae/render.sh   (After Effects 2027 + ffmpeg)
set -e
HERE=${0:A:h}
OUT=$HERE/../export
AER="/Applications/Adobe After Effects 2027/aerender"
TMP=$(mktemp -d)
mkdir -p "$OUT"
cp "$HERE/wheep-wrapped.aep" "$TMP/r.aep"    # aerender works on a copy, so the open project is untouched

i=0
while IFS= read -r comp; do
  [[ -z "$comp" ]] && continue
  i=$((i + 1)); n=$(printf %02d $i)
  slug=$(echo "$comp" | sed 's/^STORY [0-9]* · //')
  "$AER" -project "$TMP/r.aep" -comp "$comp" -OMtemplate "Lossless" -output "$TMP/$n.mov" < /dev/null > /dev/null   # aerender reads stdin: without this it swallows the rest of comps.txt
  # MP4: h264; the clip is exactly one 16 s loop, so set the player to loop
  ffmpeg -nostdin -v error -y -i "$TMP/$n.mov" -c:v libx264 -pix_fmt yuv420p -crf 17 -movflags +faststart "$OUT/wheep-story-$n.mp4"
  # GIF: half size, 15 fps, own palette, loops forever
  ffmpeg -nostdin -v error -y -i "$TMP/$n.mov" -vf "fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=none" -loop 0 "$OUT/wheep-story-$n.gif"
  echo "$n · $slug done"
done < "$HERE/comps.txt"
rm -rf "$TMP"
