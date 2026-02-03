import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import { VISUAL_CONFIG } from "../visual/config.js";
import { loadGraphConfig, GraphSource } from "../graph/loadGraphConfig.js";
import { layoutMlp } from "../layouts/mlp.js";
import { layoutDna } from "../layouts/dna.js";
import { layoutMetro } from "../layouts/metro.js";
import { layoutLattice } from "../layouts/lattice.js";
import { layoutMolecule } from "../layouts/molecule.js";
import { createPlanetaryState, getPlanetaryPosition } from "../layouts/planetary.js";
import { createTransition, applyTransition } from "../transition/transition.js";
import { Panel3D } from "../panel/Panel3D.js";

const BASE_NODE_RADIUS = VISUAL_CONFIG.node.minRadius;
const NODE_PULSE_AMPLITUDE = 0.07;
const NODE_PULSE_SPEED = 0.0016;
const LINK_PULSE_AMPLITUDE = 0.08;
const LINK_PULSE_SPEED = 0.0013;
const AUTO_ROTATE_SPEED = 0.16;
const AUTO_ROTATE_IDLE_MS = 2200;
const TRANSITION_MIN_MS = 900;
const TRANSITION_MAX_MS = 1400;
const LINK_OPACITY_BASE = 0.38;

const graphEl = document.getElementById("graph");

const palette = VISUAL_CONFIG.colors;

// Загрузка графа: demo по умолчанию, canon по query param
const urlParams = new URLSearchParams(window.location.search);
const sourceParam = urlParams.get("source") || "demo";
const viewParam = urlParams.get("view") || "all";
const graphUrlParam = urlParams.get("graphUrl") || "universe.json";

const graphConfig = await loadGraphConfig(
  sourceParam === "canon" ? GraphSource.EXTERNAL : GraphSource.LOCAL_DEMO,
  {
    externalUrl: graphUrlParam,
    view: viewParam
  }
);

const data = {
  nodes: graphConfig.nodes,
  links: graphConfig.links
};

let nodesById = new Map();
let neighborsById = new Map();
let currentPositions = new Map();
let lastPositions = new Map();
let activeConfig = "planetary";
let planetaryState = null;
let transition = null;
let lastInteractionAt = 0;
let visualTime = 0;
let linkOpacityFactor = 1;
let activeLabel = "Planetary";
let fpsFrames = 0;
let fpsLastAt = performance.now();

const nodeGeometry = new THREE.SphereGeometry(1, 48, 48);
const nodeMaterialCache = new Map();
const nodeInstanceMap = new Map();
const instancedMeshes = new Set();
const nodeBaseRadius = new Map();
const nodePulsePhase = new Map();
const linkPulsePhase = new Map();
const nodeProxyMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false
});
const tempObject = new THREE.Object3D();

const graph = ForceGraph3D()(graphEl)
  .backgroundColor(VISUAL_CONFIG.colors.background)
  .showNavInfo(false)
  .nodeRelSize(BASE_NODE_RADIUS)
  .linkOpacity(0)
  .linkWidth(0)
  .linkDirectionalParticles(0)
  .graphData(data);

graph.d3VelocityDecay(0.25);
graph.d3AlphaDecay(0.04);

graph.scene().add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(40, 60, 120);
graph.scene().add(keyLight);

const camera = graph.camera();
camera.fov = VISUAL_CONFIG.camera.fov;
camera.updateProjectionMatrix();

const controls = graph.controls();
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.autoRotate = true;
controls.autoRotateSpeed = AUTO_ROTATE_SPEED;

graph.nodeLabel((node) => node.label || node.id);
graph.nodeThreeObject((node) => createNodeProxy(node));
graph.nodeThreeObjectExtend(false);
graph.nodeVal((node) => getNodeRadius(node) / BASE_NODE_RADIUS);

const linkLayer = createLinkLayer(data.links);
graph.scene().add(linkLayer.group);

const orbitLayer = createOrbitLayer();
graph.scene().add(orbitLayer.group);

