import { describe, expect, it } from 'vitest';
import {
  beginJumpTouch,
  beginJoystick,
  beginPointerCharge,
  createInputState,
  endJumpTouch,
  endJoystick,
  markJumpConsumed,
  releasePointerCharge,
  setJumpPressed,
  setKeyboardDirection,
  updateDragIntent,
  updateJoystick
} from '../src/game/input.js';

describe('input intent', () => {
  it('derives moveX from keyboard state', () => {
    const left = setKeyboardDirection(createInputState(), 'left', true);
    const right = setKeyboardDirection(left, 'right', true);
    const neutral = setKeyboardDirection(right, 'left', false);

    expect(left.moveX).toBe(-1);
    expect(right.moveX).toBe(0);
    expect(neutral.moveX).toBe(1);
  });

  it('queues a one-frame jump press and keeps held state until released', () => {
    const pressed = setJumpPressed(createInputState(), true);
    const consumed = markJumpConsumed(pressed);
    const released = setJumpPressed(consumed, false);

    expect(pressed.jumpPressed).toBe(true);
    expect(pressed.jumpHeld).toBe(true);
    expect(consumed.jumpPressed).toBe(false);
    expect(released.jumpHeld).toBe(false);
  });

  it('normalizes joystick motion into moveX', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const moved = updateJoystick(started, { id: 11, x: 170, y: 400 });

    expect(moved.joystick.pointerId).toBe(11);
    expect(moved.moveX).toBeGreaterThan(0.85);
  });

  it('ignores joystick updates from another pointer id', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const moved = updateJoystick(started, { id: 99, x: 170, y: 400 });

    expect(moved).toEqual(started);
  });

  it('clears moveX when the joystick ends', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const moved = updateJoystick(started, { id: 11, x: 170, y: 400 });
    const ended = endJoystick(moved, 11);

    expect(ended.joystick.pointerId).toBeNull();
    expect(ended.moveX).toBe(0);
  });

  it('uses a touch jump button as a jump source', () => {
    const started = beginJumpTouch(createInputState(), 21);
    const ended = endJumpTouch(started, 21);

    expect(started.jumpPressed).toBe(true);
    expect(started.jumpHeld).toBe(true);
    expect(ended.jumpHeld).toBe(false);
  });

  it('keeps keyboard jump held when a touch jump is released', () => {
    const keyboardHeld = setJumpPressed(createInputState(), true);
    const touchHeld = beginJumpTouch(keyboardHeld, 21);
    const touchReleased = endJumpTouch(touchHeld, 21);

    expect(keyboardHeld.jumpHeld).toBe(true);
    expect(touchHeld.jumpHeld).toBe(true);
    expect(touchReleased.jumpHeld).toBe(true);
  });

  it('preserves an existing joystick owner for duplicate pointerdown', () => {
    const started = beginJoystick(createInputState(), 11, { x: 120, y: 400 });
    const duplicate = beginJoystick(started, 12, { x: 170, y: 400 });
    const legacyAttempt = beginPointerCharge(started, 12);

    expect(duplicate).toEqual(started);
    expect(legacyAttempt).toEqual(started);
  });

  it('preserves an existing jump owner for duplicate pointerdown', () => {
    const started = beginJumpTouch(createInputState(), 21);
    const duplicate = beginJumpTouch(started, 22);

    expect(duplicate).toEqual(started);
  });

  it('keeps the compatibility path coherent through release', () => {
    const charged = beginPointerCharge(createInputState(), 7);
    const dragged = updateDragIntent(
      charged,
      { id: 7, x: 180, y: 260 },
      { x: 120, y: 220 }
    );
    const released = releasePointerCharge(dragged);

    expect(charged.joystick.pointerId).toBeNull();
    expect(dragged).toMatchObject({
      activePointerId: 7,
      charging: true,
      released: false,
      pointerPosition: { x: 180, y: 260 },
      blobCenter: { x: 120, y: 220 },
      dragVector: { x: 60, y: 40 },
      dragDistance: Math.hypot(60, 40)
    });
    expect(dragged.joystick).toMatchObject({
      pointerId: 7,
      origin: { x: 120, y: 220 },
      knob: { x: expect.any(Number), y: expect.any(Number) }
    });
    expect(released).toMatchObject({
      activePointerId: null,
      charging: false,
      released: true,
      pointerPosition: { x: 180, y: 260 },
      blobCenter: { x: 120, y: 220 },
      dragVector: { x: 60, y: 40 },
      dragDistance: Math.hypot(60, 40)
    });
    expect(released.joystick.pointerId).toBeNull();
  });
});
