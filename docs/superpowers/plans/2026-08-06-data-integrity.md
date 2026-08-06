# Intégrité des données — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ne jamais planter sur données IndexedDB corrompues et rendre `completeRun` atomique.

**Architecture:** validation zod à la lecture dans `runsRepo` (pattern déjà établi par
`profileRepo` / `challengerRepo`), ErrorBoundary classe au niveau route dans `Layout`,
transaction Dexie `rw` sur `runs` + `challenger` + `achievements` dans `completeRun`.

**Tech Stack:** React 19, TypeScript strict, Dexie 4, zod 3, vitest + jsdom +
fake-indexeddb.

Spec : `docs/superpowers/specs/2026-08-06-data-integrity-design.md`

## Global Constraints

- `accuracy` est une **fraction entre 0 et 1** (pas un pourcentage).
- TypeScript strict avec `noUnusedLocals` / `noUnusedParameters` (préfixe `_` pour les
  paramètres inutilisés). Pas de `exactOptionalPropertyTypes`.
- Commentaires de code en français, messages de commit en anglais (conventional commits).
- Aucun changement de comportement visible sur données saines.
- Commandes : `npm run test` (vitest run), `npm run build` (= `tsc --noEmit && vite build`).
- Tests DB : `import 'fake-indexeddb/auto'` en première ligne et
  `beforeEach` qui vide les tables : `await Promise.all(db.tables.map((t) => t.clear()))`.

---

### Task 1: `runRecordSchema` dans `src/db/schemas.ts`

**Files:**
- Modify: `src/db/schemas.ts`
- Test: `src/db/schemas.test.ts` (nouveau)

**Interfaces:**
- Produces: `runRecordSchema: z.ZodObject<...>` dont `z.infer` est structurellement
  assignable à `RunRecord` (`src/db/types.ts`). Consommé par la Task 2.

- [x] **Step 1: Écrire le test qui échoue** — `src/db/schemas.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { runRecordSchema } from './schemas';
import type { RunRecord } from './types';

const valid: RunRecord = {
  id: 7,
  date: 1000,
  mode: 'free',
  language: 'fr',
  textId: 'fr-001',
  options: { punctuation: true, specialChars: true, digits: true, accents: true },
  durationMs: 30_000,
  wpm: 50.5,
  accuracy: 0.97,
  points: 66,
  errors: 3,
  backspaces: 2,
  chars: 250,
  noBackspace: false,
};

describe('runRecordSchema', () => {
  it('accepte une run complète et la retourne à l\'identique', () => {
    // toEqual : échoue si le schéma oublie un champ de RunRecord (strip zod)
    expect(runRecordSchema.parse(valid)).toEqual(valid);
  });

  it('accepte l\'absence d\'id (avant auto-incrément)', () => {
    const { id: _id, ...sansId } = valid;
    expect(runRecordSchema.safeParse(sansId).success).toBe(true);
  });

  it.each([
    ['wpm non numérique', { wpm: 'rapide' }],
    ['wpm Infinity', { wpm: Infinity }],
    ['accuracy > 1', { accuracy: 1.5 }],
    ['accuracy NaN', { accuracy: NaN }],
    ['errors négatif', { errors: -1 }],
    ['options null', { options: null }],
    ['mode inconnu', { mode: 'ranked' }],
    ['date nulle', { date: 0 }],
  ])('rejette une run avec %s', (_label, patch) => {
    expect(runRecordSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/db/schemas.test.ts`
Expected: FAIL — `runRecordSchema` n'existe pas dans `./schemas`.

- [x] **Step 3: Implémenter le schéma** — ajouter à `src/db/schemas.ts` (après
`languageSchema`, le fichier importe déjà `z`) :

```ts
export const textOptionsSchema = z.object({
  punctuation: z.boolean(),
  specialChars: z.boolean(),
  digits: z.boolean(),
  accents: z.boolean(),
});

// miroir exact de RunRecord : toute ligne qui ne satisfait pas ce schéma est
// considérée comme corrompue et écartée à la lecture (voir runsRepo.parseRuns)
export const runRecordSchema = z.object({
  id: z.number().int().min(1).optional(),
  date: z.number().int().positive(),
  mode: z.enum(['free', 'challenger']),
  language: languageSchema,
  textId: z.string().min(1),
  options: textOptionsSchema,
  durationMs: z.number().int().min(0),
  wpm: z.number().finite().min(0),
  accuracy: z.number().finite().min(0).max(1), // fraction, pas un pourcentage
  points: z.number().finite().min(0),
  errors: z.number().int().min(0),
  backspaces: z.number().int().min(0),
  chars: z.number().int().min(0),
  noBackspace: z.boolean(),
});
```

