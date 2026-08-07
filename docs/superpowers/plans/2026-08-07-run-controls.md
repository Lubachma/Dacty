# Boutons Arrêter / Recommencer — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Boutons « Recommencer » (même texte, à zéro) et « Arrêter » (abandon sans
enregistrement) pendant les runs d'entraînement.

**Architecture:** composant `RunControls` lisant `useRunStore` directement, inséré après
`<TypingArea />` dans la vue run de `PlayPage` et `DevPage`. Aucun changement de store.

**Tech Stack:** React 19, zustand, vitest + Testing Library.

Spec : `docs/superpowers/specs/2026-08-07-run-controls-design.md`

## Global Constraints

- TypeScript strict avec `noUnusedLocals` / `noUnusedParameters`.
- Commentaires en français, commits en anglais (conventional commits).
- Jamais affiché en statut `invalidated` (écran dédié avec « Nouvelle run »).
- ChallengerPage hors scope.

---

### Task 1: Composant `RunControls` + branchement

**Files:**
- Create: `src/ui/components/RunControls.tsx`
- Modify: `src/ui/pages/PlayPage.tsx`, `src/ui/pages/DevPage.tsx`
- Test: `src/ui/components/RunControls.test.tsx` (nouveau)

**Interfaces:**
- Consumes: `useRunStore` — `start(config, text)`, `reset()`, `config`, `typing?.text`.
- Produces: `RunControls` (sans props). Consommé par `PlayPage` et `DevPage`.

- [x] **Step 1: Écrire le test qui échoue** — `src/ui/components/RunControls.test.tsx`

```tsx
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useRunStore } from '@/state/runStore';
import { RunControls } from './RunControls';
import { ALL_OPTIONS_ON } from '@/texts/normalize';

const config = { mode: 'free' as const, language: 'fr' as const, textId: 'fr-001', options: ALL_OPTIONS_ON };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useRunStore.getState().reset();
});

describe('RunControls', () => {
  it('« Recommencer » relance le même texte à zéro', async () => {
    const user = userEvent.setup();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    render(<RunControls />);
    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    const s = useRunStore.getState();
    expect(s.status).toBe('running');
    expect(s.typing?.text).toBe('ab');
    expect(s.typing?.cursor).toBe(0);
    expect(s.typing?.keystrokes).toBe(0);
  });

  it('« Recommencer » depuis une run en pause repart en running, état frais', async () => {
    const user = userEvent.setup();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    useRunStore.getState().pause();
    render(<RunControls />);
    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    const s = useRunStore.getState();
    expect(s.status).toBe('running');
    expect(s.typing?.cursor).toBe(0);
    expect(s.typing?.pausedMs).toBe(0);
  });

  it('« Arrêter » abandonne la run : statut idle, typing null', async () => {
    const user = userEvent.setup();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    render(<RunControls />);
    await user.click(screen.getByRole('button', { name: 'Arrêter' }));
    const s = useRunStore.getState();
    expect(s.status).toBe('idle');
    expect(s.typing).toBeNull();
  });
});
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/ui/components/RunControls.test.tsx`
Expected: FAIL — `./RunControls` n'existe pas.

- [x] **Step 3: Implémenter le composant** — `src/ui/components/RunControls.tsx`

```tsx
import { useRunStore } from '@/state/runStore';

/**
 * Actions pendant une run d'entraînement :
 * « Recommencer » relance le même texte à zéro, « Arrêter » abandonne (rien n'est
 * enregistré). Rend null hors run — le parent ne l'affiche que pendant la run.
 */
export function RunControls() {
  const config = useRunStore((s) => s.config);
  const text = useRunStore((s) => s.typing?.text);
  const start = useRunStore((s) => s.start);
  const reset = useRunStore((s) => s.reset);
  if (!config || !text) return null;
  return (
    <div className="flex justify-center gap-3">
      <button
        type="button"
        onClick={() => start(config, text)}
        className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
      >
        Recommencer
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
      >
        Arrêter
      </button>
    </div>
  );
}
```

- [x] **Step 4: Brancher dans les deux pages** — après `<TypingArea />` dans la vue run
(branche `running | paused`, pas `invalidated`).

`src/ui/pages/PlayPage.tsx` :

```tsx
              <TypingArea state={typing} disabled={status !== 'running'} onChar={handleChar} onBackspace={backspace} />
              <RunControls />
```

`src/ui/pages/DevPage.tsx` : identique (même ligne `<TypingArea … />`). Ajouter dans
chacune :

```tsx
import { RunControls } from '@/ui/components/RunControls';
```

- [x] **Step 5: Vérifier que les tests passent**

Run: `npx vitest run src/ui/components/RunControls.test.tsx src/ui/pages/PlayPage.test.tsx src/ui/pages/DevPage.test.tsx`
Expected: tous PASS.

- [x] **Step 6: Commit**

```bash
git add src/ui/components/RunControls.tsx src/ui/components/RunControls.test.tsx src/ui/pages/PlayPage.tsx src/ui/pages/DevPage.tsx
git commit -m "feat: stop and restart buttons during training runs"
```

---

### Task 2: Vérification finale

- [x] **Step 1: Suite complète**

Run: `npm run test`
Expected: 154 tests PASS (151 + 3 nouveaux).

- [x] **Step 2: Build**

Run: `npm run build`
Expected: `tsc --noEmit` et `vite build` verts.

- [x] **Step 3: Cocher les cases du plan et commit final si nécessaire**

```bash
git add docs/superpowers/plans/2026-08-07-run-controls.md
git commit -m "docs: check off run controls plan" # seulement si le fichier a changé
```
