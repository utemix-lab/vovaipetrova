/**
 * Visitor Scene — Финальный рендер с панелями 3S
 * Основан на mono-graph.js с полным визуалом
 * Звук: один непрерывный, синхронизированный с физикой
 */

/**
 * 🔄 АРХИТЕКТУРНЫЙ ПРОТОТИП:
 * Этот 3D-граф — не просто визуализация.
 * Это живой прототип для будущего онтологического графа.
 *
 * КЛЮЧЕВЫЕ ПАРАЛЛЕЛИ:
 * - Узлы графа → сущности в онтологии
 * - Связи → семантические отношения
 * - Физическая симуляция → "динамика замысла"
 * - Выделение узла → фокус внимания агента
 *
 * TODO: заменить Three.js на абстрактный GraphEngine,
 * чтобы тот же код мог визуализировать и AST, и OWL-графы.
 */

/**
 * 🏗️ АРХИТЕКТУРНЫЕ ЗАВИСИМОСТИ:
 *
 * visitor.js
 * ├── Создаёт 3D-граф (Three.js)
 * ├── Отправляет события в UI-слой
 * └── Получает обновления из universe.json
 *     └── БУДУЩЕЕ: Подключится к AST-парсеру и онтологическому графу
 *
 * UI-компоненты (будущие React)
 * ├── Реагируют на граф-события
 * ├── Управляют состоянием «шага»
 * └── БУДУЩЕЕ: Станут интерфейсом для LLM-агента
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🗺️ КАРТА СИСТЕМЫ: ПОДСВЕТКА И КОМПОЗИЦИЯ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * УЗЛЫ ОНТОЛОГИИ (см. VISUAL_CONFIG.nodeTypes):
 * ┌─────────────────┬─────────────┬──────────┬────────────────────────────────┐
 * │ Тип             │ Виджет      │ Шаблон   │ Описание                       │
 * ├─────────────────┼─────────────┼──────────┼────────────────────────────────┤
 * │ root            │ ✗           │ root     │ Universe, Cryptocosm           │
 * │ hub             │ ✗           │ hub      │ Хабы (Персонажи, Домены)       │
 * │ character       │ ✓           │ character│ Персонаж (Vova, Vasya)         │
 * │ domain          │ ✓           │ domain   │ Домен (тематическая область)   │
 * │ workbench       │ ✓           │ workbench│ Воркбенч (рабочее пространство)│
 * │ collab          │ ✓           │ collab   │ Коллаб (совместный проект)     │
 * ├─────────────────┴─────────────┴──────────┴────────────────────────────────┤
 * │ Один тип узла = один шаблон страницы                                      │
 * │ Размеры и шаблоны: VISUAL_CONFIG.nodeTypes[type]                          │
 * │ Функции шаблонов: updateStoryWith{Root|Hub|Character|Domain|...}          │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * ИНСТРУМЕНТЫ (см. VISUAL_CONFIG.tools):
 * ┌─────────────────┬─────────────────────────────────────────────────────────┐
 * │ Тип             │ Описание                                                │
 * ├─────────────────┼─────────────────────────────────────────────────────────┤
 * │ practice        │ Практики — первый тип инструментов                      │
 * ├─────────────────┴─────────────────────────────────────────────────────────┤
 * │ Инструменты НЕ являются узлами онтологии                                  │
 * │ Будущие категории: режимы, модусы, фильтры...                             │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * ЛОГИКА ПОДСВЕТКИ (см. VISUAL_CONFIG.highlight):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ РЕЖИМЫ ПОДСВЕТКИ РЁБЕР:                                                 │
 * │ • selected — выделенный узел, рёбра в полсилы (width: 1.0)              │
 * │ • hover    — hover на узел/виджет, рёбра полная яркость (width: 1.6)    │
 * │ • scope    — hover на корневой виджет, все связанные рёбра ярко         │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ HighlightManager.node(nodeId, active)                                   │
 * │ ─────────────────────────────────────────────────────────────────────── │
 * │ Подсвечивает ОДИН узел:                                                 │
 * │ • Виджет узла (widget-highlighted)                                      │
 * │ • Узел в графе (highlightNodeById)                                      │
 * │ • Вершину мини-фигуры (highlightMiniShapeNode)                          │
 * │ Используется: hover на виджет, hover на вершину фигуры (не центр)       │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ HighlightManager.scope(hubId, active)                                   │
 * │ ─────────────────────────────────────────────────────────────────────── │
 * │ Подсвечивает SCOPE (хаб + все связанные узлы):                          │
 * │ • Рамка хаба (scope-active, голубая для Vova)                           │
 * │ • Рамки всех связанных виджетов (widget-scope-highlighted, жёлтые)      │
 * │ • Все вершины мини-фигуры                                               │
 * │ • Все узлы scope + их соседи в графе (activateScopeHighlight)           │
 * │ Используется: hover на корневой виджет, hover на центр фигуры           │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ⚠️  КРИТИЧЕСКИЕ ПРАВИЛА (НЕ УДАЛЯТЬ):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 1. graph.refresh() ОБЯЗАТЕЛЕН в onNodeHover для обновления рёбер       │
 * │    Без него linkPositionUpdate не вызывается и рёбра не перерисовываются│
 * │                                                                         │
 * │ 2. Дрожание узлов вызывается пульсацией в updateNodeBreathing          │
 * │    Для статичных узлов (Cryptocosm, Universe) пульсация отключена      │
 * │                                                                         │
 * │ 3. highlightLinks/halfHighlightLinks — Sets с объектами link           │
 * │    При пересоздании графа ссылки становятся недействительными          │
 * │    Используй highlightLinkIds для проверки по ID                       │
 * │                                                                         │
 * │ 4. nodeMeshes кэшируются в createNodeMesh                              │
 * │    Если mesh уже существует, он возвращается из кэша                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * КОМПОЗИЦИЯ ОКНА ПЕРСОНАЖА (Story Panel):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ┌─────────────────────────────────────────────────────────────────────┐ │
 * │ │ [Корневой виджет] — голубой фон (vova-scope-widget)                │ │
 * │ │ Story Screen (мини-окно с кнопками, расширением, пропорциями)      │ │
 * │ └─────────────────────────────────────────────────────────────────────┘ │
 * │ ┌─────────────────────────────────────────────────────────────────────┐ │
 * │ │ ДОМЕНЫ            ВОРКБЕНЧИ         КОЛЛАБЫ                        │ │
 * │ │ [○][○][○]         [○][○]            [○]                            │ │
 * │ │ (widget-groups-row — горизонтальный ряд)                           │ │
 * │ └─────────────────────────────────────────────────────────────────────┘ │
 * │ ┌─────────────────────────────────────────────────────────────────────┐ │
 * │ │                    ◇ МИНИ-ФИГУРА ◇                                 │ │
 * │ │              (character-octa-container)                            │ │
 * │ │   Количество вершин = количество виджетов на странице              │ │
 * │ │   Центр = корневой виджет                                          │ │
 * │ │   Тип фигуры зависит от числа виджетов (octa для 6, cube для 8)    │ │
 * │ └─────────────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * МИНИ-ОКНО (Story Screen):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ • Кнопки управления (закрыть, развернуть)                              │
 * │ • Расширение/сворачивание                                              │
 * │ • Пропорции адаптивные                                                 │
 * │ • Содержит медиа-контент персонажа                                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ЦВЕТА ПОДСВЕТКИ:
 * • Голубой (cyan): 0x22d3ee — корневой виджет (рамка, фон, центр фигуры)
 * • Жёлтый: 0xfbbf24 — связанные виджеты, вершины фигуры
 * • Серый: 0x9ca3af / 0x6b7280 — неактивные вершины
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import "./visitor.css";
import { ARCHITECTURE } from "../architecture/dna.ts";
import { ThreeGraphEngine } from "../graph/three-graph-engine.js";
import { VISUAL_CONFIG } from "../visual/config.js";
import { PATHS, buildAssetPath } from "../compat/paths.js";
import { initRegistry, validateConfigAgainstRules, initToolCatalog, getPracticesByDomain } from "../ontology";
import { computeHighlight, createContextFromState, INTENSITY } from "../ontology/highlightModel.js";
import { NodeOrbits } from "../effects/NodeOrbits.js";
// Track 6: Expressive Stacks - компоненты сохранены как примеры в components/
// import { RadialMorphField } from "../components/RadialMorphField.js";
// import { ConstellationField } from "../components/ConstellationField.js";

// === Константы ===
const CONFIG = {
  contractsPath: PATHS.DATA_ROOT,
  defaultRoute: "demo/visitor.demo.route.json",
  defaultGraphUrl: PATHS.UNIVERSE_JSON
};
void ARCHITECTURE;
const AUTHOR_PLUG_ICON = `${PATHS.WIDGETS}/author-plug.png`;

const BASE_NODE_RADIUS = VISUAL_CONFIG.node.minRadius;
// Хелпер для получения названия секции из конфига
const getSectionLabel = (type) => VISUAL_CONFIG.labels?.sections?.[type] || type;
// Хелпер для генерации HTML описания узла из шаблона
const getNodeInfoHtml = (node) => {
  const templates = VISUAL_CONFIG.labels?.nodeInfo?.[node.type];
  if (!templates) return "";
  // Фильтруем пустые строки
  const lines = templates
    .map(t => t.replace("{label}", node.label || node.id))
    .filter(line => line.trim() !== "");
  return `
    <div class="vova-root-info">
      ${lines.map(line => `<div>${escapeHtml(line)}</div>`).join("")}
    </div>`;
};
// Хелпер для получения тултипа узла из конфига
const getNodeTooltip = (node) => {
  const typeConfig = VISUAL_CONFIG.nodeTypes?.[node.type];
  if (!typeConfig) return node.label || node.id;
  // Для хабов — русские названия по id
  if (typeConfig.tooltipById && typeConfig.tooltipById[node.id]) {
    return typeConfig.tooltipById[node.id];
  }
  // Для остальных — шаблон с подстановкой label
  const template = typeConfig.tooltip || "{label}";
  return template.replace("{label}", node.label || node.id);
};
const SYSTEM_NODE_SCALE = 3;
const SYSTEM_NODE_ID = "system";
// Системный светлый цвет — используем голубой для системного шара
const SYSTEM_COLOR_LIGHT = "#22d3ee"; // system-blue (matches nodeStart)
const SYSTEM_COLOR_DARK = "#050505";
const SYSTEM_SPLIT_NORMAL = new THREE.Vector3(0.65, 0.2, -0.73).normalize();
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
  collab: "collabs",
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

// @future: Практики временно отключены — нужно домыслить их статус и роль в системе
// Узлы типа "practice" и хаб "practices" скрыты из графа, но виджеты остаются в System панели
const DISABLED_NODE_TYPES = new Set(["practice"]);
const DISABLED_HUB_IDS = new Set(["practices"]);

// Cryptocosm — тёмная материя (ч/б палитра)
const CRYPTOCOSM_NODE_IDS = new Set([
  "cryptocosm",
  "crypto-engine", "crypto-cabins", "crypto-mirror",
  "crypto-schema", "crypto-adapter", "crypto-validators", "crypto-graph",
  "crypto-llm", "crypto-protocol", "crypto-projections",
  "cabin-runa", "cabin-author", "cabin-ai", "cabin-petrova", "cabin-hinto", "cabin-dizi"
]);
const CRYPTOCOSM_PALETTE = {
  inactive: "#3a3a3a",   // серый (базовый)
  active: "#7a7a7a",     // светло-серый (hover/scope) — ярче x2
  selected: "#5a5a5a",   // серый (выбранный)
  link: "#252525"        // темнее узлов, чтобы сливаться с фоном
};

// Mirror — Render (индиго палитра)
const MIRROR_NODE_IDS = new Set([
  "mirror-threejs", "mirror-forcegraph", "mirror-highlight",
  "mirror-materials", "mirror-panels", "mirror-breathing"
]);
const MIRROR_PALETTE = {
  inactive: "#2a2a4a",   // тёмно-индиго (базовый)
  active: "#4a4a8a",     // светло-индиго (hover/scope)
  selected: "#3a3a6a",   // индиго (выбранный)
  link: "#1a1a3a"        // темнее узлов
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
let allNodesById = new Map();  // Полный список узлов (включая отключённые) для виджетов
let neighborsById = new Map();
let allNeighborsById = new Map();  // Полный индекс соседей (включая отключённые) для виджетов
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

/**
 * Получить подсказку практики для домена.
 * Использует типизированный каталог инструментов.
 */
function getPracticeHintForDomain(domainId) {
  const practices = getPracticesByDomain(domainId);
  if (practices.length === 0) return null;
  // Возвращаем первую практику как подсказку
  const practice = practices[0];
  return { id: practice.id, label: practice.label };
}
const STORY_SLIDES = [
  {
    id: "vova-01",
    title: "",  // Страница 0 — под фигуры, без заголовка
    detail: "",
    src: buildAssetPath("story/narrative/vova-01.png"),  // PNG с альфа-каналом
    isShapePage: true  // Флаг: страница под фигуры, не разворачивается
  },
  {
    id: "vova-02",
    title: "",
    detail: "Здесь будет текст",
    src: buildAssetPath("story/narrative/vova-02.jpg")
  },
  {
    id: "vova-03",
    title: "",
    detail: "Здесь будет текст",
    src: buildAssetPath("story/narrative/vova-03.jpg")
  },
  {
    id: "vova-04",
    title: "",
    detail: "Здесь будет текст",
    src: buildAssetPath("story/narrative/vova-04.jpg")
  },
  {
    id: "vova-05",
    title: "",
    detail: "Здесь будет текст",
    src: buildAssetPath("story/narrative/vova-05.jpg")
  }
];
let hoverNode = null;
let scopeHighlightActive = false;
let scopeHighlightNodeIds = new Set();
let activeRootLever = null;

// Visitor scene interaction state (new, per design)
let activeLeverWidgetId = null; // string | null — nodeId of active lever
let hoveredWidgetId = null;     // string | null
let hoveredWindow = null;       // 1 | 2 | 3 | null
let sceneStack = [];            // array of scene refs (node ids)
let sceneStackIndex = 0;

// Type Highlight Mode — подсветка всех узлов текущего типа
let typeHighlightActive = false;  // Зафиксирована ли подсветка типа
let typeHighlightHovered = false; // Временная подсветка при hover на точку
let episodeStack = null;       // optional for 16x9 episodes
let preactiveResponse = null;  // computed preview when lever active
const reactLeverProxies = new Map();

// If the scene dots initializer was defined earlier inside createUI, call it now
if (window.__initSceneDotsUI) {
  try {
    window.__initSceneDotsUI();
  } catch (e) {
    console.warn('initSceneDotsUI failed', e);
  }
  delete window.__initSceneDotsUI;
}

function computePreactiveResponse() {
  if (!activeLeverWidgetId) {
    preactiveResponse = null;
    return;
  }
  // Simple heuristic: gather related nodes as preview items
  const related = getRelatedNodeIdsByType(activeLeverWidgetId, 'practice')
    .slice(0, 3)
    .map((id) => ({ id, label: nodesById.get(id)?.label || id }));
  preactiveResponse = {
    type: related.length ? 'Results' : 'Info',
    groups: ['Services', 'Models', 'Methods'],
    previewItems: related
  };
}

function emitPreviewChange() {
  window.dispatchEvent(
    new CustomEvent("graph-preview-changed", {
      detail: {
        activeLeverId: activeLeverWidgetId || null,
        preview: preactiveResponse
      }
    })
  );
}

function updateWindowDimming() {
  const storyEl = document.getElementById('scope-panel');
  const systemEl = document.getElementById('system-panel');
  const serviceEl = document.getElementById('service-panel');
  const hasLever = !!activeLeverWidgetId || !!activeRootLever;
  const dimClass = 'panel-dimmed';
  if (storyEl) storyEl.classList.toggle(dimClass, hasLever && hoveredWindow !== 1);
  if (systemEl) systemEl.classList.toggle(dimClass, hasLever && hoveredWindow !== 2);
  if (serviceEl) serviceEl.classList.toggle(dimClass, hasLever && hoveredWindow !== 3);
}

function pushSceneStack(nodeId) {
  if (!nodeId) return;
  if (sceneStack.length && sceneStack[sceneStack.length - 1] === nodeId) return;
  if (sceneStackIndex < sceneStack.length - 1) {
    sceneStack = sceneStack.slice(0, sceneStackIndex + 1);
  }
  sceneStack.push(nodeId);
  if (sceneStack.length > 5) {
    sceneStack = sceneStack.slice(-5);
  }
  sceneStackIndex = sceneStack.length - 1;
  renderSceneStack();
}

function navigateToSceneNode(nodeId) {
  if (!nodeId) return;
  if (typeof goToStepById === "function") {
    try {
      goToStepById(nodeId);
      return;
    } catch (err) {
      console.warn("goToStepById failed", err);
    }
  }
  if (typeof window.goToStepById === "function") {
    try {
      window.goToStepById(nodeId);
      return;
    } catch (err) {
      console.warn("window.goToStepById failed", err);
    }
  }
  const evt = new CustomEvent("scene-back", { detail: { nodeId } });
  window.dispatchEvent(evt);
}

function stepSceneStack(direction) {
  if (!sceneStack.length) return;
  const nextIndex = Math.max(0, Math.min(sceneStack.length - 1, sceneStackIndex + direction));
  if (nextIndex === sceneStackIndex) return;
  sceneStackIndex = nextIndex;
  renderSceneStack();
  navigateToSceneNode(sceneStack[sceneStackIndex]);
}

function renderSceneStack() {
  const el = document.getElementById('scene-stack');
  if (!el) return;
  const canGoBack = sceneStackIndex > 0;
  window.dispatchEvent(
    new CustomEvent("graph-stack-changed", {
      detail: { stack: [...sceneStack], index: sceneStackIndex }
    })
  );
  const iconPrev = `
    <svg class="icon icon--arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M7.5 3.25 4.5 6l3 2.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconDot = `
    <svg class="icon icon--dot" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="2" fill="currentColor" />
    </svg>
  `;
  const typeLabel = currentStep?.type || "";
  const typeDotActive = typeHighlightActive ? " scene-dot--active" : "";
  
  el.innerHTML = [
    {
      label: iconPrev,
      action: "prev",
      disabled: !canGoBack,
      title: "Назад",
    },
    {
      label: iconDot,
      action: "type-highlight",
      disabled: false,
      title: typeLabel ? `Показать все ${typeLabel}` : "Показать узлы этого типа",
      extraClass: typeDotActive,
    },
  ]
    .map(({ label, action, disabled, title, extraClass }) => {
      const disabledClass = disabled ? " scene-dot--disabled" : "";
      const titleAttr = title ? ` title="${title}"` : "";
      return `<button class="scene-dot scene-dot--control${disabledClass}${extraClass || ""}" type="button" data-action="${action}"${titleAttr}>${label}</button>`;
    })
    .join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE HIGHLIGHT MODE
// ═══════════════════════════════════════════════════════════════════════════
// 
// Подсвечивает все узлы того же типа, что и текущий узел.
// Активируется через "точку с точкой" в правом верхнем углу Story.
// 
// ПОВЕДЕНИЕ:
// ┌─────────────────┬────────────────────────────────────────────────────────┐
// │ Hover на точку  │ Временная подсветка узлов текущего типа                │
// │ Click на точку  │ Фиксация подсветки (точка становится жёлтой)           │
// │ Переход на узел │ Подсветка обновляется для нового типа                  │
// └─────────────────┴────────────────────────────────────────────────────────┘
// 
// ВАЖНО: Текущий узел — с рёбрами, остальные узлы типа — только подсветка.
// ═══════════════════════════════════════════════════════════════════════════

let typeHighlightPrevType = null; // Предыдущий тип для снятия подсветки

function getNodesByType(type) {
  return [...nodesById.values()].filter(n => n.type === type);
}

/**
 * Очистить Type Highlight.
 * 
 * МИГРАЦИЯ (Маршрут G): Очищает состояние для модели.
 */
function clearTypeHighlight() {
  typeHighlightedNodeIds.clear();
  typeHighlightPrevType = null;
}

/**
 * Применить Type Highlight.
 * 
 * МИГРАЦИЯ (Маршрут G): Обновляет состояние и делегирует в updateHighlight().
 */
function applyTypeHighlight(active) {
  if (!currentStep) return;
  
  // Очистить предыдущее состояние
  clearTypeHighlight();
  
  if (active) {
    const currentType = currentStep.type;
    const sameTypeNodes = getNodesByType(currentType);
    
    // Заполнить Set для модели
    sameTypeNodes.forEach(node => {
      typeHighlightedNodeIds.add(node.id);
    });
    
    typeHighlightPrevType = currentType;
  }
  
  // Вызвать центральную точку вычисления
  updateHighlight();
}

function setTypeHighlightActive(active) {
  typeHighlightActive = active;
  applyTypeHighlight(active);
  renderSceneStack(); // Обновить визуал точки
}

function handleTypeHighlightHover(hovered) {
  typeHighlightHovered = hovered;
  // Если не зафиксировано, применяем временную подсветку
  if (!typeHighlightActive) {
    applyTypeHighlight(hovered);
  }
}

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

// === Practice Polygons (полигоны практик между доменами) ===
let practicePolygons = new Map(); // practiceId -> THREE.Mesh
let activePracticeId = null; // Зафиксированная практика (по клику)
let hoveredPracticeId = null; // Практика под курсором (hover)

// === Context Menu (контекстное меню по правому клику) ===
let contextMenuElement = null;
let contextMenuNode = null;

// === Sprite Badges (бейджи-метаданные рядом с узлами) ===
// Пути формируются динамически через getBadgeAssetPath()
const BADGE_ASSET_NAMES = [
  "author-plug.png",
  "character-plug.png",
  "collab-plug.png",
  "domain-plug.png",
  "hub-plug.png",
  "practice-plug.png",
  "root-plug.png",
  "workbench-plug.png"
];

function getBadgeAssetPath(name) {
  return `${CONFIG.contractsPath}/assets/widgets/${name}`;
}
let nodeBadgeSprites = new Map(); // nodeId -> THREE.Sprite
let nodeBadgeTextures = new Map(); // nodeId -> texture path (для рандомного назначения)
let badgesVisible = false;

/**
 * Показывает контекстное меню для узла
 * @param {Object} node - узел графа
 * @param {number} x - координата X (clientX)
 * @param {number} y - координата Y (clientY)
 */
function showContextMenu(node, x, y) {
  hideContextMenu();
  contextMenuNode = node;

  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.innerHTML = `
    <div class="context-menu__item context-menu__item--button">
      <button class="context-menu__btn">Кнопка</button>
    </div>
    <div class="context-menu__item context-menu__item--icon">
      <img src="/assets/widgets/domain-ai.png" alt="" class="context-menu__icon" />
      <span>Иконка</span>
    </div>
    <div class="context-menu__item context-menu__item--text">
      Текст
    </div>
  `;

  // Позиционирование
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  document.body.appendChild(menu);
  contextMenuElement = menu;

  // Корректировка позиции если выходит за экран
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${x - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${y - rect.height}px`;
  }

  // Закрытие по клику вне меню
  setTimeout(() => {
    document.addEventListener("click", handleContextMenuOutsideClick);
    document.addEventListener("contextmenu", handleContextMenuOutsideClick);
  }, 0);
}

