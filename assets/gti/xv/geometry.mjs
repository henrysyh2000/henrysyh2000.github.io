// Copied from _tools/gti/exploded/geometry.mjs by build.mjs; edit that file and rebuild.
// Geometry of the EA888 evo4 exploded view: every part, drawn with the Anatomy kit for one projection.
// Shared by the build (_tools/gti/exploded/build.mjs, Node) and the page, which imports a copy from
// assets/gti/xv/ to redraw the engine when the reader turns it. It has no imports of its own: the caller passes
// the kit modules (iso-kit.mjs as k, lathe.mjs as G, tube.mjs as TB).
//
// World units are millimetres. x runs along the crankshaft (cylinder 1 at the timing end, -x; flywheel at +x),
// y across the engine (intake side +y), z up; the crankshaft axis is z = 0.

export function makeGeometry({ k, G, TB, turboZ = 258 }) {
  // ---------------------------------------------------------------- truth
  const SPEC = {
    bore: 82.5, // M1 PDF 18/20
    stroke: 92.8, // M1 PDF 18/20
    main: 48.0, // M1 PDF 22, LK1/LK2 basic size
    pin: 47.8, // M1 PDF 22
    pistonGauge: 82.42, // M1 PDF 22
    intakeValve: { head: 33.85, stem: 5.92, length: 103.97 }, // M1 PDF 24
    exhaustValve: { head: 28.0, stem: 5.92, length: 101.87 }, // M1 PDF 24
    seat: 45, // M1 PDF 24, dimension d
  };
  // Illustrative layout inputs: none of these is printed in the documents read.
  const LAYOUT = {
    pitch: 88, // cylinder spacing: about 88 mm, scaled from the M1 PDF 129 deck drawing against the 82.5 mm bore
    rod: 144, // connecting-rod centre distance: not printed; drawing value inside the 140-160 mm range the M1 PDF 128 render allows
    compressionHeight: 32, // pin centre to crown
    skirtBelowPin: 30,
    crankAngle: 90, // frozen pose: 90 degrees after cylinder 1 TDC, so all four pistons stand level
    deck: 222,
  };
  const R = SPEC.stroke / 2;
  const XC = [-1.5, -0.5, 0.5, 1.5].map((n) => n * LAYOUT.pitch);
  const XM = [-2, -1, 0, 1, 2].map((n) => n * LAYOUT.pitch);
  const THROW = [0, 180, 180, 0]; // throws 1/4 together, 2/3 opposite
  const theta = (cyl) => ((LAYOUT.crankAngle + THROW[cyl]) * Math.PI) / 180;
  const pinCentre = (cyl) => [XC[cyl], R * Math.sin(theta(cyl)), R * Math.cos(theta(cyl))];
  const pistonPinZ = (cyl) => {
    const t = theta(cyl);
    return R * Math.cos(t) + Math.sqrt(LAYOUT.rod ** 2 - (R * Math.sin(t)) ** 2);
  };
  const crownZ = (cyl) => pistonPinZ(cyl) + LAYOUT.compressionHeight;

  // Turbocharger axis height: the outlet pad on the head and the turbocharger follow it.
  const TURBO_Z = turboZ;

  // ---------------------------------------------------------------- helpers
  const S = (paths, o) => k.solidSvg(paths, o);
  const Ln = (d, o) => k.lineSvg(d, o);
  const Dots = (pts, o) => k.dotsSvg(pts, o);
  const frameX = (x = 0, y = 0, z = 0) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const frameZ = (x, y, z = 0) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const mat = (m, svg) => `<g data-mat="${m}">${svg}</g>`;
  const circle = (cx, cy, r, n = 40) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);

  let P = null;
  const items = []; // { layer, depth, svg }
  const bounds = {}; // per layer z envelope at rest
  const put = (layer, depth, svg) => items.push({ layer, depth, svg });
  const envelope = (layer, z0, z1) => {
    const b = (bounds[layer] ||= [Infinity, -Infinity]);
    b[0] = Math.min(b[0], z0);
    b[1] = Math.max(b[1], z1);
  };
  const depthAt = (x, y, z) => k.depthOf([x, y, z], P);
  // True when a face with outward normal n is turned toward the viewer; details drawn on a face use it, so they never show
  // through the solid from the other side when the figure turns.
  const faces = (n) => k.depthOf(n, P) - k.depthOf([0, 0, 0], P) > 1e-6;
  // Order a part after (n facing the viewer) or before (n facing away) the solid it is mounted on.
  const side = (n, front, back) => (faces(n) ? front : back);
  const at = (p) => k.iso(p, P);
  const poly = (pts3, closed = true) => k.pathOf(pts3.map(at), closed);
  // clip a convex screen polygon to another convex screen polygon (Sutherland-Hodgman); both as [x, y] point lists
  const clipConvex = (subject, win) => {
    // the window's orientation from its signed area (robust for dense polygons such as projected circles)
    let area = 0;
    for (let i = 0; i < win.length; i++) { const a = win[i], b = win[(i + 1) % win.length]; area += a[0] * b[1] - b[0] * a[1]; }
    const sgn = area >= 0 ? 1 : -1;
    let outp = subject;
    for (let i = 0; i < win.length && outp.length; i++) {
      const a = win[i], b = win[(i + 1) % win.length];
      const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      const inp = outp; outp = [];
      for (let j = 0; j < inp.length; j++) {
        const c = inp[j], d = inp[(j + 1) % inp.length], fc = sgn * side(c), fd = sgn * side(d);
        if (fc >= 0) outp.push(c);
        if (fc >= 0 !== fd >= 0) { const s = fc / (fc - fd); outp.push([c[0] + (d[0] - c[0]) * s, c[1] + (d[1] - c[1]) * s]); }
      }
    }
    return outp;
  };

  // A fat cast surface swept along a centre line with a varying radius (the compressor scroll, a housing's dome, a bulge
  // on a wall), cut into short segments whose patches are toned by their facing in twelve smooth bands, from the shadowed
  // flank to the lit crest, so it reads round at any angle. Normals follow the radius's slope, so a sweep along a straight
  // axis is a shaded surface of revolution. Returns { depth, svg } pieces for the caller's own ordering: one per segment,
  // or with fine: true one per patch and per contour stroke, so two such surfaces that meet can be ordered patch by patch.
  // clip(p) >= 0 keeps the part of the surface standing proud of a wall; cap closes the first ring with a flat end.
  const sweepPieces = (centres, radii, { steps = 40, cap = false, tone = "hi", occlusion = null, fine = false, clip = null, gloss = 0.22, cls = "gti-xv-v", frames: given = null, section = null, lightDir = null } = {}) => {
    const n = centres.length;
    const V = G.viewOf(P), L = lightDir ? G.unit3(lightDir) : G.lightOf(P);
    const H = G.unit3(G.add3(L, V));
    const T = centres.map((_, i) => G.unit3(G.sub3(centres[Math.min(i + 1, n - 1)], centres[Math.max(i - 1, 0)])));
    const slope = centres.map((_, i) => { const a = Math.max(i - 1, 0), b = Math.min(i + 1, n - 1); return (radii[b] - radii[a]) / (G.len3(G.sub3(centres[b], centres[a])) || 1); });
    const seed = Math.abs(T[0][2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let N = G.unit3(G.sub3(seed, G.mul3(T[0], G.dot3(seed, T[0]))));
    // frames: carried along the line by parallel transport, or given ring by ring (frames[i] = [E1, E2])
    const frames = given || T.map((t, i) => {
      if (i) N = G.unit3(G.sub3(N, G.mul3(t, G.dot3(N, t))));
      return [N, G.cross3(t, N)];
    });
    // a broad wrap of light (no flank goes black), a highlight along the crest, and less light where the surface turns
    // in toward a hollow (occlusion(point, normal) gives 0..1)
    const light = (nrm, p) => 0.46 + 0.4 * G.dot3(nrm, L) + gloss * Math.pow(Math.max(0, G.dot3(nrm, H)), 30) - (occlusion ? 0.3 * occlusion(p, nrm) : 0);
    const STEPS = 12;
    const band = (v) => Math.max(0, Math.min(STEPS - 1, Math.floor(v * STEPS)));
    // the section: a circle of the ring's radius, or section(i, angle) = { x, y, nx, ny } in the ring's frame
    const rings = centres.map((c, i) => Array.from({ length: steps }, (_, j) => {
      const a = (j / steps) * 2 * Math.PI;
      let p, nrm;
      if (section) {
        const s = section(i, a);
        p = G.add3(c, G.add3(G.mul3(frames[i][0], s.x), G.mul3(frames[i][1], s.y)));
        nrm = G.unit3(G.add3(G.mul3(frames[i][0], s.nx), G.mul3(frames[i][1], s.ny)));
      } else {
        const radial = G.add3(G.mul3(frames[i][0], Math.cos(a)), G.mul3(frames[i][1], Math.sin(a)));
        nrm = G.unit3(G.sub3(radial, G.mul3(T[i], slope[i])));
        p = G.add3(c, G.mul3(radial, radii[i]));
      }
      return { p, nrm, q: at(p), t: light(nrm, p) };
    }));
    // clip a polygon of corners {p, q, t} where f >= 0, interpolating position, projection and light
    const clipBy = (pg, f, in3d) => {
      const res = [];
      for (let i = 0; i < pg.length; i++) {
        const a = pg[i], b = pg[(i + 1) % pg.length], fa = f(a), fb = f(b);
        if (fa >= 0) res.push(a);
        if (fa >= 0 !== fb >= 0) {
          const s = fa / (fa - fb);
          const p = in3d ? G.lerp3(a.p, b.p, s) : null;
          res.push({ p, q: in3d ? at(p) : [a.q[0] + (b.q[0] - a.q[0]) * s, a.q[1] + (b.q[1] - a.q[1]) * s], t: a.t + (b.t - a.t) * s });
        }
      }
      return res;
    };
    const bandsOf = (pg) => {
      const parts = [];
      const k0 = band(Math.min(...pg.map((v) => v.t))), k1 = band(Math.max(...pg.map((v) => v.t)));
      for (let b = k0; b <= k1; b++) {
        let part = pg;
        if (b > k0) part = clipBy(part, (v) => v.t - b / STEPS);
        if (b < k1) part = clipBy(part, (v) => (b + 1) / STEPS - v.t);
        if (part.length > 2) parts.push([b, k.pathOf(part.map((v) => v.q), true)]);
      }
      return parts;
    };
    const out = [];
    for (let i = 0; i < n - 1; i++) {
      const buckets = Array.from({ length: STEPS }, () => []);
      const seen = [];
      for (let j = 0; j < steps; j++) {
        let q = [rings[i][j], rings[i + 1][j], rings[i + 1][(j + 1) % steps], rings[i][(j + 1) % steps]];
        const nrm = G.unit3(q.reduce((s, c) => G.add3(s, c.nrm), [0, 0, 0]));
        seen.push(G.dot3(nrm, V) > 0);
        if (!seen[j]) continue;
        if (clip) { q = clipBy(q, (v) => clip(v.p), true); if (q.length < 3) continue; }
        const parts = bandsOf(q);
        if (fine) {
          const d = depthAt(...G.lerp3(q[0].p, q[Math.floor(q.length / 2)].p, 0.5));
          for (const [b, path] of parts) out.push({ depth: d, svg: `<path class="${cls}" data-v="${b}" d="${path}"/>` });
        } else for (const [b, path] of parts) buckets[b].push(path);
      }
      // the contour: on each ring, the points where the surface turns from the viewer (interpolated between samples),
      // joined to the nearest such point on the next ring, so the outline runs on without breaks
      const turns = (ring) => {
        const f = ring.map((c) => G.dot3(c.nrm, V));
        const pts = [];
        for (let j = 0; j < steps; j++) {
          const a = f[j], b = f[(j + 1) % steps];
          if (a > 0 !== b > 0) {
            const s = a / (a - b), c0 = ring[j], c1 = ring[(j + 1) % steps];
            const p = G.lerp3(c0.p, c1.p, s);
            if (!clip || clip(p) >= 0) pts.push({ p, q: [c0.q[0] + (c1.q[0] - c0.q[0]) * s, c0.q[1] + (c1.q[1] - c0.q[1]) * s] });
          }
        }
        return pts;
      };
      const here = turns(rings[i]), next = turns(rings[i + 1]);
      const lines = [];
      for (const p0 of here) {
        if (!next.length) break;
        const p1 = next.reduce((best, c) => (Math.hypot(c.q[0] - p0.q[0], c.q[1] - p0.q[1]) < Math.hypot(best.q[0] - p0.q[0], best.q[1] - p0.q[1]) ? c : best));
        lines.push([p0, p1]);
      }
      let svg = buckets.map((b, s) => (b.length ? `<path class="${cls}" data-v="${s}" d="${b.join("")}"/>` : "")).join("");
      for (const [ri, dir] of cap ? [[0, -1], [n - 1, 1]] : []) {
        if (ri !== (dir < 0 ? i : i + 1)) continue;
        const end = rings[ri];
        const out0 = G.mul3(T[ri], dir);
        if (G.dot3(out0, V) > 0) {
          const cp = `<path class="${cls}" data-v="${band(light(out0, centres[ri]))}" d="${k.pathOf(end.map((c) => c.q), true)}"/>` + Ln(k.pathOf(end.map((c) => c.q), true), { tone, className: "iso-edge" });
          if (fine) out.push({ depth: depthAt(...centres[ri]), svg: cp }); else svg += cp;
        } else {
          const front = end.filter((_, j) => seen[j] || seen[(j + steps - 1) % steps]);
          if (front.length > 1) lines.push(front);
        }
      }
      const mid = G.lerp3(centres[i], centres[i + 1], 0.5);
      const r = (radii[i] + radii[i + 1]) / 2;
      if (!fine) out.push({ depth: depthAt(...mid) + r, svg });
      // the contour goes on after the neighbouring patches, which would otherwise cover half of it
      for (const ln of lines) {
        const d = Ln(k.pathOf(ln.map((c) => c.q)), { tone, className: "iso-edge" });
        out.push({ depth: fine ? depthAt(...G.lerp3(ln[0].p, ln[ln.length - 1].p, 0.5)) + 3 : depthAt(...mid) + 2 * r, svg: d });
      }
    }
    return out;
  };

  // A vertical helix (valve spring), split into the turns facing the viewer and those behind.
  function helix(cx, cy, r, z0, z1, turns, perTurn = 18) {
    const n = Math.round(turns * perTurn);
    const a0 = Math.atan2(Math.sin((P.azimuth * Math.PI) / 180), Math.cos((P.azimuth * Math.PI) / 180)) + 0.6;
    const back = [];
    const front = [];
    let run = [];
    let near = null;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * turns * 2 * Math.PI;
      const p = at([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + ((z1 - z0) * i) / n]);
      const facing = k.depthOf([Math.cos(a), Math.sin(a), 0], P) > 0;
      if (near === null) near = facing;
      if (facing !== near) {
        run.push(p);
        (near ? front : back).push(k.pathOf(run));
        run = [p];
        near = facing;
        continue;
      }
      run.push(p);
    }
    if (run.length > 1) (near ? front : back).push(k.pathOf(run));
    return { back: back.join(""), front: front.join("") };
  }

  // A ring of points on a vertical face x = const (for openings drawn on an end face).
  const ringOnX = (x, cy, cz, ry, rz = ry, n = 36) => k.pathOf(Array.from({ length: n }, (_, i) => at([x, cy + ry * Math.cos((i / n) * 2 * Math.PI), cz + rz * Math.sin((i / n) * 2 * Math.PI)])), true);
  const ringOnY = (y, cx, cz, rx, rz = rx, n = 36) => k.pathOf(Array.from({ length: n }, (_, i) => at([cx + rx * Math.cos((i / n) * 2 * Math.PI), y, cz + rz * Math.sin((i / n) * 2 * Math.PI)])), true);

  // ---------------------------------------------------------------- 01 cylinder head cover (camshaft housing) (M1 PDF 189-190)
  // Also carries the upper timing chain cover at the timing end (M1 PDF 157-160) with the oil filler cap, and the oil
  // dipstick beside it.
  function cover() {
    const L = "cover";
    const z0 = 300, flange = 306, body = 326, hump = 22, zc = 322;
    envelope(L, z0, zc + hump + 22);
    const plan = { x: -212, y: -80, w: 400, d: 160, r: 12 };
    const inner = { x: -204, y: -70, w: 384, d: 140, r: 10 };
    const base = [];
    base.push(S(k.slabOf(plan, z0, flange - z0, P, 8, 0.6), { tone: "hi" }));
    const bolts = [];
    for (let i = 0; i < 9; i++) bolts.push([-194 + i * 48.5, -75], [-194 + i * 48.5, 75]);
    bolts.push([-202, -30], [-202, 30], [194, -30], [194, 30]);
    base.push(Dots(bolts.map(([x, y]) => at([x, y, flange])), { size: 0.55, tone: "hi" }));
    base.push(S(k.slabOf(inner, flange, body - flange, P, 8, 0.8), { tone: "hi" }));
    if (faces([0, -1, 0])) for (const x of XM.filter((x) => x < 170)) base.push(Ln(k.pathOf([at([x, inner.y, flange]), at([x, inner.y, body])]), { tone: "lo" }));
    put(L, -1e6, base.join(""));
    // upper timing chain cover at the timing end, over both camshaft adjusters (M1 PDF 158-160): six bolts, a raised
    // boss over the intake camshaft adjuster N205 carries the oil filler neck (M1 PDF 384, 389; S2 E p.1, 7, 24)
    const front = G.hullOf([[-80, 228], [72, 228], [72, 300], [-80, 298], ...circle(-31, 320, 27, 32), ...circle(31, 322, 26, 32)]);
    const tcDepth = depthAt(-232, 0, zc) - 1e5;
    put(L, tcDepth, S(G.prismOf(frameX(), front, -234, -212, P), { tone: "hi" }) + (faces([-1, 0, 0]) ? Dots([[-60, 236], [56, 236], [-78, 290], [70, 296], [-52, 344], [10, 350]].map(([y, z]) => at([-234, y, z])), { size: 0.55, tone: "hi" }) : ""));
    // oil filler cap and seal on the upper timing chain cover above N205, on a neck at the cover's intake-side top corner
    // (M1 PDF 158 items 11-13; the cover drawing A15-12441, PDF 159, puts the filler neck at that corner)
    {
      const cx = -219, cy = 60, cz = 324;
      const neck = S(k.cylinder(cx, cy, 17, cz, 24, P, 32, 0.4), { tone: "hi" });
      const c = S(k.cylinder(cx, cy, 23, cz + 24, 24, P, 40, 0.6), { tone: "hi" }) + Ln(k.knurl(cx, cy, 23, cz + 24, cz + 48, 40, P), { tone: "lo" }) + S(k.cylinder(cx, cy, 19, cz + 48, 5, P, 36, 0.6), { tone: "hi" });
      put(L, tcDepth + 1, neck + mat("plastic", c));
    }
    // oil dipstick: oval handle on a short shank, its guide tube climbing the intake-side edge of the timing chain cover
    // (M1 PDF 94, 158-160, 384; S2 E p.24). The tube's lower run across the timing end is hidden from this side, and the
    // dipstick is pulled before the covers come off, so it shows only with the engine assembled.
    {
      const dx = -222, dy = 86;
      let d = "";
      TB.tubePieces([[dx, dy, 286], [dx, dy, 330]], 4.5, P, { maxLength: 40 }).forEach((pc) => (d += mat("plastic", TB.tubeSvg(pc, { tone: "hi" }))));
      d += mat("yellow", S(k.cylinder(dx, dy, 5.5, 330, 6, P, 24, 0.3), { tone: "hi" }) + S(k.cylinder(dx, dy, 3, 336, 8, P, 16, 0.2), { tone: "hi" }));
      const loop = Array.from({ length: 25 }, (_, i) => { const t = -Math.PI / 2 + (i / 24) * 2 * Math.PI; return [dx, dy + 8 * Math.cos(t), 356 + 12 * Math.sin(t)]; });
      TB.tubePieces(loop, 2.6, P, { maxLength: 10 }).forEach((pc) => (d += mat("yellow", TB.tubeSvg(pc, { tone: "hi" }))));
      put(L, depthAt(dx, dy, 320) - 1e5, `<g class="gti-xv-assembled-only">${d}</g>`);
    }
    const humpOf = (y) => {
      const profile = G.hullOf([...circle(y, zc + 4, hump - 2, 40).filter(([, z]) => z >= zc + 4), [y - hump + 2, body], [y + hump - 2, body]]);
      const parts = [S(G.prismOf(frameX(), profile, -196, 188, P), { tone: "hi" })];
      const V = G.viewOf(P);
      const ring = G.hullOf(profile);
      const area = ring.reduce((sum, [p0, q0], j) => sum + p0 * ring[(j + 1) % ring.length][1] - ring[(j + 1) % ring.length][0] * q0, 0);
      const facing = ring.map((a, i) => {
        const b = ring[(i + 1) % ring.length];
        const n = area > 0 ? [b[1] - a[1], -(b[0] - a[0])] : [-(b[1] - a[1]), b[0] - a[0]];
        return (a[1] > body + 0.5 || b[1] > body + 0.5) && n[0] * V[1] + n[1] * V[2] > 1e-6;
      });
      const runs = [];
      let run = [];
      for (let i = 0; i < ring.length * 2; i++) {
        const j = i % ring.length;
        if (facing[j]) {
          if (!run.length) run.push(ring[j]);
          run.push(ring[(j + 1) % ring.length]);
        } else if (run.length) {
          runs.push(run);
          run = [];
          if (i >= ring.length) break;
        }
      }
      const arc = runs.sort((a, b) => b.length - a.length)[0] || [];
      for (const x of XM) parts.push(Ln(k.pathOf(arc.map(([yy, zz]) => at([x, yy, zz]))), { tone: "lo" }));
      return parts.join("");
    };
    const hd = (y) => depthAt(0, y, zc) - 1e5;
    put(L, hd(31), humpOf(31));
    put(L, hd(0), [...XC.map((x) => Ln(k.ring(x, 0, 10, body, P, 28), { tone: "mid" }) + Ln(k.ring(x, 0, 6.5, body, P, 24), { tone: "lo" }))].join(""));
    // two thread-cutting ball pins for the engine cover (M1 PDF 190 item 19): on the coil row between cylinders 1 and 2,
    // and beyond cylinder 4 on the exhaust side (positions after M1 PDF 196, 250)
    const ballPin = (x, y, z0, h) => S(k.cylinder(x, y, 3.5, z0, h, P, 16, 0.2), { tone: "mid" }) + S(k.cylinder(x, y, 5.5, z0 + h, 7, P, 20, 0.5), { tone: "hi" });
    put(L, hd(0) + 1, mat("plastic", ballPin(-88, 0, body, 26)));
    put(L, hd(-31) + 2, mat("plastic", ballPin(170, -40, zc + hump - 3, 20)));
    put(L, hd(-31), humpOf(-31));
    // eight cam adjustment actuators F366-F373 stand on the exhaust hump
    XC.forEach((x) => {
      for (const dx of [-14, 14]) {
        const svg = S(k.cylinder(x + dx, -31, 7, zc + hump + 1, 9, P, 28, 0.4), { tone: "mid" }) + S(k.slabOf({ x: x + dx - 4, y: -31 - 13, w: 8, d: 7, r: 1.5 }, zc + hump + 3, 6, P, 3, 0.3), { tone: "mid" }) + Dots([at([x + dx, -31, zc + hump + 10])], { size: 0.55, tone: "hi" });
        put(L, hd(-31) + 1 + depthAt(x + dx, 0, 0) * 1e-4, svg);
      }
    });
  }

  // ---------------------------------------------------------------- 02 camshafts (M1 PDF 189, A15-12264)
  // Both camshafts as in the manual's component view: the camshaft adjuster with its sprocket at the timing end, five
  // bearing journals, and for each cylinder a pair of lobes on the intake camshaft and, on the exhaust camshaft, a sliding
  // cam piece carrying two lobe pairs (two lift profiles for each valve) with the groove the cam adjustment actuators run
  // in. At the transmission end the intake camshaft carries a four-pointed wheel, the exhaust camshaft a plain drive end.
  // Every lobe, journal and shaft segment is a solid of its own, drawn far to near, so no part of a far lobe is hidden by
  // the shaft. Lobe shapes, lifts and phasing (firing order 1-3-4-2 at half crank speed) are illustrative, not measured.
  function cams() {
    const L = "cams";
    const zc = 322;
    envelope(L, zc - 40, zc + 40);
    const SHAFT_R = 12, X0 = -200, X1 = 192;
    for (const [y, side] of [[-31, "ex"], [31, "in"]]) {
      const F = frameX(0, y, zc);
      const parts = []; // { x0, x1, r (the radius it covers the shaft with), svg }
      // camshaft adjuster (phaser) with its sprocket at the timing end
      parts.push({ x0: -228, x1: -214, r: 24, svg: S(G.disc(-228, -214, 24, F, P, { bevel: 0.6 }), { tone: "mid" }) + Ln(G.ribsOf(F, -214, -228, 24, 34, P, { least: 0.2 }), { tone: "lo" }) + Ln(G.circleOf(F, -228, 9, P, 24), { tone: "mid" }) });
      parts.push({ x0: -214, x1: -200, r: 21, svg: S(G.disc(-214, -200, 21, F, P), { tone: "mid" }) });
      for (const x of XM) parts.push({ x0: x - 6, x1: x + 6, r: 15.5, svg: S(G.disc(x - 6, x + 6, 15.5, F, P), { tone: "hi" }) });
      const camPhase = [0, 270, 90, 180];
      // a lobe: the base circle (r 16.5) and a nose (tip radius rTip at distance e from the axis); full lift about 6.5 mm,
      // the exhaust's second profile about 3 mm (illustrative)
      const lobeAt = (x0, x1, lift, rTip, base) => G.hullOf([...circle(0, 0, 16.5, 36), ...circle(lift * Math.cos(base), lift * Math.sin(base), rTip, 28)]);
      XC.forEach((xc, cyl) => {
        const base = ((camPhase[cyl] + (side === "ex" ? 110 : 0) + LAYOUT.crankAngle / 2) * Math.PI) / 180;
        if (side === "ex") {
          // the sliding cam piece: for each valve a full-lift lobe and a partial-lift lobe side by side
          const lobes = [];
          for (const dx of [-15, 15]) {
            lobes.push([xc + dx - 9, xc + dx - 1, lobeAt(0, 0, 16, 7, base)]);
            lobes.push([xc + dx + 1, xc + dx + 9, lobeAt(0, 0, 12.5, 7, base)]);
          }
          for (const [a, b, shape] of lobes) parts.push({ x0: a, x1: b, r: 16.5, svg: S(G.prismOf(F, shape, a, b, P), { tone: "hi" }) });
          // the piece's sleeve between and beside its lobes; the middle stretch carries the actuators' groove
          const cuts = [[xc - 25, xc - 24], [xc - 16, xc - 14], [xc - 6, xc + 6], [xc + 14, xc + 16], [xc + 24, xc + 25]];
          for (const [a, b] of cuts) {
            let svg = S(G.disc(a, b, 13.5, F, P), { tone: "mid" });
            if (b - a > 6) svg += Ln(G.arcOf(F, xc - 2.5, 13.5, P), { tone: "lo" }) + Ln(G.arcOf(F, xc + 2.5, 13.5, P), { tone: "lo" });
            parts.push({ x0: a, x1: b, r: 13.5, svg });
          }
        } else {
          for (const dx of [-15, 15]) parts.push({ x0: xc + dx - 6, x1: xc + dx + 6, r: 16.5, svg: S(G.prismOf(F, lobeAt(0, 0, 16, 7, base), xc + dx - 6, xc + dx + 6, P), { tone: "hi" }) });
        }
      });
      // the transmission end
      if (side === "in") {
        const star = G.hullOf([...circle(0, 0, 13, 32), ...[0, 1, 2, 3].flatMap((i) => circle(15 * Math.cos(((i + 0.5) * Math.PI) / 2), 15 * Math.sin(((i + 0.5) * Math.PI) / 2), 4, 12))]);
        parts.push({ x0: 178, x1: 186, r: 13, svg: S(G.prismOf(F, star, 178, 186, P), { tone: "hi" }) });
      } else {
        parts.push({ x0: 184, x1: 194, r: 13, svg: S(G.disc(184, 194, 13, F, P, { bevel: 0.4 }), { tone: "hi" }) + (faces([1, 0, 0]) ? `<path class="gti-xv-deep" d="${poly([[194.2, y - 9, zc - 1.5], [194.2, y + 9, zc - 1.5], [194.2, y + 9, zc + 1.5], [194.2, y - 9, zc + 1.5]])}"/>` : "") });
      }
      // shaft segments in the gaps between the parts that cover it
      const covers = parts.filter((p) => p.r >= SHAFT_R).map((p) => [p.x0, p.x1]).sort((a, b) => a[0] - b[0]);
      let cur = X0;
      const gaps = [];
      for (const [a, b] of covers) {
        if (b <= cur) continue;
        if (a > cur + 0.3) gaps.push([cur, Math.min(a, X1)]);
        cur = Math.max(cur, b);
        if (cur >= X1) break;
      }
      if (cur < X1 - 0.3) gaps.push([cur, X1]);
      for (const [a, b] of gaps) if (b > a) parts.push({ x0: a, x1: b, r: SHAFT_R, svg: S(G.disc(a, b, SHAFT_R, F, P), { tone: "hi" }) });
      parts.sort((a, b) => a.x0 + a.x1 - (b.x0 + b.x1)).forEach((p) => put(L, depthAt((p.x0 + p.x1) / 2, y, zc), p.svg));
    }
  }

  // ---------------------------------------------------------------- 03 cylinder head (M1 PDF 142, 189)
  // A casting with chamfered upper shoulders, camshaft bearing saddles and valve-spring wells on top, the intake
  // port face on the +y side, lifting eyes at two corners and the integrated exhaust collector on the -y side.
  const HEAD = { x0: -212, x1: 188 };
  function head() {
    const L = "head";
    const z0 = 225, zs = 262, z1 = 292;
    envelope(L, z0, z1 + 26);
    const section = [[-80, z0], [80, z0], [80, zs], [68, z1], [-80, z1]];
    const out = [S(G.prismOf(frameX(), section, HEAD.x0, HEAD.x1, P), { tone: "hi" })];
    if (faces([0, -1, 0])) {
      out.push(Ln(k.pathOf([at([HEAD.x0, -80, z0 + 9]), at([HEAD.x1, -80, z0 + 9])]), { tone: "faint" }));
    }
    // the top is a tray, as in the manual's head drawing A15-12433 (M1 PDF 142): a sealing rim for the cylinder head cover
    // round a valvetrain bay. The camshafts are not in the head: they run in the cylinder head cover and come off with it
    // (M1 PDF 196-197), so the head has no bearing saddles. In the bay: the valve guide bosses, the bores for the hydraulic
    // lifters, the spark-plug tubes rising to the rim and the head-bolt holes along both sides (bay depth drawn)
    const bay = { x0: HEAD.x0 + 9, x1: HEAD.x1 - 9, y0: -72, y1: 60 }, deep = 12;
    if (faces([0, 0, 1])) {
      const quad = (z) => [[bay.x0, bay.y0, z], [bay.x1, bay.y0, z], [bay.x1, bay.y1, z], [bay.x0, bay.y1, z]].map(at);
      const rim = quad(z1), floor = quad(z1 - deep);
      // the floor seen through the rim's opening: the floor's outline clipped to the opening (both convex, in screen space)
      const seen = clipConvex(floor, rim);
      out.push(`<path class="gti-xv-baywall" d="${k.pathOf(rim, true)}"/>`);
      if (seen.length > 2) out.push(`<path class="gti-xv-bayfloor" d="${k.pathOf(seen, true)}"/>`);
      out.push(Ln(k.pathOf(rim, true), { tone: "mid" }));
      const zf = z1 - deep;
      for (const x of XC) {
        for (const [dx, y] of [[-16, 21], [16, 21], [-15, -21], [15, -21]]) out.push(`<path class="gti-xv-socket" d="${k.cylinder(x + dx, y, 3.2, zf, 0.01, P, 14).fill}"/>` + Ln(k.ring(x + dx, y, 5.5, zf, P, 18), { tone: "hi" }));
        for (const [dx, y] of [[-16, 50], [16, 50], [-15, -50], [15, -50]]) out.push(`<path class="gti-xv-socket" d="${k.cylinder(x + dx, y, 6.5, zf, 0.01, P, 20).fill}"/>` + Ln(k.ring(x + dx, y, 6.5, zf, P, 20), { tone: "hi" }));
        out.push(S(k.cylinder(x, 0, 12, zf, deep + 6, P, 32, 0.4), { tone: "hi" }) + `<path class="gti-xv-socket" d="${k.cylinder(x, 0, 7, z1 + 6, 0.01, P, 24).fill}"/>` + Ln(k.ring(x, 0, 7, z1 + 6, P, 24), { tone: "mid" }));
      }
      for (const x of XM) for (const y of [-62, 52]) out.push(Ln(k.ring(x, y, 5, zf, P, 16), { tone: "lo" }) + `<path class="gti-xv-deep" d="${k.cylinder(x, y, 2.6, zf, 0.01, P, 12).fill}"/>`);
    }
    put(L, 0, out.join(""));
    // intake port face: a machined flange with four ports, each divided by its partition plate
    const yF = 80;
    const flange = [S(k.slabOf({ x: -176, y: yF - 1, w: 352, d: 7, r: 2 }, z0 + 3, zs - z0 - 4, P, 3, 0.4), { tone: "hi" })];
    for (const x of XC) {
      flange.push(`<path class="gti-xv-bore" d="${ringOnY(yF + 6, x, 244, 21, 9, 32)}"/>`, Ln(ringOnY(yF + 6, x, 244, 21, 9, 32), { tone: "hi" }));
      flange.push(Ln(k.pathOf([at([x - 21, yF + 6, 244]), at([x + 21, yF + 6, 244])]), { tone: "mid" }));
    }
    for (const x of XM.slice(1, 4)) flange.push(Dots([at([x, yF + 6, 234]), at([x, yF + 6, 254])], { size: 0.6, tone: "hi" }));
    put(L, side([0, 1, 0], 2, -1), flange.join(""));
    // integrated exhaust collector bulging from the exhaust face, with the turbocharger outlet pad and its four studs
    const bz = Math.min(TURBO_Z, 258) - 4; // exhaust collector centre, lined up with the turbocharger
    const bulge = [[-80, bz - 15], [-80, bz + 15], ...circle(-80, bz, 15, 32).filter(([y]) => y <= -80)];
    const ex = [S(G.prismOf(frameX(), G.hullOf(bulge), -40, 80, P), { tone: "hi" })];
    const padZ = Math.min(TURBO_Z, 258) - 4;
    ex.push(S(k.slabOf({ x: -6, y: -99, w: 52, d: 5, r: 3 }, padZ - 22, 44, P, 4, 0.4), { tone: "hi" }));
    ex.push(Dots([[0, padZ - 16], [40, padZ - 16], [0, padZ + 16], [40, padZ + 16]].map(([x, z]) => at([x, -99, z])), { size: 0.7, tone: "hi" }));
    put(L, side([0, -1, 0], 1, -1.5), ex.join(""));
    // engine lifting eyes (M1 PDF 142 items 3 and 6): one at the timing-end exhaust corner, one at the transmission-end intake corner
    const eye = (x, y) => mat("dark", S(k.slabOf({ x: x - 3, y: y - 18, w: 6, d: 36, r: 3 }, z1, 30, P, 3, 0.3), { tone: "hi" }) + Ln(ringOnX(x + 3, y - 7, z1 + 20, 5, 5, 16), { tone: "mid" }) + Ln(ringOnX(x + 3, y + 8, z1 + 20, 4, 4, 14), { tone: "mid" }));
    put(L, depthAt(-196, -50, 0) * 1e-3 + 0.5, eye(-196, -50));
    put(L, depthAt(172, 46, 0) * 1e-3 + 0.5, eye(172, 46));
  }

  // ---------------------------------------------------------------- 04 valves
  function valves() {
    const L = "valves";
    const z0 = 228;
    const list = [];
    XC.forEach((x) => {
      for (const dx of [-16, 16]) list.push({ x: x + dx, y: 21, v: SPEC.intakeValve });
      for (const dx of [-15, 15]) list.push({ x: x + dx, y: -21, v: SPEC.exhaustValve });
    });
    envelope(L, z0, z0 + SPEC.intakeValve.length + 15);
    for (const { x, y, v } of list) {
      const F = frameZ(x, y, z0);
      const r = v.head / 2;
      const rs = v.stem / 2;
      const w = 2.0; // seat face width along the 45 degree line (drawing)
      const headPart = G.lathe([[0, 0], [0, r], [1.4, r], [1.4 + w, r - w], [8.5, rs + 2.2], [8.5, 0]], F, P);
      const stem = G.disc(8, v.length - 3.2, rs, F, P);
      const tip = G.disc(v.length - 3.2, v.length, rs + 0.25, F, P);
      const spring = helix(x, y, 8.6, z0 + 46, z0 + v.length - 21, 6); // whole turns: both ends on the near side
      const seatDisc = S(k.cylinder(x, y, 10.5, z0 + 44, 2, P, 28, 0.2), { tone: "mid" });
      const retainer = S(G.lathe([[0, 0], [0, 8.6], [2, 9.6], [4.5, 6.2], [4.5, 0]], frameZ(x, y, z0 + v.length - 21), P), { tone: "mid" });
      const a0 = (P.azimuth * Math.PI) / 180 + 0.6;
      const foot = Dots([at([x + 8.6 * Math.cos(a0), y + 8.6 * Math.sin(a0), z0 + 46])], { size: 0.45, tone: "mid" });
      let svg = Ln(spring.back, { tone: "lo" }) + S(headPart, { tone: "hi" }) + S(stem, { tone: "hi" }) + seatDisc + Ln(spring.front, { tone: "mid" }) + foot + retainer + S(tip, { tone: "hi" });
      // the roller rocker lever on the valve tip and its hydraulic lifter outboard, the roller under the camshaft (M1 PDF
      // 189 items 8-10; sizes drawn): lifter, lever, then the roller in the lever's window
      const sg = Math.sign(y), tipZ = z0 + v.length;
      const lift = S(k.cylinder(x, sg * 50, 6.2, tipZ - 30, 29, P, 24, 0.3), { tone: "hi" });
      const lever = S(k.slabOf({ x: x - 5.5, y: sg > 0 ? 16 : -56, w: 11, d: 40, r: 4 }, tipZ - 1, 7, P, 4, 0.4), { tone: "hi" });
      const RF = G.frameOf([x, sg * 31, tipZ + 7], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      const roller = S(G.disc(-4, 4, 8, RF, P, { bevel: 0.3 }), { tone: "hi" });
      svg += mat("steel", lift + lever + roller);
      put(L, depthAt(x, y, 0), svg);
    }
  }

  // ---------------------------------------------------------------- 05 head gasket
  function gasket() {
    const L = "gasket";
    const z0 = 222, z1 = 225;
    envelope(L, z0, z1);
    const plan = { ...DECK };
    const out = [S(k.slabOf(plan, z0, z1 - z0, P, 8), { tone: "hi", crease: "none" })];
    for (const x of XC) {
      out.push(`<path class="gti-xv-bore" d="${k.cylinder(x, 0, SPEC.bore / 2 + 0.5, z1, 0.01, P, 72).fill}"/>`);
      out.push(Ln(k.ring(x, 0, SPEC.bore / 2 + 0.5, z1, P, 72), { tone: "hi" }), Ln(k.ring(x, 0, SPEC.bore / 2 + 4.5, z1, P, 72), { tone: "lo" }));
    }
    for (const x of XM) for (const y of [-64, 64]) out.push(Ln(k.ring(x, y, 6.5, z1, P, 20), { tone: "mid" }));
    for (const x of XC) for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * 2 * Math.PI;
      const cy = 51 * Math.sin(a);
      if (Math.abs(cy) <= 70) out.push(Ln(k.ring(x + 51 * Math.cos(a), cy, 3.4, z1, P, 14), { tone: "lo" }));
    }
    put(L, 0, out.join(""));
  }

  // ---------------------------------------------------------------- 06 cylinder block (M1 PDF 109, 118, 129, 233)
  // Deck about 380 x 155 mm and bore spacing about 88 mm (scaled from the PDF 129 top view); crankcase flange about
  // 205 mm wide (bolt rows of the PDF 234 underside views). Barrels bulge below the deck between head-bolt columns,
  // a ledge runs along the side, the intake-side balance shaft housing lies along the crankcase, and the timing-chain
  // case rises at the front.
  const DECK = { x: -190, y: -78, w: 378, d: 156, r: 10 };
  const CASE = { x: -212, y: -102, w: 400, d: 204, r: 10 };
  const PAN = { x: -206, y: -106, w: 396, d: 212, r: 12 };
  // depth of the upper oil pan section below the crank axis: a drawing value, after the SSP 822223 picture
  const PAN_DEPTH = Number(globalThis.GTI_PAN_DEPTH || 134);
  // the crankcase's sealing face for the oil pan, below the crank axis (a drawing value fitted to the picture; the manual
  // does not dimension it)
  const CASE_BOTTOM = -48;
  // the oil pan's plan, its intake-side corner at the transmission end cut back along the gearbox flange's curve (after
  // the picture, where the flange outline sweeps in toward the sump)
  const panPlan = () => { const x1 = PAN.x + PAN.w, y0 = PAN.y, y1 = PAN.y + PAN.d; return G.hullOf([[PAN.x + 12, y0], [x1 - 12, y0], [x1, y0 + 12], [x1, 30], [x1 - 22, 70], [x1 - 58, y1], [PAN.x + 12, y1], [PAN.x, y1 - 12], [PAN.x, y0 + 12]]); };
  const panSlab = (z0, h) => S(G.prismOf(G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]), panPlan(), z0, z0 + h, P), { tone: "hi" });
  function block() {
    const L = "block";
    // crankcase depth below the crank axis is a drawing value, matched to the official picture (not printed)
    const bottom = CASE_BOTTOM, ledge = 118, deckLow = 207, deck = 222;
    envelope(L, bottom - 6, deck);
    const yF = CASE.y; // exhaust side, toward the viewer
    // lower timing chain cover at the far (timing) end (M1 PDF 157)
    put(L, side([-1, 0, 0], 3, -2), S(G.prismOf(frameX(), [[-80, 118], [80, 118], [80, deck], [-80, deck]], -220, -212, P), { tone: "hi" }));
    const out = [];
    out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CASE, 8), bottom - 6, 2, P)}"/>`);
    out.push(mat("steel", panSlab(bottom - 6, 6) + (faces([0, -1, 0]) ? Dots(Array.from({ length: 9 }, (_, i) => at([-160 + i * 41, PAN.y - 0.5, bottom - 3])), { size: 0.7, tone: "hi" }) : "")));
    // no bevel on the crankcase's top edge: where the upper block sits on it no lit seam shows (the picture has none)
    out.push(S(k.slabOf(CASE, bottom, ledge - bottom, P, 8, 0), { tone: "hi", crease: "none" }));
    // the exhaust side of the crankcase, after the SSP 822223 picture: a dark, closed wall with a rounded bulge beside the
    // transmission end, a rail along the oil-pan joint with small dark pockets under it, and one plugged boss
    if (faces([0, -1, 0])) {
      // on the wall, after the picture (aligned on the camera anchors): a rounded bulge beside the transmission end, its
      // upper edge toward the light, a sweep clipped at the wall and shaded in the iron tones (not dimensioned in the manual)
      const proud = (p) => yF - 0.3 - p[1];
      const capsule = (x, zc, h, R, e, n = 14) => {
        const zs = Array.from({ length: n + 1 }, (_, i) => zc - h + (2 * h * i) / n);
        return [zs.map((z) => [x, yF + e, z]), zs.map((z) => R * Math.sqrt(Math.max(0.0001, 1 - ((z - zc) / h) ** 2)))];
      };
      const shaded = ([cs, rs]) => sweepPieces(cs, rs, { clip: proud, cls: "gti-xv-vi", gloss: 0.12 }).forEach((pc) => out.push(pc.svg));
      shaded(capsule(120, 39, 40, 52, 42, 16));
      out.push(S(k.slabOf({ x: -200, y: yF - 6, w: 394, d: 7, r: 2 }, bottom + 21, 14, P, 3, 0.4), { tone: "hi" }));
      for (let i = 0; i < 5; i++) out.push(mat("cast", S(G.disc(-yF + 6, -yF + 9, 4, G.frameOf([-180 + i * 88, 0, bottom + 28], [0, -1, 0], [1, 0, 0], [0, 0, 1]), P, { bevel: 0.3 }), { tone: "hi" })));
      for (const [x0, x1] of [[-182, -128], [-104, -50], [16, 70], [104, 158]]) {
        const tri = [[x0, yF - 0.3, bottom + 4], [x1, yF - 0.3, bottom + 4], [(x0 + x1) / 2, yF - 0.3, bottom + 18]];
        out.push(`<path class="gti-xv-deep" d="${poly(tri)}"/>`, Ln(poly(tri), { tone: "hi" }));
      }
      for (const [x, z, r] of [[-150, 60, 7]]) out.push(S(G.disc(-yF, 5 - yF, r, G.frameOf([x, 0, z], [0, -1, 0], [1, 0, 0], [0, 0, 1]), P, { bevel: 0.3 }), { tone: "hi" }) + `<path class="gti-xv-deep" d="${G.circleOf(G.frameOf([x, 0, z], [0, -1, 0], [1, 0, 0], [0, 0, 1]), 5 - yF, r * 0.45, P, 14)}"/>`);
    }
    // transmission end (M1 PDF 99 and the SSP 822223 picture): a tall gearbox flange from the oil-pan rail up to the
    // deck, cast as a light rim with machined bolt bosses round its edge and deep pockets between its webs
    const xr = CASE.x + CASE.w;
    const yWallAt = (z) => (z <= ledge ? CASE.y : CASE.y + ((Math.min(z, deckLow) - ledge) / (deckLow - ledge)) * (-86 - CASE.y));
    const xf = xr + 5;
    // the face's upper part (above the crank axis) is drawn at 0.82 of its first height, so its top edge sits as low as in
    // the SSP 822223 picture (the manual does not dimension the flange)
    const sz = ([y, z]) => [y, z > 0 ? Math.round(z * 0.82 * 10) / 10 : z];
    const face = ([[-106, bottom - 10], [-60, bottom - 16], [0, bottom - 16], [36, bottom - 12], [80, -26], [106, 0], [118, 34], [120, 64], [112, 90], [96, 114], [66, 126], [30, 132], [-30, 132], [-70, 128], [-94, 118], [-104, 96], [-106, 64], [-106, 24]]).map(sz);
    const fl = [S(G.prismOf(frameX(), face, xr, xf, P), { tone: "hi" })];
    const inset = (pts, d, c = [0, 40]) => pts.map(([y, z]) => { const n = Math.hypot(y - c[0], z - c[1]); return [xf, y - ((y - c[0]) / n) * d, z - ((z - c[1]) / n) * d]; });
    fl.push(`<path class="gti-xv-inset" d="${poly(inset(face, 15))}"/>`, Ln(poly(inset(face, 15)), { tone: "mid" }));
    // deep pockets between the webs (gaps between the pockets are the webs); on the exhaust-side edge a dark band
    // carries two bosses
    const pocket = (q) => {
      // rounded corners: the polygon shrunk toward its centroid, then grown back by a circle at each corner
      const c = [0, 1].map((i) => q.reduce((s, p) => s + p[i], 0) / q.length);
      const rr = 3;
      const rounded = G.hullOf(q.flatMap(([y, z]) => { const d = Math.hypot(y - c[0], z - c[1]) || 1; const k = Math.max(0, 1 - rr / d); return circle(c[0] + (y - c[0]) * k, c[1] + (z - c[1]) * k, rr, 10); }));
      const pts = rounded.map(([y, z]) => [xf, y, z]);
      // a deeper core, shifted toward the lit side where the pocket's wall casts its shadow
      const core = rounded.map(([y, z]) => [xf, c[0] + (y - c[0]) * 0.58 + 0.12 * (rounded.reduce((m, p) => Math.max(m, p[0]), -1e9) - c[0]), c[1] + (z - c[1]) * 0.58 + 0.12 * (rounded.reduce((m, p) => Math.max(m, p[1]), -1e9) - c[1])]);
      fl.push(`<path class="gti-xv-pocket" d="${poly(pts)}"/>`, `<path class="gti-xv-pocket-deep" d="${poly(core)}"/>`, Ln(poly(pts), { tone: "mid" }));
    };
    // (in the face's own heights, inside the 15 mm rim and clear of the sealing flange): large dark pockets between light
    // webs, as in the picture, where about two fifths of the face above and beside the crankshaft seal is in deep shadow:
    // a pair split by a diagonal web in the upper quarter on the intake side, pockets across the top, a tall one beside the
    // seal on the exhaust side, and two down the intake side
    [
      [[18, 48], [90, 42], [18, 88]], [[102, 50], [104, 88], [32, 92]],
      [[-16, 70], [12, 70], [10, 91], [-14, 91]],
      [[-22, 66], [-58, 60], [-58, 91], [-24, 92]],
      [[-68, 54], [-94, 48], [-95, -34], [-70, -28]],
      [[64, -4], [97, -12], [103, 34], [68, 38]],
      [[62, -30], [92, -40], [95, -20], [64, -12]],
    ].forEach(pocket);
    // bolt bosses round the rim: small and low, cast in with the face
    const lugs = [[98, -34], [114, 30], [112, 78], [90, 112], [40, 124], [-40, 124], [-84, 116], [-98, 30], [-96, -40], [44, -50], [-44, -50], [0, 98]].map(sz);
    const flange = [mat("cast", fl.join(""))];
    for (const [y, z] of lugs.slice().sort((a, b) => depthAt(0, a[0], a[1]) - depthAt(0, b[0], b[1]))) flange.push(mat("cast", S(G.disc(xf, xf + 2.5, 5.5, frameX(0, y, z), P, { bevel: 0.3 }), { tone: "hi" }) + `<path class="gti-xv-deep" d="${G.circleOf(frameX(0, y, z), xf + 2.5, 2.4, P, 14)}"/>`));
    // the crankshaft sealing flange: a dark-grey, lopsided shield round the hub, reaching further toward the exhaust side
    // and down to a blunt point, with a rim line and bolts round it (outline after the SSP 822223 picture; not dimensioned
    // in the manual)
    const shield = [[0, 60], [40, 48], [58, 20], [56, -20], [34, -52], [-8, -74], [-40, -66], [-64, -36], [-66, 10], [-50, 44], [-24, 58]];
    const roundOff = (q, rr) => { const c = [0, 1].map((i) => q.reduce((s, p) => s + p[i], 0) / q.length); return G.hullOf(q.flatMap(([y, z]) => { const d = Math.hypot(y - c[0], z - c[1]) || 1; const f = Math.max(0, 1 - rr / d); return circle(c[0] + (y - c[0]) * f, c[1] + (z - c[1]) * f, rr, 10); })); };
    const sealOut = roundOff(shield, 6);
    const sc = [0, 1].map((i) => shield.reduce((s, p) => s + p[i], 0) / shield.length);
    const toward = ([y, z], d) => { const n = Math.hypot(y - sc[0], z - sc[1]) || 1; return [y - ((y - sc[0]) / n) * d, z - ((z - sc[1]) / n) * d]; };
    const sealRim = roundOff(shield.map((p) => toward(p, 7)), 4);
    const sealBolts = [shield[1], shield[3], shield[5], shield[7], shield[9]].map((p) => toward(p, 11));
    flange.push(mat("dark", S(G.prismOf(frameX(), sealOut, xf, xf + 3, P), { tone: "hi" }) + Ln(poly(sealRim.map(([y, z]) => [xf + 3, y, z])), { tone: "hi" }) + Dots(sealBolts.map(([y, z]) => at([xf + 3, y, z])), { size: 0.8, tone: "hi" })));
    // with the flywheel off, as in the picture, the crankshaft flange shows: silver, eight bolt holes (M1 PDF 99 lists 6 or 8)
    const HF = frameX();
    flange.push(`<g class="gti-xv-assembled-only">${mat("steel", S(G.disc(xf + 3, xf + 9, 40, HF, P, { bevel: 0.6 }), { tone: "hi" }) + Array.from({ length: 8 }, (_, i) => Ln(ringOnX(xf + 9, 28 * Math.cos((i * Math.PI) / 4 + 0.2), 28 * Math.sin((i * Math.PI) / 4 + 0.2), 3, 3, 12), { tone: "hi" })).join("") + S(G.disc(xf + 9, xf + 15, 15, HF, P, { bevel: 0.5 }), { tone: "hi" }) + `<path class="gti-xv-deep" d="${G.circleOf(HF, xf + 15, 7, P, 20)}"/>` + Ln(G.circleOf(HF, xf + 15, 7, P, 20), { tone: "hi" }))}</g>`);
    put(L, 0, out.join(""));
    // the gearbox flange stands 5 mm proud of the transmission end: drawn after the block when that end faces the viewer
    put(L, side([1, 0, 0], 2.5, -1), faces([1, 0, 0]) ? flange.join("") : flange[0]);
    // a thick rib along the flange's exhaust-side edge, from the oil-pan joint up the corner, swelling outward toward the
    // bottom in an S (after the SSP 822223 picture; not dimensioned in the manual)
    if (faces([0, -1, 0])) {
      // it slants outward all the way down and curves out more toward the bottom (after the picture)
      const swell = (z) => Math.pow(Math.min(1, Math.max(0, (196 - z) / (196 - bottom))), 1.4);
      const yOut = (z) => yWallAt(z) - 4 - 40 * swell(z);
      const zs = Array.from({ length: 11 }, (_, i) => bottom + 1 + (i / 10) * (196 - bottom));
      // drawn as one rim: the segments' fills without their own outlines, then one outline round each visible face
      const noLines = (svg) => svg.replace(/<path class="iso-line[^>]*\/>/g, "");
      let band = zs.slice(0, -1).map((z0, i) => { const z1 = zs[i + 1]; return noLines(S(G.prismOf(frameX(), [[yOut(z0), z0], [yOut(z0) + 12, z0], [yOut(z1) + 12, z1], [yOut(z1), z1]], xr - 24, xf, P), { tone: "hi" })); }).join("");
      const down = zs.slice().reverse();
      band += Ln(poly([...zs.map((z) => [xf, yOut(z), z]), ...down.map((z) => [xf, yOut(z) + 12, z])]), { tone: "hi" });
      band += Ln(poly([...zs.map((z) => [xf, yOut(z), z]), ...down.map((z) => [xr - 24, yOut(z), z])]), { tone: "hi" });
      // in the darker cast tone: in the picture it reads as a dark band beside the light flange
      put(L, side([0, -1, 0], 1.6, -1), mat("dark", band));
    }
    // timing-chain case at the front, full height, with the chain opening in its top
    put(L, side([-1, 0, 0], 2.2, 1), S(k.slabOf({ x: -212, y: -80, w: 24, d: 160, r: 6 }, ledge, deck - ledge, P, 4, 0.5), { tone: "hi" }) + `<path class="gti-xv-bore" d="${k.planOutline({ x: -208, y: -58, w: 15, d: 116, r: 7 }, deck, P, 6)}"/>` + Ln(k.planOutline({ x: -208, y: -58, w: 15, d: 116, r: 7 }, deck, P, 6), { tone: "lo" }));
    // the upper block is one closed casting: the water jacket wall hides the barrels and head-bolt bosses
    const upperPlan = { x: -206, y: -86, w: 394, d: 172, r: 8 };
    // the wall leans in from the crankcase's width at the ledge to the upper block's width under the deck (widths from the
    // manual's drawings), so no flat shelf runs along the side
    const yWall = (z) => (z <= ledge ? CASE.y : CASE.y + ((z - ledge) / (deckLow - ledge)) * (upperPlan.y - CASE.y));
    // its outline drawn faint, so the seam where it sits on the crankcase does not read as a second box
    const up2 = [S(G.prismOf(G.frameOf([upperPlan.x, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]), [[CASE.y, ledge], [upperPlan.y, deckLow], [-upperPlan.y, deckLow], [-CASE.y, ledge]], 0, upperPlan.w, P), { tone: "lo", crease: "none" })];
    if (faces([0, -1, 0])) {
      for (const [x, z] of [[-110, 170], [72, 176]]) up2.push(S(G.disc(-yWall(z), 7 - yWall(z), 8, G.frameOf([x, 0, z], [0, -1, 0], [1, 0, 0], [0, 0, 1]), P, { bevel: 0.3 }), { tone: "hi" }));
      const SF = (x, z) => G.frameOf([x, 0, z], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
      for (const [x, z, r] of [[-64, 142, 10], [150, 164, 8]]) up2.push(S(G.disc(-yWall(z), 8 - yWall(z), r, SF(x, z), P, { bevel: 0.3 }), { tone: "hi" }) + `<path class="gti-xv-deep" d="${G.circleOf(SF(x, z), 8 - yWall(z), r * 0.45, P, 14)}"/>`);
    }
    if (faces([1, 0, 0])) {
      // the end face above the gearbox flange reads as light cast metal in the picture, continuous with the flange below:
      // a light panel inside a narrow rim, with two small pockets
      const xe = upperPlan.x + upperPlan.w + 0.4;
      up2.push(`<path class="gti-xv-inset" d="${poly([[xe, -96, 121], [xe, -82, 203], [xe, 82, 203], [xe, 96, 121]])}"/>`, Ln(poly([[xe, -96, 121], [xe, -82, 203], [xe, 82, 203], [xe, 96, 121]]), { tone: "mid" }));
      for (const q of [[[48, 126], [84, 126], [80, 150], [52, 154]], [[-46, 126], [-84, 126], [-80, 152], [-50, 156]]]) up2.push(`<path class="gti-xv-pocket" d="${poly(q.map(([y, z]) => [xe + 0.2, y, z]))}"/>`, Ln(poly(q.map(([y, z]) => [xe + 0.2, y, z])), { tone: "mid" }));
      for (const [y, z, r] of [[46, 168, 9], [-40, 176, 7], [70, 140, 6]]) up2.push(S(G.disc(upperPlan.x + upperPlan.w, upperPlan.x + upperPlan.w + 6, r, frameX(0, y, z), P, { bevel: 0.3 }), { tone: "hi" }) + `<path class="gti-xv-deep" d="${G.circleOf(frameX(0, y, z), upperPlan.x + upperPlan.w + 6, r * 0.45, P, 14)}"/>`);
    }
    // the narrow top of the wall beside the deck lies in the head's shadow: a dark seam rather than a lit ledge
    up2.push(`<path class="gti-xv-deep" d="${poly([[upperPlan.x, upperPlan.y, deckLow + 0.3], [upperPlan.x + upperPlan.w, upperPlan.y, deckLow + 0.3], [upperPlan.x + upperPlan.w, DECK.y, deckLow + 0.3], [upperPlan.x, DECK.y, deckLow + 0.3]])}"/>`);
    put(L, 2, up2.join(""));
    // deck: water-jacket passages around each bore, bores, head-bolt holes, oil returns, dowels
    const top = [S(k.slabOf(DECK, deckLow, deck - deckLow, P, 8, 0.6), { tone: "hi" })];
    for (const x of XC) {
      for (let i = 0; i < 8; i++) {
        const a = ((i + 0.5) / 8) * 2 * Math.PI;
        const cy = 51 * Math.sin(a);
        if (Math.abs(cy) > 70) continue;
        top.push(Ln(k.ring(x + 51 * Math.cos(a), cy, 3.4, deck, P, 14), { tone: "lo" }));
      }
      // the bore as a hole, as in the manual's deck view (A13-10956, M1 PDF 129): its far wall shows inside, lit near the
      // rim and darkening with depth; from steeper views the bore's depths beyond 40 mm show dark
      const rimPts = Array.from({ length: 72 }, (_, i) => at([x + (SPEC.bore / 2) * Math.cos((i / 72) * 2 * Math.PI), (SPEC.bore / 2) * Math.sin((i / 72) * 2 * Math.PI), deck]));
      const deepPts = Array.from({ length: 72 }, (_, i) => at([x + (SPEC.bore / 2) * Math.cos((i / 72) * 2 * Math.PI), (SPEC.bore / 2) * Math.sin((i / 72) * 2 * Math.PI), deck - 40]));
      top.push(`<path class="gti-xv-borewall" d="${k.pathOf(rimPts, true)}"/>`);
      if (faces([0, 0, 1])) { const dark = clipConvex(deepPts, rimPts); if (dark.length > 2) top.push(`<path class="gti-xv-bore" d="${k.pathOf(dark, true)}"/>`); }
      top.push(Ln(k.pathOf(rimPts, true), { tone: "hi" }));
    }
    for (const x of XM) for (const y of [-64, 64]) top.push(`<path class="gti-xv-socket" d="${k.cylinder(x, y, 5, deck, 0.01, P, 18).fill}"/>` + Ln(k.ring(x, y, 6, deck, P, 20), { tone: "mid" }));
    for (const [x, y] of [[-182, -70], [-182, 70], [180, -70], [180, 70]]) top.push(Ln(k.ring(x, y, 4, deck, P, 16), { tone: "lo" }));
    top.push(Dots([at([-184, -40, deck]), at([182, 40, deck])], { size: 0.8, tone: "hi" }));
    put(L, 6, top.join(""));
  }

  // ---------------------------------------------------------------- 07-09 rings
  const RING = [
    { id: "ring1", below: 5, h: 2.4, parts: 1 },
    { id: "ring2", below: 10.5, h: 2.4, parts: 1 },
    { id: "ring3", below: 17, h: 4.2, parts: 3 },
  ];
  function rings() {
    for (const ring of RING) {
      XC.forEach((x, cyl) => {
        const z = crownZ(cyl) - ring.below - ring.h;
        envelope(ring.id, z, z + ring.h);
        const F = frameZ(x, 0, z);
        const rOut = SPEC.bore / 2 - 0.2;
        const rIn = rOut - 3.6;
        let svg;
        if (ring.parts === 1) {
          svg = S(G.lathe([[0, rIn], [0, rOut], [ring.h, rOut], [ring.h, rIn]], F, P, { hole: [ring.h, rIn] }), { tone: "hi" });
          const g = G.angleToward(F, [Math.cos((P.azimuth * Math.PI) / 180), Math.sin((P.azimuth * Math.PI) / 180), 0]) + 0.5;
          svg += Ln(k.pathOf([at(G.pointOf(F, ring.h, rIn, g)), at(G.pointOf(F, ring.h, rOut, g)), at(G.pointOf(F, 0, rOut, g))]), { tone: "mid" });
        } else {
          const band = (s0, s1, a, b, tone) => S(G.lathe([[s0, a], [s0, b], [s1, b], [s1, a]], F, P, { hole: [s1, a] }), { tone });
          svg = band(0, 0.9, rIn + 0.6, rOut, "hi");
          svg += band(0.9, ring.h - 0.9, rIn, rOut - 0.8, "mid") + Ln(G.ribsOf(F, 0.9, ring.h - 0.9, rOut - 0.8, 64, P, { least: 0.15 }), { tone: "lo" });
          svg += band(ring.h - 0.9, ring.h, rIn + 0.6, rOut, "hi");
        }
        put(ring.id, depthAt(x, 0, z), svg);
      });
    }
  }

  // ---------------------------------------------------------------- 10 pistons and pins
  function pistons() {
    const L = "pistons";
    const V3 = G.viewOf(P);
    const toward = Math.atan2(V3[1], V3[0]); // horizontal direction toward the viewer
    // the visible half of a horizontal circle (centre cx, cy at height z), as points from one silhouette edge to the other
    const halfRing = (cx, cy, rr, z, n = 36) => Array.from({ length: n + 1 }, (_, i) => { const a = toward - Math.PI / 2 + (i / n) * Math.PI; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a), z]; });
    XC.forEach((x, cyl) => {
      const pin = pistonPinZ(cyl);
      const top = crownZ(cyl);
      const bottom = pin - LAYOUT.skirtBelowPin;
      envelope(L, bottom, top);
      const r = SPEC.pistonGauge / 2;
      const F = frameZ(x, 0, 0);
      let svg = S(G.lathe([[bottom, 0], [bottom, r - 0.6], [bottom + 0.6, r], [top - 1.2, r - 0.25], [top, r - 1.4], [top, 0]], F, P), { tone: "hi" });
      // the ring belt: three grooves (two compression rings and the three-piece oil ring) as dark bands
      for (const ring of RING) {
        const zt = top - ring.below, zb = zt - ring.h;
        const band = [...halfRing(x, 0, r - 0.15, zt), ...halfRing(x, 0, r - 0.15, zb).reverse()];
        svg += `<path class="gti-xv-groove" d="${poly(band)}"/>`;
      }
      // below the ring belt the skirt is cut back on the pin-boss sides: a flat, shadowed face with the pin boss and the
      // hollow piston pin in it (as in the manual's piston drawing A13-11033)
      const sx = faces([1, 0, 0]) ? 1 : faces([-1, 0, 0]) ? -1 : 0;
      if (sx) {
        const xr = x + sx * (r - 4.5), half = Math.sqrt(r * r - (r - 4.5) ** 2);
        const face = [[xr, -half, bottom], [xr, half, bottom], [xr, half, top - 22], [xr, -half, top - 22]];
        svg += `<path class="gti-xv-recess" d="${poly(face)}"/>` + Ln(poly(face), { tone: "mid" });
        const PF = G.frameOf([xr, 0, pin], [sx, 0, 0], [0, 1, 0], [0, 0, 1]);
        svg += S(G.disc(-2, 1.5, 12.5, PF, P, { bevel: 0.3 }), { tone: "mid" });
        svg += `<path class="gti-xv-bore" d="${G.circleOf(PF, 1.6, 7, P, 24)}"/>` + Ln(G.circleOf(PF, 1.6, 7, P, 24), { tone: "hi" }) + Ln(G.circleOf(PF, 1.6, 10.6, P, 28), { tone: "lo" });
      }
      // the crown: a shallow bowl in the middle (its far wall catches the light) and four valve reliefs at the edge
      const ring27 = (rr, dz = 0) => Array.from({ length: 56 }, (_, i) => [x + rr * Math.cos((i / 56) * 2 * Math.PI), rr * Math.sin((i / 56) * 2 * Math.PI), top + dz]);
      const far = toward + Math.PI;
      const arcAt = (rr, a0, a1, off, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [x + rr * Math.cos(a) + off * Math.cos(far), rr * Math.sin(a) + off * Math.sin(far), top]; });
      svg += `<path class="gti-xv-dish" d="${poly(ring27(26))}"/>`;
      svg += `<path class="gti-xv-dish-lit" d="${poly([...arcAt(26, far - Math.PI / 2, far + Math.PI / 2, 0), ...arcAt(18, far + Math.PI / 2, far - Math.PI / 2, 6)])}"/>`;
      svg += Ln(poly(ring27(26)), { tone: "mid" });
      for (const [dx, y, rr] of [[-16, 21, 9.5], [16, 21, 9.5], [-15, -21, 8.5], [15, -21, 8.5]]) {
        const relief = Array.from({ length: 28 }, (_, i) => [x + dx + rr * Math.cos((i / 28) * 2 * Math.PI), y + rr * Math.sin((i / 28) * 2 * Math.PI), top]);
        svg += `<path class="gti-xv-relief" d="${poly(relief)}"/>` + Ln(poly(relief), { tone: "lo" });
      }
      put(L, depthAt(x, 0, pin), svg);
    });
  }

  // ---------------------------------------------------------------- 11 connecting rods (M1 PDF 128, A13-11033)
  // A cracked-cap rod: small-end eye with its bushing, an I-beam shank (raised flanges round a recessed web), and a big end
  // with flat bolt lugs either side of the fracture split, the cap held by two bolts from below.
  function rods() {
    const L = "rods";
    XC.forEach((x, cyl) => {
      const [, by, bz] = pinCentre(cyl);
      const sz = pistonPinZ(cyl);
      const big = 33;
      const small = 14.5;
      const ax = [0 - by, sz - bz];
      const al = Math.hypot(ax[0], ax[1]);
      const u = [ax[0] / al, ax[1] / al];
      const n = [u[1], -u[0]];
      envelope(L, Math.min(bz - big - 8, sz - small), Math.max(bz + big + 8, sz + small));
      // three convex pieces: the big end with its two bolt lugs, the small-end eye, and the narrow shank over both
      const lug = (s) => [-9, 9].flatMap((d) => circle(by + s * n[0] * (big + 3) + u[0] * d, bz + s * n[1] * (big + 3) + u[1] * d, 5, 12));
      const t = 10;
      const xf = faces([1, 0, 0]) ? x + t : x - t;
      let svg = S(G.prismOf(frameX(), G.hullOf([...circle(by, bz, big, 40), ...lug(1), ...lug(-1)]), x - t, x + t, P), { tone: "hi" });
      svg += S(G.prismOf(frameX(), circle(0, sz, small, 28), x - t, x + t, P), { tone: "hi" });
      const on = (yy, zz) => at([xf, yy, zz]);
      const ringOn = (cy, cz, rr, nn = 36) => k.pathOf(Array.from({ length: nn }, (_, i) => on(cy + rr * Math.cos((i / nn) * 2 * Math.PI), cz + rr * Math.sin((i / nn) * 2 * Math.PI))), true);
      const bore = SPEC.pin / 2 + 1.6;
      // the shank: 26 mm wide where it leaves the big end, 18 mm under the eye; drawn without its end edges, which lie
      // inside the big end and the eye, so it runs into both without a seam
      const b0 = [by + u[0] * (big - 8), bz + u[1] * (big - 8)];
      const b1 = [-u[0] * (small - 4), sz - u[1] * (small - 4)];
      const sq = [[b0[0] + n[0] * 13, b0[1] + n[1] * 13, 0], [b1[0] + n[0] * 9, b1[1] + n[1] * 9, 1], [b1[0] - n[0] * 9, b1[1] - n[1] * 9, 1], [b0[0] - n[0] * 13, b0[1] - n[1] * 13, 0]];
      let shank = S(G.prismOf(frameX(), sq.map(([a, b]) => [a, b]), x - t, x + t, P), { tone: "hi", crease: "none" }).replace(/<path class="iso-line iso-edge"[^>]*\/>/g, "");
      const corners = [x - t, x + t].flatMap((xx) => sq.map(([a, b, end]) => ({ q: at([xx, a, b]), end })));
      const hull2 = G.hullOf(corners.map((c) => c.q));
      const endOf = (q) => (corners.find((c) => Math.hypot(c.q[0] - q[0], c.q[1] - q[1]) < 1e-6) || { end: -1 }).end;
      const sides = [];
      hull2.forEach((q, i) => { const r2 = hull2[(i + 1) % hull2.length]; if (endOf(q) !== endOf(r2)) sides.push(k.pathOf([q, r2])); });
      shank += Ln(sides.join("") + k.pathOf([on(sq[0][0], sq[0][1]), on(sq[1][0], sq[1][1])]) + k.pathOf([on(sq[3][0], sq[3][1]), on(sq[2][0], sq[2][1])]), { tone: "hi", className: "iso-edge" });
      svg += shank;
      // I-beam: the recessed web between the flanges
      const web = [on(b0[0] + n[0] * 8 - u[0] * 4, b0[1] + n[1] * 8 - u[1] * 4), on(b1[0] + n[0] * 5, b1[1] + n[1] * 5), on(b1[0] - n[0] * 5, b1[1] - n[1] * 5), on(b0[0] - n[0] * 8 - u[0] * 4, b0[1] - n[1] * 8 - u[1] * 4)];
      svg += `<path class="gti-xv-recess" d="${k.pathOf(web, true)}"/>` + Ln(k.pathOf(web, true), { tone: "lo" });
      // the eyes: big-end bore with its bearing shell, small-end eye with its bushing
      svg += `<path class="gti-xv-bore" d="${ringOn(by, bz, bore)}"/>` + Ln(ringOn(by, bz, bore), { tone: "hi" }) + Ln(ringOn(by, bz, bore + 1.6), { tone: "faint" });
      svg += `<path class="gti-xv-bore" d="${ringOn(0, sz, 10.5, 24)}"/>` + Ln(ringOn(0, sz, 10.5, 24), { tone: "hi" }) + Ln(ringOn(0, sz, 12, 28), { tone: "lo" });
      // fracture split through the big-end centre and across both lugs
      for (const s of [1, -1]) svg += Ln(k.pathOf([on(by + s * n[0] * bore, bz + s * n[1] * bore), on(by + s * n[0] * (big + 8), bz + s * n[1] * (big + 8))]), { tone: "mid" });
      // the two rod bolts, their ends showing in the lugs on the cap side
      svg += Dots([on(by + n[0] * (big + 3) - u[0] * 8, bz + n[1] * (big + 3) - u[1] * 8), on(by - n[0] * (big + 3) - u[0] * 8, bz - n[1] * (big + 3) - u[1] * 8)], { size: 0.8, tone: "hi" });
      put(L, depthAt(x, 0, 0), svg);
    });
  }

  // ---------------------------------------------------------------- 12 crankshaft
  const COUNTERWEIGHT_WEBS = new Set([0, 3, 4, 7]); // four counterweights (S1); which webs carry them is illustrative
  function crank() {
    const L = "crank";
    const F = frameX();
    const parts = [];
    const rMain = SPEC.main / 2;
    const rPin = SPEC.pin / 2;
    envelope(L, -68, 68);
    parts.push({ x: -224, svg: S(G.disc(-238, -204, 15, F, P), { tone: "hi" }) });
    parts.push({ x: -214, svg: S(G.disc(-222, -206, 27, F, P, { bevel: 0.4 }), { tone: "mid" }) + Ln(G.ribsOf(F, -206, -222, 27, 32, P, { least: 0.2 }), { tone: "lo" }) });
    XM.forEach((x, i) => {
      const half = i === 2 ? 13 : 11;
      let svg = S(G.disc(x - half, x + half, rMain, F, P), { tone: "hi" }) + Ln(G.arcOf(F, x, rMain, P), { tone: "faint" });
      if (i === 2) for (const s of [x - half, x + half - 1.6]) svg += S(G.ringBand(s, s + 1.6, rMain + 0.5, rMain + 8, F, P), { tone: "mid" });
      parts.push({ x, svg });
    });
    XC.forEach((xc, cyl) => {
      const [, py, pz] = pinCentre(cyl);
      parts.push({ x: xc, svg: S(G.disc(xc - 11, xc + 11, rPin, G.frameOf([0, py, pz], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P), { tone: "hi" }) + Ln(G.circleOf(G.frameOf([0, py, pz], [1, 0, 0], [0, 1, 0], [0, 0, 1]), xc + 11, 3, P, 12), { tone: "lo" }) });
      for (const side of [-1, 1]) {
        const web = cyl * 2 + (side < 0 ? 0 : 1);
        const x0 = side < 0 ? xc - 27 : xc + 11;
        const pts = [...circle(0, 0, rMain + 8, 32), ...circle(py, pz, rPin + 9, 32)];
        if (COUNTERWEIGHT_WEBS.has(web)) {
          const away = Math.atan2(-pz, -py);
          for (let a = -1.35; a <= 1.3501; a += 0.09) pts.push([64 * Math.cos(away + a), 64 * Math.sin(away + a)]);
        }
        parts.push({ x: x0 + 8, svg: S(G.prismOf(F, G.hullOf(pts), x0, x0 + 16, P), { tone: "hi" }) });
      }
    });
    // oil holes (as in the manual's crankshaft drawing A13-10487): one on each crank pin and each main journal, on the side
    // turned toward the viewer
    {
      const V3 = G.viewOf(P);
      const radial = G.unit3([0, V3[1], V3[2]]);
      const hole = (c, r, depth) => {
        const p0 = G.add3(c, G.mul3(radial, r + 0.05));
        const HF = G.frameAlong(p0, radial);
        return { x: c[0] + 0.01, svg: `<path class="gti-xv-deep" d="${G.circleOf(HF, 0, 2.6, P, 14)}"/>` + Ln(G.circleOf(HF, 0, 2.6, P, 14), { tone: "mid" }), depth };
      };
      XC.forEach((xc, cyl) => { const [, py, pz] = pinCentre(cyl); const h = hole([xc, py, pz], rPin); parts.push({ x: h.x, svg: h.svg }); });
      XM.forEach((x) => { const h = hole([x + 4, 0, 0], rMain); parts.push({ x: h.x, svg: h.svg }); });
    }
    // sensor wheel for G28, then the flywheel flange with its bolt circle
    parts.push({ x: 192, svg: S(G.ringBand(190, 194, 30, 58, F, P), { tone: "mid" }) + Ln(G.ribsOf(F, 194, 190, 58, 58, P, { least: 0.1 }), { tone: "lo" }) });
    parts.push({ x: 205, svg: S(G.disc(196, 214, 44, F, P, { bevel: 0.6 }), { tone: "hi" }) + Dots(G.dotsOf(F, 214, 31, 8, P, { all: true }), { size: 0.6, tone: "hi" }) + Ln(G.circleOf(F, 214, 14, P, 24), { tone: "mid" }) });
    parts.sort((a, b) => a.x - b.x).forEach((p) => put(L, depthAt(p.x, 0, 0), p.svg));
  }

  // ---------------------------------------------------------------- 13 main bearing caps
  function caps() {
    const L = "caps";
    // Parting face on the crankshaft axis; the lower half of each main bore is cut into the cap (M1 PDF 109).
    const z0 = -46, z1 = 0;
    const seat = SPEC.main / 2 + 2; // journal radius plus the lower shell (shell thickness is not printed)
    envelope(L, z0 - 7, z1);
    XM.forEach((x) => {
      const shape = [[-46, z1], [46, z1], [46, z0 + 14], [34, z0], [-34, z0], [-46, z0 + 14]];
      const parts = [];
      // bolt bosses stand at both ends of the bridge; the far one first
      const boss = (y) => S(k.cylinder(x, y, 9.5, z0 + 2, z1 - z0 - 2, P, 28), { tone: "hi" }) + S(k.cylinder(x, y, 7, z0 - 7, 9, P, 24, 0.3), { tone: "mid" });
      parts.push(boss(40));
      let svg = S(G.prismOf(frameX(), shape, x - 10, x + 10, P), { tone: "hi" });
      const near = [];
      for (let i = 0; i <= 28; i++) {
        const a = Math.PI + (i / 28) * Math.PI;
        near.push([x + 10, seat * Math.cos(a), seat * Math.sin(a)]);
      }
      svg += `<path class="gti-xv-bore" d="${poly([...near, [x - 10, seat, 0], [x - 10, -seat, 0]])}"/>`;
      svg += Ln(poly(near, false), { tone: "hi" });
      const shell = near.map(([xx, yy, zz]) => [xx, (yy * (seat - 2)) / seat, (zz * (seat - 2)) / seat]);
      svg += Ln(poly(shell, false), { tone: "mid" });
      svg += Ln(k.pathOf([at([x + 10, -seat, 0]), at([x + 10, -seat + 2, 0])]) + k.pathOf([at([x + 10, seat - 2, 0]), at([x + 10, seat, 0])]), { tone: "mid" });
      parts.push(svg, boss(-40));
      put(L, depthAt(x, 0, 0), parts.join(""));
    });
  }

  // ---------------------------------------------------------------- oil pan upper section (M1 PDF 233-234)
  // Aluminium (S1), bolted to the block with 18 bolts; open baffles scalloped around the crankshaft counterweights;
  // the chain-driven oil pump sits inside it at the timing end.
  function panUpper() {
    const L = "panUpper";
    const top = CASE_BOTTOM - 6, bottom = -PAN_DEPTH;
    envelope(L, bottom - 6, top);
    const inner = k.insetPlan(PAN, 13);
    const out = [];
    // the side profile: deep at the transmission end, its bottom edge climbing toward the timing end (after the picture)
    // the bottom edge runs level along the engine and rises only over its last stretch at the timing end (after the picture)
    const zBot = (x) => (x > -80 ? bottom : bottom + 58 * Math.pow(Math.min(1, (-80 - x) / (-80 - PAN.x)), 1.3));
    // the lower band, below the bolt-boss line, is narrower than the flange (the sump tapers, as in the picture)
    const zStep = -110;
    const xe0 = PAN.x + PAN.w;
    // the transmission end slopes back toward the bottom: 12 mm over the upper band, 28 mm more over the lower band
    const xEnd = (z) => (z >= zStep ? xe0 - ((top - z) / (top - zStep)) * 12 : xe0 - 12 - ((zStep - z) / (zStep - bottom + 6)) * 46);
    const profUp = [[xe0, top], [xEnd(zStep), zStep], [PAN.x, zStep], [PAN.x, top]];
    const profLo = [[xEnd(zStep), zStep], [xEnd(bottom + 8), bottom + 8], [xEnd(bottom - 6) - 14, bottom - 6], [-80, bottom - 6], ...[-110, -140, -170].map((x) => [x, zBot(x) - 6]), [PAN.x, zBot(PAN.x) - 6], [PAN.x, zStep]];
    const yLo = 84;
    // on the intake side of the transmission end the lower band steps back under the upper band's cut-back corner (the
    // corner reaches 15 mm in at y 54), so no strip of its top shows past the corner; the far piece is drawn first
    const yCut = 30, back = 15;
    out.push(S(G.prismOf(G.frameOf([0, yCut, 0], [0, 1, 0], [-1, 0, 0], [0, 0, 1]), profLo.map(([x, z], i) => [-(i < 3 ? x - back : x), z]), 0, 54 - yCut, P), { tone: "hi" }));
    out.push(S(G.prismOf(G.frameOf([0, -yLo, 0], [0, 1, 0], [-1, 0, 0], [0, 0, 1]), profLo.map(([x, z]) => [-x, z]), 0, yLo + yCut, P), { tone: "hi" }));
    out.push(S(G.prismOf(G.frameOf([0, PAN.y + 3, 0], [0, 1, 0], [-1, 0, 0], [0, 0, 1]), profUp.map(([x, z]) => [-x, z]), 0, 30 - (PAN.y + 3), P), { tone: "hi" }));
    const profUpCut = [[xe0 - 58, top], [xEnd(zStep) - 70, zStep], [PAN.x, zStep], [PAN.x, top]];
    out.push(S(G.prismOf(G.frameOf([0, 30, 0], [0, 1, 0], [-1, 0, 0], [0, 0, 1]), profUpCut.map(([x, z]) => [-x, z]), 0, PAN.y + PAN.d - 3 - 30, P), { tone: "hi" }));
    // the cut-back corner between the two: a sloped face from the end at y 30 to the cut end
    out.push(S(G.prismOf(G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]), G.hullOf([[xe0 - 12, 30], [xEnd(zStep), 30], [xEnd(zStep) - 70, PAN.y + PAN.d - 3], [xe0 - 58, PAN.y + PAN.d - 3]]), zStep, top, P), { tone: "hi" }));
    out.push(panSlab(top - 6, 6));
    const yF = PAN.y + 3;
    // the exhaust-side wall: vertical ribs, and round bolt bosses along the top for the 18 bolts into the block (as in
    // the SSP 822223 picture; their spacing is drawn)
    if (faces([0, -1, 0])) {
      for (const x of [-150, -92, -20, 40, 104, 160]) { const z0 = Math.max(zBot(x), zStep); out.push(S(k.slabOf({ x: x - 5, y: yF - 2, w: 10, d: 2, r: 1 }, z0 + 4, top - 14 - z0, P, 2, 0.3), { tone: "hi" })); }
      for (const x of [-122, -56, 8, 72, 132]) out.push(S(k.slabOf({ x: x - 6, y: yF - 3, w: 12, d: 3, r: 2 }, top - 20, 14, P, 3, 0.3), { tone: "hi" }) + Dots([at([x, yF - 2, top - 6])], { size: 0.5, tone: "hi" }));
    }
    // transmission end of the section: dark triangular pockets between light ribs (after the picture), on the full-width
    // part of the end face only (from y 30 toward the intake side the corner is cut back)
    if (faces([1, 0, 0])) {
      for (let i = 0; i < 5; i++) {
        const y0 = -96 + i * 26, w = 18;
        const zb = zStep + 6, zt = top - 14;
        const on3 = (y, z) => [xEnd(z) + 0.5, y, z];
        const tri = i % 2 === 0 ? [on3(y0, zb), on3(y0 + w, zb), on3(y0 + w / 2, zt)] : [on3(y0, zt), on3(y0 + w, zt), on3(y0 + w / 2, zb)];
        out.push(`<path class="gti-xv-slot" d="${poly(tri)}"/>`, Ln(poly(tri), { tone: "mid" }));
      }
    }
    // open top: the cavity, the scalloped baffles under each main bearing, bolt holes on the flange. The cavity is the
    // flange's own outline 13 mm in, so it follows the cut-back corner instead of running past it
    const insetConvex = (pts, d) => {
      const q = pts.filter((p, i) => Math.hypot(p[0] - pts[(i + 1) % pts.length][0], p[1] - pts[(i + 1) % pts.length][1]) > 1e-6);
      const n = q.length;
      const sg = q.reduce((s, [x0, y0], i) => s + x0 * q[(i + 1) % n][1] - q[(i + 1) % n][0] * y0, 0) > 0 ? 1 : -1;
      const lines = q.map(([x0, y0], i) => { const dx = q[(i + 1) % n][0] - x0, dy = q[(i + 1) % n][1] - y0, h = Math.hypot(dx, dy); return [x0 - (dy / h) * d * sg, y0 + (dx / h) * d * sg, dx, dy]; });
      return lines.map((b, i) => {
        const a = lines[(i - 1 + n) % n];
        const den = a[2] * b[3] - a[3] * b[2];
        if (Math.abs(den) < 1e-9) return [b[0], b[1]];
        const t = ((b[0] - a[0]) * b[3] - (b[1] - a[1]) * b[2]) / den;
        return [a[0] + a[2] * t, a[1] + a[3] * t];
      });
    };
    const insideConvex = (pts, [x, y]) => { let pos = 0, neg = 0; pts.forEach(([x0, y0], i) => { const [x1, y1] = pts[(i + 1) % pts.length]; const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0); if (c > 0) pos++; else if (c < 0) neg++; }); return !(pos && neg); };
    const cavity = poly(insetConvex(panPlan(), 13).map(([x, y]) => [x, y, top]));
    out.push(`<path class="gti-xv-bore" d="${cavity}"/>`);
    for (const x of XM.filter((x) => x > inner.x + 4 && x < inner.x + inner.w - 4)) {
      const arc = [];
      for (let i = 0; i <= 24; i++) {
        const y = -66 + (132 * i) / 24;
        arc.push([x, y, Math.max(bottom + 8, -Math.sqrt(Math.max(0, 74 * 74 - y * y)))]);
      }
      out.push(Ln(poly([[x, inner.y, top], [x, -66, top], ...arc, [x, 66, top], [x, inner.y + inner.d, top]], false), { tone: "mid" }));
    }
    out.push(Ln(cavity, { tone: "lo" }));
    const bolts = [];
    for (let i = 0; i < 6; i++) bolts.push([-196 + i * 74, PAN.y + 7], [-196 + i * 74, PAN.y + PAN.d - 7]);
    // only those that land on the flange (the last one on the intake side would sit in the cut-back corner)
    const onFlange = insetConvex(panPlan(), 5);
    out.push(Dots(bolts.filter((b) => insideConvex(onFlange, b)).map(([x, y]) => at([x, y, top])), { size: 0.6, tone: "hi" }));
    put(L, 0, out.join(""));
    // oil pump at the timing end, with its chain sprocket
    const pump = [S(k.slabOf({ x: -196, y: -8, w: 40, d: 54, r: 6 }, bottom + 10, 40, P, 6, 0.4), { tone: "mid" })];
    const PF = frameX(0, 20, bottom + 40);
    pump.push(S(G.disc(-204, -198, 22, PF, P, { bevel: 0.3 }), { tone: "mid" }) + Ln(G.ribsOf(PF, -198, -204, 22, 26, P, { least: 0.2 }), { tone: "lo" }));
    put(L, 1, pump.join(""));
  }

  // ---------------------------------------------------------------- oil pan lower section (M1 PDF 233-234)
  // Plastic on the 2022 GTI (S1); 20 bolts; a deeper well carries the oil level and temperature sensor G266.
  function panLower() {
    const L = "panLower";
    // tucked under the upper section: from this side only its edge shows below the aluminium wall, as in the picture
    const top = -PAN_DEPTH - 6;
    envelope(L, top - 12, top);
    const flange = { x: -40, y: -64, w: 150, d: 128, r: 12 }; // well inside the upper section's tapered end
    const tray = k.insetPlan(flange, 8);
    const well = { x: 4, y: -54, w: 90, d: 108, r: 24 };
    const out = [];
    out.push(S(k.slabOf(tray, top - 8, 4, P, 10, 0.6), { tone: "hi" }));
    out.push(S(k.slabOf(well, top - 12, 4, P, 12, 0.6), { tone: "hi" }));
    out.push(S(k.slabOf(flange, top - 5, 5, P, 8, 0.5), { tone: "hi" }));
    // inside: the tray floor and the deeper well, seen through the open top
    out.push(`<path class="gti-xv-bore" d="${k.planOutline(k.insetPlan(flange, 18), top, P, 8)}"/>`, Ln(k.planOutline(k.insetPlan(flange, 18), top, P, 8), { tone: "lo" }));
    out.push(Ln(k.planOutline(k.insetPlan(well, 6), top - 8, P, 10), { tone: "faint" }));
    const bolts = [];
    for (let i = 0; i < 4; i++) bolts.push([-32 + i * 66, flange.y + 6], [-32 + i * 66, flange.y + flange.d - 6]);
    bolts.push([flange.x + 7, -60], [flange.x + 7, 0], [flange.x + 7, 60], [flange.x + flange.w - 7, -60], [flange.x + flange.w - 7, 0], [flange.x + flange.w - 7, 60]);
    out.push(Dots(bolts.map(([x, y]) => at([x, y, top])), { size: 0.6, tone: "hi" }));
    // drain plug on the well's intake-side wall
    // the drain plug sits on the underside of the well, out of sight from above
    put(L, 0, out.join(""));
  }

  // ---------------------------------------------------------------- 14 flywheel
  function flywheel() {
    const L = "flywheel";
    const x0 = 218;
    const r = 124;
    envelope(L, -r, r);
    const F = frameX();
    let svg = S(G.disc(x0, x0 + 16, r - 14, F, P, { bevel: 0.8 }), { tone: "hi" });
    svg += S(G.disc(x0 + 16, x0 + 34, r, F, P, { bevel: 0.8 }), { tone: "hi" });
    svg += Ln(G.ribsOf(F, x0 + 16, x0 + 34, r, 132, P, { least: 0.08 }), { tone: "lo" });
    // the dual-mass flywheel's face, as in the manual's drawing N13-000063 (M1 PDF 99): a raised rim inside the ring gear,
    // a recessed annulus with a ring of windows and rivets, and the hub with its bolt circle (6 or 8 bolts, M1 PDF 99)
    const sF = faces([1, 0, 0]) ? x0 + 34 : x0;
    svg += `<path class="gti-xv-annulus" d="${G.circleOf(F, sF, r - 16, P, 96)}${G.circleOf(F, sF, 46, P, 64)}"/>` + Ln(G.circleOf(F, sF, r - 16, P, 96), { tone: "mid" }) + Ln(G.circleOf(F, sF, 46, P, 64), { tone: "mid" });
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * 2 * Math.PI;
      const WF = G.frameOf(G.pointOf(F, sF, 78, a), [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      svg += `<path class="gti-xv-socket" d="${G.circleOf(WF, 0.05, 10, P, 20)}"/>` + Ln(G.circleOf(WF, 0.05, 10, P, 20), { tone: "mid" });
    }
    svg += Dots(G.dotsOf(F, sF, 99, 16, P, { all: true, phase: 0.2 }), { size: 0.6, tone: "hi" });
    svg += Dots(G.dotsOf(F, sF, 31, 8, P, { all: true }), { size: 0.75, tone: "hi" }) + Ln(G.circleOf(F, sF, 14, P, 24), { tone: "mid" });
    // the official picture shows the engine as supplied, without the flywheel: it appears only with the engine apart
    put(L, 0, `<g class="gti-xv-apart-only">${svg}</g>`);
  }

  // ---------------------------------------------------------------- turbocharger with its lines (M1 PDF 340-358)
  // Layout after the repair manual: the turbine housing bolts to the head's exhaust outlet between cylinders 2 and 3
  // (four studs, M1 PDF 343-344, 355), the shaft runs along the crankshaft, the compressor sits toward the transmission
  // end with its inlet facing that end, the compressor outlet (connection 20) runs below the inlet toward the same end
  // (M1 PDF 341, drawing N21-11118), the turbine outlet faces the timing end into the catalytic converter (PDF 353,
  // A26-12315), and the heat shield is one bent strap over the top that turns down at the timing-end side (PDF 353,
  // A24-12175). Shapes after the same drawings and SSP 822223 p.15 and p.17: the turbine housing a rounded drum, the
  // compressor scroll a fat shaded tube winding round the shaft (sweepPieces), the recirculation valve N249 on the compressor housing beside the
  // inlet, and the charge air pressure control module GX34 under the compressor with its rod to the wastegate lever.
  // Positions are fitted to the SSP 822223 cover picture; housing sizes are drawn, not printed.
  function turbo() {
    const L = "turbo";
    envelope(L, 100, 395);
    const pieces = [];
    const add = (depth, svg) => pieces.push({ depth, svg });
    const braid = { pitch: 3.2, twist: 1.1, cross: true, tone: "mid" };
    const sleeve = (points, r, bias = 0) => TB.tubePieces(points, r, P, { maxLength: 30, rings: braid }).forEach((pc) => add(depthAt(...pc.mid) + bias, mat("cast", TB.tubeSvg(pc, { tone: "hi" }))));
    const pipe = (points, r, m, tone = "hi", bias = 0) => TB.tubePieces(points, r, P, { maxLength: 40 }).forEach((pc) => add(depthAt(...pc.mid) + bias, mat(m, TB.tubeSvg(pc, { tone }))));
    const FL = [20, -104, 250]; // turbine flange on the head's exhaust outlet
    const TC = [30, -172, 290]; // turbine wheel centre, outboard of and above the flange
    const AX = G.unit3([1, 0.12, 0.05]);
    const F = G.frameAlong(TC, AX); // u toward the head (+y), v up
    const on = (s, r, a) => G.pointOf(F, s, r, a);
    const facesAxis = faces(AX); // the compressor end of the shaft faces the viewer
    // Proportions after the manual's turbocharger drawing (M1 PDF 341, N21-11118) and the SSP 822223 picture: a long
    // bearing section between the compressor and a turbine housing smaller than the compressor scroll. The turbine
    // housing's compressor-side face is a dish round the bearing housing; its outlet faces the timing end and outboard,
    // away from this side.
    const TT = G.add3(G.add3(TC, G.mul3(AX, -97)), [0, 0, 22]); // turbine wheel centre
    const FT = G.frameAlong(TT, AX);
    const onT = (s, r, a) => G.pointOf(FT, s, r, a);
    // turbine: flange with four studs on the head's exhaust outlet and a short neck into the turbine housing
    add(depthAt(...FL) - 200, mat("steel", S(k.slabOf({ x: FL[0] - 28, y: -112, w: 56, d: 10, r: 4 }, FL[2] - 24, 48, P, 4, 0.5), { tone: "hi" }) + (faces([0, -1, 0]) ? Dots([[-20, -16], [20, -16], [-20, 16], [20, 16]].map(([dx, dz]) => at([FL[0] + dx, -112, FL[2] + dz])), { size: 0.7, tone: "hi" }) : "")));
    pipe([[FL[0], -114, FL[2]], [FL[0] - 12, -128, FL[2] + 4], onT(0, 54, 1.86 * Math.PI)], 24, "steel", "hi", -60);
    // turbine housing: a cast bell flaring toward the compressor, shaded patch by patch; on its compressor side a thin
    // rim round a recessed dish, the heat-shield plate in its middle (shape after the SSP 822223 picture)
    const bell = [[-38, 30], [-28, 33], [-18, 39], [-8, 45], [2, 50], [12, 54], [18, 56], [22, 55]];
    const bellPieces = sweepPieces(bell.map(([s]) => onT(s, 0, 0)), bell.map(([, r]) => r), { gloss: 0.3, lightDir: [0.1, -0.6, 0.8] });
    // drawn after the bearing housing and before the compressor (a convex bell does not hide itself, so one depth serves)
    for (const pc of bellPieces) add(depthAt(...on(-20, 0, 0)) + 0.5, pc.svg);
    let th = "";
    if (facesAxis) {
      const arcF = (s, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => onT(s, r, a0 + (a1 - a0) * (i / n)));
      // a recessed face: the rim's inboard part in shadow, the inner wall lit on the outboard side
      const rimLit = [...arcF(22, 50, 0.6 * Math.PI, 1.45 * Math.PI), ...arcF(22, 41, 1.45 * Math.PI, 0.6 * Math.PI)];
      const wallShade = [...arcF(22, 50, -0.45 * Math.PI, 0.4 * Math.PI), ...arcF(22, 38, 0.4 * Math.PI, -0.45 * Math.PI)];
      // the dish shaded as a bowl (lighter toward the inside of its lit wall, darker toward the far wall), and the rim's lip
      // catching the light on the outboard side (after the picture)
      const lip = [...arcF(22, 50, -0.5 * Math.PI, 0.45 * Math.PI), ...arcF(22, 46.5, 0.45 * Math.PI, -0.5 * Math.PI)];
      th += `<path class="gti-xv-bowl" d="${G.circleOf(FT, 22, 50, P, 64)}"/>` + `<path class="gti-xv-light" d="${poly(rimLit)}"/>` + `<path class="gti-xv-shadow" d="${poly(wallShade)}"/>` + `<path class="gti-xv-light" d="${poly(lip)}"/>` + Ln(G.circleOf(FT, 22, 50, P, 64), { tone: "lo" }) + Ln(G.circleOf(FT, 22.1, 41, P, 56), { tone: "lo" });
      th += S(G.disc(16, 24, 8, G.frameAlong(onT(16, 56, 1.3 * Math.PI), AX), P, { bevel: 0.4 }), { tone: "hi" });
    }
    if (th) add(depthAt(...on(-20, 0, 0)) + 1, mat("tcast", th));
    // turbine outlet: a V-band flange toward the timing end and outboard, where the catalytic converter is clamped (M1 PDF
    // 341, 353; the converter is not drawn)
    const OUT = G.unit3([-0.8, -0.5, 0.3]);
    const OF2 = G.frameAlong(TT, OUT);
    let outlet = S(G.lathe([[-10, 0], [-10, 40], [8, 42, 1], [20, 38, 1], [26, 34], [28, 38], [34, 38], [36, 34], [36, 0]], OF2, P), { tone: "hi" });
    if (faces(OUT)) outlet += `<path class="gti-xv-deep" d="${G.circleOf(OF2, 36, 28, P, 40)}"/>`;
    add(depthAt(...G.pointOf(OF2, 24, 0, 0)) - 40, mat("cast", outlet));
    // bearing housing: a short body from the turbine housing's face to the compressor's back plate, mostly hidden
    add(depthAt(...on(-20, 0, 0)), mat("tcast", S(G.lathe([[-80, 0], [-80, 36], [-60, 42, 1], [0, 42, 1], [20, 38], [26, 30], [26, 0]], F, P), { tone: "hi" })));
    // compressor housing (cast aluminium), after the picture: a fat scroll tube round a short boss that carries the inlet,
    // the tube's inner side in the housing's shadow (a darker band round the inlet), its section growing from the head side
    // over the top and down the outboard side; a dark back plate behind. The outlet drum below the inlet stands apart from
    // the scroll by a dark crevice, as in the picture (the scroll's joint to it lies behind the drum).
    const sV = 60;
    // the turbocharger's housings are lit as in the picture, where the polished castings catch a light from the viewer's
    // side and above: brightest on the outboard flank and along the crest, darker on the face round the inlet
    const TL = [0.1, -0.6, 0.8];
    add(depthAt(...on(44, 0, 0)) - 6, mat("hcast", S(G.lathe([[30, 0], [30, 46], [36, 50, 1], [48, 50, 1], [56, 46], [56, 0]], F, P), { tone: "hi" })));
    // compressor outlet (connection 20): a silver tube below the inlet, toward the transmission end, the intake side and
    // down, ending in a ribbed spigot for the charge air hose (M1 PDF 341-342; size and direction after the SSP 822223
    // picture, where its mouth is seen nearly edge-on)
    const DX = G.unit3([1, 0.4, 0.125]);
    const D0 = [182, -168, 237];
    // one full turn, from the thin tongue at the lower left, up the head side, over the top and down the outboard side to
    // the fat exit at the bottom, which turns into the outlet behind the actuator. Each section is D-shaped: round on the
    // outside, and on the inside a long curve that runs down to the boss, so the housing's front face and the scroll are
    // one surface and the casting reads as a disc round the inlet. Keyframes (angle, centre radius, section radius) after
    // the picture's outline: top near the coils' feet, outboard edge beside the turbine, bottom above the actuator.
    const keys = [[-0.35, 54, 8], [0, 54, 13], [0.5, 56, 19], [1, 64, 28], [1.25, 56, 22], [1.55, 48, 18]].map(([a, R, r]) => [a * Math.PI, R, r]);
    const a0 = keys[0][0], a1 = keys[keys.length - 1][0], nS = 96;
    const keyAt = (a) => { let i = 0; while (i < keys.length - 2 && a > keys[i + 1][0]) i++; const [x0, R0, r0] = keys[i], [x1, R1, r1] = keys[i + 1]; const f = Math.min(1, Math.max(0, (a - x0) / (x1 - x0))); const sm = f * f * (3 - 2 * f); return [R0 + (R1 - R0) * sm, r0 + (r1 - r0) * sm]; };
    const RBOSS = 36;
    const cs = [], rs = [], fr = [], rin = [];
    for (let i = 0; i <= nS; i++) {
      const a = a0 + ((a1 - a0) * i) / nS;
      const [R, r] = keyAt(a);
      cs.push(on(sV, R, a)); rs.push(r); rin.push(Math.max(r, R - RBOSS));
      fr.push([G.add3(G.mul3(F.u, Math.cos(a)), G.mul3(F.v, Math.sin(a))), AX]);
    }
    const dSection = (i, th) => {
      const c = Math.cos(th), s = Math.sin(th), r = rs[i], ri = rin[i];
      return c >= 0 ? { x: r * c, y: r * s, nx: c, ny: s } : { x: ri * c, y: r * s, nx: c / ri, ny: s / r };
    };
    // the inner face, turned toward the inlet, lies in the housing's hollow and takes a little less light
    const hollow = (p, n) => {
      const d = G.sub3(p, TC), r = G.sub3(d, G.mul3(AX, G.dot3(d, AX)));
      return 0.5 * Math.max(0, -G.dot3(n, G.unit3(r)));
    };
    for (const pc of sweepPieces(cs, rs, { cap: true, occlusion: hollow, fine: true, gloss: 0.35, frames: fr, section: dSection, lightDir: TL })) add(pc.depth, pc.svg);
    // the neck inside the scroll, flaring smoothly from the inlet flange into the scroll's inner face
    const boss = [[64, 37], [74, 36.5], [84, 35], [94, 33], [104, 31.5], [114, 31], [124, 31]];
    for (const pc of sweepPieces(boss.map(([s]) => on(s, 0, 0)), boss.map(([, r]) => r), { fine: true, gloss: 0.35, lightDir: TL })) add(pc.depth, pc.svg);
    // a flat bracket standing on the scroll's outboard face, right of the inlet (after the picture)
    const TAB = on(86, 64, 0.82 * Math.PI);
    add(depthAt(...TAB) + 20, mat("ccast", S(k.slabOf({ x: TAB[0] - 10, y: TAB[1] - 6, w: 20, d: 6, r: 2 }, TAB[2] - 24, 70, P, 3, 0.4), { tone: "hi" })));
    const DF = G.frameAlong(D0, DX);
    // the drum's body shaded like the scroll it leaves (one casting); collar, step and spigot as turned parts. Its pieces
    // keep one depth (behind the inlet ring, over the scroll's tail), far end first.
    const drum = sweepPieces(Array.from({ length: 7 }, (_, i) => G.add3(D0, G.mul3(DX, (58 * i) / 6))), Array(7).fill(44));
    drum.forEach((pc, i) => add(depthAt(...D0) + 7.5 + (pc.svg.includes("gti-xv-v") ? i * 0.01 : 0.4), pc.svg));
    // a clamping flange round the drum's inner end
    add(depthAt(...D0) + 7.4, mat("ccast", S(G.lathe([[2, 0], [2, 48], [9, 48], [9, 0]], DF, P), { tone: "hi" })));
    let conn = S(G.lathe([[58, 0], [58, 44], [60, 44], [64, 36], [70, 36], [72, 28], [72, 0]], DF, P), { tone: "hi" }) + S(G.disc(72, 88, 26, DF, P, { hole: [88, 20], bevel: 0.4 }), { tone: "hi" });
    if (faces(DX)) {
      const up = Array.from({ length: 11 }, (_, i) => G.pointOf(DF, 88, 20, (0.15 + 0.7 * (i / 10)) * Math.PI));
      const dn = Array.from({ length: 11 }, (_, i) => { const a = (0.85 - 0.7 * (i / 10)) * Math.PI; return G.add3(G.pointOf(DF, 88, 17, a), G.mul3(DF.v, -2)); });
      conn += `<path class="gti-xv-mid" d="${G.circleOf(DF, 88, 20, P, 32)}"/>` + `<path class="gti-xv-deep" d="${poly([...up, ...dn])}"/>` + Ln(G.circleOf(DF, 88, 20, P, 32), { tone: "hi" });
    }
    add(depthAt(...D0) + 8, mat("cast", conn));
    // inlet: a thick rounded lip on the neck; inside, the bore's lit wall with a dark crescent along its upper-left edge,
    // the wheel's hub and its nut
    const sI = 136, rb = 26.5;
    let inlet = S(G.lathe([[122, 0], [122, 33], [126, 35, 1], [132, 35, 1], [sI, 33.5, 1], [sI, 0]], F, P, { hole: [sI, rb] }), { tone: "hi" });
    // the flange's face is stepped: a ring line between its thin outer lip and the inner seat
    if (facesAxis) inlet += Ln(G.circleOf(F, sI, 30.5, P, 48), { tone: "mid" });
    if (facesAxis) {
      // looking into the bore: the wall lit along its lower right, in shadow along its upper left, the wheel deep inside
      const c = on(sI, 0, 0);
      const ring = (r, a, off) => { const o = G.add3(G.mul3(F.u, off * Math.cos(mid + Math.PI)), G.mul3(F.v, off * Math.sin(mid + Math.PI))); return G.add3(G.add3(c, G.add3(G.mul3(F.u, r * Math.cos(a)), G.mul3(F.v, r * Math.sin(a)))), o); };
      const mid = 0.18 * Math.PI;
      const arc = (r, a0, a1, off, n = 16) => Array.from({ length: n + 1 }, (_, i) => ring(r, a0 + (a1 - a0) * (i / n), off));
      const lit = [...arc(rb, mid + 0.55 * Math.PI, mid + 1.45 * Math.PI, 0), ...arc(rb * 0.72, mid + 1.45 * Math.PI, mid + 0.55 * Math.PI, -rb * 0.18)];
      const dark = [...arc(rb, mid - 0.55 * Math.PI, mid + 0.55 * Math.PI, 0), ...arc(rb * 0.72, mid + 0.55 * Math.PI, mid - 0.55 * Math.PI, rb * 0.2)];
      inlet += `<path class="gti-xv-throat" d="${G.circleOf(F, sI, rb, P, 44)}"/>` + `<path class="gti-xv-bore-lit" d="${poly(lit)}"/>` + `<path class="gti-xv-bore-dark" d="${poly(dark)}"/>` + Ln(G.circleOf(F, sI, rb, P, 44), { tone: "hi" });
      inlet += `<path class="gti-xv-shadow" d="${G.circleOf(F, sI - 16, 8, P, 20)}"/>` + `<path class="gti-xv-mid" d="${G.circleOf(F, sI - 12, 3.5, P, 12)}"/>` + Ln(G.circleOf(F, sI - 12, 3.5, P, 12), { tone: "mid" });
    }
    add(depthAt(...on(sI, 0, 0)) + 10, mat("ccast", inlet));
    // recirculation valve N249: a dark valve body on the compressor housing above the inlet, toward the head
    const NV = on(106, 56, 0.3 * Math.PI);
    add(depthAt(...NV) + 12, mat("plastic", S(k.slabOf({ x: NV[0] - 17, y: NV[1] - 16, w: 34, d: 32, r: 10 }, NV[2] - 6, 34, P, 8, 0.6), { tone: "hi" })) + mat("white", S(k.slabOf({ x: NV[0] - 7, y: NV[1] - 26, w: 14, d: 12, r: 2 }, NV[2] + 12, 10, P, 3, 0.3), { tone: "hi" })));
    // charge air pressure control module GX34: a rounded drum tucked under the compressor, its end facing the
    // transmission end, and the rod running toward the timing end to the wastegate lever on the turbine housing (M1 PDF
    // 341, 358)
    const CAN = [146, -220, 248];
    const CF = G.frameAlong(CAN, [1, 0, 0]);
    add(depthAt(...CAN) + 8, mat("cast", S(G.lathe([[-40, 0], [-40, 21], [-35, 26, 1], [12, 26, 1], [18, 21], [18, 0]], CF, P), { tone: "hi" }) + (faces([1, 0, 0]) ? Ln(G.circleOf(CF, 17, 10, P, 32), { tone: "mid" }) : "") + S(G.disc(17, 23, 6, CF, P, { bevel: 0.3 }), { tone: "hi" })));
    const LV = [CAN[0] - 96, CAN[1] - 6, CAN[2] + 6];
    pipe([[CAN[0] - 40, CAN[1] + 2, CAN[2] + 2], [LV[0] + 6, LV[1] - 2, LV[2] + 2]], 3.2, "steel");
    add(depthAt(...LV) + 1, mat("steel", S(G.prismOf(G.frameAlong(LV, [0, -1, 0]), G.hullOf([...circle(0, 0, 6, 10), ...circle(14, 18, 5, 10)]), -3, 3, P), { tone: "hi" })));
    // behind the cluster, the shadowed engine shows through the gaps between its parts (as in the picture): a dark backdrop
    // round the compressor, outlet and actuator (not the turbine, which joins the compressor without a gap in the picture), while the engine is assembled and seen within 40° of the
    // picture's azimuth (323°)
    if (faces([0, -1, 0]) && Math.abs(((P.azimuth - 323 + 540) % 360) - 180) <= 40) {
      const pts = [];
      for (let i = 0; i < cs.length; i += 3) for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) pts.push(at(G.add3(cs[i], G.mul3(d, rs[i] * 0.9))));
      for (const s of [0, 80]) for (let a = 0; a < 8; a++) pts.push(at(G.pointOf(DF, s, 40, (a / 8) * 2 * Math.PI)));
      for (let a = 0; a < 8; a++) pts.push(at(G.pointOf(G.frameAlong(CAN, [1, 0, 0]), -30, 22, (a / 8) * 2 * Math.PI)));
      const hull = G.hullOf(pts);
      const c = [0, 1].map((i) => hull.reduce((sum, q) => sum + q[i], 0) / hull.length);
      const shrunk = hull.map(([x, y]) => [c[0] + (x - c[0]) * 0.96, c[1] + (y - c[1]) * 0.96]);
      add(-1e9, `<g class="gti-xv-assembled-only"><path class="gti-xv-gap" d="${k.pathOf(shrunk, true)}"/></g>`);
    }
    // oil supply 12: from the top of the bearing housing over toward the compressor side and down to a port on the block
    pipe([on(33, 32, Math.PI / 2), [44, -150, 330], [70, -114, 318], [80, -108, 250], [80, -106, 170]], 4, "steel");
    // oil return 7: a short rigid tube down from the bearing housing to a boss on the crankcase wall
    pipe([on(33, 32, -Math.PI / 2), [50, -162, 210], [56, -110, 156]], 8, "cast");
    // coolant supply 2: a corrugated hose from low on the engine, under the turbine, up to the bearing housing
    pipe([[-40, -108, 150], [-30, -190, 176], [10, -228, 196], [30, -226, 222]], 7, "steel", "hi", 1);
    // coolant return 14: a short elbow from the head-facing side of the bearing housing into the head
    pipe([on(33, 32, 0), [40, -124, 320], [40, -104, 306]], 6, "steel");
    // heat shield (M1 PDF 353, photo A24-12175; the SSP 822223 picture): sheet steel over the turbine. A box-section
    // channel runs along the top, open toward the compressor; a bracket drops from its open end toward the compressor
    // end (nuts on the turbocharger), and a leg is bent down past the turbine on the timing-end side to its bolts.
    // (box, arm and leg sized and placed on the anchor-aligned picture: the box's front face about 74 x 35 mm, its top at
    // z 464; the arm runs from under the box's open end down toward the timing end; the leg drops past the turbine)
    const BX0 = -12, BX1 = 62, BY0 = -206, BY1 = -176, BZ = 464;
    // box section: a tall front wall toward the viewer, a lower back wall and a top, open at the compressor end
    let shield = S(k.slabOf({ x: BX0, y: BY1 - 3, w: BX1 - BX0, d: 3, r: 1 }, BZ - 30, 30, P, 2, 0.3), { tone: "hi" });
    if (faces([1, 0, 0])) shield += `<path class="gti-xv-deep" d="${poly([[BX1, BY0 + 3, BZ - 33], [BX1, BY1 - 3, BZ - 30], [BX1, BY1 - 3, BZ - 3], [BX1, BY0 + 3, BZ - 3]])}"/>`;
    shield += S(k.slabOf({ x: BX0, y: BY0, w: BX1 - BX0, d: 3, r: 1 }, BZ - 36, 33, P, 2, 0.3), { tone: "hi" });
    shield += S(k.slabOf({ x: BX0, y: BY0, w: BX1 - BX0, d: BY1 - BY0, r: 2 }, BZ - 3, 3, P, 3, 0.3), { tone: "hi" });
    add(depthAt((BX0 + BX1) / 2, (BY0 + BY1) / 2, BZ) + 80, mat("steel", shield));
    // a short flat bracket from the box's open end toward the compressor, on the turbocharger's nuts
    const bracket = S(k.slabOf({ x: BX1 - 4, y: BY0 + 4, w: 26, d: 22, r: 2 }, BZ - 58, 3, P, 2, 0.3), { tone: "hi" }) + (faces([0, 0, 1]) ? Dots([at([BX1 + 14, BY0 + 15, BZ - 55])], { size: 0.7, tone: "hi" }) : "");
    add(depthAt(BX1 + 10, BY0 + 15, BZ - 58) + 60, mat("steel", bracket));
    // the arm: a bent strap from under the box down toward the timing end, then a leg down past the turbine to its bolts
    const LF = G.frameOf([0, -204, 0], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
    const leg = [[[44, 424], [26, 430], [-84, 360], [-62, 350]], [[-84, 360], [-62, 350], [-58, 250], [-82, 250]]].map((q) => S(G.prismOf(LF, G.hullOf(q), -1.5, 1.5, P), { tone: "hi" })).join("");
    const legBolts = faces([0, -1, 0]) ? Dots([[-70, 264], [-70, 286]].map(([x, z]) => at([x, -205.5, z])), { size: 0.7, tone: "hi" }) : "";
    add(depthAt(-66, -204, 300), mat("steel", leg + legBolts));
    // shaded patches drawn one after another in the same tone are merged into one path (same picture, smaller page)
    const merged = [];
    for (const pc of pieces.sort((a, b) => a.depth - b.depth)) {
      const m = /^<path class="(gti-xv-vi?)" data-v="(\d+)" d="([^"]*)"\/>$/.exec(pc.svg);
      const last = merged[merged.length - 1];
      if (m && last && last.key === m[1] + m[2]) last.d += m[3];
      else if (m) merged.push({ key: m[1] + m[2], cls: m[1], v: m[2], d: m[3] });
      // pieces with nothing to draw from this side (a face turned away) are skipped, not written as empty paths
      else if (pc.svg) merged.push({ svg: pc.svg });
    }
    merged.forEach((pc, i) => put(L, i, pc.key ? `<path class="${pc.cls}" data-v="${pc.v}" d="${pc.d}"/>` : pc.svg));
  }


  // ---------------------------------------------------------------- ignition coils (M1 PDF 251; values in Rep. Gr. 28)
  // One pencil coil with its power output stage per cylinder, seated in the spark-plug wells of the head cover.
  function coils() {
    const L = "coils";
    const zTop = 314;
    envelope(L, 222, zTop + 51);
    XC.forEach((x, i) => {
      // the spark plug under each coil's connector (M1 PDF 515 item 3): electrode, threaded body into the
      // combustion chamber, hex, and the white ceramic insulator reaching up into the connector; shown when the layers are
      // apart, as in the manual's exploded column (coil, connector, plug). Long-reach M12 proportions, drawn, not printed
      const hex = Array.from({ length: 6 }, (_, j) => [8.1 * Math.cos((j * Math.PI) / 3 + Math.PI / 6), 8.1 * Math.sin((j * Math.PI) / 3 + Math.PI / 6)]);
      let plug = mat("steel", S(k.cylinder(x, 0, 2, 223, 6, P, 12, 0.2), { tone: "mid" }) + S(k.cylinder(x, 0, 6, 229, 26, P, 24, 0.2), { tone: "hi" }) + [232, 236, 240, 244, 248, 252].map((z) => Ln(k.ring(x, 0, 6, z, P, 24), { tone: "lo" })).join(""));
      plug += mat("steel", S(G.prismOf(frameZ(x, 0, 0), hex, 255, 265, P), { tone: "hi" }));
      plug += mat("white", S(k.cylinder(x, 0, 5.5, 265, 18, P, 24, 0.3), { tone: "hi" }));
      let svg = `<g class="gti-xv-sunk">${plug}${S(k.cylinder(x, 0, 9.5, 268, zTop - 268 - 8, P, 28), { tone: "hi" })}</g>`;
      svg += S(k.cylinder(x, 0, 12.5, zTop - 14, 8, P, 32, 0.4), { tone: "mid" });
      svg += mat("black", S(k.slabOf({ x: x - 20, y: -17, w: 40, d: 34, r: 5 }, zTop + 2, 38, P, 6, 0.6), { tone: "hi" }));
      svg += S(k.slabOf({ x: x - 10, y: -30, w: 20, d: 14, r: 2 }, zTop + 18, 14, P, 3, 0.4), { tone: "hi" }) + Ln(k.planOutline({ x: x - 7, y: -28, w: 14, d: 10, r: 1 }, zTop + 32, P, 3), { tone: "lo" });
      // thread-cutting double bolt at the coil's rear corner; the ground wire's nut sits on its stud (M1 PDF 515 items 6-7, 517)
      svg += mat("steel", S(k.cylinder(x + 12, -9, 4, zTop + 40, 6, P, 16, 0.2), { tone: "hi" }));
      put(L, depthAt(x, 0, zTop), svg);
    });
  }

  // ---------------------------------------------------------------- oil separator and crankcase ventilation (M1 PDF 250-252)
  // Seven bolts on the cylinder head cover at the transmission end, mostly on the intake side. The housing is notched
  // around the cylinder 4 coil well: outlet neck and pressure sensor G950 between coils 3 and 4, pressure-regulating dome
  // in front of coil 4, the tall separator housing beyond it, and a flat plate with two holes toward cylinder 3 (outline
  // after M1 PDF 250 and 252; the plate is drawn white, as it appears in the SSP 822223 picture).
  function breather() {
    const L = "breather";
    // its housing stands on the cover; plate and valve sit on its top (height measured against the SSP 822223 picture
    // through the fitted camera; the manual gives no height)
    const z0 = 362;
    envelope(L, 330, z0 + 46);
    const F = G.frameOf([0, 0, z0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    const pieces = [];
    const add = (depth, svg) => pieces.push({ depth, svg });
    add(-1e9, mat("black", S(G.prismOf(F, [[34, 16], [164, 12], [168, 74], [40, 74]], 330 - z0, 0, P), { tone: "hi" })));
    // the white plate with two holes toward cylinder 3, the ringed dome beside it, the outlet neck between coils 3 and 4,
    // the tall separator housing toward the transmission end (positions after the SSP 822223 picture)
    add(depthAt(64, 42, z0), mat("white", S(G.prismOf(F, [[38, 22], [86, 18], [90, 62], [44, 64], [36, 44]], 0, 5, P), { tone: "hi" }) + Ln(k.ring(54, 42, 8, z0 + 5, P, 20), { tone: "mid" }) + Ln(k.ring(74, 32, 6, z0 + 5, P, 18), { tone: "mid" }) + Ln(k.ring(70, 54, 3, z0 + 5, P, 12), { tone: "mid" })));
    const dx = 132, dy = 44;
    let dome = "";
    dome += mat("black", S(k.cylinder(dx, dy, 32, z0, 8, P, 48, 0.6), { tone: "hi" }) + Ln(k.ring(dx, dy, 25, z0 + 8, P, 40), { tone: "mid" }) + Ln(k.ring(dx, dy, 18, z0 + 8, P, 32), { tone: "mid" }) + Ln(k.ring(dx, dy, 11, z0 + 8, P, 24), { tone: "mid" }) + Ln(k.ring(dx, dy, 4, z0 + 8, P, 12), { tone: "mid" }));
    add(depthAt(dx, dy, z0), dome);
    add(depthAt(99, -5, z0), S(G.prismOf(F, [[88, -24], [110, -24], [110, 14], [88, 14]], -22, 4, P), { tone: "hi" }) + S(k.cylinder(100, -14, 7, z0 + 4, 14, P, 24, 0.3), { tone: "mid" }) + S(k.slabOf({ x: 92, y: 0, w: 14, d: 11, r: 2 }, z0 + 4, 8, P, 3, 0.3), { tone: "mid" }));
    add(depthAt(184, 18, z0), S(G.prismOf(F, [[172, -22], [194, -18], [196, 50], [174, 58]], -10, 12, P), { tone: "hi" }));
    add(depthAt(130, 20, z0 + 30), Dots([[96, -20, 4], [104, 10, 4], [178, -18, 12], [192, 30, 12], [42, 46, 5], [80, 58, 5], [160, 62, 8]].map(([x, y, h]) => at([x, y, z0 + h])), { size: 0.55, tone: "hi" }));
    // ventilation hose: from the neck rearward between coils 3 and 4, over the exhaust-side cam actuators, down to a
    // two-bolt fitting beside the turbocharger's intake duct (route after M1 PDF 196, 252; the manual gives the hose's
    // destination only as ETKA, PDF 250)
    // The hoses are released before the separator comes off (M1 PDF 251-252), so the hose shows only assembled.
    let hose = "";
    TB.tubePieces([[100, -14, z0 + 18], [100, -18, z0 + 34], [104, -52, z0 + 46], [124, -104, z0 + 44], [146, -150, z0 + 20], [152, -160, z0 + 4]], 7, P, { maxLength: 24, rings: { pitch: 3.4, twist: 0, tone: "mid" } }).forEach((pc) => (hose += mat("cast", TB.tubeSvg(pc, { tone: "hi" }))));
    hose += mat("cast", S(k.slabOf({ x: 142, y: -172, w: 22, d: 22, r: 3 }, z0 - 10, 14, P, 3, 0.4), { tone: "hi" })) + Dots([[146, -168], [160, -158]].map(([x, y]) => at([x, y, z0 + 4])), { size: 0.55, tone: "hi" });
    add(depthAt(130, -88, z0 + 28), `<g class="gti-xv-assembled-only">${hose}</g>`);
    pieces.sort((a, b) => a.depth - b.depth).forEach((pc, i) => put(L, i, pc.svg));
  }

  // ---------------------------------------------------------------- vibration damper on the crankshaft nose (M1 PDF 82)
  function damper() {
    const L = "damper";
    const F = frameX();
    envelope(L, -74, 74);
    // a dark poly-V rim, a face recessed toward the engine, and a raised hub with the central bolt (after SSP 822223 p.24;
    // sizes drawn)
    let svg = mat("iron", S(G.lathe([[-252, 0], [-252, 70], [-250, 74], [-232, 74], [-230, 70], [-230, 0]], F, P), { tone: "hi" }) + Ln(G.ribsOf(F, -250, -232, 74, 140, P, { least: 0.1 }), { tone: "lo" }) + (faces([-1, 0, 0]) ? Ln(G.circleOf(F, -252, 60, P, 64), { tone: "mid" }) + `<path class="gti-xv-deep" d="${G.circleOf(F, -252, 58, P, 64)}"/>` : ""));
    svg += mat("steel", S(G.disc(-260, -246, 30, F, P, { bevel: 0.6 }), { tone: "hi" }) + S(G.disc(-266, -260, 14, F, P, { bevel: 0.4 }), { tone: "mid" }) + (faces([-1, 0, 0]) ? Dots(G.dotsOf(F, -260, 22, 4, P, { all: true, phase: 0.4 }), { size: 0.55, tone: "hi" }) : ""));
    put(L, depthAt(-241, 0, 0), svg);
  }

  // ---------------------------------------------------------------- intake manifold and throttle module (M1 PDF 409-414)
  // One moulded manifold bolted to the head's intake face with ten bolts in two rows of five (M1 PDF 410-411). Its ribbed
  // top carries the intake manifold sensor GX9 and two ball pins for the engine cover; the plenum hangs below the flange,
  // with the throttle valve control module GX3 on its underside directly below GX9, inlet facing down and forward. A
  // round housing closes the transmission end. The top height follows the SSP 822223 picture, where its ribbed edge shows
  // behind the coils. Seen here from behind, since the intake side faces away.
  function intake() {
    const L = "intake";
    const top = 288; // top edge about 18 mm above the upper bolt row (M1 PDF 411)
    envelope(L, 196, top + 16);
    const F = frameX();
    const out = [];
    out.push(S(G.prismOf(F, [[94, 268], [152, 268], [158, 236], [148, 206], [122, 196], [100, 208]], -124, 150, P), { tone: "hi" }));
    out.push(S(G.prismOf(F, [[88, 262], [88, 280], [98, top], [148, top], [156, 280], [152, 262]], -132, 160, P), { tone: "hi" }));
    // flange against the head's intake face, with its four ports and the ten bolts
    let flange = S(k.slabOf({ x: -184, y: 80, w: 368, d: 8, r: 3 }, 226, 40, P, 3, 0.4), { tone: "hi" });
    if (faces([0, -1, 0])) for (const x of XC) flange += `<path class="gti-xv-hole" d="${ringOnY(80, x, 246, 19, 10, 32)}"/>` + Ln(ringOnY(80, x, 246, 19, 10, 32), { tone: "hi" }) + Ln(ringOnY(80, x, 246, 24, 14, 36), { tone: "lo" });
    if (faces([0, -1, 0])) flange += Dots(XM.flatMap((x) => [at([x, 80, 232]), at([x, 80, 260])]), { size: 0.6, tone: "hi" });
    // the flange is in front of the bodies seen from the head side and behind them seen from the front of the car
    put(L, 0, mat("black", out.join("")));
    put(L, side([0, -1, 0], 0.5, -0.5), mat("plastic", flange));
    // ribbed top, GX9 and the two ball pins for the engine cover (M1 PDF 410 items 9, 11, 13; 411)
    const ribs = [];
    for (let i = 0; i < 9; i++) ribs.push(S(k.slabOf({ x: -122 + i * 32, y: 100, w: 4, d: 46, r: 1 }, top, 4, P, 2, 0.3), { tone: "mid" }));
    put(L, 1, mat("black", ribs.join("")));
    const pin = (x, y) => S(k.cylinder(x, y, 3.5, top, 14, P, 16, 0.2), { tone: "mid" }) + S(k.cylinder(x, y, 5.5, top + 14, 7, P, 20, 0.5), { tone: "hi" });
    put(L, 1.5, mat("black", S(k.slabOf({ x: 40, y: 114, w: 22, d: 16, r: 3 }, top + 4, 12, P, 3, 0.3), { tone: "hi" }) + pin(-112, 124) + pin(148, 124)));
    // throttle valve control module GX3: four bolts on the plenum's underside below GX9; inlet down and forward, its
    // drive housing toward the transmission end (M1 PDF 410, 413; S2 E p.24)
    const TF = G.frameAlong([51, 140, 203], G.unit3([0, 0.45, -0.89]));
    put(L, 2, S(G.lathe([[0, 0], [0, 30], [8, 30], [8, 26], [44, 26], [44, 0]], TF, P, { hole: [44, 21] }), { tone: "hi" }) + `<path class="gti-xv-bore" d="${G.circleOf(TF, 44, 21, P, 36)}"/>` + Ln(G.circleOf(TF, 44, 21, P, 36), { tone: "mid" }) + S(k.slabOf({ x: 76, y: 132, w: 26, d: 30, r: 5 }, 166, 30, P, 6, 0.5), { tone: "mid" }));
  }

  // ---------------------------------------------------------------- accessory drive (M1 PDF 82-85)
  // The sub-assembly bracket bolts to the intake side of the block at the timing end with five bolts (M1 PDF 83,
  // A13-11383) and carries the oil filter housing on top, the generator above and the A/C compressor below, their pulleys
  // in the ribbed-belt plane at the timing end. Pulley positions are read from the manual's end view of the belt drive
  // (M1 PDF 84, A13-11430), scaled to the vibration damper; the belt runs in the manual's order: vibration damper,
  // tensioner, generator, A/C compressor. Sizes are drawn, not printed.
  const BELT_X = -241;
  const PULLEYS = [
    { name: "damper", c: [0, 0], r: 74, s: 1 },
    { name: "ac", c: [209, -16], r: 60, s: 1 },
    { name: "gen", c: [214, 205], r: 30, s: 1 },
    { name: "tensioner", c: [137, 98], r: 28, s: -1 },
  ];
  // The belt as short straight pieces: wraps round each pulley and straight spans between them. Pulleys inside the loop
  // (s = 1) are wrapped anticlockwise; the tensioner (s = -1) presses on the back of the belt from outside the loop.
  function beltLoop(list, step = 8) {
    const tang = list.map((A, i) => {
      const B = list[(i + 1) % list.length];
      const D = [B.c[0] - A.c[0], B.c[1] - A.c[1]];
      const th = Math.atan2(D[1], D[0]) - Math.asin((B.s * B.r - A.s * A.r) / Math.hypot(D[0], D[1]));
      const n = [-Math.sin(th), Math.cos(th)];
      return { p1: [A.c[0] - A.s * A.r * n[0], A.c[1] - A.s * A.r * n[1]], p2: [B.c[0] - B.s * B.r * n[0], B.c[1] - B.s * B.r * n[1]], out: [-n[0], -n[1]] };
    });
    const pieces = [];
    list.forEach((A, i) => {
      const arrive = tang[(i - 1 + list.length) % list.length].p2;
      const leave = tang[i].p1;
      const a0 = Math.atan2(arrive[1] - A.c[1], arrive[0] - A.c[0]);
      let a1 = Math.atan2(leave[1] - A.c[1], leave[0] - A.c[0]);
      if (A.s > 0) while (a1 < a0) a1 += 2 * Math.PI;
      else while (a1 > a0) a1 -= 2 * Math.PI;
      const m = Math.max(1, Math.ceil((Math.abs(a1 - a0) * A.r) / step));
      for (let j = 0; j < m; j++) {
        const u0 = a0 + ((a1 - a0) * j) / m;
        const u1 = a0 + ((a1 - a0) * (j + 1)) / m;
        const um = (u0 + u1) / 2;
        const radial = [Math.cos(um), Math.sin(um)];
        pieces.push({ a: [A.c[0] + A.r * Math.cos(u0), A.c[1] + A.r * Math.sin(u0)], b: [A.c[0] + A.r * Math.cos(u1), A.c[1] + A.r * Math.sin(u1)], out: A.s > 0 ? radial : [-radial[0], -radial[1]], on: A.name });
      }
      pieces.push({ a: tang[i].p1, b: tang[i].p2, out: tang[i].out, on: null });
    });
    return pieces;
  }
  // One piece of the ribbed belt: a thin band 18 mm wide, its outer face along out.
  function beltPiece(pc) {
    const A = [BELT_X, pc.a[0], pc.a[1]];
    const len = Math.hypot(pc.b[0] - pc.a[0], pc.b[1] - pc.a[1]);
    const F = G.frameOf(A, [0, (pc.b[0] - pc.a[0]) / len, (pc.b[1] - pc.a[1]) / len], [1, 0, 0], [0, pc.out[0], pc.out[1]]);
    return S(G.prismOf(F, [[-9, -2.2], [9, -2.2], [9, 2.2], [-9, 2.2]], 0, len + 0.4, P), { tone: "hi" });
  }
  function accessories() {
    const L = "accessories";
    envelope(L, -112, 330);
    const add = (p3, svg) => put(L, depthAt(...p3), svg);
    // sub-assembly bracket: an upper and a lower casting, five bolts into the block (M1 PDF 83)
    const BF = G.frameOf([0, 96, 0], [0, 1, 0], [-1, 0, 0], [0, 0, 1]);
    const upper = G.hullOf([[-232, 255], [-150, 262], [-96, 250], [-60, 205], [-60, 120], [-232, 120]].map(([x, z]) => [-x, z]));
    const lower = G.hullOf([[-232, 125], [-60, 125], [28, 40], [30, -20], [-90, -80], [-150, -110], [-212, -110], [-232, -60]].map(([x, z]) => [-x, z]));
    const boss = (x, z) => S(G.disc(128, 135, 8, G.frameOf([x, 0, z], [0, 1, 0], [0, 0, 1], [1, 0, 0]), P, { bevel: 0.3 }), { tone: "hi" });
    let bracket = S(G.prismOf(BF, lower, 0, 32, P), { tone: "hi" }) + S(G.prismOf(BF, upper, 0, 32, P), { tone: "hi" });
    // a ribbed casting: pockets between its webs on whichever face is turned to the viewer
    const yFace = faces([0, 1, 0]) ? 128.2 : 95.8;
    for (const q of [[[-218, 236], [-160, 244], [-118, 232], [-118, 140], [-218, 140]], [[-104, 226], [-74, 198], [-74, 140], [-104, 140]], [[-218, 108], [-140, 108], [-140, 20], [-218, 20]], [[-126, 108], [-70, 108], [-6, 44], [-6, 20], [-126, 20]], [[-212, 6], [-104, 6], [-104, -52], [-160, -96], [-206, -96], [-218, -50]], [[-90, 6], [10, 6], [12, -14], [-90, -66]]]) {
      const pts = q.map(([x, z]) => [x, yFace, z]);
      bracket += `<path class="gti-xv-deep" d="${poly(pts)}"/>` + Ln(poly(pts), { tone: "hi" });
    }
    if (faces([0, 1, 0])) bracket += [[-95, 245], [-130, 135], [-58, 132], [23, -25], [-113, -90]].map(([x, z]) => boss(x, z)).join("");
    add([-100, 115, 80], mat("cast", bracket));
    // oil filter housing on top of the bracket, with the black filter cap
    add([-170, 124, 258], mat("cast", S(k.cylinder(-170, 124, 38, 214, 16, P, 40, 0.6), { tone: "hi" })) + mat("black", S(k.cylinder(-170, 124, 33, 230, 62, P, 40, 0.6), { tone: "hi" }) + S(k.cylinder(-170, 124, 33, 292, 16, P, 40, 0.6), { tone: "hi" }) + Ln(k.knurl(-170, 124, 33, 292, 308, 40, P), { tone: "mid" }) + S(k.cylinder(-170, 124, 16, 308, 7, P, 6, 0.3), { tone: "hi" })));
    // generator: pulley in the belt plane, body with cooling slots, rear cover
    const GF = frameX(0, 214, 205);
    add([-241, 214, 205], mat("iron", S(G.disc(-250, -232, 28, GF, P, { bevel: 0.4 }), { tone: "mid" }) + Ln(G.ribsOf(GF, -249, -233, 28, 30, P, { least: 0.2 }), { tone: "lo" })));
    add([-191, 214, 205], mat("cast", S(G.disc(-232, -150, 66, GF, P, { bevel: 0.8 }), { tone: "hi" }) + Ln(G.ribsOf(GF, -226, -204, 66, 44, P, { least: 0.25, seams: true }), { tone: "lo" }) + Ln(G.ribsOf(GF, -176, -156, 66, 44, P, { least: 0.25, seams: true }), { tone: "lo" })));
    let rear = S(G.disc(-150, -138, 54, GF, P, { bevel: 0.6 }), { tone: "hi" });
    if (faces([1, 0, 0])) rear += Ln(G.spokesOf(GF, -138, 16, 46, 12, P), { tone: "lo" }) + Ln(G.circleOf(GF, -138, 46, P, 48), { tone: "lo" }) + Ln(G.circleOf(GF, -138, 16, P, 24), { tone: "mid" });
    add([-144, 214, 205], mat("cast", rear));
    // A/C compressor: clutch pulley in the belt plane, body, rear head with the two refrigerant ports
    const AF = frameX(0, 209, -16);
    add([-239, 209, -16], mat("iron", S(G.disc(-252, -226, 58, AF, P, { bevel: 0.5 }), { tone: "mid" }) + Ln(G.ribsOf(AF, -251, -227, 58, 60, P, { least: 0.2, seams: true }), { tone: "lo" }) + (faces([-1, 0, 0]) ? Ln(G.circleOf(AF, -252, 22, P, 32), { tone: "lo" }) : "")));
    add([-188, 209, -16], mat("cast", S(G.disc(-226, -150, 60, AF, P, { bevel: 0.8 }), { tone: "hi" })));
    let head = S(G.disc(-150, -136, 52, AF, P, { bevel: 0.6 }), { tone: "hi" });
    for (const [y, z] of [[192, 18], [228, 14]]) head += S(k.slabOf({ x: -138, y: y - 9, w: 14, d: 18, r: 3 }, z - 9, 18, P, 3, 0.3), { tone: "mid" });
    add([-143, 209, -16], mat("cast", head));
    // ribbed belt tensioner: spring housing on the bracket's end, arm down to its pulley (M1 PDF 85)
    add([-220, 131, 168], mat("iron", S(G.disc(-232, -208, 30, frameX(0, 131, 168), P, { bevel: 0.6 }), { tone: "hi" })));
    add([-236, 134, 133], mat("iron", S(G.prismOf(frameX(), G.hullOf([...circle(131, 168, 16, 16), ...circle(137, 98, 14, 16)]), -238, -232, P), { tone: "hi" })));
    add([-241, 137, 98], mat("steel", S(G.disc(-249, -233, 26, frameX(0, 137, 98), P, { bevel: 0.4 }), { tone: "hi" }) + (faces([-1, 0, 0]) ? Dots([at([-249, 137, 98])], { size: 0.7, tone: "hi" }) : "")));
    // the ribbed belt is shown with the engine assembled (it needs the crankshaft pulley in place); the pieces wrapping
    // the vibration damper belong to the damper layer so they sort with the damper itself
    for (const pc of beltLoop(PULLEYS)) {
      const mid = [BELT_X, (pc.a[0] + pc.b[0]) / 2, (pc.a[1] + pc.b[1]) / 2];
      const svg = `<g class="gti-xv-assembled-only">${mat("black", beltPiece(pc))}</g>`;
      if (Math.min(pc.a[0], pc.b[0]) - 9 < 104) put("damper", depthAt(...mid), svg);
      else put(L, depthAt(...mid) + (pc.on ? 0.5 : 0), svg);
    }
  }

  // ---------------------------------------------------------------- coolant pump and thermal management (M1 PDF 266, 285-299)
  // The engine temperature control actuator N493 (the rotary-valve thermostat housing) with the coolant pump bolted to it
  // sits on the intake side under the intake manifold, toward the transmission end. The pump is driven by a toothed belt
  // from the intake-side balance shaft, under a toothed belt guard at the module's transmission end (M1 PDF 286,
  // A19-000138). The radiator belongs to the car's front end (M1 PDF 266, 312) and is not drawn. Shapes are drawn.
  function cooling() {
    const L = "cooling";
    envelope(L, 30, 182);
    const add = (p3, svg) => put(L, depthAt(...p3), svg);
    // N493 housing with its connections: the large stub to the radiator hose points forward and down, a smaller one rises
    // toward the cylinder head
    add([118, 110, 100], S(k.slabOf({ x: 86, y: 92, w: 64, d: 34, r: 12 }, 62, 76, P, 8, 0.8), { tone: "hi" }));
    const HF = G.frameAlong([116, 144, 84], G.unit3([0, 0.6, -0.8]));
    add([116, 160, 66], S(G.disc(0, 36, 18, HF, P, { hole: [36, 12], bevel: 0.4 }), { tone: "hi" }) + `<path class="gti-xv-deep" d="${G.circleOf(HF, 36, 12, P, 28)}"/>`);
    add([100, 122, 170], S(k.cylinder(100, 122, 12, 158, 24, P, 24, 0.4), { tone: "hi" }) + `<path class="gti-xv-deep" d="${k.cylinder(100, 122, 7, 182, 0.01, P, 18).fill}"/>`);
    // coolant pump: a round housing on the module's transmission-end side, four bolts
    const PF = frameX(0, 100, 150);
    add([166, 100, 150], S(G.disc(152, 174, 24, PF, P, { bevel: 0.6 }), { tone: "hi" }));
    // toothed belt guard over the belt from the balance shaft sprocket up to the pump (2 bolts)
    const guard = circle(100, 150, 20, 32);
    let gsvg = S(G.prismOf(frameX(), guard, 174, 182, P), { tone: "hi" });
    if (faces([1, 0, 0])) {
      // a recessed slotted face inside the rim
      gsvg += Ln(G.circleOf(frameX(0, 100, 150), 182, 16, P, 40), { tone: "mid" });
      for (let i = -2; i <= 2; i++) { const zz = 150 + i * 6; const half = Math.sqrt(Math.max(0, 16 * 16 - (i * 6) ** 2)); gsvg += Ln(k.pathOf([at([182, 100 - half, zz]), at([182, 100 + half, zz])]), { tone: "mid" }); }
    }
    add([182, 100, 150], gsvg);
  }

  // ---------------------------------------------------------------- vacuum pump and high-pressure fuel pump (M1 PDF 143-144, 439)
  // Both bolt to the cylinder head's transmission end; a layer of their own so they stay in front when assembled.
  function pumps() {
    const L = "pumps";
    envelope(L, 120, 376);
    // the silver housing on the head's transmission end at the camshafts' height, above the vacuum pump: a square flange
    // on the head, a cylinder with a groove and a collar standing past the head end, tilted up and toward the intake side
    // so its flat round end faces up and outward, and a black sensor on its side (shape, size, place and tilt after the
    // SSP 822223 picture; the manual does not show it separately)
    const HA = G.unit3([1, 0.7, 0.7]);
    const HB = G.frameAlong([196, 14, 334], HA);
    let hb = S(k.slabOf({ x: 166, y: -8, w: 36, d: 52, r: 5 }, 310, 48, P, 4, 0.5), { tone: "hi" });
    hb += S(G.lathe([[0, 0], [0, 30], [14, 30], [18, 27], [30, 27], [34, 31], [52, 31], [54, 36], [62, 36], [64, 30], [70, 24], [72, 24], [72, 0]], HB, P), { tone: "hi" });
    if (faces(HA)) hb += Ln(G.circleOf(HB, 72, 14, P, 28), { tone: "mid" });
    // the sensor on the barrel's outboard side, its connector pointing down
    const out = G.unit3(G.sub3([-0.2, -1, -0.3], G.mul3(HA, G.dot3([-0.2, -1, -0.3], HA))));
    const sensor = G.add3(G.add3([196, 14, 334], G.mul3(HA, 40)), G.mul3(out, 36));
    put(L, depthAt(224, 14, 334) - 1, mat("alu", hb));
    put(L, depthAt(...sensor) + 2, mat("black", S(k.slabOf({ x: sensor[0] - 9, y: sensor[1] - 8, w: 18, d: 16, r: 3 }, sensor[2] - 10, 16, P, 3, 0.3), { tone: "hi" })));
    // vacuum pump on the head's transmission-end face (M1 PDF 143-144, 439): a round cover with three bolt lugs
    // (M6 x 90 x 70) and the vacuum line leaving its top; size and place on the end face fitted to the SSP 822223 picture
    const VC = [32, 222];
    const VF = frameX(0, ...VC);
    const lugs = [0.3, 1.0, 1.62].map((a) => [VC[0] + 56 * Math.cos(a * Math.PI), VC[1] + 56 * Math.sin(a * Math.PI)]);
    // a round cover, gently domed, its three bolt lugs standing out as small ears round the rim
    let vp = lugs.map(([y, z]) => S(G.disc(188, 199, 8, frameX(0, y, z), P, { bevel: 0.3 }), { tone: "hi" })).join("") + S(G.lathe([[188, 0], [188, 52], [198, 52], [201, 49, 1], [203, 42, 1], [204, 0]], VF, P), { tone: "hi" });
    if (faces([1, 0, 0])) vp += Ln(G.circleOf(VF, 204, 44, P, 56), { tone: "mid" }) + Dots(lugs.map(([y, z]) => at([199, y, z])), { size: 0.75, tone: "hi" });
    put(L, depthAt(204, ...VC), mat("cast", vp));
    TB.tubePieces([[206, 28, 268], [206, 24, 290], [200, 20, 311]], 3.5, P, { maxLength: 40 }).forEach((pc) => put(L, depthAt(...pc.mid) + 1, mat("plastic", TB.tubeSvg(pc, { tone: "hi" }))));
    // high-pressure fuel pump on the transmission end, below the vacuum pump (M1 PDF 439 items 1-5, 12-13): a short
    // steel body with its black ribbed valve cap facing out (place fitted to the picture)
    const HC = [96, 182];
    const HF = frameX(0, ...HC);
    let hp = S(G.disc(188, 196, 22, HF, P, { bevel: 0.4 }), { tone: "hi" }) + S(G.disc(196, 204, 17, HF, P, { bevel: 0.5 }), { tone: "hi" });
    hp += mat("black", S(G.disc(204, 218, 15, HF, P, { bevel: 0.6 }), { tone: "hi" }) + (faces([1, 0, 0]) ? [-8, -3, 2, 7].map((dz) => { const h = Math.sqrt(12 * 12 - dz * dz); return Ln(k.pathOf([at([218, HC[0] - h, HC[1] + dz]), at([218, HC[0] + h, HC[1] + dz])]), { tone: "mid" }); }).join("") + Ln(G.circleOf(HF, 218, 12, P, 28), { tone: "mid" }) : ""));
    put(L, depthAt(208, ...HC), mat("steel", hp));
  }

  const BUILDERS = [panLower, panUpper, crank, damper, caps, flywheel, rods, pistons, rings, block, accessories, cooling, turbo, gasket, valves, head, pumps, intake, cams, cover, coils, breather];
  function buildAll() {
    items.length = 0;
    for (const key of Object.keys(bounds)) delete bounds[key];
    for (const b of BUILDERS) b();
  }


  // ---------------------------------------------------------------- order of the layers beside the stack
  // Each layer beside the stack lies wholly beyond one face of the block and head (the turbocharger beyond the exhaust
  // face, the intake manifold, accessory drive and coolant module beyond the intake face, the pumps and flywheel beyond
  // the transmission end, the vibration damper beyond the timing end). That face is a plane separating the layer from the
  // block and head, so the layer is in front of them exactly when the face is turned toward the viewer. Layers on the
  // same side are ordered by the depth of their centres, nearest last. The coils sit on top, always over the head cover.
  const SIDE = {
    turbo: { n: [0, -1, 0], c: [90, -180, 280] },
    pumps: { n: [1, 0, 0], c: [205, 20, 250] },
    intake: { n: [0, 1, 0], c: [10, 120, 280] },
    accessories: { n: [0, 1, 0], c: [-170, 180, 120] },
    cooling: { n: [0, 1, 0], c: [130, 140, 110] },
    flywheel: { n: [1, 0, 0], c: [215, 0, 0] },
    damper: { n: [-1, 0, 0], c: [-245, 0, 0] },
  };
  const assembledRank = (id) => (id === "coils" ? "over" : SIDE[id] ? (faces(SIDE[id].n) ? "front" : "back") : null);

  // Draw every part for projection proj; items and bounds are refilled in place.
  function render(proj) {
    P = proj;
    buildAll();
    return { items, bounds };
  }
  // The assembled-pose rank of each layer for projection proj: "over", "front", "back" or absent.
  function ranks(proj, ids) {
    P = proj;
    return Object.fromEntries(ids.map((id) => [id, assembledRank(id)]).filter(([, r]) => r));
  }
  // The depth of each side layer's centre for projection proj, to order layers that share a rank.
  function sideDepths(proj, ids) {
    P = proj;
    return Object.fromEntries(ids.filter((id) => SIDE[id]).map((id) => [id, Math.round(depthAt(...SIDE[id].c) * 100) / 100]));
  }
  return { SPEC, LAYOUT, XC, XM, crownZ, circle, items, bounds, render, ranks, sideDepths };
}
