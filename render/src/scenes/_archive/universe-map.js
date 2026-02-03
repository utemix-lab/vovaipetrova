import { loadCosmosMap } from "../cosmos/adapter.js";
import "./universe-map.css";

const graphEl = document.getElementById("graph");
if (!graphEl) {
  throw new Error("Missing #graph container");
}

graphEl.innerHTML = "";

const container = document.createElement("div");
container.id = "universeMap";
const canvas = document.createElement("canvas");
canvas.id = "universeCanvas";
container.appendChild(canvas);

graphEl.appendChild(container);

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas not supported");
}

const state = {
  nodes: [],
  links: [],
  clusters: new Map(),
  nodePositions: new Map(),
  visibleNodes: new Set(),
  visibleLinks: new Set(),
  focusedId: null,
  focusedIds: new Set(),
  hoveredId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  drag: null,
  filterTypes: new Set(),
  types: []
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  fitToView();
  render();
}

function getClusterKey(node) {
  return node.clusterId || node.type || "default";
}

function buildIndex() {
  state.clusters.clear();
  state.nodePositions.clear();

  state.nodes.forEach((node) => {
    const key = getClusterKey(node);
    if (!state.clusters.has(key)) {
      state.clusters.set(key, {
        id: key,
        nodes: [],
        collapsed: false,
        center: { x: 0, y: 0 },
        radius: 0
      });
    }
    state.clusters.get(key).nodes.push(node);
  });
}

function layoutClusters() {
  const clusters = Array.from(state.clusters.values());
  const count = clusters.length || 1;
  const radius = 220 + Math.sqrt(state.nodes.length) * 12;

  clusters.forEach((cluster, index) => {
    const angle = (index / count) * Math.PI * 2;
    cluster.center.x = Math.cos(angle) * radius;
    cluster.center.y = Math.sin(angle) * radius;
    cluster.radius = 20 + Math.sqrt(cluster.nodes.length) * 4;

    if (cluster.collapsed) {
      cluster.nodes.forEach((node) => {
        state.nodePositions.set(node.id, { x: cluster.center.x, y: cluster.center.y });
      });
      return;
    }

    const innerRadius = cluster.radius + 14;
    cluster.nodes.forEach((node, idx) => {
      const nodeAngle = (idx / cluster.nodes.length) * Math.PI * 2;
      const nx = cluster.center.x + Math.cos(nodeAngle) * innerRadius;
      const ny = cluster.center.y + Math.sin(nodeAngle) * innerRadius;
      state.nodePositions.set(node.id, { x: nx, y: ny });
    });
  });
}

function applyFilters() {
  state.visibleNodes.clear();
  state.visibleLinks.clear();

  state.nodes.forEach((node) => {
    if (state.filterTypes.size === 0 || state.filterTypes.has(node.type)) {
      state.visibleNodes.add(node);
    }
  });

  state.links.forEach((link) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    const sourceNode = state.nodes.find((node) => node.id === sourceId);
    const targetNode = state.nodes.find((node) => node.id === targetId);
    if (!sourceNode || !targetNode) return;
    if (state.visibleNodes.has(sourceNode) && state.visibleNodes.has(targetNode)) {
      state.visibleLinks.add(link);
    }
  });

  render();
}

function screenToWorld(x, y) {
  return {
    x: (x - state.pan.x) / state.zoom,
    y: (y - state.pan.y) / state.zoom
  };
}

function worldToScreen(x, y) {
  return {
    x: x * state.zoom + state.pan.x,
    y: y * state.zoom + state.pan.y
  };
}

function findNearestNode(x, y) {
  const world = screenToWorld(x, y);
  let nearest = null;
  let minDist = Infinity;

  state.visibleNodes.forEach((node) => {
    const pos = state.nodePositions.get(node.id);
    if (!pos) return;
    const dx = pos.x - world.x;
    const dy = pos.y - world.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  });

  const threshold = 14 / state.zoom;
  return minDist < threshold ? nearest : null;
}

