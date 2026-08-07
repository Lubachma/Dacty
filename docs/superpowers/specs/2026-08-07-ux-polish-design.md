# Polish UX — design

Date : 2026-08-07. Statut : approuvé (mode auto).

## Contexte

Quatre défauts UX identifiés lors de l'audit, tous vérifiables par tests :

1. **Onglets sans titre.** `document.title` n'est jamais défini : tous les onglets
   s'appellent « Dacty » (index.html), historique et signets illisibles — gênant pour un
   repo qui passe public.
2. **Le chrono tourne pendant la navigation.** Quitter `/play` en cours de run ne met
   rien en pause (le focus guard ne couvre que le blur fenêtre) : revenir plus tard montre
   une run dont le WPM est ruiné, et elle sera persistée ainsi.
3. **Toasts illimités.** Un run qui débloque plusieurs succès empile autant de toasts
   qu'il faut, sans borne.
4. **Contraste accent insuffisant (thème sombre).** Mesuré (formule WCAG 2.1) :
   `#7c5cff` sur `#0b0f14` ≈ **4,43:1** et blanc sur `#7c5cff` ≈ **4,35:1** — sous le seuil
   AA 4,5:1 pour le texte courant (boutons, `text-accent` en `text-xs`). Le thème clair
   passe (≈ 4,7–4,8:1).

Note : le retrait de framer-motion du shell, envisagé, est **abandonné** — le curseur de
`TypingArea` et les sorties `AnimatePresence` des toasts sont irremplaçables en CSS sans
risque de régression visuelle non vérifiable en test.

## Objectif

Corriger les quatre points sans changement de comportement autre que ceux décrits.
Critères : titres d'onglet par route ; run mise en pause à la sortie de page (chrono
exclu via `pausedMs`) ; au plus 3 toasts ; ratios AA ≥ 4,5:1 épinglés par test.

## Approches considérées

- **A (retenue)** : quatre mini-fixes indépendantes, un seul plan, une tâche chacune.
- B : tout un thème de refonte visuelle — hors de propos, rejeté.
- C : reporter le contraste — le delta visuel est minime et mesuré, autant le faire ;
  rejeté.

## Design

### 1. Titres d'onglet (`src/ui/components/Layout.tsx`)

Map route → titre alignée sur les `<h1>` existants, effet sur `location.pathname`
(déjà disponible dans `Layout`) :

```ts
const TITLES: Record<string, string> = {
  '/': 'Dacty',
  '/play': 'Entraînement libre · Dacty',
  '/dev': 'Mode Dev · Dacty',
  '/challenger': 'Mode Challenger · Dacty',
  '/leaderboard': 'Classements · Dacty',
  '/achievements': 'Succès · Dacty',
  '/stats': 'Statistiques · Dacty',
  '/settings': 'Réglages · Dacty',
};
// useEffect: document.title = TITLES[location.pathname] ?? 'Dacty'
```

### 2. Pause à la sortie de page (`src/ui/hooks/usePauseRunOnUnmount.ts`)

```ts
useEffect(() => () => { useRunStore.getState().pause(); }, []);
```

`pause()` no-op sauf si `status === 'running'` (garde existante du store) : le hook est
inconditionnel. Appelé dans `PlayPage`, `DevPage`, `ChallengerPage` à côté de
`useFocusGuard()`. En revenant sur la page, l'utilisateur voit la run en pause
(« clique dans le texte pour reprendre ») avec le temps de pause exclu du chrono.

### 3. Cap des toasts (`src/state/toastStore.ts`)

`MAX_TOASTS = 3` : `push` ne conserve que les 2 plus récents avant d'ajouter
(`s.toasts.slice(-(MAX_TOASTS - 1))`). L'auto-dismiss 5 s et `dismiss` sont inchangés.

### 4. Contraste AA (`src/index.css` + 9 sites de boutons)

- Thème sombre : `--accent: #7c5cff` → `#8064ff` (**4,75:1** sur `--bg`, mesuré) — corrige
  tous les `text-accent`. Nouveau `--accent-strong: #6a4dff` (blanc dessus : **5,1:1**)
  pour les fonds de boutons à texte blanc. Thème clair : `--accent-strong = --accent =
  #6a4dff` (inchangé, déjà conforme).
- Token `--color-accent-strong` déclaré dans `@theme inline` → classe `bg-accent-strong`.
- Les 9 sites `bg-accent … text-white` passent à `bg-accent-strong` :
  `HomePage.tsx:59`, `DevPage.tsx:70` et `:137`, `PlayPage.tsx:83` et `:161`,
  `ChallengerPage.tsx:129` et `:184`, `ErrorBoundary.tsx:42`, `ResultsScreen.tsx:89`.
  Les `bg-accent` sans texte (barres de progression, curseur, toggle) restent.
- Delta visuel : accent sombre légèrement plus clair, boutons légèrement plus foncés —
  même teinte, changement subtil assumé.

### Tests

- `src/ui/contrast.test.ts` (nouveau) : formule WCAG 2.1 (luminance relative) + les 4
  paires épinglées ≥ 4,5:1 (bouton blanc/strong et accent/fond, dark + light).
- `src/App.test.tsx` (étendu) : titre « Dacty » sur `/`, « Réglages · Dacty » sur
  `/settings`.
- `src/ui/hooks/usePauseRunOnUnmount.test.ts` (nouveau) : run en cours → `paused` au
  démontage ; sans run → reste `idle`.
- `src/state/toastStore.test.ts` (étendu) : 4 pushes → 3 toasts, les plus récents gardés.

### Hors scope

Retrait de framer-motion (abandonné, voir note), skeletons de chargement (le fallback
actuel suffit), refonte visuelle, darkening des hovers.

## Vérification

1. `npm run test` : 145 → 152 tests verts.
2. `npm run build` : tsc + vite verts.
