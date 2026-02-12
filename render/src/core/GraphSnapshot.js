/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH SNAPSHOT — Версионирование графа
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2c: Versioned Snapshots
 * См. repair-shop/ROADMAP.md
 * 
 * НАЗНАЧЕНИЕ:
 * - Снимок состояния графа в момент времени
 * - Сравнение версий (diff)
 * - Отслеживание эволюции архитектуры
 * - Рефлексия во времени
 * 
 * ПРИНЦИП:
 * - Snapshot = immutable read-only объект
 * - Никакой мутации исходных данных
 * - Детерминированные результаты
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { SCHEMA_VERSION } from "./CanonicalGraphSchema.js";

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT VERSION
// ═══════════════════════════════════════════════════════════════════════════

export const SNAPSHOT_VERSION = "1.0.0";

// ═══════════════════════════════════════════════════════════════════════════
// GRAPH SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Неизменяемый снимок состояния графа.
 */
export class GraphSnapshot {
  /**
   * @param {Object} graphData - { nodes, edges }
   * @param {Object} options - { id, timestamp, metadata }
   */
  constructor(graphData, options = {}) {
    const nodes = graphData.nodes || [];
    const edges = graphData.edges || graphData.links || [];
    
    /** @type {string} */
    this.id = options.id || this._generateId();
    
    /** @type {number} */
    this.timestamp = options.timestamp || Date.now();
    
    /** @type {string} */
    this.schemaVersion = SCHEMA_VERSION;
    
    /** @type {string} */
    this.snapshotVersion = SNAPSHOT_VERSION;
    
    /** @type {Object} */
    this.metadata = Object.freeze({
      description: options.description || "",
      author: options.author || "",
      tags: Object.freeze([...(options.tags || [])]),
      ...options.metadata,
    });
    
    // Deep freeze nodes and edges
    /** @type {Array<Object>} */
    this.nodes = Object.freeze(nodes.map(n => Object.freeze({ ...n })));
    
    /** @type {Array<Object>} */
    this.edges = Object.freeze(edges.map(e => Object.freeze({ ...e })));
    
    // Build indexes for fast lookup
    /** @private @type {Map<string, Object>} */
    this._nodeIndex = new Map(this.nodes.map(n => [n.id, n]));
    
    /** @private @type {Map<string, Object>} */
    this._edgeIndex = new Map(this.edges.map(e => [e.id, e]));
    
    // Freeze the snapshot itself
    Object.freeze(this);
  }
  
  /**
   * Генерировать уникальный ID снапшота.
   * @private
   */
  _generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `snap-${timestamp}-${random}`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить узел по ID.
   * @param {string} nodeId
   * @returns {Object|undefined}
   */
  getNodeById(nodeId) {
    return this._nodeIndex.get(nodeId);
  }
  
  /**
   * Получить ребро по ID.
   * @param {string} edgeId
   * @returns {Object|undefined}
   */
  getEdgeById(edgeId) {
    return this._edgeIndex.get(edgeId);
  }
  
  /**
   * Получить все ID узлов.
   * @returns {Set<string>}
   */
  getNodeIds() {
    return new Set(this._nodeIndex.keys());
  }
  
  /**
   * Получить все ID рёбер.
   * @returns {Set<string>}
   */
  getEdgeIds() {
    return new Set(this._edgeIndex.keys());
  }
  
  /**
   * Проверить наличие узла.
   * @param {string} nodeId
   * @returns {boolean}
   */
  hasNode(nodeId) {
    return this._nodeIndex.has(nodeId);
  }
  
