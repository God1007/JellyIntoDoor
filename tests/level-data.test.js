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

function overlapsX(a, b) {
  return a.x + a.width > b.x && a.x < b.x + b.width;
}

function overlapWidth(a, b) {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
}

function findLevel(id) {
  return LEVELS.find((level) => level.id === id);
}

function hasBlockingPlatformAbove(level, springRect) {
  return (level.platforms ?? []).some((platform) => {
    if (platform.type === 'ground') {
      return false;
    }

    return (
      overlapsX(platform, springRect) &&
      platform.y < springRect.y &&
      platform.y + platform.height >= springRect.y
    );
  });
}

function hasSpringRunway(level, springRect) {
  return (level.platforms ?? []).some((platform) => {
    return (
      platform.x < springRect.x &&
      platform.x + platform.width >= springRect.x - 90 &&
      platform.y >= springRect.y - 60
    );
  });
}

function hasSpringLanding(level, springRect) {
  return (level.platforms ?? []).some((platform) => {
    return (
      platform.x >= springRect.x + springRect.width + 100 &&
      platform.x <= springRect.x + 520 &&
      platform.y <= springRect.y - 90
    );
  });
}

function hasParallelLanes(level) {
  const platforms = (level.platforms ?? []).filter((platform) => {
    return platform.type !== 'ground' && platform.type !== 'goal-floor';
  });

  return platforms.some((platform, index) => {
    return platforms.slice(index + 1).some((other) => {
      return overlapWidth(platform, other) >= 80 && Math.abs(platform.y - other.y) >= 70;
    });
  });
}

function longestNonGoalPlatform(level) {
  return Math.max(
    0,
    ...(level.platforms ?? [])
      .filter((platform) => platform.type !== 'ground' && platform.type !== 'goal-floor')
      .map((platform) => platform.width)
  );
}

function openingIdentity(level) {
  if ((level.fans ?? []).length > 0) {
    return 'fan-route';
  }

  if ((level.buttons ?? []).length > 0) {
    return 'button-route';
  }

  if (hasParallelLanes(level)) {
    return 'split-route';
  }

  if (longestNonGoalPlatform(level) >= 280) {
    return 'long-ground';
  }

  if ((level.springs ?? []).length >= 2) {
    return 'multi-spring';
  }

  if ((level.springs ?? []).length === 1) {
    return 'spring-route';
  }

  return 'plain-platforming';
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

  it('keeps level 1-3 spring clear of blocking overhead platforms', () => {
    const springIntro = findLevel('1-3');
    const springRect = springIntro.springs[0];

    expect(hasBlockingPlatformAbove(springIntro, springRect)).toBe(false);
    expect(hasSpringRunway(springIntro, springRect)).toBe(true);
    expect(hasSpringLanding(springIntro, springRect)).toBe(true);
  });

  it('retunes level 2-2 around a stronger spring-assisted route', () => {
    const springPen = findLevel('2-2');

    expect(springPen.springs[0]).toMatchObject({
      boost: 2.35,
      launchBoost: 987
    });
    expect(springPen.world.width).toBeGreaterThanOrEqual(2320);
    expect(hasSupportingPlatform(springPen, springPen.door)).toBe(true);
  });

  it('gives the opening ten levels a broader mix of route identities', () => {
    const identities = LEVELS.slice(0, 10).map((level) => openingIdentity(level));
    const uniqueIdentities = new Set(identities);

    ['split-route', 'spring-route', 'button-route', 'long-ground', 'multi-spring', 'fan-route']
      .forEach((identity) => {
        expect(uniqueIdentities.has(identity)).toBe(true);
      });
    expect(identities.filter((identity) => identity === 'plain-platforming')).toHaveLength(1);
    expect(identities.filter((identity) => identity === 'spring-route').length).toBeLessThanOrEqual(2);
  });

  it('expands the campaign to twenty authored levels', () => {
    expect(LEVELS).toHaveLength(20);
    LEVELS.forEach((level) => {
      expect(level.world.width).toBeGreaterThanOrEqual(2160);
      expect(hasSupportingPlatform(level, level.door)).toBe(true);
    });
  });
});
