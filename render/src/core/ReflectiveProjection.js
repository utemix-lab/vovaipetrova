/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REFLECTIVE PROJECTION — Мета-линза для структурной рефлексии
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4: Cryptocosm / Рефлексия
 * P4.1: ReflectiveProjection
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - Рефлексия = read-only
 * - Изменение = только через осознанное действие
 * - Читает Core, GraphRAGProjection, OWLProjection
 * - Анализирует структуру
 * - Ничего не меняет
 * - Без LLM
 * 
 * BOUNDARY FREEZE:
 * - НЕ импортирует ничего из visitor
 * - НЕ изменяет Core
 * - НЕ использует DOM
 * - Чистый структурный анализ
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const reflective = new ReflectiveProjection(graphModel, ownershipGraph);
 * const density = reflective.analyzeDensity();
 * const isolated = reflective.findIsolatedNodes();
 * const central = reflective.findHighCentralityNodes();
 * const report = reflective.getStructuralReport();
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Projection } from "./Projection.js";

/**
 * @typedef {Object} DensityAnalysis
 * @property {number} nodeCount - Количество узлов
 * @property {number} edgeCount - Количество рёбер
 * @property {number} density - Плотность графа (0-1)
 * @property {number} avgDegree - Средняя степень узла
 * @property {number} maxDegree - Максимальная степень
 * @property {number} minDegree - Минимальная степень
 */

/**
 * @typedef {Object} CentralityNode
 * @property {string} id - ID узла
 * @property {string} type - Тип узла
 * @property {number} degree - Степень узла
 * @property {number} normalizedCentrality - Нормализованная центральность (0-1)
 */

/**
 * @typedef {Object} StructuralReport
 * @property {DensityAnalysis} density - Анализ плотности
 * @property {Array<Object>} isolatedNodes - Изолированные узлы
 * @property {Array<CentralityNode>} highCentralityNodes - Центральные узлы
 * @property {Array<Object>} ownershipCycles - Циклы владения
 * @property {Object} typeDistribution - Распределение по типам
 * @property {Object} projectionCoverage - Покрытие проекций
 */

/**
 * Рефлексивная проекция для структурного анализа графа.
 * 
 * @pure Не мутирует Core, read-only анализ
 */
