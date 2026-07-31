# Dacty — Design

**Date :** 2026-07-31
**Statut :** approuvé par l'utilisateur (brainstorming complet)

## 1. Vision

Dacty est un jeu de **speedrun dactylo** : taper un texte fixe le plus vite possible, avec classements, succès (achievements) et un mode compétitif "Challenger" (la ranked du projet) par langue. **Local d'abord**, conçu pour pouvoir passer en ligne plus tard.

## 2. Plateforme & stack

App **web locale** (SPA), aucun backend à la v1.

- Vite + React 19 + TypeScript strict
- Tailwind CSS v4 + Framer Motion (animations, micro-interactions)
- Zustand — state global (run en cours, profil, settings)
- Dexie (IndexedDB) — persistance (runs, records, succès, progression Challenger)
- React Router — navigation
- Vitest + Testing Library — tests
- zod — validation des données relues depuis la DB

Lancement : `npm run dev`. Interface en **français**, thème sombre par défaut (clair en option), style moderne : glassmorphism léger, caret animé, graphiques épurés.

## 3. Architecture

Modules à responsabilité unique :

- `engine/` — moteur de frappe pur (état de la run, WPM, précision, gestion erreurs/backspace). **Aucune dépendance React**, testable unitairement, réutilisable pour un futur mode en ligne.
- `texts/` — corpus JSON par langue + normalisation selon les toggles (ponctuation, spéciaux, chiffres, accents).
- `scoring/` — calcul des points Challenger, tiers de ligue, multiplicateurs de difficulté.
- `db/` — couche Dexie + migrations.
- `achievements/` — règles de succès déclaratives (condition → vérifiée après chaque run).
- `ui/` — pages et composants React. React ne fait que **rendre** l'état de l'engine.

Routes :

| Route | Page |
|---|---|
| `/` | Accueil — accès rapide aux modes, dernières perfs |
| `/play` | Entraînement libre (options : langue, longueur, toggles) |
| `/dev` | Mode Dev — taper du code (C, Python) : extraits, fonctions, programmes |
| `/challenger` | Mode Challenger (ranked par langue et par langage dev) |
| `/leaderboard` | Classements locaux |
| `/achievements` | Succès avec progression |
| `/stats` | Profil & statistiques (graphes WPM/précision dans le temps) |
| `/settings` | Pseudo, thème, sons, langue par défaut |

## 4. Gameplay

### 4.1 Moteur de frappe (run speedrun)

- Texte affiché en entier ; coloration par caractère : gris (à taper) → vert (correct) → rouge (erreur) ; caret animé fluide.
- Chrono démarré à la première touche, arrêté au dernier caractère.
- **Backspace autorisé mais pénalisé** : une erreur corrigée compte quand même dans la précision finale.
- WPM et précision live pendant la run ; pause auto si perte de focus.
- Anti-triche : collage bloqué ; run invalidée si perte de focus > 5 s (configurable).
- Écran de résultats animé : temps, WPM, précision, points, graphe WPM/seconde, records et succès débloqués.

### 4.2 Options avant run (mode libre)

- Langue : **FR / EN** (extensible).
- Longueur : court (~150 car.) / moyen (~400 car.) / long (~800 car.) / citation aléatoire.
- Toggles de difficulté : **ponctuation, caractères spéciaux (`&@#%€...`), chiffres, accents**. Désactivé = texte normalisé (`é→e`, suppression de la ponctuation, etc.). Les toggles ne s'appliquent qu'aux textes de prose (fr/en) — en mode Dev le code est toujours tapé brut.

### 4.3 Scoring

- WPM = (caractères corrects / 5) / minutes.
- Précision = caractères corrects / caractères tapés au total.
- **Points Challenger** = `WPM × précision² × multiplicateur_difficulté` (chaque toggle actif : +10 %), arrondi à l'entier. La précision au carré récompense la propreté plutôt que le spam.

### 4.4 Mode Challenger (ranked par langue)

- Chaque langue de prose (fr, en) **et chaque langage dev (c, python)** a un **set officiel de 10 textes fixes**, à difficulté progressive.
- Runs Challenger **obligatoirement avec tous les toggles actifs** (conditions officielles).
- Seul le **meilleur score par texte** compte ; le total des 10 textes = points de ligue.
- **Tiers** (points de ligue = total des meilleurs scores sur les 10 textes officiels) : Bronze ≥ 100, Argent ≥ 400, Or ≥ 750, Platine ≥ 950, Diamant ≥ 1 100, Challenger ≥ 1 300.
- Calibration (tous toggles actifs → multiplicateur ×1,4) : 60 WPM / 97 % ≈ 79 pts/texte → ~790 total (Or) ; 100 WPM / 99 % ≈ 137 pts/texte → ~1 370 (Challenger).
- Classement local par langue + historique des changements de tier.

