/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPERATOR ENGINE TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.0c: OperatorEngine
 * 
 * Тесты эпистемических операторов.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OperatorEngine } from "../OperatorEngine.js";
import { CatalogRegistry } from "../CatalogRegistry.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const vstCatalog = {
  id: "vst",
  entries: [
    { id: "serum", name: "Serum", year: 2014, tags: ["wavetable", "synth", "edm"] },
    { id: "massive", name: "Massive X", year: 2019, tags: ["wavetable", "synth", "techno"] },
    { id: "vital", name: "Vital", year: 2020, tags: ["wavetable", "free"] },
    { id: "kontakt", name: "Kontakt", year: 2002, tags: ["sampler"] },
  ],
};

const aiCatalog = {
  id: "ai",
  entries: [
    { id: "wav2lip", name: "Wav2Lip", tags: ["lipsync", "audio2video"] },
    { id: "sadtalker", name: "SadTalker", tags: ["lipsync", "portrait"] },
    { id: "stable-diffusion", name: "Stable Diffusion", tags: ["image", "generation"] },
  ],
};

const catalogs = {
  vst: vstCatalog,
  ai: aiCatalog,
};

const createGraph = () => ({
  nodes: [
    { 
      id: "musician", 
      type: "character", 
      catalogRefs: { vst: ["serum", "massive"] },
      tags: ["synth"],
    },
    { 
      id: "animator", 
      type: "character", 
      pointerTags: ["cap:lipsync"],
    },
    { 
      id: "developer", 
      type: "character",
    },
    { 
      id: "hub-music", 
      type: "hub",
    },
  ],
  edges: [
    { source: "hub-music", target: "musician", type: "contains" },
    { source: "musician", target: "animator", type: "collaborates" },
  ],
  getNodes() { return this.nodes; },
  getEdges() { return this.edges; },
  getNodeById(id) { return this.nodes.find(n => n.id === id) || null; },
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════════════

describe("OperatorEngine", () => {
  describe("constructor", () => {
    it("should create engine with graph and catalogs", () => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      const engine = new OperatorEngine(graph, registry);
      
      expect(engine).toBeDefined();
    });
    
    it("should throw without graph", () => {
      const registry = new CatalogRegistry(catalogs);
      expect(() => new OperatorEngine(null, registry)).toThrow("requires a graph");
    });
    
    it("should throw without catalog registry", () => {
      const graph = createGraph();
      expect(() => new OperatorEngine(graph, null)).toThrow("requires a CatalogRegistry");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("project", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should project by catalogRefs", () => {
      const entries = engine.project("musician", "vst", { useTags: false });
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.id)).toContain("serum");
      expect(entries.map(e => e.id)).toContain("massive");
    });
    
    it("should project by tags", () => {
      const entries = engine.project("musician", "vst", { useRefs: false });
      expect(entries.length).toBeGreaterThan(0);
      // "synth" tag matches serum, massive
      expect(entries.some(e => e.tags.includes("synth"))).toBe(true);
    });
    
    it("should project by both refs and tags", () => {
      const entries = engine.project("musician", "vst");
      // Should include refs (serum, massive) and tag matches
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });
    
    it("should project by pointer-tags (cap:X)", () => {
      const entries = engine.project("animator", "ai");
      // animator has cap:lipsync → should match lipsync entries
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.some(e => e.tags.includes("lipsync"))).toBe(true);
    });
    
    it("should return empty for non-existing node", () => {
      const entries = engine.project("unknown", "vst");
      expect(entries).toEqual([]);
    });
    
    it("should return empty for non-existing catalog", () => {
      const entries = engine.project("musician", "unknown");
      expect(entries).toEqual([]);
    });
    
    it("should return empty for node without refs or tags", () => {
      const entries = engine.project("developer", "vst");
      expect(entries).toEqual([]);
    });
    
    it("should not duplicate entries", () => {
      // If entry matches both refs and tags, it should appear once
      const entries = engine.project("musician", "vst");
      const ids = entries.map(e => e.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("filter", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should filter by predicate function", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, e => e.year >= 2019);
      expect(filtered).toHaveLength(2);
    });
    
    it("should filter by attribute object", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: 2020 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("vital");
    });
    
    it("should filter by $gt operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $gt: 2018 } });
      expect(filtered).toHaveLength(2);
    });
    
    it("should filter by $gte operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $gte: 2019 } });
      expect(filtered).toHaveLength(2);
    });
    
    it("should filter by $lt operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $lt: 2010 } });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("kontakt");
    });
    
    it("should filter by $lte operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $lte: 2014 } });
      expect(filtered).toHaveLength(2);
    });
    
    it("should filter by $ne operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $ne: 2020 } });
      expect(filtered).toHaveLength(3);
    });
    
    it("should filter by $in operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $in: [2014, 2020] } });
      expect(filtered).toHaveLength(2);
    });
    
    it("should filter by $nin operator", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { year: { $nin: [2014, 2020] } });
      expect(filtered).toHaveLength(2);
    });
    
    it("should filter by $contains operator (array attribute)", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { tags: { $contains: "free" } });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("vital");
    });
    
    it("should filter by array attribute (includes)", () => {
      const entries = vstCatalog.entries;
      const filtered = engine.filter(entries, { tags: "synth" });
      expect(filtered).toHaveLength(2);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPAND
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("expand", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should expand to depth 1", () => {
      const expanded = engine.expand("musician", 1);
      expect(expanded).toContain("hub-music");
      expect(expanded).toContain("animator");
      expect(expanded).not.toContain("musician"); // source not included
    });
    
    it("should expand to depth 2", () => {
      const expanded = engine.expand("hub-music", 2);
      expect(expanded).toContain("musician");
      expect(expanded).toContain("animator"); // depth 2
    });
    
    it("should return empty for depth 0", () => {
      const expanded = engine.expand("musician", 0);
      expect(expanded).toEqual([]);
    });
    
    it("should return empty for non-existing node", () => {
      const expanded = engine.expand("unknown", 1);
      expect(expanded).toEqual([]);
    });
    
    it("should not include duplicates", () => {
      const expanded = engine.expand("musician", 2);
      const unique = [...new Set(expanded)];
      expect(expanded.length).toBe(unique.length);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTERSECT
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("intersect", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should return intersection", () => {
      const entries1 = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const entries2 = [{ id: "b" }, { id: "c" }, { id: "d" }];
      const result = engine.intersect(entries1, entries2);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toContain("b");
      expect(result.map(e => e.id)).toContain("c");
    });
    
    it("should return empty for no intersection", () => {
      const entries1 = [{ id: "a" }];
      const entries2 = [{ id: "b" }];
      const result = engine.intersect(entries1, entries2);
      expect(result).toEqual([]);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UNION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("union", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should return union without duplicates", () => {
      const entries1 = [{ id: "a" }, { id: "b" }];
      const entries2 = [{ id: "b" }, { id: "c" }];
      const result = engine.union(entries1, entries2);
      expect(result).toHaveLength(3);
    });
    
    it("should preserve order (first set first)", () => {
      const entries1 = [{ id: "a" }];
      const entries2 = [{ id: "b" }];
      const result = engine.union(entries1, entries2);
      expect(result[0].id).toBe("a");
      expect(result[1].id).toBe("b");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPOSE
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("projectAndFilter", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should project and filter in one call", () => {
      const entries = engine.projectAndFilter("musician", "vst", { year: { $gte: 2019 } });
      // musician refs: serum (2014), massive (2019)
      // filter: year >= 2019 → massive
      expect(entries.some(e => e.id === "massive")).toBe(true);
      expect(entries.every(e => e.year >= 2019)).toBe(true);
    });
  });
  
  describe("projectMultiple", () => {
    let engine;
    
    beforeEach(() => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      engine = new OperatorEngine(graph, registry);
    });
    
    it("should project through multiple nodes", () => {
      const entries = engine.projectMultiple(["musician", "animator"], "ai");
      // musician has no AI refs, animator has cap:lipsync
      expect(entries.length).toBeGreaterThan(0);
    });
    
    it("should not duplicate entries", () => {
      const entries = engine.projectMultiple(["musician", "musician"], "vst");
      const ids = entries.map(e => e.id);
      const unique = [...new Set(ids)];
      expect(ids.length).toBe(unique.length);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("getStats", () => {
    it("should return engine statistics", () => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      const engine = new OperatorEngine(graph, registry);
      
      const stats = engine.getStats();
      expect(stats.graphNodes).toBe(4);
      expect(stats.graphEdges).toBe(2);
      expect(stats.catalogs.catalogCount).toBe(2);
    });
  });
  
  describe("getCatalogs", () => {
    it("should return catalog registry", () => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      const engine = new OperatorEngine(graph, registry);
      
      expect(engine.getCatalogs()).toBe(registry);
    });
  });
  
  describe("getGraph", () => {
    it("should return graph", () => {
      const graph = createGraph();
      const registry = new CatalogRegistry(catalogs);
      const engine = new OperatorEngine(graph, registry);
      
      expect(engine.getGraph()).toBe(graph);
    });
  });
});
