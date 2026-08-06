import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const KINDS = [
  {
    name: 'prose',
    langs: ['fr', 'en'],
    freeCount: 30,
    freeLastId: 30,
    quotes: 5,
    ranges: { short: [110, 200], medium: [320, 480], long: [650, 950] },
    multiLine: false,
  },
  {
    name: 'code',
    langs: ['c', 'python'],
    freeCount: 15,
    freeLastId: 15,
    quotes: 0,
    ranges: { short: [60, 300], medium: [280, 800], long: [650, 2500] },
    multiLine: true,
  },
];

const errors = [];
const allIds = new Set();
const seenTexts = new Set();

for (const kind of KINDS) {
  for (const lang of kind.langs) {
    const file = join(root, 'src', 'texts', `${lang}.json`);
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const texts = data.texts;
    const free = texts.filter((t) => !t.official);
    const official = texts.filter((t) => t.official);

    if (free.length !== kind.freeCount) {
      errors.push(`${lang}: ${free.length} textes libres (${kind.freeCount} attendus)`);
    }
    if (official.length !== 10) errors.push(`${lang}: ${official.length} textes officiels (10 attendus)`);
    if (free.filter((t) => t.quote).length !== kind.quotes) {
      errors.push(`${lang}: il faut exactement ${kind.quotes} citations (quote: true)`);
    }
    // pickText(langue, longueur) lève une erreur si un bucket est vide
    for (const len of Object.keys(kind.ranges)) {
      if (!free.some((t) => t.length === len)) {
        errors.push(`${lang}: aucun texte libre en longueur ${len}`);
      }
    }

    for (const t of texts) {
      if (typeof t.id !== 'string' || typeof t.text !== 'string') {
        errors.push(`${lang}: entrée invalide (id et text doivent être des chaînes)`);
        continue;
      }
      if (typeof t.official !== 'boolean') errors.push(`${t.id}: official doit être un booléen`);
      if (t.quote !== undefined && typeof t.quote !== 'boolean') errors.push(`${t.id}: quote doit être un booléen`);
      if (t.text !== t.text.normalize('NFC')) errors.push(`${t.id}: texte non normalisé NFC`);
      // le moteur indexe par code unit UTF-16 : pas d'emoji ni de caractères astraux
      if (/[\u{10000}-\u{10FFFF}]/u.test(t.text)) errors.push(`${t.id}: caractère hors BMP interdit`);
      if (seenTexts.has(t.text)) errors.push(`${t.id}: texte dupliqué`);
      seenTexts.add(t.text);

      if (!new RegExp(`^${lang}-\\d{3}$`).test(t.id)) errors.push(`${lang}: id invalide ${t.id}`);
      if (allIds.has(t.id)) errors.push(`${lang}: id dupliqué ${t.id}`);
      allIds.add(t.id);

      const range = kind.ranges[t.length];
      if (!range) errors.push(`${t.id}: length invalide "${t.length}"`);
      else if (t.text.length < range[0] || t.text.length > range[1]) {
        errors.push(`${t.id}: ${t.text.length} caractères, hors fourchette ${t.length} [${range[0]}-${range[1]}]`);
      }

      if (kind.multiLine) {
        if (t.official && !t.text.includes('\n')) errors.push(`${t.id}: texte officiel code sur une seule ligne`);
        if (/\t/.test(t.text)) errors.push(`${t.id}: tabulation interdite (espaces uniquement)`);
        if (/\r/.test(t.text)) errors.push(`${t.id}: retour chariot interdit`);
        if (t.text.split('\n').some((line) => line !== line.trimEnd())) {
          errors.push(`${t.id}: espace en fin de ligne`);
        }
      } else {
        if (t.official && !/[.,;:!?]/.test(t.text)) errors.push(`${t.id}: texte officiel sans ponctuation`);
        if (/\n/.test(t.text)) errors.push(`${t.id}: texte de prose multi-lignes`);
      }
    }

    const freeIds = free.map((t) => t.id).sort();
    const officialIds = official.map((t) => t.id).sort();
    const lastFree = String(kind.freeLastId).padStart(3, '0');
    if (freeIds[0] !== `${lang}-001` || freeIds[freeIds.length - 1] !== `${lang}-${lastFree}`) {
      errors.push(`${lang}: les ids libres doivent couvrir 001-${lastFree}`);
    }
    if (officialIds[0] !== `${lang}-101` || officialIds[9] !== `${lang}-110`) {
      errors.push(`${lang}: les ids officiels doivent couvrir 101-110`);
    }
  }
}

if (errors.length > 0) {
  console.error('Corpus invalide :');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('Corpus valide : 2 langues × (30+10) + 2 langages × (15+10).');
