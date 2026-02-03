/**
 * Visual config for Core Taxonomy Graph
 *
 * Изолированная конфигурация визуала для режима Core Taxonomy,
 * не смешивается с extended-mind типами.
 */

import { NODE_TYPES, EDGE_KINDS, CORE_TAXONOMY_COLORS } from "./schema.js";

export const CORE_TAXONOMY_VISUAL_CONFIG = {
  node: {
    minRadius: 2.0,
    maxRadius: 5.5
  },
  link: {
    baseLength: 55,
    lengthVariance: 20,
    shortClusterFactor: 0.6
  },
  colors: {
    background: "#0a0a0f",
    link: "#475569",
    linkDefault: "#475569",
    nodeDefault: "#94a3b8",
    highlight: "#f8fafc",
    dim: "#1e293b",
    type: CORE_TAXONOMY_COLORS.type,
    status: {
      draft: "#64748b",
      active: "#22c55e",
      stable: "#38bdf8",
      archived: "#f97316"
    }
  },
  camera: {
    fov: 65,
    curvatureStrength: 18,
    curvatureRadius: 260
  }
};

/**
 * Размеры узлов по типу (importance mapping)
 */
export const NODE_SIZE_BY_TYPE = {
  [NODE_TYPES.ROUTE]: 3.5,
  [NODE_TYPES.TERM]: 2.8,
  [NODE_TYPES.DIGEST]: 4.0,
  [NODE_TYPES.EPISODE]: 2.2
};

/**
 * Получить размер узла по типу
 * @param {Object} node
 * @returns {number}
 */
export function getNodeSizeByType(node) {
  return NODE_SIZE_BY_TYPE[node.type] || CORE_TAXONOMY_VISUAL_CONFIG.node.minRadius;
}
