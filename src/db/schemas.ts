import { z } from 'zod';

export const languageSchema = z.enum(['fr', 'en', 'c', 'python']);
const tierSchema = z.enum(['bronze', 'argent', 'or', 'platine', 'diamant', 'challenger']);

export const profileSchema = z.object({
  id: z.literal('default'),
  pseudo: z.string().min(1).max(30),
  theme: z.enum(['dark', 'light']),
  sounds: z.boolean(),
  defaultLanguage: languageSchema,
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
