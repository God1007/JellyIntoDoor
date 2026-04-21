# Doodle Blob: Escape to the Door Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished single-page browser mini-game where a squishy blob reaches a happy door through 10 short doodle puzzle levels, with touch/mouse controls, progression, collectibles, medals, skins, and strong casual-game feel.

**Architecture:** Use Vite with plain JavaScript, one Canvas-based game surface, and a DOM overlay for menus and HUD chrome. Keep gameplay logic in small pure modules that are easy to unit test, then compose them through a session controller that feeds rendering, UI, storage, and audio.

**Tech Stack:** Vite, vanilla JavaScript, HTML5 Canvas, CSS, Vitest, localStorage, Web Audio API

---

## Context Notes

- The workspace is currently **not** a Git repository. `git status` fails today.
- If you want milestone commits while executing this plan, run `git init` before Task 1.
- The plan assumes a normal local install flow: `npm install`, `npm run dev`, `npm test`, `npm run build`.

## Planned File Structure

- `package.json`: scripts and dev dependencies
- `vite.config.js`: Vite + Vitest configuration
- `index.html`: app root and meta tags
- `src/main.js`: application bootstrap and main loop wiring
- `src/style.css`: global paper, UI, and responsive styles
- `src/app/store.js`: app-mode state transitions for title/select/play/results
- `src/storage.js`: localStorage profile persistence
- `src/game/game.js`: session controller tying level, blob, UI, and rendering together
- `src/game/level-data.js`: all 10 level definitions, medal thresholds, unlock metadata
- `src/game/scoring.js`: medal, star, and completion calculations
- `src/game/blob.js`: blob state, launch math, deformation, and expression logic
- `src/game/physics.js`: collision helpers, surfaces, and integration steps
- `src/game/input.js`: pointer/touch drag handling and launch state
- `src/game/level-runtime.js`: buttons, door logic, pickups, hazards, and per-frame level state
- `src/game/effects.js`: particles, impact rings, doodle lines, floating feedback text
- `src/game/audio.js`: lightweight audio manager and mute handling
- `src/game/render/doodle.js`: hand-drawn shape helpers and palette utilities
- `src/game/render/canvas-renderer.js`: canvas drawing for world, blob, effects, and goal door
- `src/ui/screens.js`: title, level select, results, and skin picker DOM rendering
- `tests/store.test.js`: app state transitions
- `tests/scoring.test.js`: medal and progression rules
- `tests/storage.test.js`: persistence merge and unlock storage
- `tests/blob.test.js`: launch and deformation math
- `tests/input.test.js`: pointer drag translation into launch intent
- `tests/level-runtime.test.js`: buttons, pickups, collectibles, and doors
- `tests/render-helpers.test.js`: palette jitter and blob expression helpers
- `tests/game-session.test.js`: session composition smoke coverage

### Task 1: Bootstrap Tooling and App Shell

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/style.css`
- Create: `src/app/store.js`
- Test: `tests/store.test.js`

- [ ] **Step 1: Create the project tooling files**

```json
{
  "name": "doodle-blob-escape-to-the-door",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "vitest": "^3.0.0",
    "jsdom": "^26.0.0"
  }
}
```

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js']
  }
});
```

```html
<!-- index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>涂鸦团子：冲进门里！</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`  
Expected: installs `vite`, `vitest`, and `jsdom` with no audit-blocking failure

- [ ] **Step 3: Write the failing store test**

```js
// tests/store.test.js
import { describe, expect, it } from 'vitest';
import { createInitialAppState, reduceAppState } from '../src/app/store.js';

describe('app store', () => {
  it('starts on the title screen with sound enabled', () => {
    expect(createInitialAppState()).toMatchObject({
      screen: 'title',
      soundEnabled: true,
      selectedLevel: 0
    });
  });

  it('moves from title to level select', () => {
    const next = reduceAppState(createInitialAppState(), { type: 'OPEN_LEVEL_SELECT' });
    expect(next.screen).toBe('level-select');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- --run tests/store.test.js`  
Expected: FAIL with `Cannot find module '../src/app/store.js'` or missing exported members

- [ ] **Step 5: Write the minimal app shell implementation**

```js
// src/app/store.js
export function createInitialAppState() {
  return {
    screen: 'title',
    selectedLevel: 0,
    soundEnabled: true,
    skinId: 'peach'
  };
}

export function reduceAppState(state, action) {
  if (action.type === 'OPEN_LEVEL_SELECT') {
    return { ...state, screen: 'level-select' };
  }

  return state;
}
```

```js
// src/main.js
import './style.css';
import { createInitialAppState } from './app/store.js';

const app = document.querySelector('#app');
const state = createInitialAppState();

app.innerHTML = `
  <main class="app-shell">
    <section class="paper-panel">
      <p class="eyebrow">Doodle Blob: Escape to the Door</p>
      <h1>涂鸦团子：冲进门里！</h1>
      <p class="subtitle">把软乎乎的团子弹进快乐小门里。</p>
      <button class="ink-button">开始冒险</button>
      <p class="debug-line">当前界面：${state.screen}</p>
    </section>
  </main>
`;
```

```css
/* src/style.css */
:root {
  color-scheme: light;
  --paper: #f9f1dc;
  --paper-shadow: #e4d4ad;
  --ink: #43331f;
  --peach: #ffb385;
  --sky: #79c5ff;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top, #fff7e7 0%, var(--paper) 58%, #f2e0b4 100%);
  color: var(--ink);
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.paper-panel {
  width: min(92vw, 720px);
  padding: 32px;
  border: 4px solid var(--ink);
  border-radius: 28px;
  background: rgba(255, 252, 244, 0.88);
  box-shadow: 0 16px 0 var(--paper-shadow);
  text-align: center;
}

.eyebrow { margin: 0 0 8px; color: #7b5d2d; }
.subtitle { margin: 0 0 24px; }

.ink-button {
  border: 3px solid var(--ink);
  background: var(--peach);
  border-radius: 999px;
  padding: 12px 20px;
  font: inherit;
  cursor: pointer;
}
```

