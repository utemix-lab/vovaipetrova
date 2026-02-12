/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRUCTURAL INVARIANTS — ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2b: Structural Invariants
 * 
 * Покрытие:
 * - Graph Invariants (INV-G1 to INV-G4)
 * - Identity Invariants (INV-I1 to INV-I4)
 * - Edge Invariants (INV-E1 to INV-E3)
 * - Connectivity Invariants (INV-C1 to INV-C3)
 * - Hierarchy Invariants (INV-H1 to INV-H2)
 * - InvariantChecker
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
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
} from "../StructuralInvariants.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const validGraph = {
  nodes: [
    { id: "universe", label: "Universe", type: "root" },
    { id: "characters", label: "Characters", type: "hub" },
    { id: "vova", label: "Вова", type: "character" },
  ],
  edges: [
    { id: "e1", source: "universe", target: "characters", type: "structural" },
    { id: "e2", source: "characters", target: "vova", type: "contains" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// GRAPH INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INV-G1: Unique Node IDs", () => {
  it("should pass for unique IDs", () => {
    const result = checkUniqueNodeIds(validGraph);
    expect(result.holds).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
  
  it("should fail for duplicate IDs", () => {
    const graph = {
      nodes: [
        { id: "same", label: "A", type: "character" },
        { id: "same", label: "B", type: "character" },
      ],
      edges: [],
    };
    
    const result = checkUniqueNodeIds(graph);
    expect(result.holds).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe("duplicate_id");
  });
  
  it("should handle empty graph", () => {
    const result = checkUniqueNodeIds({ nodes: [], edges: [] });
    expect(result.holds).toBe(true);
  });
});

describe("INV-G2: Unique Edge IDs", () => {
  it("should pass for unique IDs", () => {
    const result = checkUniqueEdgeIds(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for duplicate IDs", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "character" }],
      edges: [
        { id: "same", source: "a", target: "a", type: "relates" },
        { id: "same", source: "a", target: "a", type: "relates" },
      ],
    };
    
    const result = checkUniqueEdgeIds(graph);
    expect(result.holds).toBe(false);
  });
  
  it("should fail for missing edge ID", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "character" }],
      edges: [{ source: "a", target: "a", type: "relates" }],
    };
    
    const result = checkUniqueEdgeIds(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].type).toBe("missing_id");
  });
});

describe("INV-G3: No Dangling Edges", () => {
  it("should pass for valid edges", () => {
    const result = checkNoDanglingEdges(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for dangling source", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "character" }],
      edges: [{ id: "e1", source: "nonexistent", target: "a", type: "relates" }],
    };
    
    const result = checkNoDanglingEdges(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].type).toBe("dangling_source");
  });
  
  it("should fail for dangling target", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "character" }],
      edges: [{ id: "e1", source: "a", target: "nonexistent", type: "relates" }],
    };
    
    const result = checkNoDanglingEdges(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].type).toBe("dangling_target");
  });
});

