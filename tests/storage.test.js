import { describe, expect, it } from 'vitest';
import { SKINS } from '../src/game/level-data.js';
import {
  createDefaultProfile,
  getUnlockedSkinIds,
  loadProfile,
  mergeLevelResult,
  STORAGE_KEY
} from '../src/storage.js';

describe('storage profile', () => {
  it('starts with the first level unlocked, peach selected, english text, and sound on', () => {
    expect(createDefaultProfile()).toMatchObject({
      unlockedLevelIndex: 0,
      selectedSkin: 'peach',
      language: 'en',
      soundEnabled: true,
      levels: {}
    });
  });

  it('keeps the better record when merging repeat level results', () => {
    const profile = createDefaultProfile();
    const afterFirst = mergeLevelResult(profile, 0, {
      completed: true,
      timeMs: 14000,
      jumps: 9,
      starsCollected: 2,
      medal: 'silver'
    });
    const afterSecond = mergeLevelResult(afterFirst, 0, {
      completed: true,
      timeMs: 10000,
      jumps: 11,
      starsCollected: 3,
      medal: 'gold'
    });

    expect(afterSecond.unlockedLevelIndex).toBe(1);
    expect(afterSecond.levels[0]).toMatchObject({
      bestTimeMs: 10000,
      bestJumps: 9,
      starsCollected: 3,
      medal: 'gold'
    });
  });

  it('normalizes legacy launch records into best jumps', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unlockedLevelIndex: 1,
        selectedSkin: 'mint',
        language: 'en',
        soundEnabled: true,
        levels: {
          0: {
            bestTimeMs: 12000,
            bestLaunches: 7,
            starsCollected: 3,
            medal: 'gold'
          }
        }
      })
    );

    expect(loadProfile().levels[0]).toMatchObject({
      bestTimeMs: 12000,
      bestJumps: 7,
      starsCollected: 3,
      medal: 'gold'
    });
  });

  it('unlocks the full themed skin lineup from total collected stars', () => {
    const profile = {
      ...createDefaultProfile(),
      levels: Object.fromEntries(
        Array.from({ length: 8 }, (_, index) => [
          index,
          { starsCollected: 3, medal: 'gold' }
        ])
      )
    };

    expect(getUnlockedSkinIds(profile, SKINS)).toEqual([
      'peach',
      'mint',
      'sky',
      'lemon',
      'cherry',
      'ink'
    ]);
  });
});
