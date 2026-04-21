# Side-Scrolling Platformer Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the game from drag-launch movement into a horizontal platformer with joystick/keyboard movement, jump controls, camera follow, 20 long levels, floor-aligned doors, a stronger `2-2` spring route, and another 30% audio gain bump.

**Architecture:** Keep the existing canvas-and-DOM split, but replace the old drag-input runtime with a normalized move/jump intent model. Add a small camera helper for horizontal follow, rebuild level data around wider worlds, and preserve current systems like doors, fans, pickups, buttons, skins, and save data by translating them into platformer-native rules instead of replacing them.

**Tech Stack:** Vite, vanilla JavaScript, HTML5 Canvas, CSS, Vitest

---

## Planned File Structure

- `src/game/input.js`: normalized keyboard and touch control state for move/jump gameplay
- `src/game/blob.js`: movement constants, jump helpers, and blob visual response tuned for platformer motion
- `src/game/game.js`: side-scrolling session stepping, jump counting, sticky-wall jump readiness, and results generation
- `src/game/scoring.js`: medal evaluation and merged records based on jump counts instead of launch counts
- `src/storage.js`: save normalization and record migration from legacy `bestLaunches` to `bestJumps`
- `src/game/render/camera.js`: horizontal-only camera follow and clamping helpers
- `src/game/render/canvas-renderer.js`: draw the world through camera translation
- `src/game/level-data.js`: 20 authored platformer levels, wider worlds, floor-aligned doors, stronger `2-2`
- `src/ui/screens.js`: joystick and jump-button HUD markup plus result summaries that show jumps
- `src/style.css`: touch control layout, bottom-corner hit zones, and non-interfering HUD rules
- `src/i18n.js`: updated movement/jump copy and jump-based stats labels
- `src/main.js`: keyboard input, touch joystick/jump wiring, camera state, and removal of drag-launch handling
- `src/game/audio.js`: another 30% gain increase across gameplay presets
- `tests/input.test.js`: move/jump input helper coverage
- `tests/blob.test.js`: platformer movement helpers and blob visual state coverage
- `tests/game-session.test.js`: run/jump session behavior and jump counting
- `tests/scoring.test.js`: jump-based medals and progression
- `tests/storage.test.js`: save merging and legacy launch-to-jump normalization
- `tests/store.test.js`: app-state result payload expectations
- `tests/camera.test.js`: horizontal-only camera follow, look-ahead, and clamping
- `tests/level-data.test.js`: 20-level campaign assertions, wide-world checks, door floor alignment, and `2-2` spring regression
- `tests/render-helpers.test.js`: touch HUD control markup and jump-stat results rendering
- `tests/mobile-layout.test.js`: joystick and jump-button stylesheet hooks
- `tests/audio.test.js`: louder preset thresholds after the extra gain bump

### Task 1: Replace Drag Input With Normalized Move/Jump Intent

**Files:**
- Modify: `tests/input.test.js`
- Modify: `src/game/input.js`

- [ ] **Step 1: Write the failing tests for keyboard and touch move/jump intent**

```js
// replace tests/input.test.js with:
import { describe, expect, it } from 'vitest';
import {
  beginJumpTouch,
  beginJoystick,
  createInputState,
  endJumpTouch,
  endJoystick,
  markJumpConsumed,
  setJumpPressed,
  setKeyboardDirection,
  updateJoystick
} from '../src/game/input.js';

describe('input intent', () => {
  it('derives moveX from keyboard state', () => {
    const left = setKeyboardDirection(createInputState(), 'left', true);
    const right = setKeyboardDirection(left, 'right', true);
    const neutral = setKeyboardDirection(right, 'left', false);

    expect(left.moveX).toBe(-1);
    expect(right.moveX).toBe(0);
    expect(neutral.moveX).toBe(1);
  });

  it('queues a one-frame jump press and keeps held state until released', () => {
    const pressed = setJumpPressed(createInputState(), true);
    const consumed = markJumpConsumed(pressed);
    const released = setJumpPressed(consumed, false);

    expect(pressed.jumpPressed).toBe(true);
    expect(pressed.jumpHeld).toBe(true);
    expect(consumed.jumpPressed).toBe(false);
    expect(released.jumpHeld).toBe(false);
  });

  it('normalizes joystick motion into moveX', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const moved = updateJoystick(started, { id: 11, x: 170, y: 400 });

    expect(moved.joystick.pointerId).toBe(11);
    expect(moved.moveX).toBeGreaterThan(0.85);
  });

  it('ignores joystick updates from another pointer id', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const moved = updateJoystick(started, { id: 99, x: 170, y: 400 });

    expect(moved).toEqual(started);
  });

  it('clears moveX when the joystick ends', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const moved = updateJoystick(started, { id: 11, x: 170, y: 400 });
    const ended = endJoystick(moved, 11);

    expect(ended.joystick.pointerId).toBeNull();
    expect(ended.moveX).toBe(0);
  });

  it('uses a touch jump button as a jump source', () => {
    const started = beginJumpTouch(createInputState(), 21);
    const ended = endJumpTouch(started, 21);

    expect(started.jumpPressed).toBe(true);
    expect(started.jumpHeld).toBe(true);
    expect(ended.jumpHeld).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused input tests to verify they fail**

Run: `npm test -- --run tests/input.test.js`  
Expected: FAIL because `src/game/input.js` still exports drag-charge helpers instead of keyboard and touch move/jump helpers.

- [ ] **Step 3: Replace the input helpers with a move/jump state model**

```js
// replace src/game/input.js with:
const JOYSTICK_RADIUS = 56;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveMoveX(input) {
  const keyboardAxis =
    (input.keyboard.right ? 1 : 0) - (input.keyboard.left ? 1 : 0);

  if (keyboardAxis !== 0) {
    return keyboardAxis;
  }

  return clamp((input.joystick.knob.x ?? 0) / JOYSTICK_RADIUS, -1, 1);
}

export function createInputState() {
  return {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    keyboard: {
      left: false,
      right: false
    },
    joystick: {
      pointerId: null,
      origin: null,
      knob: { x: 0, y: 0 }
    },
    jumpTouchId: null
  };
}

export function setKeyboardDirection(input, key, pressed) {
  const next = {
    ...input,
    keyboard: {
      ...input.keyboard,
      [key]: pressed
    }
  };

  return {
    ...next,
    moveX: resolveMoveX(next)
  };
}

export function setJumpPressed(input, pressed) {
  return {
    ...input,
    jumpPressed: pressed ? true : input.jumpPressed,
    jumpHeld: pressed
  };
}

export function markJumpConsumed(input) {
  return {
    ...input,
    jumpPressed: false
  };
}

export function beginJoystick(input, pointerId, origin) {
  return {
    ...input,
    joystick: {
      pointerId,
      origin: { ...origin },
      knob: { x: 0, y: 0 }
    },
    moveX: resolveMoveX({
      ...input,
      joystick: {
        pointerId,
        origin: { ...origin },
        knob: { x: 0, y: 0 }
      }
    })
  };
}

export function updateJoystick(input, pointer) {
  if (input.joystick.pointerId !== pointer.id) {
    return input;
  }

  const dx = pointer.x - input.joystick.origin.x;
  const dy = pointer.y - input.joystick.origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, JOYSTICK_RADIUS / length);
  const knob = {
    x: dx * scale,
    y: dy * scale
  };
  const next = {
    ...input,
    joystick: {
      ...input.joystick,
      knob
    }
  };

  return {
    ...next,
    moveX: resolveMoveX(next)
  };
}

export function endJoystick(input, pointerId) {
  if (input.joystick.pointerId !== pointerId) {
    return input;
  }

  const next = {
    ...input,
    joystick: {
      pointerId: null,
      origin: null,
      knob: { x: 0, y: 0 }
    }
  };

  return {
    ...next,
    moveX: resolveMoveX(next)
  };
}

