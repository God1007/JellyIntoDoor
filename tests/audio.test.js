import { describe, expect, it } from 'vitest';
import { AUDIO_PRESETS } from '../src/game/audio.js';

describe('audio presets', () => {
  it('keeps the main gameplay cues noticeably louder than the current mix at full volume', () => {
    expect(AUDIO_PRESETS.boing.gain).toBeGreaterThan(0.09);
    expect(AUDIO_PRESETS.pickup.gain).toBeGreaterThan(0.067);
    expect(AUDIO_PRESETS.win.gain).toBeGreaterThan(0.118);
    expect(AUDIO_PRESETS.fail.gain).toBeGreaterThan(0.101);
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
