import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("render", "public", "ui");
const CONTRACT_FILES = [
  path.join(ROOT, "layout", "visitor.layout.json"),
  path.join(ROOT, "bindings", "visitor.bindings.json"),
  path.join(ROOT, "interaction", "visitor.interaction.json"),
  path.join(ROOT, "widgets", "domains.json")
];

const TOP_LEVEL_ORDER = [
  "$schema",
  "id",
  "version",
  "title",
  "description",
  "meta"
];

function fail(message) {
  console.error(`UI contract validation failed: ${message}`);
  process.exitCode = 1;
}

function loadJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  try {
    return { text, data: JSON.parse(text) };
  } catch (error) {
    fail(`${filePath}: invalid JSON (${error.message})`);
    return { text, data: null };
  }
}

function checkTopLevelOrder(filePath, text) {
  const index = (key) => text.indexOf(`"${key}"`);

  let lastIndex = -1;
  for (const key of TOP_LEVEL_ORDER) {
    const currentIndex = index(key);
    if (currentIndex !== -1 && currentIndex < lastIndex) {
      fail(`${filePath}: "${key}" is out of order`);
    }
    lastIndex = Math.max(lastIndex, currentIndex);
  }
}

for (const file of CONTRACT_FILES) {
  const { text, data } = loadJson(file);
  if (data) {
    checkTopLevelOrder(file, text);
  }
}