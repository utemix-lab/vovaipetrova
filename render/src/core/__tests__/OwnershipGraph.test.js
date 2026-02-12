/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OWNERSHIP GRAPH TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.4: Тесты для Core
 * Цель: Сделать Core неизменяемым ядром
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OwnershipGraph } from "../OwnershipGraph.js";

describe("OwnershipGraph", () => {
  let ownership;
  
  beforeEach(() => {
    ownership = new OwnershipGraph();
  });
  
  describe("constructor", () => {
    it("initializes with system states", () => {
      const states = ownership.getStates();
      
      expect(states.length).toBeGreaterThan(0);
      expect(states.some(s => s.state === "graphData")).toBe(true);
      expect(states.some(s => s.state === "highlightState")).toBe(true);
    });
    
    it("initializes with system computations", () => {
      const computations = ownership.getComputations();
      
      expect(computations.length).toBeGreaterThan(0);
      expect(computations.some(c => c.name === "computeHighlight")).toBe(true);
    });
  });
  
  describe("registerState", () => {
    it("registers new state", () => {
      ownership.registerState("testState", "testOwner", "Test description");
      
      const state = ownership.states.get("testState");
      expect(state).toBeDefined();
      expect(state.owner).toBe("testOwner");
      expect(state.description).toBe("Test description");
    });
    
    it("initializes empty producers and consumers", () => {
      ownership.registerState("testState", "testOwner");
      
      const state = ownership.states.get("testState");
      expect(state.producers).toEqual([]);
      expect(state.consumers).toEqual([]);
    });
  });
  
  describe("registerProducer", () => {
    it("adds producer to state", () => {
      ownership.registerState("testState", "testOwner");
      ownership.registerProducer("testState", "producer1");
      
      const state = ownership.states.get("testState");
      expect(state.producers).toContain("producer1");
    });
    
    it("does not add duplicate producers", () => {
      ownership.registerState("testState", "testOwner");
      ownership.registerProducer("testState", "producer1");
      ownership.registerProducer("testState", "producer1");
      
      const state = ownership.states.get("testState");
      expect(state.producers.filter(p => p === "producer1").length).toBe(1);
    });
    
    it("does nothing for unknown state", () => {
      ownership.registerProducer("unknownState", "producer1");
      // Should not throw
    });
  });
  
  describe("registerConsumer", () => {
    it("adds consumer to state", () => {
      ownership.registerState("testState", "testOwner");
      ownership.registerConsumer("testState", "consumer1");
      
      const state = ownership.states.get("testState");
      expect(state.consumers).toContain("consumer1");
    });
    
    it("does not add duplicate consumers", () => {
      ownership.registerState("testState", "testOwner");
      ownership.registerConsumer("testState", "consumer1");
      ownership.registerConsumer("testState", "consumer1");
      
      const state = ownership.states.get("testState");
      expect(state.consumers.filter(c => c === "consumer1").length).toBe(1);
    });
  });
  
  describe("registerComputation", () => {
    it("registers computation with inputs and outputs", () => {
      ownership.registerComputation("testComp", {
        inputs: ["input1", "input2"],
        outputs: ["output1"],
        owner: "testOwner"
      });
      
      const comp = ownership.computations.get("testComp");
      expect(comp).toBeDefined();
      expect(comp.inputs).toEqual(["input1", "input2"]);
      expect(comp.outputs).toEqual(["output1"]);
      expect(comp.owner).toBe("testOwner");
    });
    
    it("updates dependencies", () => {
      ownership.registerState("output1", "owner");
      ownership.registerComputation("testComp", {
        inputs: ["input1", "input2"],
        outputs: ["output1"],
        owner: "testOwner"
      });
      
      const deps = ownership.getDependencies("output1");
      expect(deps.has("input1")).toBe(true);
      expect(deps.has("input2")).toBe(true);
    });
    
    it("registers computation as producer of outputs", () => {
      ownership.registerState("output1", "owner");
      ownership.registerComputation("testComp", {
        inputs: ["input1"],
        outputs: ["output1"],
        owner: "testOwner"
      });
      
      const state = ownership.states.get("output1");
      expect(state.producers).toContain("testComp");
    });
  });
  
  describe("getStates", () => {
    it("returns array of all states", () => {
      const states = ownership.getStates();
      
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });
  });
  
  describe("getComputations", () => {
    it("returns array of all computations", () => {
      const computations = ownership.getComputations();
      
      expect(Array.isArray(computations)).toBe(true);
      expect(computations.length).toBeGreaterThan(0);
    });
  });
  
  describe("getDependencies", () => {
    it("returns Set of dependencies", () => {
      const deps = ownership.getDependencies("highlightState");
      
      expect(deps).toBeInstanceOf(Set);
      expect(deps.has("highlightContext")).toBe(true);
      expect(deps.has("graphData")).toBe(true);
    });
    
    it("returns empty Set for unknown state", () => {
      const deps = ownership.getDependencies("unknown");
      
      expect(deps).toBeInstanceOf(Set);
      expect(deps.size).toBe(0);
    });
  });
  
  describe("getDataFlowGraph", () => {
    it("returns nodes and edges", () => {
      const dataFlow = ownership.getDataFlowGraph();
      
      expect(dataFlow.nodes).toBeDefined();
      expect(dataFlow.edges).toBeDefined();
      expect(Array.isArray(dataFlow.nodes)).toBe(true);
      expect(Array.isArray(dataFlow.edges)).toBe(true);
    });
    
    it("includes state nodes", () => {
      const dataFlow = ownership.getDataFlowGraph();
      
      expect(dataFlow.nodes.some(n => n.type === "state")).toBe(true);
    });
    
    it("includes computation nodes", () => {
      const dataFlow = ownership.getDataFlowGraph();
      
      expect(dataFlow.nodes.some(n => n.type === "computation")).toBe(true);
    });
    
    it("includes input and output edges", () => {
      const dataFlow = ownership.getDataFlowGraph();
      
      expect(dataFlow.edges.some(e => e.type === "input")).toBe(true);
      expect(dataFlow.edges.some(e => e.type === "output")).toBe(true);
    });
  });
  
  describe("toJSON", () => {
    it("exports states, computations, and dataFlow", () => {
      const json = ownership.toJSON();
      
      expect(json.states).toBeDefined();
      expect(json.computations).toBeDefined();
      expect(json.dataFlow).toBeDefined();
    });
  });
  
  describe("toMarkdown", () => {
    it("returns markdown string", () => {
      const md = ownership.toMarkdown();
      
      expect(typeof md).toBe("string");
      expect(md).toContain("# Ownership Graph");
      expect(md).toContain("## States");
      expect(md).toContain("## Computations");
    });
  });
  
  describe("toASCII", () => {
    it("returns ASCII diagram", () => {
      const ascii = ownership.toASCII();
      
      expect(typeof ascii).toBe("string");
      expect(ascii).toContain("OWNERSHIP GRAPH");
    });
  });
});
