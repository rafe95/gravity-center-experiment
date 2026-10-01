import { gravityLayout, rankRadii, valueRadii } from './gravity-layout';

const radiusOptions = { baseRadius: 50, decay: 0.04, minRatio: 0.6 };
const gap = 6;

/** Small seeded PRNG (mulberry32) so randomized layouts are reproducible in tests. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function expectNoOverlap(circles: ReturnType<typeof gravityLayout>): void {
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const d = Math.hypot(circles[i].x - circles[j].x, circles[i].y - circles[j].y);
      expect(d).toBeGreaterThanOrEqual(circles[i].r + circles[j].r + gap - 1e-6);
    }
  }
}

describe('gravityLayout', () => {
  it('returns nothing for zero circles', () => {
    expect(gravityLayout([], gap)).toEqual([]);
  });

  it('centers a single circle', () => {
    const [c] = gravityLayout([50], gap);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(0);
    expect(c.r).toBe(50);
  });

  it('places two circles side by side', () => {
    const [a, b] = gravityLayout([50, 50], gap);
    expect(a.y).toBeCloseTo(b.y);
    expect(a.x).toBeLessThan(b.x);
  });

  it('never overlaps circles', () => {
    const cases = [3, 5, 9, 25].map((n) => rankRadii(n, radiusOptions));
    cases.push(valueRadii([5, 100, 30, 70, 1, 55, 90, 12], radiusOptions));
    for (const radii of cases) {
      expectNoOverlap(gravityLayout(radii, gap));
    }
  });
});

describe('gravityLayout with randomize', () => {
  it('ignores randomness for one or two circles', () => {
    for (const n of [1, 2]) {
      const radii = rankRadii(n, radiusOptions);
      expect(gravityLayout(radii, gap, seeded(1))).toEqual(gravityLayout(radii, gap));
    }
  });

  it('never overlaps circles', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expectNoOverlap(gravityLayout(rankRadii(15, radiusOptions), gap, seeded(seed)));
      expectNoOverlap(
        gravityLayout(
          valueRadii([5, 100, 30, 70, 1, 55, 90, 12], radiusOptions),
          gap,
          seeded(seed),
        ),
      );
    }
  });

  it('is reproducible for the same random source', () => {
    const radii = rankRadii(9, radiusOptions);
    expect(gravityLayout(radii, gap, seeded(7))).toEqual(gravityLayout(radii, gap, seeded(7)));
  });

  it('varies the shape between random sources', () => {
    const radii = rankRadii(9, radiusOptions);
    const layouts = [1, 2, 3, 4, 5].map((seed) =>
      JSON.stringify(gravityLayout(radii, gap, seeded(seed))),
    );
    expect(new Set(layouts).size).toBeGreaterThan(1);
  });

  it('keeps the cluster about as compact as the default layout', () => {
    const radii = rankRadii(15, radiusOptions);
    const extent = (circles: ReturnType<typeof gravityLayout>) =>
      Math.max(...circles.map((c) => Math.hypot(c.x, c.y) + c.r));
    const base = extent(gravityLayout(radii, gap));
    for (let seed = 1; seed <= 20; seed++) {
      expect(extent(gravityLayout(radii, gap, seeded(seed)))).toBeLessThan(base * 1.5);
    }
  });
});

describe('rankRadii', () => {
  it('shrinks later circles down to the minimum ratio', () => {
    const radii = rankRadii(20, radiusOptions);
    expect(radii[0]).toBe(50);
    expect(radii[1]).toBeLessThan(radii[0]);
    expect(radii[19]).toBe(30);
  });
});

describe('valueRadii', () => {
  it('maps the highest value to the base radius and the lowest to the minimum', () => {
    expect(valueRadii([10, 55, 100], radiusOptions)).toEqual([30, 40, 50]);
  });

  it('gives equal values the full radius', () => {
    expect(valueRadii([42, 42], radiusOptions)).toEqual([50, 50]);
  });
});
