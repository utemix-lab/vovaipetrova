/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHANGE PROTOCOL — Управляемая эволюция графа
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2e: Change Protocol
 * См. repair-shop/ROADMAP.md
 * 
 * НАЗНАЧЕНИЕ:
 * - Изменение — это протокол, а не операция
 * - Mutation as Proposal
 * - Validation Pipeline
 * - Controlled Apply с историей
 * - Dry-run (simulate) для LLM-предложений
 * 
 * ПРИНЦИП:
 * - Никакого прямого изменения Core
 * - Каждое изменение проходит через proposal → validate → apply
 * - История всех изменений сохраняется
 * - LLM может предлагать, человек принимает решение
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { SchemaValidator, NODE_TYPES, EDGE_TYPES } from "./CanonicalGraphSchema.js";
import { InvariantChecker, STRICTNESS } from "./StructuralInvariants.js";
import { GraphSnapshot, diffSnapshots } from "./GraphSnapshot.js";

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Типы мутаций.
 */
export const MUTATION_TYPE = Object.freeze({
  ADD_NODE: "addNode",
  REMOVE_NODE: "removeNode",
  UPDATE_NODE: "updateNode",
  ADD_EDGE: "addEdge",
  REMOVE_EDGE: "removeEdge",
  UPDATE_EDGE: "updateEdge",
  BATCH: "batch",
});

/**
 * Авторы изменений.
 */
export const AUTHOR_TYPE = Object.freeze({
  HUMAN: "human",
  LLM: "llm",
  SYSTEM: "system",
});

/**
 * Статусы предложения.
 */
export const PROPOSAL_STATUS = Object.freeze({
  PENDING: "pending",
  VALIDATED: "validated",
  REJECTED: "rejected",
  APPLIED: "applied",
  SIMULATED: "simulated",
});

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION PROPOSAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Создать предложение мутации.
 * @param {Object} options
 * @returns {MutationProposal}
 */
export function createProposal(options) {
  const {
    type,
    payload,
    rationale = "",
    author = AUTHOR_TYPE.HUMAN,
    metadata = {},
  } = options;
  
  if (!type || !Object.values(MUTATION_TYPE).includes(type)) {
    throw new Error(`Invalid mutation type: ${type}`);
  }
  
  if (!payload) {
    throw new Error("Payload is required");
  }
  
  return {
    id: generateProposalId(),
    type,
    payload,
    rationale,
    author,
    metadata,
    status: PROPOSAL_STATUS.PENDING,
    createdAt: Date.now(),
    validationResult: null,
    appliedAt: null,
  };
}

/**
 * Генерировать ID предложения.
 * @private
 */
