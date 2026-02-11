/**
 * @fileoverview Registry — типизированный доступ к данным графа
 * 
 * Единая точка доступа к онтологии:
 * - Загрузка и валидация universe.json
 * - Индексы для быстрого поиска
 * - Type-safe API для запросов
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Registry pattern", "Single source of truth"]
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
import type {
  IRegistry,
  NodeIndex,
  NodesByTypeIndex,
  AdjacencyIndex,
  EdgesByTypeIndex,
  ValidationResult,
  RelatedNodesResult,
} from "./types";
import { validateGraph, logValidationResult } from "./validation";
import { checkInvariants, type InvariantContext } from "../rules/constraints";

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registry — типизированный доступ к данным графа.
 * 
 * Использование:
 * ```ts
 * const registry = new Registry(graphData);
 * const vova = registry.getNode("character-vova");
 * const characters = registry.getNodesByType("character");
 * const neighbors = registry.getNeighbors("character-vova");
 * ```
 */
export class Registry implements IRegistry {
  readonly graph: Graph;
  readonly nodes: readonly OntologyNode[];
  readonly edges: readonly Edge[];
  
  // Индексы
  readonly nodeById: NodeIndex;
  readonly nodesByType: NodesByTypeIndex;
  readonly adjacency: AdjacencyIndex;
  readonly edgesByType: EdgesByTypeIndex;
  
  private validationResult: ValidationResult | null = null;
  
  constructor(graph: Graph) {
    this.graph = graph;
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    
    // Построение индексов
    this.nodeById = this.buildNodeIndex();
    this.nodesByType = this.buildNodesByTypeIndex();
    this.adjacency = this.buildAdjacencyIndex();
    this.edgesByType = this.buildEdgesByTypeIndex();
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ПОСТРОЕНИЕ ИНДЕКСОВ
  // ═══════════════════════════════════════════════════════════════════════
  
  private buildNodeIndex(): NodeIndex {
    const index = new Map<NodeId, OntologyNode>();
    for (const node of this.nodes) {
      index.set(node.id, node);
    }
    return index;
  }
  
  private buildNodesByTypeIndex(): NodesByTypeIndex {
    const index = new Map<OntologyNodeType, OntologyNode[]>();
    for (const node of this.nodes) {
      const type = node.type as OntologyNodeType;
      if (!index.has(type)) {
        index.set(type, []);
      }
      index.get(type)!.push(node);
    }
    return index;
  }
  
  private buildAdjacencyIndex(): AdjacencyIndex {
    const index = new Map<NodeId, Set<NodeId>>();
    
    // Инициализируем для всех узлов
    for (const node of this.nodes) {
      index.set(node.id, new Set());
    }
    
    // Добавляем связи (в обе стороны, граф ненаправленный)
    for (const edge of this.edges) {
      index.get(edge.source)?.add(edge.target);
      index.get(edge.target)?.add(edge.source);
    }
    
    return index;
  }
  
  private buildEdgesByTypeIndex(): EdgesByTypeIndex {
    const index = new Map<EdgeType, Edge[]>();
    for (const edge of this.edges) {
      const type = edge.type as EdgeType;
      if (!index.has(type)) {
        index.set(type, []);
      }
      index.get(type)!.push(edge);
    }
    return index;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // МЕТОДЫ ДОСТУПА
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Получить узел по ID.
   */
  getNode(id: NodeId): OntologyNode | undefined {
    return this.nodeById.get(id);
  }
  
  /**
   * Получить все узлы заданного типа.
   */
  getNodesByType(type: OntologyNodeType): OntologyNode[] {
    return this.nodesByType.get(type) || [];
  }
  
  /**
   * Получить соседей узла (связанные узлы).
   */
  getNeighbors(id: NodeId): OntologyNode[] {
    const neighborIds = this.adjacency.get(id);
    if (!neighborIds) return [];
    
    return Array.from(neighborIds)
      .map((nid) => this.nodeById.get(nid))
      .filter((n): n is OntologyNode => n !== undefined);
  }
  
  /**
   * Получить связи между двумя узлами.
   */
  getEdgesBetween(sourceId: NodeId, targetId: NodeId): Edge[] {
    return this.edges.filter(
      (e) =>
        (e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId)
    );
  }
  
  /**
   * Получить связанные узлы, сгруппированные по типу.
   */
  getRelatedByType(id: NodeId): RelatedNodesResult {
    const neighbors = this.getNeighbors(id);
    
    return {
      characters: neighbors.filter((n) => n.type === "character"),
      domains: neighbors.filter((n) => n.type === "domain"),
      workbenches: neighbors.filter((n) => n.type === "workbench"),
      collabs: neighbors.filter((n) => n.type === "collab"),
    };
  }
  
  /**
   * Получить связи узла по типу связи.
   */
  getEdgesByNode(id: NodeId, edgeType?: EdgeType): Edge[] {
    return this.edges.filter(
      (e) =>
        (e.source === id || e.target === id) &&
        (edgeType === undefined || e.type === edgeType)
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ВАЛИДАЦИЯ
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Валидировать граф.
   */
  validate(): ValidationResult {
    if (!this.validationResult) {
      this.validationResult = validateGraph(this.graph);
    }
    return this.validationResult;
  }
  
  /**
   * Валидировать и залогировать результат.
   */
  validateAndLog(): ValidationResult {
    const result = this.validate();
    logValidationResult(result);
    return result;
  }
  
  /**
   * Проверить инварианты онтологии.
   */
  checkInvariants(): { valid: boolean; violations: { id: string; description: string }[] } {
    const nodeCount: Record<string, number> = {};
    for (const [type, nodes] of this.nodesByType) {
      nodeCount[type] = nodes.length;
    }
    
    const context: InvariantContext = {
      nodeCount: nodeCount as any,
      edgeCount: this.edges.length,
      hasNode: (id: string) => this.nodeById.has(id),
    };
    
    return checkInvariants(context);
  }
  
  /**
   * Проверить инварианты и залогировать результат.
   */
  checkInvariantsAndLog(): { valid: boolean; violations: { id: string; description: string }[] } {
    const result = this.checkInvariants();
    if (result.valid) {
      console.log("[Ontology] Инварианты соблюдены ✓");
    } else {
      console.warn("[Ontology] Нарушены инварианты:");
      result.violations.forEach((v) => console.warn(`  ✗ ${v.id}: ${v.description}`));
    }
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // СТАТИСТИКА
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Получить статистику графа.
   */
  getStats(): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    edgesByType: Record<string, number>;
  } {
    const nodesByType: Record<string, number> = {};
    for (const [type, nodes] of this.nodesByType) {
      nodesByType[type] = nodes.length;
    }
    
    const edgesByType: Record<string, number> = {};
    for (const [type, edges] of this.edgesByType) {
      edgesByType[type] = edges.length;
    }
    
    return {
      totalNodes: this.nodes.length,
      totalEdges: this.edges.length,
      nodesByType,
      edgesByType,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let globalRegistry: Registry | null = null;

/**
 * Инициализировать глобальный registry.
 */
export function initRegistry(graph: Graph): Registry {
  globalRegistry = new Registry(graph);
  return globalRegistry;
}

/**
 * Получить глобальный registry.
 * Бросает ошибку, если не инициализирован.
 */
export function getRegistry(): Registry {
  if (!globalRegistry) {
    throw new Error("[Ontology] Registry не инициализирован. Вызовите initRegistry(graph) сначала.");
  }
  return globalRegistry;
}

/**
 * Проверить, инициализирован ли registry.
 */
export function isRegistryInitialized(): boolean {
  return globalRegistry !== null;
}
