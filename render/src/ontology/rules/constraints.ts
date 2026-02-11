/**
 * @fileoverview Ограничения онтологии
 * 
 * Декларативные ограничения, которые должны соблюдаться в системе:
 * - Какие типы узлов могут существовать на каком уровне
 * - Какие комбинации связей допустимы
 * - Инварианты структуры графа
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Constraint validation", "Invariants"]
 * )
 */

import type { OntologyNodeType } from "../schema";

// ═══════════════════════════════════════════════════════════════════════════
// ИЕРАРХИЧЕСКИЕ ОГРАНИЧЕНИЯ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Уровни иерархии в графе.
 * Узлы могут существовать только на определённых уровнях.
 */
export const HIERARCHY_LEVELS = {
  /** Корневой уровень: Universe, Cryptocosm */
  ROOT: 0,
  /** Уровень хабов: Characters, Domains */
  HUB: 1,
  /** Уровень сущностей: персонажи, домены */
  ENTITY: 2,
  /** Уровень проектов: воркбенчи, коллабы */
  PROJECT: 3,
} as const;

export type HierarchyLevel = typeof HIERARCHY_LEVELS[keyof typeof HIERARCHY_LEVELS];

/**
 * Допустимые уровни для каждого типа узла.
 */
export const NODE_TYPE_LEVELS: Record<OntologyNodeType, HierarchyLevel> = {
  root: HIERARCHY_LEVELS.ROOT,
  hub: HIERARCHY_LEVELS.HUB,
  character: HIERARCHY_LEVELS.ENTITY,
  domain: HIERARCHY_LEVELS.ENTITY,
  workbench: HIERARCHY_LEVELS.PROJECT,
  collab: HIERARCHY_LEVELS.PROJECT,
};

// ═══════════════════════════════════════════════════════════════════════════
// СТРУКТУРНЫЕ ОГРАНИЧЕНИЯ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ограничение на количество узлов определённого типа.
 */
export interface CardinalityConstraint {
  type: OntologyNodeType;
  min: number;
  max: number | null; // null = без ограничения
}

/**
 * Ограничения кардинальности для типов узлов.
 */
export const CARDINALITY_CONSTRAINTS: CardinalityConstraint[] = [
  // Должен быть хотя бы один root (Universe)
  { type: "root", min: 1, max: null },
  // Должны быть хабы Characters и Domains
  { type: "hub", min: 2, max: null },
  // Должен быть хотя бы один персонаж
  { type: "character", min: 1, max: null },
];

// ═══════════════════════════════════════════════════════════════════════════
// ИНВАРИАНТЫ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Инвариант — условие, которое всегда должно быть истинным.
 */
export interface Invariant {
  id: string;
  description: string;
  /** Функция проверки (возвращает true если инвариант соблюдён) */
  check: (context: InvariantContext) => boolean;
}

/**
 * Контекст для проверки инвариантов.
 */
export interface InvariantContext {
  nodeCount: Record<OntologyNodeType, number>;
  edgeCount: number;
  hasNode: (id: string) => boolean;
}

/**
 * Список инвариантов системы.
 */
export const INVARIANTS: Invariant[] = [
  {
    id: "universe-exists",
    description: "Узел Universe должен существовать",
    check: (ctx) => ctx.hasNode("universe"),
  },
  {
    id: "characters-hub-exists",
    description: "Хаб Characters должен существовать",
    check: (ctx) => ctx.hasNode("characters"),
  },
  {
    id: "domains-hub-exists",
    description: "Хаб Domains должен существовать",
    check: (ctx) => ctx.hasNode("domains"),
  },
  {
    id: "has-characters",
    description: "Должен быть хотя бы один персонаж",
    check: (ctx) => ctx.nodeCount.character >= 1,
  },
  {
    id: "graph-connected",
    description: "Граф должен быть связным (проверяется отдельно)",
    check: () => true, // Placeholder — требует отдельной реализации
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Получить уровень иерархии для типа узла.
 */
export function getNodeLevel(type: OntologyNodeType): HierarchyLevel {
  return NODE_TYPE_LEVELS[type];
}

/**
 * Проверить, может ли узел типа A содержать узел типа B.
 */
export function canContain(
  parentType: OntologyNodeType,
  childType: OntologyNodeType
): boolean {
  const parentLevel = getNodeLevel(parentType);
  const childLevel = getNodeLevel(childType);
  // Родитель должен быть на уровень выше ребёнка
  return parentLevel === childLevel - 1;
}

/**
 * Проверить все инварианты.
 */
export function checkInvariants(context: InvariantContext): {
  valid: boolean;
  violations: Invariant[];
} {
  const violations = INVARIANTS.filter((inv) => !inv.check(context));
  return {
    valid: violations.length === 0,
    violations,
  };
}