describe("INV-G4: No Self-Loops", () => {
  it("should pass for no self-loops", () => {
    const result = checkNoSelfLoops(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for self-loop", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "character" }],
      edges: [{ id: "e1", source: "a", target: "a", type: "relates" }],
    };
    
    const result = checkNoSelfLoops(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].type).toBe("self_loop");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INV-I1: All Nodes Have ID", () => {
  it("should pass for valid nodes", () => {
    const result = checkAllNodesHaveId(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for missing ID", () => {
    const graph = {
      nodes: [{ label: "No ID", type: "character" }],
      edges: [],
    };
    
    const result = checkAllNodesHaveId(graph);
    expect(result.holds).toBe(false);
  });
  
  it("should fail for empty string ID", () => {
    const graph = {
      nodes: [{ id: "", label: "Empty ID", type: "character" }],
      edges: [],
    };
    
    const result = checkAllNodesHaveId(graph);
    expect(result.holds).toBe(false);
  });
  
  it("should fail for non-string ID", () => {
    const graph = {
      nodes: [{ id: 123, label: "Number ID", type: "character" }],
      edges: [],
    };
    
    const result = checkAllNodesHaveId(graph);
    expect(result.holds).toBe(false);
  });
});

describe("INV-I2: All Nodes Have Type", () => {
  it("should pass for valid nodes", () => {
    const result = checkAllNodesHaveType(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for missing type", () => {
    const graph = {
      nodes: [{ id: "a", label: "No Type" }],
      edges: [],
    };
    
    const result = checkAllNodesHaveType(graph);
    expect(result.holds).toBe(false);
  });
});

describe("INV-I3: Known Node Types", () => {
  it("should pass for known types", () => {
    const result = checkKnownNodeTypes(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for unknown type", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "unknown-type" }],
      edges: [],
    };
    
    const result = checkKnownNodeTypes(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].nodeType).toBe("unknown-type");
  });
});

describe("INV-I4: All Nodes Have Label", () => {
  it("should pass for valid nodes", () => {
    const result = checkAllNodesHaveLabel(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for missing label", () => {
    const graph = {
      nodes: [{ id: "a", type: "character" }],
      edges: [],
    };
    
    const result = checkAllNodesHaveLabel(graph);
    expect(result.holds).toBe(false);
  });
  
  it("should fail for empty label", () => {
    const graph = {
      nodes: [{ id: "a", label: "  ", type: "character" }],
      edges: [],
    };
    
    const result = checkAllNodesHaveLabel(graph);
    expect(result.holds).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INV-E1: All Edges Have Type", () => {
  it("should pass for valid edges", () => {
    const result = checkAllEdgesHaveType(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for missing type", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
      ],
      edges: [{ id: "e1", source: "a", target: "b" }],
    };
    
    const result = checkAllEdgesHaveType(graph);
    expect(result.holds).toBe(false);
  });
});

describe("INV-E2: Known Edge Types", () => {
  it("should pass for known types", () => {
    const result = checkKnownEdgeTypes(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for unknown type", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
      ],
      edges: [{ id: "e1", source: "a", target: "b", type: "unknown-edge" }],
    };
    
    const result = checkKnownEdgeTypes(graph);
    expect(result.holds).toBe(false);
  });
});

describe("INV-E3: No Duplicate Edges", () => {
  it("should pass for unique edges", () => {
    const result = checkNoDuplicateEdges(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for duplicate edges", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b", type: "relates" },
        { id: "e2", source: "a", target: "b", type: "relates" },
      ],
    };
    
    const result = checkNoDuplicateEdges(graph);
    expect(result.holds).toBe(false);
  });
  
  it("should allow same source/target with different types", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b", type: "relates" },
        { id: "e2", source: "a", target: "b", type: "collaborates" },
      ],
    };
    
    const result = checkNoDuplicateEdges(graph);
    expect(result.holds).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTIVITY INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INV-C1: Graph Connected", () => {
  it("should pass for connected graph", () => {
    const result = checkGraphConnected(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for disconnected graph", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
        { id: "c", label: "C", type: "character" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b", type: "relates" },
        // c is disconnected
      ],
    };
    
    const result = checkGraphConnected(graph);
    expect(result.holds).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].nodeId).toBe("c");
  });
  
  it("should pass for empty graph", () => {
    const result = checkGraphConnected({ nodes: [], edges: [] });
    expect(result.holds).toBe(true);
  });
  
  it("should pass for single node", () => {
    const graph = {
      nodes: [{ id: "a", label: "A", type: "character" }],
      edges: [],
    };
    
    const result = checkGraphConnected(graph);
    expect(result.holds).toBe(true);
  });
});

describe("INV-C2: No Isolated Nodes", () => {
  it("should pass for connected nodes", () => {
    const result = checkNoIsolatedNodes(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for isolated node", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
        { id: "isolated", label: "Isolated", type: "character" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b", type: "relates" },
      ],
    };
    
    const result = checkNoIsolatedNodes(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].nodeId).toBe("isolated");
  });
});

