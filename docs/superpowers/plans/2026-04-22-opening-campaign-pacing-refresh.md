# Opening Campaign Pacing Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the blocked spring in level `1-3` and re-author levels `1-1` through `2-5` so the opening campaign teaches more varied traversal beats without changing runtime systems.

**Architecture:** Keep the runtime, physics, camera, scoring, and HUD untouched. Limit the work to authored level geometry in `src/game/level-data.js` plus data-oriented regressions in `tests/level-data.test.js`. Use TDD to lock in the blocked-spring bug and the early-campaign pacing targets before editing level data.

**Tech Stack:** Vite, vanilla JavaScript, Vitest

---

## Planned File Structure

- `tests/level-data.test.js`: campaign structure regressions, `1-3` spring accessibility checks, and opening-chapter pacing assertions
- `src/game/level-data.js`: authored level data for `1-1` through `2-5`, preserving helper functions and later chapters unchanged

### Task 1: Add Failing Regressions for `1-3` Accessibility and Opening-Chapter Variety

**Files:**
- Modify: `tests/level-data.test.js`

- [ ] **Step 1: Replace the level-data test file with spring-clearance and pacing regressions**

```js
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

function overlapsX(a, b) {
  return a.x + a.width > b.x && a.x < b.x + b.width;
}

function overlapWidth(a, b) {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
}

function findLevel(id) {
  return LEVELS.find((level) => level.id === id);
}

function hasBlockingPlatformAbove(level, springRect) {
  return (level.platforms ?? []).some((platform) => {
    if (platform.type === 'ground') {
      return false;
    }

    return (
      overlapsX(platform, springRect) &&
      platform.y < springRect.y &&
      platform.y + platform.height >= springRect.y
    );
  });
}

function hasSpringRunway(level, springRect) {
  return (level.platforms ?? []).some((platform) => {
    return (
      platform.x < springRect.x &&
      platform.x + platform.width >= springRect.x - 90 &&
      platform.y >= springRect.y - 60
    );
  });
}

function hasSpringLanding(level, springRect) {
  return (level.platforms ?? []).some((platform) => {
    return (
      platform.x >= springRect.x + springRect.width + 100 &&
      platform.x <= springRect.x + 520 &&
      platform.y <= springRect.y - 90
    );
  });
}

function hasParallelLanes(level) {
  const platforms = (level.platforms ?? []).filter((platform) => {
    return platform.type !== 'ground' && platform.type !== 'goal-floor';
  });

  return platforms.some((platform, index) => {
    return platforms.slice(index + 1).some((other) => {
      return overlapWidth(platform, other) >= 80 && Math.abs(platform.y - other.y) >= 70;
    });
  });
}

function longestNonGoalPlatform(level) {
  return Math.max(
    0,
    ...(level.platforms ?? [])
      .filter((platform) => platform.type !== 'ground' && platform.type !== 'goal-floor')
      .map((platform) => platform.width)
  );
}

function openingIdentity(level) {
  if ((level.fans ?? []).length > 0) {
    return 'fan-route';
  }

  if ((level.buttons ?? []).length > 0) {
    return 'button-route';
  }

  if (hasParallelLanes(level)) {
    return 'split-route';
  }

  if (longestNonGoalPlatform(level) >= 280) {
    return 'long-ground';
  }

  if ((level.springs ?? []).length >= 2) {
    return 'multi-spring';
  }

  if ((level.springs ?? []).length === 1) {
    return 'spring-route';
  }

  return 'plain-platforming';
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

  it('keeps level 1-3 spring clear of blocking overhead platforms', () => {
    const springIntro = findLevel('1-3');
    const springRect = springIntro.springs[0];

    expect(hasBlockingPlatformAbove(springIntro, springRect)).toBe(false);
    expect(hasSpringRunway(springIntro, springRect)).toBe(true);
    expect(hasSpringLanding(springIntro, springRect)).toBe(true);
  });

  it('retunes level 2-2 around a stronger spring-assisted route', () => {
    const springPen = findLevel('2-2');

    expect(springPen.springs[0]).toMatchObject({
      boost: 2.35,
      launchBoost: 987
    });
    expect(springPen.world.width).toBeGreaterThanOrEqual(2320);
    expect(hasSupportingPlatform(springPen, springPen.door)).toBe(true);
  });

  it('gives the opening ten levels a broader mix of route identities', () => {
    const identities = LEVELS.slice(0, 10).map((level) => openingIdentity(level));

    expect(new Set(identities)).toEqual(
      expect.setContaining([
        'split-route',
        'spring-route',
        'button-route',
        'long-ground',
        'multi-spring',
        'fan-route'
      ])
    );
    expect(identities.filter((identity) => identity === 'plain-platforming')).toHaveLength(1);
    expect(identities.filter((identity) => identity === 'spring-route').length).toBeLessThanOrEqual(2);
  });

  it('expands the campaign to twenty authored levels', () => {
    expect(LEVELS).toHaveLength(20);
    LEVELS.forEach((level) => {
      expect(level.world.width).toBeGreaterThanOrEqual(2160);
      expect(hasSupportingPlatform(level, level.door)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run the focused level-data tests to verify the new regressions fail**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: FAIL because `1-3` still has a blocking platform flush with the spring top, `1-2` is not a true split-route stage, and the first ten levels still over-cluster around plain platforming and spring-only layouts.

- [ ] **Step 3: Commit the new failing regression coverage**

```bash
git add tests/level-data.test.js
git commit -m "test: lock in opening campaign pacing regressions"
```

### Task 2: Re-author Chapter 1 Around Distinct Early-Game Beats

**Files:**
- Modify: `src/game/level-data.js`

- [ ] **Step 1: Replace the `1-1` through `1-5` entries in `RAW_LEVELS` with the refreshed chapter-one layouts**

```js
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
      platform(320, 402, 150, 18, 'step'),
      platform(610, 346, 170, 18, 'step'),
      platform(960, 392, 190, 18, 'step'),
      platform(1340, 334, 180, 18, 'step'),
      platform(1720, 392, 180, 18, 'step'),
      platform(1980, 460, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 410, 354), star('s2', 1430, 286), star('s3', 1850, 354)]
  },
  {
    id: '1-2',
    name: 'Three Lanes',
    starsTotal: 3,
    medalTargets: { goldTime: 24000, silverTime: 36000, goldJumps: 12, silverJumps: 20 },
    world: world(2360),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-2', 2170, 360),
    platforms: [
      ground(2360),
      platform(300, 404, 220, 18, 'low-lane'),
      platform(360, 316, 180, 18, 'high-lane'),
      platform(690, 404, 220, 18, 'low-lane'),
      platform(760, 256, 190, 18, 'high-lane'),
      platform(1080, 350, 200, 18, 'mid-lane'),
      platform(1430, 294, 210, 18, 'high-lane'),
      platform(1500, 414, 220, 18, 'low-lane'),
      platform(2120, 360, 150, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 450, 268), star('s2', 1180, 302), star('s3', 1540, 246)]
  },
  {
    id: '1-3',
    name: 'Spring Intro',
    starsTotal: 3,
    medalTargets: { goldTime: 23000, silverTime: 35000, goldJumps: 12, silverJumps: 22 },
    world: world(2320),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-3', 2140, 332),
    platforms: [
      ground(2320),
      platform(420, 396, 220, 18, 'approach'),
      platform(980, 318, 220, 18, 'landing'),
      platform(1380, 378, 180, 18, 'recovery'),
      platform(1760, 304, 180, 18, 'step'),
      platform(2080, 332, 160, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(690, 438, 96, 22, 1.85, 'spring-1-3')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 748, 360), star('s2', 1090, 270), star('s3', 1840, 256)]
  },
  {
    id: '1-4',
    name: 'Button Jog',
    starsTotal: 3,
    medalTargets: { goldTime: 26000, silverTime: 38000, goldJumps: 14, silverJumps: 24 },
    world: world(2420),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-4', 2230, 382, 'b-1-4'),
    platforms: [
      ground(2420),
      platform(460, 408, 220, 18, 'button-bay'),
      platform(900, 336, 190, 18, 'step'),
      platform(1320, 392, 220, 18, 'return-deck'),
      platform(1740, 318, 180, 18, 'step'),
      platform(2180, 382, 170, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-1-4', 560, 390)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 360), star('s2', 1420, 344), star('s3', 1810, 270)]
  },
  {
    id: '1-5',
    name: 'First Long Push',
    starsTotal: 3,
    medalTargets: { goldTime: 28000, silverTime: 42000, goldJumps: 15, silverJumps: 26 },
    world: world(2560),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-1-5', 2350, 460),
    platforms: [
      ground(2560),
      platform(340, 408, 320, 18, 'runway'),
      platform(860, 356, 180, 18, 'step'),
      platform(1180, 408, 320, 18, 'runway'),
      platform(1890, 312, 220, 18, 'upper'),
      platform(2300, 460, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1620, 438, 100, 22, 1.96, 'spring-1-5')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 560, 360), star('s2', 1670, 360), star('s3', 1990, 264)]
  },
```

- [ ] **Step 2: Run the focused level-data tests to verify chapter-one changes clear the `1-3` bug but still expose remaining chapter-two failures**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: FAIL, but now the failure should only point at the missing chapter-two pacing targets rather than the old `1-3` blocked-spring geometry.

- [ ] **Step 3: Commit the chapter-one refresh**

```bash
git add src/game/level-data.js
git commit -m "feat: refresh chapter one campaign pacing"
```

### Task 3: Re-author Chapter 2 to Broaden Mechanic Identity Without Runtime Changes

**Files:**
- Modify: `src/game/level-data.js`

- [ ] **Step 1: Replace the `2-1` through `2-5` entries in `RAW_LEVELS` with the refreshed chapter-two layouts**

```js
  {
    id: '2-1',
    name: 'Twin Springs',
    starsTotal: 3,
    medalTargets: { goldTime: 30000, silverTime: 44000, goldJumps: 16, silverJumps: 28 },
    world: world(2660),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-1', 2430, 340),
    platforms: [
      ground(2660),
      platform(460, 412, 200, 18, 'spring-ledge'),
      platform(880, 334, 180, 18, 'landing'),
      platform(1280, 412, 220, 18, 'spring-ledge'),
      platform(1760, 300, 220, 18, 'upper'),
      platform(2380, 340, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [
      spring(520, 438, 92, 22, 1.95, 'spring-2-1-a'),
      spring(1370, 438, 92, 22, 2.05, 'spring-2-1-b')
    ],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 580, 356), star('s2', 1450, 356), star('s3', 1870, 252)]
  },
  {
    id: '2-2',
    name: 'Spring Pen',
    starsTotal: 3,
    medalTargets: { goldTime: 29000, silverTime: 43000, goldJumps: 15, silverJumps: 26 },
    world: world(2400),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-2', 2140, 264),
    platforms: [
      ground(2400),
      platform(450, 414, 220, 18, 'runway'),
      platform(980, 318, 220, 18, 'landing'),
      platform(1500, 236, 220, 18, 'upper'),
      platform(2080, 264, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(600, 438, 104, 22, 2.35, 'spring-2-2')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 680, 360), star('s2', 1600, 188), star('s3', 2150, 216)]
  },
  {
    id: '2-3',
    name: 'Fan Ribbon',
    starsTotal: 3,
    medalTargets: { goldTime: 32000, silverTime: 47000, goldJumps: 17, silverJumps: 30 },
    world: world(2720),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-3', 2500, 300),
    platforms: [
      ground(2720),
      platform(420, 400, 200, 18, 'approach'),
      platform(860, 388, 190, 18, 'setup'),
      platform(1520, 410, 200, 18, 'fan-entry'),
      platform(1980, 320, 190, 18, 'fan-landing'),
      platform(2440, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1080, 438, 90, 22, 1.88, 'spring-2-3')],
    fans: [fan(1700, 210, 130, 220, 660, 'fan-2-3')],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 520, 352), star('s2', 1130, 360), star('s3', 2050, 272)]
  },
  {
    id: '2-4',
    name: 'Door Relay',
    starsTotal: 3,
    medalTargets: { goldTime: 33000, silverTime: 48000, goldJumps: 18, silverJumps: 30 },
    world: world(2840),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-4', 2590, 352, 'b-2-4'),
    platforms: [
      ground(2840),
      platform(520, 400, 180, 18, 'start-rise'),
      platform(960, 320, 180, 18, 'step'),
      platform(1400, 248, 220, 18, 'button-perch'),
      platform(1760, 392, 220, 18, 'return'),
      platform(2140, 324, 180, 18, 'step'),
      platform(2530, 352, 200, 18, 'goal-floor')
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-2-4', 1470, 230)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 610, 350), star('s2', 1510, 200), star('s3', 2220, 276)]
  },
  {
    id: '2-5',
    name: 'Chapter Stretch',
    starsTotal: 3,
    medalTargets: { goldTime: 36000, silverTime: 52000, goldJumps: 19, silverJumps: 33 },
    world: world(3000),
    spawn: { x: 140, y: 408 },
    door: floorDoor('door-2-5', 2760, 300),
    platforms: [
      ground(3000),
      platform(340, 406, 340, 18, 'runway'),
      platform(900, 352, 190, 18, 'landing'),
      platform(1260, 406, 300, 18, 'runway'),
      platform(1960, 286, 220, 18, 'upper'),
      platform(2360, 358, 190, 18, 'descent'),
      platform(2700, 300, 180, 18, 'goal-floor')
    ],
    walls: [],
    springs: [spring(1640, 438, 100, 22, 2.08, 'spring-2-5')],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 520, 358), star('s2', 1690, 360), star('s3', 2450, 310)]
  },
