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
    const pos = index(key);
    if (pos === -1) {
      if (key === "$schema") continue;
      fail(`${filePath}: missing top-level key "${key}"`);
      return;
    }
    if (pos < lastIndex) {
      fail(`${filePath}: top-level key order is incorrect around "${key}"`);
      return;
    }
    lastIndex = pos;
  }
}

function checkMeta(filePath, data) {
  if (!data || typeof data !== "object") return;
  const meta = data.meta;
  if (!meta || typeof meta !== "object") {
    fail(`${filePath}: missing meta object`);
    return;
  }
  if (!meta.mode || !meta.contract) {
    fail(`${filePath}: meta requires "mode" and "contract"`);
  }
}

function checkInlineObjects(filePath, text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes("{") || !line.includes("}")) continue;
    const trimmed = line.trim();
    if (trimmed === "{}") continue;
    if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.length > 2) {
      fail(`${filePath}: inline object detected on line ${i + 1}`);
      return;
    }
  }
}

function checkIndentation(filePath, text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes("\t")) {
      fail(`${filePath}: tab indentation on line ${i + 1}`);
      return;
    }
    const leading = line.match(/^ +/);
    if (leading && leading[0].length % 2 !== 0) {
      fail(`${filePath}: indentation not multiple of 2 on line ${i + 1}`);
      return;
    }
  }
}

for (const filePath of CONTRACT_FILES) {
  if (!fs.existsSync(filePath)) {
    fail(`missing contract file: ${filePath}`);
    continue;
  }
  const { text, data } = loadJson(filePath);
  if (!data) continue;
  checkTopLevelOrder(filePath, text);
  checkMeta(filePath, data);
  checkInlineObjects(filePath, text);
  checkIndentation(filePath, text);
}

if (!process.exitCode) {
  console.log("UI contract validation passed.");
}
