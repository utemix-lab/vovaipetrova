/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROJECTION TESTS — P3.2/P3.3 Projections
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Тесты для базового класса Projection и ProjectionRegistry.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Projection, ProjectionRegistry } from "../Projection.js";
import { DevProjection } from "../DevProjection.js";
import { VisitorProjection } from "../VisitorProjection.js";
import { GraphModel } from "../GraphModel.js";
import { INTENSITY } from "../../ontology/highlightModel.js";

describe("Projection", () => {
  describe("base class", () => {
    it("should have name property", () => {
      class TestProjection extends Projection {
        constructor() {
          super("test");
        }
      }
      const projection = new TestProjection();
      expect(projection.name).toBe("test");
    });
    
    it("should have initialized property defaulting to false", () => {
      class TestProjection extends Projection {
        constructor() {
          super("test");
        }
      }
      const projection = new TestProjection();
      expect(projection.initialized).toBe(false);
    });
    
    it("should throw on abstract methods", () => {
      const projection = new Projection("abstract");
      expect(() => projection.init({})).toThrow("must be implemented");
      expect(() => projection.render({}, {})).toThrow("must be implemented");
      expect(() => projection.updateHighlight({})).toThrow("must be implemented");
      expect(() => projection.destroy()).toThrow("must be implemented");
    });
  });
});

describe("ProjectionRegistry", () => {
  let registry;
  
  beforeEach(() => {
    registry = new ProjectionRegistry();
  });
  
  it("should register projections", () => {
    const devProjection = new DevProjection();
    registry.register(devProjection);
    expect(registry.get("dev")).toBe(devProjection);
  });
  
  it("should return undefined for unknown projection", () => {
    expect(registry.get("unknown")).toBeUndefined();
  });
  
  it("should list projection names", () => {
    registry.register(new DevProjection());
    registry.register(new VisitorProjection());
    const names = registry.getNames();
    expect(names).toContain("dev");
    expect(names).toContain("visitor");
  });
  
  it("should have no active projection initially", () => {
    expect(registry.getActive()).toBeNull();
  });
  
  it("should throw when activating unknown projection", () => {
    expect(() => registry.activate("unknown", {})).toThrow('Projection "unknown" not found');
  });
});

/**
 * Создать полный контекст для тестов.
 */
function createTestContext(overrides = {}) {
  return {
    selectedNodeId: null,
    hoveredNodeId: null,
    scopeActive: false,
    scopeNodeIds: new Set(),
    typeHighlightActive: false,
    typeHighlightedNodeIds: new Set(),
    widgetHighlightedNodeId: null,
    ...overrides
  };
}

