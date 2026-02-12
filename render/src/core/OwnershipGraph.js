/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OWNERSHIP GRAPH — Граф владения состоянием
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - Явно определяет: кто владеет состоянием
 * - Явно определяет: кто производит вычисление
 * - Явно определяет: кто потребляет результат
 * - Это база для dev-линзы и анализа архитектуры
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const ownership = new OwnershipGraph();
 * ownership.registerOwner("highlightState", "GraphModel");
 * ownership.registerProducer("highlightState", "computeHighlight");
 * ownership.registerConsumer("highlightState", "VisitorProjection");
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * @typedef {Object} StateOwnership
 * @property {string} state - Имя состояния
 * @property {string} owner - Кто владеет
 * @property {Array<string>} producers - Кто производит
 * @property {Array<string>} consumers - Кто потребляет
 */

/**
 * @typedef {Object} ComputationNode
 * @property {string} name - Имя вычисления
 * @property {Array<string>} inputs - Входные состояния
 * @property {Array<string>} outputs - Выходные состояния
 * @property {string} owner - Кто владеет вычислением
 */

/**
 * Граф владения состоянием.
 */
export class OwnershipGraph {
  constructor() {
    /** @type {Map<string, StateOwnership>} */
    this.states = new Map();
    
    /** @type {Map<string, ComputationNode>} */
    this.computations = new Map();
    
    /** @type {Map<string, Set<string>>} */
    this.dependencies = new Map();
    
    // Инициализировать с известными состояниями системы
    this._initSystemStates();
  }
  
