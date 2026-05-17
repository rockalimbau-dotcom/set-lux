import { describe, expect, it } from 'vitest';

import {
  PDF_LANDSCAPE_HEIGHT_MM,
  PDF_LANDSCAPE_HEIGHT_PX,
  PDF_LANDSCAPE_WIDTH_MM,
  computeUniformLayoutScale,
  fitRectInLandscapePage,
} from './landscapeCapture';

describe('computeUniformLayoutScale', () => {
  it('returns 1 when content fits within page height', () => {
    expect(computeUniformLayoutScale(600)).toBe(1);
    expect(computeUniformLayoutScale(PDF_LANDSCAPE_HEIGHT_PX)).toBe(1);
  });

  it('shrinks uniformly when content exceeds page height', () => {
    const scale = computeUniformLayoutScale(PDF_LANDSCAPE_HEIGHT_PX * 2);
    expect(scale).toBeCloseTo(0.5);
  });
});

describe('fitRectInLandscapePage', () => {
  it('fills page width when content is wider than the page ratio', () => {
    const fit = fitRectInLandscapePage(2000, 400);
    expect(fit.width).toBe(PDF_LANDSCAPE_WIDTH_MM);
    expect(fit.x).toBe(0);
    expect(fit.height).toBeLessThan(PDF_LANDSCAPE_HEIGHT_MM);
    expect(fit.y).toBeGreaterThan(0);
  });

  it('preserves aspect ratio when content is taller than the page', () => {
    const fit = fitRectInLandscapePage(800, 2000);
    const aspect = 800 / 2000;
    expect(fit.width / fit.height).toBeCloseTo(aspect, 5);
    expect(fit.width).toBeLessThanOrEqual(PDF_LANDSCAPE_WIDTH_MM);
    expect(fit.height).toBeLessThanOrEqual(PDF_LANDSCAPE_HEIGHT_MM);
  });
});
