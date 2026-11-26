"""WHEEP pendants: one printable bouba/kiki charm per emotion.

Same r(theta) as shapePath(n, k) in ../shape.js, extruded with a rounded edge
and a sideways barrel (bail) on the top tip: the chain runs left-right through it,
so the pendant faces forward instead of turning. Flat back, prints without supports. Stdlib only (+ Pillow for the preview).
Run:  python3 pendants.py      -> STLs, preview.png, printed report
"""
import math, struct, os

# ---- parameters (mm) --------------------------------------------------------
BOX       = 30.0    # outline fits a BOX x BOX square
THICK     = 3.5     # extrusion height
EDGE_R    = 0.6     # rounded top/bottom edge radius (0 = sharp)
EDGE_SEGS = 4       # segments per rounded edge
HOLE_D    = 2.0     # chain hole diameter (runs left-right through the barrel)
BAIL_WALL = 1.0     # barrel wall around the hole
BAIL_LEN  = 4.0     # barrel length along the chain (grows only if the tip is wider even at the shallowest cut)
BAIL_CUT  = 1.5     # the top tip is cut up to this far below its apex (less for wide tips) and the barrel sits on the cut
BAIL_MARGIN = 0.4   # barrel overhang past the cut tip on each side
BAIL_FLAT = 0.15    # barrel bottom flattened this much so it sits on the bed
HOLE_SEGS = 48      # hole circle segments
POCKET_D  = 6.0     # round pocket in the middle of the back, for an electronic tracker (0 = none)
POCKET_DEPTH = 2.0  # pocket depth from the flat back (= THICK for a through-hole)
POCKET_WALL = 1.0   # min material around the pocket (a round core is added where the shape is thinner)
ARC_SEGS  = 48      # barrel outer-arc segments
TIP_W     = 1.2     # min spike width at the tip: every spike gets a tapered spine ...
SPINE_BASE = 3.0    # ... this wide at the centre (strength; set = TIP_W for parallel sticks)
TIP_DEPTH = 1.0     # tip width is reported this far in from the apex
STEPS_PER_POINT = 240  # outline samples per point (puts a sample exactly on every tip)
SPACING   = 42.0    # plate pitch (pendants are ~35 mm tall with the barrel)
PLATE_COLS = 4

# n from EMO in shape.js; k spread evenly 0..1, ordered by kIn in wrapped.html
# (release softest ... anger sharpest), so the set covers clover -> needle star
EMO = {  # key: (n, k, colour[, body = inner radius 0..1, overrides the keyframe ri])
    'fear':    (3, 4/6, '#C8FF3D'),
    'joy':     (4, 1/6, '#FFD23F'),
    'cry':     (5, 2/6, '#3FC8F5'),
    'release': (6, 0,   '#3DDC97'),
    'shame':   (7, 3/6, '#FF9F1C'),
    'anger':   (8, 1,   '#FF5A36'),
    'press':   (9, 1,   '#9B6BFF', .5),  # needle tips, chunky body: short spikes
}

# ---- shape.js, ported 1:1 -----------------------------------------------------
KEYS = [
    (0,   (1, 0, 0), .42, .55),  # clover
    (.34, (0, 1, 0), .74, 1.1),  # soft square
    (.67, (0, 1, 0), .24, 3.2),  # rounded star
    (1,   (0, 0, 1), .07, 2.6),  # needle star
]
lerp = lambda a, b, t: a + (b - a) * t

def params(k, body=None):
    """body (optional) overrides the inner radius ri: bigger body = shorter spikes, same tip character."""
    k = min(1, max(0, k))
    i = 0
    while i < len(KEYS) - 2 and k > KEYS[i + 1][0]: i += 1
    A, B = KEYS[i], KEYS[i + 1]
    t = (k - A[0]) / (B[0] - A[0]); s = t * t * (3 - 2 * t)
    return [lerp(a, b, s) for a, b in zip(A[1], B[1])], lerp(A[2], B[2], s) if body is None else body, lerp(A[3], B[3], s)

