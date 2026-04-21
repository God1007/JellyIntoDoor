import { describe, expect, it } from 'vitest';
import {
  evaluateRun,
  mergeRunRecord,
  unlocksNextLevel
} from '../src/game/scoring.js';

describe('scoring', () => {
  it('awards gold when time, jumps, and stars all hit the top threshold', () => {
    const result = evaluateRun(
      {
        medalTargets: {
          goldTime: 9000,
          silverTime: 15000,
          goldJumps: 8,
          silverJumps: 14
        },
        starsTotal: 3
      },
      { timeMs: 8200, jumps: 7, starsCollected: 3 }
    );

    expect(result).toMatchObject({
      medal: 'gold',
      perfect: true,
      completed: true,
      jumps: 7
    });
  });

  it('merges better jump counts while preserving best time and stars', () => {
    expect(
      mergeRunRecord(
        { bestTimeMs: 12000, bestJumps: 10, starsCollected: 2, medal: 'silver' },
        { timeMs: 11000, jumps: 12, starsCollected: 3, medal: 'gold' }
      )
    ).toMatchObject({
      bestTimeMs: 11000,
      bestJumps: 10,
      starsCollected: 3,
      medal: 'gold'
    });
  });

  it('moves to the next level after a successful completion', () => {
    expect(unlocksNextLevel(2, { completed: true }, 20)).toBe(3);
  });

  it('keeps the current level when the run is incomplete', () => {
    expect(unlocksNextLevel(2, { completed: false }, 20)).toBe(2);
  });
});
