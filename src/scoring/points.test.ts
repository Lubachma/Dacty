import { describe, expect, it } from 'vitest';
import { challengerPoints, difficultyMultiplier } from './points';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

describe('points', () => {
  it('multiplicateur = 1 + 0.1 par toggle actif', () => {
    expect(difficultyMultiplier(ALL_OPTIONS_ON)).toBeCloseTo(1.4);
    expect(difficultyMultiplier({ punctuation: false, specialChars: false, digits: false, accents: false }))
      .toBeCloseTo(1);
    expect(difficultyMultiplier({ punctuation: true, specialChars: false, digits: true, accents: false }))
      .toBeCloseTo(1.2);
  });

  it('points = round(wpm × précision² × multiplicateur)', () => {
    // 60 WPM, 97%, x1.4 = 60 × 0.9409 × 1.4 = 79.03 -> 79
    expect(challengerPoints(60, 0.97, ALL_OPTIONS_ON)).toBe(79);
    // 100 WPM, 99%, x1.4 = 137.2 -> 137
    expect(challengerPoints(100, 0.99, ALL_OPTIONS_ON)).toBe(137);
    // sans toggles : 50 × 1 × 1 = 50
    expect(challengerPoints(50, 1, { punctuation: false, specialChars: false, digits: false, accents: false }))
      .toBe(50);
  });
});
