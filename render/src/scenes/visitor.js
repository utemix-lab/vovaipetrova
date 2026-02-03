/**
 * Visitor Scene — Финальный рендер с панелями 3S
 * Основан на mono-graph.js с полным визуалом
 * Звук: один непрерывный, синхронизированный с физикой
 */

import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import "./visitor.css";
import { VISUAL_CONFIG } from "../visual/config.js";
import { PATHS } from "../compat/paths.js";

// === Константы ===
const CONFIG = {
  contractsPath: PATHS.DATA_ROOT,
  defaultRoute: "demo/visitor.demo.route.json",
  defaultGraphUrl: PATHS.UNIVERSE_JSON
};
const AUTHOR_PLUG_ICON = `${PATHS.WIDGETS}/author-plug.png`;

const BASE_NODE_RADIUS = VISUAL_CONFIG.node.minRadius;
const NODE_PULSE_AMPLITUDE = 0.07;
const NODE_PULSE_SPEED = 0.0016;
const LINK_PULSE_AMPLITUDE = 0.08;
const LINK_PULSE_SPEED = 0.0013;
const AUTO_ROTATE_SPEED = 0.18;
const AUTO_ROTATE_IDLE_MS = 2200;
const ROOT_LEVER_CONFIG = {
  holdMs: 420,
  maxShift: 10,
  threshold: 6
};

// Палитра
const palette = {
  ...VISUAL_CONFIG.colors,
  nodeSelected: "#fbbf24",
  nodeStart: "#22d3ee",
  linkDefault: "#6b7280"
};

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

const NODE_DEFAULTS = {
  type: "concept",
  visibility: "public",
  status: "expandable",
  semantics: {
    role: "content",
    abstraction: "medium"
  },
  rag: {
    index: true,
    priority: 0.5
  }
};

const VIEW_TYPES = {
  knowledge: new Set(["domain", "concept", "character"]),
  system: new Set(["root", "hub", "module", "spec", "process", "policy"]),
  all: null
};

// === UI Setup ===
document.body.classList.add("visitor-mode");
createUI();

const graphEl = document.getElementById("graph");

// === Состояние ===
let currentRoute = null;
let currentStep = null;
let currentStepIndex = 0;
let currentUniverse = null;
let currentView = "all";
let currentSource = "canon";
let currentGraphUrl = CONFIG.defaultGraphUrl;
let nodesById = new Map();
let neighborsById = new Map();
let domainWidgets = null; // Visual Anchors v1
let pointerTagsRegistry = null;
let pointerTagsByTag = new Map();
let aiCatalog = [];
let practiceParticipation = [];
let exportsCache = null;
let activeContext = [];
let activeQueryTag = null;
let queryModeActive = false;
let selectedServiceItem = null;

const PRACTICE_HINTS = {
  "domain-ai": { id: "practice-direction", label: "Режиссура" }
};
let hoverNode = null;
let scopeHighlightActive = false;
let scopeHighlightNodeIds = new Set();
let activeRootLever = null;

// Experimental UI rule (non-canon): keep potential in Story panel
const EXPERIMENTAL_RULES = {
  potentialInStory: true
};

// === Mini Cube (domains visualization) ===
let miniCubeScene = null;
let miniCubeCamera = null;
let miniCubeRenderer = null;
let miniCubeMeshes = new Map(); // nodeId -> mesh
let miniCubeGroup = null;
let miniCubeAnimationId = null;
let miniShapeHubId = null;
let visualTime = 0;
let lastInteractionAt = 0;
let sceneRotation = 0;
let isDragging = false;

const highlightNodes = new Set();
const highlightLinks = new Set();
const nodeGeometry = new THREE.SphereGeometry(1, 48, 48);
const nodeMaterialCache = new Map();
const nodeMeshes = new Map();
const nodeBaseRadius = new Map();
const nodePulsePhase = new Map();
const linkPulsePhase = new Map();

// === Граф ===
const graph = ForceGraph3D()(graphEl)
  .backgroundColor(VISUAL_CONFIG.colors.background)
  .showNavInfo(false)
  .nodeRelSize(BASE_NODE_RADIUS)
  .linkOpacity(0.35)
  .linkWidth(0.6)
  .linkDirectionalParticles(0);

// Физика — плавное "устаканивание"
graph.d3Force("link").distance((link) => getLinkDistance(link));
graph.d3VelocityDecay(0.08);  // Медленное затухание (было 0.2)
graph.d3AlphaDecay(0.008);    // Долго "живёт" (было 0.02)

// Освещение
graph.scene().add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(40, 60, 120);
graph.scene().add(keyLight);

// Камера
const camera = graph.camera();
camera.fov = VISUAL_CONFIG.camera.fov;
camera.updateProjectionMatrix();

// Контроллы
const controls = graph.controls();
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.autoRotate = true;
controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
controls.minDistance = 80;   // Не ближе 80 — граф всегда видим
controls.maxDistance = 600;  // Не дальше 600 — не уменьшается до точки

// === Утилиты ===
function getId(value) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function hashId(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// === Цвета узлов ===
let widgetHighlightedNodeId = null; // Узел, подсвеченный через виджет

function getNodeColor(node) {
  // Подсветка через виджет — жёлтый
  if (widgetHighlightedNodeId && node.id === widgetHighlightedNodeId) return palette.nodeSelected;
  if (currentStep && node.id === currentStep.id) return palette.nodeSelected;
  if (node.isStart) return palette.nodeStart;
  if (scopeHighlightActive && scopeHighlightNodeIds.has(node.id)) return palette.nodeSelected;
  return palette.nodeDefault;
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
    return BASE_NODE_RADIUS * 10;
  }
  return BASE_NODE_RADIUS;
}

// === Материал узлов (rim-эффект) ===
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

// === Рёбра (конусные смычки) ===
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

const nozzleGeometry = createNozzleGeometry();

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

  const isHighlighted = highlightLinks.has(link);

  // При подсветке — жёлтый цвет, иначе — цвета узлов
  let startColor, endColor, midColor;
  if (isHighlighted) {
    const highlightColor = new THREE.Color(palette.nodeSelected); // Жёлтый
    startColor = highlightColor;
    endColor = highlightColor;
    midColor = highlightColor;
  } else {
    startColor = new THREE.Color(sourceNode ? getNodeColor(sourceNode) : palette.linkDefault);
    endColor = new THREE.Color(targetNode ? getNodeColor(targetNode) : palette.linkDefault);
    midColor = new THREE.Color(palette.linkDefault);
  }

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

  line.material.opacity = isHighlighted ? 0.9 : 0.4;

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

  const startBase = start.clone().add(unitDir.clone().multiplyScalar(startRadius - embedOffsetStart));
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
}

function getLinkPulsePhase(link) {
  const key = link.id || `${getId(link.source)}-${getId(link.target)}`;
  if (linkPulsePhase.has(key)) return linkPulsePhase.get(key);
  const phaseSeed = hashId(String(key)) % 1000;
  const phase = (phaseSeed / 1000) * Math.PI * 2;
  linkPulsePhase.set(key, phase);
  return phase;
}

function getLinkDistance(link) {
  const base = VISUAL_CONFIG.link.baseLength;
  const variance = VISUAL_CONFIG.link.lengthVariance;
  const seedValue = hashId(String(link.id || `${getId(link.source)}-${getId(link.target)}`));
  const factor = (seedValue % 1000) / 1000;
  return base + (factor - 0.5) * variance * 2;
}

function normalizeNode(node) {
  const semantics = { ...NODE_DEFAULTS.semantics, ...(node.semantics || {}) };
  const rag = { ...NODE_DEFAULTS.rag, ...(node.rag || {}) };
  return {
    ...node,
    type: node.type || NODE_DEFAULTS.type,
    visibility: node.visibility || NODE_DEFAULTS.visibility,
    status: node.status || NODE_DEFAULTS.status,
    semantics,
    rag
  };
}

