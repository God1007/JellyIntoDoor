import { describe, expect, it } from 'vitest';
import { LEVELS, SKINS } from '../src/game/level-data.js';

function hasSupportingPlatform(level, door) {
  return (level.platforms ?? []).some((platform) => {
    const overlapsX =
      door.x + door.width > platform.x &&
      door.x < platform.x + platform.width;

    return overlapsX && door.y + door.height === platform.y;
  });
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

  it('rebuilds the first ten levels as long horizontal platformer stages', () => {
    expect(LEVELS.slice(0, 10)).toHaveLength(10);
    LEVELS.slice(0, 10).forEach((level) => {
      expect(level.world.width).toBeGreaterThanOrEqual(2160);
    });
  });

  it('keeps every opening-chapter door aligned to its supporting floor', () => {
    LEVELS.slice(0, 10).forEach((level) => {
      expect(hasSupportingPlatform(level, level.door)).toBe(true);
    });
  });

  it('retunes level 2-2 around a stronger spring-assisted route', () => {
    const springPen = LEVELS.find((level) => level.id === '2-2');

    expect(springPen.springs[0]).toMatchObject({
      boost: 2.35,
      launchBoost: 987
    });
    expect(springPen.world.width).toBeGreaterThanOrEqual(2320);
    expect(hasSupportingPlatform(springPen, springPen.door)).toBe(true);
  });

  it('expands the campaign to twenty authored levels', () => {
    expect(LEVELS).toHaveLength(20);
    LEVELS.forEach((level) => {
      expect(level.world.width).toBeGreaterThanOrEqual(2160);
      expect(hasSupportingPlatform(level, level.door)).toBe(true);
    });
  });
});
