/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VISITOR PROJECTION — Адаптер для 3D-графа
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * P3.2/P3.3: Projections
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - Адаптер между Core и Three.js 3D-графом
 * - Использует highlightState из Core
 * - Не содержит бизнес-логики подсветки
 * - Только применяет состояние к визуалу
 * 
 * BOUNDARY FREEZE:
 * - Этот модуль НЕ является частью Core
 * - Этот модуль МОЖЕТ использовать DOM/Three.js
 * - Этот модуль импортирует из Core, но Core не импортирует его
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const projection = new VisitorProjection();
 * projection.setGraph(graph);
 * projection.applyHighlight(highlightState);
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Projection } from "./Projection.js";
import { INTENSITY } from "../ontology/highlightModel.js";

/**
 * Visitor-проекция для 3D-графа.
 * Применяет highlightState к Three.js визуализации.
 */
export class VisitorProjection extends Projection {
  constructor() {
    super("visitor");
    
    /** @type {Object|null} Ссылка на 3D-граф (three-force-graph) */
    this.graph = null;
    
    /** @type {Map<string, Object>|null} Узлы по ID */
    this.nodesById = null;
    
    /** @type {Set<Object>} Подсвеченные узлы */
    this.highlightNodes = new Set();
    
    /** @type {Set<Object>} Подсвеченные рёбра (полная яркость) */
    this.highlightLinks = new Set();
    
    /** @type {Set<Object>} Подсвеченные рёбра (половинная яркость) */
    this.halfHighlightLinks = new Set();
    
    /** @type {string} Текущий режим подсветки */
    this.highlightMode = "none";
    
    /** @type {Function|null} Callback для применения материала узла */
    this.applyNodeMaterial = null;
  }
  
  /**
   * Установить ссылку на 3D-граф.
   * @param {Object} graph - three-force-graph instance
   * @param {Map<string, Object>} nodesById - Map узлов по ID
   */
  setGraph(graph, nodesById) {
    this.graph = graph;
    this.nodesById = nodesById;
    this.initialized = true;
  }
  
  /**
   * Установить callback для применения материала узла.
   * @param {Function} callback - (nodeId: string) => void
   */
  setApplyNodeMaterial(callback) {
    this.applyNodeMaterial = callback;
  }
  
  /**
   * Применить highlightState к визуалу.
   * @param {import("../ontology/highlightModel.js").HighlightState} state
   */
  applyHighlight(state) {
    if (!state || !this.graph || !this.nodesById) return;
    
    // Очистить Sets
    this.highlightNodes.clear();
    this.highlightLinks.clear();
    this.halfHighlightLinks.clear();
    this.highlightMode = state.mode;
    
    const graphData = this.graph.graphData();
    if (!graphData) return;
    
    // Заполнить highlightNodes
    for (const [nodeId, intensity] of state.nodeIntensities) {
      if (intensity >= INTENSITY.HALF) {
        const node = this.nodesById.get(nodeId);
        if (node) this.highlightNodes.add(node);
      }
    }
    
    // Заполнить highlightLinks / halfHighlightLinks
    for (const link of graphData.links) {
      const intensity = state.edgeIntensities.get(link.id);
      if (intensity === INTENSITY.FULL) {
        this.highlightLinks.add(link);
      } else if (intensity === INTENSITY.HALF) {
        this.halfHighlightLinks.add(link);
      }
    }
    
    // Обновить материалы узлов
    if (this.applyNodeMaterial) {
      for (const nodeId of this.nodesById.keys()) {
        this.applyNodeMaterial(nodeId);
      }
    }
    
    // Обновить граф
    this.graph.refresh();
  }
  
  /**
   * Проверить, подсвечен ли узел.
   * @param {Object} node
   * @returns {boolean}
   */
  isNodeHighlighted(node) {
    return this.highlightNodes.has(node);
  }
  
  /**
   * Проверить, подсвечено ли ребро (полная яркость).
   * @param {Object} link
   * @returns {boolean}
   */
  isLinkHighlighted(link) {
    return this.highlightLinks.has(link);
  }
  
  /**
   * Проверить, подсвечено ли ребро (половинная яркость).
   * @param {Object} link
   * @returns {boolean}
   */
  isLinkHalfHighlighted(link) {
    return this.halfHighlightLinks.has(link);
  }
  
  /**
   * Получить текущий режим подсветки.
   * @returns {string}
   */
  getHighlightMode() {
    return this.highlightMode;
  }
  
  /**
   * Получить Sets для совместимости с существующим кодом.
   * @returns {Object}
   */
  getHighlightSets() {
    return {
      highlightNodes: this.highlightNodes,
      highlightLinks: this.highlightLinks,
      halfHighlightLinks: this.halfHighlightLinks,
      highlightMode: this.highlightMode
    };
  }
  
  /**
   * Экспортировать состояние в JSON.
   * @returns {Object}
   */
  exportState() {
    return {
      name: this.name,
      initialized: this.initialized,
      highlightMode: this.highlightMode,
      highlightedNodeCount: this.highlightNodes.size,
      highlightedLinkCount: this.highlightLinks.size,
      halfHighlightedLinkCount: this.halfHighlightLinks.size
    };
  }
  
  /**
   * Уничтожить проекцию.
   */
  destroy() {
    this.highlightNodes.clear();
    this.highlightLinks.clear();
    this.halfHighlightLinks.clear();
    this.graph = null;
    this.nodesById = null;
    this.applyNodeMaterial = null;
    this.initialized = false;
  }
}
