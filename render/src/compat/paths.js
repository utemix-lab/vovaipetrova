/**
 * Compatibility layer for paths
 * Централизованные пути для всего render
 */

export const PATHS = {
  // Базовые пути
  DATA_ROOT: "/vovaipetrova/data",
  GRAPH_ROOT: "/vovaipetrova/data/graph",
  ASSETS_ROOT: "/vovaipetrova/data/assets",
  
  // Конкретные файлы
  UNIVERSE_JSON: "/vovaipetrova/data/graph/universe.json",
  EDITOR_HTML: "/vovaipetrova/data/graph/editor.html",
  
  // Ассеты
  LOGOS: "/vovaipetrova/data/assets/logos",
  BACKGROUNDS: "/vovaipetrova/data/assets/backgrounds",
  AVATARS: "/vovaipetrova/data/assets/avatars",
  FLAGS: "/vovaipetrova/data/assets/flags",
  
  // Экспорты
  EXPORTS: "/vovaipetrova/data/exports"
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
