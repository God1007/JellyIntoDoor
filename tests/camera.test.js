import { describe, expect, it } from 'vitest';

async function loadCameraModule() {
  try {
    const modulePath = `../src/game/render/${'camera.js'}`;
    return await import(modulePath);
  } catch {
    return null;
  }
}

describe('camera', () => {
  it('keeps vertical framing fixed while following horizontal movement', async () => {
    const cameraModule = await loadCameraModule();

    expect(cameraModule?.createCameraState).toBeTypeOf('function');
    expect(cameraModule?.updateCamera).toBeTypeOf('function');

    const camera = cameraModule.updateCamera(
      cameraModule.createCameraState(),
      { position: { x: 480, y: 120 }, velocity: { x: 180, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );

    expect(camera.x).toBeGreaterThan(0);
    expect(camera.y).toBe(0);
  });

  it('clamps to the right edge of the world', async () => {
    const cameraModule = await loadCameraModule();

    expect(cameraModule?.updateCamera).toBeTypeOf('function');

    const camera = cameraModule.updateCamera(
      cameraModule.createCameraState(),
      { position: { x: 2380, y: 120 }, velocity: { x: 220, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );

    expect(camera.x).toBeLessThanOrEqual(1440);
  });

  it('looks ahead in the direction of travel', async () => {
    const cameraModule = await loadCameraModule();

    expect(cameraModule?.updateCamera).toBeTypeOf('function');

    const left = cameraModule.updateCamera(
      cameraModule.createCameraState(),
      { position: { x: 900, y: 120 }, velocity: { x: -180, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );
    const right = cameraModule.updateCamera(
      cameraModule.createCameraState(),
      { position: { x: 900, y: 120 }, velocity: { x: 180, y: 0 } },
      { world: { width: 2400, height: 540 } },
      { width: 960, height: 540 },
      1 / 60
    );

    expect(right.x).toBeGreaterThan(left.x);
  });
});
