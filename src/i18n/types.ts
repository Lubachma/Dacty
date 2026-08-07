export type UiLanguage = 'fr' | 'en';
export type Params = Record<string, string | number>;

/** Texte porté par la donnée (succès) : la couche UI choisit la langue à l'affichage. */
export interface LocalizedText {
  fr: string;
  en: string;
}
