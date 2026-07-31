import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/play', label: 'Entraînement' },
  { to: '/dev', label: 'Dev' },
  { to: '/challenger', label: 'Challenger' },
  { to: '/leaderboard', label: 'Classements' },
  { to: '/achievements', label: 'Succès' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Réglages' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
        <NavLink to="/" className="mr-4 text-lg font-extrabold tracking-tight text-accent">
          Dacty
        </NavLink>
        {LINKS.slice(1).map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive ? 'bg-surface text-text' : 'text-muted hover:text-text'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
