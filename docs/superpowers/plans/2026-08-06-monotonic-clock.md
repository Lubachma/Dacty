# Chrono monotone — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mesurer les durées de run sur une horloge monotone (`performance.now()`) tout en
gardant les dates murales sur `Date.now()`.

**Architecture:** un module `src/engine/clock.ts` (`nowMs()`) injecté aux seuls points de
mesure de durée (`runStore`, `RunHud`, `useFocusGuard`). Le moteur reste pur (il reçoit
`now` en paramètre). `Date.now()` reste la source des dates murales (`run.date`, streaks,
succès, profil).

**Tech Stack:** TypeScript strict, vitest + jsdom, zustand.

Spec : `docs/superpowers/specs/2026-08-06-monotonic-clock-design.md`

## Global Constraints

- Ne JAMAIS mélanger les deux horloges : les timestamps moteur (`startedAt`,
  `finishedAt`, `events[].at`, `pauseStartedAt`, `pausedMs`) viennent tous de `nowMs()`.
- `completeRun(next, config, Date.now())` : le 3ᵉ argument RESTE `Date.now()` (date murale
  du record).
- TypeScript strict avec `noUnusedLocals` / `noUnusedParameters`.
- Commentaires de code en français, commits en anglais (conventional commits).
- Comportement visible inchangé.

---

### Task 1: Module `src/engine/clock.ts`

**Files:**
- Create: `src/engine/clock.ts`
- Test: `src/engine/clock.test.ts` (nouveau)

**Interfaces:**
- Produces: `nowMs(): number` — horloge monotone. Consommé par Task 2.

- [x] **Step 1: Écrire le test qui échoue** — `src/engine/clock.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { nowMs } from './clock';

describe('nowMs', () => {
  it('retourne un timestamp fini, non décroissant, sur l\'origine performance', () => {
    const a = nowMs();
    const b = nowMs();
    expect(Number.isFinite(a)).toBe(true);
    expect(b).toBeGreaterThanOrEqual(a);
    // origine « démarrage de la page », très éloignée de l'epoch Date.now() :
    // échoue si quelqu'un réimplémente nowMs avec Date.now()
    expect(a).toBeLessThan(Date.now());
  });
});
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/engine/clock.test.ts`
Expected: FAIL — `./clock` n'existe pas.

- [x] **Step 3: Implémenter le module** — `src/engine/clock.ts`

```ts
/**
 * Horloge monotone (performance.now) pour la mesure des durées de run : frappes, pauses,
 * chrono du HUD, garde de focus. Insensible aux sauts de l'horloge système (NTP, réglage
 * manuel) et précise à la sub-milliseconde.
 * Ne JAMAIS mélanger avec Date.now() (origines différentes) : les dates murales
 * (run.date, streaks, succès, profil) restent sur Date.now().
 */
export const nowMs = (): number => performance.now();
```

- [x] **Step 4: Vérifier que le test passe**

Run: `npx vitest run src/engine/clock.test.ts`
Expected: 1 test PASS.

- [x] **Step 5: Commit**

```bash
git add src/engine/clock.ts src/engine/clock.test.ts
git commit -m "feat: monotonic clock module for run duration measurement"
```

---

### Task 2: Basculer runStore + RunHud + useFocusGuard (atomique)

Ces trois fichiers forment UNE seule tâche : `pauseStartedAt` est écrit par `runStore`
et relu par `useFocusGuard` — basculer l'un sans l'autre casse la comparaison (les deux
horloges ont des origines différentes). `RunHud` lit `startedAt` via `elapsedMs` :
même exigence de cohérence.

**Files:**
- Modify: `src/state/runStore.ts`
- Modify: `src/ui/components/RunHud.tsx`
- Modify: `src/ui/hooks/useFocusGuard.ts`
- Test: `src/ui/hooks/useFocusGuard.test.ts`

**Interfaces:**
- Consumes: `nowMs(): number` (Task 1).
- Produces: signatures publiques inchangées (`useRunStore`, `RunHud`, `useFocusGuard`).

- [x] **Step 1: Adapter le test du focus guard (rouge)** — dans
`src/ui/hooks/useFocusGuard.test.ts`, remplacer le 2ᵉ test par :