function applyViewFilter(nodes, edges, view) {
  if (!view || view === "all") {
    return { nodes, edges };
  }
  const allowed = VIEW_TYPES[view];
  if (!allowed) {
    return { nodes, edges };
  }

  const allowedIds = new Set();
  const filteredNodes = nodes.filter((node) => {
    const type = node.type || NODE_DEFAULTS.type;
    const isAllowed = allowed.has(type);
    if (isAllowed) {
      allowedIds.add(node.id);
    }
    return isAllowed;
  });

  const filteredEdges = edges.filter((edge) => {
    const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source;
    const targetId = typeof edge.target === "object" ? edge.target.id : edge.target;
    return allowedIds.has(sourceId) && allowedIds.has(targetId);
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

// === Настройка графа ===
graph.nodeLabel((node) => node.label || node.id);
graph.nodeColor((node) => getNodeColor(node));
graph.nodeThreeObject((node) => createNodeMesh(node));
graph.nodeThreeObjectExtend(false);

graph.nodeVal((node) => {
  const radius = getNodeRadius(node);
  return radius / BASE_NODE_RADIUS;
});

graph.linkThreeObject((link) => createLinkObject(link));
graph.linkPositionUpdate((obj, position, link) => updateLinkObject(obj, position, link));
graph.linkColor((link) => (highlightLinks.has(link) ? palette.highlight : palette.linkDefault));
graph.linkWidth((link) => (highlightLinks.has(link) ? 1.6 : 0.6));

// === Звук — один непрерывный, синхронизированный с физикой ===
const motionSound = (() => {
  let ctx = null;
  let osc1 = null;      // Основной тон
  let osc2 = null;      // Обертон (октава выше)
  let osc3 = null;      // Обертон (квинта)
  let gainNode = null;
  let filterNode = null;
  let isActive = false;
  let isInitialized = false;

  const BASE_FREQ = 80;           // Низкий базовый тон
  const MAX_VOLUME = 0.25;
  const FILTER_MIN = 200;
  const FILTER_MAX = 800;
  const SMOOTHING = 0.92;         // Плавность изменений

  let currentGain = 0;
  let currentFilterFreq = FILTER_MIN;
  let targetGain = 0;
  let targetFilterFreq = FILTER_MIN;

  function init() {
    if (isInitialized) return;

    ctx = new AudioContext();

    // Основной тон
    osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = BASE_FREQ;

    // Обертон — октава выше
    osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = BASE_FREQ * 2;

    // Обертон — квинта
    osc3 = ctx.createOscillator();
    osc3.type = "triangle";
    osc3.frequency.value = BASE_FREQ * 1.5;

    // Микшер для осцилляторов
    const mixer = ctx.createGain();
    mixer.gain.value = 1;

    // Подключаем осцилляторы к микшеру с разной громкостью
    const gain1 = ctx.createGain();
    gain1.gain.value = 1.0;  // Основной — полная громкость
    osc1.connect(gain1);
    gain1.connect(mixer);

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.3;  // Октава — тише
    osc2.connect(gain2);
    gain2.connect(mixer);

    const gain3 = ctx.createGain();
    gain3.gain.value = 0.15; // Квинта — ещё тише
    osc3.connect(gain3);
    gain3.connect(mixer);

    // Фильтр — "подводный" эффект
    filterNode = ctx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = FILTER_MIN;
    filterNode.Q.value = 2;

    // Общая громкость
    gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    // Цепочка: mixer → filter → gain → output
    mixer.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Запуск осцилляторов (они работают всегда, громкость управляет звуком)
    osc1.start();
    osc2.start();
    osc3.start();

    isInitialized = true;
    console.log("[MotionSound] Initialized");
  }

  async function resumeIfNeeded() {
    if (!isInitialized) init();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  // Вычислить среднюю скорость системы
  function getSystemVelocity(nodes) {
    if (!nodes || nodes.length === 0) return 0;

    let totalSpeed = 0;
    let count = 0;

    nodes.forEach((node) => {
      const vx = node.vx || 0;
      const vy = node.vy || 0;
      const vz = node.vz || 0;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      totalSpeed += speed;
      count++;
    });

    return count > 0 ? totalSpeed / count : 0;
  }

  // Обновление звука — вызывается каждый кадр
  function tick(nodes) {
    if (!isInitialized || !ctx || ctx.state !== "running") return;
    if (isDragging) {
      // Во время перетаскивания — тишина
      targetGain = 0;
      targetFilterFreq = FILTER_MIN;
    } else {
      const velocity = getSystemVelocity(nodes);

      // Нормализация скорости (0-1)
      const normalizedVelocity = Math.min(1, velocity / 2.5);

      // Громкость пропорциональна скорости
      targetGain = normalizedVelocity * MAX_VOLUME;

      // Фильтр открывается при движении
      targetFilterFreq = FILTER_MIN + normalizedVelocity * (FILTER_MAX - FILTER_MIN);

      // Частота слегка повышается при движении (напряжение)
      const freqMod = 1 + normalizedVelocity * 0.15;
      if (osc1) osc1.frequency.value = BASE_FREQ * freqMod;
      if (osc2) osc2.frequency.value = BASE_FREQ * 2 * freqMod;
      if (osc3) osc3.frequency.value = BASE_FREQ * 1.5 * freqMod;
    }

    // Плавная интерполяция
    currentGain = currentGain * SMOOTHING + targetGain * (1 - SMOOTHING);
    currentFilterFreq = currentFilterFreq * SMOOTHING + targetFilterFreq * (1 - SMOOTHING);

    // Применяем значения
    if (gainNode) gainNode.gain.value = currentGain;
    if (filterNode) filterNode.frequency.value = currentFilterFreq;
  }

  return { resumeIfNeeded, tick };
})();

// === Индекс соседей ===
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

// === Подсветка ===
function refreshHighlights(node) {
  highlightNodes.clear();
  highlightLinks.clear();

  if (node) {
    highlightNodes.add(node);
    const graphData = graph.graphData();
    graphData.links.forEach((link) => {
      const sourceId = getId(link.source);
      const targetId = getId(link.target);
      if (sourceId === node.id || targetId === node.id) {
        highlightLinks.add(link);
        const otherId = sourceId === node.id ? targetId : sourceId;
        const otherNode = nodesById.get(otherId);
        if (otherNode) highlightNodes.add(otherNode);
      }
    });
  }
}

// === События графа ===
let lastHoveredNodeId = null;

graph.onNodeHover((node) => {
  // Снять подсветку с предыдущего узла, виджета и мини-куба
  if (lastHoveredNodeId && lastHoveredNodeId !== node?.id) {
    highlightNodeById(lastHoveredNodeId, false);
    highlightWidgetById(lastHoveredNodeId, false);
    syncMiniCubeHighlight(lastHoveredNodeId, false);
    lastHoveredNodeId = null;
  }

  if (node === hoverNode) return;
  hoverNode = node || null;
  refreshHighlights(hoverNode);
  graph.refresh();

  // Подсветить узел, виджет и мини-куб
  if (hoverNode) {
    highlightNodeById(hoverNode.id, true);
    highlightWidgetById(hoverNode.id, true);
    syncMiniCubeHighlight(hoverNode.id, true);
    lastHoveredNodeId = hoverNode.id;
  }
});

graph.onNodeClick((node) => {
  registerInteraction();
  motionSound.resumeIfNeeded();
  goToStepById(node.id);
});

graph.onNodeDrag((node) => {
  registerInteraction();
  isDragging = true;
  node.fx = node.x;
  node.fy = node.y;
  node.fz = node.z;
});

graph.onNodeDragEnd((node) => {
  isDragging = false;
  node.fx = null;
  node.fy = null;
  node.fz = null;
  // Звук начнётся автоматически при движении системы
  motionSound.resumeIfNeeded();
});

// === Пульсация узлов ===
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

// === Auto-rotate ===
function updateAutoRotate(timeMs) {
  const idle = timeMs - lastInteractionAt > AUTO_ROTATE_IDLE_MS;
  controls.autoRotate = idle;
  if (idle) {
    sceneRotation += 0.00025;
    graph.scene().rotation.y = sceneRotation;
  }
}

function registerInteraction() {
  lastInteractionAt = performance.now();
  controls.autoRotate = false;
}

// === Загрузка маршрута ===
let currentRoutePath = null;

async function loadRoute(path) {
  currentRoutePath = path;
  const url = `${CONFIG.contractsPath}/routes/${path}`;
  try {
    const response = await fetch(url + "?t=" + Date.now()); // Cache bust
    if (!response.ok) throw new Error(`Failed to load: ${url}`);
    const route = await response.json();
    setRoute(route);
  } catch (error) {
    console.error("[Visitor] Failed to load route:", error);
  }
}

// Загрузить Universe Graph (канонический граф из extended-mind)
async function loadUniverseGraph() {
  const url = buildGraphUrl(currentGraphUrl);
  try {
    const response = await fetch(withCacheBust(url));
    if (!response.ok) throw new Error(`Failed to load: ${url}`);
    const universe = await response.json();
    currentUniverse = universe;
    const route = buildRouteFromUniverse(universe, currentView);
    setRoute(route);
    console.log("[Visitor] Loaded Universe Graph with", route.nodes.length, "nodes");
  } catch (error) {
    console.error("[Visitor] Failed to load Universe Graph:", error);
    // Fallback to route
    loadRoute(CONFIG.defaultRoute);
  }
}

// Загрузить виджеты доменов (Visual Anchors v1)
async function loadDomainWidgets() {
  const url = `${CONFIG.contractsPath}/ui/widgets/domains.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    domainWidgets = await response.json();
    console.log("[Visitor] Loaded domain widgets:", domainWidgets.widgets?.length);
  } catch (error) {
    console.warn("[Visitor] Domain widgets not available:", error.message);
    domainWidgets = null;
  }
}

function parseJsonl(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        console.warn("[Visitor] Failed to parse JSONL line:", line);
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeExportKey(path, type) {
  const filename = (path || "").split("/").pop() || "";
  const base = filename.replace(/\.jsonl?$/i, "");
  if (type === "catalog" && base.endsWith("_catalog")) {
    return base.slice(0, -"_catalog".length);
  }
  if (type === "registry" && base.endsWith("_registry")) {
    return base.slice(0, -"_registry".length);
  }
  return base;
}

async function loadJson(path) {
  const url = `${CONFIG.contractsPath}/${path}`;
  const response = await fetch(withCacheBust(url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadJsonl(path) {
  const url = `${CONFIG.contractsPath}/${path}`;
  const response = await fetch(withCacheBust(url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  return parseJsonl(text);
}

function applyExports(exportsData) {
  pointerTagsRegistry = exportsData.registries.pointer_tags || null;
  pointerTagsByTag = new Map((pointerTagsRegistry?.tags || []).map((t) => [t.tag, t]));
  aiCatalog = exportsData.catalogs.ai || [];
  practiceParticipation = exportsData.catalogs.practice_participation || [];
}

async function loadExports() {
  if (exportsCache) return exportsCache;
  const manifestUrl = `${CONFIG.contractsPath}/manifests/assets.manifest.json`;
  try {
    const response = await fetch(withCacheBust(manifestUrl));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    const exportsSection = manifest.exports || {};
    const catalogs = exportsSection.catalogs || [];
    const registries = exportsSection.registries || [];
    const exportsData = { catalogs: {}, registries: {} };

    await Promise.all([
      ...catalogs.map(async (path) => {
        const key = normalizeExportKey(path, "catalog");
        exportsData.catalogs[key] = await loadJsonl(path);
      }),
      ...registries.map(async (path) => {
        const key = normalizeExportKey(path, "registry");
        exportsData.registries[key] = await loadJson(path);
      })
    ]);

    exportsCache = exportsData;
    applyExports(exportsData);
    console.log("[Visitor] Loaded exports:", Object.keys(exportsData.catalogs).length, "catalogs");
    return exportsData;
  } catch (error) {
    console.warn("[Visitor] Exports manifest not available:", error.message);
    const fallback = { catalogs: {}, registries: {} };
    try {
      fallback.registries.pointer_tags = await loadJson("exports/pointer_tags_registry.json");
    } catch (innerError) {
      console.warn("[Visitor] Pointer tags registry not available:", innerError.message);
    }
    try {
      fallback.catalogs.ai = await loadJsonl("exports/ai_catalog.jsonl");
    } catch (innerError) {
      console.warn("[Visitor] AI catalog not available:", innerError.message);
    }
    try {
      fallback.catalogs.practice_participation = await loadJsonl("exports/practice_participation.jsonl");
    } catch (innerError) {
      console.warn("[Visitor] Practice participation not available:", innerError.message);
    }
    exportsCache = fallback;
    applyExports(fallback);
    return exportsCache;
  }
}

async function reloadRoute() {
  console.log("[Visitor] Reloading...");

  const indicator = document.getElementById("step-indicator");
  if (indicator) indicator.textContent = "Reloading...";

  if (currentSource === "demo") {
    await loadRoute(CONFIG.defaultRoute);
  } else {
    await loadUniverseGraph();
  }
  console.log("[Visitor] Reloaded!");
}

function buildRouteFromUniverse(universe, view) {
  const normalizedNodes = (universe.nodes || []).map((node) => normalizeNode(node));
  const normalizedEdges = (universe.edges || []).map((edge) => ({
    ...edge,
    type: edge.type || "relates"
  }));
  const filtered = applyViewFilter(normalizedNodes, normalizedEdges, view);

  return {
    id: "universe-graph",
    title: universe.meta?.description || "Universe Graph",
    nodes: filtered.nodes.map((node) => ({
      ...node,
      label: node.label,
      position: node.position,
      story: { text: node.story || "", refs: [] },
      system: { text: node.system || "", refs: [] },
      service: normalizeServiceData(node.service)
    })),
    edges: filtered.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "NEXT"
    })),
    start_node_id: filtered.nodes[0]?.id || "universe"
  };
}

function normalizeServiceData(service) {
  if (!service) return { text: "", actions: [] };
  if (typeof service === "string") {
    return { text: service, actions: [] };
  }
  if (typeof service === "object") {
    return {
      text: service.text || "",
      actions: Array.isArray(service.actions) ? service.actions : []
    };
  }
  return { text: String(service), actions: [] };
}

function buildGraphUrl(rawUrl) {
  // Если путь относительный, добавляем contractsPath
  if (!rawUrl.startsWith("http") && !rawUrl.startsWith("/")) {
    return `${CONFIG.contractsPath}/${rawUrl}`;
  }
  return rawUrl;
}

function withCacheBust(url) {
  const next = new URL(url, window.location.href);
  next.searchParams.set("t", Date.now().toString());
  return next.toString();
}

function setRoute(route) {
  currentRoute = route;

  const graphData = {
    nodes: route.nodes.map((n) => {
      const jitter = (hashId(n.id) % 100) / 100 * 2;
      const baseRadius = BASE_NODE_RADIUS + jitter;
      const visualRadius = (n.type === "hub" || n.type === "root")
        ? BASE_NODE_RADIUS * 4
        : baseRadius;
      return {
        ...n,
        isStart: n.id === route.start_node_id,
        visualRadius
      };
    }),
    links: route.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type
    }))
  };

  nodeMeshes.clear();
  nodeBaseRadius.clear();
  nodePulsePhase.clear();
  linkPulsePhase.clear();
  nodeMaterialCache.clear();

  graph.graphData(graphData);
  buildIndex(graphData);
  updateGraphStats(graphData.nodes.length, graphData.links.length);

  const startId = route.start_node_id || route.nodes[0]?.id;
  goToStepById(startId);

  setTimeout(() => {
    graph.zoomToFit(800, 150);  // Больше отступ = камера дальше
  }, 200);

  console.log("[Visitor] Route loaded:", route.title);
}

function updateGraphStats(nodesCount, edgesCount) {
  const el = document.getElementById("graph-stats");
  if (el) {
    el.textContent = `${nodesCount} nodes | ${edgesCount} edges`;
  }
}

// === Навигация ===
function goToStepById(stepId) {
  const node = nodesById.get(stepId);
  if (!node || !currentRoute) return;

  currentStep = node;
  currentStepIndex = currentRoute.nodes.findIndex((n) => n.id === stepId);

  nodeMaterialCache.clear();
  nodeMeshes.forEach((mesh, nodeId) => {
    const n = nodesById.get(nodeId);
    if (n) mesh.material = getRimMaterial(getNodeColor(n));
  });

  updatePanels();
  updateNavigation();
  refreshHighlights(currentStep);
  graph.refresh();
}

function goToNextStep() {
  if (!currentRoute || !currentStep) return;
  const nextEdge = currentRoute.edges.find(
    (e) => e.source === currentStep.id && e.type === "NEXT"
  );
  if (nextEdge) goToStepById(nextEdge.target);
}

function goToPrevStep() {
  if (!currentRoute || !currentStep) return;
  const prevEdge = currentRoute.edges.find(
    (e) => e.target === currentStep.id && e.type === "NEXT"
  );
  if (prevEdge) goToStepById(prevEdge.source);
}

function hasNextStep() {
  if (!currentRoute || !currentStep) return false;
  return currentRoute.edges.some((e) => e.source === currentStep.id && e.type === "NEXT");
}

function hasPrevStep() {
  if (!currentRoute || !currentStep) return false;
  return currentRoute.edges.some((e) => e.target === currentStep.id && e.type === "NEXT");
}

// === Обновление UI ===
function updatePanels() {
  if (!currentStep) return;

  const storyPanel = document.getElementById("story-panel");
  const systemPanel = document.getElementById("system-panel");
  const servicePanel = document.getElementById("service-panel");

  const serviceText = currentStep.service?.text || "";
  const hasQueryHints = extractTags(serviceText).length > 0;
  const isQueryNode = currentStep.id === "domain-ai";

  if (isQueryNode) {
    const tags = extractTags(serviceText);
    if (!activeQueryTag || !tags.includes(activeQueryTag)) {
      activeQueryTag = tags[0] || null;
    }
    if (activeQueryTag) {
      queryModeActive = true;
    }
  }

  // Story панель: домены, практики и персонажи имеют спец. виджеты
  if (currentStep.id === "domains" && domainWidgets?.widgets?.length) {
    updateStoryWithDomainWidgets(storyPanel, currentStep.story);
  } else if (currentStep.id === "practices") {
    updateStoryWithPracticeWidgets(storyPanel, currentStep.story);
  } else if (currentStep.id === "characters") {
    updateStoryWithCharacterWidgets(storyPanel, currentStep.story);
  } else if (EXPERIMENTAL_RULES.potentialInStory && isCharacterNode(currentStep)) {
    updateStoryWithPotential(storyPanel, currentStep);
    updatePanel(systemPanel, { text: "" });
    updateServicePanel(servicePanel, { text: "", actions: [] });
    updateContextStrip();
    return;
  } else if (isWorkbenchNode(currentStep)) {
    updateStoryWithWorkbench(storyPanel, currentStep);
    updatePanel(systemPanel, { text: "" });
    updateServicePanel(servicePanel, { text: "", actions: [] });
    updateContextStrip();
    return;
  } else if (isDomainNode(currentStep)) {
    updateStoryWithDomainFocus(storyPanel, currentStep);
  } else if (isWidgetNode(currentStep)) {
    updateStoryWithNodeWidget(storyPanel, currentStep.story, currentStep);
  } else {
    const storyContent = storyPanel?.querySelector(".panel-content");
    storyContent?.classList.remove("story-compact");
    if (queryModeActive && PRACTICE_HINTS[currentStep.id]) {
      updateStoryWithPracticeHint(storyPanel, currentStep.story, PRACTICE_HINTS[currentStep.id]);
    } else if (hasQueryHints && !isQueryNode) {
      updateStoryWithSystemText(storyPanel, currentStep.story, currentStep.system);
    } else {
      updatePanel(storyPanel, currentStep.story);
    }
  }

  if (queryModeActive && hasQueryHints) {
    updateSystemWithQueryTags(systemPanel, serviceText);
    updateServicePanel(servicePanel, { text: "" });
  } else {
    updatePanel(systemPanel, currentStep.system);
    updateServicePanel(servicePanel, currentStep.service);
  }

  updateContextStrip();
}

function updateStoryWithPotential(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getNodeWidgetIcon(node);
  const descriptionText = "Описательный блок";
  const domainNodeIds = getRelatedNodeIdsByType(node?.id, "domain");
  const practiceNodeIds = getRelatedNodeIdsByType(node?.id, "practice");
  const workbenchNodeIds = getRelatedNodeIdsByType(node?.id, "workbench");

  let html = "";
  if (widgetIcon) {
    html += `
      <div class="node-toc">
        <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
          </div>
        </div>
      </div>`;
  }
  html += `<div class="text">${escapeHtml(descriptionText)}</div>`;

  html += `<div class="section-title">Континенты</div>`;
  html += `<div class="domain-widgets inline-widgets">`;
  html += domainNodeIds.map((nodeId) => {
    const label = nodesById.get(nodeId)?.label || nodeId;
    return `
      <div class="domain-widget highlight-widget widget--lever" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getDomainWidgetIcon(nodeId), "domain")}
        </div>
      </div>`;
  }).join("");
  html += `</div>`;

  html += `<div class="section-title">Практики</div>`;
  html += `<div class="domain-widgets inline-widgets">`;
  html += practiceNodeIds.map((nodeId) => {
    const label = nodesById.get(nodeId)?.label || nodeId;
    return `
      <div class="domain-widget highlight-widget widget--lever" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getPracticeWidgetIcon(nodeId), "practice")}
        </div>
      </div>`;
  }).join("");
  html += `</div>`;

  html += `<div class="section-title">Воркбенчи</div>`;
  html += `<div class="domain-widgets inline-widgets">`;
  html += workbenchNodeIds.map((nodeId) => {
    const label = nodesById.get(nodeId)?.label || nodeId;
    const sharedClass = isWorkbenchShared(nodeId) ? " domain-widget--shared" : "";
    return `
      <div class="domain-widget highlight-widget widget--lever${sharedClass}" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getWorkbenchWidgetIcon(nodeId), "workbench")}
        </div>
      </div>`;
  }).join("");
  html += `</div>`;

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  bindWidgetLever(content);
  bindEmblemSwap(content);
}

function isCharacterNode(node) {
  return node && node.type === "character";
}

function isDomainNode(node) {
  return node && node.type === "domain";
}

function isWorkbenchNode(node) {
  return node && node.type === "workbench";
}

function sortCharacterIds(ids) {
  const priority = ["character-vova", "character-vasya"];
  return [...ids].sort((a, b) => {
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    }
    return a.localeCompare(b);
  });
}

function getWorkbenchPrimaryCharacterId(nodeId) {
  const related = sortCharacterIds(getRelatedNodeIdsByType(nodeId, "character"));
  return related[0] || null;
}

function isWorkbenchShared(nodeId) {
  return getRelatedNodeIdsByType(nodeId, "character").length > 1;
}

function updateStoryWithWorkbench(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const workbenchLabel = node.label || node.id;
  const workbenchIcon = getWorkbenchWidgetIcon(node.id);
  const characterIcon = getCharacterWidgetIcon();
  const sharedClass = isWorkbenchShared(node.id) ? " node-widget--shared" : "";

  const relatedCharacters = sortCharacterIds(getRelatedNodeIdsByType(node.id, "character"));
  const relatedDomains = getRelatedNodeIdsByType(node.id, "domain");
  const relatedPractices = getRelatedNodeIdsByType(node.id, "practice");
  const relatedWorkbenches = getRelatedNodeIdsByType(node.id, "workbench").filter((id) => id !== node.id);

  let html = "";
  html += `
    <div class="node-toc">
      <div class="node-toc-row">
        <div class="node-widget node-widget--static node-widget--root${sharedClass}" title="${escapeHtml(workbenchLabel)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(workbenchIcon, "workbench", { isRoot: true })}
          </div>
        </div>
        ${relatedCharacters.map((nodeId) => {
          const label = nodesById.get(nodeId)?.label || nodeId;
          return `
            <div class="node-widget node-widget--static node-widget--root node-widget--lever" title="${escapeHtml(label)}">
              <div class="widget-frame">
                ${getWidgetImageHtml(characterIcon, "character", { isRoot: true })}
              </div>
            </div>`;
        }).join("")}
      </div>
    </div>`;

  html += `<div class="text">Описательный блок</div>`;

  if (relatedDomains.length) {
    html += `<div class="section-title">Континенты</div>`;
    html += `<div class="domain-widgets inline-widgets">`;
    html += relatedDomains.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget--lever" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getDomainWidgetIcon(nodeId), "domain")}
        </div>
        </div>`;
    }).join("");
    html += `</div>`;
  }

  if (relatedPractices.length) {
    html += `<div class="section-title">Практики</div>`;
    html += `<div class="domain-widgets inline-widgets">`;
    html += relatedPractices.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget--lever" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getPracticeWidgetIcon(nodeId), "practice")}
        </div>
        </div>`;
    }).join("");
    html += `</div>`;
  }

  if (relatedWorkbenches.length) {
    html += `<div class="section-title">Воркбенчи</div>`;
    html += `<div class="domain-widgets inline-widgets">`;
    html += relatedWorkbenches.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      const shared = isWorkbenchShared(nodeId) ? " domain-widget--shared" : "";
      return `
        <div class="domain-widget highlight-widget widget--lever${shared}" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getWorkbenchWidgetIcon(nodeId), "workbench")}
        </div>
        </div>`;
    }).join("");
    html += `</div>`;
  }

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindWidgetLever(content);
  bindEmblemSwap(content);
}

function updateStoryWithDomainFocus(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getNodeWidgetIcon(node);
  const descriptionText = "Описательный блок";
  const domainTag = buildDomainTag(node?.id);
  const relatedCharacters = getRelatedNodeIdsByType(node?.id, "character");
  const relatedPractices = getRelatedNodeIdsByType(node?.id, "practice");

  let html = "";
  if (widgetIcon) {
    html += `
      <div class="node-toc">
        <div class="node-widget node-widget--static node-widget--root" title="${escapeHtml(node.label || node.id)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
          </div>
        </div>
      </div>`;
  }
  html += `<div class="text">${escapeHtml(descriptionText)}</div>`;

  html += `<div class="potential-section">
    <div class="potential-title">Потенциал</div>`;

  if (relatedCharacters.length) {
    html += `<div class="potential-group-title">Проводники</div>`;
    html += `<div class="potential-buttons">`;
    html += relatedCharacters.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget--lever" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getCharacterWidgetIcon(), "character")}
        </div>
        </div>`;
    }).join("");
    html += `</div>`;
  }

  if (relatedPractices.length) {
    html += `<div class="potential-group-title">Практики</div>`;
    html += `<div class="potential-buttons">`;
    html += relatedPractices.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget--lever" data-node-id="${nodeId}" title="${escapeHtml(label)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getPracticeWidgetIcon(nodeId), "practice")}
        </div>
        </div>`;
    }).join("");
    html += `</div>`;
  }

  if (domainTag) {
    html += `<div class="potential-group-title">Данные</div>`;
    html += `<div class="potential-tags">
      <span class="pointer-tag" data-tag="${escapeHtml(domainTag)}">${escapeHtml(domainTag)}</span>
    </div>`;
  }

  html += `</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindWidgetLever(content);
  bindEmblemSwap(content);
  bindEmblemSwap(content);
  bindEmblemSwap(content);
  bindEmblemSwap(content);
  bindHighlightWidgets(content);
  bindEmblemSwap(content);
}

