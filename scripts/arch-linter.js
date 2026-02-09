import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REQUIRED_FILES = [
  "render/src/architecture/dna.ts",
  ".agent/context.yml",
  "render/src/main.js",
  "render/src/main.jsx",
  "render/src/scenes/visitor.js",
  "render/src/visual/config.js",
  "render/src/visual/widget-rules.js"
];

const DNA_IMPORT_MARKER = "architecture/dna";

function fail(message) {
  console.error(`[arch-lint] ${message}`);
  process.exitCode = 1;
}

function ensureFiles() {
  const missing = REQUIRED_FILES.filter((filePath) => !fs.existsSync(path.join(ROOT, filePath)));
  if (missing.length) {
    fail(`missing required files: ${missing.join(", ")}`);
  }
}

function checkDnaImports() {
  const filesToCheck = REQUIRED_FILES.filter((filePath) => filePath.endsWith(".js") || filePath.endsWith(".jsx"));
  filesToCheck.forEach((filePath) => {
    const fullPath = path.join(ROOT, filePath);
    const content = fs.readFileSync(fullPath, "utf8");
    if (!content.includes(DNA_IMPORT_MARKER)) {
      fail(`missing architecture DNA import in ${filePath}`);
    }
  });
}

function main() {
  ensureFiles();
  if (process.exitCode) return;
  checkDnaImports();

  if (!process.exitCode) {
    console.log("[arch-lint] Architecture anchors present.");
  }
}

main();
