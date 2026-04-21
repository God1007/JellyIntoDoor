# Opening Campaign Pacing Refresh Design

## 1. Context

The newly shipped side-scrolling campaign has two problems in its opening chapters:

- Level `1-3 Spring Intro` is not reliably completable because the spring is tucked directly beneath a blocking platform.
- The first ten levels lean too heavily on the same "run right, jump between flat boards" cadence, with too little change in route shape or mechanic emphasis.

The root cause for `1-3` is geometric rather than systemic. In the current data, the spring sits at `y=438` while the `spring-ledge` platform above it starts at `y=420` with height `18`, so the platform bottom also lands at `y=438`. The player collides with the ledge before they can overlap the spring trigger volume.

The pacing issue is also local to level authoring. The runtime, camera, scoring, and input rewrite are already in place; what is missing is a stronger authored teaching sequence in the first two chapters.

## 2. Goals

- Make level `1-3` reliably passable through its intended spring route.
- Rebalance levels `1-1` through `2-5` so the first two chapters teach distinct route patterns instead of repeating one board-hopping template.
- Preserve the current platformer controls, camera, door gate, and scoring systems.
- Add automated regressions that lock in spring accessibility and stronger early-campaign variety.

## 3. Non-Goals

- No runtime physics changes.
- No camera retuning.
- No UI, HUD, audio, localization, or storage changes.
- No redesign of chapters 3 and 4 unless a focused regression requires a small data adjustment.

## 4. Design Decisions

### 4.1 Fix `1-3` by changing geometry, not spring logic

`1-3` should remain the first spring lesson, but the spring must be visibly reachable and mechanically usable.

Decision:

- Remove the blocking overlap between the spring and the ledge above it.
- Keep the spring on the ground as a clear "step here to launch upward" lesson.
- Make the landing after the spring feel intentional rather than barely reachable.

The preferred fix is to rebuild `1-3` around a short runway, a visible spring pocket, and a higher landing platform offset far enough to require the spring. This preserves the lesson while making the route readable at a glance.

### 4.2 Re-author the first two chapters around distinct beats

The opening ten levels should feel like a teaching ladder, not ten length variants of the same map. Each level still reads left-to-right, but its primary verb or route shape should be clear and different from its neighbors.

Recommended beat map:

- `1-1 Warm-Up Run`: pure run-and-jump onboarding with wide safe landings.
- `1-2 Three Lanes`: introduce route choice with low, mid, and high lines rather than one forced staircase.
- `1-3 Spring Intro`: first mandatory spring lesson with a clean runway and obvious launch target.
- `1-4 Button Jog`: keep the button-door lesson, but make the button detour spatially legible instead of another flat chain.
- `1-5 First Long Push`: turn the level into a longer endurance run that mixes low jumps and one payoff spring rather than many equivalent boards.
- `2-1 Twin Springs`: teach chaining two separate spring decisions instead of just repeating a single spring cadence.
- `2-2 Spring Pen`: keep the stronger spring lesson, but make the route read as a committed launch set piece.
- `2-3 Fan Ribbon`: make the fan section the dominant identity of the level, with the spring serving setup rather than stealing focus.
- `2-4 Door Relay`: keep the button-gated door, but shape the route so the return and finish feel different from the approach.
- `2-5 Chapter Stretch`: make the end-of-chapter level a mixed exam with longer spacing and one or two mechanic transitions, not just a longer version of earlier board runs.

### 4.3 Use route shape as the main variety lever

Variety should come from geometry first, not from stuffing every early level with new entities.

The first two chapters should alternate between:

- flat recovery spaces
- split routes
- spring pockets
- elevated landings
- button detours
- long ground runs broken by fewer, more meaningful jumps
- one focused fan route

This keeps onboarding readable while still making each level feel authored.

### 4.4 Add explicit level-data regression rules

The previous test suite only checked world width, door support, total level count, and the `2-2` spring boost. That is not enough to catch the current regression or the pacing drift.

New regression coverage should include:

- `1-3` spring accessibility:
  - the spring top must sit below open space rather than flush against a blocking platform
  - the spring should have a runway or landing context consistent with an intended launch route
- early-campaign pacing distribution:
  - the first ten levels should expose multiple primary patterns rather than clustering almost entirely around plain stepping boards and springs
  - no long early stretch should collapse into the same mechanic identity repeatedly

The tests should stay data-oriented. They should validate authored intent without hardcoding every coordinate of every level.

## 5. Implementation Outline

### 5.1 Level Authoring

`src/game/level-data.js`

- Rebuild level layouts for `1-1` through `2-5`.
- Fix `1-3` so the spring is reachable and the intended launch route is obvious.
- Vary route height, gap spacing, and mechanic emphasis across the first ten levels.
- Keep level ids, chapter structure, star-gated doors, and overall campaign length unchanged.

### 5.2 Regression Coverage

`tests/level-data.test.js`

- Add a regression that catches blocked spring placement in `1-3`.
- Add pacing assertions for the first ten levels that verify multiple route identities appear across the opening chapters and that plain board-jumping does not dominate the entire `1-1` through `2-5` stretch.
- Preserve the current checks for world width, door support, total level count, and the strengthened `2-2` spring route.

## 6. Testing Strategy

Automated verification should cover:

- `1-3` spring geometry no longer being blocked by a platform directly overhead.
- early levels exposing a broader mechanic mix across `1-1` to `2-5`.
- existing structural checks still passing for all 20 levels.

Manual verification should cover:

- `1-3` can be completed on the intended spring route without collision ambiguity.
- the first ten levels no longer feel like near-identical board chains when played in order.
- chapter 1 still feels welcoming and chapter 2 still feels like a clean escalation, not an abrupt difficulty spike.

## 7. Risks and Constraints

- If variety is forced by simply adding more hazards, the early campaign may become noisy instead of better paced.
- If `1-3` is fixed only by boosting the spring harder, the level may become sloppy while leaving the underlying blockage unaddressed.
- If pacing tests are too literal, they will become brittle and punish healthy future iteration.

The mitigation is to keep the fix data-local, vary route shapes rather than just mechanic count, and write tests around structural intent instead of exact coordinates.

## 8. Acceptance Criteria

- Level `1-3` is passable and its spring is not blocked by an overlapping platform.
- Levels `1-1` through `2-5` present clearly different traversal beats when played in order.
- The first ten levels retain long horizontal worlds, supported doors, and the current 20-level campaign structure.
- `tests/level-data.test.js` includes regressions that would have caught the blocked `1-3` spring and the overly repetitive early pacing.
