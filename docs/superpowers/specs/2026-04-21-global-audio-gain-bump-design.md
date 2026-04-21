# Global Audio Gain Bump Design

## Context

The current mix is already louder than the original baseline, but the user wants the whole game to sound noticeably stronger at full volume. There is also a local unpushed fix for the in-level settings menu hit area that should ship alongside this change.

## Goals

- Increase all gameplay sound effects together by a clearly noticeable amount.
- Preserve the current relative balance between launch, pickup, win, and fail sounds.
- Keep the existing audio model simple: one mute toggle, no per-channel controls.
- Ship the pending settings-menu touch fix in the same push so current `main` behavior is coherent.

## Non-Goals

- No new volume sliders or audio settings UI.
- No retuning of oscillator frequencies or durations.
- No new audio manager architecture or compression/limiting system.

## Decision

Use a simple proportional gain increase across every entry in `AUDIO_PRESETS`. The increase should be large enough to feel obvious, but still conservative enough to avoid harsh clipping under normal browser playback.

The settings-menu touch fix remains limited to CSS hit-testing rules so menu controls can be clicked while the HUD shell itself stays transparent to drag gestures.

## Testing

- Update `tests/audio.test.js` so the louder mix is locked in by higher minimum gain expectations.
- Keep the existing mobile stylesheet regression that protects playfield touch pass-through and menu clickability.
- Run the full test suite and production build before pushing.
