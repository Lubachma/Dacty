# Code-splitting des routes — design

Date : 2026-08-06. Statut : approuvé (mode auto).

## Contexte

Le build produit un chunk unique de 621 Ko minifié (~191 Ko gzip) : `App.tsx` importe
statiquement les 8 pages, et le corpus JSON (~95 Ko minifié une fois inliné) part au premier
chargement alors que la page d'accueil n'en utilise rien. L'app va passer en repo public :
le temps de premier chargement compte.

## Objectif

Réduire le chunk initial sans changer aucun comportement visible, ni casser la suite de
tests (123 tests). Critère de succès mesurable : le corpus JSON et le code des pages
secondaires sortent du chunk d'entrée (vérifié via la liste des assets du build).

## Approche retenue : lazy routes simples

`React.lazy` + `Suspense` sur les 7 pages hors accueil. Alternative écartée (pour l'instant) :
rendre framer-motion lazy en remplaçant ses usages du shell par du CSS — gain ~22 Ko gzip
supplémentaires mais risque de régression visuelle ; pourra venir plus tard.

## Design

### Découpage

- **Eager** : `Layout`, `Header`, `ToastHost`, `HomePage` (page d'atterrissage, utilise
  dexie pour les runs récents et la progression challenger).
- **Lazy** : `PlayPage`, `DevPage`, `ChallengerPage`, `LeaderboardPage`,
  `AchievementsPage`, `StatsPage`, `SettingsPage`.
- **Inversion de dépendance** : `recordChallengerResult`
  reçoit désormais `officialIds: string[]` en paramètre (fourni par `runFlow`), afin que
  `src/db/challengerRepo.ts` n'importe plus `@/texts/corpus` — sinon le corpus restait
  statiquement atteignable depuis la HomePage (eager) et le split ne sortait rien.
- Les pages sont des exports nommés : pattern
  `lazy(() => import('@/ui/pages/PlayPage').then((m) => ({ default: m.PlayPage })))`.
- Une seule frontière `<Suspense>` dans `Layout.tsx` autour de `<Outlet />` (le header reste
  visible), fallback minimal cohérent avec le
  thème : `<p className="py-16 text-center text-muted">Chargement…</p>`.

### Effets attendus

- `src/texts/*.json` (importés via `corpus.ts`, uniquement depuis des pages lazy) quittent
  le chunk d'entrée — Vite les placera dans un chunk partagé chargé à la demande.
- Chunk d'entrée estimé après découpage : ~490 Ko minifié (~155 Ko gzip).
- Aucun `manualChunks` : découpage piloté uniquement par les imports dynamiques.

### Tests

- Nouveau `src/App.test.tsx` : smoke test — `<App />` rend la page d'accueil (prouve que la
  frontière Suspense et les imports lazy sont correctement câblés ; les pages lazy se
  résolvent de façon asynchrone en jsdom via `findBy*`).
- Les tests de pages existants importent les pages directement : inchangés.

### Hors scope

Prefetch au survol, `manualChunks` vendor, framer-motion lazy, budget de bundle en CI.

## Vérification

1. `npm run test` : 123 → 125 tests verts.
2. `npm run build` : plusieurs chunks dans `dist/assets`, l'entrée ne contient plus le
   corpus (taille comparée avant/après, notée au commit).
