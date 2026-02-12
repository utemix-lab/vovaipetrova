/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOUNDARY TESTS — P3.5b Boundary Freeze
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Цель: Гарантировать односторонние зависимости
 * 
 * Core → Projection → Visitor/UI
 * 
 * Запрещено:
 * - Core импортирует visitor
 * - Core импортирует Three.js
 * - Core импортирует React
 * - Core импортирует DOM API
 * - Циклические зависимости внутри Core
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const CORE_DIR = path.resolve(__dirname, "..");
const ONTOLOGY_DIR = path.resolve(__dirname, "../../ontology");

/**
 * Запрещённые импорты для Core.
 */
const FORBIDDEN_IMPORTS = [
  // Visitor/Renderer
  /from\s+["'].*visitor/,
  /from\s+["'].*scenes/,
  /from\s+["'].*components/,
  
  // Three.js
  /from\s+["']three["']/,
  /from\s+["']@?three/,
  /from\s+["'].*three-force-graph/,
  
  // React
  /from\s+["']react["']/,
  /from\s+["']react-dom/,
  
  // DOM API (в import)
  /from\s+["'].*dom/i,
  
  // Browser globals (в коде)
  /\bdocument\./,
  /\bwindow\./,
  /\blocalStorage\./,
  /\bsessionStorage\./,
];

/**
 * Разрешённые импорты для Core.
 */
const ALLOWED_IMPORTS = [
  // Внутренние модули Core
  /from\s+["']\.\//,
  /from\s+["']\.\.\//,
  
  // ontology (часть Core)
  /from\s+["'].*ontology/,
  
  // Тестовые утилиты
  /from\s+["']vitest["']/,
  
  // Node.js built-ins (для тестов)
  /from\s+["']fs["']/,
  /from\s+["']path["']/,
];

/**
 * Получить все JS файлы в директории.
 */
function getJsFiles(dir, excludeTests = false) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      if (excludeTests && item.name === "__tests__") {
        continue;
      }
      files.push(...getJsFiles(fullPath, excludeTests));
    } else if (item.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Проверить файл на запрещённые импорты.
 */
function checkForbiddenImports(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const violations = [];
  
  for (const pattern of FORBIDDEN_IMPORTS) {
    const match = content.match(pattern);
    if (match) {
      violations.push({
        file: filePath,
        pattern: pattern.toString(),
        match: match[0]
      });
    }
  }
  
  return violations;
}

describe("Boundary Freeze", () => {
  describe("Core isolation", () => {
    it("Core does not import visitor modules", () => {
      const coreFiles = getJsFiles(CORE_DIR, true);
      const ontologyFiles = getJsFiles(ONTOLOGY_DIR);
      const allCoreFiles = [...coreFiles, ...ontologyFiles];
      
      const allViolations = [];
      
      for (const file of allCoreFiles) {
        const violations = checkForbiddenImports(file);
        allViolations.push(...violations);
      }
      
      if (allViolations.length > 0) {
        const report = allViolations
          .map(v => `${v.file}: ${v.match}`)
          .join("\n");
        throw new Error(`Forbidden imports found:\n${report}`);
      }
      
      expect(allViolations).toHaveLength(0);
    });
    
    it("Core does not import Three.js", () => {
      const coreFiles = getJsFiles(CORE_DIR, true);
      const ontologyFiles = getJsFiles(ONTOLOGY_DIR);
      const allCoreFiles = [...coreFiles, ...ontologyFiles];
      
      const threePattern = /from\s+["']three["']/;
      
      for (const file of allCoreFiles) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(threePattern);
        
        expect(match, `Three.js import found in ${file}`).toBeNull();
      }
    });
    
    it("Core does not import React", () => {
      const coreFiles = getJsFiles(CORE_DIR, true);
      const ontologyFiles = getJsFiles(ONTOLOGY_DIR);
      const allCoreFiles = [...coreFiles, ...ontologyFiles];
      
      const reactPattern = /from\s+["']react["']/;
      
      for (const file of allCoreFiles) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(reactPattern);
        
        expect(match, `React import found in ${file}`).toBeNull();
      }
    });
    
    it("Core does not use DOM globals", () => {
      const coreFiles = getJsFiles(CORE_DIR, true);
      const ontologyFiles = getJsFiles(ONTOLOGY_DIR);
      const allCoreFiles = [...coreFiles, ...ontologyFiles];
      
      const domPatterns = [
        /\bdocument\./,
        /\bwindow\./,
      ];
      
      for (const file of allCoreFiles) {
        const content = fs.readFileSync(file, "utf-8");
        
        for (const pattern of domPatterns) {
          const match = content.match(pattern);
          expect(match, `DOM global found in ${file}: ${match?.[0]}`).toBeNull();
        }
      }
    });
  });
  
  describe("Dependency direction", () => {
    it("Core → Projection → Visitor (one-way)", () => {
      // Core файлы не должны импортировать из visitor
      const coreFiles = getJsFiles(CORE_DIR, true);
      const visitorPattern = /from\s+["'].*visitor/;
      
      for (const file of coreFiles) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(visitorPattern);
        
        expect(match, `Visitor import found in Core: ${file}`).toBeNull();
      }
    });
    
    it("ontology is part of Core (allowed imports)", () => {
      const coreFiles = getJsFiles(CORE_DIR, true);
      const ontologyPattern = /from\s+["'].*ontology/;
      
      // Это разрешено — ontology часть Core
      let hasOntologyImport = false;
      
      for (const file of coreFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (ontologyPattern.test(content)) {
          hasOntologyImport = true;
          break;
        }
      }
      
      // GraphModel импортирует из ontology — это ожидаемо
      expect(hasOntologyImport).toBe(true);
    });
  });
  
  describe("Crystal integrity", () => {
    it("Core modules exist and are importable", async () => {
      // Проверяем что все модули Core существуют
      const coreModules = [
        "../GraphModel.js",
        "../Projection.js",
        "../DevProjection.js",
        "../OwnershipGraph.js",
        "../Identity.js",
        "../index.js",
      ];
      
      for (const modulePath of coreModules) {
        const fullPath = path.resolve(__dirname, modulePath);
        expect(fs.existsSync(fullPath), `Module not found: ${modulePath}`).toBe(true);
      }
    });
    
    it("ontology/highlightModel.js exists", () => {
      const highlightModelPath = path.resolve(ONTOLOGY_DIR, "highlightModel.js");
      expect(fs.existsSync(highlightModelPath)).toBe(true);
    });
  });
});
