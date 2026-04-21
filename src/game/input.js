const JOYSTICK_RADIUS = 56;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clonePoint(point) {
  return point ? { x: point.x, y: point.y } : null;
}

function resolveMoveX(input) {
  const keyboardAxis =
    (input.keyboard.right ? 1 : 0) - (input.keyboard.left ? 1 : 0);

  if (keyboardAxis !== 0) {
    return keyboardAxis;
  }

  return clamp((input.joystick.knob.x ?? 0) / JOYSTICK_RADIUS, -1, 1);
}

function withMoveX(input) {
  return {
    ...input,
    moveX: resolveMoveX(input)
  };
}

function createLegacyChargeState() {
  return {
    activePointerId: null,
    charging: false,
    released: false,
    pointerPosition: null,
    blobCenter: null,
    dragVector: { x: 0, y: 0 },
    dragDistance: 0,
    dragPower: 0
  };
}

function resolveJumpHeld(input) {
  return Boolean(input.keyboardJumpHeld || input.jumpTouchId !== null);
}

function withJumpHeld(input) {
  return {
    ...input,
    jumpHeld: resolveJumpHeld(input)
  };
}

export function createInputState() {
  return {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    keyboardJumpHeld: false,
    keyboard: {
      left: false,
      right: false
    },
    joystick: {
      pointerId: null,
      origin: null,
      knob: { x: 0, y: 0 }
    },
    jumpTouchId: null,
    ...createLegacyChargeState()
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

  return withMoveX(next);
}

export function setJumpPressed(input, pressed) {
  const next = {
    ...input,
    keyboardJumpHeld: pressed,
    jumpPressed: pressed ? true : input.jumpPressed
  };

  return withJumpHeld(next);
}

export function markJumpConsumed(input) {
  return {
    ...input,
    jumpPressed: false
  };
}

export function beginJoystick(input, pointerId, origin) {
  if (input.joystick.pointerId !== null) {
    return input;
  }

  const next = {
    ...input,
    joystick: {
      pointerId,
      origin: clonePoint(origin),
      knob: { x: 0, y: 0 }
    }
  };

  return withMoveX(next);
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

  return withMoveX(next);
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

  return withMoveX(next);
}

export function beginJumpTouch(input, pointerId) {
  if (input.jumpTouchId !== null) {
    return input;
  }

  return withJumpHeld({
    ...input,
    jumpTouchId: pointerId,
    jumpPressed: true
  });
}

export function endJumpTouch(input, pointerId) {
  if (input.jumpTouchId !== pointerId) {
    return input;
  }

  return withJumpHeld({
    ...input,
    jumpTouchId: null,
  });
}

export function beginPointerCharge(input, pointerId, enabled = true) {
  if (!enabled || input.activePointerId !== null || input.joystick.pointerId !== null) {
    return input;
  }

  const next = {
    ...input,
    activePointerId: pointerId,
    charging: true,
    released: false,
    pointerPosition: null,
    blobCenter: null,
    dragVector: { x: 0, y: 0 },
    dragDistance: 0,
    dragPower: 0
  };

  return withMoveX(next);
}

export function updateDragIntent(input, pointer, blobCenter) {
  const pointerMatchesLegacy = input.activePointerId === pointer.id;
  const pointerMatchesJoystick = input.joystick.pointerId === pointer.id;

  if (pointer.id !== undefined && !pointerMatchesLegacy && !pointerMatchesJoystick) {
    return input;
  }

  const dragVector = {
    x: pointer.x - blobCenter.x,
    y: pointer.y - blobCenter.y
  };
  const dragDistance = Math.hypot(dragVector.x, dragVector.y);
  const dragPower = dragDistance > 0 ? Math.min(1, dragDistance / JOYSTICK_RADIUS) : 0;
  const length = dragDistance || 1;
  const scale = Math.min(1, JOYSTICK_RADIUS / length);
  const knob = {
    x: dragVector.x * scale,
    y: dragVector.y * scale
  };
  const next = {
    ...input,
    activePointerId: input.activePointerId ?? pointer.id ?? null,
    charging: true,
    released: false,
    pointerPosition: clonePoint(pointer),
    blobCenter: clonePoint(blobCenter),
    dragVector,
    dragDistance,
    dragPower,
    joystick: {
      pointerId: input.joystick.pointerId ?? input.activePointerId ?? pointer.id ?? null,
      origin: clonePoint(blobCenter),
      knob
    }
  };

  return withMoveX(next);
}

export function releasePointerCharge(input) {
  const next = {
    ...input,
    activePointerId: null,
    charging: false,
    released: true,
    joystick: {
      pointerId: null,
      origin: null,
      knob: { x: 0, y: 0 }
    }
  };

  return withMoveX(next);
}
