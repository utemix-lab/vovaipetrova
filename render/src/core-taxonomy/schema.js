/**
 * Core Taxonomy Graph — доменная модель для vovaipetrova-core
 *
 * Изолированная схема узлов и рёбер, не зависящая от extended-mind.
 * Использует общую инфраструктуру dream-graph для визуализации.
 */

export const NODE_TYPES = {
  ROUTE: "route",
  TERM: "term",
  DIGEST: "digest",
  EPISODE: "episode"
};

export const EDGE_KINDS = {
  ROUTE_CHILD_OF: "ROUTE_CHILD_OF",
  ROUTE_MENTIONS_TERM: "ROUTE_MENTIONS_TERM",
  TERM_LINKS_ROUTE: "TERM_LINKS_ROUTE",
  DIGEST_HAS_EPISODE: "DIGEST_HAS_EPISODE"
};

export const NODE_TYPE_LABELS = {
  [NODE_TYPES.ROUTE]: "Маршрут",
  [NODE_TYPES.TERM]: "Термин KB",
  [NODE_TYPES.DIGEST]: "Дайджест Stories",
  [NODE_TYPES.EPISODE]: "Эпизод Stories"
};

export const EDGE_KIND_LABELS = {
  [EDGE_KINDS.ROUTE_CHILD_OF]: "Дочерний маршрут",
  [EDGE_KINDS.ROUTE_MENTIONS_TERM]: "Упоминает термин",
  [EDGE_KINDS.TERM_LINKS_ROUTE]: "Ссылается на страницу",
  [EDGE_KINDS.DIGEST_HAS_EPISODE]: "Содержит эпизод"
};

/**
 * Цветовая палитра для типов узлов Core Taxonomy
 */
export const CORE_TAXONOMY_COLORS = {
  type: {
    [NODE_TYPES.ROUTE]: "#38bdf8",      // sky-400 — маршруты
    [NODE_TYPES.TERM]: "#a78bfa",       // violet-400 — термины KB
    [NODE_TYPES.DIGEST]: "#fb923c",     // orange-400 — дайджесты
    [NODE_TYPES.EPISODE]: "#fbbf24"     // amber-400 — эпизоды
  },
  edge: {
    [EDGE_KINDS.ROUTE_CHILD_OF]: "#64748b",
    [EDGE_KINDS.ROUTE_MENTIONS_TERM]: "#818cf8",
    [EDGE_KINDS.TERM_LINKS_ROUTE]: "#c084fc",
    [EDGE_KINDS.DIGEST_HAS_EPISODE]: "#fdba74"
  }
};

/**
 * Извлечь секцию из пути маршрута
 * @param {string} path
 * @returns {string}
 */
export function getRouteSection(path) {
  if (path === "/") return "home";
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "home";
  const first = parts[0];
  if (first === "page") return "page";
  if (first === "kb") return "kb";
  return first;
}

/**
 * Извлечь родительский путь
 * @param {string} path
 * @returns {string|null}
 */
export function getParentPath(path) {
  if (path === "/" || !path) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "/";
  parts.pop();
  return "/" + parts.join("/");
}