- [x] **Step 4: Vérifier que le test passe**

Run: `npx vitest run src/db/schemas.test.ts`
Expected: 9 tests PASS.

- [x] **Step 5: Commit**

```bash
git add src/db/schemas.ts src/db/schemas.test.ts
git commit -m "feat: zod schema for run records"
```

---

### Task 2: Validation à la lecture dans `src/db/runsRepo.ts`

**Files:**
- Modify: `src/db/runsRepo.ts`
- Test: `src/db/runsRepo.test.ts`

**Interfaces:**
- Consumes: `runRecordSchema` (Task 1).
- Produces: `allRuns()`, `topRuns()`, `personalBests()` ne retournent plus que des
  `RunRecord` validés (signatures inchangées). `parseRuns` reste interne (non exporté).

- [x] **Step 1: Écrire les tests qui échouent** — dans `src/db/runsRepo.test.ts`,
remplacer la ligne d'import vitest par :

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
```

et ajouter ces tests dans le `describe('runsRepo')` :

```ts
  it('écarte les lignes corrompues à la lecture, avec avertissement', async () => {
    await saveRun(makeRun({}));
    // IndexedDB est modifiable hors de l'app : insertion brute d'une ligne invalide
    await db.runs.add({ ...makeRun({ date: 3000 }), wpm: 'rapide' } as unknown as RunRecord);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await allRuns()).map((r) => r.date)).toEqual([1000]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('topRuns et personalBests ignorent les lignes corrompues', async () => {
    await saveRun(makeRun({ wpm: 50 }));
    // sans validation, cette ligne gagnerait le record de wpm
    await db.runs.add({ ...makeRun({}), wpm: 999, accuracy: 'bof' } as unknown as RunRecord);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await topRuns({ mode: 'free', language: 'fr' })).map((r) => r.wpm)).toEqual([50]);
    expect((await personalBests()).bestWpm?.wpm).toBe(50);
    vi.restoreAllMocks();
  });
```

- [x] **Step 2: Vérifier que les tests échouent**

Run: `npx vitest run src/db/runsRepo.test.ts`
Expected: FAIL — les 2 nouveaux tests voient la ligne corrompue (`[1000, 3000]`, wpm 999).

- [x] **Step 3: Implémenter `parseRuns` et l'appliquer** — dans `src/db/runsRepo.ts` :

Ajouter l'import :

```ts
import { runRecordSchema } from './schemas';
```

Ajouter le helper (après `saveRun`) :

```ts
/** Écarte les lignes corrompues (IndexedDB modifiable hors de l'app) plutôt que de planter. */
function parseRuns(rows: unknown[]): RunRecord[] {
  const valid: RunRecord[] = [];
  let dropped = 0;
  for (const row of rows) {
    const parsed = runRecordSchema.safeParse(row);
    if (parsed.success) valid.push(parsed.data);
    else dropped += 1;
  }
  if (dropped > 0) console.warn(`[dacty] ${dropped} run(s) corrompue(s) ignorée(s)`);
  return valid;
}
```

Modifier les trois lectures :

```ts
export async function topRuns(
  filter: { mode: GameMode; language: Language; textId?: string },
  limit = 10,
): Promise<RunRecord[]> {
  const runs = parseRuns(
    await db.runs
      .where(filter.textId ? '[mode+language+textId]' : 'mode')
      .equals(filter.textId ? [filter.mode, filter.language, filter.textId] : filter.mode)
      .toArray(),
  );
  return runs
    .filter((r) => r.language === filter.language && (!filter.textId || r.textId === filter.textId))
    .sort((a, b) => keyOf(filter.mode, b) - keyOf(filter.mode, a) || a.date - b.date)
    .slice(0, limit);
}
```

```ts
export async function allRuns(): Promise<RunRecord[]> {
  return parseRuns(await db.runs.toArray());
}
```

```ts
export async function personalBests(): Promise<{
  bestWpm: RunRecord | null;
  bestAccuracy: RunRecord | null;
  longestRun: RunRecord | null;
}> {
  const runs = parseRuns(await db.runs.toArray());
  const max = (list: RunRecord[], key: (r: RunRecord) => number): RunRecord | null =>
    list.length === 0 ? null : list.reduce((a, b) => (key(b) > key(a) ? b : a));
  return {
    bestWpm: max(runs, (r) => r.wpm),
    bestAccuracy: max(runs.filter((r) => r.durationMs >= 10_000), (r) => r.accuracy),
    longestRun: max(runs, (r) => r.chars),
  };
}
```

(`rankFor` reste tel quel : il ne retourne qu'un compteur, voir spec.)

- [x] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/db/runsRepo.test.ts`
Expected: 9 tests PASS (7 existants + 2 nouveaux).

