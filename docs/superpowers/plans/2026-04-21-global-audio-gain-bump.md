# Global Audio Gain Bump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every gameplay sound effect noticeably louder while preserving their current balance, and ship the pending settings-menu touch fix in the same main-branch push.

**Architecture:** Keep the change local to the existing `AUDIO_PRESETS` table and the CSS hit-testing rules for the HUD settings affordance. Do not introduce new runtime audio concepts; just raise gains and preserve the already-added menu click-through regression coverage.

**Tech Stack:** Vanilla JavaScript, CSS, Vitest, Vite

---

## Planned File Structure

- `src/game/audio.js`: raise all preset gains proportionally
- `tests/audio.test.js`: lock in the new louder thresholds
- `src/style.css`: include the already-local pointer-event fix for the HUD settings controls
- `tests/mobile-layout.test.js`: include the regression that protects HUD pass-through and settings clickability

### Task 1: Raise Global Audio Preset Gains

**Files:**
- Modify: `tests/audio.test.js`
- Modify: `src/game/audio.js`

- [ ] **Step 1: Write the failing louder-mix expectations**

```js
  it('keeps the main gameplay cues noticeably louder than the current mix at full volume', () => {
    expect(AUDIO_PRESETS.boing.gain).toBeGreaterThan(0.07);
    expect(AUDIO_PRESETS.pickup.gain).toBeGreaterThan(0.05);
    expect(AUDIO_PRESETS.win.gain).toBeGreaterThan(0.09);
    expect(AUDIO_PRESETS.fail.gain).toBeGreaterThan(0.075);
  });
```

- [ ] **Step 2: Run the focused audio test to verify it fails**

Run: `npm test -- --run tests/audio.test.js`
Expected: FAIL because the current gains are lower than the new thresholds.

- [ ] **Step 3: Raise the preset gains proportionally in `src/game/audio.js`**

```js
export const AUDIO_PRESETS = {
  boing: { startHz: 240, endHz: 320, duration: 0.09, type: 'triangle', gain: 0.074 },
  pickup: { startHz: 540, endHz: 760, duration: 0.08, type: 'sine', gain: 0.054 },
  win: { startHz: 420, endHz: 660, duration: 0.18, type: 'triangle', gain: 0.095 },
  fail: { startHz: 190, endHz: 120, duration: 0.12, type: 'sawtooth', gain: 0.081 }
};
```

- [ ] **Step 4: Run the focused audio test to verify it passes**

Run: `npm test -- --run tests/audio.test.js`
Expected: PASS

### Task 2: Ship the Pending Settings Menu Touch Fix

**Files:**
- Modify: `src/style.css`
- Modify: `tests/mobile-layout.test.js`

- [ ] **Step 1: Keep the focused pointer-event regression in place**

```js
  it('lets playfield touches pass through the hud shell while keeping settings clickable', () => {
    expect(stylesheet).toMatch(/\.hud-shell\s*\{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.hud-settings-anchor\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(stylesheet).toMatch(/\.hud-settings-toggle\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(stylesheet).toMatch(/\.hud-settings-menu\s*\{[^}]*pointer-events:\s*auto;/s);
  });
```

- [ ] **Step 2: Keep the CSS hit-testing rules explicit**

```css
.hud-shell {
  pointer-events: none;
}

.hud-settings-anchor {
  pointer-events: auto;
}

.hud-settings-toggle {
  pointer-events: auto;
}

.hud-settings-menu {
  pointer-events: auto;
}
```

- [ ] **Step 3: Run the focused layout test to verify it passes**

Run: `npm test -- --run tests/mobile-layout.test.js`
Expected: PASS

### Task 3: Verify and Publish

**Files:**
- Modify: `src/game/audio.js`
- Modify: `tests/audio.test.js`
- Modify: `src/style.css`
- Modify: `tests/mobile-layout.test.js`
- Create: `docs/superpowers/specs/2026-04-21-global-audio-gain-bump-design.md`
- Create: `docs/superpowers/plans/2026-04-21-global-audio-gain-bump.md`

- [ ] **Step 1: Run the full verification suite**

Run: `npm test -- --run`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Commit the work**

```bash
git add src/game/audio.js tests/audio.test.js src/style.css tests/mobile-layout.test.js docs/superpowers/specs/2026-04-21-global-audio-gain-bump-design.md docs/superpowers/plans/2026-04-21-global-audio-gain-bump.md
git commit -m "fix: raise gameplay audio levels"
```

- [ ] **Step 3: Push to GitHub main**

```bash
git push origin main
```