function updateStoryWithDomainWidgets(panel, data) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  // Destroy previous mini cube if exists
  destroyMiniCube();
  content.classList.add("story-compact");

  let html = `<div class="text">${renderTextWithTags(data?.text || "")}</div>`;

  // Mini Cube container
  html += `<div id="mini-cube-container"></div>`;

  // Visual Anchors: виджеты доменов
  html += `<div class="domain-widgets domain-grid">`;
  for (const widget of domainWidgets.widgets) {
    html += `
      <div class="domain-widget widget--lever" data-node-id="${widget.nodeId}" title="${widget.label}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getDomainWidgetIcon(widget.nodeId), "domain")}
        </div>
      </div>`;
  }
  html += `</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindWidgetLever(content);
  bindEmblemSwap(content);

  // Initialize mini cube
  const cubeContainer = document.getElementById("mini-cube-container");
  if (cubeContainer) {
    initMiniShape("cube", cubeContainer, domainWidgets.widgets.map(w => w.nodeId), "domains");
  }

  // Обработчики событий для виджетов
  content.querySelectorAll(".domain-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      highlightNodeById(nodeId, true);
      highlightMiniShapeNode(nodeId, true);
      // Подсветить связи
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      highlightNodeById(nodeId, false);
      highlightMiniShapeNode(nodeId, false);
      // Снять подсветку связей
      refreshHighlights(null);
      graph.refresh();
    });
    el.addEventListener("click", () => {
      registerInteraction();
      motionSound.resumeIfNeeded();
      goToStepById(el.dataset.nodeId);
    });
  });
}

function updateStoryWithPracticeWidgets(panel, data) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.add("story-compact");

  const practiceNodes = [...nodesById.values()].filter((n) => n.type === "practice");

  let html = `<div class="text">${renderTextWithTags(data?.text || "")}</div>`;
  html += `<div id="mini-cube-container"></div>`;
  html += `<div class="domain-widgets practice-grid">`;
  for (const node of practiceNodes) {
    html += `
      <div class="domain-widget widget--lever" data-node-id="${node.id}" title="${node.label}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getPracticeWidgetIcon(node.id), "practice")}
        </div>
      </div>`;
  }
  html += `</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindWidgetLever(content);
  bindEmblemSwap(content);

  const cubeContainer = document.getElementById("mini-cube-container");
  if (cubeContainer) {
    initMiniShape("icosa", cubeContainer, practiceNodes.map(n => n.id), "practices");
  }

  content.querySelectorAll(".domain-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      highlightNodeById(nodeId, true);
      highlightMiniShapeNode(nodeId, true);
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      highlightNodeById(nodeId, false);
      highlightMiniShapeNode(nodeId, false);
      refreshHighlights(null);
      graph.refresh();
    });
    el.addEventListener("click", () => {
      registerInteraction();
      motionSound.resumeIfNeeded();
      goToStepById(el.dataset.nodeId);
    });
  });
}

