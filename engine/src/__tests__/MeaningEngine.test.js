/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEANING ENGINE TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0e: Engine запускается с любым миром
 * 
 * Тесты для MeaningEngine — главного класса Engine.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { MeaningEngine, WorldAdapter, ENGINE_VERSION } from "../index.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const testSchemaData = {
  version: "1.0.0",
  name: "test-world",
  description: "A test world",
  nodeTypes: [
    { id: "root", label: "Root" },
    { id: "item", label: "Item" },
  ],
  edgeTypes: [
    { id: "contains", label: "Contains" },
  ],
};

const testSeedData = {
  nodes: [
    { id: "root-1", type: "root", label: "Root Node" },
    { id: "item-1", type: "item", label: "Item 1", catalogRefs: { tools: ["vscode", "cursor"] }, tags: ["editor"] },
    { id: "item-2", type: "item", label: "Item 2", pointerTags: ["cap:ai"] },
  ],
  edges: [
    { id: "e1", source: "root-1", target: "item-1", type: "contains" },
    { id: "e2", source: "root-1", target: "item-2", type: "contains" },
  ],
};

const testCatalogs = {
  tools: {
    id: "tools",
    entries: [
      { id: "vscode", name: "VS Code", tags: ["editor", "free"] },
      { id: "cursor", name: "Cursor", tags: ["editor", "ai"] },
      { id: "claude", name: "Claude", tags: ["ai", "llm"] },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════════════

describe("MeaningEngine", () => {
  describe("constructor", () => {
    it("should create engine with world", () => {
      const world = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
      const engine = new MeaningEngine(world);
      expect(engine).toBeInstanceOf(MeaningEngine);
    });
    
    it("should throw without world", () => {
      expect(() => new MeaningEngine(null)).toThrow("requires a world");
    });
    
    it("should throw with invalid world", () => {
      const invalidWorld = { getSchema: () => null };
      expect(() => new MeaningEngine(invalidWorld)).toThrow("Invalid world");
    });
    
    it("should work with empty world", () => {
      const world = WorldAdapter.empty();
      const engine = new MeaningEngine(world);
      expect(engine.getWorldName()).toBe("empty-world");
    });
    
    it("should work with minimal world", () => {
      const world = WorldAdapter.minimal();
      const engine = new MeaningEngine(world);
      expect(engine.getWorldName()).toBe("minimal-world");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("getters", () => {
    const world = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
    const engine = new MeaningEngine(world);
    
    it("getVersion should return engine version", () => {
      expect(engine.getVersion()).toBe(ENGINE_VERSION);
    });
    
    it("getWorldName should return world name", () => {
      expect(engine.getWorldName()).toBe("test-world");
    });
    
    it("getWorldVersion should return world version", () => {
      expect(engine.getWorldVersion()).toBe("1.0.0");
    });
    
    it("getSchema should return Schema instance", () => {
      const schema = engine.getSchema();
      expect(schema.name).toBe("test-world");
    });
    
    it("getGraph should return graph", () => {
      const graph = engine.getGraph();
      expect(graph.getNodes()).toHaveLength(3);
    });
    
    it("getWorld should return world", () => {
      expect(engine.getWorld()).toBe(world);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEMA OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("schema operations", () => {
    const world = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
    const engine = new MeaningEngine(world);
    
    it("isValidNodeType should check node types", () => {
      expect(engine.isValidNodeType("root")).toBe(true);
      expect(engine.isValidNodeType("item")).toBe(true);
      expect(engine.isValidNodeType("unknown")).toBe(false);
    });
    
    it("isValidEdgeType should check edge types", () => {
      expect(engine.isValidEdgeType("contains")).toBe(true);
      expect(engine.isValidEdgeType("unknown")).toBe(false);
    });
    
    it("validateNode should validate nodes", () => {
      const validResult = engine.validateNode({ id: "n1", type: "root" });
      expect(validResult.valid).toBe(true);
      
      const invalidResult = engine.validateNode({ id: "n1", type: "unknown" });
      expect(invalidResult.valid).toBe(false);
    });
    
    it("validateEdge should validate edges", () => {
      const validResult = engine.validateEdge({ source: "a", target: "b", type: "contains" });
      expect(validResult.valid).toBe(true);
      
      const invalidResult = engine.validateEdge({ source: "a", target: "b", type: "unknown" });
      expect(invalidResult.valid).toBe(false);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPH OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("graph operations", () => {
    const world = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
    const engine = new MeaningEngine(world);
    
    it("getNodeCount should return node count", () => {
      expect(engine.getNodeCount()).toBe(3);
    });
    
    it("getEdgeCount should return edge count", () => {
      expect(engine.getEdgeCount()).toBe(2);
    });
    
    it("getNodeById should return node", () => {
      const node = engine.getNodeById("root-1");
      expect(node.label).toBe("Root Node");
    });
    
    it("getNodeById should return null for unknown id", () => {
      expect(engine.getNodeById("unknown")).toBeNull();
    });
    
    it("getNeighbors should return neighbors", () => {
      const neighbors = engine.getNeighbors("root-1");
      expect(neighbors).toHaveLength(2);
    });
    
    it("getNeighbors should return empty for unknown node", () => {
      expect(engine.getNeighbors("unknown")).toHaveLength(0);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("getStats", () => {
    it("should return complete stats", () => {
      const world = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
      const engine = new MeaningEngine(world);
      const stats = engine.getStats();
      
      expect(stats.engineVersion).toBe(ENGINE_VERSION);
      expect(stats.worldName).toBe("test-world");
      expect(stats.worldVersion).toBe("1.0.0");
      expect(stats.nodeTypes).toBe(2);
      expect(stats.edgeTypes).toBe(1);
      expect(stats.nodeCount).toBe(3);
      expect(stats.edgeCount).toBe(2);
      expect(stats.hasGraph).toBe(true);
    });
    
    it("should handle empty world", () => {
      const world = WorldAdapter.empty();
      const engine = new MeaningEngine(world);
      const stats = engine.getStats();
      
      expect(stats.nodeTypes).toBe(0);
      expect(stats.edgeTypes).toBe(0);
      expect(stats.nodeCount).toBe(0);
      expect(stats.edgeCount).toBe(0);
      expect(stats.hasGraph).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Contract Enforcement", () => {
    it("Engine should work with ANY custom world", () => {
      const spaceSchema = {
        version: "2.0.0",
        name: "space-world",
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
      
      const world = new WorldAdapter({ schemaData: spaceSchema, seedData: spaceSeed });
      const engine = new MeaningEngine(world);
      
      // Engine works without knowing what "galaxy" or "planet" means
      expect(engine.getWorldName()).toBe("space-world");
      expect(engine.isValidNodeType("galaxy")).toBe(true);
      expect(engine.isValidNodeType("character")).toBe(false);
      expect(engine.getNodeCount()).toBe(3);
      expect(engine.getNodeById("earth").label).toBe("Earth");
    });
    
    it("Engine should NOT contain hardcoded types", () => {
      const engineSource = MeaningEngine.toString();
      
      // These strings should NOT appear in MeaningEngine source code
      expect(engineSource).not.toContain('"character"');
      expect(engineSource).not.toContain('"domain"');
      expect(engineSource).not.toContain('"hub"');
      expect(engineSource).not.toContain('"vovaipetrova"');
    });
    
    it("Engine should work with empty world (no nodes, no edges)", () => {
      const world = WorldAdapter.empty();
      const engine = new MeaningEngine(world);
      
      expect(engine.getNodeCount()).toBe(0);
      expect(engine.getEdgeCount()).toBe(0);
      expect(engine.getStats().hasGraph).toBe(true);
    });
    
    it("Engine should work with world with empty graph", () => {
      // World has schema and empty seed (valid world)
      const world = new WorldAdapter({ 
        schemaData: testSchemaData,
        seedData: { nodes: [], edges: [] }
      });
      
      const engine = new MeaningEngine(world);
      expect(engine.getNodeCount()).toBe(0);
      expect(engine.getEdgeCount()).toBe(0);
      expect(engine.getStats().hasGraph).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION: Full workflow
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Integration: Full workflow", () => {
    it("should support complete workflow", () => {
      // 1. Create world
      const world = WorldAdapter.fromJSON(testSchemaData, testSeedData);
      
      // 2. Create engine
      const engine = new MeaningEngine(world);
      
      // 3. Get stats
      const stats = engine.getStats();
      expect(stats.nodeCount).toBe(3);
      
      // 4. Validate node
      const nodeValidation = engine.validateNode({ id: "new", type: "item" });
      expect(nodeValidation.valid).toBe(true);
      
      // 5. Check types
      expect(engine.isValidNodeType("root")).toBe(true);
      expect(engine.isValidEdgeType("contains")).toBe(true);
      
      // 6. Query graph
      const root = engine.getNodeById("root-1");
      expect(root.label).toBe("Root Node");
      
      const neighbors = engine.getNeighbors("root-1");
      expect(neighbors).toHaveLength(2);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORM SPECIFICATION (P6.0c)
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Platform Specification (static methods)", () => {
    it("getSpecificationReader() returns SpecificationReader instance", () => {
      const reader = MeaningEngine.getSpecificationReader();
      expect(reader).toBeDefined();
      expect(typeof reader.getVersion).toBe("function");
      expect(reader.getVersion()).toBe("0.5.0");
    });
    
    it("getSpecification() returns full specification", () => {
      const spec = MeaningEngine.getSpecification();
      expect(spec).toHaveProperty("engine");
      expect(spec.engine).toHaveProperty("version");
      expect(spec.engine).toHaveProperty("contracts");
    });
    
    it("getCapabilities() returns capabilities object", () => {
      const caps = MeaningEngine.getCapabilities();
      expect(caps).toHaveProperty("multi_world");
      expect(caps).toHaveProperty("schema_validation");
      expect(caps.multi_world).toBe(true);
    });
    
    it("getContracts() returns list of contract names", () => {
      const contracts = MeaningEngine.getContracts();
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts).toContain("MeaningEngine");
      expect(contracts).toContain("WorldInterface");
    });
    
    it("toLLMContext() returns compact context for LLM", () => {
      const ctx = MeaningEngine.toLLMContext();
      expect(ctx).toHaveProperty("engine_version");
      expect(ctx).toHaveProperty("contracts");
      expect(ctx).toHaveProperty("capabilities");
      expect(ctx).toHaveProperty("constraints");
      expect(ctx.engine_version).toBe("0.5.0");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CATALOGS & OPERATORS (T3.0)
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Catalogs & Operators (T3.0)", () => {
    describe("without catalogs", () => {
      const world = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
      const engine = new MeaningEngine(world);
      
      it("hasCatalogs() returns false", () => {
        expect(engine.hasCatalogs()).toBe(false);
      });
      
      it("getCatalogs() returns null", () => {
        expect(engine.getCatalogs()).toBeNull();
      });
      
      it("hasOperators() returns false", () => {
        expect(engine.hasOperators()).toBe(false);
      });
      
      it("getOperators() returns null", () => {
        expect(engine.getOperators()).toBeNull();
      });
      
      it("project() returns empty array", () => {
        expect(engine.project("item-1", "tools")).toEqual([]);
      });
      
      it("filter() returns empty array", () => {
        expect(engine.filter([{ id: "1" }], { id: "1" })).toEqual([]);
      });
      
      it("projectAndFilter() returns empty array", () => {
        expect(engine.projectAndFilter("item-1", "tools", {})).toEqual([]);
      });
      
      it("getStats() shows hasCatalogs: false", () => {
        const stats = engine.getStats();
        expect(stats.hasCatalogs).toBe(false);
        expect(stats.hasOperators).toBe(false);
      });
    });
    
    describe("with catalogs", () => {
      const worldAdapter = new WorldAdapter({ schemaData: testSchemaData, seedData: testSeedData });
      const worldWithCatalogs = {
        getSchema: () => worldAdapter.getSchema(),
        getGraph: () => worldAdapter.getGraph(),
        getSeed: () => null,
        getConfig: () => null,
        getCatalogs: () => testCatalogs,
      };
      
      const engine = new MeaningEngine(worldWithCatalogs);
      
      it("hasCatalogs() returns true", () => {
        expect(engine.hasCatalogs()).toBe(true);
      });
      
      it("getCatalogs() returns CatalogRegistry", () => {
        const catalogs = engine.getCatalogs();
        expect(catalogs).not.toBeNull();
        expect(catalogs.has("tools")).toBe(true);
      });
      
      it("hasOperators() returns true", () => {
        expect(engine.hasOperators()).toBe(true);
      });
      
      it("getOperators() returns OperatorEngine", () => {
        const operators = engine.getOperators();
        expect(operators).not.toBeNull();
        expect(typeof operators.project).toBe("function");
      });
      
      it("project() returns entries by catalogRefs", () => {
        const entries = engine.project("item-1", "tools", { useTags: false });
        expect(entries.length).toBeGreaterThan(0);
        expect(entries.some(e => e.id === "vscode")).toBe(true);
        expect(entries.some(e => e.id === "cursor")).toBe(true);
      });
      
      it("project() returns entries by tags", () => {
        const entries = engine.project("item-1", "tools", { useRefs: false });
        expect(entries.length).toBeGreaterThan(0);
        expect(entries.some(e => e.tags.includes("editor"))).toBe(true);
      });
      
      it("project() returns entries by pointer-tags (cap:X)", () => {
        const entries = engine.project("item-2", "tools");
        expect(entries.length).toBeGreaterThan(0);
        expect(entries.some(e => e.tags.includes("ai"))).toBe(true);
      });
      
      it("filter() filters entries", () => {
        const all = engine.getCatalogs().getEntries("tools");
        const filtered = engine.filter(all, { tags: "free" });
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe("vscode");
      });
      
      it("projectAndFilter() combines project and filter", () => {
        const entries = engine.projectAndFilter("item-1", "tools", { tags: "ai" });
        expect(entries.some(e => e.id === "cursor")).toBe(true);
      });
      
      it("getStats() includes catalog stats", () => {
        const stats = engine.getStats();
        expect(stats.hasCatalogs).toBe(true);
        expect(stats.hasOperators).toBe(true);
        expect(stats.catalogs).toBeDefined();
        expect(stats.catalogs.catalogCount).toBe(1);
        expect(stats.catalogs.totalEntries).toBe(3);
      });
    });
  });
});
