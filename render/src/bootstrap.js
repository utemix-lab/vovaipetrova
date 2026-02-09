import "./style.css";
import "./architecture/dna.ts";

function showFatalError(message, error) {
  const existing = document.getElementById("fatal-error");
  const container = existing || document.createElement("div");
  container.id = "fatal-error";
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.background = "rgba(7, 7, 10, 0.92)";
  container.style.color = "#f9fafb";
  container.style.fontFamily = "Segoe UI, system-ui, sans-serif";
  container.style.padding = "32px";
  container.style.zIndex = "9999";
  container.style.overflow = "auto";

  const details = error ? `\n${String(error?.stack || error?.message || error)}` : "";
  container.innerHTML = `
    <h1 style="margin:0 0 12px 0;font-size:20px;">Ошибка загрузки сцены</h1>
    <p style="margin:0 0 12px 0;opacity:0.9;">${message}</p>
    <pre style="white-space:pre-wrap;background:rgba(255,255,255,0.06);padding:12px;border-radius:8px;">${details || ""}</pre>
    <p style="margin-top:12px;opacity:0.7;">Откройте консоль браузера (F12) для деталей.</p>
  `;

  if (!existing) {
    document.body.appendChild(container);
  }
}

function configureBaseUrls() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const baseRoot = normalizedBase || "";
  document.documentElement.style.setProperty("--base-url", baseRoot);
  document.documentElement.style.setProperty(
    "--panel-story-url",
    `url("${baseRoot}/assets/backgrounds/panel-story.png")`
  );
  document.documentElement.style.setProperty(
    "--panel-system-url",
    `url("${baseRoot}/assets/backgrounds/panel-system.png")`
  );
  document.documentElement.style.setProperty(
    "--panel-service-url",
    `url("${baseRoot}/assets/backgrounds/panel-service.png")`
  );
}

export function bootstrapVisitorScene() {
  window.addEventListener("error", (event) => {
    showFatalError("Произошла ошибка JavaScript.", event?.error || event?.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    showFatalError("Необработанное отклонение промиса.", event?.reason || event);
  });

  configureBaseUrls();

  import("./scenes/visitor.js").catch((error) => {
    showFatalError("Не удалось загрузить модуль сцены.", error);
  });
}