function generateProposalId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `prop-${timestamp}-${random}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Результат валидации.
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {Array<Object>} errors
 * @property {Array<Object>} warnings
 * @property {Object} schemaResult
 * @property {Object} invariantResult
 */

/**
 * Валидатор предложений.
 */
export class ProposalValidator {
  constructor() {
    this.schemaValidator = new SchemaValidator();
    this.invariantChecker = new InvariantChecker();
  }
  
  /**
   * Валидировать предложение против текущего состояния графа.
   * @param {MutationProposal} proposal
   * @param {Object} currentGraph - { nodes, edges }
   * @returns {ValidationResult}
   */
  validate(proposal, currentGraph) {
    const errors = [];
    const warnings = [];
    
    // 1. Проверка структуры предложения
    const structureCheck = this._validateProposalStructure(proposal);
    if (!structureCheck.valid) {
      return {
        valid: false,
        errors: structureCheck.errors,
        warnings: [],
        schemaResult: null,
        invariantResult: null,
      };
    }
    
    // 2. Симулировать применение
    const simulatedGraph = this._simulateApply(proposal, currentGraph);
    if (simulatedGraph.error) {
      return {
        valid: false,
        errors: [{ code: "SIMULATION_FAILED", message: simulatedGraph.error }],
        warnings: [],
        schemaResult: null,
        invariantResult: null,
      };
    }
    
    // 3. Валидация схемы
    const schemaResult = this._validateSchema(proposal, simulatedGraph.graph);
    if (schemaResult.errors.length > 0) {
      errors.push(...schemaResult.errors);
    }
    if (schemaResult.warnings.length > 0) {
      warnings.push(...schemaResult.warnings);
    }
    
    // 4. Проверка инвариантов
    const invariantResult = this.invariantChecker.checkAll(
      simulatedGraph.graph,
      STRICTNESS.MINIMAL
    );
    
    if (!invariantResult.passed) {
      for (const failure of invariantResult.failed) {
        errors.push({
          code: "INVARIANT_VIOLATION",
          invariant: failure.name,
          message: failure.error || `Invariant ${failure.name} failed`,
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schemaResult,
      invariantResult,
      simulatedGraph: simulatedGraph.graph,
    };
  }
  
  /**
   * Проверить структуру предложения.
   * @private
   */
  _validateProposalStructure(proposal) {
    const errors = [];
    
    if (!proposal.type) {
      errors.push({ code: "MISSING_TYPE", message: "Proposal type is required" });
    }
    
    if (!proposal.payload) {
      errors.push({ code: "MISSING_PAYLOAD", message: "Proposal payload is required" });
    }
    
    // Проверка payload в зависимости от типа
    switch (proposal.type) {
      case MUTATION_TYPE.ADD_NODE:
        if (!proposal.payload.id) {
          errors.push({ code: "MISSING_NODE_ID", message: "Node id is required" });
        }
        break;
        
      case MUTATION_TYPE.REMOVE_NODE:
        if (!proposal.payload.id) {
          errors.push({ code: "MISSING_NODE_ID", message: "Node id is required" });
        }
        break;
        
      case MUTATION_TYPE.UPDATE_NODE:
        if (!proposal.payload.id) {
          errors.push({ code: "MISSING_NODE_ID", message: "Node id is required" });
        }
        if (!proposal.payload.changes) {
          errors.push({ code: "MISSING_CHANGES", message: "Changes are required" });
        }
        break;
        
      case MUTATION_TYPE.ADD_EDGE:
        if (!proposal.payload.source || !proposal.payload.target) {
          errors.push({ code: "MISSING_EDGE_ENDPOINTS", message: "Edge source and target are required" });
        }
        break;
        
      case MUTATION_TYPE.REMOVE_EDGE:
        if (!proposal.payload.id) {
          errors.push({ code: "MISSING_EDGE_ID", message: "Edge id is required" });
        }
        break;
        
      case MUTATION_TYPE.BATCH:
        if (!Array.isArray(proposal.payload.mutations)) {
          errors.push({ code: "INVALID_BATCH", message: "Batch mutations must be an array" });
        }
        break;
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Симулировать применение мутации.
   * @private
   */
  _simulateApply(proposal, currentGraph) {
    try {
      const nodes = [...currentGraph.nodes];
      const edges = [...(currentGraph.edges || currentGraph.links || [])];
      
      switch (proposal.type) {
        case MUTATION_TYPE.ADD_NODE: {
          const existing = nodes.find(n => n.id === proposal.payload.id);
          if (existing) {
            return { error: `Node with id "${proposal.payload.id}" already exists` };
          }
          nodes.push({ ...proposal.payload });
          break;
        }
        
        case MUTATION_TYPE.REMOVE_NODE: {
          const index = nodes.findIndex(n => n.id === proposal.payload.id);
          if (index === -1) {
            return { error: `Node with id "${proposal.payload.id}" not found` };
          }
          nodes.splice(index, 1);
          // Также удаляем связанные рёбра
          const nodeId = proposal.payload.id;
          for (let i = edges.length - 1; i >= 0; i--) {
            if (edges[i].source === nodeId || edges[i].target === nodeId) {
              edges.splice(i, 1);
            }
          }
          break;
        }
        
        case MUTATION_TYPE.UPDATE_NODE: {
          const index = nodes.findIndex(n => n.id === proposal.payload.id);
          if (index === -1) {
            return { error: `Node with id "${proposal.payload.id}" not found` };
          }
          nodes[index] = { ...nodes[index], ...proposal.payload.changes };
          break;
        }
        
        case MUTATION_TYPE.ADD_EDGE: {
          const edgeId = proposal.payload.id || `edge-${Date.now()}`;
          const existing = edges.find(e => e.id === edgeId);
          if (existing) {
            return { error: `Edge with id "${edgeId}" already exists` };
          }
          // Проверяем существование узлов
          if (!nodes.find(n => n.id === proposal.payload.source)) {
            return { error: `Source node "${proposal.payload.source}" not found` };
          }
          if (!nodes.find(n => n.id === proposal.payload.target)) {
            return { error: `Target node "${proposal.payload.target}" not found` };
          }
          edges.push({ id: edgeId, ...proposal.payload });
          break;
        }
        
        case MUTATION_TYPE.REMOVE_EDGE: {
          const index = edges.findIndex(e => e.id === proposal.payload.id);
          if (index === -1) {
            return { error: `Edge with id "${proposal.payload.id}" not found` };
          }
          edges.splice(index, 1);
          break;
        }
        
        case MUTATION_TYPE.UPDATE_EDGE: {
          const index = edges.findIndex(e => e.id === proposal.payload.id);
          if (index === -1) {
            return { error: `Edge with id "${proposal.payload.id}" not found` };
          }
          edges[index] = { ...edges[index], ...proposal.payload.changes };
          break;
        }
        
        case MUTATION_TYPE.BATCH: {
          let result = { nodes, edges };
          for (const mutation of proposal.payload.mutations) {
            const subProposal = { ...proposal, type: mutation.type, payload: mutation.payload };
            const subResult = this._simulateApply(subProposal, { nodes: result.nodes, edges: result.edges });
            if (subResult.error) {
              return subResult;
            }
            result = subResult.graph;
          }
          return { graph: result };
        }
      }
      
      return { graph: { nodes, edges } };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Валидировать схему после применения.
   * @private
   */
  _validateSchema(proposal, simulatedGraph) {
    const errors = [];
    const warnings = [];
    
    // Валидируем затронутые сущности
    switch (proposal.type) {
      case MUTATION_TYPE.ADD_NODE:
      case MUTATION_TYPE.UPDATE_NODE: {
        const node = simulatedGraph.nodes.find(n => n.id === proposal.payload.id);
        if (node) {
          const result = this.schemaValidator.validateNode(node);
          if (!result.valid) {
            errors.push(...result.errors.map(e => ({
              code: "SCHEMA_ERROR",
              field: e.field,
              message: e.message,
            })));
          }
          if (result.warnings) {
            warnings.push(...result.warnings);
          }
        }
        break;
      }
      
      case MUTATION_TYPE.ADD_EDGE:
      case MUTATION_TYPE.UPDATE_EDGE: {
        const edgeId = proposal.payload.id || simulatedGraph.edges[simulatedGraph.edges.length - 1]?.id;
        const edge = simulatedGraph.edges.find(e => e.id === edgeId);
        if (edge) {
          const result = this.schemaValidator.validateEdge(edge);
          if (!result.valid) {
            errors.push(...result.errors.map(e => ({
              code: "SCHEMA_ERROR",
              field: e.field,
              message: e.message,
            })));
          }
        }
        break;
      }
    }
    
    return { errors, warnings };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHANGE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Протокол управляемых изменений.
 */
export class ChangeProtocol {
  /**
   * @param {Object} initialGraph - { nodes, edges }
   */
  constructor(initialGraph = { nodes: [], edges: [] }) {
    /** @type {Object} */
    this.graph = {
      nodes: [...initialGraph.nodes],
      edges: [...(initialGraph.edges || initialGraph.links || [])],
    };
    
    /** @type {ProposalValidator} */
    this.validator = new ProposalValidator();
    
    /** @type {Array<Object>} */
    this.history = [];
    
    /** @type {Array<GraphSnapshot>} */
    this.snapshots = [];
    
    // Создаём начальный снапшот
    this._createSnapshot("initial");
  }
  
  /**
   * Создать снапшот текущего состояния.
   * @private
   */
  _createSnapshot(description = "") {
    const snapshot = new GraphSnapshot(this.graph, {
      description,
      metadata: { historyLength: this.history.length },
    });
    this.snapshots.push(snapshot);
    return snapshot;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROPOSAL CREATION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Создать предложение добавления узла.
   * @param {Object} node
   * @param {string} rationale
   * @param {string} author
   * @returns {MutationProposal}
   */
  proposeAddNode(node, rationale = "", author = AUTHOR_TYPE.HUMAN) {
    return createProposal({
      type: MUTATION_TYPE.ADD_NODE,
      payload: node,
      rationale,
      author,
    });
  }
  
  /**
   * Создать предложение удаления узла.
   * @param {string} nodeId
   * @param {string} rationale
   * @param {string} author
   * @returns {MutationProposal}
   */
  proposeRemoveNode(nodeId, rationale = "", author = AUTHOR_TYPE.HUMAN) {
    return createProposal({
      type: MUTATION_TYPE.REMOVE_NODE,
      payload: { id: nodeId },
      rationale,
      author,
    });
  }
  
  /**
   * Создать предложение обновления узла.
   * @param {string} nodeId
   * @param {Object} changes
   * @param {string} rationale
   * @param {string} author
   * @returns {MutationProposal}
   */
  proposeUpdateNode(nodeId, changes, rationale = "", author = AUTHOR_TYPE.HUMAN) {
    return createProposal({
      type: MUTATION_TYPE.UPDATE_NODE,
      payload: { id: nodeId, changes },
      rationale,
      author,
    });
  }
  
  /**
   * Создать предложение добавления ребра.
   * @param {Object} edge
   * @param {string} rationale
   * @param {string} author
   * @returns {MutationProposal}
   */
  proposeAddEdge(edge, rationale = "", author = AUTHOR_TYPE.HUMAN) {
    return createProposal({
      type: MUTATION_TYPE.ADD_EDGE,
      payload: edge,
      rationale,
      author,
    });
  }
  
  /**
   * Создать предложение удаления ребра.
   * @param {string} edgeId
   * @param {string} rationale
   * @param {string} author
   * @returns {MutationProposal}
   */
  proposeRemoveEdge(edgeId, rationale = "", author = AUTHOR_TYPE.HUMAN) {
    return createProposal({
      type: MUTATION_TYPE.REMOVE_EDGE,
      payload: { id: edgeId },
      rationale,
      author,
    });
  }
  
  /**
   * Создать batch-предложение.
   * @param {Array<Object>} mutations - [{ type, payload }, ...]
   * @param {string} rationale
   * @param {string} author
   * @returns {MutationProposal}
   */
  proposeBatch(mutations, rationale = "", author = AUTHOR_TYPE.HUMAN) {
    return createProposal({
      type: MUTATION_TYPE.BATCH,
      payload: { mutations },
      rationale,
      author,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Валидировать предложение.
   * @param {MutationProposal} proposal
   * @returns {ValidationResult}
   */
  validate(proposal) {
    const result = this.validator.validate(proposal, this.graph);
    
    proposal.validationResult = result;
    proposal.status = result.valid ? PROPOSAL_STATUS.VALIDATED : PROPOSAL_STATUS.REJECTED;
    
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SIMULATION (DRY-RUN)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Симулировать применение предложения без изменения состояния.
   * @param {MutationProposal} proposal
   * @returns {Object} - { valid, simulatedGraph, diff, errors }
   */
  simulate(proposal) {
    const validation = this.validator.validate(proposal, this.graph);
    
    if (!validation.valid) {
      return {
        valid: false,
        simulatedGraph: null,
        diff: null,
        errors: validation.errors,
      };
    }
    
    const beforeSnapshot = new GraphSnapshot(this.graph);
    const afterSnapshot = new GraphSnapshot(validation.simulatedGraph);
    const diff = diffSnapshots(beforeSnapshot, afterSnapshot);
    
    proposal.status = PROPOSAL_STATUS.SIMULATED;
    
    return {
      valid: true,
      simulatedGraph: validation.simulatedGraph,
      diff,
      errors: [],
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // APPLY
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Применить предложение.
   * @param {MutationProposal} proposal
   * @param {Object} options - { skipValidation: false }
   * @returns {Object} - { success, diff, snapshot, errors }
   */
  apply(proposal, options = {}) {
    const { skipValidation = false } = options;
    
    // Валидация (если не пропущена)
    if (!skipValidation) {
      const validation = this.validate(proposal);
      if (!validation.valid) {
        return {
          success: false,
          diff: null,
          snapshot: null,
          errors: validation.errors,
        };
      }
    }
    
    // Создаём снапшот до изменения
    const beforeSnapshot = this.snapshots[this.snapshots.length - 1];
    
    // Применяем изменение
    const simResult = this.validator._simulateApply(proposal, this.graph);
    if (simResult.error) {
      return {
        success: false,
        diff: null,
        snapshot: null,
        errors: [{ code: "APPLY_FAILED", message: simResult.error }],
      };
    }
    
    // Обновляем граф
    this.graph = simResult.graph;
    
    // Создаём снапшот после изменения
    const afterSnapshot = this._createSnapshot(proposal.rationale || proposal.type);
    
    // Вычисляем diff
    const diff = diffSnapshots(beforeSnapshot, afterSnapshot);
    
    // Обновляем статус предложения
    proposal.status = PROPOSAL_STATUS.APPLIED;
    proposal.appliedAt = Date.now();
    
    // Добавляем в историю
    this.history.push({
      proposal: { ...proposal },
      diff,
      snapshotId: afterSnapshot.id,
      appliedAt: proposal.appliedAt,
    });
    
    return {
      success: true,
      diff,
      snapshot: afterSnapshot,
      errors: [],
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY & STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить текущее состояние графа.
   * @returns {Object}
   */
  getGraph() {
    return {
      nodes: [...this.graph.nodes],
      edges: [...this.graph.edges],
    };
  }
  
  /**
   * Получить историю изменений.
   * @returns {Array<Object>}
   */
  getHistory() {
    return [...this.history];
  }
  
  /**
   * Получить все снапшоты.
   * @returns {Array<GraphSnapshot>}
   */
  getSnapshots() {
    return [...this.snapshots];
  }
  
  /**
   * Получить последний снапшот.
   * @returns {GraphSnapshot}
   */
  getLatestSnapshot() {
    return this.snapshots[this.snapshots.length - 1];
  }
  
  /**
   * Получить статистику.
   * @returns {Object}
   */
  getStats() {
    return {
      nodeCount: this.graph.nodes.length,
      edgeCount: this.graph.edges.length,
      historyLength: this.history.length,
      snapshotCount: this.snapshots.length,
      lastChangeAt: this.history.length > 0
        ? this.history[this.history.length - 1].appliedAt
        : null,
    };
  }
  
  /**
   * Экспортировать историю для анализа.
   * @returns {Object}
   */
  exportHistory() {
    return {
      graph: this.getGraph(),
      history: this.history.map(h => ({
        proposalId: h.proposal.id,
        type: h.proposal.type,
        author: h.proposal.author,
        rationale: h.proposal.rationale,
        appliedAt: h.appliedAt,
        changes: h.diff.summary,
      })),
      stats: this.getStats(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  ChangeProtocol,
  ProposalValidator,
  createProposal,
  MUTATION_TYPE,
  AUTHOR_TYPE,
  PROPOSAL_STATUS,
};
