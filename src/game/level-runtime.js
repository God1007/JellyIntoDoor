import { circleIntersectsRect } from './physics.js';

function clonePoint(point) {
  return point ? { x: point.x, y: point.y } : null;
}

function cloneEntity(entity) {
  return {
    ...entity
  };
}

function mapById(entities = []) {
  const map = {};

  entities.forEach((entity, index) => {
    const id = entity.id ?? `entity-${index + 1}`;
    map[id] = cloneEntity({ ...entity, id });
  });

  return map;
}

function cloneMovingPlatform(platform) {
  return {
    ...platform,
    from: clonePoint(platform.from) ?? { x: platform.x ?? 0, y: platform.y ?? 0 },
    to: clonePoint(platform.to) ?? { x: platform.x ?? 0, y: platform.y ?? 0 },
    position: clonePoint(platform.position) ?? { x: platform.x ?? 0, y: platform.y ?? 0 },
    phase: platform.phase ?? 0
  };
}

function updateMovingPlatforms(platforms = [], dt) {
  return platforms.map((platform) => {
    const cycleSpeed = platform.speed ?? 1;
    const nextPhase = (platform.phase + dt * cycleSpeed * 0.5) % 1;
    const progress = (Math.sin(nextPhase * Math.PI * 2 - Math.PI / 2) + 1) * 0.5;

    return {
      ...platform,
      phase: nextPhase,
      position: {
        x: platform.from.x + (platform.to.x - platform.from.x) * progress,
        y: platform.from.y + (platform.to.y - platform.from.y) * progress
      }
    };
  });
}

function asCircle(blob) {
  return {
    x: blob.position.x,
    y: blob.position.y,
    radius: blob.radius
  };
}

function intersectsCircleRect(blob, rect) {
  return circleIntersectsRect(asCircle(blob), rect);
}

function resolveFanForce(fan) {
  if (fan.force && typeof fan.force === 'object') {
    return {
      x: fan.force.x ?? 0,
      y: fan.force.y ?? 0
    };
  }

  const strength = fan.strength ?? fan.force ?? 0;

  switch (fan.direction) {
    case 'left':
      return { x: -strength, y: 0 };
    case 'right':
      return { x: strength, y: 0 };
    case 'down':
      return { x: 0, y: strength };
    default:
      return { x: 0, y: -strength };
  }
}

export function createLevelRuntime(level) {
  return {
    doors: mapById(level.doors),
    buttons: mapById(level.buttons),
    stars: mapById(level.stars),
    pickups: mapById(level.pickups),
    springs: mapById(level.springs),
    fans: mapById(level.fans),
    fragileFloors: mapById(level.fragileFloors),
    movingPlatforms: (level.movingPlatforms ?? []).map(cloneMovingPlatform),
    collectedStarIds: [],
    collectedPickupIds: [],
    pressedButtonIds: [],
    openedDoorIds: [],
    brokenFloorIds: [],
    currentAbility: null
  };
}

