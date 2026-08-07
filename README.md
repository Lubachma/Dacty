<div align="center">

🇫🇷 <a href="README.fr.md">Version française disponible ici</a>

# ⌨️ Dacty

**The typing speedrun trainer.** Type texts as fast as you can, climb the Challenger league, unlock achievements.

100 % local — your data stays in your browser (IndexedDB). Bilingual interface (English/French), detected from your browser on first launch and switchable in the settings.

[![CI](https://github.com/Lubachma/Dacty/actions/workflows/ci.yml/badge.svg)](https://github.com/Lubachma/Dacty/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?logo=tailwindcss&logoColor=white)

![Dacty demo — setup, live typing and results screen](docs/assets/demo.gif)

</div>

## ✨ Game modes

| Mode | Description |
|------|-------------|
| 🎯 **Free practice** — `/play` | Pick a text (French/English, short/medium/long/quote) with difficulty toggles: punctuation, special characters, digits, accents |
| 💻 **Dev mode** — `/dev` | Type C or Python code (snippets, functions, full programs). Raw code, ×1.4 multiplier, Enter validates line breaks, automatic indentation |
| 🏆 **Challenger** — `/challenger` | The ranked mode: 10 official texts per language (French, English) **and** per programming language (C, Python), official conditions |
| 🏅 **Achievements** — `/achievements` | 28 achievements in 6 categories |
| 📊 **Leaderboards** — `/leaderboard` | Local top 10 per mode/language/text + personal records |
| 📈 **Stats** — `/stats` | Average WPM and accuracy over 30 days, play streaks |

### Challenger leagues

Points = `WPM × accuracy² × 1.4` — the total of your best scores sets your tier:

🥉 Bronze (100) → 🥈 Silver (400) → 🥇 Gold (750) → 💠 Platinum (950) → 💎 Diamond (1100) → 👑 Challenger (1300)

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires Node.js ≥ 20.

## 🎮 Typing rules

- ⏱️ The timer starts on the first keystroke — WPM = (characters / 5) / minutes
- ⌫ Backspace allowed, but every error counts toward final accuracy, even if corrected
- ✅ The text must be 100 % exact to finish
- 📋 Pasting is blocked
- 👁️ Losing window focus for > 5 s (configurable) invalidates the run

## 🛠️ Stack

Vite + React 19 + strict TypeScript · Tailwind CSS v4 · Framer Motion · Zustand · Dexie (IndexedDB) · Vitest + Testing Library

The typing engine (`src/engine/`) is pure TypeScript, with no React dependency.

## 📜 Scripts

| Command | Role |
|---------|------|
| `npm run dev` | Dev server |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Corpus validation + production build (`dist/`) |
| `npm run validate:corpus` | Validates the texts (lengths, ids, punctuation) |

## 📁 Structure

```
src/
├── engine/        # typing state machine + stats (pure, tested)
├── texts/         # fr/en corpus + C/Python code (JSON) + toggle normalization
├── scoring/       # Challenger points + league tiers
├── db/            # Dexie: runs, profile, achievements, Challenger progression
├── achievements/  # 28 declarative achievements + unlock engine
├── game/          # end-of-run orchestration
├── state/         # Zustand stores (run, settings, toasts)
└── ui/            # components and pages
```

Design docs and specs (in French) live in [`docs/superpowers/`](docs/superpowers/).

## 📄 License

MIT — see [LICENSE](LICENSE).
