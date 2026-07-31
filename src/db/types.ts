import type { Language, TextOptions } from '@/texts/types';
import type { Tier } from '@/scoring/league';

export type GameMode = 'free' | 'challenger';

export interface RunRecord {
  id?: number;
  date: number;
  mode: GameMode;
  language: Language;
  textId: string;
  options: TextOptions;
  durationMs: number;
  wpm: number;
  accuracy: number;
  points: number;
  errors: number;
  backspaces: number;
  /** nombre de caractères du texte tapé */
  chars: number;
  noBackspace: boolean;
}

export interface Profile {
  id: 'default';
  pseudo: string;
  theme: 'dark' | 'light';
  sounds: boolean;
  defaultLanguage: Language;
  focusTimeoutSec: number;
  createdAt: number;
  lastActiveAt: number;
}

export interface AchievementUnlock {
  id: string;
  unlockedAt: number;
}

export interface TierChange {
  tier: Tier;
  at: number;
}

export interface ChallengerProgress {
  language: Language;
  bestByText: Record<string, number>;
  total: number;
  tier: Tier | null;
  tierHistory: TierChange[];
}