export function beginJumpTouch(input, pointerId) {
  return {
    ...input,
    jumpTouchId: pointerId,
    jumpPressed: true,
    jumpHeld: true
  };
}

export function endJumpTouch(input, pointerId) {
  if (input.jumpTouchId !== pointerId) {
    return input;
  }

  return {
    ...input,
    jumpTouchId: null,
    jumpHeld: false
  };
}
```

- [ ] **Step 4: Run the focused input tests to verify they pass**

Run: `npm test -- --run tests/input.test.js`  
Expected: PASS with 6 passing tests in `tests/input.test.js`.

- [ ] **Step 5: Commit the input-model rewrite**

```bash
git add tests/input.test.js src/game/input.js
git commit -m "refactor: replace drag input with move and jump intent"
```

### Task 2: Rewrite Runtime, Scoring, and Saves Around Jump-Based Platformer Play

**Files:**
- Modify: `tests/blob.test.js`
- Modify: `tests/game-session.test.js`
- Modify: `tests/scoring.test.js`
- Modify: `tests/storage.test.js`
- Modify: `tests/store.test.js`
- Modify: `src/game/blob.js`
- Modify: `src/game/game.js`
- Modify: `src/game/scoring.js`
- Modify: `src/storage.js`

- [ ] **Step 1: Write the failing tests for movement, jumping, scoring, and save migration**

```js
// replace tests/blob.test.js with:
import { describe, expect, it } from 'vitest';
import {
  MOVEMENT,
  applyHorizontalControl,
  applyJumpImpulse,
  createBlobState,
  getBlobVisualState
} from '../src/game/blob.js';

describe('blob helpers', () => {
  it('accelerates harder on the ground than in the air', () => {
    const grounded = applyHorizontalControl(
      { ...createBlobState({ x: 0, y: 0 }), grounded: true, velocity: { x: 0, y: 0 } },
      1,
      1 / 60
    );
    const airborne = applyHorizontalControl(
      { ...createBlobState({ x: 0, y: 0 }), grounded: false, velocity: { x: 0, y: 0 } },
      1,
      1 / 60
    );

    expect(grounded.velocity.x).toBeGreaterThan(airborne.velocity.x);
  });

  it('applies an upward jump impulse', () => {
    const jumped = applyJumpImpulse(createBlobState({ x: 0, y: 0 }));

    expect(jumped.velocity.y).toBe(-MOVEMENT.jumpVelocity);
    expect(jumped.grounded).toBe(false);
  });

  it('leans the blob art in the direction of travel', () => {
    const blob = createBlobState({ x: 100, y: 220 });
    blob.velocity.x = 260;

    const visual = getBlobVisualState(blob, {
      moveX: 1,
      jumping: false,
      impact: 0.2
    });

    expect(visual.tilt).toBeGreaterThan(0);
  });
});
```

```js
// replace tests/scoring.test.js with:
import { describe, expect, it } from 'vitest';
import { evaluateRun, mergeRunRecord, unlocksNextLevel } from '../src/game/scoring.js';

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
});
```

```js
// replace tests/storage.test.js with:
import { describe, expect, it } from 'vitest';
import { SKINS } from '../src/game/level-data.js';
import {
  createDefaultProfile,
  getUnlockedSkinIds,
  loadProfile,
  mergeLevelResult,
  saveProfile,
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
          0: { bestTimeMs: 12000, bestLaunches: 7, starsCollected: 3, medal: 'gold' }
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
```

```js
// replace tests/store.test.js with:
import { describe, expect, it } from 'vitest';
import { createInitialAppState, reduceAppState } from '../src/app/store.js';

describe('app store', () => {
  it('starts on the title screen with sound enabled and english selected', () => {
    expect(createInitialAppState()).toMatchObject({
      screen: 'title',
      selectedLevel: 0,
      soundEnabled: true,
      skinId: 'peach',
      language: 'en'
    });
  });

  it('moves into results after a level is completed', () => {
    const playing = {
      ...createInitialAppState(),
      screen: 'playing',
      selectedLevel: 2
    };
    const result = { medal: 'silver', timeMs: 12345, jumps: 14 };
    const next = reduceAppState(playing, {
      type: 'LEVEL_FINISHED',
      result
    });

    expect(next.screen).toBe('results');
    expect(next.lastResult).toEqual(result);
  });
});
```

```js
// replace tests/game-session.test.js with:
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
      medalTargets: { goldTime: 1000, silverTime: 1500, goldJumps: 3, silverJumps: 5 },
      starsTotal: 0,
      platforms: [],
      walls: [{ id: 'sticky-wall-1', x: 200, y: 80, width: 20, height: 160, type: 'sticky-wall' }],
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
        lastFrameEvents: { jumped: false, collectedStars: [], enteredDoor: false, blockedDoor: false, remainingStars: 0, failed: false }
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
});
```

- [ ] **Step 2: Run the focused runtime and data-model tests to verify they fail**

Run: `npm test -- --run tests/blob.test.js tests/game-session.test.js tests/scoring.test.js tests/storage.test.js tests/store.test.js`  
Expected: FAIL because movement is still launch-based, sessions still count `launches`, and save/scoring code does not understand `jumps`.

- [ ] **Step 3: Implement platformer movement, jump-based scoring, and legacy save normalization**

```js
// replace the exported helpers in src/game/blob.js with:
const DEFAULT_BLOB_RADIUS = 18;

export const MOVEMENT = {
  maxRunSpeed: 285,
  groundAcceleration: 1680,
  airAcceleration: 920,
  groundFriction: 1500,
  jumpVelocity: 640,
  wallJumpPush: 230
};

function moveToward(current, target, delta) {
  if (current === target) {
    return current;
  }

  if (current < target) {
    return Math.min(target, current + delta);
  }

  return Math.max(target, current - delta);
}

export function createBlobState(position) {
  return {
    position: { x: position.x, y: position.y },
    velocity: { x: 0, y: 0 },
    radius: DEFAULT_BLOB_RADIUS,
    ability: null,
    abilityTimerMs: 0,
    grounded: false,
    canJump: false,
    stuckToWall: false,
    wallNormalX: 0,
    squash: 0,
    stretch: 0
  };
}

export function applyHorizontalControl(blob, moveX, dt) {
  const acceleration = blob.grounded ? MOVEMENT.groundAcceleration : MOVEMENT.airAcceleration;
  const targetSpeed = moveX * MOVEMENT.maxRunSpeed;
  const velocityX =
    moveX === 0 && blob.grounded
      ? moveToward(blob.velocity.x, 0, MOVEMENT.groundFriction * dt)
      : moveToward(blob.velocity.x, targetSpeed, acceleration * dt);

  return {
    ...blob,
    velocity: {
      ...blob.velocity,
      x: velocityX
    }
  };
}

export function applyJumpImpulse(blob, moveX = 0) {
  const wallPush = blob.stuckToWall ? (moveX === 0 ? -blob.wallNormalX : moveX) * MOVEMENT.wallJumpPush : 0;

  return {
    ...blob,
    grounded: false,
    canJump: false,
    stuckToWall: false,
    wallNormalX: 0,
    velocity: {
      x: blob.velocity.x + wallPush,
      y: -MOVEMENT.jumpVelocity
    }
  };
}