- [ ] **Step 6: Run the store test to verify it passes**

Run: `npm test -- --run tests/store.test.js`  
Expected: PASS with 2 tests passing

- [ ] **Step 7: Verify the shell loads in the browser**

Run: `npm run dev`  
Expected: the title panel renders with the Chinese title, a start button, and a debug line

- [ ] **Step 8: Commit the bootstrap milestone if Git is initialized**

```bash
git add package.json vite.config.js index.html src/main.js src/style.css src/app/store.js tests/store.test.js
git commit -m "chore: bootstrap doodle blob app shell"
```

### Task 2: Define Progression, Level Data, and Persistence

**Files:**
- Create: `src/game/level-data.js`
- Create: `src/game/scoring.js`
- Create: `src/storage.js`
- Test: `tests/scoring.test.js`
- Test: `tests/storage.test.js`

- [ ] **Step 1: Write the failing scoring and storage tests**

```js
// tests/scoring.test.js
import { describe, expect, it } from 'vitest';
import { evaluateRun, unlocksNextLevel } from '../src/game/scoring.js';

describe('scoring', () => {
  it('awards gold when time, launches, and stars all hit the top threshold', () => {
    const result = evaluateRun(
      { medalTargets: { goldTime: 9000, silverTime: 15000, goldLaunches: 3, silverLaunches: 5 }, starsTotal: 3 },
      { timeMs: 8200, launches: 3, starsCollected: 3 }
    );

    expect(result).toMatchObject({ medal: 'gold', perfect: true });
  });

  it('unlocks the next level after any successful completion', () => {
    expect(unlocksNextLevel(2, { completed: true }, 10)).toBe(3);
  });
});
```

```js
// tests/storage.test.js
import { describe, expect, it } from 'vitest';
import { createDefaultProfile, mergeLevelResult } from '../src/storage.js';

describe('storage profile', () => {
  it('starts with the first level unlocked and peach skin selected', () => {
    expect(createDefaultProfile()).toMatchObject({
      unlockedLevelIndex: 0,
      selectedSkin: 'peach'
    });
  });

  it('keeps the best time and highest medal when merging repeat results', () => {
    const profile = createDefaultProfile();
    const afterFirst = mergeLevelResult(profile, 0, { completed: true, timeMs: 14000, launches: 4, starsCollected: 2, medal: 'silver' });
    const afterSecond = mergeLevelResult(afterFirst, 0, { completed: true, timeMs: 10000, launches: 5, starsCollected: 3, medal: 'gold' });

    expect(afterSecond.levels[0]).toMatchObject({
      bestTimeMs: 10000,
      starsCollected: 3,
      medal: 'gold'
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --run tests/scoring.test.js tests/storage.test.js`  
Expected: FAIL because `src/game/scoring.js` and `src/storage.js` do not exist

- [ ] **Step 3: Write the progression data and persistence modules**

```js
// src/game/scoring.js
const MEDAL_RANK = { none: 0, bronze: 1, silver: 2, gold: 3 };

export function evaluateRun(level, stats) {
  const { goldTime, silverTime, goldLaunches, silverLaunches } = level.medalTargets;
  const meetsGold = stats.timeMs <= goldTime && stats.launches <= goldLaunches && stats.starsCollected === level.starsTotal;
  const meetsSilver = stats.timeMs <= silverTime && stats.launches <= silverLaunches;

  if (meetsGold) {
    return { ...stats, medal: 'gold', perfect: true, completed: true };
  }

  if (meetsSilver) {
    return { ...stats, medal: 'silver', perfect: false, completed: true };
  }

  return { ...stats, medal: 'bronze', perfect: false, completed: true };
}

export function pickBetterMedal(current, incoming) {
  return MEDAL_RANK[incoming] > MEDAL_RANK[current] ? incoming : current;
}

export function unlocksNextLevel(currentIndex, result, levelCount) {
  if (!result.completed) return currentIndex;
  return Math.min(currentIndex + 1, levelCount - 1);
}
```

```js
// src/storage.js
import { pickBetterMedal } from './game/scoring.js';

export const STORAGE_KEY = 'doodle-blob-save-v1';

export function createDefaultProfile() {
  return {
    unlockedLevelIndex: 0,
    selectedSkin: 'peach',
    soundEnabled: true,
    levels: {}
  };
}

export function mergeLevelResult(profile, levelIndex, result) {
  const previous = profile.levels[levelIndex] ?? { bestTimeMs: null, bestLaunches: null, starsCollected: 0, medal: 'none' };

  return {
    ...profile,
    unlockedLevelIndex: Math.max(profile.unlockedLevelIndex, levelIndex + (result.completed ? 1 : 0)),
    levels: {
      ...profile.levels,
      [levelIndex]: {
        bestTimeMs: previous.bestTimeMs === null ? result.timeMs : Math.min(previous.bestTimeMs, result.timeMs),
        bestLaunches: previous.bestLaunches === null ? result.launches : Math.min(previous.bestLaunches, result.launches),
        starsCollected: Math.max(previous.starsCollected, result.starsCollected),
        medal: pickBetterMedal(previous.medal, result.medal)
      }
    }
  };
}
```

