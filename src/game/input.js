const DEFAULT_MAX_DRAG_DISTANCE = 140;

function clonePoint(point) {
  return point ? { x: point.x, y: point.y } : null;
}

function computeDragState(pointer, blobCenter) {
  const dragVector = {
    x: pointer.x - blobCenter.x,
    y: pointer.y - blobCenter.y
  };
  const dragDistance = Math.hypot(dragVector.x, dragVector.y);

  return {
    dragVector,
    dragDistance,
    dragPower: DEFAULT_MAX_DRAG_DISTANCE > 0
      ? Math.min(1, dragDistance / DEFAULT_MAX_DRAG_DISTANCE)
      : 0
  };
}

export function createInputState() {
  return {
    activePointerId: null,
    charging: false,
    released: false,
    pointerPosition: null,
    blobCenter: null,
    dragVector: { x: 0, y: 0 },
    dragDistance: 0,
    dragPower: 0
  };
}

export function beginPointerCharge(input, pointerId) {
  return {
    ...input,
    activePointerId: pointerId,
    charging: true,
    released: false,
    pointerPosition: null,
    blobCenter: null,
    dragVector: { x: 0, y: 0 },
    dragDistance: 0,
    dragPower: 0
  };
}

export function updateDragIntent(input, pointer, blobCenter) {
  if (
    input.activePointerId !== null &&
    pointer.id !== undefined &&
    pointer.id !== input.activePointerId
  ) {
    return input;
  }

  const dragState = computeDragState(pointer, blobCenter);

  return {
    ...input,
    charging: true,
    released: false,
    pointerPosition: clonePoint(pointer),
    blobCenter: clonePoint(blobCenter),
    ...dragState
  };
}

export function releasePointerCharge(input) {
  return {
    ...input,
    activePointerId: null,
    charging: false,
    released: true
  };
}
