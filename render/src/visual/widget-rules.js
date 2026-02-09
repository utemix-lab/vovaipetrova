/**
 * Widget Rules — машинные правила поведения виджетов
 * 
 * Источник: UI_RULES.md
 * 
 * Правила:
 * - Root-виджет (текущий узел, тупиковый) показывает авторский лого сразу
 * - Lever-виджеты (кликабельные, ведут куда-то) показывают групповой лого,
 *   подменяют на авторский при hover
 * - Static-виджеты (некликабельные) показывают групповой лого без подмены
 * 
 * TODO: Сейчас для всех авторских лого используется одна заглушка (author-plug.png).
 * В будущем у каждого виджета будет свой уникальный авторский лого.
 */

import { ARCHITECTURE } from "../architecture/dna.ts";

void ARCHITECTURE;

export const WIDGET_RULES = {
  // Корневой виджет — мы уже на этой странице
  root: {
    emblem: "author",           // Сразу авторский лого
    filter: "none",             // Цветной сразу
    clickable: false,           // Некликабельный (тупиковый)
    hoverSwap: false            // Без подмены при hover
  },
  
  // Lever-виджет — ведёт на другую страницу
  lever: {
    emblem: "group",            // Групповой лого по умолчанию
    filter: "grayscale",        // Серый по умолчанию
    clickable: true,            // Кликабельный
    hoverSwap: true             // Подмена на авторский при hover
  },
  
  // Static-виджет — информационный, некликабельный
  static: {
    emblem: "group",            // Групповой лого
    filter: "grayscale",        // Серый
    clickable: false,           // Некликабельный
    hoverSwap: false            // Без подмены
  }
};

/**
 * Определяет тип виджета по контексту
 * @param {Object} options
 * @param {boolean} options.isCurrentNode - это текущий узел (мы здесь)
 * @param {boolean} options.isClickable - виджет кликабельный
 * @returns {string} - "root" | "lever" | "static"
 */
export function getWidgetType({ isCurrentNode = false, isClickable = false }) {
  if (isCurrentNode) return "root";
  if (isClickable) return "lever";
  return "static";
}

/**
 * Возвращает правила для виджета
 * @param {string} type - "root" | "lever" | "static"
 * @returns {Object} - правила виджета
 */
export function getWidgetRules(type) {
  return WIDGET_RULES[type] || WIDGET_RULES.static;
}
