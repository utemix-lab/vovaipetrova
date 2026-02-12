/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IDENTITY TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.5: TypeScript для Core
 * 
 * Типы для формализации идентичности сущностей.
 * 
 * ИНВАРИАНТЫ:
 * - id — атом (неизменяемый)
 * - canonicalName — свойство сущности
 * - slug — производное
 * - displayName — проекция
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Метаданные идентичности.
 */
export interface IdentityMeta {
  /** Язык оригинала (ISO 639-1: "ru", "en", "ja") */
  lang?: string;
  /** Система письма ("Cyrl", "Latn", "Jpan") */
  script?: string;
  /** Имя в оригинальной графике */
  originalName?: string;
}

/**
 * Идентичность сущности.
 * 
 * @invariant id остаётся неизменным при смене canonicalName
 */
export interface EntityIdentity {
  /** Machine identity (неизменяемый) */
  readonly id: string;
  /** Онтологическое имя (основное) */
  canonicalName: string;
  /** Альтернативные имена (формат: "locale:Name" или просто "Name") */
  aliases: string[];
  /** Метаданные */
  meta: IdentityMeta;
}

/**
 * Локализованное имя для отображения.
 */
export interface LocalizedName {
  /** Отображаемое имя */
  name: string;
  /** Система письма */
  script?: string;
  /** Это оригинальное имя? */
  isOriginal?: boolean;
}

/**
 * Опции для создания идентичности.
 */
export interface CreateIdentityOptions {
  /** Альтернативные имена */
  aliases?: string[];
  /** Метаданные */
  meta?: IdentityMeta;
}

/**
 * Создать идентичность сущности.
 */
export function createIdentity(
  id: string,
  canonicalName: string,
  options?: CreateIdentityOptions
): EntityIdentity;

/**
 * Получить отображаемое имя для локали.
 */
export function getDisplayName(
  identity: EntityIdentity,
  locale?: string
): LocalizedName;

/**
 * Сгенерировать slug из canonicalName.
 */
export function generateSlug(identity: EntityIdentity): string;

/**
 * Проверить, что id неизменяем.
 */
export function validateIdImmutability(
  identity: EntityIdentity,
  newId: string
): boolean;

/**
 * Обновить canonicalName (id остаётся неизменным).
 */
export function updateCanonicalName(
  identity: EntityIdentity,
  newCanonicalName: string
): EntityIdentity;

/**
 * Добавить alias.
 */
export function addAlias(
  identity: EntityIdentity,
  alias: string
): EntityIdentity;

/**
 * Проверить, совпадает ли имя с любым из имён сущности.
 */
export function matchesName(
  identity: EntityIdentity,
  name: string
): boolean;

/**
 * Извлечь идентичность из данных узла.
 */
export function extractIdentityFromNode(nodeData: {
  id: string;
  canonicalName?: string;
  label?: string;
  aliases?: string[];
  meta?: IdentityMeta;
}): EntityIdentity;

/**
 * Сериализовать идентичность для JSON.
 */
export function serializeIdentity(identity: EntityIdentity): {
  id: string;
  canonicalName: string;
  aliases?: string[];
  meta?: IdentityMeta;
};
