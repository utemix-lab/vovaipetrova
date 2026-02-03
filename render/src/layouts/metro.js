import { centerPositions } from "./utils.js";

export function layoutMetro(nodes) {
  const positions = new Map();
  const groups = Array.from(new Set(nodes.map((node) => node.group).filter(Boolean)));
  const lineOrder = groups.length ? groups : ["line"];
  const lineSpacing = 70;
  const stopSpacing = 22;

  const buckets = new Map();
  lineOrder.forEach((group) => buckets.set(group, []));

  nodes.forEach((node) => {
    const key = buckets.has(node.group) ? node.group : lineOrder[0];
    buckets.get(key).push(node);
  });

  lineOrder.forEach((group, lineIndex) => {
    const bucket = buckets.get(group) || [];
    bucket.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    bucket.forEach((node, stopIndex) => {
      const x = (lineIndex - (lineOrder.length - 1) / 2) * lineSpacing;
      const y = (stopIndex - (bucket.length - 1) / 2) * stopSpacing;
      positions.set(node.id, { x, y, z: 0 });
    });
  });

  return centerPositions(positions);
}
