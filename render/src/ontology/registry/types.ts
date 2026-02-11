/**
 * @fileoverview Типы для registry — типизированного доступа к данным графа
 * 
 * Registry предоставляет:
 * - Типобезопасный доступ к узлам и связям
 * - Индексы для быстрого поиска
 * - Валидацию при загрузке
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Registry pattern", "Type-safe data access"]
 * )
 */

import type {
  Graph,
  OntologyNode,
  Edge,
  NodeId,
  OntologyNodeType,
  EdgeType,
} from "../schema";

// ═══════════════════════════════════════════════════════════════════════════
// ИНДЕКСЫ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Индекс узлов по ID.
 */
export type NodeIndex = Map<NodeId, OntologyNode>;

/**
 * Индекс узлов по типу.
 */
export type NodesByTypeIndex = Map<OntologyNodeType, OntologyNode[]>;

/**
 * Индекс связей: nodeId → связанные узлы.
 */
export type AdjacencyIndex = Map<NodeId, Set<NodeId>>;

/**
 * Индекс связей по типу.
 */
export type EdgesByTypeIndex = Map<EdgeType, Edge[]>;

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Результат валидации графа.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: "error";
  code: string;
  message: string;
  nodeId?: NodeId;
  edgeId?: string;
}

export interface ValidationWarning {
  type: "warning";
  code: string;
  message: string;
  nodeId?: NodeId;
  edgeId?: string;
}

/**
 * Интерфейс Registry — типизированный доступ к данным графа.
 */
export interface IRegistry {
  // Данные
  readonly graph: Graph;
  readonly nodes: readonly OntologyNode[];
  readonly edges: readonly Edge[];
  
  // Индексы
  readonly nodeById: NodeIndex;
  readonly nodesByType: NodesByTypeIndex;
  readonly adjacency: AdjacencyIndex;
  readonly edgesByType: EdgesByTypeIndex;
  
  // Методы доступа
  getNode(id: NodeId): OntologyNode | undefined;
  getNodesByType(type: OntologyNodeType): OntologyNode[];
  getNeighbors(id: NodeId): OntologyNode[];
  getEdgesBetween(sourceId: NodeId, targetId: NodeId): Edge[];
  
  // Валидация
  validate(): ValidationResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Опции для запросов к registry.
 */
export interface QueryOptions {
  /** Фильтр по типу узла */
  type?: OntologyNodeType;
  /** Фильтр по статусу */
  status?: "core" | "expandable" | "archived";
  /** Фильтр по видимости */
  visibility?: "public" | "private" | "draft";
}

/**
 * Результат запроса связанных узлов.
 */
export interface RelatedNodesResult {
  characters: OntologyNode[];
  domains: OntologyNode[];
  workbenches: OntologyNode[];
  collabs: OntologyNode[];
}
