/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.5: TypeScript для Core
 * 
 * Типы для GraphModel — абстрактной модели графа.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { EntityIdentity, IdentityMeta } from "./identity";
import type { HighlightContext, HighlightState } from "./highlight";

/**
 * Данные узла графа.
 */
export interface NodeData {
  /** Machine identity (неизменяемый) */
  readonly id: string;
  /** Тип узла */
  type?: string;
  /** Метка для отображения (legacy, использовать canonicalName) */
  label?: string;
  /** Онтологическое имя */
  canonicalName?: string;
  /** Альтернативные имена */
  aliases?: string[];
  /** Метаданные */
  meta?: IdentityMeta;
  /** Дополнительные свойства */
  [key: string]: unknown;
}

/**
 * Данные ребра графа.
 */
export interface EdgeData {
  /** ID исходного узла */
  source: string;
  /** ID целевого узла */
  target: string;
  /** Тип связи */
  type?: string;
  /** Дополнительные свойства */
  [key: string]: unknown;
}

/**
 * Данные графа (для сериализации).
 */
export interface GraphData {
  /** Узлы графа */
  nodes: NodeData[];
  /** Рёбра графа */
  edges: EdgeData[];
}

/**
 * Результат вычисления scope.
 */
export interface ScopeResult {
  /** ID узлов в scope */
  nodeIds: Set<string>;
  /** ID рёбер в scope */
  edgeIds: Set<string>;
}

/**
 * API GraphModel.
 */
export interface IGraphModel {
  /** Получить все узлы */
  getNodes(): NodeData[];
  
  /** Получить все рёбра */
  getEdges(): EdgeData[];
  
  /** Получить узел по ID */
  getNodeById(nodeId: string): NodeData | undefined;
  
  /** Получить соседей узла */
  getNeighbors(nodeId: string): NodeData[];
  
  /** Получить узлы по типу */
  getNodesByType(type: string): NodeData[];
  
  /** Вычислить highlight */
  computeHighlight(context: HighlightContext): HighlightState;
  
  /** Вычислить scope */
  computeScope(hubId: string): ScopeResult;
  
  /** Сериализовать в JSON */
  toJSON(): GraphData;
}

/**
 * Конструктор GraphModel.
 */
export interface GraphModelConstructor {
  new (data: GraphData): IGraphModel;
  
  /** Создать из JSON */
  fromJSON(json: GraphData): IGraphModel;
}

/**
 * GraphModel class.
 */
export declare const GraphModel: GraphModelConstructor;
