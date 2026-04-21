import { describe, expect, it } from 'vitest';
import { createBlobState } from '../src/game/blob.js';
import { createLevelRuntime, stepLevelRuntime } from '../src/game/level-runtime.js';

function createTestLevel() {
  return {
    buttons: [
      {
        id: 'button-1',
        x: 36,
        y: 36,
        width: 24,
        height: 16,
        opensDoorId: 'door-1'
      }
    ],
    doors: [
      {
        id: 'door-1',
        x: 92,
        y: 24,
        width: 24,
        height: 64
      }
    ],
    stars: [
      {
        id: 'star-1',
        x: 150,
        y: 52,
        radius: 10
      }
    ],
    pickups: [
      {
        id: 'pickup-1',
        x: 210,
        y: 52,
        radius: 10,
        ability: 'elastic'
      }
    ],
    springs: [
      {
        id: 'spring-1',
        x: 270,
        y: 48,
        width: 24,
        height: 12,
        launchBoost: 520
      }
    ],
    fans: [
      {
        id: 'fan-1',
        x: 330,
        y: 40,
        width: 28,
        height: 28,
        direction: 'up',
        strength: 240
      }
    ],
    fragileFloors: [
      {
        id: 'floor-1',
        x: 390,
        y: 48,
        width: 40,
        height: 14,
        breakOnHeavy: true
      }
    ],
    movingPlatforms: [
      {
        id: 'platform-1',
        from: { x: 0, y: 120 },
        to: { x: 40, y: 120 },
        speed: 1
      }
    ]
  };
}

describe('level runtime', () => {
  it('opens the door when the matching button is pressed', () => {
    const level = createTestLevel();
    const runtime = createLevelRuntime(level);
    const blob = createBlobState({ x: 44, y: 44 });

    const result = stepLevelRuntime(level, runtime, blob, 1 / 60);

    expect(result.runtime.doors['door-1'].open).toBe(true);
    expect(result.runtime.buttons['button-1'].pressed).toBe(true);
  });

  it('collects a star only once', () => {
    const level = createTestLevel();
    const runtime = createLevelRuntime(level);
    const blob = createBlobState({ x: 150, y: 52 });

    const first = stepLevelRuntime(level, runtime, blob, 1 / 60);
    const second = stepLevelRuntime(level, first.runtime, blob, 1 / 60);

    expect(first.collectedStars).toEqual(['star-1']);
    expect(second.collectedStars).toEqual([]);
  });

  it('captures a pickup ability only once', () => {
    const level = createTestLevel();
    const runtime = createLevelRuntime(level);
    const blob = createBlobState({ x: 210, y: 52 });

    const first = stepLevelRuntime(level, runtime, blob, 1 / 60);
    const second = stepLevelRuntime(level, first.runtime, blob, 1 / 60);

    expect(first.pickedAbility).toBe('elastic');
    expect(second.pickedAbility).toBe(null);
  });

  it('breaks a fragile floor when a heavy blob lands on it', () => {
    const level = createTestLevel();
    const runtime = createLevelRuntime(level);
    const blob = createBlobState({ x: 398, y: 52 });
    blob.ability = 'heavy';
    blob.velocity.y = 180;

    const result = stepLevelRuntime(level, runtime, blob, 1 / 60);

    expect(result.brokeFloorIds).toEqual(['floor-1']);
    expect(result.runtime.fragileFloors['floor-1'].broken).toBe(true);
  });
});
