import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { ToastHost } from './ToastHost';
import { checkPersistence, requestPersistence } from '@/db/persistence';

export function Layout() {
  const [persistent, setPersistent] = useState(true);
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
  return (
    <div className="min-h-screen">
      <Header />
      {!persistent && (
        <div role="alert" className="bg-err/15 px-4 py-2 text-center text-sm text-err">
          Stockage indisponible : ta progression ne sera pas sauvegardée (navigation privée ?).
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense fallback={<p className="py-16 text-center text-muted">Chargement…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <ToastHost />
    </div>
  );
}
