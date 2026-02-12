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

// Internal import for MeaningEngine
import { WorldValidator } from "./WorldInterface.js";

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
    this._initialized = false;
    
    // Попытка получить граф (может быть недоступен)
    try {
      this._graph = world.getGraph();
    } catch {
      // Граф недоступен — это нормально для пустого мира
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
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Статистика Engine.
   * @returns {object}
   */
  getStats() {
    return {
      engineVersion: ENGINE_VERSION,
      worldName: this.getWorldName(),
      worldVersion: this.getWorldVersion(),
      nodeTypes: this._schema.getNodeTypeIds().length,
      edgeTypes: this._schema.getEdgeTypeIds().length,
      nodeCount: this.getNodeCount(),
      edgeCount: this.getEdgeCount(),
      hasGraph: this._graph !== null,
    };
  }
}

export default MeaningEngine;
