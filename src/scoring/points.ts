import type { TextOptions } from '@/texts/types';

export function difficultyMultiplier(options: TextOptions): number {
  const active = [
    options.punctuation, options.specialChars, options.digits, options.accents,
  ].filter(Boolean).length;
  return 1 + 0.1 * active;
}

export function challengerPoints(wpm: number, accuracy: number, options: TextOptions): number {
  return Math.round(wpm * accuracy * accuracy * difficultyMultiplier(options));
}
