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
const AUTHOR_PLUG_ICON = `${PATHS.AVATARS}/author-plug.png`;

// === Глобальные переменные ===
let Graph = null;
let currentData = null;
let currentRoute = null;
let isPaused = false;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let rotationSpeed = 0.001;
let autoRotate = true;

// === Инициализация ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeGraph();
    await loadGraphData("system"); // Загружаем системный вид
    setupEventListeners();
    startAnimation();
  } catch (error) {
    console.error("Failed to initialize system graph:", error);
  }
});

// === Загрузка данных графа ===
async function loadGraphData(view = "system") {
  try {
    const response = await fetch(CONFIG.defaultGraphUrl);
    const universe = await response.json();
    
    // Фильтруем только системные узлы
    const systemNodes = universe.nodes.filter(node => 
      node.system && node.system.visibility !== "hidden"
    );
    
    const systemLinks = universe.edges.filter(edge => {
      const sourceNode = universe.nodes.find(n => n.id === edge.source);
      const targetNode = universe.nodes.find(n => n.id === edge.target);
      return sourceNode?.system && targetNode?.system && 
             sourceNode.system.visibility !== "hidden" && 
             targetNode.system.visibility !== "hidden";
    });

    currentData = {
      nodes: systemNodes.map(node => ({
        ...node,
        color: getNodeColor(node),
        size: getNodeSize(node)
      })),
      links: systemLinks.map(edge => ({
        ...edge,
        color: "#666"
      }))
    };

    if (Graph) {
      Graph.graphData(currentData);
    }
  } catch (error) {
    console.error("Failed to load graph data:", error);
  }
}

// === Инициализация 3D графа ===
function initializeGraph() {
  const container = document.getElementById("app");
  
  Graph = ForceGraph3D()(container)
    .graphData({ nodes: [], links: [] })
    .nodeLabel("label")
    .nodeAutoColorBy("type")
    .nodeThreeObject(node => {
      const geometry = new THREE.SphereGeometry(node.size || 1);
      const material = new THREE.MeshPhongMaterial({
        color: node.color || "#fff",
        emissive: node.color || "#fff",
        emissiveIntensity: 0.2
      });
      return new THREE.Mesh(geometry, material);
    })
    .linkWidth(1)
    .linkColor(() => "#666")
    .backgroundColor("#0a0a0c")
    .showNavInfo(false)
    .cameraPosition({ z: 500 });

  Graph.controls().autoRotate = autoRotate;
  Graph.controls().autoRotateSpeed = rotationSpeed;
}

// === Вспомогательные функции ===
function getNodeColor(node) {
  const colors = {
    root: "#ff6b6b",
    hub: "#4ecdc4", 
    domain: "#45b7d1",
    concept: "#96ceb4",
    module: "#feca57",
    spec: "#ff9ff3",
    process: "#54a0ff",
    policy: "#5f27cd",
    artifact: "#00d2d3",
    practice: "#ff6348",
    workbench: "#30336b"
  };
  return colors[node.type] || "#fff";
}

function getNodeSize(node) {
  const sizes = {
    root: 3,
    hub: 2.5,
    domain: 2,
    concept: 1.5,
    module: 1.2,
    spec: 1,
    process: 1.2,
    policy: 1,
    artifact: 0.8,
    practice: 1,
    workbench: 1
  };
  return sizes[node.type] || 1;
}

// === Обработчики событий ===
function setupEventListeners() {
  document.addEventListener("keydown", (e) => {
    switch(e.key) {
      case " ":
        e.preventDefault();
        togglePause();
        break;
      case "r":
        resetCamera();
        break;
    }
  });
}

// === Управление анимацией ===
function startAnimation() {
  function animate() {
    if (!isPaused && autoRotate && Graph) {
      Graph.controls().update();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

function togglePause() {
  isPaused = !isPaused;
  if (Graph) {
    Graph.controls().autoRotate = !isPaused && autoRotate;
  }
}

function resetCamera() {
  if (Graph) {
    Graph.cameraPosition({ z: 500 });
  }
}