const configs = [
  { name: "planetary", label: "Planetary" },
  { name: "mlp", label: "MLP" },
  { name: "dna", label: "DNA" },
  { name: "metro", label: "Metro" },
  { name: "lattice", label: "Lattice" }
];

const panel = new Panel3D({
  configs,
  onSelect: (name) => setConfiguration(name)
});
panel.setActive(activeConfig);
graph.scene().add(panel.group);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
let hoveredButton = null;

const sound = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let volume = 0.12;
  let showHint = () => {};
  const lastSoundAt = new Map();
  const lastNeighborAt = new Map();
  const minIntervalMs = 180;
  const neighborIntervalMs = 240;
  const speedThreshold = 0.3;
  const speedMax = 3.5;

  function ensureContext() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }

    if (ctx.state === "suspended") {
      showHint(true);
    } else {
      showHint(false);
    }
  }

  function playTone(freq, duration, gainScale, delaySeconds) {
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
      playTone(baseFreq + jitter, duration, gainScale, Math.random() * 0.04);

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
        playTone(neighborFreq, duration * 0.85, neighborGain, neighborDelay);
        voices += 1;
      });
    });
  }

  function playSwitch() {
    ensureContext();
    playTone(420 + Math.random() * 60, 0.18, 0.16, 0);
  }

  function setHintCallback(fn) {
    showHint = fn;
  }

  async function resumeIfNeeded() {
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
      showHint(false);
    }
  }

  return { tick, playSwitch, resumeIfNeeded, setHintCallback };
})();

sound.setHintCallback((visible) => {
  panel.setHint(visible ? "Click to enable audio" : "");
});

function getId(value) {
  if (value && typeof value === "object") {
    return value.id;
  }
  return value;
}

function getNodeColor(node) {
  const groupColor = node.group && palette.type?.[node.group];
  return groupColor || palette.nodeDefault;
}

function getNodeRadius(node) {
  if (node.visualRadius && Number.isFinite(node.visualRadius)) {
    return node.visualRadius;
  }
  if (node.importance && Number.isFinite(node.importance)) {
    return Math.min(VISUAL_CONFIG.node.maxRadius, Math.max(VISUAL_CONFIG.node.minRadius, node.importance * 4));
  }
  return BASE_NODE_RADIUS;
}

function createNodeProxy() {
  return new THREE.Mesh(nodeGeometry, nodeProxyMaterial);
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
    metalness: 0.0
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

function initInstancedNodes() {
  const buckets = new Map();
  data.nodes.forEach((node) => {
    const color = getNodeColor(node);
    if (!buckets.has(color)) buckets.set(color, []);
    buckets.get(color).push(node);
  });

  buckets.forEach((nodes, color) => {
    const material = getRimMaterial(color);
    const mesh = new THREE.InstancedMesh(nodeGeometry, material, nodes.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    graph.scene().add(mesh);
    instancedMeshes.add(mesh);

    nodes.forEach((node, index) => {
      const baseRadius = getNodeRadius(node);
      nodeBaseRadius.set(node.id, baseRadius);
      if (!nodePulsePhase.has(node.id)) {
        const phaseSeed = hashId(String(node.id)) % 1000;
        nodePulsePhase.set(node.id, (phaseSeed / 1000) * Math.PI * 2);
      }
      nodeInstanceMap.set(node.id, { mesh, index });
    });
  });
}

function updateNodeInstances(timeMs) {
  const t = timeMs * NODE_PULSE_SPEED;

  nodeInstanceMap.forEach((info, nodeId) => {
    const pos = currentPositions.get(nodeId);
    if (!pos) return;
    const baseRadius = nodeBaseRadius.get(nodeId) || BASE_NODE_RADIUS;
    const phase = nodePulsePhase.get(nodeId) || 0;
    const pulse = 1 + Math.sin(t + phase) * NODE_PULSE_AMPLITUDE;
    const warped = warpPosition(new THREE.Vector3(pos.x, pos.y, pos.z));

    tempObject.position.copy(warped);
    tempObject.scale.setScalar(baseRadius * pulse);
    tempObject.updateMatrix();
    info.mesh.setMatrixAt(info.index, tempObject.matrix);
  });

  instancedMeshes.forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true;
  });
}