function updateStoryWithCharacterWidgets(panel, data) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.add("story-compact");

  const characterNodes = [...nodesById.values()].filter((n) => n.type === "character");

  let html = `<div class="text">${renderTextWithTags(data?.text || "")}</div>`;
  html += `<div id="mini-cube-container"></div>`;
  html += `<div class="domain-widgets character-grid">`;
  for (const node of characterNodes) {
    html += `
      <div class="domain-widget widget--lever" data-node-id="${node.id}" title="${node.label}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getCharacterWidgetIcon(), "character")}
        </div>
      </div>`;
  }
  html += `</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindWidgetLever(content);
  bindEmblemSwap(content);

  const cubeContainer = document.getElementById("mini-cube-container");
  if (cubeContainer) {
    initMiniShape("icosa", cubeContainer, characterNodes.map(n => n.id), "characters");
  }

  content.querySelectorAll(".domain-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      highlightNodeById(nodeId, true);
      highlightMiniShapeNode(nodeId, true);
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      highlightNodeById(nodeId, false);
      highlightMiniShapeNode(nodeId, false);
      refreshHighlights(null);
      graph.refresh();
    });
    el.addEventListener("click", () => {
      registerInteraction();
      motionSound.resumeIfNeeded();
      goToStepById(el.dataset.nodeId);
    });
  });
}

function updateStoryWithNodeWidget(panel, data, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getNodeWidgetIcon(node);
  let html = "";
  if (widgetIcon) {
    html += `
      <div class="node-toc">
        <div class="node-widget node-widget--static node-widget--root" title="${escapeHtml(node.label || node.id)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
          </div>
        </div>
      </div>`;
  }
  html += `<div class="text">${renderTextWithTags(data?.text || "")}</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindWidgetLever(content);
  bindEmblemSwap(content);
}

