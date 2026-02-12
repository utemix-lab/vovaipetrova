/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LLM REFLECTION ENGINE — ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.4: LLMReflectionEngine
 * 
 * Покрытие:
 * - ENGINE_MODE, PROMPT_TYPE
 * - ContextAssembler
 * - PromptBuilder
 * - SuggestionParser
 * - LLMReflectionEngine (orchestrator)
 * - Boundary tests (no mutation without apply)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LLMReflectionEngine,
  ContextAssembler,
  PromptBuilder,
  SuggestionParser,
  ENGINE_MODE,
  PROMPT_TYPE,
} from "../LLMReflectionEngine.js";
import { NODE_TYPES, EDGE_TYPES } from "../CanonicalGraphSchema.js";
import { MUTATION_TYPE, AUTHOR_TYPE } from "../ChangeProtocol.js";
import { ReflectiveProjection } from "../ReflectiveProjection.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const sampleGraph = {
  nodes: [
    { id: "universe", label: "Universe", type: NODE_TYPES.ROOT },
    { id: "characters", label: "Characters", type: NODE_TYPES.HUB },
    { id: "domains", label: "Domains", type: NODE_TYPES.HUB },
    { id: "vova", label: "Вова", type: NODE_TYPES.CHARACTER },
    { id: "art", label: "Art", type: NODE_TYPES.DOMAIN },
  ],
  edges: [
    { id: "e1", source: "universe", target: "characters", type: EDGE_TYPES.STRUCTURAL },
    { id: "e2", source: "universe", target: "domains", type: EDGE_TYPES.STRUCTURAL },
    { id: "e3", source: "characters", target: "vova", type: EDGE_TYPES.CONTAINS },
    { id: "e4", source: "domains", target: "art", type: EDGE_TYPES.CONTAINS },
  ],
};

// Mock LLM responses
const mockAnalysisResponse = {
  summary: "Graph is well-structured with clear hierarchy",
  strengths: ["Clear root node", "Good type distribution"],
  concerns: ["Limited edge density"],
  recommendations: ["Consider adding more cross-references"],
};

const mockSuggestionsResponse = {
  suggestions: [
    {
      type: "addNode",
      payload: { id: "music", label: "Music", type: "domain" },
      rationale: "Adding music domain for completeness",
      impact: "low",
    },
    {
      type: "addEdge",
      payload: { source: "vova", target: "art", type: "relates" },
      rationale: "Connecting character to domain",
      impact: "medium",
    },
  ],
};

const mockReviewResponse = {
  approved: true,
  concerns: [],
  recommendation: "approve",
  suggestedModifications: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

describe("ENGINE_MODE", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(ENGINE_MODE)).toBe(true);
  });
  
  it("should have all modes", () => {
    expect(ENGINE_MODE.ANALYSIS).toBe("analysis");
    expect(ENGINE_MODE.SUGGESTION).toBe("suggestion");
    expect(ENGINE_MODE.REVIEW).toBe("review");
  });
});

