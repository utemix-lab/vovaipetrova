/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEANING ENGINE — Универсальный механизм для семантических графов
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 5.0: Separation
 * 
 * Engine не знает:
 * - Философии мира
 * - Конкретных типов узлов
 * - UI
 * 
 * Engine обеспечивает:
 * - Целостность (инварианты)
 * - Управляемую эволюцию (ChangeProtocol)
 * - Рефлексию (ReflectiveProjection)
 * - Снапшоты (GraphSnapshot)
 * - Валидацию (SchemaValidator)
 * - LLM-оркестрацию (LLMReflectionEngine)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// P5.0a.1 — World Interface Contract
export {
  WorldInterface,
  SchemaValidator,
  GraphValidator,
  WorldValidator,
} from "./WorldInterface.js";

// P5.0b — Abstract Schema
export { Schema } from "./Schema.js";

// P5.0d — World Adapter
export { WorldAdapter } from "./WorldAdapter.js";

// P6.0b — Specification Reader
export { SpecificationReader } from "./SpecificationReader.js";

// T3.0 — Epistemic Operators
export { CatalogRegistry } from "./CatalogRegistry.js";
export { OperatorEngine } from "./OperatorEngine.js";
export { CatalogValidator } from "./WorldInterface.js";

// Internal import for MeaningEngine
import { WorldValidator } from "./WorldInterface.js";
import { SpecificationReader } from "./SpecificationReader.js";
import { CatalogRegistry } from "./CatalogRegistry.js";
import { OperatorEngine } from "./OperatorEngine.js";

