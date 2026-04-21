# Side-Scrolling Platformer Campaign Design

## 1. Context

The current game is still built around drag-to-launch movement inside mostly single-screen levels. That model now conflicts with the requested direction in four ways:

- The player wants direct platformer controls instead of slingshot-style launches.
- Levels should become meaningfully longer, with the camera following the jelly horizontally.
- Door placement should read like a grounded world object, with the bottom of the door aligned to the platform it sits on.
- The current `2-2` spring route is still too weak for reliable completion.

There is also one supporting polish request:

- Increase all gameplay audio by another 30% relative to the current louder mix.

Because movement, camera, level length, and progression pacing all depend on each other, this should be treated as a full gameplay-mode conversion rather than a narrow patch on top of the launch-based architecture.

## 2. Goals

- Replace drag-to-launch movement with a unified side-scrolling platformer control scheme on desktop and mobile.
- Add horizontal camera follow while keeping vertical framing fixed.
- Expand the campaign to 20 levels and make levels materially longer than the current single-screen layouts.
- Rebuild the first 10 levels around the new movement model instead of stretching their current geometry.
- Make level `2-2` reliably completable by strengthening its spring-driven route.
- Align every door so its bottom edge sits on the supporting platform top.
- Raise all gameplay audio by 30% while preserving the existing relative balance between cues.

## 3. Non-Goals

- No vertical camera tracking.
- No combat, enemies, health system, or attack inputs.
- No coexistence mode where drag-launch and run-jump both stay active.
- No per-sound volume sliders or expanded audio settings UI.
- No art-style replacement; the doodle paper look stays intact.

## 4. Design Decisions

### 4.1 Core Movement Model

The game will move to a standard 2D platformer control model:

- Horizontal movement applies continuous left/right acceleration.
- Jump is a discrete action triggered only when the jelly is grounded or otherwise allowed by a traversal aid.
- Air control remains available, but weaker than grounded control so jumps stay readable and committed.
- Gravity remains global and strong enough to keep the jelly's motion snappy rather than floaty.

The soft jelly feel should remain visible in animation and squash/stretch, but not in a way that makes the jump arc inconsistent. The player should be able to judge distance by sight instead of by drag power.

This also means the old notion of "launch-ready" is removed from normal movement. Springs, fans, sticky walls, heavy mode, and elastic mode remain in the game, but they now modify run-jump traversal rather than enabling the next slingshot release.

### 4.2 Unified Input Scheme

Desktop and mobile will use the same gameplay rules with different input surfaces:

- Desktop:
  - `A/D` and left/right arrows move
  - `Space` jumps
- Mobile:
  - Left-side virtual joystick controls horizontal movement
  - Right-side jump button triggers jump

The drag-to-launch touch path will be removed entirely. There should not be a platform split where desktop uses keyboard movement but mobile still drags to launch. One ruleset is easier to teach, easier to balance, and easier to test.

### 4.3 Camera and World Framing

The viewport remains a fixed visible window, but levels become wider than the viewport and the camera follows the jelly only on the horizontal axis.

Camera rules:

- Vertical framing stays fixed for the entire level.
- Horizontal follow is smoothed instead of snapping directly to the jelly.
- The camera includes modest forward look so the player can see upcoming gaps, springs, and the next safe platform before reaching the edge of the screen.
- Camera bounds clamp to the level's world width so the player never sees outside the authored level.

This keeps jumps readable and prevents the camera from bouncing vertically during takeoff and landing.

### 4.4 Level Structure and Campaign Expansion

The campaign expands from 10 levels to 20 levels, organized into four chapters of five levels each.

The first 10 levels will be rebuilt for the new control scheme instead of being minimally patched. Each level should be longer than the current single-screen format and read as a left-to-right journey with at least three beats. As a target, most levels should span roughly 2.5 to 4 viewport widths, with late-chapter stages allowed to run longer:

- onboarding or recovery segment
- mechanic combination segment
- end-run segment leading into the goal platform

Recommended chapter rhythm:

- Chapter 1: basic running, jumping, short gaps, simple spring intros
- Chapter 2: stronger spring chains, buttons, longer routes
- Chapter 3: fans, moving platforms, and ability pickups in clearer combinations
- Chapter 4: long mixed-mechanic routes with denser star routing and stricter execution

Level `2-2` remains a spring-centric lesson, but its spring boost and landing geometry should be strengthened enough that the intended route is reliable under the new run-jump model.

### 4.5 Door Placement and Goal Logic

Doors remain the level endpoint, but their placement rule changes globally:

- The bottom edge of the door must align with the top of the platform it stands on.
- The door should visually read like it is resting on the floor, not embedded into it.

Any supporting collision or render offsets must follow this rule so the visual and gameplay targets stay aligned.

The previously added "collect all stars before the door can complete the level" rule remains in place. Long levels make this even more important, because stars should reward route mastery rather than becoming optional visual clutter.

### 4.6 Stars, Results, and Scoring Language

The old results language around `launches` no longer fits the new control scheme. The run summary and any medal logic that currently references launches should be updated to use `jumps`.

Decision:

