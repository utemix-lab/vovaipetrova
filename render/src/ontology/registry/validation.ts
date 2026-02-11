/**
 * @fileoverview Валидация данных графа
 * 
 * Проверяет:
 * - Корректность типов узлов
 * - Валидность связей (правила из relations.ts)
 * - Целостность ссылок (нет висячих связей)
 * - Уникальность ID
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Validation layer", "Fail-fast"]
 * )
 */

import type { Graph, OntologyNode, Edge, NodeId } from "../schema";
import {
  isOntologyNodeType,
  isEdgeType,
  validateEdge,
  type OntologyNodeType,
} from "../schema";
import type { ValidationResult, ValidationError, ValidationWarning } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ВАЛИДАТОРЫ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Проверяет уникальность ID узлов.
 */
function validateUniqueNodeIds(nodes: OntologyNode[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Set<NodeId>();
  
  for (const node of nodes) {
    if (seen.has(node.id)) {
      errors.push({
        type: "error",
        code: "DUPLICATE_NODE_ID",
        message: `Дублирующийся ID узла: ${node.id}`,
        nodeId: node.id,
      });
    }
    seen.add(node.id);
  }
  
  return errors;
}

/**
 * Проверяет корректность типов узлов.
 */
function validateNodeTypes(nodes: OntologyNode[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const node of nodes) {
    if (!isOntologyNodeType(node.type)) {
      errors.push({
        type: "error",
        code: "INVALID_NODE_TYPE",
        message: `Неизвестный тип узла: ${node.type}`,
        nodeId: node.id,
      });
    }
  }
  
  return errors;
}

/**
 * Проверяет уникальность ID связей.
 */
function validateUniqueEdgeIds(edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Set<string>();
  
  for (const edge of edges) {
    if (seen.has(edge.id)) {
      errors.push({
        type: "error",
        code: "DUPLICATE_EDGE_ID",
        message: `Дублирующийся ID связи: ${edge.id}`,
        edgeId: edge.id,
      });
    }
    seen.add(edge.id);
  }
  
  return errors;
}

/**
 * Проверяет корректность типов связей.
 */
function validateEdgeTypes(edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of edges) {
    if (!isEdgeType(edge.type)) {
      errors.push({
        type: "error",
        code: "INVALID_EDGE_TYPE",
        message: `Неизвестный тип связи: ${edge.type}`,
        edgeId: edge.id,
      });
    }
  }
  
  return errors;
}

/**
 * Проверяет, что все связи ссылаются на существующие узлы.
 */
function validateEdgeReferences(
  edges: Edge[],
  nodeIds: Set<NodeId>
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        type: "error",
        code: "DANGLING_EDGE_SOURCE",
        message: `Связь ${edge.id} ссылается на несуществующий source: ${edge.source}`,
        edgeId: edge.id,
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        type: "error",
        code: "DANGLING_EDGE_TARGET",
        message: `Связь ${edge.id} ссылается на несуществующий target: ${edge.target}`,
        edgeId: edge.id,
      });
    }
  }
  
  return errors;
}

/**
 * Проверяет семантические правила связей.
 */
function validateEdgeSemantics(
  edges: Edge[],
  nodeById: Map<NodeId, OntologyNode>
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    
    if (!source || !target) continue; // Уже проверено в validateEdgeReferences
    
    // Пропускаем узлы с неизвестными типами (practice и др.)
    if (!isOntologyNodeType(source.type) || !isOntologyNodeType(target.type)) {
      continue;
    }
    
    const result = validateEdge(
      edge.type,
      source.type as OntologyNodeType,
      target.type as OntologyNodeType
    );
    
    if (!result.valid) {
      warnings.push({
        type: "warning",
        code: "EDGE_SEMANTIC_VIOLATION",
        message: result.error || `Нарушение семантики связи ${edge.id}`,
        edgeId: edge.id,
      });
    }
  }
  
  return warnings;
}

// ═══════════════════════════════════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Валидирует граф целиком.
 */
export function validateGraph(graph: Graph): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Собираем ID узлов для проверки ссылок
  const nodeIds = new Set<NodeId>(graph.nodes.map((n) => n.id));
  const nodeById = new Map<NodeId, OntologyNode>(
    graph.nodes.map((n) => [n.id, n])
  );
  
  // Валидация узлов
  errors.push(...validateUniqueNodeIds(graph.nodes));
  errors.push(...validateNodeTypes(graph.nodes));
  
  // Валидация связей
  errors.push(...validateUniqueEdgeIds(graph.edges));
  errors.push(...validateEdgeTypes(graph.edges));
  errors.push(...validateEdgeReferences(graph.edges, nodeIds));
  
  // Семантическая валидация (warnings, не блокирует)
  warnings.push(...validateEdgeSemantics(graph.edges, nodeById));
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Логирует результат валидации в консоль.
 */
export function logValidationResult(result: ValidationResult): void {
  if (result.valid) {
    console.log("[Ontology] Граф валиден ✓");
  } else {
    console.error("[Ontology] Граф невалиден:");
    result.errors.forEach((e) => console.error(`  ✗ ${e.code}: ${e.message}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn("[Ontology] Предупреждения:");
    result.warnings.forEach((w) => console.warn(`  ⚠ ${w.code}: ${w.message}`));
  }
}
