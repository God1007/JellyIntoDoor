import { describe, expect, it } from 'vitest';
import { createGameSession, stepGameSession } from '../src/game/game.js';

describe('game session', () => {
  it('starts a run with zero launches and the requested level index', () => {
    const session = createGameSession({ levelIndex: 2 });

    expect(session).toMatchObject({
      levelIndex: 2,
      launches: 0,
      status: 'playing'
    });
    expect(session.blob.position).toBeTruthy();
    expect(session.runtime).toBeTruthy();
  });

  it('increments launches when a charged drag is released', () => {
    const session = createGameSession({ levelIndex: 0 });
    const next = stepGameSession(session, {
      dt: 1 / 60,
      input: {
        released: true,
        charging: true,
        dragVector: { x: -80, y: -20 }
      }
    });

    expect(next.launches).toBe(1);
    expect(next.blob.velocity.x).toBeGreaterThan(0);
  });
});
