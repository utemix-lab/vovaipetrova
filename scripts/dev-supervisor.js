import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import chokidar from "chokidar";

const CANONICAL_URL = "http://localhost:5173/vovaipetrova/";
const RESTART_DELAY_MS = 1500;
const HEALTH_INTERVAL_MS = 8000;
const RESTART_DEBOUNCE_MS = 300;
const RESTART_WINDOW_MS = 60000;
const MAX_RESTARTS_PER_WINDOW = 5;
const WATCH_PATHS = [
  "render/vite.config.js",
  "render/package.json",
  "package.json",
  "scripts/dev-supervisor.js",
  "scripts/kill-port.js"
];
const LOG_DIR = path.resolve("logs");
const LOG_FILE = path.join(LOG_DIR, "dev-supervisor.log");
const DIAG_LOG_FILE = path.join(LOG_DIR, "diagnostics.log");
const REQUIRED_FILES = [
  "render/public/graph/universe.json",
  "render/public/ui/layout/visitor.layout.json",
  "render/public/ui/bindings/visitor.bindings.json",
  "render/public/ui/interaction/visitor.interaction.json",
  "render/public/ui/widgets/domains.json",
  "render/public/manifests/assets.manifest.json"
];
const TEMPLATE_FILES = {
  "render/public/ui/layout/visitor.layout.json": {
    $schema: "https://utemix-lab.github.io/schemas/layout.schema.json",
    id: "visitor-layout",
    version: "0.1.0",
    title: "Visitor Layout (auto)"
  },
  "render/public/ui/bindings/visitor.bindings.json": {
    $schema: "https://utemix-lab.github.io/schemas/bindings.schema.json",
    id: "visitor-bindings",
    version: "0.1.0",
    title: "Visitor Bindings (auto)"
  },
  "render/public/ui/interaction/visitor.interaction.json": {
    $schema: "https://utemix-lab.github.io/schemas/interaction.schema.json",
    id: "visitor-interaction",
    version: "0.1.0",
    title: "Visitor Interaction (auto)"
  },
  "render/public/ui/widgets/domains.json": {
    id: "visitor-widgets-domains",
    version: "1.0",
    title: "Fallback widgets (auto)",
    config: { panel: "story", triggerNode: "domains", style: "monochrome", iconSize: 48 },
    widgets: []
  },
  "render/public/graph/universe.json": {
    meta: { id: "universe-auto", title: "Universe (auto)" },
    nodes: [],
    edges: []
  },
  "render/public/manifests/assets.manifest.json": {
    exports: { catalogs: [], registries: [] }
  },
  "render/public/exports/pointer_tags_registry.json": { tags: [] }
};
const TEMPLATE_JSONL_FILES = {
  "render/public/exports/ai_catalog.jsonl": "",
  "render/public/exports/practice_participation.jsonl": ""
};
const TEMPLATE_ROUTE_FILES = {
  "render/public/routes/demo/visitor.demo.route.json": {
    id: "visitor-demo-route",
    title: "Visitor Demo Route (auto)",
    start_node_id: "root",
    nodes: [
      {
        id: "root",
        label: "Root",
        type: "root",
        story: { text: "Auto-generated route.", refs: [] },
        system: { text: "Auto-generated route.", refs: [] },
        service: { text: "Auto-generated route.", actions: [] }
      }
    ],
    edges: []
  }
};

let serverProcess = null;
let shuttingDown = false;
let restarting = false;
let healthTimer = null;
let restartTimer = null;
let pendingRestart = false;
let stopReason = "";
let restartWindowStart = Date.now();
let restartCount = 0;
let stopping = false;

function log(message) {
  const line = `[${new Date().toISOString()}] [dev-supervisor] ${message}`;
  process.stdout.write(`${line}\n`);
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  } catch (error) {
    process.stdout.write(`[dev-supervisor] Failed to write log: ${error.message}\n`);
  }
}

function logDiag(message) {
  const line = `[${new Date().toISOString()}] [diagnostics] ${message}`;
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(DIAG_LOG_FILE, `${line}\n`);
  } catch (error) {
    process.stdout.write(`[dev-supervisor] Failed to write diagnostics: ${error.message}\n`);
  }
}

