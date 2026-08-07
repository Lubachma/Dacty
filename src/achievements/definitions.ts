import type { ChallengerProgress, RunRecord } from '@/db/types';
import type { LocalizedText } from '@/i18n/types';
import { tierRank, type Tier } from '@/scoring/league';
import { isCodeLanguage, type Language } from '@/texts/types';

export interface AchievementContext {
  newRun: RunRecord;
  runs: RunRecord[];
  totalChars: number;
  streakDays: number;
  progress: Record<Language, ChallengerProgress>;
  now: number;
}

export type AchievementCategory = 'vitesse' | 'precision' | 'volume' | 'challenger' | 'dev' | 'fun';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: LocalizedText;
  description: LocalizedText;
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

const wpmAchievement = (wpm: number, title: LocalizedText): AchievementDef => ({
  id: `wpm-${wpm}`,
  category: 'vitesse',
  title,
  description: { fr: `Atteindre ${wpm} WPM sur une run`, en: `Reach ${wpm} WPM on a run` },
  target: wpm,
  isUnlocked: (ctx) => ctx.newRun.wpm >= wpm,
  progress: bestWpm,
});

export const ACHIEVEMENTS: AchievementDef[] = [
  wpmAchievement(40, { fr: 'Échauffement', en: 'Warm-up' }),
  wpmAchievement(60, { fr: 'Doigts agiles', en: 'Nimble fingers' }),
  wpmAchievement(80, { fr: 'Machine', en: 'Machine' }),
  wpmAchievement(100, { fr: "Cent à l'heure", en: 'Century' }),
  wpmAchievement(120, { fr: 'Supersonique', en: 'Supersonic' }),
  wpmAchievement(140, { fr: 'Inhumain', en: 'Inhuman' }),
  {
    id: 'perfect-run', category: 'precision',
    title: { fr: 'Sans faute', en: 'Flawless' },
    description: {
      fr: "Terminer une run d'au moins 50 caractères à 100 % de précision",
      en: 'Finish a run of at least 50 characters with 100% accuracy',
    },
    target: 100,
    isUnlocked: (ctx) => ctx.newRun.accuracy === 1 && ctx.newRun.chars >= 50,
    progress: bestAccuracyPct,
  },
  {
    id: 'sharpshooter-10', category: 'precision',
    title: { fr: 'Précision chirurgicale', en: 'Surgical precision' },
    description: {
      fr: 'Réussir 10 runs à 98 % de précision ou plus',
      en: 'Complete 10 runs at 98% accuracy or more',
    },
    target: 10,
    isUnlocked: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length >= 10,
    progress: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length,
  },
  {
    id: 'sharpshooter-50', category: 'precision',
    title: { fr: 'Œil de lynx', en: 'Eagle eye' },
    description: {
      fr: 'Réussir 50 runs à 98 % de précision ou plus',
      en: 'Complete 50 runs at 98% accuracy or more',
    },
    target: 50,
    isUnlocked: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length >= 50,
    progress: (ctx) => ctx.runs.filter((r) => r.accuracy >= 0.98).length,
  },
  ...([10, 50, 100, 500] as const).map((n): AchievementDef => ({
    id: `runs-${n}`,
    category: 'volume',
    title: {
      10: { fr: 'Premiers pas', en: 'First steps' },
      50: { fr: 'Habitué', en: 'Regular' },
      100: { fr: 'Centurion', en: 'Centurion' },
      500: { fr: 'Marathonien des touches', en: 'Key marathoner' },
    }[n],
    description: { fr: `Terminer ${n} runs`, en: `Finish ${n} runs` },
    target: n,
    isUnlocked: (ctx) => ctx.runs.length >= n,
    progress: (ctx) => ctx.runs.length,
  })),
  {
    id: 'chars-100k', category: 'volume',
    title: { fr: 'Cent mille signes', en: 'One hundred thousand' },
    description: { fr: 'Taper 100 000 caractères au total', en: 'Type 100,000 characters in total' },
    target: 100_000,
    isUnlocked: (ctx) => ctx.totalChars >= 100_000,
    progress: (ctx) => ctx.totalChars,
  },
  {
    id: 'chars-1m', category: 'volume',
    title: { fr: 'Le million', en: 'The million' },
    description: { fr: 'Taper 1 000 000 de caractères au total', en: 'Type 1,000,000 characters in total' },
    target: 1_000_000,
    isUnlocked: (ctx) => ctx.totalChars >= 1_000_000,
    progress: (ctx) => ctx.totalChars,
  },
  {
    id: 'enter-league', category: 'challenger',
    title: { fr: 'En lice', en: 'In the running' },
    description: { fr: 'Atteindre le tier Bronze dans une ligue', en: 'Reach the Bronze tier in any league' },
    isUnlocked: (ctx) => Object.values(ctx.progress).some((p) => p.tier !== null),
  },
  {
    id: 'gold-any', category: 'challenger',
    title: { fr: 'En or', en: 'Golden' },
    description: { fr: 'Atteindre le tier Or dans une ligue', en: 'Reach the Gold tier in any league' },
    isUnlocked: (ctx) => Object.values(ctx.progress).some((p) => tierAtLeast(p, 'or')),
  },
  {
    id: 'diamond-any', category: 'challenger',
    title: { fr: 'Diamanté', en: 'Diamond hands' },
    description: { fr: 'Atteindre le tier Diamant dans une ligue', en: 'Reach the Diamond tier in any league' },
    isUnlocked: (ctx) => Object.values(ctx.progress).some((p) => tierAtLeast(p, 'diamant')),
  },
  {
    id: 'challenger-any', category: 'challenger',
    title: { fr: 'Challenger', en: 'Challenger' },
    description: { fr: 'Atteindre le tier Challenger dans une ligue', en: 'Reach the Challenger tier in any league' },
    isUnlocked: (ctx) => Object.values(ctx.progress).some((p) => tierAtLeast(p, 'challenger')),
  },
  {
    id: 'gold-both', category: 'challenger',
    title: { fr: "Bilingue d'or", en: 'Golden bilingual' },
    description: {
      fr: 'Atteindre le tier Or en français ET en anglais',
      en: 'Reach the Gold tier in both French AND English',
    },
    isUnlocked: (ctx) => tierAtLeast(ctx.progress.fr, 'or') && tierAtLeast(ctx.progress.en, 'or'),
  },
  {
    id: 'hello-world', category: 'dev',
    title: { fr: 'Hello, World!', en: 'Hello, World!' },
    description: { fr: 'Terminer une run en C ou Python', en: 'Finish a run in C or Python' },
    isUnlocked: (ctx) => isCodeLanguage(ctx.newRun.language),
  },
  {
    id: 'dev-10', category: 'dev',
    title: { fr: 'Apprenti programmeur', en: 'Apprentice programmer' },
    description: { fr: 'Terminer 10 runs en langages de code', en: 'Finish 10 runs in code languages' },
    target: 10,
    isUnlocked: (ctx) => ctx.runs.filter((r) => isCodeLanguage(r.language)).length >= 10,
    progress: (ctx) => ctx.runs.filter((r) => isCodeLanguage(r.language)).length,
  },
  {
    id: 'dev-perfect', category: 'dev',
    title: { fr: 'Sans un warning', en: 'Warning-free' },
    description: {
      fr: "Terminer une run dev d'au moins 100 caractères à 100 % de précision",
      en: 'Finish a dev run of at least 100 characters with 100% accuracy',
    },
    isUnlocked: (ctx) =>
      isCodeLanguage(ctx.newRun.language) && ctx.newRun.accuracy === 1 && ctx.newRun.chars >= 100,
  },
  {
    id: 'no-backspace', category: 'fun',
    title: { fr: 'Droit au but', en: 'Straight to the point' },
    description: {
      fr: "Terminer une run d'au moins 30 caractères sans utiliser backspace",
      en: 'Finish a run of at least 30 characters without using backspace',
    },
    isUnlocked: (ctx) => ctx.newRun.backspaces === 0 && ctx.newRun.chars >= 30,
  },
  {
    id: 'night-owl', category: 'fun',
    title: { fr: 'Oiseau de nuit', en: 'Night owl' },
    description: { fr: 'Terminer une run entre 3h et 4h du matin', en: 'Finish a run between 3 and 4 AM' },
    isUnlocked: (ctx) => new Date(ctx.newRun.date).getHours() === 3,
  },
  {
    id: 'streak-7', category: 'fun',
    title: { fr: 'Une semaine de feu', en: 'One-week fire' },
    description: { fr: "Jouer 7 jours d'affilée", en: 'Play 7 days in a row' },
    target: 7,
    isUnlocked: (ctx) => ctx.streakDays >= 7,
    progress: (ctx) => ctx.streakDays,
  },
  {
    id: 'marathon', category: 'fun',
    title: { fr: 'Fond de course', en: 'Endurance' },
    description: { fr: "Terminer une run d'au moins 800 caractères", en: 'Finish a run of at least 800 characters' },
    isUnlocked: (ctx) => ctx.newRun.chars >= 800,
  },
  {
    id: 'polyglotte', category: 'fun',
    title: { fr: 'Polyglotte', en: 'Polyglot' },
    description: {
      fr: 'Terminer une run en français et une en anglais le même jour',
      en: 'Finish a French run and an English run on the same day',
    },
    isUnlocked: (ctx) => {
      const day = new Date(ctx.newRun.date).toDateString();
      const sameDay = ctx.runs.filter((r) => new Date(r.date).toDateString() === day);
      return sameDay.some((r) => r.language === 'fr') && sameDay.some((r) => r.language === 'en');
    },
  },
];
