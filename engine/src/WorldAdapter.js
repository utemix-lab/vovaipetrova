/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD ADAPTER — Адаптер для подключения мира к Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0d: World как подключаемый модуль
 * 
 * WorldAdapter превращает:
 *   мир как файлы → мир как подключаемый модуль
 * 
 * Это точка сборки мира:
 * - Загрузка schema
 * - Загрузка seed (опционально)
 * - Загрузка config (опционально)
 * - Создание Schema instance
 * - Будущий вход для migrations, presets
 * 
 * Engine не знает про конкретный мир (vovaipetrova).
 * Engine работает через абстрактный WorldAdapter.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Schema } from "./Schema.js";
import { WorldInterface, WorldValidator } from "./WorldInterface.js";

/**
 * Адаптер для подключения мира к MeaningEngine.
 * Реализует WorldInterface.
 */
export class WorldAdapter extends WorldInterface {
  /**
   * @param {object} options - Опции адаптера
   * @param {object} options.schemaData - Данные схемы мира
   * @param {object} [options.seedData] - Начальные данные графа
   * @param {object} [options.config] - Конфигурация мира
   * @param {object} [options.graph] - Готовый граф (GraphInterface)
   */
  constructor(options = {}) {
    super();
    
    const { schemaData, seedData, config, graph } = options;
    
    if (!schemaData) {
      throw new Error("WorldAdapter requires schemaData");
    }
    
    this._schemaData = schemaData;
    this._seedData = seedData || null;
    this._config = config || null;
    this._graph = graph || null;
    
    // Создаём Schema instance
    this._schema = new Schema(schemaData);
    
    // Если есть seed, но нет graph — создаём простой граф из seed
    if (seedData && !graph) {
      this._graph = this._createGraphFromSeed(seedData);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WORLD INTERFACE IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает схему мира.
   * @returns {Schema}
   */
  getSchema() {
    return this._schema;
  }
  
  /**
   * Возвращает граф мира.
   * @returns {GraphInterface}
   */
  getGraph() {
    if (!this._graph) {
      throw new Error("WorldAdapter: graph not available. Provide graph or seedData.");
    }
    return this._graph;
  }
  
  /**
   * Возвращает начальные данные.
   * @returns {object|null}
   */
  getSeed() {
    return this._seedData;
  }
  
  /**
   * Возвращает конфигурацию мира.
   * @returns {object|null}
   */
  getConfig() {
    return this._config;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает имя мира.
   * @returns {string}
   */
  getName() {
    return this._schema.name;
  }
  
  /**
   * Возвращает версию схемы мира.
   * @returns {string}
   */
  getVersion() {
    return this._schema.version;
  }
  
  /**
   * Возвращает описание мира.
   * @returns {string|undefined}
   */
  getDescription() {
    return this._schema.description;
  }
  
  /**
   * Проверяет, валиден ли мир.
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validate() {
    return WorldValidator.validate(this);
  }
  
  /**
   * Устанавливает граф мира.
   * @param {GraphInterface} graph
   */
  setGraph(graph) {
    this._graph = graph;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Создаёт простой граф из seed данных.
   * @private
   * @param {object} seedData - Данные seed
   * @returns {GraphInterface}
   */
  _createGraphFromSeed(seedData) {
    const nodes = seedData.nodes || [];
    const edges = seedData.edges || seedData.links || [];
    
    // Индекс узлов для быстрого доступа
    const nodesById = new Map();
    nodes.forEach(node => nodesById.set(node.id, node));
    
    // Индекс соседей
    const neighborsIndex = new Map();
    edges.forEach(edge => {
      // Source → Target
      if (!neighborsIndex.has(edge.source)) {
        neighborsIndex.set(edge.source, new Set());
      }
      neighborsIndex.get(edge.source).add(edge.target);
      
      // Target → Source (для ненаправленных)
      if (!neighborsIndex.has(edge.target)) {
        neighborsIndex.set(edge.target, new Set());
      }
      neighborsIndex.get(edge.target).add(edge.source);
    });
    
    return {
      getNodes: () => [...nodes],
      getEdges: () => [...edges],
      getNodeById: (id) => nodesById.get(id) || null,
      getNeighbors: (nodeId) => {
        const neighborIds = neighborsIndex.get(nodeId) || new Set();
        return [...neighborIds].map(id => nodesById.get(id)).filter(Boolean);
      },
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FACTORY METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Создаёт WorldAdapter из JSON объектов.
   * @param {object} schemaData - Данные схемы
   * @param {object} [seedData] - Данные seed
   * @param {object} [config] - Конфигурация
   * @returns {WorldAdapter}
   */
  static fromJSON(schemaData, seedData = null, config = null) {
    return new WorldAdapter({ schemaData, seedData, config });
  }
  
  /**
   * Создаёт пустой мир с минимальной схемой.
   * @param {string} [name="empty-world"] - Имя мира
   * @returns {WorldAdapter}
   */
  static empty(name = "empty-world") {
    const schemaData = {
      version: "1.0.0",
      name,
      description: "Empty world",
      nodeTypes: [],
      edgeTypes: [],
    };
    
    const seedData = {
      nodes: [],
      edges: [],
    };
    
    return new WorldAdapter({ schemaData, seedData });
  }
  
  /**
   * Создаёт мир с минимальной схемой (один тип узла, один тип ребра).
   * @param {string} [name="minimal-world"] - Имя мира
   * @returns {WorldAdapter}
   */
  static minimal(name = "minimal-world") {
    const schemaData = {
      version: "1.0.0",
      name,
      description: "Minimal world with one node type and one edge type",
      nodeTypes: [
        { id: "node", label: "Node" },
      ],
      edgeTypes: [
        { id: "edge", label: "Edge" },
      ],
    };
    
    const seedData = {
      nodes: [],
      edges: [],
    };
    
    return new WorldAdapter({ schemaData, seedData });
  }
}

export default WorldAdapter;
