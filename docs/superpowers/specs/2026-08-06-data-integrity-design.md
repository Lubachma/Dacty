# Intégrité des données — design

Date : 2026-08-06. Statut : approuvé (mode auto).

## Contexte

Trois faiblesses de robustesse identifiées lors de l'audit :

1. **Lectures de runs non validées.** IndexedDB est modifiable hors de l'app (DevTools,
   extensions, bug d'écriture). `profile` et `challenger` sont déjà validés à la lecture
   via zod (`src/db/schemas.ts`, pattern `safeParse` + fallback dans `profileRepo` /
   `challengerRepo`), mais `runsRepo` retourne les lignes brutes. Une ligne corrompue
   (`wpm: "abc"`, `options: null`…) peut faire planter le rendu des pages stats, accueil,
   succès ou fausser les calculs.
2. **Aucun ErrorBoundary.** Une erreur de rendu n'importe où = écran blanc total, app
   inutilisable sans vider les données du site.
3. **`completeRun` non atomique.** Il écrit dans 3 tables (`runs`, `challenger`,
   `achievements`) en séquentiel : une panne au milieu (quota, fermeture d'onglet, erreur)
   laisse un état partiel — run sauvée sans progression challenger, ou l'inverse.

## Objectif

Ne jamais planter sur données corrompues, ne jamais persister un état partiel. Critères de
succès : les runs invalides sont écartés à la lecture avec avertissement console ; une
erreur de rendu est confinée à la page avec un fallback actionnable (header intact) ;
`completeRun` est atomique (tout ou rien). Aucun changement de comportement visible sur
données saines.

## Approches considérées

- **A (retenue)** : validation zod à la lecture dans `runsRepo` + ErrorBoundary au niveau
  route + transaction Dexie autour de `completeRun`. Suit le pattern déjà établi dans le
  projet, changements minimaux.
- B : validation à l'écriture seule — ne protège pas contre la corruption externe. Écartée.
- C : table de quarantaine pour les lignes corrompues + notification utilisateur —
  surdimensionné pour une app locale (YAGNI). Écartée.

## Design

### 1. Schéma zod des runs (`src/db/schemas.ts`)

- `textOptionsSchema` : les 4 booléens de `TextOptions` (`punctuation`, `specialChars`,
  `digits`, `accents`).
- `runRecordSchema` : miroir exact de `RunRecord` — `date` int positif, `mode`
  `z.enum(['free', 'challenger'])`, `language` = `languageSchema` existant, `textId`
  string non vide, `options` = `textOptionsSchema`, `durationMs` int ≥ 0, `wpm` / `points`
  finis ≥ 0, `accuracy` finie entre 0 et 1 (fraction, pas un pourcentage), `errors` /
  `backspaces` / `chars` int ≥ 0,
  `noBackspace` booléen, `id` optionnel int ≥ 1.
- Clés inconnues : strip (défaut zod). Les runs ne sont jamais réécrits après lecture :
  aucune perte.

### 2. Validation à la lecture (`src/db/runsRepo.ts`)

- Helper interne `parseRuns(rows: unknown[]): RunRecord[]` : `safeParse` ligne à ligne,
  écarte les invalides, un seul `console.warn` agrégé indiquant le nombre écarté.
- Appliqué dans `allRuns`, `topRuns` (après `toArray`) et `personalBests`.
- `rankFor` exclu : il ne retourne qu'un compteur, pas d'objets désérialisés ; sous
  corruption le pire cas est un rang décalé, assumé.

### 3. ErrorBoundary (`src/ui/components/ErrorBoundary.tsx`)

- Composant classe : `getDerivedStateFromError` + `componentDidCatch` (`console.error`).
- Placé dans `Layout.tsx` autour de `<Suspense><Outlet /></Suspense>` : header, bandeau
  persistance et toasts restent visibles.
- `resetKey = useLocation().pathname` : la navigation réinitialise le boundary
  (`componentDidUpdate` compare la prop).
- Fallback : message « Une erreur est survenue sur cette page », bouton « Réessayer »
  (reset local) et lien « Retour à l'accueil ». Styles cohérents avec le thème existant.

### 4. Transaction Dexie (`src/game/runFlow.ts`)

- `db.transaction('rw', [db.runs, db.challenger, db.achievements], …)` autour de la chaîne
  `personalBests` → `saveRun` → `recordChallengerResult` → `buildContext` → `unlockNew`.
- Toutes les opérations internes sont Dexie ou synchrones (`getOfficialTexts`,
  `wpmTimeline` est pur) : compatible avec les transactions Dexie (aucun `await` externe).
- Échec d'une étape ⇒ rollback complet des trois tables. Le `.catch` existant de
  `runStore` affiche déjà le toast « Sauvegarde impossible », qui devient exact : rien
  n'est persisté, pas d'état partiel.

### Tests

- `schemas.test.ts` (nouveau) : `runRecordSchema` accepte un run réel (fixture du repo de
  tests existant) et rejette les corruptions représentatives (types faux, `accuracy` >
  1, entiers négatifs, `options` incomplet).
- `runsRepo.test.ts` (étendu) : 1 run valide + 1 ligne corrompue insérée brute ⇒
  `allRuns` / `topRuns` / `personalBests` ne retournent que le valide, `console.warn` émis.
- `runFlow.test.ts` (étendu) : `db.achievements.bulkAdd` mocké en échec ⇒ `completeRun`
  rejette ET rien n'est persisté (`runs` vide, progression challenger inchangée).
- `ErrorBoundary.test.tsx` (nouveau) : enfant qui lève une erreur ⇒ fallback affiché, reste
  de l'UI intact ; « Réessayer » réinitialise le boundary.

### Hors scope

Quarantaine des lignes corrompues, notification UI des runs écartés, validation de la
table `achievements`, migration/réparation des données existantes, validation dans
`rankFor`.

## Vérification

1. `npm run test` : 125 → 141 tests verts.
2. `npm run build` : tsc + vite verts.
