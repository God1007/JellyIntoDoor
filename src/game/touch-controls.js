import {
  beginJumpTouch,
  beginJoystick,
  endJumpTouch,
  endJoystick,
  updateJoystick
} from './input.js';

function clearTouchPointer(input, pointerId) {
  return endJumpTouch(endJoystick(input, pointerId), pointerId);
}

function releaseCapturedPointer(uiRoot, pointerId) {
  if (typeof uiRoot?.hasPointerCapture !== 'function') {
    return;
  }

  if (!uiRoot.hasPointerCapture(pointerId)) {
    return;
  }

  uiRoot.releasePointerCapture?.(pointerId);
}

export function bindTouchControls({
  uiRoot,
  getScreen,
  isPaused,
  getInputState,
  setInputState
}) {
  function controlsEnabled() {
    return getScreen() === 'playing' && !isPaused();
  }

  function updateInput(updater) {
    const next = updater(getInputState());

    if (next !== getInputState()) {
      setInputState(next);
    }
  }

  function onPointerDown(event) {
    if (!controlsEnabled()) {
      return;
    }

    if (event.target.closest('.hud-touch-jump')) {
      updateInput((input) => beginJumpTouch(input, event.pointerId));
      uiRoot.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      return;
    }

    const stick = event.target.closest('.hud-touch-joystick');

    if (!stick) {
      return;
    }

    const rect = stick.getBoundingClientRect();

    updateInput((input) => {
      const started = beginJoystick(input, event.pointerId, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });

      return updateJoystick(started, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      });
    });

    uiRoot.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    const input = getInputState();

    if (input.joystick.pointerId !== event.pointerId) {
      return;
    }

    setInputState(
      updateJoystick(input, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      })
    );
    event.preventDefault();
  }

  function onPointerEnd(event) {
    updateInput((input) => clearTouchPointer(input, event.pointerId));
    releaseCapturedPointer(uiRoot, event.pointerId);
  }

  function onLostPointerCapture(event) {
    updateInput((input) => clearTouchPointer(input, event.pointerId));
  }

  uiRoot.addEventListener('pointerdown', onPointerDown);
  uiRoot.addEventListener('pointermove', onPointerMove);
  uiRoot.addEventListener('pointerup', onPointerEnd);
  uiRoot.addEventListener('pointercancel', onPointerEnd);
  uiRoot.addEventListener('lostpointercapture', onLostPointerCapture);

  return () => {
    uiRoot.removeEventListener('pointerdown', onPointerDown);
    uiRoot.removeEventListener('pointermove', onPointerMove);
    uiRoot.removeEventListener('pointerup', onPointerEnd);
    uiRoot.removeEventListener('pointercancel', onPointerEnd);
    uiRoot.removeEventListener('lostpointercapture', onLostPointerCapture);
  };
}
