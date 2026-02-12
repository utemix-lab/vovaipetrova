/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD ADAPTER TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0d: World как подключаемый модуль
 * 
 * Тесты для WorldAdapter — адаптера подключения мира к Engine.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { WorldAdapter } from "../WorldAdapter.js";
import { Schema } from "../Schema.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const testSchemaData = {
  version: "1.0.0",
  name: "test-world",
  description: "A test world for unit tests",
  nodeTypes: [
    { id: "root", label: "Root", maxCount: 1 },
    { id: "item", label: "Item" },
  ],
  edgeTypes: [
    { id: "contains", label: "Contains" },
  ],
};

const testSeedData = {
  nodes: [
    { id: "root-1", type: "root", label: "Root Node" },
    { id: "item-1", type: "item", label: "Item 1" },
    { id: "item-2", type: "item", label: "Item 2" },
  ],
  edges: [
    { id: "e1", source: "root-1", target: "item-1", type: "contains" },
    { id: "e2", source: "root-1", target: "item-2", type: "contains" },
  ],
};

const testConfig = {
  theme: "dark",
  language: "ru",
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════════════

describe("WorldAdapter", () => {
  describe("constructor", () => {
    it("should create adapter with schemaData", () => {
      const adapter = new WorldAdapter({ schemaData: testSchemaData });
      expect(adapter).toBeInstanceOf(WorldAdapter);
    });
    
    it("should throw without schemaData", () => {
      expect(() => new WorldAdapter({})).toThrow("requires schemaData");
    });
    
    it("should accept seedData", () => {
      const adapter = new WorldAdapter({ 
        schemaData: testSchemaData, 
        seedData: testSeedData 
      });
      expect(adapter.getSeed()).toEqual(testSeedData);
    });
    
    it("should accept config", () => {
      const adapter = new WorldAdapter({ 
        schemaData: testSchemaData, 
        config: testConfig 
      });
      expect(adapter.getConfig()).toEqual(testConfig);
    });
    
    it("should create graph from seedData", () => {
      const adapter = new WorldAdapter({ 
        schemaData: testSchemaData, 
        seedData: testSeedData 
      });
      const graph = adapter.getGraph();
      expect(graph.getNodes()).toHaveLength(3);
      expect(graph.getEdges()).toHaveLength(2);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WORLD INTERFACE
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("WorldInterface implementation", () => {
    const adapter = new WorldAdapter({ 
      schemaData: testSchemaData, 
      seedData: testSeedData,
      config: testConfig,
    });
    
    it("getSchema should return Schema instance", () => {
      const schema = adapter.getSchema();
      expect(schema).toBeInstanceOf(Schema);
      expect(schema.name).toBe("test-world");
    });
    
    it("getGraph should return graph with correct methods", () => {
      const graph = adapter.getGraph();
      expect(typeof graph.getNodes).toBe("function");
      expect(typeof graph.getEdges).toBe("function");
      expect(typeof graph.getNodeById).toBe("function");
      expect(typeof graph.getNeighbors).toBe("function");
    });
    
    it("getSeed should return seed data", () => {
      expect(adapter.getSeed()).toEqual(testSeedData);
    });
    
    it("getConfig should return config", () => {
      expect(adapter.getConfig()).toEqual(testConfig);
    });
    
    it("getGraph should throw if no graph or seed", () => {
      const adapterNoGraph = new WorldAdapter({ schemaData: testSchemaData });
      expect(() => adapterNoGraph.getGraph()).toThrow("graph not available");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPH FROM SEED
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("graph from seed", () => {
    const adapter = new WorldAdapter({ 
      schemaData: testSchemaData, 
      seedData: testSeedData 
    });
    const graph = adapter.getGraph();
    
    it("getNodes should return all nodes", () => {
      const nodes = graph.getNodes();
      expect(nodes).toHaveLength(3);
      expect(nodes.map(n => n.id)).toContain("root-1");
      expect(nodes.map(n => n.id)).toContain("item-1");
    });
    
    it("getEdges should return all edges", () => {
      const edges = graph.getEdges();
      expect(edges).toHaveLength(2);
    });
    
    it("getNodeById should return correct node", () => {
      expect(graph.getNodeById("root-1").label).toBe("Root Node");
      expect(graph.getNodeById("item-1").label).toBe("Item 1");
    });
    
    it("getNodeById should return null for unknown id", () => {
      expect(graph.getNodeById("unknown")).toBeNull();
    });
    
    it("getNeighbors should return neighbors", () => {
      const neighbors = graph.getNeighbors("root-1");
      expect(neighbors).toHaveLength(2);
      expect(neighbors.map(n => n.id)).toContain("item-1");
      expect(neighbors.map(n => n.id)).toContain("item-2");
    });
    
    it("getNeighbors should work bidirectionally", () => {
      const neighbors = graph.getNeighbors("item-1");
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].id).toBe("root-1");
    });
    
    it("getNeighbors should return empty for isolated node", () => {
      const isolatedSeed = {
        nodes: [{ id: "isolated", type: "item", label: "Isolated" }],
        edges: [],
      };
      const isolatedAdapter = new WorldAdapter({ 
        schemaData: testSchemaData, 
        seedData: isolatedSeed 
      });
      expect(isolatedAdapter.getGraph().getNeighbors("isolated")).toHaveLength(0);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("additional methods", () => {
    const adapter = new WorldAdapter({ 
      schemaData: testSchemaData, 
      seedData: testSeedData 
    });
    
    it("getName should return world name", () => {
      expect(adapter.getName()).toBe("test-world");
    });
    
    it("getVersion should return schema version", () => {
      expect(adapter.getVersion()).toBe("1.0.0");
    });
    
    it("getDescription should return description", () => {
      expect(adapter.getDescription()).toBe("A test world for unit tests");
    });
    
    it("validate should return validation result", () => {
      const result = adapter.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("setGraph should update graph", () => {
      const newAdapter = new WorldAdapter({ schemaData: testSchemaData });
      const customGraph = {
        getNodes: () => [{ id: "custom", type: "item" }],
        getEdges: () => [],
        getNodeById: () => null,
        getNeighbors: () => [],
      };
      newAdapter.setGraph(customGraph);
      expect(newAdapter.getGraph().getNodes()).toHaveLength(1);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FACTORY METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("factory methods", () => {
    describe("fromJSON", () => {
      it("should create adapter from JSON", () => {
        const adapter = WorldAdapter.fromJSON(testSchemaData, testSeedData, testConfig);
        expect(adapter.getName()).toBe("test-world");
        expect(adapter.getSeed()).toEqual(testSeedData);
        expect(adapter.getConfig()).toEqual(testConfig);
      });
      
      it("should work with only schemaData", () => {
        const adapter = WorldAdapter.fromJSON(testSchemaData);
        expect(adapter.getName()).toBe("test-world");
        expect(adapter.getSeed()).toBeNull();
      });
    });
    
    describe("empty", () => {
      it("should create empty world", () => {
        const adapter = WorldAdapter.empty("my-empty");
        expect(adapter.getName()).toBe("my-empty");
        expect(adapter.getSchema().nodeTypes).toHaveLength(0);
        expect(adapter.getSchema().edgeTypes).toHaveLength(0);
        expect(adapter.getGraph().getNodes()).toHaveLength(0);
      });
      
      it("should use default name", () => {
        const adapter = WorldAdapter.empty();
        expect(adapter.getName()).toBe("empty-world");
      });
    });
    
    describe("minimal", () => {
      it("should create minimal world", () => {
        const adapter = WorldAdapter.minimal("my-minimal");
        expect(adapter.getName()).toBe("my-minimal");
        expect(adapter.getSchema().nodeTypes).toHaveLength(1);
        expect(adapter.getSchema().edgeTypes).toHaveLength(1);
        expect(adapter.getSchema().isValidNodeType("node")).toBe(true);
        expect(adapter.getSchema().isValidEdgeType("edge")).toBe(true);
      });
      
      it("should use default name", () => {
        const adapter = WorldAdapter.minimal();
        expect(adapter.getName()).toBe("minimal-world");
      });
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Contract Enforcement", () => {
    it("WorldAdapter should work with ANY custom world", () => {
      const spaceSchema = {
        version: "2.0.0",
        name: "space-world",
        description: "A world of galaxies and stars",
        nodeTypes: [
          { id: "galaxy", label: "Galaxy" },
          { id: "star", label: "Star" },
          { id: "planet", label: "Planet" },
        ],
        edgeTypes: [
          { id: "contains", label: "Contains" },
          { id: "orbits", label: "Orbits" },
        ],
      };
      
      const spaceSeed = {
        nodes: [
          { id: "milky-way", type: "galaxy", label: "Milky Way" },
          { id: "sun", type: "star", label: "Sun" },
          { id: "earth", type: "planet", label: "Earth" },
        ],
        edges: [
          { id: "e1", source: "milky-way", target: "sun", type: "contains" },
          { id: "e2", source: "earth", target: "sun", type: "orbits" },
        ],
      };
      
      const adapter = new WorldAdapter({ 
        schemaData: spaceSchema, 
        seedData: spaceSeed 
      });
      
      // Adapter works without knowing what "galaxy" or "planet" means
      expect(adapter.getName()).toBe("space-world");
      expect(adapter.getSchema().isValidNodeType("galaxy")).toBe(true);
      expect(adapter.getSchema().isValidNodeType("character")).toBe(false);
      expect(adapter.getGraph().getNodes()).toHaveLength(3);
      expect(adapter.validate().valid).toBe(true);
    });
    
    it("WorldAdapter should NOT contain hardcoded types", () => {
      const adapterSource = WorldAdapter.toString();
      
      // These strings should NOT appear in WorldAdapter source code
      expect(adapterSource).not.toContain('"character"');
      expect(adapterSource).not.toContain('"domain"');
      expect(adapterSource).not.toContain('"hub"');
      expect(adapterSource).not.toContain('"vovaipetrova"');
    });
    
    it("Engine can work with empty world", () => {
      const adapter = WorldAdapter.empty();
      expect(adapter.validate().valid).toBe(true);
      expect(adapter.getGraph().getNodes()).toHaveLength(0);
    });
  });
});
