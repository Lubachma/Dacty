import type { Language, TextOptions } from '@/texts/types';
import type { Tier } from '@/scoring/league';
import type { UiLanguage } from '@/i18n/types';

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
  /** number of characters in the typed text */
  chars: number;
  noBackspace: boolean;
}

export interface Profile {
  id: 'default';
  pseudo: string;
  theme: 'dark' | 'light';
  sounds: boolean;
  defaultLanguage: Language;
  /** interface language, independent of the texts' language */
  uiLanguage: UiLanguage;
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
