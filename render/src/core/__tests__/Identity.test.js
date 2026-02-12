/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IDENTITY TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.5a: Identity & Naming Formalization
 * Цель: Формализовать идентичность сущностей
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  createIdentity,
  getDisplayName,
  generateSlug,
  validateIdImmutability,
  updateCanonicalName,
  addAlias,
  matchesName,
  extractIdentityFromNode,
  serializeIdentity
} from "../Identity.js";

describe("Identity", () => {
  describe("createIdentity", () => {
    it("creates identity with required fields", () => {
      const identity = createIdentity("vova", "Vova");
      
      expect(identity.id).toBe("vova");
      expect(identity.canonicalName).toBe("Vova");
      expect(identity.aliases).toEqual([]);
      expect(identity.meta).toEqual({});
    });
    
    it("creates identity with aliases", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["Vladimir", "ru:Вова"]
      });
      
      expect(identity.aliases).toContain("Vladimir");
      expect(identity.aliases).toContain("ru:Вова");
    });
    
    it("creates identity with meta", () => {
      const identity = createIdentity("vova", "Vova", {
        meta: { lang: "ru", script: "Cyrl", originalName: "Вова" }
      });
      
      expect(identity.meta.lang).toBe("ru");
      expect(identity.meta.script).toBe("Cyrl");
      expect(identity.meta.originalName).toBe("Вова");
    });
    
    it("throws if id is missing", () => {
      expect(() => createIdentity(null, "Vova")).toThrow();
      expect(() => createIdentity("", "Vova")).toThrow();
    });
    
    it("throws if canonicalName is missing", () => {
      expect(() => createIdentity("vova", null)).toThrow();
      expect(() => createIdentity("vova", "")).toThrow();
    });
  });
  
  describe("getDisplayName", () => {
    it("returns canonicalName by default", () => {
      const identity = createIdentity("vova", "Vova");
      const display = getDisplayName(identity);
      
      expect(display.name).toBe("Vova");
    });
    
    it("returns originalName when locale matches meta.lang", () => {
      const identity = createIdentity("vova", "Vova", {
        meta: { lang: "ru", script: "Cyrl", originalName: "Вова" }
      });
      const display = getDisplayName(identity, "ru");
      
      expect(display.name).toBe("Вова");
      expect(display.isOriginal).toBe(true);
    });
    
    it("returns localized alias when available", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["ru:Вова", "ja:ヴォヴァ"]
      });
      
      const displayRu = getDisplayName(identity, "ru");
      expect(displayRu.name).toBe("Вова");
      
      const displayJa = getDisplayName(identity, "ja");
      expect(displayJa.name).toBe("ヴォヴァ");
    });
    
    it("falls back to canonicalName for unknown locale", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["ru:Вова"]
      });
      const display = getDisplayName(identity, "de");
      
      expect(display.name).toBe("Vova");
    });
  });
  
  describe("generateSlug", () => {
    it("generates lowercase slug", () => {
      const identity = createIdentity("vova", "Vova Petrova");
      const slug = generateSlug(identity);
      
      expect(slug).toBe("vova-petrova");
    });
    
    it("removes special characters", () => {
      const identity = createIdentity("test", "Test: A & B!");
      const slug = generateSlug(identity);
      
      expect(slug).toBe("test-a-b");
    });
    
    it("removes leading/trailing dashes", () => {
      const identity = createIdentity("test", "  Test  ");
      const slug = generateSlug(identity);
      
      expect(slug).toBe("test");
    });
  });
  
  describe("validateIdImmutability", () => {
    it("returns true when id matches", () => {
      const identity = createIdentity("vova", "Vova");
      
      expect(validateIdImmutability(identity, "vova")).toBe(true);
    });
    
    it("returns false when id differs", () => {
      const identity = createIdentity("vova", "Vova");
      
      expect(validateIdImmutability(identity, "vladimir")).toBe(false);
    });
  });
  
  describe("updateCanonicalName", () => {
    it("updates canonicalName while preserving id", () => {
      const identity = createIdentity("vova", "Vova");
      const updated = updateCanonicalName(identity, "Vladimir");
      
      expect(updated.id).toBe("vova");
      expect(updated.canonicalName).toBe("Vladimir");
    });
    
    it("preserves aliases and meta", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["ru:Вова"],
        meta: { lang: "ru" }
      });
      const updated = updateCanonicalName(identity, "Vladimir");
      
      expect(updated.aliases).toContain("ru:Вова");
      expect(updated.meta.lang).toBe("ru");
    });
    
    it("does not mutate original identity", () => {
      const identity = createIdentity("vova", "Vova");
      const updated = updateCanonicalName(identity, "Vladimir");
      
      expect(identity.canonicalName).toBe("Vova");
      expect(updated.canonicalName).toBe("Vladimir");
    });
  });
  
  describe("addAlias", () => {
    it("adds new alias", () => {
      const identity = createIdentity("vova", "Vova");
      const updated = addAlias(identity, "ru:Вова");
      
      expect(updated.aliases).toContain("ru:Вова");
    });
    
    it("does not add duplicate alias", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["ru:Вова"]
      });
      const updated = addAlias(identity, "ru:Вова");
      
      expect(updated.aliases.filter(a => a === "ru:Вова").length).toBe(1);
    });
    
    it("does not mutate original identity", () => {
      const identity = createIdentity("vova", "Vova");
      const updated = addAlias(identity, "ru:Вова");
      
      expect(identity.aliases).toEqual([]);
      expect(updated.aliases).toContain("ru:Вова");
    });
  });
  
  describe("matchesName", () => {
    it("matches canonicalName", () => {
      const identity = createIdentity("vova", "Vova");
      
      expect(matchesName(identity, "Vova")).toBe(true);
      expect(matchesName(identity, "vova")).toBe(true);
    });
    
    it("matches alias", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["Vladimir", "ru:Вова"]
      });
      
      expect(matchesName(identity, "Vladimir")).toBe(true);
      expect(matchesName(identity, "Вова")).toBe(true);
    });
    
    it("matches originalName", () => {
      const identity = createIdentity("vova", "Vova", {
        meta: { originalName: "Вова" }
      });
      
      expect(matchesName(identity, "Вова")).toBe(true);
    });
    
    it("returns false for non-matching name", () => {
      const identity = createIdentity("vova", "Vova");
      
      expect(matchesName(identity, "Unknown")).toBe(false);
    });
  });
  
  describe("extractIdentityFromNode", () => {
    it("extracts identity from node with canonicalName", () => {
      const node = {
        id: "vova",
        canonicalName: "Vova",
        aliases: ["ru:Вова"],
        meta: { lang: "ru" }
      };
      const identity = extractIdentityFromNode(node);
      
      expect(identity.id).toBe("vova");
      expect(identity.canonicalName).toBe("Vova");
      expect(identity.aliases).toContain("ru:Вова");
    });
    
    it("falls back to label if canonicalName missing", () => {
      const node = { id: "vova", label: "Vova Label" };
      const identity = extractIdentityFromNode(node);
      
      expect(identity.canonicalName).toBe("Vova Label");
    });
    
    it("falls back to id if both missing", () => {
      const node = { id: "vova" };
      const identity = extractIdentityFromNode(node);
      
      expect(identity.canonicalName).toBe("vova");
    });
  });
  
  describe("serializeIdentity", () => {
    it("serializes identity to JSON-friendly object", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["ru:Вова"],
        meta: { lang: "ru" }
      });
      const serialized = serializeIdentity(identity);
      
      expect(serialized.id).toBe("vova");
      expect(serialized.canonicalName).toBe("Vova");
      expect(serialized.aliases).toContain("ru:Вова");
      expect(serialized.meta.lang).toBe("ru");
    });
    
    it("omits empty aliases", () => {
      const identity = createIdentity("vova", "Vova");
      const serialized = serializeIdentity(identity);
      
      expect(serialized.aliases).toBeUndefined();
    });
    
    it("omits empty meta", () => {
      const identity = createIdentity("vova", "Vova");
      const serialized = serializeIdentity(identity);
      
      expect(serialized.meta).toBeUndefined();
    });
  });
  
  describe("invariants", () => {
    it("id remains immutable when canonicalName changes", () => {
      const identity = createIdentity("vova", "Vova");
      const updated = updateCanonicalName(identity, "Vladimir");
      
      expect(identity.id).toBe(updated.id);
    });
    
    it("slug is derived from canonicalName, not id", () => {
      const identity = createIdentity("vova-123", "Vova Petrova");
      const slug = generateSlug(identity);
      
      expect(slug).toBe("vova-petrova");
      expect(slug).not.toBe("vova-123");
    });
    
    it("Projection can change displayName without changing identity", () => {
      const identity = createIdentity("vova", "Vova", {
        aliases: ["ru:Вова", "en:Vladimir"]
      });
      
      const displayEn = getDisplayName(identity, "en");
      const displayRu = getDisplayName(identity, "ru");
      
      // Разные отображаемые имена
      expect(displayEn.name).toBe("Vladimir");
      expect(displayRu.name).toBe("Вова");
      
      // Но идентичность та же
      expect(identity.id).toBe("vova");
      expect(identity.canonicalName).toBe("Vova");
    });
  });
});
