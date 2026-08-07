# Boutons Arrêter / Recommencer — design

Date : 2026-08-07. Statut : approuvé (mode auto).

## Contexte

Pendant une run d'entraînement (`PlayPage`, `DevPage`), aucun moyen d'abandonner ou de
repartir à zéro : il faut finir le texte, quitter la page (désormais = pause), ou perdre
le focus (invalidation). Les entraîneurs dactylo classiques offrent les deux actions.

## Objectif

Deux boutons visibles pendant la run (`running` et `paused`) sur les pages
d'entraînement :

- **Recommencer** — relance **le même texte** à zéro (curseur, frappes, chrono frais).
- **Arrêter** — abandonne la run : retour à l'écran de configuration, **rien n'est
  enregistré** (pas de run partielle dans les stats).

Critères : comportement identique sur les deux pages, aucune persistance en cas
d'abandon, pas de confirmation modale (run d'entraînement, rien à perdre).

## Approches considérées

- **A (retenue)** : composant partagé `RunControls` qui lit `useRunStore` directement
  (`start`, `reset`, `config`, `typing?.text`) — une seule implémentation pour les deux
  pages.
- B : boutons inline dupliqués dans chaque page — la logique « même texte » serait
  dupliquée ; rejeté.
- C : action `restart()` ajoutée au store — le store a déjà `start`/`reset` ; inutile
  pour deux lignes d'assemblage ; rejeté.

Sémantique « Arrêter » : abandonner plutôt qu'enregistrer une run partielle — une run
tronquée produirait des stats trompeuses (WPM sur texte incomplet).

## Design

### Composant `src/ui/components/RunControls.tsx`

Lit le store ; retourne `null` sans `config` ni texte (sécurité) :

```tsx
const config = useRunStore((s) => s.config);
const text = useRunStore((s) => s.typing?.text);
const start = useRunStore((s) => s.start);
const reset = useRunStore((s) => s.reset);
// Recommencer : start(config, text) — génération incrémentée, résultat effacé
// Arrêter : reset() — statut idle, retour à l'écran de configuration
```

- « Recommencer » : `start(config, text)` — `runGeneration` invalidé (garde existante),
  résultat courant effacé, même `RunConfig` (mode, langue, options).
- « Arrêter » : `reset()`.
- Styles : boutons secondaires à bordure, pattern existant
  (`rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors
  hover:border-accent`), centrés sous la zone de frappe.

### Branchement

Inséré après `<TypingArea />` dans la vue run de `PlayPage.tsx` et `DevPage.tsx`
(branche `running | paused`, jamais en `invalidated` — cet écran a déjà « Nouvelle run »).

### Hors scope

`ChallengerPage` (mode classé — pourra recevoir les mêmes boutons ensuite si souhaité),
raccourcis clavier, « Recommencer » avec un nouveau texte aléatoire (le bouton « Rejouer »
de `ResultsScreen` couvre déjà le nouveau tirage), confirmation d'abandon.

### Tests

`src/ui/components/RunControls.test.tsx` (nouveau) :

1. « Recommencer » : après quelques frappes → statut `running`, curseur 0, frappes 0,
   texte inchangé.
2. « Recommencer » depuis une run en pause → statut `running`, état frais.
3. « Arrêter » → statut `idle`, `typing` null (retour à l'écran de configuration).

## Vérification

1. `npm run test` : 151 → 154 tests verts.
2. `npm run build` : tsc + vite verts.