export function getBlobVisualState(blob, context = {}) {
  const speed = Math.hypot(blob.velocity.x, blob.velocity.y);
  const impact = Math.max(0, context.impact ?? 0);
  const stretch = Math.min(0.42, speed / 1600 + (context.jumping ? 0.04 : 0));
  const squash = Math.min(0.28, impact * 0.24 + (blob.grounded ? 0.04 : 0));
  const tilt = Math.max(-0.24, Math.min(0.24, blob.velocity.x / 1400));

  return {
    scaleX: 1 + stretch - squash,
    scaleY: 1 - stretch + squash,
    tilt,
    face: context.enteredDoor ? 'happy' : context.jumping ? 'intent' : speed > 320 ? 'focused' : 'idle'
  };
}
```

```js
// update src/game/scoring.js:
export function evaluateRun(level, stats) {
  const { goldTime, silverTime, goldJumps, silverJumps } = level.medalTargets;
  const meetsGold =
    stats.timeMs <= goldTime &&
    stats.jumps <= goldJumps &&
    stats.starsCollected === level.starsTotal;
  const meetsSilver = stats.timeMs <= silverTime && stats.jumps <= silverJumps;

  if (meetsGold) {
    return { ...stats, medal: 'gold', perfect: true, completed: true };
  }

  if (meetsSilver) {
    return { ...stats, medal: 'silver', perfect: false, completed: true };
  }

  return { ...stats, medal: 'bronze', perfect: false, completed: true };
}

export function mergeRunRecord(previous = {}, result = {}) {
  const previousBestJumps = previous.bestJumps ?? previous.bestLaunches;
  const incomingJumps = result.jumps ?? result.launches;

  return {
    bestTimeMs: pickLowerNumber(previous.bestTimeMs, result.timeMs),
    bestJumps: pickLowerNumber(previousBestJumps, incomingJumps),
    starsCollected: pickHigherNumber(previous.starsCollected, result.starsCollected),
    medal: pickBetterMedal(previous.medal, result.medal)
  };
}
```

```js
// update the session bookkeeping in src/game/game.js:
import { applyHorizontalControl, applyJumpImpulse, createBlobState } from './blob.js';

function isJumpRequested(input) {
  return Boolean(input?.jumpPressed);
}

function canBlobJump(blob) {
  return Boolean(blob.grounded || blob.stuckToWall || blob.canJump);
}

