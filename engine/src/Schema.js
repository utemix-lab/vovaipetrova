/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHEMA — Абстрактная схема мира
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0b: Параллельный абстрактный слой
 * 
 * Schema — это обёртка над данными схемы мира.
 * Engine работает с Schema, а не с сырыми данными.
 * 
 * Schema НЕ ЗНАЕТ:
 * - Конкретных типов (character, domain, hub...)
 * - Философии мира
 * - UI
 * 
 * Schema ЗНАЕТ:
 * - Структуру схемы
 * - Правила валидации
 * - Constraints
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Абстрактная схема мира.
 * Обёртка над данными схемы с методами валидации.
 */
export class Schema {
  /**
   * @param {object} data - Сырые данные схемы
   */
  constructor(data) {
    if (!data) {
      throw new Error("Schema data is required");
    }
    
    this._data = data;
    this._nodeTypeIndex = new Map();
    this._edgeTypeIndex = new Map();
    
    // Индексируем типы для быстрого доступа
    this._buildIndexes();
  }
  
  /**
   * Строит индексы для быстрого поиска типов.
   * @private
   */
  _buildIndexes() {
    if (Array.isArray(this._data.nodeTypes)) {
      this._data.nodeTypes.forEach(nt => {
        this._nodeTypeIndex.set(nt.id, nt);
      });
    }
    
    if (Array.isArray(this._data.edgeTypes)) {
      this._data.edgeTypes.forEach(et => {
        this._edgeTypeIndex.set(et.id, et);
      });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** @returns {string} */
  get version() {
    return this._data.version || "0.0.0";
  }
  
  /** @returns {string} */
  get name() {
    return this._data.name || "unnamed";
  }
  
  /** @returns {string|undefined} */
  get description() {
    return this._data.description;
  }
  
  /** @returns {object[]} */
  get nodeTypes() {
    return this._data.nodeTypes || [];
  }
  
  /** @returns {object[]} */
  get edgeTypes() {
    return this._data.edgeTypes || [];
  }
  
  /** @returns {object|undefined} */
  get constraints() {
    return this._data.constraints;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NODE TYPE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проверяет, допустим ли тип узла.
   * @param {string} nodeType
   * @returns {boolean}
   */
  isValidNodeType(nodeType) {
    return this._nodeTypeIndex.has(nodeType);
  }
  
  /**
   * Возвращает определение типа узла.
   * @param {string} nodeType
   * @returns {object|null}
   */
  getNodeTypeDefinition(nodeType) {
    return this._nodeTypeIndex.get(nodeType) || null;
  }
  
  /**
   * Возвращает все ID типов узлов.
   * @returns {string[]}
   */
  getNodeTypeIds() {
    return Array.from(this._nodeTypeIndex.keys());
  }
  
  /**
   * Проверяет, достигнут ли лимит узлов данного типа.
   * @param {string} nodeType
   * @param {number} currentCount
   * @returns {boolean}
   */
  isNodeTypeLimitReached(nodeType, currentCount) {
    const def = this.getNodeTypeDefinition(nodeType);
    if (!def || def.maxCount === undefined) {
      return false;
    }
    return currentCount >= def.maxCount;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE TYPE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проверяет, допустим ли тип ребра.
   * @param {string} edgeType
   * @returns {boolean}
   */
  isValidEdgeType(edgeType) {
    return this._edgeTypeIndex.has(edgeType);
  }
  
  /**
   * Возвращает определение типа ребра.
   * @param {string} edgeType
   * @returns {object|null}
   */
  getEdgeTypeDefinition(edgeType) {
    return this._edgeTypeIndex.get(edgeType) || null;
  }
  
  /**
   * Возвращает все ID типов рёбер.
   * @returns {string[]}
   */
  getEdgeTypeIds() {
    return Array.from(this._edgeTypeIndex.keys());
  }
  
  /**
   * Проверяет, допустимо ли ребро между узлами данных типов.
   * @param {string} edgeType
   * @param {string} sourceNodeType
   * @param {string} targetNodeType
   * @returns {{ valid: boolean, reason?: string }}
   */
  isEdgeAllowed(edgeType, sourceNodeType, targetNodeType) {
    const def = this.getEdgeTypeDefinition(edgeType);
    
    if (!def) {
      return { valid: false, reason: `Unknown edge type: ${edgeType}` };
    }
    
    // Проверяем allowedSourceTypes
    if (def.allowedSourceTypes && def.allowedSourceTypes.length > 0) {
      if (!def.allowedSourceTypes.includes(sourceNodeType)) {
        return {
          valid: false,
          reason: `Edge type "${edgeType}" does not allow source type "${sourceNodeType}"`,
        };
      }
    }
    
    // Проверяем allowedTargetTypes
    if (def.allowedTargetTypes && def.allowedTargetTypes.length > 0) {
      if (!def.allowedTargetTypes.includes(targetNodeType)) {
        return {
          valid: false,
          reason: `Edge type "${edgeType}" does not allow target type "${targetNodeType}"`,
        };
      }
    }
    
    return { valid: true };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRAINTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проверяет, требуется ли корневой узел.
   * @returns {boolean}
   */
  requiresRootNode() {
    return this.constraints?.requireRootNode === true;
  }
  
  /**
   * Проверяет, разрешены ли циклы.
   * @returns {boolean}
   */
  allowsCycles() {
    return this.constraints?.allowCycles !== false;
  }
  
  /**
   * Возвращает максимальную глубину графа.
   * @returns {number|null}
   */
  getMaxDepth() {
    return this.constraints?.maxDepth ?? null;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Валидирует узел против схемы.
   * @param {object} node
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateNode(node) {
    const errors = [];
    
    if (!node) {
      errors.push("Node is required");
      return { valid: false, errors };
    }
    
    if (!node.id) {
      errors.push("Node must have an id");
    }
    
    if (!node.type) {
      errors.push("Node must have a type");
    } else if (!this.isValidNodeType(node.type)) {
      errors.push(`Invalid node type: "${node.type}"`);
    }
    
    // Проверяем required fields
    const def = this.getNodeTypeDefinition(node.type);
    if (def?.requiredFields) {
      def.requiredFields.forEach(field => {
        if (node[field] === undefined && node.data?.[field] === undefined) {
          errors.push(`Node of type "${node.type}" requires field "${field}"`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Валидирует ребро против схемы.
   * @param {object} edge
   * @param {function} getNodeType - Функция для получения типа узла по ID
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateEdge(edge, getNodeType) {
    const errors = [];
    
    if (!edge) {
      errors.push("Edge is required");
      return { valid: false, errors };
    }
    
    if (!edge.source) {
      errors.push("Edge must have a source");
    }
    
    if (!edge.target) {
      errors.push("Edge must have a target");
    }
    
    if (!edge.type) {
      errors.push("Edge must have a type");
    } else if (!this.isValidEdgeType(edge.type)) {
      errors.push(`Invalid edge type: "${edge.type}"`);
    }
    
    // Проверяем совместимость типов, если есть функция получения типа
    if (getNodeType && edge.source && edge.target && edge.type) {
      const sourceType = getNodeType(edge.source);
      const targetType = getNodeType(edge.target);
      
      if (sourceType && targetType) {
        const compatibility = this.isEdgeAllowed(edge.type, sourceType, targetType);
        if (!compatibility.valid) {
          errors.push(compatibility.reason);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает сырые данные схемы.
   * @returns {object}
   */
  toJSON() {
    return { ...this._data };
  }
  
  /**
   * Создаёт Schema из JSON.
   * @param {object} data
   * @returns {Schema}
   */
  static fromJSON(data) {
    return new Schema(data);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FACTORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Создаёт пустую схему.
   * @param {string} name
   * @returns {Schema}
   */
  static empty(name = "empty") {
    return new Schema({
      version: "1.0.0",
      name,
      nodeTypes: [],
      edgeTypes: [],
    });
  }
  
  /**
   * Создаёт минимальную схему с одним типом узла.
   * @param {string} name
   * @returns {Schema}
   */
  static minimal(name = "minimal") {
    return new Schema({
      version: "1.0.0",
      name,
      nodeTypes: [
        { id: "node", label: "Node" },
      ],
      edgeTypes: [
        { id: "edge", label: "Edge" },
      ],
    });
  }
}

export default Schema;
