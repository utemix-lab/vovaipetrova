/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRUCTURAL INVARIANTS — Математика кристалла
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2b: Structural Invariants
 * См. repair-shop/ROADMAP.md
 * 
 * НАЗНАЧЕНИЕ:
 * - Гарантии структуры графа
 * - Проверка инвариантов при загрузке и изменении
 * - Формализация "здоровья" системы
 * 
 * ПРИНЦИП:
 * - Invariants = read-only проверки
 * - Никакой мутации данных
 * - Детерминированные результаты
 * 
 * КАТЕГОРИИ ИНВАРИАНТОВ:
 * 1. Graph Invariants — структура графа
 * 2. Identity Invariants — идентичность узлов
 * 3. Edge Invariants — целостность рёбер
 * 4. Connectivity Invariants — связность
 * 5. Schema Invariants — соответствие схеме
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NODE_TYPES, EDGE_TYPES, SchemaValidator } from "./CanonicalGraphSchema.js";

// ═══════════════════════════════════════════════════════════════════════════
// INVARIANT RESULT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Результат проверки инварианта.
 * @typedef {Object} InvariantResult
 * @property {string} name - Имя инварианта
 * @property {boolean} holds - Выполняется ли инвариант
 * @property {string} message - Описание результата
 * @property {Array<Object>} violations - Список нарушений
 */

/**
 * Создать результат инварианта.
 * @param {string} name - Имя инварианта
 * @param {boolean} holds - Выполняется ли
 * @param {string} message - Сообщение
 * @param {Array<Object>} violations - Нарушения
 * @returns {InvariantResult}
 */
function createResult(name, holds, message, violations = []) {
  return { name, holds, message, violations };
}

// ═══════════════════════════════════════════════════════════════════════════
// GRAPH INVARIANTS — Структура графа
// ═══════════════════════════════════════════════════════════════════════════