  /**
   * Проверить наличие ребра.
   * @param {string} edgeId
   * @returns {boolean}
   */
  hasEdge(edgeId) {
    return this._edgeIndex.has(edgeId);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить статистику снапшота.
   * @returns {Object}
   */
  getStats() {
    const nodeTypes = {};
    const edgeTypes = {};
    
    for (const node of this.nodes) {
      const type = node.type || "unknown";
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    }
    
    for (const edge of this.edges) {
      const type = edge.type || "unknown";
      edgeTypes[type] = (edgeTypes[type] || 0) + 1;
    }
    
    return {
      id: this.id,
      timestamp: this.timestamp,
      nodeCount: this.nodes.length,
      edgeCount: this.edges.length,
      nodeTypes,
      edgeTypes,
      schemaVersion: this.schemaVersion,
      snapshotVersion: this.snapshotVersion,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Сериализовать снапшот в JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      schemaVersion: this.schemaVersion,
      snapshotVersion: this.snapshotVersion,
      metadata: { ...this.metadata, tags: [...this.metadata.tags] },
      nodes: this.nodes.map(n => ({ ...n })),
      edges: this.edges.map(e => ({ ...e })),
    };
  }
  
  /**
   * Создать снапшот из JSON.
   * @param {Object} json
   * @returns {GraphSnapshot}
   */
  static fromJSON(json) {
    return new GraphSnapshot(
      { nodes: json.nodes, edges: json.edges },
      {
        id: json.id,
        timestamp: json.timestamp,
        metadata: json.metadata,
        description: json.metadata?.description,
        author: json.metadata?.author,
        tags: json.metadata?.tags,
      }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT DIFF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Тип изменения.
 */
export const CHANGE_TYPE = Object.freeze({
  ADDED: "added",
  REMOVED: "removed",
  MODIFIED: "modified",
});

/**
 * Результат сравнения снапшотов.
 * @typedef {Object} SnapshotDiff
 * @property {Object} nodes - { added, removed, modified }
 * @property {Object} edges - { added, removed, modified }
 * @property {Object} summary - { totalChanges, ... }
 */

/**
 * Сравнить два снапшота.
 * @param {GraphSnapshot} before - Старый снапшот
 * @param {GraphSnapshot} after - Новый снапшот
 * @returns {SnapshotDiff}
 */
export function diffSnapshots(before, after) {
  const nodeDiff = diffEntities(
    before.nodes,
    after.nodes,
    before._nodeIndex,
    after._nodeIndex
  );
  
  const edgeDiff = diffEntities(
    before.edges,
    after.edges,
    before._edgeIndex,
    after._edgeIndex
  );
  
  const totalChanges =
    nodeDiff.added.length +
    nodeDiff.removed.length +
    nodeDiff.modified.length +
    edgeDiff.added.length +
    edgeDiff.removed.length +
    edgeDiff.modified.length;
  
  return {
    before: {
      id: before.id,
      timestamp: before.timestamp,
    },
    after: {
      id: after.id,
      timestamp: after.timestamp,
    },
    nodes: nodeDiff,
    edges: edgeDiff,
    summary: {
      totalChanges,
      nodesAdded: nodeDiff.added.length,
      nodesRemoved: nodeDiff.removed.length,
      nodesModified: nodeDiff.modified.length,
      edgesAdded: edgeDiff.added.length,
      edgesRemoved: edgeDiff.removed.length,
      edgesModified: edgeDiff.modified.length,
      hasChanges: totalChanges > 0,
    },
  };
}

/**
 * Сравнить сущности (узлы или рёбра).
 * @private
 */
function diffEntities(beforeList, afterList, beforeIndex, afterIndex) {
  const added = [];
  const removed = [];
  const modified = [];
  
  const beforeIds = new Set(beforeIndex.keys());
  const afterIds = new Set(afterIndex.keys());
  
  // Find added
  for (const id of afterIds) {
    if (!beforeIds.has(id)) {
      added.push({
        id,
        entity: afterIndex.get(id),
        changeType: CHANGE_TYPE.ADDED,
      });
    }
  }
  
  // Find removed
  for (const id of beforeIds) {
    if (!afterIds.has(id)) {
      removed.push({
        id,
        entity: beforeIndex.get(id),
        changeType: CHANGE_TYPE.REMOVED,
      });
    }
  }
  
  // Find modified
  for (const id of beforeIds) {
    if (afterIds.has(id)) {
      const beforeEntity = beforeIndex.get(id);
      const afterEntity = afterIndex.get(id);
      
      const changes = diffObject(beforeEntity, afterEntity);
      if (changes.length > 0) {
        modified.push({
          id,
          before: beforeEntity,
          after: afterEntity,
          changes,
          changeType: CHANGE_TYPE.MODIFIED,
        });
      }
    }
  }
  
  return { added, removed, modified };
}

/**
 * Сравнить два объекта и вернуть список изменений.
 * @private
 */
function diffObject(before, after) {
  const changes = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];
    
    if (!deepEqual(beforeVal, afterVal)) {
      changes.push({
        field: key,
        before: beforeVal,
        after: afterVal,
      });
    }
  }
  
  return changes;
}

/**
 * Глубокое сравнение значений.
 * @private
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => deepEqual(val, b[i]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT HISTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * История снапшотов для отслеживания эволюции.
 */
export class SnapshotHistory {
  constructor() {
    /** @type {Array<GraphSnapshot>} */
    this.snapshots = [];
    
    /** @type {Map<string, number>} */
    this._indexById = new Map();
  }
  
  /**
   * Добавить снапшот в историю.
   * @param {GraphSnapshot} snapshot
   */
  add(snapshot) {
    if (this._indexById.has(snapshot.id)) {
      throw new Error(`Snapshot with id "${snapshot.id}" already exists`);
    }
    
    const index = this.snapshots.length;
    this.snapshots.push(snapshot);
    this._indexById.set(snapshot.id, index);
  }
  
  /**
   * Получить снапшот по ID.
   * @param {string} id
   * @returns {GraphSnapshot|undefined}
   */
  getById(id) {
    const index = this._indexById.get(id);
    return index !== undefined ? this.snapshots[index] : undefined;
  }
  
  /**
   * Получить последний снапшот.
   * @returns {GraphSnapshot|undefined}
   */
  getLatest() {
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : undefined;
  }
  
  /**
   * Получить первый снапшот.
   * @returns {GraphSnapshot|undefined}
   */
  getFirst() {
    return this.snapshots.length > 0 ? this.snapshots[0] : undefined;
  }
  
  /**
   * Получить снапшот по индексу.
   * @param {number} index
   * @returns {GraphSnapshot|undefined}
   */
  getByIndex(index) {
    return this.snapshots[index];
  }
  
  /**
   * Получить количество снапшотов.
   * @returns {number}
   */
  size() {
    return this.snapshots.length;
  }
  
  /**
   * Сравнить два снапшота по ID.
   * @param {string} beforeId
   * @param {string} afterId
   * @returns {SnapshotDiff|null}
   */
  diff(beforeId, afterId) {
    const before = this.getById(beforeId);
    const after = this.getById(afterId);
    
    if (!before || !after) return null;
    
    return diffSnapshots(before, after);
  }
  
  /**
   * Сравнить последовательные снапшоты.
   * @param {number} fromIndex
   * @param {number} toIndex
   * @returns {Array<SnapshotDiff>}
   */
  diffRange(fromIndex = 0, toIndex = this.snapshots.length - 1) {
    const diffs = [];
    
    for (let i = fromIndex; i < toIndex && i < this.snapshots.length - 1; i++) {
      diffs.push(diffSnapshots(this.snapshots[i], this.snapshots[i + 1]));
    }
    
    return diffs;
  }
  
  /**
   * Получить полную эволюцию от первого до последнего.
   * @returns {SnapshotDiff|null}
   */
  getFullEvolution() {
    const first = this.getFirst();
    const latest = this.getLatest();
    
    if (!first || !latest || first === latest) return null;
    
    return diffSnapshots(first, latest);
  }
  
  /**
   * Получить статистику истории.
   * @returns {Object}
   */
  getStats() {
    if (this.snapshots.length === 0) {
      return {
        count: 0,
        firstTimestamp: null,
        latestTimestamp: null,
        timespan: 0,
      };
    }
    
    const first = this.getFirst();
    const latest = this.getLatest();
    
    return {
      count: this.snapshots.length,
      firstTimestamp: first.timestamp,
      latestTimestamp: latest.timestamp,
      timespan: latest.timestamp - first.timestamp,
      snapshotIds: this.snapshots.map(s => s.id),
    };
  }
  
  /**
   * Очистить историю.
   */
  clear() {
    this.snapshots = [];
    this._indexById.clear();
  }
  
  /**
   * Сериализовать историю в JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      snapshots: this.snapshots.map(s => s.toJSON()),
    };
  }
  
  /**
   * Создать историю из JSON.
   * @param {Object} json
   * @returns {SnapshotHistory}
   */
  static fromJSON(json) {
    const history = new SnapshotHistory();
    
    for (const snapshotJson of json.snapshots || []) {
      history.add(GraphSnapshot.fromJSON(snapshotJson));
    }
    
    return history;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  GraphSnapshot,
  SnapshotHistory,
  diffSnapshots,
  CHANGE_TYPE,
  SNAPSHOT_VERSION,
};
