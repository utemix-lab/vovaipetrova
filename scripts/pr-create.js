import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

function run(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

function getTitle() {
  try {
    return run("git log -1 --pretty=%s");
  } catch {
    return "PR";
  }
}

function getDraft() {
  return run("node scripts/pr-draft.js");
}

function main() {
  const title = getTitle();
  const body = getDraft();
  const tmpFile = path.join(os.tmpdir(), `pr-body-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, body);

  try {
    run(`gh pr create --title "${title.replace(/"/g, '\\"')}" --body-file "${tmpFile}"`);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

main();
