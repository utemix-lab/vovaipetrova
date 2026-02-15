/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CATALOG TYPES — TypeScript типы для каталогов и операторов
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.2: TypeScript типы для Track 3
 * 
 * @see docs/OPERATORS_CONCEPT.md
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Запись каталога.
 */
export interface CatalogEntry {
  /** Уникальный идентификатор записи */
  id: string;
  /** Теги записи (для фильтрации) */
  tags?: string[];
  /** Дополнительные атрибуты */
  [key: string]: unknown;
}

/**
 * Схема каталога (описание атрибутов).
 */
export interface CatalogSchema {
  [attributeName: string]: string;
}

/**
 * Каталог — коллекция записей.
 */
export interface Catalog {
  /** ID каталога (должен совпадать с ключом в реестре) */
  id: string;
  /** Версия каталога */
  version?: string;
  /** Описание каталога */
  description?: string;
  /** Схема атрибутов записей */
  schema?: CatalogSchema;
  /** Записи каталога */
  entries: CatalogEntry[];
}

/**
 * Реестр каталогов.
 */
export interface CatalogRegistry {
  [catalogId: string]: Catalog;
}

/**
 * Ссылки на записи каталогов в узле графа.
 */
export interface CatalogRefs {
  [catalogId: string]: string[];
}

/**
 * Узел графа с поддержкой каталогов.
 */
export interface CatalogAwareNode {
  id: string;
  type: string;
  /** Ссылки на записи каталогов */
  catalogRefs?: CatalogRefs;
  /** Теги узла */
  tags?: string[];
  /** Pointer-tags (cap:X формат) */
  pointerTags?: string[];
  [key: string]: unknown;
}

/**
 * Опции проекции.
 */
export interface ProjectOptions {
  /** Использовать catalogRefs (default: true) */
  useRefs?: boolean;
  /** Использовать теги узла (default: true) */
  useTags?: boolean;
  /** Режим тегов: "any" или "all" (default: "any") */
  tagMode?: "any" | "all";
}

/**
 * Операторы сравнения для фильтрации.
 */
export interface FilterOperators {
  /** Больше */
  $gt?: number;
  /** Больше или равно */
  $gte?: number;
  /** Меньше */
  $lt?: number;
  /** Меньше или равно */
  $lte?: number;
  /** Не равно */
  $ne?: unknown;
  /** Входит в список */
  $in?: unknown[];
  /** Не входит в список */
  $nin?: unknown[];
  /** Массив содержит значение */
  $contains?: unknown;
}

/**
 * Предикат фильтрации (объект атрибутов).
 */
export interface FilterPredicate {
  [attribute: string]: unknown | FilterOperators;
}

/**
 * Результат валидации.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Статистика каталога.
 */
export interface CatalogStats {
  entryCount: number;
  hasSchema: boolean;
}

/**
 * Статистика реестра каталогов.
 */
export interface CatalogRegistryStats {
  catalogCount: number;
  totalEntries: number;
  catalogs: {
    [catalogId: string]: CatalogStats;
  };
}

/**
 * Статистика движка операторов.
 */
export interface OperatorEngineStats {
  graphNodes: number;
  graphEdges: number;
  catalogs: CatalogRegistryStats;
}

/**
 * Опции загрузки каталогов.
 */
export interface CatalogLoaderOptions {
  /** Функция для синхронной загрузки файла */
  loadFile?: (path: string) => Catalog | null;
  /** Функция для асинхронной загрузки файла */
  loadFileAsync?: (path: string) => Promise<Catalog | null>;
  /** Базовый путь для относительных ссылок */
  basePath?: string;
}

/**
 * Реестр каталогов в файле catalogs.json.
 */
export interface CatalogsFile {
  /** Версия формата */
  version?: string;
  /** Описание */
  description?: string;
  /** Каталоги: inline или ссылки на файлы */
  catalogs: {
    [catalogId: string]: Catalog | string;
  };
}