```js
// src/game/level-data.js
export const SKINS = [
  { id: 'peach', name: '桃桃团', color: '#ffb385', blush: '#ff8b94', unlockStars: 0 },
  { id: 'mint', name: '薄荷团', color: '#93e4c1', blush: '#5bbf98', unlockStars: 8 },
  { id: 'sky', name: '云朵团', color: '#91c8ff', blush: '#5b96d6', unlockStars: 16 }
];

export const LEVELS = [
  { id: '1-1', name: '起步涂鸦', starsTotal: 1, medalTargets: { goldTime: 7000, silverTime: 12000, goldLaunches: 2, silverLaunches: 4 } },
  { id: '1-2', name: '门前小台阶', starsTotal: 2, medalTargets: { goldTime: 9000, silverTime: 15000, goldLaunches: 3, silverLaunches: 5 } },
  { id: '1-3', name: '挤挤小通道', starsTotal: 2, medalTargets: { goldTime: 11000, silverTime: 18000, goldLaunches: 4, silverLaunches: 6 } },
  { id: '1-4', name: '星星顺手拿', starsTotal: 3, medalTargets: { goldTime: 14000, silverTime: 22000, goldLaunches: 4, silverLaunches: 7 } },
  { id: '2-1', name: '按钮开门', starsTotal: 2, medalTargets: { goldTime: 12000, silverTime: 19000, goldLaunches: 4, silverLaunches: 7 } },
  { id: '2-2', name: '弹簧蜡笔', starsTotal: 2, medalTargets: { goldTime: 11000, silverTime: 17000, goldLaunches: 3, silverLaunches: 6 } },
  { id: '2-3', name: '弹簧风扇课', starsTotal: 3, medalTargets: { goldTime: 14000, silverTime: 21000, goldLaunches: 4, silverLaunches: 7 } },
  { id: '3-1', name: '蓝色黏黏', starsTotal: 2, medalTargets: { goldTime: 14000, silverTime: 22000, goldLaunches: 4, silverLaunches: 7 } },
  { id: '3-2', name: '绿色沉沉', starsTotal: 3, medalTargets: { goldTime: 16000, silverTime: 24000, goldLaunches: 5, silverLaunches: 8 } },
  { id: '3-3', name: '红色弹弹', starsTotal: 3, medalTargets: { goldTime: 16000, silverTime: 25000, goldLaunches: 5, silverLaunches: 8 } },
  { id: '3-4', name: '毕业关', starsTotal: 3, medalTargets: { goldTime: 20000, silverTime: 30000, goldLaunches: 6, silverLaunches: 10 } }
];
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --run tests/scoring.test.js tests/storage.test.js`  
Expected: PASS with all scoring and storage tests green

- [ ] **Step 5: Commit the progression milestone if Git is initialized**

```bash
git add src/game/level-data.js src/game/scoring.js src/storage.js tests/scoring.test.js tests/storage.test.js
git commit -m "feat: add level progression and save profile"
```

### Task 3: Build Blob Physics, Launch Math, and Pointer Intent

**Files:**
- Create: `src/game/blob.js`
- Create: `src/game/physics.js`
- Create: `src/game/input.js`
- Test: `tests/blob.test.js`
- Test: `tests/input.test.js`

- [ ] **Step 1: Write the failing blob and input tests**

```js
// tests/blob.test.js
import { describe, expect, it } from 'vitest';
import { clampDragVector, createBlobState, getBlobVisualState } from '../src/game/blob.js';

describe('blob math', () => {
  it('clamps drag distance to the configured max', () => {
    expect(clampDragVector({ x: -300, y: 0 }, 140)).toEqual({ x: -140, y: 0, power: 1 });
  });

  it('stretches horizontally when moving fast to the right', () => {
    const blob = createBlobState({ x: 100, y: 220 });
    blob.velocity.x = 420;
    blob.velocity.y = 0;

    const visual = getBlobVisualState(blob, { charging: false, landedImpact: 0.2 });
    expect(visual.scaleX).toBeGreaterThan(visual.scaleY);
  });
});
```

```js
// tests/input.test.js
import { describe, expect, it } from 'vitest';
import { createInputState, updateDragIntent } from '../src/game/input.js';

describe('input intent', () => {
  it('stores pointer drag relative to the blob center', () => {
    const input = createInputState();
    const next = updateDragIntent(input, { x: 180, y: 260 }, { x: 120, y: 220 });
    expect(next.dragVector).toEqual({ x: 60, y: 40 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --run tests/blob.test.js tests/input.test.js`  
Expected: FAIL because the blob and input modules do not exist

- [ ] **Step 3: Write the minimal blob and input implementation**

```js
// src/game/blob.js
export function createBlobState(position) {
  return {
    position: { ...position },
    velocity: { x: 0, y: 0 },
    radius: 28,
    wobble: 0,
    face: 'idle',
    ability: 'none',
    abilityTimer: 0
  };
}

export function clampDragVector(vector, maxDistance) {
  const distance = Math.hypot(vector.x, vector.y);

  if (!distance || distance <= maxDistance) {
    return { x: vector.x, y: vector.y, power: distance / maxDistance || 0 };
  }

  const ratio = maxDistance / distance;
  return {
    x: Math.round(vector.x * ratio),
    y: Math.round(vector.y * ratio),
    power: 1
  };
}

export function getBlobVisualState(blob, context) {
  const speed = Math.hypot(blob.velocity.x, blob.velocity.y);
  const stretch = Math.min(0.35, speed / 1200);
  const squash = context.charging ? 0.18 : context.landedImpact * 0.25;

  return {
    scaleX: 1 + stretch - squash,
    scaleY: 1 - stretch + squash,
    face: speed > 300 ? 'focused' : 'idle'
  };
}
```

```js
// src/game/input.js
export function createInputState() {
  return {
    activePointerId: null,
    dragVector: { x: 0, y: 0 },
    charging: false
  };
}

export function updateDragIntent(input, pointer, blobCenter) {
  return {
    ...input,
    dragVector: {
      x: pointer.x - blobCenter.x,
      y: pointer.y - blobCenter.y
    },
    charging: true
  };
}
```

```js
// src/game/physics.js
export const WORLD_GRAVITY = 1800;

export function integrateVelocity(body, dt) {
  return {
    ...body,
    velocity: {
      x: body.velocity.x,
      y: body.velocity.y + WORLD_GRAVITY * dt
    },
    position: {
      x: body.position.x + body.velocity.x * dt,
      y: body.position.y + body.velocity.y * dt
    }
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --run tests/blob.test.js tests/input.test.js`  
Expected: PASS with blob and input tests green

- [ ] **Step 5: Commit the blob math milestone if Git is initialized**

```bash
git add src/game/blob.js src/game/physics.js src/game/input.js tests/blob.test.js tests/input.test.js
git commit -m "feat: add blob launch math and pointer intent"
```

