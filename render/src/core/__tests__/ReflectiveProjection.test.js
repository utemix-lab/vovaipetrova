/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REFLECTIVE PROJECTION TESTS — P4.1 Мета-линза
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Тесты для ReflectiveProjection — структурный анализ графа.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ReflectiveProjection } from "../ReflectiveProjection.js";
import { GraphModel } from "../GraphModel.js";
import { OwnershipGraph } from "../OwnershipGraph.js";

describe("ReflectiveProjection", () => {
  let graphModel;
  let ownershipGraph;
  let reflective;
  
  beforeEach(() => {
    graphModel = new GraphModel({
      nodes: [
        { id: "vova", type: "character", label: "Vova" },
        { id: "art", type: "domain", label: "Art" },
        { id: "music", type: "domain", label: "Music" },
        { id: "painting", type: "subdomain", label: "Painting" },
        { id: "isolated", type: "orphan", label: "Isolated Node" }
      ],
      links: [
        { id: "edge1", source: "vova", target: "art" },
        { id: "edge2", source: "vova", target: "music" },
        { id: "edge3", source: "art", target: "painting" }
      ]
    });
    
    ownershipGraph = new OwnershipGraph();
    reflective = new ReflectiveProjection(graphModel, ownershipGraph);
  });
  
  describe("constructor", () => {
    it("should have name 'reflective'", () => {
      expect(reflective.name).toBe("reflective");
    });
    
    it("should be initialized", () => {
      expect(reflective.initialized).toBe(true);
    });
    
    it("should store graphModel reference", () => {
      expect(reflective.graphModel).toBe(graphModel);
    });
    
    it("should work without ownershipGraph", () => {
      const projection = new ReflectiveProjection(graphModel);
      expect(projection.ownershipGraph).toBeNull();
    });
  });
  
  describe("analyzeDensity", () => {
    it("should return DensityAnalysis object", () => {
      const density = reflective.analyzeDensity();
      
      expect(density).toBeDefined();
      expect(density.nodeCount).toBeDefined();
      expect(density.edgeCount).toBeDefined();
      expect(density.density).toBeDefined();
      expect(density.avgDegree).toBeDefined();
    });
    
    it("should count nodes correctly", () => {
      const density = reflective.analyzeDensity();
      expect(density.nodeCount).toBe(5);
    });
    
    it("should count edges correctly", () => {
      const density = reflective.analyzeDensity();
      expect(density.edgeCount).toBe(3);
    });
    
    it("should calculate density between 0 and 1", () => {
      const density = reflective.analyzeDensity();
      expect(density.density).toBeGreaterThanOrEqual(0);
      expect(density.density).toBeLessThanOrEqual(1);
    });
    
    it("should calculate average degree", () => {
      const density = reflective.analyzeDensity();
      // 3 edges * 2 = 6 total degree / 5 nodes = 1.2
      expect(density.avgDegree).toBe(1.2);
    });
    
    it("should find max degree", () => {
      const density = reflective.analyzeDensity();
      // vova has degree 2, art has degree 2
      expect(density.maxDegree).toBe(2);
    });
    
    it("should find min degree", () => {
      const density = reflective.analyzeDensity();
      // isolated has degree 0
      expect(density.minDegree).toBe(0);
    });
  });
  
  describe("findIsolatedNodes", () => {
    it("should return array", () => {
      const isolated = reflective.findIsolatedNodes();
      expect(Array.isArray(isolated)).toBe(true);
    });
    
    it("should find isolated nodes", () => {
      const isolated = reflective.findIsolatedNodes();
      expect(isolated).toHaveLength(1);
      expect(isolated[0].id).toBe("isolated");
    });
    
    it("should include node metadata", () => {
      const isolated = reflective.findIsolatedNodes();
      expect(isolated[0].type).toBe("orphan");
      expect(isolated[0].label).toBe("Isolated Node");
    });
    
    it("should return empty array for fully connected graph", () => {
      const connectedGraph = new GraphModel({
        nodes: [
          { id: "a", type: "test" },
          { id: "b", type: "test" }
        ],
        links: [
          { id: "e1", source: "a", target: "b" }
        ]
      });
      const projection = new ReflectiveProjection(connectedGraph);
      const isolated = projection.findIsolatedNodes();
      
      expect(isolated).toHaveLength(0);
    });
  });
  
  describe("findHighCentralityNodes", () => {
    it("should return array of CentralityNode", () => {
      const central = reflective.findHighCentralityNodes();
      
      expect(Array.isArray(central)).toBe(true);
      expect(central[0]).toHaveProperty("id");
      expect(central[0]).toHaveProperty("degree");
      expect(central[0]).toHaveProperty("normalizedCentrality");
    });
    
    it("should sort by degree descending", () => {
      const central = reflective.findHighCentralityNodes();
      
      for (let i = 1; i < central.length; i++) {
        expect(central[i - 1].degree).toBeGreaterThanOrEqual(central[i].degree);
      }
    });
    
    it("should respect topN parameter", () => {
      const central = reflective.findHighCentralityNodes(2);
      expect(central).toHaveLength(2);
    });
    
    it("should find vova and art as high centrality", () => {
      const central = reflective.findHighCentralityNodes(2);
      const ids = central.map(n => n.id);
      
      expect(ids).toContain("vova");
      expect(ids).toContain("art");
    });
    
    it("should calculate normalized centrality", () => {
      const central = reflective.findHighCentralityNodes();
      
      for (const node of central) {
        expect(node.normalizedCentrality).toBeGreaterThanOrEqual(0);
        expect(node.normalizedCentrality).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe("detectOwnershipCycles", () => {
    it("should return array", () => {
      const cycles = reflective.detectOwnershipCycles();
      expect(Array.isArray(cycles)).toBe(true);
    });
    
    it("should return empty array without ownershipGraph", () => {
      const projection = new ReflectiveProjection(graphModel);
      const cycles = projection.detectOwnershipCycles();
      expect(cycles).toHaveLength(0);
    });
    
    it("should detect no cycles in default ownershipGraph", () => {
      const cycles = reflective.detectOwnershipCycles();
      // Default OwnershipGraph has no cycles
      expect(cycles).toHaveLength(0);
    });
  });
  
  describe("mapProjectionCoverage", () => {
    it("should return coverage object", () => {
      const coverage = reflective.mapProjectionCoverage();
      
      expect(coverage).toBeDefined();
      expect(coverage.total).toBeDefined();
      expect(coverage.visitor).toBeDefined();
      expect(coverage.owl).toBeDefined();
      expect(coverage.graphrag).toBeDefined();
    });
    
    it("should count total nodes and edges", () => {
      const coverage = reflective.mapProjectionCoverage();
      
      expect(coverage.total.nodes).toBe(5);
      expect(coverage.total.edges).toBe(3);
    });
    
    it("should calculate visitor coverage", () => {
      const coverage = reflective.mapProjectionCoverage();
      
      expect(coverage.visitor.readyNodes).toBe(5);
      expect(coverage.visitor.coverage).toBe(100);
    });
    
    it("should include ownership stats", () => {
      const coverage = reflective.mapProjectionCoverage();
      
      expect(coverage.ownership).toBeDefined();
      expect(coverage.ownership.states).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe("getTypeDistribution", () => {
    it("should return distribution object", () => {
      const dist = reflective.getTypeDistribution();
      
      expect(dist).toBeDefined();
      expect(typeof dist).toBe("object");
    });
    
    it("should count nodes by type", () => {
      const dist = reflective.getTypeDistribution();
      
      expect(dist.character.count).toBe(1);
      expect(dist.domain.count).toBe(2);
      expect(dist.subdomain.count).toBe(1);
      expect(dist.orphan.count).toBe(1);
    });
    
    it("should calculate percentage", () => {
      const dist = reflective.getTypeDistribution();
      
      expect(dist.character.percentage).toBe(20);
      expect(dist.domain.percentage).toBe(40);
    });
    
    it("should calculate average degree per type", () => {
      const dist = reflective.getTypeDistribution();
      
      expect(dist.character.avgDegree).toBe(2); // vova has degree 2
      expect(dist.orphan.avgDegree).toBe(0); // isolated has degree 0
    });
  });
  
  describe("getStructuralReport", () => {
    it("should return complete report", () => {
      const report = reflective.getStructuralReport();
      
      expect(report.density).toBeDefined();
      expect(report.isolatedNodes).toBeDefined();
      expect(report.highCentralityNodes).toBeDefined();
      expect(report.ownershipCycles).toBeDefined();
      expect(report.typeDistribution).toBeDefined();
      expect(report.projectionCoverage).toBeDefined();
    });
    
    it("should include all analysis results", () => {
      const report = reflective.getStructuralReport();
      
      expect(report.density.nodeCount).toBe(5);
      expect(report.isolatedNodes).toHaveLength(1);
      expect(report.highCentralityNodes.length).toBeGreaterThan(0);
    });
  });
  
  describe("findConnectedComponents", () => {
    it("should return array of components", () => {
      const components = reflective.findConnectedComponents();
      
      expect(Array.isArray(components)).toBe(true);
    });
    
    it("should find two components (main + isolated)", () => {
      const components = reflective.findConnectedComponents();
      
      expect(components).toHaveLength(2);
    });
    
    it("should sort by size descending", () => {
      const components = reflective.findConnectedComponents();
      
      expect(components[0].length).toBeGreaterThan(components[1].length);
    });
    
    it("should include isolated node as separate component", () => {
      const components = reflective.findConnectedComponents();
      
      const isolatedComponent = components.find(c => c.includes("isolated"));
      expect(isolatedComponent).toHaveLength(1);
    });
  });
  
  describe("checkConnectivity", () => {
    it("should return connectivity info", () => {
      const conn = reflective.checkConnectivity();
      
      expect(conn.isConnected).toBeDefined();
      expect(conn.componentCount).toBeDefined();
      expect(conn.largestComponent).toBeDefined();
    });
    
    it("should detect disconnected graph", () => {
      const conn = reflective.checkConnectivity();
      
      expect(conn.isConnected).toBe(false);
      expect(conn.componentCount).toBe(2);
    });
    
    it("should find largest component size", () => {
      const conn = reflective.checkConnectivity();
      
      expect(conn.largestComponent).toBe(4);
    });
    
    it("should calculate fragmentation ratio", () => {
      const conn = reflective.checkConnectivity();
      
      // 1 - 4/5 = 0.2
      expect(conn.fragmentationRatio).toBe(0.2);
    });
  });
  
  describe("findBridges", () => {
    it("should return array of bridges", () => {
      const bridges = reflective.findBridges();
      
      expect(Array.isArray(bridges)).toBe(true);
    });
    
    it("should find bridges in tree-like structure", () => {
      const bridges = reflective.findBridges();
      
      // All edges in our graph are bridges (tree structure)
      expect(bridges.length).toBeGreaterThan(0);
    });
    
    it("should include source and target", () => {
      const bridges = reflective.findBridges();
      
      if (bridges.length > 0) {
        expect(bridges[0]).toHaveProperty("source");
        expect(bridges[0]).toHaveProperty("target");
      }
    });
  });
  
  describe("getStats", () => {
    it("should return stats object", () => {
      const stats = reflective.getStats();
      
      expect(stats.nodeCount).toBe(5);
      expect(stats.edgeCount).toBe(3);
      expect(stats.hasOwnership).toBe(true);
    });
    
    it("should track cache validity", () => {
      const stats1 = reflective.getStats();
      expect(stats1.cacheValid).toBe(false);
      
      reflective.analyzeDensity();
      
      const stats2 = reflective.getStats();
      expect(stats2.cacheValid).toBe(true);
    });
  });
  
  describe("invalidateCache", () => {
    it("should invalidate cache", () => {
      reflective.analyzeDensity();
      expect(reflective._cacheValid).toBe(true);
      
      reflective.invalidateCache();
      expect(reflective._cacheValid).toBe(false);
    });
  });
  
  describe("destroy", () => {
    it("should clear all state", () => {
      reflective.analyzeDensity();
      reflective.destroy();
      
      expect(reflective.graphModel).toBeNull();
      expect(reflective.ownershipGraph).toBeNull();
      expect(reflective._cacheValid).toBe(false);
      expect(reflective.initialized).toBe(false);
    });
  });
  
  describe("purity", () => {
    it("should not mutate graphModel", () => {
      const nodesBefore = graphModel.nodesById.size;
      const edgesBefore = graphModel.edges.length;
      
      reflective.analyzeDensity();
      reflective.findIsolatedNodes();
      reflective.findHighCentralityNodes();
      reflective.detectOwnershipCycles();
      reflective.mapProjectionCoverage();
      reflective.getTypeDistribution();
      reflective.getStructuralReport();
      reflective.findConnectedComponents();
      reflective.checkConnectivity();
      reflective.findBridges();
      
      expect(graphModel.nodesById.size).toBe(nodesBefore);
      expect(graphModel.edges.length).toBe(edgesBefore);
    });
    
    it("should not mutate ownershipGraph", () => {
      const statesBefore = ownershipGraph.getStates().length;
      
      reflective.detectOwnershipCycles();
      reflective.mapProjectionCoverage();
      
      expect(ownershipGraph.getStates().length).toBe(statesBefore);
    });
  });
  
  describe("edge cases", () => {
    it("should handle empty graph", () => {
      const emptyGraph = new GraphModel({ nodes: [], links: [] });
      const projection = new ReflectiveProjection(emptyGraph);
      
      const density = projection.analyzeDensity();
      expect(density.nodeCount).toBe(0);
      expect(density.density).toBe(0);
      
      const isolated = projection.findIsolatedNodes();
      expect(isolated).toHaveLength(0);
    });
    
    it("should handle single node graph", () => {
      const singleGraph = new GraphModel({
        nodes: [{ id: "alone", type: "test" }],
        links: []
      });
      const projection = new ReflectiveProjection(singleGraph);
      
      const density = projection.analyzeDensity();
      expect(density.nodeCount).toBe(1);
      expect(density.density).toBe(0);
      
      const isolated = projection.findIsolatedNodes();
      expect(isolated).toHaveLength(1);
    });
    
    it("should handle fully connected graph", () => {
      const fullGraph = new GraphModel({
        nodes: [
          { id: "a", type: "test" },
          { id: "b", type: "test" },
          { id: "c", type: "test" }
        ],
        links: [
          { id: "e1", source: "a", target: "b" },
          { id: "e2", source: "b", target: "c" },
          { id: "e3", source: "a", target: "c" }
        ]
      });
      const projection = new ReflectiveProjection(fullGraph);
      
      const density = projection.analyzeDensity();
      expect(density.density).toBe(1); // 3 edges / 3 max edges = 1
      
      const conn = projection.checkConnectivity();
      expect(conn.isConnected).toBe(true);
    });
  });
});
