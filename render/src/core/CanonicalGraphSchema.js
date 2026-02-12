/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CANONICAL GRAPH SCHEMA v1 — Контракт структуры графа
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2a: Canonical Schema Definition
 * См. repair-shop/ROADMAP.md
 * 
 * НАЗНАЧЕНИЕ:
 * - Фиксация допустимых типов узлов и рёбер
 * - Обязательные поля для каждого типа
 * - Правила валидации
 * - Контракт до больших расширений
 * 
 * ПРИНЦИП:
 * - Schema = read-only определение
 * - Validator = проверка соответствия
 * - Никакой мутации данных
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// NODE TYPES — Допустимые типы узлов
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Каноническое определение типов узлов.
 * @readonly
 */
export const NODE_TYPES = Object.freeze({
  // Системные типы (высокий уровень абстракции)
  ROOT: "root",           // Корневой узел (Universe, Cryptocosm)
  HUB: "hub",             // Контейнер-хаб (Characters, Domains)
  
  // Контентные типы (средний уровень абстракции)
  CHARACTER: "character", // Персонаж
  DOMAIN: "domain",       // Домен знаний
  
  // Рабочие типы (низкий уровень абстракции)
  WORKBENCH: "workbench", // Рабочий стол / инструмент
  COLLAB: "collab",       // Коллаборация / совместный проект
  
  // Расширяемые типы (для будущего)
  SUBDOMAIN: "subdomain", // Поддомен
  ARTIFACT: "artifact",   // Артефакт / результат работы
  CONCEPT: "concept",     // Концепция / идея
});

/**
 * Метаданные типов узлов.
 * @readonly
 */
