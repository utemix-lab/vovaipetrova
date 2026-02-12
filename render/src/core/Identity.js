/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IDENTITY — Формализация идентичности сущностей
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.5a: Identity & Naming Formalization
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - id — machine identity (неизменяемый)
 * - canonicalName — онтологическое имя
 * - aliases — альтернативные имена
 * - meta — язык, графика, локализация
 * - displayName — производное, вычисляется Projection
 * 
 * ИНВАРИАНТЫ:
 * - Projection не хранит имя — только отображает
 * - UI не хранит canonicalName — получает из Core
 * - slug не является идентичностью — производное от canonicalName
 * - id остаётся неизменным при смене canonicalName
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * @typedef {Object} IdentityMeta
 * @property {string} [lang] - Язык оригинала (ISO 639-1: "ru", "en", "ja")
 * @property {string} [script] - Система письма ("Cyrl", "Latn", "Jpan")
 * @property {string} [originalName] - Имя в оригинальной графике
 */

/**
 * @typedef {Object} EntityIdentity
 * @property {string} id - Machine identity (неизменяемый)
 * @property {string} canonicalName - Онтологическое имя (основное)
 * @property {Array<string>} [aliases] - Альтернативные имена
 * @property {IdentityMeta} [meta] - Метаданные
 */

/**
 * @typedef {Object} LocalizedName
 * @property {string} name - Отображаемое имя
 * @property {string} [script] - Система письма
 * @property {boolean} [isOriginal] - Это оригинальное имя?
 */

/**
 * Создать идентичность сущности.
 * @param {string} id - Machine identity
 * @param {string} canonicalName - Онтологическое имя
 * @param {Object} [options] - Дополнительные опции
 * @param {Array<string>} [options.aliases] - Альтернативные имена
 * @param {IdentityMeta} [options.meta] - Метаданные
 * @returns {EntityIdentity}
 */
export function createIdentity(id, canonicalName, options = {}) {
  if (!id || typeof id !== "string") {
    throw new Error("Identity: id is required and must be a string");
  }
  if (!canonicalName || typeof canonicalName !== "string") {
    throw new Error("Identity: canonicalName is required and must be a string");
  }
  
  return {
    id,
    canonicalName,
    aliases: options.aliases || [],
    meta: options.meta || {}
  };
}

/**
 * Получить отображаемое имя для локали.
 * 
 * Приоритет:
 * 1. Если locale совпадает с meta.lang — canonicalName
 * 2. Если есть alias для locale — alias
 * 3. Иначе — canonicalName
 * 
 * @param {EntityIdentity} identity
 * @param {string} [locale="en"] - Локаль (ISO 639-1)
 * @returns {LocalizedName}
 */
export function getDisplayName(identity, locale = "en") {
  const meta = identity.meta || {};
  const isOriginal = meta.lang === locale;
  
  // Если локаль совпадает с оригиналом
  if (isOriginal && meta.originalName) {
    return {
      name: meta.originalName,
      script: meta.script,
      isOriginal: true
    };
  }
  
  // Поиск alias для локали (формат: "en:English Name")
  const aliasPrefix = `${locale}:`;
  const localizedAlias = (identity.aliases || []).find(a => a.startsWith(aliasPrefix));
  if (localizedAlias) {
    return {
      name: localizedAlias.slice(aliasPrefix.length),
      script: locale === "ru" ? "Cyrl" : locale === "ja" ? "Jpan" : "Latn",
      isOriginal: false
    };
  }
  
  // По умолчанию — canonicalName
  return {
    name: identity.canonicalName,
    script: meta.script || "Latn",
    isOriginal: meta.lang === locale
  };
}

/**
 * Сгенерировать slug из canonicalName.
 * 
 * Slug — производное, не является идентичностью.
 * 
 * @param {EntityIdentity} identity
 * @returns {string}
 */
export function generateSlug(identity) {
  return identity.canonicalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Проверить, что id неизменяем.
 * 
 * @param {EntityIdentity} identity
 * @param {string} newId
 * @returns {boolean} - true если id совпадает
 */
export function validateIdImmutability(identity, newId) {
  return identity.id === newId;
}

/**
 * Обновить canonicalName (id остаётся неизменным).
 * 
 * @param {EntityIdentity} identity
 * @param {string} newCanonicalName
 * @returns {EntityIdentity} - Новая идентичность с тем же id
 */
export function updateCanonicalName(identity, newCanonicalName) {
  return {
    ...identity,
    canonicalName: newCanonicalName
  };
}

/**
 * Добавить alias.
 * 
 * @param {EntityIdentity} identity
 * @param {string} alias
 * @returns {EntityIdentity}
 */
export function addAlias(identity, alias) {
  if (identity.aliases.includes(alias)) {
    return identity;
  }
  return {
    ...identity,
    aliases: [...identity.aliases, alias]
  };
}

/**
 * Проверить, совпадает ли имя с любым из имён сущности.
 * 
 * @param {EntityIdentity} identity
 * @param {string} name
 * @returns {boolean}
 */
export function matchesName(identity, name) {
  const lowerName = name.toLowerCase();
  
  // Проверить canonicalName
  if (identity.canonicalName.toLowerCase() === lowerName) {
    return true;
  }
  
  // Проверить aliases
  for (const alias of identity.aliases || []) {
    // Убрать префикс локали если есть
    const aliasName = alias.includes(":") ? alias.split(":")[1] : alias;
    if (aliasName.toLowerCase() === lowerName) {
      return true;
    }
  }
  
  // Проверить originalName
  if (identity.meta?.originalName?.toLowerCase() === lowerName) {
    return true;
  }
  
  return false;
}

/**
 * Извлечь идентичность из данных узла.
 * 
 * @param {Object} nodeData - Данные узла из universe.json
 * @returns {EntityIdentity}
 */
export function extractIdentityFromNode(nodeData) {
  return createIdentity(
    nodeData.id,
    nodeData.canonicalName || nodeData.label || nodeData.id,
    {
      aliases: nodeData.aliases || [],
      meta: nodeData.meta || {}
    }
  );
}

/**
 * Сериализовать идентичность для JSON.
 * 
 * @param {EntityIdentity} identity
 * @returns {Object}
 */
export function serializeIdentity(identity) {
  return {
    id: identity.id,
    canonicalName: identity.canonicalName,
    aliases: identity.aliases.length > 0 ? identity.aliases : undefined,
    meta: Object.keys(identity.meta).length > 0 ? identity.meta : undefined
  };
}
