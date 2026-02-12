/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OWL PROJECTION — Экспорт Core в OWL/RDF
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 2: Core → Multi-Projection
 * P3.6: OWL-экспорт
 * См. repair-shop/ROADMAP.md
 * 
 * ПРИНЦИП:
 * - Сериализация GraphModel → OWL-онтология
 * - Identity, canonicalName, типы → OWL-классы и свойства
 * - OwnershipGraph → OWL-отношения
 * - Только читает данные, не мутирует state
 * 
 * BOUNDARY FREEZE:
 * - Этот модуль НЕ использует DOM
 * - Этот модуль НЕ использует document/window
 * - Чистая сериализация данных
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const owlProjection = new OWLProjection(graphModel, ownershipGraph);
 * const turtle = owlProjection.serialize("turtle");
 * const jsonld = owlProjection.serialize("jsonld");
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Projection } from "./Projection.js";
import { extractIdentityFromNode, getDisplayName } from "./Identity.js";

/**
 * Namespace prefixes для OWL/RDF.
 */
const NAMESPACES = {
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  dc: "http://purl.org/dc/elements/1.1/",
  dcterms: "http://purl.org/dc/terms/",
  vova: "https://vovaipetrova.art/ontology#"
};

/**
 * OWL-проекция для экспорта Core в OWL/RDF.
 * 
 * @pure Не использует DOM, не имеет side effects
 */
export class OWLProjection extends Projection {
  /**
   * @param {import("./GraphModel.js").GraphModel} graphModel
   * @param {import("./OwnershipGraph.js").OwnershipGraph} [ownershipGraph]
   */
  constructor(graphModel, ownershipGraph = null) {
    super("owl");
    
    /** @type {import("./GraphModel.js").GraphModel} */
    this.graphModel = graphModel;
    
    /** @type {import("./OwnershipGraph.js").OwnershipGraph|null} */
    this.ownershipGraph = ownershipGraph;
    
    /** @type {string} */
    this.baseUri = NAMESPACES.vova;
    
    this.initialized = true;
  }
  
  /**
   * Установить базовый URI для онтологии.
   * @param {string} uri
   */
  setBaseUri(uri) {
    this.baseUri = uri;
  }
  
  /**
   * Экспортировать узлы как OWL-сущности.
   * @returns {Array<Object>} Массив OWL-сущностей
   */
  exportNodes() {
    const nodes = this.graphModel.getNodes();
    return nodes.map(node => this._nodeToOwl(node));
  }
  
  /**
   * Экспортировать рёбра как OWL ObjectProperty.
   * @returns {Array<Object>} Массив OWL-свойств
   */
  exportEdges() {
    const edges = this.graphModel.getEdges();
    return edges.map(edge => this._edgeToOwl(edge));
  }
  
  /**
   * Экспортировать Identity как SKOS/RDFS labels.
   * @returns {Array<Object>} Массив Identity-аннотаций
   */
  exportIdentity() {
    const nodes = this.graphModel.getNodes();
    return nodes.map(node => this._identityToOwl(node));
  }
  
  /**
   * Экспортировать OwnershipGraph как OWL-отношения.
   * Экспортирует состояния и вычисления как OWL-сущности.
   * @returns {Array<Object>} Массив ownership-отношений
   */
  exportOwnership() {
    if (!this.ownershipGraph) return [];
    
    const relations = [];
    
    // Экспортировать состояния
    const states = this.ownershipGraph.getStates();
    for (const state of states) {
      relations.push({
        "@type": "owl:NamedIndividual",
        "@id": `${this.baseUri}state_${state.state}`,
        "rdf:type": { "@id": `${this.baseUri}State` },
        "rdfs:label": state.state,
        [`${this.baseUri}ownedBy`]: { "@id": `${this.baseUri}${state.owner.replace(/\./g, "_")}` }
      });
    }
    
    // Экспортировать вычисления
    const computations = this.ownershipGraph.getComputations();
    for (const comp of computations) {
      relations.push({
        "@type": "owl:NamedIndividual",
        "@id": `${this.baseUri}comp_${comp.name}`,
        "rdf:type": { "@id": `${this.baseUri}Computation` },
        "rdfs:label": comp.name,
        [`${this.baseUri}ownedBy`]: { "@id": `${this.baseUri}${comp.owner.replace(/\./g, "_")}` }
      });
    }
    
    return relations;
  }
  
