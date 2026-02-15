/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPERATOR ENGINE — Epistemic Operators (Track 3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.0c: OperatorEngine
 * 
 * Операторы — это способы работы со знанием, а не само знание.
 * Они не создают узлы графа, а порождают временные взгляды.
 * 
 * Ключевые свойства:
 * 1. Не меняют граф (инвариантность)
 * 2. Композируемы (можно строить цепочки)
 * 3. Зависят от контекста (разные персонажи → разные результаты)
 * 
 * @see docs/OPERATORS_CONCEPT.md
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { CatalogRegistry } from "./CatalogRegistry.js";

/**
 * Движок эпистемических операторов.
 * Связывает граф с каталогами через операторы.
 */
export class OperatorEngine {
  /**
   * @param {object} graph - Граф (должен иметь getNodeById, getNodes, getEdges)
   * @param {CatalogRegistry} catalogRegistry - Реестр каталогов
   */
  constructor(graph, catalogRegistry) {
    if (!graph) {
      throw new Error("OperatorEngine requires a graph");
    }
    if (!catalogRegistry) {
      throw new Error("OperatorEngine requires a CatalogRegistry");
    }
    
    this._graph = graph;
    this._catalogs = catalogRegistry;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT — Спроецировать каталог через узел
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проецирует каталог через узел графа.
   * Возвращает записи каталога, связанные с узлом через catalogRefs или теги.
   * 
   * @param {string} nodeId - ID узла графа
   * @param {string} catalogId - ID каталога
   * @param {object} options - Опции проекции
   * @param {boolean} options.useRefs - Использовать catalogRefs (default: true)
   * @param {boolean} options.useTags - Использовать теги узла (default: true)
   * @param {string} options.tagMode - Режим тегов: "any" или "all" (default: "any")
   * @returns {object[]} - Записи каталога
   */
  project(nodeId, catalogId, options = {}) {
    const { useRefs = true, useTags = true, tagMode = "any" } = options;
    
    const node = this._graph.getNodeById(nodeId);
    if (!node) {
      return [];
    }
    
    if (!this._catalogs.has(catalogId)) {
      return [];
    }
    
    const results = new Set();
    
    // 1. По catalogRefs
    if (useRefs) {
      const refs = node.catalogRefs?.[catalogId] || [];
      const refEntries = this._catalogs.getEntriesByIds(catalogId, refs);
      refEntries.forEach(e => results.add(e));
    }
    
    // 2. По тегам узла
    if (useTags) {
      const nodeTags = this._extractTags(node);
      if (nodeTags.length > 0) {
        const tagEntries = this._catalogs.filterByTags(catalogId, nodeTags, tagMode);
        tagEntries.forEach(e => results.add(e));
      }
    }
    
    return [...results];
  }
  
  /**
   * Извлекает теги из узла.
   * Поддерживает форматы: tags: [], pointerTags: [], и cap:* теги.
   * @private
   */
  _extractTags(node) {
    const tags = [];
    
    // Прямые теги
    if (Array.isArray(node.tags)) {
      tags.push(...node.tags);
    }
    
    // Pointer-tags (cap:X → X)
    if (Array.isArray(node.pointerTags)) {
      for (const pt of node.pointerTags) {
        if (pt.startsWith("cap:")) {
          tags.push(pt.slice(4)); // "cap:lipsync" → "lipsync"
        } else {
          tags.push(pt);
        }
      }
    }
    
    return tags;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER — Отфильтровать записи
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Фильтрует записи по предикату.
   * 
   * @param {object[]} entries - Записи для фильтрации
   * @param {function|object} predicate - Функция или объект атрибутов
   * @returns {object[]}
   */
  filter(entries, predicate) {
    if (typeof predicate === "function") {
      return entries.filter(predicate);
    }
    
    // Объект атрибутов
    return entries.filter(entry => {
      for (const [key, value] of Object.entries(predicate)) {
        // Поддержка операторов сравнения
        if (typeof value === "object" && value !== null) {
          if ("$gt" in value && !(entry[key] > value.$gt)) return false;
          if ("$gte" in value && !(entry[key] >= value.$gte)) return false;
          if ("$lt" in value && !(entry[key] < value.$lt)) return false;
          if ("$lte" in value && !(entry[key] <= value.$lte)) return false;
          if ("$ne" in value && entry[key] === value.$ne) return false;
          if ("$in" in value && !value.$in.includes(entry[key])) return false;
          if ("$nin" in value && value.$nin.includes(entry[key])) return false;
          if ("$contains" in value) {
            if (!Array.isArray(entry[key]) || !entry[key].includes(value.$contains)) return false;
          }
        } else {
          // Простое равенство
          if (Array.isArray(entry[key])) {
            if (!entry[key].includes(value)) return false;
          } else if (entry[key] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPAND — Развернуть связи узла
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Разворачивает связи узла на указанную глубину.
   * 
   * @param {string} nodeId - ID узла
   * @param {number} depth - Глубина (default: 1)
   * @returns {string[]} - ID связанных узлов
   */
  expand(nodeId, depth = 1) {
    if (depth < 1) return [];
    
    const visited = new Set();
    const queue = [{ id: nodeId, d: 0 }];
    
    while (queue.length > 0) {
      const { id, d } = queue.shift();
      
      if (visited.has(id)) continue;
      if (d > 0) visited.add(id); // Не включаем исходный узел
      
      if (d < depth) {
        const neighbors = this._getNeighborIds(id);
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            queue.push({ id: neighborId, d: d + 1 });
          }
        }
      }
    }
    
    return [...visited];
  }
  
  /**
   * Получает ID соседних узлов.
   * @private
   */
  _getNeighborIds(nodeId) {
    const edges = this._graph.getEdges();
    const neighborIds = new Set();
    
    for (const edge of edges) {
      if (edge.source === nodeId) {
        neighborIds.add(edge.target);
      } else if (edge.target === nodeId) {
        neighborIds.add(edge.source);
      }
    }
    
    return [...neighborIds];
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTERSECT — Пересечение результатов
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает пересечение двух наборов записей.
   * 
   * @param {object[]} entries1 - Первый набор
   * @param {object[]} entries2 - Второй набор
   * @returns {object[]}
   */
  intersect(entries1, entries2) {
    const ids2 = new Set(entries2.map(e => e.id));
    return entries1.filter(e => ids2.has(e.id));
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UNION — Объединение результатов
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает объединение двух наборов записей (без дубликатов).
   * 
   * @param {object[]} entries1 - Первый набор
   * @param {object[]} entries2 - Второй набор
   * @returns {object[]}
   */
  union(entries1, entries2) {
    const seen = new Set();
    const result = [];
    
    for (const e of [...entries1, ...entries2]) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        result.push(e);
      }
    }
    
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPOSE — Композиция операторов
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Проецирует и фильтрует за один вызов.
   * 
   * @param {string} nodeId - ID узла
   * @param {string} catalogId - ID каталога
   * @param {function|object} predicate - Фильтр
   * @param {object} projectOptions - Опции проекции
   * @returns {object[]}
   */
  projectAndFilter(nodeId, catalogId, predicate, projectOptions = {}) {
    const projected = this.project(nodeId, catalogId, projectOptions);
    return this.filter(projected, predicate);
  }
  
  /**
   * Проецирует через несколько узлов и объединяет результаты.
   * 
   * @param {string[]} nodeIds - ID узлов
   * @param {string} catalogId - ID каталога
   * @param {object} projectOptions - Опции проекции
   * @returns {object[]}
   */
  projectMultiple(nodeIds, catalogId, projectOptions = {}) {
    let result = [];
    
    for (const nodeId of nodeIds) {
      const projected = this.project(nodeId, catalogId, projectOptions);
      result = this.union(result, projected);
    }
    
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Возвращает статистику движка.
   * @returns {object}
   */
  getStats() {
    return {
      graphNodes: this._graph.getNodes().length,
      graphEdges: this._graph.getEdges().length,
      catalogs: this._catalogs.getStats(),
    };
  }
  
  /**
   * Возвращает реестр каталогов.
   * @returns {CatalogRegistry}
   */
  getCatalogs() {
    return this._catalogs;
  }
  
  /**
   * Возвращает граф.
   * @returns {object}
   */
  getGraph() {
    return this._graph;
  }
}

export default OperatorEngine;
