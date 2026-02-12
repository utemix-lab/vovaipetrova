/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HIGHLIGHT MODEL — Чистая вычислительная модель подсветки
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Маршрут G: Формализация вычислительной модели
 * См. repair-shop/DECISIONS.md
 * 
 * ПРИНЦИП:
 * - Чистая функция без side effects
 * - Без DOM, Three.js, React
 * - Один вход (контекст) → один выход (состояние)
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const state = computeHighlight(context);
 * renderHighlight(state); // в visitor.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * @typedef {Object} HighlightContext
 * @property {string|null} selectedNodeId - ID выбранного узла (currentStep)
 * @property {string|null} hoveredNodeId - ID узла под курсором
 * @property {string|null} widgetHoveredNodeId - ID узла, чей виджет под курсором
 * @property {Set<string>} scopeNodeIds - ID узлов в активном scope
 * @property {boolean} scopeActive - Активен ли scope hover
 * @property {Set<string>} typeHighlightNodeIds - ID узлов для Type Highlight
 * @property {boolean} typeHighlightActive - Активен ли Type Highlight
 */

/**
 * @typedef {Object} HighlightState
 * @property {Map<string, number>} nodeIntensities - nodeId → intensity (0, 0.15, 0.5, 1.0)
 * @property {Map<string, number>} edgeIntensities - edgeId → intensity (0, 0.15, 0.5, 1.0)
 * @property {string} mode - "none" | "selected" | "hover" | "scope" | "type"
 */

/**
 * @typedef {Object} GraphData
 * @property {Map<string, Object>} nodesById - nodeId → node
 * @property {Map<string, Set<string>>} neighborsById - nodeId → Set<neighborId>
 * @property {Array<Object>} edges - массив рёбер {id, source, target}
 */

// Константы интенсивности
export const INTENSITY = {
  NONE: 0,
  DIM: 0.15,
  HALF: 0.5,
  FULL: 1.0
};

/**
 * Вычислить состояние подсветки.
 * 
 * ЧИСТАЯ ФУНКЦИЯ: не модифицирует входные данные, не имеет side effects.
 * 
 * @param {HighlightContext} context - Контекст подсветки
 * @param {GraphData} graph - Данные графа
 * @returns {HighlightState} - Состояние подсветки
 */
export function computeHighlight(context, graph) {
  const nodeIntensities = new Map();
  const edgeIntensities = new Map();
  
  // Инициализация: все узлы и рёбра dim
  for (const nodeId of graph.nodesById.keys()) {
    nodeIntensities.set(nodeId, INTENSITY.DIM);
  }
  for (const edge of graph.edges) {
    edgeIntensities.set(edge.id, INTENSITY.DIM);
  }
  
  // Определяем режим по приоритету
  const mode = determineMode(context);
  
  switch (mode) {
    case "scope":
      applyScope(context, graph, nodeIntensities, edgeIntensities);
      break;
    case "hover":
      applyHover(context, graph, nodeIntensities, edgeIntensities);
      break;
    case "selected":
      applySelected(context, graph, nodeIntensities, edgeIntensities);
      break;
    case "type":
      applyTypeHighlight(context, graph, nodeIntensities, edgeIntensities);
      break;
    case "none":
    default:
      // Всё остаётся dim
      break;
  }
  
  return { nodeIntensities, edgeIntensities, mode };
}

/**
 * Определить режим подсветки по приоритету.
 * Приоритет: scope > hover > type > selected > none
 */
function determineMode(context) {
  if (context.scopeActive && context.scopeNodeIds.size > 0) {
    return "scope";
  }
  if (context.hoveredNodeId || context.widgetHoveredNodeId) {
    return "hover";
  }
  if (context.typeHighlightActive && context.typeHighlightNodeIds.size > 0) {
    return "type";
  }
  if (context.selectedNodeId) {
    return "selected";
  }
  return "none";
}

/**
 * Применить подсветку scope (hover на корневой виджет).
 * Все узлы scope + их соседи = FULL.
 * Все рёбра, связанные с scope = FULL.
 */
function applyScope(context, graph, nodeIntensities, edgeIntensities) {
  const scopeIds = context.scopeNodeIds;
  
  // Все узлы в scope = FULL
  for (const nodeId of scopeIds) {
    nodeIntensities.set(nodeId, INTENSITY.FULL);
  }
  
  // Все рёбра, связанные с scope = FULL
  // + соседи этих рёбер тоже FULL
  for (const edge of graph.edges) {
    const sourceId = getEdgeNodeId(edge.source);
    const targetId = getEdgeNodeId(edge.target);
    
    if (scopeIds.has(sourceId) || scopeIds.has(targetId)) {
      edgeIntensities.set(edge.id, INTENSITY.FULL);
      nodeIntensities.set(sourceId, INTENSITY.FULL);
      nodeIntensities.set(targetId, INTENSITY.FULL);
    }
  }
}