function createLinkLayer(links) {
  const segmentCount = links.length * 4;
  const positions = new Float32Array(segmentCount * 3);
  const colors = new Float32Array(segmentCount * 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: LINK_OPACITY_BASE,
    blending: THREE.AdditiveBlending
  });

  const line = new THREE.LineSegments(geometry, material);
  const spikeGroup = new THREE.Group();

  const spikeGeometry = new THREE.ConeGeometry(1, 1, 12);

  const spikes = links.flatMap(() => {
    const spikeA = new THREE.Mesh(
      spikeGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
    );
    const spikeB = new THREE.Mesh(
      spikeGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
    );
    spikeGroup.add(spikeA, spikeB);
    return [spikeA, spikeB];
  });

  const group = new THREE.Group();
  group.add(line);
  group.add(spikeGroup);

  return { group, line, spikes, links };
}

function createOrbitLayer() {
  const group = new THREE.Group();
  group.visible = false;
  return { group, rings: [] };
}

function updateOrbitRings() {
  orbitLayer.group.clear();
  orbitLayer.rings = [];

  if (!planetaryState) return;
  const ringCount = planetaryState.ringCount;
  const segments = 64;

  for (let i = 1; i <= ringCount; i += 1) {
    const radius = planetaryState.ringRadii[i];
    const points = [];
    for (let j = 0; j <= segments; j += 1) {
      const angle = (j / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4b5563,
      transparent: true,
      opacity: 0.22
    });
    const ring = new THREE.LineLoop(geometry, material);
    ring.rotation.x = Math.PI * 0.32;
    orbitLayer.group.add(ring);
    orbitLayer.rings.push(ring);
  }

  orbitLayer.group.visible = true;
}

