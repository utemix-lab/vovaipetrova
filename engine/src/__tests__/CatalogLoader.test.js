/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CATALOG LOADER TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.1b: CatalogLoader
 * 
 * Тесты загрузчика каталогов.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import { CatalogLoader } from "../CatalogLoader.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const inlineCatalog = {
  id: "tools",
  entries: [
    { id: "vscode", name: "VS Code" },
    { id: "cursor", name: "Cursor" },
  ],
};

const inlineRegistry = {
  tools: inlineCatalog,
};

const registryWithVersion = {
  version: "1.0.0",
  description: "Test catalogs",
  catalogs: {
    tools: inlineCatalog,
  },
};

const referenceRegistry = {
  catalogs: {
    tools: "./catalogs/tools.json",
    ai: "./catalogs/ai.json",
  },
};

const mixedRegistry = {
  catalogs: {
    tools: inlineCatalog,
    ai: "./catalogs/ai.json",
  },
};

const mockFiles = {
  "base/catalogs/tools.json": { id: "tools", entries: [{ id: "vscode" }] },
  "base/catalogs/ai.json": { id: "ai", entries: [{ id: "claude" }] },
};

const mockLoadFile = (path) => mockFiles[path] || null;

// ═══════════════════════════════════════════════════════════════════════════
// LOAD
// ═══════════════════════════════════════════════════════════════════════════

