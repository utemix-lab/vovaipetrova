/**
 * @fileoverview Базовые типы онтологии
 * 
 * Этот модуль определяет фундаментальные типы, на которых строится
 * вся онтологическая модель системы. Код следует из этих определений.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Type-first design", "Single source of truth"]
 * )
 */

// ═══════════════════════════════════════════════════════════════════════════
// БАЗОВЫЕ ИДЕНТИФИКАТОРЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Уникальный идентификатор узла */
export type NodeId = string;

/** Уникальный идентификатор связи */
export type EdgeId = string;

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ УЗЛОВ ОНТОЛОГИИ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Типы узлов онтологии — сущности, существующие в пространстве графа.
 * Каждый тип имеет свой шаблон страницы и визуальное представление.
 */
export const ONTOLOGY_NODE_TYPES = [
  "root",       // Корневые узлы: Universe, Cryptocosm
  "hub",        // Хабы-контейнеры: Characters, Domains
  "character",  // Персонажи: Vova, Petrova, AI-агенты
  "domain",     // Домены: тематические области
  "workbench",  // Воркбенчи: рабочие пространства
  "collab",     // Коллабы: совместные проекты
] as const;

export type OntologyNodeType = typeof ONTOLOGY_NODE_TYPES[number];

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ СВЯЗЕЙ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Типы связей между узлами.
 * Определяют семантику отношений в графе.
 */
export const EDGE_TYPES = [
  "structural", // Структурная связь (Universe → Cryptocosm)
  "contains",   // Иерархия (Characters → character-vova)
  "relates",    // Ассоциация (character-vova → domain-ai)
] as const;

export type EdgeType = typeof EDGE_TYPES[number];

// ═══════════════════════════════════════════════════════════════════════════
// МЕТАДАННЫЕ УЗЛА
// ═══════════════════════════════════════════════════════════════════════════

/** Видимость узла */
export type NodeVisibility = "public" | "private" | "draft";

/** Статус узла */
export type NodeStatus = "core" | "expandable" | "archived";

/** Уровень абстракции */
export type AbstractionLevel = "high" | "medium" | "low";

/** Семантическая роль узла */
export type SemanticRole = "container" | "content" | "tooling";

/** Семантические метаданные узла */
export interface NodeSemantics {
  role?: SemanticRole;
  abstraction: AbstractionLevel;
}

/** RAG-метаданные для индексации */
export interface NodeRag {
  index: boolean;
  priority: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ПОЗИЦИЯ В ПРОСТРАНСТВЕ
// ═══════════════════════════════════════════════════════════════════════════

/** 2D позиция узла (для начального размещения) */
export interface Position2D {
  x: number;
  y: number;
}

/** 3D позиция узла (runtime, вычисляется физикой) */
export interface Position3D extends Position2D {
  z: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// БАЗОВЫЕ СТРУКТУРЫ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Базовый интерфейс узла графа.
 * Все типы узлов (онтологические и инструменты) расширяют этот интерфейс.
 */
export interface BaseNode {
  id: NodeId;
  label: string;
  position: Position2D;
  type: string;
  visibility: NodeVisibility;
  status: NodeStatus;
  semantics: NodeSemantics;
  rag: NodeRag;
  // Контентные поля (опциональны)
  story?: string;
  system?: string;
  service?: string;
}

/**
 * Узел онтологии — сущность в пространстве графа.
 */
export interface OntologyNode extends BaseNode {
  type: OntologyNodeType;
}

/**
 * Связь между узлами.
 */
export interface Edge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  type: EdgeType;
}

// ═══════════════════════════════════════════════════════════════════════════
// ГРАФ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Метаданные графа.
 */
export interface GraphMeta {
  version: string;
  description: string;
}

/**
 * Полная структура графа (universe.json).
 */
export interface Graph<N extends BaseNode = OntologyNode> {
  meta: GraphMeta;
  nodes: N[];
  edges: Edge[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

/** Проверка, является ли тип узла онтологическим */
export function isOntologyNodeType(type: string): type is OntologyNodeType {
  return ONTOLOGY_NODE_TYPES.includes(type as OntologyNodeType);
}

/** Проверка, является ли тип связи валидным */
export function isEdgeType(type: string): type is EdgeType {
  return EDGE_TYPES.includes(type as EdgeType);
}
