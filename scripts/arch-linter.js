/**
 * Architecture Linter
 * 
 * Проверяет соответствие кода архитектурным принципам проекта.
 * Не блокирует разработку, но предупреждает о потенциальных проблемах.
 * 
 * Философия: мягкие напоминания, не жёсткие правила.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

// Обязательные файлы для архитектурной целостности
const REQUIRED_FILES = [
  "render/src/architecture/dna.ts",
  ".agent/context.yml",
  "docs/INDEX.md",
  "docs/ARCHITECTURE_PRINCIPLES.md",
  "render/src/main.jsx",
  "render/src/scenes/visitor.js"
];

// Файлы, которые должны импортировать DNA
const DNA_IMPORT_FILES = [
  "render/src/main.jsx",
  "render/src/scenes/visitor.js"
];

// Паттерны, запрещённые в Фазе 1 (предупреждения, не ошибки)
const PHASE1_WARNINGS = [
  { pattern: /import.*openai|import.*anthropic|import.*langchain/i, message: "LLM imports detected - not allowed in Phase 1" },
  { pattern: /import.*pinecone|import.*weaviate|import.*chromadb/i, message: "Vector DB imports detected - not allowed in Phase 1" },
  { pattern: /semantic.*intent|user.*intent.*analysis/i, message: "Semantic intent analysis detected - Phase 1 is visual-first" }
];

// Якоря для будущей сложности (проверяем их наличие)
const ANCHOR_PATTERNS = [
  { pattern: /@ArchProto|data-arch-layer/, name: "Architecture annotations" },
  { pattern: /graph-.*-changed|graph-.*-selected/, name: "Graph event system" },
  { pattern: /pointer-tag|query.*mode/i, name: "Navigation primitives" }
];

let warnings = [];
let errors = [];

function error(message) {
  errors.push(message);
  console.error(`[arch-lint] ❌ ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`[arch-lint] ⚠️  ${message}`);
}

function info(message) {
  console.log(`[arch-lint] ✓ ${message}`);
}

function ensureFiles() {
  const missing = REQUIRED_FILES.filter((filePath) => !fs.existsSync(path.join(ROOT, filePath)));
  if (missing.length) {
    error(`Missing required files: ${missing.join(", ")}`);
  }
}

function checkDnaImports() {
  DNA_IMPORT_FILES.forEach((filePath) => {
    const fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, "utf8");
    if (!content.includes("architecture/dna")) {
      warn(`Missing architecture DNA import in ${filePath}`);
    }
  });
}

function checkPhase1Compliance() {
  const srcDir = path.join(ROOT, "render/src");
  if (!fs.existsSync(srcDir)) return;
  
  const jsFiles = findFiles(srcDir, [".js", ".jsx", ".ts", ".tsx"]);
  
  jsFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(ROOT, filePath);
    
    PHASE1_WARNINGS.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        warn(`${relativePath}: ${message}`);
      }
    });
  });
}

function checkAnchorsPresence() {
  const srcDir = path.join(ROOT, "render/src");
  if (!fs.existsSync(srcDir)) return;
  
  const jsFiles = findFiles(srcDir, [".js", ".jsx", ".ts", ".tsx"]);
  const allContent = jsFiles.map(f => fs.readFileSync(f, "utf8")).join("\n");
  
  ANCHOR_PATTERNS.forEach(({ pattern, name }) => {
    if (pattern.test(allContent)) {
      info(`${name} - anchors present`);
    } else {
      warn(`${name} - no anchors found (consider adding for future layers)`);
    }
  });
}

function findFiles(dir, extensions) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith(".") && item.name !== "node_modules") {
      results.push(...findFiles(fullPath, extensions));
    } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

function printSummary() {
  console.log("\n" + "=".repeat(50));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log("[arch-lint] ✅ All checks passed. Architecture is healthy.");
  } else if (errors.length === 0) {
    console.log(`[arch-lint] ⚠️  ${warnings.length} warning(s), no errors.`);
    console.log("[arch-lint] Warnings are suggestions, not blockers.");
  } else {
    console.log(`[arch-lint] ❌ ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exitCode = 1;
  }
  
  console.log("=".repeat(50));
}

function main() {
  console.log("[arch-lint] Checking architecture compliance...\n");
  
  ensureFiles();
  checkDnaImports();
  checkPhase1Compliance();
  checkAnchorsPresence();
  
  printSummary();
}

main();
