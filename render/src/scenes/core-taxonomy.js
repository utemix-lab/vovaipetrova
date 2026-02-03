/**
 * Core Taxonomy Graph Scene
 *
 * Отдельный режим визуализации таксономии vovaipetrova-core.
 * Использует инфраструктуру dream-graph, но со своей доменной моделью.
 */

import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import { loadCoreTaxonomyFromUrls, buildCoreTaxonomyGraph } from "../core-taxonomy/adapter.js";
import { NODE_TYPES, NODE_TYPE_LABELS, CORE_TAXONOMY_COLORS } from "../core-taxonomy/schema.js";
import { CORE_TAXONOMY_VISUAL_CONFIG, getNodeSizeByType } from "../core-taxonomy/config.js";
import "./core-taxonomy.css";

// UI setup
ensureCoreTaxonomyUi();
document.documentElement.style.setProperty("--panel-bg", "rgba(15, 23, 42, 0.85)");

const BASE_NODE_RADIUS = CORE_TAXONOMY_VISUAL_CONFIG.node.minRadius;
const palette = CORE_TAXONOMY_VISUAL_CONFIG.colors;

const graphEl = document.getElementById("graph");
const dataStatusEl = document.getElementById("dataStatus");
const errorEl = document.getElementById("error");
const searchInput = document.getElementById("searchInput");
const typeFiltersEl = document.getElementById("typeFilters");
const resetCameraBtn = document.getElementById("resetCamera");

const urlParams = new URLSearchParams(window.location.search);

// Data URLs — can be overridden via query params
const DATA_URLS = {
  routes: urlParams.get("routesUrl") || "https://raw.githubusercontent.com/utemix-lab/vovaipetrova-core/main/static/routes.json",
  glossary: urlParams.get("glossaryUrl") || "https://raw.githubusercontent.com/utemix-lab/vovaipetrova-core/main/kb_glossary_lite.jsonl",
  digests: urlParams.get("digestsUrl") || "https://raw.githubusercontent.com/utemix-lab/vovaipetrova-core/main/prototype/data/stories_digests.jsonl"
};

const filterState = {
  text: "",
  types: new Set()
};

let currentData = { nodes: [], links: [] };
let visibleNodeIds = new Set();
let visibleNodes = new Set();
let visibleLinks = new Set();
let nodesById = new Map();
let hoverNode = null;

const highlightNodes = new Set();
const highlightLinks = new Set();
const nodeGeometry = new THREE.SphereGeometry(1, 32, 32);
const nodeMaterialCache = new Map();
const nodeMeshes = new Map();

const graph = ForceGraph3D()(graphEl)
  .backgroundColor(palette.background)
  .showNavInfo(false)
  .nodeRelSize(BASE_NODE_RADIUS)
  .linkOpacity(0.4)
  .linkWidth(0.5)
  .linkDirectionalParticles(0);

graph.d3Force("link").distance(() => CORE_TAXONOMY_VISUAL_CONFIG.link.baseLength);
graph.d3VelocityDecay(0.25);
graph.d3AlphaDecay(0.025);

graph.scene().add(new THREE.AmbientLight(0xffffff, 0.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
keyLight.position.set(30, 50, 100);
graph.scene().add(keyLight);

const camera = graph.camera();
camera.fov = CORE_TAXONOMY_VISUAL_CONFIG.camera.fov;
camera.updateProjectionMatrix();

graph.nodeLabel((node) => {
  const typeLabel = NODE_TYPE_LABELS[node.type] || node.type;
  return `${node.label} [${typeLabel}]`;
});

graph.nodeColor((node) => getNodeColor(node));

graph.nodeThreeObject((node) => createNodeMesh(node));
graph.nodeThreeObjectExtend(false);

graph.nodeVal((node) => {
  const radius = getNodeSizeByType(node);
  return radius / BASE_NODE_RADIUS;
});

graph.linkColor((link) => {
  if (highlightLinks.has(link)) return palette.highlight;
  return palette.linkDefault;
});

graph.linkWidth((link) => (highlightLinks.has(link) ? 1.4 : 0.5));

const controls = graph.controls();
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.7;

function getNodeColor(node) {
  return palette.type[node.type] || palette.nodeDefault;
}

function createNodeMesh(node) {
  const color = getNodeColor(node);
  const material = getMaterial(color);
  const mesh = new THREE.Mesh(nodeGeometry, material);
  const radius = getNodeSizeByType(node);
  mesh.scale.setScalar(radius);
  nodeMeshes.set(node.id, mesh);
  return mesh;
}

function getMaterial(colorHex) {
  const key = String(colorHex).toLowerCase();
  if (nodeMaterialCache.has(key)) {
    return nodeMaterialCache.get(key);
  }

  const baseColor = new THREE.Color(colorHex);
  const material = new THREE.MeshStandardMaterial({
    color: baseColor.clone().multiplyScalar(0.7),
    emissive: baseColor.clone(),
    emissiveIntensity: 0.25,
    roughness: 0.4,
    metalness: 0.0
  });

  nodeMaterialCache.set(key, material);
  return material;
}

function getId(value) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function buildIndex(data) {
  nodesById = new Map(data.nodes.map((node) => [node.id, node]));
}

function updateStatus(nodeCount, linkCount) {
  dataStatusEl.textContent = `Core Taxonomy — ${nodeCount} nodes / ${linkCount} links`;
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
    text.textContent = NODE_TYPE_LABELS[value] || value;
    text.style.color = palette.type[value] || palette.nodeDefault;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);

    selectedSet.add(value);
  });
}

