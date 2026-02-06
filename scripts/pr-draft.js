import { execSync } from "node:child_process";

function run(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

function getNameStatus(range) {
  try {
    return run(`git diff --name-status ${range}`);
  } catch {
    return "";
  }
}

function parseNameStatus(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split(/\s+/);
      return { status, path: rest.join(" ") };
    });
}

function collectChanges() {
  let text = getNameStatus("HEAD");
  if (!text) text = getNameStatus("--cached");
  if (!text) {
    try {
      text = run("git show --name-status --format= HEAD~1..HEAD");
    } catch {
      text = "";
    }
  }
  return parseNameStatus(text);
}

function categorize(paths) {
  const categories = {
    uiRules: false,
    uiContracts: false,
    uiStyle: false,
    ci: false,
    scripts: false,
    docs: false,
    readme: false
  };

  for (const p of paths) {
    if (p.includes("render/public/ui/UI_RULES.md")) categories.uiRules = true;
    if (p.includes("render/public/ui/UI_CONTRACT_STYLE.md")) categories.uiStyle = true;
    if (p.includes("render/public/ui/")) categories.uiContracts = true;
    if (p.startsWith(".github/")) categories.ci = true;
    if (p.startsWith("scripts/")) categories.scripts = true;
    if (p.endsWith(".md")) categories.docs = true;
    if (p.endsWith("README.md")) categories.readme = true;
  }
  return categories;
}

function summarize(changes) {
  const added = changes.filter((c) => c.status.startsWith("A"));
  const modified = changes.filter((c) => c.status.startsWith("M"));
  const deleted = changes.filter((c) => c.status.startsWith("D"));

  const allPaths = changes.map((c) => c.path);
  const cats = categorize(allPaths);

  const lines = [];

  lines.push("## Что изменилось");
  if (cats.uiRules) lines.push("- Обновлены или добавлены единые правила UI-механики.");
  if (cats.uiStyle) lines.push("- Обновлён стиль контрактов UI.");
  if (cats.uiContracts) lines.push("- Изменены UI-контракты (layout/bindings/interaction/widgets).");
  if (cats.ci) lines.push("- Обновлены CI/проверки качества.");
  if (cats.scripts) lines.push("- Добавлены или обновлены инженерные скрипты.");
  if (cats.readme) lines.push("- Обновлена навигация/контекст в README.");
  if (!cats.uiRules && !cats.uiStyle && !cats.uiContracts && !cats.ci && !cats.scripts && !cats.readme) {
    if (added.length) lines.push(`- Добавлено файлов: ${added.length}.`);
    if (modified.length) lines.push(`- Изменено файлов: ${modified.length}.`);
    if (deleted.length) lines.push(`- Удалено файлов: ${deleted.length}.`);
  }

  lines.push("");
  lines.push("## Почему это важно");
  if (cats.uiRules || cats.uiContracts || cats.uiStyle) {
    lines.push("- Стабилизирует механику UI и снижает риск расхождений.");
  } else if (cats.ci || cats.scripts) {
    lines.push("- Улучшает инженерную дисциплину и повторяемость.");
  } else {
    lines.push("- Фиксирует технические изменения для прозрачности.");
  }

  lines.push("");
  lines.push("## Что стало возможным");
  if (cats.ci || cats.scripts) {
    lines.push("- Автоматическая проверка и более предсказуемые изменения.");
  } else if (cats.uiRules || cats.uiContracts || cats.uiStyle) {
    lines.push("- Быстрое масштабирование UI без потери правил.");
  } else {
    lines.push("- Более точная локализация изменений в истории.");
  }

  lines.push("");
  lines.push("## Открытые вопросы");
  lines.push("- (нет)");

  return lines.join("\n");
}

const changes = collectChanges();
console.log(summarize(changes));