- [x] **Step 5: Commit**

```bash
git add src/db/runsRepo.ts src/db/runsRepo.test.ts
git commit -m "feat: validate runs with zod at read time, drop corrupted rows"
```

---

### Task 3: Transaction Dexie autour de `completeRun`

**Files:**
- Modify: `src/game/runFlow.ts`
- Test: `src/game/runFlow.test.ts`

**Interfaces:**
- Produces: `completeRun(state, config, now): Promise<RunResult>` — signature inchangée,
  mais rejette sans rien persister si une étape échoue. `runStore` consomme déjà ce rejet
  (toast « Sauvegarde impossible »), rien à changer côté appelant.

- [x] **Step 1: Écrire le test qui échoue** — dans `src/game/runFlow.test.ts`, remplacer
la ligne d'import vitest par :

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
```

et ajouter ce test dans le `describe('completeRun')` :

```ts
  it('est atomique : si la persistance échoue, rien n\'est enregistré', async () => {
    const c: RunConfig = { ...config, mode: 'challenger', textId: 'fr-101' };
    // unlockNew appelle bulkAdd même sans succès frais : l'échec est garanti
    vi.spyOn(db.achievements, 'bulkAdd').mockRejectedValueOnce(new Error('boom'));
    await expect(completeRun(finishClean('abcdefghij'), c, 9999)).rejects.toThrow('boom');
    expect(await allRuns()).toHaveLength(0); // la run est annulée…
    expect(await db.challenger.get('fr')).toBeUndefined(); // …la progression aussi
  });
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/game/runFlow.test.ts`
Expected: FAIL — sans transaction, la run ET la progression challenger sont persistées
avant que `unlockNew` n'échoue (`allRuns()` retourne 1 ligne, `db.challenger.get('fr')`
existe). C'est le comportement non atomique actuel.

- [x] **Step 3: Envelopper dans une transaction** — dans `src/game/runFlow.ts` :

Ajouter l'import :

```ts
import { db } from '@/db/db';
```

Réécrire `completeRun` (le corps existant va dans la callback, inchangé) :

```ts
export async function completeRun(state: TypingState, config: RunConfig, now: number): Promise<RunResult> {
  const run = buildRunRecord(state, config, now);
  const { durationMs, wpm, accuracy, points } = run;

  // une seule transaction rw sur les 3 tables : run, progression challenger et succès
  // sont persistés ensemble ou pas du tout — jamais d'état partiel si une étape échoue
  return db.transaction('rw', [db.runs, db.challenger, db.achievements], async () => {
    const bests = await personalBests();
    const newRecords: RecordKind[] = [];
    if (bests.bestWpm === null) {
      newRecords.push('wpm', 'accuracy', 'longest');
    } else {
      if (wpm > bests.bestWpm.wpm) newRecords.push('wpm');
      if (durationMs >= 10_000 && accuracy > (bests.bestAccuracy?.accuracy ?? 0)) {
        newRecords.push('accuracy');
      }
      if (state.text.length > (bests.longestRun?.chars ?? 0)) newRecords.push('longest');
    }

    const id = await saveRun(run);
    run.id = id;

    let tierUp: Tier | null = null;
    let progress: ChallengerProgress | null = null;
    if (config.mode === 'challenger') {
      const officialIds = getOfficialTexts(config.language).map((t) => t.id);
      const r = await recordChallengerResult(config.language, config.textId, points, now, officialIds);
      tierUp = r.tierUp;
      progress = r.progress;
    }

    const ctx = await buildContext(run);
    const newAchievements = await unlockNew(ctx);

    const timeline = wpmTimeline(state.events, state.startedAt ?? now, state.finishedAt ?? now);

    return { run, timeline, newAchievements, tierUp, progress, newRecords };
  });
}
```

Toutes les opérations de la callback sont Dexie ou synchrones (`getOfficialTexts`,
`wpmTimeline`) : pas de `await` externe, la transaction reste vivante (pas de
« PrematureCommit »).

- [x] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/game/runFlow.test.ts src/state/runStore.test.ts src/state/runStore.fallback.test.ts`
Expected: tous PASS (5 existants runFlow + 1 nouveau, stores intacts).

