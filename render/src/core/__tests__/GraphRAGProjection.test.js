/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH RAG PROJECTION TESTS — P3.7 GraphRAG интеграция
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Тесты для GraphRAGProjection — индексация и поиск по графу.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GraphRAGProjection } from "../GraphRAGProjection.js";
import { GraphModel } from "../GraphModel.js";
import { OwnershipGraph } from "../OwnershipGraph.js";

describe("GraphRAGProjection", () => {
  let graphModel;
  let ownershipGraph;
  let ragProjection;
  
  beforeEach(() => {
    graphModel = new GraphModel({
      nodes: [
        { id: "vova", type: "character", label: "Vova", canonicalName: "Владимир" },
        { id: "art", type: "domain", label: "Art" },
        { id: "music", type: "domain", label: "Music" },
        { id: "painting", type: "subdomain", label: "Painting" }
      ],
      links: [
        { id: "edge1", source: "vova", target: "art" },
        { id: "edge2", source: "vova", target: "music" },
        { id: "edge3", source: "art", target: "painting" }
      ]
    });
    
    ownershipGraph = new OwnershipGraph();
    ragProjection = new GraphRAGProjection(graphModel, ownershipGraph);
  });
  
  describe("constructor", () => {
    it("should have name 'graphrag'", () => {
      expect(ragProjection.name).toBe("graphrag");
    });
    
    it("should be initialized", () => {
      expect(ragProjection.initialized).toBe(true);
    });
    
    it("should not be indexed initially", () => {
      expect(ragProjection.indexed).toBe(false);
    });
    
    it("should store graphModel reference", () => {
      expect(ragProjection.graphModel).toBe(graphModel);
    });
    
    it("should work without ownershipGraph", () => {
      const projection = new GraphRAGProjection(graphModel);
      expect(projection.ownershipGraph).toBeNull();
    });
  });
  
  describe("buildIndex", () => {
    it("should set indexed to true", () => {
      ragProjection.buildIndex();
      expect(ragProjection.indexed).toBe(true);
    });
    
    it("should populate nodeIndex", () => {
      ragProjection.buildIndex();
      expect(ragProjection.nodeIndex.size).toBe(4);
    });
    
    it("should populate adjacency", () => {
      ragProjection.buildIndex();
      expect(ragProjection.adjacency.size).toBe(4);
    });
    
    it("should populate textIndex", () => {
      ragProjection.buildIndex();
      expect(ragProjection.textIndex.size).toBeGreaterThan(0);
    });
    
    it("should be idempotent", () => {
      ragProjection.buildIndex();
      const nodeCount1 = ragProjection.nodeIndex.size;
      
      ragProjection.buildIndex();
      const nodeCount2 = ragProjection.nodeIndex.size;
      
      expect(nodeCount1).toBe(nodeCount2);
    });
    
    it("should create NodeDocument with correct structure", () => {
      ragProjection.buildIndex();
      const doc = ragProjection.nodeIndex.get("vova");
      
      expect(doc).toBeDefined();
      expect(doc.id).toBe("vova");
      expect(doc.type).toBe("character");
      expect(doc.metadata).toBeDefined();
      expect(doc.neighbors).toBeDefined();
      expect(Array.isArray(doc.neighbors)).toBe(true);
    });
    
    it("should populate neighbors correctly", () => {
      ragProjection.buildIndex();
      const doc = ragProjection.nodeIndex.get("vova");
      
      expect(doc.neighbors).toContain("art");
      expect(doc.neighbors).toContain("music");
      expect(doc.neighbors).toHaveLength(2);
    });
    
    it("should create bidirectional adjacency", () => {
      ragProjection.buildIndex();
      
      expect(ragProjection.adjacency.get("vova").has("art")).toBe(true);
      expect(ragProjection.adjacency.get("art").has("vova")).toBe(true);
    });
  });
  
  describe("queryByNode", () => {
    beforeEach(() => {
      ragProjection.buildIndex();
    });
    
    it("should return null for unknown node", () => {
      const result = ragProjection.queryByNode("unknown");
      expect(result).toBeNull();
    });
    
    it("should return QueryResult for known node", () => {
      const result = ragProjection.queryByNode("vova");
      
      expect(result).toBeDefined();
      expect(result.node).toBeDefined();
      expect(result.neighbors).toBeDefined();
      expect(result.ownership).toBeDefined();
    });
    
    it("should return correct node data", () => {
      const result = ragProjection.queryByNode("vova");
      
      expect(result.node.id).toBe("vova");
      expect(result.node.type).toBe("character");
    });
    
    it("should return correct neighbors", () => {
      const result = ragProjection.queryByNode("vova");
      
      expect(result.neighbors).toHaveLength(2);
      expect(result.neighbors.map(n => n.id)).toContain("art");
      expect(result.neighbors.map(n => n.id)).toContain("music");
    });
    
    it("should auto-build index if not indexed", () => {
      const projection = new GraphRAGProjection(graphModel);
      expect(projection.indexed).toBe(false);
      
      const result = projection.queryByNode("vova");
      
      expect(projection.indexed).toBe(true);
      expect(result).not.toBeNull();
    });
  });
  
  describe("queryByText", () => {
    beforeEach(() => {
      ragProjection.buildIndex();
    });
    
    it("should return empty array for no matches", () => {
      const result = ragProjection.queryByText("nonexistent");
      expect(result).toHaveLength(0);
    });
    
    it("should find node by label", () => {
      const result = ragProjection.queryByText("vova");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vova");
    });
    
    it("should find node by canonicalName", () => {
      const result = ragProjection.queryByText("владимир");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vova");
    });
    
    it("should find node by type", () => {
      const result = ragProjection.queryByText("domain");
      
      expect(result).toHaveLength(2);
      expect(result.map(n => n.id)).toContain("art");
      expect(result.map(n => n.id)).toContain("music");
    });
    
    it("should be case-insensitive", () => {
      const result1 = ragProjection.queryByText("VOVA");
      const result2 = ragProjection.queryByText("vova");
      
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result1[0].id).toBe(result2[0].id);
    });
    
    it("should handle multiple tokens (AND logic)", () => {
      const result = ragProjection.queryByText("vova character");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vova");
    });
    
    it("should return empty for partial mismatch", () => {
      const result = ragProjection.queryByText("vova domain");
      expect(result).toHaveLength(0);
    });
  });
  
  describe("expandContext", () => {
    beforeEach(() => {
      ragProjection.buildIndex();
    });
    
    it("should return ContextResult", () => {
      const result = ragProjection.expandContext(["vova"], 1);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.depth).toBe(1);
    });
    
    it("should include starting node", () => {
      const result = ragProjection.expandContext(["vova"], 1);
      
      expect(result.nodes.map(n => n.id)).toContain("vova");
    });
    
    it("should expand to depth 1", () => {
      const result = ragProjection.expandContext(["vova"], 1);
      
      expect(result.nodes.map(n => n.id)).toContain("art");
      expect(result.nodes.map(n => n.id)).toContain("music");
      expect(result.nodes.map(n => n.id)).not.toContain("painting");
    });
    
    it("should expand to depth 2", () => {
      const result = ragProjection.expandContext(["vova"], 2);
      
      expect(result.nodes.map(n => n.id)).toContain("painting");
    });
    
    it("should include edges", () => {
      const result = ragProjection.expandContext(["vova"], 1);
      
      expect(result.edges.length).toBeGreaterThan(0);
    });
    
    it("should handle multiple starting nodes", () => {
      const result = ragProjection.expandContext(["vova", "painting"], 1);
      
      expect(result.nodes.map(n => n.id)).toContain("vova");
      expect(result.nodes.map(n => n.id)).toContain("painting");
      expect(result.nodes.map(n => n.id)).toContain("art");
    });
    
    it("should handle unknown starting node", () => {
      const result = ragProjection.expandContext(["unknown"], 1);
      
      expect(result.nodes).toHaveLength(0);
    });
    
    it("should not duplicate edges", () => {
      const result = ragProjection.expandContext(["vova"], 2);
      
      const edgeKeys = result.edges.map(e => 
        [e.source, e.target].sort().join("-")
      );
      const uniqueKeys = new Set(edgeKeys);
      
      expect(edgeKeys.length).toBe(uniqueKeys.size);
    });
  });
  
  describe("toLLMContext", () => {
    beforeEach(() => {
      ragProjection.buildIndex();
    });
    
    it("should return object with nodes", () => {
      const context = ragProjection.toLLMContext();
      
      expect(context.nodes).toBeDefined();
      expect(Array.isArray(context.nodes)).toBe(true);
      expect(context.nodes).toHaveLength(4);
    });
    
    it("should return object with edges", () => {
      const context = ragProjection.toLLMContext();
      
      expect(context.edges).toBeDefined();
      expect(Array.isArray(context.edges)).toBe(true);
      expect(context.edges).toHaveLength(3);
    });
    
    it("should return object with ownership", () => {
      const context = ragProjection.toLLMContext();
      
      expect(context.ownership).toBeDefined();
    });
    
    it("should return object with stats", () => {
      const context = ragProjection.toLLMContext();
      
      expect(context.stats).toBeDefined();
      expect(context.stats.nodeCount).toBe(4);
    });
    
    it("should include node metadata", () => {
      const context = ragProjection.toLLMContext();
      const vovaNode = context.nodes.find(n => n.id === "vova");
      
      expect(vovaNode.label).toBeDefined();
      expect(vovaNode.type).toBe("character");
      expect(vovaNode.canonicalName).toBe("Владимир");
    });
  });
  
  describe("getStats", () => {
    it("should return stats before indexing", () => {
      const stats = ragProjection.getStats();
      
      expect(stats.indexed).toBe(false);
      expect(stats.nodeCount).toBe(0);
    });
    
    it("should return correct stats after indexing", () => {
      ragProjection.buildIndex();
      const stats = ragProjection.getStats();
      
      expect(stats.indexed).toBe(true);
      expect(stats.nodeCount).toBe(4);
      expect(stats.edgeCount).toBe(3);
      expect(stats.tokenCount).toBeGreaterThan(0);
    });
    
    it("should calculate average neighbors", () => {
      ragProjection.buildIndex();
      const stats = ragProjection.getStats();
      
      expect(stats.avgNeighbors).toBeGreaterThan(0);
    });
  });
  
  describe("getNodesByType", () => {
    beforeEach(() => {
      ragProjection.buildIndex();
    });
    
    it("should return nodes of specified type", () => {
      const domains = ragProjection.getNodesByType("domain");
      
      expect(domains).toHaveLength(2);
      expect(domains.map(n => n.id)).toContain("art");
      expect(domains.map(n => n.id)).toContain("music");
    });
    
    it("should return empty array for unknown type", () => {
      const result = ragProjection.getNodesByType("unknown");
      expect(result).toHaveLength(0);
    });
  });
  
  describe("getNodeTypes", () => {
    beforeEach(() => {
      ragProjection.buildIndex();
    });
    
    it("should return all node types", () => {
      const types = ragProjection.getNodeTypes();
      
      expect(types).toContain("character");
      expect(types).toContain("domain");
      expect(types).toContain("subdomain");
    });
  });
  
  describe("destroy", () => {
    it("should clear all state", () => {
      ragProjection.buildIndex();
      ragProjection.destroy();
      
      expect(ragProjection.nodeIndex.size).toBe(0);
      expect(ragProjection.adjacency.size).toBe(0);
      expect(ragProjection.textIndex.size).toBe(0);
      expect(ragProjection.graphModel).toBeNull();
      expect(ragProjection.indexed).toBe(false);
      expect(ragProjection.initialized).toBe(false);
    });
  });
  
  describe("purity", () => {
    it("should not mutate graphModel", () => {
      const nodesBefore = graphModel.nodesById.size;
      const edgesBefore = graphModel.edges.length;
      
      ragProjection.buildIndex();
      ragProjection.queryByNode("vova");
      ragProjection.queryByText("art");
      ragProjection.expandContext(["vova"], 2);
      ragProjection.toLLMContext();
      
      expect(graphModel.nodesById.size).toBe(nodesBefore);
      expect(graphModel.edges.length).toBe(edgesBefore);
    });
    
    it("should not mutate ownershipGraph", () => {
      const statesBefore = ownershipGraph.getStates().length;
      
      ragProjection.buildIndex();
      ragProjection.toLLMContext();
      
      expect(ownershipGraph.getStates().length).toBe(statesBefore);
    });
  });
  
  describe("edge cases", () => {
    it("should handle empty graph", () => {
      const emptyGraph = new GraphModel({ nodes: [], links: [] });
      const projection = new GraphRAGProjection(emptyGraph);
      
      projection.buildIndex();
      
      expect(projection.nodeIndex.size).toBe(0);
      expect(projection.queryByNode("any")).toBeNull();
      expect(projection.queryByText("any")).toHaveLength(0);
    });
    
    it("should handle graph with no edges", () => {
      const noEdgesGraph = new GraphModel({
        nodes: [{ id: "alone", type: "test" }],
        links: []
      });
      const projection = new GraphRAGProjection(noEdgesGraph);
      
      projection.buildIndex();
      const result = projection.queryByNode("alone");
      
      expect(result.neighbors).toHaveLength(0);
    });
    
    it("should handle cyrillic text search", () => {
      ragProjection.buildIndex();
      const result = ragProjection.queryByText("Владимир");
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vova");
    });
    
    it("should handle special characters in search", () => {
      ragProjection.buildIndex();
      const result = ragProjection.queryByText("vova!@#$%");
      
      expect(result).toHaveLength(1);
    });
  });
});