  /**
   * Экспортировать типы узлов как OWL-классы.
   * @returns {Array<Object>} Массив OWL-классов
   */
  exportClasses() {
    const types = [...this.graphModel.nodeTypes];
    return types.map(type => ({
      "@type": "owl:Class",
      "@id": `${this.baseUri}${this._capitalize(type)}`,
      "rdfs:label": type,
      "rdfs:comment": `Class for ${type} entities`
    }));
  }
  
  /**
   * Сериализовать в указанный формат.
   * @param {"turtle"|"jsonld"|"ntriples"} format
   * @returns {string}
   */
  serialize(format = "turtle") {
    switch (format) {
      case "turtle":
        return this._serializeTurtle();
      case "jsonld":
        return this._serializeJsonLd();
      case "ntriples":
        return this._serializeNTriples();
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }
  
  /**
   * Получить полную онтологию как JSON-LD.
   * @returns {Object}
   */
  toJsonLd() {
    const context = {
      "@context": {
        "rdf": NAMESPACES.rdf,
        "rdfs": NAMESPACES.rdfs,
        "owl": NAMESPACES.owl,
        "xsd": NAMESPACES.xsd,
        "skos": NAMESPACES.skos,
        "dc": NAMESPACES.dc,
        "dcterms": NAMESPACES.dcterms,
        "vova": this.baseUri
      }
    };
    
    const ontology = {
      "@id": this.baseUri,
      "@type": "owl:Ontology",
      "dc:title": "VovaIPetrova Universe Ontology",
      "dc:description": "Ontology exported from Core GraphModel",
      "dcterms:created": new Date().toISOString()
    };
    
    const classes = this.exportClasses();
    const nodes = this.exportNodes();
    const edges = this.exportEdges();
    const identity = this.exportIdentity();
    const ownership = this.exportOwnership();
    
    return {
      ...context,
      "@graph": [
        ontology,
        ...classes,
        ...nodes,
        ...edges,
        ...identity,
        ...ownership
      ]
    };
  }
  
  /**
   * Преобразовать узел в OWL-сущность.
   * @private
   */
  _nodeToOwl(node) {
    const typeClass = node.type ? `${this.baseUri}${this._capitalize(node.type)}` : `${this.baseUri}Entity`;
    
    return {
      "@type": "owl:NamedIndividual",
      "@id": `${this.baseUri}${node.id}`,
      "rdf:type": { "@id": typeClass },
      "rdfs:label": getDisplayName(extractIdentityFromNode(node)) || node.id
    };
  }
  
  /**
   * Преобразовать ребро в OWL ObjectProperty assertion.
   * @private
   */
  _edgeToOwl(edge) {
    return {
      "@type": "owl:ObjectPropertyAssertion",
      "owl:sourceIndividual": { "@id": `${this.baseUri}${edge.source}` },
      "owl:assertionProperty": { "@id": `${this.baseUri}relatedTo` },
      "owl:targetIndividual": { "@id": `${this.baseUri}${edge.target}` }
    };
  }
  
  /**
   * Преобразовать Identity в SKOS/RDFS labels.
   * @private
   */
  _identityToOwl(node) {
    const identity = extractIdentityFromNode(node);
    const result = {
      "@id": `${this.baseUri}${node.id}`
    };
    
    if (identity.canonicalName) {
      result["skos:prefLabel"] = identity.canonicalName;
    }
    
    if (identity.aliases && identity.aliases.length > 0) {
      result["skos:altLabel"] = identity.aliases;
    }
    
    if (identity.slug) {
      result["dc:identifier"] = identity.slug;
    }
    
    return result;
  }
  
  /**
   * Сериализовать в Turtle формат.
   * @private
   */
  _serializeTurtle() {
    const lines = [];
    
    // Prefixes
    lines.push("@prefix rdf: <" + NAMESPACES.rdf + "> .");
    lines.push("@prefix rdfs: <" + NAMESPACES.rdfs + "> .");
    lines.push("@prefix owl: <" + NAMESPACES.owl + "> .");
    lines.push("@prefix xsd: <" + NAMESPACES.xsd + "> .");
    lines.push("@prefix skos: <" + NAMESPACES.skos + "> .");
    lines.push("@prefix dc: <" + NAMESPACES.dc + "> .");
    lines.push("@prefix vova: <" + this.baseUri + "> .");
    lines.push("");
    
    // Ontology declaration
    lines.push("<" + this.baseUri + "> a owl:Ontology ;");
    lines.push('    dc:title "VovaIPetrova Universe Ontology" .');
    lines.push("");
    
    // Classes
    for (const type of this.graphModel.nodeTypes) {
      const className = this._capitalize(type);
      lines.push(`vova:${className} a owl:Class ;`);
      lines.push(`    rdfs:label "${type}" .`);
      lines.push("");
    }
    
    // Object Properties
    lines.push("vova:relatedTo a owl:ObjectProperty ;");
    lines.push('    rdfs:label "related to" .');
    lines.push("");
    
    if (this.ownershipGraph) {
      lines.push("vova:owns a owl:ObjectProperty ;");
      lines.push('    rdfs:label "owns" .');
      lines.push("");
    }
    
    // Individuals (nodes)
    for (const node of this.graphModel.getNodes()) {
      const identity = extractIdentityFromNode(node);
      const label = getDisplayName(identity) || node.id;
      const typeClass = node.type ? this._capitalize(node.type) : "Entity";
      
      lines.push(`vova:${node.id} a owl:NamedIndividual, vova:${typeClass} ;`);
      lines.push(`    rdfs:label "${this._escapeTurtle(label)}" ;`);
      
      if (identity.canonicalName) {
        lines.push(`    skos:prefLabel "${this._escapeTurtle(identity.canonicalName)}" ;`);
      }
      
      if (identity.aliases && identity.aliases.length > 0) {
        const aliasStr = identity.aliases.map(a => `"${this._escapeTurtle(a)}"`).join(", ");
        lines.push(`    skos:altLabel ${aliasStr} ;`);
      }
      
      // Remove trailing semicolon and add period
      const lastLine = lines.pop();
      lines.push(lastLine.replace(/;$/, "."));
      lines.push("");
    }
    
    // Edges as property assertions
    for (const edge of this.graphModel.getEdges()) {
      lines.push(`vova:${edge.source} vova:relatedTo vova:${edge.target} .`);
    }
    lines.push("");
    
    // Ownership relations (states and computations)
    if (this.ownershipGraph) {
      const states = this.ownershipGraph.getStates();
      for (const state of states) {
        const stateId = `state_${state.state}`;
        const ownerId = state.owner.replace(/\./g, "_");
        lines.push(`vova:${stateId} a vova:State ;`);
        lines.push(`    rdfs:label "${state.state}" ;`);
        lines.push(`    vova:ownedBy vova:${ownerId} .`);
      }
      lines.push("");
      
      const computations = this.ownershipGraph.getComputations();
      for (const comp of computations) {
        const compId = `comp_${comp.name}`;
        const ownerId = comp.owner.replace(/\./g, "_");
        lines.push(`vova:${compId} a vova:Computation ;`);
        lines.push(`    rdfs:label "${comp.name}" ;`);
        lines.push(`    vova:ownedBy vova:${ownerId} .`);
      }
    }
    
    return lines.join("\n");
  }
  
  /**
   * Сериализовать в JSON-LD формат.
   * @private
   */
  _serializeJsonLd() {
    return JSON.stringify(this.toJsonLd(), null, 2);
  }
  
  /**
   * Сериализовать в N-Triples формат.
   * @private
   */
  _serializeNTriples() {
    const triples = [];
    
    // Ontology
    triples.push(`<${this.baseUri}> <${NAMESPACES.rdf}type> <${NAMESPACES.owl}Ontology> .`);
    
    // Classes
    for (const type of this.graphModel.nodeTypes) {
      const classUri = `${this.baseUri}${this._capitalize(type)}`;
      triples.push(`<${classUri}> <${NAMESPACES.rdf}type> <${NAMESPACES.owl}Class> .`);
      triples.push(`<${classUri}> <${NAMESPACES.rdfs}label> "${type}" .`);
    }
    
    // Individuals
    for (const node of this.graphModel.getNodes()) {
      const nodeUri = `${this.baseUri}${node.id}`;
      const typeClass = node.type ? `${this.baseUri}${this._capitalize(node.type)}` : `${this.baseUri}Entity`;
      const identity = extractIdentityFromNode(node);
      const label = getDisplayName(identity) || node.id;
      
      triples.push(`<${nodeUri}> <${NAMESPACES.rdf}type> <${NAMESPACES.owl}NamedIndividual> .`);
      triples.push(`<${nodeUri}> <${NAMESPACES.rdf}type> <${typeClass}> .`);
      triples.push(`<${nodeUri}> <${NAMESPACES.rdfs}label> "${this._escapeNTriples(label)}" .`);
      
      if (identity.canonicalName) {
        triples.push(`<${nodeUri}> <${NAMESPACES.skos}prefLabel> "${this._escapeNTriples(identity.canonicalName)}" .`);
      }
    }
    
    // Edges
    for (const edge of this.graphModel.getEdges()) {
      const sourceUri = `${this.baseUri}${edge.source}`;
      const targetUri = `${this.baseUri}${edge.target}`;
      triples.push(`<${sourceUri}> <${this.baseUri}relatedTo> <${targetUri}> .`);
    }
    
    // Ownership (states and computations)
    if (this.ownershipGraph) {
      const states = this.ownershipGraph.getStates();
      for (const state of states) {
        const stateUri = `${this.baseUri}state_${state.state}`;
        const ownerUri = `${this.baseUri}${state.owner.replace(/\./g, "_")}`;
        triples.push(`<${stateUri}> <${NAMESPACES.rdf}type> <${this.baseUri}State> .`);
        triples.push(`<${stateUri}> <${NAMESPACES.rdfs}label> "${state.state}" .`);
        triples.push(`<${stateUri}> <${this.baseUri}ownedBy> <${ownerUri}> .`);
      }
      
      const computations = this.ownershipGraph.getComputations();
      for (const comp of computations) {
        const compUri = `${this.baseUri}comp_${comp.name}`;
        const ownerUri = `${this.baseUri}${comp.owner.replace(/\./g, "_")}`;
        triples.push(`<${compUri}> <${NAMESPACES.rdf}type> <${this.baseUri}Computation> .`);
        triples.push(`<${compUri}> <${NAMESPACES.rdfs}label> "${comp.name}" .`);
        triples.push(`<${compUri}> <${this.baseUri}ownedBy> <${ownerUri}> .`);
      }
    }
    
    return triples.join("\n");
  }
  
  /**
   * Capitalize first letter.
   * @private
   */
  _capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Escape string for Turtle format.
   * @private
   */
  _escapeTurtle(str) {
    if (!str) return "";
    const s = String(str);
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }
  
  /**
   * Escape string for N-Triples format.
   * @private
   */
  _escapeNTriples(str) {
    if (!str) return "";
    const s = String(str);
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }
  
  /**
   * Получить статистику экспорта.
   * @returns {Object}
   */
  getStats() {
    return {
      classes: this.graphModel.nodeTypes.size,
      individuals: this.graphModel.nodesById.size,
      objectProperties: this.graphModel.edges.length,
      ownershipRelations: this.ownershipGraph ? this._countOwnershipRelations() : 0
    };
  }
  
  /**
   * Подсчитать количество ownership-отношений.
   * @private
   */
  _countOwnershipRelations() {
    if (!this.ownershipGraph) return 0;
    const states = this.ownershipGraph.getStates();
    const computations = this.ownershipGraph.getComputations();
    return states.length + computations.length;
  }
  
  /**
   * Уничтожить проекцию.
   */
  destroy() {
    this.graphModel = null;
    this.ownershipGraph = null;
    this.initialized = false;
  }
}

export { NAMESPACES };
