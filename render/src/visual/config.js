import { ARCHITECTURE } from "../architecture/dna.ts";

void ARCHITECTURE;

export const VISUAL_CONFIG = {
  node: {
    minRadius: 2.2,
    maxRadius: 6.5,
    // Канонические множители размеров по типу узла (от minRadius)
    sizeByType: {
      root: 4,        // Universe, Cryptocosm
      hub: 4,         // Characters, Domains, Practices
      character: 2.5, // Персонажи
      domain: 1.5,    // Континенты
      practice: 1,    // Практики
      workbench: 1,   // Воркбенчи
      collab: 1       // Коллабы
    }
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
  },
  // Шаблоны UI-текстов по типам узлов
  // {label} — подставляется из registry/universe.json
  labels: {
    // Названия секций виджетов
    sections: {
      domain: "Домены",
      character: "Проводники",
      practice: "Практики",
      workbench: "Воркбенчи",
      collab: "Коллабы"
    },
    // Шаблоны описания узла (3 строки справа от виджета)
    nodeInfo: {
      character: [
        "{label} — персонаж",
        "Роль в системе — ...",
        "Технический профиль — ..."
      ],
      domain: [
        "{label} — домен",
        "Область знаний — ...",
        "Связанные практики — ..."
      ],
      workbench: [
        "{label} — воркбенч",
        "Назначение — ...",
        "Инструменты — ..."
      ],
      collab: [
        "{label} — коллаб",
        "Участники — ...",
        "Фокус — ..."
      ],
      hub: [
        "{label}",
        "Навигационный узел",
        ""
      ],
      root: [
        "{label}",
        "Корневой узел",
        ""
      ]
    }
  }
};