def radius(a, n, P):
    w, ri, p = P
    f = (a * n / (2 * math.pi)) % 1
    d = min(f, 1 - f)
    g = w[0] * math.cos(math.pi * d) + w[1] * (.5 + .5 * math.cos(2 * math.pi * d)) + w[2] * (1 - 2 * d)
    return ri + (1 - ri) * max(g, 0) ** p

# ---- outline in mm -----------------------------------------------------------
def outline(n, k, body=None):
    """angles + radii (mm), scaled so the outline's bbox fits BOX. 0 rad = tip up."""
    P, steps = params(k, body), n * STEPS_PER_POINT
    ang = [2 * math.pi * i / steps for i in range(steps)]
    r = [radius(a, n, P) for a in ang]
    xs = [ri * math.sin(a) for ri, a in zip(r, ang)]; ys = [ri * math.cos(a) for ri, a in zip(r, ang)]
    s = BOX / max(max(xs) - min(xs), max(ys) - min(ys))
    tip = s * radius(0, n, P)
    # printability = union with one tapered spine per spike; adds material only where too thin
    core = POCKET_D / 2 + POCKET_WALL + EDGE_R if POCKET_D else 0
    return ang, [max(ri * s, spine(a, n, tip), core) for ri, a in zip(r, ang)]

def spine(a, n, tip):
    """polar radius of a tapered spine along the nearest tip axis: half-width SPINE_BASE/2 at the
    centre narrowing to TIP_W/2 at a round end that touches the apex."""
    h, hb = TIP_W / 2, SPINE_BASE / 2; L = tip - h
    f = (a * n / (2 * math.pi)) % 1
    d = 2 * math.pi / n * min(f, 1 - f)                    # angle from the nearest tip axis
    sd, cd = math.sin(d), math.cos(d)
    den = sd - (h - hb) * cd / L                           # ray vs side line x = hb + (h-hb) y/L
    if den > 0 and hb / den * cd <= L: return hb / den     # leaves through the tapered side
    return L * cd + math.sqrt(max(h * h - (L * sd) ** 2, 0))  # leaves through the round end

