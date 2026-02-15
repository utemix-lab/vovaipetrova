/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD INTERFACE TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0a.1: Engine ↔ World Contract
 * 
 * Тесты контракта между Engine и World.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  WorldInterface,
  SchemaValidator,
  GraphValidator,
  CatalogValidator,
  WorldValidator,
} from "../WorldInterface.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const validSchema = {
  version: "1.0.0",
  name: "test-world",
  nodeTypes: [
    { id: "root", label: "Root" },
    { id: "node", label: "Node" },
  ],
  edgeTypes: [
    { id: "connects", label: "Connects" },
  ],
};

const validGraph = {
  getNodes: () => [
    { id: "1", type: "root", label: "Root" },
    { id: "2", type: "node", label: "Node A" },
  ],
  getEdges: () => [
    { source: "1", target: "2", type: "connects" },
  ],
  getNodeById: (id) => validGraph.getNodes().find(n => n.id === id) || null,
  getNeighbors: (nodeId) => {
    const edges = validGraph.getEdges();
    const neighborIds = edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .map(e => e.source === nodeId ? e.target : e.source);
    return validGraph.getNodes().filter(n => neighborIds.includes(n.id));
  },
};

const validCatalogs = {
  vst: {
    id: "vst",
    schema: {
      name: "string",
      manufacturer: "string",
      year: "number",
    },
    entries: [
      { id: "serum", name: "Serum", manufacturer: "Xfer", year: 2014 },
      { id: "massive", name: "Massive X", manufacturer: "NI", year: 2019 },
    ],
  },
  tools: {
    id: "tools",
    entries: [
      { id: "vscode", name: "VS Code" },
      { id: "cursor", name: "Cursor" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WORLD INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

describe("WorldInterface", () => {
  it("should throw on getSchema() if not implemented", () => {
    const world = new WorldInterface();
    expect(() => world.getSchema()).toThrow("must be implemented");
  });
  
  it("should throw on getGraph() if not implemented", () => {
    const world = new WorldInterface();
    expect(() => world.getGraph()).toThrow("must be implemented");
  });
  
  it("should return null for optional getSeed()", () => {
    const world = new WorldInterface();
    expect(world.getSeed()).toBeNull();
  });
  
  it("should return null for optional getConfig()", () => {
    const world = new WorldInterface();
    expect(world.getConfig()).toBeNull();
  });
  
  it("should return null for optional getCatalogs()", () => {
    const world = new WorldInterface();
    expect(world.getCatalogs()).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

describe("SchemaValidator", () => {
  describe("validate", () => {
    it("should validate correct schema", () => {
      const result = SchemaValidator.validate(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should reject null schema", () => {
      const result = SchemaValidator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Schema is required");
    });
    
    it("should reject schema without version", () => {
      const result = SchemaValidator.validate({ name: "test", nodeTypes: [], edgeTypes: [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("version"))).toBe(true);
    });
    
    it("should reject schema without name", () => {
      const result = SchemaValidator.validate({ version: "1.0", nodeTypes: [], edgeTypes: [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("name"))).toBe(true);
    });
    
    it("should reject schema without nodeTypes array", () => {
      const result = SchemaValidator.validate({ version: "1.0", name: "test", edgeTypes: [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("nodeTypes"))).toBe(true);
    });
    
    it("should reject schema without edgeTypes array", () => {
      const result = SchemaValidator.validate({ version: "1.0", name: "test", nodeTypes: [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("edgeTypes"))).toBe(true);
    });
    
    it("should reject nodeType without id", () => {
      const schema = {
        version: "1.0",
        name: "test",
        nodeTypes: [{ label: "Test" }],
        edgeTypes: [],
      };
      const result = SchemaValidator.validate(schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("nodeTypes[0].id"))).toBe(true);
    });
    
    it("should reject nodeType without label", () => {
      const schema = {
        version: "1.0",
        name: "test",
        nodeTypes: [{ id: "test" }],
        edgeTypes: [],
      };
      const result = SchemaValidator.validate(schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("nodeTypes[0].label"))).toBe(true);
    });
  });
  
  describe("isValidNodeType", () => {
    it("should return true for valid node type", () => {
      expect(SchemaValidator.isValidNodeType(validSchema, "root")).toBe(true);
      expect(SchemaValidator.isValidNodeType(validSchema, "node")).toBe(true);
    });
    
    it("should return false for invalid node type", () => {
      expect(SchemaValidator.isValidNodeType(validSchema, "unknown")).toBe(false);
    });
    
    it("should return false for null schema", () => {
      expect(SchemaValidator.isValidNodeType(null, "root")).toBe(false);
    });
  });
  
  describe("isValidEdgeType", () => {
    it("should return true for valid edge type", () => {
      expect(SchemaValidator.isValidEdgeType(validSchema, "connects")).toBe(true);
    });
    
    it("should return false for invalid edge type", () => {
      expect(SchemaValidator.isValidEdgeType(validSchema, "unknown")).toBe(false);
    });
    
    it("should return false for null schema", () => {
      expect(SchemaValidator.isValidEdgeType(null, "connects")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GRAPH VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

describe("GraphValidator", () => {
  describe("validate", () => {
    it("should validate correct graph", () => {
      const result = GraphValidator.validate(validGraph);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should reject null graph", () => {
      const result = GraphValidator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Graph is required");
    });
    
    it("should reject graph without getNodes", () => {
      const result = GraphValidator.validate({ getEdges: () => [], getNodeById: () => null, getNeighbors: () => [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getNodes"))).toBe(true);
    });
    
    it("should reject graph without getEdges", () => {
      const result = GraphValidator.validate({ getNodes: () => [], getNodeById: () => null, getNeighbors: () => [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getEdges"))).toBe(true);
    });
    
    it("should reject graph without getNodeById", () => {
      const result = GraphValidator.validate({ getNodes: () => [], getEdges: () => [], getNeighbors: () => [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getNodeById"))).toBe(true);
    });
    
    it("should reject graph without getNeighbors", () => {
      const result = GraphValidator.validate({ getNodes: () => [], getEdges: () => [], getNodeById: () => null });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getNeighbors"))).toBe(true);
    });
  });
  
  describe("validateAgainstSchema", () => {
    it("should validate consistent graph and schema", () => {
      const result = GraphValidator.validateAgainstSchema(validGraph, validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should reject node with invalid type", () => {
      const invalidGraph = {
        getNodes: () => [{ id: "1", type: "unknown" }],
        getEdges: () => [],
        getNodeById: () => null,
        getNeighbors: () => [],
      };
      const result = GraphValidator.validateAgainstSchema(invalidGraph, validSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("invalid type"))).toBe(true);
    });
    
    it("should reject edge with invalid type", () => {
      const invalidGraph = {
        getNodes: () => [{ id: "1", type: "root" }],
        getEdges: () => [{ source: "1", target: "1", type: "unknown" }],
        getNodeById: () => null,
        getNeighbors: () => [],
      };
      const result = GraphValidator.validateAgainstSchema(invalidGraph, validSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("invalid type"))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CATALOG VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

describe("CatalogValidator", () => {
  describe("validate", () => {
    it("should validate correct catalogs", () => {
      const result = CatalogValidator.validate(validCatalogs);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should accept null catalogs (optional)", () => {
      const result = CatalogValidator.validate(null);
      expect(result.valid).toBe(true);
    });
    
    it("should accept undefined catalogs (optional)", () => {
      const result = CatalogValidator.validate(undefined);
      expect(result.valid).toBe(true);
    });
    
    it("should reject array instead of object", () => {
      const result = CatalogValidator.validate([]);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("must be an object"))).toBe(true);
    });
    
    it("should reject catalog without id", () => {
      const result = CatalogValidator.validate({
        test: { entries: [] }
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes(".id must be a string"))).toBe(true);
    });
    
    it("should reject catalog with mismatched id", () => {
      const result = CatalogValidator.validate({
        test: { id: "wrong", entries: [] }
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("must match registry key"))).toBe(true);
    });
    
    it("should reject catalog without entries", () => {
      const result = CatalogValidator.validate({
        test: { id: "test" }
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes(".entries must be an array"))).toBe(true);
    });
    
    it("should reject entry without id", () => {
      const result = CatalogValidator.validate({
        test: { id: "test", entries: [{ name: "no id" }] }
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("entries[0].id must be a string"))).toBe(true);
    });
    
    it("should accept catalog with schema", () => {
      const result = CatalogValidator.validate({
        test: { 
          id: "test", 
          schema: { name: "string" },
          entries: [{ id: "1", name: "Test" }] 
        }
      });
      expect(result.valid).toBe(true);
    });
    
    it("should reject invalid schema type", () => {
      const result = CatalogValidator.validate({
        test: { id: "test", schema: "invalid", entries: [] }
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes(".schema must be an object"))).toBe(true);
    });
  });
  
  describe("hasCatalog", () => {
    it("should return true for existing catalog", () => {
      expect(CatalogValidator.hasCatalog(validCatalogs, "vst")).toBe(true);
    });
    
    it("should return false for non-existing catalog", () => {
      expect(CatalogValidator.hasCatalog(validCatalogs, "unknown")).toBe(false);
    });
    
    it("should return false for null catalogs", () => {
      expect(CatalogValidator.hasCatalog(null, "vst")).toBe(false);
    });
  });
  
  describe("hasEntry", () => {
    it("should return true for existing entry", () => {
      expect(CatalogValidator.hasEntry(validCatalogs, "vst", "serum")).toBe(true);
    });
    
    it("should return false for non-existing entry", () => {
      expect(CatalogValidator.hasEntry(validCatalogs, "vst", "unknown")).toBe(false);
    });
    
    it("should return false for non-existing catalog", () => {
      expect(CatalogValidator.hasEntry(validCatalogs, "unknown", "serum")).toBe(false);
    });
    
    it("should return false for null catalogs", () => {
      expect(CatalogValidator.hasEntry(null, "vst", "serum")).toBe(false);
    });
  });
  
  describe("validateCatalogRefs", () => {
    const testCatalogs = {
      tools: {
        id: "tools",
        entries: [
          { id: "vscode" },
          { id: "cursor" },
        ],
      },
    };
    
    it("should validate correct catalogRefs", () => {
      const graph = {
        getNodes: () => [
          { id: "node1", catalogRefs: { tools: ["vscode", "cursor"] } },
        ],
        getEdges: () => [],
      };
      const result = CatalogValidator.validateCatalogRefs(graph, testCatalogs);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
    
    it("should warn about unknown catalog", () => {
      const graph = {
        getNodes: () => [
          { id: "node1", catalogRefs: { unknown: ["entry1"] } },
        ],
        getEdges: () => [],
      };
      const result = CatalogValidator.validateCatalogRefs(graph, testCatalogs);
      expect(result.valid).toBe(true); // warnings don't fail validation
      expect(result.warnings.some(w => w.includes("unknown catalog"))).toBe(true);
    });
    
    it("should warn about unknown entry", () => {
      const graph = {
        getNodes: () => [
          { id: "node1", catalogRefs: { tools: ["vscode", "unknown"] } },
        ],
        getEdges: () => [],
      };
      const result = CatalogValidator.validateCatalogRefs(graph, testCatalogs);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes("unknown entry"))).toBe(true);
    });
    
    it("should error if catalogRefs value is not array", () => {
      const graph = {
        getNodes: () => [
          { id: "node1", catalogRefs: { tools: "vscode" } }, // should be array
        ],
        getEdges: () => [],
      };
      const result = CatalogValidator.validateCatalogRefs(graph, testCatalogs);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("must be an array"))).toBe(true);
    });
    
    it("should skip nodes without catalogRefs", () => {
      const graph = {
        getNodes: () => [
          { id: "node1" },
          { id: "node2", catalogRefs: { tools: ["vscode"] } },
        ],
        getEdges: () => [],
      };
      const result = CatalogValidator.validateCatalogRefs(graph, testCatalogs);
      expect(result.valid).toBe(true);
    });
    
    it("should return valid for null graph", () => {
      const result = CatalogValidator.validateCatalogRefs(null, testCatalogs);
      expect(result.valid).toBe(true);
    });
    
    it("should return valid for null catalogs", () => {
      const graph = {
        getNodes: () => [{ id: "node1", catalogRefs: { tools: ["vscode"] } }],
        getEdges: () => [],
      };
      const result = CatalogValidator.validateCatalogRefs(graph, null);
      expect(result.valid).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WORLD VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

describe("WorldValidator", () => {
  describe("validate", () => {
    it("should validate correct world", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
        getSeed: () => null,
        getConfig: () => null,
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should reject null world", () => {
      const result = WorldValidator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("World is required");
    });
    
    it("should reject world with throwing getSchema", () => {
      const world = {
        getSchema: () => { throw new Error("Schema error"); },
        getGraph: () => validGraph,
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getSchema"))).toBe(true);
    });
    
    it("should reject world with throwing getGraph", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => { throw new Error("Graph error"); },
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getGraph"))).toBe(true);
    });
    
    it("should warn about missing optional methods", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
    
    it("should detect inconsistent graph and schema", () => {
      const inconsistentGraph = {
        getNodes: () => [{ id: "1", type: "unknown" }],
        getEdges: () => [],
        getNodeById: () => null,
        getNeighbors: () => [],
      };
      const world = {
        getSchema: () => validSchema,
        getGraph: () => inconsistentGraph,
        getSeed: () => null,
        getConfig: () => null,
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("invalid type"))).toBe(true);
    });
    
    it("should validate world with valid catalogs", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
        getSeed: () => null,
        getConfig: () => null,
        getCatalogs: () => validCatalogs,
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should validate world with null catalogs", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
        getSeed: () => null,
        getConfig: () => null,
        getCatalogs: () => null,
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(true);
    });
    
    it("should reject world with invalid catalogs", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
        getSeed: () => null,
        getConfig: () => null,
        getCatalogs: () => ({
          broken: { entries: [] } // missing id
        }),
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("catalog"))).toBe(true);
    });
    
    it("should reject world with throwing getCatalogs", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
        getSeed: () => null,
        getConfig: () => null,
        getCatalogs: () => { throw new Error("Catalog error"); },
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("getCatalogs"))).toBe(true);
    });
    
    it("should warn about missing getCatalogs (optional)", () => {
      const world = {
        getSchema: () => validSchema,
        getGraph: () => validGraph,
        getSeed: () => null,
        getConfig: () => null,
        // no getCatalogs
      };
      const result = WorldValidator.validate(world);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes("getCatalogs"))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

describe("Contract Enforcement", () => {
  it("Engine should NOT know concrete types", () => {
    // This test ensures that SchemaValidator works with ANY types
    const customSchema = {
      version: "1.0.0",
      name: "custom-world",
      nodeTypes: [
        { id: "planet", label: "Planet" },
        { id: "star", label: "Star" },
        { id: "galaxy", label: "Galaxy" },
      ],
      edgeTypes: [
        { id: "orbits", label: "Orbits" },
        { id: "contains", label: "Contains" },
      ],
    };
    
    // Engine validates without knowing what "planet" or "star" means
    const result = SchemaValidator.validate(customSchema);
    expect(result.valid).toBe(true);
    
    // Engine checks types without hardcoding them
    expect(SchemaValidator.isValidNodeType(customSchema, "planet")).toBe(true);
    expect(SchemaValidator.isValidNodeType(customSchema, "character")).toBe(false);
  });
  
  it("Engine should work with empty world", () => {
    const emptySchema = {
      version: "1.0.0",
      name: "empty-world",
      nodeTypes: [],
      edgeTypes: [],
    };
    
    const emptyGraph = {
      getNodes: () => [],
      getEdges: () => [],
      getNodeById: () => null,
      getNeighbors: () => [],
    };
    
    const world = {
      getSchema: () => emptySchema,
      getGraph: () => emptyGraph,
      getSeed: () => null,
      getConfig: () => null,
    };
    
    const result = WorldValidator.validate(world);
    expect(result.valid).toBe(true);
  });
});
