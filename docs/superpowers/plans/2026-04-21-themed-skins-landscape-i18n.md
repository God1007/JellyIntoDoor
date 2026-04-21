# Themed Skins, Landscape Priority, and Bilingual UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six themed skins, English/Chinese UI with English as the default, landscape-first responsive behavior, and a smaller door size without changing the core gameplay loop.

**Architecture:** Keep the gameplay and runtime model intact, but introduce a lightweight translation layer, richer skin data, and layout hooks that separate content from presentation. Treat door sizing as canonical level data so rendering and collision stay aligned, and verify the whole change with focused tests before rerunning the full suite.

**Tech Stack:** Vite, vanilla JavaScript, HTML5 Canvas, CSS, Vitest, localStorage

---

## Planned File Structure

- `src/i18n.js`: supported language list, default language, translation dictionaries, lookup helper
- `src/storage.js`: persist selected language and normalize old saves
- `src/app/store.js`: language selection action and state plumbing
- `src/main.js`: current language state, translated labels, orientation recommendation wiring
- `src/ui/screens.js`: render screens using translated labels and language-selector controls
- `src/game/level-data.js`: richer skin definitions and smaller door dimensions
- `src/game/render/doodle.js`: expanded palette/theme handling for the new skins
- `src/game/render/canvas-renderer.js`: render the resized door and any orientation hint surface text if needed
- `src/style.css`: language selector styling plus landscape-first layout and portrait recommendation hooks
- `tests/store.test.js`: default language and language state changes
- `tests/storage.test.js`: saved language and expanded skin unlock thresholds
- `tests/render-helpers.test.js`: themed skin palette and language-selector render hooks
- `tests/mobile-layout.test.js`: portrait recommendation / landscape-priority CSS hooks
- `tests/level-runtime.test.js` or a new door-data-focused test: smaller door dimensions

### Task 1: Add Language State and Dictionaries

**Files:**
- Create: `src/i18n.js`
- Modify: `src/storage.js`
- Modify: `src/app/store.js`
- Test: `tests/store.test.js`
- Test: `tests/storage.test.js`

- [ ] **Step 1: Write the failing tests for default language and persisted language**
- [ ] **Step 2: Run `npm test -- --run tests/store.test.js tests/storage.test.js` and verify the new language assertions fail for the expected reason**
- [ ] **Step 3: Implement `src/i18n.js` with `en`/`zh` dictionaries and `DEFAULT_LANGUAGE = 'en'`**
- [ ] **Step 4: Extend storage normalization to persist `language` and preserve compatibility with old saves**
- [ ] **Step 5: Extend app state and reducer actions to support selecting a language**
- [ ] **Step 6: Rerun `npm test -- --run tests/store.test.js tests/storage.test.js` and verify those tests pass**

### Task 2: Expand Skins and Shrink the Door

**Files:**
- Modify: `src/game/level-data.js`
- Modify: `src/game/render/doodle.js`
- Test: `tests/storage.test.js`
- Test: `tests/render-helpers.test.js`
- Test: `tests/level-runtime.test.js` or a new focused door-data test

- [ ] **Step 1: Write failing assertions for the six-skin lineup, new unlock thresholds, and smaller door dimensions**
- [ ] **Step 2: Run the targeted tests and verify they fail because the skin list and door sizes are still in the old format**
- [ ] **Step 3: Expand `SKINS` to Peach, Mint, Sky, Lemon, Cherry, and Ink with richer theme fields**
- [ ] **Step 4: Update `paletteForSkin()` to serve the new themed palettes**
- [ ] **Step 5: Reduce the canonical door size in level data so both runtime and renderer inherit the new dimensions**
- [ ] **Step 6: Rerun the targeted tests and verify the new skin/door assertions pass**

### Task 3: Translate the UI and Add Language Selection

**Files:**
- Modify: `src/ui/screens.js`
- Modify: `src/main.js`
- Test: `tests/render-helpers.test.js`
- Test: `tests/store.test.js`

- [ ] **Step 1: Write failing tests for language-selection controls and translated UI labels**
- [ ] **Step 2: Run `npm test -- --run tests/render-helpers.test.js tests/store.test.js` and verify the new assertions fail**
- [ ] **Step 3: Update `src/ui/screens.js` so screen renderers receive translated labels instead of relying on hardcoded strings**
- [ ] **Step 4: Add explicit `English` / `中文` selector controls on title, level select, skin picker, and results screens**
- [ ] **Step 5: Update `src/main.js` to pass translated labels into every screen and persist language changes**
- [ ] **Step 6: Keep the playing HUD translated but do not add the language selector there**
- [ ] **Step 7: Rerun `npm test -- --run tests/render-helpers.test.js tests/store.test.js` and verify the new assertions pass**

### Task 4: Make Layout Landscape-First While Keeping Portrait Playable

**Files:**
- Modify: `src/style.css`
- Modify: `src/main.js`
- Test: `tests/mobile-layout.test.js`

- [ ] **Step 1: Write failing stylesheet assertions for portrait recommendation / landscape-priority hooks**
- [ ] **Step 2: Run `npm test -- --run tests/mobile-layout.test.js` and verify those assertions fail**
- [ ] **Step 3: Update responsive CSS so landscape gets the primary layout and portrait keeps a tighter fallback**
- [ ] **Step 4: Add a subtle portrait recommendation hook, shown only when portrait is active on phone-like screens**
- [ ] **Step 5: Ensure the compact portrait HUD still avoids blocking too much of the play field**
- [ ] **Step 6: Rerun `npm test -- --run tests/mobile-layout.test.js` and verify the layout assertions pass**

### Task 5: Final Verification

**Files:**
- Modify: all files above as needed

- [ ] **Step 1: Run the focused tests touched by the feature**

```bash
npm test -- --run tests/store.test.js tests/storage.test.js tests/render-helpers.test.js tests/mobile-layout.test.js
```

- [ ] **Step 2: Run the full suite**

```bash
npm test -- --run
```

- [ ] **Step 3: Build the production bundle**

```bash
npm run build
```

- [ ] **Step 4: Commit the implementation**

```bash
git -c safe.directory='C:/Users/99448/Desktop/JellyBridge' add src tests
git -c safe.directory='C:/Users/99448/Desktop/JellyBridge' commit -m "feat: add themed skins and bilingual landscape ui"
```

## Self-Review Checklist

- Spec coverage:
  - six themed skins: Task 2
  - English default + Chinese support: Tasks 1 and 3
  - landscape-first but portrait-playable: Task 4
  - smaller door size: Task 2
- Placeholder scan:
  - no TODO/TBD placeholders remain
- Type consistency:
  - `language`, `skinId`, and door dimensions are defined once and reused across storage, UI, and rendering
