import * as THREE from "three";
import { Text } from "troika-three-text";

const PANEL_WIDTH = 180;
const PANEL_HEIGHT = 220;
const BUTTON_HEIGHT = 24;
const BUTTON_GAP = 10;

function createText({ text, fontSize, color, anchorX = "left", anchorY = "middle" }) {
  const label = new Text();
  label.text = text;
  label.fontSize = fontSize;
  label.color = color;
  label.anchorX = anchorX;
  label.anchorY = anchorY;
  label.sync();
  return label;
}

export class Panel3D {
  constructor(options) {
    this.group = new THREE.Group();
    this.buttons = [];
    this.activeName = null;
    this.hintText = null;
    this.onSelect = options.onSelect;

    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x0c111a,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });

    const panelGeo = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT, 1, 1);
    const panelMesh = new THREE.Mesh(panelGeo, panelMaterial);
    panelMesh.position.set(0, 0, 0);
    this.group.add(panelMesh);

    const header = createText({
      text: "Dream-Graph",
      fontSize: 9,
      color: 0xe2e8f0
    });
    header.position.set(-PANEL_WIDTH / 2 + 12, PANEL_HEIGHT / 2 - 18, 1);
    this.group.add(header);

    const subtitle = createText({
      text: "Configurations",
      fontSize: 6.5,
      color: 0x94a3b8
    });
    subtitle.position.set(-PANEL_WIDTH / 2 + 12, PANEL_HEIGHT / 2 - 34, 1);
    this.group.add(subtitle);

    this.statusText = createText({
      text: "Active: Planetary",
      fontSize: 6,
      color: 0x7dd3fc
    });
    this.statusText.position.set(-PANEL_WIDTH / 2 + 12, -PANEL_HEIGHT / 2 + 30, 1);
    this.group.add(this.statusText);

    this.hubText = createText({
      text: "Hub: -",
      fontSize: 5.5,
      color: 0x94a3b8
    });
    this.hubText.position.set(-PANEL_WIDTH / 2 + 12, -PANEL_HEIGHT / 2 + 18, 1);
    this.group.add(this.hubText);

    this.hintText = createText({
      text: "",
      fontSize: 5.5,
      color: 0x94a3b8
    });
    this.hintText.position.set(-PANEL_WIDTH / 2 + 12, -PANEL_HEIGHT / 2 + 6, 1);
    this.group.add(this.hintText);

    const buttonStartY = PANEL_HEIGHT / 2 - 68;

    options.configs.forEach((config, index) => {
      const y = buttonStartY - index * (BUTTON_HEIGHT + BUTTON_GAP);
      const buttonGeo = new THREE.PlaneGeometry(PANEL_WIDTH - 24, BUTTON_HEIGHT, 1, 1);
      const buttonMaterial = new THREE.MeshBasicMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.75
      });
      const buttonMesh = new THREE.Mesh(buttonGeo, buttonMaterial);
      buttonMesh.position.set(0, y, 2);
      buttonMesh.userData = { name: config.name };

      const buttonLabel = createText({
        text: config.label,
        fontSize: 7.5,
        color: 0xe2e8f0
      });
      buttonLabel.position.set(-PANEL_WIDTH / 2 + 20, y, 3);

      this.group.add(buttonMesh);
      this.group.add(buttonLabel);
      this.buttons.push({ name: config.name, mesh: buttonMesh, label: buttonLabel });
    });
  }

  setActive(name) {
    this.activeName = name;
    this.buttons.forEach((button) => {
      const isActive = button.name === name;
      button.mesh.material.color.setHex(isActive ? 0x1d4ed8 : 0x111827);
      button.mesh.material.opacity = isActive ? 0.9 : 0.65;
      button.label.color = isActive ? 0xf8fafc : 0xe2e8f0;
      button.label.sync();
    });
  }

  setHover(name) {
    this.buttons.forEach((button) => {
      if (button.name === this.activeName) return;
      if (button.name === name) {
        button.mesh.material.color.setHex(0x2563eb);
        button.mesh.material.opacity = 0.8;
        button.label.color = 0xf8fafc;
        button.label.sync();
      } else {
        button.mesh.material.color.setHex(0x111827);
        button.mesh.material.opacity = 0.65;
        button.label.color = 0xe2e8f0;
        button.label.sync();
      }
    });
  }

  setStatus(text) {
    this.statusText.text = text;
    this.statusText.sync();
  }

  setHub(text) {
    this.hubText.text = text;
    this.hubText.sync();
  }

  setHint(text) {
    this.hintText.text = text;
    this.hintText.sync();
  }

  updateHud(camera) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    const anchor = camera.position
      .clone()
      .add(direction.multiplyScalar(220))
      .add(right.multiplyScalar(-140))
      .add(up.multiplyScalar(40));

    this.group.position.copy(anchor);
    this.group.quaternion.copy(camera.quaternion);
    this.group.rotateY(0.08);
  }

  getHitTargets() {
    return this.buttons.map((button) => button.mesh);
  }

  handleClick(target) {
    if (!target?.userData?.name) return;
    if (this.onSelect) this.onSelect(target.userData.name);
  }
}
