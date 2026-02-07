import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
  "render/public/graph/universe.json",
  "render/public/ui/layout/visitor.layout.json",
  "render/public/ui/bindings/visitor.bindings.json",
  "render/public/ui/interaction/visitor.interaction.json",
  "render/public/ui/widgets/domains.json",
  "render/public/manifests/assets.manifest.json"
];

const steps = [
  {
    name: "UI contracts validation",
    command: "node scripts/validate-ui-contracts.js"
  },
  {
    name: "Universe graph validation",
    command: "node core/validate.js"
  },
  {
    name: "Render build",
    command: "npm run build --prefix render"
  }
];

function log(message) {
  process.stdout.write(`[checks] ${message}\n`);
}

function ensureFiles() {
  const missing = REQUIRED_FILES.filter((filePath) => !fs.existsSync(path.join(ROOT, filePath)));
  if (missing.length) {
    throw new Error(`Missing required files: ${missing.join(", ")}`);
  }
  log("Required files present.");
}

function runStep(step) {
  log(`Running: ${step.name}`);
  execSync(step.command, { stdio: "inherit" });
}

function main() {
  ensureFiles();
  steps.forEach(runStep);
  log("All checks passed.");
}

main();