/**
 * Скрывает контекстное меню
 */
function hideContextMenu() {
  if (contextMenuElement) {
    contextMenuElement.remove();
    contextMenuElement = null;
    contextMenuNode = null;
    document.removeEventListener("click", handleContextMenuOutsideClick);
    document.removeEventListener("contextmenu", handleContextMenuOutsideClick);
  }
}

/**
 * Обработчик клика вне контекстного меню
 */
function handleContextMenuOutsideClick(event) {
  if (contextMenuElement && !contextMenuElement.contains(event.target)) {
    hideContextMenu();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE BADGES — бейджи-метаданные рядом с узлами
// ═══════════════════════════════════════════════════════════════════════════

const textureLoader = new THREE.TextureLoader();
const badgeTextureCache = new Map(); // path -> THREE.Texture

/**
 * Загружает текстуру с кэшированием
 */
function loadBadgeTexture(path) {
  if (badgeTextureCache.has(path)) {
    return Promise.resolve(badgeTextureCache.get(path));
  }
  return new Promise((resolve) => {
    textureLoader.load(path, (texture) => {
      badgeTextureCache.set(path, texture);
      resolve(texture);
    });
  });
}

/**
 * Инициализирует бейджи для всех узлов (рандомное назначение текстур)
 */
function initBadgeSprites() {
  if (!graph || !graph.scene()) return;
  
  const nodes = graph.graphData().nodes;
  nodes.forEach(node => {
    // Рандомно назначаем текстуру каждому узлу
    const randomIndex = Math.floor(Math.random() * BADGE_ASSET_NAMES.length);
    const assetName = BADGE_ASSET_NAMES[randomIndex];
    nodeBadgeTextures.set(node.id, getBadgeAssetPath(assetName));
  });
}

/**
 * Создаёт спрайт-бейдж для узла
 */
async function createBadgeSprite(nodeId) {
  if (nodeBadgeSprites.has(nodeId)) return nodeBadgeSprites.get(nodeId);
  
  // Ленивое назначение текстуры если ещё не назначена
  if (!nodeBadgeTextures.has(nodeId)) {
    const randomIndex = Math.floor(Math.random() * BADGE_ASSET_NAMES.length);
    const assetName = BADGE_ASSET_NAMES[randomIndex];
    nodeBadgeTextures.set(nodeId, getBadgeAssetPath(assetName));
  }
  
  const texturePath = nodeBadgeTextures.get(nodeId);
  if (!texturePath) return null;
  
  const texture = await loadBadgeTexture(texturePath);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false
  });
  
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6, 6, 1); // Размер бейджа
  sprite.renderOrder = 100; // Поверх узлов
  sprite.userData.nodeId = nodeId;
  sprite.userData.targetOpacity = 0;
  
  nodeBadgeSprites.set(nodeId, sprite);
  graph.scene().add(sprite);
  
  return sprite;
}

/**
 * Показывает все бейджи (плавное появление)
 */
async function showAllBadges() {
  if (badgesVisible) return;
  badgesVisible = true;
  
  console.log("[Badges] showAllBadges called, nodeBadgeTextures size:", nodeBadgeTextures.size);
  
  const nodes = graph.graphData().nodes;
  for (const node of nodes) {
    const sprite = await createBadgeSprite(node.id);
    if (sprite) {
      sprite.userData.targetOpacity = 0.9;
    }
  }
  
  console.log("[Badges] Created sprites:", nodeBadgeSprites.size);
}

/**
 * Скрывает все бейджи (плавное исчезание)
 */
function hideAllBadges() {
  if (!badgesVisible) return;
  badgesVisible = false;
  
  nodeBadgeSprites.forEach(sprite => {
    sprite.userData.targetOpacity = 0;
  });
}

/**
 * Обновляет позиции и opacity бейджей (вызывается в animation loop)
 */
function updateBadgeSprites() {
  if (nodeBadgeSprites.size === 0) return;
  
  nodeBadgeSprites.forEach((sprite, nodeId) => {
    const node = nodesById.get(nodeId);
    if (!node) return;
    
    // Позиция: справа-сверху от узла
    const baseRadius = nodeBaseRadius.get(nodeId) || 4;
    sprite.position.set(
      (node.x || 0) + baseRadius * 1.2,
      (node.y || 0) + baseRadius * 1.2,
      (node.z || 0)
    );
    
    // Плавное изменение opacity
    const currentOpacity = sprite.material.opacity;
    const targetOpacity = sprite.userData.targetOpacity;
    const diff = targetOpacity - currentOpacity;
    
    if (Math.abs(diff) > 0.01) {
      sprite.material.opacity = currentOpacity + diff * 0.1;
    } else {
      sprite.material.opacity = targetOpacity;
    }
    
    // Удалить спрайт если полностью невидим
    if (targetOpacity === 0 && sprite.material.opacity < 0.01) {
      graph.scene().remove(sprite);
      sprite.material.dispose();
      nodeBadgeSprites.delete(nodeId);
    }
  });
}

const highlightNodes = new Set();
const highlightLinks = new Set();      // Set<link object> — для совместимости
const halfHighlightLinks = new Set();  // Set<link object> — для совместимости
const highlightLinkIds = new Set();    // Set<string> — ID рёбер с полной яркостью
const halfHighlightLinkIds = new Set(); // Set<string> — ID рёбер с половинной яркостью
let highlightMode = "none"; // "none" | "selected" | "hover" | "scope"

// ═══════════════════════════════════════════════════════════════════════════
// HIGHLIGHT MODEL INTEGRATION (Маршрут G)
// ═══════════════════════════════════════════════════════════════════════════
// 
// Центральная точка вычисления подсветки.
// Все изменения подсветки должны проходить через updateHighlight().
// 
// БЫЛО: highlightedNodes модифицируется из 5+ мест
// СТАЛО: highlightedNodes = производная от computeHighlight()
// ═══════════════════════════════════════════════════════════════════════════

let cachedHighlightState = null;

/**
 * Обновить подсветку через вычислительную модель.
 * ЕДИНСТВЕННАЯ точка входа для изменения подсветки.
 */
function updateHighlight() {
  const context = createContextFromState({
    currentStepId: currentStep?.id || null,
    hoverNodeId: hoverNode?.id || null,
    widgetHighlightedNodeId: widgetHighlightedNodeId,
    scopeHighlightNodeIds: scopeHighlightNodeIds,
    scopeHighlightActive: scopeHighlightActive,
    typeHighlightedNodeIds: typeHighlightedNodeIds,
    typeHighlightActive: typeHighlightActive
  });
  
  const graphData = {
    nodesById: nodesById,
    neighborsById: neighborsById,
    edges: graph?.graphData()?.links || []
  };
  
  cachedHighlightState = computeHighlight(context, graphData);
  renderHighlight(cachedHighlightState);
}

/**
 * Применить состояние подсветки к визуалу.
 * Чистая функция рендеринга — только читает state, применяет к DOM/Three.js.
 */
function renderHighlight(state) {
  if (!state) return;
  
  // Обновить Sets для совместимости с существующим кодом
  highlightNodes.clear();
  highlightLinks.clear();
  halfHighlightLinks.clear();
  highlightLinkIds.clear();
  halfHighlightLinkIds.clear();
  highlightMode = state.mode;
  
  const graphData = graph?.graphData();
  if (!graphData) return;
  
  // Заполнить highlightNodes
  for (const [nodeId, intensity] of state.nodeIntensities) {
    if (intensity >= INTENSITY.HALF) {
      const node = nodesById.get(nodeId);
      if (node) highlightNodes.add(node);
    }
  }
  
  // Заполнить highlightLinks / halfHighlightLinks + ID-based Sets
  for (const link of graphData.links) {
    const intensity = state.edgeIntensities.get(link.id);
    if (intensity === INTENSITY.FULL) {
      highlightLinks.add(link);
      highlightLinkIds.add(link.id);
    } else if (intensity === INTENSITY.HALF) {
      halfHighlightLinks.add(link);
      halfHighlightLinkIds.add(link.id);
    }
  }
  
  // Обновить материалы узлов
  nodeMeshes.forEach((_, nodeId) => applyNodeMaterial(nodeId));
  
  // graph.refresh() убран — он перезапускает физику и вызывает подрагивание
  // Материалы обновляются напрямую через applyNodeMaterial
}
const nodeGeometry = new THREE.SphereGeometry(1, 48, 48);
const systemNodeGeometry = new THREE.SphereGeometry(1, 96, 96);
const nodeMaterialCache = new Map();
const nodeMeshes = new Map();
const nodeBaseRadius = new Map();
const nodePulsePhase = new Map();
const linkPulsePhase = new Map();
const SYSTEM_MODEL_URL = buildAssetPath("model/Шар.glb");
const gltfLoader = new GLTFLoader();
const SYSTEM_BAKE_SEGMENTS = 256;
const SYSTEM_RAYCAST_MARGIN = 1.5;
const defaultSystemLightColor = new THREE.Color(SYSTEM_COLOR_LIGHT);
const defaultSystemDarkColor = new THREE.Color(SYSTEM_COLOR_DARK);
const systemSubdivisionModifier = { modify: (geometry) => geometry };
let systemModelScene = null;
let nodeThreeObjectFactory = null;

gltfLoader.load(
  SYSTEM_MODEL_URL,
  (gltf) => {
    systemModelScene = gltf.scene;
    systemModelScene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.colorWrite = true;
        child.material.toneMapped = true;
        child.material.metalness = 0.1;
        child.material.roughness = 0.4;
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.geometry && child.geometry.isBufferGeometry) {
          let refinedGeometry = child.geometry.clone();
          refinedGeometry = systemSubdivisionModifier.modify(refinedGeometry);
          refinedGeometry.computeVertexNormals();
          child.geometry = refinedGeometry;
        }
      }
    });
    console.info("[SystemModel] loaded", SYSTEM_MODEL_URL);
    refreshSystemMesh();
    // Note: experimental painting helper archived.
    // See `render/src/scenes/_archive/paint-system-variant.js` for the paintSystemModel experiment
    // and variants of createOrUpdateSystemMesh. The shipped app uses the default system model appearance.
    if (nodeThreeObjectFactory) {
      graph.nodeThreeObject(nodeThreeObjectFactory);
    }
  },
  undefined,
  (error) => {
    console.error("[SystemModel] failed", SYSTEM_MODEL_URL, error);
  }
);

// === Граф ===
const graphEngine = new ThreeGraphEngine({
  container: graphEl,
  three: THREE,
  baseNodeRadius: BASE_NODE_RADIUS,
  autoRotateSpeed: AUTO_ROTATE_SPEED,
  visualConfig: VISUAL_CONFIG,
  getLinkDistance
});
const graph = graphEngine.initialize();
const controls = graph.controls();

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

// ═══════════════════════════════════════════════════════════════════════════
// СИСТЕМА ПОДСВЕТКИ (Highlight System)
// ═══════════════════════════════════════════════════════════════════════════
// 
// ПРИОРИТЕТ ЦВЕТА УЗЛА (от высшего к низшему):
// ┌─────────────────────┬────────────────────────────────────────────────────┐
// │ 1. typeHighlight    │ Узлы того же типа (жёлтый, БЕЗ рёбер)              │
// │ 2. widgetHover      │ Hover на виджет (жёлтый)                           │
// │ 3. currentStep      │ Текущий выделенный узел (жёлтый)                   │
// │ 4. isStart          │ Стартовый узел (голубой)                           │
// │ 5. scopeHighlight   │ Узлы в scope (жёлтый)                              │
// │ 6. default          │ Обычный цвет                                       │
// └─────────────────────┴────────────────────────────────────────────────────┘
//
// ВАЖНО: Type Highlight подсвечивает только узлы, НЕ рёбра.
// Рёбра горят только у текущего узла (currentStep).
// ═══════════════════════════════════════════════════════════════════════════

let widgetHighlightedNodeId = null; // Узел, подсвеченный через виджет (одиночный hover)
const typeHighlightedNodeIds = new Set(); // Узлы, подсвеченные через Type Highlight Mode

/**
 * Получить цвет узла с учётом всех режимов подсветки.
 * @param {Object} node - Узел графа
 * @param {boolean} forLink - Если true, исключает Type Highlight (для рёбер)
 * @returns {string} Цвет в формате hex
 */
function getNodeColor(node, forLink = false) {
  // Mirror — индиго палитра (Render)
  if (MIRROR_NODE_IDS.has(node.id)) {
    if (hoverNode && node.id === hoverNode.id) return MIRROR_PALETTE.active;
    if (!forLink && typeHighlightedNodeIds.has(node.id)) return MIRROR_PALETTE.selected;
    if (widgetHighlightedNodeId && node.id === widgetHighlightedNodeId) return MIRROR_PALETTE.active;
    if (currentStep && node.id === currentStep.id) return MIRROR_PALETTE.selected;
    if (scopeHighlightActive && scopeHighlightNodeIds.has(node.id)) return MIRROR_PALETTE.active;
    return MIRROR_PALETTE.inactive;
  }
  
  // Cryptocosm — ч/б палитра (тёмная материя)
  if (CRYPTOCOSM_NODE_IDS.has(node.id)) {
    // Hover подсветка — только сам hovered узел, не соседи
    if (hoverNode && node.id === hoverNode.id) return CRYPTOCOSM_PALETTE.active;
    // Type Highlight
    if (!forLink && typeHighlightedNodeIds.has(node.id)) return CRYPTOCOSM_PALETTE.selected;
    // Подсветка через виджет — только сам узел
    if (widgetHighlightedNodeId && node.id === widgetHighlightedNodeId) return CRYPTOCOSM_PALETTE.active;
    // Текущий выделенный узел
    if (currentStep && node.id === currentStep.id) return CRYPTOCOSM_PALETTE.selected;
    // Scope highlight
    if (scopeHighlightActive && scopeHighlightNodeIds.has(node.id)) return CRYPTOCOSM_PALETTE.active;
    // По умолчанию — почти чёрный
    return CRYPTOCOSM_PALETTE.inactive;
  }
  
  // Type Highlight — только для узлов, не для рёбер
  if (!forLink && typeHighlightedNodeIds.has(node.id)) return palette.nodeSelected;
  // Подсветка через виджет
  if (widgetHighlightedNodeId && node.id === widgetHighlightedNodeId) return palette.nodeSelected;
  // Текущий выделенный узел
  if (currentStep && node.id === currentStep.id) return palette.nodeSelected;
  // Стартовый узел
  if (node.isStart) return palette.nodeStart;
  // Scope highlight
  if (scopeHighlightActive && scopeHighlightNodeIds.has(node.id)) return palette.nodeSelected;
  // По умолчанию
  return palette.nodeDefault;
}

/**
 * Получить цвет узла для рёбер (исключает Type Highlight).
 * @param {Object} node - Узел графа
 * @returns {string} Цвет в формате hex
 */
function getNodeColorForLink(node) {
  return getNodeColor(node, true);
}

function getNodeCategory(node) {
  if (!node) return null;
  if (node.id && HUB_CATEGORY_BY_ID[node.id]) return HUB_CATEGORY_BY_ID[node.id];
  if (node.type && TYPE_CATEGORY[node.type]) return TYPE_CATEGORY[node.type];
  return null;
}

function isSystemNode(node) {
  return node?.id === SYSTEM_NODE_ID;
}