function isWidgetNode(node) {
  return node && ["domain", "practice", "character", "workbench"].includes(node.type);
}

function getNodeWidgetIcon(node) {
  if (!node) return null;
  if (node.type === "domain") {
    if (domainWidgets?.widgets?.length) {
      const exists = domainWidgets.widgets.some((widget) => widget.nodeId === node.id);
      if (!exists) return null;
    }
    return `${CONFIG.contractsPath}/assets/widgets/domain-plug.png`;
  }
  if (node.type === "practice") {
    return `${CONFIG.contractsPath}/assets/widgets/practice-plug.png`;
  }
  if (node.type === "character") {
    return `${CONFIG.contractsPath}/assets/widgets/character-plug.png`;
  }
  if (node.type === "workbench") {
    return `${CONFIG.contractsPath}/assets/widgets/workbench-plug.png`;
  }
  return null;
}

function getDomainWidgetIcon(nodeId) {
  return `${CONFIG.contractsPath}/assets/widgets/domain-plug.png`;
}

function getPracticeWidgetIcon(nodeId) {
  return `${CONFIG.contractsPath}/assets/widgets/practice-plug.png`;
}

function getCharacterWidgetIcon() {
  return `${CONFIG.contractsPath}/assets/widgets/character-plug.png`;
}

function getWorkbenchWidgetIcon(nodeId) {
  return `${CONFIG.contractsPath}/assets/widgets/workbench-plug.png`;
}

function getWidgetImageHtml(defaultSrc, alt = "icon", options = {}) {
  const safeAlt = escapeHtml(alt);
  const { isRoot = false } = options;
  
  if (isRoot) {
    // Root-виджет: сразу авторский лого, без подмены
    return `<img src="${AUTHOR_PLUG_ICON}" alt="${safeAlt}" />`;
  }
  
  // Lever/static-виджет: групповой лого, подмена на авторский при hover
  return `<img src="${defaultSrc}" data-default-src="${defaultSrc}" data-hover-src="${AUTHOR_PLUG_ICON}" alt="${safeAlt}" />`;
}

// Подсветка узлов через виджет
function highlightNodeById(nodeId, highlight) {
  const node = nodesById.get(nodeId);
  if (!node) return;

  if (highlight) {
    widgetHighlightedNodeId = nodeId;
  } else {
    if (widgetHighlightedNodeId === nodeId) {
      widgetHighlightedNodeId = null;
    }
  }

  // Обновить материал узла
  const mesh = nodeMeshes.get(nodeId);
  if (mesh) {
    mesh.material = getRimMaterial(getNodeColor(node));
  }
}


// Подсветка виджета по ID узла (для hover на графе)
function highlightWidgetById(nodeId, highlight) {
  const widget = document.querySelector(`.domain-widget[data-node-id="${nodeId}"]`);
  if (!widget) return;

  if (highlight) {
    widget.classList.add("widget-highlighted");
  } else {
    widget.classList.remove("widget-highlighted");
  }
}

// === Mini Shape Functions ===
function initMiniShape(type, container, nodeIds, hubId) {
  if (!nodeIds || nodeIds.length === 0) return;

  miniShapeHubId = hubId;
  const size = 220;
  const width = size;
  const height = size;

  miniCubeScene = new THREE.Scene();
  miniCubeCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  miniCubeCamera.position.z = 4;

  miniCubeRenderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  miniCubeRenderer.setSize(width, height);
  miniCubeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(miniCubeRenderer.domElement);

  miniCubeGroup = new THREE.Group();
  miniCubeScene.add(miniCubeGroup);

  let positions = [];
  if (type === "cube") {
    const cubeSize = 0.85;
    positions = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ].map(p => p.map(v => v * cubeSize));
  } else {
    const geom = new THREE.IcosahedronGeometry(1);
    const arr = geom.getAttribute("position").array;
    const uniq = [];
    for (let i = 0; i < arr.length; i += 3) {
      const v = [arr[i], arr[i + 1], arr[i + 2]];
      const key = v.map(n => n.toFixed(3)).join(",");
      if (!uniq.find(u => u.key === key)) uniq.push({ key, v });
      if (uniq.length >= 12) break;
    }
    const icosaSize = 1.275;
    positions = uniq.map(u => u.v.map(n => n * icosaSize));
  }

  const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const defaultMat = new THREE.MeshBasicMaterial({ color: 0x6b7280 });

  const used = nodeIds.slice(0, positions.length);
  used.forEach((nodeId, i) => {
    const mesh = new THREE.Mesh(sphereGeo, defaultMat.clone());
    mesh.position.set(...positions[i]);
    mesh.userData.nodeId = nodeId;
    miniCubeGroup.add(mesh);
    miniCubeMeshes.set(nodeId, mesh);
  });

  // Center sphere (hub)
  const centerMat = new THREE.MeshBasicMaterial({ color: 0x9ca3af });
  const centerMesh = new THREE.Mesh(sphereGeo, centerMat);
  centerMesh.position.set(0, 0, 0);
  centerMesh.userData.nodeId = hubId;
  miniCubeGroup.add(centerMesh);
  miniCubeMeshes.set(hubId, centerMesh);

  // Edges
  if (type === "cube") {
    const edgeIndices = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4b5563, opacity: 0.5, transparent: true });
    edgeIndices.forEach(([a, b]) => {
      if (!positions[a] || !positions[b]) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...positions[a]),
        new THREE.Vector3(...positions[b])
      ]);
      const line = new THREE.Line(geometry, lineMat);
      miniCubeGroup.add(line);
    });
  } else {
    const wireGeom = new THREE.IcosahedronGeometry(1.275);
    const edges = new THREE.EdgesGeometry(wireGeom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4b5563, opacity: 0.45, transparent: true });
    const wire = new THREE.LineSegments(edges, lineMat);
    miniCubeGroup.add(wire);
  }

  // Center to vertices (only for cube)
  if (type === "cube") {
    const centerLineMat = new THREE.LineBasicMaterial({ color: 0x374151, opacity: 0.3, transparent: true });
    positions.forEach(pos => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(...pos)
      ]);
      const line = new THREE.Line(geometry, centerLineMat);
      miniCubeGroup.add(line);
    });
  }

  miniCubeScene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;

  miniCubeRenderer.domElement.addEventListener("mousemove", (e) => {
    const rect = miniCubeRenderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, miniCubeCamera);
    const intersects = raycaster.intersectObjects(miniCubeGroup.children.filter(c => c.isMesh));

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      if (hoveredMesh !== mesh) {
        if (hoveredMesh) {
          const prevId = hoveredMesh.userData.nodeId;
          highlightMiniShapeNode(prevId, false);
          highlightNodeById(prevId, false);
          highlightWidgetById(prevId, false);
          refreshHighlights(null);
          graph.refresh();
        }
        hoveredMesh = mesh;
        const nodeId = mesh.userData.nodeId;
        highlightMiniShapeNode(nodeId, true);
        highlightNodeById(nodeId, true);
        highlightWidgetById(nodeId, true);
        const node = nodesById.get(nodeId);
        if (node) {
          refreshHighlights(node);
          graph.refresh();
        }
      }
    } else if (hoveredMesh) {
      const prevId = hoveredMesh.userData.nodeId;
      highlightMiniShapeNode(prevId, false);
      highlightNodeById(prevId, false);
      highlightWidgetById(prevId, false);
      refreshHighlights(null);
      graph.refresh();
      hoveredMesh = null;
    }
  });

  miniCubeRenderer.domElement.addEventListener("click", () => {
    if (hoveredMesh) {
      const nodeId = hoveredMesh.userData.nodeId;
      registerInteraction();
      motionSound.resumeIfNeeded();
      goToStepById(nodeId);
    }
  });

  miniCubeRenderer.domElement.addEventListener("mouseleave", () => {
    if (hoveredMesh) {
      const prevId = hoveredMesh.userData.nodeId;
      highlightMiniShapeNode(prevId, false);
      highlightNodeById(prevId, false);
      highlightWidgetById(prevId, false);
      refreshHighlights(null);
      graph.refresh();
      hoveredMesh = null;
    }
  });

  animateMiniCube();
}

function highlightMiniShapeNode(nodeId, highlight) {
  const mesh = miniCubeMeshes.get(nodeId);
  if (!mesh) return;

  if (highlight) {
    mesh.material.color.setHex(0xfbbf24);
    mesh.scale.setScalar(1.5);
  } else {
    const isHub = nodeId === miniShapeHubId;
    mesh.material.color.setHex(isHub ? 0x9ca3af : 0x6b7280);
    mesh.scale.setScalar(1);
  }
}

