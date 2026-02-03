import { centerPositions } from "./utils.js";

export function layoutDna(nodes) {
  const positions = new Map();
  const radius = 48;
  const pitch = 14;
  const step = 0.55;

  nodes.forEach((node, index) => {
    const rung = Math.floor(index / 2);
    const strand = index % 2;
    const angle = rung * step + (strand ? Math.PI : 0);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (rung - (nodes.length / 4)) * pitch;
    positions.set(node.id, { x, y, z });
  });

  return centerPositions(positions);
}
