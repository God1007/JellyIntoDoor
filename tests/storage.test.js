import { describe, expect, it } from 'vitest';
import { SKINS } from '../src/game/level-data.js';
import {
  createDefaultProfile,
  getUnlockedSkinIds,
  mergeLevelResult
} from '../src/storage.js';

describe('storage profile', () => {
  it('starts with the first level unlocked, peach selected, and sound on', () => {
    expect(createDefaultProfile()).toMatchObject({
      unlockedLevelIndex: 0,
      selectedSkin: 'peach',
      soundEnabled: true,
      levels: {}
    });
  });

  it('keeps the better record when merging repeat level results', () => {
    const profile = createDefaultProfile();
    const afterFirst = mergeLevelResult(profile, 0, {
      completed: true,
      timeMs: 14000,
      launches: 4,
      starsCollected: 2,
      medal: 'silver'
    });
    const afterSecond = mergeLevelResult(afterFirst, 0, {
      completed: true,
      timeMs: 10000,
      launches: 5,
      starsCollected: 3,
      medal: 'gold'
    });

    expect(afterSecond.unlockedLevelIndex).toBe(1);
    expect(afterSecond.levels[0]).toMatchObject({
      bestTimeMs: 10000,
      bestLaunches: 4,
      starsCollected: 3,
      medal: 'gold'
    });
  });

  it('unlocks skins from total collected stars', () => {
    const profile = {
      ...createDefaultProfile(),
      levels: {
        0: { starsCollected: 3, medal: 'gold' },
        1: { starsCollected: 3, medal: 'gold' },
        2: { starsCollected: 2, medal: 'silver' }
      }
    };

    expect(getUnlockedSkinIds(profile, SKINS)).toEqual(['peach', 'mint']);
  });
});
