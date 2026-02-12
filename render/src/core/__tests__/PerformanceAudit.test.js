/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PERFORMANCE AUDIT — ТЕСТЫ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2d: Performance Audit
 * 
 * Покрытие:
 * - SyntheticGraphGenerator (генерация графов)
 * - benchmark / benchmarkAsync (измерение времени)
 * - PerformanceAuditor (аудит производительности)
 * - analyzeScalability (анализ сложности)
 * - formatTime / formatSize (форматирование)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SyntheticGraphGenerator,
  PerformanceAuditor,
  benchmark,
  benchmarkAsync,
  formatTime,
  formatSize,
  analyzeScalability,
} from "../PerformanceAudit.js";
import { NODE_TYPES, EDGE_TYPES } from "../CanonicalGraphSchema.js";
import { GraphSnapshot, diffSnapshots } from "../GraphSnapshot.js";
import { InvariantChecker, STRICTNESS } from "../StructuralInvariants.js";

// ═══════════════════════════════════════════════════════════════════════════
// SYNTHETIC GRAPH GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

describe("SyntheticGraphGenerator", () => {
  describe("constructor", () => {
    it("should create generator with default config", () => {
      const gen = new SyntheticGraphGenerator();
      
      expect(gen.nodeCount).toBe(100);
      expect(gen.edgeDensity).toBe(0.1);
      expect(gen.seed).toBe(42);
    });
    
    it("should accept custom config", () => {
      const gen = new SyntheticGraphGenerator({
        nodeCount: 500,
        edgeDensity: 0.2,
        seed: 123,
      });
      
      expect(gen.nodeCount).toBe(500);
      expect(gen.edgeDensity).toBe(0.2);
      expect(gen.seed).toBe(123);
    });
  });
  
  describe("generate", () => {
    it("should generate graph with correct node count", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 50 });
      const graph = gen.generate();
      
      expect(graph.nodes).toHaveLength(50);
    });
    
    it("should always include root node", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 10 });
      const graph = gen.generate();
      
      const root = graph.nodes.find(n => n.id === "root");
      expect(root).toBeDefined();
      expect(root.type).toBe(NODE_TYPES.ROOT);
    });
    
    it("should include hub nodes", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 100 });
      const graph = gen.generate();
      
      const hubs = graph.nodes.filter(n => n.type === NODE_TYPES.HUB);
      expect(hubs.length).toBeGreaterThan(0);
    });
    
    it("should generate edges", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 50 });
      const graph = gen.generate();
      
      expect(graph.edges.length).toBeGreaterThan(0);
    });
    
    it("should include structural edges from root to hubs", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 50 });
      const graph = gen.generate();
      
      const structuralEdges = graph.edges.filter(
        e => e.source === "root" && e.type === EDGE_TYPES.STRUCTURAL
      );
      
      expect(structuralEdges.length).toBeGreaterThan(0);
    });
    
    it("should be deterministic with same seed", () => {
      const gen1 = new SyntheticGraphGenerator({ nodeCount: 50, seed: 42 });
      const gen2 = new SyntheticGraphGenerator({ nodeCount: 50, seed: 42 });
      
      const graph1 = gen1.generate();
      const graph2 = gen2.generate();
      
      expect(graph1.nodes.length).toBe(graph2.nodes.length);
      expect(graph1.edges.length).toBe(graph2.edges.length);
    });
    
    it("should produce different graphs with different seeds", () => {
      const gen1 = new SyntheticGraphGenerator({ nodeCount: 50, seed: 42 });
      const gen2 = new SyntheticGraphGenerator({ nodeCount: 50, seed: 123 });
      
      const graph1 = gen1.generate();
      const graph2 = gen2.generate();
      
      // Edge counts may differ due to random generation
      const sameEdges = graph1.edges.length === graph2.edges.length;
      const samePositions = graph1.nodes[2]?.position?.x === graph2.nodes[2]?.position?.x;
      
      // At least one should differ
      expect(sameEdges && samePositions).toBe(false);
    });
    
    it("should include metadata when enabled", () => {
      const gen = new SyntheticGraphGenerator({
        nodeCount: 10,
        includeMetadata: true,
      });
      const graph = gen.generate();
      
      expect(graph.nodes[0].position).toBeDefined();
      expect(graph.nodes[0].visibility).toBeDefined();
    });
    
    it("should exclude metadata when disabled", () => {
      const gen = new SyntheticGraphGenerator({
        nodeCount: 10,
        includeMetadata: false,
      });
      const graph = gen.generate();
      
      expect(graph.nodes[0].position).toBeUndefined();
    });
    
    it("should include hierarchy when enabled", () => {
      const gen = new SyntheticGraphGenerator({
        nodeCount: 50,
        includeHierarchy: true,
      });
      const graph = gen.generate();
      
      const containsEdges = graph.edges.filter(e => e.type === EDGE_TYPES.CONTAINS);
      expect(containsEdges.length).toBeGreaterThan(0);
    });
  });
  
  describe("generateSeries", () => {
    it("should generate series of graphs", () => {
      const gen = new SyntheticGraphGenerator();
      const series = gen.generateSeries([10, 50, 100]);
      
      expect(series).toHaveLength(3);
      expect(series[0].size).toBe(10);
      expect(series[1].size).toBe(50);
      expect(series[2].size).toBe(100);
    });
    
    it("should have correct node counts", () => {
      const gen = new SyntheticGraphGenerator();
      const series = gen.generateSeries([10, 50]);
      
      expect(series[0].graph.nodes).toHaveLength(10);
      expect(series[1].graph.nodes).toHaveLength(50);
    });
  });
  
  describe("large graphs", () => {
    it("should generate 200 node graph", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 200 });
      const graph = gen.generate();
      
      expect(graph.nodes).toHaveLength(200);
      expect(graph.edges.length).toBeGreaterThan(20);
    });
    
    it("should generate 500 node graph", () => {
      const gen = new SyntheticGraphGenerator({ nodeCount: 500 });
      const graph = gen.generate();
      
      expect(graph.nodes).toHaveLength(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BENCHMARK UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

describe("benchmark", () => {
  it("should measure function execution time", () => {
    const result = benchmark(() => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    }, 5);
    
    expect(result.avg).toBeGreaterThanOrEqual(0);
    expect(result.min).toBeLessThanOrEqual(result.avg);
    expect(result.max).toBeGreaterThanOrEqual(result.avg);
    expect(result.iterations).toBe(5);
  });
  
  it("should run correct number of iterations", () => {
    let count = 0;
    benchmark(() => count++, 10);
    
    expect(count).toBe(10);
  });
});

describe("benchmarkAsync", () => {
  it("should measure async function execution time", async () => {
    const result = await benchmarkAsync(async () => {
      // Fast async operation without real delay
      await Promise.resolve();
    }, 3);
    
    expect(result.avg).toBeGreaterThanOrEqual(0);
    expect(result.iterations).toBe(3);
  });
});

describe("formatTime", () => {
  it("should format microseconds", () => {
    expect(formatTime(0.001)).toBe("1.00µs");
    expect(formatTime(0.5)).toBe("500.00µs");
  });
  
  it("should format milliseconds", () => {
    expect(formatTime(1)).toBe("1.00ms");
    expect(formatTime(100)).toBe("100.00ms");
  });
  
  it("should format seconds", () => {
    expect(formatTime(1000)).toBe("1.00s");
    expect(formatTime(5000)).toBe("5.00s");
  });
});

describe("formatSize", () => {
  it("should format bytes", () => {
    expect(formatSize(100)).toBe("100B");
    expect(formatSize(1000)).toBe("1000B");
  });
  
  it("should format kilobytes", () => {
    expect(formatSize(1024)).toBe("1.00KB");
    expect(formatSize(10240)).toBe("10.00KB");
  });
  
  it("should format megabytes", () => {
    expect(formatSize(1024 * 1024)).toBe("1.00MB");
    expect(formatSize(5 * 1024 * 1024)).toBe("5.00MB");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE AUDITOR
// ═══════════════════════════════════════════════════════════════════════════

describe("PerformanceAuditor", () => {
  let auditor;
  
  beforeEach(() => {
    auditor = new PerformanceAuditor();
  });
  
  describe("run", () => {
    it("should run benchmark and record result", () => {
      const result = auditor.run("test-op", 100, () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
      }, 3);
      
      expect(result.operation).toBe("test-op");
      expect(result.graphSize).toBe(100);
      expect(result.timing.avg).toBeGreaterThanOrEqual(0);
    });
    
    it("should check against threshold", () => {
      auditor.setThreshold("fast-op-100", 1000); // 1 second
      
      const result = auditor.run("fast-op", 100, () => {
        // Fast operation
      }, 3);
      
      expect(result.passed).toBe(true);
    });
    
    it("should fail if exceeds threshold", () => {
      auditor.setThreshold("slow-op-100", 0.001); // 0.001ms - impossible
      
      const result = auditor.run("slow-op", 100, () => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) sum += i;
      }, 3);
      
      expect(result.passed).toBe(false);
    });
  });
  
  describe("runAsync", () => {
    it("should run async benchmark", async () => {
      const result = await auditor.runAsync("async-op", 100, async () => {
        // Fast async operation
        await Promise.resolve();
      }, 2);
      
      expect(result.operation).toBe("async-op");
      expect(result.timing.avg).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe("getReport", () => {
    it("should generate report", () => {
      auditor.run("op1", 100, () => {}, 2);
      auditor.run("op2", 100, () => {}, 2);
      
      const report = auditor.getReport();
      
      expect(report.total).toBe(2);
      expect(report.results).toHaveLength(2);
    });
    
    it("should group by operation", () => {
      auditor.run("op1", 100, () => {}, 2);
      auditor.run("op1", 500, () => {}, 2);
      auditor.run("op2", 100, () => {}, 2);
      
      const report = auditor.getReport();
      
      expect(report.byOperation.op1).toHaveLength(2);
      expect(report.byOperation.op2).toHaveLength(1);
    });
  });
  
  describe("getTextReport", () => {
    it("should generate text report", () => {
      auditor.run("test-op", 100, () => {}, 2);
      
      const text = auditor.getTextReport();
      
      expect(text).toContain("PERFORMANCE AUDIT REPORT");
      expect(text).toContain("test-op");
    });
  });
  
  describe("reset", () => {
    it("should clear results", () => {
      auditor.run("op1", 100, () => {}, 2);
      auditor.reset();
      
      expect(auditor.results).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SCALABILITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

describe("analyzeScalability", () => {
  it("should detect O(n) complexity", () => {
    const dataPoints = [
      { size: 100, time: 10 },
      { size: 200, time: 20 },
      { size: 400, time: 40 },
    ];
    
    const result = analyzeScalability(dataPoints);
    
    expect(result.complexity).toBe("O(n)");
  });
  
  it("should detect O(n²) complexity", () => {
    const dataPoints = [
      { size: 100, time: 10 },
      { size: 200, time: 40 },
      { size: 400, time: 160 },
    ];
    
    const result = analyzeScalability(dataPoints);
    
    // Factor should indicate quadratic growth
    expect(result.factor).toBeGreaterThan(1.5);
  });
  
  it("should handle insufficient data", () => {
    const result = analyzeScalability([{ size: 100, time: 10 }]);
    
    expect(result.complexity).toBe("unknown");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION: Real benchmarks
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration: Real benchmarks", () => {
  it("should benchmark GraphSnapshot creation", () => {
    const gen = new SyntheticGraphGenerator({ nodeCount: 100 });
    const graph = gen.generate();
    
    const auditor = new PerformanceAuditor();
    const result = auditor.run("createSnapshot", 100, () => {
      new GraphSnapshot(graph);
    }, 3);
    
    expect(result.timing.avg).toBeLessThan(500);
  });
  
  it("should benchmark diffSnapshots", () => {
    const gen = new SyntheticGraphGenerator({ nodeCount: 100 });
    const graph1 = gen.generate();
    const graph2 = {
      ...graph1,
      nodes: [...graph1.nodes, { id: "new", label: "New", type: "character" }],
    };
    
    const snap1 = new GraphSnapshot(graph1);
    const snap2 = new GraphSnapshot(graph2);
    
    const auditor = new PerformanceAuditor();
    const result = auditor.run("diffSnapshots", 100, () => {
      diffSnapshots(snap1, snap2);
    }, 3);
    
    expect(result.timing.avg).toBeLessThan(500);
  });
  
  it("should benchmark InvariantChecker", () => {
    const gen = new SyntheticGraphGenerator({ nodeCount: 100 });
    const graph = gen.generate();
    
    const checker = new InvariantChecker();
    
    const auditor = new PerformanceAuditor();
    const result = auditor.run("checkInvariants", 100, () => {
      checker.checkAll(graph, STRICTNESS.MINIMAL);
    }, 3);
    
    expect(result.timing.avg).toBeLessThan(500);
  });
  
  it("should analyze scalability across sizes", () => {
    const sizes = [50, 100, 200];
    const dataPoints = [];
    
    for (const size of sizes) {
      const gen = new SyntheticGraphGenerator({ nodeCount: size });
      const graph = gen.generate();
      
      const start = performance.now();
      new GraphSnapshot(graph);
      const time = performance.now() - start;
      
      dataPoints.push({ size, time });
    }
    
    const analysis = analyzeScalability(dataPoints);
    
    // Should be roughly O(n) for snapshot creation
    expect(["O(1) or better", "O(n)", "O(n log n)"]).toContain(analysis.complexity);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STRESS TEST
// ═══════════════════════════════════════════════════════════════════════════

describe("Stress test: Medium graphs", () => {
  it("should handle 200 nodes efficiently", () => {
    const gen = new SyntheticGraphGenerator({ nodeCount: 200 });
    const graph = gen.generate();
    
    const start = performance.now();
    const snapshot = new GraphSnapshot(graph);
    const time = performance.now() - start;
    
    expect(snapshot.nodes).toHaveLength(200);
    expect(time).toBeLessThan(500);
  });
  
  it("should handle 300 nodes efficiently", () => {
    const gen = new SyntheticGraphGenerator({ nodeCount: 300 });
    const graph = gen.generate();
    
    const start = performance.now();
    const snapshot = new GraphSnapshot(graph);
    const time = performance.now() - start;
    
    expect(snapshot.nodes).toHaveLength(300);
    expect(time).toBeLessThan(500);
  });
});
