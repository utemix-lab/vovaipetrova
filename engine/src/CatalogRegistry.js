/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CATALOG REGISTRY — Реестр каталогов для Epistemic Operators
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.0b: CatalogRegistry
 * 
 * Каталоги — это внешние данные, живущие вне графа.
 * Они связаны с графом через catalogRefs в узлах.
 * 
 * @see docs/OPERATORS_CONCEPT.md
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { CatalogValidator } from "./WorldInterface.js";

/**
 * Реестр каталогов.
 * Загружает, индексирует и предоставляет доступ к каталогам мира.
 */
export class CatalogRegistry {
  /**
   * @param {object} catalogs - Объект каталогов { catalogId: catalog }
   */
  constructor(catalogs = {}) {
    this._catalogs = new Map();
    this._entryIndex = new Map(); // catalogId -> Map<entryId, entry>
    
    if (catalogs) {
      this.loadAll(catalogs);
    }
  }
  
  /**
   * Загружает все каталоги из объекта.
   * @param {object} catalogs - Объект каталогов
   * @returns {this}
   */
  loadAll(catalogs) {
    const validation = CatalogValidator.validate(catalogs);
    if (!validation.valid) {
      throw new Error(`Invalid catalogs: ${validation.errors.join(", ")}`);
    }
    
    for (const [catalogId, catalog] of Object.entries(catalogs)) {
      this.load(catalogId, catalog);
    }
    
    return this;
  }
  
  /**
   * Загружает один каталог.
   * @param {string} catalogId - ID каталога
   * @param {object} catalog - Каталог
   * @returns {this}
   */
  load(catalogId, catalog) {
    const errors = CatalogValidator.validateCatalog(catalogId, catalog);
    if (errors.length > 0) {
      throw new Error(`Invalid catalog "${catalogId}": ${errors.join(", ")}`);
    }
    
    this._catalogs.set(catalogId, catalog);
    
    // Индексируем записи
    const entryIndex = new Map();
    for (const entry of catalog.entries) {
      entryIndex.set(entry.id, entry);
    }
    this._entryIndex.set(catalogId, entryIndex);
    
    return this;
  }
  
  /**
   * Проверяет, существует ли каталог.
   * @param {string} catalogId - ID каталога
   * @returns {boolean}
   */
  has(catalogId) {
    return this._catalogs.has(catalogId);
  }
  
  /**
   * Возвращает каталог по ID.
   * @param {string} catalogId - ID каталога
   * @returns {object|null}
   */
  get(catalogId) {
    return this._catalogs.get(catalogId) || null;
  }
  
  /**
   * Возвращает все записи каталога.
   * @param {string} catalogId - ID каталога
   * @returns {object[]}
   */
  getEntries(catalogId) {
    const catalog = this._catalogs.get(catalogId);
    return catalog ? [...catalog.entries] : [];
  }
  
  /**
   * Возвращает запись по ID.
   * @param {string} catalogId - ID каталога
   * @param {string} entryId - ID записи
   * @returns {object|null}
   */
  getEntry(catalogId, entryId) {
    const index = this._entryIndex.get(catalogId);
    return index ? index.get(entryId) || null : null;
  }
  
  /**
   * Возвращает записи по списку ID.
   * @param {string} catalogId - ID каталога
   * @param {string[]} entryIds - Список ID записей
   * @returns {object[]}
   */
  getEntriesByIds(catalogId, entryIds) {
    const index = this._entryIndex.get(catalogId);
    if (!index) return [];
    
    return entryIds
      .map(id => index.get(id))
      .filter(entry => entry !== undefined);
  }
  
  /**
   * Фильтрует записи каталога по предикату.
   * @param {string} catalogId - ID каталога
   * @param {function} predicate - Функция-предикат (entry) => boolean
   * @returns {object[]}
   */
  filter(catalogId, predicate) {
    const entries = this.getEntries(catalogId);
    return entries.filter(predicate);
  }
  
  /**
   * Фильтрует записи по атрибутам.
   * @param {string} catalogId - ID каталога
   * @param {object} attrs - Атрибуты для фильтрации { key: value }
   * @returns {object[]}
   */
  filterByAttrs(catalogId, attrs) {
    return this.filter(catalogId, entry => {
      for (const [key, value] of Object.entries(attrs)) {
        if (Array.isArray(entry[key])) {
          // Если атрибут — массив, проверяем включение
          if (!entry[key].includes(value)) return false;
        } else if (entry[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }
  
  /**
   * Фильтрует записи по тегам.
   * @param {string} catalogId - ID каталога
   * @param {string[]} tags - Теги для фильтрации
   * @param {string} mode - Режим: "any" (хотя бы один) или "all" (все)
   * @returns {object[]}
   */
  filterByTags(catalogId, tags, mode = "any") {
    return this.filter(catalogId, entry => {
      const entryTags = entry.tags || [];
      if (mode === "all") {
        return tags.every(tag => entryTags.includes(tag));
      }
      return tags.some(tag => entryTags.includes(tag));
    });
  }
  
  /**
   * Возвращает список ID всех каталогов.
   * @returns {string[]}
   */
  getCatalogIds() {
    return [...this._catalogs.keys()];
  }
  
  /**
   * Возвращает количество каталогов.
   * @returns {number}
   */
  get size() {
    return this._catalogs.size;
  }
  
  /**
   * Возвращает статистику реестра.
   * @returns {object}
   */
  getStats() {
    const stats = {
      catalogCount: this._catalogs.size,
      catalogs: {},
      totalEntries: 0,
    };
    
    for (const [catalogId, catalog] of this._catalogs) {
      const entryCount = catalog.entries.length;
      stats.catalogs[catalogId] = {
        entryCount,
        hasSchema: !!catalog.schema,
      };
      stats.totalEntries += entryCount;
    }
    
    return stats;
  }
  
  /**
   * Очищает реестр.
   */
  clear() {
    this._catalogs.clear();
    this._entryIndex.clear();
  }
  
  /**
   * Создаёт реестр из объекта каталогов.
   * @param {object} catalogs - Объект каталогов
   * @returns {CatalogRegistry}
   */
  static fromObject(catalogs) {
    return new CatalogRegistry(catalogs);
  }
}

export default CatalogRegistry;
