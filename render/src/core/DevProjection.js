/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEV PROJECTION — Прототип dev-линзы
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - Показывает ownership
 * - Показывает вычислительные зависимости
 * - Показывает поток данных highlight
 * - Простой 2D/JSON вывод (не ReactFlow пока)
 * 
 * ЦЕЛЬ: Доказать, что Core можно смотреть иначе.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Projection } from "./Projection.js";
import { INTENSITY } from "../ontology/highlightModel.js";

/**
 * Dev-проекция для отладки и анализа.
 * Рендерит граф как JSON/текст/простую 2D-схему.
 */
export class DevProjection extends Projection {
  constructor() {
    super("dev");
    
    /** @type {HTMLElement|null} */
    this.container = null;
    
    /** @type {HTMLElement|null} */
    this.outputEl = null;
  }
  
  /**
   * Инициализировать проекцию.
   * @param {HTMLElement} container
   */
  init(container) {
    this.container = container;
    
    // Создать элемент вывода
    this.outputEl = document.createElement("div");
    this.outputEl.className = "dev-projection";
    this.outputEl.style.cssText = `
      font-family: monospace;
      font-size: 12px;
      padding: 16px;
      background: #1a1a2e;
      color: #e0e0e0;
      overflow: auto;
      height: 100%;
      white-space: pre-wrap;
    `;
    
    container.appendChild(this.outputEl);
    this.initialized = true;
  }
  
  /**
   * Отрендерить граф.
   * @param {import("./GraphModel.js").GraphModel} graphModel
   * @param {Object} context
   */
  render(graphModel, context) {
    if (!this.outputEl) return;
    
    const output = [];
    
    // Заголовок
    output.push("═══════════════════════════════════════════════════════════════");
    output.push("                    DEV PROJECTION");
    output.push("═══════════════════════════════════════════════════════════════");
    output.push("");
    
    // Статистика графа
    output.push("## GRAPH STATS");
    output.push(`Nodes: ${graphModel.nodesById.size}`);
    output.push(`Edges: ${graphModel.edges.length}`);
    output.push(`Types: ${[...graphModel.nodeTypes].join(", ")}`);
    output.push("");
    
    // Узлы по типам
    output.push("## NODES BY TYPE");
    for (const type of graphModel.nodeTypes) {
      const nodes = graphModel.getNodesByType(type);
      output.push(`  ${type}: ${nodes.map(n => n.id).join(", ")}`);
    }
    output.push("");
    
    // Текущий контекст
    output.push("## CONTEXT");
    output.push(`  selectedNodeId: ${context.selectedNodeId || "null"}`);
    output.push(`  hoveredNodeId: ${context.hoveredNodeId || "null"}`);
    output.push(`  scopeActive: ${context.scopeActive}`);
    output.push(`  typeHighlightActive: ${context.typeHighlightActive}`);
    output.push("");
    
    // Вычислить подсветку
    const highlightState = graphModel.computeHighlight(context);
    
    // Состояние подсветки
    output.push("## HIGHLIGHT STATE");
    output.push(`  mode: ${highlightState.mode}`);
    output.push("");
    
    // Узлы с интенсивностью
    output.push("## NODE INTENSITIES");
    const intensityGroups = { FULL: [], HALF: [], DIM: [], NONE: [] };
    for (const [nodeId, intensity] of highlightState.nodeIntensities) {
      if (intensity === INTENSITY.FULL) intensityGroups.FULL.push(nodeId);
      else if (intensity === INTENSITY.HALF) intensityGroups.HALF.push(nodeId);
      else if (intensity === INTENSITY.DIM) intensityGroups.DIM.push(nodeId);
      else intensityGroups.NONE.push(nodeId);
    }
    output.push(`  FULL (1.0): ${intensityGroups.FULL.join(", ") || "none"}`);
    output.push(`  HALF (0.5): ${intensityGroups.HALF.join(", ") || "none"}`);
    output.push(`  DIM (0.15): ${intensityGroups.DIM.length} nodes`);
    output.push("");
    
    // Рёбра с интенсивностью
    output.push("## EDGE INTENSITIES");
    const edgeGroups = { FULL: [], HALF: [], DIM: [] };
    for (const [edgeId, intensity] of highlightState.edgeIntensities) {
      if (intensity === INTENSITY.FULL) edgeGroups.FULL.push(edgeId);
      else if (intensity === INTENSITY.HALF) edgeGroups.HALF.push(edgeId);
      else edgeGroups.DIM.push(edgeId);
    }
    output.push(`  FULL: ${edgeGroups.FULL.length} edges`);
    output.push(`  HALF: ${edgeGroups.HALF.length} edges`);
    output.push(`  DIM: ${edgeGroups.DIM.length} edges`);
    output.push("");
    
    // Ownership (если есть selected)
    if (context.selectedNodeId) {
      output.push("## OWNERSHIP (selected node)");
      const node = graphModel.getNodeById(context.selectedNodeId);
      if (node) {
        output.push(`  Node: ${node.id}`);
        output.push(`  Type: ${node.type}`);
        output.push(`  Neighbors: ${[...graphModel.getNeighbors(node.id)].join(", ")}`);
      }
    }
    output.push("");
    
    // Вычислительный поток
    output.push("## COMPUTATION FLOW");
    output.push("  context → computeHighlight() → HighlightState → render");
    output.push("");
    output.push("  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐");
    output.push("  │   Context   │ ──▶ │  GraphModel │ ──▶ │   State     │");
    output.push("  └─────────────┘     └─────────────┘     └─────────────┘");
    output.push("                            │");
    output.push("                            ▼");
    output.push("                     ┌─────────────┐");
    output.push("                     │ Projection  │");
    output.push("                     └─────────────┘");
    output.push("");
    
    this.outputEl.textContent = output.join("\n");
  }
  
