import fs from "node:fs";
import path from "node:path";

const LOG_DIR = path.resolve("logs");
const PID_FILE = path.join(LOG_DIR, "dev-daemon.pid");

if (!fs.existsSync(PID_FILE)) {
  console.log("[dev-daemon] PID файл не найден.");
  process.exit(0);
}

const pid = Number(fs.readFileSync(PID_FILE, "utf8").trim());
if (!pid || Number.isNaN(pid)) {
  console.log("[dev-daemon] Некорректный PID.");
  process.exit(0);
}

try {
  process.kill(pid, "SIGTERM");
  console.log(`[dev-daemon] Остановлено (pid ${pid}).`);
} catch (error) {
  console.log(`[dev-daemon] Не удалось остановить (pid ${pid}): ${error.message}`);
}

try {
  fs.unlinkSync(PID_FILE);
} catch {}
