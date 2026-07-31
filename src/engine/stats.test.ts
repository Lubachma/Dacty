import { describe, expect, it } from 'vitest';
import { computeAccuracy, computeWpm, correctCharCount, liveWpm, wpmTimeline } from './stats';
import { createRun, typeChar } from './typingEngine';

describe('stats', () => {
  it('computeWpm = (caractères / 5) / minutes', () => {
    expect(computeWpm(50, 60_000)).toBe(10);
    expect(computeWpm(25, 30_000)).toBe(10);
    expect(computeWpm(10, 0)).toBe(0);
  });

  it('computeAccuracy = (frappes - erreurs) / frappes, 1 si aucune frappe', () => {
    expect(computeAccuracy(100, 5)).toBe(0.95);
    expect(computeAccuracy(0, 0)).toBe(1);
  });

  it('correctCharCount compte les statuts corrects', () => {
    let s = createRun('abc');
    s = typeChar(s, 'a', 1000);
    s = typeChar(s, 'x', 1100);
    expect(correctCharCount(s)).toBe(1);
  });

  it('liveWpm utilise le temps écoulé réel', () => {
    let s = createRun('abcdefghij'); // 10 car.
    for (let i = 0; i < 10; i++) s = typeChar(s, 'abcdefghij'[i], 1000 + i * 600);
    // 10 car. corrects en 5400ms -> (10/5)/(5.4/60) = 22.22 WPM
    expect(liveWpm(s, 6400)).toBeCloseTo(22.22, 1);
  });

  it('wpmTimeline agrège les caractères corrects par seau', () => {
    const events = [
      { at: 100, kind: 'char' as const, correct: true },
      { at: 400, kind: 'char' as const, correct: true },
      { at: 900, kind: 'char' as const, correct: false },
      { at: 1100, kind: 'char' as const, correct: true },
    ];
    // seau 0-1000 : 2 corrects -> (2/5)*60 = 24 WPM ; seau 1000-2000 : 1 correct -> 12 WPM
    expect(wpmTimeline(events, 0, 2000)).toEqual([24, 12]);
  });

  it('wpmTimeline borne le dernier seau à endedAt', () => {
    const events = [{ at: 2500, kind: 'char' as const, correct: true }];
    expect(wpmTimeline(events, 0, 2600)).toEqual([0, 0, 12]);
  });
});
