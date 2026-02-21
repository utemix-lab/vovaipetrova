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

const ORBIT_CONFIG = {
  slate: {
    radius: 12,
    speed: 0.3,
    satelliteSize: 1.5,
    color: 0x22d3ee,
    startAngle: 0
  },
  storage: {
    radius: 18,
    speed: 0.25,
    satelliteSize: 1.5,
    color: 0x22d3ee,
    startAngle: (Math.PI * 2) / 3
  },
  sanctum: {
    radius: 24,
    speed: 0.2,
    satelliteSize: 1.5,
    color: 0x22d3ee,
    startAngle: (Math.PI * 4) / 3
  }
};

export class NodeOrbits {
  constructor(parentMesh, nodeRadius = 1) {
    this.parentMesh = parentMesh;
    this.nodeRadius = nodeRadius;
    this.group = new THREE.Group();
    this.orbits = new Map();
    this.satellites = new Map();
    this.angles = new Map();
    this.highlightedOrbit = null;
    
    this._createOrbits();
    
    // Компенсировать scale родительского mesh
    // Орбиты должны быть в мировых координатах, не в локальных
    const parentScale = parentMesh.scale.x || 1;
    this.group.scale.setScalar(1 / parentScale);
    
    parentMesh.add(this.group);
    console.log("[NodeOrbits] Created, parentScale:", parentScale);
  }
  
  _createOrbits() {
    for (const [name, config] of Object.entries(ORBIT_CONFIG)) {
      // Орбита (кольцо)
      const orbitGeometry = new THREE.RingGeometry(
        config.radius - 0.02,
        config.radius + 0.02,
        64
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2; // Горизонтальная плоскость
      this.group.add(orbit);
      this.orbits.set(name, orbit);
      
      // Спутник (маленькая сфера)
      const satelliteGeometry = new THREE.SphereGeometry(config.satelliteSize, 16, 16);
      const satelliteMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.4
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
    
    // Подсветить выбранный спутник
    const satellite = this.satellites.get(orbitName);
    satellite.material.opacity = 1.0;
    satellite.scale.setScalar(1.5);
    
    // Подсветить орбиту
    const orbit = this.orbits.get(orbitName);
    orbit.material.opacity = 0.4;
  }
  
  clearHighlight() {
    if (!this.highlightedOrbit) return;
    
    // Вернуть спутник в обычное состояние
    const satellite = this.satellites.get(this.highlightedOrbit);
    if (satellite) {
      satellite.material.opacity = 0.4;
      satellite.scale.setScalar(1.0);
    }
    
    // Вернуть орбиту в обычное состояние
    const orbit = this.orbits.get(this.highlightedOrbit);
    if (orbit) {
      orbit.material.opacity = 0.15;
    }
    
    this.highlightedOrbit = null;
  }
  
  dispose() {
    // Удалить из родителя
    if (this.parentMesh) {
      this.parentMesh.remove(this.group);
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
