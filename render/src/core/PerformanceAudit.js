/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PERFORMANCE AUDIT — Нагрузочное тестирование
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.2d: Performance Audit
 * См. repair-shop/ROADMAP.md
 * 
 * НАЗНАЧЕНИЕ:
 * - Генерация синтетических графов для тестирования
 * - Бенчмарки ключевых операций
 * - Оценка масштабируемости
 * 
 * ПРИНЦИП:
 * - Детерминированная генерация (seed)
 * - Измерение времени и памяти
 * - Отчёты о производительности
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NODE_TYPES, EDGE_TYPES } from "./CanonicalGraphSchema.js";

// ═══════════════════════════════════════════════════════════════════════════
// SYNTHETIC GRAPH GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Простой PRNG для детерминированной генерации.
 * @param {number} seed
 */
function createRandom(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Конфигурация генератора.
 * @typedef {Object} GeneratorConfig
 * @property {number} nodeCount - Количество узлов
 * @property {number} edgeDensity - Плотность рёбер (0-1)
 * @property {number} seed - Seed для PRNG
 * @property {boolean} includeHierarchy - Включить иерархию contains
 * @property {boolean} includeMetadata - Включить метаданные
 */

/**
 * Генератор синтетических графов.
 */
export class SyntheticGraphGenerator {
  /**
   * @param {GeneratorConfig} config
   */
  constructor(config = {}) {
    this.nodeCount = config.nodeCount || 100;
    this.edgeDensity = config.edgeDensity || 0.1;
    this.seed = config.seed || 42;
    this.includeHierarchy = config.includeHierarchy !== false;
    this.includeMetadata = config.includeMetadata !== false;
    
    this.random = createRandom(this.seed);
  }
  
  /**
   * Генерировать граф.
   * @returns {{ nodes: Array, edges: Array }}
   */
  generate() {
    const nodes = this._generateNodes();
    const edges = this._generateEdges(nodes);
    
    return { nodes, edges };
  }
  
  /**
   * Генерировать узлы.
   * @private
   */
  _generateNodes() {
    const nodes = [];
    const types = Object.values(NODE_TYPES);
    
    // Root node
    nodes.push({
      id: "root",
      label: "Root",
      type: NODE_TYPES.ROOT,
      ...(this.includeMetadata && {
        visibility: "public",
        status: "core",
        position: { x: 0, y: 0 },
      }),
    });
    
    // Hub nodes (10% of total)
    const hubCount = Math.max(1, Math.floor(this.nodeCount * 0.1));
    for (let i = 0; i < hubCount; i++) {
      nodes.push({
        id: `hub-${i}`,
        label: `Hub ${i}`,
        type: NODE_TYPES.HUB,
        ...(this.includeMetadata && {
          visibility: "public",
          status: "expandable",
          position: { x: this.random() * 1000, y: this.random() * 1000 },
        }),
      });
    }
    
    // Regular nodes
    const regularCount = this.nodeCount - hubCount - 1;
    const regularTypes = types.filter(t => t !== NODE_TYPES.ROOT && t !== NODE_TYPES.HUB);
    
    for (let i = 0; i < regularCount; i++) {
      const type = regularTypes[Math.floor(this.random() * regularTypes.length)];
      nodes.push({
        id: `node-${i}`,
        label: `Node ${i}`,
        type,
        ...(this.includeMetadata && {
          visibility: this.random() > 0.2 ? "public" : "private",
          status: this.random() > 0.5 ? "core" : "expandable",
          position: { x: this.random() * 1000, y: this.random() * 1000 },
        }),
      });
    }
    
    return nodes;
  }
  
  /**
   * Генерировать рёбра.
   * @private
   */
  _generateEdges(nodes) {
    const edges = [];
    const edgeTypes = Object.values(EDGE_TYPES);
    let edgeId = 0;
    
    // Structural edges: root -> hubs
    const hubs = nodes.filter(n => n.type === NODE_TYPES.HUB);
    for (const hub of hubs) {
      edges.push({
        id: `edge-${edgeId++}`,
        source: "root",
        target: hub.id,
        type: EDGE_TYPES.STRUCTURAL,
      });
    }
    
    // Contains edges: hubs -> regular nodes (if hierarchy enabled)
    if (this.includeHierarchy && hubs.length > 0) {
      const regularNodes = nodes.filter(n => 
        n.type !== NODE_TYPES.ROOT && n.type !== NODE_TYPES.HUB
      );
      
      for (const node of regularNodes) {
        const hub = hubs[Math.floor(this.random() * hubs.length)];
        edges.push({
          id: `edge-${edgeId++}`,
          source: hub.id,
          target: node.id,
          type: EDGE_TYPES.CONTAINS,
        });
      }
    }
    
    // Random edges based on density (limited iterations to prevent hanging)
    const targetRandomEdges = Math.min(
      Math.floor(nodes.length * this.edgeDensity * 2),
      nodes.length
    );
    
    const existingEdges = new Set(edges.map(e => `${e.source}|${e.target}`));
    let attempts = 0;
    const maxAttempts = targetRandomEdges * 3;
    
    while (edges.length < targetRandomEdges + hubs.length + (this.includeHierarchy ? nodes.length - hubs.length - 1 : 0) && attempts < maxAttempts) {
      attempts++;
      const source = nodes[Math.floor(this.random() * nodes.length)];
      const target = nodes[Math.floor(this.random() * nodes.length)];
      
      if (source.id === target.id) continue;
      
      const key = `${source.id}|${target.id}`;
      if (existingEdges.has(key)) continue;
      
      const type = edgeTypes[Math.floor(this.random() * edgeTypes.length)];
      
      edges.push({
        id: `edge-${edgeId++}`,
        source: source.id,
        target: target.id,
        type,
      });
      
      existingEdges.add(key);
    }
    
    return edges;
  }
  
  /**
   * Генерировать серию графов разного размера.
   * @param {Array<number>} sizes - Размеры графов
   * @returns {Array<{ size: number, graph: Object }>}
   */
  generateSeries(sizes = [100, 500, 1000, 5000, 10000]) {
    return sizes.map(size => {
      const generator = new SyntheticGraphGenerator({
        ...this,
        nodeCount: size,
        seed: this.seed + size,
      });
      return {
        size,
        graph: generator.generate(),
      };
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BENCHMARK UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Измерить время выполнения функции.
 * @param {Function} fn - Функция для измерения
 * @param {number} iterations - Количество итераций
 * @returns {{ avg: number, min: number, max: number, total: number }}
 */
export function benchmark(fn, iterations = 10) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const total = times.reduce((a, b) => a + b, 0);
  const avg = total / iterations;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { avg, min, max, total, iterations };
}

/**
 * Измерить время выполнения async функции.
 * @param {Function} fn - Async функция
 * @param {number} iterations - Количество итераций
 * @returns {Promise<{ avg: number, min: number, max: number, total: number }>}
 */
export async function benchmarkAsync(fn, iterations = 10) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const total = times.reduce((a, b) => a + b, 0);
  const avg = total / iterations;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { avg, min, max, total, iterations };
}

/**
 * Форматировать время в читаемый вид.
 * @param {number} ms - Время в миллисекундах
 * @returns {string}
 */
export function formatTime(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Форматировать размер в читаемый вид.
 * @param {number} bytes - Размер в байтах
 * @returns {string}
 */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE AUDITOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Результат аудита.
 * @typedef {Object} AuditResult
 * @property {string} operation - Название операции
 * @property {number} graphSize - Размер графа
 * @property {Object} timing - Результаты замеров
 * @property {boolean} passed - Прошёл ли порог
 * @property {string} threshold - Порог
 */

/**
 * Аудитор производительности.
 */
export class PerformanceAuditor {
  constructor() {
    /** @type {Array<AuditResult>} */
    this.results = [];
    
    /** @type {Map<string, number>} */
    this.thresholds = new Map([
      ["buildIndex-100", 50],      // 50ms for 100 nodes
      ["buildIndex-1000", 500],    // 500ms for 1000 nodes
      ["buildIndex-10000", 5000],  // 5s for 10000 nodes
      ["queryByNode-100", 5],      // 5ms
      ["queryByNode-1000", 10],    // 10ms
      ["queryByNode-10000", 50],   // 50ms
      ["validateGraph-100", 10],   // 10ms
      ["validateGraph-1000", 100], // 100ms
      ["validateGraph-10000", 1000], // 1s
      ["diffSnapshots-100", 10],   // 10ms
      ["diffSnapshots-1000", 100], // 100ms
      ["diffSnapshots-10000", 1000], // 1s
    ]);
  }
  
  /**
   * Установить порог.
   * @param {string} key - Ключ (operation-size)
   * @param {number} ms - Порог в миллисекундах
   */
  setThreshold(key, ms) {
    this.thresholds.set(key, ms);
  }
  
  /**
   * Запустить бенчмарк.
   * @param {string} operation - Название операции
   * @param {number} graphSize - Размер графа
   * @param {Function} fn - Функция для измерения
   * @param {number} iterations - Количество итераций
   * @returns {AuditResult}
   */
  run(operation, graphSize, fn, iterations = 5) {
    const timing = benchmark(fn, iterations);
    const key = `${operation}-${graphSize}`;
    const threshold = this.thresholds.get(key);
    const passed = threshold ? timing.avg <= threshold : true;
    
    const result = {
      operation,
      graphSize,
      timing,
      passed,
      threshold: threshold ? `${threshold}ms` : "none",
    };
    
    this.results.push(result);
    return result;
  }
  
  /**
   * Запустить async бенчмарк.
   * @param {string} operation
   * @param {number} graphSize
   * @param {Function} fn
   * @param {number} iterations
   * @returns {Promise<AuditResult>}
   */
  async runAsync(operation, graphSize, fn, iterations = 5) {
    const timing = await benchmarkAsync(fn, iterations);
    const key = `${operation}-${graphSize}`;
    const threshold = this.thresholds.get(key);
    const passed = threshold ? timing.avg <= threshold : true;
    
    const result = {
      operation,
      graphSize,
      timing,
      passed,
      threshold: threshold ? `${threshold}ms` : "none",
    };
    
    this.results.push(result);
    return result;
  }
  
  /**
   * Получить отчёт.
   * @returns {Object}
   */
  getReport() {
    const passed = this.results.filter(r => r.passed);
    const failed = this.results.filter(r => !r.passed);
    
    const byOperation = {};
    for (const result of this.results) {
      if (!byOperation[result.operation]) {
        byOperation[result.operation] = [];
      }
      byOperation[result.operation].push({
        size: result.graphSize,
        avgMs: result.timing.avg,
        passed: result.passed,
      });
    }
    
    return {
      total: this.results.length,
      passed: passed.length,
      failed: failed.length,
      allPassed: failed.length === 0,
      byOperation,
      results: [...this.results],
    };
  }
  
  /**
   * Получить отчёт в текстовом формате.
   * @returns {string}
   */
  getTextReport() {
    const lines = [
      "═══════════════════════════════════════════════════════════════════════════",
      "PERFORMANCE AUDIT REPORT",
      "═══════════════════════════════════════════════════════════════════════════",
      "",
    ];
    
    const report = this.getReport();
    
    lines.push(`Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed}`);
    lines.push("");
    
    for (const [operation, results] of Object.entries(report.byOperation)) {
      lines.push(`## ${operation}`);
      lines.push("");
      lines.push("| Size | Avg | Min | Max | Status |");
      lines.push("|------|-----|-----|-----|--------|");
      
      for (const r of results) {
        const fullResult = this.results.find(
          res => res.operation === operation && res.graphSize === r.size
        );
        const status = r.passed ? "✓" : "✗";
        lines.push(
          `| ${r.size} | ${formatTime(fullResult.timing.avg)} | ${formatTime(fullResult.timing.min)} | ${formatTime(fullResult.timing.max)} | ${status} |`
        );
      }
      
      lines.push("");
    }
    
    lines.push("═══════════════════════════════════════════════════════════════════════════");
    
    return lines.join("\n");
  }
  
  /**
   * Сбросить результаты.
   */
  reset() {
    this.results = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCALABILITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Анализ масштабируемости.
 * @param {Array<{ size: number, time: number }>} dataPoints
 * @returns {{ complexity: string, factor: number }}
 */
export function analyzeScalability(dataPoints) {
  if (dataPoints.length < 2) {
    return { complexity: "unknown", factor: 0 };
  }
  
  // Sort by size
  const sorted = [...dataPoints].sort((a, b) => a.size - b.size);
  
  // Calculate growth factors
  const factors = [];
  for (let i = 1; i < sorted.length; i++) {
    const sizeRatio = sorted[i].size / sorted[i - 1].size;
    const timeRatio = sorted[i].time / sorted[i - 1].time;
    factors.push(timeRatio / sizeRatio);
  }
  
  const avgFactor = factors.reduce((a, b) => a + b, 0) / factors.length;
  
  // Determine complexity
  let complexity;
  if (avgFactor < 0.5) {
    complexity = "O(1) or better";
  } else if (avgFactor < 1.5) {
    complexity = "O(n)";
  } else if (avgFactor < 3) {
    complexity = "O(n log n)";
  } else if (avgFactor < 10) {
    complexity = "O(n²)";
  } else {
    complexity = "O(n²) or worse";
  }
  
  return { complexity, factor: avgFactor };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  SyntheticGraphGenerator,
  PerformanceAuditor,
  benchmark,
  benchmarkAsync,
  formatTime,
  formatSize,
  analyzeScalability,
};