describe("DevProjection", () => {
  let devProjection;
  let graphModel;
  
  beforeEach(() => {
    devProjection = new DevProjection();
    graphModel = new GraphModel({
      nodes: [
        { id: "node1", type: "character" },
        { id: "node2", type: "domain" },
        { id: "node3", type: "character" }
      ],
      links: [
        { id: "edge1", source: "node1", target: "node2" },
        { id: "edge2", source: "node2", target: "node3" }
      ]
    });
  });
  
  it("should have name 'dev'", () => {
    expect(devProjection.name).toBe("dev");
  });
  
  describe("renderText", () => {
    it("should return string output", () => {
      const context = createTestContext({ selectedNodeId: "node1" });
      const output = devProjection.renderText(graphModel, context);
      expect(typeof output).toBe("string");
    });
    
    it("should include graph stats", () => {
      const context = createTestContext();
      const output = devProjection.renderText(graphModel, context);
      expect(output).toContain("GRAPH STATS");
      expect(output).toContain("Nodes: 3");
      expect(output).toContain("Edges: 2");
    });
    
    it("should include nodes by type", () => {
      const context = createTestContext();
      const output = devProjection.renderText(graphModel, context);
      expect(output).toContain("NODES BY TYPE");
      expect(output).toContain("character");
      expect(output).toContain("domain");
    });
    
    it("should include context info", () => {
      const context = createTestContext({
        selectedNodeId: "node1",
        hoveredNodeId: "node2",
        scopeActive: true
      });
      const output = devProjection.renderText(graphModel, context);
      expect(output).toContain("CONTEXT");
      expect(output).toContain("selectedNodeId: node1");
      expect(output).toContain("hoveredNodeId: node2");
      expect(output).toContain("scopeActive: true");
    });
    
    it("should include highlight state", () => {
      const context = createTestContext({ selectedNodeId: "node1" });
      const output = devProjection.renderText(graphModel, context);
      expect(output).toContain("HIGHLIGHT STATE");
      expect(output).toContain("mode:");
    });
    
    it("should include computation flow diagram", () => {
      const context = createTestContext();
      const output = devProjection.renderText(graphModel, context);
      expect(output).toContain("COMPUTATION FLOW");
      expect(output).toContain("computeHighlight()");
    });
  });
  
  describe("exportJSON", () => {
    it("should return object with graph data", () => {
      const context = createTestContext({ selectedNodeId: "node1" });
      const json = devProjection.exportJSON(graphModel, context);
      expect(json.graph).toBeDefined();
      expect(json.graph.nodes).toHaveLength(3);
      expect(json.graph.links).toHaveLength(2);
    });
    
    it("should return object with context", () => {
      const context = createTestContext({
        selectedNodeId: "node1",
        hoveredNodeId: "node2",
        scopeActive: true
      });
      const json = devProjection.exportJSON(graphModel, context);
      expect(json.context.selectedNodeId).toBe("node1");
      expect(json.context.hoveredNodeId).toBe("node2");
      expect(json.context.scopeActive).toBe(true);
    });
    
    it("should return object with highlight state", () => {
      const context = createTestContext({ selectedNodeId: "node1" });
      const json = devProjection.exportJSON(graphModel, context);
      expect(json.highlight).toBeDefined();
      expect(json.highlight.mode).toBeDefined();
      expect(json.highlight.nodeIntensities).toBeDefined();
      expect(json.highlight.edgeIntensities).toBeDefined();
    });
    
    it("should return object with stats", () => {
      const context = createTestContext();
      const json = devProjection.exportJSON(graphModel, context);
      expect(json.stats.nodes).toBe(3);
      expect(json.stats.edges).toBe(2);
      expect(json.stats.types).toContain("character");
      expect(json.stats.types).toContain("domain");
    });
  });
  
  describe("exportMarkdown", () => {
    it("should return markdown string", () => {
      const context = createTestContext({ selectedNodeId: "node1" });
      const md = devProjection.exportMarkdown(graphModel, context);
      expect(typeof md).toBe("string");
      expect(md).toContain("# Graph State Export");
    });
    
    it("should include stats section", () => {
      const context = createTestContext();
      const md = devProjection.exportMarkdown(graphModel, context);
      expect(md).toContain("## Stats");
      expect(md).toContain("Nodes: 3");
      expect(md).toContain("Edges: 2");
    });
    
    it("should include context section", () => {
      const context = createTestContext({ selectedNodeId: "node1" });
      const md = devProjection.exportMarkdown(graphModel, context);
      expect(md).toContain("## Context");
      expect(md).toContain("Selected: node1");
    });
  });
});

