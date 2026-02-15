/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CATALOG REGISTRY TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.0b: CatalogRegistry
 * 
 * Тесты реестра каталогов для Epistemic Operators.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CatalogRegistry } from "../CatalogRegistry.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const vstCatalog = {
  id: "vst",
  schema: {
    name: "string",
    manufacturer: "string",
    year: "number",
    genre: "string[]",
    tags: "string[]",
  },
  entries: [
    { id: "serum", name: "Serum", manufacturer: "Xfer", year: 2014, genre: ["edm", "bass"], tags: ["wavetable", "synth"] },
    { id: "massive", name: "Massive X", manufacturer: "NI", year: 2019, genre: ["techno", "dnb"], tags: ["wavetable", "synth"] },
    { id: "vital", name: "Vital", manufacturer: "Matt Tytel", year: 2020, genre: ["any"], tags: ["wavetable", "free"] },
  ],
};

const toolsCatalog = {
  id: "tools",
  entries: [
    { id: "vscode", name: "VS Code", type: "ide", tags: ["editor", "free"] },
    { id: "cursor", name: "Cursor", type: "ide", tags: ["editor", "ai"] },
    { id: "git", name: "Git", type: "vcs", tags: ["vcs", "free"] },
  ],
};

const validCatalogs = {
  vst: vstCatalog,
  tools: toolsCatalog,
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════════════

describe("CatalogRegistry", () => {
  describe("constructor", () => {
    it("should create empty registry", () => {
      const registry = new CatalogRegistry();
      expect(registry.size).toBe(0);
    });
    
    it("should create registry from catalogs object", () => {
      const registry = new CatalogRegistry(validCatalogs);
      expect(registry.size).toBe(2);
    });
    
    it("should throw on invalid catalogs", () => {
      expect(() => new CatalogRegistry({
        broken: { entries: [] } // missing id
      })).toThrow();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("load", () => {
    it("should load single catalog", () => {
      const registry = new CatalogRegistry();
      registry.load("vst", vstCatalog);
      expect(registry.has("vst")).toBe(true);
    });
    
    it("should throw on invalid catalog", () => {
      const registry = new CatalogRegistry();
      expect(() => registry.load("broken", { entries: [] })).toThrow();
    });
    
    it("should be chainable", () => {
      const registry = new CatalogRegistry();
      const result = registry.load("vst", vstCatalog);
      expect(result).toBe(registry);
    });
  });
  
  describe("loadAll", () => {
    it("should load all catalogs", () => {
      const registry = new CatalogRegistry();
      registry.loadAll(validCatalogs);
      expect(registry.size).toBe(2);
    });
    
    it("should throw on invalid catalogs", () => {
      const registry = new CatalogRegistry();
      expect(() => registry.loadAll({
        broken: { entries: [] }
      })).toThrow();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("has", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should return true for existing catalog", () => {
      expect(registry.has("vst")).toBe(true);
    });
    
    it("should return false for non-existing catalog", () => {
      expect(registry.has("unknown")).toBe(false);
    });
  });
  
  describe("get", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should return catalog by id", () => {
      const catalog = registry.get("vst");
      expect(catalog).not.toBeNull();
      expect(catalog.id).toBe("vst");
    });
    
    it("should return null for non-existing catalog", () => {
      expect(registry.get("unknown")).toBeNull();
    });
  });
  
  describe("getEntries", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should return all entries", () => {
      const entries = registry.getEntries("vst");
      expect(entries).toHaveLength(3);
    });
    
    it("should return empty array for non-existing catalog", () => {
      expect(registry.getEntries("unknown")).toEqual([]);
    });
    
    it("should return copy of entries", () => {
      const entries1 = registry.getEntries("vst");
      const entries2 = registry.getEntries("vst");
      expect(entries1).not.toBe(entries2);
    });
  });
  
  describe("getEntry", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should return entry by id", () => {
      const entry = registry.getEntry("vst", "serum");
      expect(entry).not.toBeNull();
      expect(entry.name).toBe("Serum");
    });
    
    it("should return null for non-existing entry", () => {
      expect(registry.getEntry("vst", "unknown")).toBeNull();
    });
    
    it("should return null for non-existing catalog", () => {
      expect(registry.getEntry("unknown", "serum")).toBeNull();
    });
  });
  
  describe("getEntriesByIds", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should return entries by ids", () => {
      const entries = registry.getEntriesByIds("vst", ["serum", "vital"]);
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.id)).toEqual(["serum", "vital"]);
    });
    
    it("should skip non-existing ids", () => {
      const entries = registry.getEntriesByIds("vst", ["serum", "unknown"]);
      expect(entries).toHaveLength(1);
    });
    
    it("should return empty array for non-existing catalog", () => {
      expect(registry.getEntriesByIds("unknown", ["serum"])).toEqual([]);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("filter", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should filter by predicate", () => {
      const entries = registry.filter("vst", e => e.year >= 2019);
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.id)).toContain("massive");
      expect(entries.map(e => e.id)).toContain("vital");
    });
    
    it("should return empty array if no match", () => {
      const entries = registry.filter("vst", e => e.year > 2025);
      expect(entries).toEqual([]);
    });
    
    it("should return empty array for non-existing catalog", () => {
      const entries = registry.filter("unknown", e => true);
      expect(entries).toEqual([]);
    });
  });
  
  describe("filterByAttrs", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should filter by single attribute", () => {
      const entries = registry.filterByAttrs("vst", { manufacturer: "Xfer" });
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("serum");
    });
    
    it("should filter by multiple attributes", () => {
      const entries = registry.filterByAttrs("tools", { type: "ide" });
      expect(entries).toHaveLength(2);
    });
    
    it("should filter by array attribute (includes)", () => {
      const entries = registry.filterByAttrs("vst", { genre: "techno" });
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("massive");
    });
  });
  
  describe("filterByTags", () => {
    let registry;
    
    beforeEach(() => {
      registry = new CatalogRegistry(validCatalogs);
    });
    
    it("should filter by tags (any mode)", () => {
      const entries = registry.filterByTags("vst", ["free"]);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("vital");
    });
    
    it("should filter by tags (all mode)", () => {
      const entries = registry.filterByTags("vst", ["wavetable", "synth"], "all");
      expect(entries).toHaveLength(2); // serum, massive
    });
    
    it("should return empty if no tags match", () => {
      const entries = registry.filterByTags("vst", ["unknown"]);
      expect(entries).toEqual([]);
    });
    
    it("should handle entries without tags", () => {
      const registry2 = new CatalogRegistry({
        test: {
          id: "test",
          entries: [{ id: "1", name: "No tags" }]
        }
      });
      const entries = registry2.filterByTags("test", ["any"]);
      expect(entries).toEqual([]);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("getCatalogIds", () => {
    it("should return all catalog ids", () => {
      const registry = new CatalogRegistry(validCatalogs);
      const ids = registry.getCatalogIds();
      expect(ids).toContain("vst");
      expect(ids).toContain("tools");
    });
    
    it("should return empty array for empty registry", () => {
      const registry = new CatalogRegistry();
      expect(registry.getCatalogIds()).toEqual([]);
    });
  });
  
  describe("size", () => {
    it("should return number of catalogs", () => {
      const registry = new CatalogRegistry(validCatalogs);
      expect(registry.size).toBe(2);
    });
  });
  
  describe("getStats", () => {
    it("should return registry statistics", () => {
      const registry = new CatalogRegistry(validCatalogs);
      const stats = registry.getStats();
      
      expect(stats.catalogCount).toBe(2);
      expect(stats.totalEntries).toBe(6);
      expect(stats.catalogs.vst.entryCount).toBe(3);
      expect(stats.catalogs.vst.hasSchema).toBe(true);
      expect(stats.catalogs.tools.hasSchema).toBe(false);
    });
  });
  
  describe("clear", () => {
    it("should clear all catalogs", () => {
      const registry = new CatalogRegistry(validCatalogs);
      registry.clear();
      expect(registry.size).toBe(0);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATIC
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("fromObject", () => {
    it("should create registry from object", () => {
      const registry = CatalogRegistry.fromObject(validCatalogs);
      expect(registry.size).toBe(2);
    });
  });
});
