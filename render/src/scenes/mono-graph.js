import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import { loadCosmosMap } from "../cosmos/adapter.js";
import { loadGraphConfig, GraphSource } from "../graph/loadGraphConfig.js";
import "./legacy-v0-1.css";
import { VISUAL_CONFIG } from "../visual/config.js";

ensureLegacyUi();
document.documentElement.style.setProperty("--panel-bg", "rgba(10, 12, 16, 0.55)");

const GRAPH_LIMIT_WARNING = 300;
const DEFAULT_WEIGHT_THRESHOLD = 0.5;
const BASE_NODE_RADIUS = VISUAL_CONFIG.node.minRadius;
const NODE_PULSE_AMPLITUDE = 0.07;
const NODE_PULSE_SPEED = 0.0016;
const LINK_PULSE_AMPLITUDE = 0.08;
const LINK_PULSE_SPEED = 0.0013;
const AUTO_ROTATE_SPEED = 0.18;
const AUTO_ROTATE_IDLE_MS = 2200;

const graphEl = document.getElementById("graph");
const dataStatusEl = document.getElementById("dataStatus");
const errorEl = document.getElementById("error");
const warningEl = document.getElementById("warning");
const searchInput = document.getElementById("searchInput");
const typeFiltersEl = document.getElementById("typeFilters");
const statusFiltersEl = document.getElementById("statusFilters");
const resetCameraBtn = document.getElementById("resetCamera");
const simplifyToggle = document.getElementById("simplifyToggle");
const weightThreshold = document.getElementById("weightThreshold");
const soundToggle = document.getElementById("soundToggle");
const soundVolume = document.getElementById("soundVolume");
const audioHint = document.getElementById("audioHint");
const modeToggle = document.getElementById("modeToggle");
const dropOverlay = document.getElementById("dropOverlay");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const urlParams = new URLSearchParams(window.location.search);
const modeParam = urlParams.get("mode");
const initialMode =
  modeParam === "showcase" ? "showcase" : modeParam === "embed" ? "embed" : "author";
const focusNodeId = urlParams.get("focus");
const highlightType = urlParams.get("highlightType");
const highlightStatus = urlParams.get("highlightStatus");
const sourceParam = urlParams.get("source") || "demo";
const viewParam = urlParams.get("view") || "all";
const graphUrlParam = urlParams.get("graphUrl") || "universe.json";

const filterState = {
  text: "",
  types: new Set(),
  statuses: new Set(),
  simplify: false,
  weightThreshold: DEFAULT_WEIGHT_THRESHOLD
};

const palette = VISUAL_CONFIG.colors;

const HUB_CATEGORY_BY_ID = {
  characters: "characters",
  domains: "domains",
  practices: "practices",
  "system-graph": "system",
  system: "system"
};

const TYPE_CATEGORY = {
  character: "characters",
  domain: "domains",
  practice: "practices",
  module: "system",
  policy: "system",
  process: "system",
  spec: "system"
};

let currentData = { nodes: [], links: [] };
let visibleNodeIds = new Set();
let visibleNodes = new Set();
let visibleLinks = new Set();
let neighborsById = new Map();
let nodesById = new Map();
let hoverNode = null;
let dragActive = false;
let dragAndDropEnabled = initialMode !== "showcase" && initialMode !== "embed";
let focusPending = Boolean(focusNodeId);

const highlightNodes = new Set();
const highlightLinks = new Set();
const nodeGeometry = new THREE.SphereGeometry(1, 48, 48);
const nodeMaterialCache = new Map();
const nodeMeshes = new Map();
const nodeBaseRadius = new Map();
const nodePulsePhase = new Map();
const linkPulsePhase = new Map();
const WARP_ENABLED = false;
let visualTime = 0;
let lastInteractionAt = 0;
let sceneRotation = 0;

const graph = ForceGraph3D()(graphEl)
  .backgroundColor(VISUAL_CONFIG.colors.background)
  .showNavInfo(false)
  .nodeRelSize(BASE_NODE_RADIUS)
  .linkOpacity(0.35)
  .linkWidth(0.6)
  .linkDirectionalParticles(0);

graph.d3Force("link").distance((link) => getLinkDistance(link));

graph.d3VelocityDecay(0.2);
graph.d3AlphaDecay(0.02);

graph.scene().add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(40, 60, 120);
graph.scene().add(keyLight);

