import { useEffect, useState, type ReactNode } from 'react';
import { db } from '@/db/db';
import { useSettings } from '@/state/settingsStore';
import { Toggle } from '@/ui/components/Toggle';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 backdrop-blur">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const profile = useSettings((s) => s.profile);
  const update = useSettings((s) => s.update);
  const [pseudo, setPseudo] = useState(profile.pseudo);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setPseudo(profile.pseudo);
  }, [profile.pseudo]);

  const savePseudo = () => {
    const clean = pseudo.trim().slice(0, 30);
    if (clean.length > 0 && clean !== profile.pseudo) void update({ pseudo: clean });
    else setPseudo(profile.pseudo);
  };

  const resetAll = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    db.close();
    await db.delete();
    location.reload();
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="mb-2 text-2xl font-bold">Réglages</h1>

      <Row label="Pseudo">
        <input
          aria-label="Pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          onBlur={savePseudo}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          maxLength={30}
          className="w-40 rounded-lg border border-line bg-bg px-3 py-1.5 text-right"
        />
      </Row>

      <Row label="Thème clair">
        <Toggle
          checked={profile.theme === 'light'}
          onChange={(v) => void update({ theme: v ? 'light' : 'dark' })}
          label="Thème clair"
        />
      </Row>

      <Row label="Sons">
        <Toggle
          checked={profile.sounds}
          onChange={(v) => void update({ sounds: v })}
          label="Sons"
        />
      </Row>

      <Row label="Langue par défaut">
        <div className="flex gap-2">
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => void update({ defaultLanguage: l })}
              className={`rounded-lg border px-3 py-1 text-sm font-bold transition-colors ${
                profile.defaultLanguage === l ? 'border-accent bg-accent/15 text-text' : 'border-line text-muted'
              }`}
            >
              {l === 'fr' ? 'Français' : 'English'}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Invalidation après perte de focus (s)">
        <input
          aria-label="Délai d'invalidation"
          type="number"
          min={1}
          max={60}
          value={profile.focusTimeoutSec}
          onChange={(e) => {
            const v = Math.round(Number(e.target.value));
            if (v >= 1 && v <= 60) void update({ focusTimeoutSec: v });
          }}
          className="w-20 rounded-lg border border-line bg-bg px-3 py-1.5 text-right"
        />
      </Row>

      <div className="mt-6 rounded-xl border border-err/40 p-4">
        <p className="mb-3 text-sm font-bold text-err">Zone danger</p>
        <button
          type="button"
          onClick={() => void resetAll()}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            confirming ? 'bg-err text-white' : 'border border-err/50 text-err'
          }`}
        >
          {confirming ? 'Confirmer la suppression ?' : 'Réinitialiser toutes les données'}
        </button>
      </div>
    </div>
  );
}
