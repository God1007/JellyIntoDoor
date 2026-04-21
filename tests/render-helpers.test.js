// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  jitterPoints,
  paletteForSkin,
  resolveBlobFace
} from '../src/game/render/doodle.js';
import {
  renderHud,
  renderResultsScreen,
  renderSkinPicker,
  renderTitleScreen
} from '../src/ui/screens.js';

describe('render helpers', () => {
  it('preserves point count when jittering a doodle outline', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];

    const jittered = jitterPoints(points, 3);

    expect(jittered).toHaveLength(points.length);
    expect(jittered).not.toBe(points);
  });

  it('returns yay when the blob has reached the goal', () => {
    expect(resolveBlobFace({ status: 'goal' })).toBe('yay');
  });

  it('selects a distinct palette for mint skin', () => {
    const mint = paletteForSkin('mint');
    const peach = paletteForSkin('peach');

    expect(mint).toMatchObject({
      fill: expect.any(String),
      outline: expect.any(String),
      highlight: expect.any(String)
    });
    expect(mint.fill).not.toBe(peach.fill);
  });

  it('renders skin picker buttons with data-skin-id hooks', () => {
    const root = document.createElement('section');

    renderSkinPicker(root, {
      skinId: 'mint',
      skins: [
        { id: 'peach', label: 'Peach' },
        { id: 'mint', label: 'Mint' }
      ]
    });

    const skinButtons = root.querySelectorAll('[data-skin-id]');

    expect(skinButtons).toHaveLength(2);
    expect(root.querySelector('[data-skin-id="mint"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-skin-id="peach"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders a settings trigger instead of always-on retry controls', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 0 / 1',
      timeMs: 2000,
      settingsLabel: 'Settings',
      hudMenuOpen: false
    });

    expect(root.querySelector('[data-action="toggle-settings"]')?.textContent).toContain('Settings');
    expect(root.querySelector('[data-action="retry"]')).toBeNull();
    expect(root.querySelector('.hud-status-bar')).toBeTruthy();
  });

  it('renders the settings actions when the menu is expanded', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 1 / 1',
      timeMs: 2500,
      settingsLabel: 'Settings',
      soundToggleLabel: 'Sound: on',
      retryLabel: 'Retry',
      backLabel: 'Back',
      pauseLabel: 'Pause',
      hudMenuOpen: true
    });

    expect(root.querySelector('[data-action="retry"]')?.textContent).toContain('Retry');
    expect(root.querySelector('[data-action="back-to-title"]')?.textContent).toContain('Back');
    expect(root.querySelector('[data-action="toggle-sound"]')?.textContent).toContain('Sound: on');
  });

  it('renders a centered transient hud message when provided', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelText: 'Level 1-1',
      starsText: 'Stars 0 / 1',
      timeMs: 2000,
      settingsLabel: 'Settings',
      overlayMessage: 'Fell out. Retry and go again.',
      overlayTone: 'bad'
    });

    expect(root.querySelector('.hud-center-message')?.textContent).toContain('Fell out');
    expect(root.querySelector('.hud-center-message')?.className).toContain('bad');
  });

  it('renders language toggle buttons on the title screen', () => {
    const root = document.createElement('section');

    renderTitleScreen(root, {
      language: 'en',
      languageLabel: 'Language',
      languages: [
        { id: 'en', label: 'English' },
        { id: 'zh', label: '中文' }
      ]
    });

    const languageButtons = root.querySelectorAll('[data-action="set-language"]');

    expect(languageButtons).toHaveLength(2);
    expect(root.querySelector('[data-language="en"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-language="zh"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders a portrait recommendation banner in results when requested', () => {
    const root = document.createElement('section');

    renderResultsScreen(root, {
      language: 'en',
      result: {
        medal: 'gold',
        launches: 2,
        starsCollected: 3,
        timeMs: 8000
      },
      orientationHint: 'Landscape recommended'
    });

    expect(root.querySelector('.orientation-banner')?.textContent).toContain('Landscape recommended');
  });
});