```ts
  it("invalide au retour de focus si l'absence a dépassé le délai (timer throttlé en arrière-plan)", () => {
    vi.useFakeTimers();
    useRunStore.getState().start(config, 'ab');
    useRunStore.getState().key('a');
    renderHook(() => useFocusGuard());

    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(useRunStore.getState().status).toBe('paused');

    // onglet caché : le setTimeout d'invalidation n'a pas tourné (throttlé),
    // mais l'horloge monotone a avancé au-delà du délai
    const shifted = performance.now() + 10_000;
    const clock = vi.spyOn(performance, 'now').mockReturnValue(shifted);
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(useRunStore.getState().status).toBe('invalidated');
    clock.mockRestore();
    vi.useRealTimers();
  });
```

- [x] **Step 2: Vérifier que le test échoue**

Run: `npx vitest run src/ui/hooks/useFocusGuard.test.ts`
Expected: FAIL sur ce test uniquement — le code utilise encore `Date.now()`, insensible
au spy sur `performance.now` : la garde reprend au lieu d'invalider. (Les tests 1 et 3
restent verts.)

- [x] **Step 3: Basculer les trois fichiers sur `nowMs()`**

`src/state/runStore.ts` — ajouter l'import et remplacer 5 appels (lignes 43, 49, 89, 96,
102 ; ceux des lignes 56 et 64 RESTENT `Date.now()` — date murale du record) :

```ts
import { nowMs } from '@/engine/clock';
```

```ts
    let next = typeChar(typing, char, nowMs());
```

```ts
        next = typeChar(next, ' ', nowMs(), true);
```

```ts
    const next = pressBackspace(typing, nowMs());
```

```ts
    set({ typing: pauseRun(typing, nowMs()), status: 'paused' });
```

```ts
    set({ typing: resumeRun(typing, nowMs()), status: 'running' });
```

`src/ui/components/RunHud.tsx` — ajouter l'import et remplacer la ligne 22 :

```ts
import { nowMs } from '@/engine/clock';
```

```ts
  const now = nowMs();
```

`src/ui/hooks/useFocusGuard.ts` — ajouter l'import, remplacer la comparaison et ajuster
le commentaire :

```ts
import { nowMs } from '@/engine/clock';
```

```ts
      // les timers sont throttlés quand l'onglet est caché : le setTimeout
      // d'invalidation peut ne pas avoir tourné. On tranche depuis l'horloge
      // monotone du début de pause (même origine que pauseStartedAt).
      const pausedAt = useRunStore.getState().typing?.pauseStartedAt;
      if (pausedAt != null && nowMs() - pausedAt > timeoutSec * 1000) invalidate();
```

- [x] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/ui/hooks/useFocusGuard.test.ts src/state/runStore.test.ts src/state/runStore.fallback.test.ts src/game/runFlow.test.ts`
Expected: tous PASS.

- [x] **Step 5: Commit**

```bash
git add src/state/runStore.ts src/ui/components/RunHud.tsx src/ui/hooks/useFocusGuard.ts src/ui/hooks/useFocusGuard.test.ts
git commit -m "feat: measure run durations on the monotonic clock"
```

---

### Task 3: Contrat `now` de `completeRun` + vérification finale

**Files:**
- Modify: `src/game/runFlow.ts` (commentaire uniquement)

- [x] **Step 1: Documenter le contrat** — au-dessus de `completeRun` dans
`src/game/runFlow.ts` :

```ts
/**
 * `now` est l'horloge MURALE (Date.now) : elle date le record (streaks, stats par jour).
 * La durée vient des timestamps moteur (horloge monotone, voir @/engine/clock) via
 * `finishedAt` — toujours renseigné sur une run terminée : le repli `?? now`
 * d'`elapsedMs` et ceux de `wpmTimeline` ne servent pas sur ce chemin.
 */
```

- [x] **Step 2: Suite complète**

Run: `npm run test`
Expected: 142 tests PASS (141 + 1 nouveau).

- [x] **Step 3: Build**

Run: `npm run build`
Expected: `tsc --noEmit` et `vite build` verts.

- [x] **Step 4: Vérifier qu'il ne reste que des `Date.now()` muraux**

Run: `grep -rn "Date\.now()" src --include="*.ts" --include="*.tsx" | grep -v test`
Expected: uniquement `profileRepo.ts` (×2), `runStore.ts` (×2 : lignes du `completeRun`
et du fallback), `achievements/check.ts` (×2), `ui/pages/statsUtils.ts`,
`ui/pages/AchievementsPage.tsx` (×2), `ui/pages/StatsPage.tsx`. Aucun dans `RunHud.tsx`
ni `useFocusGuard.ts`.

- [x] **Step 5: Commit**

```bash
git add src/game/runFlow.ts
git commit -m "docs: document wall-clock vs monotonic contract of completeRun"
```
