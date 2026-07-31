import { describe, expect, it } from 'vitest';
import { dailyAverages } from './statsUtils';
import type { RunRecord } from '@/db/types';

const opts = { punctuation: true, specialChars: true, digits: true, accents: true };

function run(date: number, wpm: number, accuracy: number): RunRecord {
  return {
    date, mode: 'free', language: 'fr', textId: 'fr-001', options: opts,
    durationMs: 30_000, wpm, accuracy, points: 0, errors: 0, backspaces: 0, chars: 100, noBackspace: true,
  };
}

describe('dailyAverages', () => {
  const now = new Date(2026, 5, 15, 20, 0).getTime(); // 15 juin 2026

  it('produit un seau par jour, 0 les jours sans run', () => {
    const stats = dailyAverages([], 3, now);
    expect(stats).toHaveLength(3);
    expect(stats.map((s) => s.runs)).toEqual([0, 0, 0]);
    expect(stats[2].day).toBe('15/06');
    expect(stats[0].day).toBe('13/06');
  });

  it('moyenne les runs du jour', () => {
    const morning = new Date(2026, 5, 15, 8, 0).getTime();
    const stats = dailyAverages([run(morning, 40, 0.9), run(morning, 60, 1)], 3, now);
    expect(stats[2].runs).toBe(2);
    expect(stats[2].avgWpm).toBeCloseTo(50);
    expect(stats[2].avgAccuracy).toBeCloseTo(0.95);
  });

  it('ignore les runs plus vieilles que la fenêtre', () => {
    const old = new Date(2026, 4, 1, 8, 0).getTime();
    const stats = dailyAverages([run(old, 99, 1)], 30, now);
    expect(stats.every((s) => s.runs === 0)).toBe(true);
  });
});
