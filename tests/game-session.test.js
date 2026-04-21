import { describe, expect, it } from 'vitest';
import { createBlobState } from '../src/game/blob.js';
import { createGameSession, stepGameSession } from '../src/game/game.js';
import { createLevelRuntime } from '../src/game/level-runtime.js';

describe('game session', () => {
  it('starts a run with zero jumps and the requested level index', () => {
    const session = createGameSession({ levelIndex: 2 });

    expect(session).toMatchObject({
      levelIndex: 2,
      jumps: 0,
      status: 'playing'
    });
    expect(session.blob.position).toBeTruthy();
    expect(session.runtime).toBeTruthy();
  });

  it('accelerates horizontally when move input is held', () => {
    const session = createGameSession({ levelIndex: 0 });
    const next = stepGameSession(session, {
      dt: 1 / 60,
      input: { moveX: 1, jumpPressed: false, jumpHeld: false }
    });

    expect(next.blob.velocity.x).toBeGreaterThan(0);
  });

  it('increments jumps when a grounded jump is requested', () => {
    const session = createGameSession({ levelIndex: 0 });
    const next = stepGameSession(
      {
        ...session,
        blob: {
          ...session.blob,
          grounded: true,
          canJump: true
        }
      },
      {
        dt: 1 / 60,
        input: { moveX: 0, jumpPressed: true, jumpHeld: true }
      }
    );

    expect(next.jumps).toBe(1);
    expect(next.blob.velocity.y).toBeLessThan(0);
  });

  it('does not double jump while airborne', () => {
    const session = createGameSession({ levelIndex: 0 });
    const next = stepGameSession(
      {
        ...session,
        jumps: 1,
        blob: {
          ...session.blob,
          grounded: false,
          canJump: false,
          velocity: { x: 90, y: -120 }
        }
      },
      {
        dt: 1 / 60,
        input: { moveX: 0, jumpPressed: true, jumpHeld: true }
      }
    );

    expect(next.jumps).toBe(1);
    expect(next.lastFrameEvents.jumped).toBe(false);
  });

  it('allows a sticky blob to jump away after latching to a sticky wall', () => {
    const level = {
      id: 'sticky-test',
      name: 'Sticky Test',
      world: { width: 480, height: 320 },
      spawn: { x: 100, y: 140 },
      medalTargets: {
        goldTime: 1000,
        silverTime: 1500,
        goldJumps: 3,
        silverJumps: 5
      },
      starsTotal: 0,
      platforms: [],
      walls: [
        {
          id: 'sticky-wall-1',
          x: 200,
          y: 80,
          width: 20,
          height: 160,
          type: 'sticky-wall'
        }
      ],
      doors: [],
      buttons: [],
      stars: [],
      pickups: [],
      springs: [],
      fans: [],
      fragileFloors: []
    };
    const blob = createBlobState({ x: 182, y: 140 });
    blob.ability = 'sticky';
    blob.velocity = { x: 220, y: 0 };
    blob.skinId = 'peach';
    const latched = stepGameSession(
      {
        levelIndex: 0,
        level,
        status: 'playing',
        jumps: 0,
        elapsedMs: 0,
        collectedStars: 0,
        blob,
        runtime: createLevelRuntime(level),
        result: null,
        lastFrameEvents: {
          jumped: false,
          collectedStars: [],
          enteredDoor: false,
          blockedDoor: false,
          remainingStars: 0,
          failed: false
        }
      },
      {
        dt: 1 / 60,
        input: { moveX: 0, jumpPressed: false, jumpHeld: false }
      }
    );
    const released = stepGameSession(latched, {
      dt: 1 / 60,
      input: { moveX: -1, jumpPressed: true, jumpHeld: true }
    });

    expect(latched.blob.stuckToWall).toBe(true);
    expect(released.jumps).toBe(1);
    expect(released.blob.stuckToWall).toBe(false);
    expect(released.blob.velocity.y).toBeLessThan(0);
  });

  it('keeps the session playing when the blob touches the door before collecting every star', () => {
    const level = {
      id: 'door-gate-test',
      name: 'Door Gate Test',
      world: { width: 320, height: 240 },
      spawn: { x: 100, y: 60 },
      medalTargets: {
        goldTime: 1000,
        silverTime: 1500,
        goldJumps: 1,
        silverJumps: 2
      },
      starsTotal: 1,
      platforms: [],
      walls: [],
      buttons: [],
      doors: [
        {
          id: 'door-1',
          x: 90,
          y: 20,
          width: 68,
          height: 92,
          open: true
        }
      ],
      stars: [{ id: 'star-1', x: 250, y: 60, radius: 12 }],
      pickups: [],
      springs: [],
      fans: [],
      fragileFloors: []
    };
    const runtime = createLevelRuntime(level);
    const session = {
      levelIndex: 0,
      level,
      status: 'playing',
      jumps: 0,
      elapsedMs: 0,
      collectedStars: 0,
      blob: {
        ...createBlobState({ x: 108, y: 56 }),
        skinId: 'peach',
        canJump: true
      },
      runtime,
      result: null,
      lastFrameEvents: {
        jumped: false,
        pickedAbility: null,
        collectedStars: [],
        enteredDoor: false,
        blockedDoor: false,
        remainingStars: 0,
        failed: false
      }
    };

    const next = stepGameSession(session, {
      dt: 1 / 60,
      input: {}
    });

    expect(next.status).toBe('playing');
    expect(next.lastFrameEvents.enteredDoor).toBe(false);
    expect(next.lastFrameEvents.blockedDoor).toBe(true);
    expect(next.lastFrameEvents.remainingStars).toBe(1);
  });

  it('wins the session when the blob reaches the door after collecting every star', () => {
    const session = createGameSession({ levelIndex: 0 });
    const runtime = createLevelRuntime(session.level);
    runtime.collectedStarIds = session.level.stars.map((star) => star.id);
    runtime.stars = Object.fromEntries(
      session.level.stars.map((star) => [star.id, { ...star, collected: true }])
    );
    const next = stepGameSession(
      {
        ...session,
        runtime,
        collectedStars: runtime.collectedStarIds.length,
        blob: {
          ...session.blob,
          position: {
            x: session.level.door.x + session.level.door.width / 2,
            y: session.level.door.y + session.level.door.height / 2
          },
          velocity: { x: 0, y: 0 }
        },
        lastFrameEvents: {
          ...session.lastFrameEvents,
          blockedDoor: false,
          remainingStars: 0
        }
      },
      {
        dt: 1 / 60,
        input: {}
      }
    );

    expect(next.status).toBe('won');
    expect(next.lastFrameEvents.enteredDoor).toBe(true);
    expect(next.lastFrameEvents.blockedDoor).toBe(false);
  });
});