  /**
   * Инициализировать известные состояния системы.
   * @private
   */
  _initSystemStates() {
    // Состояния
    this.registerState("graphData", "GraphModel", "Данные графа (nodes, edges)");
    this.registerState("highlightContext", "visitor.js", "Контекст подсветки");
    this.registerState("highlightState", "GraphModel", "Вычисленное состояние подсветки");
    this.registerState("scopeNodeIds", "visitor.js", "ID узлов в scope");
    this.registerState("selectedNodeId", "visitor.js", "ID выбранного узла");
    this.registerState("hoveredNodeId", "visitor.js", "ID узла под курсором");
    this.registerState("typeHighlightNodeIds", "visitor.js", "ID узлов для Type Highlight");
    
    // Вычисления
    this.registerComputation("computeHighlight", {
      inputs: ["highlightContext", "graphData"],
      outputs: ["highlightState"],
      owner: "highlightModel.js"
    });
    
    this.registerComputation("computeScope", {
      inputs: ["hubId", "graphData"],
      outputs: ["scopeNodeIds"],
      owner: "GraphModel"
    });
    
    this.registerComputation("renderHighlight", {
      inputs: ["highlightState"],
      outputs: ["DOM", "Three.js"],
      owner: "visitor.js"
    });
    
    // Потребители
    this.registerConsumer("highlightState", "VisitorProjection");
    this.registerConsumer("highlightState", "DevProjection");
    this.registerConsumer("graphData", "VisitorProjection");
    this.registerConsumer("graphData", "DevProjection");
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API: Регистрация
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Зарегистрировать состояние.
   * @param {string} name - Имя состояния
   * @param {string} owner - Владелец
   * @param {string} [description] - Описание
   */
  registerState(name, owner, description = "") {
    this.states.set(name, {
      state: name,
      owner,
      description,
      producers: [],
      consumers: []
    });
  }
  
  /**
   * Зарегистрировать производителя состояния.
   * @param {string} stateName
   * @param {string} producer
   */
  registerProducer(stateName, producer) {
    const state = this.states.get(stateName);
    if (state && !state.producers.includes(producer)) {
      state.producers.push(producer);
    }
  }
  
  /**
   * Зарегистрировать потребителя состояния.
   * @param {string} stateName
   * @param {string} consumer
   */
  registerConsumer(stateName, consumer) {
    const state = this.states.get(stateName);
    if (state && !state.consumers.includes(consumer)) {
      state.consumers.push(consumer);
    }
  }
  
  /**
   * Зарегистрировать вычисление.
   * @param {string} name
   * @param {Object} config
   * @param {Array<string>} config.inputs
   * @param {Array<string>} config.outputs
   * @param {string} config.owner
   */
  registerComputation(name, config) {
    this.computations.set(name, {
      name,
      inputs: config.inputs || [],
      outputs: config.outputs || [],
      owner: config.owner || "unknown"
    });
    
    // Обновить зависимости
    for (const output of config.outputs || []) {
      if (!this.dependencies.has(output)) {
        this.dependencies.set(output, new Set());
      }
      for (const input of config.inputs || []) {
        this.dependencies.get(output).add(input);
      }
      
      // Зарегистрировать производителя
      this.registerProducer(output, name);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API: Запросы
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить все состояния.
   * @returns {Array<StateOwnership>}
   */
  getStates() {
    return [...this.states.values()];
  }
  
  /**
   * Получить все вычисления.
   * @returns {Array<ComputationNode>}
   */
  getComputations() {
    return [...this.computations.values()];
  }
  
  /**
   * Получить зависимости состояния.
   * @param {string} stateName
   * @returns {Set<string>}
   */
  getDependencies(stateName) {
    return this.dependencies.get(stateName) || new Set();
  }
  
  /**
   * Получить граф потока данных.
   * @returns {Object}
   */
  getDataFlowGraph() {
    const nodes = [];
    const edges = [];
    
    // Добавить состояния как узлы
    for (const state of this.states.values()) {
      nodes.push({
        id: `state:${state.state}`,
        type: "state",
        label: state.state,
        owner: state.owner
      });
    }
    
    // Добавить вычисления как узлы
    for (const comp of this.computations.values()) {
      nodes.push({
        id: `comp:${comp.name}`,
        type: "computation",
        label: comp.name,
        owner: comp.owner
      });
      
      // Рёбра: inputs → computation
      for (const input of comp.inputs) {
        edges.push({
          source: `state:${input}`,
          target: `comp:${comp.name}`,
          type: "input"
        });
      }
      
      // Рёбра: computation → outputs
      for (const output of comp.outputs) {
        edges.push({
          source: `comp:${comp.name}`,
          target: `state:${output}`,
          type: "output"
        });
      }
    }
    
    return { nodes, edges };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API: Экспорт
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Экспортировать в JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      states: this.getStates(),
      computations: this.getComputations(),
      dataFlow: this.getDataFlowGraph()
    };
  }
  
  /**
   * Экспортировать в Markdown.
   * @returns {string}
   */
  toMarkdown() {
    let md = "# Ownership Graph\n\n";
    
    md += "## States\n\n";
    md += "| State | Owner | Producers | Consumers |\n";
    md += "|-------|-------|-----------|----------|\n";
    for (const state of this.states.values()) {
      md += `| ${state.state} | ${state.owner} | ${state.producers.join(", ") || "-"} | ${state.consumers.join(", ") || "-"} |\n`;
    }
    md += "\n";
    
    md += "## Computations\n\n";
    md += "| Computation | Owner | Inputs | Outputs |\n";
    md += "|-------------|-------|--------|--------|\n";
    for (const comp of this.computations.values()) {
      md += `| ${comp.name} | ${comp.owner} | ${comp.inputs.join(", ")} | ${comp.outputs.join(", ")} |\n`;
    }
    md += "\n";
    
    md += "## Data Flow\n\n";
    md += "```\n";
    md += "highlightContext ──┐\n";
    md += "                   ├──▶ computeHighlight ──▶ highlightState ──▶ Projections\n";
    md += "graphData ─────────┘\n";
    md += "```\n";
    
    return md;
  }
  
  /**
   * Экспортировать в ASCII-диаграмму.
   * @returns {string}
   */
  toASCII() {
    return `
┌─────────────────────────────────────────────────────────────────────────┐
│                         OWNERSHIP GRAPH                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                     │
│  │ highlightContext│──┐                                                  │
│  │ (visitor.js)    │  │                                                  │
│  └─────────────────┘  │    ┌──────────────────┐    ┌─────────────────┐  │
│                       ├───▶│ computeHighlight │───▶│ highlightState  │  │
│  ┌─────────────────┐  │    │ (highlightModel) │    │ (GraphModel)    │  │
│  │ graphData       │──┘    └──────────────────┘    └────────┬────────┘  │
│  │ (GraphModel)    │                                        │           │
│  └─────────────────┘                                        │           │
│                                                             │           │
│                              ┌──────────────────────────────┼───────┐   │
│                              │                              │       │   │
│                              ▼                              ▼       │   │
│                    ┌─────────────────┐            ┌─────────────────┐   │
│                    │ VisitorProjection│            │ DevProjection   │   │
│                    │ (Three.js)      │            │ (Text/JSON)     │   │
│                    └─────────────────┘            └─────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
`;
  }
}

// Глобальный экземпляр
export const ownershipGraph = new OwnershipGraph();
