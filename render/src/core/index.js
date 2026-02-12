/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE — Формальное ядро системы
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * См. repair-shop/ROADMAP.md
 * 
 * ЭКСПОРТЫ:
 * - GraphModel — абстрактная модель графа
 * - Projection — базовый класс проекции
 * - DevProjection — dev-линза
 * - projectionRegistry — реестр проекций
 * - INTENSITY — константы интенсивности
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export { GraphModel, createContextFromState, createEmptyContext, INTENSITY } from "./GraphModel.js";
export { Projection, ProjectionRegistry, projectionRegistry } from "./Projection.js";
export { DevProjection } from "./DevProjection.js";
export { OwnershipGraph, ownershipGraph } from "./OwnershipGraph.js";
export {
  createIdentity,
  getDisplayName,
  generateSlug,
  validateIdImmutability,
  updateCanonicalName,
  addAlias,
  matchesName,
  extractIdentityFromNode,
  serializeIdentity
} from "./Identity.js";
