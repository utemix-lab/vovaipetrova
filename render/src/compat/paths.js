/**
 * Compatibility layer for paths
 * Централизованные пути для всего render
 */

const BASE_URL = import.meta.env.BASE_URL || "/";
const BASE_ROOT = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

const withBase = (path) => {
  if (!BASE_ROOT) {
    if (!path) return "";
    return path.startsWith("/") ? path : `/${path}`;
  }
  return `${BASE_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const PATHS = {
  // Базовые пути (всё лежит в public/, без вложенной data/)
  DATA_ROOT: BASE_ROOT || "",
  GRAPH_ROOT: withBase("/graph"),
  ASSETS_ROOT: withBase("/assets"),
  
  // Конкретные файлы
  UNIVERSE_JSON: withBase("/graph/universe.json"),
  EDITOR_HTML: withBase("/graph/editor.html"),
  
  // Ассеты
  LOGOS: withBase("/assets/logos"),
  BACKGROUNDS: withBase("/assets/backgrounds"),
  WIDGETS: withBase("/assets/widgets"),
  FLAGS: withBase("/assets/flags"),
  
  // Экспорты
  EXPORTS: withBase("/exports")
};

// Функция для построения URL
export function buildDataPath(relativePath) {
  return `${PATHS.DATA_ROOT}/${relativePath}`;
}

export function buildAssetPath(assetPath) {
  return `${PATHS.ASSETS_ROOT}/${assetPath}`;
}

// Legacy compatibility для старого кода
export const LEGACY_PATHS = {
  CONTRACTS_PUBLIC: PATHS.DATA_ROOT,
  DREAM_GRAPH_CONTRACTS: PATHS.DATA_ROOT
};
