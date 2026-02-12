/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HIGHLIGHT TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.5: TypeScript для Core
 * 
 * Типы для системы подсветки.
 * 
 * ПРИОРИТЕТ РЕЖИМОВ:
 * scope > hover > type > selected > none
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Режим подсветки.
 */
export type HighlightMode = "none" | "selected" | "hover" | "scope" | "type";

/**
 * Интенсивность подсветки.
 */
export interface IntensityConstants {
  /** Полная подсветка */
  readonly FULL: 1;
  /** Половинная подсветка */
  readonly HALF: 0.5;
  /** Приглушённая подсветка */
  readonly DIM: 0.2;
  /** Без подсветки */
  readonly NONE: 0;
}

/**
 * Константы интенсивности.
 */
export declare const INTENSITY: IntensityConstants;

/**
 * Контекст для вычисления подсветки.
 * 
 * @invariant Не мутируется функцией computeHighlight
 */
export interface HighlightContext {
  /** Текущий режим */
  readonly mode: HighlightMode;
  /** ID выбранного узла */
  readonly selectedNodeId: string | null;
  /** ID узла под курсором */
  readonly hoveredNodeId: string | null;
  /** Активен ли scope highlight */
  readonly scopeActive: boolean;
  /** ID узлов в scope */
  readonly scopeNodeIds: ReadonlySet<string>;
  /** Активен ли type highlight */
  readonly typeActive: boolean;
  /** ID узлов текущего типа */
  readonly typeNodeIds: ReadonlySet<string>;
}

/**
 * Интенсивность узла.
 */
export interface NodeIntensity {
  /** Интенсивность (0-1) */
  intensity: number;
  /** Режим, определивший интенсивность */
  mode: HighlightMode;
}

/**
 * Интенсивность ребра.
 */
export interface EdgeIntensity {
  /** Интенсивность (0-1) */
  intensity: number;
  /** Режим, определивший интенсивность */
  mode: HighlightMode;
}

/**
 * Результат вычисления подсветки.
 * 
 * @invariant Новый объект при каждом вызове (purity)
 */
export interface HighlightState {
  /** Интенсивности узлов: nodeId → NodeIntensity */
  readonly nodes: ReadonlyMap<string, NodeIntensity>;
  /** Интенсивности рёбер: edgeKey → EdgeIntensity */
  readonly edges: ReadonlyMap<string, EdgeIntensity>;
  /** Текущий режим */
  readonly mode: HighlightMode;
}

/**
 * Данные графа для вычисления подсветки.
 */
export interface HighlightGraphData {
  /** Узлы графа */
  readonly nodes: ReadonlyArray<{ readonly id: string; readonly type?: string }>;
  /** Рёбра графа */
  readonly edges: ReadonlyArray<{ readonly source: string; readonly target: string }>;
}

/**
 * Вычислить состояние подсветки.
 * 
 * @pure Не мутирует входные данные
 * @deterministic Одинаковый вход → одинаковый выход
 */
export function computeHighlight(
  context: HighlightContext,
  graph: HighlightGraphData
): HighlightState;

/**
 * Создать контекст из состояния.
 */
export function createContextFromState(state: {
  mode?: HighlightMode;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  scopeActive?: boolean;
  scopeNodeIds?: Set<string> | ReadonlySet<string>;
  typeActive?: boolean;
  typeNodeIds?: Set<string> | ReadonlySet<string>;
}): HighlightContext;

/**
 * Создать пустой контекст.
 */
export function createEmptyContext(): HighlightContext;
