import { describe, expect, it } from 'vitest';
import * as blobHelpers from '../src/game/blob.js';

describe('blob helpers', () => {
  it('accelerates harder on the ground than in the air', () => {
    expect(blobHelpers.MOVEMENT?.maxRunSpeed).toBeTypeOf('number');
    expect(blobHelpers.applyHorizontalControl).toBeTypeOf('function');

    const grounded = blobHelpers.applyHorizontalControl(
      {
        ...blobHelpers.createBlobState({ x: 0, y: 0 }),
        grounded: true,
        velocity: { x: 0, y: 0 }
      },
      1,
      1 / 60
    );
    const airborne = blobHelpers.applyHorizontalControl(
      {
        ...blobHelpers.createBlobState({ x: 0, y: 0 }),
        grounded: false,
        velocity: { x: 0, y: 0 }
      },
      1,
      1 / 60
    );

    expect(grounded.velocity.x).toBeGreaterThan(airborne.velocity.x);
  });

  it('applies an upward jump impulse', () => {
    expect(blobHelpers.MOVEMENT?.jumpVelocity).toBeTypeOf('number');
    expect(blobHelpers.applyJumpImpulse).toBeTypeOf('function');

    const jumped = blobHelpers.applyJumpImpulse(
      blobHelpers.createBlobState({ x: 0, y: 0 })
    );

    expect(jumped.velocity.y).toBe(-blobHelpers.MOVEMENT.jumpVelocity);
    expect(jumped.grounded).toBe(false);
  });

  it('leans the blob art in the direction of travel', () => {
    const blob = blobHelpers.createBlobState({ x: 100, y: 220 });
    blob.velocity.x = 260;

    const visual = blobHelpers.getBlobVisualState(blob, {
      moveX: 1,
      jumping: false,
      impact: 0.2
    });

    expect(visual.tilt).toBeGreaterThan(0);
  });
});
