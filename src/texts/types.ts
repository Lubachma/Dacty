export type Language = 'fr' | 'en' | 'c' | 'python';
export type TextLength = 'short' | 'medium' | 'long';

export const CODE_LANGUAGES: readonly Language[] = ['c', 'python'];

export function isCodeLanguage(language: Language): boolean {
  return CODE_LANGUAGES.includes(language);
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  c: 'C',
  python: 'Python',
};

export interface TextEntry {
  id: string;
  language: Language;
  length: TextLength;
  official: boolean;
  quote?: boolean;
  source?: string;
  text: string;
}

export interface TextOptions {
  punctuation: boolean;
  specialChars: boolean;
  digits: boolean;
  accents: boolean;
}
