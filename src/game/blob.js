const DEFAULT_BLOB_RADIUS = 18;
const DEFAULT_LAUNCH_DISTANCE = 140;
const BASE_LAUNCH_SPEED = 5.8;

const LAUNCH_MULTIPLIERS = {
  sticky: 0.92,
  heavy: 0.82,
  elastic: 1.18
};

export const MOVEMENT = {
  maxRunSpeed: 285,
  groundAcceleration: 1680,
  airAcceleration: 920,
  groundFriction: 1500,
  jumpVelocity: 640,
  wallJumpPush: 230
};

function moveToward(current, target, delta) {
  if (current === target) {
    return current;
  }

  if (current < target) {
    return Math.min(target, current + delta);
  }

  return Math.max(target, current - delta);
}

function resolveAbilityMultiplier(ability) {
  if (!ability) {
    return 1;
  }

  if (typeof ability === 'string') {
    return LAUNCH_MULTIPLIERS[ability] ?? 1;
  }

  return LAUNCH_MULTIPLIERS[ability.id] ?? ability.launchMultiplier ?? 1;
}

export function createBlobState(position) {
  return {
    position: { x: position.x, y: position.y },
    velocity: { x: 0, y: 0 },
    radius: DEFAULT_BLOB_RADIUS,
    ability: null,
    abilityTimerMs: 0,
    grounded: false,
    canJump: false,
    canLaunch: false,
    stuckToWall: false,
    wallNormalX: 0,
    launchCharge: 0,
    squash: 0,
    stretch: 0
  };
}

export function clampDragVector(vector, maxDistance) {
  const distance = Math.hypot(vector.x, vector.y);

  if (!distance || distance <= maxDistance) {
    return {
      x: vector.x,
      y: vector.y
    };
  }

  const scale = maxDistance / distance;
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
}

export function getLaunchVelocity(dragVector, ability) {
  const clamped = clampDragVector(dragVector, DEFAULT_LAUNCH_DISTANCE);
  const multiplier = resolveAbilityMultiplier(ability);

  return {
    x: -clamped.x * BASE_LAUNCH_SPEED * multiplier,
    y: -clamped.y * BASE_LAUNCH_SPEED * multiplier
  };
}

export function applyHorizontalControl(blob, moveX, dt) {
  const acceleration = blob.grounded
    ? MOVEMENT.groundAcceleration
    : MOVEMENT.airAcceleration;
  const targetSpeed = moveX * MOVEMENT.maxRunSpeed;
  const velocityX =
    moveX === 0 && blob.grounded
      ? moveToward(blob.velocity.x, 0, MOVEMENT.groundFriction * dt)
      : moveToward(blob.velocity.x, targetSpeed, acceleration * dt);

  return {
    ...blob,
    velocity: {
      ...blob.velocity,
      x: velocityX
    }
  };
}

export function applyJumpImpulse(blob, moveX = 0) {
  const wallPush = blob.stuckToWall
    ? (moveX === 0 ? blob.wallNormalX : moveX) * MOVEMENT.wallJumpPush
    : 0;

  return {
    ...blob,
    grounded: false,
    canJump: false,
    canLaunch: false,
    stuckToWall: false,
    wallNormalX: 0,
    velocity: {
      x: blob.velocity.x + wallPush,
      y: -MOVEMENT.jumpVelocity
    }
  };
}

export function getBlobVisualState(blob, context = {}) {
  const speed = Math.hypot(blob.velocity.x, blob.velocity.y);
  const charge = context.charging ? Math.max(0, context.chargePower ?? 0) : 0;
  const impact = Math.max(0, context.impact ?? 0);
  const jumping =
    Boolean(context.jumping) || (!blob.grounded && blob.velocity.y < -40);
  const stretch = Math.min(0.42, speed / 1600 + charge * 0.08 + (jumping ? 0.04 : 0));
  const squash = Math.min(0.28, impact * 0.24 + (blob.grounded ? 0.04 : 0));
  const tilt = Math.max(-0.24, Math.min(0.24, blob.velocity.x / 1400));

  return {
    scaleX: 1 + stretch - squash,
    scaleY: 1 - stretch + squash,
    tilt,
    face: context.enteredDoor
      ? 'happy'
      : jumping || context.charging
        ? 'intent'
        : speed > 320
          ? 'focused'
          : 'idle'
  };
}