### Task 4: Implement Level Runtime and Session Controller

**Files:**
- Create: `src/game/level-runtime.js`
- Create: `src/game/game.js`
- Test: `tests/level-runtime.test.js`
- Test: `tests/game-session.test.js`

- [ ] **Step 1: Write the failing runtime and session tests**

```js
// tests/level-runtime.test.js
import { describe, expect, it } from 'vitest';
import { createLevelRuntime, applyLevelInteractions } from '../src/game/level-runtime.js';

describe('level runtime', () => {
  it('opens the door when the required button is pressed', () => {
    const runtime = createLevelRuntime({
      button: { id: 'b1', pressed: false },
      door: { id: 'door', open: false, buttonId: 'b1' }
    });

    const next = applyLevelInteractions(runtime, { pressedButtons: ['b1'], collectedStars: [] });
    expect(next.door.open).toBe(true);
  });

  it('marks a star as collected only once', () => {
    const runtime = createLevelRuntime({
      button: null,
      door: { id: 'door', open: true },
      stars: [{ id: 's1', collected: false }]
    });

    const next = applyLevelInteractions(runtime, { pressedButtons: [], collectedStars: ['s1'] });
    expect(next.stars[0].collected).toBe(true);
  });
});
```

```js
// tests/game-session.test.js
import { describe, expect, it } from 'vitest';
import { createGameSession } from '../src/game/game.js';

describe('game session', () => {
  it('starts a run with zero launches and the requested level index', () => {
    const session = createGameSession({ levelIndex: 2 });
    expect(session).toMatchObject({
      levelIndex: 2,
      launches: 0,
      status: 'playing'
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --run tests/level-runtime.test.js tests/game-session.test.js`  
Expected: FAIL because `src/game/level-runtime.js` and `src/game/game.js` do not exist

- [ ] **Step 3: Write the minimal runtime and session modules**

```js
// src/game/level-runtime.js
export function createLevelRuntime(definition) {
  return {
    button: definition.button,
    door: definition.door,
    stars: definition.stars ?? []
  };
}

export function applyLevelInteractions(runtime, events) {
  const doorOpen = runtime.door.buttonId
    ? events.pressedButtons.includes(runtime.door.buttonId)
    : runtime.door.open;

  return {
    ...runtime,
    door: { ...runtime.door, open: doorOpen },
    stars: runtime.stars.map((star) => ({
      ...star,
      collected: star.collected || events.collectedStars.includes(star.id)
    }))
  };
}
```

```js
// src/game/game.js
import { createBlobState } from './blob.js';

export function createGameSession({ levelIndex }) {
  return {
    levelIndex,
    status: 'playing',
    launches: 0,
    elapsedMs: 0,
    blob: createBlobState({ x: 160, y: 300 })
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --run tests/level-runtime.test.js tests/game-session.test.js`  
Expected: PASS with session and interaction tests green

- [ ] **Step 5: Expand `src/game/level-data.js` from metadata-only to full level definitions**

