import { describe, expect, it } from 'vitest';
import {
  beginPointerCharge,
  createInputState,
  releasePointerCharge,
  updateDragIntent
} from '../src/game/input.js';

describe('input intent', () => {
  it('begins a pointer charge for a specific pointer id', () => {
    expect(beginPointerCharge(createInputState(), 7)).toMatchObject({
      activePointerId: 7,
      charging: true,
      released: false
    });
  });

  it('stores pointer drag relative to the blob center', () => {
    const charging = beginPointerCharge(createInputState(), 7);
    const next = updateDragIntent(
      charging,
      { id: 7, x: 180, y: 260 },
      { x: 120, y: 220 }
    );

    expect(next.dragVector).toEqual({ x: 60, y: 40 });
    expect(next.dragDistance).toBeCloseTo(Math.hypot(60, 40), 5);
  });

  it('clears charge state when the pointer is released', () => {
    const charging = updateDragIntent(
      beginPointerCharge(createInputState(), 7),
      { id: 7, x: 180, y: 260 },
      { x: 120, y: 220 }
    );
    const released = releasePointerCharge(charging);

    expect(released).toMatchObject({
      activePointerId: null,
      charging: false,
      released: true
    });
    expect(released.dragVector).toEqual({ x: 60, y: 40 });
  });
});
