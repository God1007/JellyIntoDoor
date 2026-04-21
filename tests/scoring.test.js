import { describe, expect, it } from 'vitest';
import { evaluateRun, unlocksNextLevel } from '../src/game/scoring.js';

describe('scoring', () => {
  it('awards gold when time, launches, and stars all hit the top threshold', () => {
    const result = evaluateRun(
      {
        medalTargets: {
          goldTime: 9000,
          silverTime: 15000,
          goldLaunches: 3,
          silverLaunches: 5
        },
        starsTotal: 3
      },
      { timeMs: 8200, launches: 3, starsCollected: 3 }
    );

    expect(result).toMatchObject({
      medal: 'gold',
      perfect: true,
      completed: true
    });
  });

  it('moves to the next level after a successful completion', () => {
    expect(unlocksNextLevel(2, { completed: true }, 10)).toBe(3);
  });

  it('keeps the current level when the run is incomplete', () => {
    expect(unlocksNextLevel(2, { completed: false }, 10)).toBe(2);
  });
});