```js
// replace export const LEVELS = [...] in src/game/level-data.js with:
const world = { width: 960, height: 540 };
const ground = { x: 60, y: 460, width: 840, height: 40, type: 'ground' };
const star = (id, x, y) => ({ id, x, y });
const pickup = (id, type, x, y) => ({ id, type, x, y, radius: 20 });
const button = (id, x, y, width = 70) => ({ id, x, y, width, height: 18 });
const door = (x, y, requiresButton = null) => ({ x, y, width: 84, height: 112, requiresButton });

export const LEVELS = [
  {
    id: '1-1',
    name: '起步涂鸦',
    starsTotal: 1,
    medalTargets: { goldTime: 7000, silverTime: 12000, goldLaunches: 2, silverLaunches: 4 },
    world,
    spawn: { x: 140, y: 408 },
    door: door(770, 348),
    platforms: [ground, { x: 330, y: 392, width: 110, height: 20, type: 'ledge' }],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 410, 340)]
  },
  {
    id: '1-2',
    name: '门前小台阶',
    starsTotal: 2,
    medalTargets: { goldTime: 9000, silverTime: 15000, goldLaunches: 3, silverLaunches: 5 },
    world,
    spawn: { x: 150, y: 408 },
    door: door(760, 280),
    platforms: [ground, { x: 500, y: 380, width: 120, height: 18, type: 'step' }, { x: 700, y: 310, width: 120, height: 18, type: 'step' }],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 540, 330), star('s2', 720, 248)]
  },
  {
    id: '1-3',
    name: '挤挤小通道',
    starsTotal: 2,
    medalTargets: { goldTime: 11000, silverTime: 18000, goldLaunches: 4, silverLaunches: 6 },
    world,
    spawn: { x: 150, y: 408 },
    door: door(770, 348),
    platforms: [ground, { x: 420, y: 332, width: 260, height: 18, type: 'tunnel-roof' }],
    walls: [
      { x: 420, y: 350, width: 30, height: 110, type: 'tunnel-wall' },
      { x: 650, y: 350, width: 30, height: 110, type: 'tunnel-wall' }
    ],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 535, 385), star('s2', 700, 318)]
  },
  {
    id: '1-4',
    name: '星星顺手拿',
    starsTotal: 3,
    medalTargets: { goldTime: 14000, silverTime: 22000, goldLaunches: 4, silverLaunches: 7 },
    world,
    spawn: { x: 130, y: 408 },
    door: door(810, 348),
    platforms: [
      ground,
      { x: 290, y: 360, width: 90, height: 18, type: 'step' },
      { x: 470, y: 315, width: 90, height: 18, type: 'step' },
      { x: 650, y: 270, width: 90, height: 18, type: 'step' }
    ],
    walls: [],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 250, 320), star('s2', 515, 270), star('s3', 700, 225)]
  },
  {
    id: '2-1',
    name: '按钮开门',
    starsTotal: 2,
    medalTargets: { goldTime: 12000, silverTime: 19000, goldLaunches: 4, silverLaunches: 7 },
    world,
    spawn: { x: 130, y: 408 },
    door: door(790, 348, 'b1'),
    platforms: [ground, { x: 300, y: 420, width: 110, height: 18, type: 'button-ledge' }, { x: 640, y: 360, width: 120, height: 18, type: 'goal-ledge' }],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b1', 320, 402)],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 365, 360), star('s2', 680, 310)]
  },
  {
    id: '2-2',
    name: '弹簧蜡笔',
    starsTotal: 2,
    medalTargets: { goldTime: 11000, silverTime: 17000, goldLaunches: 3, silverLaunches: 6 },
    world,
    spawn: { x: 130, y: 408 },
    door: door(780, 218),
    platforms: [ground, { x: 600, y: 250, width: 160, height: 18, type: 'goal-ledge' }],
    walls: [],
    springs: [{ x: 310, y: 438, width: 90, height: 22, boost: 1.45 }],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [],
    stars: [star('s1', 350, 330), star('s2', 650, 190)]
  },
  {
    id: '2-3',
    name: '弹簧风扇课',
    starsTotal: 3,
    medalTargets: { goldTime: 14000, silverTime: 21000, goldLaunches: 4, silverLaunches: 7 },
    world,
    spawn: { x: 120, y: 408 },
    door: door(805, 210),
    platforms: [ground, { x: 420, y: 390, width: 120, height: 18, type: 'bridge' }, { x: 700, y: 240, width: 130, height: 18, type: 'goal-ledge' }],
    walls: [],
    springs: [{ x: 250, y: 438, width: 88, height: 22, boost: 1.35 }],
    fans: [{ x: 470, y: 230, width: 110, height: 210, force: 620 }],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [{ x: 560, y: 330, width: 90, height: 16, amplitude: 55, axis: 'x', speed: 1.6 }],
    pickups: [],
    stars: [star('s1', 280, 300), star('s2', 515, 205), star('s3', 735, 180)]
  },
  {
    id: '3-1',
    name: '蓝色黏黏',
    starsTotal: 2,
    medalTargets: { goldTime: 14000, silverTime: 22000, goldLaunches: 4, silverLaunches: 7 },
    world,
    spawn: { x: 130, y: 408 },
    door: door(800, 220),
    platforms: [ground, { x: 700, y: 250, width: 120, height: 18, type: 'goal-ledge' }],
    walls: [{ x: 560, y: 210, width: 26, height: 180, type: 'sticky-wall' }],
    springs: [],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-blue', 'sticky', 280, 370)],
    stars: [star('s1', 330, 320), star('s2', 610, 230)]
  },
  {
    id: '3-2',
    name: '绿色沉沉',
    starsTotal: 3,
    medalTargets: { goldTime: 16000, silverTime: 24000, goldLaunches: 5, silverLaunches: 8 },
    world,
    spawn: { x: 130, y: 408 },
    door: door(790, 310, 'b-heavy'),
    platforms: [ground, { x: 280, y: 402, width: 130, height: 16, type: 'fragile-floor' }, { x: 650, y: 340, width: 140, height: 18, type: 'goal-ledge' }],
    walls: [],
    springs: [],
    fans: [],
    buttons: [button('b-heavy', 690, 322)],
    fragileFloors: [{ x: 280, y: 402, width: 130, height: 16 }],
    movingPlatforms: [],
    pickups: [pickup('p-green', 'heavy', 220, 372)],
    stars: [star('s1', 240, 330), star('s2', 520, 385), star('s3', 720, 290)]
  },
  {
    id: '3-3',
    name: '红色弹弹',
    starsTotal: 3,
    medalTargets: { goldTime: 16000, silverTime: 25000, goldLaunches: 5, silverLaunches: 8 },
    world,
    spawn: { x: 130, y: 408 },
    door: door(800, 170),
    platforms: [ground, { x: 430, y: 335, width: 120, height: 18, type: 'mid-ledge' }, { x: 690, y: 190, width: 140, height: 18, type: 'goal-ledge' }],
    walls: [],
    springs: [{ x: 430, y: 438, width: 90, height: 22, boost: 1.2 }],
    fans: [],
    buttons: [],
    fragileFloors: [],
    movingPlatforms: [],
    pickups: [pickup('p-red', 'elastic', 305, 372)],
    stars: [star('s1', 330, 280), star('s2', 505, 290), star('s3', 730, 140)]
  },
  {
    id: '3-4',
    name: '毕业关',
    starsTotal: 3,
    medalTargets: { goldTime: 20000, silverTime: 30000, goldLaunches: 6, silverLaunches: 10 },
    world,
    spawn: { x: 120, y: 408 },
    door: door(816, 160, 'b-final'),
    platforms: [
      ground,
      { x: 220, y: 374, width: 90, height: 18, type: 'ramp' },
      { x: 430, y: 320, width: 120, height: 18, type: 'mid-ledge' },
      { x: 650, y: 250, width: 140, height: 18, type: 'goal-ledge' }
    ],
    walls: [{ x: 350, y: 250, width: 24, height: 160, type: 'sticky-wall' }],
    springs: [{ x: 220, y: 438, width: 88, height: 22, boost: 1.28 }],
    fans: [{ x: 540, y: 210, width: 90, height: 180, force: 550 }],
    buttons: [button('b-final', 690, 232)],
    fragileFloors: [{ x: 430, y: 320, width: 120, height: 18 }],
    movingPlatforms: [{ x: 560, y: 270, width: 80, height: 16, amplitude: 48, axis: 'y', speed: 1.4 }],
    pickups: [pickup('p-blue-final', 'sticky', 260, 340), pickup('p-red-final', 'elastic', 585, 190)],
    stars: [star('s1', 190, 330), star('s2', 480, 270), star('s3', 742, 126)]
  }
];
```

- [ ] **Step 6: Commit the runtime milestone if Git is initialized**

```bash
git add src/game/game.js src/game/level-runtime.js src/game/level-data.js tests/level-runtime.test.js tests/game-session.test.js
git commit -m "feat: add session controller and level runtime"
```

