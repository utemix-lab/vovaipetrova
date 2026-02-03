const DEFAULT_SEED = 1337;

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createDemoGraph({
  nodeCount = 90,
  linkFactor = 2.2,
  seed = DEFAULT_SEED
} = {}) {
  const rng = mulberry32(seed);
  const count = clamp(nodeCount, 60, 120);
  const groups = ["system", "layer", "artifact", "actor", "project"];

  const nodes = Array.from({ length: count }, (_, index) => {
    const group = pick(rng, groups);
    const importance = clamp(rng() * 1.4 + 0.2, 0.1, 1.6);
    return {
      id: `n${index + 1}`,
      label: `${group}-${index + 1}`,
      group,
      importance
    };
  });

  const links = [];
  const targetLinks = Math.floor(count * linkFactor);

  for (let i = 1; i < nodes.length; i += 1) {
    const source = nodes[i - 1].id;
    const target = nodes[i].id;
    links.push({ source, target, weight: rng() * 0.9 + 0.1 });
  }

  while (links.length < targetLinks) {
    const source = pick(rng, nodes).id;
    const target = pick(rng, nodes).id;
    if (source === target) continue;
    const key = `${source}-${target}`;
    if (links.some((link) => `${link.source}-${link.target}` === key)) continue;
    links.push({ source, target, weight: rng() * 0.9 + 0.1 });
  }

  return { nodes, links };
}
