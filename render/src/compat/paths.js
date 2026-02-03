/**
 * Compatibility layer for paths
 * Централизованные пути для всего render
 */

const BASE_URL = import.meta.env.BASE_URL || "/";
const BASE_ROOT = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

const withBase = (path) => `${BASE_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;

export const PATHS = {
  // Базовые пути
  DATA_ROOT: withBase("/data"),
  GRAPH_ROOT: withBase("/data/graph"),
  ASSETS_ROOT: withBase("/data/assets"),
  
  // Конкретные файлы
  UNIVERSE_JSON: withBase("/data/graph/universe.json"),
  EDITOR_HTML: withBase("/data/graph/editor.html"),
  
  // Ассеты
  LOGOS: withBase("/data/assets/logos"),
  BACKGROUNDS: withBase("/data/assets/backgrounds"),
  AVATARS: withBase("/data/assets/avatars"),
  FLAGS: withBase("/data/assets/flags"),
  
  // Экспорты
  EXPORTS: withBase("/data/exports")
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
