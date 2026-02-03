export function layoutMolecule(nodes) {
  const positions = new Map();
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: node.x ?? 0,
      y: node.y ?? 0,
      z: node.z ?? 0
    });
  });
  return positions;
}