/**
 * Применить подсветку hover (на узел или виджет).
 * Узел + соседи = FULL.
 * Рёбра к соседям = FULL.
 */
function applyHover(context, graph, nodeIntensities, edgeIntensities) {
  const hoveredId = context.hoveredNodeId || context.widgetHoveredNodeId;
  if (!hoveredId) return;
  
  // Hovered узел = FULL
  nodeIntensities.set(hoveredId, INTENSITY.FULL);
  
  // Рёбра к соседям = FULL, соседи = FULL
  for (const edge of graph.edges) {
    const sourceId = getEdgeNodeId(edge.source);
    const targetId = getEdgeNodeId(edge.target);
    
    if (sourceId === hoveredId || targetId === hoveredId) {
      edgeIntensities.set(edge.id, INTENSITY.FULL);
      nodeIntensities.set(sourceId, INTENSITY.FULL);
      nodeIntensities.set(targetId, INTENSITY.FULL);
    }
  }
  
  // Если есть selected, он тоже FULL
  if (context.selectedNodeId) {
    nodeIntensities.set(context.selectedNodeId, INTENSITY.FULL);
  }
}

/**
 * Применить подсветку selected (выбранный узел без hover).
 * Узел = FULL.
 * Рёбра к соседям = HALF.
 * Соседи = HALF.
 */
function applySelected(context, graph, nodeIntensities, edgeIntensities) {
  const selectedId = context.selectedNodeId;
  if (!selectedId) return;
  
  // Selected узел = FULL
  nodeIntensities.set(selectedId, INTENSITY.FULL);
  
  // Рёбра к соседям = HALF, соседи = HALF
  for (const edge of graph.edges) {
    const sourceId = getEdgeNodeId(edge.source);
    const targetId = getEdgeNodeId(edge.target);
    
    if (sourceId === selectedId || targetId === selectedId) {
      edgeIntensities.set(edge.id, INTENSITY.HALF);
      const neighborId = sourceId === selectedId ? targetId : sourceId;
      // Сосед = HALF (если не уже FULL)
      if (nodeIntensities.get(neighborId) !== INTENSITY.FULL) {
        nodeIntensities.set(neighborId, INTENSITY.HALF);
      }
    }
  }
}

/**
 * Применить Type Highlight (все узлы того же типа).
 * Все узлы типа = FULL.
 * Рёбра selected узла = HALF.
 */
function applyTypeHighlight(context, graph, nodeIntensities, edgeIntensities) {
  // Все узлы в typeHighlightNodeIds = FULL
  for (const nodeId of context.typeHighlightNodeIds) {
    nodeIntensities.set(nodeId, INTENSITY.FULL);
  }
  
  // Selected узел тоже FULL (он уже в typeHighlightNodeIds)
  if (context.selectedNodeId) {
    nodeIntensities.set(context.selectedNodeId, INTENSITY.FULL);
    
    // Рёбра selected = HALF
    for (const edge of graph.edges) {
      const sourceId = getEdgeNodeId(edge.source);
      const targetId = getEdgeNodeId(edge.target);
      
      if (sourceId === context.selectedNodeId || targetId === context.selectedNodeId) {
        edgeIntensities.set(edge.id, INTENSITY.HALF);
      }
    }
  }
}

/**
 * Получить ID узла из edge endpoint (может быть объектом или строкой).
 */
function getEdgeNodeId(endpoint) {
  if (typeof endpoint === "string") return endpoint;
  if (endpoint && typeof endpoint === "object" && endpoint.id) return endpoint.id;
  return String(endpoint);
}

/**
 * Создать пустой контекст подсветки.
 */
export function createEmptyContext() {
  return {
    selectedNodeId: null,
    hoveredNodeId: null,
    widgetHoveredNodeId: null,
    scopeNodeIds: new Set(),
    scopeActive: false,
    typeHighlightNodeIds: new Set(),
    typeHighlightActive: false
  };
}

/**
 * Создать контекст из текущего состояния.
 * Используется для миграции из visitor.js.
 */
export function createContextFromState({
  currentStepId = null,
  hoverNodeId = null,
  widgetHighlightedNodeId = null,
  scopeHighlightNodeIds = new Set(),
  scopeHighlightActive = false,
  typeHighlightedNodeIds = new Set(),
  typeHighlightActive = false
} = {}) {
  return {
    selectedNodeId: currentStepId,
    hoveredNodeId: hoverNodeId,
    widgetHoveredNodeId: widgetHighlightedNodeId,
    scopeNodeIds: new Set(scopeHighlightNodeIds),
    scopeActive: scopeHighlightActive,
    typeHighlightNodeIds: new Set(typeHighlightedNodeIds),
    typeHighlightActive: typeHighlightActive
  };
}
