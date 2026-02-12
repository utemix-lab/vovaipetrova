/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH RAG PROJECTION — Индексация и поиск по графу
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * P3.7: GraphRAG интеграция
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - GraphRAG — это проекция, а не новый Core
 * - Читает GraphModel, OwnershipGraph, Identity
 * - Полностью детерминированный
 * - Не использует LLM внутри
 * - Не хранит альтернативное состояние графа
 * 
 * BOUNDARY FREEZE:
 * - НЕ импортирует ничего из visitor
 * - НЕ изменяет Core
 * - НЕ использует DOM
 * - Чистая индексация и поиск
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const ragProjection = new GraphRAGProjection(graphModel, ownershipGraph);
 * ragProjection.buildIndex();
 * const result = ragProjection.queryByNode("vova");
 * const context = ragProjection.expandContext(["vova"], 2);
 * const llmContext = ragProjection.toLLMContext();
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Projection } from "./Projection.js";
import { extractIdentityFromNode, getDisplayName } from "./Identity.js";

/**
 * @typedef {Object} NodeDocument
 * @property {string} id - ID узла
 * @property {string} label - Отображаемое имя
 * @property {string} type - Тип узла
 * @property {Object} metadata - Метаданные (canonicalName, aliases, slug)
 * @property {Array<string>} neighbors - ID соседних узлов
 * @property {Object} ownership - Информация о владении
 */

/**
 * @typedef {Object} QueryResult
 * @property {NodeDocument} node - Документ узла
 * @property {Array<NodeDocument>} neighbors - Соседние узлы
 * @property {Object} ownership - Информация о владении
 */

/**
 * @typedef {Object} ContextResult
 * @property {Array<NodeDocument>} nodes - Узлы в контексте
 * @property {Array<Object>} edges - Рёбра в контексте
 * @property {number} depth - Глубина расширения
 */

/**
 * GraphRAG-проекция для индексации и поиска по графу.
 * 
 * @pure Не использует LLM, не мутирует Core
 */