function updateLinkGeometry() {
  const { line, spikes, links } = linkLayer;
  const positions = line.geometry.getAttribute("position");
  const colors = line.geometry.getAttribute("color");

  const baseOpacity = LINK_OPACITY_BASE * linkOpacityFactor;
  line.material.opacity = baseOpacity;

  links.forEach((link, index) => {
    const sourceId = getId(link.source);
    const targetId = getId(link.target);
    const sourceNode = nodesById.get(sourceId);
    const targetNode = nodesById.get(targetId);
    const startPos = currentPositions.get(sourceId) || { x: 0, y: 0, z: 0 };
    const endPos = currentPositions.get(targetId) || { x: 0, y: 0, z: 0 };

    const start = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    const end = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
    const direction = end.clone().sub(start);
    const distance = Math.max(0.0001, direction.length());
    const unitDir = direction.clone().normalize();
    const pulse = Math.sin(visualTime * LINK_PULSE_SPEED + getLinkPulsePhase(link));
    const stretch = 1 + pulse * LINK_PULSE_AMPLITUDE;

    const startRadius = sourceNode ? getNodeRadius(sourceNode) : BASE_NODE_RADIUS;
    const endRadius = targetNode ? getNodeRadius(targetNode) : BASE_NODE_RADIUS;
    let spikeLengthStart = Math.min(distance * 0.45, startRadius * 2.2) * stretch;
    let spikeLengthEnd = Math.min(distance * 0.45, endRadius * 2.2) * stretch;
    const spikeRadiusStart = startRadius * 0.35;
    const spikeRadiusEnd = endRadius * 0.35;
    const available = Math.max(0.001, distance - startRadius - endRadius);
    const totalSpike = spikeLengthStart + spikeLengthEnd;
    if (totalSpike > available * 0.9) {
      const clampScale = (available * 0.9) / totalSpike;
      spikeLengthStart *= clampScale;
      spikeLengthEnd *= clampScale;
    }

    const lineStart = start
      .clone()
      .add(unitDir.clone().multiplyScalar(startRadius + spikeLengthStart));
    const lineEnd = end
      .clone()
      .add(unitDir.clone().multiplyScalar(-(endRadius + spikeLengthEnd)));
    const mid = lineStart.clone().add(lineEnd).multiplyScalar(0.5);

    const warpedStart = warpPosition(lineStart);
    const warpedMid = warpPosition(mid);
    const warpedEnd = warpPosition(lineEnd);

    const baseIndex = index * 12;
    positions.array[baseIndex + 0] = warpedStart.x;
    positions.array[baseIndex + 1] = warpedStart.y;
    positions.array[baseIndex + 2] = warpedStart.z;
    positions.array[baseIndex + 3] = warpedMid.x;
    positions.array[baseIndex + 4] = warpedMid.y;
    positions.array[baseIndex + 5] = warpedMid.z;
    positions.array[baseIndex + 6] = warpedMid.x;
    positions.array[baseIndex + 7] = warpedMid.y;
    positions.array[baseIndex + 8] = warpedMid.z;
    positions.array[baseIndex + 9] = warpedEnd.x;
    positions.array[baseIndex + 10] = warpedEnd.y;
    positions.array[baseIndex + 11] = warpedEnd.z;

    const startColor = new THREE.Color(sourceNode ? getNodeColor(sourceNode) : palette.link);
    const endColor = new THREE.Color(targetNode ? getNodeColor(targetNode) : palette.link);
    const midColor = new THREE.Color(palette.link);

    colors.array[baseIndex + 0] = startColor.r;
    colors.array[baseIndex + 1] = startColor.g;
    colors.array[baseIndex + 2] = startColor.b;
    colors.array[baseIndex + 3] = midColor.r;
    colors.array[baseIndex + 4] = midColor.g;
    colors.array[baseIndex + 5] = midColor.b;
    colors.array[baseIndex + 6] = midColor.r;
    colors.array[baseIndex + 7] = midColor.g;
    colors.array[baseIndex + 8] = midColor.b;
    colors.array[baseIndex + 9] = endColor.r;
    colors.array[baseIndex + 10] = endColor.g;
    colors.array[baseIndex + 11] = endColor.b;

    const spikeA = spikes[index * 2];
    const spikeB = spikes[index * 2 + 1];
    const spikeQuatA = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      unitDir
    );
    const spikeQuatB = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      unitDir.clone().multiplyScalar(-1)
    );

    spikeA.quaternion.copy(spikeQuatA);
    spikeB.quaternion.copy(spikeQuatB);
    spikeA.scale.set(spikeRadiusStart, spikeLengthStart, spikeRadiusStart);
    spikeB.scale.set(spikeRadiusEnd, spikeLengthEnd, spikeRadiusEnd);

    const startBase = start.clone().add(unitDir.clone().multiplyScalar(startRadius));
    const endBase = end.clone().add(unitDir.clone().multiplyScalar(-endRadius));
    const spikePosA = startBase.clone().add(unitDir.clone().multiplyScalar(spikeLengthStart / 2));
    const spikePosB = endBase.clone().add(unitDir.clone().multiplyScalar(-spikeLengthEnd / 2));

    const warpedSpikeA = warpPosition(spikePosA);
    const warpedSpikeB = warpPosition(spikePosB);
    spikeA.position.copy(warpedSpikeA);
    spikeB.position.copy(warpedSpikeB);
    spikeA.material.color.copy(startColor);
    spikeB.material.color.copy(endColor);
    spikeA.material.opacity = 0.7 * linkOpacityFactor;
    spikeB.material.opacity = 0.7 * linkOpacityFactor;
  });

  positions.needsUpdate = true;
  colors.needsUpdate = true;
}

function assignNodeSizes(nodes) {
  const minRadius = VISUAL_CONFIG.node.minRadius;
  const maxRadius = VISUAL_CONFIG.node.maxRadius;
  const range = Math.max(0.1, maxRadius - minRadius);

  nodes.forEach((node, index) => {
    const seed = hashId(node.id || String(index));
    const factor = (seed % 1000) / 1000;
    node.visualRadius = minRadius + factor * range;
  });
}

