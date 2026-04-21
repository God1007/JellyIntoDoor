import { describe, expect, it } from 'vitest';
import { LEVELS, SKINS } from '../src/game/level-data.js';

const BLOB_RADIUS = 18;
const GRID_STEP = 4;

function inflateSurface(surface) {
  return {
    x: surface.x - BLOB_RADIUS,
    y: surface.y - BLOB_RADIUS,
    width: surface.width + BLOB_RADIUS * 2,
    height: surface.height + BLOB_RADIUS * 2
  };
}

function pointInsideRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function pointKey(point) {
  return `${point.x},${point.y}`;
}

function findNearestFreePoint(target, blockedRects, world) {
  const start = {
    x: Math.round(target.x / GRID_STEP) * GRID_STEP,
    y: Math.round(target.y / GRID_STEP) * GRID_STEP
  };
  const queue = [start];
  const visited = new Set();

  while (queue.length > 0) {
    const point = queue.shift();
    const key = pointKey(point);

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    const withinBounds =
      point.x >= BLOB_RADIUS &&
      point.x <= world.width - BLOB_RADIUS &&
      point.y >= BLOB_RADIUS &&
      point.y <= world.height - BLOB_RADIUS;
    const blocked = blockedRects.some((rect) => pointInsideRect(point, rect));

    if (withinBounds && !blocked) {
      return point;
    }

    for (const [dx, dy] of [
      [GRID_STEP, 0],
      [-GRID_STEP, 0],
      [0, GRID_STEP],
      [0, -GRID_STEP]
    ]) {
      const next = {
        x: point.x + dx,
        y: point.y + dy
      };

      if (next.x < 0 || next.y < 0 || next.x > world.width || next.y > world.height) {
        continue;
      }

      queue.push(next);
    }
  }

  return null;
}

function collectReachablePoints(start, blockedRects, world) {
  const queue = [start];
  const visited = new Set([pointKey(start)]);

  while (queue.length > 0) {
    const point = queue.shift();

    for (const [dx, dy] of [
      [GRID_STEP, 0],
      [-GRID_STEP, 0],
      [0, GRID_STEP],
      [0, -GRID_STEP]
    ]) {
      const next = {
        x: point.x + dx,
        y: point.y + dy
      };
      const key = pointKey(next);

      if (visited.has(key)) {
        continue;
      }

      const withinBounds =
        next.x >= BLOB_RADIUS &&
        next.x <= world.width - BLOB_RADIUS &&
        next.y >= BLOB_RADIUS &&
        next.y <= world.height - BLOB_RADIUS;

      if (!withinBounds) {
        continue;
      }

      if (blockedRects.some((rect) => pointInsideRect(next, rect))) {
        continue;
      }

      visited.add(key);
      queue.push(next);
    }
  }

  return visited;
}

describe('level data', () => {
  it('exposes six themed skins for the picker', () => {
    expect(SKINS.map((skin) => skin.id)).toEqual([
      'peach',
      'mint',
      'sky',
      'lemon',
      'cherry',
      'ink'
    ]);
  });

  it('uses the tighter door dimensions across every level', () => {
    LEVELS.forEach((level) => {
      expect(level.door).toMatchObject({
        width: 60,
        height: 84
      });
    });
  });

  it('retunes level 2-2 around a stronger spring-assisted route', () => {
    const springPen = LEVELS.find((level) => level.id === '2-2');

    expect(springPen.springs[0]).toMatchObject({
      boost: 1.97,
      launchBoost: 827
    });
    expect(springPen.door).toMatchObject({
      width: 60,
      height: 84
    });
  });

  it('keeps every star in the same open region as the spawn point', () => {
    const trappedStars = [];

    LEVELS.forEach((level) => {
      const blockedRects = (level.surfaces ?? []).map(inflateSurface);
      const spawnPoint = findNearestFreePoint(level.spawn, blockedRects, level.world);

      expect(spawnPoint).toBeTruthy();

      const reachable = collectReachablePoints(spawnPoint, blockedRects, level.world);

      for (const star of level.stars ?? []) {
        const starPoint = findNearestFreePoint(star, blockedRects, level.world);

        if (!starPoint || !reachable.has(pointKey(starPoint))) {
          trappedStars.push(`${level.id}:${star.id}`);
        }
      }
    });

    expect(trappedStars).toEqual([]);
  });
});