export const NODE_TYPE_META = Object.freeze({
  [NODE_TYPES.ROOT]: {
    description: "Корневой узел системы",
    abstraction: "high",
    role: "container",
    allowedChildren: [NODE_TYPES.HUB, NODE_TYPES.ROOT],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.HUB]: {
    description: "Контейнер-хаб для группировки",
    abstraction: "high",
    role: "container",
    allowedChildren: [NODE_TYPES.CHARACTER, NODE_TYPES.DOMAIN, NODE_TYPES.WORKBENCH, NODE_TYPES.COLLAB],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.CHARACTER]: {
    description: "Персонаж / актор системы",
    abstraction: "low",
    role: "entity",
    allowedChildren: [NODE_TYPES.WORKBENCH, NODE_TYPES.ARTIFACT],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag", "story"],
  },
  [NODE_TYPES.DOMAIN]: {
    description: "Домен знаний / область",
    abstraction: "medium",
    role: "container",
    allowedChildren: [NODE_TYPES.SUBDOMAIN, NODE_TYPES.CONCEPT, NODE_TYPES.WORKBENCH],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.WORKBENCH]: {
    description: "Рабочий стол / инструмент",
    abstraction: "low",
    role: "tooling",
    allowedChildren: [NODE_TYPES.ARTIFACT],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.COLLAB]: {
    description: "Коллаборация / совместный проект",
    abstraction: "low",
    role: "tooling",
    allowedChildren: [NODE_TYPES.ARTIFACT],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.SUBDOMAIN]: {
    description: "Поддомен / подобласть",
    abstraction: "medium",
    role: "container",
    allowedChildren: [NODE_TYPES.CONCEPT, NODE_TYPES.ARTIFACT],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.ARTIFACT]: {
    description: "Артефакт / результат работы",
    abstraction: "low",
    role: "content",
    allowedChildren: [],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
  [NODE_TYPES.CONCEPT]: {
    description: "Концепция / идея",
    abstraction: "medium",
    role: "content",
    allowedChildren: [],
    requiredFields: ["id", "label", "type"],
    optionalFields: ["position", "visibility", "status", "semantics", "rag"],
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE TYPES — Допустимые типы рёбер
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Каноническое определение типов рёбер.
 * @readonly
 */
export const EDGE_TYPES = Object.freeze({
  // Структурные связи
  STRUCTURAL: "structural",   // Структурная связь (root → hub)
  CONTAINS: "contains",       // Содержит (hub → child)
  
  // Семантические связи
  RELATES: "relates",         // Связан с (character → domain)
  OWNS: "owns",               // Владеет (character → workbench)
  
  // Расширяемые типы
  DEPENDS: "depends",         // Зависит от
  INFLUENCES: "influences",   // Влияет на
  COLLABORATES: "collaborates", // Сотрудничает с
});

/**
 * Метаданные типов рёбер.
 * @readonly
 */
export const EDGE_TYPE_META = Object.freeze({
  [EDGE_TYPES.STRUCTURAL]: {
    description: "Структурная связь между системными узлами",
    directed: true,
    allowedSourceTypes: [NODE_TYPES.ROOT],
    allowedTargetTypes: [NODE_TYPES.ROOT, NODE_TYPES.HUB],
    requiredFields: ["id", "source", "target", "type"],
  },
  [EDGE_TYPES.CONTAINS]: {
    description: "Иерархическая связь содержания",
    directed: true,
    allowedSourceTypes: [NODE_TYPES.HUB, NODE_TYPES.DOMAIN],
    allowedTargetTypes: [NODE_TYPES.CHARACTER, NODE_TYPES.DOMAIN, NODE_TYPES.SUBDOMAIN, NODE_TYPES.WORKBENCH, NODE_TYPES.COLLAB],
    requiredFields: ["id", "source", "target", "type"],
  },
  [EDGE_TYPES.RELATES]: {
    description: "Семантическая связь между сущностями",
    directed: false,
    allowedSourceTypes: [NODE_TYPES.CHARACTER, NODE_TYPES.DOMAIN, NODE_TYPES.WORKBENCH, NODE_TYPES.COLLAB],
    allowedTargetTypes: [NODE_TYPES.DOMAIN, NODE_TYPES.WORKBENCH, NODE_TYPES.COLLAB, NODE_TYPES.CONCEPT],
    requiredFields: ["id", "source", "target", "type"],
  },
  [EDGE_TYPES.OWNS]: {
    description: "Связь владения",
    directed: true,
    allowedSourceTypes: [NODE_TYPES.CHARACTER],
    allowedTargetTypes: [NODE_TYPES.WORKBENCH, NODE_TYPES.ARTIFACT],
    requiredFields: ["id", "source", "target", "type"],
  },
  [EDGE_TYPES.DEPENDS]: {
    description: "Связь зависимости",
    directed: true,
    allowedSourceTypes: Object.values(NODE_TYPES),
    allowedTargetTypes: Object.values(NODE_TYPES),
    requiredFields: ["id", "source", "target", "type"],
  },
  [EDGE_TYPES.INFLUENCES]: {
    description: "Связь влияния",
    directed: true,
    allowedSourceTypes: Object.values(NODE_TYPES),
    allowedTargetTypes: Object.values(NODE_TYPES),
    requiredFields: ["id", "source", "target", "type"],
  },
  [EDGE_TYPES.COLLABORATES]: {
    description: "Связь сотрудничества",
    directed: false,
    allowedSourceTypes: [NODE_TYPES.CHARACTER],
    allowedTargetTypes: [NODE_TYPES.CHARACTER, NODE_TYPES.COLLAB],
    requiredFields: ["id", "source", "target", "type"],
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// VISIBILITY & STATUS — Допустимые значения
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Допустимые значения visibility.
 * @readonly
 */
export const VISIBILITY = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
  HIDDEN: "hidden",
});

/**
 * Допустимые значения status.
 * @readonly
 */
export const STATUS = Object.freeze({
  CORE: "core",           // Ядро системы
  EXPANDABLE: "expandable", // Расширяемый
  DRAFT: "draft",         // Черновик
  ARCHIVED: "archived",   // Архивный
});

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY FIELDS — Обязательные поля идентичности
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Обязательные поля Identity для узла.
 * @readonly
 */
export const IDENTITY_REQUIRED_FIELDS = Object.freeze([
  "id",           // Уникальный идентификатор (immutable)
]);

/**
 * Рекомендуемые поля Identity для узла.
 * @readonly
 */
export const IDENTITY_RECOMMENDED_FIELDS = Object.freeze([
  "label",        // Отображаемое имя
  "canonicalName", // Каноническое имя
  "aliases",      // Альтернативные имена
  "slug",         // URL-friendly идентификатор
]);

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATOR — Валидация соответствия схеме
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Результат валидации.
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Валиден ли объект
 * @property {Array<string>} errors - Список ошибок
 * @property {Array<string>} warnings - Список предупреждений
 */

/**
 * Валидатор соответствия канонической схеме.
 */
export class SchemaValidator {
  constructor() {
    /** @type {Array<string>} */
    this.errors = [];
    /** @type {Array<string>} */
    this.warnings = [];
  }
  
  /**
   * Сбросить состояние валидатора.
   */
  reset() {
    this.errors = [];
    this.warnings = [];
  }
  
  /**
   * Валидировать узел.
   * @param {Object} node - Узел для валидации
   * @returns {ValidationResult}
   */
  validateNode(node) {
    this.reset();
    
    // Проверка обязательных полей
    if (!node.id) {
      this.errors.push(`Node missing required field: id`);
    }
    
    if (!node.type) {
      this.errors.push(`Node "${node.id || "unknown"}" missing required field: type`);
    } else if (!Object.values(NODE_TYPES).includes(node.type)) {
      this.errors.push(`Node "${node.id}" has unknown type: "${node.type}"`);
    }
    
    // Проверка полей по типу
    if (node.type && NODE_TYPE_META[node.type]) {
      const meta = NODE_TYPE_META[node.type];
      
      for (const field of meta.requiredFields) {
        if (node[field] === undefined || node[field] === null) {
          this.errors.push(`Node "${node.id}" (${node.type}) missing required field: ${field}`);
        }
      }
    }
    
    // Проверка visibility
    if (node.visibility && !Object.values(VISIBILITY).includes(node.visibility)) {
      this.warnings.push(`Node "${node.id}" has unknown visibility: "${node.visibility}"`);
    }
    
    // Проверка status
    if (node.status && !Object.values(STATUS).includes(node.status)) {
      this.warnings.push(`Node "${node.id}" has unknown status: "${node.status}"`);
    }
    
    // Проверка id формата
    if (node.id && typeof node.id !== "string") {
      this.errors.push(`Node id must be a string, got: ${typeof node.id}`);
    }
    
    // Проверка label
    if (!node.label) {
      this.warnings.push(`Node "${node.id}" missing recommended field: label`);
    }
    
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }
  
  /**
   * Валидировать ребро.
   * @param {Object} edge - Ребро для валидации
   * @param {Map<string, Object>} nodesById - Карта узлов по id
   * @returns {ValidationResult}
   */
  validateEdge(edge, nodesById = new Map()) {
    this.reset();
    
    // Проверка обязательных полей
    if (!edge.id) {
      this.errors.push(`Edge missing required field: id`);
    }
    
    if (!edge.source) {
      this.errors.push(`Edge "${edge.id || "unknown"}" missing required field: source`);
    }
    
    if (!edge.target) {
      this.errors.push(`Edge "${edge.id || "unknown"}" missing required field: target`);
    }
    
    if (!edge.type) {
      this.errors.push(`Edge "${edge.id || "unknown"}" missing required field: type`);
    } else if (!Object.values(EDGE_TYPES).includes(edge.type)) {
      this.warnings.push(`Edge "${edge.id}" has unknown type: "${edge.type}" (may be custom)`);
    }
    
    // Проверка существования source и target
    if (edge.source && nodesById.size > 0 && !nodesById.has(edge.source)) {
      this.errors.push(`Edge "${edge.id}" references non-existent source: "${edge.source}"`);
    }
    
    if (edge.target && nodesById.size > 0 && !nodesById.has(edge.target)) {
      this.errors.push(`Edge "${edge.id}" references non-existent target: "${edge.target}"`);
    }
    
    // Проверка допустимости связи по типам
    if (edge.type && EDGE_TYPE_META[edge.type] && nodesById.size > 0) {
      const meta = EDGE_TYPE_META[edge.type];
      const sourceNode = nodesById.get(edge.source);
      const targetNode = nodesById.get(edge.target);
      
      if (sourceNode && !meta.allowedSourceTypes.includes(sourceNode.type)) {
        this.warnings.push(
          `Edge "${edge.id}" (${edge.type}): source type "${sourceNode.type}" not in allowed list`
        );
      }
      
      if (targetNode && !meta.allowedTargetTypes.includes(targetNode.type)) {
        this.warnings.push(
          `Edge "${edge.id}" (${edge.type}): target type "${targetNode.type}" not in allowed list`
        );
      }
    }
    
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }
  
  /**
   * Валидировать весь граф.
   * @param {Object} graphData - Данные графа { nodes, edges }
   * @returns {ValidationResult}
   */
  validateGraph(graphData) {
    this.reset();
    
    const allErrors = [];
    const allWarnings = [];
    
    // Построить карту узлов
    const nodesById = new Map();
    const nodes = graphData.nodes || [];
    const edges = graphData.edges || graphData.links || [];
    
    // Валидировать узлы
    for (const node of nodes) {
      const result = this.validateNode(node);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      
      if (node.id) {
        if (nodesById.has(node.id)) {
          allErrors.push(`Duplicate node id: "${node.id}"`);
        } else {
          nodesById.set(node.id, node);
        }
      }
    }
    
    // Валидировать рёбра
    const edgeIds = new Set();
    for (const edge of edges) {
      const result = this.validateEdge(edge, nodesById);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      
      if (edge.id) {
        if (edgeIds.has(edge.id)) {
          allErrors.push(`Duplicate edge id: "${edge.id}"`);
        } else {
          edgeIds.add(edge.id);
        }
      }
    }
    
    // Проверка связности (предупреждение)
    const connectedNodes = new Set();
    for (const edge of edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }
    
    for (const node of nodes) {
      if (!connectedNodes.has(node.id)) {
        allWarnings.push(`Node "${node.id}" is isolated (no edges)`);
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
  
  /**
   * Получить статистику схемы для графа.
   * @param {Object} graphData - Данные графа
   * @returns {Object}
   */
  getSchemaStats(graphData) {
    const nodes = graphData.nodes || [];
    const edges = graphData.edges || graphData.links || [];
    
    // Подсчёт по типам узлов
    const nodeTypeCounts = {};
    for (const type of Object.values(NODE_TYPES)) {
      nodeTypeCounts[type] = 0;
    }
    nodeTypeCounts["unknown"] = 0;
    
    for (const node of nodes) {
      if (NODE_TYPES[node.type?.toUpperCase()] || Object.values(NODE_TYPES).includes(node.type)) {
        nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
      } else {
        nodeTypeCounts["unknown"]++;
      }
    }
    
    // Подсчёт по типам рёбер
    const edgeTypeCounts = {};
    for (const type of Object.values(EDGE_TYPES)) {
      edgeTypeCounts[type] = 0;
    }
    edgeTypeCounts["unknown"] = 0;
    
    for (const edge of edges) {
      if (Object.values(EDGE_TYPES).includes(edge.type)) {
        edgeTypeCounts[edge.type]++;
      } else {
        edgeTypeCounts["unknown"]++;
      }
    }
    
    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypeCounts,
      edgeTypeCounts,
      knownNodeTypes: Object.values(NODE_TYPES).length,
      knownEdgeTypes: Object.values(EDGE_TYPES).length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA VERSION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Версия канонической схемы.
 * @readonly
 */
export const SCHEMA_VERSION = "1.0.0";

/**
 * Метаданные схемы.
 * @readonly
 */
export const SCHEMA_META = Object.freeze({
  version: SCHEMA_VERSION,
  name: "CanonicalGraphSchema",
  description: "Каноническая схема графа vovaipetrova Universe",
  created: "2026-02-12",
  nodeTypes: Object.keys(NODE_TYPES).length,
  edgeTypes: Object.keys(EDGE_TYPES).length,
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  NODE_TYPES,
  NODE_TYPE_META,
  EDGE_TYPES,
  EDGE_TYPE_META,
  VISIBILITY,
  STATUS,
  IDENTITY_REQUIRED_FIELDS,
  IDENTITY_RECOMMENDED_FIELDS,
  SchemaValidator,
  SCHEMA_VERSION,
  SCHEMA_META,
};
