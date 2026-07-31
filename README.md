# Dacty

Le speedrun dactylo : tape des textes le plus vite possible, grimpe la ligue Challenger, débloque les succès. 100 % local — tes données restent dans ton navigateur (IndexedDB).

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

- `npm run dev` — serveur de dev
- `npm test` — tests unitaires (Vitest)
- `npm run build` — validation du corpus + build de production (`dist/`)
- `npm run validate:corpus` — valide les textes (longueurs, ids, ponctuation)

## Modes de jeu

- **Entraînement libre** (`/play`) : texte au choix (français/anglais, court/moyen/long/citation) avec toggles de difficulté (ponctuation, caractères spéciaux, chiffres, accents).
- **Mode Dev** (`/dev`) : tape du code C ou Python (extraits, fonctions, programmes complets). Code toujours brut, multiplicateur ×1,4 ; Entrée valide les sauts de ligne et l'indentation est automatique.
- **Challenger** (`/challenger`) : la ranked. 10 textes officiels par langue (français, anglais) **et par langage (C, Python)**, conditions officielles. Points = `WPM × précision² × 1,4`. Total des meilleurs scores → tiers : Bronze (100) → Argent (400) → Or (750) → Platine (950) → Diamant (1100) → Challenger (1300).
- **Succès** (`/achievements`) : 28 succès en 6 catégories.
- **Classements** (`/leaderboard`) : top 10 local par mode/langue/texte + records personnels.
- **Stats** (`/stats`) : WPM et précision moyens sur 30 jours, séries de jeu.

## Règles de frappe

- Le chrono démarre à la première touche. WPM = (caractères / 5) / minutes.
- Backspace autorisé, mais chaque erreur compte dans la précision finale, même corrigée. Il faut un texte 100 % exact pour finir.
- Collage bloqué. Perte de focus > 5 s (configurable) = run invalidée.

## Stack

Vite + React 19 + TypeScript strict, Tailwind CSS v4, Framer Motion, Zustand, Dexie (IndexedDB), Vitest + Testing Library. Le moteur de frappe (`src/engine/`) est pur TypeScript, sans dépendance React.

## Structure

- `src/engine/` — machine à états de frappe + stats (pur, testé)
- `src/texts/` — corpus fr/en + code C/Python (JSON) + normalisation des toggles
- `src/scoring/` — points Challenger + tiers de ligue
- `src/db/` — Dexie : runs, profil, succès, progression Challenger
- `src/achievements/` — 28 succès déclaratifs + moteur de déblocage
- `src/game/` — orchestration de fin de run
- `src/state/` — stores Zustand (run, settings, toasts)
- `src/ui/` — composants et pages
