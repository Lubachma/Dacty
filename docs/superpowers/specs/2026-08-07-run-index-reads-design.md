# Lectures de runs par index — design

Date : 2026-08-07. Statut : approuvé (mode auto).

## Contexte

Deux lectures chargent toute la table `runs` sans en avoir besoin :

1. **`personalBests()`** fait `db.runs.toArray()` — appelé à **chaque run terminée** (chemin
   chaud de `completeRun`, dans la transaction) et par la page Classements. La table grandit
   indéfiniment : coût linéaire à vie pour trois maximums.
2. **`HomePage`** (page d'atterrissage, chunk eager) fait `allRuns()` puis trie et tranche
   à 5 — scan complet pour 5 lignes.

L'index `wpm` existe depuis la v1 mais n'est jamais utilisé ; `accuracy` et `chars` ne sont
pas indexés. Les autres consommateurs de `allRuns` (`StatsPage`, `AchievementsPage`,
`buildContext` des succès) ont réellement besoin de toutes les lignes (graphiques, streaks,
prédicats de succès) : hors scope.

## Objectif

Lire les records et les dernières runs via les index Dexie (coût logarithmique + curseur
paresseux), en conservant la validation zod et l'exact comportement visible. Critères :
`personalBests` ne scanne plus la table ; la HomePage ne charge que 5 lignes ; migration
v2 additive sans transformation de données.

## Approches considérées

- **A (retenue)** : schéma v2 additif (`accuracy`, `chars`) + `personalBests` en trois
  requêtes d'index avec filtre zod paresseux + `recentRuns(limit)` pour la HomePage.
- B : cache mémoire des records invalidé à l'écriture — état global supplémentaire,
  invalidation délicate (écritures hors app impossibles à détecter) ; rejeté.
- C : ne rien faire — le scan reste sur le chemin de chaque run terminée ; rejeté.

## Design

### 1. Schéma v2 (`src/db/db.ts`)

```ts
this.version(1).stores({ ... });           // inchangé, conservé pour le chemin d'upgrade
this.version(2).stores({
  runs: '++id, date, mode, language, textId, [mode+language+textId], wpm, accuracy, chars',
});
```

Ajout d'index uniquement : Dexie reconstruit les index tout seul, **pas d'upgrade
callback**, pas de transformation de données. Les autres tables héritent du schéma v1.
Pas de test d'upgrade réel (la déclaration additive est le chemin standard Dexie) : un
smoke test épingle le schéma exposé.

### 2. `src/db/runsRepo.ts`

- Nouveau helper (non exporté) :
  `isValidRun(r: RunRecord): boolean` = `runRecordSchema.safeParse(r).success`.
- `personalBests()` réécrit en trois requêtes paresseuses (`.filter().first()` itère
  l'index par curseur et s'arrête au premier match) :

```ts
const bestWpm =
  (await db.runs.orderBy('wpm').reverse().filter(isValidRun).first()) ?? null;
const bestAccuracy =
  (await db.runs.orderBy('accuracy').reverse()
    .filter((r) => r.durationMs >= 10_000 && isValidRun(r)).first()) ?? null;
const longestRun =
  (await db.runs.orderBy('chars').reverse().filter(isValidRun).first()) ?? null;
```

  Corruption : une valeur non numérique est triée après les nombres dans l'ordre des clés
  IndexedDB, donc rencontrée en premier en `reverse()` — le filtre zod l'écarte et le
  curseur continue. Validation **silencieuse** ici (pas de `console.warn` : le filtre ne
  voit que les lignes inspectées) ; le warn reste garanti par les scans complets
  (`allRuns`, `topRuns`, `recentRuns`).
- Nouveau :
  `recentRuns(limit = 5): Promise<RunRecord[]>` =
  `db.runs.orderBy('date').reverse().limit(limit).toArray()` puis `parseRuns`
  (validation + warn agrégé conservés).

### 3. `src/ui/pages/HomePage.tsx`

`recentRuns(5)` remplace `allRuns()` + tri + slice. Signature inchangée côté affichage.

### Inchangé

`allRuns` (consommateurs qui ont besoin de tout), `topRuns`, `rankFor`, les signatures
publiques, le toast/la transaction de `completeRun` (les requêtes d'index passent sans
problème dans la transaction `rw`).

### Tests

- `src/db/db.test.ts` (nouveau) : le schéma exposé par `db` est en version 2 et déclare
  les index `wpm`, `accuracy`, `chars` sur `runs`.
- `src/db/runsRepo.test.ts` (étendu) : `personalBests` sur base vide → trois `null` ;
  `recentRuns` retourne les N plus récentes, ordre décroissant. Les tests existants —
  notamment « topRuns et personalBests ignorent les lignes corrompues » — doivent rester
  verts sans modification.
- `src/ui/pages/HomePage.test.tsx` : inchangé (1 run seedée, toujours affichée).

### Hors scope

Cache mémoire, optimisation d'`allRuns`/`buildContext`, pagination de `topRuns`,
test d'upgrade v1→v2 réel.

## Vérification

1. `npm run test` : 142 → 145 tests verts.
2. `npm run build` : tsc + vite verts.