function animateMiniCube() {
  if (!miniCubeRenderer) return;

  miniCubeAnimationId = requestAnimationFrame(animateMiniCube);

  // Slow auto-rotation
  if (miniCubeGroup) {
    miniCubeGroup.rotation.y += 0.003;
    miniCubeGroup.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
  }

  miniCubeRenderer.render(miniCubeScene, miniCubeCamera);
}

function destroyMiniCube() {
  if (miniCubeAnimationId) {
    cancelAnimationFrame(miniCubeAnimationId);
    miniCubeAnimationId = null;
  }
  if (miniCubeRenderer) {
    miniCubeRenderer.dispose();
    miniCubeRenderer.domElement.remove();
    miniCubeRenderer = null;
  }
  miniCubeScene = null;
  miniCubeCamera = null;
  miniCubeGroup = null;
  miniCubeMeshes.clear();
  miniShapeHubId = null;
}

// Sync: highlight mini cube from main graph hover
function syncMiniCubeHighlight(nodeId, highlight) {
  if (!miniCubeRenderer) return;
  highlightMiniShapeNode(nodeId, highlight);
}

// === Pointer Tags / Query Mode ===
const TAG_PATTERN = /\b(?:cap|method|arch|provider|domain|model|country|practice):[a-z0-9_:-]+\b/gi;

function normalizeTag(tag) {
  const [prefix, ...rest] = tag.split(":");
  return { prefix: (prefix || "").toLowerCase(), key: (rest.join(":") || "").toLowerCase() };
}

function tagToFallbackQuery(tag) {
  const { key } = normalizeTag(tag);
  return key.replace(/[_-]+/g, " ").trim();
}

function renderLineWithTags(raw) {
  let html = "";
  let lastIndex = 0;
  raw.replace(TAG_PATTERN, (match, offset) => {
    const before = raw.slice(lastIndex, offset);
    html += escapeHtml(before);
    html += `<span class="pointer-tag" data-tag="${match}">${escapeHtml(match)}</span>`;
    lastIndex = offset + match.length;
    return match;
  });
  html += escapeHtml(raw.slice(lastIndex));
  return html;
}

function renderTextWithTags(text) {
  const raw = text || "";
  return raw
    .split("\n")
    .map((line) => renderLineWithTags(line))
    .join("<br>");
}

function extractTags(text) {
  return (text || "").match(TAG_PATTERN) || [];
}

function renderTagPillsOnly(text) {
  const tags = extractTags(text);
  return tags.map((tag) => `<span class="pointer-tag" data-tag="${tag}">${escapeHtml(tag)}</span>`).join(" ");
}

function renderTagPillsStatic(tags) {
  return tags.map((tag) => `<span class="pointer-tag pointer-tag--static">${escapeHtml(tag)}</span>`).join(" ");
}

function bindPotentialPresetButtons(container) {
  container.querySelectorAll(".preset-button").forEach((el) => {
    const query = el.dataset.query;
    if (!query) return;
    el.addEventListener("click", () => {
      activateQueryFromPreset(query);
    });
  });
}

function activateQueryFromPreset(query) {
  if (!query) return;
  setQueryTag(query, "preset");
}

function bindHighlightWidgets(container) {
  container.querySelectorAll(".highlight-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      highlightNodeById(nodeId, true);
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      highlightNodeById(nodeId, false);
      refreshHighlights(null);
      graph.refresh();
    });
    el.addEventListener("click", (event) => {
      event.preventDefault();
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      if (!node) return;
      if (node.type === "domain") {
        const domainTag = buildDomainTag(node.id);
        if (domainTag) {
          setQueryTag(domainTag, "widget");
        }
      } else if (node.type === "workbench") {
        registerInteraction();
        motionSound.resumeIfNeeded();
        goToStepById(node.id);
      }
    });
  });
}

function bindVovaScopeWidget(container, node) {
  const scopeWidget = container.querySelector(".vova-scope-widget");
  if (!scopeWidget || !node) return;
  const scopeIds = new Set([
    node.id,
    ...getRelatedNodeIdsByType(node.id, "domain"),
    ...getRelatedNodeIdsByType(node.id, "practice"),
    ...getRelatedNodeIdsByType(node.id, "workbench")
  ]);
  scopeWidget.addEventListener("mouseenter", () => {
    scopeWidget.classList.add("scope-active");
    setScopeWidgetHighlight(container, true);
    activateScopeHighlight(scopeIds);
  });
  scopeWidget.addEventListener("mouseleave", () => {
    scopeWidget.classList.remove("scope-active");
    setScopeWidgetHighlight(container, false);
    clearScopeHighlight();
  });
}

function setRootLeverState(widget, isActive) {
  if (!widget) return;
  if (isActive) {
    if (activeRootLever && activeRootLever !== widget) {
      setRootLeverState(activeRootLever, false);
    }
    activeRootLever = widget;
    widget.classList.add("widget--shifted");
    widget.style.setProperty("--lever-offset", `${-ROOT_LEVER_CONFIG.maxShift}px`);
    document.body.classList.add("scene-lever-active");
  } else {
    if (activeRootLever === widget) {
      activeRootLever = null;
    }
    widget.classList.remove("widget--shifted");
    widget.style.removeProperty("--lever-offset");
    if (!activeRootLever) {
      document.body.classList.remove("scene-lever-active");
    }
  }
}

function bindWidgetLever(container) {
  container.querySelectorAll(".widget--lever, .node-widget--lever").forEach((widget) => {
    if (widget.dataset.leverBound) return;
    widget.dataset.leverBound = "true";

    let holdTimer = null;
    let leverActive = false;
    let startY = 0;
    let startOffset = 0;
    let currentShift = 0;
    let pointerId = null;

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const onPointerMove = (event) => {
      if (!leverActive) return;
      const delta = event.clientY - startY;
      const nextShift = Math.max(-ROOT_LEVER_CONFIG.maxShift, Math.min(0, startOffset + delta));
      currentShift = nextShift;
      widget.style.setProperty("--lever-offset", `${nextShift}px`);
    };

    const finishLever = () => {
      if (leverActive) {
        const shouldActivate = currentShift <= -ROOT_LEVER_CONFIG.threshold;
        setRootLeverState(widget, shouldActivate);
      }
      widget.classList.remove("lever-dragging");
      leverActive = false;
      clearHold();
      if (pointerId !== null && widget.hasPointerCapture(pointerId)) {
        widget.releasePointerCapture(pointerId);
      }
      pointerId = null;
    };

    widget.addEventListener("pointerdown", (event) => {
      if (event.button && event.button !== 0) return;
      startY = event.clientY;
      startOffset = widget.classList.contains("node-widget--shifted")
        ? -ROOT_LEVER_CONFIG.maxShift
        : 0;
      currentShift = startOffset;
      pointerId = event.pointerId;
      if (widget.setPointerCapture) {
        widget.setPointerCapture(pointerId);
      }
      holdTimer = setTimeout(() => {
        leverActive = true;
        widget.classList.add("lever-dragging");
      }, ROOT_LEVER_CONFIG.holdMs);
    });

    widget.addEventListener("pointermove", onPointerMove);
    widget.addEventListener("pointerup", finishLever);
    widget.addEventListener("pointercancel", finishLever);

    widget.addEventListener("click", (event) => {
      if (widget.classList.contains("node-widget--shifted") || leverActive) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  });
}

function bindEmblemSwap(container) {
  container.querySelectorAll(".widget-frame img[data-hover-src]").forEach((img) => {
    const host = img.closest(".domain-widget, .node-widget");
    if (!host || host.dataset.swapBound) return;
    host.dataset.swapBound = "true";
    const defaultSrc = img.dataset.defaultSrc;
    const hoverSrc = img.dataset.hoverSrc;

    const onEnter = () => {
      if (hoverSrc) {
        img.src = hoverSrc;
        host.classList.add("emblem-swap-active");
      }
    };
    const onLeave = () => {
      if (defaultSrc) {
        img.src = defaultSrc;
        host.classList.remove("emblem-swap-active");
      }
    };

    host.addEventListener("mouseenter", onEnter);
    host.addEventListener("mouseleave", onLeave);
  });
}

function setScopeWidgetHighlight(container, isActive) {
  container.querySelectorAll(".highlight-widget").forEach((el) => {
    el.classList.toggle("widget-scope-highlighted", isActive);
  });
}

function activateScopeHighlight(nodeIds) {
  scopeHighlightActive = true;
  scopeHighlightNodeIds = new Set(nodeIds);
  highlightNodes.clear();
  highlightLinks.clear();

  const graphData = graph.graphData();
  graphData.nodes.forEach((node) => {
    if (scopeHighlightNodeIds.has(node.id)) highlightNodes.add(node);
  });
  graphData.links.forEach((link) => {
    const sourceId = getId(link.source);
    const targetId = getId(link.target);
    if (scopeHighlightNodeIds.has(sourceId) || scopeHighlightNodeIds.has(targetId)) {
      highlightLinks.add(link);
      const sourceNode = nodesById.get(sourceId);
      const targetNode = nodesById.get(targetId);
      if (sourceNode) highlightNodes.add(sourceNode);
      if (targetNode) highlightNodes.add(targetNode);
    }
  });

  updateScopeNodeMaterials();
  graph.refresh();
}

function clearScopeHighlight() {
  scopeHighlightActive = false;
  scopeHighlightNodeIds = new Set();
  refreshHighlights(hoverNode);
  updateScopeNodeMaterials();
  graph.refresh();
}

function updateScopeNodeMaterials() {
  nodeMeshes.forEach((mesh, nodeId) => {
    const node = nodesById.get(nodeId);
    if (node) {
      mesh.material = getRimMaterial(getNodeColor(node));
    }
  });
}

function getRelatedNodeIdsByType(nodeId, type) {
  if (!nodeId || !neighborsById.has(nodeId)) return [];
  const related = [];
  neighborsById.get(nodeId).forEach((neighborId) => {
    const node = nodesById.get(neighborId);
    if (node?.type === type) {
      related.push(neighborId);
    }
  });
  return related;
}

function buildDomainTag(nodeId) {
  if (!nodeId || !nodeId.startsWith("domain-")) return null;
  const value = nodeId.replace("domain-", "");
  return value ? `domain:${value}` : null;
}

function updateStoryWithPracticeHint(panel, storyData, hint) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  const storyText = storyData?.text || "";
  const hintLine = `Practice: ${hint.label} (${hint.id})`;
  let html = `<div class="practice-hint">${escapeHtml(hintLine)}</div>`;
  html += `<div class="text">${renderTextWithTags(storyText)}</div>`;

  if (storyData?.refs?.length) {
    html += `<div class="refs-section">
      <div class="refs-title">References</div>
      ${storyData.refs.map((ref) => `
        <span class="ref-item" data-ref-id="${ref.id}" data-ref-type="${ref.type}">
          ${getRefIcon(ref.type)} ${escapeHtml(ref.label || ref.id)}
        </span>
      `).join("")}
    </div>`;
  }

  content.innerHTML = html;
  bindTagPills(content);
}

function updateStoryWithSystemText(panel, storyData, systemData) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  const storyText = storyData?.text || "";
  const systemText = systemData?.text || "";
  let html = `<div class="text">${renderTextWithTags(storyText)}</div>`;

  if (systemText) {
    html += `<div class="text system-note">${renderTextWithTags(systemText)}</div>`;
  }

  if (storyData?.refs?.length) {
    html += `<div class="refs-section">
      <div class="refs-title">References</div>
      ${storyData.refs.map((ref) => `
        <span class="ref-item" data-ref-id="${ref.id}" data-ref-type="${ref.type}">
          ${getRefIcon(ref.type)} ${escapeHtml(ref.label || ref.id)}
        </span>
      `).join("")}
    </div>`;
  }

  content.innerHTML = html;
  bindTagPills(content);
}

