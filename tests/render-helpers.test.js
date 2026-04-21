// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  jitterPoints,
  paletteForSkin,
  resolveBlobFace
} from '../src/game/render/doodle.js';
import { renderHud, renderSkinPicker } from '../src/ui/screens.js';

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

  it('renders a back-to-title control in the hud actions', () => {
    const root = document.createElement('section');

    renderHud(root, {
      levelLabel: '1-1',
      starsCollected: 0,
      launches: 0,
      timeMs: 2000,
      backLabel: 'Back to title'
    });

    expect(root.querySelector('[data-action="back-to-title"]')?.textContent).toContain('Back to title');
  });
});