function preflightChecks() {
  Object.entries(TEMPLATE_FILES).forEach(([filePath, content]) => {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      log(`Preflight: created missing ${filePath}`);
      logDiag(`Created ${filePath}`);
    }
  });
  Object.entries(TEMPLATE_JSONL_FILES).forEach(([filePath, content]) => {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
      log(`Preflight: created missing ${filePath}`);
      logDiag(`Created ${filePath}`);
    }
  });
  Object.entries(TEMPLATE_ROUTE_FILES).forEach(([filePath, content]) => {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      log(`Preflight: created missing ${filePath}`);
      logDiag(`Created ${filePath}`);
    }
  });
  const manifestPath = "render/public/manifests/assets.manifest.json";
  if (fs.existsSync(manifestPath)) {
    try {
      const text = fs.readFileSync(manifestPath, "utf8");
      const data = text.trim().length ? JSON.parse(text) : null;
      if (!data || (!data.exports?.catalogs?.length && !data.exports?.registries?.length)) {
        const exportsDir = "render/public/exports";
        const files = fs.existsSync(exportsDir) ? fs.readdirSync(exportsDir) : [];
        const catalogs = files.filter((f) => f.endsWith("_catalog.jsonl") || f.endsWith("_catalog.json"));
        const registries = files.filter((f) => f.endsWith("_registry.json") || f.endsWith("_registry.jsonl"));
        const next = { exports: { catalogs, registries } };
        fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2));
        log(`Preflight: refreshed ${manifestPath}`);
        logDiag(`Refreshed ${manifestPath}`);
      }
    } catch (error) {
      log(`Preflight: manifest parse failed, leaving as-is (${error.message}).`);
      logDiag(`Manifest parse failed: ${error.message}`);
    }
  }
  const missing = REQUIRED_FILES.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) {
    log(`Preflight warning: missing files -> ${missing.join(", ")}`);
  } else {
    log("Preflight ok: required files present.");
  }
}

function canRestart() {
  const now = Date.now();
  if (now - restartWindowStart > RESTART_WINDOW_MS) {
    restartWindowStart = now;
    restartCount = 0;
  }
  if (restartCount >= MAX_RESTARTS_PER_WINDOW) {
    log("Restart limit reached; pausing automatic restarts for this window.");
    return false;
  }
  restartCount += 1;
  return true;
}

function appendRawLog(chunk) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, chunk);
  } catch (error) {
    process.stdout.write(`[dev-supervisor] Failed to write log: ${error.message}\n`);
  }
}


function killPorts() {
  spawnSync("node", ["scripts/kill-port.js", "5173", "5174"], {
    stdio: "inherit"
  });
}

function startServer() {
  preflightChecks();
  killPorts();
  log("Starting Vite dev server...");
  serverProcess = spawn("npm", ["run", "dev", "--prefix", "render"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  serverProcess.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    appendRawLog(chunk);
  });

  serverProcess.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    appendRawLog(chunk);
  });

  log(`Server ready at ${CANONICAL_URL}`);

  serverProcess.on("exit", (code, signal) => {
    const exitReason = stopReason;
    stopReason = "";
    stopping = false;
    serverProcess = null;
    if (signal) {
      log(`Server exited with signal ${signal}.`);
    } else {
      log(`Server exited with code ${code ?? "unknown"}.`);
    }
    if (shuttingDown) return;
    if (pendingRestart) {
      pendingRestart = false;
      log(`Restarting after ${exitReason || "change"} in ${RESTART_DELAY_MS}ms...`);
      setTimeout(() => startServer(), RESTART_DELAY_MS);
      return;
    }
    scheduleRestart("exit");
  });
}

function stopServer() {
  if (!serverProcess || stopping) return;
  log("Stopping Vite dev server...");
  stopping = true;
  serverProcess.kill("SIGINT");
}

function scheduleRestart(reason) {
  if (restarting || shuttingDown || stopping) return;
  if (!canRestart()) return;
  restarting = true;
  pendingRestart = true;
  stopReason = reason;
  log(`Restart queued (${reason}). Waiting for shutdown...`);
  if (serverProcess) {
    stopServer();
  } else {
    pendingRestart = false;
    restarting = false;
    setTimeout(() => startServer(), RESTART_DELAY_MS);
  }
}

function requestRestart(reason) {
  if (shuttingDown || stopping || pendingRestart) {
    log(`Restart skipped (${reason}). Reason: already restarting or stopping.`);
    return;
  }
  if (restartTimer) clearTimeout(restartTimer);
  if (!canRestart()) return;
  pendingRestart = true;
  stopReason = reason;
  restartTimer = setTimeout(() => {
    if (serverProcess) {
      stopServer();
    } else {
      pendingRestart = false;
      startServer();
    }
  }, RESTART_DEBOUNCE_MS);
}

function checkHealth() {
  const url = new URL(CANONICAL_URL);
  const req = http.request(
    {
      method: "GET",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      timeout: 2000
    },
    (res) => {
      res.resume();
      if (res.statusCode && res.statusCode >= 500) {
        log(`Health check failed with status ${res.statusCode}.`);
      }
    }
  );
  req.on("timeout", () => {
    req.destroy();
    log("Health check timeout.");
  });
  req.on("error", (error) => {
    log(`Health check error: ${error.message}`);
  });
  req.end();
}


process.on("SIGINT", () => {
  shuttingDown = true;
  stopServer();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  stopServer();
  process.exit(0);
});

startServer();

healthTimer = setInterval(() => {
  if (!shuttingDown) checkHealth();
}, HEALTH_INTERVAL_MS);

const watcher = chokidar.watch(WATCH_PATHS, {
  ignoreInitial: true
});

watcher.on("change", (filePath) => {
  log(`Change detected (${filePath}). Restarting...`);
  requestRestart(filePath);
});
watcher.on("add", (filePath) => {
  log(`File added (${filePath}). Restarting...`);
  requestRestart(filePath);
});
watcher.on("unlink", (filePath) => {
  log(`File removed (${filePath}). Restarting...`);
  requestRestart(filePath);
});
