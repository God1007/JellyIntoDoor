# Mobile Layout Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing game layout fit phone-sized screens cleanly without changing gameplay or touch interaction behavior.

**Architecture:** Keep the current single responsive layout system and limit the change set to CSS plus one focused stylesheet test. The implementation should tighten the UI on narrow screens, constrain the canvas by both width and dynamic viewport height, and add safe-area padding where mobile browsers need it.

**Tech Stack:** Vite, vanilla JavaScript, CSS, Vitest, jsdom

---

## Planned File Structure

- `src/style.css`: responsive canvas sizing, small-screen spacing, and safe-area handling
- `tests/mobile-layout.test.js`: verifies the stylesheet contains the required mobile layout hooks

### Task 1: Guard the Responsive Layout Contract

**Files:**
- Create: `tests/mobile-layout.test.js`
- Test: `tests/mobile-layout.test.js`

- [ ] **Step 1: Write the failing stylesheet test**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8');

describe('mobile layout stylesheet', () => {
  it('uses dynamic viewport sizing and safe-area padding for phone layouts', () => {
    expect(stylesheet).toContain('min-height: 100dvh');
    expect(stylesheet).toContain('env(safe-area-inset-bottom, 0px)');
    expect(stylesheet).toContain('env(safe-area-inset-left, 0px)');
  });

  it('adds a dedicated narrow-screen breakpoint for tighter mobile spacing', () => {
    expect(stylesheet).toContain('@media (max-width: 560px)');
    expect(stylesheet).toContain('max-height: calc(100dvh - 32px)');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/mobile-layout.test.js`
Expected: FAIL because the current stylesheet does not yet include the new dynamic viewport and safe-area rules

### Task 2: Implement the Mobile Layout Adjustments

**Files:**
- Modify: `src/style.css`
- Test: `tests/mobile-layout.test.js`

- [ ] **Step 1: Update the root layout and canvas sizing**

Add mobile-safe viewport handling to `.game-root` and constrain `.game-canvas` by both width and dynamic height:

```css
.game-root {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 18px;
  position: relative;
}

.game-canvas {
  width: min(96vw, 1100px);
  max-width: 100%;
  max-height: calc(100dvh - 32px);
  height: auto;
  aspect-ratio: 16 / 9;
}
```

- [ ] **Step 2: Add safe-area padding and earlier responsive tightening**

Update the overlay shell and narrow-screen breakpoints so mobile UI can sit above gesture areas and use less spacing:

```css
.ui-root {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding:
    max(18px, env(safe-area-inset-top, 0px))
    max(18px, env(safe-area-inset-right, 0px))
    max(18px, env(safe-area-inset-bottom, 0px))
    max(18px, env(safe-area-inset-left, 0px));
  pointer-events: none;
}

@media (max-width: 720px) {
  .game-root {
    padding: 10px;
    align-items: center;
  }

  .game-canvas {
    width: min(100%, 96vw);
    max-height: calc(100dvh - 20px);
  }

  .screen,
  .hud-overlay {
    width: min(100%, 520px);
    border-radius: 20px;
  }

  .screen {
    padding: 18px 16px;
  }

  .screen-chip-row,
  .hud-overlay__row,
  .screen-actions,
  .hud-overlay__actions {
    gap: 10px;
  }

  .screen-title__subtitle,
  .screen-help {
    margin-top: 10px;
  }

  .screen-grid--skins {
    grid-template-columns: repeat(2, minmax(112px, 1fr));
  }
}

@media (max-width: 560px) {
  .game-root {
    padding: 8px;
  }

  .ui-root {
    align-items: end;
    padding:
      max(12px, env(safe-area-inset-top, 0px))
      max(12px, env(safe-area-inset-right, 0px))
      max(16px, env(safe-area-inset-bottom, 0px))
      max(12px, env(safe-area-inset-left, 0px));
  }

  .screen,
  .hud-overlay {
    width: 100%;
    box-shadow: 0 10px 0 var(--paper-shadow);
  }

  .screen {
    padding: 16px 14px;
  }

  .screen-grid,
  .screen-grid--skins {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .level-card,
  .skin-card,
  .screen-button {
    width: 100%;
  }

  .hud-overlay {
    justify-self: stretch;
    align-self: end;
    padding: 14px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  }

  .hud-overlay__microcopy {
    font-size: 0.88rem;
  }
}
```

- [ ] **Step 3: Run the focused test to verify it passes**

Run: `npm test -- --run tests/mobile-layout.test.js`
Expected: PASS with both stylesheet assertions green

### Task 3: Verify the Full Application Still Passes

**Files:**
- Modify: `src/style.css`
- Test: `tests/mobile-layout.test.js`

- [ ] **Step 1: Run the full suite**

Run: `npm test -- --run`
Expected: PASS for all tests, including the new mobile layout test

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`
Expected: PASS and emit a `dist/` bundle without errors

- [ ] **Step 3: Commit the mobile layout change**

```bash
git add src/style.css tests/mobile-layout.test.js docs/superpowers/plans/2026-04-21-mobile-layout-compat.md
git commit -m "feat: improve mobile layout compatibility"
```

## Self-Review Checklist

- Spec coverage:
  - Canvas constrained by width and height: covered in Task 2 Step 1
  - Overlay tightening on narrow screens: covered in Task 2 Step 2
  - Safe-area handling: covered in Task 1 and Task 2 Step 2
  - Validation with targeted test plus full verification: covered in Tasks 1 and 3
- Placeholder scan:
  - No placeholders remain
- Type consistency:
  - CSS selectors match the existing UI classes in `src/style.css` and `src/ui/screens.js`