def tip_width(ang, r):
    """width of the up-pointing tip TIP_DEPTH below its apex (symmetric, so 2*x)."""
    y0 = r[0] - TIP_DEPTH
    for i in range(1, len(ang) // 2):
        x1, y1 = r[i - 1] * math.sin(ang[i - 1]), r[i - 1] * math.cos(ang[i - 1])
        x2, y2 = r[i] * math.sin(ang[i]), r[i] * math.cos(ang[i])
        if y2 <= y0 <= y1:
            return 2 * (x1 + (x2 - x1) * (y1 - y0) / (y1 - y2 or 1))
    return 0

# ---- mesh ---------------------------------------------------------------------
def layer(ang, r, e, z, yc):
    """outline inset by e at height z, cut at y = yc. Returns the open boundary (clockwise) from the
    right cut point round the bottom to the left cut point; the cut edge itself is left to the barrel."""
    m = len(ang)
    pts = [((ri - e) * math.sin(a), (ri - e) * math.cos(a)) for ri, a in zip(r, ang)]
    above = lambda q: q[1] > yc
    assert above(pts[0]), 'top tip must reach above the cut'
    f = 0
    while above(pts[(f + 1) % m]): f += 1
    b = 0
    while above(pts[(b - 1) % m]): b -= 1
    def cut(p, q):                                          # point on segment p->q at y = yc (y set exactly)
        return (p[0] + (q[0] - p[0]) * (p[1] - yc) / (p[1] - q[1]), yc, z)
    right = cut(pts[f % m], pts[(f + 1) % m]); left = cut(pts[b % m], pts[(b - 1) % m])
    return [right] + [(*pts[i % m], z) for i in range(f + 1, m + b)] + [left]

def zip_strips(A, B):
    """walls between two open polylines of different length with matching ends (lower A, upper B)."""
    tris, i, j, na, nb = [], 0, 0, len(A) - 1, len(B) - 1
    d = lambda p, q: (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2
    while i < na or j < nb:
        if j == nb or (i < na and d(A[i + 1], B[j]) < d(A[i], B[j + 1])):
            tris.append((A[i], B[j], A[i + 1])); i += 1
        else:
            tris.append((A[i], B[j], B[j + 1])); j += 1
    return tris

def earclip(P):
    """triangulate a simple anticlockwise polygon (list of 2D points). Returns index triples."""
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    idx, tris = list(range(len(P))), []
    reflex = {i for i in idx if cr(P[i - 1], P[i], P[(i + 1) % len(P)]) <= 0}
    # ponytail: O(n * reflex) ear clipping, ~1 s per pendant; a real CDT lib if outlines get much denser
    i, miss, eps = 0, 0, 1e-12
    while len(idx) > 3:
        n = len(idx); i %= n
        a, b, c = idx[i - 1], idx[i], idx[(i + 1) % n]
        A, B, C = P[a], P[b], P[c]
        ok = cr(A, B, C) > (eps if miss <= n else -eps)    # stuck on collinear points? accept flat ears
        if ok:
            lo_x, hi_x = min(A[0], B[0], C[0]), max(A[0], B[0], C[0]); lo_y, hi_y = min(A[1], B[1], C[1]), max(A[1], B[1], C[1])
            for q in reflex:
                Q = P[q]
                if q in (a, b, c) or Q in (A, B, C) or not (lo_x <= Q[0] <= hi_x and lo_y <= Q[1] <= hi_y): continue
                if cr(A, B, Q) >= 0 and cr(B, C, Q) >= 0 and cr(C, A, Q) >= 0: ok = False; break
        if ok:
            tris.append((a, b, c)); idx.pop(i); reflex.discard(b); miss = 0; i -= 1
        else:
            i += 1; miss += 1
            assert miss <= 2 * n, 'ear clipping stuck'
    tris.append(tuple(idx))
    return tris

def segs_cross(p, q, r, s):
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    return cr(p, q, r) * cr(p, q, s) < 0 and cr(r, s, p) * cr(r, s, q) < 0

def cap(outer, hole):
    """index triangles for (outer ring minus hole), both given clockwise. Bridge hole -> outer, then ear clip."""
    O, H = outer[::-1], hole                                # outer anticlockwise, hole clockwise
    hi = max(range(len(H)), key=lambda i: H[i][1])          # top of the hole: nearest to the ring's outer arc
    edges = [(O[i], O[(i + 1) % len(O)]) for i in range(len(O))] + [(H[i], H[(i + 1) % len(H)]) for i in range(len(H))]
    for oi in sorted(range(len(O)), key=lambda i: (O[i][0] - H[hi][0]) ** 2 + (O[i][1] - H[hi][1]) ** 2):
        if not any(segs_cross(H[hi], O[oi], a, b) for a, b in edges): break
    # merged polygon: O[..oi], H[hi..hi] (full loop), O[oi..]; indices map back into outer/hole
    ids = [('o', len(O) - 1 - i) for i in range(oi + 1)] + [('h', (hi + j) % len(H)) for j in range(len(H) + 1)] \
          + [('o', len(O) - 1 - i) for i in range(oi, len(O))]
    pts = [outer[k] if t == 'o' else hole[k] for t, k in ids]
    return [tuple(ids[v] for v in t) for t in earclip(pts)]

def facing(tris, normal_of):
    """flip triangles whose normal disagrees with the wanted outward direction normal_of(triangle)."""
    out = []
    for t in tris:
        a, b, c = t
        u = [b[i] - a[i] for i in range(3)]; v = [c[i] - a[i] for i in range(3)]
        n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
        w = normal_of(t)
        out.append(t if sum(p * q for p, q in zip(n, w)) >= 0 else (a, c, b))
    return out

def pendant(n, k, body=None):
    """triangles [(p,q,r)], one watertight shell: the outline cut below its top tip, closed by a barrel
    (a D-profile in y-z, extruded along x) whose front face covers the cut. The chain hole runs along x."""
    ang, r = outline(n, k, body)
    rh = HOLE_D / 2; R = rh + BAIL_WALL
    cut = BAIL_CUT                                          # wide round tips: cut nearer the apex so the barrel stays short
    width = lambda c: (lambda L: L[0][0] - L[-1][0])(layer(ang, r, 0, 0, r[0] - c))
    while cut > EDGE_R + .1 and width(cut) > BAIL_LEN - 2 * BAIL_MARGIN: cut = round(cut - .05, 3)
    yc = r[0] - cut                                         # cut line; the barrel starts here
    zc = R - BAIL_FLAT; Hf = zc + R                         # hole axis height, barrel height
    yb = yc + R; yend = yb + math.sqrt(R * R - zc * zc)     # hole axis y, barrel bottom far edge
    prof = []                                               # (inset, z) per layer, bottom -> top
    for j in range(EDGE_SEGS + 1):
        f = math.pi / 2 * j / EDGE_SEGS
        prof.append((EDGE_R * (1 - math.sin(f)), EDGE_R * (1 - math.cos(f))))
    for j in range(EDGE_SEGS + 1):
        f = math.pi / 2 * j / EDGE_SEGS
        prof.append((EDGE_R * (1 - math.cos(f)), THICK - EDGE_R + EDGE_R * math.sin(f)))
    if EDGE_R == 0: prof = [(0, 0), (0, THICK)]
    strips = [layer(ang, r, e, z, yc) for e, z in prof]
    hw = max(BAIL_LEN, 2 * max(abs(p[0]) for s_ in strips for p in (s_[0], s_[-1])) + 2 * BAIL_MARGIN) / 2
    tris = []
    for A, B in zip(strips, strips[1:]): tris += zip_strips(A, B)          # pendant side walls
    # pendant top/bottom caps: the closed layer polygon (cut edge included), same xy top and bottom
    top, bot = strips[-1], strips[0]
    rp, zp = POCKET_D / 2, min(POCKET_DEPTH, THICK)
    pc = [(rp * math.sin(2 * math.pi * i / HOLE_SEGS), rp * math.cos(2 * math.pi * i / HOLE_SEGS)) for i in range(HOLE_SEGS)]
    def face(ring, z, holed):                               # cap over a layer, optionally minus the pocket circle
        if not holed:
            m_ = len(ring) - 1
            return [tuple(ring[m_ - v] for v in t) for t in earclip([p[:2] for p in ring[::-1]])]
        return [tuple(ring[k_] if t_ == 'o' else (*pc[k_], z) for t_, k_ in v) for v in cap([p[:2] for p in ring], pc)]
    through = POCKET_D and zp >= THICK
    tris += face(top, THICK, through) + face(bot, 0, bool(POCKET_D))
    if POCKET_D:                                            # pocket wall (+ floor unless it goes through)
        zt = THICK if through else zp
        for i in range(HOLE_SEGS):
            q, w = pc[i], pc[(i + 1) % HOLE_SEGS]
            tris += [((*q, 0), (*w, 0), (*w, zt)), ((*q, 0), (*w, zt), (*q, zt))]
            if not through: tris.append(((0, 0, zt), (*q, zt), (*w, zt)))
    # barrel front face (y = yc): rectangle minus the cut section S of the pendant (a U shape)
    L0, R0 = bot[-1], bot[0]
    U = [(-hw, yc, 0)] + [s_[-1] for s_ in strips] + [s_[0] for s_ in strips[::-1]] + [(hw, yc, 0), (hw, yc, Hf), (-hw, yc, Hf)]
    tris += [tuple(U[v] for v in t) for t in earclip([(p[0], p[2]) for p in U])]
    # barrel bottom (z = 0): rectangle, its front edge split where the pendant's bottom cap meets it
    B4 = [(-hw, yc, 0), L0, R0, (hw, yc, 0), (hw, yend, 0), (-hw, yend, 0)]
    tris += [(B4[5], B4[i], B4[i + 1]) for i in range(4)]
    # barrel D-profile in (y, z): front-bottom, bottom-far, arc up to the top, flat top back to the front
    phB = -math.asin(zc / R)
    arc = [(yb + R * math.cos(phB + (math.pi / 2 - phB) * j / ARC_SEGS), zc + R * math.sin(phB + (math.pi / 2 - phB) * j / ARC_SEGS))
           for j in range(ARC_SEGS + 1)]                    # from (yend, 0) to (yb, Hf)
    D = [(yc, 0)] + arc + [(yc, Hf)]                        # anticlockwise in (y, z)
    circ = [(yb + rh * math.sin(2 * math.pi * i / HOLE_SEGS), zc + rh * math.cos(2 * math.pi * i / HOLE_SEGS)) for i in range(HOLE_SEGS)]
    for x in (-hw, hw):                                     # end caps with the hole
        Dr = D[::-1]                                        # cap() wants the outer clockwise
        ct = cap(Dr, circ)
        tris += [tuple((x, *(Dr[k_] if t_ == 'o' else circ[k_])) for t_, k_ in v) for v in ct]
    for q, w in zip(arc, arc[1:] + [(yc, Hf)]):             # arc + flat top
        tris += [((-hw, *q), (hw, *q), (hw, *w)), ((-hw, *q), (hw, *w), (-hw, *w))]
    for i in range(HOLE_SEGS):                              # chain channel
        q, w = circ[i], circ[(i + 1) % HOLE_SEGS]
        tris += [((-hw, *q), (hw, *q), (hw, *w)), ((-hw, *q), (hw, *w), (-hw, *w))]
    # orient every triangle outward: pendant by its layer centre, barrel by the hole axis / plane
    def outward(t):
        cx, cy, cz = (sum(p[i] for p in t) / 3 for i in range(3))
        if POCKET_D and all(p[0] ** 2 + p[1] ** 2 <= (POCKET_D / 2) ** 2 + 1e-6 for p in t):
            flat_z = abs(t[0][2] - t[1][2]) + abs(t[0][2] - t[2][2]) < 1e-9
            if not (flat_z and t[0][2] in (0, THICK)):     # pocket floor faces down, its wall faces the axis
                return (0, 0, -1) if flat_z else (-cx, -cy, 0)
        flat = [abs(t[0][i] - t[1][i]) + abs(t[0][i] - t[2][i]) < 1e-9 for i in range(3)]
        if flat[2]: return (0, 0, 1 if cz > THICK / 2 or (cy > yc and cz > Hf / 2) else -1)
        if flat[0]: return (1 if cx > 0 else -1, 0, 0)
        if flat[1] and abs(cy - yc) < 1e-9: return (0, -1, 0)
        if cy > yc - 1e-9 and abs(cx) <= hw + 1e-9:         # barrel curved surfaces
            dy, dz = cy - yb, cz - zc
            inside_hole = dy * dy + dz * dz < (rh + 1e-6) ** 2
            return (0, -dy, -dz) if inside_hole else (0, dy, dz)
        return (cx, cy, 0)                                  # pendant wall: away from the centre
    return facing(tris, outward)

def moved(tris, ox, oy):
    return [tuple((p[0] + ox, p[1] + oy, p[2]) for p in t) for t in tris]

def check(tris):
    """watertight = every edge used exactly twice, once in each direction; volume > 0."""
    edges = {}
    for t in tris:
        for e in ((t[0], t[1]), (t[1], t[2]), (t[2], t[0])):
            edges[e] = edges.get(e, 0) + 1
    tight = all(c == 1 and edges.get((b, a)) == 1 for (a, b), c in edges.items())
    vol = sum((a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0])
               + a[2] * (b[0] * c[1] - b[1] * c[0])) for a, b, c in tris) / 6
    return tight, vol