describe("VisitorProjection", () => {
  let visitorProjection;
  
  beforeEach(() => {
    visitorProjection = new VisitorProjection();
  });
  
  it("should have name 'visitor'", () => {
    expect(visitorProjection.name).toBe("visitor");
  });
  
  it("should not be initialized by default", () => {
    expect(visitorProjection.initialized).toBe(false);
  });
  
  describe("setGraph", () => {
    it("should set graph and nodesById", () => {
      const mockGraph = { graphData: () => ({ links: [] }) };
      const nodesById = new Map([["node1", { id: "node1" }]]);
      
      visitorProjection.setGraph(mockGraph, nodesById);
      
      expect(visitorProjection.graph).toBe(mockGraph);
      expect(visitorProjection.nodesById).toBe(nodesById);
      expect(visitorProjection.initialized).toBe(true);
    });
  });
  
  describe("applyHighlight", () => {
    it("should do nothing if not initialized", () => {
      const state = {
        mode: "selected",
        nodeIntensities: new Map(),
        edgeIntensities: new Map()
      };
      
      // Should not throw
      visitorProjection.applyHighlight(state);
      expect(visitorProjection.highlightMode).toBe("none");
    });
    
    it("should update highlightMode", () => {
      const mockGraph = {
        graphData: () => ({ links: [] }),
        refresh: () => {}
      };
      const nodesById = new Map();
      visitorProjection.setGraph(mockGraph, nodesById);
      
      const state = {
        mode: "selected",
        nodeIntensities: new Map(),
        edgeIntensities: new Map()
      };
      
      visitorProjection.applyHighlight(state);
      expect(visitorProjection.highlightMode).toBe("selected");
    });
    
    it("should populate highlightNodes from state", () => {
      const node1 = { id: "node1" };
      const node2 = { id: "node2" };
      const mockGraph = {
        graphData: () => ({ links: [] }),
        refresh: () => {}
      };
      const nodesById = new Map([
        ["node1", node1],
        ["node2", node2]
      ]);
      visitorProjection.setGraph(mockGraph, nodesById);
      
      const state = {
        mode: "selected",
        nodeIntensities: new Map([
          ["node1", INTENSITY.FULL],
          ["node2", INTENSITY.DIM]
        ]),
        edgeIntensities: new Map()
      };
      
      visitorProjection.applyHighlight(state);
      
      expect(visitorProjection.highlightNodes.has(node1)).toBe(true);
      expect(visitorProjection.highlightNodes.has(node2)).toBe(false);
    });
    
    it("should populate highlightLinks from state", () => {
      const link1 = { id: "link1" };
      const link2 = { id: "link2" };
      const mockGraph = {
        graphData: () => ({ links: [link1, link2] }),
        refresh: () => {}
      };
      const nodesById = new Map();
      visitorProjection.setGraph(mockGraph, nodesById);
      
      const state = {
        mode: "hover",
        nodeIntensities: new Map(),
        edgeIntensities: new Map([
          ["link1", INTENSITY.FULL],
          ["link2", INTENSITY.HALF]
        ])
      };
      
      visitorProjection.applyHighlight(state);
      
      expect(visitorProjection.highlightLinks.has(link1)).toBe(true);
      expect(visitorProjection.halfHighlightLinks.has(link2)).toBe(true);
    });
    
    it("should call applyNodeMaterial for each node", () => {
      const mockGraph = {
        graphData: () => ({ links: [] }),
        refresh: () => {}
      };
      const nodesById = new Map([
        ["node1", { id: "node1" }],
        ["node2", { id: "node2" }]
      ]);
      visitorProjection.setGraph(mockGraph, nodesById);
      
      const appliedNodes = [];
      visitorProjection.setApplyNodeMaterial((nodeId) => {
        appliedNodes.push(nodeId);
      });
      
      const state = {
        mode: "selected",
        nodeIntensities: new Map(),
        edgeIntensities: new Map()
      };
      
      visitorProjection.applyHighlight(state);
      
      expect(appliedNodes).toContain("node1");
      expect(appliedNodes).toContain("node2");
    });
    
    it("should call graph.refresh()", () => {
      let refreshCalled = false;
      const mockGraph = {
        graphData: () => ({ links: [] }),
        refresh: () => { refreshCalled = true; }
      };
      const nodesById = new Map();
      visitorProjection.setGraph(mockGraph, nodesById);
      
      const state = {
        mode: "selected",
        nodeIntensities: new Map(),
        edgeIntensities: new Map()
      };
      
      visitorProjection.applyHighlight(state);
      
      expect(refreshCalled).toBe(true);
    });
  });
  
  describe("helper methods", () => {
    it("isNodeHighlighted should check highlightNodes set", () => {
      const node = { id: "node1" };
      visitorProjection.highlightNodes.add(node);
      
      expect(visitorProjection.isNodeHighlighted(node)).toBe(true);
      expect(visitorProjection.isNodeHighlighted({ id: "other" })).toBe(false);
    });
    
    it("isLinkHighlighted should check highlightLinks set", () => {
      const link = { id: "link1" };
      visitorProjection.highlightLinks.add(link);
      
      expect(visitorProjection.isLinkHighlighted(link)).toBe(true);
      expect(visitorProjection.isLinkHighlighted({ id: "other" })).toBe(false);
    });
    
    it("isLinkHalfHighlighted should check halfHighlightLinks set", () => {
      const link = { id: "link1" };
      visitorProjection.halfHighlightLinks.add(link);
      
      expect(visitorProjection.isLinkHalfHighlighted(link)).toBe(true);
      expect(visitorProjection.isLinkHalfHighlighted({ id: "other" })).toBe(false);
    });
    
    it("getHighlightMode should return current mode", () => {
      visitorProjection.highlightMode = "hover";
      expect(visitorProjection.getHighlightMode()).toBe("hover");
    });
    
    it("getHighlightSets should return all sets", () => {
      const node = { id: "node1" };
      const link = { id: "link1" };
      visitorProjection.highlightNodes.add(node);
      visitorProjection.highlightLinks.add(link);
      visitorProjection.highlightMode = "selected";
      
      const sets = visitorProjection.getHighlightSets();
      
      expect(sets.highlightNodes.has(node)).toBe(true);
      expect(sets.highlightLinks.has(link)).toBe(true);
      expect(sets.highlightMode).toBe("selected");
    });
  });
  
  describe("exportState", () => {
    it("should return projection state", () => {
      visitorProjection.highlightMode = "hover";
      visitorProjection.highlightNodes.add({ id: "node1" });
      visitorProjection.highlightLinks.add({ id: "link1" });
      visitorProjection.halfHighlightLinks.add({ id: "link2" });
      
      const state = visitorProjection.exportState();
      
      expect(state.name).toBe("visitor");
      expect(state.highlightMode).toBe("hover");
      expect(state.highlightedNodeCount).toBe(1);
      expect(state.highlightedLinkCount).toBe(1);
      expect(state.halfHighlightedLinkCount).toBe(1);
    });
  });
  
  describe("destroy", () => {
    it("should clear all state", () => {
      const mockGraph = {
        graphData: () => ({ links: [] }),
        refresh: () => {}
      };
      const nodesById = new Map([["node1", { id: "node1" }]]);
      visitorProjection.setGraph(mockGraph, nodesById);
      visitorProjection.highlightNodes.add({ id: "node1" });
      visitorProjection.highlightLinks.add({ id: "link1" });
      
      visitorProjection.destroy();
      
      expect(visitorProjection.graph).toBeNull();
      expect(visitorProjection.nodesById).toBeNull();
      expect(visitorProjection.highlightNodes.size).toBe(0);
      expect(visitorProjection.highlightLinks.size).toBe(0);
      expect(visitorProjection.initialized).toBe(false);
    });
  });
});

