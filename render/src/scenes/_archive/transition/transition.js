export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createTransition(fromPositions, toPositions, durationMs) {
  return {
    fromPositions,
    toPositions,
    t0: performance.now(),
    duration: durationMs
  };
}

export function applyTransition(transition, nowMs, outPositions) {
  const elapsed = nowMs - transition.t0;
  const raw = Math.min(1, Math.max(0, elapsed / transition.duration));
  const eased = easeInOutCubic(raw);

  transition.toPositions.forEach((toPos, id) => {
    const fromPos = transition.fromPositions.get(id) || { x: 0, y: 0, z: 0 };
    outPositions.set(id, {
      x: fromPos.x + (toPos.x - fromPos.x) * eased,
      y: fromPos.y + (toPos.y - fromPos.y) * eased,
      z: fromPos.z + (toPos.z - fromPos.z) * eased
    });
  });

  return { progress: raw, done: raw >= 1 };
}
