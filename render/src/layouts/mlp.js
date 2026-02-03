import { centerPositions } from "./utils.js";

export function layoutMlp(nodes) {
  const positions = new Map();
  const groups = Array.from(new Set(nodes.map((node) => node.group).filter(Boolean)));
  const layerOrder = groups.length ? groups : ["layer"];
  const layerSpacing = 90;
  const rowSpacing = 18;

  const buckets = new Map();
  layerOrder.forEach((group) => buckets.set(group, []));

  nodes.forEach((node) => {
    const key = buckets.has(node.group) ? node.group : layerOrder[0];
    buckets.get(key).push(node);
  });

  layerOrder.forEach((group, layerIndex) => {
    const bucket = buckets.get(group) || [];
    bucket.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    bucket.forEach((node, rowIndex) => {
      const x = (layerIndex - (layerOrder.length - 1) / 2) * layerSpacing;
      const y = (rowIndex - (bucket.length - 1) / 2) * rowSpacing;
      positions.set(node.id, { x, y, z: 0 });
    });
  });

  nodes.forEach((node) => {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: 0, y: 0, z: 0 });
    }
  });

  return centerPositions(positions);
}