function updateSystemWithQueryTags(panel, tagSource) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  const pills = renderTagPillsOnly(tagSource);
  const activeTag = activeQueryTag || extractTags(tagSource)[0] || "";
  const { localResults } = activeTag ? resolveQuery(activeTag) : { localResults: [] };
  const total = localResults.length;
  const status = aiCatalog.length === 0
    ? "Catalog empty or missing."
    : `Matches: ${total}`;
  content.innerHTML = `
    <div class="query-tags-block">
      ${pills || ""}
    </div>
    <div class="query-status">${escapeHtml(status)}</div>
  `;
  bindTagPills(content);
}

function bindTagPills(container) {
  container.querySelectorAll(".pointer-tag").forEach((el) => {
    const tag = el.dataset.tag;
    if (!tag) return;
    if (activeQueryTag === tag) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
    el.addEventListener("click", (e) => {
      e.preventDefault();
      setQueryTag(tag, "text");
    });
  });
}

function setQueryTag(tag, source = "text") {
  activeQueryTag = tag;
  queryModeActive = true;
  selectedServiceItem = null;
  const ownerTag = getOwnerContextTag();
  const projection = tag ? [{ type: "projection", value: tag, source }] : [];
  activeContext = ownerTag
    ? [{ type: "owner", value: ownerTag, source: "node", locked: true }, ...projection]
    : projection;
  updateServicePanel(document.getElementById("service-panel"), currentStep?.service);
  updateActiveTagPills();
  updateContextStrip();
}

function clearQueryTag() {
  activeQueryTag = null;
  queryModeActive = false;
  selectedServiceItem = null;
  activeContext = [];
  updateServicePanel(document.getElementById("service-panel"), currentStep?.service);
  updateActiveTagPills();
  updateContextStrip();
}

function buildEntityContextValue(item) {
  if (!item) return null;
  const candidate = item.id || item.external_id || "";
  if (!candidate || candidate.startsWith("http")) return null;
  if (!candidate.includes(":")) return null;
  return candidate;
}

function updateActiveTagPills() {
  document.querySelectorAll(".pointer-tag").forEach((el) => {
    const tag = el.dataset.tag;
    if (!tag) return;
    el.classList.toggle("active", tag === activeQueryTag);
  });
}

function setSelectedServiceItem(item) {
  selectedServiceItem = item;
  const ownerTag = getOwnerContextTag();
  const baseContext = ownerTag ? [{ type: "owner", value: ownerTag, source: "node", locked: true }] : [];
  const projection = activeQueryTag ? [{ type: "projection", value: activeQueryTag }] : [];
  const entityValue = buildEntityContextValue(item);
  activeContext = entityValue
    ? [...baseContext, ...projection, { type: "entity", value: entityValue, source: "card" }]
    : [...baseContext, ...projection];
  updateServicePanel(document.getElementById("service-panel"), currentStep?.service);
  updateContextStrip();
}

function resolveQuery(tag) {
  const ownerTag = activeContext.find((entry) => entry.type === "owner")?.value || null;
  const localResults = aiCatalog.filter((item) => {
    if (!Array.isArray(item.pointer_tags)) return false;
    if (!item.pointer_tags.includes(tag)) return false;
    if (ownerTag && !item.pointer_tags.includes(ownerTag)) return false;
    return true;
  });
  const externalLinks = buildExternalLinks(tag);
  return { localResults, externalLinks };
}

function getOwnerContextTag() {
  if (currentStep?.type === "character") {
    return `owner:${currentStep.id}`;
  }
  return null;
}

function updateContextStrip() {
  // Context strip UI removed, but internal context logic preserved
}

function sortContextEntries(entries) {
  const order = { owner: 0, projection: 1, entity: 2 };
  return [...entries].sort((a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99));
}

function getResponseType() {
  if (queryModeActive && activeQueryTag) return "Results";
  if (currentStep?.service?.actions?.length) return "Actions";
  if (currentStep?.type === "practice") return "Steps";
  return "Info";
}

function buildExternalLinks(tag) {
  const record = pointerTagsByTag.get(tag);
  const fallback = tagToFallbackQuery(tag);
  const hfQuery = record?.external_queries?.huggingface || fallback;
  const pwcQuery = record?.external_queries?.paperswithcode || fallback;
  return {
    huggingface: hfQuery ? `https://huggingface.co/models?search=${encodeURIComponent(hfQuery)}` : null,
    paperswithcode: pwcQuery ? `https://paperswithcode.com/search?q=${encodeURIComponent(pwcQuery)}` : null
  };
}

function renderQueryMode(tag) {
  const { localResults, externalLinks } = resolveQuery(tag);
  const grouped = {
    service: [],
    model: [],
    method: [],
    other: []
  };

  localResults.forEach((item) => {
    if (grouped[item.kind]) grouped[item.kind].push(item);
    else grouped.other.push(item);
  });

  const renderItems = (items) => items.map((item) => {
    const participation = practiceParticipation.filter((p) => p.item_external_id === item.external_id);
    const participationLabel = participation.map((p) => p.practice_id).join(", ");
    const link = item.external_id?.startsWith("http") ? `<a class="query-link" href="${item.external_id}" target="_blank">Open</a>` : "";
    const itemId = item.id || item.external_id || "";
    return `
      <div class="query-item" data-item-id="${escapeHtml(itemId)}" data-item-kind="${escapeHtml(item.kind || "")}">
        <div class="query-item-title">${escapeHtml(item.title || item.display_name || item.external_id || "Item")}</div>
        <div class="query-item-meta">
          <span>${escapeHtml(item.kind || "item")}</span>
          <span>${escapeHtml(item.source || "unknown")}</span>
          ${participationLabel ? `<span class="query-badge">participates: ${escapeHtml(participationLabel)}</span>` : ""}
          ${link}
        </div>
      </div>
    `;
  }).join("");

  const section = (title, items) => items.length ? `
    <div class="query-section">
      <div class="query-section-title">${title}</div>
      ${renderItems(items)}
    </div>
  ` : "";

  const total = localResults.length;
  const status = aiCatalog.length === 0
    ? "Catalog empty or missing."
    : total === 0
      ? "No matches for this tag."
      : `Matches: ${total}`;
  const hint = total > 0 ? "Scroll to see results." : "";
  const externalButtons = [
    externalLinks.huggingface ? `<a class="query-external" href="${externalLinks.huggingface}" target="_blank">Open in Hugging Face</a>` : "",
    externalLinks.paperswithcode ? `<a class="query-external" href="${externalLinks.paperswithcode}" target="_blank">Open in Papers with Code</a>` : ""
  ].join("");
  const emptyState = localResults.length === 0
    ? `<div class="query-empty">No results for this tag.</div>`
    : "";

  const opportunities = selectedServiceItem
    ? `
      <div class="opportunities">
        <div class="opportunities-title">You can do now</div>
        <div class="opportunity-item">Сделать обзор сервиса (${escapeHtml(selectedServiceItem.name)}) — Нэй — soon</div>
        <div class="opportunity-item">Собрать туториал пайплайна — Руна — soon</div>
      </div>
    `
    : "";

  return `
    <div class="query-mode">
      <div class="query-header">
        <span class="query-label">Query Mode</span>
        <span class="pointer-tag active" data-tag="${tag}">${escapeHtml(tag)}</span>
        <button class="query-reset" data-action="clear-query">×</button>
      </div>
      <div class="query-status">${escapeHtml(status)}</div>
      ${hint ? `<div class="query-hint">${escapeHtml(hint)}</div>` : ""}
      ${section("Services", grouped.service)}
      ${section("Models", grouped.model)}
      ${section("Methods", grouped.method)}
      ${section("Other", grouped.other)}
      ${externalButtons ? `<div class="query-links">${externalButtons}</div>` : ""}
      ${opportunities}
      ${emptyState}
    </div>
  `;
}

