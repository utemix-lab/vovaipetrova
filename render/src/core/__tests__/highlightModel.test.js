/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HIGHLIGHT MODEL TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.4: Тесты для Core
 * Цель: Сделать Core неизменяемым ядром
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { 
  createEmptyContext, 
  createContextFromState, 
  INTENSITY 
} from "../GraphModel.js";
import { computeHighlight } from "../../ontology/highlightModel.js";

// Тестовые данные
const testGraph = {
  nodesById: new Map([
    ["vova", { id: "vova", type: "character" }],
    ["art", { id: "art", type: "domain" }],
    ["music", { id: "music", type: "domain" }],
    ["characters", { id: "characters", type: "hub" }]
  ]),
  neighborsById: new Map([
    ["vova", new Set(["art", "characters"])],
    ["art", new Set(["vova", "music"])],
    ["music", new Set(["art"])],
    ["characters", new Set(["vova"])]
  ]),
  edges: [
    { id: "vova-art", source: "vova", target: "art" },
    { id: "vova-characters", source: "vova", target: "characters" },
    { id: "art-music", source: "art", target: "music" }
  ]
};

describe("computeHighlight", () => {
  describe("mode: none", () => {
    it("returns mode 'none' when context is empty", () => {
      const context = createEmptyContext();
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("none");
    });
    
    it("all nodes have DIM intensity when mode is none", () => {
      const context = createEmptyContext();
      const state = computeHighlight(context, testGraph);
      
      for (const [nodeId, intensity] of state.nodeIntensities) {
        expect(intensity).toBe(INTENSITY.DIM);
      }
    });
    
    it("all edges have DIM intensity when mode is none", () => {
      const context = createEmptyContext();
      const state = computeHighlight(context, testGraph);
      
      for (const [edgeId, intensity] of state.edgeIntensities) {
        expect(intensity).toBe(INTENSITY.DIM);
      }
    });
  });
  
  describe("mode: selected", () => {
    it("returns mode 'selected' when only selectedNodeId is set", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("selected");
    });
    
    it("selected node has FULL intensity", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("vova")).toBe(INTENSITY.FULL);
    });
    
    it("neighbors have HALF intensity", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("art")).toBe(INTENSITY.HALF);
      expect(state.nodeIntensities.get("characters")).toBe(INTENSITY.HALF);
    });
    
    it("edges to neighbors have HALF intensity", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.edgeIntensities.get("vova-art")).toBe(INTENSITY.HALF);
      expect(state.edgeIntensities.get("vova-characters")).toBe(INTENSITY.HALF);
    });
    
    it("unrelated nodes remain DIM", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("music")).toBe(INTENSITY.DIM);
    });
  });
  
  describe("mode: hover", () => {
    it("returns mode 'hover' when hoveredNodeId is set", () => {
      const context = createContextFromState({ 
        currentStepId: "vova",
        hoverNodeId: "art" 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("hover");
    });
    
    it("hovered node has FULL intensity", () => {
      const context = createContextFromState({ hoverNodeId: "art" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("art")).toBe(INTENSITY.FULL);
    });
    
    it("neighbors of hovered node have FULL intensity", () => {
      const context = createContextFromState({ hoverNodeId: "art" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("vova")).toBe(INTENSITY.FULL);
      expect(state.nodeIntensities.get("music")).toBe(INTENSITY.FULL);
    });
    
    it("edges to neighbors have FULL intensity", () => {
      const context = createContextFromState({ hoverNodeId: "art" });
      const state = computeHighlight(context, testGraph);
      
      expect(state.edgeIntensities.get("vova-art")).toBe(INTENSITY.FULL);
      expect(state.edgeIntensities.get("art-music")).toBe(INTENSITY.FULL);
    });
    
    it("selected node also has FULL intensity during hover", () => {
      const context = createContextFromState({ 
        currentStepId: "characters",
        hoverNodeId: "art" 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("characters")).toBe(INTENSITY.FULL);
    });
  });
  
  describe("mode: scope", () => {
    it("returns mode 'scope' when scopeActive is true", () => {
      const context = createContextFromState({ 
        scopeHighlightNodeIds: new Set(["vova", "characters"]),
        scopeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("scope");
    });
    
    it("scope nodes have FULL intensity", () => {
      const context = createContextFromState({ 
        scopeHighlightNodeIds: new Set(["vova", "characters"]),
        scopeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("vova")).toBe(INTENSITY.FULL);
      expect(state.nodeIntensities.get("characters")).toBe(INTENSITY.FULL);
    });
    
    it("neighbors of scope nodes also have FULL intensity", () => {
      const context = createContextFromState({ 
        scopeHighlightNodeIds: new Set(["vova"]),
        scopeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("art")).toBe(INTENSITY.FULL);
      expect(state.nodeIntensities.get("characters")).toBe(INTENSITY.FULL);
    });
    
    it("edges connected to scope have FULL intensity", () => {
      const context = createContextFromState({ 
        scopeHighlightNodeIds: new Set(["vova"]),
        scopeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.edgeIntensities.get("vova-art")).toBe(INTENSITY.FULL);
      expect(state.edgeIntensities.get("vova-characters")).toBe(INTENSITY.FULL);
    });
  });
  
  describe("mode: type", () => {
    it("returns mode 'type' when typeHighlightActive is true", () => {
      const context = createContextFromState({ 
        currentStepId: "vova",
        typeHighlightedNodeIds: new Set(["vova"]),
        typeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("type");
    });
    
    it("type-highlighted nodes have FULL intensity", () => {
      const context = createContextFromState({ 
        currentStepId: "vova",
        typeHighlightedNodeIds: new Set(["art", "music"]),
        typeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.nodeIntensities.get("art")).toBe(INTENSITY.FULL);
      expect(state.nodeIntensities.get("music")).toBe(INTENSITY.FULL);
    });
    
    it("selected node edges have HALF intensity in type mode", () => {
      const context = createContextFromState({ 
        currentStepId: "vova",
        typeHighlightedNodeIds: new Set(["vova"]),
        typeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.edgeIntensities.get("vova-art")).toBe(INTENSITY.HALF);
      expect(state.edgeIntensities.get("vova-characters")).toBe(INTENSITY.HALF);
    });
  });
  
  describe("priority", () => {
    it("scope has higher priority than hover", () => {
      const context = createContextFromState({ 
        hoverNodeId: "art",
        scopeHighlightNodeIds: new Set(["vova"]),
        scopeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("scope");
    });
    
    it("hover has higher priority than type", () => {
      const context = createContextFromState({ 
        hoverNodeId: "art",
        typeHighlightedNodeIds: new Set(["vova"]),
        typeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("hover");
    });
    
    it("type has higher priority than selected", () => {
      const context = createContextFromState({ 
        currentStepId: "vova",
        typeHighlightedNodeIds: new Set(["art"]),
        typeHighlightActive: true 
      });
      const state = computeHighlight(context, testGraph);
      
      expect(state.mode).toBe("type");
    });
  });
  
  describe("purity", () => {
    it("does not mutate input context", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const contextCopy = JSON.stringify(context);
      
      computeHighlight(context, testGraph);
      
      expect(JSON.stringify(context)).toBe(contextCopy);
    });
    
    it("does not mutate input graph", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      const nodeCount = testGraph.nodesById.size;
      const edgeCount = testGraph.edges.length;
      
      computeHighlight(context, testGraph);
      
      expect(testGraph.nodesById.size).toBe(nodeCount);
      expect(testGraph.edges.length).toBe(edgeCount);
    });
    
    it("returns new Map instances each call", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      
      const state1 = computeHighlight(context, testGraph);
      const state2 = computeHighlight(context, testGraph);
      
      expect(state1.nodeIntensities).not.toBe(state2.nodeIntensities);
      expect(state1.edgeIntensities).not.toBe(state2.edgeIntensities);
    });
    
    it("same input produces same output", () => {
      const context = createContextFromState({ currentStepId: "vova" });
      
      const state1 = computeHighlight(context, testGraph);
      const state2 = computeHighlight(context, testGraph);
      
      expect(state1.mode).toBe(state2.mode);
      expect([...state1.nodeIntensities]).toEqual([...state2.nodeIntensities]);
      expect([...state1.edgeIntensities]).toEqual([...state2.edgeIntensities]);
    });
  });
});

describe("createContextFromState", () => {
  it("creates context with default values", () => {
    const context = createContextFromState({});
    
    expect(context.selectedNodeId).toBe(null);
    expect(context.hoveredNodeId).toBe(null);
    expect(context.widgetHoveredNodeId).toBe(null);
    expect(context.scopeActive).toBe(false);
    expect(context.typeHighlightActive).toBe(false);
  });
  
  it("maps currentStepId to selectedNodeId", () => {
    const context = createContextFromState({ currentStepId: "vova" });
    
    expect(context.selectedNodeId).toBe("vova");
  });
  
  it("creates new Set instances for scopeNodeIds", () => {
    const original = new Set(["a", "b"]);
    const context = createContextFromState({ scopeHighlightNodeIds: original });
    
    expect(context.scopeNodeIds).not.toBe(original);
    expect([...context.scopeNodeIds]).toEqual(["a", "b"]);
  });
});

describe("INTENSITY constants", () => {
  it("has correct values", () => {
    expect(INTENSITY.NONE).toBe(0);
    expect(INTENSITY.DIM).toBe(0.15);
    expect(INTENSITY.HALF).toBe(0.5);
    expect(INTENSITY.FULL).toBe(1.0);
  });
});
