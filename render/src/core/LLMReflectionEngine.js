/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LLM REFLECTION ENGINE — Внешний оркестратор архитектурного мышления
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 4.4: LLMReflectionEngine
 * См. repair-shop/ROADMAP.md
 * 
 * НАЗНАЧЕНИЕ:
 * - Внешний слой, НЕ часть Core
 * - Читает Core через проекции
 * - Генерирует контекст для LLM
 * - Преобразует ответы LLM в proposals
 * - Передаёт proposals в ChangeProtocol (simulate only)
 * 
 * ЗАПРЕЩЕНО:
 * - Мутировать GraphModel напрямую
 * - Обходить ChangeProtocol
 * - Писать в SnapshotHistory
 * - Auto-apply без человека
 * 
 * РЕЖИМЫ:
 * - ANALYSIS — только анализ, без предложений
 * - SUGGESTION — генерация mutation proposals
 * - REVIEW — оценка существующих предложений
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ReflectiveProjection } from "./ReflectiveProjection.js";
import { GraphRAGProjection } from "./GraphRAGProjection.js";
import { ChangeProtocol, MUTATION_TYPE, AUTHOR_TYPE } from "./ChangeProtocol.js";
import { GraphSnapshot, diffSnapshots } from "./GraphSnapshot.js";
import { SCHEMA_VERSION, NODE_TYPES, EDGE_TYPES } from "./CanonicalGraphSchema.js";
import { GraphModel } from "./GraphModel.js";

// ═══════════════════════════════════════════════════════════════════════════
// MODES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Режимы работы LLMReflectionEngine.
 */
export const ENGINE_MODE = Object.freeze({
  ANALYSIS: "analysis",
  SUGGESTION: "suggestion",
  REVIEW: "review",
});

/**
 * Типы промптов.
 */