```

- [ ] **Step 2: Run the focused level-data tests to verify the refreshed opening campaign passes**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: PASS with 7 passing tests in `tests/level-data.test.js`.

- [ ] **Step 3: Commit the chapter-two refresh**

```bash
git add src/game/level-data.js
git commit -m "feat: refresh chapter two campaign pacing"
```

### Task 4: Run Verification and Land the Focused Campaign Fix

**Files:**
- Verify: `tests/level-data.test.js`
- Verify: `src/game/level-data.js`

- [ ] **Step 1: Re-run the focused regression suite**

Run: `npm test -- --run tests/level-data.test.js tests/game-session.test.js`  
Expected: PASS. `tests/level-data.test.js` proves the new geometry and pacing rules. `tests/game-session.test.js` confirms the authored changes did not break existing gameplay assumptions around level completion and door gating.

- [ ] **Step 2: Run the full test suite**

Run: `npm test -- --run`  
Expected: PASS with the full suite green.

- [ ] **Step 3: Run the production build**

Run: `npm run build`  
Expected: PASS and emit a production bundle without build errors.

- [ ] **Step 4: Commit the verified opening-campaign fix**

```bash
git add tests/level-data.test.js src/game/level-data.js
git commit -m "fix: refresh opening campaign pacing"
```

## Self-Review Checklist

- Spec coverage:
  - `1-3` spring is fixed by geometry, not runtime logic: Tasks 1, 2
  - opening chapters gain distinct traversal beats: Tasks 1, 2, 3
  - existing 20-level campaign structure remains intact: Tasks 1, 4
  - new regressions catch blocked springs and overly repetitive pacing: Task 1
- Placeholder scan:
  - no deferred implementation markers remain
  - every code-changing step includes an explicit code block
- Type consistency:
  - helper names in the tests (`hasBlockingPlatformAbove`, `openingIdentity`) are used consistently
  - level ids `1-1` through `2-5` stay unchanged across tests and data updates
  - `2-2` still uses `boost: 2.35` and `launchBoost: 987`
