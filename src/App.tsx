import { lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from '@/ui/components/Layout';
import { HomePage } from '@/ui/pages/HomePage';
import { useSettings } from '@/state/settingsStore';

// pages secondaires en imports dynamiques : hors du chunk initial
const PlayPage = lazy(() => import('@/ui/pages/PlayPage').then((m) => ({ default: m.PlayPage })));
const DevPage = lazy(() => import('@/ui/pages/DevPage').then((m) => ({ default: m.DevPage })));
const ChallengerPage = lazy(() =>
  import('@/ui/pages/ChallengerPage').then((m) => ({ default: m.ChallengerPage })),
);
const LeaderboardPage = lazy(() =>
  import('@/ui/pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
);
const AchievementsPage = lazy(() =>
  import('@/ui/pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage })),
);
const StatsPage = lazy(() => import('@/ui/pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazy(() =>
  import('@/ui/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

export default function App() {
  const load = useSettings((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/dev" element={<DevPage />} />
          <Route path="/challenger" element={<ChallengerPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