export function createGameSession({ levelIndex, skinId = 'peach' }) {
  const resolvedIndex = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
  const level = LEVELS[resolvedIndex];
  const blob = createBlobState(level.spawn);

  return {
    levelIndex: resolvedIndex,
    level,
    status: 'playing',
    jumps: 0,
    elapsedMs: 0,
    collectedStars: 0,
    blob: { ...blob, skinId },
    runtime: createLevelRuntime(level),
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
}

export function buildSessionResult(session) {
  return evaluateRun(session.level, {
    timeMs: Math.round(session.elapsedMs),
    jumps: session.jumps,
    starsCollected: session.runtime.collectedStarIds.length
  });
}

// inside stepGameSession(), before resolveWorldCollision():
  let jumps = session.jumps;
  let jumped = false;
  blob = applyHorizontalControl(blob, frame.input?.moveX ?? 0, dt);

  if (isJumpRequested(frame.input) && canBlobJump(blob)) {
    blob = applyJumpImpulse(blob, frame.input?.moveX ?? 0);
    jumps += 1;
    jumped = true;
  }

// after collision resolution:
  const wallCollision = (collision.collisions ?? []).find((entry) => entry.wall && entry.rect?.type === 'sticky-wall');
  blob = {
    ...collision.body,
    grounded: collision.grounded,
    canJump: collision.grounded || Boolean(wallCollision),
    stuckToWall: Boolean(wallCollision),
    wallNormalX: wallCollision?.normal?.x ?? 0,
    velocity: Boolean(wallCollision) ? { x: 0, y: 0 } : collision.body.velocity,
    skinId: session.blob.skinId
  };

// and in the returned session object:
    jumps,
    lastFrameEvents: {
      jumped,
      pickedAbility: runtimeStep.pickedAbility,
      collectedStars: runtimeStep.collectedStars,
      enteredDoor: runtimeStep.enteredDoor,
      blockedDoor: runtimeStep.blockedDoor,
      remainingStars: runtimeStep.remainingStars,
      failed
    }
```

```js
// update src/storage.js normalizeLevelRecords() usage by keeping mergeRunRecord() as the migration point:
function normalizeLevelRecords(levels) {
  if (!levels || typeof levels !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(levels).map(([levelIndex, record]) => [
      levelIndex,
      mergeRunRecord(record, {})
    ])
  );
}
```

- [ ] **Step 4: Run the focused runtime and data-model tests to verify they pass**

Run: `npm test -- --run tests/blob.test.js tests/game-session.test.js tests/scoring.test.js tests/storage.test.js tests/store.test.js`  
Expected: PASS with jump-based session, scoring, and storage tests all green.

- [ ] **Step 5: Commit the platformer runtime conversion**

```bash
git add tests/blob.test.js tests/game-session.test.js tests/scoring.test.js tests/storage.test.js tests/store.test.js src/game/blob.js src/game/game.js src/game/scoring.js src/storage.js
git commit -m "feat: convert runtime scoring and saves to platformer jumps"
```

### Task 3: Add Horizontal Camera Follow and Camera-Aware Rendering

**Files:**
- Create: `tests/camera.test.js`
- Create: `src/game/render/camera.js`
- Modify: `src/game/render/canvas-renderer.js`

- [ ] **Step 1: Write the failing camera tests**

```js
// create tests/camera.test.js
import { describe, expect, it } from 'vitest';
import { createCameraState, updateCamera } from '../src/game/render/camera.js';

describe('camera', () => {
  it('keeps vertical framing fixed while following horizontal movement', () => {
    const camera = updateCamera(
      createCameraState(),
      { position: { x: 480, y: 120 }, velocity: { x: 180, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );

    expect(camera.x).toBeGreaterThan(0);
    expect(camera.y).toBe(0);
  });

  it('clamps to the right edge of the world', () => {
    const camera = updateCamera(
      createCameraState(),
      { position: { x: 2380, y: 120 }, velocity: { x: 220, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );

    expect(camera.x).toBeLessThanOrEqual(1440);
  });

  it('looks ahead in the direction of travel', () => {
    const left = updateCamera(
      createCameraState(),
      { position: { x: 900, y: 120 }, velocity: { x: -180, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );
    const right = updateCamera(
      createCameraState(),
      { position: { x: 900, y: 120 }, velocity: { x: 180, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );

    expect(right.x).toBeGreaterThan(left.x);
  });
});
```

- [ ] **Step 2: Run the focused camera tests to verify they fail**

Run: `npm test -- --run tests/camera.test.js`  
Expected: FAIL because `src/game/render/camera.js` does not exist yet.

- [ ] **Step 3: Create the camera helper and apply camera translation in the renderer**

```js
// create src/game/render/camera.js
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createCameraState() {
  return { x: 0, y: 0 };
}

export function updateCamera(camera, blob, level, viewport, dt) {
  const maxX = Math.max(0, (level.world?.width ?? viewport.width) - viewport.width);
  const lookAhead = blob.velocity.x >= 0 ? 120 : -120;
  const targetX = clamp(blob.position.x - viewport.width / 2 + lookAhead, 0, maxX);
  const smoothing = 1 - Math.exp(-dt * 8);

  return {
    x: camera.x + (targetX - camera.x) * smoothing,
    y: 0
  };
}
```

```js
// update src/game/render/canvas-renderer.js near renderFrame():
  const camera = snapshot.camera ?? { x: 0, y: 0 };

  ctx.clearRect(0, 0, width, height);
  drawPaperBackground(ctx, width, height);
  ctx.save();
  ctx.translate(-camera.x, 0);

  if (level) {
    // existing world draw calls stay here
  }

  if (snapshot.blob) {
    drawBlob(ctx, {
      ...snapshot.blob,
      status: snapshot.status
    });
  }

  drawEffects(ctx, snapshot.effects ?? []);
  ctx.restore();
  drawHint(ctx, snapshot.hint);
```

- [ ] **Step 4: Run the focused camera tests to verify they pass**

Run: `npm test -- --run tests/camera.test.js`  
Expected: PASS with 3 passing camera tests.

- [ ] **Step 5: Commit the camera layer**

```bash
git add tests/camera.test.js src/game/render/camera.js src/game/render/canvas-renderer.js
git commit -m "feat: add horizontal camera follow"
```

### Task 4: Rebuild Chapters 1-2 as Long Platformer Stages

**Files:**
- Modify: `tests/level-data.test.js`
- Modify: `src/game/level-data.js`

- [ ] **Step 1: Write the failing tests for long opening chapters, floor-aligned doors, and the stronger `2-2`**

```js
// replace tests/level-data.test.js with:
import { describe, expect, it } from 'vitest';
import { LEVELS, SKINS } from '../src/game/level-data.js';

function hasSupportingPlatform(level, door) {
  return (level.platforms ?? []).some((platform) => {
    const overlapsX =
      door.x + door.width > platform.x &&
      door.x < platform.x + platform.width;

    return overlapsX && door.y + door.height === platform.y;
  });
}

describe('level data', () => {
  it('exposes six themed skins for the picker', () => {
    expect(SKINS.map((skin) => skin.id)).toEqual([
      'peach',
      'mint',
      'sky',
      'lemon',
      'cherry',
      'ink'
    ]);
  });

  it('rebuilds the first ten levels as long horizontal platformer stages', () => {
    expect(LEVELS.slice(0, 10)).toHaveLength(10);
    LEVELS.slice(0, 10).forEach((level) => {
      expect(level.world.width).toBeGreaterThanOrEqual(2160);
    });
  });

  it('keeps every opening-chapter door aligned to its supporting floor', () => {
    LEVELS.slice(0, 10).forEach((level) => {
      expect(hasSupportingPlatform(level, level.door)).toBe(true);
    });
  });

  it('retunes level 2-2 around a stronger spring-assisted route', () => {
    const springPen = LEVELS.find((level) => level.id === '2-2');

    expect(springPen.springs[0]).toMatchObject({
      boost: 2.35,
      launchBoost: 987
    });
    expect(springPen.world.width).toBeGreaterThanOrEqual(2320);
    expect(hasSupportingPlatform(springPen, springPen.door)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused level-data tests to verify they fail**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: FAIL because the campaign still has 10 mostly single-screen stages and `2-2` still uses the old spring values.

- [ ] **Step 3: Rebuild chapters 1 and 2 with wider worlds and floor-aligned doors**

```js
// replace the top of src/game/level-data.js with these helper updates:
const WORLD_HEIGHT = 540;

function world(width) {
  return { width, height: WORLD_HEIGHT };
}

function ground(width) {
  return platform(0, 460, width, 40, 'ground');
}

function floorDoor(id, x, floorY, requiresButton = null) {
  return door(id, x, floorY - 84, requiresButton);
}
```

```js
// replace the existing opening campaign in src/game/level-data.js with:
const RAW_LEVELS = [
  {
    id: '1-1',
    name: 'Warm-Up Run',
    starsTotal: 3,
    medalTargets: { goldTime: 22000, silverTime: 34000, goldJumps: 10, silverJumps: 18 },
    world: world(2240),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-1', 2100, 460),
    platforms: [
      ground(2240),
      platform(320, 398, 140, 18, 'step'),
      platform(590, 348, 160, 18, 'step'),
      platform(920, 392, 180, 18, 'step'),
      platform(1260, 330, 180, 18, 'step'),
      platform(1640, 392, 180, 18, 'step'),
      platform(1980, 460, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 420, 350), star('s2', 1360, 282), star('s3', 1850, 352)]
  },
  {
    id: '1-2',
    name: 'Three Lanes',
    starsTotal: 3,
    medalTargets: { goldTime: 24000, silverTime: 36000, goldJumps: 12, silverJumps: 20 },
    world: world(2320),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-2', 2170, 392),
    platforms: [
      ground(2320),
      platform(300, 390, 150, 18, 'step'),
      platform(560, 318, 160, 18, 'step'),
      platform(820, 390, 170, 18, 'step'),
      platform(1140, 300, 170, 18, 'step'),
      platform(1480, 390, 170, 18, 'step'),
      platform(1840, 324, 160, 18, 'step'),
      platform(2120, 392, 130, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 640, 270), star('s2', 1215, 252), star('s3', 1890, 276)]
  },
  {
    id: '1-3',
    name: 'Spring Intro',
    starsTotal: 3,
    medalTargets: { goldTime: 23000, silverTime: 35000, goldJumps: 12, silverJumps: 22 },
    world: world(2280),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-3', 2100, 340),
    platforms: [
      ground(2280),
      platform(620, 420, 160, 18, 'spring-ledge'),
      platform(980, 308, 170, 18, 'step'),
      platform(1380, 370, 180, 18, 'step'),
      platform(1740, 300, 180, 18, 'step'),
      platform(2040, 340, 150, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(660, 438, 92, 22, 1.75, 'spring-1-3')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 710, 360), star('s2', 1070, 260), star('s3', 1820, 252)]
  },
  {
    id: '1-4',
    name: 'Button Jog',
    starsTotal: 3,
    medalTargets: { goldTime: 26000, silverTime: 38000, goldJumps: 14, silverJumps: 24 },
    world: world(2400),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-4', 2230, 392, 'b-1-4'),
    platforms: [
      ground(2400),
      platform(500, 390, 160, 18, 'button-ledge'),
      platform(930, 330, 190, 18, 'step'),
      platform(1320, 390, 190, 18, 'step'),
      platform(1730, 314, 180, 18, 'step'),
      platform(2180, 392, 160, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-1-4', 540, 372)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 342), star('s2', 1410, 342), star('s3', 1810, 264)]
  },
  {
    id: '1-5',
    name: 'First Long Push',
    starsTotal: 3,
    medalTargets: { goldTime: 28000, silverTime: 42000, goldJumps: 15, silverJumps: 26 },
    world: world(2520),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-5', 2330, 460),
    platforms: [
      ground(2520),
      platform(360, 394, 140, 18, 'step'),
      platform(760, 342, 180, 18, 'step'),
      platform(1180, 394, 180, 18, 'step'),
      platform(1610, 326, 180, 18, 'step'),
      platform(2010, 394, 180, 18, 'step'),
      platform(2280, 460, 190, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1040, 438, 90, 22, 1.88, 'spring-1-5')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 450, 346), star('s2', 1085, 288), star('s3', 2080, 344)]
  },
  {
    id: '2-1',
    name: 'Twin Springs',
    starsTotal: 3,
    medalTargets: { goldTime: 30000, silverTime: 44000, goldJumps: 16, silverJumps: 28 },
    world: world(2600),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-1', 2400, 350),
    platforms: [
      ground(2600),
      platform(520, 410, 150, 18, 'spring-ledge'),
      platform(960, 334, 170, 18, 'step'),
      platform(1350, 410, 170, 18, 'spring-ledge'),
      platform(1820, 320, 180, 18, 'step'),
      platform(2340, 350, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [
      spring(560, 438, 90, 22, 1.95, 'spring-2-1-a'),
      spring(1390, 438, 90, 22, 2.02, 'spring-2-1-b')
    ],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 356), star('s2', 1450, 356), star('s3', 1900, 270)]
  },
  {
    id: '2-2',
    name: 'Spring Pen',
    starsTotal: 3,
    medalTargets: { goldTime: 29000, silverTime: 43000, goldJumps: 15, silverJumps: 26 },
    world: world(2320),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-2', 2140, 280),
    platforms: [
      ground(2320),
      platform(520, 410, 180, 18, 'runway'),
      platform(930, 312, 190, 18, 'landing'),
      platform(1380, 220, 180, 18, 'upper'),
      platform(1840, 280, 220, 18, 'goal-floor'),
      platform(2080, 280, 120, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(610, 438, 100, 22, 2.35, 'spring-2-2')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 680, 362), star('s2', 1460, 170), star('s3', 1910, 230)]
  },
  {
    id: '2-3',
    name: 'Fan Ribbon',
    starsTotal: 3,
    medalTargets: { goldTime: 32000, silverTime: 47000, goldJumps: 17, silverJumps: 30 },
    world: world(2700),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-3', 2500, 298),
    platforms: [
      ground(2700),
      platform(460, 394, 180, 18, 'step'),
      platform(920, 350, 180, 18, 'step'),
      platform(1480, 394, 180, 18, 'step'),
      platform(1960, 320, 180, 18, 'step'),
      platform(2440, 298, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1110, 438, 90, 22, 1.92, 'spring-2-3')],
    fans: [fan(1700, 210, 120, 210, 640, 'fan-2-3')],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 560, 346), star('s2', 1180, 362), star('s3', 2030, 264)]
  },
  {
    id: '2-4',
    name: 'Door Relay',
    starsTotal: 3,
    medalTargets: { goldTime: 33000, silverTime: 48000, goldJumps: 18, silverJumps: 30 },
    world: world(2820),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-4', 2590, 352, 'b-2-4'),
    platforms: [
      ground(2820),
      platform(540, 388, 190, 18, 'button-ledge'),
      platform(970, 312, 180, 18, 'step'),
      platform(1460, 388, 180, 18, 'step'),
      platform(1940, 322, 180, 18, 'step'),
      platform(2530, 352, 200, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-2-4', 600, 370)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 670, 340), star('s2', 1550, 340), star('s3', 2000, 272)]
  },
  {
    id: '2-5',
    name: 'Chapter Stretch',
    starsTotal: 3,
    medalTargets: { goldTime: 36000, silverTime: 52000, goldJumps: 19, silverJumps: 33 },
    world: world(2960),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-5', 2740, 300),
    platforms: [
      ground(2960),
      platform(400, 390, 180, 18, 'step'),
      platform(820, 330, 200, 18, 'step'),
      platform(1320, 390, 180, 18, 'step'),
      platform(1780, 316, 180, 18, 'step'),
      platform(2200, 390, 180, 18, 'step'),
      platform(2680, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1040, 438, 90, 22, 2.08, 'spring-2-5')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 500, 344), star('s2', 1100, 274), star('s3', 2260, 344)]
  }
];
```

- [ ] **Step 4: Run the focused level-data tests to verify they pass**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: PASS with the first ten levels now wide enough, door-aligned, and `2-2` using the stronger spring.

- [ ] **Step 5: Commit the rebuilt opening campaign**

```bash
git add tests/level-data.test.js src/game/level-data.js
git commit -m "feat: rebuild chapters one and two as long platformer stages"
```

### Task 5: Add Chapters 3-4 and Finish the 20-Level Campaign

**Files:**
- Modify: `tests/level-data.test.js`
- Modify: `src/game/level-data.js`

- [ ] **Step 1: Extend the failing level-data tests to require all 20 campaign levels**

```js
// append to tests/level-data.test.js:
  it('expands the campaign to twenty authored levels', () => {
    expect(LEVELS).toHaveLength(20);
    LEVELS.forEach((level) => {
      expect(level.world.width).toBeGreaterThanOrEqual(2160);
      expect(hasSupportingPlatform(level, level.door)).toBe(true);
    });
  });
```

- [ ] **Step 2: Run the focused level-data tests to verify they fail**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: FAIL because the campaign still stops after chapter 2.

- [ ] **Step 3: Append chapter 3 and 4 levels and export the full 20-level list**

```js
// append to src/game/level-data.js after the first 10 levels:
RAW_LEVELS.push(
  {
    id: '3-1',
    name: 'Sticky Reach',
    starsTotal: 3,
    medalTargets: { goldTime: 34000, silverTime: 50000, goldJumps: 18, silverJumps: 31 },
    world: world(3000),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-1', 2780, 332),
    platforms: [ground(3000), platform(560, 390, 180, 18, 'step'), platform(1080, 330, 180, 18, 'step'), platform(1640, 390, 180, 18, 'step'), platform(2200, 322, 180, 18, 'step'), platform(2720, 332, 180, 18, 'goal-floor')],
    walls: [wall(1320, 180, 24, 210, 'sticky-wall')],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-3-1', 'sticky', 930, 360)],
    stars: [star('s1', 620, 344), star('s2', 1390, 230), star('s3', 2260, 274)]
  },
  {
    id: '3-2',
    name: 'Heavy Footing',
    starsTotal: 3,
    medalTargets: { goldTime: 36000, silverTime: 52000, goldJumps: 19, silverJumps: 33 },
    world: world(3040),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-2', 2820, 340, 'b-3-2'),
    platforms: [ground(3040), platform(520, 390, 180, 18, 'fragile-floor', 'floor-3-2-a'), platform(980, 330, 180, 18, 'step'), platform(1520, 390, 180, 18, 'fragile-floor', 'floor-3-2-b'), platform(2140, 320, 200, 18, 'step'), platform(2760, 340, 180, 18, 'goal-floor')],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-3-2', 2190, 302)],
    fragileFloors: [fragileFloor('floor-3-2-a', 520, 390, 180, 18), fragileFloor('floor-3-2-b', 1520, 390, 180, 18)],
    movingPlatforms: [],
    pickups: [pickup('p-3-2', 'heavy', 860, 360)],
    stars: [star('s1', 610, 340), star('s2', 1600, 340), star('s3', 2230, 272)]
  },
  {
    id: '3-3',
    name: 'Elastic Ladder',
    starsTotal: 3,
    medalTargets: { goldTime: 38000, silverTime: 54000, goldJumps: 20, silverJumps: 35 },
    world: world(3080),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-3', 2860, 280),
    platforms: [ground(3080), platform(480, 394, 180, 18, 'step'), platform(980, 320, 180, 18, 'step'), platform(1540, 250, 180, 18, 'step'), platform(2140, 320, 180, 18, 'step'), platform(2800, 280, 180, 18, 'goal-floor')],
    walls: [],
    springs: [spring(700, 438, 90, 22, 2.1, 'spring-3-3-a'), spring(1760, 438, 90, 22, 2.18, 'spring-3-3-b')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-3-3', 'elastic', 900, 360)],
    stars: [star('s1', 760, 346), star('s2', 1620, 202), star('s3', 2220, 272)]
  },
  {
    id: '3-4',
    name: 'Crosswind Walk',
    starsTotal: 3,
    medalTargets: { goldTime: 40000, silverTime: 56000, goldJumps: 21, silverJumps: 36 },
    world: world(3160),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-4', 2920, 300),
    platforms: [ground(3160), platform(520, 390, 180, 18, 'step'), platform(1080, 338, 180, 18, 'step'), platform(1640, 390, 180, 18, 'step'), platform(2260, 328, 190, 18, 'step'), platform(2860, 300, 180, 18, 'goal-floor')],
    walls: [],
    springs: [],
    fans: [fan(1320, 230, 120, 210, 620, 'fan-3-4-a'), fan(2480, 210, 120, 220, 700, 'fan-3-4-b')],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 344), star('s2', 1700, 344), star('s3', 2350, 278)]
  },
  {
    id: '3-5',
    name: 'Moving Margin',
    starsTotal: 3,
    medalTargets: { goldTime: 42000, silverTime: 60000, goldJumps: 22, silverJumps: 38 },
    world: world(3200),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-3-5', 2960, 310),
    platforms: [ground(3200), platform(560, 390, 170, 18, 'step'), platform(1260, 310, 160, 18, 'landing'), platform(1860, 390, 180, 18, 'step'), platform(2900, 310, 180, 18, 'goal-floor')],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [movingPlatform(900, 350, 120, 18, 180, 'x', 1.5, 'moving-3-5-a'), movingPlatform(2300, 300, 120, 18, 140, 'y', 1.3, 'moving-3-5-b')],
    pickups: [],
    stars: [star('s1', 960, 300), star('s2', 1920, 344), star('s3', 2360, 246)]
  },
  {
    id: '4-1',
    name: 'Final Chapter Run',
    starsTotal: 3,
    medalTargets: { goldTime: 43000, silverTime: 62000, goldJumps: 22, silverJumps: 39 },
    world: world(3240),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-1', 3000, 300),
    platforms: [ground(3240), platform(540, 390, 180, 18, 'step'), platform(1040, 322, 180, 18, 'step'), platform(1580, 390, 180, 18, 'step'), platform(2140, 314, 180, 18, 'step'), platform(2940, 300, 180, 18, 'goal-floor')],
    walls: [],
    springs: [spring(1280, 438, 90, 22, 2.15, 'spring-4-1')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 640, 344), star('s2', 1340, 272), star('s3', 2190, 264)]
  },
  {
    id: '4-2',
    name: 'Mixed Signals',
    starsTotal: 3,
    medalTargets: { goldTime: 45000, silverTime: 64000, goldJumps: 23, silverJumps: 40 },
    world: world(3300),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-2', 3060, 280, 'b-4-2'),
    platforms: [ground(3300), platform(560, 390, 180, 18, 'step'), platform(1180, 312, 180, 18, 'step'), platform(1820, 390, 180, 18, 'fragile-floor', 'floor-4-2'), platform(2420, 320, 180, 18, 'step'), platform(3000, 280, 180, 18, 'goal-floor')],
    walls: [wall(1500, 180, 24, 210, 'sticky-wall')],
    springs: [spring(820, 438, 90, 22, 2.08, 'spring-4-2')],
    fans: [fan(2100, 210, 110, 210, 660, 'fan-4-2')],
    buttons: [button('b-4-2', 2460, 302)],
    fragileFloors: [fragileFloor('floor-4-2', 1820, 390, 180, 18)],
    movingPlatforms: [],
    pickups: [pickup('p-4-2', 'sticky', 1360, 360)],
    stars: [star('s1', 910, 352), star('s2', 1540, 228), star('s3', 2140, 274)]
  },
  {
    id: '4-3',
    name: 'Elastic Conveyor',
    starsTotal: 3,
    medalTargets: { goldTime: 47000, silverTime: 66000, goldJumps: 24, silverJumps: 42 },
    world: world(3360),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-3', 3120, 300),
    platforms: [ground(3360), platform(620, 390, 180, 18, 'step'), platform(1180, 320, 180, 18, 'step'), platform(1740, 390, 180, 18, 'step'), platform(2380, 300, 180, 18, 'step'), platform(3060, 300, 180, 18, 'goal-floor')],
    walls: [],
    springs: [spring(880, 438, 90, 22, 2.18, 'spring-4-3-a'), spring(2040, 438, 90, 22, 2.24, 'spring-4-3-b')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [movingPlatform(1440, 350, 120, 18, 160, 'x', 1.7, 'moving-4-3')],
    pickups: [pickup('p-4-3', 'elastic', 760, 360)],
    stars: [star('s1', 960, 280), star('s2', 1520, 300), star('s3', 2440, 252)]
  },
  {
    id: '4-4',
    name: 'Pressure Route',
    starsTotal: 3,
    medalTargets: { goldTime: 50000, silverTime: 70000, goldJumps: 25, silverJumps: 44 },
    world: world(3440),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-4', 3200, 292),
    platforms: [ground(3440), platform(560, 390, 180, 18, 'fragile-floor', 'floor-4-4-a'), platform(1220, 320, 180, 18, 'step'), platform(1860, 390, 180, 18, 'fragile-floor', 'floor-4-4-b'), platform(2500, 322, 180, 18, 'step'), platform(3140, 292, 180, 18, 'goal-floor')],
    walls: [],
    springs: [],
    fans: [fan(2040, 220, 120, 210, 700, 'fan-4-4')],
    buttons: [],
    fragileFloors: [fragileFloor('floor-4-4-a', 560, 390, 180, 18), fragileFloor('floor-4-4-b', 1860, 390, 180, 18)],
    movingPlatforms: [],
    pickups: [pickup('p-4-4', 'heavy', 980, 360)],
    stars: [star('s1', 640, 338), star('s2', 1930, 338), star('s3', 2570, 274)]
  },
  {
    id: '4-5',
    name: 'Door Into Night',
    starsTotal: 3,
    medalTargets: { goldTime: 52000, silverTime: 74000, goldJumps: 26, silverJumps: 46 },
    world: world(3520),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-4-5', 3280, 260, 'b-4-5'),
    platforms: [ground(3520), platform(560, 390, 180, 18, 'step'), platform(1160, 320, 180, 18, 'step'), platform(1760, 390, 180, 18, 'step'), platform(2380, 310, 180, 18, 'step'), platform(3000, 260, 180, 18, 'goal-floor'), platform(3240, 260, 120, 18, 'goal-floor')],
    walls: [wall(1490, 170, 24, 220, 'sticky-wall')],
    springs: [spring(860, 438, 90, 22, 2.22, 'spring-4-5')],
    fans: [fan(2100, 200, 120, 220, 720, 'fan-4-5')],
    buttons: [button('b-4-5', 3050, 242)],
    fragileFloors: [fragileFloor('floor-4-5', 1760, 390, 180, 18)],
    movingPlatforms: [movingPlatform(2640, 320, 120, 18, 170, 'x', 1.6, 'moving-4-5')],
    pickups: [pickup('p-4-5-a', 'sticky', 1360, 360), pickup('p-4-5-b', 'elastic', 2240, 272)],
    stars: [star('s1', 920, 344), star('s2', 1510, 220), star('s3', 2690, 260)]
  }
);

export const LEVELS = RAW_LEVELS.map(normalizeLevel);
```

- [ ] **Step 4: Run the focused level-data tests to verify they pass**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: PASS with all 20 stages present and every door floor-aligned.

- [ ] **Step 5: Commit the full 20-level campaign**

```bash
git add tests/level-data.test.js src/game/level-data.js
git commit -m "feat: add the full twenty-level side-scrolling campaign"
```

### Task 6: Update HUD, Results, Copy, and Mobile Touch-Control Layout

**Files:**
- Modify: `tests/render-helpers.test.js`
- Modify: `tests/mobile-layout.test.js`
- Modify: `src/ui/screens.js`
- Modify: `src/style.css`
- Modify: `src/i18n.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing UI and layout tests for touch controls and jump-based results**

```js
// append to tests/render-helpers.test.js:
  it('renders mobile touch controls inside the hud when requested', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 1 / 3',
      timeMs: 2500,
      settingsLabel: 'Settings',
      showTouchControls: true,
      jumpLabel: 'Jump',
      joystickOffsetX: 18,
      joystickOffsetY: -10
    });

    expect(root.querySelector('.hud-touch-controls')).toBeTruthy();
    expect(root.querySelector('.hud-touch-joystick__knob')?.getAttribute('style')).toContain('translate(18px, -10px)');
    expect(root.querySelector('[data-action="touch-jump"]')?.textContent).toContain('Jump');
  });

  it('renders jump counts instead of launches in the results screen', () => {
    const root = document.createElement('section');

    renderResultsScreen(root, {
      language: 'en',
      result: {
        medal: 'gold',
        jumps: 9,
        starsCollected: 3,
        timeMs: 8000
      },
      jumpsStatLabel: 'Jumps'
    });

    expect(root.textContent).toContain('Jumps');
    expect(root.textContent).toContain('9');
  });
```

```js
// append to tests/mobile-layout.test.js:
  it('defines bottom-corner touch controls for movement and jump', () => {
    expect(stylesheet).toContain('.hud-touch-controls');
    expect(stylesheet).toContain('.hud-touch-joystick');
    expect(stylesheet).toContain('.hud-touch-jump');
    expect(stylesheet).toMatch(/\.hud-touch-controls\s*\{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.hud-touch-joystick\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(stylesheet).toMatch(/\.hud-touch-jump\s*\{[^}]*pointer-events:\s*auto;/s);
  });
```

- [ ] **Step 2: Run the focused UI tests to verify they fail**

Run: `npm test -- --run tests/render-helpers.test.js tests/mobile-layout.test.js`  
Expected: FAIL because the HUD does not render touch controls and results still show launch terminology.

- [ ] **Step 3: Add HUD touch controls, jump copy, and bottom-corner control styling**

```js
// update renderHud() and renderResultsScreen() in src/ui/screens.js:
export function renderHud(root, model = {}) {
  const timeLabel = model.timeLabel || formatTimeMs(model.timeMs);
  const pauseLabel = model.paused ? model.resumeLabel || 'Resume' : model.pauseLabel || 'Pause';
  const backLabel = model.backLabel || 'Back to title';

  renderEmptyState(
    root,
    'hud',
    `
      <section class="hud-shell">
        ${renderOrientationBanner(model)}
        <div class="hud-status-bar">
          ${model.levelText ? `<span class="hud-chip">${escapeHtml(model.levelText)}</span>` : ''}
          ${model.starsText ? `<span class="hud-chip">${escapeHtml(model.starsText)}</span>` : ''}
          ${timeLabel ? `<span class="hud-chip">${escapeHtml(timeLabel)}</span>` : ''}
        </div>
        <div class="hud-settings-anchor">
          <button
            type="button"
            class="hud-settings-toggle"
            data-action="toggle-settings"
            aria-expanded="${model.hudMenuOpen ? 'true' : 'false'}"
          >
            ${escapeHtml(model.settingsLabel || 'Settings')}
          </button>
          ${
            model.hudMenuOpen
              ? `
                <div class="hud-settings-menu">
                  ${cardButton(pauseLabel, model.paused ? 'resume' : 'pause', ' data-secondary="true"')}
                  ${cardButton(model.retryLabel || 'Retry', 'retry', ' data-secondary="true"')}
                  ${cardButton(backLabel, 'back-to-title', ' data-secondary="true"')}
                  ${cardButton(model.soundToggleLabel || 'Sound', 'toggle-sound', ' data-secondary="true"')}
                </div>
              `
              : ''
          }
        </div>
        ${
          model.showTouchControls
            ? `
              <div class="hud-touch-controls">
                <div class="hud-touch-joystick" data-role="touch-joystick">
                  <div
                    class="hud-touch-joystick__knob"
                    style="transform: translate(${Number(model.joystickOffsetX ?? 0)}px, ${Number(model.joystickOffsetY ?? 0)}px)"
                  ></div>
                </div>
                <button type="button" class="hud-touch-jump" data-action="touch-jump">${escapeHtml(model.jumpLabel || 'Jump')}</button>
              </div>
            `
            : ''
        }
        ${
          model.overlayMessage
            ? `<p class="hud-center-message hud-center-message--${escapeHtml(model.overlayTone || 'info')}">${escapeHtml(model.overlayMessage)}</p>`
            : ''
        }
      </section>
    `
  );
}

export function renderResultsScreen(root, model = {}) {
  const result = model.result || model;
  const medal = result.medal || 'bronze';
  const timeLabel = result.timeLabel || formatTimeMs(result.timeMs);
  const summary = result.summary || model.summary || 'The door opened and the blob made it through.';

  renderEmptyState(
    root,
    'results',
    `
      <section class="screen screen-results">
        ${renderLanguageToggle(model)}
        ${renderOrientationBanner(model)}
        <p class="screen-eyebrow">${escapeHtml(model.eyebrow || 'Run complete')}</p>
        <h2 class="screen-section-title">${escapeHtml(model.title || 'Results')}</h2>
        <p class="results-medal">${escapeHtml(model.medalText || `Medal: ${medal}`)}</p>
        <ul class="screen-stats">
          ${listItem(model.timeStatLabel || 'Time', timeLabel || '--')}
          ${listItem(model.jumpsStatLabel || 'Jumps', Number.isFinite(result.jumps) ? String(result.jumps) : '--')}
          ${listItem(model.starsStatLabel || 'Stars', Number.isFinite(result.starsCollected) ? String(result.starsCollected) : '--')}
        </ul>
        <p class="screen-help">${escapeHtml(summary)}</p>
        <div class="screen-actions">
          ${cardButton(model.retryLabel || 'Retry', 'retry')}
          ${model.showNext ? cardButton(model.nextLabel || 'Next level', 'next-level', ' data-secondary="true"') : ''}
          ${cardButton(model.titleLabel || 'Back to title', 'back-to-title', ' data-secondary="true"')}
        </div>
      </section>
    `
  );
}
```

```css
/* append to src/style.css */
.hud-touch-controls {
  grid-column: 1 / -1;
  grid-row: 3;
  align-self: end;
  justify-self: stretch;
  display: flex;
  justify-content: space-between;
  align-items: end;
  pointer-events: none;
}

.hud-touch-joystick,
.hud-touch-jump {
  pointer-events: auto;
}

.hud-touch-joystick {
  width: 124px;
  height: 124px;
  border-radius: 50%;
  border: 3px solid var(--ink);
  background: rgba(255, 250, 239, 0.82);
  position: relative;
}

.hud-touch-joystick__knob {
  position: absolute;
  left: 36px;
  top: 36px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--sky);
  border: 3px solid var(--ink);
}

.hud-touch-jump {
  min-width: 108px;
  min-height: 108px;
  border: 3px solid var(--ink);
  border-radius: 50%;
  background: var(--peach);
  font-weight: 800;
  box-shadow: 0 6px 0 rgba(53, 37, 18, 0.16);
}
```

```js
// update the relevant English keys in src/i18n.js and mirror them in zh:
common: {
  language: 'Language',
  backToTitle: 'Back to title',
  retry: 'Retry',
  nextLevel: 'Next level',
  time: 'Time',
  jumps: 'Jumps',
  stars: 'Stars',
  medal: 'Medal',
  landscapeRecommended: 'Landscape recommended'
},
title: {
  // ...
  help: 'Move, jump, collect every star, and reach the door.'
},
hud: {
  level: 'Level {level}',
  starsProgress: 'Stars {count} / {total}',
  settings: 'Settings',
  soundOn: 'Sound: on',
  soundOff: 'Sound: off',
  back: 'Back',
  pause: 'Pause',
  resume: 'Resume',
  failedCenter: 'Fell out. Retry and go again.',
  starsMissing: '{count} star left',
  jump: 'Jump',
  microcopy: 'A/D or arrows to move. Space to jump.'
}
```

```js
// update renderUi() model wiring in src/main.js:
  const isTouchUi =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;

  renderResultsScreen(uiRoot, {
    language: currentLanguage(),
    languages: languageOptions,
    languageLabel: copy('common.language'),
    orientationHint,
    eyebrow: copy('results.eyebrow'),
    title: copy('results.title'),
    medalText: `${copy('common.medal')}: ${medalLabel}`,
    timeStatLabel: copy('common.time'),
    jumpsStatLabel: copy('common.jumps'),
    starsStatLabel: copy('common.stars'),
    result,
    retryLabel: copy('common.retry'),
    nextLabel: copy('common.nextLevel'),
    titleLabel: copy('common.backToTitle'),
    showNext: appState.selectedLevel < getUnlockedMaxIndex(),
    summary: copy('results.summary')
  });

  renderHud(uiRoot, {
    orientationHint,
    levelText: copy('hud.level', { level: session.level.id }),
    starsText: copy('hud.starsProgress', {
      count: session.runtime.collectedStarIds.length,
      total: session.level.starsTotal
    }),
    timeMs: session.elapsedMs,
    paused,
    pauseLabel: copy('hud.pause'),
    resumeLabel: copy('hud.resume'),
    retryLabel: copy('common.retry'),
    backLabel: copy('hud.back'),
    soundToggleLabel: appState.soundEnabled ? copy('hud.soundOn') : copy('hud.soundOff'),
    settingsLabel: copy('hud.settings'),
    hudMenuOpen,
    overlayMessage: overlayMessage?.text ?? null,
    overlayTone: overlayMessage?.tone ?? 'info',
    showTouchControls: isTouchUi,
    jumpLabel: copy('hud.jump'),
    joystickOffsetX: inputState.joystick.knob.x,
    joystickOffsetY: inputState.joystick.knob.y
  });
```

- [ ] **Step 4: Run the focused UI tests to verify they pass**

Run: `npm test -- --run tests/render-helpers.test.js tests/mobile-layout.test.js`  
Expected: PASS with touch-control markup and result-stat language fully updated.

- [ ] **Step 5: Commit the HUD, copy, and touch-control UI changes**

```bash
git add tests/render-helpers.test.js tests/mobile-layout.test.js src/ui/screens.js src/style.css src/i18n.js src/main.js
git commit -m "feat: add touch controls and jump-based ui copy"
```

### Task 7: Wire Keyboard/Touch Gameplay in `main.js`, Raise Audio Another 30%, and Verify the Build

**Files:**
- Modify: `tests/audio.test.js`
- Modify: `src/game/audio.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing audio test thresholds for the extra 30% gain bump**

```js
// replace tests/audio.test.js with:
import { describe, expect, it } from 'vitest';
import { AUDIO_PRESETS } from '../src/game/audio.js';

describe('audio presets', () => {
  it('keeps the main gameplay cues noticeably louder than the current mix at full volume', () => {
    expect(AUDIO_PRESETS.boing.gain).toBeGreaterThan(0.09);
    expect(AUDIO_PRESETS.pickup.gain).toBeGreaterThan(0.067);
    expect(AUDIO_PRESETS.win.gain).toBeGreaterThan(0.118);
    expect(AUDIO_PRESETS.fail.gain).toBeGreaterThan(0.101);
  });

  it('defines a dedicated failure cue', () => {
    expect(AUDIO_PRESETS.fail).toMatchObject({
      startHz: expect.any(Number),
      endHz: expect.any(Number),
      duration: expect.any(Number),
      gain: expect.any(Number)
    });
  });
});
```

- [ ] **Step 2: Run the focused audio tests to verify they fail**

Run: `npm test -- --run tests/audio.test.js`  
Expected: FAIL because the current gains are still at the previous louder mix.

- [ ] **Step 3: Finish `main.js` input wiring and apply the final audio gain bump**

```js
// replace the old pointer drag imports and add camera usage in src/main.js:
import {
  beginJumpTouch,
  beginJoystick,
  createInputState,
  endJumpTouch,
  endJoystick,
  markJumpConsumed,
  setJumpPressed,
  setKeyboardDirection,
  updateJoystick
} from './game/input.js';
import { createCameraState, updateCamera } from './game/render/camera.js';

let camera = createCameraState();

window.addEventListener('keydown', (event) => {
  if (event.key === 'a' || event.key === 'ArrowLeft') {
    inputState = setKeyboardDirection(inputState, 'left', true);
  }
  if (event.key === 'd' || event.key === 'ArrowRight') {
    inputState = setKeyboardDirection(inputState, 'right', true);
  }
  if (event.key === ' ' || event.key === 'Spacebar') {
    inputState = setJumpPressed(inputState, true);
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'a' || event.key === 'ArrowLeft') {
    inputState = setKeyboardDirection(inputState, 'left', false);
  }
  if (event.key === 'd' || event.key === 'ArrowRight') {
    inputState = setKeyboardDirection(inputState, 'right', false);
  }
  if (event.key === ' ' || event.key === 'Spacebar') {
    inputState = setJumpPressed(inputState, false);
    event.preventDefault();
  }
});

uiRoot.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.hud-touch-jump')) {
    inputState = beginJumpTouch(inputState, event.pointerId);
    event.preventDefault();
    return;
  }

  const stick = event.target.closest('.hud-touch-joystick');
  if (stick) {
    const rect = stick.getBoundingClientRect();
    inputState = beginJoystick(inputState, event.pointerId, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    inputState = updateJoystick(inputState, {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    });
    event.preventDefault();
  }
});

uiRoot.addEventListener('pointermove', (event) => {
  if (inputState.joystick.pointerId === event.pointerId) {
    inputState = updateJoystick(inputState, {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    });
  }
});

uiRoot.addEventListener('pointerup', (event) => {
  inputState = endJoystick(inputState, event.pointerId);
  inputState = endJumpTouch(inputState, event.pointerId);
});

// inside frame():
  if (appState.screen === 'playing') {
    camera = updateCamera(camera, session.blob, session.level, { width: canvas.width, height: canvas.height }, dt);
  } else {
    camera = createCameraState();
  }

  if (appState.screen === 'playing' && !paused) {
    const previousSession = session;
    session = stepGameSession(session, {
      dt,
      input: inputState
    });
    handleSessionEvents(previousSession);
    renderUi();
    inputState = markJumpConsumed(inputState);
  }

// in renderWorld():
  renderFrame(ctx, {
    width: canvas.width,
    height: canvas.height,
    level: session.level,
    runtime: session.runtime,
    blob: { ...session.blob, skinId: appState.skinId, status: session.status },
    effects,
    hint:
      appState.screen === 'title'
        ? copy('world.title')
        : appState.screen === 'level-select'
          ? copy('world.levelSelect')
          : appState.screen === 'skin-picker'
            ? copy('world.skinPicker')
            : null,
    status: session.status,
    camera
  });
```

```js
// raise gains in src/game/audio.js:
export const AUDIO_PRESETS = {
  boing: { startHz: 210, endHz: 340, duration: 0.11, gain: 0.094, type: 'sine' },
  pickup: { startHz: 520, endHz: 760, duration: 0.09, gain: 0.068, type: 'triangle' },
  win: { startHz: 440, endHz: 880, duration: 0.22, gain: 0.118, type: 'triangle' },
  fail: { startHz: 280, endHz: 120, duration: 0.28, gain: 0.101, type: 'sawtooth' }
};
```

- [ ] **Step 4: Run targeted and full verification**

Run: `npm test -- --run tests/audio.test.js tests/input.test.js tests/blob.test.js tests/game-session.test.js tests/camera.test.js tests/level-data.test.js tests/render-helpers.test.js tests/mobile-layout.test.js tests/scoring.test.js tests/storage.test.js tests/store.test.js`  
Expected: PASS with all focused platformer migration tests green.

Run: `npm test -- --run`  
Expected: PASS with the full suite green.

Run: `npm run build`  
Expected: PASS and emit a production bundle without build errors.

- [ ] **Step 5: Commit the main-loop integration and audio bump**

```bash
git add tests/audio.test.js src/game/audio.js src/main.js
git commit -m "feat: ship platformer controls camera and louder audio"
```

## Self-Review Checklist

- Spec coverage:
  - unified keyboard + touch move/jump controls: Tasks 1, 6, 7
  - jump-based runtime and results: Tasks 2, 6
  - horizontal-only camera follow: Tasks 3, 7
  - 20 long authored levels: Tasks 4, 5
  - floor-aligned doors: Tasks 4, 5
  - stronger `2-2`: Task 4
  - +30% audio increase: Task 7
- Placeholder scan:
  - no temporary markers or deferred implementation gaps remain
- Type consistency:
  - runtime/stat vocabulary uses `jumps` consistently
  - medal targets use `goldJumps` / `silverJumps`
  - camera helper exports `createCameraState` and `updateCamera`