function buildIndex(nodes, links) {
  nodesById = new Map(nodes.map((node) => [node.id, node]));
  neighborsById = new Map();

  links.forEach((link) => {
    const sourceId = getId(link.source);
    const targetId = getId(link.target);
    if (!neighborsById.has(sourceId)) neighborsById.set(sourceId, new Set());
    if (!neighborsById.has(targetId)) neighborsById.set(targetId, new Set());
    neighborsById.get(sourceId).add(targetId);
    neighborsById.get(targetId).add(sourceId);
  });
}

function hashId(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
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
  const idle = timeMs - lastInteractionAt > AUTO_ROTATE_IDLE_MS;
  controls.autoRotate = idle;
}

function warpPosition(pos) {
  const radius = VISUAL_CONFIG.camera.curvatureRadius;
  if (!radius) return pos;
  const strength = VISUAL_CONFIG.camera.curvatureStrength;
  const r2 = pos.x * pos.x + pos.y * pos.y;
  const curve = (r2 / (radius * radius)) * strength;
  return new THREE.Vector3(pos.x, pos.y, pos.z + curve);
}

function snapshotPositions() {
  const map = new Map();
  data.nodes.forEach((node) => {
    map.set(node.id, { x: node.x || 0, y: node.y || 0, z: node.z || 0 });
  });
  return map;
}

function applyPositionsToNodes(nowMs) {
  const dt = Math.max(16, nowMs - (applyPositionsToNodes.lastTime || nowMs)) / 1000;
  applyPositionsToNodes.lastTime = nowMs;

  data.nodes.forEach((node) => {
    const pos = currentPositions.get(node.id);
    if (!pos) return;
    const prev = lastPositions.get(node.id) || pos;
    node.vx = (pos.x - prev.x) / dt;
    node.vy = (pos.y - prev.y) / dt;
    node.vz = (pos.z - prev.z) / dt;
    node.x = pos.x;
    node.y = pos.y;
    node.z = pos.z;
    node.fx = pos.x;
    node.fy = pos.y;
    node.fz = pos.z;
    lastPositions.set(node.id, { ...pos });

  });
}

function computeLayout(name) {
  switch (name) {
    case "mlp":
      return layoutMlp(data.nodes);
    case "dna":
      return layoutDna(data.nodes);
    case "metro":
      return layoutMetro(data.nodes);
    case "lattice":
      return layoutLattice(data.nodes);
    case "planetary":
    default:
      return planetaryState?.positions || layoutMolecule(data.nodes);
  }
}

function setConfiguration(name, options = {}) {
  const next = configs.find((config) => config.name === name);
  if (!next) return;

  const fromPositions = snapshotPositions();

  if (name === "planetary") {
    const hubId = options.hubId || planetaryState?.hubId;
    planetaryState = createPlanetaryState(data.nodes, data.links, { hubId });
    updateOrbitRings();
    orbitLayer.group.visible = true;
    updateHubStatus();
  } else {
    orbitLayer.group.visible = false;
  }

  const toPositions = computeLayout(name);
  if (options.instant) {
    transition = null;
    currentPositions = new Map(toPositions);
    updateTransitionVisuals(1);
  } else {
    transition = createTransition(fromPositions, toPositions, randomDuration());
  }
  activeConfig = name;
  activeLabel = next.label;
  panel.setActive(name);
  panel.setStatus(`Active: ${activeLabel}`);
  if (!options.silent) {
    sound.playSwitch();
  }
}

function randomDuration() {
  return TRANSITION_MIN_MS + Math.random() * (TRANSITION_MAX_MS - TRANSITION_MIN_MS);
}

function updateTransition(nowMs) {
  if (!transition) return false;
  const result = applyTransition(transition, nowMs, currentPositions);
  updateTransitionVisuals(result.progress);
  if (result.done) {
    transition = null;
    updateTransitionVisuals(1);
  }
  return !result.done;
}