### 4.5 Achievements (28 à la v1)

- **Vitesse** : 40 / 60 / 80 / 100 / 120 / 140 WPM sur une run.
- **Précision** : run à 100 % ; 10 runs à ≥ 98 % ; 50 runs à ≥ 98 %.
- **Volume** : 10 / 50 / 100 / 500 runs ; 100 000 puis 1 000 000 caractères tapés.
- **Challenger** : atteindre Bronze (entrer dans la ligue) ; Or / Diamant / Challenger dans une langue ou un langage ; fr ET en en Or+.
- **Dev** : première run dev (« Hello, World! ») ; 10 runs dev ; run dev ≥ 100 car. à 100 %.
- **Fun** : run sans backspace ; run à 3 h du matin ; 7 jours d'affilée ; run ≥ 800 car. ; une run fr et une run en le même jour.
- Déblocage = toast animé + page achievements avec progression (ex. « 37/50 runs »).

### 4.6 Classements

- Par **langue × texte × mode** (libre/challenger) : top 10 local + rang du joueur.
- Records personnels : meilleur WPM, meilleure précision, plus longue run.

### 4.7 Mode Dev

- Page `/dev` : taper du **code** le plus vite possible — extraits, fonctions, programmes complets. Aucune compétence en code requise (c'est de la frappe), mais l'exposition au code peut en apprendre les bases.
- Langages à la v1 : **C** et **Python** (extensibles).
- Longueurs : **Extrait** (3-6 lignes), **Fonction** (~10-20 lignes), **Programme** (complet, ~25-50 lignes).
- Texte multi-lignes : `Entrée` tape le caractère `\n` ; **auto-indentation** : après un saut de ligne correct, les espaces d'indentation attendus sont insérés automatiquement (comme un éditeur).
- Pas de toggles : le code est toujours tapé brut ; multiplicateur de points fixe ×1,4 (équivalent conditions officielles).
- **Challenger** : chaque langage a sa propre ligue (10 programmes officiels, mêmes formules et seuils de tiers que les langues).
- Corpus par langage : **15 extraits libres** (5 par longueur) + **10 officiels**. Indentation en espaces uniquement, jamais de tabulation ni d'espace en fin de ligne.

## 5. Données

IndexedDB (Dexie) :

- `profile` : pseudo, settings (thème, sons, langue par défaut), dates de création/activité.
- `runs` : date, mode, langue, id du texte, toggles actifs, temps, WPM, précision, points, erreurs, flags (sans-backspace…).
- `achievements` : id, date de déblocage (les règles vivent dans le code).
- `challenger` : par langue — meilleurs points par texte officiel, total, tier actuel, historique des tiers.

Les **textes** sont des JSON versionnés dans le bundle (`texts/{fr,en,c,python}.json`), chaque texte a un **id stable** (`fr-001`, `c-101`…) reliant runs et records. Corpus v1 : par langue de prose (fr/en), **30 textes libres** (10 courts / 12 moyens / 8 longs, une seule ligne) + **10 textes officiels Challenger** ; par langage dev (c/python), **15 extraits libres** (5 par longueur, multi-lignes) + **10 officiels**.

**Flow d'une run :** sélection texte → engine (état en mémoire via Zustand) → fin de run → scoring → écriture DB (run + records + succès + points Challenger le cas échéant) → écran résultats. Rien n'est persisté pendant la frappe.

## 6. Gestion d'erreurs

- IndexedDB indisponible (navigation privée) → fallback mémoire + bandeau « progression non sauvegardée ».
- Données DB validées via zod : donnée corrompue ignorée, jamais de crash.
- Perte de focus > 5 s → run invalidée proprement, retour à l'écran de setup avec message.
- Corpus JSON validé au **build** (script : longueurs, ids uniques, caractères autorisés) — jamais d'erreur corpus au runtime.

## 7. Tests

- Vitest : `engine/` (WPM, précision, backspace/erreurs), `scoring/` (points, tiers, multiplicateurs), `achievements/` (chaque règle), `texts/` (normalisation).
- Testing Library : composant de frappe (saisie simulée → états affichés).
- Script de validation du corpus au build et en CI.
- Pas d'e2e à la v1 (YAGNI).

## 8. Hors scope (v1)

- Mode en ligne / multijoueur / comptes (prévu plus tard — l'architecture web le permet).
- Contre-la-montre (30 s/60 s) : la v1 est speedrun sur texte fixe uniquement.
- Langues autres que FR/EN ; langages de programmation autres que C et Python.
- App desktop / mobile native.