/**
 * INV-G1: Все узлы имеют уникальные id.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkUniqueNodeIds(graphData) {
  const nodes = graphData.nodes || [];
  const seen = new Map();
  const violations = [];
  
  for (const node of nodes) {
    if (seen.has(node.id)) {
      violations.push({
        type: "duplicate_id",
        id: node.id,
        first: seen.get(node.id),
        second: node,
      });
    } else {
      seen.set(node.id, node);
    }
  }
  
  return createResult(
    "INV-G1: Unique Node IDs",
    violations.length === 0,
    violations.length === 0
      ? "All node IDs are unique"
      : `Found ${violations.length} duplicate node ID(s)`,
    violations
  );
}

/**
 * INV-G2: Все рёбра имеют уникальные id.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkUniqueEdgeIds(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const seen = new Map();
  const violations = [];
  
  for (const edge of edges) {
    if (!edge.id) {
      violations.push({
        type: "missing_id",
        edge,
      });
    } else if (seen.has(edge.id)) {
      violations.push({
        type: "duplicate_id",
        id: edge.id,
        first: seen.get(edge.id),
        second: edge,
      });
    } else {
      seen.set(edge.id, edge);
    }
  }
  
  return createResult(
    "INV-G2: Unique Edge IDs",
    violations.length === 0,
    violations.length === 0
      ? "All edge IDs are unique"
      : `Found ${violations.length} edge ID issue(s)`,
    violations
  );
}

/**
 * INV-G3: Нет висящих рёбер (source и target существуют).
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkNoDanglingEdges(graphData) {
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || graphData.links || [];
  const nodeIds = new Set(nodes.map(n => n.id));
  const violations = [];
  
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      violations.push({
        type: "dangling_source",
        edgeId: edge.id,
        source: edge.source,
      });
    }
    if (!nodeIds.has(edge.target)) {
      violations.push({
        type: "dangling_target",
        edgeId: edge.id,
        target: edge.target,
      });
    }
  }
  
  return createResult(
    "INV-G3: No Dangling Edges",
    violations.length === 0,
    violations.length === 0
      ? "All edges reference existing nodes"
      : `Found ${violations.length} dangling edge reference(s)`,
    violations
  );
}

/**
 * INV-G4: Нет self-loops (ребро от узла к себе).
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkNoSelfLoops(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const violations = [];
  
  for (const edge of edges) {
    if (edge.source === edge.target) {
      violations.push({
        type: "self_loop",
        edgeId: edge.id,
        nodeId: edge.source,
      });
    }
  }
  
  return createResult(
    "INV-G4: No Self-Loops",
    violations.length === 0,
    violations.length === 0
      ? "No self-loops found"
      : `Found ${violations.length} self-loop(s)`,
    violations
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY INVARIANTS — Идентичность узлов
// ═══════════════════════════════════════════════════════════════════════════

/**
 * INV-I1: Все узлы имеют id.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkAllNodesHaveId(graphData) {
  const nodes = graphData.nodes || [];
  const violations = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.id || typeof node.id !== "string" || node.id.trim() === "") {
      violations.push({
        type: "missing_id",
        index: i,
        node,
      });
    }
  }
  
  return createResult(
    "INV-I1: All Nodes Have ID",
    violations.length === 0,
    violations.length === 0
      ? "All nodes have valid IDs"
      : `Found ${violations.length} node(s) without valid ID`,
    violations
  );
}

/**
 * INV-I2: Все узлы имеют type.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkAllNodesHaveType(graphData) {
  const nodes = graphData.nodes || [];
  const violations = [];
  
  for (const node of nodes) {
    if (!node.type || typeof node.type !== "string") {
      violations.push({
        type: "missing_type",
        nodeId: node.id,
        node,
      });
    }
  }
  
  return createResult(
    "INV-I2: All Nodes Have Type",
    violations.length === 0,
    violations.length === 0
      ? "All nodes have type"
      : `Found ${violations.length} node(s) without type`,
    violations
  );
}

/**
 * INV-I3: Все типы узлов известны схеме.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkKnownNodeTypes(graphData) {
  const nodes = graphData.nodes || [];
  const knownTypes = new Set(Object.values(NODE_TYPES));
  const violations = [];
  
  for (const node of nodes) {
    if (node.type && !knownTypes.has(node.type)) {
      violations.push({
        type: "unknown_type",
        nodeId: node.id,
        nodeType: node.type,
      });
    }
  }
  
  return createResult(
    "INV-I3: Known Node Types",
    violations.length === 0,
    violations.length === 0
      ? "All node types are known"
      : `Found ${violations.length} node(s) with unknown type`,
    violations
  );
}

/**
 * INV-I4: Все узлы имеют label.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkAllNodesHaveLabel(graphData) {
  const nodes = graphData.nodes || [];
  const violations = [];
  
  for (const node of nodes) {
    if (!node.label || typeof node.label !== "string" || node.label.trim() === "") {
      violations.push({
        type: "missing_label",
        nodeId: node.id,
      });
    }
  }
  
  return createResult(
    "INV-I4: All Nodes Have Label",
    violations.length === 0,
    violations.length === 0
      ? "All nodes have labels"
      : `Found ${violations.length} node(s) without label`,
    violations
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDGE INVARIANTS — Целостность рёбер
// ═══════════════════════════════════════════════════════════════════════════

/**
 * INV-E1: Все рёбра имеют type.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkAllEdgesHaveType(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const violations = [];
  
  for (const edge of edges) {
    if (!edge.type || typeof edge.type !== "string") {
      violations.push({
        type: "missing_type",
        edgeId: edge.id,
        edge,
      });
    }
  }
  
  return createResult(
    "INV-E1: All Edges Have Type",
    violations.length === 0,
    violations.length === 0
      ? "All edges have type"
      : `Found ${violations.length} edge(s) without type`,
    violations
  );
}

/**
 * INV-E2: Все типы рёбер известны схеме.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkKnownEdgeTypes(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const knownTypes = new Set(Object.values(EDGE_TYPES));
  const violations = [];
  
  for (const edge of edges) {
    if (edge.type && !knownTypes.has(edge.type)) {
      violations.push({
        type: "unknown_type",
        edgeId: edge.id,
        edgeType: edge.type,
      });
    }
  }
  
  return createResult(
    "INV-E2: Known Edge Types",
    violations.length === 0,
    violations.length === 0
      ? "All edge types are known"
      : `Found ${violations.length} edge(s) with unknown type`,
    violations
  );
}

/**
 * INV-E3: Нет дублирующихся рёбер (одинаковые source, target, type).
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkNoDuplicateEdges(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const seen = new Set();
  const violations = [];
  
  for (const edge of edges) {
    const key = `${edge.source}|${edge.target}|${edge.type}`;
    if (seen.has(key)) {
      violations.push({
        type: "duplicate_edge",
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        edgeType: edge.type,
      });
    } else {
      seen.add(key);
    }
  }
  
  return createResult(
    "INV-E3: No Duplicate Edges",
    violations.length === 0,
    violations.length === 0
      ? "No duplicate edges found"
      : `Found ${violations.length} duplicate edge(s)`,
    violations
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTIVITY INVARIANTS — Связность
// ═══════════════════════════════════════════════════════════════════════════

/**
 * INV-C1: Граф связен (одна компонента связности).
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkGraphConnected(graphData) {
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || graphData.links || [];
  
  if (nodes.length === 0) {
    return createResult(
      "INV-C1: Graph Connected",
      true,
      "Empty graph is trivially connected",
      []
    );
  }
  
  // Build adjacency
  const adj = new Map();
  for (const node of nodes) {
    adj.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (adj.has(edge.source) && adj.has(edge.target)) {
      adj.get(edge.source).add(edge.target);
      adj.get(edge.target).add(edge.source);
    }
  }
  
  // BFS from first node
  const visited = new Set();
  const queue = [nodes[0].id];
  visited.add(nodes[0].id);
  
  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighbor of adj.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  const unreachable = nodes.filter(n => !visited.has(n.id));
  
  return createResult(
    "INV-C1: Graph Connected",
    unreachable.length === 0,
    unreachable.length === 0
      ? "Graph is connected"
      : `Graph has ${unreachable.length} unreachable node(s)`,
    unreachable.map(n => ({ type: "unreachable", nodeId: n.id }))
  );
}

/**
 * INV-C2: Нет изолированных узлов (узлов без рёбер).
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkNoIsolatedNodes(graphData) {
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || graphData.links || [];
  
  const connectedNodes = new Set();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }
  
  const isolated = nodes.filter(n => !connectedNodes.has(n.id));
  
  return createResult(
    "INV-C2: No Isolated Nodes",
    isolated.length === 0,
    isolated.length === 0
      ? "No isolated nodes"
      : `Found ${isolated.length} isolated node(s)`,
    isolated.map(n => ({ type: "isolated", nodeId: n.id, label: n.label }))
  );
}

/**
 * INV-C3: Существует корневой узел (type = root).
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkHasRootNode(graphData) {
  const nodes = graphData.nodes || [];
  const roots = nodes.filter(n => n.type === NODE_TYPES.ROOT);
  
  return createResult(
    "INV-C3: Has Root Node",
    roots.length > 0,
    roots.length > 0
      ? `Found ${roots.length} root node(s): ${roots.map(r => r.id).join(", ")}`
      : "No root node found",
    roots.length === 0 ? [{ type: "no_root" }] : []
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HIERARCHY INVARIANTS — Иерархия
// ═══════════════════════════════════════════════════════════════════════════

/**
 * INV-H1: Нет циклов в иерархии contains.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkNoContainsCycles(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const containsEdges = edges.filter(e => e.type === EDGE_TYPES.CONTAINS);
  
  // Build directed graph
  const children = new Map();
  for (const edge of containsEdges) {
    if (!children.has(edge.source)) {
      children.set(edge.source, []);
    }
    children.get(edge.source).push(edge.target);
  }
  
  // DFS for cycle detection
  const visited = new Set();
  const inStack = new Set();
  const cycles = [];
  
  function dfs(nodeId, path) {
    if (inStack.has(nodeId)) {
      // Found cycle
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart));
      return;
    }
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);
    
    for (const child of children.get(nodeId) || []) {
      dfs(child, [...path]);
    }
    
    inStack.delete(nodeId);
  }
  
  for (const nodeId of children.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }
  
  return createResult(
    "INV-H1: No Contains Cycles",
    cycles.length === 0,
    cycles.length === 0
      ? "No cycles in contains hierarchy"
      : `Found ${cycles.length} cycle(s) in contains hierarchy`,
    cycles.map(c => ({ type: "cycle", nodes: c }))
  );
}

/**
 * INV-H2: Каждый узел имеет не более одного родителя в contains.
 * @param {Object} graphData - { nodes, edges }
 * @returns {InvariantResult}
 */
