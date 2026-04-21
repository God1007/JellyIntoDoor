import { describe, expect, it } from 'vitest';
import {
  clampDragVector,
  createBlobState,
  getBlobVisualState,
  getLaunchVelocity
} from '../src/game/blob.js';

describe('blob helpers', () => {
  it('clamps drag vectors to the requested max distance', () => {
    expect(clampDragVector({ x: 240, y: 0 }, 120)).toEqual({
      x: 120,
      y: 0
    });
  });

  it('launches elastic blobs more strongly than heavy blobs', () => {
    const dragVector = { x: -100, y: 0 };
    const elastic = getLaunchVelocity(dragVector, 'elastic');
    const heavy = getLaunchVelocity(dragVector, 'heavy');

    expect(elastic.x).toBeGreaterThan(heavy.x);
    expect(elastic.y).toBe(heavy.y);
  });

  it('stretches the blob when it is moving fast', () => {
    const blob = createBlobState({ x: 100, y: 220 });
    blob.velocity.x = 500;

    const visual = getBlobVisualState(blob, {
      charging: false,
      impact: 0
    });

    expect(visual.scaleX).toBeGreaterThan(visual.scaleY);
  });
});