export function stepLevelRuntime(level, runtime, blob, dt) {
  const nextRuntime = {
    ...runtime,
    doors: { ...runtime.doors },
    buttons: { ...runtime.buttons },
    stars: { ...runtime.stars },
    pickups: { ...runtime.pickups },
    springs: { ...runtime.springs },
    fans: { ...runtime.fans },
    fragileFloors: { ...runtime.fragileFloors },
    movingPlatforms: updateMovingPlatforms(runtime.movingPlatforms, dt),
    collectedStarIds: [...runtime.collectedStarIds],
    collectedPickupIds: [...runtime.collectedPickupIds],
    pressedButtonIds: [...runtime.pressedButtonIds],
    openedDoorIds: [...runtime.openedDoorIds],
    brokenFloorIds: [...runtime.brokenFloorIds]
  };

  const collectedStars = [];
  const pressedButtonIds = [];
  const openedDoorIds = [];
  const brokeFloorIds = [];
  let pickedAbility = null;
  let enteredDoor = false;
  let blockedDoor = false;
  let launchBoost = { x: 0, y: 0 };
  let landedOnSpring = null;
  let forces = { x: 0, y: 0 };

  for (const button of level.buttons ?? []) {
    if (!intersectsCircleRect(blob, button)) {
      continue;
    }

    nextRuntime.buttons[button.id] = {
      ...nextRuntime.buttons[button.id],
      pressed: true
    };

    if (!nextRuntime.pressedButtonIds.includes(button.id)) {
      nextRuntime.pressedButtonIds.push(button.id);
      pressedButtonIds.push(button.id);
    }

    const linkedDoorIds = [
      button.opensDoorId,
      ...(button.opensDoorIds ?? [])
    ].filter(Boolean);

    linkedDoorIds.forEach((doorId) => {
      if (!nextRuntime.doors[doorId]) {
        return;
      }

      nextRuntime.doors[doorId] = {
        ...nextRuntime.doors[doorId],
        open: true
      };

      if (!nextRuntime.openedDoorIds.includes(doorId)) {
        nextRuntime.openedDoorIds.push(doorId);
        openedDoorIds.push(doorId);
      }
    });
  }

  for (const star of level.stars ?? []) {
    if (nextRuntime.stars[star.id]?.collected) {
      continue;
    }

    if (!intersectsCircleRect(blob, {
      x: star.x - star.radius,
      y: star.y - star.radius,
      width: star.radius * 2,
      height: star.radius * 2
    })) {
      continue;
    }

    nextRuntime.stars[star.id] = {
      ...nextRuntime.stars[star.id],
      collected: true
    };
    nextRuntime.collectedStarIds.push(star.id);
    collectedStars.push(star.id);
  }

  for (const pickup of level.pickups ?? []) {
    if (nextRuntime.pickups[pickup.id]?.collected) {
      continue;
    }

    if (!intersectsCircleRect(blob, {
      x: pickup.x - pickup.radius,
      y: pickup.y - pickup.radius,
      width: pickup.radius * 2,
      height: pickup.radius * 2
    })) {
      continue;
    }

    nextRuntime.pickups[pickup.id] = {
      ...nextRuntime.pickups[pickup.id],
      collected: true
    };
    nextRuntime.collectedPickupIds.push(pickup.id);
    nextRuntime.currentAbility = pickup.ability ?? pickup.type ?? null;
    pickedAbility = nextRuntime.currentAbility;
  }

  for (const spring of level.springs ?? []) {
    if (!intersectsCircleRect(blob, spring) || blob.velocity.y < 0) {
      continue;
    }

    launchBoost =
      spring.direction === 'left'
        ? { x: -(spring.launchBoost ?? 500), y: 0 }
        : spring.direction === 'right'
          ? { x: spring.launchBoost ?? 500, y: 0 }
          : spring.direction === 'down'
            ? { x: 0, y: spring.launchBoost ?? 500 }
            : { x: 0, y: -(spring.launchBoost ?? 500) };
    landedOnSpring = { id: spring.id, launchBoost };
  }

  for (const fan of level.fans ?? []) {
    if (!intersectsCircleRect(blob, fan)) {
      continue;
    }

    const force = resolveFanForce(fan);
    forces = {
      x: forces.x + force.x,
      y: forces.y + force.y
    };
  }

  for (const floor of level.fragileFloors ?? []) {
    if (nextRuntime.fragileFloors[floor.id]?.broken) {
      continue;
    }

    if (!intersectsCircleRect(blob, floor)) {
      continue;
    }

    const heavyHit = blob.ability === 'heavy';
    const hardLanding = blob.velocity.y > (floor.breakVelocity ?? 180);

    if (!heavyHit && !hardLanding) {
      continue;
    }

    nextRuntime.fragileFloors[floor.id] = {
      ...nextRuntime.fragileFloors[floor.id],
      broken: true
    };
    nextRuntime.brokenFloorIds.push(floor.id);
    brokeFloorIds.push(floor.id);
  }

  const remainingStars = Math.max(0, (level.stars ?? []).length - nextRuntime.collectedStarIds.length);

  for (const door of level.doors ?? []) {
    const runtimeDoor = nextRuntime.doors[door.id];

    if (!runtimeDoor?.open) {
      continue;
    }

    if (!intersectsCircleRect(blob, door)) {
      continue;
    }

    if (remainingStars > 0) {
      blockedDoor = true;
      break;
    }

    enteredDoor = true;
    break;
  }

  return {
    runtime: nextRuntime,
    forces,
    launchBoost,
    landedOnSpring,
    enteredDoor,
    blockedDoor,
    remainingStars,
    collectedStars,
    pickedAbility,
    brokeFloorIds,
    movingPlatforms: nextRuntime.movingPlatforms,
    pressedButtonIds,
    openedDoorIds,
    completed: enteredDoor
  };
}
