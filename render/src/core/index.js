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
export { VisitorProjection } from "./VisitorProjection.js";
export { OWLProjection, NAMESPACES } from "./OWLProjection.js";
export { GraphRAGProjection } from "./GraphRAGProjection.js";
export { ReflectiveProjection } from "./ReflectiveProjection.js";
export {
  NODE_TYPES,
  NODE_TYPE_META,
  EDGE_TYPES,
  EDGE_TYPE_META,
  VISIBILITY,
  STATUS,
  IDENTITY_REQUIRED_FIELDS,
  IDENTITY_RECOMMENDED_FIELDS,
  SchemaValidator,
  SCHEMA_VERSION,
  SCHEMA_META,
} from "./CanonicalGraphSchema.js";
export {
  checkUniqueNodeIds,
  checkUniqueEdgeIds,
  checkNoDanglingEdges,
  checkNoSelfLoops,
  checkAllNodesHaveId,
  checkAllNodesHaveType,
  checkKnownNodeTypes,
  checkAllNodesHaveLabel,
  checkAllEdgesHaveType,
  checkKnownEdgeTypes,
  checkNoDuplicateEdges,
  checkGraphConnected,
  checkNoIsolatedNodes,
  checkHasRootNode,
  checkNoContainsCycles,
  checkSingleParent,
  InvariantChecker,
  STRICTNESS,
} from "./StructuralInvariants.js";
export {
  GraphSnapshot,
  SnapshotHistory,
  diffSnapshots,
  CHANGE_TYPE,
  SNAPSHOT_VERSION,
} from "./GraphSnapshot.js";
export {
  SyntheticGraphGenerator,
  PerformanceAuditor,
  benchmark,
  benchmarkAsync,
  formatTime,
  formatSize,
  analyzeScalability,
} from "./PerformanceAudit.js";
export {
  ChangeProtocol,
  ProposalValidator,
  createProposal,
  MUTATION_TYPE,
  AUTHOR_TYPE,
  PROPOSAL_STATUS,
} from "./ChangeProtocol.js";
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