def write_stl(path, tris):
    with open(path, 'wb') as f:
        f.write(b'WHEEP pendant'.ljust(80, b' ') + struct.pack('<I', len(tris)))
        for a, b, c in tris:
            u = [b[i] - a[i] for i in range(3)]; v = [c[i] - a[i] for i in range(3)]
            nx, ny, nz = u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]
            l = math.sqrt(nx * nx + ny * ny + nz * nz) or 1
            f.write(struct.pack('<12fH', nx / l, ny / l, nz / l, *a, *b, *c, 0))

# ---- preview --------------------------------------------------------------------
def preview(path, parts):
    from PIL import Image, ImageDraw
    W, H, S = 1600, 1000, 8.5
    img = Image.new('RGB', (W, H), '#111111'); dr = ImageDraw.Draw(img)
    tilt = math.radians(50)                                   # look down at the plate
    ct, st = math.cos(tilt), math.sin(tilt)
    cyw, syw = math.cos(math.radians(30)), math.sin(math.radians(30))   # turn so the barrel ends show
    light = (-.35, -.55, .76)
    xs = [p[0] for _, tris in parts for t in tris for p in t]; ys = [p[1] for _, tris in parts for t in tris for p in t]
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    faces = []
    for col, tris in parts:
        rgb = tuple(int(col[i:i + 2], 16) for i in (1, 3, 5))
        for a, b, c in tris:
            u = [b[i] - a[i] for i in range(3)]; v = [c[i] - a[i] for i in range(3)]
            nrm = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
            # view-space: rotate about x so +y goes away from the camera
            pts, depth = [], 0
            for x, y, z in (a, b, c):
                x, y = x - cx, y - cy
                x, y = x * cyw - y * syw, x * syw + y * cyw
                vy, vz = y * ct - z * st, y * st + z * ct
                pts.append((W / 2 + x * S, H / 2 - vy * S)); depth += vz
            nx, ny = nrm[0] * cyw - nrm[1] * syw, nrm[0] * syw + nrm[1] * cyw
            vn = (nx, ny * ct - nrm[2] * st, ny * st + nrm[2] * ct)
            if vn[2] <= 0: continue                           # back-face cull (camera looks down -z)
            l = math.sqrt(sum(q * q for q in vn)) or 1
            sh = .35 + .65 * max(0, sum(q * w for q, w in zip(vn, light)) / l)
            faces.append((depth, pts, tuple(int(ch * sh) for ch in rgb)))
    for _, pts, fill in sorted(faces, key=lambda f: f[0]):  # painter's: far first
        dr.polygon(pts, fill=fill)
    img.save(path)

