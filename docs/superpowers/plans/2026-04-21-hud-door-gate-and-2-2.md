# HUD, Door Gate, and 2-2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a less obstructive in-level HUD, require full-star collection before door completion, fix level `2-2`, and make full-volume sound effects punchier.

**Architecture:** Keep the change local to the existing DOM overlay, gameplay session flow, and level data. Reuse the current `renderHud` + `main.js` wiring for the new top status bar and settings menu, and extend `stepLevelRuntime` / `stepGameSession` with explicit blocked-door events instead of bolting special cases into UI code.

**Tech Stack:** Vite, vanilla JavaScript, HTML5 Canvas, CSS, Vitest

---

## Planned File Structure

- `src/game/level-runtime.js`: add explicit blocked-door feedback and remaining-star counts to door interactions
- `src/game/game.js`: gate session completion on the new runtime signal and surface blocked-door frame events
- `src/game/level-data.js`: reduce default door dimensions and retune level `2-2`
- `src/game/audio.js`: expose louder sound presets and add a dedicated failure cue
- `src/ui/screens.js`: replace the current large HUD card with a top status bar, settings trigger, and centered transient message region
- `src/main.js`: manage settings-menu open state, transient HUD messages, and new blocked-door / failure feedback
- `src/style.css`: define the new top-bar landscape-first layout and settings menu styling
- `src/i18n.js`: add localized copy for settings, blocked-door, and centered failure messaging
- `tests/level-runtime.test.js`: cover blocked-door and full-star door entry behavior
- `tests/game-session.test.js`: cover session-level completion gating and blocked-door frame events
- `tests/level-data.test.js`: cover smaller global door dimensions and the retuned `2-2` spring
- `tests/render-helpers.test.js`: cover HUD settings trigger, menu expansion, and centered HUD messages
- `tests/mobile-layout.test.js`: cover the new landscape status bar and settings-menu stylesheet hooks
- `tests/audio.test.js`: cover the louder full-volume sound presets

### Task 1: Gate Door Completion Behind Full-Star Collection

**Files:**
- Modify: `tests/level-runtime.test.js`
- Modify: `tests/game-session.test.js`
- Modify: `src/game/level-runtime.js`
- Modify: `src/game/game.js`

- [ ] **Step 1: Write the failing runtime tests for blocked and allowed door entry**

```js
// append to tests/level-runtime.test.js
  it('blocks the door until every star in the level is collected', () => {
    const level = createTestLevel();
    level.doors[0].open = true;
    const runtime = createLevelRuntime(level);
    const blob = createBlobState({ x: 104, y: 48 });

    const result = stepLevelRuntime(level, runtime, blob, 1 / 60);

    expect(result.enteredDoor).toBe(false);
    expect(result.blockedDoor).toBe(true);
    expect(result.remainingStars).toBe(1);
  });

  it('lets the blob enter the door after the final star is collected', () => {
    const level = createTestLevel();
    level.doors[0].open = true;
    const runtime = createLevelRuntime(level);
    const collector = createBlobState({ x: 150, y: 52 });
    const afterStar = stepLevelRuntime(level, runtime, collector, 1 / 60);
    const blobAtDoor = createBlobState({ x: 104, y: 48 });

    const result = stepLevelRuntime(level, afterStar.runtime, blobAtDoor, 1 / 60);

    expect(result.enteredDoor).toBe(true);
    expect(result.blockedDoor).toBe(false);
    expect(result.remainingStars).toBe(0);
  });
```

```js
// append to tests/game-session.test.js
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
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run tests/level-runtime.test.js tests/game-session.test.js`  
Expected: FAIL because `stepLevelRuntime` does not return `blockedDoor` / `remainingStars`, and `stepGameSession` still treats any entered door as a win.

- [ ] **Step 3: Implement the runtime-level blocked-door signal**