function bindQueryControls(container) {
  container.querySelectorAll("[data-action='clear-query']").forEach((el) => {
    el.addEventListener("click", () => {
      clearQueryTag();
    });
  });
  container.querySelectorAll(".query-item").forEach((el) => {
    const kind = el.dataset.itemKind;
    if (kind !== "service") return;
    el.addEventListener("click", (e) => {
      if (e.target?.closest("a")) return;
      const itemId = el.dataset.itemId;
      const name = el.querySelector(".query-item-title")?.textContent || itemId;
      setSelectedServiceItem({ id: itemId, name });
    });
  });
  bindTagPills(container);
}

function updatePanel(panel, data) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  let html = `<div class="text">${renderTextWithTags(data?.text || "")}</div>`;

  if (data?.refs?.length) {
    html += `<div class="refs-section">
      <div class="refs-title">References</div>
      ${data.refs.map((ref) => `
        <span class="ref-item" data-ref-id="${ref.id}" data-ref-type="${ref.type}">
          ${getRefIcon(ref.type)} ${escapeHtml(ref.label || ref.id)}
        </span>
      `).join("")}
    </div>`;
  }

  content.innerHTML = html;
  bindTagPills(content);
}

function updateServicePanel(panel, data) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  if (activeQueryTag && queryModeActive) {
    content.innerHTML = renderQueryMode(activeQueryTag);
    bindQueryControls(content);
    return;
  }

  let html = `<div class="text">${renderTextWithTags(data?.text || "")}</div>`;

  const actions = Array.isArray(data?.actions) ? data.actions : [];
  const workbenches = actions.filter((action) => action.type === "workbench");
  const otherActions = actions.filter((action) => action.type !== "workbench");

  if (workbenches.length) {
    html += `<div class="workbench-section">
      <div class="workbench-title">Workbenches</div>
      ${workbenches.map((action) => `
        <button class="action-button" data-action-type="${action.type}" data-action-id="${action.id || ""}">
          ${getActionIcon(action.type)} ${escapeHtml(action.label)}
        </button>
      `).join("")}
    </div>`;
  }

  if (otherActions.length) {
    html += `<div class="actions-section">
      ${otherActions.map((action) => `
        <button class="action-button" data-action-type="${action.type}" data-action-id="${action.id || ""}">
          ${getActionIcon(action.type)} ${escapeHtml(action.label)}
        </button>
      `).join("")}
    </div>`;
  }

  content.innerHTML = html;
  bindTagPills(content);

  content.querySelectorAll(".action-button").forEach((el) => {
    el.addEventListener("click", () => {
      registerInteraction();
      motionSound.resumeIfNeeded();
      handleAction(el.dataset.actionType);
    });
  });
}

function handleAction(type) {
  switch (type) {
    case "navigate":
      goToNextStep();
      break;
    case "restart":
      goToStepById(currentRoute.start_node_id);
      break;
  }
}

function updateNavigation() {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const stepIndicator = document.getElementById("step-indicator");

  if (prevBtn) prevBtn.disabled = !hasPrevStep();
  if (nextBtn) nextBtn.disabled = !hasNextStep();
  if (stepIndicator && currentRoute) {
    stepIndicator.textContent = `${currentStep?.label || ""} (${currentStepIndex + 1}/${currentRoute.nodes.length})`;
  }
}

// === Утилиты UI ===
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function getRefIcon(type) {
  return "";
}

function getActionIcon(type) {
  return "";
}

// Panel focus (visual emphasis)
function setPanelFocus(panelId) {
  document.body.classList.remove("focus-story", "focus-system", "focus-service");
  if (panelId === "story-panel") document.body.classList.add("focus-story");
  if (panelId === "system-panel") document.body.classList.add("focus-system");
  if (panelId === "service-panel") document.body.classList.add("focus-service");
}

// === Создание UI ===
function createUI() {
  // Auto-hide Header
  const headerTrigger = document.createElement("div");
  headerTrigger.id = "header-trigger";
  document.body.appendChild(headerTrigger);

  const headerBar = document.createElement("div");
  headerBar.id = "header-bar";
  headerBar.innerHTML = `
    <div class="header-left">
      <div class="header-logo-circle" style="background-image: url('${PATHS.LOGOS}/brands/logo-ii.png')"></div>
      <span class="header-logo">Вова и Петрова</span>
    </div>
    <div class="header-center">
      <div class="social-links">
        <span class="social-link" title="Telegram">TG</span>
        <span class="social-link" title="GitHub">GH</span>
        <span class="social-link" title="YouTube">YT</span>
      </div>
    </div>
    <div class="header-right">
      <button class="header-btn" title="Coming soon">Donate</button>
      <button class="header-btn" title="Coming soon">Sign in</button>
      <button class="header-btn" title="Coming soon">RU</button>
    </div>
  `;
  document.body.appendChild(headerBar);

  const graphDiv = document.createElement("div");
  graphDiv.id = "graph";
  document.body.appendChild(graphDiv);

  const panelsContainer = document.createElement("div");
  panelsContainer.id = "panels-container";
  panelsContainer.innerHTML = `
    <div id="story-panel" class="panel-3s">
      <div class="panel-header">Story</div>
      <div class="panel-content"></div>
    </div>
    <div class="graph-spacer"></div>
    <div id="right-column">
      <div id="system-panel" class="panel-3s">
        <div class="panel-header">System</div>
        <div class="panel-content"></div>
      </div>
      <div id="service-panel" class="panel-3s">
        <div class="panel-header">Service</div>
        <div class="panel-content"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panelsContainer);

  // Panel focus behavior (hover to focus, default Story)
  const storyPanel = document.getElementById("story-panel");
  const systemPanel = document.getElementById("system-panel");
  const servicePanel = document.getElementById("service-panel");

  // Default focus: Story
  setPanelFocus("story-panel");

  // Hover focus
  systemPanel?.addEventListener("mouseenter", () => setPanelFocus("system-panel"));
  servicePanel?.addEventListener("mouseenter", () => setPanelFocus("service-panel"));
  storyPanel?.addEventListener("mouseenter", () => setPanelFocus("story-panel"));

  // Return to Story on leaving right column
  systemPanel?.addEventListener("mouseleave", () => setPanelFocus("story-panel"));
  servicePanel?.addEventListener("mouseleave", () => setPanelFocus("story-panel"));

  const navBar = document.createElement("div");
  navBar.id = "nav-bar";
  navBar.innerHTML = `
    <button id="prev-btn" class="nav-button">← Prev</button>
    <span id="step-indicator">Loading...</span>
    <button id="next-btn" class="nav-button">Next →</button>
    <div id="view-switcher" class="view-switcher">
      <button class="nav-button view-button" data-view="knowledge">Knowledge</button>
      <button class="nav-button view-button" data-view="system">System</button>
      <button class="nav-button view-button" data-view="all">All</button>
    </div>
    <button id="reload-btn" class="nav-button reload-button" title="Reload route from contracts">🔄</button>
    <span id="graph-stats" class="graph-stats"></span>
  `;
  document.body.appendChild(navBar);

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    registerInteraction();
    motionSound.resumeIfNeeded();
    goToPrevStep();
  });
  document.getElementById("next-btn")?.addEventListener("click", () => {
    registerInteraction();
    motionSound.resumeIfNeeded();
    goToNextStep();
  });
  document.getElementById("reload-btn")?.addEventListener("click", () => {
    registerInteraction();
    reloadRoute();
  });

  document.querySelectorAll(".view-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentSource !== "canon") return;
      const view = btn.dataset.view || "all";
      setView(view);
    });
  });
}

// === Анимация ===
function tickAnimation() {
  visualTime = performance.now();
  updateNodeBreathing(visualTime);
  updateAutoRotate(visualTime);
  controls.update();
  requestAnimationFrame(tickAnimation);
}

graph.onEngineTick(() => {
  motionSound.tick(graph.graphData().nodes);
});

// === События ===
window.addEventListener("resize", () => {
  graph.width(window.innerWidth).height(window.innerHeight);
});

document.addEventListener("keydown", (e) => {
  registerInteraction();
  if (e.key === "ArrowLeft") goToPrevStep();
  if (e.key === "ArrowRight") goToNextStep();
});

["wheel", "pointerdown", "touchstart"].forEach((event) => {
  window.addEventListener(event, () => {
    registerInteraction();
    motionSound.resumeIfNeeded();
  }, { passive: true });
});

// === Инициализация ===
graph.width(window.innerWidth).height(window.innerHeight);
tickAnimation();

const urlParams = new URLSearchParams(window.location.search);
const routePath = urlParams.get("route");
const sourceParam = urlParams.get("source");
const graphUrlParam = urlParams.get("graphUrl");
const viewParam = urlParams.get("view");

currentSource = sourceParam || "canon";
currentGraphUrl = graphUrlParam || CONFIG.defaultGraphUrl;
currentView = viewParam || "all";

// Загрузить виджеты при старте
loadDomainWidgets();
loadExports();

// По умолчанию загружать Universe Graph
if (currentSource === "demo" && routePath) {
  loadRoute(routePath);
} else if (currentSource === "demo") {
  loadRoute(CONFIG.defaultRoute);
} else {
  loadUniverseGraph();
}

setView(currentView);

function setView(view) {
  currentView = view || "all";
  updateViewButtons();
  if (currentSource !== "canon") return;
  if (currentUniverse) {
    setRoute(buildRouteFromUniverse(currentUniverse, currentView));
  }
  const params = new URLSearchParams(window.location.search);
  params.set("view", currentView);
  history.replaceState(null, "", `${window.location.pathname}?${params}`);
}

function updateViewButtons() {
  document.querySelectorAll(".view-button").forEach((btn) => {
    if (btn.dataset.view === currentView) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}
