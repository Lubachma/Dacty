import frData from './fr.json';
import enData from './en.json';
import type { Language, TextEntry, TextLength } from './types';

interface RawEntry {
  id: string;
  length: TextLength;
  official: boolean;
  quote?: boolean;
  source?: string;
  text: string;
}

function load(language: Language, raw: { texts: RawEntry[] }): TextEntry[] {
  return raw.texts.map((t) => ({ ...t, language }));
}

export const CORPUS: TextEntry[] = [
  // les imports JSON sont typés `string` partout : on caste après validation au build
  ...load('fr', frData as unknown as { texts: RawEntry[] }),
  ...load('en', enData as unknown as { texts: RawEntry[] }),
];

export function getTexts(language: Language): TextEntry[] {
  return CORPUS.filter((t) => t.language === language && !t.official);
}

export function getOfficialTexts(language: Language): TextEntry[] {
  return CORPUS.filter((t) => t.language === language && t.official)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getTextById(id: string): TextEntry {
  const entry = CORPUS.find((t) => t.id === id);
  if (!entry) throw new Error(`Texte inconnu : ${id}`);
  return entry;
}

export function pickText(language: Language, choice: TextLength | 'quote'): TextEntry {
  const pool = getTexts(language).filter((t) =>
    choice === 'quote' ? t.quote === true : t.length === choice,
  );
  if (pool.length === 0) throw new Error(`Aucun texte ${language}/${choice}`);
  return pool[Math.floor(Math.random() * pool.length)];
}
