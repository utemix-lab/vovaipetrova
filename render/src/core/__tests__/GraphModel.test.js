/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH MODEL TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.4: Тесты для Core
 * Цель: Сделать Core неизменяемым ядром
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { GraphModel, createContextFromState, INTENSITY } from "../GraphModel.js";

// Тестовые данные
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

describe("GraphModel", () => {
  describe("constructor", () => {
    it("creates empty model with no data", () => {
      const model = new GraphModel();
      
      expect(model.nodesById.size).toBe(0);
      expect(model.edges.length).toBe(0);
    });
    
    it("loads nodes correctly", () => {
      const model = new GraphModel(testGraphData);
      
      expect(model.nodesById.size).toBe(5);
      expect(model.nodesById.has("vova")).toBe(true);
      expect(model.nodesById.has("art")).toBe(true);
    });
    
    it("loads edges correctly", () => {
      const model = new GraphModel(testGraphData);
      
      expect(model.edges.length).toBe(5);
    });
    
    it("builds neighbors index", () => {
      const model = new GraphModel(testGraphData);
      
      expect(model.neighborsById.get("vova")).toContain("characters");
      expect(model.neighborsById.get("vova")).toContain("art");
    });
    
    it("indexes nodes by type", () => {
      const model = new GraphModel(testGraphData);
      
      expect(model.nodeTypes.has("root")).toBe(true);
      expect(model.nodeTypes.has("hub")).toBe(true);
      expect(model.nodeTypes.has("character")).toBe(true);
      expect(model.nodeTypes.has("domain")).toBe(true);
    });
  });
  
  describe("getNodes", () => {
    it("returns all nodes as array", () => {
      const model = new GraphModel(testGraphData);
      const nodes = model.getNodes();
      
      expect(nodes.length).toBe(5);
      expect(nodes.some(n => n.id === "vova")).toBe(true);
    });
    
    it("returns new array each call", () => {
      const model = new GraphModel(testGraphData);
      
      const nodes1 = model.getNodes();
      const nodes2 = model.getNodes();
      
      expect(nodes1).not.toBe(nodes2);
    });
  });
  
  describe("getEdges", () => {
    it("returns all edges", () => {
      const model = new GraphModel(testGraphData);
      const edges = model.getEdges();
      
      expect(edges.length).toBe(5);
    });
  });
  
  describe("getNodeById", () => {
    it("returns node by id", () => {
      const model = new GraphModel(testGraphData);
      const node = model.getNodeById("vova");
      
      expect(node).toBeDefined();
      expect(node.id).toBe("vova");
      expect(node.type).toBe("character");
    });
    
    it("returns undefined for unknown id", () => {
      const model = new GraphModel(testGraphData);
      const node = model.getNodeById("unknown");
      
      expect(node).toBeUndefined();
    });
  });
  
  describe("getNeighbors", () => {
    it("returns neighbors as Set", () => {
      const model = new GraphModel(testGraphData);
      const neighbors = model.getNeighbors("vova");
      
      expect(neighbors).toBeInstanceOf(Set);
      expect(neighbors.has("characters")).toBe(true);
      expect(neighbors.has("art")).toBe(true);
    });
    
    it("returns empty Set for unknown node", () => {
      const model = new GraphModel(testGraphData);
      const neighbors = model.getNeighbors("unknown");
      
      expect(neighbors).toBeInstanceOf(Set);
      expect(neighbors.size).toBe(0);
    });
  });
  
  describe("getNodesByType", () => {
    it("returns nodes of given type", () => {
      const model = new GraphModel(testGraphData);
      const hubs = model.getNodesByType("hub");
      
      expect(hubs.length).toBe(2);
      expect(hubs.some(n => n.id === "characters")).toBe(true);
      expect(hubs.some(n => n.id === "domains")).toBe(true);
    });
    
    it("returns empty array for unknown type", () => {
      const model = new GraphModel(testGraphData);
      const unknown = model.getNodesByType("unknown");
      
      expect(unknown).toEqual([]);
    });
  });
  
  describe("getNodeTypes", () => {
    it("returns all unique types", () => {
      const model = new GraphModel(testGraphData);
      const types = model.getNodeTypes();
      
      expect(types).toContain("root");
      expect(types).toContain("hub");
      expect(types).toContain("character");
      expect(types).toContain("domain");
    });
  });
  
  describe("computeHighlight", () => {
    it("delegates to highlightModel", () => {
      const model = new GraphModel(testGraphData);
      const context = createContextFromState({ currentStepId: "vova" });
      
      const state = model.computeHighlight(context);
      
      expect(state.mode).toBe("selected");
      expect(state.nodeIntensities.get("vova")).toBe(INTENSITY.FULL);
    });
  });
  
  describe("computeScope", () => {
    it("returns scope for hub", () => {
      const model = new GraphModel(testGraphData);
      const scope = model.computeScope("characters");
      
      expect(scope).toBeInstanceOf(Set);
      expect(scope.has("characters")).toBe(true);
      expect(scope.has("vova")).toBe(true);
      expect(scope.has("universe")).toBe(true);
    });
    
    it("returns empty Set for unknown hub", () => {
      const model = new GraphModel(testGraphData);
      const scope = model.computeScope("unknown");
      
      expect(scope.size).toBe(0);
    });
  });
  
  describe("getRelatedNodeIdsByType", () => {
    it("returns neighbors of given type", () => {
      const model = new GraphModel(testGraphData);
      const related = model.getRelatedNodeIdsByType("vova", "domain");
      
      expect(related).toContain("art");
    });
    
    it("returns empty array if no neighbors of type", () => {
      const model = new GraphModel(testGraphData);
      const related = model.getRelatedNodeIdsByType("vova", "root");
      
      expect(related).toEqual([]);
    });
  });
  
  describe("toJSON", () => {
    it("exports nodes and links", () => {
      const model = new GraphModel(testGraphData);
      const json = model.toJSON();
      
      expect(json.nodes.length).toBe(5);
      expect(json.links.length).toBe(5);
    });
    
    it("preserves node data", () => {
      const model = new GraphModel(testGraphData);
      const json = model.toJSON();
      
      const vova = json.nodes.find(n => n.id === "vova");
      expect(vova.type).toBe("character");
      expect(vova.label).toBe("Vova");
    });
  });
  
  describe("fromJSON", () => {
    it("creates model from JSON", () => {
      const model = GraphModel.fromJSON(testGraphData);
      
      expect(model).toBeInstanceOf(GraphModel);
      expect(model.nodesById.size).toBe(5);
    });
  });
});
