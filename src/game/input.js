const JOYSTICK_RADIUS = 56;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveMoveX(input) {
  const keyboardAxis =
    (input.keyboard.right ? 1 : 0) - (input.keyboard.left ? 1 : 0);

  if (keyboardAxis !== 0) {
    return keyboardAxis;
  }

  return clamp((input.joystick.knob.x ?? 0) / JOYSTICK_RADIUS, -1, 1);
}

export function createInputState() {
  return {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    keyboard: {
      left: false,
      right: false
    },
    joystick: {
      pointerId: null,
      origin: null,
      knob: { x: 0, y: 0 }
    },
    jumpTouchId: null
  };
}

export function setKeyboardDirection(input, key, pressed) {
  const next = {
    ...input,
    keyboard: {
      ...input.keyboard,
      [key]: pressed
    }
  };

  return {
    ...next,
    moveX: resolveMoveX(next)
  };
}

export function setJumpPressed(input, pressed) {
  return {
    ...input,
    jumpPressed: pressed ? true : input.jumpPressed,
    jumpHeld: pressed
  };
}

export function markJumpConsumed(input) {
  return {
    ...input,
    jumpPressed: false
  };
}

export function beginJoystick(input, pointerId, origin) {
  return {
    ...input,
    joystick: {
      pointerId,
      origin: { ...origin },
      knob: { x: 0, y: 0 }
    },
    moveX: resolveMoveX({
      ...input,
      joystick: {
        pointerId,
        origin: { ...origin },
        knob: { x: 0, y: 0 }
      }
    })
  };
}

export function updateJoystick(input, pointer) {
  if (input.joystick.pointerId !== pointer.id) {
    return input;
  }

  const dx = pointer.x - input.joystick.origin.x;
  const dy = pointer.y - input.joystick.origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, JOYSTICK_RADIUS / length);
  const knob = {
    x: dx * scale,
    y: dy * scale
  };
  const next = {
    ...input,
    joystick: {
      ...input.joystick,
      knob
    }
  };

  return {
    ...next,
    moveX: resolveMoveX(next)
  };
}

export function endJoystick(input, pointerId) {
  if (input.joystick.pointerId !== pointerId) {
    return input;
  }

  const next = {
    ...input,
    joystick: {
      pointerId: null,
      origin: null,
      knob: { x: 0, y: 0 }
    }
  };

  return {
    ...next,
    moveX: resolveMoveX(next)
  };
}

export function beginJumpTouch(input, pointerId) {
  return {
    ...input,
    jumpTouchId: pointerId,
    jumpPressed: true,
    jumpHeld: true
  };
}

export function endJumpTouch(input, pointerId) {
  if (input.jumpTouchId !== pointerId) {
    return input;
  }

  return {
    ...input,
    jumpTouchId: null,
    jumpHeld: false
  };
}