```js
// in src/game/level-runtime.js inside stepLevelRuntime, replace the door loop section with:
  const remainingStars = Math.max(
    0,
    (level.stars ?? []).length - nextRuntime.collectedStarIds.length
  );
  let blockedDoor = false;

  for (const door of level.doors ?? []) {
    const runtimeDoor = nextRuntime.doors[door.id];

    if (!runtimeDoor?.open) {
      continue;
    }

    if (!intersectsCircleRect(blob, door)) {
      continue;
    }

    if (remainingStars > 0) {
      blockedDoor = true;
      break;
    }

    enteredDoor = true;
    break;
  }

  return {
    runtime: nextRuntime,
    forces,
    launchBoost,
    landedOnSpring,
    enteredDoor,
    blockedDoor,
    remainingStars,
    collectedStars,
    pickedAbility,
    brokeFloorIds,
    movingPlatforms: nextRuntime.movingPlatforms,
    pressedButtonIds,
    openedDoorIds,
    completed: enteredDoor
  };
```

- [ ] **Step 4: Implement the session-level blocked-door frame events**

```js
// in src/game/game.js inside createGameSession(), replace lastFrameEvents with:
    lastFrameEvents: {
      launched: false,
      pickedAbility: null,
      collectedStars: [],
      enteredDoor: false,
      blockedDoor: false,
      remainingStars: 0,
      failed: false
    }
```

```js
// in src/game/game.js inside stepGameSession(), keep the status gate as:
  if (runtimeStep.enteredDoor) {
    status = 'won';
  } else if (
```

```js
// and replace lastFrameEvents in the returned session with:
    lastFrameEvents: {
      launched,
      pickedAbility: runtimeStep.pickedAbility,
      collectedStars: runtimeStep.collectedStars,
      enteredDoor: runtimeStep.enteredDoor,
      blockedDoor: runtimeStep.blockedDoor,
      remainingStars: runtimeStep.remainingStars,
      failed
    }
```

- [ ] **Step 5: Run the focused tests to verify they pass**

Run: `npm test -- --run tests/level-runtime.test.js tests/game-session.test.js`  
Expected: PASS with the new blocked-door and full-star completion tests green.

- [ ] **Step 6: Commit the gameplay gate milestone**

```bash
git add tests/level-runtime.test.js tests/game-session.test.js src/game/level-runtime.js src/game/game.js
git commit -m "feat: gate door completion behind full stars"
```

### Task 2: Shrink Door Size and Retune Level 2-2

**Files:**
- Modify: `tests/level-data.test.js`
- Modify: `src/game/level-data.js`

- [ ] **Step 1: Write the failing data regressions for the smaller door and stronger 2-2 spring**

```js
// replace the door assertion in tests/level-data.test.js with:
  it('uses the tighter door dimensions across every level', () => {
    LEVELS.forEach((level) => {
      expect(level.door).toMatchObject({
        width: 60,
        height: 84
      });
    });
  });
```

```js
// append to tests/level-data.test.js
  it('retunes level 2-2 around a stronger spring-assisted route', () => {
    const springPen = LEVELS.find((level) => level.id === '2-2');

    expect(springPen.springs[0]).toMatchObject({
      boost: 1.97,
      launchBoost: 827
    });
    expect(springPen.door).toMatchObject({
      width: 60,
      height: 84
    });
  });
```

- [ ] **Step 2: Run the focused data test to verify it fails**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: FAIL because doors are still `68 x 92` and level `2-2` still uses the weaker `1.45` spring boost.

- [ ] **Step 3: Implement the smaller global door size and stronger 2-2 spring**

```js
// in src/game/level-data.js replace the door() helper with:
function door(id, x, y, requiresButton = null) {
  return {
    id,
    x,
    y,
    width: 60,
    height: 84,
    requiresButton,
    open: !requiresButton
  };
}
```

```js
// in src/game/level-data.js update only the 2-2 spring entry to:
    springs: [spring(310, 438, 90, 22, 1.97, 'spring-2-2')],
```

- [ ] **Step 4: Run the focused data test to verify it passes**

Run: `npm test -- --run tests/level-data.test.js`  
Expected: PASS with the new door-size and `2-2` spring regression checks green.

- [ ] **Step 5: Commit the level-data milestone**

```bash
git add tests/level-data.test.js src/game/level-data.js
git commit -m "fix: retune spring pen and tighten door size"
```

### Task 3: Replace the In-Level HUD with a Top Status Bar and Settings Menu

