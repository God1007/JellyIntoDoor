import { describe, expect, it } from 'vitest';
import { createBlobState } from '../src/game/blob.js';
import { createGameSession, stepGameSession } from '../src/game/game.js';
import { createLevelRuntime } from '../src/game/level-runtime.js';

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

  it('does not relaunch while airborne without a launch-ready state', () => {
    const session = createGameSession({ levelIndex: 0 });
    const next = stepGameSession(
      {
        ...session,
        launches: 1,
        blob: {
          ...session.blob,
          position: { x: 240, y: 180 },
          velocity: { x: 90, y: -120 },
          grounded: false,
          canLaunch: false,
          stuckToWall: false
        }
      },
      {
        dt: 1 / 60,
        input: {
          released: true,
          charging: true,
          dragVector: { x: -80, y: 0 }
        }
      }
    );

    expect(next.launches).toBe(1);
    expect(next.lastFrameEvents.launched).toBe(false);
  });

  it('rearms a sticky blob after it latches onto a sticky wall', () => {
    const level = {
      id: 'sticky-test',
      name: 'Sticky Test',
      world: { width: 480, height: 320 },
      spawn: { x: 100, y: 140 },
      medalTargets: {
        goldTime: 1000,
        silverTime: 1500,
        goldLaunches: 1,
        silverLaunches: 2
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
    blob.abilityTimerMs = 6500;
    blob.velocity = { x: 220, y: 0 };
    blob.canLaunch = false;
    blob.skinId = 'peach';
    const session = {
      levelIndex: 0,
      level,
      status: 'playing',
      launches: 1,
      elapsedMs: 0,
      collectedStars: 0,
      blob,
      runtime: createLevelRuntime(level),
      result: null,
      lastFrameEvents: {
        launched: false,
        pickedAbility: null,
        collectedStars: [],
        enteredDoor: false,
        failed: false
      }
    };

    const latched = stepGameSession(session, {
      dt: 1 / 60,
      input: {}
    });

    expect(latched.blob.stuckToWall).toBe(true);
    expect(latched.blob.canLaunch).toBe(true);
    expect(latched.blob.velocity).toEqual({ x: 0, y: 0 });

    const relaunched = stepGameSession(latched, {
      dt: 1 / 60,
      input: {
        released: true,
        charging: true,
        dragVector: { x: 70, y: -30 }
      }
    });

    expect(relaunched.launches).toBe(2);
    expect(relaunched.lastFrameEvents.launched).toBe(true);
    expect(relaunched.blob.stuckToWall).toBe(false);
  });

  it('keeps the session playing when the blob touches the door before collecting every star', () => {
    const level = {
      id: 'door-gate-test',
      name: 'Door Gate Test',
      world: { width: 320, height: 240 },
      spawn: { x: 100, y: 60 },
      medalTargets: { goldTime: 1000, silverTime: 1500, goldLaunches: 1, silverLaunches: 2 },
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
      launches: 0,
      elapsedMs: 0,
      collectedStars: 0,
      blob: {
        ...createBlobState({ x: 108, y: 56 }),
        skinId: 'peach',
        canLaunch: true
      },
      runtime,
      result: null,
      lastFrameEvents: {
        launched: false,
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
