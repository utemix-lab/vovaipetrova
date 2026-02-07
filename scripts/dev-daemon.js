import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LOG_DIR = path.resolve("logs");
const PID_FILE = path.join(LOG_DIR, "dev-daemon.pid");
const LOG_FILE = path.join(LOG_DIR, "dev-daemon.log");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isAlive(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

ensureDir(LOG_DIR);

if (fs.existsSync(PID_FILE)) {
  const existingPid = Number(fs.readFileSync(PID_FILE, "utf8").trim());
  if (isAlive(existingPid)) {
    console.log(`[dev-daemon] Уже запущено (pid ${existingPid}).`);
    process.exit(0);
  }
}

const out = fs.openSync(LOG_FILE, "a");
const child = spawn(process.execPath, ["scripts/dev-supervisor.js"], {
  detached: true,
  stdio: ["ignore", out, out],
  windowsHide: true
});

child.unref();
fs.writeFileSync(PID_FILE, String(child.pid));
console.log(`[dev-daemon] Запущено в фоне (pid ${child.pid}). Логи: ${LOG_FILE}`);
