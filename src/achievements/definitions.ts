import type { ChallengerProgress, RunRecord } from '@/db/types';
import { tierRank, type Tier } from '@/scoring/league';
import type { Language } from '@/texts/types';

export interface AchievementContext {
  newRun: RunRecord;
  runs: RunRecord[];
  totalChars: number;
  streakDays: number;
  progress: Record<Language, ChallengerProgress>;
  now: number;
}

export type AchievementCategory = 'vitesse' | 'precision' | 'volume' | 'challenger' | 'fun';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  target?: number;
  isUnlocked(ctx: AchievementContext): boolean;
  progress?(ctx: AchievementContext): number;
}

const bestWpm = (ctx: AchievementContext): number =>
  Math.round(Math.max(0, ...ctx.runs.map((r) => r.wpm)));
const bestAccuracyPct = (ctx: AchievementContext): number =>
  Math.round(100 * Math.max(0, ...ctx.runs.map((r) => r.accuracy)));
const tierAtLeast = (p: ChallengerProgress, tier: Tier): boolean =>
  p.tier !== null && tierRank(p.tier) >= tierRank(tier);

const wpmAchievement = (wpm: number, title: string): AchievementDef => ({
  id: `wpm-${wpm}`,
  category: 'vitesse',
  title,
  description: `Atteindre ${wpm} WPM sur une run`,
  target: wpm,
  isUnlocked: (ctx) => ctx.newRun.wpm >= wpm,
  progress: bestWpm,
});

export const ACHIEVEMENTS: AchievementDef[] = [
  wpmAchievement(40, 'Échauffement'),
  wpmAchievement(60, 'Doigts agiles'),
  wpmAchievement(80, 'Machine'),
  wpmAchievement(100, "Cent à l'heure"),
  wpmAchievement(120, 'Supersonique'),
  wpmAchievement(140, 'Inhumain'),
  {
    id: 'perfect-run', category: 'precision', title: 'Sans faute',
    description: 'Terminer une run d\'au moins 50 caractères à 100 % de précision',
    target: 100,
    isUnlocked: (ctx) => ctx.newRun.accuracy === 1 && ctx.newRun.chars >= 50,
    progress: bestAccuracyPct,
  },
  {
    id: 'sharpshooter-10', category: 'precision', title: 'Précision chirurgicale',
    description: 'Réussir 10 runs à 98 % de précision ou plus',
    target: 10,
    isUnlocked: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length >= 10,
    progress: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length,
  },
  {
    id: 'sharpshooter-50', category: 'precision', title: 'Œil de lynx',
    description: 'Réussir 50 runs à 98 % de précision ou plus',
    target: 50,
    isUnlocked: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length >= 50,
    progress: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length,
  },
  ...([10, 50, 100, 500] as const).map((n): AchievementDef => ({
    id: `runs-${n}`,
    category: 'volume',
    title: { 10: 'Premiers pas', 50: 'Habitué', 100: 'Centurion', 500: 'Marathonien des touches' }[n],
    description: `Terminer ${n} runs`,
    target: n,
    isUnlocked: (ctx) => ctx.runs.length >= n,
    progress: (ctx) => ctx.runs.length,
  })),
  {
    id: 'chars-100k', category: 'volume', title: 'Cent mille signes',
    description: 'Taper 100 000 caractères au total',
    target: 100_000,
    isUnlocked: (ctx) => ctx.totalChars >= 100_000,
    progress: (ctx) => ctx.totalChars,
  },
  {
    id: 'chars-1m', category: 'volume', title: 'Le million',
    description: 'Taper 1 000 000 de caractères au total',
    target: 1_000_000,
    isUnlocked: (ctx) => ctx.totalChars >= 1_000_000,
    progress: (ctx) => ctx.totalChars,
  },
  {
    id: 'enter-league', category: 'challenger', title: 'En lice',
    description: 'Atteindre le tier Bronze dans une langue',
    isUnlocked: (ctx) => ctx.progress.fr.tier !== null || ctx.progress.en.tier !== null,
  },
  {
    id: 'gold-any', category: 'challenger', title: 'En or',
    description: 'Atteindre le tier Or dans une langue',
    isUnlocked: (ctx) => tierAtLeast(ctx.progress.fr, 'or') || tierAtLeast(ctx.progress.en, 'or'),
  },
  {
    id: 'diamond-any', category: 'challenger', title: 'Diamanté',
    description: 'Atteindre le tier Diamant dans une langue',
    isUnlocked: (ctx) => tierAtLeast(ctx.progress.fr, 'diamant') || tierAtLeast(ctx.progress.en, 'diamant'),
  },
  {
    id: 'challenger-any', category: 'challenger', title: 'Challenger',
    description: 'Atteindre le tier Challenger dans une langue',
    isUnlocked: (ctx) => tierAtLeast(ctx.progress.fr, 'challenger') || tierAtLeast(ctx.progress.en, 'challenger'),
  },
  {
    id: 'gold-both', category: 'challenger', title: 'Bilingue d\'or',
    description: 'Atteindre le tier Or en français ET en anglais',
    isUnlocked: (ctx) => tierAtLeast(ctx.progress.fr, 'or') && tierAtLeast(ctx.progress.en, 'or'),
  },
  {
    id: 'no-backspace', category: 'fun', title: 'Droit au but',
    description: 'Terminer une run d\'au moins 30 caractères sans utiliser backspace',
    isUnlocked: (ctx) => ctx.newRun.backspaces === 0 && ctx.newRun.chars >= 30,
  },
  {
    id: 'night-owl', category: 'fun', title: 'Oiseau de nuit',
    description: 'Terminer une run entre 3h et 4h du matin',
    isUnlocked: (ctx) => new Date(ctx.newRun.date).getHours() === 3,
  },
  {
    id: 'streak-7', category: 'fun', title: 'Une semaine de feu',
    description: 'Jouer 7 jours d\'affilée',
    target: 7,
    isUnlocked: (ctx) => ctx.streakDays >= 7,
    progress: (ctx) => ctx.streakDays,
  },
  {
    id: 'marathon', category: 'fun', title: 'Fond de course',
    description: 'Terminer une run d\'au moins 800 caractères',
    isUnlocked: (ctx) => ctx.newRun.chars >= 800,
  },
  {
    id: 'polyglotte', category: 'fun', title: 'Polyglotte',
    description: 'Terminer une run en français et une en anglais le même jour',
    isUnlocked: (ctx) => {
      const day = new Date(ctx.newRun.date).toDateString();
      const sameDay = ctx.runs.filter((r) => new Date(r.date).toDateString() === day);
      return sameDay.some((r) => r.language === 'fr') && sameDay.some((r) => r.language === 'en');
    },
  },
];
