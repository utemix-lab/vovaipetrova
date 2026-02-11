/**
 * @fileoverview Публичный API модуля онтологии
 * 
 * Точка входа для всей онтологической модели системы.
 * Код следует из этих определений — онтология первична.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Single source of truth", "Type-first design"]
 * )
 */

// Схема онтологии
export * from "./schema";

// Registry — типизированный доступ к данным
export * from "./registry";

// Правила — архитектурные и ограничения
export * from "./rules";
