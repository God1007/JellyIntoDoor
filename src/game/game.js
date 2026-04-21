import {
  applyHorizontalControl,
  applyJumpImpulse,
  createBlobState
} from './blob.js';
import { LEVELS } from './level-data.js';
import { integrateVelocity, resolveWorldCollision } from './physics.js';
import { evaluateRun } from './scoring.js';
import { createLevelRuntime, stepLevelRuntime } from './level-runtime.js';

const ABILITY_DURATION_MS = 6500;
const OUT_OF_BOUNDS_MARGIN = 160;

function hasMotion(vector) {
  return Boolean(vector && (vector.x || vector.y));
}

function buildLevelSurfaces(level, runtime) {
  const brokenFloorIds = new Set(runtime?.brokenFloorIds ?? []);
  const staticSurfaces = (level.platforms ?? []).filter((surface) => {
    return !(surface.type === 'fragile-floor' && brokenFloorIds.has(surface.id));
  });
  const movingSurfaces = (runtime?.movingPlatforms ?? []).map((platform) => ({
    id: platform.id,
    x: platform.position.x,
    y: platform.position.y,
    width: platform.width,
    height: platform.height,
    type: 'moving-platform'
  }));

  return [...staticSurfaces, ...(level.walls ?? []), ...movingSurfaces];
}

function applyAbilityTimer(blob, dt) {
  if (!blob.ability) {
    return blob;
  }

  const remainingMs =
    typeof blob.abilityTimerMs === 'number' && blob.abilityTimerMs > 0
      ? blob.abilityTimerMs
      : ABILITY_DURATION_MS;
  const nextTimer = remainingMs - dt * 1000;

  if (nextTimer <= 0) {
    return {
      ...blob,
      ability: null,
      abilityTimerMs: 0
    };
  }

  return {
    ...blob,
    abilityTimerMs: nextTimer
  };
}

function applyEnvironmentalForces(blob, forces, dt) {
  if (blob.stuckToWall || !forces || (!forces.x && !forces.y)) {
    return blob;
  }

  return {
    ...blob,
    velocity: {
      x: blob.velocity.x + forces.x * dt,
      y: blob.velocity.y + forces.y * dt
    }
  };
}

function applyLaunchBoost(blob, launchBoost) {
  if (!hasMotion(launchBoost)) {
    return blob;
  }

  return {
    ...blob,
    velocity: {
      x: blob.velocity.x + launchBoost.x,
      y: blob.velocity.y + launchBoost.y
    },
    grounded: false,
    canJump: false,
    canLaunch: false,
    stuckToWall: false,
    wallNormalX: 0
  };
}

function isJumpRequested(input) {
  return Boolean(input?.jumpPressed);
}

function canBlobJump(blob) {
  return Boolean(blob.grounded || blob.stuckToWall || blob.canJump);
}

function getStickyWallCollision(blob, collision) {
  if (blob.ability !== 'sticky') {
    return null;
  }

  return (collision.collisions ?? []).find((entry) => {
    return entry.wall && entry.rect?.type === 'sticky-wall';
  }) ?? null;
}

function createHeldWallCollision(blob) {
  return {
    body: {
      ...blob,
      velocity: { x: 0, y: 0 }
    },
    collisions: [],
    grounded: false
  };
}

export function createGameSession({ levelIndex, skinId = 'peach' }) {
  const resolvedIndex = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
  const level = LEVELS[resolvedIndex];
  const blob = createBlobState(level.spawn);

  return {
    levelIndex: resolvedIndex,
    level,
    status: 'playing',
    jumps: 0,
    launches: 0,
    elapsedMs: 0,
    collectedStars: 0,
    blob: {
      ...blob,
      skinId
    },
    runtime: createLevelRuntime(level),
    result: null,
    lastFrameEvents: {
      jumped: false,
      launched: false,
      pickedAbility: null,
      collectedStars: [],
      enteredDoor: false,
      blockedDoor: false,
      remainingStars: 0,
      failed: false
    }
  };
}

export function resetGameSession(session, overrides = {}) {
  return createGameSession({
    levelIndex: overrides.levelIndex ?? session.levelIndex,
    skinId: overrides.skinId ?? session.blob.skinId ?? 'peach'
  });
}

