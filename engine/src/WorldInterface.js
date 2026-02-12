/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD INTERFACE — Контракт между Engine и World
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0a.1: Engine ↔ World Contract
 * 
 * Этот файл определяет интерфейсы, которые мир должен реализовать
 * для подключения к MeaningEngine.
 * 
 * Engine НЕ ИМЕЕТ ПРАВА:
 * - Читать файлы мира напрямую
 * - Импортировать код мира
 * - Знать конкретные типы узлов
 * - Знать философию мира
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Базовый класс World.
 * Мир должен наследовать этот класс или реализовать его интерфейс.
 * 
 * @abstract
 */
export class WorldInterface {
  /**
   * Возвращает схему мира.
   * @returns {Schema}
   * @abstract
   */
  getSchema() {
    throw new Error("WorldInterface.getSchema() must be implemented by world");
  }
  
  /**
   * Возвращает граф мира.
   * @returns {GraphInterface}
   * @abstract
   */
  getGraph() {
    throw new Error("WorldInterface.getGraph() must be implemented by world");
  }
  
  /**
   * Возвращает начальные данные (опционально).
   * @returns {Seed|null}
   */
  getSeed() {
    return null;
  }
  
  /**
   * Возвращает конфигурацию мира (опционально).
   * @returns {WorldConfig|null}
   */
  getConfig() {
    return null;
  }
}

/**
 * Валидатор схемы мира.
 * Проверяет, что схема соответствует контракту.
 */
export class SchemaValidator {
  /**
   * Валидирует схему мира.
   * @param {object} schema - Схема для валидации
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(schema) {
    const errors = [];
    
    // Обязательные поля
    if (!schema) {
      errors.push("Schema is required");
      return { valid: false, errors };
    }
    
    if (typeof schema.version !== "string") {
      errors.push("schema.version must be a string");
    }
    
    if (typeof schema.name !== "string") {
      errors.push("schema.name must be a string");
    }
    
    // nodeTypes
    if (!Array.isArray(schema.nodeTypes)) {
      errors.push("schema.nodeTypes must be an array");
    } else {
      schema.nodeTypes.forEach((nt, i) => {
        if (typeof nt.id !== "string") {
          errors.push(`schema.nodeTypes[${i}].id must be a string`);
        }
        if (typeof nt.label !== "string") {
          errors.push(`schema.nodeTypes[${i}].label must be a string`);
        }
      });
    }
    
    // edgeTypes
    if (!Array.isArray(schema.edgeTypes)) {
      errors.push("schema.edgeTypes must be an array");
    } else {
      schema.edgeTypes.forEach((et, i) => {
        if (typeof et.id !== "string") {
          errors.push(`schema.edgeTypes[${i}].id must be a string`);
        }
        if (typeof et.label !== "string") {
          errors.push(`schema.edgeTypes[${i}].label must be a string`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Проверяет, что тип узла допустим по схеме.
   * @param {object} schema - Схема мира
   * @param {string} nodeType - Тип узла для проверки
   * @returns {boolean}
   */
  static isValidNodeType(schema, nodeType) {
    if (!schema?.nodeTypes) return false;
    return schema.nodeTypes.some(nt => nt.id === nodeType);
  }
  
  /**
   * Проверяет, что тип ребра допустим по схеме.
   * @param {object} schema - Схема мира
   * @param {string} edgeType - Тип ребра для проверки
   * @returns {boolean}
   */
  static isValidEdgeType(schema, edgeType) {
    if (!schema?.edgeTypes) return false;
    return schema.edgeTypes.some(et => et.id === edgeType);
  }
}

/**
 * Валидатор графа мира.
 * Проверяет, что граф соответствует контракту.
 */
export class GraphValidator {
  /**
   * Валидирует граф мира.
   * @param {object} graph - Граф для валидации
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(graph) {
    const errors = [];
    
    if (!graph) {
      errors.push("Graph is required");
      return { valid: false, errors };
    }
    
    // Проверяем методы интерфейса
    if (typeof graph.getNodes !== "function") {
      errors.push("graph.getNodes() must be a function");
    }
    
    if (typeof graph.getEdges !== "function") {
      errors.push("graph.getEdges() must be a function");
    }
    
    if (typeof graph.getNodeById !== "function") {
      errors.push("graph.getNodeById() must be a function");
    }
    
    if (typeof graph.getNeighbors !== "function") {
      errors.push("graph.getNeighbors() must be a function");
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Проверяет консистентность графа со схемой.
   * @param {object} graph - Граф
   * @param {object} schema - Схема
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateAgainstSchema(graph, schema) {
    const errors = [];
    
    if (!graph || typeof graph.getNodes !== "function") {
      errors.push("Invalid graph");
      return { valid: false, errors };
    }
    
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    
    // Проверяем типы узлов
    nodes.forEach(node => {
      if (!SchemaValidator.isValidNodeType(schema, node.type)) {
        errors.push(`Node "${node.id}" has invalid type "${node.type}"`);
      }
    });
    
    // Проверяем типы рёбер
    edges.forEach((edge, i) => {
      if (!SchemaValidator.isValidEdgeType(schema, edge.type)) {
        errors.push(`Edge ${i} has invalid type "${edge.type}"`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Валидатор мира.
 * Проверяет, что мир соответствует контракту.
 */
export class WorldValidator {
  /**
   * Полная валидация мира.
   * @param {WorldInterface} world - Мир для валидации
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  static validate(world) {
    const errors = [];
    const warnings = [];
    
    // 1. Проверяем наличие мира
    if (!world) {
      errors.push("World is required");
      return { valid: false, errors, warnings };
    }
    
    // 2. Проверяем getSchema
    let schema = null;
    try {
      schema = world.getSchema();
      const schemaValidation = SchemaValidator.validate(schema);
      errors.push(...schemaValidation.errors);
    } catch (e) {
      errors.push(`world.getSchema() threw: ${e.message}`);
    }
    
    // 3. Проверяем getGraph
    let graph = null;
    try {
      graph = world.getGraph();
      const graphValidation = GraphValidator.validate(graph);
      errors.push(...graphValidation.errors);
    } catch (e) {
      errors.push(`world.getGraph() threw: ${e.message}`);
    }
    
    // 4. Проверяем консистентность графа со схемой
    if (schema && graph && errors.length === 0) {
      const consistency = GraphValidator.validateAgainstSchema(graph, schema);
      errors.push(...consistency.errors);
    }
    
    // 5. Проверяем опциональные методы
    if (typeof world.getSeed !== "function") {
      warnings.push("world.getSeed() is not implemented (optional)");
    }
    
    if (typeof world.getConfig !== "function") {
      warnings.push("world.getConfig() is not implemented (optional)");
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export default WorldInterface;
