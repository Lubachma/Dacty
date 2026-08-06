# Chrono monotone — design

Date : 2026-08-06. Statut : approuvé (mode auto).

## Contexte

La mesure de durée des runs repose sur `Date.now()` (injecté par `runStore` dans le
moteur, qui est pur et reçoit `now` en paramètre). `Date.now()` n'est **pas monotone** :
un ajustement NTP ou un changement manuel de l'heure système peut le faire sauter en
pleine run → durée négative (plafonnée à 0 par `elapsedMs`, WPM faussé) ou gonflée.
Résolution ~1 ms, parfois dégradée (anti-fingerprinting). `performance.now()` est
monotone, à résolution sub-milliseconde : c'est l'horloge correcte pour mesurer une durée.

En revanche les **dates murales** doivent rester en epoch : `run.date` (streaks, stats
quotidiennes, tri), `achievements.unlockedAt`, `profile.lastActiveAt`.

Les timestamps moteur (`startedAt`, `finishedAt`, `events[].at`, `pauseStartedAt`) ne sont
jamais persistés (le `RunRecord` ne contient que `date` et `durationMs`) : aucun risque de
mélange d'horloges entre sessions, aucune migration.

## Objectif

Toutes les durées de run sont mesurées sur l'horloge monotone ; toutes les dates murales
restent sur `Date.now()` ; aucun mélange entre les deux. Comportement visible inchangé.
Critère de succès : plus aucun `Date.now()` n'alimente `startedAt` / `finishedAt` /
`events` / `pausedMs` / le HUD temps réel / la comparaison du focus guard.

## Approches considérées

- **A (retenue)** : module `src/engine/clock.ts` exportant `nowMs(): number` (=
  `performance.now()`), utilisé aux points d'injection de la mesure de durée. Minimal,
  centralisé, mockable en test.
- B : injecter l'horloge en paramètre des actions du store (`key(char, now)`) — pureté
  accrue mais ripple sur les handlers UI et tous les tests ; YAGNI (le moteur reçoit déjà
  `now`, le store est l'unique injecteur).
- C : ne rien faire — les sauts d'horloge système faussent le WPM ; rejeté.

## Design

### 1. `src/engine/clock.ts` (nouveau)

```ts
export const nowMs = (): number => performance.now();
```

Commentaire d'usage : horloge monotone pour les durées ; ne jamais mélanger avec
`Date.now()` (origines différentes) ; les dates murales restent sur `Date.now()`.

### 2. Points d'injection basculés sur `nowMs()`

- `src/state/runStore.ts` : `typeChar` (frappe + auto-indentation), `pressBackspace`,
  `pauseRun`, `resumeRun`. Le 3ᵉ argument de `completeRun(next, config, Date.now())`
  **reste** `Date.now()` : c'est la date murale du record.
- `src/ui/components/RunHud.tsx` : le `now` de `liveWpm` / `elapsedMs` (affichage temps
  réel, cohérent avec `startedAt` monotone).
- `src/ui/hooks/useFocusGuard.ts` : la comparaison `now - pauseStartedAt` (même horloge
  que `pauseStartedAt`, sinon la garde casse).

### 3. Contrat documenté (`src/game/runFlow.ts`, commentaire)

Le paramètre `now` de `completeRun` / `buildRunRecord` est l'**horloge murale** (date du
record). La durée vient des timestamps moteur : `elapsedMs` utilise `finishedAt`, toujours
renseigné quand la run est terminée — le repli `?? now` ne sert jamais sur ce chemin.
Même chose pour les replis `?? now` des deux appels `wpmTimeline(events, startedAt ?? now,
finishedAt ?? now)` (`runFlow.ts`, fallback de `runStore.ts`) : sur une run terminée,
`startedAt` et `finishedAt` sont renseignés. `computeWpm` retourne déjà 0 si `ms <= 0` :
pas de division par zéro.

### Tests

- `src/engine/clock.test.ts` (nouveau) : `nowMs()` fini, non décroissant entre deux appels,
  origine distincte de l'epoch (`< Date.now()`, qui échouerait si quelqu'un réimplémentait
  `nowMs` avec `Date.now()`).
- `src/ui/hooks/useFocusGuard.test.ts` : le test « absence > délai » simulait le temps via
  `vi.setSystemTime` (horloge murale) — remplacé par un spy sur `performance.now()`
  avançant l'horloge monotone de 10 s. Les deux autres tests sont inchangés.
- Le reste de la suite est insensible : `runStore.test.ts` n'asserte aucun WPM ;
  `runFlow.test.ts` passe des timestamps explicites et `finishedAt` est toujours renseigné.

### Hors scope

Refonte de la signature de `completeRun`, injection d'horloge dans les props des pages,
migration de données (rien à migrer), remplacement des `Date.now()` muraux (streaks,
`dailyAverages`, profil, succès) qui sont corrects par nature.

## Vérification

1. `npm run test` : 141 → 142 tests verts.
2. `npm run build` : tsc + vite verts.
3. `grep Date.now()` : ne reste que des usages muraux (date de record, streaks, profil,
   succès, stats quotidiennes) + tests.
