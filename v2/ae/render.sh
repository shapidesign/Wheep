#!/bin/zsh
# Renders every poster loop from wheep-wrapped.aep and exports MP4 + GIF into ../export.
# Usage: zsh ae/render.sh   (After Effects 2027 + ffmpeg)
set -e
HERE=${0:A:h}
OUT=$HERE/../export
AER="/Applications/Adobe After Effects 2027/aerender"
TMP=$(mktemp -d)
mkdir -p "$OUT"
cp "$HERE/wheep-wrapped.aep" "$TMP/r.aep"    # aerender works on a copy, so the open project is untouched

days=(ראשון שני שלישי רביעי חמישי שישי שבת)
for i in {1..7}; do
  n=$(printf %02d $i)
  comp="WRAPPED $n · ${days[$i]}"
  "$AER" -project "$TMP/r.aep" -comp "$comp" -OMtemplate "Lossless" -output "$TMP/$n.mov" > /dev/null
  # MP4: h264, plays everywhere; the clip is exactly one loop, so set the player to loop
  ffmpeg -v error -y -i "$TMP/$n.mov" -c:v libx264 -pix_fmt yuv420p -crf 16 -movflags +faststart "$OUT/wheep-wrapped-$n.mp4"
  # GIF: half size, own palette, loops forever
  ffmpeg -v error -y -i "$TMP/$n.mov" -vf "scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=none" -loop 0 "$OUT/wheep-wrapped-$n.gif"
  echo "poster $n done"
done

"$AER" -project "$TMP/r.aep" -comp "WEEK · 7 days" -OMtemplate "Lossless" -output "$TMP/week.mov" > /dev/null
ffmpeg -v error -y -i "$TMP/week.mov" -c:v libx264 -pix_fmt yuv420p -crf 16 -movflags +faststart "$OUT/wheep-wrapped-week.mp4"
echo "week done"
rm -rf "$TMP"