### Task 5: Render the Doodle World and Blob Feedback

**Files:**
- Create: `src/game/render/doodle.js`
- Create: `src/game/render/canvas-renderer.js`
- Create: `src/game/effects.js`
- Test: `tests/render-helpers.test.js`

- [ ] **Step 1: Write the failing render helper tests**

```js
// tests/render-helpers.test.js
import { describe, expect, it } from 'vitest';
import { jitterPoints, resolveBlobFace } from '../src/game/render/doodle.js';

describe('render helpers', () => {
  it('returns the same number of points after jittering a stroke', () => {
    expect(jitterPoints([{ x: 0, y: 0 }, { x: 10, y: 10 }], 2)).toHaveLength(2);
  });

  it('shows the excited face when the blob is entering the door', () => {
    expect(resolveBlobFace({ status: 'goal', speed: 120 })).toBe('yay');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/render-helpers.test.js`  
Expected: FAIL because the doodle rendering helpers do not exist

- [ ] **Step 3: Write the minimal render helper and effect modules**

```js
// src/game/render/doodle.js
export function jitterPoints(points, amount) {
  return points.map((point, index) => ({
    x: point.x + (index % 2 === 0 ? amount * 0.4 : -amount * 0.4),
    y: point.y + (index % 2 === 0 ? -amount * 0.25 : amount * 0.25)
  }));
}

export function resolveBlobFace({ status, speed }) {
  if (status === 'goal') return 'yay';
  if (status === 'fail') return 'splat';
  if (speed > 380) return 'focused';
  return 'idle';
}
```

```js
// src/game/effects.js
export function createFloatingText(text, x, y, tone = 'ink') {
  return { kind: 'text', text, x, y, tone, life: 0.8 };
}

export function createImpactBurst(x, y, strength) {
  return {
    kind: 'impact',
    x,
    y,
    strength,
    particles: Math.max(6, Math.round(strength * 10))
  };
}
```

```js
// src/game/render/canvas-renderer.js
import { resolveBlobFace } from './doodle.js';

export function renderFrame(ctx, snapshot) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#f9f1dc';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = '#43331f';
  snapshot.platforms.forEach((platform) => {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });

  const face = resolveBlobFace({ status: snapshot.status, speed: Math.hypot(snapshot.blob.velocity.x, snapshot.blob.velocity.y) });
  ctx.save();
  ctx.translate(snapshot.blob.position.x, snapshot.blob.position.y);
  ctx.fillStyle = snapshot.blob.color;
  ctx.beginPath();
  ctx.arc(0, 0, snapshot.blob.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1f12';
  ctx.fillText(face, -16, 48);
  ctx.restore();
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run: `npm test -- --run tests/render-helpers.test.js`  
Expected: PASS with 2 tests passing

- [ ] **Step 5: Wire the renderer into `src/main.js` and manually verify the title-to-canvas composition**

```js
// append to src/main.js after the app shell exists
const canvas = document.createElement('canvas');
canvas.width = 960;
canvas.height = 540;
canvas.className = 'game-canvas';
app.append(canvas);
```

```css
/* append to src/style.css */
.game-canvas {
  width: min(96vw, 960px);
  aspect-ratio: 16 / 9;
  border: 4px solid var(--ink);
  border-radius: 28px;
  background: #fffaf1;
  box-shadow: 0 14px 0 var(--paper-shadow);
}
```

Run: `npm run dev`  
Expected: a framed canvas appears under the title panel and scales down on narrow screens

- [ ] **Step 6: Commit the renderer milestone if Git is initialized**

```bash
git add src/game/render/doodle.js src/game/render/canvas-renderer.js src/game/effects.js src/main.js src/style.css tests/render-helpers.test.js
git commit -m "feat: add doodle renderer foundation"
```

### Task 6: Build the Play Loop, Pointer Launching, and Runtime Interactions

**Files:**
- Modify: `src/main.js`
- Modify: `src/game/game.js`
- Modify: `src/game/blob.js`
- Modify: `src/game/input.js`
- Modify: `src/game/level-runtime.js`
- Test: `tests/game-session.test.js`

- [ ] **Step 1: Replace the session test so it covers launch stepping**

```js
// tests/game-session.test.js
import { describe, expect, it } from 'vitest';
import { stepGameSession } from '../src/game/game.js';
import { createGameSession } from '../src/game/game.js';

