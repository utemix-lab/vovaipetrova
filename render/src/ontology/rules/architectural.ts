/**
 * @fileoverview Архитектурные правила системы
 * 
 * Декларативные правила, определяющие как онтология отображается в код:
 * - Каждый тип узла → свой компонент/шаблон
 * - Каждый тип связи → своя визуализация
 * - Каждая категория инструментов → свой каталог
 * 
 * Эти правила — контракт между онтологией и реализацией.
 * Код должен следовать этим правилам, не наоборот.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Declarative rules", "Code follows ontology"]
 * )
 */

import type { OntologyNodeType, EdgeType } from "../schema";
import type { ToolCategory } from "../schema/tools";

// ═══════════════════════════════════════════════════════════════════════════
// ПРАВИЛА ОТОБРАЖЕНИЯ УЗЛОВ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Правило отображения типа узла в UI.
 */
export interface NodeTypeRule {
  type: OntologyNodeType;
  /** Имя шаблона страницы */
  pageTemplate: string;
  /** Функция рендеринга (имя в visitor.js) */
  renderFunction: string;
  /** Есть ли виджет для этого типа */
  hasWidget: boolean;
  /** Размер узла в графе (множитель) */
  sizeMultiplier: number;
  /** Может ли быть корневым виджетом на странице */
  canBeRootWidget: boolean;
}

/**
 * Правила для всех типов узлов онтологии.
 * Один тип = один шаблон = одна функция рендеринга.
 */
export const NODE_TYPE_RULES: Record<OntologyNodeType, NodeTypeRule> = {
  root: {
    type: "root",
    pageTemplate: "root",
    renderFunction: "updateStoryWithRoot",
    hasWidget: false,
    sizeMultiplier: 4,
    canBeRootWidget: false,
  },
  hub: {
    type: "hub",
    pageTemplate: "hub",
    renderFunction: "updateStoryWithHub",
    hasWidget: false,
    sizeMultiplier: 4,
    canBeRootWidget: false,
  },
  character: {
    type: "character",
    pageTemplate: "character",
    renderFunction: "updateStoryWithPotential",
    hasWidget: true,
    sizeMultiplier: 2.5,
    canBeRootWidget: true,
  },
  domain: {
    type: "domain",
    pageTemplate: "domain",
    renderFunction: "updateStoryWithDomainFocus",
    hasWidget: true,
    sizeMultiplier: 1.5,
    canBeRootWidget: true,
  },
  workbench: {
    type: "workbench",
    pageTemplate: "workbench",
    renderFunction: "updateStoryWithWorkbench",
    hasWidget: true,
    sizeMultiplier: 1,
    canBeRootWidget: true,
  },
  collab: {
    type: "collab",
    pageTemplate: "collab",
    renderFunction: "updateStoryWithCollab",
    hasWidget: true,
    sizeMultiplier: 1,
    canBeRootWidget: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ПРАВИЛА ОТОБРАЖЕНИЯ СВЯЗЕЙ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Правило отображения типа связи.
 */
export interface EdgeTypeRule {
  type: EdgeType;
  /** Базовая прозрачность линии */
  baseOpacity: number;
  /** Базовая толщина линии */
  baseWidth: number;
  /** Показывать частицы на линии */
  showParticles: boolean;
  /** Цвет линии (CSS) */
  color: string;
}

/**
 * Правила для всех типов связей.
 */
export const EDGE_TYPE_RULES: Record<EdgeType, EdgeTypeRule> = {
  structural: {
    type: "structural",
    baseOpacity: 0.5,
    baseWidth: 1.2,
    showParticles: false,
    color: "rgba(255, 255, 255, 0.5)",
  },
  contains: {
    type: "contains",
    baseOpacity: 0.35,
    baseWidth: 0.8,
    showParticles: false,
    color: "rgba(255, 255, 255, 0.35)",
  },
  relates: {
    type: "relates",
    baseOpacity: 0.35,
    baseWidth: 0.6,
    showParticles: false,
    color: "rgba(255, 255, 255, 0.35)",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ПРАВИЛА ДЛЯ ИНСТРУМЕНТОВ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Правило для категории инструментов.
 */
export interface ToolCategoryRule {
  category: ToolCategory;
  /** Путь к каталогу данных */
  catalogPath: string;
  /** Имя файла каталога */
  catalogFile: string;
  /** Показывать в Query Mode */
  showInQueryMode: boolean;
  /** Иконка категории */
  icon?: string;
}

/**
 * Правила для категорий инструментов.
 */
export const TOOL_CATEGORY_RULES: Record<ToolCategory, ToolCategoryRule> = {
  practice: {
    category: "practice",
    catalogPath: "graph/tools",
    catalogFile: "practices.json",
    showInQueryMode: true,
    icon: "practice",
  },
  mode: {
    category: "mode",
    catalogPath: "graph/tools",
    catalogFile: "modes.json",
    showInQueryMode: false,
  },
  filter: {
    category: "filter",
    catalogPath: "graph/tools",
    catalogFile: "filters.json",
    showInQueryMode: false,
  },
  lens: {
    category: "lens",
    catalogPath: "graph/tools",
    catalogFile: "lenses.json",
    showInQueryMode: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Получить правило для типа узла.
 */
export function getNodeTypeRule(type: OntologyNodeType): NodeTypeRule {
  return NODE_TYPE_RULES[type];
}

/**
 * Получить правило для типа связи.
 */
export function getEdgeTypeRule(type: EdgeType): EdgeTypeRule {
  return EDGE_TYPE_RULES[type];
}

/**
 * Получить правило для категории инструментов.
 */
export function getToolCategoryRule(category: ToolCategory): ToolCategoryRule {
  return TOOL_CATEGORY_RULES[category];
}

/**
 * Получить все типы узлов с виджетами.
 */
export function getWidgetNodeTypes(): OntologyNodeType[] {
  return Object.values(NODE_TYPE_RULES)
    .filter((rule) => rule.hasWidget)
    .map((rule) => rule.type);
}

/**
 * Получить все типы узлов, которые могут быть корневым виджетом.
 */
export function getRootWidgetNodeTypes(): OntologyNodeType[] {
  return Object.values(NODE_TYPE_RULES)
    .filter((rule) => rule.canBeRootWidget)
    .map((rule) => rule.type);
}
