import type { TextOptions } from './types';

export const ALL_OPTIONS_ON: TextOptions = {
  punctuation: true,
  specialChars: true,
  digits: true,
  accents: true,
};

const collapse = (s: string): string => s.replace(/\s+/g, ' ').trim();

export function applyOptions(raw: string, options: TextOptions): string {
  let out = raw;
  if (!options.accents) {
    // NFD ne décompose pas les ligatures : œ/æ d'abord, puis les diacritiques
    out = out
      .replace(/œ/g, 'oe')
      .replace(/Œ/g, 'Oe')
      .replace(/æ/g, 'ae')
      .replace(/Æ/g, 'Ae')
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }
  if (!options.digits) {
    out = out.replace(/\p{N}/gu, '');
  }
  if (!options.punctuation) {
    // apostrophes et traits d'union soudent deux mots : on les remplace par un espace
    out = out.replace(/['’ʼ-]/g, ' ');
    out = out.replace(/[.,;:!?"«»‹›()–—…]/g, '');
  }
  if (!options.specialChars) {
    out = out.replace(/\p{S}/gu, '');
    out = out.replace(/[&@#%*+=<>{}[\]\\/|_~^`]/g, '');
  }
  return collapse(out);
}