it('increments launches when a charged drag is released', () => {
  const session = createGameSession({ levelIndex: 0 });
  const next = stepGameSession(session, {
    dt: 1 / 60,
    input: { released: true, dragVector: { x: -80, y: -20 }, charging: true }
  });

  expect(next.launches).toBe(1);
  expect(next.blob.velocity.x).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the session test to verify it fails**

Run: `npm test -- --run tests/game-session.test.js`  
Expected: FAIL because `stepGameSession` does not exist yet

- [ ] **Step 3: Implement the session stepping logic**

```js
// append to src/game/blob.js
export function getLaunchVelocity(dragVector) {
  const clamped = clampDragVector(dragVector, 140);
  return {
    x: -clamped.x * 6.4,
    y: -clamped.y * 6.4
  };
}
```

```js
// replace src/game/game.js with:
import { getLaunchVelocity } from './blob.js';
import { createLevelRuntime, applyLevelInteractions } from './level-runtime.js';
import { integrateVelocity } from './physics.js';
import { LEVELS } from './level-data.js';
import { createBlobState } from './blob.js';

export function createGameSession({ levelIndex }) {
  const level = LEVELS[levelIndex];

  return {
    levelIndex,
    status: 'playing',
    launches: 0,
    elapsedMs: 0,
    blob: createBlobState(level.spawn),
    runtime: createLevelRuntime(level)
  };
}

export function stepGameSession(session, frame) {
  let next = { ...session, elapsedMs: session.elapsedMs + frame.dt * 1000 };

  if (frame.input?.released && frame.input.charging) {
    next = {
      ...next,
      launches: next.launches + 1,
      blob: {
        ...next.blob,
        velocity: getLaunchVelocity(frame.input.dragVector)
      }
    };
  }

  return {
    ...next,
    blob: integrateVelocity(next.blob, frame.dt),
    runtime: applyLevelInteractions(next.runtime, {
      pressedButtons: [],
      collectedStars: []
    })
  };
}
```

- [ ] **Step 4: Run the session test to verify it passes**

Run: `npm test -- --run tests/game-session.test.js`  
Expected: PASS with launch stepping covered

- [ ] **Step 5: Connect pointer events in `src/main.js`**

```js
// update the import block at the top of src/main.js
import { createInputState, updateDragIntent } from './game/input.js';
import { createGameSession, stepGameSession } from './game/game.js';

const inputState = createInputState();
let session = createGameSession({ levelIndex: 0 });

canvas.addEventListener('pointermove', (event) => {
  if (!event.buttons) return;
  const rect = canvas.getBoundingClientRect();
  const point = {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };

  Object.assign(inputState, updateDragIntent(inputState, point, session.blob.position));
});
```

- [ ] **Step 6: Commit the play-loop milestone if Git is initialized**

```bash
git add src/main.js src/game/game.js src/game/blob.js src/game/input.js tests/game-session.test.js
git commit -m "feat: add playable launch loop"
```

### Task 7: Build DOM Screens, Results Flow, and Skin Selection

**Files:**
- Create: `src/ui/screens.js`
- Modify: `src/app/store.js`
- Modify: `src/main.js`
- Test: `tests/store.test.js`

- [ ] **Step 1: Extend the store test to cover play, results, skin selection, and sound transitions**

```js
// append to tests/store.test.js
it('moves into results after a level is completed', () => {
  const playing = { ...createInitialAppState(), screen: 'playing', selectedLevel: 1 };
  const next = reduceAppState(playing, { type: 'LEVEL_FINISHED', result: { medal: 'silver' } });
  expect(next.screen).toBe('results');
  expect(next.lastResult.medal).toBe('silver');
});

it('updates the chosen skin and sound flag from menu actions', () => {
  const start = createInitialAppState();
  const withSkin = reduceAppState(start, { type: 'SELECT_SKIN', skinId: 'mint' });
  const withMutedSound = reduceAppState(withSkin, { type: 'TOGGLE_SOUND' });

  expect(withSkin.skinId).toBe('mint');
  expect(withMutedSound.soundEnabled).toBe(false);
});
```

- [ ] **Step 2: Run the store test to verify it fails**

Run: `npm test -- --run tests/store.test.js`  
Expected: FAIL because `LEVEL_FINISHED`, `SELECT_SKIN`, and `TOGGLE_SOUND` are not handled

- [ ] **Step 3: Implement the UI screen renderer and store transitions**

```js
// replace src/app/store.js with:
export function createInitialAppState() {
  return {
    screen: 'title',
    selectedLevel: 0,
    soundEnabled: true,
    skinId: 'peach',
    lastResult: null
  };
}

export function reduceAppState(state, action) {
  if (action.type === 'OPEN_LEVEL_SELECT') {
    return { ...state, screen: 'level-select' };
  }

  if (action.type === 'START_LEVEL') {
    return { ...state, screen: 'playing', selectedLevel: action.levelIndex };
  }

  if (action.type === 'LEVEL_FINISHED') {
    return { ...state, screen: 'results', lastResult: action.result };
  }

  if (action.type === 'SELECT_SKIN') {
    return { ...state, skinId: action.skinId };
  }

  if (action.type === 'TOGGLE_SOUND') {
    return { ...state, soundEnabled: !state.soundEnabled };
  }

  return state;
}
```

```js
// src/ui/screens.js
export function renderTitleScreen(root) {
  root.innerHTML = `
    <section class="paper-panel menu-card">
      <p class="eyebrow">Doodle Blob: Escape to the Door</p>
      <h1>涂鸦团子：冲进门里！</h1>
      <div class="menu-actions">
        <button data-action="play" class="ink-button">开始冒险</button>
        <button data-action="levels" class="ink-button alt">选关</button>
      </div>
      <div class="menu-actions compact">
        <button data-action="skins" class="ink-button line">换团子颜色</button>
        <button data-action="sound" class="ink-button line">声音开关</button>
      </div>
    </section>
  `;
}

export function renderLevelSelectScreen(root, levels, unlockedLevelIndex) {
  root.innerHTML = `
    <section class="paper-panel level-card">
      <h2>选关</h2>
      <div class="level-grid">
        ${levels.map((level, index) => `
          <button class="level-node" data-level-index="${index}" ${index > unlockedLevelIndex ? 'disabled' : ''}>
            <span>${level.id}</span>
            <strong>${level.name}</strong>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderSkinPicker(root, skins, selectedSkin) {
  root.innerHTML = `
    <section class="paper-panel skin-card">
      <h2>团子颜色</h2>
      <div class="skin-row">
        ${skins.map((skin) => `
          <button class="skin-chip ${skin.id === selectedSkin ? 'active' : ''}" data-skin-id="${skin.id}">
            <span class="swatch" style="background:${skin.color}"></span>
            <span>${skin.name}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderResultsScreen(root, result) {
  root.innerHTML = `
    <section class="paper-panel results-card">
      <h2>过关啦！</h2>
      <p>奖牌：${result.medal}</p>
      <p>时间：${(result.timeMs / 1000).toFixed(2)} 秒</p>
      <p>发射次数：${result.launches}</p>
    </section>
  `;
}
```

- [ ] **Step 4: Run the store test to verify it passes**

Run: `npm test -- --run tests/store.test.js`  
Expected: PASS with results transition covered

- [ ] **Step 5: Hook the screen renderer into `src/main.js` and manually verify state changes**

```js
// in src/main.js create a ui root
const uiRoot = document.createElement('div');
uiRoot.className = 'ui-root';
app.prepend(uiRoot);
```

```css
/* append to src/style.css */
.ui-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: grid;
  place-items: center;
  padding: 20px;
}

.ui-root > * {
  pointer-events: auto;
}

.menu-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.menu-actions.compact {
  margin-top: 12px;
  flex-wrap: wrap;
}

.level-grid,
.skin-row {
  display: grid;
  gap: 12px;
}

.level-grid {
  grid-template-columns: repeat(2, minmax(120px, 1fr));
}

.skin-chip,
.level-node {
  border: 3px solid var(--ink);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  font: inherit;
}

.skin-chip.active {
  background: #fff0cb;
}

.alt {
  background: var(--sky);
}
```

Run: `npm run dev`  
Expected: the title card sits over the canvas, and the extra sound / skin controls appear without overlapping the play button

- [ ] **Step 6: Commit the UI flow milestone if Git is initialized**

```bash
git add src/ui/screens.js src/app/store.js src/main.js src/style.css tests/store.test.js
git commit -m "feat: add menu and results screens"
```

### Task 8: Add Audio, Final Content Pass, and Responsive Polish

**Files:**
- Create: `src/game/audio.js`
- Modify: `src/storage.js`
- Modify: `src/main.js`
- Modify: `src/style.css`
- Test: `tests/storage.test.js`

- [ ] **Step 1: Extend the storage test for sound and skin unlock persistence**

```js
// update the import block in tests/storage.test.js
import { SKINS } from '../src/game/level-data.js';
import { createDefaultProfile, getUnlockedSkinIds, mergeLevelResult } from '../src/storage.js';

it('preserves sound preference and unlocks higher skins once enough stars are earned', () => {
  const profile = {
    ...createDefaultProfile(),
    soundEnabled: false,
    levels: {
      0: { starsCollected: 3, medal: 'gold', bestTimeMs: 5000, bestLaunches: 2 },
      1: { starsCollected: 3, medal: 'gold', bestTimeMs: 7000, bestLaunches: 3 },
      2: { starsCollected: 3, medal: 'silver', bestTimeMs: 9000, bestLaunches: 4 }
    }
  };

  expect(profile.soundEnabled).toBe(false);
  expect(getUnlockedSkinIds(profile, SKINS)).toEqual(['peach', 'mint']);
});
```

- [ ] **Step 2: Run the storage test to verify it fails**

Run: `npm test -- --run tests/storage.test.js`  
Expected: FAIL because `getUnlockedSkinIds` does not exist yet

- [ ] **Step 3: Add the audio manager, skin unlock helper, and sound wiring**

```js
// src/game/audio.js
export function createAudioManager() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let enabled = true;

  function ensureContext() {
    if (!AudioContextCtor) return null;
    if (!ctx) ctx = new AudioContextCtor();
    return ctx;
  }

  return {
    setEnabled(next) {
      enabled = next;
    },
    isEnabled() {
      return enabled;
    },
    playBoing() {
      if (!enabled) return;
      const audioContext = ensureContext();
      if (!audioContext) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 240;
      gain.gain.value = 0.03;
      oscillator.type = 'triangle';
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    },
    playWin() {
      if (!enabled) return;
      const audioContext = ensureContext();
      if (!audioContext) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.setValueAtTime(420, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(660, audioContext.currentTime + 0.14);
      gain.gain.setValueAtTime(0.04, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
    }
  };
}
```

```js
// append to src/storage.js
export function getUnlockedSkinIds(profile, skins) {
  const totalStars = Object.values(profile.levels).reduce(
    (sum, level) => sum + (level.starsCollected ?? 0),
    0
  );

  return skins
    .filter((skin) => totalStars >= skin.unlockStars)
    .map((skin) => skin.id);
}
```

```js
// update the import block at the top of src/main.js
import { createAudioManager } from './game/audio.js';

const audio = createAudioManager();
audio.setEnabled(state.soundEnabled);

// add this next to the other delegated ui click handlers in src/main.js
app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'sound') {
    state.soundEnabled = !state.soundEnabled;
    audio.setEnabled(state.soundEnabled);
  }
});
```

```css
/* append to src/style.css */
@media (max-width: 720px) {
  .paper-panel {
    padding: 20px;
    border-radius: 22px;
  }

  .menu-actions {
    flex-direction: column;
  }

  .ui-root {
    align-items: end;
  }
}
```

- [ ] **Step 4: Run the storage test to verify it passes**

Run: `npm test -- --run tests/storage.test.js`  
Expected: PASS with sound preference and skin unlock coverage green

- [ ] **Step 5: Run the full automated suite**

Run: `npm test -- --run`  
Expected: PASS for all test files with no uncaught warnings

- [ ] **Step 6: Run manual final verification**

Run: `npm run dev`  
Check:
- title, level select, play, and results screens all render
- mouse and touch launching both work
- retry is immediate
- all 10 levels are playable from the level select
- stars, medals, and skin unlocks persist on reload
- sound toggle mutes launch and win effects

- [ ] **Step 7: Create the production build**

Run: `npm run build`  
Expected: Vite emits a production bundle in `dist/` without build errors

- [ ] **Step 8: Commit the final polish milestone if Git is initialized**

```bash
git add src/game/audio.js src/storage.js src/main.js src/style.css tests/storage.test.js
git commit -m "feat: finish doodle blob adventure mode"
```

## Self-Review Checklist

- Spec coverage:
  - Main mode only: covered by Tasks 2, 4, 6, and 8
  - 10 short levels with progression: covered by Tasks 2, 4, and 8
  - Squishy drag-launch blob: covered by Tasks 3 and 6
  - Collectibles, medals, and unlocks: covered by Task 2 and Task 8
  - Chinese UI and polished DOM screens: covered by Task 7
  - Doodle particles and expressive rendering: covered by Task 5
  - Audio toggle and skin options: covered by Task 8
  - Desktop/mobile responsiveness: covered by Tasks 6 and 8
- Placeholder scan:
  - No placeholder markers remain
- Type consistency:
  - `levelIndex`, `timeMs`, `launches`, `starsCollected`, and `medal` use the same names across tests, storage, and scoring

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-21-doodle-blob-escape-to-the-door.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
