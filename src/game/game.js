import { createBlobState, getLaunchVelocity } from './blob.js';
import { LEVELS } from './level-data.js';
import { integrateVelocity, resolveWorldCollision } from './physics.js';
import { evaluateRun } from './scoring.js';
import { createLevelRuntime, stepLevelRuntime } from './level-runtime.js';

const ABILITY_DURATION_MS = 6500;
const OUT_OF_BOUNDS_MARGIN = 160;

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

  const nextTimer = (blob.abilityTimerMs ?? ABILITY_DURATION_MS) - dt * 1000;

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
  if (!forces || (!forces.x && !forces.y)) {
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
  if (!launchBoost || (!launchBoost.x && !launchBoost.y)) {
    return blob;
  }

  return {
    ...blob,
    velocity: {
      x: blob.velocity.x + launchBoost.x,
      y: blob.velocity.y + launchBoost.y
    }
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
      launched: false,
      pickedAbility: null,
      collectedStars: [],
      enteredDoor: false,
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
    launches: session.launches,
    starsCollected: session.runtime.collectedStarIds.length
  });
}

export function stepGameSession(session, frame) {
  if (session.status !== 'playing') {
    return session;
  }

  const level = session.level ?? LEVELS[session.levelIndex] ?? LEVELS[0];
  const dt = frame.dt ?? 1 / 60;
  let launches = session.launches;
  let blob = applyAbilityTimer(session.blob, dt);
  let launched = false;

  if (
    frame.input?.released &&
    (frame.input.charging ||
      frame.input.dragDistance > 0 ||
      frame.input.dragPower > 0)
  ) {
    const launch = getLaunchVelocity(frame.input.dragVector, blob.ability);
    blob = {
      ...blob,
      velocity: {
        x: launch.x,
        y: launch.y
      },
      grounded: false
    };
    launches += 1;
    launched = true;
  }

  const heavyGravity = blob.ability === 'heavy' ? 900 : 0;
  const steppedBlob = integrateVelocity(
    {
      ...blob,
      acceleration: {
        x: 0,
        y: heavyGravity
      },
      force: {
        x: 0,
        y: 0
      }
    },
    dt
  );
  const collision = resolveWorldCollision(
    steppedBlob,
    buildLevelSurfaces(level, session.runtime),
    {
      restitution: blob.ability === 'elastic' ? 0.34 : 0.16,
      friction: 0.12
    }
  );
  blob = {
    ...collision.body,
    grounded: collision.grounded,
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
    launches,
    elapsedMs: session.elapsedMs + dt * 1000,
    collectedStars: runtimeStep.runtime.collectedStarIds.length,
    blob,
    runtime: runtimeStep.runtime,
    status,
    result,
    lastFrameEvents: {
      launched,
      pickedAbility: runtimeStep.pickedAbility,
      collectedStars: runtimeStep.collectedStars,
      enteredDoor: runtimeStep.enteredDoor,
      failed
    }
  };

  if (status === 'won') {
    next.result = buildSessionResult(next);
  }

  return next;
}
