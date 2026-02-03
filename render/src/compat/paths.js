/**
 * Compatibility layer for paths
 * Централизованные пути для всего render
 */

export const PATHS = {
  // Базовые пути
  DATA_ROOT: "/data",
  GRAPH_ROOT: "/data/graph",
  ASSETS_ROOT: "/data/assets",
  
  // Конкретные файлы
  UNIVERSE_JSON: "/data/graph/universe.json",
  EDITOR_HTML: "/data/graph/editor.html",
  
  // Ассеты
  LOGOS: "/data/assets/logos",
  BACKGROUNDS: "/data/assets/backgrounds",
  AVATARS: "/data/assets/avatars",
  FLAGS: "/data/assets/flags",
  
  // Экспорты
  EXPORTS: "/data/exports"
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
