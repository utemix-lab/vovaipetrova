import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RULES_PATH = path.join(ROOT, "render", "public", "ui", "ui-rules.json");

function fail(message) {
  console.error(`UI rules validation failed: ${message}`);
  process.exitCode = 1;
}

function loadJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${filePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function resolvePath(filePath) {
  return path.join(ROOT, filePath);
}

function ensureFiles(files) {
  const missing = files.filter((filePath) => !fs.existsSync(resolvePath(filePath)));
  if (missing.length) {
    fail(`missing files: ${missing.join(", ")}`);
  }
}

function readText(filePath) {
  return fs.readFileSync(resolvePath(filePath), "utf8");
}

function checkMustContain(entries) {
  for (const entry of entries) {
    const text = readText(entry.file);
    for (const pattern of entry.patterns) {
      if (!text.includes(pattern)) {
        fail(`${entry.id}: missing pattern "${pattern}" in ${entry.file}`);
        return;
      }
    }
  }
}

function checkMustNotContain(entries) {
  for (const entry of entries) {
    const text = readText(entry.file);
    for (const pattern of entry.patterns) {
      if (text.includes(pattern)) {
        fail(`${entry.id}: forbidden pattern "${pattern}" in ${entry.file}`);
        return;
      }
    }
  }
}

function findNodeById(nodes, nodeId) {
  if (!Array.isArray(nodes)) return null;
  return nodes.find((node) => node && node.id === nodeId) ?? null;
}

function checkJsonRules(entries) {
  for (const entry of entries) {
    const data = loadJson(resolvePath(entry.file));
    if (!data) return;
    const nodes = data.nodes;
    const target = findNodeById(nodes, entry.nodeId);
    if (!target) {
      fail(`${entry.id}: node ${entry.nodeId} not found in ${entry.file}`);
      return;
    }
    const expected = entry.expect || {};
    for (const [key, value] of Object.entries(expected)) {
      if (target[key] !== value) {
        fail(`${entry.id}: node ${entry.nodeId} expected ${key}=${value} but got ${target[key]}`);
        return;
      }
    }
  }
}

function main() {
  if (!fs.existsSync(RULES_PATH)) {
    fail(`rules file missing: ${RULES_PATH}`);
    return;
  }
  const rules = loadJson(RULES_PATH);
  if (!rules || !rules.checks) return;

  const files = rules.checks.files || [];
  const mustContain = rules.checks.mustContain || [];
  const mustNotContain = rules.checks.mustNotContain || [];
  const jsonRules = rules.checks.jsonRules || [];

  ensureFiles(files);
  if (process.exitCode) return;
  checkMustContain(mustContain);
  if (process.exitCode) return;
  checkMustNotContain(mustNotContain);
  if (process.exitCode) return;
  checkJsonRules(jsonRules);

  if (!process.exitCode) {
    console.log("UI rules validation passed.");
  }
}

main();