describe("CatalogLoader", () => {
  describe("load", () => {
    it("should load inline catalogs", () => {
      const catalogs = CatalogLoader.load(inlineRegistry);
      expect(catalogs.tools).toBeDefined();
      expect(catalogs.tools.id).toBe("tools");
    });
    
    it("should load from registry with catalogs field", () => {
      const catalogs = CatalogLoader.load(registryWithVersion);
      expect(catalogs.tools).toBeDefined();
    });
    
    it("should skip version and description fields", () => {
      const catalogs = CatalogLoader.load(registryWithVersion);
      expect(catalogs.version).toBeUndefined();
      expect(catalogs.description).toBeUndefined();
    });
    
    it("should load referenced files with loadFile", () => {
      const catalogs = CatalogLoader.load(referenceRegistry, {
        loadFile: mockLoadFile,
        basePath: "base",
      });
      expect(catalogs.tools).toBeDefined();
      expect(catalogs.ai).toBeDefined();
    });
    
    it("should skip references without loadFile", () => {
      const catalogs = CatalogLoader.load(referenceRegistry);
      expect(catalogs.tools).toBeUndefined();
      expect(catalogs.ai).toBeUndefined();
    });
    
    it("should handle mixed inline and references", () => {
      const catalogs = CatalogLoader.load(mixedRegistry, {
        loadFile: mockLoadFile,
        basePath: "base",
      });
      expect(catalogs.tools).toBeDefined();
      expect(catalogs.tools.entries).toHaveLength(2); // inline
      expect(catalogs.ai).toBeDefined();
      expect(catalogs.ai.entries).toHaveLength(1); // from file
    });
    
    it("should return empty object for null registry", () => {
      expect(CatalogLoader.load(null)).toEqual({});
    });
    
    it("should return empty object for non-object registry", () => {
      expect(CatalogLoader.load("string")).toEqual({});
    });
    
    it("should skip fields starting with $", () => {
      const registry = {
        $schema: "schema.json",
        tools: inlineCatalog,
      };
      const catalogs = CatalogLoader.load(registry);
      expect(catalogs.$schema).toBeUndefined();
      expect(catalogs.tools).toBeDefined();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD ASYNC
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("loadAsync", () => {
    const mockLoadFileAsync = async (path) => mockFiles[path] || null;
    
    it("should load inline catalogs", async () => {
      const catalogs = await CatalogLoader.loadAsync(inlineRegistry);
      expect(catalogs.tools).toBeDefined();
    });
    
    it("should load referenced files with loadFileAsync", async () => {
      const catalogs = await CatalogLoader.loadAsync(referenceRegistry, {
        loadFileAsync: mockLoadFileAsync,
        basePath: "base",
      });
      expect(catalogs.tools).toBeDefined();
      expect(catalogs.ai).toBeDefined();
    });
    
    it("should handle errors gracefully", async () => {
      const failingLoader = async () => { throw new Error("fail"); };
      const catalogs = await CatalogLoader.loadAsync(referenceRegistry, {
        loadFileAsync: failingLoader,
      });
      // Should not throw, just skip failed catalogs
      expect(catalogs.tools).toBeUndefined();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RESOLVE PATH
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("resolvePath", () => {
    it("should resolve relative path with basePath", () => {
      const result = CatalogLoader.resolvePath("./catalogs/tools.json", "/world");
      expect(result).toBe("/world/catalogs/tools.json");
    });
    
    it("should handle relative path without ./", () => {
      const result = CatalogLoader.resolvePath("catalogs/tools.json", "/world");
      expect(result).toBe("/world/catalogs/tools.json");
    });
    
    it("should return relative path if no basePath", () => {
      const result = CatalogLoader.resolvePath("./catalogs/tools.json", "");
      expect(result).toBe("catalogs/tools.json");
    });
    
    it("should return absolute path as-is", () => {
      const result = CatalogLoader.resolvePath("/absolute/path.json", "/world");
      expect(result).toBe("/absolute/path.json");
    });
    
    it("should handle Windows absolute paths", () => {
      const result = CatalogLoader.resolvePath("C:/path/file.json", "/world");
      expect(result).toBe("C:/path/file.json");
    });
    
    it("should handle empty relativePath", () => {
      expect(CatalogLoader.resolvePath("", "/world")).toBe("");
    });
    
    it("should remove trailing slash from basePath", () => {
      const result = CatalogLoader.resolvePath("file.json", "/world/");
      expect(result).toBe("/world/file.json");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("validate", () => {
    it("should validate correct catalogs", () => {
      const result = CatalogLoader.validate({ tools: inlineCatalog });
      expect(result.valid).toBe(true);
    });
    
    it("should reject invalid catalogs", () => {
      const result = CatalogLoader.validate({ broken: { entries: [] } });
      expect(result.valid).toBe(false);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD AND VALIDATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("loadAndValidate", () => {
    it("should load and return valid catalogs", () => {
      const catalogs = CatalogLoader.loadAndValidate(inlineRegistry);
      expect(catalogs.tools).toBeDefined();
    });
    
    it("should throw on invalid catalogs", () => {
      const invalidRegistry = {
        broken: { entries: [] }, // missing id
      };
      expect(() => CatalogLoader.loadAndValidate(invalidRegistry)).toThrow("Invalid catalogs");
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOADER FACTORIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe("createNodeLoader", () => {
    it("should create a loader function", () => {
      const mockFs = {
        readFileSync: (path) => JSON.stringify({ id: "test", entries: [] }),
      };
      const loader = CatalogLoader.createNodeLoader(mockFs);
      const result = loader("test.json");
      expect(result.id).toBe("test");
    });
    
    it("should return null on error", () => {
      const mockFs = {
        readFileSync: () => { throw new Error("not found"); },
      };
      const loader = CatalogLoader.createNodeLoader(mockFs);
      expect(loader("test.json")).toBeNull();
    });
  });
  
  describe("createNodeLoaderAsync", () => {
    it("should create an async loader function", async () => {
      const mockFsPromises = {
        readFile: async () => JSON.stringify({ id: "test", entries: [] }),
      };
      const loader = CatalogLoader.createNodeLoaderAsync(mockFsPromises);
      const result = await loader("test.json");
      expect(result.id).toBe("test");
    });
    
    it("should return null on error", async () => {
      const mockFsPromises = {
        readFile: async () => { throw new Error("not found"); },
      };
      const loader = CatalogLoader.createNodeLoaderAsync(mockFsPromises);
      expect(await loader("test.json")).toBeNull();
    });
  });
  
  describe("createFetchLoader", () => {
    it("should create a fetch loader function", () => {
      const loader = CatalogLoader.createFetchLoader();
      expect(typeof loader).toBe("function");
    });
  });
});
