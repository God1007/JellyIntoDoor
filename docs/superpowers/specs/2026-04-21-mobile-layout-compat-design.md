# Mobile Layout Compatibility Design

## Goal

Improve phone-sized layout behavior for the existing game without changing gameplay or touch input logic.

## Scope

In scope:
- Keep the current desktop visual style
- Make the canvas fit better on narrow and tall mobile screens
- Make overlay panels, HUD, buttons, and grids readable on small screens
- Add spacing for mobile browser safe areas
- Verify the layout change with targeted tests plus full test/build runs

Out of scope:
- Changes to touch controls or gesture handling
- New UI screens or redesigned visual language
- Gameplay, physics, scoring, or progression changes

## Current Problems

- The main canvas is constrained mostly by width, so tall phone viewports can still feel cramped vertically.
- Overlay panels keep desktop-style padding and spacing too long, which wastes room on narrow screens.
- HUD and action groups stack late and can crowd the bottom of the screen.
- Mobile browser safe-area insets are not explicitly respected for bottom-aligned UI.

## Proposed Approach

### 1. Canvas sizing

- Keep the 16:9 aspect ratio.
- Constrain the canvas by both viewport width and available viewport height.
- Prefer dynamic viewport units so mobile browser chrome does not cause jumpy full-height calculations.

Expected result:
- The game remains centered and fully visible on common portrait phones.

### 2. Overlay layout tightening

- Reduce padding, radius, and shadow depth on small breakpoints.
- Tighten title, help text, chips, stat rows, and card spacing.
- Make buttons fill available width earlier on mobile.

Expected result:
- Title, level select, skin picker, HUD, and results screens fit cleanly on phone screens without overflow or awkward compression.

### 3. Safe-area support

- Add bottom and side padding using `env(safe-area-inset-*)` where overlay content can sit near screen edges.
- Preserve existing behavior on browsers that do not expose safe-area values.

Expected result:
- Buttons and panels do not sit on top of gesture bars or rounded-corner cutouts.

### 4. Grid behavior

- Collapse screen grids earlier on smaller screens.
- Reduce per-card minimum widths so selection cards still fit before a full single-column fallback is needed.

Expected result:
- Level and skin selection remain readable and tappable without cards becoming cramped.

## Files Affected

- Modify `src/style.css`
- Possibly extend an existing DOM-focused test file if one already covers UI rendering
- Otherwise add one targeted test under `tests/` for mobile-oriented screen structure assumptions

## Validation Plan

- Add or update a focused test that guards the intended mobile layout hooks or rendered structure.
- Run `npm test -- --run`
- Run `npm run build`

## Constraints

- No JavaScript behavior changes unless CSS-only adjustments prove insufficient.
- No regression to desktop layout balance.
- No split mobile/desktop UI implementation; this remains one responsive layout system.
