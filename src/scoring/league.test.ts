import { describe, expect, it } from 'vitest';
import { nextTier, tierForPoints, tierRank, TIERS } from './league';

describe('league', () => {
  it('attribue le bon tier selon le total', () => {
    expect(tierForPoints(0)).toBeNull();
    expect(tierForPoints(99)).toBeNull();
    expect(tierForPoints(100)).toBe('bronze');
    expect(tierForPoints(400)).toBe('argent');
    expect(tierForPoints(750)).toBe('or');
    expect(tierForPoints(949)).toBe('or');
    expect(tierForPoints(950)).toBe('platine');
    expect(tierForPoints(1100)).toBe('diamant');
    expect(tierForPoints(1300)).toBe('challenger');
    expect(tierForPoints(9999)).toBe('challenger');
  });

  it('tierRank donne l\'ordre des tiers', () => {
    expect(tierRank('bronze')).toBe(0);
    expect(tierRank('challenger')).toBe(TIERS.length - 1);
  });

  it('nextTier donne le palier suivant ou null au max', () => {
    expect(nextTier(null)).toEqual({ tier: 'bronze', threshold: 100 });
    expect(nextTier('or')).toEqual({ tier: 'platine', threshold: 950 });
    expect(nextTier('challenger')).toBeNull();
  });
});