export class ReflectiveProjection extends Projection {
  /**
   * @param {import("./GraphModel.js").GraphModel} graphModel
   * @param {import("./OwnershipGraph.js").OwnershipGraph} [ownershipGraph]
   */
  constructor(graphModel, ownershipGraph = null) {
    super("reflective");
    
    /** @type {import("./GraphModel.js").GraphModel} */
    this.graphModel = graphModel;
    
    /** @type {import("./OwnershipGraph.js").OwnershipGraph|null} */
    this.ownershipGraph = ownershipGraph;
    
    /** @type {Map<string, number>} */
    this._degreeCache = new Map();
    
    /** @type {Map<string, Set<string>>} */
    this._adjacencyMap = new Map();
    
    /** @type {boolean} */
    this._cacheValid = false;
    
    this.initialized = true;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // analyzeDensity() — плотность графа
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Анализировать плотность графа.
   * @returns {DensityAnalysis}
   */
  analyzeDensity() {
    this._ensureCache();
    
    const nodeCount = this.graphModel.nodesById.size;
    const edgeCount = this.graphModel.edges.length;
    
    // Плотность = E / (N * (N - 1) / 2) для неориентированного графа
    const maxEdges = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 0;
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;
    
    // Степени узлов
    const degrees = [...this._degreeCache.values()];
    const avgDegree = degrees.length > 0 
      ? degrees.reduce((a, b) => a + b, 0) / degrees.length 
      : 0;
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;
    const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;
    
    return {
      nodeCount,
      edgeCount,
      density: Math.round(density * 10000) / 10000,
      avgDegree: Math.round(avgDegree * 100) / 100,
      maxDegree,
      minDegree
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // findIsolatedNodes() — изолированные узлы
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Найти изолированные узлы (без связей).
   * @returns {Array<Object>}
   */
  findIsolatedNodes() {
    this._ensureCache();
    
    const isolated = [];
    
    for (const node of this.graphModel.getNodes()) {
      const degree = this._degreeCache.get(node.id) || 0;
      if (degree === 0) {
        isolated.push({
          id: node.id,
          type: node.type || "unknown",
          label: node.label || node.id
        });
      }
    }
    
    return isolated;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // findHighCentralityNodes() — центральные узлы (degree centrality)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Найти узлы с высокой центральностью.
   * @param {number} [topN=10] - Количество топ-узлов
   * @returns {Array<CentralityNode>}
   */
  findHighCentralityNodes(topN = 10) {
    this._ensureCache();
    
    const nodeCount = this.graphModel.nodesById.size;
    const maxPossibleDegree = nodeCount > 1 ? nodeCount - 1 : 1;
    
    const nodes = [];
    
    for (const node of this.graphModel.getNodes()) {
      const degree = this._degreeCache.get(node.id) || 0;
      nodes.push({
        id: node.id,
        type: node.type || "unknown",
        degree,
        normalizedCentrality: Math.round((degree / maxPossibleDegree) * 10000) / 10000
      });
    }
    
    // Сортировка по степени (убывание)
    nodes.sort((a, b) => b.degree - a.degree);
    
    return nodes.slice(0, topN);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // detectOwnershipCycles() — циклы владения
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Обнаружить циклы владения в OwnershipGraph.
   * @returns {Array<Object>}
   */
  detectOwnershipCycles() {
    if (!this.ownershipGraph) {
      return [];
    }
    
    const cycles = [];
    const states = this.ownershipGraph.getStates();
    const computations = this.ownershipGraph.getComputations();
    
    // Построить граф зависимостей
    const dependencies = new Map();
    
    for (const comp of computations) {
      for (const input of comp.inputs || []) {
        if (!dependencies.has(input)) {
          dependencies.set(input, new Set());
        }
        for (const output of comp.outputs || []) {
          dependencies.get(input).add(output);
        }
      }
    }
    
    // DFS для поиска циклов
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (node, path) => {
      if (recursionStack.has(node)) {
        // Найден цикл
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart);
        cycle.push(node);
        cycles.push({
          nodes: cycle,
          length: cycle.length - 1
        });
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const neighbors = dependencies.get(node) || new Set();
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path]);
      }
      
      recursionStack.delete(node);
    };
    
    for (const state of states) {
      if (!visited.has(state.state)) {
        dfs(state.state, []);
      }
    }
    
    return cycles;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // mapProjectionCoverage() — покрытие проекций
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Оценить покрытие проекций.
   * @returns {Object}
   */
  mapProjectionCoverage() {
    const nodeCount = this.graphModel.nodesById.size;
    const edgeCount = this.graphModel.edges.length;
    
    // Проверить какие узлы имеют необходимые данные для разных проекций
    let visitorReady = 0;
    let owlReady = 0;
    let ragReady = 0;
    
    for (const node of this.graphModel.getNodes()) {
      // VisitorProjection: нужен id, type
      if (node.id && node.type) {
        visitorReady++;
      }
      
      // OWLProjection: нужен id, type, label
      if (node.id && node.type && (node.label || node.canonicalName)) {
        owlReady++;
      }
      
      // GraphRAGProjection: нужен id, любые текстовые поля
      if (node.id && (node.label || node.canonicalName || node.type)) {
        ragReady++;
      }
    }
    
    return {
      total: {
        nodes: nodeCount,
        edges: edgeCount
      },
      visitor: {
        readyNodes: visitorReady,
        coverage: nodeCount > 0 ? Math.round((visitorReady / nodeCount) * 100) : 0
      },
      owl: {
        readyNodes: owlReady,
        coverage: nodeCount > 0 ? Math.round((owlReady / nodeCount) * 100) : 0
      },
      graphrag: {
        readyNodes: ragReady,
        coverage: nodeCount > 0 ? Math.round((ragReady / nodeCount) * 100) : 0
      },
      ownership: {
        states: this.ownershipGraph ? this.ownershipGraph.getStates().length : 0,
        computations: this.ownershipGraph ? this.ownershipGraph.getComputations().length : 0
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // getTypeDistribution() — распределение по типам
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить распределение узлов по типам.
   * @returns {Object}
   */
  getTypeDistribution() {
    this._ensureCache();
    const distribution = {};
    
    for (const node of this.graphModel.getNodes()) {
      const type = node.type || "unknown";
      if (!distribution[type]) {
        distribution[type] = {
          count: 0,
          percentage: 0,
          avgDegree: 0,
          totalDegree: 0
        };
      }
      distribution[type].count++;
      distribution[type].totalDegree += this._degreeCache.get(node.id) || 0;
    }
    
    const totalNodes = this.graphModel.nodesById.size;
    
    for (const type in distribution) {
      distribution[type].percentage = totalNodes > 0 
        ? Math.round((distribution[type].count / totalNodes) * 100) 
        : 0;
      distribution[type].avgDegree = distribution[type].count > 0
        ? Math.round((distribution[type].totalDegree / distribution[type].count) * 100) / 100
        : 0;
      delete distribution[type].totalDegree;
    }
    
    return distribution;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // getStructuralReport() — полный отчёт
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить полный структурный отчёт.
   * @returns {StructuralReport}
   */
  getStructuralReport() {
    this._ensureCache();
    
    return {
      density: this.analyzeDensity(),
      isolatedNodes: this.findIsolatedNodes(),
      highCentralityNodes: this.findHighCentralityNodes(5),
      ownershipCycles: this.detectOwnershipCycles(),
      typeDistribution: this.getTypeDistribution(),
      projectionCoverage: this.mapProjectionCoverage()
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Дополнительные методы анализа
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Найти компоненты связности.
   * @returns {Array<Array<string>>}
   */
  findConnectedComponents() {
    this._ensureCache();
    const visited = new Set();
    const components = [];
    
    const bfs = (startId) => {
      const component = [];
      const queue = [startId];
      visited.add(startId);
      
      while (queue.length > 0) {
        const nodeId = queue.shift();
        component.push(nodeId);
        
        // Использовать adjacency из кэша
        const neighborIds = this._adjacencyMap.get(nodeId) || new Set();
        for (const neighborId of neighborIds) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        }
      }
      
      return component;
    };
    
    for (const node of this.graphModel.getNodes()) {
      if (!visited.has(node.id)) {
        const component = bfs(node.id);
        components.push(component);
      }
    }
    
    // Сортировка по размеру (убывание)
    components.sort((a, b) => b.length - a.length);
    
    return components;
  }
  
  /**
   * Проверить связность графа.
   * @returns {Object}
   */
  checkConnectivity() {
    const components = this.findConnectedComponents();
    const nodeCount = this.graphModel.nodesById.size;
    
    return {
      isConnected: components.length <= 1,
      componentCount: components.length,
      largestComponent: components.length > 0 ? components[0].length : 0,
      smallestComponent: components.length > 0 ? components[components.length - 1].length : 0,
      fragmentationRatio: nodeCount > 0 
        ? Math.round((1 - (components.length > 0 ? components[0].length : 0) / nodeCount) * 100) / 100
        : 0
    };
  }
  
  /**
   * Найти мосты (рёбра, удаление которых разрывает граф).
   * @returns {Array<Object>}
   */
  findBridges() {
    this._ensureCache();
    const bridges = [];
    const visited = new Set();
    const disc = new Map();
    const low = new Map();
    const parent = new Map();
    let time = 0;
    
    const dfs = (nodeId) => {
      visited.add(nodeId);
      disc.set(nodeId, time);
      low.set(nodeId, time);
      time++;
      
      const neighborIds = this._adjacencyMap.get(nodeId) || new Set();
      for (const neighborId of neighborIds) {
        if (!visited.has(neighborId)) {
          parent.set(neighborId, nodeId);
          dfs(neighborId);
          
          low.set(nodeId, Math.min(low.get(nodeId), low.get(neighborId)));
          
          if (low.get(neighborId) > disc.get(nodeId)) {
            bridges.push({
              source: nodeId,
              target: neighborId
            });
          }
        } else if (neighborId !== parent.get(nodeId)) {
          low.set(nodeId, Math.min(low.get(nodeId), disc.get(neighborId)));
        }
      }
    };
    
    for (const node of this.graphModel.getNodes()) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }
    
    return bridges;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Вспомогательные методы
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Обеспечить актуальность кэша степеней и adjacency.
   * @private
   */
  _ensureCache() {
    if (this._cacheValid) return;
    
    this._degreeCache.clear();
    this._adjacencyMap.clear();
    
    // Инициализировать все узлы с нулевой степенью и пустым adjacency
    for (const node of this.graphModel.getNodes()) {
      this._degreeCache.set(node.id, 0);
      this._adjacencyMap.set(node.id, new Set());
    }
    
    // Подсчитать степени и построить adjacency из рёбер
    for (const edge of this.graphModel.getEdges()) {
      const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source;
      const targetId = typeof edge.target === "object" ? edge.target.id : edge.target;
      
      this._degreeCache.set(sourceId, (this._degreeCache.get(sourceId) || 0) + 1);
      this._degreeCache.set(targetId, (this._degreeCache.get(targetId) || 0) + 1);
      
      // Bidirectional adjacency
      if (!this._adjacencyMap.has(sourceId)) {
        this._adjacencyMap.set(sourceId, new Set());
      }
      if (!this._adjacencyMap.has(targetId)) {
        this._adjacencyMap.set(targetId, new Set());
      }
      this._adjacencyMap.get(sourceId).add(targetId);
      this._adjacencyMap.get(targetId).add(sourceId);
    }
    
    this._cacheValid = true;
  }
  
  /**
   * Инвалидировать кэш.
   */
  invalidateCache() {
    this._cacheValid = false;
  }
  
  /**
   * Получить статистику.
   * @returns {Object}
   */
  getStats() {
    return {
      nodeCount: this.graphModel.nodesById.size,
      edgeCount: this.graphModel.edges.length,
      hasOwnership: this.ownershipGraph !== null,
      cacheValid: this._cacheValid
    };
  }
  
  /**
   * Уничтожить проекцию.
   */
  destroy() {
    this._degreeCache.clear();
    this._adjacencyMap.clear();
    this.graphModel = null;
    this.ownershipGraph = null;
    this._cacheValid = false;
    this.initialized = false;
  }
}
