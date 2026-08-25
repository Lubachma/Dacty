import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from './ErrorBoundary';
import { Header } from './Header';
import { ToastHost } from './ToastHost';
import { checkPersistence, requestPersistence } from '@/db/persistence';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/fr';

// tab titles aligned with each page's <h1>
const TITLE_KEYS: Record<string, TranslationKey> = {
  '/': 'title.home',
  '/play': 'title.play',
  '/dev': 'title.dev',
  '/challenger': 'title.challenger',
  '/leaderboard': 'title.leaderboard',
  '/achievements': 'title.achievements',
  '/stats': 'title.stats',
  '/settings': 'title.settings',
};

export function Layout() {
  const t = useT();
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
  useEffect(() => {
    const key = TITLE_KEYS[location.pathname];
    document.title = key ? t(key) : 'Dacty';
  }, [location.pathname, t]);
  return (
    <div className="min-h-screen">
      <Header />
      {!persistent && (
        <div role="alert" className="bg-err/15 px-4 py-2 text-center text-sm text-err">
          {t('layout.persistenceWarning')}
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<p className="py-16 text-center text-muted">{t('common.loading')}</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <ToastHost />
    </div>
  );
}