function applyFilters() {
  const textQuery = filterState.text;
  const typeFilter = filterState.types;

  visibleNodes = new Set();
  visibleNodeIds = new Set();

  currentData.nodes.forEach((node) => {
    const label = (node.label || "").toLowerCase();
    const id = String(node.id || "").toLowerCase();
    const textMatch = !textQuery || label.includes(textQuery) || id.includes(textQuery);
    const typeMatch = typeFilter.size === 0 || typeFilter.has(node.type);

    if (textMatch && typeMatch) {
      visibleNodes.add(node);
      visibleNodeIds.add(node.id);
    }
  });

  visibleLinks = new Set();

  currentData.links.forEach((link) => {
    const sourceId = getId(link.source);
    const targetId = getId(link.target);

    if (visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)) {
      visibleLinks.add(link);
    }
  });

  graph.nodeVisibility((node) => visibleNodes.has(node));
  graph.linkVisibility((link) => visibleLinks.has(link));
  graph.refresh();
}

function setGraphData(data) {
  clearError();
  nodeMeshes.clear();

  currentData = data;
  graph.graphData(currentData);
  buildIndex(currentData);

  const types = Array.from(new Set(currentData.nodes.map((n) => n.type).filter(Boolean)));
  createFilterOptions(typeFiltersEl, types, filterState.types);

  updateStatus(currentData.nodes.length, currentData.links.length);
  applyFilters();

  setTimeout(() => {
    graph.zoomToFit(800, 80);
  }, 300);
}

async function loadData() {
  dataStatusEl.textContent = "Loading Core Taxonomy...";

  try {
    const data = await loadCoreTaxonomyFromUrls(DATA_URLS);
    setGraphData(data);
  } catch (error) {
    showError(`Failed to load data: ${error.message}`);
  }
}

graph.onNodeHover((node) => {
  if (node === hoverNode) return;
  hoverNode = node || null;

  highlightNodes.clear();
  highlightLinks.clear();

  if (hoverNode && visibleNodeIds.has(hoverNode.id)) {
    highlightNodes.add(hoverNode);
    currentData.links.forEach((link) => {
      const sourceId = getId(link.source);
      const targetId = getId(link.target);
      if (sourceId === hoverNode.id || targetId === hoverNode.id) {
        if (visibleLinks.has(link)) highlightLinks.add(link);
      }
    });
  }

  graph.refresh();
});

resetCameraBtn.addEventListener("click", () => {
  graph.zoomToFit(800, 80);
});

searchInput.addEventListener("input", (event) => {
  filterState.text = event.target.value.trim().toLowerCase();
  applyFilters();
});

window.addEventListener("resize", () => {
  graph.width(window.innerWidth).height(window.innerHeight);
});

graph.width(window.innerWidth).height(window.innerHeight);

loadData();

function ensureCoreTaxonomyUi() {
  if (document.getElementById("ui")) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div id="ui" class="panel core-taxonomy-panel">
      <div class="brand">Core Taxonomy Graph</div>
      <div class="subtitle">vovaipetrova-core</div>
      <div class="section">
        <div id="dataStatus" class="status">Loading...</div>
        <button id="resetCamera" class="btn">Reset Camera</button>
      </div>
      <div class="section">
        <div class="section-title">Search</div>
        <input id="searchInput" class="input" type="search" placeholder="label or id" />
      </div>
      <div class="section">
        <div class="section-title">Node Types</div>
        <div id="typeFilters" class="chip-list"></div>
      </div>
      <div id="error" class="error hidden"></div>
    </div>
  `;
  while (wrapper.firstElementChild) {
    document.body.appendChild(wrapper.firstElementChild);
  }
}