const camera = graph.camera();
camera.fov = VISUAL_CONFIG.camera.fov;
camera.updateProjectionMatrix();

graph.nodeLabel((node) => {
  if (node.label) {
    return `${node.label} (${node.id})`;
  }
  return node.id;
});

graph.nodeColor((node) => {
  return getNodeColor(node);
});

graph.nodeThreeObject((node) => createNodeMesh(node));
graph.nodeThreeObjectExtend(false);

graph.linkThreeObject((link) => createLinkObject(link));
graph.linkPositionUpdate((obj, position, link) => {
  updateLinkObject(obj, position, link);
});

graph.linkColor((link) => (highlightLinks.has(link) ? palette.highlight : palette.linkDefault));

graph.nodeVal((node) => {
  const radius = getNodeRadius(node);
  return radius / BASE_NODE_RADIUS;
});

graph.linkWidth((link) => (highlightLinks.has(link) ? 1.6 : 0.6));

const controls = graph.controls();
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.autoRotate = true;
controls.autoRotateSpeed = AUTO_ROTATE_SPEED;

function getId(value) {
  if (value && typeof value === "object") {
    return value.id;
  }
  return value;
}

function getNodeColor(node) {
  const base = palette.nodeDefault;
  if (!highlightType && !highlightStatus) return base;

  const matchesType = highlightType && node.type === highlightType;
  const matchesStatus = highlightStatus && node.status === highlightStatus;
  if (matchesType || matchesStatus) return base;

  return palette.dim || "#1b1f25";
}

function getNodeCategory(node) {
  if (!node) return null;
  if (node.id && HUB_CATEGORY_BY_ID[node.id]) return HUB_CATEGORY_BY_ID[node.id];
  if (node.type && TYPE_CATEGORY[node.type]) return TYPE_CATEGORY[node.type];
  return null;
}

function getNodeRadius(node) {
  if (node.visualRadius && Number.isFinite(node.visualRadius)) {
    return node.visualRadius;
  }

  if (node.size && Number.isFinite(node.size)) {
    return Math.min(VISUAL_CONFIG.node.maxRadius, Math.max(VISUAL_CONFIG.node.minRadius, node.size));
  }

  if (node.type === "hub" || node.type === "root") {
    return BASE_NODE_RADIUS * 4;
  }
  return BASE_NODE_RADIUS;
}

function createNodeMesh(node) {
  const mesh = new THREE.Mesh(nodeGeometry, getRimMaterial(getNodeColor(node)));
  const baseRadius = getNodeRadius(node);
  mesh.scale.setScalar(baseRadius);
  nodeMeshes.set(node.id, mesh);
  nodeBaseRadius.set(node.id, baseRadius);
  if (!nodePulsePhase.has(node.id)) {
    const phaseSeed = hashId(String(node.id)) % 1000;
    nodePulsePhase.set(node.id, (phaseSeed / 1000) * Math.PI * 2);
  }
  return mesh;
}

function getRimMaterial(colorHex) {
  const key = String(colorHex).toLowerCase();
  if (nodeMaterialCache.has(key)) {
    return nodeMaterialCache.get(key);
  }

  const baseColor = new THREE.Color(colorHex);
  const material = new THREE.MeshStandardMaterial({
    color: baseColor.clone().multiplyScalar(0.6),
    emissive: baseColor.clone(),
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.0,
    transparent: false,
    opacity: 1
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: baseColor };
    shader.uniforms.rimPower = { value: 2.2 };
    shader.uniforms.rimStrength = { value: 0.9 };

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <output_fragment>",
      [
        "float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), rimPower);",
        "vec3 rimLight = rimColor * rim * rimStrength;",
        "gl_FragColor = vec4(outgoingLight + rimLight, diffuseColor.a);"
      ].join("\n")
    );
  };

  nodeMaterialCache.set(key, material);
  return material;
}

function createNozzleGeometry() {
  const points = [
    new THREE.Vector2(1.0, 0.0),
    new THREE.Vector2(0.6, 0.18),
    new THREE.Vector2(0.3, 0.52),
    new THREE.Vector2(0.08, 0.9),
    new THREE.Vector2(0.0, 1.0)
  ];
  const geometry = new THREE.LatheGeometry(points, 28);
  geometry.computeVertexNormals();
  return geometry;
}

