import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, type AchievementContext } from './definitions';
import type { RunRecord } from '@/db/types';
import type { Language } from '@/texts/types';

const opts = { punctuation: true, specialChars: true, digits: true, accents: true };

function run(patch: Partial<RunRecord>): RunRecord {
  return {
    date: 1_000_000, mode: 'free', language: 'fr', textId: 'fr-001', options: opts,
    durationMs: 30_000, wpm: 50, accuracy: 0.97, points: 66, errors: 3,
    backspaces: 1, chars: 250, noBackspace: false, ...patch,
  };
}

const emptyProgress = (language: Language) => ({
  language, bestByText: {}, total: 0, tier: null, tierHistory: [],
});

function ctx(patch: Partial<AchievementContext>): AchievementContext {
  const r = run({});
  return {
    newRun: r, runs: [r], totalChars: 250, streakDays: 1,
    progress: {
      fr: emptyProgress('fr'),
      en: emptyProgress('en'),
      c: emptyProgress('c'),
      python: emptyProgress('python'),
    },
    now: 1_000_000, ...patch,
  };
}

const def = (id: string) => {
  const d = ACHIEVEMENTS.find((a) => a.id === id);
  if (!d) throw new Error(`succès inconnu: ${id}`);
  return d;
};

describe('definitions', () => {
  it('contient 28 succès aux ids uniques', () => {
    expect(ACHIEVEMENTS).toHaveLength(28);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(28);
  });

  it('wpm-60 se débloque à 60 WPM', () => {
    expect(def('wpm-60').isUnlocked(ctx({ newRun: run({ wpm: 59 }) }))).toBe(false);
    expect(def('wpm-60').isUnlocked(ctx({ newRun: run({ wpm: 60 }) }))).toBe(true);
  });

  it('perfect-run exige 100% sur au moins 50 caractères', () => {
    expect(def('perfect-run').isUnlocked(ctx({ newRun: run({ accuracy: 1, chars: 30 }) }))).toBe(false);
    expect(def('perfect-run').isUnlocked(ctx({ newRun: run({ accuracy: 1, chars: 50 }) }))).toBe(true);
  });

  it('sharpshooter-10 compte les runs à 98% ou plus', () => {
    const runs = Array.from({ length: 9 }, () => run({ accuracy: 0.99 }));
    expect(def('sharpshooter-10').isUnlocked(ctx({ runs }))).toBe(false);
    expect(def('sharpshooter-10').isUnlocked(ctx({ runs: [...runs, run({ accuracy: 0.98 })] }))).toBe(true);
  });

  it('runs-10 compte le volume de runs', () => {
    expect(def('runs-10').isUnlocked(ctx({ runs: Array.from({ length: 10 }, () => run({})) }))).toBe(true);
  });

  it('chars-100k utilise le total de caractères', () => {
    expect(def('chars-100k').isUnlocked(ctx({ totalChars: 99_999 }))).toBe(false);
    expect(def('chars-100k').isUnlocked(ctx({ totalChars: 100_000 }))).toBe(true);
  });

  it('gold-any et gold-both lisent les tiers des deux langues', () => {
    const gold = { ...emptyProgress('fr' as Language), tier: 'or' as const };
    const empty = { en: emptyProgress('en'), c: emptyProgress('c'), python: emptyProgress('python') };
    expect(def('gold-any').isUnlocked(ctx({ progress: { fr: gold, ...empty } }))).toBe(true);
    expect(def('gold-both').isUnlocked(ctx({ progress: { fr: gold, ...empty } }))).toBe(false);
    expect(def('gold-both').isUnlocked(ctx({
      progress: { fr: gold, en: { ...gold, language: 'en' as Language }, c: emptyProgress('c'), python: emptyProgress('python') },
    }))).toBe(true);
  });

  it('hello-world se débloque sur une run en langage de code', () => {
    expect(def('hello-world').isUnlocked(ctx({ newRun: run({ language: 'python' }) }))).toBe(true);
    expect(def('hello-world').isUnlocked(ctx({ newRun: run({ language: 'fr' }) }))).toBe(false);
  });

  it('dev-10 compte les runs en langages de code', () => {
    const runs = Array.from({ length: 9 }, () => run({ language: 'c' }));
    expect(def('dev-10').isUnlocked(ctx({ runs }))).toBe(false);
    expect(def('dev-10').isUnlocked(ctx({ runs: [...runs, run({ language: 'python' })] }))).toBe(true);
    expect(def('dev-10').progress?.(ctx({ runs }))).toBe(9);
  });

  it('dev-perfect exige 100% sur une run code d\'au moins 100 caractères', () => {
    expect(def('dev-perfect').isUnlocked(ctx({ newRun: run({ language: 'python', accuracy: 1, chars: 100 }) }))).toBe(true);
    expect(def('dev-perfect').isUnlocked(ctx({ newRun: run({ language: 'en', accuracy: 1, chars: 100 }) }))).toBe(false);
    expect(def('dev-perfect').isUnlocked(ctx({ newRun: run({ language: 'c', accuracy: 1, chars: 99 }) }))).toBe(false);
  });

  it('gold-any considère aussi les ligues de code', () => {
    const goldC = { ...emptyProgress('c' as Language), tier: 'or' as const };
    const progress = { fr: emptyProgress('fr'), en: emptyProgress('en'), c: goldC, python: emptyProgress('python') };
    expect(def('gold-any').isUnlocked(ctx({ progress }))).toBe(true);
    expect(def('gold-both').isUnlocked(ctx({ progress }))).toBe(false); // gold-both reste fr+en
  });

  it('no-backspace exige zéro backspace sur au moins 30 caractères', () => {
    expect(def('no-backspace').isUnlocked(ctx({ newRun: run({ backspaces: 0, chars: 30 }) }))).toBe(true);
    expect(def('no-backspace').isUnlocked(ctx({ newRun: run({ backspaces: 0, chars: 29 }) }))).toBe(false);
  });

  it('night-owl vérifie l\'heure locale de fin de run', () => {
    const at3am = new Date(2026, 5, 15, 3, 30).getTime();
    const atNoon = new Date(2026, 5, 15, 12, 0).getTime();
    expect(def('night-owl').isUnlocked(ctx({ newRun: run({ date: at3am }) }))).toBe(true);
    expect(def('night-owl').isUnlocked(ctx({ newRun: run({ date: atNoon }) }))).toBe(false);
  });

  it('polyglotte exige fr + en le même jour', () => {
    const day = new Date(2026, 5, 15, 10, 0).getTime();
    const runs = [run({ date: day, language: 'fr' }), run({ date: day, language: 'en' })];
    expect(def('polyglotte').isUnlocked(ctx({ runs, newRun: runs[1] }))).toBe(true);
    expect(def('polyglotte').isUnlocked(ctx({ runs: [runs[0]], newRun: runs[0] }))).toBe(false);
  });

  it('marathon exige une run d\'au moins 800 caractères', () => {
    expect(def('marathon').isUnlocked(ctx({ newRun: run({ chars: 799 }) }))).toBe(false);
    expect(def('marathon').isUnlocked(ctx({ newRun: run({ chars: 800 }) }))).toBe(true);
  });
});
