/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHANGE PROTOCOL — ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2e: Change Protocol
 * 
 * Покрытие:
 * - MUTATION_TYPE, AUTHOR_TYPE, PROPOSAL_STATUS
 * - createProposal
 * - ProposalValidator
 * - ChangeProtocol (propose, validate, simulate, apply, history)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ChangeProtocol,
  ProposalValidator,
  createProposal,
  MUTATION_TYPE,
  AUTHOR_TYPE,
  PROPOSAL_STATUS,
} from "../ChangeProtocol.js";
import { NODE_TYPES, EDGE_TYPES } from "../CanonicalGraphSchema.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const sampleGraph = {
  nodes: [
    { id: "universe", label: "Universe", type: NODE_TYPES.ROOT },
    { id: "characters", label: "Characters", type: NODE_TYPES.HUB },
    { id: "vova", label: "Вова", type: NODE_TYPES.CHARACTER },
  ],
  edges: [
    { id: "e1", source: "universe", target: "characters", type: EDGE_TYPES.STRUCTURAL },
    { id: "e2", source: "characters", target: "vova", type: EDGE_TYPES.CONTAINS },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

describe("MUTATION_TYPE", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(MUTATION_TYPE)).toBe(true);
  });
  
  it("should have all mutation types", () => {
    expect(MUTATION_TYPE.ADD_NODE).toBe("addNode");
    expect(MUTATION_TYPE.REMOVE_NODE).toBe("removeNode");
    expect(MUTATION_TYPE.UPDATE_NODE).toBe("updateNode");
    expect(MUTATION_TYPE.ADD_EDGE).toBe("addEdge");
    expect(MUTATION_TYPE.REMOVE_EDGE).toBe("removeEdge");
    expect(MUTATION_TYPE.UPDATE_EDGE).toBe("updateEdge");
    expect(MUTATION_TYPE.BATCH).toBe("batch");
  });
});

describe("AUTHOR_TYPE", () => {
  it("should have author types", () => {
    expect(AUTHOR_TYPE.HUMAN).toBe("human");
    expect(AUTHOR_TYPE.LLM).toBe("llm");
    expect(AUTHOR_TYPE.SYSTEM).toBe("system");
  });
});