function createLinkObject(link) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3)
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3)
  );

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });

  const line = new THREE.Line(geometry, material);

  const nozzleGeometry = createNozzleGeometry();
  const nozzleMaterialA = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    depthWrite: true
  });
  const nozzleMaterialB = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    depthWrite: true
  });
  const nozzleA = new THREE.Mesh(nozzleGeometry, nozzleMaterialA);
  const nozzleB = new THREE.Mesh(nozzleGeometry, nozzleMaterialB);
  const group = new THREE.Group();
  group.add(line);
  group.add(nozzleA);
  group.add(nozzleB);
  group.userData = { line, nozzleA, nozzleB };

  return group;
}

function updateLinkObject(obj, position, link) {
  const { line, nozzleA, nozzleB } = obj.userData;
  const start = new THREE.Vector3(position.start.x, position.start.y, position.start.z);
  const end = new THREE.Vector3(position.end.x, position.end.y, position.end.z);
  const direction = end.clone().sub(start);
  const distance = Math.max(0.0001, direction.length());
  const unitDir = direction.clone().normalize();
  const pulse = Math.sin(visualTime * LINK_PULSE_SPEED + getLinkPulsePhase(link));
  const stretch = 1 + pulse * LINK_PULSE_AMPLITUDE;

  const sourceNode = nodesById.get(getId(link.source));
  const targetNode = nodesById.get(getId(link.target));
  const startColor = new THREE.Color(sourceNode ? getNodeColor(sourceNode) : getLinkNeutralColor());
  const endColor = new THREE.Color(targetNode ? getNodeColor(targetNode) : getLinkNeutralColor());
  const midColor = new THREE.Color(getLinkNeutralColor());

  const colors = line.geometry.getAttribute("color");
  colors.array[0] = startColor.r;
  colors.array[1] = startColor.g;
  colors.array[2] = startColor.b;
  colors.array[3] = midColor.r;
  colors.array[4] = midColor.g;
  colors.array[5] = midColor.b;
  colors.array[6] = endColor.r;
  colors.array[7] = endColor.g;
  colors.array[8] = endColor.b;
  colors.needsUpdate = true;

  const isHighlighted = highlightLinks.has(link);
  line.material.opacity = isHighlighted ? 0.85 : 0.4;

  const startRadius = sourceNode ? getNodeRadius(sourceNode) : BASE_NODE_RADIUS;
  const endRadius = targetNode ? getNodeRadius(targetNode) : BASE_NODE_RADIUS;
  let nozzleLengthStart = Math.min(distance * 0.45, startRadius * 2.0) * stretch;
  let nozzleLengthEnd = Math.min(distance * 0.45, endRadius * 2.0) * stretch;
  const nozzleRadiusStart = startRadius * 0.35;
  const nozzleRadiusEnd = endRadius * 0.35;
  const available = Math.max(0.001, distance - startRadius - endRadius);
  const totalNozzle = nozzleLengthStart + nozzleLengthEnd;
  if (totalNozzle > available * 0.9) {
    const clampScale = (available * 0.9) / totalNozzle;
    nozzleLengthStart *= clampScale;
    nozzleLengthEnd *= clampScale;
  }
  const embedOffsetStart = startRadius * 0.45;
  const embedOffsetEnd = endRadius * 0.45;

  const startBase = start
    .clone()
    .add(unitDir.clone().multiplyScalar(startRadius - embedOffsetStart));
  const endBase = end.clone().add(unitDir.clone().multiplyScalar(-(endRadius - embedOffsetEnd)));
  const lineStart = startBase.clone().add(unitDir.clone().multiplyScalar(nozzleLengthStart));
  const lineEnd = endBase.clone().add(unitDir.clone().multiplyScalar(-nozzleLengthEnd));
  const mid = lineStart.clone().add(lineEnd).multiplyScalar(0.5);

  const positions = line.geometry.getAttribute("position");
  positions.array[0] = lineStart.x;
  positions.array[1] = lineStart.y;
  positions.array[2] = lineStart.z;
  positions.array[3] = mid.x;
  positions.array[4] = mid.y;
  positions.array[5] = mid.z;
  positions.array[6] = lineEnd.x;
  positions.array[7] = lineEnd.y;
  positions.array[8] = lineEnd.z;
  positions.needsUpdate = true;

  nozzleA.visible = true;
  nozzleB.visible = true;

  const nozzleQuatA = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    unitDir
  );
  const nozzleQuatB = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    unitDir.clone().multiplyScalar(-1)
  );
  nozzleA.quaternion.copy(nozzleQuatA);
  nozzleB.quaternion.copy(nozzleQuatB);
  nozzleA.position.copy(startBase);
  nozzleB.position.copy(endBase);
  nozzleA.scale.set(nozzleRadiusStart, nozzleLengthStart, nozzleRadiusStart);
  nozzleB.scale.set(nozzleRadiusEnd, nozzleLengthEnd, nozzleRadiusEnd);
  nozzleA.material.color.copy(startColor);
  nozzleB.material.color.copy(endColor);
  nozzleA.material.opacity = 1;
  nozzleB.material.opacity = 1;
}

