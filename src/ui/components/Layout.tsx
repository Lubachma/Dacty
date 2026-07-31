import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastHost } from './ToastHost';
import { checkPersistence } from '@/db/persistence';

export function Layout() {
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    let active = true;
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
        <div className="bg-err/15 px-4 py-2 text-center text-sm text-err">
          Stockage indisponible : ta progression ne sera pas sauvegardée (navigation privée ?).
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <ToastHost />
    </div>
  );
}
