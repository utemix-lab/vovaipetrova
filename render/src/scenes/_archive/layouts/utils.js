export function centerPositions(positions) {
  let count = 0;
  const sum = { x: 0, y: 0, z: 0 };

  positions.forEach((pos) => {
    sum.x += pos.x;
    sum.y += pos.y;
    sum.z += pos.z;
    count += 1;
  });

  if (!count) return positions;
  const cx = sum.x / count;
  const cy = sum.y / count;
  const cz = sum.z / count;

  positions.forEach((pos) => {
    pos.x -= cx;
    pos.y -= cy;
    pos.z -= cz;
  });

  return positions;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
