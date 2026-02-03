const TAU = Math.PI * 2;

function hashId(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seeded(value) {
  const seed = hashId(value) % 1000;
  return seed / 1000;
}

function buildAdjacency(nodes, links) {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set()]));
  links.forEach((link) => {
    const source = typeof link.source === "object" ? link.source.id : link.source;
    const target = typeof link.target === "object" ? link.target.id : link.target;
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(source).add(target);
    adjacency.get(target).add(source);
  });
  return adjacency;
}

export function selectPlanetaryHub(nodes, links) {
  const adjacency = buildAdjacency(nodes, links);
  let bestNode = nodes[0];
  let bestScore = -Infinity;
  nodes.forEach((node) => {
    const degree = adjacency.get(node.id)?.size || 0;
    const importance = node.importance || 0;
    const score = degree * 1.2 + importance * 2;
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  });
  return bestNode?.id;
}

export function createPlanetaryState(nodes, links, options = {}) {
  const hubId = options.hubId || selectPlanetaryHub(nodes, links);
  const adjacency = buildAdjacency(nodes, links);
  const maxDepth = options.maxDepth ?? 4;
  const ringCount = Math.min(options.ringCount ?? 8, 12);
  const baseRadius = options.baseRadius ?? 42;
  const ringSpacing = options.ringSpacing ?? 22;
  const ringRadii = Array.from({ length: ringCount + 1 }, (_, i) => baseRadius + i * ringSpacing);

  const distances = new Map();
  const queue = [];
  distances.set(hubId, 0);
  queue.push(hubId);

  while (queue.length) {
    const current = queue.shift();
    const depth = distances.get(current);
    if (depth >= maxDepth) continue;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    neighbors.forEach((next) => {
      if (!distances.has(next)) {
        distances.set(next, depth + 1);
        queue.push(next);
      }
    });
  }

  const orbitData = new Map();
  const positions = new Map();

  nodes.forEach((node) => {
    if (node.id === hubId) {
      orbitData.set(node.id, { ring: 0, radius: 0, speed: 0, phase: 0, incline: 0 });
      positions.set(node.id, { x: 0, y: 0, z: 0 });
      return;
    }
    const distance = distances.get(node.id) ?? maxDepth + 1;
    const ring = Math.min(ringCount, Math.max(1, distance));
    const radius = ringRadii[ring];
    const phase = seeded(`${node.id}:phase`) * TAU;
    const speed = 0.00025 + ring * 0.00005 + seeded(`${node.id}:speed`) * 0.00012;
    const incline = (seeded(`${node.id}:incline`) - 0.5) * 0.6;

    orbitData.set(node.id, { ring, radius, speed, phase, incline });
    positions.set(node.id, { x: radius * Math.cos(phase), y: radius * 0.2, z: radius * Math.sin(phase) });
  });

  return { hubId, ringCount, ringRadii, orbitData, positions };
}

export function getPlanetaryPosition(nodeId, state, timeMs) {
  const orbit = state.orbitData.get(nodeId);
  if (!orbit) return { x: 0, y: 0, z: 0 };
  if (orbit.ring === 0) return { x: 0, y: 0, z: 0 };
  const t = timeMs * orbit.speed + orbit.phase;
  const x = orbit.radius * Math.cos(t);
  const z = orbit.radius * Math.sin(t);
  const y = Math.sin(t) * orbit.radius * orbit.incline;
  return { x, y, z };
}
