/**
 * Procedural point-cloud targets for the reach-out finale.
 * Each returns Float32Array(count * 3), roughly 5 units tall, centred at 0.
 * Built from 2D signed-distance unions so points read as clear silhouettes.
 */

type SDF = (x: number, y: number) => number;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const capsule =
  (ax: number, ay: number, bx: number, by: number, r: number): SDF =>
  (x, y) => {
    const pax = x - ax;
    const pay = y - ay;
    const bax = bx - ax;
    const bay = by - ay;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
    return Math.hypot(pax - bax * h, pay - bay * h) - r;
  };

const circle =
  (cx: number, cy: number, r: number): SDF =>
  (x, y) =>
    Math.hypot(x - cx, y - cy) - r;

const ellipse =
  (cx: number, cy: number, rx: number, ry: number): SDF =>
  (x, y) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return (Math.sqrt(dx * dx + dy * dy) - 1) * Math.min(rx, ry);
  };

const box =
  (cx: number, cy: number, hw: number, hh: number): SDF =>
  (x, y) => {
    const dx = Math.abs(x - cx) - hw;
    const dy = Math.abs(y - cy) - hh;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  };

const union =
  (...fs: SDF[]): SDF =>
  (x, y) => {
    let d = Infinity;
    for (const f of fs) d = Math.min(d, f(x, y));
    return d;
  };

interface Layer {
  sdf: SDF;
  /** share of points */
  weight: number;
  /** "edge" = on the outline, "fill" = inside */
  mode: "edge" | "fill";
  depth: number;
}

function sampleLayers(
  count: number,
  layers: Layer[],
  bounds: [number, number, number, number],
  seed: number
): Float32Array {
  const out = new Float32Array(count * 3);
  const rand = rng(seed);
  const total = layers.reduce((a, l) => a + l.weight, 0);
  const [minX, minY, maxX, maxY] = bounds;
  let idx = 0;
  layers.forEach((layer, li) => {
    const n =
      li === layers.length - 1 ? count - idx : Math.floor((layer.weight / total) * count);
    let placed = 0;
    let guard = 0;
    while (placed < n && guard < n * 400) {
      guard++;
      const x = minX + rand() * (maxX - minX);
      const y = minY + rand() * (maxY - minY);
      const d = layer.sdf(x, y);
      const ok = layer.mode === "edge" ? Math.abs(d) < 0.045 : d < 0;
      if (!ok) continue;
      const o = (idx + placed) * 3;
      out[o] = x;
      out[o + 1] = y;
      out[o + 2] = (rand() - 0.5) * layer.depth;
      placed++;
    }
    // If rejection sampling ran dry, stack leftovers at the centre of mass.
    for (; placed < n; placed++) {
      const o = (idx + placed) * 3;
      out[o] = 0;
      out[o + 1] = 0;
      out[o + 2] = 0;
    }
    idx += n;
  });
  return out;
}

export function cloudShape(count: number, seed = 1): Float32Array {
  const out = new Float32Array(count * 3);
  const rand = rng(seed);
  for (let i = 0; i < count; i++) {
    const u = rand() * Math.PI * 2;
    const v = Math.acos(2 * rand() - 1);
    const r = 2.2 + Math.pow(rand(), 0.6) * 2.6;
    out[i * 3] = Math.sin(v) * Math.cos(u) * r * 1.25;
    out[i * 3 + 1] = Math.cos(v) * r * 0.8;
    out[i * 3 + 2] = Math.sin(v) * Math.sin(u) * r * 0.7;
  }
  return out;
}

/** Open raised hand: "I'm here." */
export function handShape(count: number, seed = 2): Float32Array {
  const palm = union(ellipse(0, -0.75, 1.05, 1.15), box(0, -0.35, 0.95, 0.7));
  const fingers = union(
    capsule(-0.72, 0.2, -0.95, 1.75, 0.23),
    capsule(-0.24, 0.35, -0.3, 2.2, 0.24),
    capsule(0.26, 0.35, 0.32, 2.1, 0.24),
    capsule(0.74, 0.2, 0.92, 1.6, 0.22)
  );
  const thumb = capsule(-0.85, -0.85, -1.95, 0.25, 0.26);
  const wrist = box(0, -2.05, 0.7, 0.35);
  const hand = union(palm, fingers, thumb, wrist);
  return sampleLayers(
    count,
    [
      { sdf: hand, weight: 0.42, mode: "edge", depth: 0.15 },
      { sdf: hand, weight: 0.58, mode: "fill", depth: 0.45 },
    ],
    [-2.4, -2.5, 1.4, 2.5],
    seed
  );
}

/** Sealed envelope with a wax seal. */
export function envelopeShape(count: number, seed = 3): Float32Array {
  const W = 2.1;
  const H = 1.35;
  const body = box(0, 0, W, H);
  const flap = union(
    capsule(-W, H, 0, -0.1, 0.01),
    capsule(W, H, 0, -0.1, 0.01)
  );
  const lower = union(
    capsule(-W, -H, -0.55, -0.25, 0.01),
    capsule(W, -H, 0.55, -0.25, 0.01)
  );
  const seal = circle(0, -0.15, 0.38);
  return sampleLayers(
    count,
    [
      { sdf: body, weight: 0.34, mode: "edge", depth: 0.1 },
      { sdf: flap, weight: 0.2, mode: "edge", depth: 0.1 },
      { sdf: lower, weight: 0.1, mode: "edge", depth: 0.1 },
      { sdf: seal, weight: 0.14, mode: "fill", depth: 0.2 },
      { sdf: body, weight: 0.22, mode: "fill", depth: 0.12 },
    ],
    [-2.4, -1.6, 2.4, 1.6],
    seed
  );
}

/** Three-lobed fidget spinner. */
export function spinnerShape(count: number, seed = 4): Float32Array {
  const lobes: SDF[] = [];
  const weights: SDF[] = [];
  const arms: SDF[] = [];
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
    const cx = Math.cos(a) * 1.55;
    const cy = Math.sin(a) * 1.55;
    lobes.push(circle(cx, cy, 0.95));
    weights.push(circle(cx, cy, 0.48));
    arms.push(capsule(0, 0, cx, cy, 0.55));
  }
  const body = union(...lobes, ...arms, circle(0, 0, 0.9));
  const holes = union(...weights);
  const hub = circle(0, 0, 0.42);
  return sampleLayers(
    count,
    [
      { sdf: body, weight: 0.4, mode: "edge", depth: 0.2 },
      { sdf: holes, weight: 0.25, mode: "edge", depth: 0.2 },
      { sdf: hub, weight: 0.12, mode: "fill", depth: 0.25 },
      { sdf: body, weight: 0.23, mode: "fill", depth: 0.3 },
    ],
    [-2.6, -1.6, 2.6, 2.6],
    seed
  );
}
