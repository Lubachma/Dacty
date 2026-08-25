import { z } from 'zod';
import { detectUiLanguage } from '@/i18n/detect';

export const languageSchema = z.enum(['fr', 'en', 'c', 'python']);
const tierSchema = z.enum(['bronze', 'argent', 'or', 'platine', 'diamant', 'challenger']);

export const profileSchema = z.object({
  id: z.literal('default'),
  pseudo: z.string().min(1).max(30),
  theme: z.enum(['dark', 'light']),
  sounds: z.boolean(),
  defaultLanguage: languageSchema,
  // legacy profiles without the field: language detected from the browser (dynamic zod v3 default)
  uiLanguage: z.enum(['fr', 'en']).default(() => detectUiLanguage()),
  focusTimeoutSec: z.number().min(1).max(60),
  createdAt: z.number(),
  lastActiveAt: z.number(),
});

export const challengerProgressSchema = z.object({
  language: languageSchema,
  bestByText: z.record(z.string(), z.number()),
  total: z.number(),
  tier: tierSchema.nullable(),
  tierHistory: z.array(z.object({ tier: tierSchema, at: z.number() })),
});

export const textOptionsSchema = z.object({
  punctuation: z.boolean(),
  specialChars: z.boolean(),
  digits: z.boolean(),
  accents: z.boolean(),
});

// exact mirror of RunRecord: any row that doesn't satisfy this schema is
// considered corrupted and dropped on read (see runsRepo.parseRuns)
export const runRecordSchema = z.object({
  id: z.number().int().min(1).optional(),
  date: z.number().int().positive(),
  mode: z.enum(['free', 'challenger']),
  language: languageSchema,
  textId: z.string().min(1),
  options: textOptionsSchema,
  durationMs: z.number().int().min(0),
  wpm: z.number().finite().min(0),
  accuracy: z.number().finite().min(0).max(1), // fraction, not a percentage
  points: z.number().finite().min(0),
  errors: z.number().int().min(0),
  backspaces: z.number().int().min(0),
  chars: z.number().int().min(0),
  noBackspace: z.boolean(),
});