function updateTransitionVisuals(progress) {
  if (progress < 0.25) {
    const t = progress / 0.25;
    const value = LINK_OPACITY_BASE + (0.15 - LINK_OPACITY_BASE) * t;
    linkOpacityFactor = value / LINK_OPACITY_BASE;
  } else if (progress > 0.75) {
    const t = (progress - 0.75) / 0.25;
    linkOpacityFactor = (0.15 + (LINK_OPACITY_BASE - 0.15) * t) / LINK_OPACITY_BASE;
  } else {
    linkOpacityFactor = 0.15 / LINK_OPACITY_BASE;
  }

  const glowBoost = Math.sin(Math.PI * progress);
  nodeMaterialCache.forEach((material) => {
    material.emissiveIntensity = 0.2 + glowBoost * 0.15;
  });
}

function updatePlanetary(nowMs) {
  if (activeConfig !== "planetary" || transition) return;
  data.nodes.forEach((node) => {
    const pos = getPlanetaryPosition(node.id, planetaryState, nowMs);
    currentPositions.set(node.id, pos);
  });
}

function updatePanelInteraction() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(panel.getHitTargets());
  const hit = hits[0]?.object || null;

  if (hit !== hoveredButton) {
    hoveredButton = hit;
    panel.setHover(hit?.userData?.name || null);
  }
}

function tickFrame() {
  visualTime = performance.now();
  updateAutoRotate(visualTime);
  updatePanelInteraction();
  updateFpsStatus(visualTime);

  const transitioning = updateTransition(visualTime);
  if (!transitioning) {
    updatePlanetary(visualTime);
  }

  applyPositionsToNodes(visualTime);
  updateNodeInstances(visualTime);
  updateLinkGeometry();
  updateOrbitBreathing(visualTime);

  panel.updateHud(camera);
  controls.update();
  sound.tick(data.nodes);

  requestAnimationFrame(tickFrame);
}

function updateFpsStatus(nowMs) {
  fpsFrames += 1;
  const elapsed = nowMs - fpsLastAt;
  if (elapsed < 500) return;
  const fps = Math.round((fpsFrames * 1000) / elapsed);
  fpsFrames = 0;
  fpsLastAt = nowMs;
  panel.setStatus(`Active: ${activeLabel} · ${fps} FPS`);
}

function updateOrbitBreathing(timeMs) {
  if (!orbitLayer.rings.length) return;
  const pulse = (Math.sin(timeMs * 0.0012) + 1) * 0.5;
  orbitLayer.rings.forEach((ring, index) => {
    ring.material.opacity = 0.16 + pulse * 0.08 + index * 0.002;
  });
}

function updateHubStatus() {
  if (!planetaryState) return;
  const hubNode = nodesById.get(planetaryState.hubId);
  const label = hubNode?.label || hubNode?.id || planetaryState.hubId;
  panel.setHub(`Hub: ${label}`);
}

graph.onNodeClick((node) => {
  if (!node) return;
  if (activeConfig !== "planetary") return;
  setConfiguration("planetary", { hubId: node.id });
});

window.addEventListener("pointermove", (event) => {
  const rect = graph.renderer().domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

window.addEventListener("pointerdown", (event) => {
  registerInteraction();
  sound.resumeIfNeeded();
  if (hoveredButton) {
    panel.handleClick(hoveredButton);
  }
});

window.addEventListener("wheel", registerInteraction, { passive: true });
window.addEventListener("keydown", (event) => {
  registerInteraction();
  if (event.key >= "1" && event.key <= "5") {
    const index = Number(event.key) - 1;
    const config = configs[index];
    if (config) setConfiguration(config.name);
  }
  if (event.key.toLowerCase() === "p") {
    setConfiguration("planetary");
  }
});

window.addEventListener("resize", () => {
  graph.width(window.innerWidth).height(window.innerHeight);
  updateCameraLimits();
});

assignNodeSizes(data.nodes);
buildIndex(data.nodes, data.links);
initInstancedNodes();

planetaryState = createPlanetaryState(data.nodes, data.links);
currentPositions = new Map(planetaryState.positions);
updateOrbitRings();
updateHubStatus();
updateCameraLimits();
panel.setStatus("Active: Planetary");

graph.width(window.innerWidth).height(window.innerHeight);
setConfiguration("planetary", { instant: true, silent: true });
tickFrame();
