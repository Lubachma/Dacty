export type Language = 'fr' | 'en';
export type TextLength = 'short' | 'medium' | 'long';

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
