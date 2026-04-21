function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createCameraState() {
  return { x: 0, y: 0 };
}

export function updateCamera(camera, blob, level, viewport, dt) {
  const currentCamera = camera ?? createCameraState();
  const currentBlob = blob ?? { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };
  const currentViewport = viewport ?? { width: 960, height: 540 };
  const worldWidth = level?.world?.width ?? currentViewport.width;
  const maxX = Math.max(0, worldWidth - currentViewport.width);
  const lookAhead = currentBlob.velocity.x >= 0 ? 120 : -120;
  const targetX = clamp(
    currentBlob.position.x - currentViewport.width / 2 + lookAhead,
    0,
    maxX
  );
  const smoothing = 1 - Math.exp(-(dt ?? 1 / 60) * 8);

  return {
    x: currentCamera.x + (targetX - currentCamera.x) * smoothing,
    y: 0
  };
}
