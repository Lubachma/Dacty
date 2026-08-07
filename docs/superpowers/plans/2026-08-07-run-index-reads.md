# Lectures de runs par index — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lire les records (`personalBests`) et les dernières runs (HomePage) via les index
Dexie au lieu de scanner toute la table.

**Architecture:** schéma v2 additif (`accuracy`, `chars` en plus de `wpm`), trois requêtes
d'index paresseuses avec filtre zod dans `personalBests`, nouveau `recentRuns(limit)` sur
l'index `date` consommé par `HomePage`. Validation zod conservée partout.

**Tech Stack:** Dexie 4, fake-indexeddb, zod 3, vitest.

Spec : `docs/superpowers/specs/2026-08-07-run-index-reads-design.md`

## Global Constraints

- Validation zod conservée sur chaque chemin de lecture (filtre `isValidRun` pour les
  requêtes d'index, `parseRuns` pour les scans).
- Pas d'upgrade callback : ajout d'index uniquement, aucune transformation de données.
- Signatures publiques inchangées : `personalBests()` retourne toujours
  `{ bestWpm, bestAccuracy, longestRun }` de type `RunRecord | null`.
- Commentaires en français, commits en anglais (conventional commits).
- `allRuns`, `topRuns`, `rankFor` : hors scope, inchangés.

---

### Task 1: Schéma v2 additif

**Files:**
- Modify: `src/db/db.ts`
- Test: `src/db/db.test.ts` (nouveau)

**Interfaces:**
- Produces: `db` en version 2, `runs` indexé aussi sur `accuracy` et `chars`.
  Consommé par Task 2.

- [x] **Step 1: Écrire le test qui échoue** — `src/db/db.test.ts`

```ts
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from './db';

describe('schéma dexie', () => {
  it('est en version 2 avec les index de lecture sur runs', () => {
    expect(db.verno).toBe(2);
    const indexes = db.runs.schema.indexes.map((i) => i.name);
    expect(indexes).toEqual(expect.arrayContaining(['wpm', 'accuracy', 'chars']));
  });
});
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/db/db.test.ts`
Expected: FAIL — `db.verno` vaut 1 et les index `accuracy`/`chars` n'existent pas.

- [x] **Step 3: Déclarer la v2** — dans `src/db/db.ts`, après le bloc `this.version(1)` :

```ts
      this.version(1).stores({
        profile: 'id',
        runs: '++id, date, mode, language, textId, [mode+language+textId], wpm',
        achievements: 'id, unlockedAt',
        challenger: 'language',
      });
      // v2 : index de lecture pour personalBests — additif, aucune migration de données
      this.version(2).stores({
        runs: '++id, date, mode, language, textId, [mode+language+textId], wpm, accuracy, chars',
      });
```

- [x] **Step 4: Vérifier que le test passe**

Run: `npx vitest run src/db/db.test.ts`
Expected: 1 test PASS.

- [x] **Step 5: Commit**

```bash
git add src/db/db.ts src/db/db.test.ts
git commit -m "feat: schema v2 with accuracy and chars indexes on runs"
```

---

### Task 2: `personalBests` par requêtes d'index

**Files:**
- Modify: `src/db/runsRepo.ts`
- Test: `src/db/runsRepo.test.ts`

**Interfaces:**
- Produces: `personalBests()` — même signature, ne scanne plus la table. Consommé tel
  quel par `runFlow` et `LeaderboardPage` (aucun changement chez les appelants).

- [x] **Step 1: Ajouter le test de la base vide** — dans `src/db/runsRepo.test.ts`, dans
le `describe('runsRepo')` :

```ts
  it('personalBests retourne trois null sur base vide', async () => {
    expect(await personalBests()).toEqual({ bestWpm: null, bestAccuracy: null, longestRun: null });
  });
```

- [x] **Step 2: Vérifier l'état des tests**

Run: `npx vitest run src/db/runsRepo.test.ts`
Expected: tous PASS (le nouveau test passe déjà — il épingle le comportement à préserver ;
les 8 autres sont les garde-fous de la réécriture).

- [x] **Step 3: Réécrire `personalBests`** — dans `src/db/runsRepo.ts`, ajouter le helper
après `parseRuns` :

```ts
/** Prédicat de validation pour les filtres de requêtes d'index (curseur paresseux). */
function isValidRun(r: RunRecord): boolean {
  return runRecordSchema.safeParse(r).success;
}
```

et remplacer le corps de `personalBests` :

```ts
export async function personalBests(): Promise<{
  bestWpm: RunRecord | null;
  bestAccuracy: RunRecord | null;
  longestRun: RunRecord | null;
}> {
  // requêtes d'index paresseuses : le curseur s'arrête au premier match valide,
  // sans charger la table (les lignes corrompues sont écartées par le filtre)
  const bestWpm = (await db.runs.orderBy('wpm').reverse().filter(isValidRun).first()) ?? null;
  const bestAccuracy =
    (await db.runs
      .orderBy('accuracy')
      .reverse()
      .filter((r) => r.durationMs >= 10_000 && isValidRun(r))
      .first()) ?? null;
  const longestRun = (await db.runs.orderBy('chars').reverse().filter(isValidRun).first()) ?? null;
  return { bestWpm, bestAccuracy, longestRun };
}
```

- [x] **Step 4: Vérifier que tous les tests du repo passent**

Run: `npx vitest run src/db/runsRepo.test.ts src/game/runFlow.test.ts`
Expected: tous PASS — notamment « topRuns et personalBests ignorent les lignes
corrompues » et « personalBests ignore la précision des runs < 10 s ».

- [x] **Step 5: Commit**

```bash
git add src/db/runsRepo.ts src/db/runsRepo.test.ts
git commit -m "perf: read personalBests via lazy index queries"
```

---

### Task 3: `recentRuns` + HomePage

**Files:**
- Modify: `src/db/runsRepo.ts`
- Modify: `src/ui/pages/HomePage.tsx`
- Test: `src/db/runsRepo.test.ts`

**Interfaces:**
- Produces: `recentRuns(limit = 5): Promise<RunRecord[]>` — tri date décroissant, validé
  zod. Consommé par `HomePage`.

- [x] **Step 1: Écrire le test qui échoue** — dans `src/db/runsRepo.test.ts`, ajouter
`recentRuns` à l'import depuis `./runsRepo`, puis :

```ts
  it('recentRuns retourne les N plus récentes, ordre décroissant', async () => {
    for (let i = 1; i <= 7; i++) await saveRun(makeRun({ date: i }));
    const recent = await recentRuns(3);
    expect(recent.map((r) => r.date)).toEqual([7, 6, 5]);
  });
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/db/runsRepo.test.ts`
Expected: FAIL — `recentRuns` n'est pas exporté.

- [x] **Step 3: Implémenter et brancher** — dans `src/db/runsRepo.ts`, après `allRuns` :

```ts
export async function recentRuns(limit = 5): Promise<RunRecord[]> {
  return parseRuns(await db.runs.orderBy('date').reverse().limit(limit).toArray());
}
```

dans `src/ui/pages/HomePage.tsx` :

```ts
import { recentRuns } from '@/db/runsRepo';
```

```ts
    void recentRuns(5)
      .then(setRecent)
      .catch(() => { /* IndexedDB indisponible : liste vide déjà gérée */ });
```

(supprimer l'import `allRuns` devenu inutile et l'ancien `allRuns().then((runs) =>
setRecent(runs.sort((a, b) => b.date - a.date).slice(0, 5)))`).

- [x] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/db/runsRepo.test.ts src/ui/pages/HomePage.test.tsx`
Expected: tous PASS.

- [x] **Step 5: Commit**

```bash
git add src/db/runsRepo.ts src/db/runsRepo.test.ts src/ui/pages/HomePage.tsx
git commit -m "perf: read home page recent runs via the date index"
```

---

### Task 4: Vérification finale

- [x] **Step 1: Suite complète**

Run: `npm run test`
Expected: 145 tests PASS (142 + 3 nouveaux).

- [x] **Step 2: Build**

Run: `npm run build`
Expected: `tsc --noEmit` et `vite build` verts.

- [x] **Step 3: Cocher les cases du plan et commit final si nécessaire**

```bash
git add docs/superpowers/plans/2026-08-07-run-index-reads.md
git commit -m "docs: check off run index reads plan" # seulement si le fichier a changé
```
