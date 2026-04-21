# HUD, Door Gate, and 2-2 Design

## 1. Context

The current in-level experience has three concrete problems:

- The landscape HUD is rendered as a large left-side card, which blocks too much of the playfield.
- Core controls like retry and back-to-title stay permanently visible, increasing visual noise during active play.
- Failure and gate-state feedback are weak: falling out of bounds only shows a small floating text, and the door currently allows completion as soon as it is touched.

There is also a level-specific progression bug:

- Level `2-2 Spring Pen` is not reliably completable under the current spring strength and door/ledge placement.

The requested changes should solve these problems without reworking the entire game architecture or changing the established doodle visual language.

## 2. Goals

- Reduce HUD obstruction in landscape play.
- Move secondary gameplay controls into a compact settings affordance at the top-right.
- Make level `2-2` consistently completable with the current physics model.
- Require full star collection before the door can complete a level.
- Make door-state and failure-state feedback explicit and readable.
- Increase the perceived loudness of sound effects when sound is enabled at 100%.

## 3. Non-Goals

- No full redesign of the title, level select, skin picker, or results screens.
- No rewrite of the physics model or spring system.
- No configurable audio mixer UI with separate volume sliders.
- No camera system, zoom system, or canvas aspect-ratio rewrite beyond targeted landscape layout fixes.

## 4. Design Decisions

### 4.1 In-Level UI Layout

The in-level HUD will be split into two layers:

- A thin top status bar for persistent run information.
- A compact top-right settings button that expands into a small action menu.

The top status bar will only show:

- Current level
- Current collected stars versus level star total
- Elapsed time

It will not permanently show retry, back, or pause buttons.

The settings button will live at the top-right edge of the playable overlay. When expanded, it will expose:

- Pause / Resume
- Retry
- Back to title
- Sound toggle

This menu should feel like a lightweight paper note or sticker stack, not a full modal card. It must remain compact in landscape and avoid covering the center-left play space.

### 4.2 Landscape Behavior

Landscape is the priority layout. The overlay should align to the canvas bounds and avoid consuming a large left column.

Changes:

- Remove the current landscape-sized HUD card anchored along the left side.
- Replace it with a shallow, centered top bar whose height remains visually secondary to the canvas.
- Keep the settings button pinned to the top-right, inside the safe area.
- Preserve portrait behavior as a separate mobile-compact layout, but do not let the landscape rules inherit the current large card dimensions.

### 4.3 Failure Feedback

When the blob falls out of bounds:

- Keep the current gameplay failure transition.
- Add a stronger center-screen failure message that appears briefly and clearly communicates the failure.
- Retain the lighter floating text effect as secondary feedback if desired, but the main signal must be the centered message.

The failure message should be short and immediate, for example:

- Chinese: `掉出去了，点重试再来`
- English: `Fell out. Retry and go again.`

The message should fade out or be replaced once the player retries or leaves the level.

### 4.4 Door Size

Door dimensions will be reduced globally from the current `68 x 92` to a smaller default size.

Target direction:

- Slightly smaller collision and render footprint
- Still instantly recognizable as the exit
- Still visually readable on mobile and landscape

The reduction should be conservative rather than dramatic. The goal is a tighter target object, not a hidden or fiddly one.

### 4.5 Full-Star Completion Gate

Touching the door will no longer automatically complete the level.

New rule:

- If the player has collected all stars in the level and the door is otherwise open, touching the door completes the run.
- If the player has not collected all stars, touching the door does not complete the run.

When the player touches the door without all stars:

- The door should provide immediate feedback that it is not ready.
- The UI should surface a short message stating how many stars are still missing.

Example feedback text:

- Chinese: `还差 1 颗星`
- English: `1 star left`

This keeps the door visible as the goal while making the collection requirement explicit rather than surprising.

### 4.6 Level 2-2 Fix

`2-2 Spring Pen` will be fixed by adjusting level data, not by changing the global spring or gravity systems.

The issue today is geometric: with the current gravity and spring boost, the spring does not provide enough usable height to reach the intended goal region reliably.

The fix will stay local to level `2-2` and may adjust some combination of:

- Spring boost
- Spring placement
- Goal ledge placement
- Door placement

Constraints:

- The level must remain recognizably a spring-introduction level.
- The intended route should still teach using the spring to reach elevated space.
- The fix should preserve the level's medal thresholds unless playtesting shows they no longer match the new route.

### 4.7 Audio Loudness

Sound effects at 100% should be noticeably stronger than they are now.

Scope:

- Increase the amplitude of launch, pickup, win, and failure-related cues.
- Keep the current single mute/unmute control model.
- Avoid harsh clipping, extreme peaks, or distorted tones.

This is a perceived-loudness rebalance, not a new audio system.

## 5. Implementation Outline

### 5.1 UI Files

`src/ui/screens.js`

- Replace the current in-level HUD markup with:
  - a slim status bar
  - a settings trigger
  - a compact expandable settings menu
  - a transient center-message region for failure and door-gate feedback

`src/style.css`

- Add new layout rules for the thin in-level status bar.
- Add menu styles for the top-right settings stack.
- Reduce landscape overlay width usage.
- Add centered transient message styling that works in both landscape and portrait.

`src/main.js`

- Manage settings-menu open/close state.
- Dispatch button actions from the new menu.
- Surface centered transient messages when:
  - the blob falls out of bounds
  - the player touches the door without enough stars

### 5.2 Gameplay Files

`src/game/level-data.js`

- Reduce default door dimensions globally.
- Adjust level `2-2` geometry until it is consistently completable.

`src/game/level-runtime.js`

- Extend door interaction results so a door touch can return:
  - successful entry
  - blocked entry because stars are missing
  - missing-star count

`src/game/game.js`

- Gate `won` status on the new "all stars collected" condition.
- Carry new frame events for blocked door contact so UI and audio feedback can react.

### 5.3 Audio Files

`src/game/audio.js`

- Raise gain or equivalent output shaping for key one-shot effects.
- Keep mute handling unchanged.

## 6. Testing Strategy

Automated coverage should include:

- Door default dimensions reflect the new smaller global size.
- Level `2-2` remains valid under a targeted data-level regression check.
- Touching the door without all stars does not complete the run.
- Touching the door with all stars still completes the run.
- Render/UI helper coverage for the new settings affordance and transient messaging hooks.

Manual verification should include:

- Landscape play no longer loses major left-side visibility.
- The top status bar stays readable but visually secondary.
- The settings menu opens and closes cleanly on desktop and touch.
- Falling out of bounds produces an obvious centered failure cue.
- Door contact before full collection clearly communicates the missing-star requirement.
- Sound effects feel louder at 100% without becoming unpleasant.

## 7. Risks and Constraints

- If the door is made too small, late-game levels may become frustrating rather than cleaner.
- If the center failure message is too heavy, it may feel modal and interruptive during fast retries.
- If the `2-2` fix overshoots by increasing spring power too much, the level may become trivial or visually sloppy.
- If the full-star gate lacks strong enough feedback, players may assume the door is bugged.

These risks should be managed with conservative values and focused playtesting after the rule changes land.

## 8. Acceptance Criteria

- In landscape, the main overlay no longer occupies a large left-side card area.
- Retry and related control actions are moved into a top-right settings entry.
- Level `2-2` is completable through its intended spring route.
- A level cannot be completed unless all stars in that level are collected.
- The player receives explicit feedback when touching the door before meeting the star requirement.
- Out-of-bounds failure receives a centered visible cue.
- Sound effects are audibly stronger at full volume than in the current build.
