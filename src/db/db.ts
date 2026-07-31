import Dexie, { type EntityTable } from 'dexie';
import type { AchievementUnlock, ChallengerProgress, Profile, RunRecord } from './types';

export class DactyDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>;
  runs!: EntityTable<RunRecord, 'id'>;
  achievements!: EntityTable<AchievementUnlock, 'id'>;
  challenger!: EntityTable<ChallengerProgress, 'language'>;

  constructor() {
    super('dacty');
    this.version(1).stores({
      profile: 'id',
      runs: '++id, date, mode, language, textId, [mode+language+textId], wpm',
      achievements: 'id, unlockedAt',
      challenger: 'language',
    });
  }
}

export const db = new DactyDB();
