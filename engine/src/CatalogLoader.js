/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CATALOG LOADER — Загрузчик каталогов из файлов
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * T3.1b: CatalogLoader
 * 
 * Загружает каталоги из JSON-файлов по структуре catalogs.json.
 * Поддерживает как inline каталоги, так и ссылки на файлы.
 * 
 * @see docs/OPERATORS_CONCEPT.md
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { CatalogValidator } from "./WorldInterface.js";

/**
 * Загрузчик каталогов из файловой системы или объектов.
 */
export class CatalogLoader {
  /**
   * Загружает каталоги из объекта реестра.
   * Поддерживает два формата:
   * 1. Inline: { catalogId: { id, entries: [...] } }
   * 2. Reference: { catalogId: "./path/to/catalog.json" }
   * 
   * @param {object} registry - Объект реестра каталогов
   * @param {object} options - Опции загрузки
   * @param {function} options.loadFile - Функция для загрузки файла (path) => object
   * @param {string} options.basePath - Базовый путь для относительных ссылок
   * @returns {object} - Объект каталогов { catalogId: catalog }
   */
  static load(registry, options = {}) {
    const { loadFile, basePath = "" } = options;
    const catalogs = {};
    
    if (!registry || typeof registry !== "object") {
      return catalogs;
    }
    
    // Если registry имеет поле catalogs, используем его
    const catalogsMap = registry.catalogs || registry;
    
    for (const [catalogId, value] of Object.entries(catalogsMap)) {
      // Пропускаем служебные поля
      if (catalogId.startsWith("$") || catalogId === "version" || catalogId === "description") {
        continue;
      }
      
      if (typeof value === "string") {
        // Ссылка на файл
        if (loadFile) {
          const path = CatalogLoader.resolvePath(value, basePath);
          const catalog = loadFile(path);
          if (catalog) {
            catalogs[catalogId] = catalog;
          }
        }
      } else if (typeof value === "object" && value !== null) {
        // Inline каталог
        catalogs[catalogId] = value;
      }
    }
    
    return catalogs;
  }
  
  /**
   * Асинхронно загружает каталоги из объекта реестра.
   * 
   * @param {object} registry - Объект реестра каталогов
   * @param {object} options - Опции загрузки
   * @param {function} options.loadFileAsync - Асинхронная функция для загрузки файла
   * @param {string} options.basePath - Базовый путь для относительных ссылок
   * @returns {Promise<object>} - Объект каталогов
   */
  static async loadAsync(registry, options = {}) {
    const { loadFileAsync, basePath = "" } = options;
    const catalogs = {};
    
    if (!registry || typeof registry !== "object") {
      return catalogs;
    }
    
    const catalogsMap = registry.catalogs || registry;
    const loadPromises = [];
    
    for (const [catalogId, value] of Object.entries(catalogsMap)) {
      if (catalogId.startsWith("$") || catalogId === "version" || catalogId === "description") {
        continue;
      }
      
      if (typeof value === "string") {
        if (loadFileAsync) {
          const path = CatalogLoader.resolvePath(value, basePath);
          loadPromises.push(
            loadFileAsync(path).then(catalog => {
              if (catalog) {
                catalogs[catalogId] = catalog;
              }
            }).catch(() => {
              // Игнорируем ошибки загрузки отдельных каталогов
            })
          );
        }
      } else if (typeof value === "object" && value !== null) {
        catalogs[catalogId] = value;
      }
    }
    
    await Promise.all(loadPromises);
    return catalogs;
  }
  
  /**
   * Разрешает относительный путь относительно базового.
   * 
   * @param {string} relativePath - Относительный путь (e.g., "./catalogs/tools.json")
   * @param {string} basePath - Базовый путь
   * @returns {string} - Разрешённый путь
   */
  static resolvePath(relativePath, basePath) {
    if (!relativePath) return "";
    
    // Если путь абсолютный, возвращаем как есть
    if (relativePath.startsWith("/") || /^[a-zA-Z]:/.test(relativePath)) {
      return relativePath;
    }
    
    // Убираем ./ в начале
    const cleanRelative = relativePath.replace(/^\.\//, "");
    
    // Если basePath пустой, возвращаем относительный путь
    if (!basePath) {
      return cleanRelative;
    }
    
    // Убираем trailing slash из basePath
    const cleanBase = basePath.replace(/[/\\]$/, "");
    
    // Объединяем пути
    return `${cleanBase}/${cleanRelative}`;
  }
  
  /**
   * Валидирует загруженные каталоги.
   * 
   * @param {object} catalogs - Объект каталогов
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  static validate(catalogs) {
    return CatalogValidator.validate(catalogs);
  }
  
  /**
   * Загружает и валидирует каталоги.
   * Выбрасывает ошибку, если каталоги невалидны.
   * 
   * @param {object} registry - Объект реестра
   * @param {object} options - Опции загрузки
   * @returns {object} - Валидные каталоги
   * @throws {Error} - Если каталоги невалидны
   */
  static loadAndValidate(registry, options = {}) {
    const catalogs = CatalogLoader.load(registry, options);
    const validation = CatalogLoader.validate(catalogs);
    
    if (!validation.valid) {
      throw new Error(`Invalid catalogs: ${validation.errors.join(", ")}`);
    }
    
    return catalogs;
  }
  
  /**
   * Создаёт функцию загрузки для Node.js fs.
   * 
   * @param {object} fs - Node.js fs module
   * @returns {function} - Функция загрузки (path) => object
   */
  static createNodeLoader(fs) {
    return (path) => {
      try {
        const content = fs.readFileSync(path, "utf-8");
        return JSON.parse(content);
      } catch {
        return null;
      }
    };
  }
  
  /**
   * Создаёт асинхронную функцию загрузки для Node.js fs/promises.
   * 
   * @param {object} fsPromises - Node.js fs/promises module
   * @returns {function} - Асинхронная функция загрузки
   */
  static createNodeLoaderAsync(fsPromises) {
    return async (path) => {
      try {
        const content = await fsPromises.readFile(path, "utf-8");
        return JSON.parse(content);
      } catch {
        return null;
      }
    };
  }
  
  /**
   * Создаёт функцию загрузки для браузера (fetch).
   * 
   * @returns {function} - Асинхронная функция загрузки
   */
  static createFetchLoader() {
    return async (path) => {
      try {
        const response = await fetch(path);
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    };
  }
}

export default CatalogLoader;
