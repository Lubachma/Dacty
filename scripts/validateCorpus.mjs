import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RANGES = { short: [110, 200], medium: [320, 480], long: [650, 950] };
const errors = [];

const allIds = new Set();
for (const lang of ['fr', 'en']) {
  const file = join(root, 'src', 'texts', `${lang}.json`);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const texts = data.texts;
  const free = texts.filter((t) => !t.official);
  const official = texts.filter((t) => t.official);

  if (free.length !== 30) errors.push(`${lang}: ${free.length} textes libres (30 attendus)`);
  if (official.length !== 10) errors.push(`${lang}: ${official.length} textes officiels (10 attendus)`);
  if (free.filter((t) => t.quote).length !== 5) errors.push(`${lang}: il faut exactement 5 citations (quote: true)`);

  for (const t of texts) {
    if (!new RegExp(`^${lang}-\\d{3}$`).test(t.id)) errors.push(`${lang}: id invalide ${t.id}`);
    if (allIds.has(t.id)) errors.push(`${lang}: id dupliqué ${t.id}`);
    allIds.add(t.id);
    const [min, max] = RANGES[t.length] ?? [0, 0];
    if (!RANGES[t.length]) errors.push(`${t.id}: length invalide "${t.length}"`);
    else if (t.text.length < min || t.text.length > max) {
      errors.push(`${t.id}: ${t.text.length} caractères, hors fourchette ${t.length} [${min}-${max}]`);
    }
    if (t.official && !/[.,;:!?]/.test(t.text)) errors.push(`${t.id}: texte officiel sans ponctuation`);
  }

  const freeIds = free.map((t) => t.id).sort();
  const officialIds = official.map((t) => t.id).sort();
  if (freeIds[0] !== `${lang}-001` || freeIds[29] !== `${lang}-030`) {
    errors.push(`${lang}: les ids libres doivent couvrir 001-030`);
  }
  if (officialIds[0] !== `${lang}-101` || officialIds[9] !== `${lang}-110`) {
    errors.push(`${lang}: les ids officiels doivent couvrir 101-110`);
  }
}

if (errors.length > 0) {
  console.error('Corpus invalide :');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('Corpus valide : 2 langues × (30 libres + 10 officiels).');