function getLinkPulsePhase(link) {
  const key = link.id || `${getId(link.source)}-${getId(link.target)}`;
  if (linkPulsePhase.has(key)) {
    return linkPulsePhase.get(key);
  }
  const phaseSeed = hashId(String(key)) % 1000;
  const phase = (phaseSeed / 1000) * Math.PI * 2;
  linkPulsePhase.set(key, phase);
  return phase;
}

function getLinkWeight(link) {
  const weight = link.weight ?? link.value ?? link.meta?.weight;
  return typeof weight === "number" ? weight : null;
}

function getLinkNeutralColor() {
  return palette.link || palette.linkDefault;
}

function getLinkDistance(link) {
  const base = VISUAL_CONFIG.link.baseLength;
  const variance = VISUAL_CONFIG.link.lengthVariance;
  const seedValue = hashId(String(link.id || `${getId(link.source)}-${getId(link.target)}`));
  const factor = (seedValue % 1000) / 1000;
  const distance = base + (factor - 0.5) * variance * 2;

  const sourceType = link.source?.type || nodesById.get(getId(link.source))?.type;
  const targetType = link.target?.type || nodesById.get(getId(link.target))?.type;
  const shortClusterTypes = new Set(["system", "layer"]);
  if (shortClusterTypes.has(sourceType) && shortClusterTypes.has(targetType)) {
    return distance * VISUAL_CONFIG.link.shortClusterFactor;
  }

  return distance;
}

function buildIndex(data) {
  nodesById = new Map(data.nodes.map((node) => [node.id, node]));
  neighborsById = new Map();

  data.links.forEach((link) => {
    const sourceId = getId(link.source);
    const targetId = getId(link.target);
    if (!neighborsById.has(sourceId)) neighborsById.set(sourceId, new Set());
    if (!neighborsById.has(targetId)) neighborsById.set(targetId, new Set());
    neighborsById.get(sourceId).add(targetId);
    neighborsById.get(targetId).add(sourceId);
  });
}

function updateWarning(count) {
  if (count > GRAPH_LIMIT_WARNING) {
    warningEl.textContent = `Heavy graph: ${count} nodes`;
    warningEl.classList.remove("hidden");
  } else {
    warningEl.classList.add("hidden");
  }
}

function updateStatus(label, nodeCount, linkCount) {
  dataStatusEl.textContent = `${label} - ${nodeCount} nodes / ${linkCount} links`;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.classList.add("hidden");
}

function createFilterOptions(container, values, selectedSet) {
  container.innerHTML = "";
  selectedSet.clear();

  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = "chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.checked = true;

    input.addEventListener("change", () => {
      if (input.checked) {
        selectedSet.add(value);
      } else {
        selectedSet.delete(value);
      }
      applyFilters();
    });

    const text = document.createElement("span");
    text.textContent = value;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);

    selectedSet.add(value);
  });
}

