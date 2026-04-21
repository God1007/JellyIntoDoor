const DEFAULT_BLOB_RADIUS = 18;
const DEFAULT_LAUNCH_DISTANCE = 140;
const BASE_LAUNCH_SPEED = 5.8;

const LAUNCH_MULTIPLIERS = {
  sticky: 0.92,
  heavy: 0.82,
  elastic: 1.18
};

export function createBlobState(position) {
  return {
    position: { x: position.x, y: position.y },
    velocity: { x: 0, y: 0 },
    radius: DEFAULT_BLOB_RADIUS,
    ability: null,
    abilityTimerMs: 0,
    grounded: false,
    canLaunch: true,
    stuckToWall: false,
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

function resolveAbilityMultiplier(ability) {
  if (!ability) {
    return 1;
  }

  if (typeof ability === 'string') {
    return LAUNCH_MULTIPLIERS[ability] ?? 1;
  }

  return LAUNCH_MULTIPLIERS[ability.id] ?? ability.launchMultiplier ?? 1;
}

export function getLaunchVelocity(dragVector, ability) {
  const clamped = clampDragVector(dragVector, DEFAULT_LAUNCH_DISTANCE);
  const multiplier = resolveAbilityMultiplier(ability);

  return {
    x: -clamped.x * BASE_LAUNCH_SPEED * multiplier,
    y: -clamped.y * BASE_LAUNCH_SPEED * multiplier
  };
}

export function getBlobVisualState(blob, context = {}) {
  const speed = Math.hypot(blob.velocity.x, blob.velocity.y);
  const charge = context.charging ? Math.max(0, context.chargePower ?? 0) : 0;
  const impact = Math.max(0, context.impact ?? 0);
  const ability = blob.ability;
  const abilityBias = ability === 'heavy' ? 0.9 : ability === 'elastic' ? 1.08 : 1;

  const stretch = Math.min(0.48, (speed / 1400) * abilityBias + charge * 0.12);
  const squash = Math.min(0.32, impact * 0.24 + (blob.grounded ? 0.05 : 0));
  const tilt = Math.max(-0.25, Math.min(0.25, blob.velocity.x / 1800));

  return {
    scaleX: 1 + stretch - squash,
    scaleY: 1 - stretch + squash,
    tilt,
    face: context.enteredDoor
      ? 'happy'
      : speed > 420
        ? 'focused'
        : context.charging
          ? 'intent'
          : 'idle'
  };
}
