/**
 * @fileoverview Типы связей и правила их использования
 * 
 * Определяет семантику связей между узлами онтологии.
 * Включает правила валидации: какие типы узлов могут быть связаны.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Relation semantics", "Constraint validation"]
 * )
 */

import type { EdgeType, OntologyNodeType } from "./core";

// ═══════════════════════════════════════════════════════════════════════════
// СЕМАНТИКА СВЯЗЕЙ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Описание типа связи.
 */
export interface EdgeTypeDefinition {
  type: EdgeType;
  label: string;
  description: string;
  /** Направленная связь (source → target) или симметричная */
  directed: boolean;
}

/**
 * Определения всех типов связей.
 */
export const EDGE_TYPE_DEFINITIONS: Record<EdgeType, EdgeTypeDefinition> = {
  structural: {
    type: "structural",
    label: "Структурная",
    description: "Фундаментальная связь между корневыми элементами системы",
    directed: false,
  },
  contains: {
    type: "contains",
    label: "Содержит",
    description: "Иерархическая связь: контейнер содержит элементы",
    directed: true,
  },
  relates: {
    type: "relates",
    label: "Связан с",
    description: "Ассоциативная связь между сущностями",
    directed: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ПРАВИЛА СВЯЗЕЙ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Правило связи: какие типы узлов могут быть связаны.
 */
export interface EdgeRule {
  edgeType: EdgeType;
  sourceTypes: OntologyNodeType[];
  targetTypes: OntologyNodeType[];
}

/**
 * Правила валидации связей.
 * Определяют допустимые комбинации source → target для каждого типа связи.
 */
export const EDGE_RULES: EdgeRule[] = [
  // structural: root ↔ root, root ↔ hub
  {
    edgeType: "structural",
    sourceTypes: ["root"],
    targetTypes: ["root", "hub"],
  },
  
  // contains: hub → character/domain, root → hub
  {
    edgeType: "contains",
    sourceTypes: ["hub"],
    targetTypes: ["character", "domain"],
  },
  {
    edgeType: "contains",
    sourceTypes: ["root"],
    targetTypes: ["hub"],
  },
  
  // relates: character ↔ domain, character ↔ workbench, character ↔ collab
  {
    edgeType: "relates",
    sourceTypes: ["character"],
    targetTypes: ["domain", "workbench", "collab"],
  },
  {
    edgeType: "relates",
    sourceTypes: ["domain"],
    targetTypes: ["character", "domain", "workbench"],
  },
  {
    edgeType: "relates",
    sourceTypes: ["workbench"],
    targetTypes: ["character", "domain", "collab"],
  },
  {
    edgeType: "relates",
    sourceTypes: ["collab"],
    targetTypes: ["character", "workbench"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ВАЛИДАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Проверяет, допустима ли связь между узлами данных типов.
 */
export function isValidEdge(
  edgeType: EdgeType,
  sourceType: OntologyNodeType,
  targetType: OntologyNodeType
): boolean {
  return EDGE_RULES.some(
    (rule) =>
      rule.edgeType === edgeType &&
      rule.sourceTypes.includes(sourceType) &&
      rule.targetTypes.includes(targetType)
  );
}

/**
 * Результат валидации связи.
 */
export interface EdgeValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Валидирует связь с детальным сообщением об ошибке.
 */
export function validateEdge(
  edgeType: EdgeType,
  sourceType: OntologyNodeType,
  targetType: OntologyNodeType
): EdgeValidationResult {
  if (isValidEdge(edgeType, sourceType, targetType)) {
    return { valid: true };
  }
  
  const definition = EDGE_TYPE_DEFINITIONS[edgeType];
  return {
    valid: false,
    error: `Связь "${definition.label}" недопустима между ${sourceType} и ${targetType}`,
  };
}

/**
 * Возвращает допустимые типы target для данного source и типа связи.
 */
export function getAllowedTargetTypes(
  edgeType: EdgeType,
  sourceType: OntologyNodeType
): OntologyNodeType[] {
  const targets = new Set<OntologyNodeType>();
  
  EDGE_RULES.forEach((rule) => {
    if (rule.edgeType === edgeType && rule.sourceTypes.includes(sourceType)) {
      rule.targetTypes.forEach((t) => targets.add(t));
    }
  });
  
  return Array.from(targets);
}
