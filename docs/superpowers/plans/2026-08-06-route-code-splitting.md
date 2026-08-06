# Route Code-Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sortir les 7 pages secondaires et le corpus JSON du chunk initial via React.lazy, sans changement visible de comportement.

**Architecture:** `App.tsx` ne garde eager que `Layout` + `HomePage` ; les 7 autres pages passent en `React.lazy` (exports nommés → `.then((m) => ({ default: m.X }))`). La frontière `<Suspense>` vit dans `Layout.tsx` autour de `<Outlet />` pour que le header reste visible pendant le chargement d'un chunk.

**Tech Stack:** React 19 (lazy/Suspense), react-router 8, Vite 7 (rollup), Vitest + Testing Library.

## Global Constraints

- Aucune nouvelle dépendance.
- `npm run test` : 125 tests verts à la fin (123 actuels + 2 nouveaux App tests).
  Note : le test 1 (accueil) passe dès l'écriture ; seul le test 2 (fallback) est rouge.
- `npm run build` (tsc --noEmit + vite build) doit passer.
- Commits en anglais, conventional commits (ex. `perf: lazy-load secondary routes`).
- Spec de référence : `docs/superpowers/specs/2026-08-06-route-code-splitting-design.md`.

---

### Task 1: Tests rouges — smoke App + fallback Suspense

**Files:**
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: `export default function App()` de `src/App.tsx` (inchangé ici).
- Produces: le texte de fallback `Chargement…` que Task 2 devra rendre dans `Layout.tsx`.

- [x] **Step 1: Écrire le test**

```tsx
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('rend la page d\'accueil', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Dacty/ })).toBeInTheDocument();
  });

  it('affiche un fallback pendant le chargement d\'une page lazy, header visible', async () => {
    window.history.pushState({}, '', '/achievements');
    render(<App />);
    // chunk pas encore résolu : fallback dans <main>, header toujours présent
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dacty' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Succès' })).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Vérifier le rouge**

Run: `npx vitest run src/App.test.tsx`
Expected: 1 passed (accueil), 1 failed — `Unable to find an element with the text: Chargement…`.

### Task 2: Implémentation — lazy routes + Suspense dans Layout

**Files:**
- Modify: `src/App.tsx` (réécriture complète, voir ci-dessous)
- Modify: `src/ui/components/Layout.tsx:1` (import) et `src/ui/components/Layout.tsx:26-28` (bloc `<main>`)

**Interfaces:**
- Consumes: exports nommés `PlayPage`, `DevPage`, `ChallengerPage`, `LeaderboardPage`, `AchievementsPage`, `StatsPage`, `SettingsPage` (existants, inchangés) ; `HomePage` reste un import statique.
- Produces: chunk d'entrée sans corpus ni pages secondaires ; fallback texte exact `Chargement…` (attendu par `src/App.test.tsx`).

- [x] **Step 1: Réécrire `src/App.tsx`**

```tsx
import { lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from '@/ui/components/Layout';
import { HomePage } from '@/ui/pages/HomePage';
import { useSettings } from '@/state/settingsStore';

// pages secondaires en imports dynamiques : hors du chunk initial
const PlayPage = lazy(() => import('@/ui/pages/PlayPage').then((m) => ({ default: m.PlayPage })));
const DevPage = lazy(() => import('@/ui/pages/DevPage').then((m) => ({ default: m.DevPage })));
const ChallengerPage = lazy(() =>
  import('@/ui/pages/ChallengerPage').then((m) => ({ default: m.ChallengerPage })),
);
const LeaderboardPage = lazy(() =>
  import('@/ui/pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
);
const AchievementsPage = lazy(() =>
  import('@/ui/pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage })),
);
const StatsPage = lazy(() => import('@/ui/pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazy(() =>
  import('@/ui/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

export default function App() {
  const load = useSettings((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/dev" element={<DevPage />} />
          <Route path="/challenger" element={<ChallengerPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [x] **Step 2: `Layout.tsx` — frontière Suspense autour de `<Outlet />`**

Import (ligne 1) : remplacer `import { useEffect, useState } from 'react';` par :

```tsx
import { Suspense, useEffect, useState } from 'react';
```

Bloc `<main>` : remplacer

```tsx
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
```

par

```tsx
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense fallback={<p className="py-16 text-center text-muted">Chargement…</p>}>
          <Outlet />
        </Suspense>
      </main>
```

- [x] **Step 3: Vérifier le vert**

Run: `npx vitest run src/App.test.tsx`
Expected: 2 passed.

- [x] **Step 4: Suite complète + build**

Run: `npm run test 2>&1 | tail -3 && npm run build 2>&1 | tail -2`
Expected: `Tests  125 passed (125)` et `✓ built`.

### Task 3: Mesurer le découpage et commiter

**Files:**
- Aucun (vérification + commit)

**Interfaces:**
- Consumes: le build de Task 2.

- [x] **Step 1: Noter la baseline actuelle**

Run: `ls -la dist/assets/ | sort -k5 -n`
Expected: le build précédent montrait un seul chunk JS (~621 Ko). Si `dist/` reflète déjà Task 2, noter la taille de l'entrée actuelle et comparer au 621 Ko documenté dans la spec.

- [x] **Step 2: Vérifier la composition des chunks**

Run: `ls -la dist/assets/*.js | awk '{print $5, $9}' | sort -n`
Expected: plusieurs chunks JS ; un chunk contenant le corpus (~95 Ko, chargé à la demande) ; l'entrée ~490 Ko ou moins. Vérifier que le plus gros chunk hors entrée correspond aux pages/corpus.

- [x] **Step 3: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/ui/components/Layout.tsx docs/superpowers/
git commit -m "perf: lazy-load secondary routes (React.lazy + Suspense in Layout)"
```

Expected: `git log --oneline -1` affiche le commit ; `git status --short` est vide.

---

### Task 2b (ajoutée en exécution): inverser la dépendance challengerRepo → corpus

Constate après Task 2 : l'entrée ne perdait que ~34 Ko. Cause : `challengerRepo.ts` importait
`getOfficialTexts` depuis `@/texts/corpus`, et `HomePage` (eager) importe `challengerRepo` →
le corpus restait dans le graphe statique.

Changement : `recordChallengerResult(language, textId, points, now, officialIds: string[])` —
les ids officiels sont injectés par l'appelant (`runFlow`). Appels mis à jour :
`src/game/runFlow.ts`, `src/db/challengerRepo.test.ts`, `src/ui/pages/ChallengerPage.test.tsx`.

Résultat mesuré : chunk `corpus-*.js` séparé (63 Ko), entrée 621 Ko → 523 Ko minifié
(~166 Ko gzip). 125/125 tests, build vert.
