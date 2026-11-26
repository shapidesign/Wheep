# WHEEP pendants (3D print)

One charm per emotion, using the same `r(θ)` as `shapePath(n, k)` in `../shape.js`.

```bash
python3 pendants.py
```

This writes `pendant_<i>_<emotion>_n<n>.stl` (binary), `plate_all.stl` (all seven, laid out 4 + 3), `preview.png` (front) and `preview_back.png` (back, showing the pocket). It also prints a table and stops with an error if any mesh is not watertight. It needs only the Python standard library, plus Pillow for the preview.

## Parameters (top of `pendants.py`, all in mm)

| name | value | meaning |
|---|---|---|
| `BOX` | 30 | shape scaled so its bounding box fits 30 × 30; the barrel adds about 2.5 mm on top (about 30 × 32.5 × 3.9 overall) |
| `THICK` | 3.5 | extrusion height |
| `EDGE_R` | 0.6 | rounded top/bottom edge (0 = sharp) |
| `HOLE_D` | 2.0 | chain hole, running sideways (left to right) through a small barrel on the top tip, so the pendant faces forward; fits chains up to about 1.5 mm |
| `BAIL_WALL` | 1.0 | barrel wall around the hole; the barrel is 3.85 mm tall, only 0.35 mm above the pendant face |
| `BAIL_LEN` | 4.0 | barrel length along the chain. The round shapes, whose tops are wider, get 5–6 mm |
| `BAIL_CUT` | 1.5 | the top tip is cut up to this far below its apex, and nearer the apex on wide round tips so the barrel stays short. The barrel sits on the cut |
| `BAIL_MARGIN` | 0.4 | how far the barrel extends past the cut tip on each side |
| `POCKET_D` / `POCKET_DEPTH` | 6.0 / 2.0 | round pocket in the middle of the back for an electronic tracker, leaving 1.5 mm of material in front. Set `POCKET_DEPTH = THICK` (3.5) for a through-hole, or `POCKET_D = 0` for no pocket |
| `POCKET_WALL` | 1.0 | minimum material around the pocket; the needle stars get a small round core for it |
| `BAIL_FLAT` | 0.15 | flat strip under the barrel so it sits on the bed |
| `TIP_W` / `SPINE_BASE` | 1.2 / 3.0 | each spike gets a tapered spine, 3 mm wide at the centre and 1.2 mm at a rounded tip |
| `EMO` | n, k, colour[, body] | n from `shape.js`; k is spread evenly from 0 to 1, ordered by `kIn` in `wrapped.html`. The optional `body` (0–1) replaces the keyframe's inner radius: a bigger body gives shorter spikes and keeps the same tips |

Each pendant keeps its exact k. For printing, the script only adds material (the spines) where the true shape is too thin, so the softer shapes don't change at all.

## Current result

| emotion | n | k | keyframe | tip @1 mm | body r |
|---|---|---|---|---|---|
| release | 6 | 0 | clover | 5.27 | 6.30 |
| joy | 4 | .17 | clover → soft square | 6.05 | 8.63 |
| cry | 5 | .33 | soft square | 5.11 | 11.53 |
| shame | 7 | .50 | soft square → rounded star | 2.07 | 7.71 |
| fear | 3 | .67 | rounded star | 3.25 | 4.10 |
| press | 9 | 1, body .5 | needle tips, chunky body (short spikes) | 1.25 | 7.62 |
| anger | 8 | 1 | needle star | 1.25 | 3.41 |

All meshes pass the check: every edge is shared by exactly two faces, in opposite directions, and the volume is positive. Each cap's triangle area also equals the outline area minus the hole, so no cap triangles overlap. The script also asserts that every tip is at least 1.2 mm wide.

## Notes
- The outline uses `n × 240` samples instead of 360, so a sample lands exactly on every tip (360/7 is not a whole number). The radius function itself is unchanged.
- The edge rounding is a radial inset of the outline. It is a full 0.6 mm at the tips and valleys and thinner along the long spike flanks, which keeps the mesh free of self-intersections.
- The barrel is a D-shaped profile extruded along x. Its front face covers the cut through the top tip, so pendant and barrel form one closed solid with no overlapping parts. The pendant walls are stitched layer by layer, and the flat faces are ear-clipped. Each flat face was also checked for folded triangles.
- The back of the pendant and the barrel is flat on the bed, and the barrel bulges 0.35 mm on the front only. For a bigger chain, raise `HOLE_D`; the barrel grows with it.
- Print the pendants flat on their back with no supports; the pocket opens downward onto the bed, so it needs no supports either. Measure the tracker before printing, and make `POCKET_D` about 0.2–0.3 mm larger than it so it fits. The 2 mm sideways hole bridges cleanly. A 0.4 mm nozzle is assumed for the 1.2 mm tips. The needle pendants (anger, press) are the most fragile: print them in PETG, or raise `SPINE_BASE` to make them stronger.
