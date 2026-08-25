import { describe, expect, it } from 'vitest';
import { nowMs } from './clock';

describe('nowMs', () => {
  it('retourne un timestamp fini, non décroissant, sur l\'origine performance', () => {
    const a = nowMs();
    const b = nowMs();
    expect(Number.isFinite(a)).toBe(true);
    expect(b).toBeGreaterThanOrEqual(a);
    // origin is "page load", far away from the Date.now() epoch:
    // fails if someone reimplements nowMs using Date.now()
    expect(a).toBeLessThan(Date.now());
  });
});