function applyFilters() {
  const textQuery = filterState.text;
  const typeFilter = filterState.types;
  const statusFilter = filterState.statuses;

  visibleNodes = new Set();
  visibleNodeIds = new Set();

  currentData.nodes.forEach((node) => {
    const label = (node.label || "").toLowerCase();
    const id = String(node.id || "").toLowerCase();
    const textMatch = !textQuery || label.includes(textQuery) || id.includes(textQuery);
    const typeMatch = typeFilter.size === 0 || typeFilter.has(node.type);
    const statusMatch = statusFilter.size === 0 || statusFilter.has(node.status);

    if (textMatch && typeMatch && statusMatch) {
      visibleNodes.add(node);
      visibleNodeIds.add(node.id);
    }
  });

  visibleLinks = new Set();

  currentData.links.forEach((link) => {
    const sourceId = getId(link.source);
    const targetId = getId(link.target);

    if (!visibleNodeIds.has(sourceId) || !visibleNodeIds.has(targetId)) {
      return;
    }

    if (filterState.simplify) {
      const weight = getLinkWeight(link);
      if (weight !== null && weight < filterState.weightThreshold) {
        return;
      }
    }

    visibleLinks.add(link);
  });

  graph.nodeVisibility((node) => visibleNodes.has(node));
  graph.linkVisibility((link) => visibleLinks.has(link));

  refreshHighlights(true);
  graph.refresh();
}

function refreshHighlights() {
  highlightNodes.clear();
  highlightLinks.clear();

  if (hoverNode && visibleNodeIds.has(hoverNode.id)) {
    currentData.links.forEach((link) => {
      const sourceId = getId(link.source);
      const targetId = getId(link.target);
      if (sourceId === hoverNode.id || targetId === hoverNode.id) {
        if (visibleLinks.has(link)) highlightLinks.add(link);
      }
    });
  }
}

function setGraphData(rawData, label) {
  clearError();
  nodeMeshes.clear();
  nodeBaseRadius.clear();
  nodePulsePhase.clear();
  linkPulsePhase.clear();

  let data;
  try {
    data = loadCosmosMap(rawData);
  } catch (error) {
    showError(error.message);
    return;
  }

  applyGraphData(data, label);
}

function setGraphDataFromGraphConfig(rawData, label) {
  clearError();
  nodeMeshes.clear();
  nodeBaseRadius.clear();
  nodePulsePhase.clear();
  linkPulsePhase.clear();

  if (!rawData || !Array.isArray(rawData.nodes) || !Array.isArray(rawData.links)) {
    showError("Invalid graph data");
    return;
  }

  applyGraphData(rawData, label);
}

function applyGraphData(data, label) {
  currentData = data;
  assignNodeSizes(currentData);
  graph.graphData(currentData);
  buildIndex(currentData);

  const types = Array.from(new Set(currentData.nodes.map((node) => node.type).filter(Boolean))).sort();
  const statuses = Array.from(new Set(currentData.nodes.map((node) => node.status).filter(Boolean))).sort();

  createFilterOptions(typeFiltersEl, types, filterState.types);
  createFilterOptions(statusFiltersEl, statuses, filterState.statuses);

  const weights = currentData.links.map(getLinkWeight).filter((weight) => weight !== null);
  const maxWeight = weights.length ? Math.max(...weights) : 1;
  weightThreshold.max = String(Math.max(1, maxWeight));
  weightThreshold.value = String(Math.min(filterState.weightThreshold, maxWeight));

  updateStatus(label, currentData.nodes.length, currentData.links.length);
  updateWarning(currentData.nodes.length);
  applyFilters();

  setTimeout(() => {
    graph.zoomToFit(800, 60);
    updateCameraLimits();
    if (focusPending && focusNodeId) {
      focusOnNode(focusNodeId);
    }
  }, 200);
}

async function loadFromUrl(url) {
  clearError();
  dataStatusEl.textContent = "Loading URL...";

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  const json = await response.json();
  setGraphData(json, "URL");
}

async function loadSample() {
  const sampleUrl = new URL("../../data/sample.cosmos-map.v0.1.json", import.meta.url);
  dataStatusEl.textContent = "Loading sample...";
  const response = await fetch(sampleUrl);
  const json = await response.json();
  setGraphData(json, "Sample");
}

async function loadCanon() {
  dataStatusEl.textContent = "Loading canon...";
  const graphConfig = await loadGraphConfig(GraphSource.EXTERNAL, {
    externalUrl: graphUrlParam,
    view: viewParam
  });
  setGraphDataFromGraphConfig(
    { nodes: graphConfig.nodes, links: graphConfig.links },
    "Canon"
  );
}

