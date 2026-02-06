/*
  Архив: Вариант покраски системной модели — "Вариант 1"

  Этот файл содержит все изменения, которые мы пробовали для более
  надёжного покраса GLB-шара (Шар.glb). Сохранено как недоделанный
  вариант, чтобы можно было вернуться к нему позже.

  Содержимое:
  - paintSystemModel(colorHex, options)
  - createOrUpdateSystemMesh variant с клонированием сцены и применением
    MeshBasicMaterial для одного узла (гарантированный видимость)
  - вспомогательные переменные и логирование жизненного цикла

  Маркировка: "Вариант такой-то" (variant: paint-system-variant)
*/

// NOTE: This file is an archive snapshot. It is not imported by the app.
import * as THREE from 'three';

// --- archived variables (for reference) ---
let paintedSystemNodeId = null;

/*
function paintSystemModel(colorHex, options = { basic: false, preserveMaps: true }) {
  if (!systemModelScene) return;
  const color = new THREE.Color(colorHex);
  systemModelScene.traverse((child) => {
    if (!child.isMesh) return;
    if (!child.userData._origMaterial) child.userData._origMaterial = child.material;
    if (options.basic) {
      child.material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    } else {
      let newMat = null;
      try {
        newMat = child.userData._origMaterial && child.userData._origMaterial.clone
          ? child.userData._origMaterial.clone()
          : null;
      } catch (e) {
        newMat = null;
      }
      if (!newMat) newMat = new THREE.MeshStandardMaterial();
      if (!options.preserveMaps || !newMat.map) {
        newMat.map = null;
        newMat.color = color.clone();
        newMat.metalness = 0.1;
        newMat.roughness = 0.4;
      } else {
        newMat.color = color.clone();
      }
      newMat.needsUpdate = true;
      newMat.toneMapped = true;
      child.material = newMat;
    }
    child.frustumCulled = false;
    child.castShadow = false;
    child.receiveShadow = false;
  });
  if (nodeThreeObjectFactory) graph.nodeThreeObject(nodeThreeObjectFactory);
}
*/

/* Archived createOrUpdateSystemMesh (variant)
function createOrUpdateSystemMesh(node, isRefresh = false) {
  let mesh = nodeMeshes.get(node.id);
  if (!mesh) {
    mesh = new THREE.Mesh(systemNodeBaseGeometry, getSystemMaterial());
    mesh.userData = { hasSystemModel: false };
    mesh.material.transparent = true;
    mesh.material.opacity = 0.0;
    mesh.material.depthWrite = false;
    mesh.material.colorWrite = false;
    mesh.frustumCulled = false;
    nodeMeshes.set(node.id, mesh);
    console.log(`[SystemMesh] created placeholder mesh for node ${node.id}`);
  }
  if (systemModelScene && !mesh.userData.hasSystemModel) {
    try {
      const systemChild = systemModelScene.clone(true);
      systemChild.name = "systemModelChild";
      let appliedPaint = false;
      systemChild.traverse((child) => {
        if (!child.isMesh) return;
        child.frustumCulled = false;
        try { if (child.material) child.material = child.material.clone(); } catch (e) {}
        if (!paintedSystemNodeId && !appliedPaint) {
          try {
            child.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(SYSTEM_COLOR_LIGHT), side: THREE.DoubleSide });
            child.material.needsUpdate = true;
            appliedPaint = true;
          } catch (e) { }
        }
      });
      mesh.add(systemChild);
      mesh.userData.hasSystemModel = true;
      if (appliedPaint) {
        paintedSystemNodeId = node.id;
        console.log(`[SystemMesh] applied MeshBasic paint to node ${node.id}`);
      } else {
        console.log(`[SystemMesh] attached systemChild (no paint) to node ${node.id}`);
      }
    } catch (err) {
      const systemChild = systemModelScene.clone(true);
      systemChild.name = "systemModelChild";
      systemChild.traverse((child) => { if (child.isMesh) child.frustumCulled = false; });
      mesh.add(systemChild);
      mesh.userData.hasSystemModel = true;
      console.warn('[SystemMesh] fallback attach failed to paint for node', node.id, err);
    }
  }
  mesh.frustumCulled = false;
  const baseRadius = getNodeRadius(node);
  mesh.scale.setScalar(baseRadius);
  nodeBaseRadius.set(node.id, baseRadius);
  if (!nodePulsePhase.has(node.id)) {
    const phaseSeed = hashId(String(node.id)) % 1000;
    nodePulsePhase.set(node.id, (phaseSeed / 1000) * Math.PI * 2);
  }
  if (!isRefresh) return mesh; return mesh;
}
*/

// End of archive
