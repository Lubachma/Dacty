export type UiLanguage = 'fr' | 'en';
export type Params = Record<string, string | number>;

/** Text carried by the data (achievements): the UI layer picks the language to display. */
export interface LocalizedText {
  fr: string;
  en: string;
}
