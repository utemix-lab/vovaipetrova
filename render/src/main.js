import "./style.css";

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

import("./scenes/visitor.js");
