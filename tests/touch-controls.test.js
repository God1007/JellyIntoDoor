// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createInputState } from '../src/game/input.js';
import { bindTouchControls } from '../src/game/touch-controls.js';
import { renderHud } from '../src/ui/screens.js';

function dispatchPointerEvent(target, type, { pointerId = 1, clientX = 0, clientY = 0 } = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY }
  });

  target.dispatchEvent(event);
  return event;
}

function renderTouchHud(root) {
  renderHud(root, {
    levelText: 'Level 1-1',
    starsText: 'Stars 0 / 3',
    timeMs: 1000,
    settingsLabel: 'Settings',
    showTouchControls: true,
    jumpLabel: 'Jump',
    joystickOffsetX: 0,
    joystickOffsetY: 0
  });

  const joystick = root.querySelector('.hud-touch-joystick');
  const jump = root.querySelector('.hud-touch-jump');

  joystick.getBoundingClientRect = () => ({
    left: 40,
    top: 300,
    width: 124,
    height: 124,
    right: 164,
    bottom: 424
  });

  return { joystick, jump };
}

describe('touch controls', () => {
  it('keeps joystick and jump responsive across hud rerenders', () => {
    const uiRoot = document.createElement('div');
    let inputState = createInputState();
    let screen = 'playing';
    let paused = false;

    uiRoot.className = 'ui-root';
    uiRoot.setPointerCapture = vi.fn();
    uiRoot.releasePointerCapture = vi.fn();
    uiRoot.hasPointerCapture = vi.fn(() => true);

    const stop = bindTouchControls({
      uiRoot,
      getScreen: () => screen,
      isPaused: () => paused,
      getInputState: () => inputState,
      setInputState: (next) => {
        inputState = next;
      }
    });

    let { joystick, jump } = renderTouchHud(uiRoot);

    dispatchPointerEvent(joystick, 'pointerdown', {
      pointerId: 7,
      clientX: 144,
      clientY: 362
    });
    dispatchPointerEvent(jump, 'pointerdown', {
      pointerId: 8,
      clientX: 820,
      clientY: 430
    });

    expect(uiRoot.setPointerCapture).toHaveBeenNthCalledWith(1, 7);
    expect(uiRoot.setPointerCapture).toHaveBeenNthCalledWith(2, 8);
    expect(inputState.joystick.pointerId).toBe(7);
    expect(inputState.jumpTouchId).toBe(8);
    expect(inputState.jumpHeld).toBe(true);

    ({ joystick, jump } = renderTouchHud(uiRoot));
    void jump;
    joystick.getBoundingClientRect = () => ({
      left: 40,
      top: 300,
      width: 124,
      height: 124,
      right: 164,
      bottom: 424
    });

    dispatchPointerEvent(uiRoot, 'pointermove', {
      pointerId: 7,
      clientX: 164,
      clientY: 362
    });
    dispatchPointerEvent(uiRoot, 'pointerup', { pointerId: 8 });

    expect(inputState.moveX).toBeGreaterThan(0.3);
    expect(inputState.jumpTouchId).toBeNull();

    screen = 'title';
    paused = true;
    stop();
  });

  it('clears stuck touch owners when pointer capture is lost', () => {
    const uiRoot = document.createElement('div');
    let inputState = createInputState();

    uiRoot.className = 'ui-root';
    uiRoot.setPointerCapture = vi.fn();
    uiRoot.releasePointerCapture = vi.fn();
    uiRoot.hasPointerCapture = vi.fn(() => true);

    const stop = bindTouchControls({
      uiRoot,
      getScreen: () => 'playing',
      isPaused: () => false,
      getInputState: () => inputState,
      setInputState: (next) => {
        inputState = next;
      }
    });

    const { joystick, jump } = renderTouchHud(uiRoot);

    dispatchPointerEvent(joystick, 'pointerdown', {
      pointerId: 7,
      clientX: 144,
      clientY: 362
    });
    dispatchPointerEvent(jump, 'pointerdown', {
      pointerId: 8,
      clientX: 820,
      clientY: 430
    });

    dispatchPointerEvent(uiRoot, 'lostpointercapture', { pointerId: 7 });
    dispatchPointerEvent(uiRoot, 'lostpointercapture', { pointerId: 8 });

    expect(inputState.joystick.pointerId).toBeNull();
    expect(inputState.jumpTouchId).toBeNull();
    expect(inputState.jumpHeld).toBe(false);

    stop();
  });
});