# ---- main ---------------------------------------------------------------------
if __name__ == '__main__':
    out = os.path.dirname(os.path.abspath(__file__))
    plate, parts = [], []
    print(f"{'emotion':8} {'n':>2} {'k':>6} {'tip mm':>6} {'body mm':>9} {'tris':>6} tight  vol mm3")
    for idx, (name, (n, k, col, *body)) in enumerate(EMO.items()):
        body = body[0] if body else None
        ang, r = outline(n, k, body)
        tris = pendant(n, k, body=body)
        tight, vol = check(tris)
        assert tight and vol > 0 and tip_width(ang, r) >= TIP_W - .01, name  # .01 = chord sampling error
        write_stl(os.path.join(out, f'pendant_{idx + 1}_{name}_n{n}.stl'), tris)
        ox, oy = (idx % PLATE_COLS) * SPACING, -(idx // PLATE_COLS) * SPACING
        placed = moved(tris, ox, oy)
        plate += placed; parts.append((col, placed))
        print(f"{name:8} {n:>2} {k:>6.3f} {tip_width(ang, r):>6.2f} {min(r):>9.2f} {len(tris):>6} {tight!s:5} {vol:8.0f}")
    tight, vol = check(plate)
    assert tight, 'plate'
    write_stl(os.path.join(out, 'plate_all.stl'), plate)
    print(f"plate: {len(plate)} tris, watertight={tight}, {vol:.0f} mm3")
    preview(os.path.join(out, 'preview.png'), parts)
    flip = lambda tris: [tuple((-p[0], p[1], -p[2]) for p in t) for t in tris]   # turned over: shows the pocket
    preview(os.path.join(out, 'preview_back.png'), [(c, flip(t)) for c, t in parts])
