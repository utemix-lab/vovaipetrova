/**
 * @fileoverview Инструменты — не-сущности онтологии
 * 
 * Инструменты НЕ являются узлами онтологии. Это функциональные элементы,
 * которые взаимодействуют с онтологией, но не существуют в её пространстве.
 * 
 * Структура каталогов инструментов аналогична Query Mode:
 * - Pointer-теги для навигации
 * - Внутренняя категоризация
 * - Упаковка внешней информации в персональные структуры
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Tool abstraction", "Catalog structure"]
 * )
 */

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ ИНСТРУМЕНТОВ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Категории инструментов.
 * Каждая категория имеет свою структуру каталога.
 */
export const TOOL_CATEGORIES = [
  "practice",   // Практики — способы мышления и действия
  "mode",       // Режимы — состояния интерфейса (будущее)
  "filter",     // Фильтры — способы отбора информации (будущее)
  "lens",       // Линзы — способы просмотра графа (будущее)
] as const;

export type ToolCategory = typeof TOOL_CATEGORIES[number];

// ═══════════════════════════════════════════════════════════════════════════
// БАЗОВЫЙ ИНСТРУМЕНТ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Базовый интерфейс инструмента.
 */
export interface BaseTool {
  id: string;
  label: string;
  category: ToolCategory;
  /** Pointer-теги для навигации */
  tags: string[];
  /** Описание инструмента */
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ПРАКТИКИ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Практика — способ мышления или действия.
 * 
 * Практики связаны с доменами и персонажами через теги,
 * но не являются узлами графа.
 */
export interface Practice extends BaseTool {
  category: "practice";
  /** Связанные домены (по тегам) */
  relatedDomains?: string[];
}

/** Известные практики */
export const PRACTICE_IDS = [
  "practice-system-thinking",
  "practice-anti-taxonomy",
  "practice-research-thinking",
  "practice-direction",
  "practice-systems-design",
  "practice-architectural-design",
  "practice-visual-thinking",
  "practice-sound-thinking",
  "practice-interactive-thinking",
  "practice-branding",
  "practice-ecosystem-thinking",
  "practice-curation",
  "practice-reflection-fixation",
  "practice-possibility-navigation",
] as const;

export type PracticeId = typeof PRACTICE_IDS[number];

// ═══════════════════════════════════════════════════════════════════════════
// РЕЖИМЫ (БУДУЩЕЕ)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Режим — состояние интерфейса.
 * 
 * Примеры: query-mode, focus-mode, exploration-mode
 */
export interface Mode extends BaseTool {
  category: "mode";
  /** Активен ли режим по умолчанию */
  defaultActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ФИЛЬТРЫ (БУДУЩЕЕ)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Фильтр — способ отбора информации.
 * 
 * Примеры: по персонажу, по домену, по статусу
 */
export interface Filter extends BaseTool {
  category: "filter";
  /** Тип фильтруемых сущностей */
  targetType?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ЛИНЗЫ (БУДУЩЕЕ)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Линза — способ просмотра графа.
 * 
 * Примеры: структурная, временная, семантическая
 */
export interface Lens extends BaseTool {
  category: "lens";
  /** Какие связи показывает линза */
  visibleEdgeTypes?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCRIMINATED UNION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Объединение всех типов инструментов.
 */
export type AnyTool = Practice | Mode | Filter | Lens;

// ═══════════════════════════════════════════════════════════════════════════
// КАТАЛОГ ИНСТРУМЕНТОВ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Каталог инструментов — структура для хранения и навигации.
 * 
 * Аналогична Query Mode:
 * - Группировка по категориям
 * - Pointer-теги для быстрого доступа
 * - Внутренняя навигация
 */
export interface ToolCatalog {
  practices: Practice[];
  modes: Mode[];
  filters: Filter[];
  lenses: Lens[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

export function isPractice(tool: BaseTool): tool is Practice {
  return tool.category === "practice";
}

export function isMode(tool: BaseTool): tool is Mode {
  return tool.category === "mode";
}

export function isFilter(tool: BaseTool): tool is Filter {
  return tool.category === "filter";
}

export function isLens(tool: BaseTool): tool is Lens {
  return tool.category === "lens";
}

export function isToolCategory(category: string): category is ToolCategory {
  return TOOL_CATEGORIES.includes(category as ToolCategory);
}