**Files:**
- Modify: `tests/render-helpers.test.js`
- Modify: `tests/mobile-layout.test.js`
- Modify: `src/ui/screens.js`
- Modify: `src/style.css`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing HUD rendering and stylesheet regressions**

```js
// replace the current HUD assertion in tests/render-helpers.test.js with:
  it('renders a settings trigger instead of always-on retry controls', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 0 / 1',
      timeMs: 2000,
      settingsLabel: 'Settings',
      hudMenuOpen: false
    });

    expect(root.querySelector('[data-action="toggle-settings"]')?.textContent).toContain('Settings');
    expect(root.querySelector('[data-action="retry"]')).toBeNull();
    expect(root.querySelector('.hud-status-bar')).toBeTruthy();
  });

  it('renders the settings actions when the menu is expanded', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 1 / 1',
      timeMs: 2500,
      settingsLabel: 'Settings',
      soundToggleLabel: 'Sound: on',
      retryLabel: 'Retry',
      backLabel: 'Back',
      pauseLabel: 'Pause',
      hudMenuOpen: true
    });

    expect(root.querySelector('[data-action="retry"]')?.textContent).toContain('Retry');
    expect(root.querySelector('[data-action="back-to-title"]')?.textContent).toContain('Back');
    expect(root.querySelector('[data-action="toggle-sound"]')?.textContent).toContain('Sound: on');
  });

  it('renders a centered transient hud message when provided', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 0 / 1',
      timeMs: 2000,
      settingsLabel: 'Settings',
      overlayMessage: 'Fell out. Retry and go again.',
      overlayTone: 'bad'
    });

    expect(root.querySelector('.hud-center-message')?.textContent).toContain('Fell out');
    expect(root.querySelector('.hud-center-message')?.className).toContain('bad');
  });
```

```js
// append to tests/mobile-layout.test.js
  it('centers a thin landscape status bar and separates the settings menu anchor', () => {
    expect(stylesheet).toContain('.hud-shell');
    expect(stylesheet).toContain('.hud-status-bar');
    expect(stylesheet).toContain('.hud-settings-anchor');
    expect(stylesheet).toContain('justify-self: center;');
  });
```

- [ ] **Step 2: Run the focused UI tests to verify they fail**

Run: `npm test -- --run tests/render-helpers.test.js tests/mobile-layout.test.js`  
Expected: FAIL because `renderHud` still emits the old large HUD card and the stylesheet does not define the new top-bar classes.

- [ ] **Step 3: Replace `renderHud()` with the top-bar and settings-menu version**

```js
// in src/ui/screens.js replace renderHud() with:
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
          model.overlayMessage
            ? `<p class="hud-center-message hud-center-message--${escapeHtml(model.overlayTone || 'info')}">${escapeHtml(model.overlayMessage)}</p>`
            : ''
        }
      </section>
    `
  );
}
```

- [ ] **Step 4: Replace the old HUD card styles with top-bar and settings-menu styles**

```css
/* in src/style.css remove the old .hud-overlay block and add: */
.hud-shell {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: 12px;
}

