/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHEMA TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0b: Параллельный абстрактный слой
 * 
 * Тесты для Schema — абстрактной обёртки над данными схемы.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { Schema } from "../Schema.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const fullSchemaData = {
  version: "1.0.0",
  name: "test-world",
  description: "A test world",
  nodeTypes: [
    { id: "root", label: "Root", maxCount: 1 },
    { id: "container", label: "Container" },
    { id: "item", label: "Item", requiredFields: ["name"] },
  ],
  edgeTypes: [
    { id: "contains", label: "Contains", allowedSourceTypes: ["root", "container"], allowedTargetTypes: ["container", "item"] },
    { id: "references", label: "References" },
  ],
  constraints: {
    requireRootNode: true,
    allowCycles: false,
    maxDepth: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════════════

describe("Schema", () => {
  describe("constructor", () => {
    it("should create schema from data", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema).toBeInstanceOf(Schema);
    });
    
    it("should throw on null data", () => {
      expect(() => new Schema(null)).toThrow("Schema data is required");
    });
    
    it("should throw on undefined data", () => {
      expect(() => new Schema(undefined)).toThrow("Schema data is required");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("getters", () => {
    it("should return version", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.version).toBe("1.0.0");
    });
    
    it("should return default version if missing", () => {
      const schema = new Schema({ name: "test", nodeTypes: [], edgeTypes: [] });
      expect(schema.version).toBe("0.0.0");
    });
    
    it("should return name", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.name).toBe("test-world");
    });
    
    it("should return default name if missing", () => {
      const schema = new Schema({ version: "1.0", nodeTypes: [], edgeTypes: [] });
      expect(schema.name).toBe("unnamed");
    });
    
    it("should return description", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.description).toBe("A test world");
    });
    
    it("should return nodeTypes", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.nodeTypes).toHaveLength(3);
    });
    
    it("should return edgeTypes", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.edgeTypes).toHaveLength(2);
    });
    
    it("should return constraints", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.constraints).toBeDefined();
      expect(schema.constraints.requireRootNode).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NODE TYPE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("node type methods", () => {
    const schema = new Schema(fullSchemaData);
    
    describe("isValidNodeType", () => {
      it("should return true for valid type", () => {
        expect(schema.isValidNodeType("root")).toBe(true);
        expect(schema.isValidNodeType("container")).toBe(true);
        expect(schema.isValidNodeType("item")).toBe(true);
      });
      
      it("should return false for invalid type", () => {
        expect(schema.isValidNodeType("unknown")).toBe(false);
        expect(schema.isValidNodeType("")).toBe(false);
      });
    });
    
    describe("getNodeTypeDefinition", () => {
      it("should return definition for valid type", () => {
        const def = schema.getNodeTypeDefinition("root");
        expect(def).toBeDefined();
        expect(def.id).toBe("root");
        expect(def.label).toBe("Root");
        expect(def.maxCount).toBe(1);
      });
      
      it("should return null for invalid type", () => {
        expect(schema.getNodeTypeDefinition("unknown")).toBeNull();
      });
    });
    
    describe("getNodeTypeIds", () => {
      it("should return all node type ids", () => {
        const ids = schema.getNodeTypeIds();
        expect(ids).toContain("root");
        expect(ids).toContain("container");
        expect(ids).toContain("item");
        expect(ids).toHaveLength(3);
      });
    });
    
    describe("isNodeTypeLimitReached", () => {
      it("should return true when limit reached", () => {
        expect(schema.isNodeTypeLimitReached("root", 1)).toBe(true);
        expect(schema.isNodeTypeLimitReached("root", 2)).toBe(true);
      });
      
      it("should return false when under limit", () => {
        expect(schema.isNodeTypeLimitReached("root", 0)).toBe(false);
      });
      
      it("should return false for types without limit", () => {
        expect(schema.isNodeTypeLimitReached("container", 100)).toBe(false);
      });
      
      it("should return false for unknown types", () => {
        expect(schema.isNodeTypeLimitReached("unknown", 100)).toBe(false);
      });
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE TYPE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("edge type methods", () => {
    const schema = new Schema(fullSchemaData);
    
    describe("isValidEdgeType", () => {
      it("should return true for valid type", () => {
        expect(schema.isValidEdgeType("contains")).toBe(true);
        expect(schema.isValidEdgeType("references")).toBe(true);
      });
      
      it("should return false for invalid type", () => {
        expect(schema.isValidEdgeType("unknown")).toBe(false);
      });
    });
    
    describe("getEdgeTypeDefinition", () => {
      it("should return definition for valid type", () => {
        const def = schema.getEdgeTypeDefinition("contains");
        expect(def).toBeDefined();
        expect(def.id).toBe("contains");
        expect(def.allowedSourceTypes).toContain("root");
      });
      
      it("should return null for invalid type", () => {
        expect(schema.getEdgeTypeDefinition("unknown")).toBeNull();
      });
    });
    
    describe("getEdgeTypeIds", () => {
      it("should return all edge type ids", () => {
        const ids = schema.getEdgeTypeIds();
        expect(ids).toContain("contains");
        expect(ids).toContain("references");
        expect(ids).toHaveLength(2);
      });
    });
    
    describe("isEdgeAllowed", () => {
      it("should allow valid edge", () => {
        const result = schema.isEdgeAllowed("contains", "root", "container");
        expect(result.valid).toBe(true);
      });
      
      it("should reject invalid source type", () => {
        const result = schema.isEdgeAllowed("contains", "item", "container");
        expect(result.valid).toBe(false);
        expect(result.reason).toContain("source type");
      });
      
      it("should reject invalid target type", () => {
        const result = schema.isEdgeAllowed("contains", "root", "root");
        expect(result.valid).toBe(false);
        expect(result.reason).toContain("target type");
      });
      
      it("should allow any types for edges without restrictions", () => {
        const result = schema.isEdgeAllowed("references", "item", "item");
        expect(result.valid).toBe(true);
      });
      
      it("should reject unknown edge type", () => {
        const result = schema.isEdgeAllowed("unknown", "root", "item");
        expect(result.valid).toBe(false);
        expect(result.reason).toContain("Unknown edge type");
      });
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRAINTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("constraints", () => {
    it("should return requiresRootNode", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.requiresRootNode()).toBe(true);
    });
    
    it("should return false for requiresRootNode if not set", () => {
      const schema = new Schema({ version: "1.0", name: "test", nodeTypes: [], edgeTypes: [] });
      expect(schema.requiresRootNode()).toBe(false);
    });
    
    it("should return allowsCycles", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.allowsCycles()).toBe(false);
    });
    
    it("should return true for allowsCycles if not set", () => {
      const schema = new Schema({ version: "1.0", name: "test", nodeTypes: [], edgeTypes: [] });
      expect(schema.allowsCycles()).toBe(true);
    });
    
    it("should return maxDepth", () => {
      const schema = new Schema(fullSchemaData);
      expect(schema.getMaxDepth()).toBe(5);
    });
    
    it("should return null for maxDepth if not set", () => {
      const schema = new Schema({ version: "1.0", name: "test", nodeTypes: [], edgeTypes: [] });
      expect(schema.getMaxDepth()).toBeNull();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("validateNode", () => {
    const schema = new Schema(fullSchemaData);
    
    it("should validate correct node", () => {
      const result = schema.validateNode({ id: "1", type: "root" });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should reject null node", () => {
      const result = schema.validateNode(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Node is required");
    });
    
    it("should reject node without id", () => {
      const result = schema.validateNode({ type: "root" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("id"))).toBe(true);
    });
    
    it("should reject node without type", () => {
      const result = schema.validateNode({ id: "1" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("type"))).toBe(true);
    });
    
    it("should reject node with invalid type", () => {
      const result = schema.validateNode({ id: "1", type: "unknown" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid node type"))).toBe(true);
    });
    
    it("should check required fields", () => {
      const result = schema.validateNode({ id: "1", type: "item" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("requires field"))).toBe(true);
    });
    
    it("should accept node with required fields", () => {
      const result = schema.validateNode({ id: "1", type: "item", name: "Test" });
      expect(result.valid).toBe(true);
    });
    
    it("should accept node with required fields in data", () => {
      const result = schema.validateNode({ id: "1", type: "item", data: { name: "Test" } });
      expect(result.valid).toBe(true);
    });
  });
  
  describe("validateEdge", () => {
    const schema = new Schema(fullSchemaData);
    
    it("should validate correct edge", () => {
      const result = schema.validateEdge({ source: "1", target: "2", type: "contains" });
      expect(result.valid).toBe(true);
    });
    
    it("should reject null edge", () => {
      const result = schema.validateEdge(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Edge is required");
    });
    
    it("should reject edge without source", () => {
      const result = schema.validateEdge({ target: "2", type: "contains" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("source"))).toBe(true);
    });
    
    it("should reject edge without target", () => {
      const result = schema.validateEdge({ source: "1", type: "contains" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("target"))).toBe(true);
    });
    
    it("should reject edge without type", () => {
      const result = schema.validateEdge({ source: "1", target: "2" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("type"))).toBe(true);
    });
    
    it("should reject edge with invalid type", () => {
      const result = schema.validateEdge({ source: "1", target: "2", type: "unknown" });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid edge type"))).toBe(true);
    });
    
    it("should check edge compatibility with getNodeType", () => {
      const getNodeType = (id) => {
        if (id === "1") return "item"; // Invalid source for "contains"
        if (id === "2") return "container";
        return null;
      };
      
      const result = schema.validateEdge(
        { source: "1", target: "2", type: "contains" },
        getNodeType
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("source type"))).toBe(true);
    });
    
    it("should pass edge compatibility check for valid types", () => {
      const getNodeType = (id) => {
        if (id === "1") return "root";
        if (id === "2") return "container";
        return null;
      };
      
      const result = schema.validateEdge(
        { source: "1", target: "2", type: "contains" },
        getNodeType
      );
      expect(result.valid).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("serialization", () => {
    it("should serialize to JSON", () => {
      const schema = new Schema(fullSchemaData);
      const json = schema.toJSON();
      expect(json.version).toBe("1.0.0");
      expect(json.name).toBe("test-world");
      expect(json.nodeTypes).toHaveLength(3);
    });
    
    it("should create from JSON", () => {
      const schema = Schema.fromJSON(fullSchemaData);
      expect(schema.name).toBe("test-world");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FACTORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("factory methods", () => {
    it("should create empty schema", () => {
      const schema = Schema.empty("my-empty");
      expect(schema.name).toBe("my-empty");
      expect(schema.nodeTypes).toHaveLength(0);
      expect(schema.edgeTypes).toHaveLength(0);
    });
    
    it("should create minimal schema", () => {
      const schema = Schema.minimal("my-minimal");
      expect(schema.name).toBe("my-minimal");
      expect(schema.nodeTypes).toHaveLength(1);
      expect(schema.edgeTypes).toHaveLength(1);
      expect(schema.isValidNodeType("node")).toBe(true);
      expect(schema.isValidEdgeType("edge")).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Contract Enforcement", () => {
    it("Schema should work with ANY custom types", () => {
      const customSchema = new Schema({
        version: "1.0.0",
        name: "space-world",
        nodeTypes: [
          { id: "galaxy", label: "Galaxy" },
          { id: "star", label: "Star" },
          { id: "planet", label: "Planet" },
          { id: "moon", label: "Moon" },
        ],
        edgeTypes: [
          { id: "orbits", label: "Orbits", allowedSourceTypes: ["planet", "moon"], allowedTargetTypes: ["star", "planet"] },
          { id: "contains", label: "Contains", allowedSourceTypes: ["galaxy"], allowedTargetTypes: ["star"] },
        ],
      });
      
      // Schema works without knowing what "galaxy" or "planet" means
      expect(customSchema.isValidNodeType("galaxy")).toBe(true);
      expect(customSchema.isValidNodeType("character")).toBe(false);
      
      // Edge validation works with custom types
      expect(customSchema.isEdgeAllowed("orbits", "planet", "star").valid).toBe(true);
      expect(customSchema.isEdgeAllowed("orbits", "galaxy", "star").valid).toBe(false);
      
      // Node validation works
      const result = customSchema.validateNode({ id: "earth", type: "planet" });
      expect(result.valid).toBe(true);
    });
    
    it("Schema should NOT contain hardcoded types", () => {
      // This test ensures Schema class has no knowledge of specific types
      const schemaSource = Schema.toString();
      
      // These strings should NOT appear in Schema source code
      expect(schemaSource).not.toContain('"character"');
      expect(schemaSource).not.toContain('"domain"');
      expect(schemaSource).not.toContain('"hub"');
      expect(schemaSource).not.toContain("'character'");
      expect(schemaSource).not.toContain("'domain'");
      expect(schemaSource).not.toContain("'hub'");
    });
  });
});
