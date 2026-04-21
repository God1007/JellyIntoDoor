export const WORLD_GRAVITY = 1800;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y);

  if (!length) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

export function integrateVelocity(body, dt) {
  const force = body.force ?? { x: 0, y: 0 };
  const acceleration = body.acceleration ?? { x: 0, y: 0 };
  const mass = body.mass && body.mass > 0 ? body.mass : 1;
  const nextVelocity = {
    x: body.velocity.x + (acceleration.x + force.x / mass) * dt,
    y: body.velocity.y + (acceleration.y + force.y / mass + WORLD_GRAVITY) * dt
  };

  return {
    ...body,
    velocity: nextVelocity,
    position: {
      x: body.position.x + nextVelocity.x * dt,
      y: body.position.y + nextVelocity.y * dt
    }
  };
}

export function circleIntersectsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function resolveSingleCollision(body, rect, restitution, friction) {
  const circle = {
    x: body.position.x,
    y: body.position.y,
    radius: body.radius
  };

  if (!circleIntersectsRect(circle, rect)) {
    return { body, collision: null };
  }

  const insideX = circle.x >= rect.x && circle.x <= rect.x + rect.width;
  const insideY = circle.y >= rect.y && circle.y <= rect.y + rect.height;
  let nextBody = {
    ...body,
    position: { ...body.position },
    velocity: { ...body.velocity }
  };
  let normal = { x: 0, y: -1 };

  if (insideX && insideY) {
    const left = circle.x - rect.x;
    const right = rect.x + rect.width - circle.x;
    const top = circle.y - rect.y;
    const bottom = rect.y + rect.height - circle.y;
    const minDistance = Math.min(left, right, top, bottom);

    if (minDistance === top) {
      nextBody.position.y = rect.y - body.radius;
      normal = { x: 0, y: -1 };
    } else if (minDistance === bottom) {
      nextBody.position.y = rect.y + rect.height + body.radius;
      normal = { x: 0, y: 1 };
    } else if (minDistance === left) {
      nextBody.position.x = rect.x - body.radius;
      normal = { x: -1, y: 0 };
    } else {
      nextBody.position.x = rect.x + rect.width + body.radius;
      normal = { x: 1, y: 0 };
    }
  } else {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.hypot(dx, dy) || 1;
    const overlap = body.radius - distance;

    if (overlap > 0) {
      normal = normalize({ x: dx, y: dy });
      nextBody.position.x += normal.x * overlap;
      nextBody.position.y += normal.y * overlap;
    }
  }

  const normalVelocity = nextBody.velocity.x * normal.x + nextBody.velocity.y * normal.y;

  if (normalVelocity < 0) {
    nextBody.velocity.x -= (1 + restitution) * normalVelocity * normal.x;
    nextBody.velocity.y -= (1 + restitution) * normalVelocity * normal.y;

    const tangent = {
      x: -normal.y,
      y: normal.x
    };
    const tangentVelocity = nextBody.velocity.x * tangent.x + nextBody.velocity.y * tangent.y;
    nextBody.velocity.x -= tangentVelocity * friction * tangent.x;
    nextBody.velocity.y -= tangentVelocity * friction * tangent.y;
  }

  return {
    body: nextBody,
    collision: {
      rect,
      normal,
      grounded: normal.y < -0.5,
      ceiling: normal.y > 0.5,
      wall: Math.abs(normal.x) > 0.5
    }
  };
}

export function resolveWorldCollision(blob, surfaces, options = {}) {
  let nextBody = {
    ...blob,
    position: { ...blob.position },
    velocity: { ...blob.velocity }
  };
  const collisions = [];
  const restitution = options.restitution ?? 0.15;
  const friction = options.friction ?? 0.1;

  for (const surface of surfaces ?? []) {
    const result = resolveSingleCollision(
      nextBody,
      surface,
      surface.restitution ?? surface.bounce ?? restitution,
      surface.friction ?? friction
    );

    nextBody = result.body;

    if (result.collision) {
      collisions.push(result.collision);
    }
  }

  return {
    body: nextBody,
    collisions,
    grounded: collisions.some((collision) => collision.grounded),
    touchedSurfaces: collisions.map((collision) => collision.rect)
  };
}