.hud-status-bar {
  grid-column: 1 / -1;
  justify-self: center;
  align-self: start;
  width: min(72vw, 560px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 12px 14px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: rgba(255, 250, 239, 0.92);
  box-shadow: 0 8px 0 rgba(207, 184, 125, 0.7);
}

.hud-settings-anchor {
  justify-self: end;
  align-self: start;
  display: grid;
  gap: 8px;
}

.hud-settings-toggle {
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: var(--sky);
  color: var(--ink);
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 0 rgba(53, 37, 18, 0.18);
}

.hud-settings-menu {
  width: min(240px, 42vw);
  padding: 10px;
  border: 3px solid var(--ink);
  border-radius: 22px;
  background: rgba(255, 250, 239, 0.96);
  box-shadow: 0 10px 0 rgba(207, 184, 125, 0.75);
  display: grid;
  gap: 8px;
}

.hud-settings-menu .screen-button {
  width: 100%;
  margin-top: 0;
}

.hud-center-message {
  grid-column: 1 / -1;
  justify-self: center;
  align-self: center;
  max-width: min(80vw, 420px);
  margin: 0;
  padding: 12px 18px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: rgba(255, 250, 239, 0.96);
  box-shadow: 0 8px 0 rgba(207, 184, 125, 0.72);
  text-align: center;
  font-weight: 800;
}

.hud-center-message--bad {
  color: #8b3a26;
}

.hud-center-message--warn {
  color: #7a5b1f;
}

@media (orientation: landscape) {
  .hud-status-bar {
    width: min(64vw, 520px);
  }
}

@media (max-width: 560px) {
  .hud-shell {
    gap: 8px;
  }

  .hud-status-bar {
    width: min(100%, 440px);
    padding: 10px 12px;
    gap: 8px;
  }

  .hud-settings-menu {
    width: min(220px, 72vw);
  }
}
```

- [ ] **Step 5: Add menu-open state handling in `src/main.js`**

```js
// near the top of src/main.js add:
let hudMenuOpen = false;
let overlayMessage = null;

function showOverlayMessage(text, tone = 'info', ttlMs = 1600) {
  overlayMessage = { text, tone, ttlMs };
}

function clearOverlayMessage() {
  overlayMessage = null;
}
```

```js
// in createFreshSession() and retryLevel(), add:
  hudMenuOpen = false;
  clearOverlayMessage();
```

```js
// in renderUi(), replace the current renderHud(...) call with:
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
    overlayTone: overlayMessage?.tone ?? 'info'
  });
```

```js
// in the uiRoot click handler switch in src/main.js add:
    case 'toggle-settings':
      hudMenuOpen = !hudMenuOpen;
      renderUi();
      break;
```

```js
// at the top of the existing pointerdown listener in src/main.js add:
  hudMenuOpen = false;
```

```js
// near the top of frame(now) in src/main.js add:
  if (overlayMessage) {
    overlayMessage = {
      ...overlayMessage,
      ttlMs: overlayMessage.ttlMs - dt * 1000
    };

    if (overlayMessage.ttlMs <= 0) {
      clearOverlayMessage();
    }
  }
```

- [ ] **Step 6: Run the focused UI tests to verify they pass**

Run: `npm test -- --run tests/render-helpers.test.js tests/mobile-layout.test.js`  
Expected: PASS with the new settings-trigger, settings-menu, message, and landscape stylesheet regressions green.

- [ ] **Step 7: Commit the HUD layout milestone**

```bash
git add tests/render-helpers.test.js tests/mobile-layout.test.js src/ui/screens.js src/style.css src/main.js
git commit -m "feat: move in-level controls into a settings menu"
```

### Task 4: Add Centered Failure / Door Feedback and Louder Full-Volume Audio

**Files:**
- Create: `tests/audio.test.js`
- Modify: `src/game/audio.js`
- Modify: `src/i18n.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing audio-preset regression test**

```js
// create tests/audio.test.js
import { describe, expect, it } from 'vitest';
import { AUDIO_PRESETS } from '../src/game/audio.js';

describe('audio presets', () => {
  it('keeps the main gameplay cues louder than the old mix at full volume', () => {
    expect(AUDIO_PRESETS.boing.gain).toBeGreaterThan(0.03);
    expect(AUDIO_PRESETS.pickup.gain).toBeGreaterThan(0.025);
    expect(AUDIO_PRESETS.win.gain).toBeGreaterThan(0.04);
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

- [ ] **Step 2: Run the focused audio test to verify it fails**

Run: `npm test -- --run tests/audio.test.js`  
Expected: FAIL because `src/game/audio.js` does not export `AUDIO_PRESETS` and does not define a failure cue.

- [ ] **Step 3: Export louder presets and add a failure sound**

```js
// replace src/game/audio.js with:
export const AUDIO_PRESETS = {
  boing: { startHz: 240, endHz: 320, duration: 0.09, type: 'triangle', gain: 0.055 },
  pickup: { startHz: 540, endHz: 760, duration: 0.08, type: 'sine', gain: 0.04 },
  win: { startHz: 420, endHz: 660, duration: 0.18, type: 'triangle', gain: 0.07 },
  fail: { startHz: 190, endHz: 120, duration: 0.12, type: 'sawtooth', gain: 0.06 }
};

