import { ARCHITECTURE } from "../architecture/dna.ts";

void ARCHITECTURE;

export const VISUAL_CONFIG = {
  node: {
    minRadius: 2.2,
    maxRadius: 6.5
  },
  link: {
    baseLength: 65,
    lengthVariance: 25,
    shortClusterFactor: 0.55
  },
  colors: {
    background: "#07070a",
    link: "#6b7280",
    nodeDefault: "#7dd3fc",
    highlight: "#f8fafc",
    dim: "#1b1f25",
    category: {
      characters: "#f97316",
      domains: "#38bdf8",
      practices: "#a78bfa",
      system: "#22c55e"
    },
    type: {
      project: "#7ee787",
      layer: "#58a6ff",
      artifact: "#f2cc60",
      actor: "#f97316",
      system: "#22c55e"
    },
    status: {
      draft: "#94a3b8",
      active: "#22c55e",
      stable: "#38bdf8",
      archived: "#f97316"
    }
  },
  camera: {
    fov: 70,
    curvatureStrength: 22,
    curvatureRadius: 280
  }
};