describe("Projection purity", () => {
  it("DevProjection does not mutate graphModel", () => {
    const graphModel = new GraphModel({
      nodes: [{ id: "node1", type: "character" }],
      edges: []
    });
    const devProjection = new DevProjection();
    
    const nodesBefore = graphModel.nodesById.size;
    const edgesBefore = graphModel.edges.length;
    
    const context = createTestContext({ selectedNodeId: "node1" });
    devProjection.renderText(graphModel, context);
    devProjection.exportJSON(graphModel, context);
    devProjection.exportMarkdown(graphModel, context);
    
    expect(graphModel.nodesById.size).toBe(nodesBefore);
    expect(graphModel.edges.length).toBe(edgesBefore);
  });
  
  it("VisitorProjection does not mutate highlightState", () => {
    const visitorProjection = new VisitorProjection();
    const mockGraph = {
      graphData: () => ({ links: [] }),
      refresh: () => {}
    };
    visitorProjection.setGraph(mockGraph, new Map());
    
    const state = {
      mode: "selected",
      nodeIntensities: new Map([["node1", INTENSITY.FULL]]),
      edgeIntensities: new Map([["edge1", INTENSITY.HALF]])
    };
    
    const nodeIntensitiesBefore = state.nodeIntensities.size;
    const edgeIntensitiesBefore = state.edgeIntensities.size;
    
    visitorProjection.applyHighlight(state);
    
    expect(state.nodeIntensities.size).toBe(nodeIntensitiesBefore);
    expect(state.edgeIntensities.size).toBe(edgeIntensitiesBefore);
    expect(state.mode).toBe("selected");
  });
});
