import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from '@/ui/components/Layout';
import { HomePage } from '@/ui/pages/HomePage';
import { PlayPage } from '@/ui/pages/PlayPage';
import { DevPage } from '@/ui/pages/DevPage';
import { ChallengerPage } from '@/ui/pages/ChallengerPage';
import { LeaderboardPage } from '@/ui/pages/LeaderboardPage';
import { AchievementsPage } from '@/ui/pages/AchievementsPage';
import { StatsPage } from '@/ui/pages/StatsPage';
import { SettingsPage } from '@/ui/pages/SettingsPage';
import { useSettings } from '@/state/settingsStore';

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
