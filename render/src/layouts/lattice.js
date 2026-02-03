import { centerPositions } from "./utils.js";

export function layoutLattice(nodes) {
  const positions = new Map();
  const spacing = 26;
  const grid = Math.ceil(Math.cbrt(nodes.length));

  nodes.forEach((node, index) => {
    const xIndex = index % grid;
    const yIndex = Math.floor(index / grid) % grid;
    const zIndex = Math.floor(index / (grid * grid));
    const x = (xIndex - (grid - 1) / 2) * spacing;
    const y = (yIndex - (grid - 1) / 2) * spacing;
    const z = (zIndex - (grid - 1) / 2) * spacing;
    positions.set(node.id, { x, y, z });
  });

  return centerPositions(positions);
}
