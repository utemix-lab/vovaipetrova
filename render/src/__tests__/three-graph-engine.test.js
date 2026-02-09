/**
 * @ArchProto(
 *   futureLayer: "BRIDGE_LAYER",
 *   patterns: ["GraphEngine unit tests", "Renderer-agnostic validation"]
 * )
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock ForceGraph3D
vi.mock("3d-force-graph", () => ({
  default: () => () => ({
    backgroundColor: vi.fn().mockReturnThis(),
    showNavInfo: vi.fn().mockReturnThis(),
    nodeRelSize: vi.fn().mockReturnThis(),
    linkOpacity: vi.fn().mockReturnThis(),
    linkWidth: vi.fn().mockReturnThis(),
    linkDirectionalParticles: vi.fn().mockReturnThis(),
    d3Force: vi.fn().mockReturnValue({ distance: vi.fn() }),
    d3VelocityDecay: vi.fn().mockReturnThis(),
    d3AlphaDecay: vi.fn().mockReturnThis(),
    scene: vi.fn().mockReturnValue({ add: vi.fn() }),
    camera: vi.fn().mockReturnValue({
      fov: 60,
      updateProjectionMatrix: vi.fn(),
      position: { x: 0, y: 0, z: 100 }
    }),
    controls: vi.fn().mockReturnValue({
      enableDamping: false,
      dampingFactor: 0,
      rotateSpeed: 0,
      zoomSpeed: 0,
      autoRotate: false,
      autoRotateSpeed: 0,
      minDistance: 0,
      maxDistance: 0
    }),
    graphData: vi.fn(),
    onNodeClick: vi.fn(),
    cameraPosition: vi.fn(),
    refresh: vi.fn()
  })
}));

// Mock THREE
const mockThree = {
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn() }
  }))
};

describe("ThreeGraphEngine", () => {
  let ThreeGraphEngine;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import("../graph/three-graph-engine.js");
    ThreeGraphEngine = module.ThreeGraphEngine;
  });

  test("should instantiate with required config", () => {
    const engine = new ThreeGraphEngine({
      container: document.createElement("div"),
      three: mockThree,
      baseNodeRadius: 4,
      autoRotateSpeed: 0.3,
      visualConfig: { colors: { background: "#000" }, camera: { fov: 60 } },
      getLinkDistance: () => 30
    });

    expect(engine).toBeDefined();
    expect(engine.graph).toBeNull();
  });

  test("should initialize graph on initialize()", () => {
    const container = document.createElement("div");
    const engine = new ThreeGraphEngine({
      container,
      three: mockThree,
      baseNodeRadius: 4,
      autoRotateSpeed: 0.3,
      visualConfig: { colors: { background: "#000" }, camera: { fov: 60 } },
      getLinkDistance: () => 30
    });

    const graph = engine.initialize();

    expect(graph).toBeDefined();
    expect(engine.getGraph()).toBe(graph);
  });

  test("should set data on initialized graph", () => {
    const container = document.createElement("div");
    const engine = new ThreeGraphEngine({
      container,
      three: mockThree,
      baseNodeRadius: 4,
      autoRotateSpeed: 0.3,
      visualConfig: { colors: { background: "#000" }, camera: { fov: 60 } },
      getLinkDistance: () => 30
    });

    engine.initialize();
    const nodes = [{ id: "a" }, { id: "b" }];
    const links = [{ source: "a", target: "b" }];

    engine.setData(nodes, links);

    expect(engine.getGraph().graphData).toHaveBeenCalledWith({ nodes, links });
  });

  test("should register node click callback", () => {
    const container = document.createElement("div");
    const engine = new ThreeGraphEngine({
      container,
      three: mockThree,
      baseNodeRadius: 4,
      autoRotateSpeed: 0.3,
      visualConfig: { colors: { background: "#000" }, camera: { fov: 60 } },
      getLinkDistance: () => 30
    });

    engine.initialize();
    const callback = vi.fn();

    engine.onNodeClick(callback);

    expect(engine.getGraph().onNodeClick).toHaveBeenCalledWith(callback);
  });

  test("should not throw when setData called before initialize", () => {
    const engine = new ThreeGraphEngine({
      container: document.createElement("div"),
      three: mockThree,
      baseNodeRadius: 4,
      autoRotateSpeed: 0.3,
      visualConfig: { colors: { background: "#000" }, camera: { fov: 60 } },
      getLinkDistance: () => 30
    });

    expect(() => engine.setData([], [])).not.toThrow();
  });
});