export const PROMPT_TYPE = Object.freeze({
  ANALYZE_STRUCTURE: "analyzeStructure",
  DETECT_WEAKNESSES: "detectWeaknesses",
  SUGGEST_IMPROVEMENTS: "suggestImprovements",
  REVIEW_PROPOSAL: "reviewProposal",
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Собирает контекст для LLM из различных проекций.
 */
export class ContextAssembler {
  /**
   * @param {Object} options
   * @param {ReflectiveProjection} options.reflective
   * @param {GraphRAGProjection} [options.graphRAG]
   * @param {ChangeProtocol} [options.protocol]
   */
  constructor(options = {}) {
    this.reflective = options.reflective;
    this.graphRAG = options.graphRAG || null;
    this.protocol = options.protocol || null;
  }
  
  /**
   * Собрать полный контекст для LLM.
   * @returns {LLMContext}
   */
  assemble() {
    const context = {
      timestamp: Date.now(),
      schemaVersion: SCHEMA_VERSION,
      structure: this._assembleStructure(),
      metrics: this._assembleMetrics(),
      invariants: this._assembleInvariants(),
      recentChanges: this._assembleRecentChanges(),
      schema: this._assembleSchema(),
    };
    
    return context;
  }
  
  /**
   * Собрать минимальный контекст (для быстрых запросов).
   * @returns {Object}
   */
  assembleMinimal() {
    return {
      timestamp: Date.now(),
      schemaVersion: SCHEMA_VERSION,
      metrics: this._assembleMetrics(),
    };
  }
  
  /**
   * Собрать структурную информацию.
   * @private
   */
  _assembleStructure() {
    if (!this.reflective) {
      return { error: "ReflectiveProjection not available" };
    }
    
    try {
      const report = this.reflective.getStructuralReport();
      const stats = this.reflective.getStats();
      const connectivity = this.reflective.checkConnectivity();
      
      return {
        nodeCount: stats.nodeCount,
        edgeCount: stats.edgeCount,
        density: report.density?.density || 0,
        typeDistribution: report.typeDistribution,
        connectivity: connectivity,
        isolatedNodes: report.isolatedNodes,
        highCentralityNodes: report.highCentralityNodes,
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Собрать метрики.
   * @private
   */
  _assembleMetrics() {
    if (!this.reflective) {
      return { error: "ReflectiveProjection not available" };
    }
    
    try {
      const density = this.reflective.analyzeDensity();
      const stats = this.reflective.getStats();
      
      return {
        density: density?.density || 0,
        maxDensity: density?.maxDensity || 0,
        fillRatio: density?.fillRatio || 0,
        nodeCount: stats?.nodeCount || 0,
        edgeCount: stats?.edgeCount || 0,
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Собрать информацию об инвариантах.
   * @private
   */
  _assembleInvariants() {
    if (!this.reflective) {
      return { error: "ReflectiveProjection not available" };
    }
    
    try {
      const connectivity = this.reflective.checkConnectivity();
      const cyclesResult = this.reflective.detectOwnershipCycles();
      const bridges = this.reflective.findBridges();
      
      return {
        isConnected: connectivity?.isConnected ?? true,
        componentCount: connectivity?.componentCount ?? 1,
        hasCycles: cyclesResult?.hasCycles ?? false,
        cycleCount: cyclesResult?.cycles?.length ?? 0,
        bridgeCount: bridges?.length ?? 0,
        criticalEdges: bridges?.slice(0, 5) ?? [],
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Собрать информацию о недавних изменениях.
   * @private
   */
  _assembleRecentChanges() {
    if (!this.protocol) {
      return { available: false };
    }
    
    try {
      const history = this.protocol.getHistory();
      const recent = history.slice(-5); // Last 5 changes
      
      return {
        available: true,
        totalChanges: history.length,
        recentChanges: recent.map(h => ({
          type: h.proposal.type,
          author: h.proposal.author,
          rationale: h.proposal.rationale,
          appliedAt: h.appliedAt,
          summary: h.diff?.summary || null,
        })),
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
  
  /**
   * Собрать информацию о схеме.
   * @private
   */
  _assembleSchema() {
    return {
      version: SCHEMA_VERSION,
      nodeTypes: Object.values(NODE_TYPES),
      edgeTypes: Object.values(EDGE_TYPES),
      mutationTypes: Object.values(MUTATION_TYPE),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Строит типизированные промпты для LLM.
 */
export class PromptBuilder {
  /**
   * Построить промпт заданного типа.
   * @param {string} promptType - Тип промпта из PROMPT_TYPE
   * @param {LLMContext} context - Контекст от ContextAssembler
   * @param {Object} [options] - Дополнительные опции
   * @returns {Object} - { system, user, responseFormat }
   */
  build(promptType, context, options = {}) {
    switch (promptType) {
      case PROMPT_TYPE.ANALYZE_STRUCTURE:
        return this._buildAnalyzeStructure(context, options);
      
      case PROMPT_TYPE.DETECT_WEAKNESSES:
        return this._buildDetectWeaknesses(context, options);
      
      case PROMPT_TYPE.SUGGEST_IMPROVEMENTS:
        return this._buildSuggestImprovements(context, options);
      
      case PROMPT_TYPE.REVIEW_PROPOSAL:
        return this._buildReviewProposal(context, options);
      
      default:
        throw new Error(`Unknown prompt type: ${promptType}`);
    }
  }
  
  /**
   * Промпт для анализа структуры.
   * @private
   */
  _buildAnalyzeStructure(context, options) {
    return {
      system: `You are a graph architecture analyst. Analyze the provided graph structure and provide insights.
Schema version: ${context.schemaVersion}
Available node types: ${context.schema.nodeTypes.join(", ")}
Available edge types: ${context.schema.edgeTypes.join(", ")}

Respond in JSON format only.`,
      
      user: `Analyze this graph structure:

Metrics:
- Nodes: ${context.metrics.nodeCount}
- Edges: ${context.metrics.edgeCount}
- Density: ${context.metrics.density?.toFixed(4) || "N/A"}
- Fill ratio: ${(context.metrics.fillRatio * 100)?.toFixed(1) || "N/A"}%

Type distribution:
${JSON.stringify(context.structure.typeDistribution, null, 2)}

Connectivity:
- Connected: ${context.invariants.isConnected}
- Components: ${context.invariants.componentCount}
- Bridges (critical edges): ${context.invariants.bridgeCount}

Provide analysis in JSON format:
{
  "summary": "Brief overall assessment",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`,
      
      responseFormat: {
        type: "json_object",
        schema: {
          summary: "string",
          strengths: "string[]",
          concerns: "string[]",
          recommendations: "string[]",
        },
      },
    };
  }
  
  /**
   * Промпт для обнаружения слабых мест.
   * @private
   */
  _buildDetectWeaknesses(context, options) {
    return {
      system: `You are a graph architecture analyst specializing in detecting structural weaknesses.
Focus on: fragmentation, overloaded nodes, missing connections, potential single points of failure.

Respond in JSON format only.`,
      
      user: `Detect weaknesses in this graph:

Structure:
- Nodes: ${context.metrics.nodeCount}
- Edges: ${context.metrics.edgeCount}
- Isolated nodes: ${context.structure.isolatedNodes?.length || 0}
- High centrality nodes: ${context.structure.highCentralityNodes?.length || 0}

Invariants:
- Has cycles: ${context.invariants.hasCycles}
- Bridge count: ${context.invariants.bridgeCount}
- Is connected: ${context.invariants.isConnected}

Respond in JSON format:
{
  "weaknesses": [
    {
      "type": "fragmentation|overload|missing_connection|single_point_of_failure|other",
      "severity": "low|medium|high",
      "description": "Description of the weakness",
      "affectedNodes": ["nodeId1", "nodeId2"]
    }
  ],
  "overallHealth": "healthy|warning|critical"
}`,
      
      responseFormat: {
        type: "json_object",
        schema: {
          weaknesses: "array",
          overallHealth: "string",
        },
      },
    };
  }
  
  /**
   * Промпт для предложения улучшений.
   * @private
   */
  _buildSuggestImprovements(context, options) {
    return {
      system: `You are a graph architecture consultant. Suggest specific improvements as mutation proposals.
Available mutation types: ${context.schema.mutationTypes.join(", ")}
Available node types: ${context.schema.nodeTypes.join(", ")}
Available edge types: ${context.schema.edgeTypes.join(", ")}

IMPORTANT: Suggestions must be valid mutation proposals that can be applied via ChangeProtocol.
Respond in JSON format only.`,
      
      user: `Suggest improvements for this graph:

Current state:
- Nodes: ${context.metrics.nodeCount}
- Edges: ${context.metrics.edgeCount}
- Density: ${context.metrics.density?.toFixed(4) || "N/A"}

Recent changes: ${context.recentChanges.totalChanges || 0}

Respond in JSON format:
{
  "suggestions": [
    {
      "type": "addNode|removeNode|updateNode|addEdge|removeEdge|updateEdge",
      "payload": {
        "id": "node-id",
        "label": "Node Label",
        "type": "character|domain|hub|..."
      },
      "rationale": "Why this change improves the graph",
      "impact": "low|medium|high",
      "priority": 1
    }
  ]
}`,
      
      responseFormat: {
        type: "json_object",
        schema: {
          suggestions: "array",
        },
      },
    };
  }
  
  /**
   * Промпт для ревью предложения.
   * @private
   */
  _buildReviewProposal(context, options) {
    const { proposal } = options;
    
    if (!proposal) {
      throw new Error("Proposal is required for review prompt");
    }
    
    return {
      system: `You are a graph architecture reviewer. Evaluate the proposed change for potential issues.
Check for: schema violations, fragmentation risk, redundancy, invariant violations.

Respond in JSON format only.`,
      
      user: `Review this proposed change:

Proposal:
${JSON.stringify(proposal, null, 2)}

Current graph state:
- Nodes: ${context.metrics.nodeCount}
- Edges: ${context.metrics.edgeCount}
- Is connected: ${context.invariants.isConnected}

Respond in JSON format:
{
  "approved": true|false,
  "concerns": [
    {
      "type": "schema_violation|fragmentation|redundancy|invariant_violation|other",
      "severity": "low|medium|high",
      "description": "Description of the concern"
    }
  ],
  "recommendation": "approve|reject|modify",
  "suggestedModifications": "Optional modifications if recommendation is 'modify'"
}`,
      
      responseFormat: {
        type: "json_object",
        schema: {
          approved: "boolean",
          concerns: "array",
          recommendation: "string",
          suggestedModifications: "string|null",
        },
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTION PARSER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Парсит и валидирует ответы LLM.
 */
export class SuggestionParser {
  /**
   * Парсить ответ LLM с предложениями.
   * @param {string|Object} response - Ответ LLM (JSON string или объект)
   * @returns {ParseResult}
   */
  parseSuggestions(response) {
    try {
      const data = typeof response === "string" ? JSON.parse(response) : response;
      
      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        return {
          valid: false,
          suggestions: [],
          errors: [{ code: "MISSING_SUGGESTIONS", message: "Response must contain suggestions array" }],
        };
      }
      
      const validSuggestions = [];
      const errors = [];
      
      for (let i = 0; i < data.suggestions.length; i++) {
        const suggestion = data.suggestions[i];
        const validation = this._validateSuggestion(suggestion, i);
        
        if (validation.valid) {
          validSuggestions.push(this._normalizeSuggestion(suggestion));
        } else {
          errors.push(...validation.errors);
        }
      }
      
      return {
        valid: errors.length === 0,
        suggestions: validSuggestions,
        errors,
        rawResponse: data,
      };
    } catch (error) {
      return {
        valid: false,
        suggestions: [],
        errors: [{ code: "PARSE_ERROR", message: error.message }],
      };
    }
  }
  
  /**
   * Парсить ответ анализа.
   * @param {string|Object} response
   * @returns {Object}
   */
  parseAnalysis(response) {
    try {
      const data = typeof response === "string" ? JSON.parse(response) : response;
      
      return {
        valid: true,
        analysis: {
          summary: data.summary || "",
          strengths: data.strengths || [],
          concerns: data.concerns || [],
          recommendations: data.recommendations || [],
        },
        rawResponse: data,
      };
    } catch (error) {
      return {
        valid: false,
        analysis: null,
        errors: [{ code: "PARSE_ERROR", message: error.message }],
      };
    }
  }
  
  /**
   * Парсить ответ ревью.
   * @param {string|Object} response
   * @returns {Object}
   */
  parseReview(response) {
    try {
      const data = typeof response === "string" ? JSON.parse(response) : response;
      
      return {
        valid: true,
        review: {
          approved: Boolean(data.approved),
          concerns: data.concerns || [],
          recommendation: data.recommendation || "reject",
          suggestedModifications: data.suggestedModifications || null,
        },
        rawResponse: data,
      };
    } catch (error) {
      return {
        valid: false,
        review: null,
        errors: [{ code: "PARSE_ERROR", message: error.message }],
      };
    }
  }
  
  /**
   * Валидировать отдельное предложение.
   * @private
   */
  _validateSuggestion(suggestion, index) {
    const errors = [];
    const prefix = `suggestions[${index}]`;
    
    // Проверка типа
    if (!suggestion.type) {
      errors.push({ code: "MISSING_TYPE", message: `${prefix}: type is required` });
    } else if (!Object.values(MUTATION_TYPE).includes(suggestion.type)) {
      errors.push({ code: "INVALID_TYPE", message: `${prefix}: invalid type "${suggestion.type}"` });
    }
    
    // Проверка payload
    if (!suggestion.payload) {
      errors.push({ code: "MISSING_PAYLOAD", message: `${prefix}: payload is required` });
    }
    
    // Проверка rationale
    if (!suggestion.rationale) {
      errors.push({ code: "MISSING_RATIONALE", message: `${prefix}: rationale is required` });
    }
    
    // Проверка impact
    const validImpacts = ["low", "medium", "high"];
    if (suggestion.impact && !validImpacts.includes(suggestion.impact)) {
      errors.push({ code: "INVALID_IMPACT", message: `${prefix}: invalid impact "${suggestion.impact}"` });
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Нормализовать предложение.
   * @private
   */
  _normalizeSuggestion(suggestion) {
    return {
      type: suggestion.type,
      payload: suggestion.payload,
      rationale: suggestion.rationale,
      impact: suggestion.impact || "medium",
      priority: suggestion.priority || 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM REFLECTION ENGINE (ORCHESTRATOR)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Главный оркестратор LLM-рефлексии.
 * 
 * ВАЖНО: Это внешний слой, не часть Core.
 * Он только читает и симулирует, никогда не применяет изменения автоматически.
 */
export class LLMReflectionEngine {
  /**
   * @param {Object} options
   * @param {Object} options.graph - { nodes, edges }
   * @param {Function} [options.llmClient] - Функция для вызова LLM
   */
  constructor(options = {}) {
    const { graph, llmClient } = options;
    
    if (!graph) {
      throw new Error("Graph is required");
    }
    
    // Создаём GraphModel из данных графа
    const graphData = {
      nodes: graph.nodes || [],
      links: graph.edges || graph.links || [],
    };
    const graphModel = new GraphModel(graphData);
    
    // Создаём проекции (read-only доступ к Core)
    this.reflective = new ReflectiveProjection(graphModel);
    this.graphRAG = new GraphRAGProjection(graphModel);
    
    // Создаём ChangeProtocol (для simulate, НЕ для apply)
    this.protocol = new ChangeProtocol(graph);
    
    // Компоненты
    this.contextAssembler = new ContextAssembler({
      reflective: this.reflective,
      graphRAG: this.graphRAG,
      protocol: this.protocol,
    });
    this.promptBuilder = new PromptBuilder();
    this.suggestionParser = new SuggestionParser();
    
    // LLM клиент (может быть mock для тестов)
    this.llmClient = llmClient || null;
    
    // Режим работы
    this.mode = ENGINE_MODE.ANALYSIS;
  }
  
  /**
   * Установить режим работы.
   * @param {string} mode - Режим из ENGINE_MODE
   */
  setMode(mode) {
    if (!Object.values(ENGINE_MODE).includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    this.mode = mode;
  }
  
  /**
   * Получить текущий контекст.
   * @returns {LLMContext}
   */
  getContext() {
    return this.contextAssembler.assemble();
  }
  
  /**
   * Получить минимальный контекст.
   * @returns {Object}
   */
  getMinimalContext() {
    return this.contextAssembler.assembleMinimal();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 1: ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Анализировать структуру графа.
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async analyzeStructure(options = {}) {
    const context = this.getContext();
    const prompt = this.promptBuilder.build(PROMPT_TYPE.ANALYZE_STRUCTURE, context, options);
    
    if (!this.llmClient) {
      return {
        success: false,
        error: "LLM client not configured",
        prompt,
        context,
      };
    }
    
    try {
      const response = await this.llmClient(prompt);
      const parsed = this.suggestionParser.parseAnalysis(response);
      
      return {
        success: parsed.valid,
        analysis: parsed.analysis,
        errors: parsed.errors || [],
        prompt,
        context,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        prompt,
        context,
      };
    }
  }
  
  /**
   * Обнаружить слабые места.
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async detectWeaknesses(options = {}) {
    const context = this.getContext();
    const prompt = this.promptBuilder.build(PROMPT_TYPE.DETECT_WEAKNESSES, context, options);
    
    if (!this.llmClient) {
      return {
        success: false,
        error: "LLM client not configured",
        prompt,
        context,
      };
    }
    
    try {
      const response = await this.llmClient(prompt);
      const parsed = this.suggestionParser.parseAnalysis(response);
      
      return {
        success: parsed.valid,
        weaknesses: parsed.rawResponse?.weaknesses || [],
        overallHealth: parsed.rawResponse?.overallHealth || "unknown",
        errors: parsed.errors || [],
        prompt,
        context,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        prompt,
        context,
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 2: SUGGESTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить предложения по улучшению.
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async suggestImprovements(options = {}) {
    const context = this.getContext();
    const prompt = this.promptBuilder.build(PROMPT_TYPE.SUGGEST_IMPROVEMENTS, context, options);
    
    if (!this.llmClient) {
      return {
        success: false,
        error: "LLM client not configured",
        prompt,
        context,
      };
    }
    
    try {
      const response = await this.llmClient(prompt);
      const parsed = this.suggestionParser.parseSuggestions(response);
      
      if (!parsed.valid) {
        return {
          success: false,
          suggestions: [],
          errors: parsed.errors,
          prompt,
          context,
        };
      }
      
      // Конвертируем в proposals и симулируем
      const results = await this._processAndSimulateSuggestions(parsed.suggestions);
      
      return {
        success: true,
        suggestions: results,
        errors: [],
        prompt,
        context,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        prompt,
        context,
      };
    }
  }
  
  /**
   * Обработать и симулировать предложения.
   * @private
   */
  async _processAndSimulateSuggestions(suggestions) {
    const results = [];
    
    for (const suggestion of suggestions) {
      const proposal = this._convertToProposal(suggestion);
      const simulation = this.protocol.simulate(proposal);
      
      results.push({
        suggestion,
        proposal,
        simulation: {
          valid: simulation.valid,
          diff: simulation.diff,
          errors: simulation.errors,
        },
      });
    }
    
    return results;
  }
  
  /**
   * Конвертировать suggestion в proposal.
   * @private
   */
  _convertToProposal(suggestion) {
    switch (suggestion.type) {
      case MUTATION_TYPE.ADD_NODE:
        return this.protocol.proposeAddNode(
          suggestion.payload,
          suggestion.rationale,
          AUTHOR_TYPE.LLM
        );
      
      case MUTATION_TYPE.REMOVE_NODE:
        return this.protocol.proposeRemoveNode(
          suggestion.payload.id,
          suggestion.rationale,
          AUTHOR_TYPE.LLM
        );
      
      case MUTATION_TYPE.UPDATE_NODE:
        return this.protocol.proposeUpdateNode(
          suggestion.payload.id,
          suggestion.payload.changes || suggestion.payload,
          suggestion.rationale,
          AUTHOR_TYPE.LLM
        );
      
      case MUTATION_TYPE.ADD_EDGE:
        return this.protocol.proposeAddEdge(
          suggestion.payload,
          suggestion.rationale,
          AUTHOR_TYPE.LLM
        );
      
      case MUTATION_TYPE.REMOVE_EDGE:
        return this.protocol.proposeRemoveEdge(
          suggestion.payload.id,
          suggestion.rationale,
          AUTHOR_TYPE.LLM
        );
      
      default:
        throw new Error(`Unsupported mutation type: ${suggestion.type}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 3: REVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Ревью существующего предложения.
   * @param {Object} proposal
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async reviewProposal(proposal, options = {}) {
    const context = this.getContext();
    const prompt = this.promptBuilder.build(PROMPT_TYPE.REVIEW_PROPOSAL, context, { ...options, proposal });
    
    if (!this.llmClient) {
      return {
        success: false,
        error: "LLM client not configured",
        prompt,
        context,
      };
    }
    
    try {
      const response = await this.llmClient(prompt);
      const parsed = this.suggestionParser.parseReview(response);
      
      // Также симулируем предложение
      const simulation = this.protocol.simulate(proposal);
      
      return {
        success: parsed.valid,
        review: parsed.review,
        simulation: {
          valid: simulation.valid,
          diff: simulation.diff,
          errors: simulation.errors,
        },
        errors: parsed.errors || [],
        prompt,
        context,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        prompt,
        context,
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Получить статистику.
   * @returns {Object}
   */
  getStats() {
    let reflectiveStats = null;
    try {
      reflectiveStats = this.reflective?.getStats?.() || null;
    } catch {
      reflectiveStats = null;
    }
    
    return {
      mode: this.mode,
      hasLLMClient: Boolean(this.llmClient),
      protocolStats: this.protocol.getStats(),
      reflectiveStats,
    };
  }
  
  /**
   * Получить текущий граф (read-only).
   * @returns {Object}
   */
  getGraph() {
    return this.protocol.getGraph();
  }
  
  /**
   * Получить историю изменений.
   * @returns {Array}
   */
  getHistory() {
    return this.protocol.getHistory();
  }
  
  /**
   * Очистить кэши.
   */
  invalidateCache() {
    if (this.reflective?.invalidateCache) {
      this.reflective.invalidateCache();
    }
    // GraphRAGProjection doesn't have invalidateCache
  }
  
  /**
   * Уничтожить engine.
   */
  destroy() {
    this.reflective.destroy();
    this.graphRAG.destroy();
    this.llmClient = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  LLMReflectionEngine,
  ContextAssembler,
  PromptBuilder,
  SuggestionParser,
  ENGINE_MODE,
  PROMPT_TYPE,
};
