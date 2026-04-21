import { describe, expect, it } from 'vitest';
import { createInitialAppState, reduceAppState } from '../src/app/store.js';

describe('app store', () => {
  it('starts on the title screen with sound enabled and english selected', () => {
    expect(createInitialAppState()).toMatchObject({
      screen: 'title',
      selectedLevel: 0,
      soundEnabled: true,
      skinId: 'peach',
      language: 'en'
    });
  });

  it('moves from title to level select', () => {
    const next = reduceAppState(createInitialAppState(), {
      type: 'OPEN_LEVEL_SELECT'
    });

    expect(next.screen).toBe('level-select');
  });

  it('opens the skin picker from the title flow', () => {
    const next = reduceAppState(createInitialAppState(), {
      type: 'OPEN_SKIN_PICKER'
    });

    expect(next.screen).toBe('skin-picker');
  });

  it('moves into results after a level is completed', () => {
    const playing = {
      ...createInitialAppState(),
      screen: 'playing',
      selectedLevel: 2
    };
    const result = { medal: 'silver', timeMs: 12345, launches: 4 };
    const next = reduceAppState(playing, {
      type: 'LEVEL_FINISHED',
      result
    });

    expect(next.screen).toBe('results');
    expect(next.lastResult).toEqual(result);
  });

  it('updates the chosen skin and sound flag from menu actions', () => {
    const withSkin = reduceAppState(createInitialAppState(), {
      type: 'SELECT_SKIN',
      skinId: 'mint'
    });
    const withMutedSound = reduceAppState(withSkin, {
      type: 'TOGGLE_SOUND'
    });

    expect(withSkin.skinId).toBe('mint');
    expect(withMutedSound.soundEnabled).toBe(false);
  });

  it('updates the active language from menu actions', () => {
    const next = reduceAppState(createInitialAppState(), {
      type: 'SET_LANGUAGE',
      language: 'zh'
    });

    expect(next.language).toBe('zh');
  });
});