  /**
   * Обновить подсветку.
   * @param {import("../ontology/highlightModel.js").HighlightState} highlightState
   */
  updateHighlight(highlightState) {
    // В dev-проекции просто перерендериваем всё
    // (в реальной проекции можно оптимизировать)
  }
  
  /**
   * Уничтожить проекцию.
   */
  destroy() {
    if (this.outputEl && this.container) {
      this.container.removeChild(this.outputEl);
    }
    this.outputEl = null;
    this.container = null;
    this.initialized = false;
  }
  
  /**
   * Экспортировать состояние в JSON.
   * @param {import("./GraphModel.js").GraphModel} graphModel
   * @param {Object} context
   * @returns {Object}
   */
  exportJSON(graphModel, context) {
    const highlightState = graphModel.computeHighlight(context);
    
    return {
      graph: graphModel.toJSON(),
      context: {
        selectedNodeId: context.selectedNodeId,
        hoveredNodeId: context.hoveredNodeId,
        scopeActive: context.scopeActive,
        typeHighlightActive: context.typeHighlightActive
      },
      highlight: {
        mode: highlightState.mode,
        nodeIntensities: Object.fromEntries(highlightState.nodeIntensities),
        edgeIntensities: Object.fromEntries(highlightState.edgeIntensities)
      },
      stats: {
        nodes: graphModel.nodesById.size,
        edges: graphModel.edges.length,
        types: [...graphModel.nodeTypes]
      }
    };
  }
  
  /**
   * Экспортировать состояние в Markdown.
   * @param {import("./GraphModel.js").GraphModel} graphModel
   * @param {Object} context
   * @returns {string}
   */
  exportMarkdown(graphModel, context) {
    const json = this.exportJSON(graphModel, context);
    
    let md = "# Graph State Export\n\n";
    md += `## Stats\n`;
    md += `- Nodes: ${json.stats.nodes}\n`;
    md += `- Edges: ${json.stats.edges}\n`;
    md += `- Types: ${json.stats.types.join(", ")}\n\n`;
    
    md += `## Context\n`;
    md += `- Selected: ${json.context.selectedNodeId || "none"}\n`;
    md += `- Hovered: ${json.context.hoveredNodeId || "none"}\n`;
    md += `- Scope Active: ${json.context.scopeActive}\n`;
    md += `- Type Highlight: ${json.context.typeHighlightActive}\n\n`;
    
    md += `## Highlight\n`;
    md += `- Mode: ${json.highlight.mode}\n`;
    
    return md;
  }
}
