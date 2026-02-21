/**
 * NodeOrbits — три орбиты со спутниками вокруг узла
 * 
 * Используется для визуализации трёх аспектов раскрытия узла:
 * - Slate (внутренняя орбита)
 * - Storage (средняя орбита)
 * - Sanctum (внешняя орбита)
 * 
 * @status: experimental
 * @track: 4
 * @since: 2026-02-21
 */

import * as THREE from "three";

const ORBIT_COLOR = 0x22d3ee;
const SATELLITE_COLOR = 0x22d3ee;
const HIGHLIGHT_COLOR = 0xfbbf24; // Жёлтый при активации

const ORBIT_CONFIG = {
  slate: {
    radius: 12,
    speed: 0.3,
    satelliteSize: 1.2,
    startAngle: 0
  },
  storage: {
    radius: 18,
    speed: 0.25,
    satelliteSize: 1.2,
    startAngle: (Math.PI * 2) / 3
  },
  sanctum: {
    radius: 24,
    speed: 0.2,
    satelliteSize: 1.2,
    startAngle: (Math.PI * 4) / 3
  }
};

export class NodeOrbits {
  constructor(scene, nodeId) {
    this.scene = scene;
    this.nodeId = nodeId;
    this.group = new THREE.Group();
    this.orbits = new Map();
    this.satellites = new Map();
    this.angles = new Map();
    this.highlightedOrbit = null;
    
    this._createOrbits();
    
    scene.add(this.group);
    console.log("[NodeOrbits] Created and added to scene for node:", nodeId);
  }
  
  // Обновить позицию орбит по позиции узла
  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }
  
  _createOrbits() {
    for (const [name, config] of Object.entries(ORBIT_CONFIG)) {
      // Орбита (тонкое кольцо как рёбра графа)
      const orbitGeometry = new THREE.TorusGeometry(
        config.radius,  // radius
        0.08,           // tube radius (тонкое как ребро)
        8,              // radialSegments
        64              // tubularSegments
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: ORBIT_COLOR,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2; // Горизонтальная плоскость
      this.group.add(orbit);
      this.orbits.set(name, orbit);
      
      // Спутник (гладкая сфера, непрозрачная)
      const satelliteGeometry = new THREE.SphereGeometry(config.satelliteSize, 32, 32);
      const satelliteMaterial = new THREE.MeshBasicMaterial({
        color: SATELLITE_COLOR,
        transparent: false
      });
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      this.group.add(satellite);
      this.satellites.set(name, satellite);
      
      // Начальный угол
      this.angles.set(name, config.startAngle);
      
      // Установить начальную позицию спутника
      this._updateSatellitePosition(name);
    }
  }
  
  _updateSatellitePosition(name) {
    const config = ORBIT_CONFIG[name];
    const satellite = this.satellites.get(name);
    const angle = this.angles.get(name);
    
    satellite.position.x = Math.cos(angle) * config.radius;
    satellite.position.z = Math.sin(angle) * config.radius;
    satellite.position.y = 0;
  }
  
  update(deltaTime) {
    for (const [name, config] of Object.entries(ORBIT_CONFIG)) {
      // Вращение спутника по орбите
      let angle = this.angles.get(name);
      angle += config.speed * deltaTime;
      this.angles.set(name, angle);
      this._updateSatellitePosition(name);
    }
  }
  
  highlight(orbitName) {
    // Сбросить предыдущую подсветку
    this.clearHighlight();
    
    if (!orbitName || !this.satellites.has(orbitName)) return;
    
    this.highlightedOrbit = orbitName;
    
    // Подсветить выбранный спутник жёлтым
    const satellite = this.satellites.get(orbitName);
    satellite.material.color.setHex(HIGHLIGHT_COLOR);
    satellite.scale.setScalar(1.4);
    
    // Подсветить орбиту
    const orbit = this.orbits.get(orbitName);
    orbit.material.opacity = 0.5;
  }
  
  clearHighlight() {
    if (!this.highlightedOrbit) return;
    
    // Вернуть спутник в обычное состояние (голубой цвет)
    const satellite = this.satellites.get(this.highlightedOrbit);
    if (satellite) {
      satellite.material.color.setHex(SATELLITE_COLOR);
      satellite.scale.setScalar(1.0);
    }
    
    // Вернуть орбиту в обычное состояние
    const orbit = this.orbits.get(this.highlightedOrbit);
    if (orbit) {
      orbit.material.opacity = 0.3;
    }
    
    this.highlightedOrbit = null;
  }
  
  dispose() {
    // Удалить из сцены
    if (this.scene) {
      this.scene.remove(this.group);
    }
    
    // Очистить геометрии и материалы
    for (const orbit of this.orbits.values()) {
      orbit.geometry.dispose();
      orbit.material.dispose();
    }
    for (const satellite of this.satellites.values()) {
      satellite.geometry.dispose();
      satellite.material.dispose();
    }
    
    this.orbits.clear();
    this.satellites.clear();
    this.angles.clear();
  }
}
