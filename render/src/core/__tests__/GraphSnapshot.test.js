/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH SNAPSHOT — ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2c: Versioned Snapshots
 * 
 * Покрытие:
 * - GraphSnapshot (создание, accessors, stats, serialization)
 * - diffSnapshots (added, removed, modified)
 * - SnapshotHistory (add, get, diff, evolution)
 * - CHANGE_TYPE, SNAPSHOT_VERSION
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  GraphSnapshot,
  SnapshotHistory,
  diffSnapshots,
  CHANGE_TYPE,
  SNAPSHOT_VERSION,
} from "../GraphSnapshot.js";

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const sampleGraph = {
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
// SNAPSHOT_VERSION
// ═══════════════════════════════════════════════════════════════════════════

describe("SNAPSHOT_VERSION", () => {
  it("should be a valid semver string", () => {
    expect(SNAPSHOT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
  
  it("should be 1.0.0", () => {
    expect(SNAPSHOT_VERSION).toBe("1.0.0");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CHANGE_TYPE
// ═══════════════════════════════════════════════════════════════════════════

describe("CHANGE_TYPE", () => {
  it("should be frozen", () => {
    expect(Object.isFrozen(CHANGE_TYPE)).toBe(true);
  });
  
  it("should have three types", () => {
    expect(CHANGE_TYPE.ADDED).toBe("added");
    expect(CHANGE_TYPE.REMOVED).toBe("removed");
    expect(CHANGE_TYPE.MODIFIED).toBe("modified");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GRAPH SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

describe("GraphSnapshot", () => {
  describe("constructor", () => {
    it("should create snapshot from graph data", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      
      expect(snapshot.nodes).toHaveLength(3);
      expect(snapshot.edges).toHaveLength(2);
    });
    
    it("should generate unique id", () => {
      const snap1 = new GraphSnapshot(sampleGraph);
      const snap2 = new GraphSnapshot(sampleGraph);
      
      expect(snap1.id).not.toBe(snap2.id);
      expect(snap1.id).toMatch(/^snap-/);
    });
    
    it("should accept custom id", () => {
      const snapshot = new GraphSnapshot(sampleGraph, { id: "my-snapshot" });
      expect(snapshot.id).toBe("my-snapshot");
    });
    
    it("should set timestamp", () => {
      const before = Date.now();
      const snapshot = new GraphSnapshot(sampleGraph);
      const after = Date.now();
      
      expect(snapshot.timestamp).toBeGreaterThanOrEqual(before);
      expect(snapshot.timestamp).toBeLessThanOrEqual(after);
    });
    
    it("should accept custom timestamp", () => {
      const ts = 1234567890;
      const snapshot = new GraphSnapshot(sampleGraph, { timestamp: ts });
      expect(snapshot.timestamp).toBe(ts);
    });
    
    it("should freeze nodes and edges", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      
      expect(Object.isFrozen(snapshot.nodes)).toBe(true);
      expect(Object.isFrozen(snapshot.edges)).toBe(true);
      expect(Object.isFrozen(snapshot.nodes[0])).toBe(true);
    });
    
    it("should freeze metadata", () => {
      const snapshot = new GraphSnapshot(sampleGraph, {
        description: "Test",
        tags: ["test"],
      });
      
      expect(Object.isFrozen(snapshot.metadata)).toBe(true);
      expect(Object.isFrozen(snapshot.metadata.tags)).toBe(true);
    });
    
    it("should include schema version", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      expect(snapshot.schemaVersion).toBeDefined();
    });
    
    it("should include snapshot version", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      expect(snapshot.snapshotVersion).toBe(SNAPSHOT_VERSION);
    });
    
    it("should handle empty graph", () => {
      const snapshot = new GraphSnapshot({ nodes: [], edges: [] });
      
      expect(snapshot.nodes).toHaveLength(0);
      expect(snapshot.edges).toHaveLength(0);
    });
    
    it("should handle links instead of edges", () => {
      const graph = {
        nodes: [{ id: "a", label: "A", type: "character" }],
        links: [{ id: "e1", source: "a", target: "a", type: "relates" }],
      };
      
      const snapshot = new GraphSnapshot(graph);
      expect(snapshot.edges).toHaveLength(1);
    });
  });
  
  describe("accessors", () => {
    let snapshot;
    
    beforeEach(() => {
      snapshot = new GraphSnapshot(sampleGraph);
    });
    
    it("should get node by id", () => {
      const node = snapshot.getNodeById("vova");
      expect(node).toBeDefined();
      expect(node.label).toBe("Вова");
    });
    
    it("should return undefined for unknown node", () => {
      expect(snapshot.getNodeById("unknown")).toBeUndefined();
    });
    
    it("should get edge by id", () => {
      const edge = snapshot.getEdgeById("e1");
      expect(edge).toBeDefined();
      expect(edge.type).toBe("structural");
    });
    
    it("should return undefined for unknown edge", () => {
      expect(snapshot.getEdgeById("unknown")).toBeUndefined();
    });
    
    it("should get all node ids", () => {
      const ids = snapshot.getNodeIds();
      expect(ids.size).toBe(3);
      expect(ids.has("universe")).toBe(true);
      expect(ids.has("vova")).toBe(true);
    });
    
    it("should get all edge ids", () => {
      const ids = snapshot.getEdgeIds();
      expect(ids.size).toBe(2);
      expect(ids.has("e1")).toBe(true);
    });
    
    it("should check node existence", () => {
      expect(snapshot.hasNode("vova")).toBe(true);
      expect(snapshot.hasNode("unknown")).toBe(false);
    });
    
    it("should check edge existence", () => {
      expect(snapshot.hasEdge("e1")).toBe(true);
      expect(snapshot.hasEdge("unknown")).toBe(false);
    });
  });
  
  describe("getStats", () => {
    it("should return statistics", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      const stats = snapshot.getStats();
      
      expect(stats.nodeCount).toBe(3);
      expect(stats.edgeCount).toBe(2);
      expect(stats.id).toBe(snapshot.id);
      expect(stats.timestamp).toBe(snapshot.timestamp);
    });
    
    it("should count node types", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      const stats = snapshot.getStats();
      
      expect(stats.nodeTypes.root).toBe(1);
      expect(stats.nodeTypes.hub).toBe(1);
      expect(stats.nodeTypes.character).toBe(1);
    });
    
    it("should count edge types", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      const stats = snapshot.getStats();
      
      expect(stats.edgeTypes.structural).toBe(1);
      expect(stats.edgeTypes.contains).toBe(1);
    });
    
    it("should handle unknown types", () => {
      const graph = {
        nodes: [{ id: "a" }],
        edges: [{ id: "e1", source: "a", target: "a" }],
      };
      
      const snapshot = new GraphSnapshot(graph);
      const stats = snapshot.getStats();
      
      expect(stats.nodeTypes.unknown).toBe(1);
      expect(stats.edgeTypes.unknown).toBe(1);
    });
  });
  
  describe("serialization", () => {
    it("should serialize to JSON", () => {
      const snapshot = new GraphSnapshot(sampleGraph, {
        id: "test-snap",
        description: "Test snapshot",
        tags: ["test"],
      });
      
      const json = snapshot.toJSON();
      
      expect(json.id).toBe("test-snap");
      expect(json.nodes).toHaveLength(3);
      expect(json.edges).toHaveLength(2);
      expect(json.metadata.description).toBe("Test snapshot");
    });
    
    it("should deserialize from JSON", () => {
      const original = new GraphSnapshot(sampleGraph, {
        id: "test-snap",
        description: "Test",
      });
      
      const json = original.toJSON();
      const restored = GraphSnapshot.fromJSON(json);
      
      expect(restored.id).toBe(original.id);
      expect(restored.nodes).toHaveLength(original.nodes.length);
      expect(restored.edges).toHaveLength(original.edges.length);
    });
    
    it("should preserve node data through serialization", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      const json = snapshot.toJSON();
      const restored = GraphSnapshot.fromJSON(json);
      
      const node = restored.getNodeById("vova");
      expect(node.label).toBe("Вова");
      expect(node.type).toBe("character");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DIFF SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════════════

describe("diffSnapshots", () => {
  describe("no changes", () => {
    it("should detect no changes for identical snapshots", () => {
      const snap1 = new GraphSnapshot(sampleGraph);
      const snap2 = new GraphSnapshot(sampleGraph);
      
      const diff = diffSnapshots(snap1, snap2);
      
      expect(diff.summary.hasChanges).toBe(false);
      expect(diff.summary.totalChanges).toBe(0);
    });
  });
  
  describe("added nodes", () => {
    it("should detect added nodes", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        ...sampleGraph,
        nodes: [
          ...sampleGraph.nodes,
          { id: "new-node", label: "New", type: "character" },
        ],
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.nodes.added).toHaveLength(1);
      expect(diff.nodes.added[0].id).toBe("new-node");
      expect(diff.nodes.added[0].changeType).toBe(CHANGE_TYPE.ADDED);
    });
  });
  
  describe("removed nodes", () => {
    it("should detect removed nodes", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        ...sampleGraph,
        nodes: sampleGraph.nodes.filter(n => n.id !== "vova"),
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.nodes.removed).toHaveLength(1);
      expect(diff.nodes.removed[0].id).toBe("vova");
      expect(diff.nodes.removed[0].changeType).toBe(CHANGE_TYPE.REMOVED);
    });
  });
  
  describe("modified nodes", () => {
    it("should detect modified nodes", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        ...sampleGraph,
        nodes: sampleGraph.nodes.map(n =>
          n.id === "vova" ? { ...n, label: "Владимир" } : n
        ),
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.nodes.modified).toHaveLength(1);
      expect(diff.nodes.modified[0].id).toBe("vova");
      expect(diff.nodes.modified[0].changes[0].field).toBe("label");
      expect(diff.nodes.modified[0].changes[0].before).toBe("Вова");
      expect(diff.nodes.modified[0].changes[0].after).toBe("Владимир");
    });
  });
  
  describe("added edges", () => {
    it("should detect added edges", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        ...sampleGraph,
        edges: [
          ...sampleGraph.edges,
          { id: "e3", source: "vova", target: "universe", type: "relates" },
        ],
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.edges.added).toHaveLength(1);
      expect(diff.edges.added[0].id).toBe("e3");
    });
  });
  
  describe("removed edges", () => {
    it("should detect removed edges", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        ...sampleGraph,
        edges: sampleGraph.edges.filter(e => e.id !== "e2"),
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.edges.removed).toHaveLength(1);
      expect(diff.edges.removed[0].id).toBe("e2");
    });
  });
  
  describe("modified edges", () => {
    it("should detect modified edges", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        ...sampleGraph,
        edges: sampleGraph.edges.map(e =>
          e.id === "e1" ? { ...e, type: "contains" } : e
        ),
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.edges.modified).toHaveLength(1);
      expect(diff.edges.modified[0].id).toBe("e1");
    });
  });
  
  describe("summary", () => {
    it("should provide accurate summary", () => {
      const before = new GraphSnapshot(sampleGraph);
      const afterGraph = {
        nodes: [
          { id: "universe", label: "Universe Updated", type: "root" },
          { id: "characters", label: "Characters", type: "hub" },
          { id: "new-node", label: "New", type: "character" },
        ],
        edges: [
          { id: "e1", source: "universe", target: "characters", type: "structural" },
          { id: "e3", source: "new-node", target: "universe", type: "relates" },
        ],
      };
      const after = new GraphSnapshot(afterGraph);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.summary.nodesAdded).toBe(1);
      expect(diff.summary.nodesRemoved).toBe(1);
      expect(diff.summary.nodesModified).toBe(1);
      expect(diff.summary.edgesAdded).toBe(1);
      expect(diff.summary.edgesRemoved).toBe(1);
      expect(diff.summary.edgesModified).toBe(0);
      expect(diff.summary.totalChanges).toBe(5);
      expect(diff.summary.hasChanges).toBe(true);
    });
    
    it("should include before/after metadata", () => {
      const before = new GraphSnapshot(sampleGraph, { id: "snap-1" });
      const after = new GraphSnapshot(sampleGraph, { id: "snap-2" });
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.before.id).toBe("snap-1");
      expect(diff.after.id).toBe("snap-2");
    });
  });
  
  describe("deep comparison", () => {
    it("should detect nested object changes", () => {
      const graph1 = {
        nodes: [{ id: "a", position: { x: 0, y: 0 } }],
        edges: [],
      };
      const graph2 = {
        nodes: [{ id: "a", position: { x: 100, y: 0 } }],
        edges: [],
      };
      
      const before = new GraphSnapshot(graph1);
      const after = new GraphSnapshot(graph2);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.nodes.modified).toHaveLength(1);
      expect(diff.nodes.modified[0].changes[0].field).toBe("position");
    });
    
    it("should detect array changes", () => {
      const graph1 = {
        nodes: [{ id: "a", tags: ["one", "two"] }],
        edges: [],
      };
      const graph2 = {
        nodes: [{ id: "a", tags: ["one", "three"] }],
        edges: [],
      };
      
      const before = new GraphSnapshot(graph1);
      const after = new GraphSnapshot(graph2);
      
      const diff = diffSnapshots(before, after);
      
      expect(diff.nodes.modified).toHaveLength(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT HISTORY
// ═══════════════════════════════════════════════════════════════════════════

describe("SnapshotHistory", () => {
  let history;
  
  beforeEach(() => {
    history = new SnapshotHistory();
  });
  
  describe("add", () => {
    it("should add snapshot", () => {
      const snapshot = new GraphSnapshot(sampleGraph);
      history.add(snapshot);
      
      expect(history.size()).toBe(1);
    });
    
    it("should reject duplicate ids", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "same" });
      const snap2 = new GraphSnapshot(sampleGraph, { id: "same" });
      
      history.add(snap1);
      expect(() => history.add(snap2)).toThrow();
    });
  });
  
  describe("getById", () => {
    it("should get snapshot by id", () => {
      const snapshot = new GraphSnapshot(sampleGraph, { id: "test" });
      history.add(snapshot);
      
      const found = history.getById("test");
      expect(found).toBe(snapshot);
    });
    
    it("should return undefined for unknown id", () => {
      expect(history.getById("unknown")).toBeUndefined();
    });
  });
  
  describe("getLatest / getFirst", () => {
    it("should get latest snapshot", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "first" });
      const snap2 = new GraphSnapshot(sampleGraph, { id: "second" });
      
      history.add(snap1);
      history.add(snap2);
      
      expect(history.getLatest()).toBe(snap2);
    });
    
    it("should get first snapshot", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "first" });
      const snap2 = new GraphSnapshot(sampleGraph, { id: "second" });
      
      history.add(snap1);
      history.add(snap2);
      
      expect(history.getFirst()).toBe(snap1);
    });
    
    it("should return undefined for empty history", () => {
      expect(history.getLatest()).toBeUndefined();
      expect(history.getFirst()).toBeUndefined();
    });
  });
  
  describe("getByIndex", () => {
    it("should get snapshot by index", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "first" });
      const snap2 = new GraphSnapshot(sampleGraph, { id: "second" });
      
      history.add(snap1);
      history.add(snap2);
      
      expect(history.getByIndex(0)).toBe(snap1);
      expect(history.getByIndex(1)).toBe(snap2);
    });
  });
  
  describe("diff", () => {
    it("should diff two snapshots by id", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "v1" });
      const modifiedGraph = {
        ...sampleGraph,
        nodes: [...sampleGraph.nodes, { id: "new", label: "New", type: "character" }],
      };
      const snap2 = new GraphSnapshot(modifiedGraph, { id: "v2" });
      
      history.add(snap1);
      history.add(snap2);
      
      const diff = history.diff("v1", "v2");
      
      expect(diff).not.toBeNull();
      expect(diff.nodes.added).toHaveLength(1);
    });
    
    it("should return null for unknown ids", () => {
      expect(history.diff("unknown1", "unknown2")).toBeNull();
    });
  });
  
  describe("diffRange", () => {
    it("should diff sequential snapshots", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "v1" });
      const graph2 = {
        ...sampleGraph,
        nodes: [...sampleGraph.nodes, { id: "n1", label: "N1", type: "character" }],
      };
      const snap2 = new GraphSnapshot(graph2, { id: "v2" });
      const graph3 = {
        ...graph2,
        nodes: [...graph2.nodes, { id: "n2", label: "N2", type: "character" }],
      };
      const snap3 = new GraphSnapshot(graph3, { id: "v3" });
      
      history.add(snap1);
      history.add(snap2);
      history.add(snap3);
      
      const diffs = history.diffRange();
      
      expect(diffs).toHaveLength(2);
      expect(diffs[0].nodes.added).toHaveLength(1);
      expect(diffs[1].nodes.added).toHaveLength(1);
    });
  });
  
  describe("getFullEvolution", () => {
    it("should get diff from first to last", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "v1" });
      const graph2 = {
        nodes: [
          ...sampleGraph.nodes,
          { id: "n1", label: "N1", type: "character" },
          { id: "n2", label: "N2", type: "character" },
        ],
        edges: sampleGraph.edges,
      };
      const snap2 = new GraphSnapshot(graph2, { id: "v2" });
      
      history.add(snap1);
      history.add(snap2);
      
      const evolution = history.getFullEvolution();
      
      expect(evolution).not.toBeNull();
      expect(evolution.nodes.added).toHaveLength(2);
    });
    
    it("should return null for single snapshot", () => {
      history.add(new GraphSnapshot(sampleGraph));
      expect(history.getFullEvolution()).toBeNull();
    });
    
    it("should return null for empty history", () => {
      expect(history.getFullEvolution()).toBeNull();
    });
  });
  
  describe("getStats", () => {
    it("should return statistics", () => {
      const snap1 = new GraphSnapshot(sampleGraph, { id: "v1", timestamp: 1000 });
      const snap2 = new GraphSnapshot(sampleGraph, { id: "v2", timestamp: 2000 });
      
      history.add(snap1);
      history.add(snap2);
      
      const stats = history.getStats();
      
      expect(stats.count).toBe(2);
      expect(stats.firstTimestamp).toBe(1000);
      expect(stats.latestTimestamp).toBe(2000);
      expect(stats.timespan).toBe(1000);
      expect(stats.snapshotIds).toEqual(["v1", "v2"]);
    });
    
    it("should handle empty history", () => {
      const stats = history.getStats();
      
      expect(stats.count).toBe(0);
      expect(stats.firstTimestamp).toBeNull();
    });
  });
  
  describe("clear", () => {
    it("should clear history", () => {
      history.add(new GraphSnapshot(sampleGraph));
      history.add(new GraphSnapshot(sampleGraph));
      
      history.clear();
      
      expect(history.size()).toBe(0);
    });
  });
  
  describe("serialization", () => {
    it("should serialize to JSON", () => {
      history.add(new GraphSnapshot(sampleGraph, { id: "v1" }));
      history.add(new GraphSnapshot(sampleGraph, { id: "v2" }));
      
      const json = history.toJSON();
      
      expect(json.snapshots).toHaveLength(2);
    });
    
    it("should deserialize from JSON", () => {
      history.add(new GraphSnapshot(sampleGraph, { id: "v1" }));
      history.add(new GraphSnapshot(sampleGraph, { id: "v2" }));
      
      const json = history.toJSON();
      const restored = SnapshotHistory.fromJSON(json);
      
      expect(restored.size()).toBe(2);
      expect(restored.getById("v1")).toBeDefined();
      expect(restored.getById("v2")).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration: Evolution tracking", () => {
  it("should track graph evolution over time", () => {
    const history = new SnapshotHistory();
    
    // Version 1: Initial
    const v1 = new GraphSnapshot({
      nodes: [
        { id: "universe", label: "Universe", type: "root" },
      ],
      edges: [],
    }, { id: "v1" });
    history.add(v1);
    
    // Version 2: Add hub
    const v2 = new GraphSnapshot({
      nodes: [
        { id: "universe", label: "Universe", type: "root" },
        { id: "characters", label: "Characters", type: "hub" },
      ],
      edges: [
        { id: "e1", source: "universe", target: "characters", type: "structural" },
      ],
    }, { id: "v2" });
    history.add(v2);
    
    // Version 3: Add character
    const v3 = new GraphSnapshot({
      nodes: [
        { id: "universe", label: "Universe", type: "root" },
        { id: "characters", label: "Characters", type: "hub" },
        { id: "vova", label: "Вова", type: "character" },
      ],
      edges: [
        { id: "e1", source: "universe", target: "characters", type: "structural" },
        { id: "e2", source: "characters", target: "vova", type: "contains" },
      ],
    }, { id: "v3" });
    history.add(v3);
    
    // Check evolution
    const evolution = history.getFullEvolution();
    
    expect(evolution.nodes.added).toHaveLength(2); // characters + vova
    expect(evolution.edges.added).toHaveLength(2); // e1 + e2
    expect(evolution.summary.totalChanges).toBe(4);
  });
  
  it("should serialize and restore full history", () => {
    const history = new SnapshotHistory();
    
    history.add(new GraphSnapshot(sampleGraph, { id: "initial" }));
    history.add(new GraphSnapshot({
      ...sampleGraph,
      nodes: [...sampleGraph.nodes, { id: "new", label: "New", type: "character" }],
    }, { id: "updated" }));
    
    const json = JSON.stringify(history.toJSON());
    const restored = SnapshotHistory.fromJSON(JSON.parse(json));
    
    expect(restored.size()).toBe(2);
    
    const diff = restored.diff("initial", "updated");
    expect(diff.nodes.added).toHaveLength(1);
  });
});