export class GraphRAGProjection extends Projection {
  /**
   * @param {import("./GraphModel.js").GraphModel} graphModel
   * @param {import("./OwnershipGraph.js").OwnershipGraph} [ownershipGraph]
   */
  constructor(graphModel, ownershipGraph = null) {
    super("graphrag");
    
    /** @type {import("./GraphModel.js").GraphModel} */
    this.graphModel = graphModel;
    
    /** @type {import("./OwnershipGraph.js").OwnershipGraph|null} */
    this.ownershipGraph = ownershipGraph;
    
    /** @type {Map<string, NodeDocument>} */
    this.nodeIndex = new Map();
    
    /** @type {Map<string, Set<string>>} */
    this.adjacency = new Map();
    
    /** @type {Map<string, Set<string>>} */
    this.textIndex = new Map();
    
    /** @type {boolean} */
    this.indexed = false;
    
    this.initialized = true;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // buildIndex() — идемпотентная индексация
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Построить индекс графа.
   * Идемпотентная операция — можно вызывать повторно.
   */
  buildIndex() {
    // Очистить предыдущий индекс
    this.nodeIndex.clear();
    this.adjacency.clear();
    this.textIndex.clear();
    
    // Индексировать узлы
    for (const node of this.graphModel.getNodes()) {
      const doc = this._createNodeDocument(node);
      this.nodeIndex.set(node.id, doc);
      
      // Инициализировать adjacency
      if (!this.adjacency.has(node.id)) {
        this.adjacency.set(node.id, new Set());
      }
      
      // Индексировать текст
      this._indexText(node.id, doc);
    }
    
    // Построить adjacency из рёбер
    for (const edge of this.graphModel.getEdges()) {
      const sourceId = typeof edge.source === "object" ? edge.source.id : edge.source;
      const targetId = typeof edge.target === "object" ? edge.target.id : edge.target;
      
      if (!this.adjacency.has(sourceId)) {
        this.adjacency.set(sourceId, new Set());
      }
      if (!this.adjacency.has(targetId)) {
        this.adjacency.set(targetId, new Set());
      }
      
      this.adjacency.get(sourceId).add(targetId);
      this.adjacency.get(targetId).add(sourceId);
    }
    
    // Обновить neighbors в документах
    for (const [nodeId, doc] of this.nodeIndex) {
      const neighbors = this.adjacency.get(nodeId);
      doc.neighbors = neighbors ? [...neighbors] : [];
    }
    
    this.indexed = true;
  }
  
  /**
   * Создать документ узла.
   * @private
   * @param {Object} node
   * @returns {NodeDocument}
   */
  _createNodeDocument(node) {
    const identity = extractIdentityFromNode(node);
    const label = getDisplayName(identity) || node.id;
    
    return {
      id: node.id,
      label: String(label),
      type: node.type || "unknown",
      metadata: {
        canonicalName: identity.canonicalName || null,
        aliases: identity.aliases || [],
        slug: identity.slug || null
      },
      neighbors: [],
      ownership: this._getOwnershipInfo(node.id)
    };
  }
  
  /**
   * Получить информацию о владении для узла.
   * @private
   * @param {string} nodeId
   * @returns {Object}
   */
  _getOwnershipInfo(nodeId) {
    if (!this.ownershipGraph) {
      return { states: [], computations: [] };
    }
    
    // Найти состояния и вычисления, связанные с этим узлом
    const relatedStates = [];
    const relatedComputations = [];
    
    for (const state of this.ownershipGraph.getStates()) {
      if (state.owner.includes(nodeId) || state.state.includes(nodeId)) {
        relatedStates.push(state.state);
      }
    }
    
    for (const comp of this.ownershipGraph.getComputations()) {
      if (comp.owner.includes(nodeId) || comp.name.includes(nodeId)) {
        relatedComputations.push(comp.name);
      }
    }
    
    return { states: relatedStates, computations: relatedComputations };
  }
  
  /**
   * Индексировать текст узла.
   * @private
   * @param {string} nodeId
   * @param {NodeDocument} doc
   */
  _indexText(nodeId, doc) {
    const tokens = new Set();
    
    // Токенизировать ID узла
    this._tokenize(nodeId).forEach(t => tokens.add(t));
    
    // Токенизировать label
    this._tokenize(doc.label).forEach(t => tokens.add(t));
    
    // Токенизировать canonicalName
    if (doc.metadata.canonicalName) {
      this._tokenize(doc.metadata.canonicalName).forEach(t => tokens.add(t));
    }
    
    // Токенизировать aliases
    for (const alias of doc.metadata.aliases) {
      this._tokenize(alias).forEach(t => tokens.add(t));
    }
    
    // Токенизировать type
    this._tokenize(doc.type).forEach(t => tokens.add(t));
    
    // Добавить в textIndex
    for (const token of tokens) {
      if (!this.textIndex.has(token)) {
        this.textIndex.set(token, new Set());
      }
      this.textIndex.get(token).add(nodeId);
    }
  }
  
  /**
   * Токенизировать строку.
   * @private
   * @param {string} text
   * @returns {Array<string>}
   */
  _tokenize(text) {
    if (!text) return [];
    return String(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(t => t.length > 1);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // queryByNode(id) — структурированная выборка
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Запросить информацию по узлу.
   * @param {string} nodeId
   * @returns {QueryResult|null}
   */
  queryByNode(nodeId) {
    if (!this.indexed) {
      this.buildIndex();
    }
    
    const doc = this.nodeIndex.get(nodeId);
    if (!doc) return null;
    
    const neighbors = doc.neighbors
      .map(id => this.nodeIndex.get(id))
      .filter(Boolean);
    
    return {
      node: doc,
      neighbors,
      ownership: doc.ownership
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // queryByText(text) — токенизация + textIndex
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Поиск по тексту.
   * @param {string} text
   * @returns {Array<NodeDocument>}
   */
  queryByText(text) {
    if (!this.indexed) {
      this.buildIndex();
    }
    
    const tokens = this._tokenize(text);
    if (tokens.length === 0) return [];
    
    // Найти пересечение по всем токенам
    let resultIds = null;
    
    for (const token of tokens) {
      const matchingIds = this.textIndex.get(token);
      if (!matchingIds) {
        return []; // Токен не найден — пустой результат
      }
      
      if (resultIds === null) {
        resultIds = new Set(matchingIds);
      } else {
        // Пересечение
        resultIds = new Set([...resultIds].filter(id => matchingIds.has(id)));
      }
      
      if (resultIds.size === 0) return [];
    }
    
    // Вернуть документы
    return [...resultIds]
      .map(id => this.nodeIndex.get(id))
      .filter(Boolean);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // expandContext(nodeIds, depth) — BFS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Расширить контекст от заданных узлов.
   * @param {Array<string>} nodeIds - Начальные узлы
   * @param {number} [depth=1] - Глубина расширения (1-2 hop)
   * @returns {ContextResult}
   */
  expandContext(nodeIds, depth = 1) {
    if (!this.indexed) {
      this.buildIndex();
    }
    
    const visited = new Set();
    const queue = [];
    const edges = [];
    
    // Инициализировать очередь
    for (const nodeId of nodeIds) {
      if (this.nodeIndex.has(nodeId)) {
        queue.push({ id: nodeId, level: 0 });
        visited.add(nodeId);
      }
    }
    
    // BFS
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      
      if (level < depth) {
        const neighbors = this.adjacency.get(id) || new Set();
        for (const neighborId of neighbors) {
          // Добавить ребро
          edges.push({
            source: id,
            target: neighborId,
            level: level + 1
          });
          
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, level: level + 1 });
          }
        }
      }
    }
    
    // Собрать узлы
    const nodes = [...visited]
      .map(id => this.nodeIndex.get(id))
      .filter(Boolean);
    
    // Убрать дубликаты рёбер
    const uniqueEdges = [];
    const edgeSet = new Set();
    for (const edge of edges) {
      const key = [edge.source, edge.target].sort().join("-");
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        uniqueEdges.push(edge);
      }
    }
    
    return {
      nodes,
      edges: uniqueEdges,
      depth
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // toLLMContext() — экспорт для LLM
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Экспортировать весь граф как контекст для LLM.
   * @returns {Object}
   */
  toLLMContext() {
    if (!this.indexed) {
      this.buildIndex();
    }
    
    const nodes = [...this.nodeIndex.values()].map(doc => ({
      id: doc.id,
      label: doc.label,
      type: doc.type,
      canonicalName: doc.metadata.canonicalName,
      aliases: doc.metadata.aliases
    }));
    
    const edges = this.graphModel.getEdges().map(edge => ({
      source: typeof edge.source === "object" ? edge.source.id : edge.source,
      target: typeof edge.target === "object" ? edge.target.id : edge.target,
      type: edge.type || "related"
    }));
    
    const ownership = this.ownershipGraph ? {
      states: this.ownershipGraph.getStates().map(s => ({
        name: s.state,
        owner: s.owner
      })),
      computations: this.ownershipGraph.getComputations().map(c => ({
        name: c.name,
        owner: c.owner,
        inputs: c.inputs,
        outputs: c.outputs
      }))
    } : null;
    
    return {
      nodes,
      edges,
      ownership,
      stats: this.getStats()
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Вспомогательные методы
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить статистику индекса.
   * @returns {Object}
   */
  getStats() {
    return {
      indexed: this.indexed,
      nodeCount: this.nodeIndex.size,
      edgeCount: this.graphModel.edges.length,
      tokenCount: this.textIndex.size,
      avgNeighbors: this._calculateAvgNeighbors()
    };
  }
  
  /**
   * Вычислить среднее количество соседей.
   * @private
   * @returns {number}
   */
  _calculateAvgNeighbors() {
    if (this.adjacency.size === 0) return 0;
    let total = 0;
    for (const neighbors of this.adjacency.values()) {
      total += neighbors.size;
    }
    return total / this.adjacency.size;
  }
  
  /**
   * Проверить, проиндексирован ли граф.
   * @returns {boolean}
   */
  isIndexed() {
    return this.indexed;
  }
  
  /**
   * Получить все узлы определённого типа.
   * @param {string} type
   * @returns {Array<NodeDocument>}
   */
  getNodesByType(type) {
    if (!this.indexed) {
      this.buildIndex();
    }
    
    return [...this.nodeIndex.values()]
      .filter(doc => doc.type === type);
  }
  
  /**
   * Получить все типы узлов.
   * @returns {Array<string>}
   */
  getNodeTypes() {
    if (!this.indexed) {
      this.buildIndex();
    }
    
    const types = new Set();
    for (const doc of this.nodeIndex.values()) {
      types.add(doc.type);
    }
    return [...types];
  }
  
  /**
   * Уничтожить проекцию.
   */
  destroy() {
    this.nodeIndex.clear();
    this.adjacency.clear();
    this.textIndex.clear();
    this.graphModel = null;
    this.ownershipGraph = null;
    this.indexed = false;
    this.initialized = false;
  }
}