export function buildSessionResult(session) {
  return evaluateRun(session.level, {
    timeMs: Math.round(session.elapsedMs),
    jumps: session.jumps,
    launches: session.jumps,
    starsCollected: session.runtime.collectedStarIds.length
  });
}

export function stepGameSession(session, frame) {
  if (session.status !== 'playing') {
    return session;
  }

  const level = session.level ?? LEVELS[session.levelIndex] ?? LEVELS[0];
  const dt = frame.dt ?? 1 / 60;
  let jumps = session.jumps ?? session.launches ?? 0;
  let blob = applyAbilityTimer(session.blob, dt);
  let jumped = false;

  if (blob.stuckToWall && blob.ability !== 'sticky') {
    blob = {
      ...blob,
      canJump: false,
      canLaunch: false,
      stuckToWall: false,
      wallNormalX: 0
    };
  }

  blob = applyHorizontalControl(blob, frame.input?.moveX ?? 0, dt);

  if (isJumpRequested(frame.input) && canBlobJump(blob)) {
    blob = applyJumpImpulse(blob, frame.input?.moveX ?? 0);
    jumps += 1;
    jumped = true;
  }

  const collision =
    blob.stuckToWall && !jumped
      ? createHeldWallCollision(blob)
      : resolveWorldCollision(
          integrateVelocity(
            {
              ...blob,
              acceleration: {
                x: 0,
                y: blob.ability === 'heavy' ? 900 : 0
              },
              force: {
                x: 0,
                y: 0
              }
            },
            dt
          ),
          buildLevelSurfaces(level, session.runtime),
          {
            restitution: blob.ability === 'elastic' ? 0.34 : 0.16,
            friction: 0.12
          }
        );
  const wallCollision = getStickyWallCollision(blob, collision);
  const stuckToWall = Boolean(wallCollision) || (blob.stuckToWall && !jumped);
  const wallNormalX = wallCollision?.normal?.x ?? (stuckToWall ? blob.wallNormalX : 0);

  blob = {
    ...collision.body,
    grounded: stuckToWall ? false : collision.grounded,
    canJump: collision.grounded || stuckToWall,
    canLaunch: collision.grounded || stuckToWall,
    stuckToWall,
    wallNormalX,
    velocity: stuckToWall ? { x: 0, y: 0 } : collision.body.velocity,
    skinId: session.blob.skinId
  };

  const runtimeStep = stepLevelRuntime(level, session.runtime, blob, dt);

  if (runtimeStep.pickedAbility) {
    blob = {
      ...blob,
      ability: runtimeStep.pickedAbility,
      abilityTimerMs: ABILITY_DURATION_MS
    };
  }

  blob = applyEnvironmentalForces(blob, runtimeStep.forces, dt);
  blob = applyLaunchBoost(blob, runtimeStep.launchBoost);

  let status = 'playing';
  let result = null;
  let failed = false;

  if (runtimeStep.enteredDoor) {
    status = 'won';
  } else if (
    blob.position.y > level.world.height + OUT_OF_BOUNDS_MARGIN ||
    blob.position.x < -OUT_OF_BOUNDS_MARGIN ||
    blob.position.x > level.world.width + OUT_OF_BOUNDS_MARGIN
  ) {
    status = 'failed';
    failed = true;
  }

  const next = {
    ...session,
    level,
    jumps,
    launches: jumps,
    elapsedMs: session.elapsedMs + dt * 1000,
    collectedStars: runtimeStep.runtime.collectedStarIds.length,
    blob,
    runtime: runtimeStep.runtime,
    status,
    result,
    lastFrameEvents: {
      jumped,
      launched: jumped,
      pickedAbility: runtimeStep.pickedAbility,
      collectedStars: runtimeStep.collectedStars,
      enteredDoor: runtimeStep.enteredDoor,
      blockedDoor: runtimeStep.blockedDoor,
      remainingStars: runtimeStep.remainingStars,
      failed
    }
  };

  if (status === 'won') {
    next.result = buildSessionResult(next);
  }

  return next;
}
