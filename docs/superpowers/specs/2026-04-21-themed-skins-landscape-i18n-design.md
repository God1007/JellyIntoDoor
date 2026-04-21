# Themed Skins, Landscape Priority, and Bilingual UI Design

## Goal

Expand the project in three user-facing directions without changing the core game loop:

- add more visually distinct blob skins
- make the UI landscape-first while still playable in portrait
- add English and Chinese language support, with English as the default

This update also includes one balancing/visual tweak:

- reduce the door size consistently in both rendering and gameplay collision

## Scope

### In scope

- Add a richer themed skin set with visible personality differences
- Introduce an `English / 中文` language system for UI text
- Default first-run language to English
- Persist selected language in local storage
- Update menu screens, results screen, and in-game HUD to use translated strings
- Add a visible language selector on non-playing screens
- Rework responsive layout so landscape is the preferred experience
- Keep portrait mode playable, with a lightweight recommendation to rotate the device
- Reduce door dimensions in a way that affects both visuals and gameplay
- Add test coverage for language, skins, door sizing, and landscape-related UI hooks

### Out of scope

- New gameplay mechanics
- New level geometry or progression rules
- New audio systems
- A third language
- Forced landscape-only gameplay
- A full theme engine or plugin-style skin system

## Product Decisions

## 1. Skin Expansion

The project should move from a simple recolor set to a themed skin lineup with clearer identity.

### Final skin set

- `Peach`: warm, soft default skin
- `Mint`: fresh and clean pastel skin
- `Sky`: airy, bright cloud-like skin
- `Lemon`: punchy, cheerful citrus skin
- `Cherry`: richer jam-like red/pink skin
- `Ink`: dark pencil-and-paper inspired ink skin

### Skin differences

Each skin should define more than a fill color. At minimum it should provide:

- base fill
- outline tone
- highlight tone
- blush / accent tone
- card swatch gradient
- label

The rendering system should keep the same blob shape and animation logic, but each skin should read as a distinct mood rather than a minor tint variation.

### Unlock progression

The skin unlock path should stay simple and use stars already collected through normal play.

Recommended thresholds:

- `Peach`: `0`
- `Mint`: `4`
- `Sky`: `8`
- `Lemon`: `12`
- `Cherry`: `18`
- `Ink`: `24`

This matches the project’s current total star count well enough to make the final skin unlockable near full completion without requiring extra systems.

## 2. Bilingual UI

The project should support exactly two languages:

- `en`
- `zh`

### Default language

First-run default must be English.

### Persistence

Selected language must be stored in local storage along with the existing sound, skin, and progress data.

### Coverage

Translated strings must cover:

- title screen
- level select
- skin picker
- results screen
- in-game HUD
- button labels
- short helper text
- mobile orientation recommendation text

### Language selector placement

The language selector should appear on:

- title screen
- level select
- skin picker
- results screen

It should not appear inside the in-game HUD, because the HUD already competes for limited screen space on phones.

### Interaction model

Use an explicit two-option selector instead of a blind toggle.

Recommended presentation:

- `English`
- `中文`

The active language should be visually indicated.

## 3. Landscape-First Responsive Behavior

The mobile experience should become landscape-first, but portrait mode must remain usable.

### Landscape behavior

- landscape should be treated as the primary mobile layout
- HUD should remain lightweight and avoid blocking the game field
- menu screens can use more horizontal spacing and larger content width

### Portrait behavior

- portrait must still function
- controls must still work
- HUD must stay compact
- portrait should show a subtle recommendation such as:
  - `Landscape recommended`
  - `推荐横屏体验`

This recommendation should be informative, not blocking.

### Recommendation display rule

Show the landscape recommendation only when all of the following are true:

- the viewport is portrait
- the device is touch-first or narrow enough to behave like a phone
- the user is on a menu or in the compact in-game HUD context

### Layout direction

This feature is not a device-orientation lock. It is a responsive preference system:

- landscape gets the cleaner layout
- portrait remains supported with tighter spacing

## 4. Door Size Reduction

The door should become a bit smaller so it feels less oversized relative to the level geometry.

### Size change

Shrink the door to roughly `80%` of its current size.

Recommended target size:

- current: `84 x 112`
- new: `68 x 92`

### Consistency requirement

The change must apply consistently to:

- rendered door size
- gameplay collision / goal detection size

This avoids the common bug where the door looks smaller but still uses the old oversized hit area.

### Level alignment

The door should still visually sit correctly on the floor or platform after resizing. If needed, level door placement values should be adjusted to keep the bottom edge aligned.

## Architecture

## 1. I18n module

Add a lightweight translation module instead of scattering conditional strings through `main.js`.

Recommended responsibilities:

- export supported languages
- export default language
- store translation dictionaries for `en` and `zh`
- expose a small translation function used by UI rendering

This should remain intentionally small and project-specific.

## 2. Storage updates

Extend the existing profile shape with a `language` field.

Requirements:

- default to `en`
- normalize invalid stored values back to `en`
- preserve compatibility with older saves that do not have a language field yet

## 3. UI rendering boundary

`src/ui/screens.js` should stop assuming hardcoded English strings. Instead, screen renderers should receive translated labels or a translation accessor from the caller.

The screen layer should remain responsible for:

- HTML structure
- data attributes
- active button state

It should not own translation persistence logic.

## 4. Main app orchestration

`src/main.js` should own:

- current language state
- dispatching language changes
- passing translated strings into screen renderers
- recomputing UI on language change
- determining whether to show a landscape recommendation

## 5. Skin data structure

Extend the existing skin definitions rather than introducing a new parallel theme system.

Recommended additions:

- richer palette fields
- translated or display-ready labels
- unlock thresholds

Rendering helpers should consume the richer palette values without changing blob behavior.

## 6. Door data boundary

Prefer changing the canonical door helper or normalized level data shape so all runtime and rendering consumers inherit the new dimensions automatically.

Do not resize the door only in the renderer.

## File Impact

Expected touched files:

- `src/game/level-data.js`
- `src/game/render/doodle.js`
- `src/game/render/canvas-renderer.js`
- `src/ui/screens.js`
- `src/main.js`
- `src/storage.js`
- `src/style.css`
- new i18n module under `src/`
- related tests under `tests/`

## Testing Strategy

The change should be verified by focused automated coverage plus the existing full suite.

### Required automated coverage

- default language is English
- stored language survives reload
- language selector updates UI labels
- skin list expands to the new themed set
- new skin IDs and unlock thresholds are available
- HUD or menu rendering exposes language-selection hooks
- door dimensions reflect the smaller target size
- mobile layout stylesheet includes portrait recommendation / landscape-first hooks

### Manual verification focus

- English appears on first load
- switching to Chinese updates the full UI consistently
- switching back to English works without reload issues
- skin cards look visually distinct instead of near-duplicates
- door looks smaller and still behaves correctly as the goal
- portrait on phone is still playable
- landscape on phone feels clearly better than portrait

## Success Criteria

This feature set is complete when:

- the project ships six clearly distinct skins
- the default UI is English
- users can switch between English and Chinese
- language choice persists across reloads
- landscape is the best mobile experience without breaking portrait
- the door is visibly and mechanically smaller
- tests cover the new behavior and the full suite stays green