export function checkSingleParent(graphData) {
  const edges = graphData.edges || graphData.links || [];
  const containsEdges = edges.filter(e => e.type === EDGE_TYPES.CONTAINS);
  
  const parents = new Map();
  const violations = [];
  
  for (const edge of containsEdges) {
    if (parents.has(edge.target)) {
      violations.push({
        type: "multiple_parents",
        nodeId: edge.target,
        parents: [parents.get(edge.target), edge.source],
      });
    } else {
      parents.set(edge.target, edge.source);
    }
  }
  
  return createResult(
    "INV-H2: Single Parent in Contains",
    violations.length === 0,
    violations.length === 0
      ? "Each node has at most one parent"
      : `Found ${violations.length} node(s) with multiple parents`,
    violations
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVARIANT CHECKER — Проверка всех инвариантов
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Уровни строгости проверки.
 */
export const STRICTNESS = Object.freeze({
  MINIMAL: "minimal",     // Только критические (G1-G3, I1-I2)
  STANDARD: "standard",   // Стандартные (+ E1, C2)
  STRICT: "strict",       // Строгие (+ все остальные)
});

/**
 * Проверить все инварианты графа.
 */
export class InvariantChecker {
  constructor() {
    /** @type {Array<InvariantResult>} */
    this.results = [];
  }
  
  /**
   * Сбросить результаты.
   */
  reset() {
    this.results = [];
  }
  
  /**
   * Проверить все инварианты.
   * @param {Object} graphData - { nodes, edges }
   * @param {string} strictness - Уровень строгости
   * @returns {Object} - { valid, results, summary }
   */
  checkAll(graphData, strictness = STRICTNESS.STANDARD) {
    this.reset();
    
    // Minimal invariants (always checked)
    this.results.push(checkUniqueNodeIds(graphData));
    this.results.push(checkUniqueEdgeIds(graphData));
    this.results.push(checkNoDanglingEdges(graphData));
    this.results.push(checkAllNodesHaveId(graphData));
    this.results.push(checkAllNodesHaveType(graphData));
    
    if (strictness === STRICTNESS.MINIMAL) {
      return this._buildResult();
    }
    
    // Standard invariants
    this.results.push(checkAllEdgesHaveType(graphData));
    this.results.push(checkNoIsolatedNodes(graphData));
    this.results.push(checkNoSelfLoops(graphData));
    
    if (strictness === STRICTNESS.STANDARD) {
      return this._buildResult();
    }
    
    // Strict invariants
    this.results.push(checkKnownNodeTypes(graphData));
    this.results.push(checkKnownEdgeTypes(graphData));
    this.results.push(checkAllNodesHaveLabel(graphData));
    this.results.push(checkNoDuplicateEdges(graphData));
    this.results.push(checkGraphConnected(graphData));
    this.results.push(checkHasRootNode(graphData));
    this.results.push(checkNoContainsCycles(graphData));
    this.results.push(checkSingleParent(graphData));
    
    return this._buildResult();
  }
  
  /**
   * Построить итоговый результат.
   * @private
   */
  _buildResult() {
    const passed = this.results.filter(r => r.holds);
    const failed = this.results.filter(r => !r.holds);
    
    return {
      valid: failed.length === 0,
      total: this.results.length,
      passed: passed.length,
      failed: failed.length,
      results: [...this.results],
      summary: failed.length === 0
        ? `All ${this.results.length} invariants hold`
        : `${failed.length}/${this.results.length} invariants violated`,
      violations: failed,
    };
  }
  
  /**
   * Проверить конкретный инвариант.
   * @param {string} invariantName - Имя инварианта (например, "INV-G1")
   * @param {Object} graphData - { nodes, edges }
   * @returns {InvariantResult|null}
   */
  checkOne(invariantName, graphData) {
    const checks = {
      "INV-G1": checkUniqueNodeIds,
      "INV-G2": checkUniqueEdgeIds,
      "INV-G3": checkNoDanglingEdges,
      "INV-G4": checkNoSelfLoops,
      "INV-I1": checkAllNodesHaveId,
      "INV-I2": checkAllNodesHaveType,
      "INV-I3": checkKnownNodeTypes,
      "INV-I4": checkAllNodesHaveLabel,
      "INV-E1": checkAllEdgesHaveType,
      "INV-E2": checkKnownEdgeTypes,
      "INV-E3": checkNoDuplicateEdges,
      "INV-C1": checkGraphConnected,
      "INV-C2": checkNoIsolatedNodes,
      "INV-C3": checkHasRootNode,
      "INV-H1": checkNoContainsCycles,
      "INV-H2": checkSingleParent,
    };
    
    const checkFn = checks[invariantName];
    if (!checkFn) return null;
    
    return checkFn(graphData);
  }
  
  /**
   * Получить список всех инвариантов.
   * @returns {Array<Object>}
   */
  static listInvariants() {
    return [
      { id: "INV-G1", name: "Unique Node IDs", category: "Graph" },
      { id: "INV-G2", name: "Unique Edge IDs", category: "Graph" },
      { id: "INV-G3", name: "No Dangling Edges", category: "Graph" },
      { id: "INV-G4", name: "No Self-Loops", category: "Graph" },
      { id: "INV-I1", name: "All Nodes Have ID", category: "Identity" },
      { id: "INV-I2", name: "All Nodes Have Type", category: "Identity" },
      { id: "INV-I3", name: "Known Node Types", category: "Identity" },
      { id: "INV-I4", name: "All Nodes Have Label", category: "Identity" },
      { id: "INV-E1", name: "All Edges Have Type", category: "Edge" },
      { id: "INV-E2", name: "Known Edge Types", category: "Edge" },
      { id: "INV-E3", name: "No Duplicate Edges", category: "Edge" },
      { id: "INV-C1", name: "Graph Connected", category: "Connectivity" },
      { id: "INV-C2", name: "No Isolated Nodes", category: "Connectivity" },
      { id: "INV-C3", name: "Has Root Node", category: "Connectivity" },
      { id: "INV-H1", name: "No Contains Cycles", category: "Hierarchy" },
      { id: "INV-H2", name: "Single Parent in Contains", category: "Hierarchy" },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Graph invariants
  checkUniqueNodeIds,
  checkUniqueEdgeIds,
  checkNoDanglingEdges,
  checkNoSelfLoops,
  // Identity invariants
  checkAllNodesHaveId,
  checkAllNodesHaveType,
  checkKnownNodeTypes,
  checkAllNodesHaveLabel,
  // Edge invariants
  checkAllEdgesHaveType,
  checkKnownEdgeTypes,
  checkNoDuplicateEdges,
  // Connectivity invariants
  checkGraphConnected,
  checkNoIsolatedNodes,
  checkHasRootNode,
  // Hierarchy invariants
  checkNoContainsCycles,
  checkSingleParent,
  // Checker
  InvariantChecker,
  STRICTNESS,
};