const sound = (() => {
  let ctx = null;
  let master = null;
  let enabled = false;
  let volume = Number(soundVolume.value || 0.15);
  const lastSoundAt = new Map();
  const lastNeighborAt = new Map();
  const minIntervalMs = 180;
  const neighborIntervalMs = 240;
  const speedThreshold = 0.35;
  const speedMax = 3.5;

  function ensureContext() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }

    if (ctx.state === "suspended") {
      audioHint.classList.remove("hidden");
    } else {
      audioHint.classList.add("hidden");
    }
  }

  function playUnderwaterTone(freq, duration, gainScale, delaySeconds) {
    if (!enabled || !ctx || ctx.state !== "running") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 420 + Math.random() * 180;
    filter.Q.value = 0.8;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    const now = ctx.currentTime + delaySeconds;
    const peak = volume * gainScale;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function getFrequencyForNode(node) {
    const minR = VISUAL_CONFIG.node.minRadius;
    const maxR = VISUAL_CONFIG.node.maxRadius;
    const radius = getNodeRadius(node);
    const t = maxR === minR ? 0.5 : (radius - minR) / (maxR - minR);
    const clamped = Math.min(1, Math.max(0, t));
    return 320 - clamped * 170;
  }

  function tick(nodes) {
    if (!enabled || !ctx || ctx.state !== "running") return;
    const now = performance.now();

    nodes.forEach((node) => {
      const vx = node.vx || 0;
      const vy = node.vy || 0;
      const vz = node.vz || 0;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (speed < speedThreshold) return;

      const lastAt = lastSoundAt.get(node.id) || 0;
      if (now - lastAt < minIntervalMs) return;
      lastSoundAt.set(node.id, now);

      const speedGain = Math.min(1, speed / speedMax);
      const baseFreq = getFrequencyForNode(node);
      const jitter = (Math.random() - 0.5) * 8;
      const duration = 0.16 + speedGain * 0.2;
      const gainScale = 0.08 + speedGain * 0.22;
      playUnderwaterTone(baseFreq + jitter, duration, gainScale, Math.random() * 0.04);

      const neighbors = neighborsById.get(node.id);
      if (!neighbors) return;

      let voices = 0;
      neighbors.forEach((id) => {
        if (voices >= 2) return;
        const neighbor = nodesById.get(id);
        if (!neighbor) return;
        const nvx = neighbor.vx || 0;
        const nvy = neighbor.vy || 0;
        const nvz = neighbor.vz || 0;
        const nSpeed = Math.sqrt(nvx * nvx + nvy * nvy + nvz * nvz);
        if (nSpeed < speedThreshold * 0.7) return;

        const pairKey = `${node.id}:${id}`;
        const lastNeighborSound = lastNeighborAt.get(pairKey) || 0;
        if (now - lastNeighborSound < neighborIntervalMs) return;
        lastNeighborAt.set(pairKey, now);

        const neighborFreq = getFrequencyForNode(neighbor) + (Math.random() - 0.5) * 10;
        const neighborGain = gainScale * 0.7;
        const neighborDelay = 0.06 + Math.random() * 0.09;
        playUnderwaterTone(neighborFreq, duration * 0.85, neighborGain, neighborDelay);
        voices += 1;
      });
    });
  }

  function setEnabled(value) {
    enabled = value;
    if (enabled) {
      ensureContext();
    } else {
      audioHint.classList.add("hidden");
    }
  }

  function setVolume(value) {
    volume = value;
    if (master) {
      master.gain.value = volume;
    }
  }

  async function resumeIfNeeded() {
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
      audioHint.classList.add("hidden");
    }
  }

  return { setEnabled, setVolume, resumeIfNeeded, tick };
})();

graph.onNodeHover((node) => {
  if (node === hoverNode) return;
  hoverNode = node || null;
  refreshHighlights(false);
  graph.refresh();
});

graph.onNodeDrag((node) => {
  registerInteraction();
  node.fx = node.x;
  node.fy = node.y;
  node.fz = node.z;

  if (!dragActive) {
    dragActive = true;
  }
});

graph.onNodeDragEnd((node) => {
  node.fx = null;
  node.fy = null;
  node.fz = null;
  dragActive = false;
});

resetCameraBtn.addEventListener("click", () => {
  graph.zoomToFit(800, 60);
  updateCameraLimits();
});

searchInput.addEventListener("input", (event) => {
  filterState.text = event.target.value.trim().toLowerCase();
  applyFilters();
});

simplifyToggle.addEventListener("change", (event) => {
  filterState.simplify = event.target.checked;
  applyFilters();
});

