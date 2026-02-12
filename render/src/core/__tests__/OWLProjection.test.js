/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OWL PROJECTION TESTS — P3.6 OWL-экспорт
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Тесты для OWLProjection — экспорт Core в OWL/RDF.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OWLProjection, NAMESPACES } from "../OWLProjection.js";
import { GraphModel } from "../GraphModel.js";
import { OwnershipGraph } from "../OwnershipGraph.js";

describe("OWLProjection", () => {
  let graphModel;
  let ownershipGraph;
  let owlProjection;
  
  beforeEach(() => {
    graphModel = new GraphModel({
      nodes: [
        { id: "vova", type: "character", label: "Vova", canonicalName: "Владимир" },
        { id: "art", type: "domain", label: "Art" },
        { id: "music", type: "domain", label: "Music" }
      ],
      links: [
        { id: "edge1", source: "vova", target: "art" },
        { id: "edge2", source: "vova", target: "music" }
      ]
    });
    
    // OwnershipGraph использует состояния и вычисления, а не простое владение
    ownershipGraph = new OwnershipGraph();
    // Он уже инициализирован с системными состояниями
    
    owlProjection = new OWLProjection(graphModel, ownershipGraph);
  });
  
  describe("constructor", () => {
    it("should have name 'owl'", () => {
      expect(owlProjection.name).toBe("owl");
    });
    
    it("should be initialized", () => {
      expect(owlProjection.initialized).toBe(true);
    });
    
    it("should store graphModel reference", () => {
      expect(owlProjection.graphModel).toBe(graphModel);
    });
    
    it("should store ownershipGraph reference", () => {
      expect(owlProjection.ownershipGraph).toBe(ownershipGraph);
    });
    
    it("should work without ownershipGraph", () => {
      const projection = new OWLProjection(graphModel);
      expect(projection.ownershipGraph).toBeNull();
    });
  });
  
  describe("setBaseUri", () => {
    it("should change base URI", () => {
      owlProjection.setBaseUri("https://example.org/ontology#");
      expect(owlProjection.baseUri).toBe("https://example.org/ontology#");
    });
  });
  
  describe("exportNodes", () => {
    it("should return array of OWL entities", () => {
      const nodes = owlProjection.exportNodes();
      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes).toHaveLength(3);
    });
    
    it("should include @type owl:NamedIndividual", () => {
      const nodes = owlProjection.exportNodes();
      expect(nodes[0]["@type"]).toBe("owl:NamedIndividual");
    });
    
    it("should include @id with base URI", () => {
      const nodes = owlProjection.exportNodes();
      expect(nodes[0]["@id"]).toContain(NAMESPACES.vova);
      expect(nodes[0]["@id"]).toContain("vova");
    });
    
    it("should include rdf:type with class", () => {
      const nodes = owlProjection.exportNodes();
      const vovaNode = nodes.find(n => n["@id"].includes("vova"));
      expect(vovaNode["rdf:type"]["@id"]).toContain("Character");
    });
    
    it("should include rdfs:label", () => {
      const nodes = owlProjection.exportNodes();
      expect(nodes[0]["rdfs:label"]).toBeDefined();
    });
  });
  
  describe("exportEdges", () => {
    it("should return array of OWL property assertions", () => {
      const edges = owlProjection.exportEdges();
      expect(Array.isArray(edges)).toBe(true);
      expect(edges).toHaveLength(2);
    });
    
    it("should include @type owl:ObjectPropertyAssertion", () => {
      const edges = owlProjection.exportEdges();
      expect(edges[0]["@type"]).toBe("owl:ObjectPropertyAssertion");
    });
    
    it("should include source and target individuals", () => {
      const edges = owlProjection.exportEdges();
      expect(edges[0]["owl:sourceIndividual"]).toBeDefined();
      expect(edges[0]["owl:targetIndividual"]).toBeDefined();
    });
  });
  
  describe("exportIdentity", () => {
    it("should return array of identity annotations", () => {
      const identity = owlProjection.exportIdentity();
      expect(Array.isArray(identity)).toBe(true);
      expect(identity).toHaveLength(3);
    });
    
    it("should include @id", () => {
      const identity = owlProjection.exportIdentity();
      expect(identity[0]["@id"]).toBeDefined();
    });
    
    it("should include skos:prefLabel for canonicalName", () => {
      const identity = owlProjection.exportIdentity();
      const vovaIdentity = identity.find(i => i["@id"].includes("vova"));
      expect(vovaIdentity["skos:prefLabel"]).toBe("Владимир");
    });
  });
  
  describe("exportOwnership", () => {
    it("should return array of ownership relations", () => {
      const ownership = owlProjection.exportOwnership();
      expect(Array.isArray(ownership)).toBe(true);
      // OwnershipGraph has system states and computations
      expect(ownership.length).toBeGreaterThan(0);
    });
    
    it("should return empty array without ownershipGraph", () => {
      const projection = new OWLProjection(graphModel);
      const ownership = projection.exportOwnership();
      expect(ownership).toHaveLength(0);
    });
    
    it("should include owl:NamedIndividual type for states", () => {
      const ownership = owlProjection.exportOwnership();
      const stateItem = ownership.find(o => o["@id"].includes("state_"));
      expect(stateItem["@type"]).toBe("owl:NamedIndividual");
    });
  });
  
  describe("exportClasses", () => {
    it("should return array of OWL classes", () => {
      const classes = owlProjection.exportClasses();
      expect(Array.isArray(classes)).toBe(true);
      expect(classes).toHaveLength(2); // character, domain
    });
    
    it("should include @type owl:Class", () => {
      const classes = owlProjection.exportClasses();
      expect(classes[0]["@type"]).toBe("owl:Class");
    });
    
    it("should capitalize class names", () => {
      const classes = owlProjection.exportClasses();
      const characterClass = classes.find(c => c["rdfs:label"] === "character");
      expect(characterClass["@id"]).toContain("Character");
    });
  });
  
  describe("serialize", () => {
    describe("turtle format", () => {
      it("should return string", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(typeof turtle).toBe("string");
      });
      
      it("should include prefixes", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("@prefix rdf:");
        expect(turtle).toContain("@prefix rdfs:");
        expect(turtle).toContain("@prefix owl:");
        expect(turtle).toContain("@prefix skos:");
      });
      
      it("should include ontology declaration", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("a owl:Ontology");
      });
      
      it("should include classes", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("a owl:Class");
      });
      
      it("should include individuals", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("a owl:NamedIndividual");
      });
      
      it("should include property assertions", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("vova:relatedTo");
      });
      
      it("should include ownership relations", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("vova:owns");
      });
      
      it("should include skos:prefLabel", () => {
        const turtle = owlProjection.serialize("turtle");
        expect(turtle).toContain("skos:prefLabel");
      });
    });
    
    describe("jsonld format", () => {
      it("should return valid JSON string", () => {
        const jsonld = owlProjection.serialize("jsonld");
        expect(() => JSON.parse(jsonld)).not.toThrow();
      });
      
      it("should include @context", () => {
        const jsonld = JSON.parse(owlProjection.serialize("jsonld"));
        expect(jsonld["@context"]).toBeDefined();
      });
      
      it("should include @graph", () => {
        const jsonld = JSON.parse(owlProjection.serialize("jsonld"));
        expect(jsonld["@graph"]).toBeDefined();
        expect(Array.isArray(jsonld["@graph"])).toBe(true);
      });
      
      it("should include ontology in @graph", () => {
        const jsonld = JSON.parse(owlProjection.serialize("jsonld"));
        const ontology = jsonld["@graph"].find(item => item["@type"] === "owl:Ontology");
        expect(ontology).toBeDefined();
      });
    });
    
    describe("ntriples format", () => {
      it("should return string", () => {
        const ntriples = owlProjection.serialize("ntriples");
        expect(typeof ntriples).toBe("string");
      });
      
      it("should have lines ending with .", () => {
        const ntriples = owlProjection.serialize("ntriples");
        const lines = ntriples.split("\n").filter(l => l.trim());
        for (const line of lines) {
          expect(line.trim().endsWith(".")).toBe(true);
        }
      });
      
      it("should include full URIs", () => {
        const ntriples = owlProjection.serialize("ntriples");
        expect(ntriples).toContain("<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>");
      });
    });
    
    it("should throw on unknown format", () => {
      expect(() => owlProjection.serialize("unknown")).toThrow("Unknown format");
    });
  });
  
  describe("toJsonLd", () => {
    it("should return object with @context", () => {
      const jsonld = owlProjection.toJsonLd();
      expect(jsonld["@context"]).toBeDefined();
    });
    
    it("should include namespace prefixes in @context", () => {
      const jsonld = owlProjection.toJsonLd();
      expect(jsonld["@context"]["rdf"]).toBe(NAMESPACES.rdf);
      expect(jsonld["@context"]["rdfs"]).toBe(NAMESPACES.rdfs);
      expect(jsonld["@context"]["owl"]).toBe(NAMESPACES.owl);
    });
    
    it("should include @graph with all entities", () => {
      const jsonld = owlProjection.toJsonLd();
      expect(jsonld["@graph"].length).toBeGreaterThan(0);
    });
  });
  
  describe("getStats", () => {
    it("should return statistics object", () => {
      const stats = owlProjection.getStats();
      expect(stats).toBeDefined();
    });
    
    it("should count classes", () => {
      const stats = owlProjection.getStats();
      expect(stats.classes).toBe(2); // character, domain
    });
    
    it("should count individuals", () => {
      const stats = owlProjection.getStats();
      expect(stats.individuals).toBe(3); // vova, art, music
    });
    
    it("should count object properties", () => {
      const stats = owlProjection.getStats();
      expect(stats.objectProperties).toBe(2); // 2 edges
    });
    
    it("should count ownership relations (states + computations)", () => {
      const stats = owlProjection.getStats();
      // OwnershipGraph has system states and computations
      expect(stats.ownershipRelations).toBeGreaterThan(0);
    });
    
    it("should return 0 ownership without ownershipGraph", () => {
      const projection = new OWLProjection(graphModel);
      const stats = projection.getStats();
      expect(stats.ownershipRelations).toBe(0);
    });
  });
  
  describe("destroy", () => {
    it("should clear references", () => {
      owlProjection.destroy();
      expect(owlProjection.graphModel).toBeNull();
      expect(owlProjection.ownershipGraph).toBeNull();
      expect(owlProjection.initialized).toBe(false);
    });
  });
  
  describe("purity", () => {
    it("should not mutate graphModel", () => {
      const nodesBefore = graphModel.nodesById.size;
      const edgesBefore = graphModel.edges.length;
      
      owlProjection.exportNodes();
      owlProjection.exportEdges();
      owlProjection.exportIdentity();
      owlProjection.exportClasses();
      owlProjection.serialize("turtle");
      owlProjection.serialize("jsonld");
      owlProjection.serialize("ntriples");
      
      expect(graphModel.nodesById.size).toBe(nodesBefore);
      expect(graphModel.edges.length).toBe(edgesBefore);
    });
    
    it("should not mutate ownershipGraph", () => {
      const statesBefore = ownershipGraph.getStates().length;
      const computationsBefore = ownershipGraph.getComputations().length;
      
      owlProjection.exportOwnership();
      owlProjection.serialize("turtle");
      
      expect(ownershipGraph.getStates().length).toBe(statesBefore);
      expect(ownershipGraph.getComputations().length).toBe(computationsBefore);
    });
  });
  
  describe("edge cases", () => {
    it("should handle empty graph", () => {
      const emptyGraph = new GraphModel({ nodes: [], links: [] });
      const projection = new OWLProjection(emptyGraph);
      
      expect(projection.exportNodes()).toHaveLength(0);
      expect(projection.exportEdges()).toHaveLength(0);
      expect(projection.exportClasses()).toHaveLength(0);
      
      const turtle = projection.serialize("turtle");
      expect(turtle).toContain("owl:Ontology");
    });
    
    it("should handle nodes without type", () => {
      const graphWithoutTypes = new GraphModel({
        nodes: [{ id: "node1" }],
        links: []
      });
      const projection = new OWLProjection(graphWithoutTypes);
      
      const nodes = projection.exportNodes();
      expect(nodes[0]["rdf:type"]["@id"]).toContain("Entity");
    });
    
    it("should handle special characters in labels", () => {
      const graphWithSpecialChars = new GraphModel({
        nodes: [{ id: "node1", label: 'Test "quoted" & <special>' }],
        links: []
      });
      const projection = new OWLProjection(graphWithSpecialChars);
      
      const turtle = projection.serialize("turtle");
      expect(turtle).not.toContain('""');
    });
    
    it("should handle cyrillic characters", () => {
      const turtle = owlProjection.serialize("turtle");
      expect(turtle).toContain("Владимир");
    });
  });
});

describe("NAMESPACES", () => {
  it("should export standard namespaces", () => {
    expect(NAMESPACES.rdf).toBe("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    expect(NAMESPACES.rdfs).toBe("http://www.w3.org/2000/01/rdf-schema#");
    expect(NAMESPACES.owl).toBe("http://www.w3.org/2002/07/owl#");
    expect(NAMESPACES.skos).toBe("http://www.w3.org/2004/02/skos/core#");
  });
  
  it("should include vova namespace", () => {
    expect(NAMESPACES.vova).toBe("https://vovaipetrova.art/ontology#");
  });
});
