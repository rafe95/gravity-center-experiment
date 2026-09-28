export interface PlacedCircle {
  x: number;
  y: number;
  r: number;
}

export interface RadiusOptions {
  /** Radius of the largest circle. */
  baseRadius: number;
  /** How much each subsequent circle shrinks, as a fraction of `baseRadius`. */
  decay: number;
  /** Smallest allowed radius, as a fraction of `baseRadius`. */
  minRatio: number;
}

const EPSILON = 1e-6;
const RING_SAMPLES = 36;

/** Radii that shrink gently with position: the first circle is the largest. */
export function rankRadii(count: number, options: RadiusOptions): number[] {
  return Array.from(
    { length: count },
    (_, i) => options.baseRadius * Math.max(options.minRatio, 1 - options.decay * i),
  );
}

/**
 * Radii proportional to value: the highest value gets `baseRadius`, the lowest gets
 * `minRatio * baseRadius`, and everything in between is interpolated linearly.
 * Equal values always get equal radii.
 */
export function valueRadii(values: readonly number[], options: RadiusOptions): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  return values.map((v) => {
    const t = span === 0 ? 1 : (v - min) / span;
    return options.baseRadius * (options.minRatio + (1 - options.minRatio) * t);
  });
}

/**
 * Packs circles with the given radii around a common center of gravity.
 * Circle 0 is placed first; every following circle is dropped into the free spot
 * closest to circle 0, preferring spots near the (area-weighted) centroid on ties.
 * The result is re-centered so the cluster's bounding box is centered on the origin.
 */
export function gravityLayout(radii: readonly number[], gap: number): PlacedCircle[] {
  const placed: PlacedCircle[] = [];

  for (const r of radii) {
    placed.push(placed.length === 0 ? { x: 0, y: 0, r } : { ...bestSpot(placed, r, gap), r });
  }

  return recenter(placed);
}

function bestSpot(placed: PlacedCircle[], r: number, gap: number): { x: number; y: number } {
  const { x: cx, y: cy } = centroid(placed);
  let best: { x: number; y: number } | undefined;
  let bestKey: number[] = [];

  for (const candidate of candidates(placed, r, gap)) {
    if (!fits(candidate, r, placed, gap)) {
      continue;
    }
    // Closest to the heaviest (first) circle, then to the cluster's centroid so it stays
    // balanced; remaining ties favour horizontal, then lower, then right.
    const key = [
      Math.hypot(candidate.x - placed[0].x, candidate.y - placed[0].y),
      Math.hypot(candidate.x - cx, candidate.y - cy),
      Math.abs(candidate.y - cy),
      -candidate.y,
      -candidate.x,
    ];
    if (!best || isLess(key, bestKey)) {
      best = candidate;
      bestKey = key;
    }
  }

  // A ring around the first circle always has room, so this is only a safety net.
  return best ?? { x: placed[0].x + placed[0].r + r + gap, y: placed[0].y };
}

function* candidates(placed: PlacedCircle[], r: number, gap: number) {
  for (const a of placed) {
    const d = a.r + r + gap;
    for (let k = 0; k < RING_SAMPLES; k++) {
      const angle = (2 * Math.PI * k) / RING_SAMPLES;
      yield { x: a.x + d * Math.cos(angle), y: a.y + d * Math.sin(angle) };
    }
  }

  // Spots touching two circles at once give the tightest packing.
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      yield* tangentToBoth(placed[i], placed[j], r, gap);
    }
  }
}

function* tangentToBoth(a: PlacedCircle, b: PlacedCircle, r: number, gap: number) {
  const ra = a.r + r + gap;
  const rb = b.r + r + gap;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < EPSILON || d > ra + rb || d < Math.abs(ra - rb)) {
    return;
  }
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const mx = a.x + (along * dx) / d;
  const my = a.y + (along * dy) / d;
  yield { x: mx - (h * dy) / d, y: my + (h * dx) / d };
  yield { x: mx + (h * dy) / d, y: my - (h * dx) / d };
}

function fits(p: { x: number; y: number }, r: number, placed: PlacedCircle[], gap: number): boolean {
  return placed.every((c) => Math.hypot(p.x - c.x, p.y - c.y) >= c.r + r + gap - EPSILON);
}

function centroid(placed: PlacedCircle[]): { x: number; y: number } {
  let mass = 0;
  let x = 0;
  let y = 0;
  for (const c of placed) {
    const m = c.r * c.r;
    mass += m;
    x += c.x * m;
    y += c.y * m;
  }
  return { x: x / mass, y: y / mass };
}

function recenter(placed: PlacedCircle[]): PlacedCircle[] {
  if (placed.length === 0) {
    return placed;
  }
  const minX = Math.min(...placed.map((c) => c.x - c.r));
  const maxX = Math.max(...placed.map((c) => c.x + c.r));
  const minY = Math.min(...placed.map((c) => c.y - c.r));
  const maxY = Math.max(...placed.map((c) => c.y + c.r));
  const ox = (minX + maxX) / 2;
  const oy = (minY + maxY) / 2;
  return placed.map((c) => ({ ...c, x: c.x - ox, y: c.y - oy }));
}

function isLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > EPSILON) {
      return a[i] < b[i];
    }
  }
  return false;
}
