import { describe, expect, it } from 'vitest';
import {
  beginJumpTouch,
  beginJoystick,
  createInputState,
  endJumpTouch,
  endJoystick,
  markJumpConsumed,
  setJumpPressed,
  setKeyboardDirection,
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
});