describe("PROMPT_TYPE", () => {
  it("should have all prompt types", () => {
    expect(PROMPT_TYPE.ANALYZE_STRUCTURE).toBe("analyzeStructure");
    expect(PROMPT_TYPE.DETECT_WEAKNESSES).toBe("detectWeaknesses");
    expect(PROMPT_TYPE.SUGGEST_IMPROVEMENTS).toBe("suggestImprovements");
    expect(PROMPT_TYPE.REVIEW_PROPOSAL).toBe("reviewProposal");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLER
// ═══════════════════════════════════════════════════════════════════════════

describe("ContextAssembler", () => {
  describe("assemble (via LLMReflectionEngine)", () => {
    it("should assemble full context", () => {
      const engine = new LLMReflectionEngine({ graph: sampleGraph });
      const context = engine.getContext();
      
      expect(context.timestamp).toBeGreaterThan(0);
      expect(context.schemaVersion).toBeDefined();
      expect(context.structure).toBeDefined();
      expect(context.metrics).toBeDefined();
      expect(context.invariants).toBeDefined();
      expect(context.schema).toBeDefined();
    });
    
    it("should include structure info", () => {
      const engine = new LLMReflectionEngine({ graph: sampleGraph });
      const context = engine.getContext();
      
      expect(context.structure.nodeCount).toBe(5);
      expect(context.structure.edgeCount).toBe(4);
      expect(context.structure.density).toBeDefined();
    });
    
    it("should include metrics", () => {
      const engine = new LLMReflectionEngine({ graph: sampleGraph });
      const context = engine.getContext();
      
      expect(context.metrics.nodeCount).toBe(5);
      expect(context.metrics.edgeCount).toBe(4);
      expect(context.metrics.density).toBeDefined();
    });
    
    it("should include invariants", () => {
      const engine = new LLMReflectionEngine({ graph: sampleGraph });
      const context = engine.getContext();
      
      expect(context.invariants.isConnected).toBeDefined();
      // hasCycles is a boolean
      expect(typeof context.invariants.hasCycles).toBe("boolean");
    });
    
    it("should include schema info", () => {
      const engine = new LLMReflectionEngine({ graph: sampleGraph });
      const context = engine.getContext();
      
      expect(context.schema.version).toBeDefined();
      expect(context.schema.nodeTypes).toContain(NODE_TYPES.CHARACTER);
      expect(context.schema.edgeTypes).toContain(EDGE_TYPES.STRUCTURAL);
    });
  });
  
  describe("assembleMinimal", () => {
    it("should return minimal context", () => {
      const engine = new LLMReflectionEngine({ graph: sampleGraph });
      const context = engine.getMinimalContext();
      
      expect(context.timestamp).toBeGreaterThan(0);
      expect(context.metrics).toBeDefined();
      expect(context.structure).toBeUndefined();
    });
  });
  
  describe("error handling", () => {
    it("should handle missing reflective", () => {
      const emptyAssembler = new ContextAssembler({});
      const context = emptyAssembler.assemble();
      
      expect(context.structure.error).toBeDefined();
      expect(context.metrics.error).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════

describe("PromptBuilder", () => {
  let builder;
  let context;
  
  beforeEach(() => {
    builder = new PromptBuilder();
    const reflective = new ReflectiveProjection(sampleGraph);
    const assembler = new ContextAssembler({ reflective });
    context = assembler.assemble();
  });
  
  describe("build ANALYZE_STRUCTURE", () => {
    it("should build analyze structure prompt", () => {
      const prompt = builder.build(PROMPT_TYPE.ANALYZE_STRUCTURE, context);
      
      expect(prompt.system).toContain("graph architecture analyst");
      expect(prompt.user).toContain("Nodes:");
      expect(prompt.user).toContain("Edges:");
      expect(prompt.responseFormat).toBeDefined();
    });
  });
  
  describe("build DETECT_WEAKNESSES", () => {
    it("should build detect weaknesses prompt", () => {
      const prompt = builder.build(PROMPT_TYPE.DETECT_WEAKNESSES, context);
      
      expect(prompt.system).toContain("weaknesses");
      expect(prompt.user).toContain("Detect weaknesses");
      expect(prompt.responseFormat).toBeDefined();
    });
  });
  
  describe("build SUGGEST_IMPROVEMENTS", () => {
    it("should build suggest improvements prompt", () => {
      const prompt = builder.build(PROMPT_TYPE.SUGGEST_IMPROVEMENTS, context);
      
      expect(prompt.system).toContain("mutation types");
      expect(prompt.user).toContain("Suggest improvements");
      expect(prompt.responseFormat).toBeDefined();
    });
  });
  
  describe("build REVIEW_PROPOSAL", () => {
    it("should build review proposal prompt", () => {
      const proposal = {
        type: MUTATION_TYPE.ADD_NODE,
        payload: { id: "test", label: "Test" },
      };
      
      const prompt = builder.build(PROMPT_TYPE.REVIEW_PROPOSAL, context, { proposal });
      
      expect(prompt.system).toContain("reviewer");
      expect(prompt.user).toContain("Review this proposed change");
    });
    
    it("should throw without proposal", () => {
      expect(() => builder.build(PROMPT_TYPE.REVIEW_PROPOSAL, context)).toThrow();
    });
  });
  
  describe("error handling", () => {
    it("should throw on unknown prompt type", () => {
      expect(() => builder.build("unknown", context)).toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTION PARSER
// ═══════════════════════════════════════════════════════════════════════════

describe("SuggestionParser", () => {
  let parser;
  
  beforeEach(() => {
    parser = new SuggestionParser();
  });
  
  describe("parseSuggestions", () => {
    it("should parse valid suggestions", () => {
      const result = parser.parseSuggestions(mockSuggestionsResponse);
      
      expect(result.valid).toBe(true);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].type).toBe("addNode");
    });
    
    it("should parse JSON string", () => {
      const result = parser.parseSuggestions(JSON.stringify(mockSuggestionsResponse));
      
      expect(result.valid).toBe(true);
      expect(result.suggestions).toHaveLength(2);
    });
    
    it("should reject missing suggestions array", () => {
      const result = parser.parseSuggestions({ foo: "bar" });
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("MISSING_SUGGESTIONS");
    });
    
    it("should reject invalid JSON", () => {
      const result = parser.parseSuggestions("not json");
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("PARSE_ERROR");
    });
    
    it("should reject suggestion without type", () => {
      const result = parser.parseSuggestions({
        suggestions: [{ payload: {}, rationale: "test" }],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === "MISSING_TYPE")).toBe(true);
    });
    
    it("should reject suggestion with invalid type", () => {
      const result = parser.parseSuggestions({
        suggestions: [{ type: "invalidType", payload: {}, rationale: "test" }],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_TYPE")).toBe(true);
    });
    
    it("should reject suggestion without payload", () => {
      const result = parser.parseSuggestions({
        suggestions: [{ type: "addNode", rationale: "test" }],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === "MISSING_PAYLOAD")).toBe(true);
    });
    
    it("should reject suggestion without rationale", () => {
      const result = parser.parseSuggestions({
        suggestions: [{ type: "addNode", payload: {} }],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === "MISSING_RATIONALE")).toBe(true);
    });
    
    it("should normalize impact to medium if missing", () => {
      const result = parser.parseSuggestions({
        suggestions: [{ type: "addNode", payload: { id: "x" }, rationale: "test" }],
      });
      
      expect(result.suggestions[0].impact).toBe("medium");
    });
  });
  
  describe("parseAnalysis", () => {
    it("should parse valid analysis", () => {
      const result = parser.parseAnalysis(mockAnalysisResponse);
      
      expect(result.valid).toBe(true);
      expect(result.analysis.summary).toBe(mockAnalysisResponse.summary);
      expect(result.analysis.strengths).toHaveLength(2);
    });
    
    it("should handle invalid JSON", () => {
      const result = parser.parseAnalysis("not json");
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe("parseReview", () => {
    it("should parse valid review", () => {
      const result = parser.parseReview(mockReviewResponse);
      
      expect(result.valid).toBe(true);
      expect(result.review.approved).toBe(true);
      expect(result.review.recommendation).toBe("approve");
    });
    
    it("should handle invalid JSON", () => {
      const result = parser.parseReview("not json");
      
      expect(result.valid).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LLM REFLECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

describe("LLMReflectionEngine", () => {
  let engine;
  let mockLLM;
  
  beforeEach(() => {
    mockLLM = vi.fn();
    engine = new LLMReflectionEngine({
      graph: sampleGraph,
      llmClient: mockLLM,
    });
  });
  
  describe("constructor", () => {
    it("should initialize with graph", () => {
      expect(engine.getGraph().nodes).toHaveLength(5);
    });
    
    it("should throw without graph", () => {
      expect(() => new LLMReflectionEngine({})).toThrow();
    });
    
    it("should default to ANALYSIS mode", () => {
      expect(engine.mode).toBe(ENGINE_MODE.ANALYSIS);
    });
  });
  
  describe("setMode", () => {
    it("should set valid mode", () => {
      engine.setMode(ENGINE_MODE.SUGGESTION);
      expect(engine.mode).toBe(ENGINE_MODE.SUGGESTION);
    });
    
    it("should throw on invalid mode", () => {
      expect(() => engine.setMode("invalid")).toThrow();
    });
  });
  
  describe("getContext", () => {
    it("should return full context", () => {
      const context = engine.getContext();
      
      expect(context.structure).toBeDefined();
      expect(context.metrics).toBeDefined();
      expect(context.schema).toBeDefined();
    });
  });
  
  describe("getMinimalContext", () => {
    it("should return minimal context", () => {
      const context = engine.getMinimalContext();
      
      expect(context.metrics).toBeDefined();
      expect(context.structure).toBeUndefined();
    });
  });
  
  describe("analyzeStructure", () => {
    it("should call LLM and return analysis", async () => {
      mockLLM.mockResolvedValue(mockAnalysisResponse);
      
      const result = await engine.analyzeStructure();
      
      expect(result.success).toBe(true);
      expect(result.analysis.summary).toBeDefined();
      expect(mockLLM).toHaveBeenCalled();
    });
    
    it("should return error without LLM client", async () => {
      const noLLMEngine = new LLMReflectionEngine({ graph: sampleGraph });
      
      const result = await noLLMEngine.analyzeStructure();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("LLM client not configured");
    });
    
    it("should handle LLM errors", async () => {
      mockLLM.mockRejectedValue(new Error("LLM error"));
      
      const result = await engine.analyzeStructure();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("LLM error");
    });
  });
  
  describe("suggestImprovements", () => {
    it("should return suggestions with simulations", async () => {
      mockLLM.mockResolvedValue(mockSuggestionsResponse);
      
      const result = await engine.suggestImprovements();
      
      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].proposal).toBeDefined();
      expect(result.suggestions[0].simulation).toBeDefined();
    });
    
    it("should simulate each suggestion", async () => {
      mockLLM.mockResolvedValue(mockSuggestionsResponse);
      
      const result = await engine.suggestImprovements();
      
      // First suggestion (addNode) should be valid
      expect(result.suggestions[0].simulation.valid).toBe(true);
      expect(result.suggestions[0].simulation.diff).toBeDefined();
    });
    
    it("should handle invalid LLM response", async () => {
      mockLLM.mockResolvedValue({ invalid: "response" });
      
      const result = await engine.suggestImprovements();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe("reviewProposal", () => {
    it("should review proposal and simulate", async () => {
      mockLLM.mockResolvedValue(mockReviewResponse);
      
      const proposal = engine.protocol.proposeAddNode({
        id: "test",
        label: "Test",
        type: NODE_TYPES.CHARACTER,
      });
      
      const result = await engine.reviewProposal(proposal);
      
      expect(result.success).toBe(true);
      expect(result.review.approved).toBe(true);
      expect(result.simulation).toBeDefined();
    });
  });
  
  describe("getStats", () => {
    it("should return stats", () => {
      const stats = engine.getStats();
      
      expect(stats.mode).toBe(ENGINE_MODE.ANALYSIS);
      expect(stats.hasLLMClient).toBe(true);
      expect(stats.protocolStats).toBeDefined();
      expect(stats.reflectiveStats).toBeDefined();
    });
  });
  
  describe("getHistory", () => {
    it("should return empty history initially", () => {
      expect(engine.getHistory()).toHaveLength(0);
    });
  });
  
  describe("invalidateCache", () => {
    it("should not throw", () => {
      expect(() => engine.invalidateCache()).not.toThrow();
    });
  });
  
  describe("destroy", () => {
    it("should cleanup", () => {
      engine.destroy();
      expect(engine.llmClient).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BOUNDARY TESTS — CRITICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("Boundary: No mutation without explicit apply", () => {
  let engine;
  let mockLLM;
  let initialGraph;
  
  beforeEach(() => {
    initialGraph = JSON.parse(JSON.stringify(sampleGraph));
    mockLLM = vi.fn();
    engine = new LLMReflectionEngine({
      graph: sampleGraph,
      llmClient: mockLLM,
    });
  });
  
  it("should NOT mutate graph during analyzeStructure", async () => {
    mockLLM.mockResolvedValue(mockAnalysisResponse);
    
    await engine.analyzeStructure();
    
    const graph = engine.getGraph();
    expect(graph.nodes).toHaveLength(initialGraph.nodes.length);
    expect(graph.edges).toHaveLength(initialGraph.edges.length);
  });
  
  it("should NOT mutate graph during suggestImprovements", async () => {
    mockLLM.mockResolvedValue(mockSuggestionsResponse);
    
    await engine.suggestImprovements();
    
    const graph = engine.getGraph();
    expect(graph.nodes).toHaveLength(initialGraph.nodes.length);
    expect(graph.edges).toHaveLength(initialGraph.edges.length);
  });
  
  it("should NOT mutate graph during reviewProposal", async () => {
    mockLLM.mockResolvedValue(mockReviewResponse);
    
    const proposal = engine.protocol.proposeAddNode({
      id: "test",
      label: "Test",
      type: NODE_TYPES.CHARACTER,
    });
    
    await engine.reviewProposal(proposal);
    
    const graph = engine.getGraph();
    expect(graph.nodes).toHaveLength(initialGraph.nodes.length);
  });
  
  it("should NOT add to history during simulate", async () => {
    mockLLM.mockResolvedValue(mockSuggestionsResponse);
    
    await engine.suggestImprovements();
    
    expect(engine.getHistory()).toHaveLength(0);
  });
  
  it("should NOT create new snapshots during simulate", async () => {
    mockLLM.mockResolvedValue(mockSuggestionsResponse);
    
    const snapshotsBefore = engine.protocol.getSnapshots().length;
    
    await engine.suggestImprovements();
    
    const snapshotsAfter = engine.protocol.getSnapshots().length;
    expect(snapshotsAfter).toBe(snapshotsBefore);
  });
  
  it("simulate should return diff without applying", async () => {
    mockLLM.mockResolvedValue(mockSuggestionsResponse);
    
    const result = await engine.suggestImprovements();
    
    // First suggestion adds a node
    const addNodeSuggestion = result.suggestions[0];
    expect(addNodeSuggestion.simulation.valid).toBe(true);
    expect(addNodeSuggestion.simulation.diff.nodes.added).toHaveLength(1);
    
    // But graph is unchanged
    expect(engine.getGraph().nodes).toHaveLength(initialGraph.nodes.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration: Full workflow", () => {
  it("should support analysis → suggestion → review workflow", async () => {
    const mockLLM = vi.fn();
    const engine = new LLMReflectionEngine({
      graph: sampleGraph,
      llmClient: mockLLM,
    });
    
    // Step 1: Analysis
    mockLLM.mockResolvedValueOnce(mockAnalysisResponse);
    const analysis = await engine.analyzeStructure();
    expect(analysis.success).toBe(true);
    
    // Step 2: Get suggestions
    mockLLM.mockResolvedValueOnce(mockSuggestionsResponse);
    const suggestions = await engine.suggestImprovements();
    expect(suggestions.success).toBe(true);
    expect(suggestions.suggestions.length).toBeGreaterThan(0);
    
    // Step 3: Review first suggestion
    mockLLM.mockResolvedValueOnce(mockReviewResponse);
    const proposal = suggestions.suggestions[0].proposal;
    const review = await engine.reviewProposal(proposal);
    expect(review.success).toBe(true);
    
    // Graph still unchanged
    expect(engine.getGraph().nodes).toHaveLength(5);
    
    // Human can now decide to apply
    // (This would be done outside the engine)
  });
});