export function createAudioManager() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let enabled = true;

  function getContext() {
    if (!AudioContextCtor) {
      return null;
    }

    if (!context) {
      context = new AudioContextCtor();
    }

    return context;
  }

  function playTone(startHz, endHz, duration, type, gainValue) {
    if (!enabled) {
      return;
    }

    const audio = getContext();

    if (!audio) {
      return;
    }

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startHz, audio.currentTime);

    if (endHz !== startHz) {
      oscillator.frequency.linearRampToValueAtTime(endHz, audio.currentTime + duration);
    }

    gain.gain.setValueAtTime(gainValue, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function playPreset(preset) {
    playTone(preset.startHz, preset.endHz, preset.duration, preset.type, preset.gain);
  }

  return {
    setEnabled(next) {
      enabled = Boolean(next);
    },
    isEnabled() {
      return enabled;
    },
    playBoing() {
      playPreset(AUDIO_PRESETS.boing);
    },
    playPickup() {
      playPreset(AUDIO_PRESETS.pickup);
    },
    playWin() {
      playPreset(AUDIO_PRESETS.win);
    },
    playFail() {
      playPreset(AUDIO_PRESETS.fail);
    }
  };
}
```

- [ ] **Step 4: Add the new HUD copy keys**

```js
// in src/i18n.js inside TEXT.en.hud add:
      settings: 'Settings',
      soundOn: 'Sound: on',
      soundOff: 'Sound: off',
      starsProgress: 'Stars {count} / {total}',
      failedCenter: 'Fell out. Retry and go again.',
      starsMissing: '{count} star left'
```

```js
// in src/i18n.js inside TEXT.zh.hud add:
      settings: '设置',
      soundOn: '声音：开',
      soundOff: '声音：关',
      starsProgress: '星星 {count} / {total}',
      failedCenter: '掉出去了，点重试再来',
      starsMissing: '还差 {count} 颗星'
```

- [ ] **Step 5: Surface blocked-door and centered-failure feedback in `src/main.js`**

```js
// in handleSessionEvents(previousSession) inside src/main.js, add before the win branch:
  if (
    frameEvents.blockedDoor &&
    previousSession.lastFrameEvents?.blockedDoor !== true
  ) {
    showOverlayMessage(
      copy('hud.starsMissing', { count: frameEvents.remainingStars }),
      'warn',
      1400
    );
    renderUi();
  }
```

```js
// replace the failed branch in handleSessionEvents(previousSession) with:
  if (
    session.status === 'failed' &&
    previousSession.status === 'playing'
  ) {
    audio.playFail();
    effects.push(
      createFloatingText(
        copy('effects.fellOff'),
        session.blob.position.x,
        session.blob.position.y - 24,
        'bad'
      )
    );
    showOverlayMessage(copy('hud.failedCenter'), 'bad', 1600);
    renderUi();
  }
```

- [ ] **Step 6: Run the focused audio test to verify it passes**

Run: `npm test -- --run tests/audio.test.js`  
Expected: PASS with louder preset values and the new failure cue covered.

- [ ] **Step 7: Run the full verification suite**

Run: `npm test -- --run`  
Expected: PASS with all existing tests plus `tests/audio.test.js` green.

Run: `npm run build`  
Expected: PASS with Vite emitting a clean production bundle.

- [ ] **Step 8: Commit the feedback-and-audio milestone**

```bash
git add tests/audio.test.js src/game/audio.js src/i18n.js src/main.js
git commit -m "feat: add stronger in-level feedback and louder audio"
```

## Self-Review Checklist

- Spec coverage:
  - Landscape HUD obstruction: covered by Task 3
  - Move retry and related controls into settings: covered by Task 3
  - `2-2` completion issue: covered by Task 2
  - Full-star door gate: covered by Task 1
  - Centered failure cue and blocked-door message: covered by Task 4
  - Louder 100% audio: covered by Task 4
- Incomplete-marker scan:
  - No incomplete markers or postponed-work language remain
- Type consistency:
  - `blockedDoor`, `remainingStars`, `overlayMessage`, `hudMenuOpen`, and `starsProgress` are used consistently across runtime, session, UI, and i18n


