import { ARCHITECTURE } from "../architecture/dna.ts";

void ARCHITECTURE;

export const VISUAL_CONFIG = {
  // ═══════════════════════════════════════════════════════════════════════════
  // УЗЛЫ ОНТОЛОГИИ (entities)
  // Сущности, существующие в пространстве графа
  // ═══════════════════════════════════════════════════════════════════════════
  nodeTypes: {
    // Системные узлы (Universe, Cryptocosm) — пустые страницы
    root: {
      size: 4,
      pageTemplate: "root",
      tooltip: "{label}"
    },
    // Хабы (Characters, Domains) — навигационные узлы
    hub: {
      size: 4,
      pageTemplate: "hub",
      tooltipById: {
        characters: "Персонажи",
        domains: "Домены"
      }
    },
    // Персонажи — полная страница с виджет-группами
    character: {
      size: 2.5,
      pageTemplate: "character",
      tooltip: "{label}"
    },
    // Домены — отдельный шаблон страницы
    domain: {
      size: 1.5,
      pageTemplate: "domain",
      tooltip: "{label}"
    },
    // Воркбенчи
    workbench: {
      size: 1,
      pageTemplate: "workbench",
      tooltip: "{label}"
    },
    // Коллабы
    collab: {
      size: 1,
      pageTemplate: "collab",
      tooltip: "{label}"
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ИНСТРУМЕНТЫ (tools)
  // Функциональные элементы, не являющиеся узлами онтологии
  // Будущие категории: режимы, модусы, фильтры...
  // ═══════════════════════════════════════════════════════════════════════════
  tools: {
    // Практики — первый тип инструментов
    practice: {
      icon: "practice",
      tooltip: "{label}"
    }
  },
  node: {
    minRadius: 2.2,
    maxRadius: 6.5
    // Размеры узлов теперь в nodeTypes[type].size
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
      collab: "Коллабы",
      hub: "Хабы",
      root: "Система"
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
        "Роль в системе — ...",
        "Технический профиль — ..."
      ],
      collab: [
        "{label} — коллаб",
        "Роль в системе — ...",
        "Технический профиль — ..."
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
  },
  // === ПРАВИЛА ПОДСВЕТКИ ===
  // Единый источник для логики подсветки узлов, рёбер и виджетов
  highlight: {
    // Интенсивность рёбер (0-1)
    link: {
      full: 1.0,      // Полная яркость (hover на узел/виджет)
      half: 0.5,      // Половинная яркость (выделенный узел без hover)
      dim: 0.15       // Приглушённый (неактивные рёбра)
    },
    // Ширина рёбер в пикселях
    linkWidth: {
      full: 1.6,
      half: 1.0,
      dim: 0.6
    },
    // Правила подсветки по контексту:
    // 1. selected — выделенный узел (currentStep)
    // 2. hover — hover на узел/виджет
    // 3. scope — hover на корневой виджет (подсвечивает все связанные)
    rules: {
      // Выделенный узел: горит сам, рёбра к соседям в полсилы
      selected: {
        node: "full",
        neighborLinks: "half"
      },
      // Hover на некорневой виджет: горит сам и рёбра к соседям
      hover: {
        node: "full",
        neighborLinks: "full"
      },
      // Hover на корневой виджет: горят все виджеты группы и их рёбра
      scope: {
        nodes: "full",
        links: "full"
      },
      // Страница без групп виджетов: при hover на корневой — рёбра ярче
      simplePageHover: {
        node: "full",
        neighborLinks: "full"
      }
    }
  }
};
