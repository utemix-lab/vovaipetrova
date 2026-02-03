import "./style.css";

const SCENES = [
  { id: "visitor", label: "Visitor", module: () => import("./scenes/visitor.js"), skipSwitcher: true },
  { id: "planetary", label: "Planetary", module: () => import("./scenes/planetary.js") },
  { id: "mono", label: "Mono Graph", module: () => import("./scenes/mono-graph.js") },
  { id: "universe", label: "Universe Map", module: () => import("./scenes/universe-map.js") },
  { id: "core-taxonomy", label: "Core Taxonomy", module: () => import("./scenes/core-taxonomy.js") }
];

const urlParams = new URLSearchParams(window.location.search);
const requestedScene = urlParams.get("scene") || "planetary";
const scene = SCENES.find((entry) => entry.id === requestedScene) || SCENES[0];

scene.module();
initSceneSwitcher(scene.id);

function initSceneSwitcher(activeId) {
  // Visitor сцена имеет свой собственный UI
  const activeScene = SCENES.find((s) => s.id === activeId);
  if (activeScene?.skipSwitcher) return;

  const container = document.createElement("div");
  container.id = "sceneSwitcher";

  SCENES.forEach((entry) => {
    // Не показывать visitor в переключателе (это "чистый" режим)
    if (entry.skipSwitcher) return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = entry.label;
    button.className = entry.id === activeId ? "scene-btn active" : "scene-btn";
    button.addEventListener("click", () => {
      const params = new URLSearchParams(window.location.search);
      params.set("scene", entry.id);
      window.location.search = params.toString();
    });
    container.appendChild(button);
  });

  document.body.appendChild(container);
}
