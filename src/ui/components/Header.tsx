import { NavLink } from 'react-router';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/fr';

const LINKS: { to: string; key: TranslationKey; end?: boolean }[] = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/play', key: 'nav.training' },
  { to: '/dev', key: 'nav.dev' },
  { to: '/challenger', key: 'nav.challenger' },
  { to: '/leaderboard', key: 'nav.leaderboard' },
  { to: '/achievements', key: 'nav.achievements' },
  { to: '/stats', key: 'nav.stats' },
  { to: '/settings', key: 'nav.settings' },
];

export function Header() {
  const t = useT();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
        <NavLink to="/" className="mr-4 text-lg font-extrabold tracking-tight text-accent">
          Dacty
        </NavLink>
        {LINKS.slice(1).map(({ to, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive ? 'bg-surface text-text' : 'text-muted hover:text-text'
              }`
            }
          >
            {t(key)}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