weightThreshold.addEventListener("input", (event) => {
  filterState.weightThreshold = Number(event.target.value);
  applyFilters();
});

soundToggle.addEventListener("change", (event) => {
  sound.setEnabled(event.target.checked);
});

soundVolume.addEventListener("input", (event) => {
  sound.setVolume(Number(event.target.value));
});

modeToggle.addEventListener("click", () => {
  const nextMode = document.body.classList.contains("mode-showcase") ? "author" : "showcase";
  setMode(nextMode);
});

document.addEventListener("pointerdown", () => {
  sound.resumeIfNeeded();
  registerInteraction();
});

function setMode(mode) {
  const isShowcase = mode === "showcase";
  const isEmbed = mode === "embed";
  document.body.classList.toggle("mode-showcase", isShowcase);
  document.body.classList.toggle("mode-embed", isEmbed);
  modeToggle.textContent = `Mode: ${isEmbed ? "embed" : isShowcase ? "showcase" : "author"}`;
  setDragAndDropEnabled(!isShowcase && !isEmbed);
  updateFullscreenVisibility(isEmbed);
}

function setDragAndDropEnabled(enabled) {
  dragAndDropEnabled = enabled;
  if (!enabled) {
    dropOverlay.classList.add("hidden");
  }
}

function updateFullscreenVisibility(isEmbed) {
  if (!fullscreenBtn) return;
  if (isEmbed && document.fullscreenEnabled) {
    fullscreenBtn.classList.remove("hidden");
  } else {
    fullscreenBtn.classList.add("hidden");
  }
}

window.addEventListener("dragover", (event) => {
  if (!dragAndDropEnabled) return;
  event.preventDefault();
  dropOverlay.classList.remove("hidden");
});

window.addEventListener("dragleave", () => {
  if (!dragAndDropEnabled) return;
  dropOverlay.classList.add("hidden");
});

window.addEventListener("drop", (event) => {
  if (!dragAndDropEnabled) return;
  event.preventDefault();
  dropOverlay.classList.add("hidden");

  const file = event.dataTransfer.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      setGraphData(json, "File");
    } catch (error) {
      showError("Invalid JSON file");
    }
  };
  reader.readAsText(file);
});

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });
}

