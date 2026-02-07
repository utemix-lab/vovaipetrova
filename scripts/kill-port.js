import { execSync } from "node:child_process";
import os from "node:os";

const ports = process.argv.slice(2).map((p) => Number(p)).filter((p) => Number.isFinite(p));
if (!ports.length) {
  console.log("No ports provided. Usage: node scripts/kill-port.js 5173");
  process.exit(0);
}

function run(command, allowFailure = false) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
  } catch (error) {
    if (allowFailure) return "";
    throw error;
  }
}

function killWindows(port) {
  const cmd = `powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; Get-NetTCPConnection -LocalPort ${port} | Select-Object -First 1 -ExpandProperty OwningProcess"`;
  const pidText = run(cmd, true);
  const pid = Number(pidText);
  if (!pid || !Number.isFinite(pid) || pid <= 0) return false;
  run(`powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force"`);
  return true;
}

function killPosix(port) {
  const pidText = run(`lsof -ti tcp:${port}`);
  if (!pidText) return false;
  const pids = pidText.split(/\s+/).filter(Boolean);
  if (!pids.length) return false;
  run(`kill -9 ${pids.join(" ")}`);
  return true;
}

const isWindows = os.platform() === "win32";
let killedAny = false;

for (const port of ports) {
  try {
    const killed = isWindows ? killWindows(port) : killPosix(port);
    if (killed) {
      console.log(`Port ${port} freed.`);
      killedAny = true;
    } else {
      console.log(`Port ${port} is already free.`);
    }
  } catch (error) {
    console.warn(`Failed to free port ${port}:`, error.message);
  }
}

if (!killedAny) {
  process.exit(0);
}