- [x] **Step 5: Commit**

```bash
git add src/game/runFlow.ts src/game/runFlow.test.ts
git commit -m "feat: make completeRun atomic with a single Dexie transaction"
```

---

### Task 4: ErrorBoundary au niveau route

**Files:**
- Create: `src/ui/components/ErrorBoundary.tsx`
- Modify: `src/ui/components/Layout.tsx`
- Test: `src/ui/components/ErrorBoundary.test.tsx` (nouveau)

**Interfaces:**
- Produces: `ErrorBoundary` — props `{ children: ReactNode; resetKey: string }`.
  Consommé par `Layout` avec `resetKey = useLocation().pathname`.

- [x] **Step 1: Écrire le test qui échoue** — `src/ui/components/ErrorBoundary.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>contenu sain</p>;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    shouldThrow = true;
    vi.restoreAllMocks();
  });

  it('confine l\'erreur : fallback actionnable, reste de la page intact', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logue l'erreur
    render(
      <MemoryRouter>
        <header>en-tête</header>
        <ErrorBoundary resetKey="/boom">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue');
    expect(screen.getByText('en-tête')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à l\'accueil' })).toHaveAttribute('href', '/');
  });

  it('« Réessayer » réinitialise le boundary', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ErrorBoundary resetKey="/boom">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(screen.getByText('contenu sain')).toBeInTheDocument();
  });

  it('se réinitialise quand resetKey change (navigation)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <MemoryRouter>
        <ErrorBoundary resetKey="/a">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    shouldThrow = false;
    rerender(
      <MemoryRouter>
        <ErrorBoundary resetKey="/b">
          <Bomb />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('contenu sain')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/ui/components/ErrorBoundary.test.tsx`
Expected: FAIL — `./ErrorBoundary` n'existe pas.

- [x] **Step 3: Implémenter le composant** — `src/ui/components/ErrorBoundary.tsx`

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';

interface Props {
  children: ReactNode;
  /** changer cette valeur réinitialise le boundary (ex : pathname de la route) */
  resetKey: string;
}

interface State {
  hasError: boolean;
}

/** Confine une erreur de rendu à la page : header et navigation restent utilisables. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[dacty] erreur de rendu', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="py-16 text-center">
        <p className="text-lg font-bold text-err">Une erreur est survenue sur cette page.</p>
        <p className="mt-2 text-sm text-muted">Tes données locales ne sont pas perdues.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Réessayer
          </button>
          <Link
            to="/"
            className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
}
```

- [x] **Step 4: Brancher dans `Layout.tsx`** — le fichier complet devient :

```tsx
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from './ErrorBoundary';
import { Header } from './Header';
import { ToastHost } from './ToastHost';
import { checkPersistence, requestPersistence } from '@/db/persistence';

export function Layout() {
  const [persistent, setPersistent] = useState(true);
  const location = useLocation();
  useEffect(() => {
    let active = true;
    void requestPersistence();
    void checkPersistence().then((ok) => {
      if (active) setPersistent(ok);
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="min-h-screen">
      <Header />
      {!persistent && (
        <div role="alert" className="bg-err/15 px-4 py-2 text-center text-sm text-err">
          Stockage indisponible : ta progression ne sera pas sauvegardée (navigation privée ?).
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<p className="py-16 text-center text-muted">Chargement…</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <ToastHost />
    </div>
  );
}
```


- [x] **Step 5: Vérifier que les tests passent**

Run: `npx vitest run src/ui/components/ErrorBoundary.test.tsx src/ui/components/Layout.test.tsx src/App.test.tsx`
Expected: tous PASS (3 nouveaux + existants intacts).

- [x] **Step 6: Commit**

```bash
git add src/ui/components/ErrorBoundary.tsx src/ui/components/ErrorBoundary.test.tsx src/ui/components/Layout.tsx
git commit -m "feat: route-level ErrorBoundary with retry and home link"
```

---

### Task 5: Vérification finale

- [x] **Step 1: Suite complète**

Run: `npm run test`
Expected: 140 tests PASS (125 existants + 15 nouveaux).

- [x] **Step 2: Build**

Run: `npm run build`
Expected: `tsc --noEmit` et `vite build` verts (validateur corpus inclus en prebuild).

- [x] **Step 3: Cocher les cases du plan et commit final si nécessaire**

```bash
git add docs/superpowers/plans/2026-08-06-data-integrity.md
git commit -m "docs: check off data integrity plan" # seulement si le fichier a changé
```