describe("PROPOSAL_STATUS", () => {
  it("should have status types", () => {
    expect(PROPOSAL_STATUS.PENDING).toBe("pending");
    expect(PROPOSAL_STATUS.VALIDATED).toBe("validated");
    expect(PROPOSAL_STATUS.REJECTED).toBe("rejected");
    expect(PROPOSAL_STATUS.APPLIED).toBe("applied");
    expect(PROPOSAL_STATUS.SIMULATED).toBe("simulated");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// createProposal
// ═══════════════════════════════════════════════════════════════════════════

describe("createProposal", () => {
  it("should create proposal with required fields", () => {
    const proposal = createProposal({
      type: MUTATION_TYPE.ADD_NODE,
      payload: { id: "new-node", label: "New", type: NODE_TYPES.CHARACTER },
    });
    
    expect(proposal.id).toMatch(/^prop-/);
    expect(proposal.type).toBe(MUTATION_TYPE.ADD_NODE);
    expect(proposal.payload.id).toBe("new-node");
    expect(proposal.status).toBe(PROPOSAL_STATUS.PENDING);
    expect(proposal.createdAt).toBeGreaterThan(0);
  });
  
  it("should accept rationale and author", () => {
    const proposal = createProposal({
      type: MUTATION_TYPE.ADD_NODE,
      payload: { id: "test" },
      rationale: "Adding test node",
      author: AUTHOR_TYPE.LLM,
    });
    
    expect(proposal.rationale).toBe("Adding test node");
    expect(proposal.author).toBe(AUTHOR_TYPE.LLM);
  });
  
  it("should default author to human", () => {
    const proposal = createProposal({
      type: MUTATION_TYPE.ADD_NODE,
      payload: { id: "test" },
    });
    
    expect(proposal.author).toBe(AUTHOR_TYPE.HUMAN);
  });
  
  it("should throw on invalid type", () => {
    expect(() => createProposal({
      type: "invalid",
      payload: {},
    })).toThrow();
  });
  
  it("should throw on missing payload", () => {
    expect(() => createProposal({
      type: MUTATION_TYPE.ADD_NODE,
    })).toThrow();
  });
  
  it("should generate unique ids", () => {
    const p1 = createProposal({ type: MUTATION_TYPE.ADD_NODE, payload: { id: "a" } });
    const p2 = createProposal({ type: MUTATION_TYPE.ADD_NODE, payload: { id: "b" } });
    
    expect(p1.id).not.toBe(p2.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ProposalValidator
// ═══════════════════════════════════════════════════════════════════════════

describe("ProposalValidator", () => {
  let validator;
  
  beforeEach(() => {
    validator = new ProposalValidator();
  });
  
  describe("validate ADD_NODE", () => {
    it("should validate valid add node proposal", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.ADD_NODE,
        payload: { id: "new-char", label: "New Character", type: NODE_TYPES.CHARACTER },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("should reject duplicate node id", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.ADD_NODE,
        payload: { id: "vova", label: "Duplicate", type: NODE_TYPES.CHARACTER },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes("already exists"))).toBe(true);
    });
    
    it("should reject missing node id", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.ADD_NODE,
        payload: { label: "No ID" },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe("validate REMOVE_NODE", () => {
    it("should validate valid remove node proposal", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.REMOVE_NODE,
        payload: { id: "vova" },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(true);
    });
    
    it("should reject removing non-existent node", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.REMOVE_NODE,
        payload: { id: "non-existent" },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe("validate UPDATE_NODE", () => {
    it("should validate valid update node proposal", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.UPDATE_NODE,
        payload: { id: "vova", changes: { label: "Владимир" } },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(true);
    });
    
    it("should reject updating non-existent node", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.UPDATE_NODE,
        payload: { id: "non-existent", changes: { label: "X" } },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe("validate ADD_EDGE", () => {
    it("should validate valid add edge proposal", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.ADD_EDGE,
        payload: {
          id: "e3",
          source: "universe",
          target: "vova",
          type: EDGE_TYPES.RELATES,
        },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(true);
    });
    
    it("should reject edge with non-existent source", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.ADD_EDGE,
        payload: {
          source: "non-existent",
          target: "vova",
          type: EDGE_TYPES.RELATES,
        },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe("validate REMOVE_EDGE", () => {
    it("should validate valid remove edge proposal", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.REMOVE_EDGE,
        payload: { id: "e2" },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(true);
    });
    
    it("should reject removing non-existent edge", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.REMOVE_EDGE,
        payload: { id: "non-existent" },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe("validate BATCH", () => {
    it("should validate valid batch proposal", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.BATCH,
        payload: {
          mutations: [
            { type: MUTATION_TYPE.ADD_NODE, payload: { id: "new1", label: "New 1", type: NODE_TYPES.CHARACTER } },
            { type: MUTATION_TYPE.ADD_NODE, payload: { id: "new2", label: "New 2", type: NODE_TYPES.CHARACTER } },
          ],
        },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(true);
    });
    
    it("should reject batch with invalid mutation", () => {
      const proposal = createProposal({
        type: MUTATION_TYPE.BATCH,
        payload: {
          mutations: [
            { type: MUTATION_TYPE.ADD_NODE, payload: { id: "new1", label: "New 1", type: NODE_TYPES.CHARACTER } },
            { type: MUTATION_TYPE.REMOVE_NODE, payload: { id: "non-existent" } },
          ],
        },
      });
      
      const result = validator.validate(proposal, sampleGraph);
      
      expect(result.valid).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ChangeProtocol
// ═══════════════════════════════════════════════════════════════════════════

describe("ChangeProtocol", () => {
  let protocol;
  
  beforeEach(() => {
    protocol = new ChangeProtocol(sampleGraph);
  });
  
  describe("constructor", () => {
    it("should initialize with graph", () => {
      expect(protocol.getGraph().nodes).toHaveLength(3);
      expect(protocol.getGraph().edges).toHaveLength(2);
    });
    
    it("should create initial snapshot", () => {
      expect(protocol.getSnapshots()).toHaveLength(1);
    });
    
    it("should start with empty history", () => {
      expect(protocol.getHistory()).toHaveLength(0);
    });
  });
  
  describe("propose helpers", () => {
    it("should create add node proposal", () => {
      const proposal = protocol.proposeAddNode(
        { id: "new", label: "New", type: NODE_TYPES.CHARACTER },
        "Adding new character",
        AUTHOR_TYPE.LLM
      );
      
      expect(proposal.type).toBe(MUTATION_TYPE.ADD_NODE);
      expect(proposal.rationale).toBe("Adding new character");
      expect(proposal.author).toBe(AUTHOR_TYPE.LLM);
    });
    
    it("should create remove node proposal", () => {
      const proposal = protocol.proposeRemoveNode("vova", "Removing character");
      
      expect(proposal.type).toBe(MUTATION_TYPE.REMOVE_NODE);
      expect(proposal.payload.id).toBe("vova");
    });
    
    it("should create update node proposal", () => {
      const proposal = protocol.proposeUpdateNode("vova", { label: "Владимир" });
      
      expect(proposal.type).toBe(MUTATION_TYPE.UPDATE_NODE);
      expect(proposal.payload.changes.label).toBe("Владимир");
    });
    
    it("should create add edge proposal", () => {
      const proposal = protocol.proposeAddEdge({
        source: "universe",
        target: "vova",
        type: EDGE_TYPES.RELATES,
      });
      
      expect(proposal.type).toBe(MUTATION_TYPE.ADD_EDGE);
    });
    
    it("should create remove edge proposal", () => {
      const proposal = protocol.proposeRemoveEdge("e2");
      
      expect(proposal.type).toBe(MUTATION_TYPE.REMOVE_EDGE);
    });
    
    it("should create batch proposal", () => {
      const proposal = protocol.proposeBatch([
        { type: MUTATION_TYPE.ADD_NODE, payload: { id: "a", label: "A", type: NODE_TYPES.CHARACTER } },
        { type: MUTATION_TYPE.ADD_NODE, payload: { id: "b", label: "B", type: NODE_TYPES.CHARACTER } },
      ]);
      
      expect(proposal.type).toBe(MUTATION_TYPE.BATCH);
      expect(proposal.payload.mutations).toHaveLength(2);
    });
  });
  
  describe("validate", () => {
    it("should validate and update proposal status", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = protocol.validate(proposal);
      
      expect(result.valid).toBe(true);
      expect(proposal.status).toBe(PROPOSAL_STATUS.VALIDATED);
    });
    
    it("should reject invalid proposal", () => {
      const proposal = protocol.proposeAddNode({
        id: "vova", // duplicate
        label: "Duplicate",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = protocol.validate(proposal);
      
      expect(result.valid).toBe(false);
      expect(proposal.status).toBe(PROPOSAL_STATUS.REJECTED);
    });
  });
  
  describe("simulate", () => {
    it("should simulate valid proposal", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = protocol.simulate(proposal);
      
      expect(result.valid).toBe(true);
      expect(result.simulatedGraph.nodes).toHaveLength(4);
      expect(result.diff.nodes.added).toHaveLength(1);
      expect(proposal.status).toBe(PROPOSAL_STATUS.SIMULATED);
    });
    
    it("should not modify actual graph", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      protocol.simulate(proposal);
      
      expect(protocol.getGraph().nodes).toHaveLength(3); // unchanged
    });
    
    it("should return errors for invalid proposal", () => {
      const proposal = protocol.proposeRemoveNode("non-existent");
      
      const result = protocol.simulate(proposal);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe("apply", () => {
    it("should apply valid proposal", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = protocol.apply(proposal);
      
      expect(result.success).toBe(true);
      expect(protocol.getGraph().nodes).toHaveLength(4);
      expect(proposal.status).toBe(PROPOSAL_STATUS.APPLIED);
      expect(proposal.appliedAt).toBeGreaterThan(0);
    });
    
    it("should create snapshot after apply", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      protocol.apply(proposal);
      
      expect(protocol.getSnapshots()).toHaveLength(2);
    });
    
    it("should add to history", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      protocol.apply(proposal);
      
      expect(protocol.getHistory()).toHaveLength(1);
      expect(protocol.getHistory()[0].proposal.id).toBe(proposal.id);
    });
    
    it("should return diff", () => {
      const proposal = protocol.proposeAddNode({
        id: "new",
        label: "New",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = protocol.apply(proposal);
      
      expect(result.diff.nodes.added).toHaveLength(1);
      expect(result.diff.nodes.added[0].id).toBe("new");
    });
    
    it("should reject invalid proposal", () => {
      const proposal = protocol.proposeAddNode({
        id: "vova", // duplicate
        label: "Duplicate",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = protocol.apply(proposal);
      
      expect(result.success).toBe(false);
      expect(protocol.getGraph().nodes).toHaveLength(3); // unchanged
    });
    
    it("should remove related edges when removing node", () => {
      const proposal = protocol.proposeRemoveNode("vova");
      
      const result = protocol.apply(proposal);
      
      expect(result.success).toBe(true);
      expect(protocol.getGraph().nodes).toHaveLength(2);
      expect(protocol.getGraph().edges).toHaveLength(1); // e2 removed
    });
  });
  
  describe("history and stats", () => {
    it("should track multiple changes", () => {
      protocol.apply(protocol.proposeAddNode({ id: "a", label: "A", type: NODE_TYPES.CHARACTER }));
      protocol.apply(protocol.proposeAddNode({ id: "b", label: "B", type: NODE_TYPES.CHARACTER }));
      protocol.apply(protocol.proposeUpdateNode("a", { label: "Updated A" }));
      
      expect(protocol.getHistory()).toHaveLength(3);
      expect(protocol.getSnapshots()).toHaveLength(4); // initial + 3
    });
    
    it("should provide stats", () => {
      protocol.apply(protocol.proposeAddNode({ id: "new", label: "New", type: NODE_TYPES.CHARACTER }));
      
      const stats = protocol.getStats();
      
      expect(stats.nodeCount).toBe(4);
      expect(stats.edgeCount).toBe(2);
      expect(stats.historyLength).toBe(1);
      expect(stats.snapshotCount).toBe(2);
      expect(stats.lastChangeAt).toBeGreaterThan(0);
    });
    
    it("should export history", () => {
      protocol.apply(protocol.proposeAddNode(
        { id: "new", label: "New", type: NODE_TYPES.CHARACTER },
        "Test rationale",
        AUTHOR_TYPE.LLM
      ));
      
      const exported = protocol.exportHistory();
      
      expect(exported.graph.nodes).toHaveLength(4);
      expect(exported.history).toHaveLength(1);
      expect(exported.history[0].author).toBe(AUTHOR_TYPE.LLM);
      expect(exported.history[0].rationale).toBe("Test rationale");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration: LLM workflow", () => {
  it("should support LLM proposal → simulate → human approve → apply", () => {
    const protocol = new ChangeProtocol(sampleGraph);
    
    // 1. LLM создаёт предложение
    const proposal = protocol.proposeAddNode(
      { id: "new-domain", label: "New Domain", type: NODE_TYPES.DOMAIN },
      "Suggesting new domain based on analysis",
      AUTHOR_TYPE.LLM
    );
    
    // 2. Симуляция (dry-run)
    const simulation = protocol.simulate(proposal);
    expect(simulation.valid).toBe(true);
    expect(simulation.diff.nodes.added).toHaveLength(1);
    
    // 3. Граф не изменился
    expect(protocol.getGraph().nodes).toHaveLength(3);
    
    // 4. Человек одобряет и применяет
    const result = protocol.apply(proposal);
    expect(result.success).toBe(true);
    
    // 5. Граф изменился
    expect(protocol.getGraph().nodes).toHaveLength(4);
    
    // 6. История зафиксирована
    const history = protocol.getHistory();
    expect(history[0].proposal.author).toBe(AUTHOR_TYPE.LLM);
  });
  
  it("should support batch operations", () => {
    const protocol = new ChangeProtocol(sampleGraph);
    
    const proposal = protocol.proposeBatch([
      { type: MUTATION_TYPE.ADD_NODE, payload: { id: "d1", label: "Domain 1", type: NODE_TYPES.DOMAIN } },
      { type: MUTATION_TYPE.ADD_NODE, payload: { id: "d2", label: "Domain 2", type: NODE_TYPES.DOMAIN } },
      { type: MUTATION_TYPE.ADD_EDGE, payload: { source: "universe", target: "d1", type: EDGE_TYPES.STRUCTURAL } },
    ], "Adding two domains with connection");
    
    const result = protocol.apply(proposal);
    
    expect(result.success).toBe(true);
    expect(protocol.getGraph().nodes).toHaveLength(5);
    expect(protocol.getGraph().edges).toHaveLength(3);
    expect(protocol.getHistory()).toHaveLength(1); // single batch
  });
});
