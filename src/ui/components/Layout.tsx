import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from './ErrorBoundary';
import { Header } from './Header';
import { ToastHost } from './ToastHost';
import { checkPersistence, requestPersistence } from '@/db/persistence';

// titres d'onglet alignés sur les <h1> des pages
const TITLES: Record<string, string> = {
  '/': 'Dacty',
  '/play': 'Entraînement libre · Dacty',
  '/dev': 'Mode Dev · Dacty',
  '/challenger': 'Mode Challenger · Dacty',
  '/leaderboard': 'Classements · Dacty',
  '/achievements': 'Succès · Dacty',
  '/stats': 'Statistiques · Dacty',
  '/settings': 'Réglages · Dacty',
};

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
  useEffect(() => {
    document.title = TITLES[location.pathname] ?? 'Dacty';
  }, [location.pathname]);
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