export const ENGINE_VERSION = "0.1.0";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEANING ENGINE — Главный класс Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0e: Engine запускается с любым миром
 * 
 * MeaningEngine — универсальный механизм для работы с семантическими графами.
 * Он не знает конкретных типов узлов, философии мира или UI.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class MeaningEngine {
  /**
   * @param {WorldInterface|WorldAdapter} world - Мир для подключения
   */
  constructor(world) {
    if (!world) {
      throw new Error("MeaningEngine requires a world");
    }
    
    // Валидируем мир
    const validation = WorldValidator.validate(world);
    if (!validation.valid) {
      throw new Error(`Invalid world: ${validation.errors.join(", ")}`);
    }
    
    this._world = world;
    this._schema = world.getSchema();
    this._graph = null;
    this._catalogs = null;
    this._operators = null;
    this._initialized = false;
    
    // Попытка получить граф (может быть недоступен)
    try {
      this._graph = world.getGraph();
    } catch {
      // Граф недоступен — это нормально для пустого мира
    }
    
    // Попытка получить каталоги (опционально)
    this._initCatalogs();
  }
  
  /**
   * Инициализирует каталоги и операторы.
   * @private
   */
  _initCatalogs() {
    try {
      if (typeof this._world.getCatalogs === "function") {
        const catalogsData = this._world.getCatalogs();
        if (catalogsData) {
          this._catalogs = new CatalogRegistry(catalogsData);
          if (this._graph) {
            this._operators = new OperatorEngine(this._graph, this._catalogs);
          }
        }
      }
    } catch {
      // Каталоги недоступны — это нормально
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Версия Engine.
   * @returns {string}
   */
  getVersion() {
    return ENGINE_VERSION;
  }
  
  /**
   * Имя подключённого мира.
   * @returns {string}
   */
  getWorldName() {
    return this._schema.name;
  }
  
  /**
   * Версия схемы мира.
   * @returns {string}
   */
  getWorldVersion() {
    return this._schema.version;
  }
  
  /**
   * Схема мира.
   * @returns {Schema}
   */
  getSchema() {
    return this._schema;
  }
  
  /**
   * Граф мира.
   * @returns {GraphInterface|null}
   */
  getGraph() {
    return this._graph;
  }
  
  /**
   * Мир.
   * @returns {WorldInterface}
   */
  getWorld() {
    return this._world;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEMA OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проверяет, допустим ли тип узла.
   * @param {string} nodeType
   * @returns {boolean}
   */
  isValidNodeType(nodeType) {
    return this._schema.isValidNodeType(nodeType);
  }
  
  /**
   * Проверяет, допустим ли тип ребра.
   * @param {string} edgeType
   * @returns {boolean}
   */
  isValidEdgeType(edgeType) {
    return this._schema.isValidEdgeType(edgeType);
  }
  
  /**
   * Валидирует узел против схемы.
   * @param {object} node
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateNode(node) {
    return this._schema.validateNode(node);
  }
  
  /**
   * Валидирует ребро против схемы.
   * @param {object} edge
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateEdge(edge) {
    const getNodeType = this._graph 
      ? (id) => this._graph.getNodeById(id)?.type 
      : null;
    return this._schema.validateEdge(edge, getNodeType);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPH OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Количество узлов в графе.
   * @returns {number}
   */
  getNodeCount() {
    return this._graph?.getNodes()?.length ?? 0;
  }
  
  /**
   * Количество рёбер в графе.
   * @returns {number}
   */
  getEdgeCount() {
    return this._graph?.getEdges()?.length ?? 0;
  }
  
  /**
   * Получить узел по ID.
   * @param {string} id
   * @returns {object|null}
   */
  getNodeById(id) {
    return this._graph?.getNodeById(id) ?? null;
  }
  
  /**
   * Получить соседей узла.
   * @param {string} nodeId
   * @returns {object[]}
   */
  getNeighbors(nodeId) {
    return this._graph?.getNeighbors(nodeId) ?? [];
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CATALOGS & OPERATORS (T3.0)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проверяет, есть ли каталоги в мире.
   * @returns {boolean}
   */
  hasCatalogs() {
    return this._catalogs !== null;
  }
  
  /**
   * Возвращает реестр каталогов.
   * @returns {CatalogRegistry|null}
   */
  getCatalogs() {
    return this._catalogs;
  }
  
  /**
   * Проверяет, доступны ли операторы.
   * @returns {boolean}
   */
  hasOperators() {
    return this._operators !== null;
  }
  
  /**
   * Возвращает движок операторов.
   * @returns {OperatorEngine|null}
   */
  getOperators() {
    return this._operators;
  }
  
  /**
   * Проецирует каталог через узел графа.
   * Shortcut для engine.getOperators().project()
   * 
   * @param {string} nodeId - ID узла
   * @param {string} catalogId - ID каталога
   * @param {object} options - Опции проекции
   * @returns {object[]} - Записи каталога
   */
  project(nodeId, catalogId, options = {}) {
    if (!this._operators) {
      return [];
    }
    return this._operators.project(nodeId, catalogId, options);
  }
  
  /**
   * Фильтрует записи по предикату или атрибутам.
   * Shortcut для engine.getOperators().filter()
   * 
   * @param {object[]} entries - Записи
   * @param {function|object} predicate - Фильтр
   * @returns {object[]}
   */
  filter(entries, predicate) {
    if (!this._operators) {
      return [];
    }
    return this._operators.filter(entries, predicate);
  }
  
  /**
   * Проецирует и фильтрует за один вызов.
   * Shortcut для engine.getOperators().projectAndFilter()
   * 
   * @param {string} nodeId - ID узла
   * @param {string} catalogId - ID каталога
   * @param {function|object} predicate - Фильтр
   * @param {object} projectOptions - Опции проекции
   * @returns {object[]}
   */
  projectAndFilter(nodeId, catalogId, predicate, projectOptions = {}) {
    if (!this._operators) {
      return [];
    }
    return this._operators.projectAndFilter(nodeId, catalogId, predicate, projectOptions);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Статистика Engine.
   * @returns {object}
   */
  getStats() {
    const stats = {
      engineVersion: ENGINE_VERSION,
      worldName: this.getWorldName(),
      worldVersion: this.getWorldVersion(),
      nodeTypes: this._schema.getNodeTypeIds().length,
      edgeTypes: this._schema.getEdgeTypeIds().length,
      nodeCount: this.getNodeCount(),
      edgeCount: this.getEdgeCount(),
      hasGraph: this._graph !== null,
      hasCatalogs: this._catalogs !== null,
      hasOperators: this._operators !== null,
    };
    
    if (this._catalogs) {
      stats.catalogs = this._catalogs.getStats();
    }
    
    return stats;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORM SPECIFICATION (P6.0c)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает SpecificationReader для доступа к спецификации платформы.
   * @returns {SpecificationReader}
   */
  static getSpecificationReader() {
    return SpecificationReader.load();
  }
  
  /**
   * Возвращает полную спецификацию платформы.
   * @returns {object}
   */
  static getSpecification() {
    return SpecificationReader.load().getSpecification();
  }
  
  /**
   * Возвращает capabilities платформы.
   * @returns {object}
   */
  static getCapabilities() {
    return SpecificationReader.load().getCapabilities();
  }
  
  /**
   * Возвращает контракты платформы.
   * @returns {string[]}
   */
  static getContracts() {
    return SpecificationReader.load().getContractNames();
  }
  
  /**
   * Возвращает сжатый контекст для LLM.
   * @returns {object}
   */
  static toLLMContext() {
    return SpecificationReader.load().toLLMContext();
  }
}

export default MeaningEngine;
