/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CANONICAL GRAPH SCHEMA — ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2a: Canonical Schema Definition
 * 
 * Покрытие:
 * - NODE_TYPES: определения и freeze
 * - EDGE_TYPES: определения и freeze
 * - NODE_TYPE_META: метаданные типов
 * - EDGE_TYPE_META: метаданные рёбер
 * - SchemaValidator: валидация узлов, рёбер, графа
 * - SCHEMA_VERSION: версионирование
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  NODE_TYPES,
  NODE_TYPE_META,
  EDGE_TYPES,
  EDGE_TYPE_META,
  VISIBILITY,
  STATUS,
  IDENTITY_REQUIRED_FIELDS,
  IDENTITY_RECOMMENDED_FIELDS,
  SchemaValidator,
  SCHEMA_VERSION,
  SCHEMA_META,
} from "../CanonicalGraphSchema.js";

// ═══════════════════════════════════════════════════════════════════════════
// NODE_TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("NODE_TYPES", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(NODE_TYPES)).toBe(true);
  });
  
  it("should contain core types", () => {
    expect(NODE_TYPES.ROOT).toBe("root");
    expect(NODE_TYPES.HUB).toBe("hub");
    expect(NODE_TYPES.CHARACTER).toBe("character");
    expect(NODE_TYPES.DOMAIN).toBe("domain");
    expect(NODE_TYPES.WORKBENCH).toBe("workbench");
    expect(NODE_TYPES.COLLAB).toBe("collab");
  });
  
  it("should contain extension types", () => {
    expect(NODE_TYPES.SUBDOMAIN).toBe("subdomain");
    expect(NODE_TYPES.ARTIFACT).toBe("artifact");
    expect(NODE_TYPES.CONCEPT).toBe("concept");
  });
  
  it("should not allow modification", () => {
    expect(() => {
      NODE_TYPES.NEW_TYPE = "new";
    }).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NODE_TYPE_META
// ═══════════════════════════════════════════════════════════════════════════

describe("NODE_TYPE_META", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(NODE_TYPE_META)).toBe(true);
  });
  
  it("should have meta for all NODE_TYPES", () => {
    for (const type of Object.values(NODE_TYPES)) {
      expect(NODE_TYPE_META[type]).toBeDefined();
      expect(NODE_TYPE_META[type].description).toBeDefined();
      expect(NODE_TYPE_META[type].abstraction).toBeDefined();
      expect(NODE_TYPE_META[type].role).toBeDefined();
      expect(NODE_TYPE_META[type].requiredFields).toBeDefined();
    }
  });
  
  it("should define allowedChildren for each type", () => {
    for (const type of Object.values(NODE_TYPES)) {
      expect(Array.isArray(NODE_TYPE_META[type].allowedChildren)).toBe(true);
    }
  });
  
  it("should have correct abstraction levels", () => {
    expect(NODE_TYPE_META[NODE_TYPES.ROOT].abstraction).toBe("high");
    expect(NODE_TYPE_META[NODE_TYPES.HUB].abstraction).toBe("high");
    expect(NODE_TYPE_META[NODE_TYPES.CHARACTER].abstraction).toBe("low");
    expect(NODE_TYPE_META[NODE_TYPES.DOMAIN].abstraction).toBe("medium");
  });
  
  it("should require id, label, type for all types", () => {
    for (const type of Object.values(NODE_TYPES)) {
      expect(NODE_TYPE_META[type].requiredFields).toContain("id");
      expect(NODE_TYPE_META[type].requiredFields).toContain("label");
      expect(NODE_TYPE_META[type].requiredFields).toContain("type");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE_TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("EDGE_TYPES", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(EDGE_TYPES)).toBe(true);
  });
  
  it("should contain core types", () => {
    expect(EDGE_TYPES.STRUCTURAL).toBe("structural");
    expect(EDGE_TYPES.CONTAINS).toBe("contains");
    expect(EDGE_TYPES.RELATES).toBe("relates");
    expect(EDGE_TYPES.OWNS).toBe("owns");
  });
  
  it("should contain extension types", () => {
    expect(EDGE_TYPES.DEPENDS).toBe("depends");
    expect(EDGE_TYPES.INFLUENCES).toBe("influences");
    expect(EDGE_TYPES.COLLABORATES).toBe("collaborates");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE_TYPE_META
// ═══════════════════════════════════════════════════════════════════════════

describe("EDGE_TYPE_META", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(EDGE_TYPE_META)).toBe(true);
  });
  
  it("should have meta for all EDGE_TYPES", () => {
    for (const type of Object.values(EDGE_TYPES)) {
      expect(EDGE_TYPE_META[type]).toBeDefined();
      expect(EDGE_TYPE_META[type].description).toBeDefined();
      expect(EDGE_TYPE_META[type].directed).toBeDefined();
      expect(EDGE_TYPE_META[type].allowedSourceTypes).toBeDefined();
      expect(EDGE_TYPE_META[type].allowedTargetTypes).toBeDefined();
    }
  });
  
  it("should define directed property", () => {
    expect(EDGE_TYPE_META[EDGE_TYPES.STRUCTURAL].directed).toBe(true);
    expect(EDGE_TYPE_META[EDGE_TYPES.CONTAINS].directed).toBe(true);
    expect(EDGE_TYPE_META[EDGE_TYPES.RELATES].directed).toBe(false);
    expect(EDGE_TYPE_META[EDGE_TYPES.COLLABORATES].directed).toBe(false);
  });
  
  it("should require id, source, target, type for all types", () => {
    for (const type of Object.values(EDGE_TYPES)) {
      expect(EDGE_TYPE_META[type].requiredFields).toContain("id");
      expect(EDGE_TYPE_META[type].requiredFields).toContain("source");
      expect(EDGE_TYPE_META[type].requiredFields).toContain("target");
      expect(EDGE_TYPE_META[type].requiredFields).toContain("type");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VISIBILITY & STATUS
// ═══════════════════════════════════════════════════════════════════════════

describe("VISIBILITY", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(VISIBILITY)).toBe(true);
  });
  
  it("should contain standard values", () => {
    expect(VISIBILITY.PUBLIC).toBe("public");
    expect(VISIBILITY.PRIVATE).toBe("private");
    expect(VISIBILITY.HIDDEN).toBe("hidden");
  });
});