function findClusterHit(x, y) {
  const world = screenToWorld(x, y);
  let hit = null;
  state.clusters.forEach((cluster) => {
    const dx = cluster.center.x - world.x;
    const dy = cluster.center.y - world.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < cluster.radius) {
      hit = cluster;
    }
  });
  return hit;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#050506";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(state.zoom, 0, 0, state.zoom, state.pan.x, state.pan.y);

  // links
  ctx.lineWidth = 1 / state.zoom;
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "#6b7280";

  state.visibleLinks.forEach((link) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    const a = state.nodePositions.get(sourceId);
    const b = state.nodePositions.get(targetId);
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  // clusters
  state.clusters.forEach((cluster) => {
    const anyVisible = cluster.nodes.some((node) => state.visibleNodes.has(node));
    if (!anyVisible) return;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(cluster.center.x, cluster.center.y, cluster.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // nodes
  state.visibleNodes.forEach((node) => {
    const pos = state.nodePositions.get(node.id);
    if (!pos) return;
    const isFocused = node.id === state.focusedId || state.focusedIds.has(node.id);
    const isHovered = node.id === state.hoveredId;
    const radius = isFocused ? 6 : isHovered ? 5 : 4;
    ctx.globalAlpha = 1;
    ctx.fillStyle = isFocused ? "#f59e0b" : "#9ca3af";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // labels
  if (state.hoveredId) {
    const node = state.nodes.find((n) => n.id === state.hoveredId);
    const pos = state.nodePositions.get(state.hoveredId);
    if (node && pos) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "12px Segoe UI";
      const label = node.title || node.label || node.id;
      const screen = worldToScreen(pos.x, pos.y);
      ctx.fillText(label, screen.x + 8, screen.y - 8);
    }
  }
}

function initFilters() {
  state.filterTypes.clear();
  state.types.forEach((type) => state.filterTypes.add(type));
}

function fitToView() {
  if (state.nodePositions.size === 0) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  state.nodePositions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const padding = 0.7;
  const zoomX = (canvas.width / width) * padding;
  const zoomY = (canvas.height / height) * padding;
  state.zoom = Math.min(4, Math.max(0.2, Math.min(zoomX, zoomY)));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  state.pan.x = canvas.width / 2 - centerX * state.zoom;
  state.pan.y = canvas.height / 2 - centerY * state.zoom;
}

function loadData(data, label) {
  const mapped = loadCosmosMap(data);
  state.nodes = mapped.nodes;
  state.links = mapped.links;
  state.types = Array.from(new Set(mapped.nodes.map((node) => node.type).filter(Boolean))).sort();
  buildIndex();
  layoutClusters();
  initFilters();
  applyFilters();
  fitToView();
}

function emitNodeFocus(id) {
  const event = new CustomEvent("graph:nodeFocus", { detail: { id } });
  window.dispatchEvent(event);
}

function emitFocusedIds(ids) {
  const event = new CustomEvent("graph:setFocusedIds", { detail: { ids } });
  window.dispatchEvent(event);
}

window.addEventListener("graph:nodeFocus", (event) => {
  if (!event.detail?.id) return;
  state.focusedId = event.detail.id;
  render();
});

window.addEventListener("graph:setFocusedIds", (event) => {
  if (!Array.isArray(event.detail?.ids)) return;
  state.focusedIds = new Set(event.detail.ids);
  render();
});

canvas.addEventListener("mousemove", (event) => {
  const node = findNearestNode(event.clientX, event.clientY);
  if (node?.id !== state.hoveredId) {
    state.hoveredId = node ? node.id : null;
    render();
  }
});

canvas.addEventListener("mousedown", (event) => {
  state.drag = { x: event.clientX, y: event.clientY, panX: state.pan.x, panY: state.pan.y };
});

canvas.addEventListener("mouseup", (event) => {
  if (!state.drag) return;
  const moved = Math.abs(event.clientX - state.drag.x) + Math.abs(event.clientY - state.drag.y);
  if (moved < 5) {
    const cluster = findClusterHit(event.clientX, event.clientY);
    if (cluster) {
      cluster.collapsed = !cluster.collapsed;
      layoutClusters();
      render();
      state.drag = null;
      return;
    }
    const node = findNearestNode(event.clientX, event.clientY);
    if (node) {
      state.focusedId = node.id;
      emitNodeFocus(node.id);
      emitFocusedIds([node.id]);
      render();
    }
  }
  state.drag = null;
});

canvas.addEventListener("mousemove", (event) => {
  if (!state.drag) return;
  state.pan.x = state.drag.panX + (event.clientX - state.drag.x);
  state.pan.y = state.drag.panY + (event.clientY - state.drag.y);
  render();
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const zoomFactor = Math.exp(-event.deltaY * 0.001);
  const { x, y } = screenToWorld(event.clientX, event.clientY);
  state.zoom = Math.min(4, Math.max(0.3, state.zoom * zoomFactor));
  state.pan.x = event.clientX - x * state.zoom;
  state.pan.y = event.clientY - y * state.zoom;
  render();
}, { passive: false });

window.addEventListener("resize", resize);
resize();

const dataUrl = new URLSearchParams(window.location.search).get("dataUrl");
if (dataUrl) {
  fetch(dataUrl)
    .then((response) => response.json())
    .then((json) => loadData(json, "URL"))
    .catch((error) => console.error(error));
} else {
  loadData(buildDemoGraph(280), "Demo");
}

function buildDemoGraph(nodeCount) {
  const types = ["actor", "artifact", "layer", "project", "system", "concept"];
  const clusters = ["core", "orbit", "tools", "labs", "meta", "archive"];
  const nodes = [];
  const links = [];

  const rand = (() => {
    let seed = 1337;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();

  for (let i = 0; i < nodeCount; i += 1) {
    nodes.push({
      id: `node-${i}`,
      title: `Node ${i + 1}`,
      type: types[Math.floor(rand() * types.length)],
      clusterId: clusters[Math.floor(rand() * clusters.length)]
    });
  }

  const linkCount = Math.floor(nodeCount * 2.2);
  for (let i = 0; i < linkCount; i += 1) {
    const source = nodes[Math.floor(rand() * nodeCount)].id;
    let target = nodes[Math.floor(rand() * nodeCount)].id;
    if (target === source) {
      target = nodes[(Math.floor(rand() * (nodeCount - 1)) + 1) % nodeCount].id;
    }
    links.push({ source, target });
  }

  return {
    schema: "cosmos-map.v0.1",
    nodes,
    links
  };
}