function getNodeRadius(node) {
  // Мыльный пузырь: cabin-runa — фиксированный размер (приоритет над всем)
  if (node.id === "cabin-runa") {
    const parentRadius = 8.8; // Радиус crypto-cabins (hub)
    return parentRadius * 0.4; // ~3.5 — меньше большого узла
  }
  if (node.visualRadius && Number.isFinite(node.visualRadius)) {
    return node.visualRadius;
  }
  if (node.size && Number.isFinite(node.size)) {
    return Math.min(VISUAL_CONFIG.node.maxRadius, Math.max(VISUAL_CONFIG.node.minRadius, node.size));
  }
  if (isSystemNode(node)) {
    return BASE_NODE_RADIUS * 10 * SYSTEM_NODE_SCALE;
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

// Простой материал без rim-эффекта для Cryptocosm (тёмная материя)
const cryptoMaterialCache = new Map();
const CRYPTOCOSM_OPACITY_BASE = 0.6; // Базовая прозрачность (центр)
const CRYPTOCOSM_OPACITY_MIN = 0.25; // Минимальная прозрачность (края)

// Глубина узла в иерархии Cryptocosm (для градиентной прозрачности)
const CRYPTOCOSM_DEPTH = {
  "cryptocosm": 0,           // Корень — самый яркий
  "crypto-engine": 1,        // Хабы — уровень 1
  "crypto-cabins": 1,
  "crypto-mirror": 1,
  "crypto-schema": 2,        // Модули — уровень 2
  "crypto-adapter": 2,
  "crypto-validators": 2,
  "crypto-graph": 2,
  "crypto-llm": 2,
  "crypto-protocol": 2,
  "crypto-projections": 2,
  "cabin-runa": 3,           // Кабины — уровень 3 (самые прозрачные)
  "cabin-author": 3,
  "cabin-ai": 3,
  "cabin-petrova": 3,
  "cabin-hinto": 3,
  "cabin-dizi": 3
};
const CRYPTOCOSM_MAX_DEPTH = 3;

function getCryptoOpacity(nodeId) {
  const depth = CRYPTOCOSM_DEPTH[nodeId] ?? CRYPTOCOSM_MAX_DEPTH;
  const t = depth / CRYPTOCOSM_MAX_DEPTH; // 0..1
  return CRYPTOCOSM_OPACITY_BASE - t * (CRYPTOCOSM_OPACITY_BASE - CRYPTOCOSM_OPACITY_MIN);
}

function getCryptoMaterial(colorHex, nodeId) {
  const opacity = getCryptoOpacity(nodeId);
  const key = `${String(colorHex).toLowerCase()}_${opacity.toFixed(2)}`;
  if (cryptoMaterialCache.has(key)) {
    return cryptoMaterialCache.get(key);
  }

  const baseColor = new THREE.Color(colorHex);
  const material = new THREE.MeshBasicMaterial({
    color: baseColor,
    transparent: true,
    opacity: opacity
  });

  cryptoMaterialCache.set(key, material);
  return material;
}

let systemSphereMaterial = null;
let systemNodeBaseGeometry = systemNodeGeometry;
let systemModelRoot = null;
// NOTE: эксперимент по покраске шара заархивирован в
// `render/src/scenes/_archive/paint-system-variant.js` (Вариант 1).
// Переменная paintedSystemNodeId и helper paintSystemModel удалены
// из основного кода — см. архив, если потребуется восстановить.

function refreshSystemMesh() {
  nodesById.forEach((node, nodeId) => {
    if (isSystemNode(node) && nodeMeshes.has(nodeId)) {
      createOrUpdateSystemMesh(node, true);
    }
  });
}

// Robust helper to (re)paint the loaded system model.
// Usage:
//  paintSystemModel('#ffffff')                -> tries to preserve maps but sets color
//  paintSystemModel('#ffffff', { basic: true }) -> replace with MeshBasicMaterial for debug/visibility
// paintSystemModel helper moved to archive: render/src/scenes/_archive/paint-system-variant.js

function createOrUpdateSystemMesh(node, isRefresh = false) {
  let mesh = nodeMeshes.get(node.id);

  if (!mesh) {
    mesh = new THREE.Mesh(systemNodeBaseGeometry, getSystemMaterial());
    mesh.userData = { hasSystemModel: false };
    mesh.frustumCulled = false;
    nodeMeshes.set(node.id, mesh);
  }

  // Attach system model scene if available (no special painting applied here).
  if (systemModelScene && !mesh.userData.hasSystemModel) {
    try {
      const systemChild = systemModelScene.clone(true);
      systemChild.name = 'systemModelChild';
      systemChild.traverse((child) => { if (child.isMesh) child.frustumCulled = false; });
      mesh.add(systemChild);
      mesh.userData.hasSystemModel = true;
    } catch (err) {
      console.warn('[SystemMesh] attach failed for node', node.id, err);
    }
  }

  mesh.frustumCulled = false;
  const baseRadius = getNodeRadius(node);
  mesh.scale.setScalar(baseRadius);
  nodeBaseRadius.set(node.id, baseRadius);
  if (!nodePulsePhase.has(node.id)) {
    const phaseSeed = hashId(String(node.id)) % 1000;
    nodePulsePhase.set(node.id, (phaseSeed / 1000) * Math.PI * 2);
  }
  return mesh;
}

function createSystemNodeMesh(node) {
  return createOrUpdateSystemMesh(node);
}

function createNodeMesh(node) {
  // Кэширование: если mesh уже существует, вернуть его (избежать пересоздания при graph.refresh())
  const existingMesh = nodeMeshes.get(node.id);
  if (existingMesh) {
    return existingMesh;
  }
  
  if (isSystemNode(node)) {
    console.log('[Visitor] createNodeMesh: system node requested ->', node.id);
    const sysMesh = createSystemNodeMesh(node);
    console.log('[Visitor] createNodeMesh: system mesh created for', node.id, sysMesh);
    return sysMesh;
  }
  // Cryptocosm — простой материал без rim-эффекта с градиентной прозрачностью
  // Исключение: cabin-runa использует rim-материал с бликами (но чёрный цвет)
  let material;
  if (node.id === "cabin-runa") {
    material = getRimMaterial(getNodeColor(node)); // Блики + чёрный цвет
  } else if (MIRROR_NODE_IDS.has(node.id)) {
    material = getCryptoMaterial(getNodeColor(node), node.id); // Индиго материал
  } else if (CRYPTOCOSM_NODE_IDS.has(node.id)) {
    material = getCryptoMaterial(getNodeColor(node), node.id);
  } else {
    material = getRimMaterial(getNodeColor(node));
  }
  const mesh = new THREE.Mesh(nodeGeometry, material);
  const baseRadius = getNodeRadius(node);
  mesh.scale.setScalar(baseRadius);
  nodeMeshes.set(node.id, mesh);
  console.log('[Visitor] createNodeMesh: created mesh for', node.id, 'radius=', baseRadius);
  nodeBaseRadius.set(node.id, baseRadius);
  if (!nodePulsePhase.has(node.id)) {
    const phaseSeed = hashId(String(node.id)) % 1000;
    nodePulsePhase.set(node.id, (phaseSeed / 1000) * Math.PI * 2);
  }
  return mesh;
}

function applyNodeMaterial(nodeId) {
  const node = nodesById.get(nodeId);
  const mesh = nodeMeshes.get(nodeId);
  if (!node || !mesh) return;
  if (isSystemNode(node)) {
    // GLB already содержит нужные материалы; не трогаем
    return;
  }
  // Cryptocosm — простой материал без rim-эффекта с градиентной прозрачностью
  // Исключение: cabin-runa использует rim-материал с бликами (но чёрный цвет)
  if (node.id === "cabin-runa") {
    mesh.material = getRimMaterial(getNodeColor(node)); // Блики + чёрный цвет
  } else if (MIRROR_NODE_IDS.has(node.id)) {
    mesh.material = getCryptoMaterial(getNodeColor(node), node.id); // Индиго материал
  } else if (CRYPTOCOSM_NODE_IDS.has(node.id)) {
    mesh.material = getCryptoMaterial(getNodeColor(node), node.id);
  } else {
    mesh.material = getRimMaterial(getNodeColor(node));
  }
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

  // Материал спайков — будет обновлён в updateLinkObject
  const nozzleMaterialA = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1
  });
  const nozzleMaterialB = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1
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

  // Используем ID-based Sets для проверки подсветки
  const isHighlighted = highlightLinkIds.has(link.id);
  const isHalfHighlighted = halfHighlightLinkIds.has(link.id);

  // При подсветке — жёлтый цвет, иначе — цвета узлов
  let startColor, endColor, midColor;
  
  // Проверяем, является ли ребро частью Cryptocosm или Mirror
  const isCryptoLink = (sourceNode && CRYPTOCOSM_NODE_IDS.has(sourceNode.id)) || 
                       (targetNode && CRYPTOCOSM_NODE_IDS.has(targetNode.id));
  const isMirrorLink = (sourceNode && MIRROR_NODE_IDS.has(sourceNode.id)) || 
                       (targetNode && MIRROR_NODE_IDS.has(targetNode.id));
  
  if (isHighlighted || isHalfHighlighted) {
    // Для Cryptocosm/Mirror — тёмная подсветка вместо жёлтой
    let highlightColor;
    if (isMirrorLink) {
      highlightColor = new THREE.Color(MIRROR_PALETTE.active);
    } else if (isCryptoLink) {
      highlightColor = new THREE.Color(CRYPTOCOSM_PALETTE.active);
    } else {
      highlightColor = new THREE.Color(palette.nodeSelected);
    }
    startColor = highlightColor;
    endColor = highlightColor;
    midColor = highlightColor;
  } else {
    // Для рёбер используем цвет узла БЕЗ учёта Type Highlight Mode
    // (Type Highlight подсвечивает только узлы, не рёбра)
    if (isMirrorLink) {
      // Mirror — тёмно-индиго рёбра
      startColor = new THREE.Color(MIRROR_PALETTE.link);
      endColor = new THREE.Color(MIRROR_PALETTE.link);
      midColor = new THREE.Color(MIRROR_PALETTE.link);
    } else if (isCryptoLink) {
      // Cryptocosm — тёмно-серые рёбра
      startColor = new THREE.Color(CRYPTOCOSM_PALETTE.link);
      endColor = new THREE.Color(CRYPTOCOSM_PALETTE.link);
      midColor = new THREE.Color(CRYPTOCOSM_PALETTE.link);
    } else {
      startColor = new THREE.Color(sourceNode ? getNodeColorForLink(sourceNode) : palette.linkDefault);
      endColor = new THREE.Color(targetNode ? getNodeColorForLink(targetNode) : palette.linkDefault);
      midColor = new THREE.Color(palette.linkDefault);
    }
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

  // Полная яркость для hover, половинная для selected
  // Cryptocosm — рёбра полностью скрыты (только для физики)
  if (isCryptoLink) {
    line.material.opacity = 0;
    line.material.blending = THREE.NormalBlending;
  } else {
    line.material.opacity = isHighlighted ? 0.9 : (isHalfHighlighted ? 0.55 : 0.4);
    line.material.blending = THREE.AdditiveBlending; // Обычные рёбра светятся
  }

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

  // Cryptocosm — рёбра скрыты по умолчанию, появляются при hover/select
  if (isCryptoLink) {
    nozzleA.visible = false;
    nozzleB.visible = false;
    // Линия видна только при подсветке
    line.visible = isHighlighted || isHalfHighlighted;
  } else {
    nozzleA.visible = true;
    nozzleB.visible = true;
    line.visible = true;
  }

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
  
  // Cryptocosm — прозрачность для спайков (спайки скрыты, но оставим код на случай)
  if (isCryptoLink) {
    nozzleA.material.transparent = true;
    nozzleA.material.opacity = CRYPTOCOSM_OPACITY_BASE;
    nozzleB.material.transparent = true;
    nozzleB.material.opacity = CRYPTOCOSM_OPACITY_BASE;
  } else {
    nozzleA.material.transparent = false;
    nozzleA.material.opacity = 1;
    nozzleB.material.transparent = false;
    nozzleB.material.opacity = 1;
  }
}

function getLinkPulsePhase(link) {
  const key = link.id || `${getId(link.source)}-${getId(link.target)}`;
  if (linkPulsePhase.has(key)) return linkPulsePhase.get(key);
  const phaseSeed = hashId(String(key)) % 1000;
  const phase = (phaseSeed / 1000) * Math.PI * 2;
  linkPulsePhase.set(key, phase);
  return phase;
}

/**
 * Обновить визуал всех рёбер без перезапуска физики.
 * Вызывается вместо graph.refresh() для подсветки.
 */
function refreshLinkVisuals() {
  const graphData = graph?.graphData();
  if (!graphData) return;
  
  for (const link of graphData.links) {
    const obj = link.__threeObj;
    if (!obj) continue;
    
    const { line, nozzleA, nozzleB } = obj.userData;
    if (!line) continue;
    
    const sourceNode = nodesById.get(getId(link.source));
    const targetNode = nodesById.get(getId(link.target));
    
    // Используем ID-based Sets для проверки подсветки
    const isHighlighted = highlightLinkIds.has(link.id);
    const isHalfHighlighted = halfHighlightLinkIds.has(link.id);
    
    const isCryptoLink = (sourceNode && CRYPTOCOSM_NODE_IDS.has(sourceNode.id)) || 
                         (targetNode && CRYPTOCOSM_NODE_IDS.has(targetNode.id));
    const isMirrorLink = (sourceNode && MIRROR_NODE_IDS.has(sourceNode.id)) || 
                         (targetNode && MIRROR_NODE_IDS.has(targetNode.id));
    
    // Обновить цвета
    let linkColor;
    if (isHighlighted || isHalfHighlighted) {
      if (isMirrorLink) {
        linkColor = new THREE.Color(MIRROR_PALETTE.active);
      } else if (isCryptoLink) {
        linkColor = new THREE.Color(CRYPTOCOSM_PALETTE.active);
      } else {
        linkColor = new THREE.Color(palette.nodeSelected);
      }
    } else {
      if (isMirrorLink) {
        linkColor = new THREE.Color(MIRROR_PALETTE.link);
      } else if (isCryptoLink) {
        linkColor = new THREE.Color(CRYPTOCOSM_PALETTE.link);
      } else {
        linkColor = new THREE.Color(palette.linkDefault);
      }
    }
    
    const colors = line.geometry.getAttribute("color");
    if (colors) {
      colors.array[0] = linkColor.r;
      colors.array[1] = linkColor.g;
      colors.array[2] = linkColor.b;
      colors.array[3] = linkColor.r;
      colors.array[4] = linkColor.g;
      colors.array[5] = linkColor.b;
      colors.array[6] = linkColor.r;
      colors.array[7] = linkColor.g;
      colors.array[8] = linkColor.b;
      colors.needsUpdate = true;
    }
    
    // Обновить opacity
    if (isCryptoLink) {
      line.material.opacity = 0;
      line.visible = isHighlighted || isHalfHighlighted;
    } else {
      line.material.opacity = isHighlighted ? 0.9 : (isHalfHighlighted ? 0.55 : 0.4);
    }
    
    // Обновить цвета спайков
    if (nozzleA) nozzleA.material.color.copy(linkColor);
    if (nozzleB) nozzleB.material.color.copy(linkColor);
  }
}

function getLinkDistance(link) {
  const sourceId = getId(link.source);
  const targetId = getId(link.target);
  
  // Сокращённое ребро между Universe и Cryptocosm
  if ((sourceId === "universe" && targetId === "cryptocosm") ||
      (sourceId === "cryptocosm" && targetId === "universe")) {
    return VISUAL_CONFIG.link.baseLength * 0.4; // 40% от базовой длины
  }
  
  // Мыльный пузырь: cabin-runa прижат к crypto-cabins
  // Радиус crypto-cabins = 8.8, радиус cabin-runa = 5.87 (увеличен x2)
  // Расстояние между центрами для касания = 8.8 + 5.87 = 14.67
  // Для эффекта "на поверхности" делаем меньше
  if ((sourceId === "crypto-cabins" && targetId === "cabin-runa") ||
      (sourceId === "cabin-runa" && targetId === "crypto-cabins")) {
    return 7; // Пузырь на поверхности
  }
  
  const base = VISUAL_CONFIG.link.baseLength;
  const variance = VISUAL_CONFIG.link.lengthVariance;
  const seedValue = hashId(String(link.id || `${sourceId}-${targetId}`));
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
  // Сначала отфильтровываем временно отключённые узлы (практики)
  const enabledNodes = nodes.filter((node) => {
    const type = node.type || NODE_DEFAULTS.type;
    if (DISABLED_NODE_TYPES.has(type)) return false;
    if (DISABLED_HUB_IDS.has(node.id)) return false;
    return true;
  });
  const enabledIds = new Set(enabledNodes.map((n) => n.id));
  const enabledEdges = edges.filter((edge) => {
    const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source;
    const targetId = typeof edge.target === "object" ? edge.target.id : edge.target;
    return enabledIds.has(sourceId) && enabledIds.has(targetId);
  });

  if (!view || view === "all") {
    return { nodes: enabledNodes, edges: enabledEdges };
  }
  const allowed = VIEW_TYPES[view];
  if (!allowed) {
    return { nodes: enabledNodes, edges: enabledEdges };
  }

  const allowedIds = new Set();
  const filteredNodes = enabledNodes.filter((node) => {
    const type = node.type || NODE_DEFAULTS.type;
    const isAllowed = allowed.has(type);
    if (isAllowed) {
      allowedIds.add(node.id);
    }
    return isAllowed;
  });

  const filteredEdges = enabledEdges.filter((edge) => {
    const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source;
    const targetId = typeof edge.target === "object" ? edge.target.id : edge.target;
    return allowedIds.has(sourceId) && allowedIds.has(targetId);
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

function bakeSystemSphereGeometry() {
  // TODO: sample исходный GLB и перенести цвета на сглаженную сферу.
  // Пока возвращаем null, чтобы оставить модель без изменений.
  return null;
}

function getSystemMaterial() {
  if (systemSphereMaterial) return systemSphereMaterial;
  systemSphereMaterial = new THREE.MeshStandardMaterial({
    color: SYSTEM_COLOR_LIGHT,
    metalness: 0.2,
    roughness: 0.35
  });
  return systemSphereMaterial;
}

// === Настройка графа ===
graph.nodeLabel((node) => getNodeTooltip(node));
graph.nodeColor((node) => getNodeColor(node));
nodeThreeObjectFactory = (node) => createNodeMesh(node);
// Wrap the factory to log creation/attachment for lifecycle diagnostics.
graph.nodeThreeObject((node) => {
  console.log('[Graph] nodeThreeObject invoked for', node.id);
  const obj = nodeThreeObjectFactory(node);
  console.log('[Graph] nodeThreeObject returned for', node.id, obj);
  return obj;
});
graph.nodeThreeObjectExtend(false);

graph.nodeVal((node) => {
  const radius = getNodeRadius(node);
  return radius / BASE_NODE_RADIUS;
});

graph.linkThreeObject((link) => createLinkObject(link));
graph.linkPositionUpdate((obj, position, link) => updateLinkObject(obj, position, link));
graph.linkColor((link) => {
  if (highlightLinks.has(link)) return palette.highlight;
  if (halfHighlightLinks.has(link)) return palette.highlight;
  return palette.linkDefault;
});
graph.linkWidth((link) => {
  const cfg = VISUAL_CONFIG.highlight?.linkWidth || { full: 1.6, half: 1.0, dim: 0.6 };
  if (highlightLinks.has(link)) return cfg.full;
  if (halfHighlightLinks.has(link)) return cfg.half;
  return cfg.dim;
});

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

// ═══════════════════════════════════════════════════════════════════════════
// ПОДСВЕТКА РЁБЕР (Edge Highlight)
// ═══════════════════════════════════════════════════════════════════════════
// 
// Управляет подсветкой рёбер при выделении узла.
// 
// РЕЖИМЫ:
// ┌─────────────────┬────────────────────────────────────────────────────────┐
// │ hover           │ Полная яркость рёбер (opacity: 0.9, width: 1.6)        │
// │ selected        │ Половинная яркость рёбер (opacity: 0.55, width: 1.0)   │
// │ none            │ Обычные рёбра (opacity: 0.4, width: 0.6)               │
// └─────────────────┴────────────────────────────────────────────────────────┘
// 
// НАБОРЫ:
// - highlightLinks — рёбра с полной яркостью
// - halfHighlightLinks — рёбра с половинной яркостью
// - highlightNodes — узлы, связанные с подсвеченными рёбрами
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Обновить подсветку рёбер для узла.
 * 
 * МИГРАЦИЯ (Маршрут G): Эта функция теперь обновляет состояние
 * и делегирует вычисление в highlightModel.js через updateHighlight().
 * 
 * @param {Object|null} node - Узел для подсветки (null для сброса)
 * @param {string} mode - Режим: "hover" | "selected"
 */
function refreshHighlights(node, mode = "hover") {
  // Обновить состояние для вычислительной модели
  if (mode === "hover" && node) {
    // Временно устанавливаем hoverNode для модели
    // (hoverNode уже установлен в onNodeHover, здесь для виджетов)
  }
  
  // Вызвать центральную точку вычисления
  updateHighlight();
}

// === События графа ===
let lastHoveredNodeId = null;

graph.onNodeHover((node) => {
  // Снять подсветку с предыдущего узла
  if (lastHoveredNodeId && lastHoveredNodeId !== node?.id) {
    HighlightManager.node(lastHoveredNodeId, false);
    lastHoveredNodeId = null;
  }

  if (node === hoverNode) return;
  hoverNode = node || null;
  
  if (hoverNode) {
    // Hover на узел: полная яркость рёбер
    refreshHighlights(hoverNode, "hover");
    HighlightManager.node(hoverNode.id, true);
    lastHoveredNodeId = hoverNode.id;
  } else {
    // Возврат к подсветке выделенного узла (полсилы)
    refreshHighlights(currentStep, "selected");
  }
  // Вернуть graph.refresh() — он нужен для обновления рёбер
  // Дрожание было вызвано пульсацией узлов, которую мы уже отключили для Cryptocosm
  graph.refresh();
});

graph.onNodeClick((node) => {
  registerInteraction();
  motionSound.resumeIfNeeded();
  window.dispatchEvent(new CustomEvent("graph-node-selected", { detail: { node } }));
  goToStepById(node.id);
  // Скрыть бейджи при клике на узел
  hideAllBadges();
});

graph.onNodeRightClick((node, event) => {
  event.preventDefault();
  registerInteraction();
  showContextMenu(node, event.clientX, event.clientY);
});

graph.onNodeDrag((node) => {
  registerInteraction();
  isDragging = true;
  node.fx = node.x;
  node.fy = node.y;
  node.fz = node.z;
  // Показать бейджи при толкании узла
  console.log("[Badges] onNodeDrag triggered for:", node.id);
  showAllBadges();
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
    
    // Cryptocosm, Mirror и Universe узлы без пульсации — статичные
    if (CRYPTOCOSM_NODE_IDS.has(nodeId) || MIRROR_NODE_IDS.has(nodeId) || nodeId === "universe") {
      mesh.scale.setScalar(baseRadius);
      return;
    }
    
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

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE POLYGONS — полигоны практик между доменами
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Создаёт полигон (меш) для практики между узлами доменов
 * @param {Object} practice - объект практики из VISUAL_CONFIG.practices
 * @returns {THREE.Mesh|THREE.Line|null} - меш/линия или null если узлы не найдены
 */
function createPracticePolygon(practice) {
  const domainNodes = practice.domains
    .map(id => nodesById.get(id))
    .filter(Boolean);
  
  if (domainNodes.length < 2) {
    console.warn(`[Practice] Not enough domain nodes for ${practice.id}:`, practice.domains);
    return null;
  }

  const color = new THREE.Color(practice.color || "#a78bfa");

  // Линия (2 вершины) — особый случай
  if (domainNodes.length === 2) {
    const positions = new Float32Array([
      domainNodes[0].x || 0, domainNodes[0].y || 0, domainNodes[0].z || 0,
      domainNodes[1].x || 0, domainNodes[1].y || 0, domainNodes[1].z || 0
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
      linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    line.userData.practiceId = practice.id;
    line.userData.domainIds = practice.domains;
    line.userData.isLine = true;
    line.renderOrder = -1;
    return line;
  }

  // Полигон (3+ вершины)
  const positions = [];
  domainNodes.forEach(node => {
    positions.push(node.x || 0, node.y || 0, node.z || 0);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  // Триангуляция для разного количества вершин (fan triangulation)
  const indices = [];
  for (let i = 1; i < domainNodes.length - 1; i++) {
    indices.push(0, i, i + 1);
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.practiceId = practice.id;
  mesh.userData.domainIds = practice.domains;
  mesh.renderOrder = -1; // Рендерить за узлами

  return mesh;
}

/**
 * Обновляет позиции вершин полигона из текущих позиций узлов
 * @param {THREE.Mesh} mesh - меш полигона
 */
function updatePracticePolygonPositions(mesh) {
  if (!mesh || !mesh.userData.domainIds) return;

  const positions = mesh.geometry.attributes.position.array;
  mesh.userData.domainIds.forEach((domainId, i) => {
    const node = nodesById.get(domainId);
    if (node) {
      positions[i * 3] = node.x || 0;
      positions[i * 3 + 1] = node.y || 0;
      positions[i * 3 + 2] = node.z || 0;
    }
  });
  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

/**
 * Показывает полигон практики (fade in)
 * @param {string} practiceId - ID практики
 * @param {boolean} fixed - зафиксировать (true) или временно показать (false)
 */
function showPracticePolygon(practiceId, fixed = false) {
  const mesh = practicePolygons.get(practiceId);
  if (!mesh) return;

  if (fixed) {
    activePracticeId = practiceId;
  }
  hoveredPracticeId = practiceId;

  // Fade in
  mesh.material.opacity = fixed ? 0.35 : 0.25;
}

/**
 * Скрывает полигон практики (fade out)
 * @param {string} practiceId - ID практики
 * @param {boolean} force - скрыть даже если зафиксирован
 */
function hidePracticePolygon(practiceId, force = false) {
  const mesh = practicePolygons.get(practiceId);
  if (!mesh) return;

  // Не скрывать зафиксированный полигон
  if (practiceId === activePracticeId && !force) {
    return;
  }

  if (practiceId === hoveredPracticeId) {
    hoveredPracticeId = null;
  }

  // Если это активный и force=true, сбросить активный
  if (practiceId === activePracticeId && force) {
    activePracticeId = null;
  }

  // Fade out (или оставить если активный)
  mesh.material.opacity = practiceId === activePracticeId ? 0.35 : 0;
}

/**
 * Переключает фиксацию полигона практики
 * @param {string} practiceId - ID практики
 */
function togglePracticePolygon(practiceId) {
  if (activePracticeId === practiceId) {
    // Снять фиксацию
    hidePracticePolygon(practiceId, true);
  } else {
    // Скрыть предыдущий активный
    if (activePracticeId) {
      hidePracticePolygon(activePracticeId, true);
    }
    // Зафиксировать новый
    showPracticePolygon(practiceId, true);
  }
}

/**
 * Инициализирует все полигоны практик и добавляет их в сцену
 */
function initPracticePolygons() {
  if (!graph || !graph.scene()) return;

  const scene = graph.scene();
  const practices = VISUAL_CONFIG.practices || [];

  practices.forEach(practice => {
    // Пропускаем скрытые практики
    if (practice.hidden) return;
    
    const mesh = createPracticePolygon(practice);
    if (mesh) {
      practicePolygons.set(practice.id, mesh);
      scene.add(mesh);
    }
  });

  console.log(`[Practice] Initialized ${practicePolygons.size} practice polygons`);
}

/**
 * Обновляет позиции всех полигонов практик (вызывается в animation loop)
 */
function updatePracticePolygons() {
  practicePolygons.forEach((mesh) => {
    updatePracticePolygonPositions(mesh);
  });

  // Пульсация активного полигона
  if (activePracticeId) {
    const mesh = practicePolygons.get(activePracticeId);
    if (mesh) {
      const t = performance.now() * 0.001;
      const pulse = 0.30 + Math.sin(t * 2) * 0.08;
      mesh.material.opacity = pulse;
    }
  }
}

/**
 * Удаляет все полигоны практик из сцены
 */
function destroyPracticePolygons() {
  if (!graph || !graph.scene()) return;

  const scene = graph.scene();
  practicePolygons.forEach((mesh) => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  practicePolygons.clear();
  activePracticeId = null;
  hoveredPracticeId = null;
}

/**
 * Привязывает обработчики событий к виджетам практик
 * @param {HTMLElement} container - контейнер с виджетами
 */
function bindPracticeButtons(container) {
  // Поддержка и старых кнопок (.practice-btn) и новых виджетов (.practice-widget)
  const widgets = container.querySelectorAll(".practice-widget, .practice-btn");
  
  widgets.forEach(widget => {
    const practiceId = widget.dataset.practiceId;
    if (!practiceId) return;
    
    const isWidget = widget.classList.contains("practice-widget");
    const activeClass = isWidget ? "practice-widget--active" : "practice-btn--active";
    const hoverClass = isWidget ? "practice-widget--hover" : "practice-btn--hover";
    
    // Hover: показать полигон временно
    widget.addEventListener("mouseenter", () => {
      if (practiceId !== activePracticeId) {
        showPracticePolygon(practiceId, false);
      }
      widget.classList.add(hoverClass);
    });
    
    // Mouse leave: скрыть полигон (если не зафиксирован)
    widget.addEventListener("mouseleave", () => {
      if (practiceId !== activePracticeId) {
        hidePracticePolygon(practiceId);
      }
      widget.classList.remove(hoverClass);
    });
    
    // Click: зафиксировать/снять фиксацию полигона
    widget.addEventListener("click", () => {
      const wasActive = activePracticeId === practiceId;
      togglePracticePolygon(practiceId);
      
      // Обновить классы всех виджетов
      widgets.forEach(w => {
        const wActiveClass = w.classList.contains("practice-widget") 
          ? "practice-widget--active" 
          : "practice-btn--active";
        w.classList.remove(wActiveClass);
      });
      
      if (!wasActive) {
        widget.classList.add(activeClass);
      }
    });
  });
}

// === Node Glow Effect (свечение узла) ===
let glowingNodeId = null;
let glowMesh = null;

/**
 * Привязывает обработчик к кнопке "Свечение"
 */
function bindGlowToggleButton(container) {
  const btn = container.querySelector(".glow-toggle-btn");
  if (!btn) return;
  
  const nodeId = btn.dataset.nodeId;
  
  // Обновить состояние кнопки при загрузке
  if (glowingNodeId === nodeId) {
    btn.classList.add("practice-btn--active");
  }
  
  btn.addEventListener("click", () => {
    if (glowingNodeId === nodeId) {
      // Выключить свечение
      hideNodeGlow();
      btn.classList.remove("practice-btn--active");
    } else {
      // Включить свечение
      showNodeGlow(nodeId);
      btn.classList.add("practice-btn--active");
    }
  });
}

/**
 * Создаёт градиентную текстуру для свечения (яркий центр, прозрачные края)
 */
function createGlowTexture(color = 0xfbbf24, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  
  // Радиальный градиент: яркий центр → прозрачные края
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  
  // Конвертируем hex в rgb
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.7)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
  gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.1)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

let glowTexture = null;

/**
 * Показывает свечение вокруг узла (градиентное, от центра в прозрачность)
 */
function showNodeGlow(nodeId) {
  hideNodeGlow(); // Убрать предыдущее свечение
  
  const node = nodesById.get(nodeId);
  if (!node || !graph || !graph.scene()) return;
  
  glowingNodeId = nodeId;
  
  // Создаём спрайт с градиентной текстурой (пересоздаём для обновления)
  if (glowTexture) {
    glowTexture.dispose();
  }
  glowTexture = createGlowTexture(0xfbbf24, 256);
  
  const baseRadius = nodeBaseRadius.get(nodeId) || 5;
  const glowSize = baseRadius * 6;
  
  const material = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  glowMesh = new THREE.Sprite(material);
  glowMesh.scale.set(glowSize, glowSize, 1);
  glowMesh.position.set(node.x || 0, node.y || 0, node.z || 0);
  glowMesh.userData.nodeId = nodeId;
  glowMesh.renderOrder = -2; // За узлами
  
  graph.scene().add(glowMesh);
  
  console.log("[Glow] Enabled for node:", nodeId);
}

/**
 * Скрывает свечение узла
 */
function hideNodeGlow() {
  if (glowMesh) {
    graph.scene().remove(glowMesh);
    glowMesh.geometry.dispose();
    glowMesh.material.dispose();
    glowMesh = null;
  }
  glowingNodeId = null;
}

/**
 * Обновляет позицию свечения (вызывается в animation loop)
 */
function updateNodeGlow() {
  if (!glowMesh || !glowingNodeId) return;
  
  const node = nodesById.get(glowingNodeId);
  if (!node) return;
  
  glowMesh.position.set(node.x || 0, node.y || 0, node.z || 0);
  
  // Пульсация свечения через opacity и scale
  const t = performance.now() * 0.002;
  const pulse = 0.7 + Math.sin(t) * 0.3;
  glowMesh.material.opacity = pulse;
  
  // Лёгкая пульсация размера
  const baseRadius = nodeBaseRadius.get(glowingNodeId) || 5;
  const baseSize = baseRadius * 6;
  const scalePulse = 1 + Math.sin(t * 0.5) * 0.1;
  glowMesh.scale.set(baseSize * scalePulse, baseSize * scalePulse, 1);
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
    if (currentSource === "demo") {
      try {
        await loadUniverseGraph();
      } catch (fallbackError) {
        console.error("[Visitor] Demo route fallback failed:", fallbackError);
      }
    }
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
    
    // Инициализация типизированного registry
    const registry = initRegistry(universe);
    const validation = registry.validateAndLog();
    if (!validation.valid) {
      console.warn("[Visitor] Граф загружен с ошибками валидации");
    }
    const stats = registry.getStats();
    console.log("[Ontology] Registry:", stats.totalNodes, "узлов,", stats.totalEdges, "связей");
    
    // Проверка соответствия VISUAL_CONFIG правилам онтологии
    const configValidation = validateConfigAgainstRules(VISUAL_CONFIG);
    if (!configValidation.valid) {
      console.warn("[Ontology] VISUAL_CONFIG не соответствует правилам:");
      configValidation.mismatches.forEach((m) => console.warn("  ⚠", m));
    }
    
    // Проверка инвариантов онтологии
    registry.checkInvariantsAndLog();
    
    // Загрузка каталога инструментов
    await initToolCatalog(CONFIG.contractsPath);
    
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
    if (!domainWidgets?.widgets?.length) {
      throw new Error("Empty widgets list");
    }
    console.log("[Visitor] Loaded domain widgets:", domainWidgets.widgets?.length);
  } catch (error) {
    console.warn("[Visitor] Domain widgets not available:", error.message);
    domainWidgets = {
      id: "fallback-widgets",
      version: "1.0",
      title: "Fallback widgets",
      config: { panel: "story", triggerNode: "domains", style: "monochrome", iconSize: 48 },
      widgets: []
    };
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

function normalizeContractPath(rawPath) {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith("http") || rawPath.startsWith("/")) return rawPath;
  return `${CONFIG.contractsPath}/${rawPath}`;
}

async function loadJson(path) {
  const url = normalizeContractPath(path);
  const response = await fetch(withCacheBust(url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadJsonl(path) {
  const url = normalizeContractPath(path);
  const response = await fetch(withCacheBust(url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  return parseJsonl(text);
}

async function verifyAsset(path) {
  try {
    const url = normalizeContractPath(path);
    const response = await fetch(withCacheBust(url), { method: "HEAD" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.warn("[Visitor] Asset check failed:", path, error.message);
    return false;
  }
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

async function verifyCriticalAssets() {
  await Promise.all([
    verifyAsset("assets/widgets/domain-plug.png"),
    verifyAsset("assets/widgets/practice-plug.png"),
    verifyAsset("assets/widgets/collab-plug.png"),
    verifyAsset("assets/widgets/workbench-plug.png"),
    verifyAsset("exports/pointer_tags_registry.json"),
    verifyAsset("exports/ai_catalog.jsonl"),
    verifyAsset("exports/practice_participation.jsonl")
  ]);
}

async function reloadRoute() {
  console.log("[Visitor] Reloading...");

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
  
  // Сохраняем полный список узлов и соседей (включая отключённые) для виджетов
  allNodesById = new Map(normalizedNodes.map((node) => [node.id, node]));
  allNeighborsById = new Map();
  normalizedEdges.forEach((edge) => {
    const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source;
    const targetId = typeof edge.target === "object" ? edge.target.id : edge.target;
    if (!allNeighborsById.has(sourceId)) allNeighborsById.set(sourceId, new Set());
    if (!allNeighborsById.has(targetId)) allNeighborsById.set(targetId, new Set());
    allNeighborsById.get(sourceId).add(targetId);
    allNeighborsById.get(targetId).add(sourceId);
  });
  
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

  // Размеры узлов из VISUAL_CONFIG.nodeTypes[type].size
  const getVisualRadius = (node) => {
    const multiplier = VISUAL_CONFIG.nodeTypes?.[node.type]?.size ?? 1;
    return BASE_NODE_RADIUS * multiplier;
  };

  const graphData = {
    nodes: route.nodes.map((n) => {
      return {
        ...n,
        isStart: n.id === route.start_node_id,
        visualRadius: getVisualRadius(n)
      };
    }),
    links: route.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type
    }))
  };

  console.log('[Visitor] Clearing nodeMeshes due to route change');
  nodeMeshes.clear();
  nodeBaseRadius.clear();
  nodePulsePhase.clear();
  linkPulsePhase.clear();
  nodeMaterialCache.clear();

  graph.graphData(graphData);
  buildIndex(graphData);

  const startId = route.start_node_id || route.nodes[0]?.id;
  goToStepById(startId);

  setTimeout(() => {
    // Начальный масштаб — середина между min (80) и max (600) = 340
    const controls = graph.controls();
    const initialDistance = (controls.minDistance + controls.maxDistance) / 2;
    graph.cameraPosition({ x: 0, y: 0, z: initialDistance }, null, 800);
  }, 200);
  
  // Зафиксировать позиции Cryptocosm и Mirror узлов после стабилизации физики
  // Это предотвращает дрейф при перемещении камеры
  setTimeout(() => {
    const gd = graph.graphData();
    for (const node of gd.nodes) {
      if (CRYPTOCOSM_NODE_IDS.has(node.id) || MIRROR_NODE_IDS.has(node.id)) {
        node.fx = node.x;
        node.fy = node.y;
        node.fz = node.z;
      }
    }
    // Инициализировать полигоны практик после стабилизации графа
    initPracticePolygons();
    // Инициализировать бейджи (рандомное назначение текстур)
    initBadgeSprites();
  }, 3000); // После полной стабилизации физики

  console.log("[Visitor] Route loaded:", route.title);
}

// === Навигация ===
function goToStepById(stepId) {
  const node = nodesById.get(stepId);
  if (!node || !currentRoute) return;

  currentStep = node;
  currentStepIndex = currentRoute.nodes.findIndex((n) => n.id === stepId);

  nodeMaterialCache.clear();
  nodeMeshes.forEach((_, nodeId) => applyNodeMaterial(nodeId));

  updatePanels();
  // Выделенный узел: рёбра в полсилы (режим "selected")
  refreshHighlights(currentStep, "selected");
  
  // Если активен режим подсветки типа, обновить подсветку для нового типа
  if (typeHighlightActive) {
    applyTypeHighlight(true);
  }
  
  // Обновить визуал точки (tooltip с типом)
  renderSceneStack();
  
  graph.refresh();
  window.dispatchEvent(
    new CustomEvent("graph-step-changed", {
      detail: {
        step: currentStep,
        route: currentRoute,
        storyWidgets: buildStoryWidgetSections(currentStep)
      }
    })
  );
  // Push to scene stack for lightweight presence tracking when navigation is explicit
  try {
    if (!activeLeverWidgetId) pushSceneStack(stepId);
  } catch (e) {}
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

  // Уничтожить орбиты VSTablishment при переходе на любую страницу
  // (они будут созданы заново, если это страница VSTablishment)
  destroyVSTablishmentOrbits();

  const storyPanel = document.getElementById("scope-panel");
  const systemPanel = document.getElementById("system-panel");
  const servicePanel = document.getElementById("service-panel");
  if (storyPanel) storyPanel.classList.remove("panel-no-dim");
  const hasReactStory = Boolean(storyPanel?.querySelector(".react-story-host"));
  const hasReactSystem = Boolean(systemPanel?.querySelector(".react-system-host"));
  storyPanel?.classList.toggle("panel-react-overlay", hasReactStory);
  const hasReactService = Boolean(servicePanel?.querySelector(".react-service-host"));

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

  const appendPracticesToSystem = () => {
    const systemContent = systemPanel?.querySelector(".panel-content");
    if (!systemContent) return;
    const practiceNodeIds = getRelatedNodeIdsByType(currentStep?.id, "practice");
    if (!practiceNodeIds.length) return;
    let systemHtml = "";
    systemHtml += `<div class="section-title">${getSectionLabel("practice")}</div>`;
    systemHtml += `<div class="domain-widgets inline-widgets">`;
    systemHtml += practiceNodeIds.map((nodeId) => {
      // Используем allNodesById для отключённых узлов (практики)
      const label = (allNodesById.get(nodeId) || nodesById.get(nodeId))?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget-nav " data-node-id="${nodeId}" title="${escapeHtml(label)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(getPracticeWidgetIcon(nodeId), "practice")}
          </div>
        </div>`;
    }).join("");
    systemHtml += `</div>`;
    systemContent.innerHTML += systemHtml;
    bindHighlightWidgets(systemContent);
  };

  if (!hasReactStory) {
    // Story панель: практики имеют спец. виджеты, остальные хабы используют общий шаблон
    if (currentStep.id === "practices") {
      updateStoryWithPracticeWidgets(storyPanel, currentStep.story);
    } else if (isRootNode(currentStep)) {
      updateStoryWithRoot(storyPanel, currentStep);
      updatePanel(systemPanel, { text: "" });
      updateServicePanel(servicePanel, { text: "", actions: [] });
      updateContextStrip();
      return;
    } else if (isHubNode(currentStep)) {
      updateStoryWithHub(storyPanel, currentStep);
      updatePanel(systemPanel, { text: "" });
      updateServicePanel(servicePanel, { text: "", actions: [] });
      updateContextStrip();
      return;
    } else if (EXPERIMENTAL_RULES.potentialInStory && isCharacterNode(currentStep)) {
      updateStoryWithPotential(storyPanel, currentStep);
      updatePanel(systemPanel, { text: "" });
      updateServicePanel(servicePanel, { text: "", actions: [] });
      appendPracticesToSystem();
      updateContextStrip();
      return;
    } else if (isWorkbenchNode(currentStep)) {
      updateStoryWithWorkbench(storyPanel, currentStep);
      // System panel пуст для воркбенчей (Track 6: сцена переключается через виджет)
      updatePanel(systemPanel, { text: "" });
      updateServicePanel(servicePanel, { text: "", actions: [] });
      appendPracticesToSystem();
      updateContextStrip();
      return;
    } else if (isCollabNode(currentStep)) {
      updateStoryWithCollab(storyPanel, currentStep);
      updatePanel(systemPanel, { text: "" });
      updateServicePanel(servicePanel, { text: "", actions: [] });
      appendPracticesToSystem();
      updateContextStrip();
      return;
    } else if (isDomainNode(currentStep)) {
      updateStoryWithDomainFocus(storyPanel, currentStep);
      updatePanel(systemPanel, { text: "" });
      updateServicePanel(servicePanel, { text: "", actions: [] });
      appendPracticesToSystem();
      updateContextStrip();
      return;
    } else if (isWidgetNode(currentStep)) {
      updateStoryWithNodeWidget(storyPanel, currentStep.story, currentStep);
    } else {
      const storyContent = storyPanel?.querySelector(".panel-content");
      storyContent?.classList.remove("story-compact");
      const practiceHint = getPracticeHintForDomain(currentStep.id);
      if (queryModeActive && practiceHint) {
        updateStoryWithPracticeHint(storyPanel, currentStep.story, practiceHint);
      } else if (hasQueryHints && !isQueryNode) {
        updateStoryWithSystemText(storyPanel, currentStep.story, currentStep.system);
      } else {
        updatePanel(storyPanel, currentStep.story);
      }
    }
  } else {
    const storyContent = storyPanel?.querySelector(".panel-content");
    if (storyContent) {
      storyContent.innerHTML = "";
      storyContent.classList.remove("story-compact");
    }
  }

  if (queryModeActive && hasQueryHints) {
    updateSystemWithQueryTags(systemPanel, serviceText);
    if (hasReactSystem) {
      systemPanel?.classList.add("panel-react-overlay");
      const legacyContent = systemPanel?.querySelector(".panel-content");
      if (legacyContent) {
        legacyContent.innerHTML = "";
      }
    } else {
      systemPanel?.classList.remove("panel-react-overlay");
    }
    if (!hasReactService) {
      updateServicePanel(servicePanel, { text: "" });
      servicePanel?.classList.remove("panel-react-overlay");
    } else {
      servicePanel?.classList.add("panel-react-overlay");
      const legacyContent = servicePanel?.querySelector(".panel-content");
      if (legacyContent) {
        legacyContent.innerHTML = "";
      }
    }
  } else {
    if (hasReactSystem) {
      systemPanel?.classList.remove("panel-react-overlay");
    }
    // If a lever is active, show a lightweight preactive preview in System/Service panels
    if (activeLeverWidgetId && preactiveResponse) {
      const items = (preactiveResponse.previewItems || []).map(i => i.label || i.id).join(', ');
      updatePanel(systemPanel, { text: `Preview: ${preactiveResponse.type} — ${items}` });
      if (!hasReactService) {
        updateServicePanel(servicePanel, { text: `Preview: ${preactiveResponse.type} — ${items}`, actions: [] });
      }
    } else {
      updatePanel(systemPanel, currentStep.system);
      if (!hasReactService) {
        updateServicePanel(servicePanel, currentStep.service);
      }
    }
    servicePanel?.classList.toggle("panel-react-overlay", hasReactService);
    if (hasReactService) {
      const legacyContent = servicePanel?.querySelector(".panel-content");
      if (legacyContent) {
        legacyContent.innerHTML = "";
      }
    }
    appendPracticesToSystem();
  }

  updateContextStrip();
  emitQueryModeChange();
}

// ═══════════════════════════════════════════════════════════════════════════
// ШАБЛОНЫ СТРАНИЦ — Единая структура для всех типов узлов
// ═══════════════════════════════════════════════════════════════════════════
// 
// Все страницы Story-панели следуют единому шаблону из 3 блоков:
// 
// БЛОК 1: Header (.node-toc)
//   - Корневой виджет (.vova-scope-widget) + текст (nodeInfoHtml)
//   - При hover на корневой виджет → Scope Highlight (сумма всех виджетов)
// 
// БЛОК 2: Story Screen (.story-screen)
//   - 3D-фигура (shape-area) + ассет (asset-area) + точки навигации
// 
// БЛОК 3: Widget Groups (.widget-groups-row)
//   - Группы виджетов (.widget-group) с заголовками (.section-title)
//   - Каждый виджет (.highlight-widget) подсвечивает свой узел + соседей
// 
// ОБЯЗАТЕЛЬНЫЕ ВЫЗОВЫ в конце каждой функции:
//   1. bindHighlightWidgets(content)   — подсветка виджетов
//   2. bindVovaScopeWidget(content, node) — Scope Highlight корневого виджета
//   3. bindStoryScreen(content)    — интерактивность Story Screen
//   4. bindEmblemSwap(content)         — смена эмблем
//   5. hideSegmentPanel()              — скрыть сегмент-панель
// 
// Документация: docs/UI_STANDARDS.md → "Шаблон страницы"
// ═══════════════════════════════════════════════════════════════════════════

// === ШАБЛОН СТРАНИЦЫ ПЕРСОНАЖА ===
// pageTemplate: "character" в VISUAL_CONFIG.nodeTypes
// Редактируя эту функцию, изменяешь все страницы персонажей
// Октаэдр у всех персонажей, количество шаров = количество виджетов
function updateStoryWithPotential(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getNodeWidgetIcon(node);
  const domainNodeIds = getRelatedNodeIdsByType(node?.id, "domain");
  const practiceNodeIds = getRelatedNodeIdsByType(node?.id, "practice");
  const workbenchNodeIds = getRelatedNodeIdsByType(node?.id, "workbench");
  const collabNodeIds = getRelatedNodeIdsByType(node?.id, "collab");

  let html = "";
  if (widgetIcon) {
    const nodeInfoHtml = getNodeInfoHtml(node);
    html += `
      <div class="node-toc">
        <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
          </div>
        </div>
        ${nodeInfoHtml}
      </div>`;
  }
  html += renderStoryScreen();

  // Widget groups in horizontal row
  {
    html += `<div class="widget-groups-row">`;
    
    html += `<div class="widget-group">`;
    html += `<div class="section-title">${getSectionLabel("domain")}</div>`;
    html += `<div class="domain-widgets inline-widgets">`;
    html += domainNodeIds.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget-nav " data-node-id="${nodeId}" title="${escapeHtml(label)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(getDomainWidgetIcon(nodeId), "domain")}
          </div>
        </div>`;
    }).join("");
    html += `</div>`;
    html += `</div>`;

    html += `<div class="widget-group">`;
    html += `<div class="section-title">${getSectionLabel("workbench")}</div>`;
    html += `<div class="domain-widgets inline-widgets">`;
    html += workbenchNodeIds.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      const sharedClass = isWorkbenchShared(nodeId) ? " domain-widget--shared" : "";
      return `
        <div class="domain-widget highlight-widget widget-nav ${sharedClass}" data-node-id="${nodeId}" title="${escapeHtml(label)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(getWorkbenchWidgetIcon(nodeId), "workbench")}
          </div>
        </div>`;
    }).join("");
    html += `</div>`;
    html += `</div>`;

    html += `<div class="widget-group">`;
    html += `<div class="section-title">${getSectionLabel("collab")}</div>`;
    html += `<div class="domain-widgets inline-widgets">`;
    html += collabNodeIds.map((nodeId) => {
      const label = nodesById.get(nodeId)?.label || nodeId;
      return `
        <div class="domain-widget highlight-widget widget-nav " data-node-id="${nodeId}" title="${escapeHtml(label)}">
          <div class="widget-frame">
            ${getWidgetImageHtml(getCollabWidgetIcon(nodeId), "collab")}
          </div>
        </div>`;
    }).join("");
    html += `</div>`;
    html += `</div>`;
    
    html += `</div>`;

  }

  // Кнопка "Кабина" только для Руны
  if (node?.id === "character-runa") {
    html += `
      <div class="cabin-link-section">
        <button class="cabin-link-btn" data-cabin-id="cabin-runa" title="Перейти к Кабине Руны в Cryptocosm">
          Кабина
        </button>
      </div>`;
  }

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  bindStoryScreen(content);
  bindEmblemSwap(content);
  hideSegmentPanel();

  // Initialize octahedron in Story Screen shape area for ALL characters
  // Количество шаров = количество виджетов на странице персонажа
  const shapeArea = content.querySelector(".story-screen__shape-area");
  if (shapeArea) {
    // Collect all widget node IDs for octahedron vertices
    // Priority: domains, workbenches, collabs, practices
    const allWidgetIds = [
      ...domainNodeIds,
      ...workbenchNodeIds,
      ...collabNodeIds,
      ...practiceNodeIds
    ];
    // Используем все виджеты (или максимум 12 для icosahedron)
    const shapeNodeIds = allWidgetIds.slice(0, Math.min(allWidgetIds.length, 12));
    if (shapeNodeIds.length > 0) {
      initMiniShape("octa", shapeArea, shapeNodeIds, node.id);
    }
  }
}

// === VST 2D GRAPH — REMOVED ===
// Код удалён в рамках Track 6: Expressive Stacks
// 2D-граф VST больше не отображается в System panel
// Сцена будет переключаться через клик по корневому виджету

// === VST LAYER WIDGETS — REMOVED ===
// Виджеты слоёв графа удалены
// Будут заменены на Faceted Explorer в основной сцене

// === CHLADNI PATTERN SCREEN (VSTablichment) ===
let chladniSimulation = null;
let ChladniSimulationClass = null;

// === ОРБИТЫ ВОКРУГ УЗЛА VSTablishment ===
// !STABLE — НЕ ТРОГАТЬ БЕЗ СОГЛАСОВАНИЯ!
// Утверждено: 21 февраля 2026
// Документация: docs/UI_STANDARDS.md → "Механика орбит VSTablishment"
// Файл логики: render/src/effects/NodeOrbits.js
let vstablishmentOrbits = null;

function createVSTablishmentOrbits() {
  // Уничтожить предыдущие орбиты
  destroyVSTablishmentOrbits();
  
  // Проверить, что граф и сцена доступны
  if (!graph || !graph.scene()) {
    console.warn("[Orbits] Graph scene not available, retrying in 500ms...");
    setTimeout(createVSTablishmentOrbits, 500);
    return;
  }
  
  // Найти узел VSTablishment
  const node = nodesById.get("workbench-vova-vstablishment");
  if (!node) {
    console.warn("[Orbits] VSTablishment node not found");
    return;
  }
  
  // Создать орбиты в сцене
  vstablishmentOrbits = new NodeOrbits(graph.scene(), "workbench-vova-vstablishment");
  
  // Установить позицию по позиции узла
  vstablishmentOrbits.setPosition(node.x || 0, node.y || 0, node.z || 0);
  
  console.log("[Orbits] Created orbits for VSTablishment at position:", node.x, node.y, node.z);
}

function destroyVSTablishmentOrbits() {
  if (vstablishmentOrbits) {
    vstablishmentOrbits.dispose();
    vstablishmentOrbits = null;
    console.log("[Orbits] Destroyed VSTablishment orbits");
  }
}

function highlightVSTablishmentOrbit(orbitName) {
  if (vstablishmentOrbits) {
    vstablishmentOrbits.highlight(orbitName);
  }
}

function clearVSTablishmentOrbitHighlight() {
  if (vstablishmentOrbits) {
    vstablishmentOrbits.clearHighlight();
  }
}

function activateVSTablishmentOrbit(orbitName) {
  if (vstablishmentOrbits) {
    vstablishmentOrbits.activate(orbitName);
  }
}

function deactivateVSTablishmentOrbit() {
  if (vstablishmentOrbits) {
    vstablishmentOrbits.deactivate();
  }
}

function bindWindowWidgetsToOrbits(container) {
  // Привязать hover на виджеты Slate/Storage/Sanctum к орбитам
  const windowWidgets = container.querySelectorAll(".widget-window[data-window]");
  windowWidgets.forEach(widget => {
    const windowType = widget.dataset.window;
    // Только для Slate, Storage, Sanctum
    if (windowType === "slate" || windowType === "storage" || windowType === "sanctum") {
      widget.addEventListener("mouseenter", () => {
        highlightVSTablishmentOrbit(windowType);
      });
      widget.addEventListener("mouseleave", () => {
        clearVSTablishmentOrbitHighlight();
      });
    }
  });
  
  // Настроить обратную связь: hover/click на спутники → виджеты
  setupOrbitSatelliteInteraction(container);
}

// Raycaster для взаимодействия со спутниками орбит
const orbitRaycaster = new THREE.Raycaster();
const orbitMouse = new THREE.Vector2();
let hoveredSatelliteOrbit = null;

function setupOrbitSatelliteInteraction(container) {
  if (!vstablishmentOrbits || !graph) return;
  
  const canvas = graph.renderer().domElement;
  
  // Hover на спутники
  canvas.addEventListener("mousemove", (e) => {
    if (!vstablishmentOrbits) return;
    
    const rect = canvas.getBoundingClientRect();
    orbitMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    orbitMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    orbitRaycaster.setFromCamera(orbitMouse, graph.camera());
    const satellites = vstablishmentOrbits.getSatellites();
    const intersects = orbitRaycaster.intersectObjects(satellites);
    
    if (intersects.length > 0) {
      const orbitName = intersects[0].object.userData.orbitName;
      if (orbitName !== hoveredSatelliteOrbit) {
        hoveredSatelliteOrbit = orbitName;
        // Подпрыгивание виджета
        triggerWidgetBounce(container, orbitName);
        // Подсветка виджета (hover-эффект)
        clearWidgetHover(container);
        triggerWidgetHover(container, orbitName);
        // Подсветка спутника
        highlightVSTablishmentOrbit(orbitName);
      }
    } else if (hoveredSatelliteOrbit) {
      hoveredSatelliteOrbit = null;
      clearWidgetHover(container);
      clearVSTablishmentOrbitHighlight();
    }
  });
  
  // Click на спутники
  canvas.addEventListener("click", (e) => {
    if (!vstablishmentOrbits) return;
    
    const rect = canvas.getBoundingClientRect();
    orbitMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    orbitMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    orbitRaycaster.setFromCamera(orbitMouse, graph.camera());
    const satellites = vstablishmentOrbits.getSatellites();
    const intersects = orbitRaycaster.intersectObjects(satellites);
    
    if (intersects.length > 0) {
      const orbitName = intersects[0].object.userData.orbitName;
      console.log("[Orbits] Satellite clicked:", orbitName);
      // Открыть соответствующее окно
      if (activeAuxWindow === orbitName) {
        closeAuxWindow();
      } else {
        closeAuxWindow();
        openAuxWindow(orbitName);
      }
      // Предотвратить всплытие события к графу
      e.stopPropagation();
    }
  });
}

function triggerWidgetBounce(container, windowType) {
  const widget = container.querySelector(`.widget-window[data-window="${windowType}"]`);
  if (widget) {
    // Удалить и добавить анимацию для перезапуска
    widget.style.animation = "none";
    widget.offsetHeight; // Trigger reflow
    widget.style.animation = "widget-bounce 0.28s ease-out";
    // Очистить inline style после анимации, чтобы CSS :hover работал
    setTimeout(() => {
      widget.style.animation = "";
    }, 300);
  }
}

function triggerWidgetHover(container, windowType) {
  const widget = container.querySelector(`.widget-window[data-window="${windowType}"]`);
  if (widget) {
    widget.classList.add("widget-window--hover-from-orbit");
  }
}

function clearWidgetHover(container) {
  const widgets = container.querySelectorAll(".widget-window--hover-from-orbit");
  widgets.forEach(w => w.classList.remove("widget-window--hover-from-orbit"));
}

function renderChladniScreen() {
  // Chladni screen для VSTablishment — визуальный эффект вместо 3D-фигуры
  // Логика кнопок такая же как у Story: на шаге 0 только Вперед
  const iconNext = `
    <svg class="icon icon--arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M4.5 3.25 7.5 6l-3 2.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconPrev = `
    <svg class="icon icon--arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M7.5 3.25 4.5 6l3 2.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconPlus = `
    <svg class="icon icon--plus" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 2.75v6.5M2.75 6h6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  `;
  // Шаг 0: только кнопка Вперед, Назад и Развернуть скрыты
  return `
    <div class="story-screen chladni-screen" data-expanded="false" data-index="0">
      <div class="story-screen__hud">
        <div class="story-screen__label" aria-hidden="true"></div>
        <div class="story-screen__dots" aria-hidden="true">
          <button class="narrative-dot narrative-dot--control narrative-dot--hidden" type="button" data-action="prev" aria-label="Назад" title="Назад">${iconPrev}</button>
          <button class="narrative-dot narrative-dot--control" type="button" data-action="next" aria-label="Вперед" title="Вперёд">${iconNext}</button>
          <button class="narrative-dot narrative-dot--control narrative-dot--toggle narrative-dot--hidden" type="button" data-action="toggle" aria-label="Развернуть" title="Развернуть">${iconPlus}</button>
        </div>
      </div>
      <div class="story-screen__shape-area" aria-hidden="true">
        <canvas class="chladni-canvas"></canvas>
      </div>
      <div class="story-screen__viewport" aria-hidden="true"></div>
      <div class="story-screen__text" aria-live="polite">
        <div class="story-screen__title"></div>
        <div class="story-screen__detail"></div>
      </div>
    </div>
  `;
}

async function bindChladniScreen(container) {
  const screen = container.querySelector(".chladni-screen");
  if (!screen) return;
  
  const canvas = screen.querySelector(".chladni-canvas");
  const viewport = screen.querySelector(".story-screen__viewport");
  const shapeArea = screen.querySelector(".story-screen__shape-area");
  
  if (!canvas) return;
  
  // Устанавливаем фоновый ассет (как на странице Вовы)
  if (viewport) {
    viewport.style.backgroundImage = `url('${buildAssetPath("story/narrative/vova-01.png")}')`;
    viewport.style.backgroundSize = "cover";
    viewport.style.backgroundPosition = "center";
  }
  
  // Показываем shape area
  if (shapeArea) {
    shapeArea.style.display = "block";
  }
  
  // Уничтожаем предыдущую симуляцию
  if (chladniSimulation) {
    chladniSimulation.destroy();
    chladniSimulation = null;
  }
  
  // Динамический импорт
  if (!ChladniSimulationClass) {
    const module = await import("../effects/ChladniSimulation.js");
    ChladniSimulationClass = module.ChladniSimulation;
  }
  
  // Создаём симуляцию (белые частицы на прозрачном фоне)
  chladniSimulation = new ChladniSimulationClass(canvas, {
    particleCount: 2000,
    particleColor: "#ffffff",
    speed: 0.5,
    friction: 0.94,
    m: 3,
    n: 5,
    patternDuration: 5000 // 5 секунд на паттерн, потом рассеивание
  });
  
  // Сразу запускаем в режиме idle (облако)
  chladniSimulation.start();
}

// === ВИДЖЕТЫ ПОТЕНЦИАЛА (фильтры, группировки) ===
// Виджеты для раскрытия потенциала воркбенча
// Поведение: подсветка рамки при hover, подпрыгивание
function bindPotentialWidgets(container) {
  const widgets = container.querySelectorAll(".node-widget--potential");
  
  widgets.forEach(widget => {
    const potentialId = widget.dataset.potentialId;
    
    // Hover: подсветка рамки
    widget.addEventListener("mouseenter", () => {
      widget.classList.add("potential-active");
    });
    
    widget.addEventListener("mouseleave", () => {
      widget.classList.remove("potential-active");
    });
    
    // Click: открыть Segment панель
    widget.addEventListener("click", () => {
      console.log(`[Potential] Widget clicked: ${potentialId}`);
      showSegmentPanel();
    });
  });
}

function renderStoryScreen() {
  // === STORY SCREEN LOGIC ===
  // Шаг 0 (свернутое): только кнопка "Вперед" (крайняя справа)
  // Шаг 1+: три кнопки — Назад, Вперед, Развернуть
  // Развернутое: три кнопки + название "Story"
  // Переход на шаг 0 = автосворачивание
  const iconPrev = `
    <svg class="icon icon--arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M7.5 3.25 4.5 6l3 2.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconNext = `
    <svg class="icon icon--arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M4.5 3.25 7.5 6l-3 2.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconPlus = `
    <svg class="icon icon--plus" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 2.75v6.5M2.75 6h6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  `;
  const iconClose = `
    <svg class="icon icon--close" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  `;
  // Порядок кнопок: Назад (скрыта на шаге 0), Вперед, Развернуть (скрыта на шаге 0)
  return `
    <div class="story-screen" data-expanded="false" data-index="0">
      <div class="story-screen__hud">
        <div class="story-screen__label" aria-hidden="true"></div>
        <div class="story-screen__dots" aria-hidden="true">
          <button class="narrative-dot narrative-dot--control narrative-dot--hidden" type="button" data-action="prev" aria-label="Назад" title="Назад">${iconPrev}</button>
          <button class="narrative-dot narrative-dot--control" type="button" data-action="next" aria-label="Вперед" title="Вперёд">${iconNext}</button>
          <button class="narrative-dot narrative-dot--control narrative-dot--toggle narrative-dot--hidden" type="button" data-action="toggle" aria-label="Развернуть" title="Развернуть">${iconPlus}</button>
        </div>
      </div>
      <div class="story-screen__shape-area" aria-hidden="true"></div>
      <div class="story-screen__viewport" aria-hidden="true"></div>
      <div class="story-screen__text" aria-live="polite">
        <div class="story-screen__title"></div>
        <div class="story-screen__detail"></div>
      </div>
    </div>
  `;
}

function bindStoryScreen(container) {
  // === STORY SCREEN BINDING ===
  // !STABLE — НЕ ТРОГАТЬ БЕЗ СОГЛАСОВАНИЯ
  // @status: canonical
  // @track: 4
  // @since: 2026-02-21
  // @approved: 2026-02-21
  // @docs: docs/UI_STANDARDS.md#story-screen
  // @implements: story-screen
  //
  // Логика состояний:
  // - Шаг 0: только кнопка "Вперед", без названия, навигационный режим
  // - Шаг 1+: три кнопки (Назад, Вперед, Развернуть), можно развернуть
  // - Развернутое: три кнопки + название "Story", кнопка с крестиком (X)
  // - Переход на шаг 0 = автосворачивание
  const screen = container.querySelector(".story-screen");
  if (!screen) return;
  const toggle = screen.querySelector(".narrative-dot--toggle");
  const prevButton = screen.querySelector(".narrative-dot[data-action='prev']");
  const nextButton = screen.querySelector(".narrative-dot[data-action='next']");
  const labelEl = screen.querySelector(".story-screen__label");
  const titleEl = screen.querySelector(".story-screen__title");
  const detailEl = screen.querySelector(".story-screen__detail");
  const viewport = screen.querySelector(".story-screen__viewport");
  const shapeArea = screen.querySelector(".story-screen__shape-area");
  if (!nextButton || nextButton.dataset.bound) return;
  nextButton.dataset.bound = "true";

  // Иконки для toggle
  const iconPlus = `<svg class="icon icon--plus" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 2.75v6.5M2.75 6h6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>`;
  const iconClose = `<svg class="icon icon--close" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>`;

  function updateControlsState(index) {
    const slide = STORY_SLIDES[index];
    const isStep0 = index === 0;
    const canGoForward = index < STORY_SLIDES.length - 1;
    const expanded = screen.classList.contains("story-screen--expanded");
    
    // Шаг 0: скрыть Назад и Развернуть, показать только Вперед
    if (prevButton) {
      prevButton.classList.toggle("narrative-dot--hidden", isStep0);
    }
    if (toggle) {
      toggle.classList.toggle("narrative-dot--hidden", isStep0);
    }
    
    // Вперед: disabled если нет следующего слайда
    if (nextButton) {
      nextButton.classList.toggle("narrative-dot--disabled", !canGoForward);
      nextButton.disabled = !canGoForward;
    }
    
    // Название "Story" только в развернутом состоянии
    if (labelEl) {
      labelEl.textContent = expanded ? "Story" : "";
    }
    
    // Toggle иконка: плюс или крестик
    if (toggle) {
      toggle.innerHTML = expanded ? iconClose : iconPlus;
      toggle.setAttribute("aria-label", expanded ? "Свернуть" : "Развернуть");
      toggle.setAttribute("title", expanded ? "Свернуть" : "Развернуть");
    }
    
    // Показать/скрыть shape area (только на шаге 0 и не развернуто)
    if (shapeArea) {
      shapeArea.style.display = isStep0 && !expanded ? "block" : "none";
    }
  }

  function setSlide(index) {
    const safeIndex = Math.max(0, Math.min(STORY_SLIDES.length - 1, index));
    const slide = STORY_SLIDES[safeIndex];
    screen.dataset.index = String(safeIndex);
    if (viewport) {
      viewport.style.backgroundImage = slide ? `url('${slide.src}')` : "";
      viewport.style.backgroundSize = "cover";
      viewport.style.backgroundPosition = "center";
    }
    if (titleEl) titleEl.textContent = slide?.title || "";
    if (detailEl) {
      const expanded = screen.classList.contains("story-screen--expanded");
      detailEl.textContent = expanded ? slide?.detail || "" : "";
    }
    updateControlsState(safeIndex);
  }

  function syncExpandedBounds() {
    if (!screen.classList.contains("story-screen--expanded")) return;
    const overlay = document.getElementById("scene-overlay");
    const panels = document.getElementById("panels-container");
    if (!overlay || !panels) return;
    const sceneStage = document.getElementById("scene-stage");
    const scaleValue = sceneStage
      ? parseFloat(getComputedStyle(sceneStage).getPropertyValue("--scene-scale"))
      : 1;
    const scale = Number.isFinite(scaleValue) && scaleValue > 0 ? scaleValue : 1;
    const overlayRect = overlay.getBoundingClientRect();
    const panelsRect = panels.getBoundingClientRect();
    const left = (panelsRect.left - overlayRect.left) / scale;
    const top = (panelsRect.top - overlayRect.top) / scale;
    const width = panelsRect.width / scale;
    const height = panelsRect.height / scale;
    screen.style.left = `${left}px`;
    screen.style.top = `${top}px`;
    screen.style.width = `${width}px`;
    screen.style.height = `${height}px`;
  }

  function collapseScreen() {
    if (!screen.classList.contains("story-screen--expanded")) return;
    const overlay = document.getElementById("scene-overlay");
    screen.classList.remove("story-screen--expanded");
    screen.dataset.expanded = "false";
    document.body.classList.remove("narrative-expanded");
    if (overlay) overlay.classList.remove("scene-overlay--active");
    const placeholder = document.querySelector(".story-screen-placeholder");
    if (placeholder && placeholder.parentElement) {
      placeholder.parentElement.insertBefore(screen, placeholder);
      placeholder.remove();
    }
    screen.style.left = "";
    screen.style.top = "";
    screen.style.width = "";
    screen.style.height = "";
    // Обновить состояние контролов после сворачивания
    updateControlsState(Number(screen.dataset.index || 0));
  }

  toggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const overlay = document.getElementById("scene-overlay");
    if (!overlay) return;
    const wasExpanded = screen.classList.contains("story-screen--expanded");
    if (wasExpanded) {
      collapseScreen();
    } else {
      // Разворачиваем
      screen.classList.add("story-screen--expanded");
      screen.dataset.expanded = "true";
      document.body.classList.add("narrative-expanded");
      document.body.classList.remove("focus-story", "focus-segment", "focus-system", "focus-service");
      overlay.classList.add("scene-overlay--active");
      const placeholder = document.createElement("div");
      placeholder.className = "story-screen-placeholder";
      screen.dataset.placeholderId = "narrative-placeholder";
      screen.parentElement?.insertBefore(placeholder, screen);
      overlay.appendChild(screen);
      syncExpandedBounds();
    }
    setSlide(Number(screen.dataset.index || 0));
  });

  prevButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const current = Number(screen.dataset.index || 0);
    const nextIndex = current - 1;
    
    // Переход на шаг 0 = автосворачивание
    if (nextIndex === 0) {
      collapseScreen();
    }
    setSlide(nextIndex);
  });

  nextButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const current = Number(screen.dataset.index || 0);
    setSlide(current + 1);
  });

  setSlide(0);

  window.addEventListener("resize", syncExpandedBounds);
  document.addEventListener("fullscreenchange", syncExpandedBounds);
}

function isRootNode(node) {
  return node && node.type === "root";
}

function isHubNode(node) {
  return node && node.type === "hub";
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

// ═══════════════════════════════════════════════════════════════════════════
// ВИДЖЕТЫ ОКОН (Slate, Storage, Sanctum)
// ═══════════════════════════════════════════════════════════════════════════
// @status: canonical
// @track: 4
// @since: 2026-02-21
// @docs: docs/UI_STANDARDS.md#window-widgets
//
// Квадратные виджеты 48×48px для вызова дополнительных окон.
// Расположены на всех страницах воркбенчей (Блок 4).
// Hover: подпрыгивание, индивидуальные подменные лого (*-plug2.png)
// ═══════════════════════════════════════════════════════════════════════════

// Конфигурация окон берётся из VISUAL_CONFIG.windows
// Единый источник данных: render/src/visual/config.js
// Документация: docs/UI_STANDARDS.md#окна-интерфейса

// Текущее открытое вспомогательное окно (slate, storage, sanctum или null)
let activeAuxWindow = null;

function renderWindowWidgets() {
  const renderWidget = (windowType) => {
    const config = VISUAL_CONFIG.windows[windowType];
    return `
      <div class="widget-group">
        <div class="section-title">${config.title}</div>
        <div class="node-widget widget-window" data-window="${windowType}" title="${config.title} — ${config.hint}">
          <div class="widget-frame">
            <img src="${buildAssetPath(`widgets/${windowType}-plug.png`)}" alt="${config.title}" class="widget-image widget-image--main" />
            <img src="${buildAssetPath(`widgets/${windowType}-plug2.png`)}" alt="" class="widget-image widget-image--hover" aria-hidden="true" />
          </div>
        </div>
      </div>`;
  };
  
  return `
    <div class="widget-windows-row">
      ${renderWidget("slate")}
      ${renderWidget("storage")}
      ${renderWidget("sanctum")}
    </div>
    <!-- @status: experimental | @track: 4 | @expires: 2026-03-21 | @reason: Тестовая группа для проверки закрытия окон -->
    <div class="widget-windows-row widget-windows-row--test">
      <div class="widget-group">
        <div class="section-title">Тест</div>
        <div class="node-widget widget-window widget-window--test" data-window="test" title="Тестовый виджет">
          <div class="widget-frame widget-frame--empty"></div>
        </div>
      </div>
    </div>
  `;
}

function bindWindowWidgets(container) {
  const windowWidgets = container.querySelectorAll(".widget-window[data-window]");
  windowWidgets.forEach(widget => {
    widget.addEventListener("click", () => {
      const windowType = widget.dataset.window;
      
      // Тестовый виджет — закрывает любое вспомогательное окно
      if (windowType === "test") {
        closeAuxWindow();
        return;
      }
      
      // Триггер фигуры Хладни на VSTablishment
      // TODO: Позже привяжем конкретные паттерны и звуки к каждому виджету
      if (chladniSimulation && ["slate", "storage", "sanctum"].includes(windowType)) {
        chladniSimulation.triggerFlashPattern(windowType);
      }
      
      // Клик на тот же виджет — закрыть окно
      if (activeAuxWindow === windowType) {
        closeAuxWindow();
        return;
      }
      
      // Клик на другой виджет группы — закрыть текущее, открыть новое
      closeAuxWindow();
      openAuxWindow(windowType);
    });
  });
}

function openAuxWindow(windowType) {
  activeAuxWindow = windowType;
  
  if (windowType === "storage") {
    showStoragePanel();
  } else if (windowType === "slate") {
    showSlatePanel();
  } else if (windowType === "sanctum") {
    showSanctumPanel();
  }
  
  // Подсветить активный виджет
  updateActiveWindowWidget();
  
  // Активировать поле орбиты (если на странице VSTablishment)
  activateVSTablishmentOrbit(windowType);
}

function closeAuxWindow() {
  if (!activeAuxWindow) return;
  
  if (activeAuxWindow === "storage") {
    hideStoragePanel();
  } else if (activeAuxWindow === "slate") {
    hideSlatePanel();
  } else if (activeAuxWindow === "sanctum") {
    hideSanctumPanel();
  }
  
  activeAuxWindow = null;
  updateActiveWindowWidget();
  
  // Деактивировать поле орбиты
  deactivateVSTablishmentOrbit();
}

function updateActiveWindowWidget() {
  const widgets = document.querySelectorAll(".widget-window[data-window]");
  widgets.forEach(w => {
    const isActive = w.dataset.window === activeAuxWindow;
    w.classList.toggle("widget-window--active", isActive);
  });
}

// === ШАБЛОН СТРАНИЦЫ ВОРКБЕНЧА ===
// pageTemplate: "workbench" в VISUAL_CONFIG.nodeTypes
// Редактируя эту функцию, изменяешь все страницы воркбенчей
function updateStoryWithWorkbench(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getWorkbenchWidgetIcon(node.id);
  const nodeInfoHtml = getNodeInfoHtml(node);

  let html = `
    <div class="node-toc">
      <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
        </div>
      </div>
      ${nodeInfoHtml}
    </div>`;

  // Специальная обработка для VSTablichment — Chladni-эффект (флаги убраны)
  if (node.id === "workbench-vova-vstablishment") {
    html += renderChladniScreen();
  } else {
    html += renderStoryScreen();
  }

  // Блок 4: Виджеты окон (Slate, Storage, Sanctum) — на всех воркбенчах
  html += renderWindowWidgets();

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  bindWindowWidgets(content);
  
  if (node.id === "workbench-vova-vstablishment") {
    bindChladniScreen(content);
    bindStoryScreen(content); // Навигация Story работает и на Chladni screen
    bindPotentialWidgets(content);
    // Создать орбиты вокруг узла в графе
    createVSTablishmentOrbits();
    // Привязать hover на виджеты окон к орбитам
    bindWindowWidgetsToOrbits(content);
    // Storage панель открывается по клику на виджет, не автоматически
    hideSegmentPanel();
  } else {
    bindStoryScreen(content);
    hideSegmentPanel();
  }
  bindEmblemSwap(content);
}

// === SEGMENT PANEL (центральная панель для VSTablishment) ===
// !STABLE — НЕ ТРОГАТЬ БЕЗ СОГЛАСОВАНИЯ
// @status: canonical
// @track: 4
// @since: 2026-02-21
// @approved: 2026-02-21
//
// Логика поведения:
// - Три кнопки: Перемотка (>>|<<), Назад, Закрыть
// - Перемотка: сдвигает панель вправо, скрывая System/Service
// - Переключение виджетов НЕ сбрасывает положение панели
// - Закрытие (Назад/Закрыть) сбрасывает положение панели
// - Focus поведение (scale, opacity) работает в любом положении
let segmentExpanded = false; // Состояние расширения панели

function renderSegmentControls() {
  const el = document.getElementById("segment-controls");
  if (!el) return;
  
  const iconPrev = `
    <svg class="icon icon--arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M7.5 3.25 4.5 6l3 2.75" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconExpandRight = `
    <svg class="icon icon--expand" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M3 3.25 5.5 6 3 8.75M6.5 3.25 9 6 6.5 8.75" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconExpandLeft = `
    <svg class="icon icon--expand" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M9 3.25 6.5 6 9 8.75M5.5 3.25 3 6 5.5 8.75" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  const iconClose = `
    <svg class="icon icon--close" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  
  el.innerHTML = [
    {
      label: segmentExpanded ? iconExpandLeft : iconExpandRight,
      action: "segment-expand",
      title: segmentExpanded ? "Свернуть" : "Развернуть",
    },
    {
      label: iconPrev,
      action: "segment-back",
      title: "Назад",
    },
    {
      label: iconClose,
      action: "segment-close",
      title: "Закрыть",
    },
  ]
    .map(({ label, action, title }) => {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<button class="scene-dot scene-dot--control" type="button" data-action="${action}"${titleAttr}>${label}</button>`;
    })
    .join("");
}

function bindSegmentControls() {
  const controlsEl = document.getElementById("segment-controls");
  if (!controlsEl) return;
  
  controlsEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "segment-expand") {
      toggleSegmentExpand();
    } else if (action === "segment-back") {
      resetSegmentExpand(); // Сбросить расширение при закрытии
      closeAuxWindow();
    } else if (action === "segment-close") {
      resetSegmentExpand(); // Сбросить расширение при закрытии
      closeAuxWindow();
    }
  });
}

function toggleSegmentExpand() {
  segmentExpanded = !segmentExpanded;
  applySegmentExpand();
}

function applySegmentExpand() {
  const storagePanel = document.getElementById("storage-panel");
  const rightColumn = document.getElementById("right-column");
  const graphSpacer = storagePanel?.closest(".graph-spacer");
  
  if (segmentExpanded) {
    // Расширить: сдвинуть spacer вправо, скрыть правую колонку
    graphSpacer?.classList.add("spacer-expanded");
    rightColumn?.classList.add("right-column--hidden");
  } else {
    // Свернуть: вернуть spacer в центр, показать правую колонку
    graphSpacer?.classList.remove("spacer-expanded");
    rightColumn?.classList.remove("right-column--hidden");
  }
  
  // Перерисовать кнопки (чтобы иконка сменилась)
  renderSegmentControls();
}

// ═══════════════════════════════════════════════════════════════════════════
// УПРАВЛЯЮЩИЕ ТОЧКИ SYSTEM И SERVICE
// ═══════════════════════════════════════════════════════════════════════════
// @status: experimental
// @track: 4
// @reason: Набросок будущего функционала управляющих точек

function renderSystemControls() {
  const el = document.getElementById("system-controls");
  if (!el) return;
  
  const controls = [
    { label: "I", action: "system-info", title: "Информация" },
    { label: "S", action: "system-spec", title: "Спецификация" },
    { label: "P", action: "system-projection", title: "Проекция" },
  ];
  
  el.innerHTML = controls
    .map(({ label, action, title }) => {
      return `<button class="scene-dot scene-dot--control scene-dot--letter" type="button" data-action="${action}" title="${title}">${label}</button>`;
    })
    .join("");
}

function renderServiceControls() {
  const el = document.getElementById("service-controls");
  if (!el) return;
  
  // Три горизонтальные полоски (аллегория текста/чата)
  const iconLines = `
    <svg class="icon icon--lines" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2 3.5h8M2 6h8M2 8.5h8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    </svg>
  `;
  
  const controls = [
    { label: iconLines, action: "service-chat", title: "Чат" },
  ];
  
  el.innerHTML = controls
    .map(({ label, action, title }) => {
      return `<button class="scene-dot scene-dot--control" type="button" data-action="${action}" title="${title}">${label}</button>`;
    })
    .join("");
}

function bindSystemControls() {
  const controlsEl = document.getElementById("system-controls");
  if (!controlsEl) return;
  
  controlsEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    // TODO: Реализовать функционал управляющих точек
    console.log("[System Control]", action);
  });
}

function bindServiceControls() {
  const controlsEl = document.getElementById("service-controls");
  if (!controlsEl) return;
  
  controlsEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    // TODO: Реализовать функционал управляющих точек
    console.log("[Service Control]", action);
  });
}

function resetSegmentExpand() {
  if (segmentExpanded) {
    segmentExpanded = false;
    applySegmentExpand();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ВСПОМОГАТЕЛЬНЫЕ ОКНА (Slate, Storage, Sanctum)
// ═══════════════════════════════════════════════════════════════════════════
// @status: canonical
// @track: 4
// @since: 2026-02-21
// @docs: docs/UI_STANDARDS.md#aux-windows
//
// Окна открываются по клику на виджеты в Scope.
// Закрываются: крестиком, кликом на другой виджет группы, шагом Назад.
// Структура: корневой виджет + Story внутри с логикой состояний.
// ═══════════════════════════════════════════════════════════════════════════

function renderAuxWindowContent(windowType) {
  const config = VISUAL_CONFIG.windows[windowType];
  const widgetIcon = buildAssetPath(`widgets/${windowType}-plug.png`);
  
  return `
    <div class="node-toc">
      <div class="node-widget node-widget--aux-root">
        <div class="widget-frame">
          <img src="${widgetIcon}" alt="${config.title}" />
        </div>
      </div>
      <div class="vova-root-info">
        <div>${config.description}</div>
      </div>
    </div>
    ${renderStoryScreen()}
  `;
}

function showStoragePanel() {
  const panel = document.getElementById("storage-panel");
  if (!panel) return;
  
  panel.classList.add("segment-visible");
  renderSegmentControls();
  
  const content = panel.querySelector(".panel-content");
  if (content) {
    content.innerHTML = renderAuxWindowContent("storage");
    bindStoryScreen(content);
  }
}

function hideStoragePanel() {
  const panel = document.getElementById("storage-panel");
  if (!panel) return;
  panel.classList.remove("segment-visible");
}

function showSlatePanel() {
  const panel = document.getElementById("storage-panel");
  if (!panel) return;
  
  panel.classList.add("segment-visible");
  const titleEl = panel.querySelector(".panel-title-text");
  if (titleEl) titleEl.textContent = "Slate";
  renderSegmentControls();
  
  const content = panel.querySelector(".panel-content");
  if (content) {
    content.innerHTML = renderAuxWindowContent("slate");
    bindStoryScreen(content);
  }
}

function hideSlatePanel() {
  const panel = document.getElementById("storage-panel");
  if (!panel) return;
  panel.classList.remove("segment-visible");
  const titleEl = panel.querySelector(".panel-title-text");
  if (titleEl) titleEl.textContent = "Storage";
}

function showSanctumPanel() {
  const panel = document.getElementById("storage-panel");
  if (!panel) return;
  
  panel.classList.add("segment-visible");
  const titleEl = panel.querySelector(".panel-title-text");
  if (titleEl) titleEl.textContent = "Sanctum";
  renderSegmentControls();
  
  const content = panel.querySelector(".panel-content");
  if (content) {
    content.innerHTML = renderAuxWindowContent("sanctum");
    bindStoryScreen(content);
  }
}

function hideSanctumPanel() {
  const panel = document.getElementById("storage-panel");
  if (!panel) return;
  panel.classList.remove("segment-visible");
  const titleEl = panel.querySelector(".panel-title-text");
  if (titleEl) titleEl.textContent = "Storage";
}

function hideSegmentPanel() {
  closeAuxWindow();
}

// === ШАБЛОН СТРАНИЦЫ КОЛЛАБА ===
// pageTemplate: "collab" в VISUAL_CONFIG.nodeTypes
// Редактируя эту функцию, изменяешь все страницы коллабов
function updateStoryWithCollab(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getCollabWidgetIcon(node.id);
  const nodeInfoHtml = getNodeInfoHtml(node);

  let html = `
    <div class="node-toc">
      <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
        </div>
      </div>
      ${nodeInfoHtml}
    </div>`;

  html += renderStoryScreen();

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  bindStoryScreen(content);
  bindEmblemSwap(content);
  hideSegmentPanel();
}

// === ШАБЛОН СТРАНИЦЫ ХАБА ===
// @status: canonical
// @track: 4
// @since: 2026-02-21
// @docs: docs/UI_STANDARDS.md#hub-pages
// @implements: hub-page-template
//
// pageTemplate: "hub" в VISUAL_CONFIG.nodeTypes
// Редактируя эту функцию, изменяешь все страницы хабов (Characters, Domains)
// ВАЖНО: Хабы НЕ содержат окно Story — это транспортные узлы без повествования
// Вместо Story показываем увеличенную 3D-фигуру (2x от стандартного размера)
function updateStoryWithHub(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");
  
  // Добавляем класс для страницы Domains (уменьшенный куб)
  content.classList.remove("panel-content--domains");
  if (node.id === "domains") {
    content.classList.add("panel-content--domains");
  }

  const widgetIcon = getHubWidgetIcon(node.id);
  const nodeInfoHtml = getNodeInfoHtml(node);
  
  // Получаем соседей из единой карты графа (links/edges)
  const characterNodeIds = getRelatedNodeIdsByType(node.id, "character");
  const domainNodeIds = getRelatedNodeIdsByType(node.id, "domain");
  
  // Собираем все дочерние узлы с их типами
  const characterNodes = characterNodeIds.map(id => nodesById.get(id)).filter(Boolean);
  const domainNodes = domainNodeIds.map(id => nodesById.get(id)).filter(Boolean);

  let html = "";
  
  // Заголовок с виджетом хаба
  html += `
    <div class="node-toc">
      <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(widgetIcon, "hub", { isRoot: true })}
        </div>
      </div>
      ${nodeInfoHtml}
    </div>`;

  // Увеличенная 3D-фигура вместо Story (хабы — транспортные узлы)
  html += `<div class="hub-shape-container" aria-hidden="true"></div>`;

  // Виджеты дочерних узлов (из единой карты графа)
  const hasWidgets = characterNodes.length > 0 || domainNodes.length > 0;
  if (hasWidgets) {
    html += `<div class="widget-groups-row">`;
    
    // Секция персонажей (без заголовка, как флаги на VSTablishment)
    if (characterNodes.length > 0) {
      html += `<div class="character-widgets-row">`;
      
      for (const childNode of characterNodes) {
        html += `
          <div class="domain-widget highlight-widget widget-nav" data-node-id="${childNode.id}" title="${escapeHtml(childNode.label || childNode.id)}">
            <div class="widget-frame">
              ${getWidgetImageHtml(getCharacterWidgetIcon(), "character")}
            </div>
          </div>`;
      }
      
      html += `</div>`;
    }
    
    // Секция доменов (без заголовка, центрированная сетка 4 в ряд)
    if (domainNodes.length > 0) {
      html += `<div class="domain-widgets-row">`;
      
      for (const childNode of domainNodes) {
        html += `
          <div class="domain-widget highlight-widget widget-nav" data-node-id="${childNode.id}" title="${escapeHtml(childNode.label || childNode.id)}">
            <div class="widget-frame">
              ${getWidgetImageHtml(getDomainWidgetIcon(childNode.id), "domain")}
            </div>
          </div>`;
      }
      
      html += `</div>`;
    }
    
    html += `</div>`;
  }

  // Секция виджетов практик (только для страницы Domains)
  // 14 виджетов: 6 + 6 + 2 (центрированные)
  if (node.id === "domains") {
    const practices = (VISUAL_CONFIG.practices || []).filter(p => !p.hidden);
    if (practices.length > 0) {
      html += `<div class="practice-widgets-section">`;
      html += `<div class="section-title">${getSectionLabel("practice")}</div>`;
      html += `<div class="practice-widgets-grid">`;
      
      // Разбиваем на ряды: 6 + 6 + остаток (центрированный)
      const row1 = practices.slice(0, 6);
      const row2 = practices.slice(6, 12);
      const row3 = practices.slice(12);
      
      const renderRow = (items) => {
        let rowHtml = `<div class="practice-widgets-row">`;
        for (const practice of items) {
          const isActive = activePracticeId === practice.id;
          rowHtml += `
            <div class="practice-widget${isActive ? " practice-widget--active" : ""}" 
                 data-practice-id="${practice.id}"
                 style="--practice-color: ${practice.color}"
                 title="${escapeHtml(practice.label)}">
              <div class="widget-frame">
                <img src="${buildAssetPath("widgets/practice-plug.png")}" alt="${escapeHtml(practice.label)}" class="widget-image widget-image--main" />
                <img src="${buildAssetPath("widgets/practice-plug2.png")}" alt="" class="widget-image widget-image--hover" aria-hidden="true" />
              </div>
            </div>`;
        }
        rowHtml += `</div>`;
        return rowHtml;
      };
      
      if (row1.length > 0) html += renderRow(row1);
      if (row2.length > 0) html += renderRow(row2);
      if (row3.length > 0) html += renderRow(row3);
      
      html += `</div>`;
      html += `</div>`;
    }
  }

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  // НЕ вызываем bindStoryScreen — на хабах нет Story
  bindEmblemSwap(content);
  hideSegmentPanel();
  
  // Привязать обработчики кнопок практик
  if (node.id === "domains") {
    bindPracticeButtons(content);
    bindGlowToggleButton(content);
  }

  // Инициализация 3D-фигуры (1.33x от стандартного размера, было 2x)
  const shapeContainer = content.querySelector(".hub-shape-container");
  const allChildIds = [...characterNodeIds, ...domainNodeIds];
  if (shapeContainer && allChildIds.length > 0) {
    const shapeType = characterNodes.length > 0 ? "icosa" : "cube";
    initMiniShape(shapeType, shapeContainer, allChildIds, node.id, { scale: 1.33 });
  }
}

// === ШАБЛОН СТРАНИЦЫ СИСТЕМНОГО УЗЛА ===
// pageTemplate: "root" в VISUAL_CONFIG.nodeTypes
// Редактируя эту функцию, изменяешь все страницы системных узлов (Universe, Cryptocosm)
function updateStoryWithRoot(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getRootWidgetIcon(node.id);
  const nodeInfoHtml = getNodeInfoHtml(node);
  
  // Получаем соседей из единой карты графа (links/edges)
  const hubNodeIds = getRelatedNodeIdsByType(node.id, "hub");
  const rootNodeIds = getRelatedNodeIdsByType(node.id, "root");
  
  const hubNodes = hubNodeIds.map(id => nodesById.get(id)).filter(Boolean);
  const otherRootNodes = rootNodeIds.map(id => nodesById.get(id)).filter(Boolean);

  let html = "";
  
  // Заголовок с виджетом root
  html += `
    <div class="node-toc">
      <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(widgetIcon, "root", { isRoot: true })}
        </div>
      </div>
      ${nodeInfoHtml}
    </div>`;

  // Story Screen
  html += renderStoryScreen();

  // Виджеты связанных узлов
  const hasWidgets = hubNodes.length > 0 || otherRootNodes.length > 0;
  if (hasWidgets) {
    html += `<div class="widget-groups-row">`;
    
    // Секция хабов
    if (hubNodes.length > 0) {
      html += `<div class="widget-group">`;
      html += `<div class="section-title">${getSectionLabel("hub")}</div>`;
      html += `<div class="domain-widgets inline-widgets">`;
      
      for (const hubNode of hubNodes) {
        html += `
          <div class="domain-widget highlight-widget widget-nav" data-node-id="${hubNode.id}" title="${escapeHtml(hubNode.label || hubNode.id)}">
            <div class="widget-frame">
              ${getWidgetImageHtml(getHubWidgetIcon(hubNode.id), "hub")}
            </div>
          </div>`;
      }
      
      html += `</div>`;
      html += `</div>`;
    }
    
    // Секция других root-узлов (Cryptocosm и т.д.)
    if (otherRootNodes.length > 0) {
      html += `<div class="widget-group">`;
      html += `<div class="section-title">${getSectionLabel("root")}</div>`;
      html += `<div class="domain-widgets inline-widgets">`;
      
      for (const rootNode of otherRootNodes) {
        html += `
          <div class="domain-widget highlight-widget widget-nav" data-node-id="${rootNode.id}" title="${escapeHtml(rootNode.label || rootNode.id)}">
            <div class="widget-frame">
              ${getWidgetImageHtml(getRootWidgetIcon(rootNode.id), "root")}
            </div>
          </div>`;
      }
      
      html += `</div>`;
      html += `</div>`;
    }
    
    html += `</div>`;
  }

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  bindStoryScreen(content);
  bindEmblemSwap(content);
  hideSegmentPanel();

  // Инициализация фигуры в shape area (октаэдр для root)
  const shapeArea = content.querySelector(".story-screen__shape-area");
  const allChildIds = [...hubNodes.map(n => n.id), ...otherRootNodes.map(n => n.id)];
  if (shapeArea && allChildIds.length > 0) {
    initMiniShape("octa", shapeArea, allChildIds, node.id);
  }
}

// === ШАБЛОН СТРАНИЦЫ ДОМЕНА ===
// pageTemplate: "domain" в VISUAL_CONFIG.nodeTypes
// Редактируя эту функцию, изменяешь все страницы доменов
function updateStoryWithDomainFocus(panel, node) {
  const content = panel?.querySelector(".panel-content");
  if (!content) return;

  destroyMiniCube();
  content.classList.remove("story-compact");

  const widgetIcon = getDomainWidgetIcon(node.id);
  const nodeInfoHtml = getNodeInfoHtml(node);

  let html = `
    <div class="node-toc">
      <div class="node-widget node-widget--scope node-widget--root vova-scope-widget" data-node-id="${escapeHtml(node.id)}" title="${escapeHtml(node.label || node.id)}">
        <div class="widget-frame">
          ${getWidgetImageHtml(widgetIcon, "widget", { isRoot: true })}
        </div>
      </div>
      ${nodeInfoHtml}
    </div>`;

  html += renderStoryScreen();

  content.innerHTML = html;
  bindHighlightWidgets(content);
  bindVovaScopeWidget(content, node);
  bindStoryScreen(content);
  bindEmblemSwap(content);
  hideSegmentPanel();
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
      <div class="domain-widget " data-node-id="${widget.nodeId}" title="${widget.label}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getDomainWidgetIcon(widget.nodeId), "domain")}
        </div>
      </div>`;
  }
  html += `</div>`;

  // Секция практик (кнопки для полигонов)
  const practices = VISUAL_CONFIG.practices || [];
  if (practices.length > 0) {
    html += `<div class="practices-section">`;
    html += `<div class="section-title">${getSectionLabel("practice")}</div>`;
    html += `<div class="practice-buttons">`;
    
    for (const practice of practices) {
      const isActive = activePracticeId === practice.id;
      html += `
        <button class="practice-btn${isActive ? " practice-btn--active" : ""}" 
                data-practice-id="${practice.id}"
                style="--practice-color: ${practice.color}"
                title="${escapeHtml(practice.label)}">
          ${escapeHtml(practice.label)}
        </button>`;
    }
    
    // Кнопка "Свечение" для включения glow-эффекта узла-хаба
    html += `
      <button class="practice-btn glow-toggle-btn" 
              data-node-id="domains"
              style="--practice-color: #fbbf24"
              title="Включить свечение узла">
        Свечение
      </button>`;
    
    html += `</div>`;
    html += `</div>`;
  }

  content.innerHTML = html;
  bindTagPills(content);
  bindEmblemSwap(content);
  bindPracticeButtons(content); // Привязать обработчики кнопок практик
  bindGlowToggleButton(content); // Привязать обработчик кнопки свечения

  // Initialize mini cube
  const cubeContainer = document.getElementById("mini-cube-container");
  if (cubeContainer) {
    initMiniShape("cube", cubeContainer, domainWidgets.widgets.map(w => w.nodeId), "domains");
  }

  // Обработчики событий для виджетов
  content.querySelectorAll(".domain-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      hoveredWidgetId = nodeId;
      hoveredWindow = 1;
      updateWindowDimming();
      const node = nodesById.get(nodeId);
      HighlightManager.node(nodeId, true);
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      hoveredWidgetId = null;
      hoveredWindow = null;
      updateWindowDimming();
      HighlightManager.node(nodeId, false);
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
      <div class="domain-widget " data-node-id="${node.id}" title="${node.label}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getPracticeWidgetIcon(node.id), "practice")}
        </div>
      </div>`;
  }
  html += `</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindEmblemSwap(content);

  const cubeContainer = document.getElementById("mini-cube-container");
  if (cubeContainer) {
    initMiniShape("icosa", cubeContainer, practiceNodes.map(n => n.id), "practices");
  }

  content.querySelectorAll(".domain-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      HighlightManager.node(nodeId, true);
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      HighlightManager.node(nodeId, false);
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
      <div class="domain-widget " data-node-id="${node.id}" title="${node.label}">
        <div class="widget-frame">
          ${getWidgetImageHtml(getCharacterWidgetIcon(), "character")}
        </div>
      </div>`;
  }
  html += `</div>`;

  content.innerHTML = html;
  bindTagPills(content);
  bindEmblemSwap(content);

  const cubeContainer = document.getElementById("mini-cube-container");
  if (cubeContainer) {
    initMiniShape("icosa", cubeContainer, characterNodes.map(n => n.id), "characters");
  }

  content.querySelectorAll(".domain-widget").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      HighlightManager.node(nodeId, true);
      if (node) {
        refreshHighlights(node);
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      HighlightManager.node(nodeId, false);
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
  bindEmblemSwap(content);
}

function isWidgetNode(node) {
  return node && ["domain", "practice", "character", "workbench", "collab"].includes(node.type);
}

function isCollabNode(node) {
  return node && node.type === "collab";
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
  if (node.type === "collab") {
    return `${CONFIG.contractsPath}/assets/widgets/collab-plug.png`;
  }
  return null;
}

function getDomainWidgetIcon(nodeId) {
  const widget = domainWidgets?.widgets?.find((entry) => entry.nodeId === nodeId);
  if (widget?.icon) {
    if (widget.icon.startsWith("http") || widget.icon.startsWith("/")) {
      return widget.icon;
    }
    return `${CONFIG.contractsPath}/${widget.icon}`;
  }
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

function getCollabWidgetIcon(nodeId) {
  return `${CONFIG.contractsPath}/assets/widgets/collab-plug.png`;
}

function getHubWidgetIcon(nodeId) {
  return `${CONFIG.contractsPath}/assets/widgets/hub-plug.png`;
}

function getRootWidgetIcon(nodeId) {
  return `${CONFIG.contractsPath}/assets/widgets/root-plug.png`;
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
  applyNodeMaterial(nodeId);
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
function initMiniShape(type, container, nodeIds, hubId, options = {}) {
  if (!nodeIds || nodeIds.length === 0) return;

  miniShapeHubId = hubId;
  // Размер: octa в narrative screen — большой (9:9 область), остальные — 220px
  // options.scale позволяет увеличить фигуру (для хабов scale=2)
  const baseSize = type === "octa" ? 230 : 220;
  const scale = options.scale || 1;
  const size = baseSize * scale;
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
  // Октаэдр повёрнут на 45° по Z — выглядит как квадрат в проекции
  if (type === "octa") {
    miniCubeGroup.rotation.z = Math.PI / 4;
  }
  miniCubeScene.add(miniCubeGroup);

  // Генерируем позиции динамически в зависимости от количества виджетов
  const numVertices = nodeIds.length;
  let positions = [];
  
  if (type === "cube" && numVertices >= 8) {
    const cubeSize = 0.85;
    positions = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ].map(p => p.map(v => v * cubeSize));
  } else if (type === "octa") {
    // Октаэдр с динамическим количеством вершин (от 1 до 6)
    const octaSize = 1.2;
    const allOctaPositions = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ].map(p => p.map(v => v * octaSize));
    // Берём столько позиций, сколько виджетов (максимум 6)
    positions = allOctaPositions.slice(0, Math.min(numVertices, 6));
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
  } else if (type === "octa") {
    // Octahedron edges: each vertex connects to 4 others (not opposite)
    // Vertices: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z, 5=-Z
    const edgeIndices = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [2, 5], [3, 4], [3, 5]
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

  // Center to vertices (for cube and octa)
  if (type === "cube" || type === "octa") {
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
        // Clear previous highlights
        if (hoveredMesh) {
          const prevId = hoveredMesh.userData.nodeId;
          const wasCenter = prevId === hubId;
          if (wasCenter) {
            HighlightManager.scope(prevId, false);
          } else {
            HighlightManager.node(prevId, false);
          }
          refreshHighlights(null);
          graph.refresh();
        }
        hoveredMesh = mesh;
        const nodeId = mesh.userData.nodeId;
        const isCenter = nodeId === hubId;
        if (isCenter) {
          HighlightManager.scope(nodeId, true);
        } else {
          HighlightManager.node(nodeId, true);
          const node = nodesById.get(nodeId);
          if (node) {
            refreshHighlights(node);
            graph.refresh();
          }
        }
      }
    } else if (hoveredMesh) {
      const prevId = hoveredMesh.userData.nodeId;
      const wasCenter = prevId === hubId;
      if (wasCenter) {
        HighlightManager.scope(prevId, false);
      } else {
        HighlightManager.node(prevId, false);
      }
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
      const wasCenter = prevId === hubId;
      if (wasCenter) {
        HighlightManager.scope(prevId, false);
      } else {
        HighlightManager.node(prevId, false);
      }
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

  const isHub = nodeId === miniShapeHubId;
  if (highlight) {
    // Hub (center) uses cyan, vertices use yellow
    mesh.material.color.setHex(isHub ? 0x22d3ee : 0xfbbf24);
    mesh.scale.setScalar(1.5);
  } else {
    mesh.material.color.setHex(isHub ? 0x9ca3af : 0x6b7280);
    mesh.scale.setScalar(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGHLIGHT MANAGER
// ═══════════════════════════════════════════════════════════════════════════
// 
// Единый интерфейс для управления подсветкой узлов и scope.
// 
// МЕТОДЫ:
// ┌─────────────────────────┬────────────────────────────────────────────────┐
// │ node(nodeId, active)    │ Подсветить один узел (виджет + граф + фигура)  │
// │ scope(hubId, active)    │ Подсветить scope (хаб + все связанные узлы)    │
// └─────────────────────────┴────────────────────────────────────────────────┘
// 
// ВНУТРЕННИЕ ФУНКЦИИ:
// - highlightNodeById — изменить материал узла в графе
// - highlightWidgetById — добавить класс widget-highlighted
// - highlightMiniShapeNode — подсветить вершину мини-фигуры
// ═══════════════════════════════════════════════════════════════════════════

const HighlightManager = {
  /**
   * Подсветить один узел (виджет + граф + мини-фигура).
   * @param {string} nodeId - ID узла
   * @param {boolean} active - Включить/выключить подсветку
   */
  node(nodeId, active) {
    highlightNodeById(nodeId, active);
    highlightWidgetById(nodeId, active);
    highlightMiniShapeNode(nodeId, active);
  },

  // ═══════════════════════════════════════════════════════════════════════
  // scope() — СУММА подсветок всех виджетов на странице (НЕ ТРОГАТЬ)
  // ═══════════════════════════════════════════════════════════════════════
  // Собирает ВСЕ nodeId виджетов (.highlight-widget) на странице.
  // applyScope() в highlightModel.js подсвечивает:
  // - Все эти узлы
  // - Все рёбра, связанные с ними
  // - Всех соседей этих рёбер
  // ═══════════════════════════════════════════════════════════════════════
  scope(hubId, active) {
    const vovaWidget = document.querySelector(`.vova-scope-widget[data-node-id="${hubId}"]`);
    const container = vovaWidget?.closest(".panel-content");

    // Собираем ВСЕ nodeId виджетов на странице
    const scopeIds = new Set([hubId]);
    const widgets = container?.querySelectorAll(".highlight-widget[data-node-id]") || [];
    widgets.forEach(widget => {
      const nodeId = widget.dataset.nodeId;
      if (nodeId) scopeIds.add(nodeId);
    });

    if (active) {
      if (vovaWidget) vovaWidget.classList.add("scope-active");
      if (container) setScopeWidgetHighlight(container, true);
      miniCubeMeshes.forEach((m, id) => highlightMiniShapeNode(id, true));
      activateScopeHighlight(scopeIds);
      highlightNodeById(hubId, true);
      graph.refresh();
    } else {
      if (vovaWidget) vovaWidget.classList.remove("scope-active");
      if (container) setScopeWidgetHighlight(container, false);
      miniCubeMeshes.forEach((m, id) => highlightMiniShapeNode(id, false));
      clearScopeHighlight();
      highlightNodeById(hubId, false);
      graph.refresh();
    }
  }
};

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
      HighlightManager.node(nodeId, true);
      if (node) {
        // Hover на виджет: полная яркость рёбер
        refreshHighlights(node, "hover");
        graph.refresh();
      }
    });
    el.addEventListener("mouseleave", () => {
      const nodeId = el.dataset.nodeId;
      HighlightManager.node(nodeId, false);
      // Возврат к подсветке выделенного узла (полсилы)
      refreshHighlights(currentStep, "selected");
      graph.refresh();
    });
    el.addEventListener("click", (event) => {
      event.preventDefault();
      const nodeId = el.dataset.nodeId;
      const node = nodesById.get(nodeId);
      if (!node) return;
      // Переход для всех кликабельных типов узлов
      if (node.type === "domain" || node.type === "workbench" || node.type === "collab" || node.type === "character" || node.type === "hub" || node.type === "root") {
        registerInteraction();
        motionSound.resumeIfNeeded();
        goToStepById(node.id);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCOPE HIGHLIGHT — Подсветка корневого виджета
// ═══════════════════════════════════════════════════════════════════════════
// 
// ПРАВИЛО (НЕ ТРОГАТЬ):
// При hover на корневой виджет (.vova-scope-widget) подсвечивается СУММА
// подсветок всех виджетов на странице:
// 1. Все узлы виджетов + их соседи
// 2. Все рёбра, связанные с этими узлами
// 3. Все вершины 3D-фигуры
// 4. Все рамки виджетов
//
// Это правило применяется ко ВСЕМ страницам системы:
// - Character, Workbench, Collab, Domain, Hub, Root
//
// Логика реализована в:
// - bindVovaScopeWidget() — привязка событий hover
// - HighlightManager.scope() — сбор nodeIds и вызов подсветки
// - applyScope() в highlightModel.js — вычисление подсветки
// ═══════════════════════════════════════════════════════════════════════════

function bindVovaScopeWidget(container, node) {
  const scopeWidget = container.querySelector(".vova-scope-widget");
  if (!scopeWidget || !node) return;
  
  // Определяем, есть ли на странице группы виджетов
  const hasWidgetGroups = container.querySelector(".widget-groups-row") !== null;
  
  scopeWidget.addEventListener("mouseenter", () => {
    scopeWidget.classList.add("scope-active");
    if (hasWidgetGroups) {
      // Страница с группами: подсвечиваем СУММУ всех виджетов
      HighlightManager.scope(node.id, true);
    } else {
      // Страница без групп: подсвечиваем только узел
      refreshHighlights(node, "hover");
      HighlightManager.node(node.id, true);
      graph.refresh();
    }
  });
  
  scopeWidget.addEventListener("mouseleave", () => {
    scopeWidget.classList.remove("scope-active");
    if (hasWidgetGroups) {
      HighlightManager.scope(node.id, false);
    } else {
      HighlightManager.node(node.id, false);
    }
    refreshHighlights(currentStep, "selected");
    graph.refresh();
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
    // Track active lever id for scene logic
    try { activeLeverWidgetId = widget.dataset && widget.dataset.nodeId ? widget.dataset.nodeId : null; } catch(e){ activeLeverWidgetId = null; }
  computePreactiveResponse();
  updateWindowDimming();
  emitPreviewChange();
    window.dispatchEvent(
      new CustomEvent("graph-lever-changed", {
        detail: { nodeId: activeLeverWidgetId, active: true }
      })
    );
  } else {
    if (activeRootLever === widget) {
      activeRootLever = null;
    }
    widget.classList.remove("widget--shifted");
    widget.style.removeProperty("--lever-offset");
    if (!activeRootLever) {
      document.body.classList.remove("scene-lever-active");
    }
    // clear active lever id if this widget was active
    try { if (!activeRootLever) activeLeverWidgetId = null; } catch(e) { activeLeverWidgetId = null; }
  computePreactiveResponse();
  updateWindowDimming();
  emitPreviewChange();
    window.dispatchEvent(
      new CustomEvent("graph-lever-changed", {
        detail: { nodeId: activeLeverWidgetId, active: false }
      })
    );
  }
}

// @future: Lever механика удалена — виджеты теперь только подпрыгивают и подсвечиваются
// function bindWidgetLever удалена

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

/**
 * Активировать подсветку scope.
 * 
 * МИГРАЦИЯ (Маршрут G): Обновляет состояние и делегирует в updateHighlight().
 */
function activateScopeHighlight(nodeIds) {
  scopeHighlightActive = true;
  scopeHighlightNodeIds = new Set(nodeIds);
  
  // Вызвать центральную точку вычисления
  updateHighlight();
}

/**
 * Снять подсветку scope.
 * 
 * МИГРАЦИЯ (Маршрут G): Обновляет состояние и делегирует в updateHighlight().
 */
function clearScopeHighlight() {
  scopeHighlightActive = false;
  scopeHighlightNodeIds = new Set();
  
  // Вызвать центральную точку вычисления
  updateHighlight();
}

function updateScopeNodeMaterials() {
  nodeMeshes.forEach((_, nodeId) => applyNodeMaterial(nodeId));
}

function getRelatedNodeIdsByType(nodeId, type) {
  // Используем полный индекс соседей для виджетов отключённых узлов (практики)
  const neighbors = allNeighborsById.get(nodeId) || neighborsById.get(nodeId);
  if (!nodeId || !neighbors) return [];
  const related = [];
  neighbors.forEach((neighborId) => {
    const node = allNodesById.get(neighborId) || nodesById.get(neighborId);
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

function buildStoryWidgetSections(step) {
  if (!step) return [];
  const sections = [];
  const addSection = (title, type, ids) => {
    if (!ids || !ids.length) return;
    sections.push({
      title,
      type,
      items: ids.map((id) => ({
        id,
        label: nodesById.get(id)?.label || id,
        type
      }))
    });
  };

  if (step.id === "domains" && domainWidgets?.widgets?.length) {
    addSection(getSectionLabel("domain"), "domain", domainWidgets.widgets.map((w) => w.nodeId));
    return sections;
  }
  if (step.id === "practices") {
    addSection(
      getSectionLabel("practice"),
      "practice",
      [...nodesById.values()].filter((n) => n.type === "practice").map((n) => n.id)
    );
    return sections;
  }
  if (step.id === "characters") {
    addSection(
      getSectionLabel("character"),
      "character",
      sortCharacterIds([...nodesById.values()].filter((n) => n.type === "character").map((n) => n.id))
    );
    return sections;
  }

  addSection(getSectionLabel("domain"), "domain", getRelatedNodeIdsByType(step.id, "domain"));
  addSection(getSectionLabel("practice"), "practice", getRelatedNodeIdsByType(step.id, "practice"));
  addSection(getSectionLabel("character"), "character", sortCharacterIds(getRelatedNodeIdsByType(step.id, "character")));
  addSection(getSectionLabel("workbench"), "workbench", getRelatedNodeIdsByType(step.id, "workbench"));
  addSection(getSectionLabel("collab"), "collab", getRelatedNodeIdsByType(step.id, "collab"));
  return sections;
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
  emitQueryModeChange();
}

function clearQueryTag() {
  activeQueryTag = null;
  queryModeActive = false;
  selectedServiceItem = null;
  activeContext = [];
  updateServicePanel(document.getElementById("service-panel"), currentStep?.service);
  updateActiveTagPills();
  updateContextStrip();
  emitQueryModeChange();
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

function buildQueryModeState() {
  if (!queryModeActive || !activeQueryTag) {
    return { active: false };
  }
  const tagSource = currentStep?.service?.text || "";
  const availableTags = extractTags(tagSource);
  const { localResults, externalLinks } = resolveQuery(activeQueryTag);
  const grouped = {
    service: [],
    model: [],
    method: [],
    other: []
  };
  const normalized = localResults.map((item) => {
    const participation = practiceParticipation.filter((p) => p.item_external_id === item.external_id);
    const participationLabel = participation.map((p) => p.practice_id).join(", ");
    const link = item.external_id?.startsWith("http") ? item.external_id : null;
    return {
      id: item.id || item.external_id || "",
      title: item.title || item.display_name || item.external_id || "Item",
      kind: item.kind || "other",
      source: item.source || "unknown",
      externalId: item.external_id || "",
      participationLabel,
      link
    };
  });
  normalized.forEach((item) => {
    if (grouped[item.kind]) grouped[item.kind].push(item);
    else grouped.other.push(item);
  });
  const total = normalized.length;
  const status = aiCatalog.length === 0
    ? "Catalog empty or missing."
    : total === 0
      ? "No matches for this tag."
      : `Matches: ${total}`;
  const hint = total > 0 ? "Scroll to see results." : "";
  return {
    active: true,
    tag: activeQueryTag,
    grouped,
    status,
    hint,
    externalLinks,
    selectedServiceItem,
    total,
    isEmpty: total === 0,
    availableTags
  };
}

function emitQueryModeChange() {
  window.dispatchEvent(
    new CustomEvent("graph-query-mode-changed", {
      detail: buildQueryModeState()
    })
  );
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
  emitQueryModeChange();
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
  // If preview data is provided (preactive), render a lightweight preview UI
  if (data && data.preactive) {
    const p = data.preactive;
    let html = `<div class="preview-header">Preview — ${escapeHtml(p.type || 'Info')}</div>`;
    if (p.groups && p.groups.length) {
      html += `<div class="preview-groups">${p.groups.slice(0,3).map(g => `<span class="preview-group">${escapeHtml(g)}</span>`).join(' ')}</div>`;
    }
    if (p.previewItems && p.previewItems.length) {
      html += `<ul class="preview-items">` + p.previewItems.slice(0,3).map(it => `
        <li class="preview-item" data-item-id="${escapeHtml(it.id)}">${escapeHtml(it.label || it.id)}</li>
      `).join('') + `</ul>`;
    } else {
      html += `<div class="preview-skeleton">` +
        `<div class="skel skel-line"></div><div class="skel skel-line short"></div>` +
        `</div>`;
    }
    content.innerHTML = html;
    return bindTagPills(content);
  }

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

  // handle preactive preview similarly to updatePanel
  if (data && data.preactive) {
    const p = data.preactive;
    let html = `<div class="preview-header">Preview — ${escapeHtml(p.type || 'Info')}</div>`;
    if (p.previewItems && p.previewItems.length) {
      html += `<div class="preview-list">` + p.previewItems.slice(0,3).map(it => `
        <div class="preview-service-item" data-item-id="${escapeHtml(it.id)}">${escapeHtml(it.label || it.id)}</div>
      `).join('') + `</div>`;
    } else {
      html += `<div class="preview-skeleton">` +
        `<div class="skel skel-line"></div><div class="skel skel-line short"></div>` +
        `</div>`;
    }
    content.innerHTML = html;
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
  document.body.classList.remove("focus-story", "focus-segment", "focus-system", "focus-service");
  if (panelId === "scope-panel") document.body.classList.add("focus-story");
  if (panelId === "storage-panel") document.body.classList.add("focus-segment");
  if (panelId === "system-panel") document.body.classList.add("focus-system");
  if (panelId === "service-panel") document.body.classList.add("focus-service");
  window.dispatchEvent(new CustomEvent("graph-focus-changed", { detail: { panelId } }));
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
      <button class="header-btn" id="fullscreen-toggle" title="Fullscreen">⛶</button>
      <button class="header-btn" title="Coming soon">Sign in</button>
      <button class="header-btn" title="Coming soon">RU</button>
    </div>
  `;
  document.body.appendChild(headerBar);

  const graphDiv = document.createElement("div");
  graphDiv.id = "graph";
  document.body.appendChild(graphDiv);

  const sceneLayer = document.createElement("div");
  sceneLayer.id = "scene-layer";

  const sceneStage = document.createElement("div");
  sceneStage.id = "scene-stage";

  const sceneOverlay = document.createElement("div");
  sceneOverlay.id = "scene-overlay";
  sceneStage.appendChild(sceneOverlay);

  const panelsContainer = document.createElement("div");
  panelsContainer.id = "panels-container";
  panelsContainer.innerHTML = `
    <div id="scope-panel" class="panel-3s">
      <div class="panel-inner">
        <div class="panel-header"><span class="panel-title-text">Scope</span><span id="scene-stack" aria-hidden="true"></span></div>
        <div class="panel-content"></div>
      </div>
    </div>
    <div class="graph-spacer">
      <div id="storage-panel" class="panel-3s panel-segment">
        <div class="panel-inner">
          <div class="panel-header"><span class="panel-title-text">Storage</span><span id="segment-controls" aria-hidden="true"></span></div>
          <div class="panel-content"></div>
        </div>
      </div>
    </div>
    <div id="right-column">
      <div id="system-panel" class="panel-3s">
        <div class="panel-inner">
          <div class="panel-header"><span class="panel-title-text">System</span><span id="system-controls" aria-hidden="true"></span></div>
          <div class="panel-content"></div>
        </div>
      </div>
      <div id="service-panel" class="panel-3s">
        <div class="panel-inner">
          <div class="panel-header"><span class="panel-title-text">Service</span><span id="service-controls" aria-hidden="true"></span></div>
          <div class="panel-content"></div>
        </div>
      </div>
    </div>
  `;
  sceneStage.appendChild(panelsContainer);
  sceneLayer.appendChild(sceneStage);
  document.body.appendChild(sceneLayer);

  function updateSceneScale() {
    const baseWidth = 1400;
    const baseHeight = 788;
    const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight, 1);
    sceneStage.style.setProperty("--scene-scale", scale.toFixed(4));
  }

  updateSceneScale();
  window.addEventListener("resize", updateSceneScale);

  const fullscreenButton = headerBar.querySelector("#fullscreen-toggle");
  const fullscreenContainer = document.documentElement;
  function updateFullscreenButton() {
    if (!fullscreenButton) return;
    const active = document.fullscreenElement != null;
    fullscreenButton.textContent = active ? "✕" : "⛶";
    fullscreenButton.title = active ? "Exit fullscreen" : "Fullscreen";
  }

  if (fullscreenButton && fullscreenContainer?.requestFullscreen) {
    fullscreenButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        fullscreenContainer.requestFullscreen();
      }
    });
  }

  document.addEventListener("fullscreenchange", () => {
    updateFullscreenButton();
    updateSceneScale();
  });
  updateFullscreenButton();

  // Initialize scene stack UI and interactions (SceneFocusDots)
  function initSceneDotsUI() {
    // Render dots only when stack is populated by navigation
    if (!sceneStack || !sceneStack.length) {
      sceneStack = [];
      sceneStackIndex = 0;
    }
    renderSceneStack();

    // Delegate clicks on widgets to push a new scene dot when navigating into a widget
    document.body.addEventListener('click', (ev) => {
      try {
        const host = ev.target.closest && ev.target.closest('[data-node-id], .node-widget, .domain-widget, .');
        if (!host) return;
        const nodeId = host.dataset?.nodeId || host.getAttribute('data-node-id') || host.dataset?.nodeIdRaw || null;
        if (!nodeId) return;
        // Only push a new scene point when there is no active lever (rule: clicks navigate only when no lever active)
        if (activeLeverWidgetId) return;
        // Push as navigation (EnterWidget)
        pushSceneStack(nodeId);
      } catch (e) {
        // ignore
      }
    }, { capture: true });

    // Click on scene dots to navigate back/forward or toggle type highlight
    const stackEl = document.getElementById("scene-stack");
    if (stackEl) {
      // Click handler
      stackEl.addEventListener("click", (ev) => {
        const dot = ev.target.closest && ev.target.closest(".scene-dot");
        if (!dot || dot.classList.contains("scene-dot--disabled")) return;
        if (dot.dataset.action === "prev") {
          stepSceneStack(-1);
        } else if (dot.dataset.action === "type-highlight") {
          // Toggle type highlight mode
          setTypeHighlightActive(!typeHighlightActive);
        }
      });
      
      // Hover handlers for type-highlight dot
      stackEl.addEventListener("mouseenter", (ev) => {
        const dot = ev.target.closest && ev.target.closest(".scene-dot");
        if (dot && dot.dataset.action === "type-highlight" && !dot.classList.contains("scene-dot--disabled")) {
          handleTypeHighlightHover(true);
        }
      }, true);
      
      stackEl.addEventListener("mouseleave", (ev) => {
        const dot = ev.target.closest && ev.target.closest(".scene-dot");
        if (dot && dot.dataset.action === "type-highlight") {
          handleTypeHighlightHover(false);
        }
      }, true);
    }
  }

  // expose initializer to be invoked after global state is ready
  window.__initSceneDotsUI = initSceneDotsUI;

  // Bind Segment panel controls (back, close)
  bindSegmentControls();

  // Render and bind System/Service control dots
  renderSystemControls();
  renderServiceControls();
  bindSystemControls();
  bindServiceControls();

  // Panel focus behavior (hover to focus, default Story)
  const storyPanel = document.getElementById("scope-panel");
  const segmentPanel = document.getElementById("storage-panel");
  const systemPanel = document.getElementById("system-panel");
  const servicePanel = document.getElementById("service-panel");

  // Default focus: Story
  setPanelFocus("scope-panel");

  // Hover focus
  storyPanel?.addEventListener("mouseenter", () => setPanelFocus("scope-panel"));
  segmentPanel?.addEventListener("mouseenter", () => setPanelFocus("storage-panel"));
  systemPanel?.addEventListener("mouseenter", () => setPanelFocus("system-panel"));
  servicePanel?.addEventListener("mouseenter", () => setPanelFocus("service-panel"));

  // Return to Story on leaving any panel
  segmentPanel?.addEventListener("mouseleave", () => setPanelFocus("scope-panel"));
  systemPanel?.addEventListener("mouseleave", () => setPanelFocus("scope-panel"));
  servicePanel?.addEventListener("mouseleave", () => setPanelFocus("scope-panel"));

}

// === Анимация ===
let lastTickTime = performance.now();
function tickAnimation() {
  const now = performance.now();
  const deltaTime = (now - lastTickTime) / 1000; // в секундах
  lastTickTime = now;
  
  visualTime = now;
  updateNodeBreathing(visualTime);
  updateAutoRotate(visualTime);
  updatePracticePolygons(); // Обновление позиций полигонов практик
  updateBadgeSprites(); // Обновление позиций и opacity бейджей
  updateNodeGlow(); // Обновление позиции и пульсации свечения
  // Обновление орбит VSTablishment
  if (vstablishmentOrbits) {
    // Обновить позицию по позиции узла
    const node = nodesById.get("workbench-vova-vstablishment");
    if (node) {
      vstablishmentOrbits.setPosition(node.x || 0, node.y || 0, node.z || 0);
    }
    vstablishmentOrbits.update(deltaTime);
  }
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

window.addEventListener("graph-ref-clicked", (event) => {
  const ref = event?.detail?.ref;
  if (!ref) return;
  const candidateId = ref.id || ref.label;
  if (typeof candidateId === "string" && candidateId.startsWith("http")) {
    window.open(candidateId, "_blank", "noopener,noreferrer");
    return;
  }
  if (candidateId && nodesById?.has(candidateId)) {
    goToStepById(candidateId);
  }
});

window.addEventListener("graph-widget-hovered", (event) => {
  const nodeId = event?.detail?.nodeId;
  const active = Boolean(event?.detail?.active);
  if (!nodeId) return;
  if (!active && activeLeverWidgetId === nodeId) {
    hoveredWidgetId = nodeId;
    hoveredWindow = 1;
    updateWindowDimming();
    HighlightManager.node(nodeId, true);
    const node = nodesById.get(nodeId);
    if (node) {
      refreshHighlights(node);
    }
    graph.refresh();
    return;
  }
  if (active) {
    hoveredWidgetId = nodeId;
    hoveredWindow = 1;
    updateWindowDimming();
    HighlightManager.node(nodeId, true);
    const node = nodesById.get(nodeId);
    if (node) {
      refreshHighlights(node);
    }
  } else {
    hoveredWidgetId = null;
    hoveredWindow = null;
    updateWindowDimming();
    HighlightManager.node(nodeId, false);
    refreshHighlights(null);
  }
  graph.refresh();
});

window.addEventListener("graph-widget-lever", (event) => {
  const nodeId = event?.detail?.nodeId;
  if (!nodeId) return;
  let proxy = reactLeverProxies.get(nodeId);
  if (!proxy) {
    proxy = document.createElement("div");
    proxy.dataset.nodeId = nodeId;
    proxy.className = "react-lever-proxy ";
    reactLeverProxies.set(nodeId, proxy);
  }
  if (activeRootLever && activeRootLever.dataset?.nodeId === nodeId) {
    setRootLeverState(activeRootLever, false);
    return;
  }
  if (activeRootLever) {
    setRootLeverState(activeRootLever, false);
  }
  setRootLeverState(proxy, true);
});

window.addEventListener("graph-mini-shape-host", (event) => {
  const detail = event?.detail || {};
  const container = detail.container || null;
  const nodeIds = Array.isArray(detail.nodeIds) ? detail.nodeIds : [];
  destroyMiniCube();
  if (!container || nodeIds.length === 0) return;
  const type = detail.type || "cube";
  const hubId = detail.hubId || "story";
  initMiniShape(type, container, nodeIds, hubId);
});

window.addEventListener("graph-preview-item-clicked", (event) => {
  const item = event?.detail?.item;
  if (!item) return;
  if (queryModeActive) return;
  const targetId = item.id || item.label;
  if (targetId && nodesById?.has(targetId)) {
    goToStepById(targetId);
  }
});

window.addEventListener("graph-preview-action", (event) => {
  const item = event?.detail?.item;
  if (!item) return;
  if (!queryModeActive) return;
  const name = item.label || item.id || "Service";
  setSelectedServiceItem({ id: item.id || name, name });
});

window.addEventListener("graph-service-action", (event) => {
  const action = event?.detail?.action;
  if (!action) return;
  const selector = `[data-action-type='${action.type}'][data-action-id='${action.id || ""}']`;
  const legacyButton = document.querySelector(selector);
  if (legacyButton) {
    legacyButton.click();
    return;
  }
  console.log("[Service] Action", action);
});

window.addEventListener("graph-preview-hovered", (event) => {
  const item = event?.detail?.item;
  const active = Boolean(event?.detail?.active);
  if (!item || queryModeActive) return;
  const targetId = item.id || item.label;
  if (!targetId || !nodesById?.has(targetId)) return;
  HighlightManager.node(targetId, active);
  if (active) {
    const node = nodesById.get(targetId);
    if (node) {
      refreshHighlights(node);
    }
  } else {
    refreshHighlights(null);
  }
  graph.refresh();
});

window.addEventListener("graph-preview-selected", (event) => {
  const item = event?.detail?.item;
  if (!item) return;
  console.log("[Preview] Selected", item.id || item.label || item);
});

window.addEventListener("graph-query-clear", () => {
  clearQueryTag();
});

window.addEventListener("graph-query-tag-selected", (event) => {
  const tag = event?.detail?.tag;
  if (!tag) return;
  setQueryTag(tag, "ui");
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
verifyCriticalAssets();

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
