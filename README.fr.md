<div align="center">

🇬🇧 <a href="README.md">English version available here</a>

# ⌨️ Dacty

**Le speedrun dactylo.** Tape des textes le plus vite possible, grimpe la ligue Challenger, débloque les succès.

100 % local — tes données restent dans ton navigateur (IndexedDB). Interface bilingue (français/anglais), détectée au premier lancement et modifiable dans les réglages.

[![CI](https://github.com/Lubachma/Dacty/actions/workflows/ci.yml/badge.svg)](https://github.com/Lubachma/Dacty/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)

![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?logo=tailwindcss&logoColor=white)

![Démo de Dacty — configuration, frappe en direct et écran de résultats](docs/assets/demo.gif)

</div>

## ✨ Modes de jeu

| Mode | Description |
|------|-------------|
| 🎯 **Entraînement libre** — `/play` | Texte au choix (français/anglais, court/moyen/long/citation) avec toggles de difficulté : ponctuation, caractères spéciaux, chiffres, accents |
| 💻 **Mode Dev** — `/dev` | Tape du code C ou Python (extraits, fonctions, programmes complets). Code brut, multiplicateur ×1,4, Entrée valide les sauts de ligne, indentation automatique |
| 🏆 **Challenger** — `/challenger` | La ranked : 10 textes officiels par langue (français, anglais) **et** par langage (C, Python), conditions officielles |
| 🏅 **Succès** — `/achievements` | 28 succès en 6 catégories |
| 📊 **Classements** — `/leaderboard` | Top 10 local par mode/langue/texte + records personnels |
| 📈 **Stats** — `/stats` | WPM et précision moyens sur 30 jours, séries de jeu |

### Ligues Challenger

Points = `WPM × précision² × 1,4` — le total de tes meilleurs scores détermine ton tier :

🥉 Bronze (100) → 🥈 Argent (400) → 🥇 Or (750) → 💠 Platine (950) → 💎 Diamant (1100) → 👑 Challenger (1300)

## 🚀 Démarrage rapide

```bash
npm install
npm run dev        # http://localhost:5173
```

Node.js ≥ 20 requis.

## 🎮 Règles de frappe

- ⏱️ Le chrono démarre à la première touche — WPM = (caractères / 5) / minutes
- ⌫ Backspace autorisé, mais chaque erreur compte dans la précision finale, même corrigée
- ✅ Il faut un texte 100 % exact pour finir
- 📋 Collage bloqué
- 👁️ Perte de focus > 5 s (configurable) = run invalidée

## 🛠️ Stack

Vite + React 19 + TypeScript strict · Tailwind CSS v4 · Framer Motion · Zustand · Dexie (IndexedDB) · Vitest + Testing Library

Le moteur de frappe (`src/engine/`) est du pur TypeScript, sans dépendance React.

## 📜 Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de dev |
| `npm test` | Tests unitaires (Vitest) |
| `npm run build` | Validation du corpus + build de production (`dist/`) |
| `npm run validate:corpus` | Valide les textes (longueurs, ids, ponctuation) |

## 📁 Structure

```
src/
├── engine/        # machine à états de frappe + stats (pur, testé)
├── texts/         # corpus fr/en + code C/Python (JSON) + normalisation
├── scoring/       # points Challenger + tiers de ligue
├── db/            # Dexie : runs, profil, succès, progression Challenger
├── achievements/  # 28 succès déclaratifs + moteur de déblocage
├── game/          # orchestration de fin de run
├── state/         # stores Zustand (run, settings, toasts)
└── ui/            # composants et pages
```

Les specs et plans de conception sont dans [`docs/superpowers/`](docs/superpowers/).

## 📄 Licence

MIT — voir [LICENSE](LICENSE).
