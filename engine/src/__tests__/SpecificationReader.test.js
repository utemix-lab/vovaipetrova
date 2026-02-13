/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SPECIFICATION READER — Тесты
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SpecificationReader } from "../SpecificationReader.js";

describe("SpecificationReader", () => {
  let reader;
  
  beforeEach(() => {
    reader = SpecificationReader.load();
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATIC FACTORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Static Factory", () => {
    it("load() creates reader with default spec", () => {
      const r = SpecificationReader.load();
      expect(r).toBeInstanceOf(SpecificationReader);
      expect(r.getVersion()).toBe("0.5.0");
    });
    
    it("fromJSON() creates reader from custom spec", () => {
      const customSpec = {
        engine: {
          version: "1.0.0",
          description: "Custom",
          contracts: {},
          capabilities: { multi_world: true, schema_validation: true, graph_validation: true, world_injection: true },
          tracks: {},
          constraints: {},
          implementation_map: {},
        },
      };
      const r = SpecificationReader.fromJSON(customSpec);
      expect(r.getVersion()).toBe("1.0.0");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Getters", () => {
    it("getVersion() returns engine version", () => {
      expect(reader.getVersion()).toBe("0.5.0");
    });
    
    it("getDescription() returns engine description", () => {
      expect(reader.getDescription()).toContain("MeaningEngine");
    });
    
    it("getSpecification() returns full spec", () => {
      const spec = reader.getSpecification();
      expect(spec).toHaveProperty("engine");
      expect(spec.engine).toHaveProperty("version");
    });
    
    it("getSchema() returns JSON Schema", () => {
      const schema = reader.getSchema();
      expect(schema).toHaveProperty("$schema");
      expect(schema).toHaveProperty("title");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Contracts", () => {
    it("getContractNames() returns list of contracts", () => {
      const names = reader.getContractNames();
      expect(names).toContain("MeaningEngine");
      expect(names).toContain("WorldInterface");
      expect(names).toContain("Schema");
    });
    
    it("getContract() returns contract by name", () => {
      const contract = reader.getContract("MeaningEngine");
      expect(contract).toHaveProperty("description");
      expect(contract).toHaveProperty("methods");
    });
    
    it("getContract() returns null for unknown contract", () => {
      expect(reader.getContract("Unknown")).toBeNull();
    });
    
    it("getMethodNames() returns list of methods", () => {
      const methods = reader.getMethodNames("MeaningEngine");
      expect(methods).toContain("getVersion");
      expect(methods).toContain("getSchema");
      expect(methods).toContain("validateNode");
    });
    
    it("getMethodNames() returns empty array for unknown contract", () => {
      expect(reader.getMethodNames("Unknown")).toEqual([]);
    });
    
    it("getMethod() returns method details", () => {
      const method = reader.getMethod("MeaningEngine", "getVersion");
      expect(method).toHaveProperty("description");
      expect(method).toHaveProperty("inputs");
      expect(method).toHaveProperty("outputs");
      expect(method).toHaveProperty("implementation");
    });
    
    it("getMethod() returns null for unknown method", () => {
      expect(reader.getMethod("MeaningEngine", "unknownMethod")).toBeNull();
    });
    
    it("getImplementation() returns implementation path", () => {
      const impl = reader.getImplementation("MeaningEngine", "getVersion");
      expect(impl).toContain("engine/src/index.js");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Capabilities", () => {
    it("getCapabilities() returns all capabilities", () => {
      const caps = reader.getCapabilities();
      expect(caps).toHaveProperty("multi_world");
      expect(caps).toHaveProperty("schema_validation");
    });
    
    it("hasCapability() returns true for active capability", () => {
      expect(reader.hasCapability("multi_world")).toBe(true);
      expect(reader.hasCapability("schema_validation")).toBe(true);
    });
    
    it("hasCapability() returns false for inactive capability", () => {
      expect(reader.hasCapability("RAG")).toBe(false);
      expect(reader.hasCapability("operators")).toBe(false);
    });
    
    it("hasCapability() returns false for unknown capability", () => {
      expect(reader.hasCapability("unknown")).toBe(false);
    });
    
    it("getActiveCapabilities() returns only active capabilities", () => {
      const active = reader.getActiveCapabilities();
      expect(active).toContain("multi_world");
      expect(active).not.toContain("RAG");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRAINTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Constraints", () => {
    it("getConstraints() returns all constraints", () => {
      const constraints = reader.getConstraints();
      expect(constraints).toHaveProperty("GraphInvariance");
      expect(constraints).toHaveProperty("WorldAgnostic");
    });
    
    it("getConstraint() returns constraint by name", () => {
      const constraint = reader.getConstraint("GraphInvariance");
      expect(constraint).toHaveProperty("description");
      expect(constraint).toHaveProperty("enforced");
    });
    
    it("getConstraint() returns null for unknown constraint", () => {
      expect(reader.getConstraint("Unknown")).toBeNull();
    });
    
    it("isConstraintEnforced() returns true for enforced constraint", () => {
      expect(reader.isConstraintEnforced("GraphInvariance")).toBe(true);
      expect(reader.isConstraintEnforced("WorldAgnostic")).toBe(true);
    });
    
    it("isConstraintEnforced() returns false for unknown constraint", () => {
      expect(reader.isConstraintEnforced("Unknown")).toBe(false);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTATION MAP
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Implementation Map", () => {
    it("getImplementationMap() returns full map", () => {
      const map = reader.getImplementationMap();
      expect(map).toHaveProperty("MeaningEngine.getVersion");
      expect(map).toHaveProperty("WorldInterface.getSchema");
    });
    
    it("findImplementation() returns implementation path", () => {
      const impl = reader.findImplementation("MeaningEngine.getVersion");
      expect(impl).toContain("engine/src/index.js");
    });
    
    it("findImplementation() returns null for unknown key", () => {
      expect(reader.findImplementation("Unknown.method")).toBeNull();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Validation", () => {
    it("validate() returns valid for correct spec", () => {
      const result = reader.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it("validate() returns errors for invalid spec", () => {
      const invalidSpec = { engine: {} };
      const r = SpecificationReader.fromJSON(invalidSpec);
      const result = r.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it("validate() catches missing engine", () => {
      const r = SpecificationReader.fromJSON({});
      const result = r.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("engine is required and must be an object");
    });
    
    it("validate() catches missing required fields", () => {
      const r = SpecificationReader.fromJSON({ engine: { version: "1.0.0" } });
      const result = r.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("description"))).toBe(true);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Query", () => {
    it("query() returns value by path", () => {
      expect(reader.query("version")).toBe("0.5.0");
    });
    
    it("query() returns nested value", () => {
      const method = reader.query("contracts.MeaningEngine.methods.getVersion");
      expect(method).toHaveProperty("description");
    });
    
    it("query() returns null for unknown path", () => {
      expect(reader.query("unknown.path")).toBeNull();
    });
    
    it("query() returns null for deep unknown path", () => {
      expect(reader.query("contracts.Unknown.methods.test")).toBeNull();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("Projections", () => {
    it("toLLMContext() returns compact context", () => {
      const ctx = reader.toLLMContext();
      expect(ctx).toHaveProperty("engine_version");
      expect(ctx).toHaveProperty("contracts");
      expect(ctx).toHaveProperty("capabilities");
      expect(ctx).toHaveProperty("constraints");
      expect(Array.isArray(ctx.contracts)).toBe(true);
    });
    
    it("toLLMContext() contracts have name and methods", () => {
      const ctx = reader.toLLMContext();
      const engine = ctx.contracts.find(c => c.name === "MeaningEngine");
      expect(engine).toBeDefined();
      expect(engine.methods).toContain("getVersion");
    });
    
    it("toMarkdownTable() returns markdown table", () => {
      const md = reader.toMarkdownTable();
      expect(md).toContain("| Contract | Method |");
      expect(md).toContain("MeaningEngine");
      expect(md).toContain("getVersion");
    });
    
    it("getStats() returns statistics", () => {
      const stats = reader.getStats();
      expect(stats).toHaveProperty("version");
      expect(stats).toHaveProperty("contracts");
      expect(stats).toHaveProperty("methods");
      expect(stats).toHaveProperty("capabilities");
      expect(stats).toHaveProperty("constraints");
      expect(stats.contracts).toBeGreaterThan(0);
      expect(stats.methods).toBeGreaterThan(0);
    });
  });
});
