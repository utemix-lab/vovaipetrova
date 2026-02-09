/**
 * @ArchProto(
 *   futureLayer: "BRIDGE_LAYER",
 *   patterns: ["GraphEngine abstraction", "Renderer-agnostic API"]
 * )
 *
 * СЕЙЧАС: Three.js рендерер для визуализации
 * БУДУЩЕЕ: Абстрактный GraphEngine для AST/OWL графов
 */

import ForceGraph3D from "3d-force-graph";
import { ArchProto } from "../architecture/dna.ts";

export class ThreeGraphEngine {
  constructor({ container, three, baseNodeRadius, autoRotateSpeed, visualConfig, getLinkDistance }) {
    this.container = container;
    this.three = three;
    this.baseNodeRadius = baseNodeRadius;
    this.autoRotateSpeed = autoRotateSpeed;
    this.visualConfig = visualConfig;
    this.getLinkDistance = getLinkDistance;
    this.graph = null;
  }

  initialize() {
    const graph = ForceGraph3D()(this.container)
      .backgroundColor(this.visualConfig.colors.background)
      .showNavInfo(false)
      .nodeRelSize(this.baseNodeRadius)
      .linkOpacity(0.35)
      .linkWidth(0.6)
      .linkDirectionalParticles(0);

    graph.d3Force("link").distance((link) => this.getLinkDistance(link));
    graph.d3VelocityDecay(0.08);
    graph.d3AlphaDecay(0.008);

    graph.scene().add(new this.three.AmbientLight(0xffffff, 0.7));
    const keyLight = new this.three.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(40, 60, 120);
    graph.scene().add(keyLight);

    const camera = graph.camera();
    camera.fov = this.visualConfig.camera.fov;
    camera.updateProjectionMatrix();

    const controls = graph.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.autoRotate = true;
    controls.autoRotateSpeed = this.autoRotateSpeed;
    controls.minDistance = 80;
    controls.maxDistance = 600;

    this.graph = graph;
    return graph;
  }

  setData(nodes, links) {
    if (!this.graph) return;
    this.graph.graphData({ nodes, links });
  }

  onNodeClick(callback) {
    if (!this.graph) return;
    this.graph.onNodeClick(callback);
  }

  focusNode(node, duration = 1000) {
    if (!this.graph || !node) return;
    const camera = this.graph.camera();
    this.graph.cameraPosition(
      { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      { x: node.x, y: node.y, z: node.z },
      duration
    );
  }

  getGraph() {
    return this.graph;
  }
}

ArchProto("BRIDGE_LAYER", [
  "Abstract renderer interface",
  "Renderer-agnostic scene graph",
  "Event system for agent interactions"
])(ThreeGraphEngine);