describe("STATUS", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(STATUS)).toBe(true);
  });
  
  it("should contain standard values", () => {
    expect(STATUS.CORE).toBe("core");
    expect(STATUS.EXPANDABLE).toBe("expandable");
    expect(STATUS.DRAFT).toBe("draft");
    expect(STATUS.ARCHIVED).toBe("archived");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY FIELDS
// ═══════════════════════════════════════════════════════════════════════════

describe("IDENTITY_REQUIRED_FIELDS", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(IDENTITY_REQUIRED_FIELDS)).toBe(true);
  });
  
  it("should contain id", () => {
    expect(IDENTITY_REQUIRED_FIELDS).toContain("id");
  });
});

describe("IDENTITY_RECOMMENDED_FIELDS", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(IDENTITY_RECOMMENDED_FIELDS)).toBe(true);
  });
  
  it("should contain recommended fields", () => {
    expect(IDENTITY_RECOMMENDED_FIELDS).toContain("label");
    expect(IDENTITY_RECOMMENDED_FIELDS).toContain("canonicalName");
    expect(IDENTITY_RECOMMENDED_FIELDS).toContain("aliases");
    expect(IDENTITY_RECOMMENDED_FIELDS).toContain("slug");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SchemaValidator — validateNode
// ═══════════════════════════════════════════════════════════════════════════

describe("SchemaValidator", () => {
  let validator;
  
  beforeEach(() => {
    validator = new SchemaValidator();
  });
  
  describe("validateNode", () => {
    it("should validate a correct node", () => {
      const node = {
        id: "test-node",
        label: "Test Node",
        type: "character",
        visibility: "public",
        status: "core",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should fail on missing id", () => {
      const node = {
        label: "Test Node",
        type: "character",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("id"))).toBe(true);
    });
    
    it("should fail on missing type", () => {
      const node = {
        id: "test-node",
        label: "Test Node",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("type"))).toBe(true);
    });
    
    it("should fail on unknown type", () => {
      const node = {
        id: "test-node",
        label: "Test Node",
        type: "unknown-type",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("unknown type"))).toBe(true);
    });
    
    it("should warn on missing label", () => {
      const node = {
        id: "test-node",
        type: "character",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.valid).toBe(false); // label is required for character
      expect(result.errors.some(e => e.includes("label"))).toBe(true);
    });
    
    it("should warn on unknown visibility", () => {
      const node = {
        id: "test-node",
        label: "Test",
        type: "character",
        visibility: "unknown-visibility",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.warnings.some(w => w.includes("visibility"))).toBe(true);
    });
    
    it("should warn on unknown status", () => {
      const node = {
        id: "test-node",
        label: "Test",
        type: "character",
        status: "unknown-status",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.warnings.some(w => w.includes("status"))).toBe(true);
    });
    
    it("should fail on non-string id", () => {
      const node = {
        id: 123,
        label: "Test",
        type: "character",
      };
      
      const result = validator.validateNode(node);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("string"))).toBe(true);
    });
    
    it("should validate all core node types", () => {
      const types = ["root", "hub", "character", "domain", "workbench", "collab"];
      
      for (const type of types) {
        const node = { id: `test-${type}`, label: `Test ${type}`, type };
        const result = validator.validateNode(node);
        expect(result.valid).toBe(true);
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SchemaValidator — validateEdge
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("validateEdge", () => {
    it("should validate a correct edge", () => {
      const edge = {
        id: "edge-1",
        source: "node-a",
        target: "node-b",
        type: "relates",
      };
      
      const result = validator.validateEdge(edge);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should fail on missing id", () => {
      const edge = {
        source: "node-a",
        target: "node-b",
        type: "relates",
      };
      
      const result = validator.validateEdge(edge);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("id"))).toBe(true);
    });
    
    it("should fail on missing source", () => {
      const edge = {
        id: "edge-1",
        target: "node-b",
        type: "relates",
      };
      
      const result = validator.validateEdge(edge);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("source"))).toBe(true);
    });
    
    it("should fail on missing target", () => {
      const edge = {
        id: "edge-1",
        source: "node-a",
        type: "relates",
      };
      
      const result = validator.validateEdge(edge);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("target"))).toBe(true);
    });
    
    it("should fail on missing type", () => {
      const edge = {
        id: "edge-1",
        source: "node-a",
        target: "node-b",
      };
      
      const result = validator.validateEdge(edge);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("type"))).toBe(true);
    });
    
    it("should warn on unknown edge type", () => {
      const edge = {
        id: "edge-1",
        source: "node-a",
        target: "node-b",
        type: "custom-type",
      };
      
      const result = validator.validateEdge(edge);
      
      expect(result.valid).toBe(true); // unknown type is warning, not error
      expect(result.warnings.some(w => w.includes("unknown type"))).toBe(true);
    });
    
    it("should fail on non-existent source node", () => {
      const nodesById = new Map([
        ["node-b", { id: "node-b", type: "character" }],
      ]);
      
      const edge = {
        id: "edge-1",
        source: "node-a",
        target: "node-b",
        type: "relates",
      };
      
      const result = validator.validateEdge(edge, nodesById);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("non-existent source"))).toBe(true);
    });
    
    it("should fail on non-existent target node", () => {
      const nodesById = new Map([
        ["node-a", { id: "node-a", type: "character" }],
      ]);
      
      const edge = {
        id: "edge-1",
        source: "node-a",
        target: "node-b",
        type: "relates",
      };
      
      const result = validator.validateEdge(edge, nodesById);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("non-existent target"))).toBe(true);
    });
    
    it("should warn on invalid source type for edge type", () => {
      const nodesById = new Map([
        ["node-a", { id: "node-a", type: "artifact" }], // artifact can't be source of structural
        ["node-b", { id: "node-b", type: "hub" }],
      ]);
      
      const edge = {
        id: "edge-1",
        source: "node-a",
        target: "node-b",
        type: "structural",
      };
      
      const result = validator.validateEdge(edge, nodesById);
      
      expect(result.warnings.some(w => w.includes("source type"))).toBe(true);
    });
    
    it("should validate all core edge types", () => {
      const types = ["structural", "contains", "relates", "owns"];
      
      for (const type of types) {
        const edge = { id: `edge-${type}`, source: "a", target: "b", type };
        const result = validator.validateEdge(edge);
        expect(result.valid).toBe(true);
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SchemaValidator — validateGraph
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("validateGraph", () => {
    it("should validate a correct graph", () => {
      const graphData = {
        nodes: [
          { id: "universe", label: "Universe", type: "root" },
          { id: "characters", label: "Characters", type: "hub" },
          { id: "vova", label: "Вова", type: "character" },
        ],
        edges: [
          { id: "e1", source: "universe", target: "characters", type: "structural" },
          { id: "e2", source: "characters", target: "vova", type: "contains" },
        ],
      };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should collect errors from all nodes", () => {
      const graphData = {
        nodes: [
          { id: "node-1", type: "unknown" },
          { label: "No ID", type: "character" },
        ],
        edges: [],
      };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
    
    it("should detect duplicate node ids", () => {
      const graphData = {
        nodes: [
          { id: "same-id", label: "Node 1", type: "character" },
          { id: "same-id", label: "Node 2", type: "character" },
        ],
        edges: [],
      };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Duplicate node id"))).toBe(true);
    });
    
    it("should detect duplicate edge ids", () => {
      const graphData = {
        nodes: [
          { id: "a", label: "A", type: "character" },
          { id: "b", label: "B", type: "character" },
        ],
        edges: [
          { id: "same-edge", source: "a", target: "b", type: "relates" },
          { id: "same-edge", source: "b", target: "a", type: "relates" },
        ],
      };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Duplicate edge id"))).toBe(true);
    });
    
    it("should warn on isolated nodes", () => {
      const graphData = {
        nodes: [
          { id: "connected", label: "Connected", type: "character" },
          { id: "isolated", label: "Isolated", type: "character" },
          { id: "other", label: "Other", type: "character" },
        ],
        edges: [
          { id: "e1", source: "connected", target: "other", type: "relates" },
        ],
      };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.warnings.some(w => w.includes("isolated"))).toBe(true);
    });
    
    it("should handle empty graph", () => {
      const graphData = { nodes: [], edges: [] };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should handle graph with links instead of edges", () => {
      const graphData = {
        nodes: [
          { id: "a", label: "A", type: "character" },
          { id: "b", label: "B", type: "character" },
        ],
        links: [
          { id: "e1", source: "a", target: "b", type: "relates" },
        ],
      };
      
      const result = validator.validateGraph(graphData);
      
      expect(result.valid).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SchemaValidator — getSchemaStats
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("getSchemaStats", () => {
    it("should return correct stats", () => {
      const graphData = {
        nodes: [
          { id: "universe", label: "Universe", type: "root" },
          { id: "characters", label: "Characters", type: "hub" },
          { id: "vova", label: "Вова", type: "character" },
          { id: "petrova", label: "Петрова", type: "character" },
        ],
        edges: [
          { id: "e1", source: "universe", target: "characters", type: "structural" },
          { id: "e2", source: "characters", target: "vova", type: "contains" },
          { id: "e3", source: "characters", target: "petrova", type: "contains" },
        ],
      };
      
      const stats = validator.getSchemaStats(graphData);
      
      expect(stats.totalNodes).toBe(4);
      expect(stats.totalEdges).toBe(3);
      expect(stats.nodeTypeCounts.root).toBe(1);
      expect(stats.nodeTypeCounts.hub).toBe(1);
      expect(stats.nodeTypeCounts.character).toBe(2);
      expect(stats.edgeTypeCounts.structural).toBe(1);
      expect(stats.edgeTypeCounts.contains).toBe(2);
    });
    
    it("should count unknown types", () => {
      const graphData = {
        nodes: [
          { id: "a", label: "A", type: "custom-type" },
        ],
        edges: [
          { id: "e1", source: "a", target: "a", type: "custom-edge" },
        ],
      };
      
      const stats = validator.getSchemaStats(graphData);
      
      expect(stats.nodeTypeCounts.unknown).toBe(1);
      expect(stats.edgeTypeCounts.unknown).toBe(1);
    });
    
    it("should return known type counts", () => {
      const stats = validator.getSchemaStats({ nodes: [], edges: [] });
      
      expect(stats.knownNodeTypes).toBe(Object.values(NODE_TYPES).length);
      expect(stats.knownEdgeTypes).toBe(Object.values(EDGE_TYPES).length);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SchemaValidator — reset
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("reset", () => {
    it("should clear errors and warnings", () => {
      validator.errors = ["error1"];
      validator.warnings = ["warning1"];
      
      validator.reset();
      
      expect(validator.errors).toHaveLength(0);
      expect(validator.warnings).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA_VERSION & SCHEMA_META
// ═══════════════════════════════════════════════════════════════════════════

describe("SCHEMA_VERSION", () => {
  it("should be a valid semver string", () => {
    expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
  
  it("should be 1.0.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0.0");
  });
});

describe("SCHEMA_META", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(SCHEMA_META)).toBe(true);
  });
  
  it("should contain version", () => {
    expect(SCHEMA_META.version).toBe(SCHEMA_VERSION);
  });
  
  it("should contain name and description", () => {
    expect(SCHEMA_META.name).toBe("CanonicalGraphSchema");
    expect(SCHEMA_META.description).toBeDefined();
  });
  
  it("should contain type counts", () => {
    expect(SCHEMA_META.nodeTypes).toBe(Object.keys(NODE_TYPES).length);
    expect(SCHEMA_META.edgeTypes).toBe(Object.keys(EDGE_TYPES).length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION — Validate real universe.json structure
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration: universe.json structure", () => {
  let validator;
  
  beforeEach(() => {
    validator = new SchemaValidator();
  });
  
  it("should validate typical universe.json node", () => {
    const node = {
      id: "universe",
      label: "Universe",
      position: { x: 400, y: 300 },
      story: "",
      system: "",
      service: "",
      type: "root",
      visibility: "public",
      status: "core",
      semantics: { role: "container", abstraction: "high" },
      rag: { index: true, priority: 0.8 },
    };
    
    const result = validator.validateNode(node);
    
    expect(result.valid).toBe(true);
  });
  
  it("should validate typical universe.json edge", () => {
    const nodesById = new Map([
      ["universe", { id: "universe", type: "root" }],
      ["characters", { id: "characters", type: "hub" }],
    ]);
    
    const edge = {
      id: "edge-universe-characters",
      source: "universe",
      target: "characters",
      type: "structural",
    };
    
    const result = validator.validateEdge(edge, nodesById);
    
    expect(result.valid).toBe(true);
  });
});
