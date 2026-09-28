import { gravityLayout, rankRadii, valueRadii } from './gravity-layout';

const radiusOptions = { baseRadius: 50, decay: 0.04, minRatio: 0.6 };
const gap = 6;

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
      const circles = gravityLayout(radii, gap);
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const d = Math.hypot(circles[i].x - circles[j].x, circles[i].y - circles[j].y);
          expect(d).toBeGreaterThanOrEqual(circles[i].r + circles[j].r + gap - 1e-6);
        }
      }
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