- Replace player-facing `launches` language with `jumps`.
- Preserve the medal system structure, but tune thresholds around jump counts and completion time for the rebuilt levels.

This keeps the progression model familiar while removing launch-specific terminology that would otherwise feel incorrect after the control rewrite.

### 4.7 Mobile HUD and On-Screen Controls

The current top HUD and settings menu remain, but the playable mobile overlay now also includes:

- a left-bottom joystick zone
- a right-bottom jump button

These controls must not interfere with the existing settings button or menu actions. The HUD should stay transparent to gameplay gestures where appropriate, while the joystick and jump button remain intentionally hit-testable.

### 4.8 Audio Increase

All gameplay sound effects should increase by another 30% relative to the current tuned baseline.

Scope:

- jump cue
- pickup cue
- win cue
- fail cue

The relative balance between cues should remain unchanged. This is a proportional gain bump, not a redesign of oscillator shapes, durations, or mute behavior.

## 5. Implementation Outline

### 5.1 Gameplay Runtime

`src/game/input.js`

- Replace drag-charge state with movement and jump intent state.
- Support keyboard input state and mobile control intent state through one normalized gameplay input model.

`src/game/blob.js`

- Replace drag-vector launch velocity helpers with platformer movement constants and jump helpers.
- Keep visual squash/stretch support, but make it respond to run speed, jump takeoff, and landing impact instead of charge power.

`src/game/game.js`

- Remove launch-request handling from the main loop.
- Apply horizontal acceleration, friction, jump impulse, and air-control rules each frame.
- Track jump count for scoring and results.

`src/game/physics.js`

- Reuse the current collision base where possible, but support stable run-and-jump movement with consistent grounded detection and horizontal deceleration.

### 5.2 Camera and Rendering

`src/game/render/canvas-renderer.js`

- Render the world through a horizontal camera transform rather than always drawing in world coordinates directly to the fixed screen origin.
- Clamp the camera to level bounds.

`src/game/level-data.js`

- Expand world widths well beyond the current single-screen default.
- Rebuild the existing 10 levels for left-to-right traversal.
- Add 10 new authored levels, bringing the total to 20.
- Ensure every door placement uses the new floor-aligned rule.
- Retune `2-2` spring data locally within the level definition.

### 5.3 UI and Copy

`src/ui/screens.js`

- Add mobile gameplay controls markup for joystick and jump button.
- Update player-facing language from launch-based wording to movement/jump wording where needed.

`src/style.css`

- Add layout and hit-testing rules for the joystick and jump button.
- Keep settings access usable on touch devices while reserving bottom corners for gameplay controls.

`src/main.js`

- Route keyboard and touch input into the new normalized gameplay input state.
- Remove drag-based pointer gameplay handlers.
- Keep HUD, settings, back-to-title, and sound actions working under the new overlay layout.

`src/i18n.js`

- Update tutorial, hint, and results copy so it matches run-jump controls and jump-based scoring terminology.

### 5.4 Audio

`src/game/audio.js`

- Increase preset gains by another 30% from the current values.

## 6. Testing Strategy

Automated coverage should include:

- Input tests for keyboard movement, keyboard jump, mobile joystick intent, and mobile jump-button intent.
- Session tests proving horizontal movement and jump impulses behave as expected and that jump counts are tracked instead of launch counts.
- Level data tests proving there are now 20 levels, that long levels exceed the old single-screen width, and that door bottoms align to their supporting platforms.
- A targeted regression for level `2-2` that locks in the stronger spring configuration.
- Render or helper tests covering mobile control markup and camera behavior boundaries.
- Audio tests with thresholds raised to reflect the extra 30% gain bump.

Manual verification should include:

- Desktop play with `A/D` or arrows plus `Space`.
- Mobile play with joystick and jump button without accidental settings-menu interference.
- Camera follow that feels stable, horizontal-only, and forward-looking.
- Doors that visually sit on the floor across multiple levels.
- Longer levels that clearly scroll with jelly movement instead of feeling like stretched single rooms.
- Star-gated completion still working in the rebuilt levels.

## 7. Risks and Constraints

- If horizontal acceleration or air control is too loose, rebuilt long levels will feel slippery instead of deliberate.
- If the camera smoothing is too slow, jumps into off-screen hazards will feel unfair.
- If the camera look-ahead is too strong, precise landings can feel disconnected from the player position.
- If old level geometry is reused too literally, the new controls will expose pacing problems immediately.
- If mobile controls are too large or too central, they will compete with the playfield and settings affordance.

These should be managed with conservative movement tuning, explicit camera limits, and rebuilt level geometry rather than minimal patching.

## 8. Acceptance Criteria

- The player controls the jelly with left/right movement and a discrete jump action on both desktop and mobile.
- Drag-to-launch gameplay input no longer exists.
- The camera follows the jelly horizontally through long levels and does not track vertically.
- The campaign contains 20 authored levels.
- Levels are materially longer than the current single-screen layouts.
- Door bottoms align with the supporting platform tops throughout the campaign.
- Level `2-2` is reliably completable through its intended spring route.
- Player-facing results and scoring language no longer reference launches.
- Gameplay audio is 30% louder than the current tuned baseline.
