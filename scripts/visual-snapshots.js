import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}/vovaipetrova/`;
const SNAPSHOT_DIR = path.join(ROOT, "render", "public", "ui", "snapshots");
const GENERATED_DIR = path.join(SNAPSHOT_DIR, "__generated__");
const DIFF_DIR = path.join(SNAPSHOT_DIR, "__diff__");

const SNAPSHOTS = [
  {
    id: "visitor-default",
    prepare: async () => {}
  },
  {
    id: "visitor-expanded",
    prepare: async (page) => {
      await page.evaluate(() => {
        document.body.classList.add("narrative-expanded");
      });
    }
  }
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function log(message) {
  process.stdout.write(`[visual] ${message}\n`);
}

function runPreviewServer() {
  const command = "npm";
  const args = [
    "run",
    "preview",
    "--prefix",
    "render",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    String(PREVIEW_PORT)
  ];
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true
  });
  return child;
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(PREVIEW_URL, { method: "GET" });
      if (response.ok) return;
    } catch (error) {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Preview server did not start at ${PREVIEW_URL}`);
}

function readPng(filePath) {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function writePng(filePath, png) {
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function compareSnapshots(baselinePath, generatedPath, diffPath) {
  const baseline = readPng(baselinePath);
  const generated = readPng(generatedPath);

  if (baseline.width !== generated.width || baseline.height !== generated.height) {
    throw new Error("Snapshot size mismatch");
  }

  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const diffPixels = pixelmatch(
    baseline.data,
    generated.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: 0.1 }
  );

  if (diffPixels > 0) {
    writePng(diffPath, diff);
  }

  return diffPixels;
}

async function captureSnapshots(updateMode) {
  ensureDir(SNAPSHOT_DIR);
  ensureDir(GENERATED_DIR);
  ensureDir(DIFF_DIR);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(PREVIEW_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#scene-stage", { timeout: 20000 });

  for (const snapshot of SNAPSHOTS) {
    await page.evaluate(() => {
      document.body.classList.remove("narrative-expanded");
    });
    await snapshot.prepare(page);
    await page.waitForTimeout(1500);

    const generatedPath = path.join(GENERATED_DIR, `${snapshot.id}.png`);
    const baselinePath = path.join(SNAPSHOT_DIR, `${snapshot.id}.png`);
    const diffPath = path.join(DIFF_DIR, `${snapshot.id}.png`);

    await page.locator("#scene-stage").screenshot({ path: generatedPath });

    if (!fs.existsSync(baselinePath)) {
      if (updateMode) {
        fs.copyFileSync(generatedPath, baselinePath);
        log(`Baseline created: ${snapshot.id}`);
        continue;
      }
      throw new Error(`Missing baseline snapshot: ${baselinePath}`);
    }

    const diffPixels = compareSnapshots(baselinePath, generatedPath, diffPath);
    if (diffPixels > 0) {
      throw new Error(`Visual diff detected for ${snapshot.id} (${diffPixels} pixels)`);
    }
    log(`Snapshot OK: ${snapshot.id}`);
  }

  await browser.close();
}

async function main() {
  const updateMode = process.argv.includes("--update");
  const preview = runPreviewServer();

  try {
    await waitForServer();
    await captureSnapshots(updateMode);
    log("Visual snapshots passed.");
  } finally {
    preview.kill();
  }
}

main().catch((error) => {
  console.error(`Visual snapshot failed: ${error.message}`);
  process.exitCode = 1;
});