function focusOnNode(nodeId) {
  const node = nodesById.get(nodeId);
  if (!node) {
    focusPending = false;
    return;
  }
  if (node.x === undefined) return;

  const distance = 120;
  const distRatio =
    1 + distance / Math.max(1, Math.hypot(node.x || 0, node.y || 0, node.z || 0));

  graph.cameraPosition(
    { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
    node,
    1200
  );
  focusPending = false;
}

function assignNodeSizes(data) {
  const minRadius = VISUAL_CONFIG.node.minRadius;
  const maxRadius = VISUAL_CONFIG.node.maxRadius;
  const range = Math.max(0.1, maxRadius - minRadius);

  data.nodes.forEach((node, index) => {
    const seed = hashId(node.id || String(index));
    const factor = (seed % 1000) / 1000;
    node.visualRadius = minRadius + factor * range;
  });
}

function warpPosition(pos) {
  if (!WARP_ENABLED) return pos;
  const radius = VISUAL_CONFIG.camera.curvatureRadius;
  if (!radius) return pos;
  const strength = VISUAL_CONFIG.camera.curvatureStrength;
  const r2 = pos.x * pos.x + pos.y * pos.y;
  const curve = (r2 / (radius * radius)) * strength;
  return new THREE.Vector3(pos.x, pos.y, pos.z + curve);
}

function hashId(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function updateNodeBreathing(timeMs) {
  const t = timeMs * NODE_PULSE_SPEED;
  nodeMeshes.forEach((mesh, nodeId) => {
    const baseRadius = nodeBaseRadius.get(nodeId);
    if (!baseRadius) return;
    const phase = nodePulsePhase.get(nodeId) || 0;
    const pulse = 1 + Math.sin(t + phase) * NODE_PULSE_AMPLITUDE;
    mesh.scale.setScalar(baseRadius * pulse);
  });
}

function updateCameraLimits() {
  const bbox = graph.getGraphBbox?.();
  let fitDistance = null;

  if (bbox && bbox.x && bbox.y && bbox.z) {
    const dx = bbox.x[1] - bbox.x[0];
    const dy = bbox.y[1] - bbox.y[0];
    const dz = bbox.z[1] - bbox.z[0];
    const radius = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.5);
    const fov = THREE.MathUtils.degToRad(graph.camera().fov || 60);
    fitDistance = radius / Math.sin(fov / 2);
  }

  const currentDistance = graph.camera().position.length() || 1;
  const maxDistance = (fitDistance || currentDistance) * 1.6;
  controls.maxDistance = Math.max(maxDistance, 200);
}

function registerInteraction() {
  lastInteractionAt = performance.now();
  controls.autoRotate = false;
}

function updateAutoRotate(timeMs) {
  if (dragActive) return;
  const idle = timeMs - lastInteractionAt > AUTO_ROTATE_IDLE_MS;
  controls.autoRotate = idle;
  if (idle) {
    sceneRotation += 0.00025;
    graph.scene().rotation.y = sceneRotation;
  }
}

function tickIdleMotion() {
  visualTime = performance.now();
  updateNodeBreathing(visualTime);
  updateAutoRotate(visualTime);
  controls.update();
  requestAnimationFrame(tickIdleMotion);
}

graph.onEngineStop(() => {
  if (focusPending && focusNodeId) {
    focusOnNode(focusNodeId);
  }
  updateCameraLimits();
});

graph.onEngineTick(() => {
  sound.tick(currentData.nodes);
  currentData.nodes.forEach((node) => {
    const mesh = nodeMeshes.get(node.id);
    if (!mesh) return;
    if (node.x === undefined) return;
    const warped = warpPosition(new THREE.Vector3(node.x, node.y, node.z));
    mesh.position.copy(warped);
  });
});

window.addEventListener("resize", () => {
  graph.width(window.innerWidth).height(window.innerHeight);
  updateCameraLimits();
});

graph.width(window.innerWidth).height(window.innerHeight);

setMode(initialMode);
tickIdleMotion();

["wheel", "keydown", "touchstart"].forEach((eventName) => {
  window.addEventListener(eventName, registerInteraction, { passive: true });
});

const dataUrl = urlParams.get("dataUrl");
if (sourceParam === "canon") {
  loadCanon().catch((error) => {
    showError(error.message);
  });
} else if (dataUrl) {
  loadFromUrl(dataUrl).catch((error) => {
    showError(error.message);
  });
} else {
  loadSample().catch((error) => {
    showError(error.message);
  });
}

function ensureLegacyUi() {
  if (document.getElementById("ui")) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div id="ui" class="panel" data-mode="author">
      <div class="brand">dream-graph</div>
      <div class="section">
        <div class="section-title">Data</div>
        <div id="dataStatus" class="status">Loading...</div>
        <button id="resetCamera" class="btn">Reset Camera</button>
      </div>
      <div class="section">
        <div class="section-title">Search</div>
        <input id="searchInput" class="input" type="search" placeholder="label or id" />
      </div>
      <div class="section">
        <div class="section-title">Type</div>
        <div id="typeFilters" class="chip-list"></div>
      </div>
      <div class="section">
        <div class="section-title">Status</div>
        <div id="statusFilters" class="chip-list"></div>
      </div>
      <div class="section">
        <div class="section-title">Links</div>
        <label class="checkbox">
          <input id="simplifyToggle" type="checkbox" />
          Simplify by weight
        </label>
        <input id="weightThreshold" class="range" type="range" min="0" max="1" step="0.05" value="0.5" />
      </div>
      <div class="section">
        <div class="section-title">Sound</div>
        <label class="checkbox">
          <input id="soundToggle" type="checkbox" />
          Sound
        </label>
        <input id="soundVolume" class="range" type="range" min="0" max="1" step="0.05" value="0.15" />
        <div id="audioHint" class="hint hidden">click to enable audio</div>
      </div>
      <div class="section">
        <button id="modeToggle" class="btn secondary">Mode: author</button>
      </div>
      <div id="warning" class="warning hidden"></div>
      <div id="error" class="error hidden"></div>
    </div>
    <div id="showcaseBadge" class="badge">dream-graph</div>
    <div id="dropOverlay" class="drop-overlay hidden">Drop cosmos-map JSON to load</div>
    <button id="fullscreenBtn" class="fullscreen-btn hidden" type="button">Fullscreen</button>
  `;
  while (wrapper.firstElementChild) {
    document.body.appendChild(wrapper.firstElementChild);
  }
}
