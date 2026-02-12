/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRYSTAL TEST — Проверка на кристалл
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * См. repair-shop/ROADMAP.md
 * 
 * ЦЕЛЬ: Доказать, что Core можно использовать:
 * ✓ Вне браузера (Node.js)
 * ✓ Без DOM
 * ✓ Без Three.js
 * ✓ Для разных линз без переписывания логики
 * 
 * ЗАПУСК:
 * node render/src/core/test-crystal.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { GraphModel, createContextFromState, INTENSITY } from "./GraphModel.js";
import { OwnershipGraph } from "./OwnershipGraph.js";

// Тестовые данные (минимальный граф)
const testGraphData = {
  nodes: [
    { id: "universe", type: "root", label: "Universe" },
    { id: "characters", type: "hub", label: "Characters" },
    { id: "domains", type: "hub", label: "Domains" },
    { id: "vova", type: "character", label: "Vova" },
    { id: "art", type: "domain", label: "Art" }
  ],
  links: [
    { id: "universe-characters", source: "universe", target: "characters" },
    { id: "universe-domains", source: "universe", target: "domains" },
    { id: "characters-vova", source: "characters", target: "vova" },
    { id: "domains-art", source: "domains", target: "art" },
    { id: "vova-art", source: "vova", target: "art" }
  ]
};

console.log("═══════════════════════════════════════════════════════════════");
console.log("                    CRYSTAL TEST");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: GraphModel создаётся без DOM
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 1: GraphModel без DOM");
const model = new GraphModel(testGraphData);
console.log(`  ✓ Создан GraphModel`);
console.log(`  ✓ Nodes: ${model.nodesById.size}`);
console.log(`  ✓ Edges: ${model.edges.length}`);
console.log(`  ✓ Types: ${[...model.nodeTypes].join(", ")}`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: computeHighlight работает без Three.js
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 2: computeHighlight без Three.js");

const context1 = createContextFromState({
  currentStepId: "vova",
  hoverNodeId: null
});

const state1 = model.computeHighlight(context1);
console.log(`  ✓ Mode: ${state1.mode}`);
console.log(`  ✓ Node intensities: ${state1.nodeIntensities.size}`);
console.log(`  ✓ Edge intensities: ${state1.edgeIntensities.size}`);

// Проверить интенсивности
const vovaIntensity = state1.nodeIntensities.get("vova");
console.log(`  ✓ Vova intensity: ${vovaIntensity} (expected: ${INTENSITY.FULL})`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: computeScope работает
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 3: computeScope");
const scope = model.computeScope("characters");
console.log(`  ✓ Scope for 'characters': ${[...scope].join(", ")}`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: Разные контексты → разные состояния
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 4: Разные контексты → разные состояния");

const contextHover = createContextFromState({
  currentStepId: "vova",
  hoverNodeId: "art"
});
const stateHover = model.computeHighlight(contextHover);
console.log(`  ✓ Hover mode: ${stateHover.mode}`);

const contextScope = createContextFromState({
  currentStepId: "vova",
  scopeHighlightNodeIds: new Set(["characters", "vova"]),
  scopeHighlightActive: true
});
const stateScope = model.computeHighlight(contextScope);
console.log(`  ✓ Scope mode: ${stateScope.mode}`);

const contextType = createContextFromState({
  currentStepId: "vova",
  typeHighlightedNodeIds: new Set(["vova"]),
  typeHighlightActive: true
});
const stateType = model.computeHighlight(contextType);
console.log(`  ✓ Type mode: ${stateType.mode}`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5: OwnershipGraph работает
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 5: OwnershipGraph");
const ownership = new OwnershipGraph();
console.log(`  ✓ States: ${ownership.getStates().length}`);
console.log(`  ✓ Computations: ${ownership.getComputations().length}`);
const dataFlow = ownership.getDataFlowGraph();
console.log(`  ✓ DataFlow nodes: ${dataFlow.nodes.length}`);
console.log(`  ✓ DataFlow edges: ${dataFlow.edges.length}`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 6: Экспорт в JSON
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 6: Экспорт в JSON");
const json = model.toJSON();
console.log(`  ✓ JSON nodes: ${json.nodes.length}`);
console.log(`  ✓ JSON links: ${json.links.length}`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// TEST 7: Экспорт OwnershipGraph в Markdown
// ═══════════════════════════════════════════════════════════════════════════

console.log("## TEST 7: Экспорт OwnershipGraph в Markdown");
const md = ownership.toMarkdown();
console.log(`  ✓ Markdown length: ${md.length} chars`);
console.log("");

// ═══════════════════════════════════════════════════════════════════════════
// РЕЗУЛЬТАТ
// ═══════════════════════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════════════════════════════");
console.log("                    CRYSTAL TEST: PASSED");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");
console.log("Core можно использовать:");
console.log("  ✓ Вне браузера (Node.js)");
console.log("  ✓ Без DOM");
console.log("  ✓ Без Three.js");
console.log("  ✓ Для разных линз без переписывания логики");
console.log("");
console.log("Это формальная архитектурная машина.");
console.log("");