describe("INV-C3: Has Root Node", () => {
  it("should pass for graph with root", () => {
    const result = checkHasRootNode(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for graph without root", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "hub" },
      ],
      edges: [],
    };
    
    const result = checkHasRootNode(graph);
    expect(result.holds).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HIERARCHY INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INV-H1: No Contains Cycles", () => {
  it("should pass for acyclic hierarchy", () => {
    const result = checkNoContainsCycles(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for cycle in contains", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "hub" },
        { id: "b", label: "B", type: "hub" },
        { id: "c", label: "C", type: "hub" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b", type: "contains" },
        { id: "e2", source: "b", target: "c", type: "contains" },
        { id: "e3", source: "c", target: "a", type: "contains" }, // cycle!
      ],
    };
    
    const result = checkNoContainsCycles(graph);
    expect(result.holds).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
  
  it("should ignore non-contains edges", () => {
    const graph = {
      nodes: [
        { id: "a", label: "A", type: "character" },
        { id: "b", label: "B", type: "character" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b", type: "relates" },
        { id: "e2", source: "b", target: "a", type: "relates" }, // not a cycle in contains
      ],
    };
    
    const result = checkNoContainsCycles(graph);
    expect(result.holds).toBe(true);
  });
});

describe("INV-H2: Single Parent in Contains", () => {
  it("should pass for single parent", () => {
    const result = checkSingleParent(validGraph);
    expect(result.holds).toBe(true);
  });
  
  it("should fail for multiple parents", () => {
    const graph = {
      nodes: [
        { id: "parent1", label: "Parent 1", type: "hub" },
        { id: "parent2", label: "Parent 2", type: "hub" },
        { id: "child", label: "Child", type: "character" },
      ],
      edges: [
        { id: "e1", source: "parent1", target: "child", type: "contains" },
        { id: "e2", source: "parent2", target: "child", type: "contains" }, // second parent!
      ],
    };
    
    const result = checkSingleParent(graph);
    expect(result.holds).toBe(false);
    expect(result.violations[0].nodeId).toBe("child");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INVARIANT CHECKER
// ═══════════════════════════════════════════════════════════════════════════

describe("InvariantChecker", () => {
  let checker;
  
  beforeEach(() => {
    checker = new InvariantChecker();
  });
  
  describe("checkAll", () => {
    it("should pass for valid graph with MINIMAL strictness", () => {
      const result = checker.checkAll(validGraph, STRICTNESS.MINIMAL);
      
      expect(result.valid).toBe(true);
      expect(result.total).toBe(5); // G1, G2, G3, I1, I2
      expect(result.passed).toBe(5);
      expect(result.failed).toBe(0);
    });
    
    it("should pass for valid graph with STANDARD strictness", () => {
      const result = checker.checkAll(validGraph, STRICTNESS.STANDARD);
      
      expect(result.valid).toBe(true);
      expect(result.total).toBe(8); // + E1, C2, G4
      expect(result.passed).toBe(8);
    });
    
    it("should pass for valid graph with STRICT strictness", () => {
      const result = checker.checkAll(validGraph, STRICTNESS.STRICT);
      
      expect(result.valid).toBe(true);
      expect(result.total).toBe(16); // all invariants
      expect(result.passed).toBe(16);
    });
    
    it("should fail for invalid graph", () => {
      const invalidGraph = {
        nodes: [
          { id: "a", label: "A", type: "character" },
          { id: "a", label: "B", type: "character" }, // duplicate
        ],
        edges: [],
      };
      
      const result = checker.checkAll(invalidGraph, STRICTNESS.MINIMAL);
      
      expect(result.valid).toBe(false);
      expect(result.failed).toBeGreaterThan(0);
    });
    
    it("should return violations list", () => {
      const invalidGraph = {
        nodes: [
          { id: "a", label: "A", type: "character" },
          { id: "a", label: "B", type: "character" },
        ],
        edges: [],
      };
      
      const result = checker.checkAll(invalidGraph, STRICTNESS.MINIMAL);
      
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].name).toBe("INV-G1: Unique Node IDs");
    });
  });
  
  describe("checkOne", () => {
    it("should check specific invariant", () => {
      const result = checker.checkOne("INV-G1", validGraph);
      
      expect(result).not.toBeNull();
      expect(result.name).toBe("INV-G1: Unique Node IDs");
      expect(result.holds).toBe(true);
    });
    
    it("should return null for unknown invariant", () => {
      const result = checker.checkOne("INV-UNKNOWN", validGraph);
      expect(result).toBeNull();
    });
    
    it("should check all known invariants", () => {
      const invariants = InvariantChecker.listInvariants();
      
      for (const inv of invariants) {
        const result = checker.checkOne(inv.id, validGraph);
        expect(result).not.toBeNull();
        expect(result.name).toContain(inv.id);
      }
    });
  });
  
  describe("listInvariants", () => {
    it("should return all invariants", () => {
      const list = InvariantChecker.listInvariants();
      
      expect(list.length).toBe(16);
      expect(list[0].id).toBe("INV-G1");
      expect(list[0].category).toBe("Graph");
    });
    
    it("should have all categories", () => {
      const list = InvariantChecker.listInvariants();
      const categories = new Set(list.map(i => i.category));
      
      expect(categories.has("Graph")).toBe(true);
      expect(categories.has("Identity")).toBe(true);
      expect(categories.has("Edge")).toBe(true);
      expect(categories.has("Connectivity")).toBe(true);
      expect(categories.has("Hierarchy")).toBe(true);
    });
  });
  
  describe("reset", () => {
    it("should clear results", () => {
      checker.checkAll(validGraph);
      expect(checker.results.length).toBeGreaterThan(0);
      
      checker.reset();
      expect(checker.results).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STRICTNESS
// ═══════════════════════════════════════════════════════════════════════════

describe("STRICTNESS", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(STRICTNESS)).toBe(true);
  });
  
  it("should have three levels", () => {
    expect(STRICTNESS.MINIMAL).toBe("minimal");
    expect(STRICTNESS.STANDARD).toBe("standard");
    expect(STRICTNESS.STRICT).toBe("strict");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION — Real universe.json structure
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration: universe.json structure", () => {
  const universeGraph = {
    nodes: [
      { id: "universe", label: "Universe", type: "root", visibility: "public", status: "core" },
      { id: "characters", label: "Characters", type: "hub", visibility: "public", status: "expandable" },
      { id: "domains", label: "Domains", type: "hub", visibility: "public", status: "expandable" },
      { id: "character-vova", label: "Вова", type: "character", visibility: "public", status: "core" },
      { id: "domain-ai", label: "AI & Computational Models", type: "domain", visibility: "public", status: "expandable" },
    ],
    edges: [
      { id: "edge-universe-characters", source: "universe", target: "characters", type: "structural" },
      { id: "edge-universe-domains", source: "universe", target: "domains", type: "structural" },
      { id: "edge-characters-contains-vova", source: "characters", target: "character-vova", type: "contains" },
      { id: "edge-domains-contains-ai", source: "domains", target: "domain-ai", type: "contains" },
      { id: "edge-vova-relates-ai", source: "character-vova", target: "domain-ai", type: "relates" },
    ],
  };
  
  it("should pass all invariants with STRICT", () => {
    const checker = new InvariantChecker();
    const result = checker.checkAll(universeGraph, STRICTNESS.STRICT);
    
    expect(result.valid).toBe(true);
    expect(result.summary).toContain("All");
  });
  
  it("should detect issues in modified graph", () => {
    const brokenGraph = {
      ...universeGraph,
      edges: [
        ...universeGraph.edges,
        { id: "dangling", source: "nonexistent", target: "universe", type: "structural" },
      ],
    };
    
    const checker = new InvariantChecker();
    const result = checker.checkAll(brokenGraph, STRICTNESS.MINIMAL);
    
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.name.includes("Dangling"))).toBe(true);
  });
});
