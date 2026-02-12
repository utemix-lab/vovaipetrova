/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORLD SCHEMA LOADER — Загрузчик схемы мира
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P5.0c.2: Thin-wrapper для загрузки схемы из world config
 * 
 * Этот модуль загружает схему из worlds/vovaipetrova/schema.json
 * и преобразует её в формат, совместимый со старым CanonicalGraphSchema API.
 * 
 * ВАЖНО: Это временный адаптер для обратной совместимости.
 * После полной миграции CanonicalGraphSchema будет удалён.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import worldSchema from "../../../worlds/vovaipetrova/schema.json";

/**
 * Преобразует массив nodeTypes в объект NODE_TYPES.
 * @param {Array} nodeTypes - Массив определений типов узлов
 * @returns {Object} - Объект { ROOT: "root", HUB: "hub", ... }
 */
function buildNodeTypesEnum(nodeTypes) {
  const result = {};
  for (const nt of nodeTypes) {
    const key = nt.id.toUpperCase();
    result[key] = nt.id;
  }
  return Object.freeze(result);
}

/**
 * Преобразует массив nodeTypes в объект NODE_TYPE_META.
 * @param {Array} nodeTypes - Массив определений типов узлов
 * @param {Object} nodeTypesEnum - Объект NODE_TYPES
 * @returns {Object} - Объект метаданных по типам
 */
function buildNodeTypeMeta(nodeTypes, nodeTypesEnum) {
  const result = {};
  for (const nt of nodeTypes) {
    result[nt.id] = {
      description: nt.description || "",
      abstraction: nt.abstraction || "low",
      role: nt.role || "content",
      allowedChildren: (nt.allowedChildren || []).map(c => c),
      requiredFields: nt.requiredFields || ["id", "label", "type"],
      optionalFields: nt.optionalFields || [],
    };
  }
  return Object.freeze(result);
}

/**
 * Преобразует массив edgeTypes в объект EDGE_TYPES.
 * @param {Array} edgeTypes - Массив определений типов рёбер
 * @returns {Object} - Объект { STRUCTURAL: "structural", ... }
 */
function buildEdgeTypesEnum(edgeTypes) {
  const result = {};
  for (const et of edgeTypes) {
    const key = et.id.toUpperCase();
    result[key] = et.id;
  }
  return Object.freeze(result);
}

/**
 * Преобразует массив edgeTypes в объект EDGE_TYPE_META.
 * @param {Array} edgeTypes - Массив определений типов рёбер
 * @returns {Object} - Объект метаданных по типам
 */
function buildEdgeTypeMeta(edgeTypes) {
  const result = {};
  for (const et of edgeTypes) {
    result[et.id] = {
      description: et.description || "",
      directed: et.directed !== false,
      allowedSourceTypes: et.allowedSourceTypes || [],
      allowedTargetTypes: et.allowedTargetTypes || [],
      requiredFields: ["id", "source", "target", "type"],
    };
  }
  return Object.freeze(result);
}

/**
 * Преобразует массив в enum-объект.
 * @param {Array} values - Массив значений
 * @returns {Object} - Объект { VALUE: "value", ... }
 */
function buildEnumFromArray(values) {
  const result = {};
  for (const v of values) {
    const key = v.toUpperCase();
    result[key] = v;
  }
  return Object.freeze(result);
}

// ═══════════════════════════════════════════════════════════════════════════
// ЗАГРУЗКА И ПРЕОБРАЗОВАНИЕ
// ═══════════════════════════════════════════════════════════════════════════

/** @type {Object} NODE_TYPES enum из world schema */
export const NODE_TYPES = buildNodeTypesEnum(worldSchema.nodeTypes || []);

/** @type {Object} NODE_TYPE_META из world schema */
export const NODE_TYPE_META = buildNodeTypeMeta(worldSchema.nodeTypes || [], NODE_TYPES);

/** @type {Object} EDGE_TYPES enum из world schema */
export const EDGE_TYPES = buildEdgeTypesEnum(worldSchema.edgeTypes || []);

/** @type {Object} EDGE_TYPE_META из world schema */
export const EDGE_TYPE_META = buildEdgeTypeMeta(worldSchema.edgeTypes || []);

/** @type {Object} VISIBILITY enum из world schema */
export const VISIBILITY = buildEnumFromArray(worldSchema.visibility || ["public", "private", "hidden"]);

/** @type {Object} STATUS enum из world schema */
export const STATUS = buildEnumFromArray(worldSchema.status || ["core", "expandable", "draft", "archived"]);

/** @type {Array} IDENTITY_REQUIRED_FIELDS из world schema */
export const IDENTITY_REQUIRED_FIELDS = Object.freeze(
  worldSchema.identityFields?.required || ["id"]
);

/** @type {Array} IDENTITY_RECOMMENDED_FIELDS из world schema */
export const IDENTITY_RECOMMENDED_FIELDS = Object.freeze(
  worldSchema.identityFields?.recommended || ["label", "canonicalName", "aliases", "slug"]
);

/** @type {string} SCHEMA_VERSION из world schema */
export const SCHEMA_VERSION = worldSchema.version || "1.0.0";

/** @type {Object} SCHEMA_META из world schema */
export const SCHEMA_META = Object.freeze({
  version: SCHEMA_VERSION,
  name: worldSchema.name || "WorldSchema",
  description: worldSchema.description || "",
  created: "2026-02-12",
  nodeTypes: Object.keys(NODE_TYPES).length,
  edgeTypes: Object.keys(EDGE_TYPES).length,
});

/** @type {Object} Raw world schema data */
export const RAW_WORLD_SCHEMA = worldSchema;

export default {
  NODE_TYPES,
  NODE_TYPE_META,
  EDGE_TYPES,
  EDGE_TYPE_META,
  VISIBILITY,
  STATUS,
  IDENTITY_REQUIRED_FIELDS,
  IDENTITY_RECOMMENDED_FIELDS,
  SCHEMA_VERSION,
  SCHEMA_META,
  RAW_WORLD_SCHEMA,
};
